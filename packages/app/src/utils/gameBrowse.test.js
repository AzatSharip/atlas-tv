import {buildGameIndex, gameIndexMatches, gameQueryWords} from './gameBrowse';

const bucketOf = (title) => buildGameIndex(title, '').bucket;

describe('letter buckets', () => {
	test('buckets a plain title under its first letter', () => {
		expect(bucketOf('River Raid')).toBe('R');
	});

	test('folds an accent onto the letter it belongs to', () => {
		expect(bucketOf('Ökosystem')).toBe('O');
		expect(bucketOf('Ørn')).toBe('O');
	});

	test('sends anything that does not start with a letter to the hash', () => {
		expect(bucketOf('1942')).toBe('#');
		expect(bucketOf('')).toBe('#');
		expect(bucketOf('   ')).toBe('#');
		expect(bucketOf('ßeta')).toBe('#');
	});
});

describe('gameIndexMatches', () => {
	const raid = buildGameIndex('River Raid', 'river_raid.a26');

	test('matches a word prefix rather than text inside a word', () => {
		expect(gameIndexMatches(raid, gameQueryWords('river'), '')).toBe(true);
		expect(gameIndexMatches(buildGameIndex('Night Driver', ''), gameQueryWords('river'), '')).toBe(false);
	});

	test('needs every term to match', () => {
		expect(gameIndexMatches(raid, gameQueryWords('river ra'), '')).toBe(true);
		expect(gameIndexMatches(raid, gameQueryWords('river pitfall'), '')).toBe(false);
	});

	test('finds a title whether or not the accents were typed', () => {
		expect(gameIndexMatches(buildGameIndex('Pokémon Snap', ''), gameQueryWords('pokemon'), '')).toBe(true);
		expect(gameIndexMatches(buildGameIndex('Pokemon Snap', ''), gameQueryWords('poké'), '')).toBe(true);
	});

	test('reads the filename as well as the title', () => {
		expect(gameIndexMatches(buildGameIndex('', 'sonic2.md'), gameQueryWords('sonic2'), '')).toBe(true);
	});

	test('applies the letter filter alongside the query', () => {
		expect(gameIndexMatches(raid, [], 'R')).toBe(true);
		expect(gameIndexMatches(raid, [], 'N')).toBe(false);
		expect(gameIndexMatches(raid, gameQueryWords('river'), 'N')).toBe(false);
	});

	test('an empty letter and query keep everything', () => {
		expect(gameIndexMatches(raid, [], '')).toBe(true);
	});
});
