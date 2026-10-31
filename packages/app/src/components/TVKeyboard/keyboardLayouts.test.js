import {
	lowerFor,
	upperFor,
	variantForLocale,
	alternatesFor,
	NUMBER_PAD_LAYOUT,
	NUMERIC_LAYOUT,
	keyUnitSpan,
	maxRowSpan
} from './keyboardLayouts';

describe('keyboardLayouts', () => {
	test('shifting uppercases letters and leaves actions alone', () => {
		const upper = upperFor('qwerty');
		expect(upper[0][0]).toBe('Q');
		expect(upper[1][9]).toBe('"');
		expect(upper[2][0]).toBe('SHIFT');
		expect(upper[3][0]).toBe('123');
	});

	test('azerty rearranges the letters', () => {
		expect(lowerFor('azerty')[0][0]).toBe('a');
		expect(upperFor('azerty')[0][0]).toBe('A');
		expect(upperFor('azerty')[1][9]).toBe('M');
	});

	test('qwertz swaps y and z', () => {
		expect(lowerFor('qwertz')[0][5]).toBe('z');
		expect(lowerFor('qwertz')[2][1]).toBe('y');
	});

	test('locale picks the layout variant', () => {
		expect(variantForLocale('fr-FR')).toBe('azerty');
		expect(variantForLocale('de')).toBe('qwertz');
		expect(variantForLocale('cs-CZ')).toBe('qwertz');
		expect(variantForLocale('en-US')).toBe('qwerty');
		expect(variantForLocale(undefined)).toBe('qwerty');
	});

	test('alternates exist for accented letters but not plain ones', () => {
		expect(alternatesFor('a')).toContain('à');
		expect(alternatesFor('A')).toContain('À');
		expect(alternatesFor('q')).toBeNull();
		expect(alternatesFor('SPACE')).toBeNull();
	});

	test('the number pad is a dialer with done on the last row', () => {
		expect(NUMBER_PAD_LAYOUT[0]).toEqual(['1', '2', '3']);
		expect(NUMBER_PAD_LAYOUT[4]).toEqual(['CURSORL', 'CURSORR', 'DONE']);
	});

	test('the numeric page keeps the shared bottom row shape', () => {
		expect(NUMERIC_LAYOUT[3][0]).toBe('ABC');
		expect(NUMERIC_LAYOUT[3]).toContain('SPACE');
		expect(NUMERIC_LAYOUT[3]).toContain('IME');
	});

	test('key spans stretch space and the labelled actions', () => {
		expect(keyUnitSpan('SPACE', false)).toBeCloseTo(2.4);
		expect(keyUnitSpan('DONE', false)).toBeCloseTo(1.22);
		expect(keyUnitSpan('a', false)).toBe(1);
		expect(keyUnitSpan('SPACE', true)).toBe(1);
	});

	test('the widest row drives the grid width', () => {
		const span = maxRowSpan(NUMBER_PAD_LAYOUT, true);
		expect(span).toBeCloseTo(3.2);
	});
});
