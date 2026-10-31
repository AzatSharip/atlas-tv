jest.mock('@enact/i18n/$L', () => ({__esModule: true, default: (str) => str}));

import {
	groupPlaylists, playlistCategoryFromItems, playlistNeedsItemCheck,
	playlistSummaryCategory, resolveItemMediaType
} from './playlistGrouping';

describe('resolveItemMediaType', () => {
	it('lets the concrete type win over the media type', () => {
		expect(resolveItemMediaType({Type: 'MusicVideo', MediaType: 'Audio'})).toBe('MusicVideo');
		expect(resolveItemMediaType({Type: 'Movie', MediaType: 'Video'})).toBe('Video');
		expect(resolveItemMediaType({Type: 'AudioBook', MediaType: 'Audio'})).toBe('AudioBook');
		expect(resolveItemMediaType({Type: 'Audio'})).toBe('Audio');
		expect(resolveItemMediaType({MediaType: 'Video'})).toBe('Video');
		expect(resolveItemMediaType({})).toBe('Unknown');
	});
});

describe('playlistSummaryCategory and playlistNeedsItemCheck', () => {
	it('takes book and photo summaries at face value', () => {
		const books = {Type: 'Playlist', MediaType: 'Book', ChildCount: 3};
		expect(playlistSummaryCategory(books)).toBe('Book');
		expect(playlistNeedsItemCheck(books)).toBe(false);
		expect(playlistNeedsItemCheck({Type: 'Playlist', MediaType: 'Photo', ChildCount: 3})).toBe(false);
	});

	// A music video playlist carries the same summary as a movie one.
	it('asks for an item check when the summary says Video', () => {
		const video = {Type: 'Playlist', MediaType: 'Video', ChildCount: 3};
		expect(playlistSummaryCategory(video)).toBe('Video');
		expect(playlistNeedsItemCheck(video)).toBe(true);
	});

	it('marks an empty playlist Mixed without a check', () => {
		const empty = {Type: 'Playlist', MediaType: 'Audio', ChildCount: 0};
		expect(playlistSummaryCategory(empty)).toBe('Mixed');
		expect(playlistNeedsItemCheck(empty)).toBe(false);
	});

	it('asks for an item check when the summary says Audio', () => {
		const audio = {Type: 'Playlist', MediaType: 'Audio', ChildCount: 5};
		expect(playlistSummaryCategory(audio)).toBe('Audio');
		expect(playlistNeedsItemCheck(audio)).toBe(true);
	});

	it('treats missing counts as holding something', () => {
		expect(playlistNeedsItemCheck({Type: 'Playlist', MediaType: 'Audio'})).toBe(true);
	});
});

describe('playlistCategoryFromItems', () => {
	it('settles on the one kind the items share', () => {
		expect(playlistCategoryFromItems([{Type: 'Audio'}, {Type: 'Audio'}])).toBe('Audio');
		expect(playlistCategoryFromItems([{Type: 'AudioBook'}, {Type: 'AudioBook'}])).toBe('AudioBook');
	});

	it('makes music videos a section of their own, songs among them or not', () => {
		expect(playlistCategoryFromItems([{Type: 'MusicVideo'}, {Type: 'MusicVideo'}])).toBe('MusicVideo');
		expect(playlistCategoryFromItems([{Type: 'MusicVideo'}, {Type: 'Audio'}])).toBe('MusicVideo');
		expect(playlistCategoryFromItems([{Type: 'MusicVideo'}, {Type: 'Movie'}])).toBe('Mixed');
		expect(playlistCategoryFromItems([{Type: 'Audio'}, {Type: 'Audio'}])).toBe('Audio');
	});

	it('calls a blend of kinds Mixed', () => {
		expect(playlistCategoryFromItems([{Type: 'Audio'}, {Type: 'Movie'}])).toBe('Mixed');
		expect(playlistCategoryFromItems([])).toBe('Mixed');
	});
});

describe('groupPlaylists', () => {
	it('orders the sections and lets resolved categories override the summary', () => {
		const playlists = [
			{Id: 'a', Type: 'Playlist', MediaType: 'Audio', ChildCount: 2},
			{Id: 'b', Type: 'Playlist', MediaType: 'Video', ChildCount: 2},
			{Id: 'c', Type: 'Playlist', MediaType: 'Audio', ChildCount: 2}
		];
		const groups = groupPlaylists(playlists, {c: 'AudioBook'});
		expect(groups.map((g) => g.name)).toEqual(['Video Playlists', 'Audio Playlists', 'Audiobook Playlists']);
		expect(groups[1].items.map((i) => i.Id)).toEqual(['a']);
		expect(groups[2].items.map((i) => i.Id)).toEqual(['c']);
	});

	it('puts music video playlists right after the video ones', () => {
		const playlists = [
			{Id: 'a', Type: 'Playlist', MediaType: 'Audio', ChildCount: 2},
			{Id: 'b', Type: 'Playlist', MediaType: 'Video', ChildCount: 2}
		];
		const groups = groupPlaylists(playlists, {a: 'MusicVideo'});
		expect(groups.map((g) => g.name)).toEqual(['Video Playlists', 'Music Video Playlists']);
		expect(groups[1].items.map((i) => i.Id)).toEqual(['a']);
	});
});
