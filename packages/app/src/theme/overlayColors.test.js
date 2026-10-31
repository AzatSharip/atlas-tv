import {normalizeOverlayColorKey, resolveOverlayColor} from './overlayColors';

describe('overlay colors', () => {
	it('keeps a key it already knows', () => {
		expect(normalizeOverlayColorKey('gray')).toBe('gray');
		expect(normalizeOverlayColorKey('dark_blue')).toBe('dark_blue');
		expect(normalizeOverlayColorKey('moonfinCyan')).toBe('moonfinCyan');
		expect(resolveOverlayColor('gray')).toBe('#6B7280');
		expect(resolveOverlayColor('neonPulseMagenta')).toBe('#FF2E92');
	});

	it('accepts the other spellings a key can arrive in', () => {
		expect(normalizeOverlayColorKey('grey')).toBe('gray');
		expect(normalizeOverlayColorKey('DARKRED')).toBe('dark_red');
		expect(normalizeOverlayColorKey('neon_pulse_magenta')).toBe('neonPulseMagenta');
	});

	it('carries the hex this app used to save onto its key', () => {
		expect(normalizeOverlayColorKey('#6a0dad')).toBe('purple');
		expect(normalizeOverlayColorKey('#00a4dc')).toBe('moonfinCyan');
		expect(normalizeOverlayColorKey('#003366')).toBe('dark_blue');
	});

	it('falls back to gray for anything it cant place', () => {
		expect(normalizeOverlayColorKey('')).toBe('gray');
		expect(normalizeOverlayColorKey(undefined)).toBe('gray');
		expect(normalizeOverlayColorKey('#ffffff')).toBe('gray');
		expect(normalizeOverlayColorKey('constructor')).toBe('gray');
		expect(resolveOverlayColor('nonsense')).toBe('#6B7280');
	});
});
