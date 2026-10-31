import {renderHook, act} from '@testing-library/react';
import Spotlight from '@enact/spotlight';

import useStartLetter from './useStartLetter';

jest.mock('@enact/spotlight', () => ({__esModule: true, default: {focus: jest.fn()}}));

const item = (name) => ({SortName: name});
const ALIENS = [item('Alien'), item('Aliens'), item('Blade Runner')];

const setup = () => renderHook(
	({allItems, isLoading}) => useStartLetter({
		allItems,
		isLoading,
		gridSpotlightId: 'library-grid'
	}),
	{initialProps: {allItems: ALIENS, isLoading: false}}
);

const pick = (result, letter) => act(() => {
	result.current.handleLetterSelect({currentTarget: {dataset: {letter}}});
});

beforeEach(() => {
	jest.useFakeTimers();
	Spotlight.focus.mockClear();
});

afterEach(() => {
	jest.runOnlyPendingTimers();
	jest.useRealTimers();
});

describe('useStartLetter', () => {
	test('narrows the list to the letter picked', () => {
		const {result} = setup();

		pick(result, 'A');

		expect(result.current.items.map(i => i.SortName)).toEqual(['Alien', 'Aliens']);
	});

	test('picking the same letter again clears it', () => {
		const {result} = setup();

		pick(result, 'A');
		pick(result, 'A');

		expect(result.current.startLetter).toBeNull();
		expect(result.current.items).toHaveLength(3);
	});

	test('hands focus to the grid once the narrowed list has settled', () => {
		const {result} = setup();

		pick(result, 'A');
		act(() => jest.advanceTimersByTime(100));

		expect(Spotlight.focus).toHaveBeenCalledWith('library-grid');
	});

	// The list also rebuilds for a filter or a search, and taking focus for those
	// pulls the viewer away from whatever they were using.
	test('leaves focus alone when the list rebuilds under the same letter', () => {
		const {result, rerender} = setup();

		pick(result, 'A');
		act(() => jest.advanceTimersByTime(100));
		Spotlight.focus.mockClear();

		rerender({allItems: ALIENS, isLoading: true});
		rerender({allItems: [item('Alien')], isLoading: false});
		act(() => jest.advanceTimersByTime(200));

		expect(Spotlight.focus).not.toHaveBeenCalled();
	});

	// A short narrowed list asks for the next page straight away, so a load can
	// start and finish before the focus gets to move.
	test('still hands focus over when a page lands before it moved', () => {
		const {result, rerender} = setup();

		pick(result, 'A');
		rerender({allItems: ALIENS, isLoading: true});
		rerender({allItems: [...ALIENS, item('Amelie')], isLoading: false});
		act(() => jest.advanceTimersByTime(100));

		expect(Spotlight.focus).toHaveBeenCalledWith('library-grid');
	});

	test('still moves focus when a different letter is picked', () => {
		const {result} = setup();

		pick(result, 'A');
		act(() => jest.advanceTimersByTime(100));
		Spotlight.focus.mockClear();

		pick(result, 'B');
		act(() => jest.advanceTimersByTime(100));

		expect(Spotlight.focus).toHaveBeenCalledWith('library-grid');
	});

	test('a letter cleared and picked again counts as a fresh pick', () => {
		const {result} = setup();

		pick(result, 'A');
		act(() => jest.advanceTimersByTime(100));
		pick(result, 'A');
		Spotlight.focus.mockClear();

		pick(result, 'A');
		act(() => jest.advanceTimersByTime(100));

		expect(Spotlight.focus).toHaveBeenCalledWith('library-grid');
	});
});
