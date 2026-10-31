import {supportsLibraryForContent} from './shuffleOverlayService';

jest.mock('./connectionPool', () => ({}));

const library = (Name, CollectionType) => ({Name, CollectionType});

describe('supportsLibraryForContent', () => {
	// A mixed content library holds movies and shows together, and the server says so by
	// sending no collection type, so it has to survive every content type.
	test('offers a mixed library whatever the content type', () => {
		[undefined, '', 'mixed', 'unknown'].forEach((collectionType) => {
			['both', 'movies', 'tv'].forEach((contentType) => {
				expect(supportsLibraryForContent(library('Japanese', collectionType), contentType)).toBe(true);
			});
		});
	});

	test('keeps movie and show libraries on their own content type', () => {
		const movies = library('Movies', 'movies');
		const shows = library('Shows', 'tvshows');

		expect(supportsLibraryForContent(movies, 'movies')).toBe(true);
		expect(supportsLibraryForContent(movies, 'tv')).toBe(false);
		expect(supportsLibraryForContent(shows, 'tv')).toBe(true);
		expect(supportsLibraryForContent(shows, 'movies')).toBe(false);
		expect(supportsLibraryForContent(movies, 'both')).toBe(true);
		expect(supportsLibraryForContent(shows, 'both')).toBe(true);
	});

	test('drops the collection types that hold nothing to shuffle', () => {
		['books', 'playlists', 'livetv', 'boxsets', 'music'].forEach((collectionType) => {
			expect(supportsLibraryForContent(library(collectionType, collectionType), 'both')).toBe(false);
		});
	});

	// The name check has to run first, otherwise these two arrive with no collection type and
	// get waved through as mixed libraries.
	test('drops folders and recordings even without a collection type', () => {
		expect(supportsLibraryForContent(library('Folders', ''), 'both')).toBe(false);
		expect(supportsLibraryForContent(library('Recordings', undefined), 'both')).toBe(false);
	});
});
