import {resolvePanelType} from '../../../platform-webos/src/panelType';

describe('resolvePanelType', () => {
	test('reads the panel straight off the config service', () => {
		expect(resolvePanelType({'tv.hw.panelResolution': 'UD'})).toEqual({isUhd: true, isOled: false});
		expect(resolvePanelType({'tv.hw.panelResolution': '8K'})).toEqual({isUhd: true, isOled: false});
		expect(resolvePanelType({'tv.hw.panelResolution': 'UD', 'tv.hw.displayType': 'OLED'})).toEqual({isUhd: true, isOled: true});
	});

	test('falls back to the system property answer when the config service withholds the key', () => {
		expect(resolvePanelType({}, {UHD: 'true'})).toEqual({isUhd: true, isOled: false});
		expect(resolvePanelType({}, {UHD: 'true', OLED: 'true'})).toEqual({isUhd: true, isOled: true});
	});

	test('takes the flag the device info call carries', () => {
		expect(resolvePanelType({}, {}, {uhd: true})).toEqual({isUhd: true, isOled: false});
		expect(resolvePanelType({}, {}, {oled: true})).toEqual({isUhd: true, isOled: true});
	});

	test('reads a 4K panel from the video plane size when every flag is missing', () => {
		expect(resolvePanelType({}, {}, {screenWidth: 3840, screenHeight: 2160}).isUhd).toBe(true);
		expect(resolvePanelType({}, {}, {screenWidth: 7680, screenHeight: 4320}).isUhd).toBe(true);
	});

	test('an OLED panel is a 4K panel', () => {
		expect(resolvePanelType({'tv.hw.displayType': 'OLED'})).toEqual({isUhd: true, isOled: true});
		expect(resolvePanelType({'tv.model.moduleBackLightType': 'OLED'})).toEqual({isUhd: true, isOled: true});
	});

	test('a set that answers nothing at all stays 1080p', () => {
		expect(resolvePanelType()).toEqual({isUhd: false, isOled: false});
		expect(resolvePanelType({}, {}, {})).toEqual({isUhd: false, isOled: false});
	});

	test('a real 1080p set stays 1080p', () => {
		const cfg = {'tv.hw.panelResolution': 'FHD', 'tv.hw.displayType': 'LCD'};
		const deviceInfo = {uhd: false, oled: false, screenWidth: 1920, screenHeight: 1080};
		expect(resolvePanelType(cfg, {UHD: 'false', OLED: 'false'}, deviceInfo)).toEqual({isUhd: false, isOled: false});
	});

	test('a narrow screen width never outvotes a panel that answered', () => {
		// webOS draws the app itself at 1080p on every set, so a screen width of
		// 1920 says nothing about the panel behind it.
		expect(resolvePanelType({'tv.hw.panelResolution': 'UD'}, {}, {screenWidth: 1920}).isUhd).toBe(true);
	});

	test('only takes the shapes the services answer with', () => {
		expect(resolvePanelType({}, {UHD: 'false'}, {}).isUhd).toBe(false);
		expect(resolvePanelType({}, {}, {uhd: 'true'}).isUhd).toBe(false);
	});
});
