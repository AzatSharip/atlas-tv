jest.mock('./jellyfinApi', () => ({
	getAuthHeader: () => 'token',
	getServerUrl: () => 'http://server',
	api: {getItem: jest.fn()}
}));
jest.mock('../utils/requestQueue', () => ({
	mediaServerQueue: {run: (task) => task()}
}));

import {fetchRatings} from './mdblistApi';

const respondWith = (ratings) => {
	global.fetch = jest.fn(() => Promise.resolve({
		ok: true,
		json: () => Promise.resolve({success: true, ratings})
	}));
};

describe('fetchRatings', () => {
	afterEach(() => {
		delete global.fetch;
	});

	test('keeps one rating per source when the plugin repeats it under another spelling', async () => {
		// Plugins before the dedupe fix answer a profile holding myAnimeList and myanimelist
		// with the same rating twice.
		respondWith([
			{source: 'myAnimeList', value: 8.6, score: 86},
			{source: 'imdb', value: 8.1, score: 81},
			{source: 'myanimelist', value: 8.6, score: 86}
		]);

		const ratings = await fetchRatings('http://server', {Type: 'Series', Id: 's1', ProviderIds: {Tmdb: '101'}}, {sourcesKey: 'dupes'});

		expect(ratings.map((r) => r.source)).toEqual(['myAnimeList', 'imdb']);
	});

	test('still maps popcorn to tomatoes_audience', async () => {
		respondWith([{source: 'popcorn', score: 92}]);

		const ratings = await fetchRatings('http://server', {Type: 'Movie', Id: 'm1', ProviderIds: {Tmdb: '202'}}, {sourcesKey: 'rt'});

		expect(ratings).toEqual([{source: 'tomatoes_audience', value: undefined, score: 92, votes: undefined, url: undefined}]);
	});
});
