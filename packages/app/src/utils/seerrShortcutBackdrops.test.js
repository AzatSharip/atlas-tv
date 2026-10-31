// $L reaches for ilib, which a plain unit test has no way to load. Every key is its
// own English source string, so handing it straight back is faithful enough.
jest.mock('@enact/i18n/$L', () => ({__esModule: true, default: (str) => str}));

jest.mock('../services/seerrApi', () => ({
	__esModule: true,
	default: {
		getImageUrl: (path, size) => `https://image.tmdb.org/t/p/${size}${path}`,
		getGenreSliderMovies: () => Promise.resolve([{id: 28, name: 'Action', backdrops: ['/a.jpg']}])
	}
}));

import {pickShortcutBackdrops, SEERR_SHORTCUTS, fetchSeerrHomeRow} from './seerrHomeRows';

const results = [
	{id: 1, media_type: 'movie', backdrop_path: '/m1.jpg'},
	{id: 2, media_type: 'movie', backdrop_path: '/m2.jpg'},
	{id: 3, media_type: 'tv', backdrop_path: '/t1.jpg'},
	{id: 4, media_type: 'tv', backdrop_path: '/t2.jpg'},
	{id: 5, media_type: 'movie', backdrop_path: '/m3.jpg'}
];

describe('seerr shortcut backdrops', () => {
	it('gives movies and series a still of their own kind', () => {
		const picked = pickShortcutBackdrops(SEERR_SHORTCUTS, results);
		expect(picked.movies.startsWith('/m')).toBe(true);
		expect(picked.series.startsWith('/t')).toBe(true);
	});

	it('never uses the same still twice', () => {
		const picked = pickShortcutBackdrops(SEERR_SHORTCUTS, results);
		const used = Object.values(picked).filter(Boolean);
		expect(new Set(used).size).toBe(used.length);
	});

	it('lets movies and series claim art before the plain tiles do', () => {
		const scarce = [
			{id: 1, media_type: 'movie', backdrop_path: '/m1.jpg'},
			{id: 2, media_type: 'tv', backdrop_path: '/t1.jpg'}
		];
		const picked = pickShortcutBackdrops(SEERR_SHORTCUTS, scarce);
		expect(picked.movies).toBe('/m1.jpg');
		expect(picked.series).toBe('/t1.jpg');
	});

	it('falls back to the other kind when one runs out', () => {
		const onlyMovies = [{id: 1, media_type: 'movie', backdrop_path: '/m1.jpg'}];
		const picked = pickShortcutBackdrops(SEERR_SHORTCUTS, onlyMovies);
		expect(picked.movies).toBe('/m1.jpg');
		expect(picked.series).toBe(null);
	});

	it('leaves every tile bare when nothing carries artwork', () => {
		const picked = pickShortcutBackdrops(SEERR_SHORTCUTS, [{id: 1, media_type: 'movie'}]);
		expect(Object.values(picked).every((value) => value === null)).toBe(true);
	});
});

describe('genre tiles', () => {
	it('colors the tile through the duotone filter for its genre', async () => {
		const [genre] = await fetchSeerrHomeRow('genreMovies');
		expect(genre._externalTileUrl).toBe('https://image.tmdb.org/t/p/w1280_filter(duotone,991B1B,FCA5A5)/a.jpg');
		expect(genre._externalBackdropUrl).toBe(genre._externalTileUrl);
		expect(genre.Type).toBe('Genre');
	});
});
