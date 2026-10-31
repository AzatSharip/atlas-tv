jest.mock('@enact/i18n/$L', () => ({__esModule: true, default: (str) => str}));

import {relativeTimeLabel} from './relativeTime';

const NOW = new Date('2026-09-18T12:00:00Z').getTime();
const ago = (ms) => relativeTimeLabel(new Date(NOW - ms), NOW);

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe('relativeTimeLabel', () => {
	test('anything under a minute is just now', () => {
		expect(ago(0)).toBe('Just now');
		expect(ago(59 * SECOND)).toBe('Just now');
	});

	test('the unit only changes once the next one is whole', () => {
		expect(ago(MINUTE)).toBe('1m ago');
		expect(ago(59 * MINUTE)).toBe('59m ago');
		expect(ago(HOUR)).toBe('1h ago');
		expect(ago(23 * HOUR)).toBe('23h ago');
		expect(ago(DAY)).toBe('1d ago');
	});

	test('a part of a unit is dropped rather than rounded up', () => {
		expect(ago(90 * SECOND)).toBe('1m ago');
		expect(ago(2 * DAY + 23 * HOUR)).toBe('2d ago');
	});
});
