import {cleanOverview} from './overviewText';

describe('cleanOverview', () => {
	it('takes the tags out and leaves the prose', () => {
		expect(cleanOverview('A boy<br>and his <i>dog</i>.')).toBe('A boy and his dog.');
	});

	it('decodes the entities a provider leaves behind', () => {
		expect(cleanOverview('Salt &amp; Pepper')).toBe('Salt & Pepper');
		expect(cleanOverview('He said &quot;go&quot;')).toBe('He said "go"');
		expect(cleanOverview('a&nbsp;b')).toBe('a b');
	});

	it('decodes numbered entities in either base', () => {
		expect(cleanOverview('caf&#233;')).toBe('café');
		expect(cleanOverview('caf&#xe9;')).toBe('café');
	});

	it('leaves an entity it doesn\'t know exactly as it found it', () => {
		expect(cleanOverview('50 &fake; 60')).toBe('50 &fake; 60');
	});

	it('collapses a run of spaces once the entities behind them are decoded', () => {
		expect(cleanOverview('a&nbsp;&nbsp;b')).toBe('a b');
	});

	it('has nothing to say about nothing', () => {
		expect(cleanOverview('')).toBe('');
		expect(cleanOverview(null)).toBe('');
		expect(cleanOverview(undefined)).toBe('');
	});
});
