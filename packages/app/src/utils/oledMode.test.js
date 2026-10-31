import {applyOledMode, crushThemeColor} from './oledMode';

describe('crushThemeColor', () => {
	test('scales the color toward black and keeps the alpha', () => {
		expect(crushThemeColor('#FF646464', 0.8)).toBe('#FF141414');
		expect(crushThemeColor('#CC1E0A3F', 1)).toBe('#CC000000');
	});

	test('accepts a color with no alpha', () => {
		expect(crushThemeColor('#646464', 0.5)).toBe('#323232');
	});

	test('leaves anything that is not a hex color alone', () => {
		expect(crushThemeColor('transparent', 1)).toBe('transparent');
		expect(crushThemeColor(undefined, 1)).toBe(undefined);
	});
});

describe('applyOledMode', () => {
	const theme = {id: 'moonfin', colors: {background: '#FF101010', surface: '#FF252525', surfaceVariant: '#FF252525', accent: '#FF00A4DC'}};

	test('crushes only the surfaces and leaves the accent', () => {
		const vivid = applyOledMode(theme, 'vivid');
		expect(vivid.colors.background).toBe('#FF000000');
		expect(vivid.colors.surface).toBe('#FF000000');
		expect(vivid.colors.accent).toBe('#FF00A4DC');
	});

	test('hands back the same theme when the mode is off or unknown', () => {
		expect(applyOledMode(theme, 'off')).toBe(theme);
		expect(applyOledMode(theme, undefined)).toBe(theme);
	});

	// The caller resolves the theme fresh every time, so leaving the original
	// untouched is what keeps one crush from landing on top of another.
	test('leaves the theme it was handed alone', () => {
		applyOledMode(theme, 'vivid');
		expect(theme.colors.surface).toBe('#FF252525');
	});
});
