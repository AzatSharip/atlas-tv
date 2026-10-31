const mockStore = {};

jest.mock('./storage', () => ({
	getFromStorage: (key) => Promise.resolve(mockStore[key] ?? null),
	saveToStorage: (key, value) => {
		mockStore[key] = JSON.parse(JSON.stringify(value));
		return Promise.resolve();
	}
}));

import {
	adoptLegacyBlockedRatings, getActiveParentalFilter, getBlockedRatings, getBlockedSeriesIds,
	loadParentalControls, parentalScopeKey, rememberSeriesBlocked, resetParentalControlsForTest,
	setBlockedRatings, setParentalScope, subscribeParentalControls, withoutBlockedItems
} from './parentalControls';

// Saves are handed off rather than awaited, so a test reading one back lets them land first.
const flushSaves = () => new Promise((resolve) => setTimeout(resolve, 0));

const ONE = parentalScopeKey('http://one.lan:8096/', 'user1');
const TWO = parentalScopeKey('http://two.lan:8096', 'user1');

beforeEach(() => {
	Object.keys(mockStore).forEach((key) => delete mockStore[key]);
	resetParentalControlsForTest();
});

describe('the scope', () => {
	test('is the server address and the user', () => {
		expect(ONE).toBe('one.lan:8096_user1');
		expect(parentalScopeKey('HTTPS://One.Lan:8096', 'user1')).toBe(ONE);
	});

	test('needs both halves', () => {
		expect(parentalScopeKey('http://one.lan', null)).toBeNull();
		expect(parentalScopeKey('', 'user1')).toBeNull();
	});
});

describe('the list', () => {
	test('is kept apart for each server and user', () => {
		setParentalScope(ONE);
		setBlockedRatings(['R']);
		setParentalScope(TWO);
		expect(getBlockedRatings()).toEqual([]);
		setBlockedRatings(['PG-13']);
		setParentalScope(ONE);
		expect(getBlockedRatings()).toEqual(['R']);
	});

	test('blocks nothing with nobody signed in', () => {
		setBlockedRatings(['R']);
		expect(getBlockedRatings()).toEqual([]);
		expect(getActiveParentalFilter().isActive).toBe(false);
	});

	test('survives a restart', async () => {
		setParentalScope(ONE);
		setBlockedRatings(['r']);
		await flushSaves();
		resetParentalControlsForTest();
		await loadParentalControls();
		setParentalScope(ONE);
		expect(getBlockedRatings()).toEqual(['R']);
	});

	test('keeps a change made before the saved copy finished loading', async () => {
		mockStore.parentalControls = {scopes: {[TWO]: {blockedRatings: ['G']}}};
		setParentalScope(ONE);
		setBlockedRatings(['R']);
		await loadParentalControls();
		expect(getBlockedRatings()).toEqual(['R']);
		setParentalScope(TWO);
		expect(getBlockedRatings()).toEqual(['G']);
	});

	test('keeps the other list it was saved with when one is written early', async () => {
		mockStore.parentalControls = {scopes: {[ONE]: {blockedRatings: ['G'], blockedSeriesIds: ['s1']}}};
		setParentalScope(ONE);
		setBlockedRatings(['R']);
		await loadParentalControls();
		await flushSaves();
		expect(getBlockedRatings()).toEqual(['R']);
		expect(getBlockedSeriesIds()).toEqual(['s1']);
		expect(mockStore.parentalControls.scopes[ONE]).toEqual({blockedRatings: ['R'], blockedSeriesIds: ['s1']});
	});

	test('tells whoever is listening when it changes', () => {
		const listener = jest.fn();
		subscribeParentalControls(listener);
		setParentalScope(ONE);
		setBlockedRatings(['R']);
		expect(listener).toHaveBeenCalledTimes(2);
	});

	test('keeps the same filter until it changes', () => {
		setParentalScope(ONE);
		setBlockedRatings(['R']);
		const first = getActiveParentalFilter();
		expect(getActiveParentalFilter()).toBe(first);
		setBlockedRatings(['PG']);
		expect(getActiveParentalFilter()).not.toBe(first);
	});

	test('filters lists for whoever is signed in', () => {
		setParentalScope(ONE);
		setBlockedRatings(['R']);
		expect(withoutBlockedItems([{Id: '1', OfficialRating: 'NC-17'}, {Id: '2'}]).map((i) => i.Id)).toEqual(['2']);
	});
});

describe('a list saved for the whole television', () => {
	test('goes to the account signed in when it is found', () => {
		setParentalScope(ONE);
		expect(adoptLegacyBlockedRatings(['R'])).toBe(true);
		expect(getBlockedRatings()).toEqual(['R']);
		setParentalScope(TWO);
		expect(getBlockedRatings()).toEqual([]);
	});

	test('doesn\'t overwrite a list the account already has', () => {
		setParentalScope(ONE);
		setBlockedRatings(['PG']);
		expect(adoptLegacyBlockedRatings(['R'])).toBe(true);
		expect(getBlockedRatings()).toEqual(['PG']);
	});

	test('waits for someone to be signed in', () => {
		expect(adoptLegacyBlockedRatings(['R'])).toBe(false);
	});
});

describe('series last seen blocked', () => {
	test('are remembered and released per account', () => {
		setParentalScope(ONE);
		rememberSeriesBlocked('s1', true);
		rememberSeriesBlocked('s1', true);
		expect(getBlockedSeriesIds()).toEqual(['s1']);
		setParentalScope(TWO);
		expect(getBlockedSeriesIds()).toEqual([]);
		setParentalScope(ONE);
		rememberSeriesBlocked('s1', false);
		expect(getBlockedSeriesIds()).toEqual([]);
	});
});
