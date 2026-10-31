import {
	NO_PARENTAL_FILTER, normalizeBlockedRatings, parentalFilterFromRatings, ratingIsRanked,
	sortRatingsBySeverity, withoutBlocked
} from './parentalFilter';

describe('the ceiling', () => {
	// Ticking a rating blocks it and everything at or above it.
	test('blocks the rating and everything stronger', () => {
		const filter = parentalFilterFromRatings(['R']);
		expect(filter.isBlockedRating('R')).toBe(true);
		expect(filter.isBlockedRating('NC-17')).toBe(true);
		expect(filter.isBlockedRating('TV-MA')).toBe(true);
		expect(filter.isBlockedRating('18')).toBe(true);
	});

	test('leaves anything milder alone', () => {
		const filter = parentalFilterFromRatings(['R']);
		expect(filter.isBlockedRating('PG-13')).toBe(false);
		expect(filter.isBlockedRating('TV-14')).toBe(false);
		expect(filter.isBlockedRating('G')).toBe(false);
	});

	test('collapses several ticks to the mildest of them', () => {
		const filter = parentalFilterFromRatings(['NC-17', 'PG-13', 'R']);
		expect(filter.isBlockedRating('TV-14')).toBe(true);
		expect(filter.isBlockedRating('PG')).toBe(false);
	});

	test('matches whatever case and spacing a rating arrives in', () => {
		const filter = parentalFilterFromRatings([' r ']);
		expect(filter.isBlockedRating('r')).toBe(true);
		expect(filter.isBlockedRating(' NC-17 ')).toBe(true);
	});
});

describe('ratings the ladder can\'t place', () => {
	// Putting one on the ladder would set a ceiling above every real rating and empty the library.
	test('only ever block themselves', () => {
		const filter = parentalFilterFromRatings(['ZZ-WEIRD']);
		expect(filter.isBlockedRating('ZZ-WEIRD')).toBe(true);
		expect(filter.isBlockedRating('NC-17')).toBe(false);
		expect(filter.isBlockedRating('G')).toBe(false);
	});

	test('are never blocked by a ceiling', () => {
		const filter = parentalFilterFromRatings(['G']);
		expect(filter.isBlockedRating('ZZ-WEIRD')).toBe(false);
		expect(filter.isBlockedRating('NR')).toBe(false);
	});

	test('sit in their own section', () => {
		expect(ratingIsRanked('PG-13')).toBe(true);
		expect(ratingIsRanked('ZZ-WEIRD')).toBe(false);
		expect(ratingIsRanked('NR')).toBe(false);
	});
});

describe('an item nobody rated', () => {
	// A server with no rating on an item can't be told apart from one that rates nothing.
	test('is never hidden', () => {
		const filter = parentalFilterFromRatings(['G']);
		expect(filter.isBlockedRating('')).toBe(false);
		expect(filter.isBlockedRating(null)).toBe(false);
		expect(filter.isBlockedRaw({})).toBe(false);
	});
});

describe('an empty list', () => {
	test('blocks nothing', () => {
		expect(parentalFilterFromRatings([])).toBe(NO_PARENTAL_FILTER);
		expect(parentalFilterFromRatings([' ', ''])).toBe(NO_PARENTAL_FILTER);
		expect(NO_PARENTAL_FILTER.isActive).toBe(false);
		expect(NO_PARENTAL_FILTER.isBlockedRating('NC-17')).toBe(false);
	});
});

describe('filtering a list', () => {
	const filter = parentalFilterFromRatings(['R']);

	test('drops the blocked items', () => {
		const items = [{Id: '1', OfficialRating: 'R'}, {Id: '2', OfficialRating: 'PG'}, {Id: '3'}];
		expect(withoutBlocked(items, filter).map((i) => i.Id)).toEqual(['2', '3']);
	});

	// Episodes usually carry no rating of their own while the series does.
	test('judges an unrated item by the fallback', () => {
		const episodes = [{Id: '1'}, {Id: '2'}];
		expect(withoutBlocked(episodes, filter, 'TV-MA')).toEqual([]);
		expect(withoutBlocked(episodes, filter, 'TV-PG')).toBe(episodes);
	});

	test('lets an item\'s own rating win over the fallback', () => {
		const episodes = [{Id: '1', OfficialRating: 'TV-PG'}, {Id: '2'}];
		expect(withoutBlocked(episodes, filter, 'TV-MA').map((i) => i.Id)).toEqual(['1']);
	});

	test('hands back the same list when nothing was dropped', () => {
		const items = [{Id: '1', OfficialRating: 'PG'}];
		expect(withoutBlocked(items, filter)).toBe(items);
		expect(withoutBlocked(items, NO_PARENTAL_FILTER)).toBe(items);
	});
});

describe('the settings list', () => {
	test('reads mildest first, alphabetical within a tier', () => {
		expect(sortRatingsBySeverity(['R', 'TV-G', 'G', 'PG-13', 'ZZ', 'NR'])).toEqual(['G', 'TV-G', 'PG-13', 'R', 'ZZ', 'NR']);
	});

	test('stores upper cased with blanks and repeats dropped', () => {
		expect(normalizeBlockedRatings(['r', ' R ', '', 'pg-13', null])).toEqual(['R', 'PG-13']);
		expect(normalizeBlockedRatings(undefined)).toEqual([]);
	});
});
