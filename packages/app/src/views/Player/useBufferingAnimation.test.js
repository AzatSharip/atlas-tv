import {act, renderHook} from '@testing-library/react';

import useBufferingAnimation from './useBufferingAnimation';

const setup = (props) => renderHook((current) => useBufferingAnimation(current), {initialProps: props});

beforeEach(() => {
	jest.useFakeTimers();
});

afterEach(() => {
	jest.useRealTimers();
});

describe('useBufferingAnimation', () => {
	test('shows whenever the stream buffers and there is no preview', () => {
		const {result, rerender} = setup({isBuffering: false, isSeeking: false, hasPreview: false});
		expect(result.current.showBuffering).toBe(false);

		rerender({isBuffering: true, isSeeking: true, hasPreview: false});
		expect(result.current.showBuffering).toBe(true);
	});

	test('stays off the preview while a seek is picked', () => {
		const {result} = setup({isBuffering: true, isSeeking: true, hasPreview: true});

		expect(result.current.showBuffering).toBe(false);
	});

	test('waits three seconds after a seek before covering the preview', () => {
		const {result, rerender} = setup({isBuffering: false, isSeeking: false, hasPreview: true});

		act(() => result.current.noteSeek());
		rerender({isBuffering: true, isSeeking: false, hasPreview: true});
		expect(result.current.showBuffering).toBe(false);

		act(() => jest.advanceTimersByTime(2900));
		expect(result.current.showBuffering).toBe(false);

		act(() => jest.advanceTimersByTime(200));
		expect(result.current.showBuffering).toBe(true);
	});

	test('shows straight away when the last seek was long enough ago', () => {
		const {result, rerender} = setup({isBuffering: false, isSeeking: false, hasPreview: true});

		act(() => result.current.noteSeek());
		act(() => jest.advanceTimersByTime(3100));
		rerender({isBuffering: true, isSeeking: false, hasPreview: true});

		expect(result.current.showBuffering).toBe(true);
	});
});
