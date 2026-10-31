import {seedLanguagePreferences} from './languagePrefSeed';

describe('seedLanguagePreferences', () => {
	test('takes the languages the viewer set in Jellyfin', () => {
		expect(seedLanguagePreferences({}, {AudioLanguagePreference: 'ger', SubtitleLanguagePreference: 'eng'}, 'en-US'))
			.toEqual({audioLanguage: 'deu', subtitleLanguage: 'eng'});
	});

	test('falls back to the interface language when the server has none', () => {
		expect(seedLanguagePreferences({}, {}, 'de-DE')).toEqual({audioLanguage: 'deu', subtitleLanguage: 'deu'});
	});

	test('never overwrites a choice already made here', () => {
		const settings = {audioLanguage: 'jpn', subtitleLanguage: 'eng'};
		expect(seedLanguagePreferences(settings, {AudioLanguagePreference: 'ger'}, 'de-DE')).toEqual({});
	});

	test('fills only the side that is still empty', () => {
		expect(seedLanguagePreferences({audioLanguage: 'jpn'}, {SubtitleLanguagePreference: 'fre'}, 'en-US'))
			.toEqual({subtitleLanguage: 'fra'});
	});

	test('an interface language left on system falls through to the TV itself', () => {
		expect(seedLanguagePreferences({}, {}, 'system', 'de-DE')).toEqual({audioLanguage: 'deu', subtitleLanguage: 'deu'});
	});

	test('a placeholder is never stored as a language', () => {
		expect(seedLanguagePreferences({}, {}, 'system')).toEqual({});
		expect(seedLanguagePreferences({}, {}, 'system', 'system')).toEqual({});
	});

	test('nothing to go on means nothing is written', () => {
		expect(seedLanguagePreferences({}, {}, '')).toEqual({});
		expect(seedLanguagePreferences()).toEqual({});
	});
});
