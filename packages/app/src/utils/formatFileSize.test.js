import {formatFileSize} from './formatFileSize';

const MB = 1024 * 1024;

describe('formatFileSize', () => {
	it('counts in megabytes up to the last three figure size', () => {
		expect(formatFileSize(700 * MB)).toBe('700 MB');
		expect(formatFileSize(999 * MB)).toBe('999 MB');
	});

	// The switch is at 999 rather than 1024, so the first gigabyte reading is under one. That is
	// what the screen has always shown, so it stays.
	it('switches to gigabytes past that, to two places', () => {
		expect(formatFileSize(1000 * MB)).toBe('0.98 GB');
		expect(formatFileSize(4096 * MB)).toBe('4.00 GB');
	});

	it('has nothing to show for a size the server did not give', () => {
		expect(formatFileSize(0)).toBeNull();
		expect(formatFileSize(undefined)).toBeNull();
		expect(formatFileSize(-1)).toBeNull();
	});
});
