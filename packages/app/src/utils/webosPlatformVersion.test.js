import {detectWebOSVersion, platformSdkVersion} from '../../../platform-webos/src/webosVersion';

const ENGINE_WEBOS_24 = 'Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.5359.211 Safari/537.36 WebAppManager';

describe('webOS platform version', () => {
	beforeEach(() => {
		Object.defineProperty(window.navigator, 'userAgent', {value: ENGINE_WEBOS_24, configurable: true});
	});

	test('reads the platform version the system property service reports', () => {
		expect(detectWebOSVersion(platformSdkVersion({sdkVersion: '9.1.0', version: '23.23.30'}))).toBe(24);
		expect(detectWebOSVersion(platformSdkVersion({sdkVersion: '10.0.0', version: '33.10.40'}))).toBe(25);
		expect(detectWebOSVersion(platformSdkVersion({sdkVersion: '04.00.00', version: '04.10.20'}))).toBe(4);
	});

	test('leaves a firmware version standing in for the SDK version to the web engine', () => {
		expect(platformSdkVersion({sdkVersion: '23.23.30', version: '23.23.30'})).toBeNull();
		expect(detectWebOSVersion(platformSdkVersion({sdkVersion: '23.23.30', version: '23.23.30'}))).toBe(24);
	});

	test('asks the web engine when the set reported nothing', () => {
		expect(detectWebOSVersion(platformSdkVersion({}))).toBe(24);
	});
});
