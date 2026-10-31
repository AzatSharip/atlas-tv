import {searchArtworkOptions, shouldMountSearchRow} from './searchWindow';

describe('search result windowing', () => {
	// The windowing rules are proven in utils/rowWindow.test.js. This only checks that search still
	// reaches them under the name it has always used.
	it('still reaches the shared windowing', () => {
		expect(shouldMountSearchRow(1, 0)).toBe(true);
		expect(shouldMountSearchRow(2, 0)).toBe(false);
	});

	// The same sizes and quality the rest of the app asks for, so search reads
	// the images the server already rendered.
	test('sizes artwork for its card shape', () => {
		expect(searchArtworkOptions('poster', 'poster-tag')).toEqual({
			maxHeight: 300,
			quality: 80,
			tag: 'poster-tag'
		});
		expect(searchArtworkOptions('wide')).toEqual({maxWidth: 400, quality: 80});
		expect(searchArtworkOptions('square')).toEqual({maxWidth: 400, quality: 80});
	});
});
