import {
	formatBitrate, getAudioChannels, getAudioCodec, getBitDepth, getFrameRate, getHdrType,
	getResolution, getVideoCodec
} from './mediaStreamFacts';

describe('formatBitrate', () => {
	it('steps down through the units', () => {
		expect(formatBitrate(5000000)).toBe('5.0 Mbps');
		expect(formatBitrate(128000)).toBe('128 Kbps');
		expect(formatBitrate(500)).toBe('500 bps');
	});

	it('says so when the server gave no rate', () => {
		expect(formatBitrate(0)).toBe('Unknown');
		expect(formatBitrate(undefined)).toBe('Unknown');
	});
});

describe('getHdrType', () => {
	it('names the format rather than just saying HDR', () => {
		expect(getHdrType({VideoRangeType: 'DOVI'})).toBe('Dolby Vision');
		expect(getHdrType({VideoRangeType: 'HDR10Plus'})).toBe('HDR10+');
		expect(getHdrType({VideoRangeType: 'HDR10'})).toBe('HDR10');
	});

	it('names the base layer when the panel cant decode Dolby Vision', () => {
		expect(getHdrType({VideoRangeType: 'DOVIWithELHDR10Plus'}, false)).toBe('HDR10+');
		expect(getHdrType({VideoRangeType: 'DOVIWithHDR10'}, false)).toBe('HDR10');
		expect(getHdrType({VideoRangeType: 'DOVI'}, false)).toBe('Dolby Vision');
		expect(getHdrType({VideoRangeType: 'DOVIWithELHDR10Plus'}, true)).toBe('Dolby Vision');
		expect(getHdrType({VideoRangeType: 'HDR10Plus'}, false)).toBe('HDR10+');
	});

	it('falls back to the coarse field, and to SDR when there is nothing', () => {
		expect(getHdrType({VideoRange: 'HDR'})).toBe('HDR');
		expect(getHdrType({VideoRangeType: 'SDR'})).toBe('SDR');
		expect(getHdrType({})).toBe('SDR');
		expect(getHdrType(null)).toBe('SDR');
	});
});

describe('codecs and channels', () => {
	it('spells a video codec out and keeps its profile and level', () => {
		expect(getVideoCodec({Codec: 'hevc', Profile: 'Main 10', Level: 150}))
			.toBe('HEVC (H.265) Main 10@L150');
		expect(getVideoCodec({Codec: 'h264'})).toBe('AVC (H.264)');
	});

	it('spells an audio codec out', () => {
		expect(getAudioCodec({Codec: 'eac3'})).toBe('E-AC3 (Dolby Digital Plus)');
		expect(getAudioCodec({Codec: 'truehd'})).toBe('TrueHD');
	});

	it('says channel counts the way a viewer would', () => {
		expect(getAudioChannels({Channels: 8})).toBe('7.1');
		expect(getAudioChannels({Channels: 6})).toBe('5.1');
		expect(getAudioChannels({Channels: 2})).toBe('Stereo');
		expect(getAudioChannels({Channels: 1})).toBe('Mono');
		expect(getAudioChannels({Channels: 3})).toBe('3 channels');
	});
});

// The footer leaves a line out entirely rather than printing a placeholder, so these give back
// nothing when the server was silent.
describe('the lines only the details footer reads', () => {
	it('reads what the server gave', () => {
		expect(getResolution({Width: 1920, Height: 1080})).toBe('1920 × 1080');
		expect(getFrameRate({RealFrameRate: 23.976})).toBe('23.976 fps');
		expect(getBitDepth({BitDepth: 10})).toBe('10-bit');
	});

	it('prefers the real frame rate over the average', () => {
		expect(getFrameRate({RealFrameRate: 25, AverageFrameRate: 24})).toBe('25.000 fps');
		expect(getFrameRate({AverageFrameRate: 24})).toBe('24.000 fps');
	});

	it('gives back nothing when it was not told', () => {
		expect(getResolution({Width: 1920})).toBeNull();
		expect(getFrameRate({})).toBeNull();
		expect(getBitDepth({})).toBeNull();
	});
});
