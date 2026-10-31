import $L from '@enact/i18n/$L';

import {baseLayerLabel, videoRangeLabel} from './videoRange';

// How a media stream is described in words. The player's playback information panel has read these
// for a long time, and the details screen's file information footer reads the same ones, so they
// live here rather than inside the player where importing them would pull the player in too.

export const formatBitrate = (bitrate) => {
	if (!bitrate) return $L('Unknown');
	if (bitrate >= 1000000) return `${(bitrate / 1000000).toFixed(1)} Mbps`;
	if (bitrate >= 1000) return `${(bitrate / 1000).toFixed(0)} Kbps`;
	return `${bitrate} bps`;
};

// A panel that cant decode Dolby Vision shows the base layer instead, so that's the format named.
export const getHdrType = (videoStream, showsDolbyVision = true) => {
	const label = videoRangeLabel(videoStream);
	if (label !== 'Dolby Vision' || showsDolbyVision) return label;
	return baseLayerLabel(videoStream) || label;
};

export const getVideoCodec = (videoStream) => {
	if (!videoStream) return $L('Unknown');
	let codec = (videoStream.Codec || '').toUpperCase();
	if (codec === 'HEVC') codec = 'HEVC (H.265)';
	else if (codec === 'H264' || codec === 'AVC') codec = 'AVC (H.264)';
	else if (codec === 'AV1') codec = 'AV1';
	else if (codec === 'VP9') codec = 'VP9';

	if (videoStream.Profile) {
		codec += ` ${videoStream.Profile}`;
	}
	if (videoStream.Level) {
		codec += `@L${videoStream.Level}`;
	}
	return codec;
};

export const getAudioCodec = (audioStream) => {
	if (!audioStream) return $L('Unknown');
	let codec = (audioStream.Codec || '').toUpperCase();
	if (codec === 'EAC3') codec = 'E-AC3 (Dolby Digital Plus)';
	else if (codec === 'AC3') codec = 'AC3 (Dolby Digital)';
	else if (codec === 'TRUEHD') codec = 'TrueHD';
	else if (codec === 'DTS') codec = 'DTS';
	else if (codec === 'AAC') codec = 'AAC';
	else if (codec === 'FLAC') codec = 'FLAC';
	return codec;
};

export const getAudioChannels = (audioStream) => {
	if (!audioStream) return $L('Unknown');
	const channels = audioStream.Channels;
	if (!channels) return $L('Unknown');
	if (channels === 8) return '7.1';
	if (channels === 6) return '5.1';
	if (channels === 2) return $L('Stereo');
	if (channels === 1) return $L('Mono');
	return `${channels} ${$L('channels')}`;
};

// The three below are only read by the details footer. Each gives back nothing rather than a
// placeholder, because the footer leaves a line out entirely when the server did not say.

export const getResolution = (videoStream) => {
	const width = videoStream?.Width;
	const height = videoStream?.Height;
	if (!width || !height) return null;
	return `${width} × ${height}`;
};

export const getFrameRate = (videoStream) => {
	const fps = videoStream?.RealFrameRate || videoStream?.AverageFrameRate;
	if (!fps) return null;
	return `${Number(fps).toFixed(3)} fps`;
};

export const getBitDepth = (stream) => (stream?.BitDepth ? `${stream.BitDepth}-bit` : null);
