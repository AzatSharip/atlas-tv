import {normalizeServerBaseUrl} from './serverUrl';

describe('normalizeServerBaseUrl', () => {
	test('keeps an explicit scheme and drops the trailing slash', () => {
		expect(normalizeServerBaseUrl('http://192.168.1.10:8096/')).toBe('http://192.168.1.10:8096');
		expect(normalizeServerBaseUrl('HTTPS://Jelly.Example.COM')).toBe('https://jelly.example.com');
	});

	test('drops the default port for the scheme', () => {
		expect(normalizeServerBaseUrl('http://example.com:80')).toBe('http://example.com');
		expect(normalizeServerBaseUrl('https://example.com:443')).toBe('https://example.com');
		expect(normalizeServerBaseUrl('http://example.com:8096')).toBe('http://example.com:8096');
	});

	test('keeps a proxy path prefix', () => {
		expect(normalizeServerBaseUrl('https://example.com/jellyfin')).toBe('https://example.com/jellyfin');
	});

	test('drops the web client suffix people copy out of a browser', () => {
		expect(normalizeServerBaseUrl('https://example.com/web/index.html')).toBe('https://example.com');
		expect(normalizeServerBaseUrl('https://example.com/web')).toBe('https://example.com');
		expect(normalizeServerBaseUrl('https://example.com/jellyfin/web/index.html')).toBe('https://example.com/jellyfin');
	});

	test('an address typed without a scheme comes back without one', () => {
		expect(normalizeServerBaseUrl('192.168.1.10:8096')).toBe('192.168.1.10:8096');
		expect(normalizeServerBaseUrl('example.com/jellyfin/')).toBe('example.com/jellyfin');
	});

	test('brackets around an ipv6 host survive', () => {
		expect(normalizeServerBaseUrl('http://[fe80::1]:8096')).toBe('http://[fe80::1]:8096');
	});

	test('empty input gives an empty string', () => {
		expect(normalizeServerBaseUrl('')).toBe('');
		expect(normalizeServerBaseUrl('   ')).toBe('');
		expect(normalizeServerBaseUrl(null)).toBe('');
	});
});
