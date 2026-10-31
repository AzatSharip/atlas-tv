// Which webOS a set is running, named the way LG markets it.

const CHROME_TO_WEBOS = [
	[120, 25], [108, 24], [94, 23], [87, 22], [79, 6], [68, 5], [53, 4], [38, 3], [34, 2], [26, 1]
];

const getWebOSVersionFromChrome = (chromeVersion) => {
	for (const [chrome, webos] of CHROME_TO_WEBOS) {
		if (chromeVersion >= chrome) return webos;
	}
	return 4;
};

// Starting with webOS 7 (2022), LG uses year-based marketing names (22, 23, 24, 25...)
// but the enact SDK and internal APIs still return sequential versions (7, 8, 9, 10...).
// All capability checks in this codebase use the marketing version numbers, so we
// convert internal versions 7+ to marketing: marketing = internal + 15.
const internalToMarketingVersion = (internal) => {
	if (internal >= 7) return internal + 15;
	return internal;
};

export const detectWebOSVersion = (sdkVersion = null) => {
	if (sdkVersion) {
		const match = /^(\d+)\./.exec(sdkVersion);
		if (match) {
			const major = parseInt(match[1], 10);
			if (major >= 1) return internalToMarketingVersion(major);
		}
	}

	const ua = navigator.userAgent.toLowerCase();
	const chromeMatch = /chrome\/(\d+)/.exec(ua);
	if (chromeMatch) {
		return getWebOSVersionFromChrome(parseInt(chromeMatch[1], 10));
	}
	return 4;
};

// When the system property service leaves the SDK version out, the device info call puts the
// firmware version in its place, and firmware like 23.23.30 reads as webOS 38. It's only taken as
// the platform version when it differs from the firmware, otherwise the web engine decides.
export const platformSdkVersion = (deviceInfo) =>
	(deviceInfo.sdkVersion && deviceInfo.sdkVersion !== deviceInfo.version ? deviceInfo.sdkVersion : null);
