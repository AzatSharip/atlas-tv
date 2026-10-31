/**
 * Whether the set has a 4K panel, and whether that panel is OLED.
 *
 * Every source here is a service call that can be refused, and a set that
 * answered nothing used to read as 1080p, which drops the advertised HEVC
 * level to 4.1 and sends every 4K file to the transcoder. So one source
 * saying yes settles it, and only a set where none of them do stays 1080p.
 *
 * @param {Object} cfg - configs from the config service
 * @param {Object} systemProperty - the system property service answer
 * @param {Object} deviceInfo - what the device info call reported
 * @returns {{isUhd: boolean, isOled: boolean}}
 */
export const resolvePanelType = (cfg = {}, systemProperty = {}, deviceInfo = {}) => {
	const isOled = cfg['tv.hw.displayType'] === 'OLED' ||
		(cfg['tv.model.moduleBackLightType'] || '').toLowerCase() === 'oled' ||
		systemProperty.OLED === 'true' ||
		deviceInfo.oled === true;

	const isUhd = cfg['tv.hw.panelResolution'] === 'UD' ||
		cfg['tv.hw.panelResolution'] === '8K' ||
		systemProperty.UHD === 'true' ||
		deviceInfo.uhd === true ||
		// The video plane runs at the panel's own size while the app is drawn at
		// 1080p, so a wide one here means a 4K panel behind it.
		deviceInfo.screenWidth >= 3840 ||
		// LG has never shipped an OLED below 4K.
		isOled;

	return {isUhd, isOled};
};
