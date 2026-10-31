import {languageName} from './languageNames';

describe('languageName', () => {
	it('reads both the two and three letter codes', () => {
		expect(languageName('en')).toBe('English');
		expect(languageName('eng')).toBe('English');
		expect(languageName('jpn')).toBe('Japanese');
	});

	// A few languages have two three letter spellings depending on which list the server used.
	it('takes either spelling where the lists disagree', () => {
		expect(languageName('ger')).toBe('German');
		expect(languageName('deu')).toBe('German');
		expect(languageName('fre')).toBe('French');
		expect(languageName('fra')).toBe('French');
	});

	it('ignores a region and is not fussy about case or spacing', () => {
		expect(languageName('en-US')).toBe('English');
		expect(languageName('pt_BR')).toBe('Portuguese');
		expect(languageName('  ENG  ')).toBe('English');
	});

	it('falls back to the code itself for one it does not carry', () => {
		expect(languageName('zzz')).toBe('ZZZ');
		expect(languageName('und')).toBe('Undetermined');
	});

	it('has nothing to show for a track with no language at all', () => {
		expect(languageName('')).toBeNull();
		expect(languageName(null)).toBeNull();
		expect(languageName(undefined)).toBeNull();
	});
});
