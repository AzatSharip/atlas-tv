import {clampRating, clearedRatingPatch, displayRatingLikes, isRatableItemType, normalizeRatingStyle, numericRatingPatch, personalRatingOf, starRatingLabel, starsFromRating, thumbRatingPatch} from './personalRating';

describe('personal rating', () => {
	it('reads a score from user data and ignores anything that is not one', () => {
		expect(personalRatingOf({Rating: 8.5})).toBe(8.5);
		expect(personalRatingOf({Rating: 0})).toBe(0);
		expect(personalRatingOf({})).toBe(null);
		expect(personalRatingOf(null)).toBe(null);
		expect(personalRatingOf({Rating: 'good'})).toBe(null);
	});

	it('reads a cleared rating as none rather than a score of zero', () => {
		const cleared = clearedRatingPatch();
		expect(personalRatingOf(cleared)).toBe(null);
		expect(displayRatingLikes(cleared)).toBe(null);
	});

	it('prefers the liked flag the server recorded', () => {
		expect(displayRatingLikes({Likes: false, Rating: 10})).toBe(false);
		expect(displayRatingLikes({Likes: true, Rating: 0})).toBe(true);
	});

	it('falls back to the score when no liked flag was recorded', () => {
		expect(displayRatingLikes({Rating: 8})).toBe(true);
		expect(displayRatingLikes({Rating: 6.5})).toBe(true);
		expect(displayRatingLikes({Rating: 6})).toBe(false);
		expect(displayRatingLikes({})).toBe(null);
	});

	it('reads the score the server keeps as stars', () => {
		expect(starsFromRating(9)).toBe(4.5);
		expect(starsFromRating(8)).toBe(4);
		expect(starsFromRating(null)).toBe(0);
	});

	it('labels a score with full stars and a half where it earns one', () => {
		expect(starRatingLabel(8)).toBe('★★★★');
		expect(starRatingLabel(9)).toBe('★★★★½');
		expect(starRatingLabel(5)).toBe('★★½');
		expect(starRatingLabel(0)).toBe('');
	});

	it('holds a score inside the scale the server accepts', () => {
		expect(clampRating(12)).toBe(10);
		expect(clampRating(-3)).toBe(0);
		expect(clampRating(Number.NaN)).toBe(0);
		expect(clampRating(9.5)).toBe(9.5);
	});

	it('patches user data the way each rating leaves it', () => {
		expect(thumbRatingPatch(true)).toEqual({Likes: true});
		expect(numericRatingPatch(8)).toEqual({Rating: 8, Likes: true});
		expect(numericRatingPatch(3)).toEqual({Rating: 3, Likes: false});
		expect(clearedRatingPatch()).toEqual({Rating: null, Likes: null});
	});

	it('rates every library media type but not people or playlists', () => {
		for (const type of ['Movie', 'Series', 'Season', 'Episode', 'MusicAlbum', 'Audio', 'Book', 'BoxSet']) {
			expect(isRatableItemType(type)).toBe(true);
		}
		expect(isRatableItemType('Person')).toBe(false);
		expect(isRatableItemType('Playlist')).toBe(false);
		expect(isRatableItemType('Photo')).toBe(false);
		expect(isRatableItemType(undefined)).toBe(false);
	});

	it('falls back to thumbs for a style it doesnt know', () => {
		expect(normalizeRatingStyle('stars')).toBe('stars');
		expect(normalizeRatingStyle('numeric')).toBe('numeric');
		expect(normalizeRatingStyle('hearts')).toBe('thumbs');
		expect(normalizeRatingStyle(undefined)).toBe('thumbs');
	});
});
