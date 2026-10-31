jest.mock('./storage', () => ({
	getFromStorage: () => Promise.resolve(null),
	saveToStorage: () => Promise.resolve()
}));

const mockGetItem = jest.fn();

jest.mock('./jellyfinApi', () => ({
	api: {getItem: (...args) => mockGetItem(...args)}
}));

jest.mock('./connectionPool', () => ({
	getApiForItem: () => null
}));

import {isBlocked, isBlockedNow, observeItem, resetBlockedContentGate} from './blockedContentGate';
import {
	getBlockedSeriesIds, resetParentalControlsForTest, setBlockedRatings, setParentalScope
} from './parentalControls';

const episode = (extra = {}) => ({Id: 'e1', Type: 'Episode', SeriesId: 's1', ...extra});

beforeEach(() => {
	resetParentalControlsForTest();
	resetBlockedContentGate();
	mockGetItem.mockReset();
	setParentalScope('one.lan_user1');
	setBlockedRatings(['TV-MA']);
});

describe('an item carrying its own rating', () => {
	test('is judged on it without a lookup', async () => {
		expect(isBlockedNow({Id: 'm1', OfficialRating: 'R'})).toBe(true);
		expect(await isBlocked({Id: 'm1', OfficialRating: 'PG'})).toBe(false);
		expect(mockGetItem).not.toHaveBeenCalled();
	});

	// An episode rated milder than its series is judged on its own.
	test('wins over its series', async () => {
		mockGetItem.mockResolvedValue({Id: 's1', OfficialRating: 'TV-MA'});
		expect(await isBlocked(episode({OfficialRating: 'TV-PG'}))).toBe(false);
		expect(mockGetItem).not.toHaveBeenCalled();
	});
});

describe('an episode with no rating of its own', () => {
	test('is judged by its series', async () => {
		mockGetItem.mockResolvedValue({Id: 's1', OfficialRating: 'TV-MA'});
		expect(await isBlocked(episode())).toBe(true);
		expect(mockGetItem).toHaveBeenCalledWith('s1');
	});

	test('reads as allowed until the series is known', () => {
		expect(isBlockedNow(episode())).toBe(false);
		observeItem({Id: 's1', Type: 'Series', OfficialRating: 'TV-MA'});
		expect(isBlockedNow(episode())).toBe(true);
	});

	test('looks the series up once for a whole season', async () => {
		mockGetItem.mockResolvedValue({Id: 's1', OfficialRating: 'TV-14'});
		await Promise.all([isBlocked(episode()), isBlocked(episode({Id: 'e2'}))]);
		await isBlocked(episode({Id: 'e3'}));
		expect(mockGetItem).toHaveBeenCalledTimes(1);
	});

	test('is allowed when the series has no rating either', async () => {
		mockGetItem.mockResolvedValue({Id: 's1'});
		expect(await isBlocked(episode())).toBe(false);
	});
});

describe('a series once seen blocked', () => {
	// A refusal a dropped connection can undo isn't a refusal.
	test('stays blocked when the lookup fails', async () => {
		mockGetItem.mockResolvedValueOnce({Id: 's1', OfficialRating: 'TV-MA'});
		expect(await isBlocked(episode())).toBe(true);
		expect(getBlockedSeriesIds()).toEqual(['s1']);

		resetBlockedContentGate();
		mockGetItem.mockRejectedValueOnce(new Error('offline'));
		expect(await isBlocked(episode())).toBe(true);
		expect(isBlockedNow(episode())).toBe(true);
	});

	// A lookup that worked always wins, so unblocking a rating releases the series.
	test('is released once a lookup says otherwise', async () => {
		mockGetItem.mockResolvedValueOnce({Id: 's1', OfficialRating: 'TV-MA'});
		await isBlocked(episode());
		setBlockedRatings([]);
		resetBlockedContentGate();
		mockGetItem.mockResolvedValueOnce({Id: 's1', OfficialRating: 'TV-MA'});
		expect(await isBlocked(episode())).toBe(false);
		expect(getBlockedSeriesIds()).toEqual([]);
	});
});

describe('a lookup that fails on a series never seen blocked', () => {
	// Blanking the app is worse than the gap.
	test('fails open', async () => {
		mockGetItem.mockRejectedValue(new Error('offline'));
		expect(await isBlocked(episode())).toBe(false);
	});
});
