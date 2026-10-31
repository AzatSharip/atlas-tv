const parseExtraInfo = (raw) => {
	if (!raw) return null;
	if (typeof raw === 'object') return raw;
	try {
		return JSON.parse(raw);
	} catch {
		return String(raw).slice(0, 200);
	}
};

export const summarizeAvplayTracks = (tracks, type) => {
	if (!Array.isArray(tracks)) return [];
	return tracks
		.filter((track) => !type || track.type === type)
		.map((track) => ({
			index: track.index,
			type: track.type,
			extra: parseExtraInfo(track.extra_info)
		}));
};

// just the fields that decide which render path a stream takes
export const describeSubtitleStream = (stream) => {
	if (!stream) return null;
	return {
		index: stream.index,
		codec: stream.codec,
		language: stream.language,
		isExternal: stream.isExternal,
		deliveryMethod: stream.deliveryMethod,
		isTextBased: stream.isTextBased,
		isImageBased: stream.isImageBased,
		isAss: stream.isAss,
		isBurnIn: stream.isBurnIn,
		isEmbeddedNative: stream.isEmbeddedNative,
		isForced: stream.isForced,
		isDefault: stream.isDefault
	};
};

export const describeSubtitleStreams = (streams) =>
	(Array.isArray(streams) ? streams : []).map(describeSubtitleStream);
