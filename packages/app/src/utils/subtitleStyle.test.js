jest.mock('@enact/i18n/$L', () => ({__esModule: true, default: (str) => str}));

import {
	resolveSubtitleStyleSettings,
	subtitleStyleKey,
	getSubtitleTextStyle,
	getSubtitleColorOptions,
	getSubtitleShadowColorOptions,
	getSubtitleBackgroundColorOptions,
	SUBTITLE_STYLE_KEYS
} from './subtitleConstants';

const settings = {
	subtitleHdrSeparate: false,
	subtitleSize: 'medium',
	subtitleColor: '#ffffff',
	subtitleBackground: 0,
	subtitleBackgroundColor: '#000000',
	subtitleShadowColor: '#000000',
	subtitleShadowOpacity: 100,
	subtitleShadowBlur: 0.1,
	subtitleOpacity: 100,
	subtitlePosition: 'bottom',
	subtitlePositionAbsolute: 90,
	subtitleSizeHdr: 'large',
	subtitleColorHdr: '#808080',
	subtitleBackgroundHdr: 40,
	subtitleBackgroundColorHdr: '#404040',
	subtitleShadowColorHdr: '#404040',
	subtitleShadowOpacityHdr: 50,
	subtitleShadowBlurHdr: 0.5,
	subtitleOpacityHdr: 80,
	subtitlePositionHdr: 'lower',
	subtitlePositionAbsoluteHdr: 70
};

describe('resolveSubtitleStyleSettings', () => {
	it('returns the settings untouched for SDR', () => {
		expect(resolveSubtitleStyleSettings({...settings, subtitleHdrSeparate: true}, false)).toEqual(
			{...settings, subtitleHdrSeparate: true}
		);
	});

	it('returns the settings untouched for HDR while the separate style is off', () => {
		expect(resolveSubtitleStyleSettings(settings, true).subtitleColor).toBe('#ffffff');
	});

	it('overlays every HDR twin once the separate style is on', () => {
		const resolved = resolveSubtitleStyleSettings({...settings, subtitleHdrSeparate: true}, true);

		for (const key of SUBTITLE_STYLE_KEYS) {
			expect(resolved[key]).toEqual(settings[`${key}Hdr`]);
		}
	});

	it('leaves a base value in place when its HDR twin is unset', () => {
		const partial = {subtitleHdrSeparate: true, subtitleColor: '#ffffff', subtitleSize: 'medium', subtitleSizeHdr: 'large'};
		const resolved = resolveSubtitleStyleSettings(partial, true);

		expect(resolved.subtitleColor).toBe('#ffffff');
		expect(resolved.subtitleSize).toBe('large');
	});

	it('does not mutate the settings it was given', () => {
		const input = {...settings, subtitleHdrSeparate: true};
		resolveSubtitleStyleSettings(input, true);

		expect(input.subtitleColor).toBe('#ffffff');
	});

	it('survives missing settings', () => {
		expect(resolveSubtitleStyleSettings(undefined, true)).toBeUndefined();
	});
});

describe('subtitleStyleKey', () => {
	it('writes to the HDR twin only while HDR styling is active', () => {
		expect(subtitleStyleKey('subtitleColor', true)).toBe('subtitleColorHdr');
		expect(subtitleStyleKey('subtitleColor', false)).toBe('subtitleColor');
	});
});

describe('getSubtitleTextStyle through the resolver', () => {
	it('renders the HDR colour for HDR and the SDR colour otherwise', () => {
		const on = {...settings, subtitleHdrSeparate: true};

		expect(getSubtitleTextStyle(resolveSubtitleStyleSettings(on, true)).color).toBe('#808080');
		expect(getSubtitleTextStyle(resolveSubtitleStyleSettings(on, false)).color).toBe('#ffffff');
	});

	it('renders the HDR size for HDR', () => {
		const on = {...settings, subtitleHdrSeparate: true};

		expect(getSubtitleTextStyle(resolveSubtitleStyleSettings(on, true)).fontSize).toBe('52px');
	});
});

describe('the subtitle palette', () => {
	it('offers all fifteen colors for the stroke and the background', () => {
		expect(getSubtitleShadowColorOptions()).toHaveLength(15);
		expect(getSubtitleBackgroundColorOptions()).toHaveLength(15);
	});

	it('leaves Transparent out of the text fill, which would hide the text', () => {
		const fill = getSubtitleColorOptions();
		expect(fill).toHaveLength(14);
		expect(fill.some((option) => option.value === '#00000000')).toBe(false);
	});
});

describe('getSubtitleTextStyle colors', () => {
	it('keeps an opaque color as hex', () => {
		expect(getSubtitleTextStyle(settings).color).toBe('#ffffff');
	});

	it('applies the opacity slider as rgba, which older engines can read', () => {
		expect(getSubtitleTextStyle({...settings, subtitleBackground: 50}).backgroundColor).toBe('rgba(0, 0, 0, 0.5)');
	});

	it('carries a see-through color\'s own alpha under the slider', () => {
		const style = getSubtitleTextStyle({...settings, subtitleBackgroundColor: '#ffffff80', subtitleBackground: 100, subtitleColor: '#00000080'});
		expect(style.backgroundColor).toBe('rgba(255, 255, 255, 0.502)');
		expect(style.color).toBe('rgba(0, 0, 0, 0.502)');
	});

	it('draws Transparent as nothing at all', () => {
		expect(getSubtitleTextStyle({...settings, subtitleBackgroundColor: '#00000000', subtitleBackground: 100}).backgroundColor).toBe('rgba(0, 0, 0, 0)');
	});
});
