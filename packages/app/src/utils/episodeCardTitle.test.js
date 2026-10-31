import {episodeCardTitle} from './episodeCardTitle';

jest.mock('@enact/i18n/$L', () => ({__esModule: true, default: (str) => str}));

describe('episodeCardTitle', () => {
	test('a title keeps its number and loses the word', () => {
		expect(episodeCardTitle('The Winter Soldier', 1)).toBe('E1: The Winter Soldier');
		expect(episodeCardTitle('Pilot', 12)).toBe('E12: Pilot');
	});

	test('an episode with no number is just its title', () => {
		expect(episodeCardTitle('Special', null)).toBe('Special');
	});

	test('an episode with no title of its own still reads', () => {
		expect(episodeCardTitle('', 5)).toBe('Episode 5');
	});

	test('nothing at all gives an empty title', () => {
		expect(episodeCardTitle('', null)).toBe('');
	});
});
