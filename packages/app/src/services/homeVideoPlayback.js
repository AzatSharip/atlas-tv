// Resolve on the item's own authenticated API, never from the last selected card.
// No cache: a different item/server/profile or a later retry must classify afresh.
export const resolveHomeVideoHls = async (itemId, options, capabilities, api, source) => {
	if (!capabilities?.tizenVersion || !capabilities.nativeHls || options.isLiveTV ||
		options.item?.Type === 'TvChannel' || options.item?.Type === 'Audio' ||
		options.item?.MediaType === 'Audio' || options.item?.IsFolder) return false;
	if (!source?.Id) return false;
	let candidate = source;
	if (!candidate.Container || !(candidate.MediaStreams || []).some(stream => stream.Type === 'Video' && stream.Codec)) {
		const details = await api.getItemMediaInfo(itemId);
		candidate = details?.MediaSources?.find(entry => entry.Id === source.Id);
	}
	const video = candidate?.MediaStreams?.find(stream => stream.Type === 'Video');
	// Do not send old-Tizen HEVC or arbitrary AVI/MKV to its H.264 TS profile.
	if (!['mp4', 'mov', 'm4v'].includes(String(candidate?.Container).toLowerCase()) ||
		!['h264', 'avc'].includes(String(video?.Codec).toLowerCase())) return false;
	const [ancestors, views] = await Promise.all([api.getAncestors(itemId), api.getAllLibraries()]);
	if (!Array.isArray(ancestors) || !Array.isArray(views?.Items)) {
		throw new Error('Unable to resolve playback library');
	}
	const homeLibraries = new Set(views.Items
		.filter(view => String(view.CollectionType).toLowerCase() === 'homevideos')
		.map(view => view.Id));
	return ancestors.some(ancestor => homeLibraries.has(ancestor.Id));
};

export const homeVideoHlsProfile = profile => {
	const transcodingProfiles = (profile.TranscodingProfiles || []).filter(entry =>
		entry.Type !== 'Video' || String(entry.Protocol).toLowerCase() === 'hls');
	if (!transcodingProfiles.some(entry => entry.Type === 'Video')) {
		throw new Error('No HLS profile for home video');
	}
	// Keep codec/level/resolution/bitrate constraints intact. A compatible H.264
	// source can be copied into HLS; audio may need encoding on old Tizen sets.
	return {...profile,
		DirectPlayProfiles: (profile.DirectPlayProfiles || []).filter(entry => entry.Type !== 'Video'),
		TranscodingProfiles: transcodingProfiles
	};
};

export const isHlsSource = source =>
	/\.m3u8(?:[?#]|$)/i.test(source?.TranscodingUrl || '') ||
	/[?&]TranscodingProtocol=hls(?:&|$)/i.test(source?.TranscodingUrl || '');

export const samePlaybackIdentity = (left, right) =>
	left?.serverUrl === right?.serverUrl && left?.userId === right?.userId && left?.accessToken === right?.accessToken;
