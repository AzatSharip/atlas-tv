import {normalizeLanguageCode} from './audioLanguage';

// Someone who set their languages in Jellyfin itself has never been asked for
// them here, so this client has nothing to match on and falls through to
// whichever track carries the most channels. The other clients fill the empty
// preference from the server's answer, or from the interface language when the
// server has none.

/**
 * The language preferences to store, given what the server knows and what the
 * interface is set to. Only ever fills a preference that is still empty, so a
 * choice made here is never overwritten.
 *
 * @param {Object} [settings] - the current local settings
 * @param {Object} [userConfiguration] - Configuration from the Jellyfin user
 * @param {string} [uiLanguage] - the interface language, used when the server has none
 * @param {string} [deviceLocale] - what the TV itself is set to, for an interface
 *   language left on system
 * @returns {Object} the settings to write, empty when there is nothing to fill
 */
export const seedLanguagePreferences = (settings = {}, userConfiguration = {}, uiLanguage = '', deviceLocale = '') => {
	const seeded = {};
	const interfaceLanguage = normalizeLanguageCode(uiLanguage) || normalizeLanguageCode(deviceLocale);

	const fill = (key, serverValue) => {
		if (normalizeLanguageCode(settings[key])) return;
		const value = normalizeLanguageCode(serverValue) || interfaceLanguage;
		if (value) seeded[key] = value;
	};

	fill('audioLanguage', userConfiguration.AudioLanguagePreference);
	fill('subtitleLanguage', userConfiguration.SubtitleLanguagePreference);

	return seeded;
};
