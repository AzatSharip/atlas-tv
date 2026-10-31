import {sameCardUserData, showsWatchedCheck} from './playedState';

const season = (played, extra) => ({UserData: {Played: played}, ...extra});

describe('showsWatchedCheck', () => {
	test('marks a played season that is in the library', () => {
		expect(showsWatchedCheck(season(true, {LocationType: 'FileSystem'}))).toBe(true);
	});

	test('leaves the mark off a season that is only a placeholder', () => {
		expect(showsWatchedCheck(season(true, {LocationType: 'Virtual'}))).toBe(false);
	});

	test('says no to an unplayed season either way', () => {
		expect(showsWatchedCheck(season(false, {LocationType: 'FileSystem'}))).toBe(false);
		expect(showsWatchedCheck(season(false, {LocationType: 'Virtual'}))).toBe(false);
	});

	test('treats an absent LocationType as present', () => {
		expect(showsWatchedCheck(season(true))).toBe(true);
	});

	test('copes with being handed nothing at all', () => {
		expect(showsWatchedCheck()).toBe(false);
		expect(showsWatchedCheck({})).toBe(false);
	});
});

describe('sameCardUserData', () => {
	const card = (UserData) => ({Id: 'a', UserData});

	test('two copies with the same marks draw the same card', () => {
		expect(sameCardUserData(card({Played: true, PlaybackPositionTicks: 5}), card({Played: true, PlaybackPositionTicks: 9}))).toBe(true);
		expect(sameCardUserData({Id: 'a'}, {Id: 'a'})).toBe(true);
	});

	test('any mark a card shows moving makes it a different card', () => {
		expect(sameCardUserData(card({Played: false}), card({Played: true}))).toBe(false);
		expect(sameCardUserData(card({PlayedPercentage: 10}), card({PlayedPercentage: 40}))).toBe(false);
		expect(sameCardUserData(card({UnplayedItemCount: 3}), card({UnplayedItemCount: 2}))).toBe(false);
		expect(sameCardUserData(card({IsFavorite: false}), card({IsFavorite: true}))).toBe(false);
	});
});
