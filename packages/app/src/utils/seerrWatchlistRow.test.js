// $L reaches for ilib, which a plain unit test has no way to load. Every key is its own
// English source string, so handing the string straight back is faithful enough here.
jest.mock('@enact/i18n/$L', () => ({__esModule: true, default: (str) => str}));

// The real seerrApi reaches for platform storage on import. Only the row wiring is
// under test here, so the request layer is stubbed out.
jest.mock('../services/seerrApi', () => ({
	__esModule: true,
	default: {
		getWatchlist: jest.fn(),
		getMovie: jest.fn(),
		getTv: jest.fn(),
		getImageUrl: (path, size) => `https://image.tmdb.org/t/p/${size}${path}`
	}
}));

import seerrApi from '../services/seerrApi';
import {normalizeWatchlistBody} from '../services/seerrApi.watchlistShape';
import {SEERR_SECTION_TO_CONFIG, fetchSeerrHomeRow, getSeerrHomeRowConfigs} from './seerrHomeRows';

describe('watchlist response mapping', () => {
	it('promotes tmdbId to id and media to mediaInfo', () => {
		const {results} = normalizeWatchlistBody({
			page: 1,
			results: [
				{ratingKey: '1', tmdbId: 603, mediaType: 'movie', title: 'The Matrix', media: {status: 5}},
				{ratingKey: '2', tmdbId: 1396, mediaType: 'tv', title: 'Breaking Bad'}
			]
		});

		expect(results.map((r) => r.id)).toEqual([603, 1396]);
		expect(results[0].mediaInfo).toEqual({status: 5});
	});

	it('takes tmdbId over the row id and tolerates an empty body', () => {
		expect(normalizeWatchlistBody({results: [{id: 2, tmdbId: 68421}]}).results[0].id).toBe(68421);
		expect(normalizeWatchlistBody(undefined).results).toEqual([]);
		expect(normalizeWatchlistBody({}).results).toEqual([]);
	});
});

describe('seerr watchlist home row', () => {
	beforeEach(() => {
		seerrApi.getWatchlist.mockReset();
	});

	it('is wired into the home layout under the plugin section name', () => {
		expect(SEERR_SECTION_TO_CONFIG.seerr_watchlist).toBe('yourWatchlist');
		expect(getSeerrHomeRowConfigs().some((cfg) => cfg.id === 'yourWatchlist')).toBe(true);
	});

	it('gives every entry a distinct id and keeps the tmdb id for navigation', async () => {
		// Fed through the real mapping, exactly as getWatchlist would.
		seerrApi.getWatchlist.mockResolvedValue(normalizeWatchlistBody({
			results: [
				{tmdbId: 603, mediaType: 'movie', title: 'The Matrix', posterPath: '/a.jpg'},
				{tmdbId: 1396, mediaType: 'tv', name: 'Breaking Bad', posterPath: '/b.jpg'}
			]
		}));

		const items = await fetchSeerrHomeRow('yourWatchlist');

		expect(items.map((i) => i.Id)).toEqual(['seerr-movie-603', 'seerr-tv-1396']);
		expect(new Set(items.map((i) => i.Id)).size).toBe(items.length);
		expect(items.map((i) => i._seerrRaw.mediaId)).toEqual([603, 1396]);
		expect(items.map((i) => i.Name)).toEqual(['The Matrix', 'Breaking Bad']);
		expect(items.map((i) => i.Type)).toEqual(['Movie', 'Series']);
	});

	it('fills each Jellyfin watchlist entry in from the title details', async () => {
		seerrApi.getWatchlist.mockResolvedValue(normalizeWatchlistBody({
			results: [
				{id: 2, tmdbId: 68421, mediaType: 'tv', title: '', media: {status: 5}},
				{id: 3, tmdbId: 7191, mediaType: 'movie', title: ''}
			]
		}));
		seerrApi.getTv.mockResolvedValue({name: 'Altered Carbon', posterPath: '/ac.jpg', firstAirDate: '2018-02-02'});
		seerrApi.getMovie.mockResolvedValue({title: 'Cloverfield', posterPath: '/cf.jpg', releaseDate: '2008-01-15', mediaInfo: {status: 4}});

		const items = await fetchSeerrHomeRow('yourWatchlist');

		expect(seerrApi.getTv).toHaveBeenCalledWith(68421);
		expect(seerrApi.getMovie).toHaveBeenCalledWith(7191);
		expect(items.map((i) => i.Id)).toEqual(['seerr-tv-68421', 'seerr-movie-7191']);
		expect(items.map((i) => i.Name)).toEqual(['Altered Carbon', 'Cloverfield']);
		expect(items.map((i) => i._externalPosterUrl)).toEqual([
			'https://image.tmdb.org/t/p/w342/ac.jpg',
			'https://image.tmdb.org/t/p/w342/cf.jpg'
		]);
		expect(items.map((i) => i.ProductionYear)).toEqual([2018, 2008]);
		expect(items.map((i) => i.mediaInfo)).toEqual([{status: 5}, {status: 4}]);
	});

	it('keeps an entry whose details fail, pointing at the right title', async () => {
		seerrApi.getWatchlist.mockResolvedValue(normalizeWatchlistBody({
			results: [{id: 3, tmdbId: 7191, mediaType: 'movie', title: ''}]
		}));
		seerrApi.getMovie.mockRejectedValue(new Error('502'));

		const items = await fetchSeerrHomeRow('yourWatchlist');

		expect(items.map((i) => i.Id)).toEqual(['seerr-movie-7191']);
		expect(items[0]._externalPosterUrl).toBeNull();
	});

	it('never lets a failed request break the home screen', async () => {
		seerrApi.getWatchlist.mockRejectedValue(new Error('502'));
		await expect(fetchSeerrHomeRow('yourWatchlist')).resolves.toEqual([]);
	});
});
