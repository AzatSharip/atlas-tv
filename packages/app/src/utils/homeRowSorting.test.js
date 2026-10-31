import {apiSortBy, getSortOrderFromSortBy, isPlaylistOrder, resolveSortOrder} from './homeRowSorting';

describe('playlist order', () => {
	it('recognizes both spellings', () => {
		expect(isPlaylistOrder('PlaylistOrder')).toBe(true);
		expect(isPlaylistOrder('playlistOrder')).toBe(true);
		expect(isPlaylistOrder('SortName')).toBe(false);
		expect(isPlaylistOrder('')).toBe(false);
	});

	it('falls back to name as the server sort field', () => {
		expect(apiSortBy('PlaylistOrder')).toBe('SortName');
		expect(apiSortBy('DateCreated,SortName')).toBe('DateCreated,SortName');
	});

	it('reads as an ascending arrangement', () => {
		expect(getSortOrderFromSortBy('PlaylistOrder')).toBe('Ascending');
		expect(resolveSortOrder('PlaylistOrder', null)).toBe('Ascending');
	});
});
