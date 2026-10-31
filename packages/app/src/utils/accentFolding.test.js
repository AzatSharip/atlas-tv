import {foldAccents, foldForSearch} from './accentFolding';

describe('foldAccents', () => {
	test('puts an accented letter back on its base letter, upper case', () => {
		expect(foldAccents('Cançó')).toBe('CanCO');
		expect(foldAccents('Ángel')).toBe('Angel');
	});

	test('folds the letters that carry no mark of their own', () => {
		expect(foldAccents('Æ Ð Ø Þ Ł')).toBe('A D O T L');
	});

	test('leaves what it does not know exactly as it was', () => {
		expect(foldAccents('Ω Project 東京 ß')).toBe('Ω Project 東京 ß');
	});

	test('reads nothing as an empty string', () => {
		expect(foldAccents(null)).toBe('');
		expect(foldAccents(undefined)).toBe('');
	});
});

describe('foldForSearch', () => {
	test('matches whether or not the accents were typed', () => {
		expect(foldForSearch('Cançó')).toBe('canco');
		expect(foldForSearch('canço')).toBe('canco');
		expect(foldForSearch('CANCO')).toBe('canco');
	});
});
