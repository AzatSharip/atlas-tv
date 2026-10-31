import {buildSeerrDetailItem} from './seerrDetailItem';

jest.mock('../services/seerrApi', () => ({
	getImageUrl: (path, size) => `https://image.tmdb.org/t/p/${size}${path}`
}));

const movie = {
	id: 603,
	title: 'The Matrix',
	overview: 'A hacker learns the truth.',
	releaseDate: '1999-03-30',
	runtime: 136,
	voteAverage: 8.2,
	genres: [{id: 28, name: 'Action'}],
	tagline: 'Welcome to the Real World.',
	posterPath: '/poster.jpg',
	backdropPath: '/backdrop.jpg',
	status: 'Released',
	credits: {cast: [{id: 6384, name: 'Keanu Reeves', character: 'Neo', profilePath: '/keanu.jpg'}]}
};

describe('buildSeerrDetailItem', () => {
	it('maps a movie onto the shape the detail screen reads', () => {
		const item = buildSeerrDetailItem(movie, 'movie');
		expect(item.Name).toBe('The Matrix');
		expect(item.Type).toBe('Movie');
		expect(item.ProductionYear).toBe(1999);
		expect(item.CommunityRating).toBe(8.2);
		expect(item.Genres).toEqual(['Action']);
		expect(item.Taglines).toEqual(['Welcome to the Real World.']);
		expect(item.ProviderIds.Tmdb).toBe('603');
	});

	it('turns the runtime into ticks, which is what the screen formats', () => {
		expect(buildSeerrDetailItem(movie, 'movie').RunTimeTicks).toBe(136 * 600000000);
		expect(buildSeerrDetailItem({...movie, runtime: 0}, 'movie').RunTimeTicks).toBeNull();
	});

	it('takes a series runtime from the per-episode figure', () => {
		const item = buildSeerrDetailItem({id: 1399, name: 'Rome', episodeRunTime: [50], firstAirDate: '2005-08-28'}, 'tv');
		expect(item.RunTimeTicks).toBe(50 * 600000000);
		expect(item.ProductionYear).toBe(2005);
		expect(item.Type).toBe('Series');
	});

	it('renames the state TMDB calls a returning series, so the badge reads Continuing', () => {
		expect(buildSeerrDetailItem({id: 1, status: 'Returning Series'}, 'tv').Status).toBe('Continuing');
		expect(buildSeerrDetailItem({id: 1, status: 'Ended'}, 'tv').Status).toBe('Ended');
		expect(buildSeerrDetailItem(movie, 'movie').Status).toBeNull();
	});

	it('hands artwork over as finished urls, since these images are not on the server', () => {
		const item = buildSeerrDetailItem(movie, 'movie');
		expect(item._externalPosterUrl).toBe('https://image.tmdb.org/t/p/w500/poster.jpg');
		expect(item._externalBackdropUrl).toBe('https://image.tmdb.org/t/p/w1280/backdrop.jpg');
		expect(item.People[0]._externalImageUrl).toBe('https://image.tmdb.org/t/p/w185/keanu.jpg');
	});

	it('leaves nothing to play, since none of this is in the library', () => {
		const item = buildSeerrDetailItem(movie, 'movie');
		expect(item.MediaSources).toEqual([]);
		expect(item.UserData).toEqual({});
	});

	it('has nothing to build without a payload', () => {
		expect(buildSeerrDetailItem(null, 'movie')).toBeNull();
	});

	describe('trailers', () => {
		const withVideos = (relatedVideos) => buildSeerrDetailItem({...movie, relatedVideos}, 'movie').RemoteTrailers;

		it('offers nothing when Seerr sent no videos', () => {
			expect(buildSeerrDetailItem(movie, 'movie').RemoteTrailers).toEqual([]);
			expect(withVideos([])).toEqual([]);
		});

		it('prefers a trailer on YouTube over everything else', () => {
			expect(withVideos([
				{name: 'Clip', site: 'YouTube', type: 'Clip', key: 'clip1'},
				{name: 'Teaser', site: 'Vimeo', type: 'Trailer', url: 'https://vimeo.com/1'},
				{name: 'Official Trailer', site: 'YouTube', type: 'Trailer', key: 'abc123'}
			])).toEqual([{Name: 'Official Trailer', Url: 'https://www.youtube.com/watch?v=abc123'}]);
		});

		it('falls back to a trailer elsewhere, then to anything on YouTube', () => {
			expect(withVideos([
				{name: 'Featurette', site: 'YouTube', type: 'Featurette', key: 'feat1'},
				{name: 'Vimeo Trailer', site: 'Vimeo', type: 'Trailer', url: 'https://vimeo.com/7'}
			])).toEqual([{Name: 'Vimeo Trailer', Url: 'https://vimeo.com/7'}]);

			expect(withVideos([
				{name: 'Behind the Scenes', site: 'YouTube', type: 'Behind the Scenes', key: 'bts1'}
			])).toEqual([{Name: 'Behind the Scenes', Url: 'https://www.youtube.com/watch?v=bts1'}]);
		});

		it('builds the watch url from the key when Seerr sent no url', () => {
			expect(withVideos([{site: 'YouTube', type: 'Trailer', key: 'xyz789'}]))
				.toEqual([{Name: '', Url: 'https://www.youtube.com/watch?v=xyz789'}]);
		});

		it('drops a video it can reach by neither url nor key', () => {
			expect(withVideos([{name: 'Broken', site: 'YouTube', type: 'Trailer'}])).toEqual([]);
		});
	});
});
