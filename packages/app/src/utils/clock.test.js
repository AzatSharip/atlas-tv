import {formatClockTime, shiftedNow} from './clock';

// Built from local parts so the expected hour holds in whatever timezone this runs in.
const at = (hours, minutes) => new Date(2026, 7, 4, hours, minutes);

describe('formatClockTime', () => {
	test('pads both halves of a 24 hour face', () => {
		expect(formatClockTime(at(9, 5), '24-hour')).toBe('09:05');
		expect(formatClockTime(at(13, 45), '24-hour')).toBe('13:45');
	});

	test('drops the leading zero on a 12 hour clock but keeps it on the minute', () => {
		expect(formatClockTime(at(9, 5), '12-hour')).toBe('9:05 AM');
		expect(formatClockTime(at(21, 5), '12-hour')).toBe('9:05 PM');
	});

	test('shows midnight and noon as 12 rather than 0', () => {
		expect(formatClockTime(at(0, 7), '12-hour')).toBe('12:07 AM');
		expect(formatClockTime(at(12, 7), '12-hour')).toBe('12:07 PM');
	});

	test('anything but the 12 hour preference gets the 24 hour face', () => {
		expect(formatClockTime(at(13, 45), undefined)).toBe('13:45');
	});
});

describe('shiftedNow', () => {
	beforeEach(() => {
		jest.useFakeTimers();
		jest.setSystemTime(at(13, 5));
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	test('reads the clock as it is when there is no offset', () => {
		expect(formatClockTime(shiftedNow(0), '24-hour')).toBe('13:05');
	});

	test('treats a missing offset as no offset', () => {
		expect(formatClockTime(shiftedNow(undefined), '24-hour')).toBe('13:05');
	});

	test('moves the clock forward and back by whole hours', () => {
		expect(formatClockTime(shiftedNow(3), '24-hour')).toBe('16:05');
		expect(formatClockTime(shiftedNow(-5), '24-hour')).toBe('08:05');
	});

	// Both ends of the slider land on the same face, one over midnight and one short of it.
	test('handles either end of the range', () => {
		expect(formatClockTime(shiftedNow(12), '24-hour')).toBe('01:05');
		expect(formatClockTime(shiftedNow(-12), '24-hour')).toBe('01:05');
	});
});
