import {carouselIntervalMs} from './carouselTiming';

describe('carouselIntervalMs', () => {
	test('turns the seconds preference into milliseconds', () => {
		expect(carouselIntervalMs(true, 12, 8000)).toBe(12000);
	});

	// Zero is the one answer every caller checks for, so auto advance off has to
	// come back as zero rather than as a falsy-looking interval.
	test('reads as zero when auto advance is off, whatever the interval says', () => {
		expect(carouselIntervalMs(false, 12, 8000)).toBe(0);
		expect(carouselIntervalMs(false, undefined, undefined)).toBe(0);
	});

	test('only an explicit false turns it off, so an unset preference still runs', () => {
		expect(carouselIntervalMs(undefined, undefined, undefined)).toBe(8000);
		expect(carouselIntervalMs(true, undefined, undefined)).toBe(8000);
	});

	test('falls back to the older millisecond preference when no interval is set', () => {
		expect(carouselIntervalMs(true, undefined, 5000)).toBe(5000);
		expect(carouselIntervalMs(true, 0, 5000)).toBe(5000);
		expect(carouselIntervalMs(true, -3, 5000)).toBe(5000);
		expect(carouselIntervalMs(true, 'nonsense', 5000)).toBe(5000);
	});

	test('falls all the way back to eight seconds when neither is set', () => {
		expect(carouselIntervalMs(true, null, 0)).toBe(8000);
	});
});
