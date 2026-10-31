import {episodesBeforePrompt, shouldAskStillWatching} from './stillWatching';

describe('episodesBeforePrompt', () => {
	test('reads the count for each choice', () => {
		expect(episodesBeforePrompt('short_')).toBe(2);
		expect(episodesBeforePrompt('medium')).toBe(3);
		expect(episodesBeforePrompt('long_')).toBe(5);
		expect(episodesBeforePrompt('veryLong')).toBe(8);
	});

	test('disabled asks for nothing', () => {
		expect(episodesBeforePrompt('disabled')).toBe(0);
	});

	test('an unknown value asks for nothing rather than guessing', () => {
		expect(episodesBeforePrompt(undefined)).toBe(0);
		expect(episodesBeforePrompt('whatever')).toBe(0);
	});
});

describe('shouldAskStillWatching', () => {
	test('stays quiet below the count', () => {
		expect(shouldAskStillWatching(2, 'medium')).toBe(false);
	});

	test('asks on reaching the count', () => {
		expect(shouldAskStillWatching(3, 'medium')).toBe(true);
	});

	test('still asks past the count', () => {
		expect(shouldAskStillWatching(9, 'medium')).toBe(true);
	});

	test('never asks when disabled, however long the run', () => {
		expect(shouldAskStillWatching(99, 'disabled')).toBe(false);
	});

	test('never asks when the setting is missing', () => {
		expect(shouldAskStillWatching(99, undefined)).toBe(false);
	});

	test('a fresh run asks for nothing', () => {
		expect(shouldAskStillWatching(0, 'short_')).toBe(false);
	});
});
