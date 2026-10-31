import {renderHook, act} from '@testing-library/react';

import useClock from './useClock';

// Only the settings are stood in for. The clock utilities are left real: they
// are pure, already have their own tests, and mocking them here made the hook
// stop reporting anything at all.
jest.mock('../context/SettingsContext', () => ({
	useSettings: () => ({settings: {clockDisplay: '24-hour', timeOffsetHours: 0}})
}));

describe('useClock', () => {
	test('reads a time as soon as it is shown', () => {
		const {result} = renderHook(() => useClock(true));

		expect(result.current).toMatch(/^\d{1,2}:\d{2}$/);
	});

	test('defaults to shown, so a caller that passes nothing still gets a clock', () => {
		const {result} = renderHook(() => useClock());

		expect(result.current).toMatch(/^\d{1,2}:\d{2}$/);
	});

	// The sidebar and the nav bar both hide the clock on a setting, and a hidden
	// clock has no business waking up every minute to work out a string nobody
	// reads. Staying empty across several ticks is what proves it went idle.
	test('stays empty and never starts ticking while it is hidden', () => {
		jest.useFakeTimers();
		try {
			const {result} = renderHook(() => useClock(false));

			expect(result.current).toBe('');

			act(() => jest.advanceTimersByTime(5 * 60000));

			expect(result.current).toBe('');
		} finally {
			jest.runOnlyPendingTimers();
			jest.useRealTimers();
		}
	});

	test('starts reporting when it is shown again', () => {
		const {result, rerender} = renderHook(({on}) => useClock(on), {
			initialProps: {on: false}
		});

		expect(result.current).toBe('');

		rerender({on: true});

		expect(result.current).toMatch(/^\d{1,2}:\d{2}$/);
	});
});
