// $L reaches for ilib, which a plain unit test has no way to load. Every key is its own
// English source string, so handing the string straight back is faithful enough here.
jest.mock('@enact/i18n/$L', () => ({__esModule: true, default: (str) => str}));

import {buildMediaFacts} from './seerrMediaFacts';

const labels = (facts) => facts.map((f) => f.label);
const factValue = (facts, label) => facts.find((f) => f.label === label)?.value;

describe('buildMediaFacts', () => {
	test('has nothing to say about a title that has yet to load', () => {
		expect(buildMediaFacts(null, 'movie')).toEqual([]);
		expect(buildMediaFacts(undefined, 'tv')).toEqual([]);
	});

	test('leaves out anything the server left empty', () => {
		expect(buildMediaFacts({}, 'movie')).toEqual([]);
		expect(buildMediaFacts({}, 'tv')).toEqual([]);
	});

	test('turns the TMDB vote into a percentage', () => {
		expect(factValue(buildMediaFacts({voteAverage: 7.8}, 'movie'), 'TMDB Score')).toBe('78%');
	});

	// A title nobody has voted on comes back as zero rather than absent, and showing 0% next
	// to a score label reads as a real rating rather than a missing one.
	test('drops a zero score and any non numeric value', () => {
		expect(labels(buildMediaFacts({voteAverage: 0}, 'movie'))).toEqual([]);
		expect(labels(buildMediaFacts({voteAverage: null}, 'movie'))).toEqual([]);
		expect(labels(buildMediaFacts({voteAverage: 'n/a'}, 'movie'))).toEqual([]);
	});

	test('a movie gets its release date, money and runtime', () => {
		const facts = buildMediaFacts({
			releaseDate: '2010-07-16',
			runtime: 148,
			budget: 160000000,
			revenue: 836800000
		}, 'movie');

		expect(labels(facts)).toEqual(['Release Date', 'Budget', 'Revenue', 'Runtime']);
	});

	test('a series gets its first air date and its counts', () => {
		const facts = buildMediaFacts({
			firstAirDate: '2008-01-20',
			numberOfSeasons: 5,
			numberOfEpisodes: 62
		}, 'tv');

		expect(labels(facts)).toEqual(['First Air Date', 'Seasons', 'Episodes']);
		expect(factValue(facts, 'Seasons')).toBe('5');
		expect(factValue(facts, 'Episodes')).toBe('62');
	});

	// A count of zero is a count the server never filled in, and a season line reading zero
	// says something the title does not.
	test('drops a count of zero', () => {
		expect(labels(buildMediaFacts({numberOfSeasons: 0, numberOfEpisodes: 0}, 'tv'))).toEqual([]);
	});

	// Only the date line changes with the type, so a payload carrying both is read as
	// whichever type it was opened as.
	test('the media type decides which date is read', () => {
		const both = {releaseDate: '2010-07-16', firstAirDate: '2008-01-20', runtime: 148};

		expect(labels(buildMediaFacts(both, 'movie'))).toEqual(['Release Date', 'Runtime']);
		expect(labels(buildMediaFacts(both, 'tv'))).toEqual(['First Air Date', 'Runtime']);
	});

	test('the production status comes through as the server worded it', () => {
		expect(factValue(buildMediaFacts({status: 'Returning Series'}, 'tv'), 'Status')).toBe('Returning Series');
	});
});
