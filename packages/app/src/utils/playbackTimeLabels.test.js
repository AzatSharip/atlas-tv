jest.mock('@enact/i18n/$L', () => ({__esModule: true, default: (str) => str}));

import {
	PLAYBACK_TIME_DISPLAYS,
	PLAYBACK_TIME_SLOTS,
	formatPlaybackDuration,
	formatPlaybackEndsAt,
	formatPlaybackTimeSlot,
	formatPlaybackTrailingTime
} from './playbackTimeLabels';

// Fixed so every expected string can be exact. Ends at is the one label tied to the wall
// clock, so those are matched by shape instead and pass at any time of day.
const POSITION = (42 * 60) + 10;
const DURATION = (1 * 3600) + (58 * 60) + 33;

describe('formatPlaybackDuration', () => {
	test('drops the hour part below one hour', () => {
		expect(formatPlaybackDuration((4 * 60) + 5)).toBe('4:05');
		expect(formatPlaybackDuration(0)).toBe('0:00');
	});

	test('includes hours with zero-padded minutes and seconds', () => {
		expect(formatPlaybackDuration(DURATION)).toBe('1:58:33');
		expect(formatPlaybackDuration((2 * 3600) + 7)).toBe('2:00:07');
	});

	test('clamps negative and unusable values to zero', () => {
		expect(formatPlaybackDuration(-30)).toBe('0:00');
		expect(formatPlaybackDuration(NaN)).toBe('0:00');
		expect(formatPlaybackDuration(undefined)).toBe('0:00');
	});
});

describe('formatPlaybackTrailingTime', () => {
	const trailing = (mode, extra) => formatPlaybackTrailingTime({
		mode,
		position: POSITION,
		duration: DURATION,
		clockDisplay: '24-hour',
		...extra
	});

	test('totalDuration shows the full runtime', () => {
		expect(trailing('totalDuration')).toBe('1:58:33');
	});

	test('timeRemaining shows the negated remainder', () => {
		expect(trailing('timeRemaining')).toBe('-1:16:23');
	});

	test('timeRemaining never goes below zero', () => {
		expect(trailing('timeRemaining', {position: DURATION + 5})).toBe('-0:00');
	});

	test('endsAt renders a 24 hour wall-clock time', () => {
		expect(trailing('endsAt')).toMatch(/^Ends at \d{2}:\d{2}$/);
	});

	test('endsAt honours the 12 hour clock preference', () => {
		expect(trailing('endsAt', {clockDisplay: '12-hour'})).toMatch(/^Ends at \d{1,2}:\d{2} (AM|PM)$/);
	});

	test('endsAt collapses when there is nothing left to play', () => {
		expect(formatPlaybackEndsAt(0, '24-hour')).toBe('');
		expect(formatPlaybackEndsAt(-60, '24-hour')).toBe('');
	});

	test('every mode falls back to the duration when it is unknown', () => {
		PLAYBACK_TIME_DISPLAYS.forEach((mode) => {
			expect(formatPlaybackTrailingTime({
				mode,
				position: 0,
				duration: 0,
				clockDisplay: '24-hour'
			})).toBe('0:00');
		});
	});
});

// The clock offset exists for sets that report the wrong time, so the end time has to
// move with the clock the viewer is actually reading.
describe('the clock offset', () => {
	beforeEach(() => {
		jest.useFakeTimers();
		jest.setSystemTime(new Date(2026, 7, 4, 20, 0));
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	test('shifts the end time, and no offset leaves it alone', () => {
		expect(formatPlaybackEndsAt(30 * 60, '24-hour')).toBe('Ends at 20:30');
		expect(formatPlaybackEndsAt(30 * 60, '24-hour', 0)).toBe('Ends at 20:30');
		expect(formatPlaybackEndsAt(30 * 60, '24-hour', 2)).toBe('Ends at 22:30');
		expect(formatPlaybackEndsAt(30 * 60, '24-hour', -3)).toBe('Ends at 17:30');
	});

	test('reaches the slot labels rather than stopping at the helper', () => {
		expect(formatPlaybackTimeSlot({
			slot: 'endsAt',
			position: 0,
			duration: 30 * 60,
			clockDisplay: '24-hour',
			timeOffsetHours: 2
		})).toBe('Ends at 22:30');
	});
});

describe('formatPlaybackTimeSlot', () => {
	const slot = (value) => formatPlaybackTimeSlot({
		slot: value,
		position: POSITION,
		duration: DURATION,
		clockDisplay: '24-hour'
	});

	test('none collapses to an empty label', () => {
		expect(slot('none')).toBe('');
	});

	test('elapsed shows how far into the item playback is', () => {
		expect(slot('elapsed')).toBe('42:10');
	});

	test('the remaining modes match the trailing labels', () => {
		expect(slot('totalDuration')).toBe('1:58:33');
		expect(slot('timeRemaining')).toBe('-1:16:23');
		expect(slot('endsAt')).toMatch(/^Ends at \d{2}:\d{2}$/);
	});

	test('time reads the clock rather than the media', () => {
		expect(slot('time')).toMatch(/^\d{2}:\d{2}$/);
	});

	test('only none renders nothing', () => {
		PLAYBACK_TIME_SLOTS.forEach((value) => {
			expect(slot(value) === '').toBe(value === 'none');
		});
	});

	// Another client can sync a slot this build has never heard of, so hiding it beats
	// guessing at a label.
	test('an unknown slot collapses rather than guessing', () => {
		expect(slot('somethingNewer')).toBe('');
	});
});
