import {seerrGenreBackdrop} from './seerrGenreArt';

describe('seerrGenreBackdrop', () => {
	test('hands back nothing when the genre has no artwork', () => {
		expect(seerrGenreBackdrop(28, [])).toBe(null);
		expect(seerrGenreBackdrop(28, null)).toBe(null);
	});

	test('colors a known genre with its own duotone pair', () => {
		const art = seerrGenreBackdrop(28, ['/a', '/b', '/c', '/d', '/e', '/f']);
		expect(art.size).toBe('w1280_filter(duotone,991B1B,FCA5A5)');
		expect(art.path).toBe('/e');
	});

	test('falls back to the last backdrop on a short list', () => {
		expect(seerrGenreBackdrop(18, ['/a', '/b']).path).toBe('/b');
	});

	test('uses the black pair for an unknown genre', () => {
		expect(seerrGenreBackdrop(424242, ['/a']).size).toBe('w1280_filter(duotone,1F2937,D1D5DB)');
	});
});
