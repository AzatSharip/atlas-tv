import * as playback from './playback';
import {api, createApiForServer} from './jellyfinApi';
import {getDeviceCapabilities, getDeviceProfile} from './deviceProfile';
import {fileReopenOptions} from '../views/Player/vodRecovery';

jest.mock('./jellyfinApi', () => ({
	api: {getPlaybackInfo: jest.fn(), getAncestors: jest.fn(), getAllLibraries: jest.fn(),
		getItemMediaInfo: jest.fn(), getServerInfo: jest.fn(), reportPlaybackStopped: jest.fn()},
	createApiForServer: jest.fn(), getServerType: () => 'jellyfin', getServerUrl: () => 'https://example.test',
	getApiKey: () => 'fixture', getDeviceId: () => 'test-device', getTokenParam: () => 'ApiKey'
}));
jest.mock('./deviceProfile', () => ({getDeviceProfile: jest.fn(), getDeviceCapabilities: jest.fn()}));
jest.mock('./video', () => ({getPlayMethod: () => 'DirectPlay', getMimeType: () => 'video/mp4',
	isAudioStreamPlayable: () => true, canRenderEmbeddedPgsInBand: () => false}));
jest.mock('./storage', () => ({getFromStorage: async () => ({})}));
jest.mock('./serverLogger', () => ({serverLogger: {playback: jest.fn()}}));
jest.mock('./systemVolume', () => ({getVolumeState: jest.fn(), lastVolumeState: () => null}));
jest.mock('../platform', () => ({isVega: () => false, isXbox: () => false}));

const item = {Id: 'synthetic-video', Type: 'Video'};
const source = (over = {}) => ({
	Id: 'source-a', Container: 'MP4', SupportsDirectPlay: true, SupportsDirectStream: true,
	DirectStreamUrl: '/Videos/synthetic-video/stream.mp4',
	TranscodingUrl: '/Videos/synthetic-video/master.m3u8?VideoCodec=h264&AudioCodec=ac3',
	MediaStreams: [{Type: 'Video', Codec: 'h264', Width: 2400, Height: 1080, BitRate: 20039363},
		{Type: 'Audio', Codec: 'aac', Index: 1, Channels: 2}], ...over
});
const baseProfile = {
	MaxStreamingBitrate: 80000000,
	DirectPlayProfiles: [{Type: 'Video', Container: 'mp4,mov,m4v,mkv,avi', VideoCodec: 'h264,hevc'}, {Type: 'Audio', Container: 'aac'}],
	TranscodingProfiles: [{Type: 'Video', Container: 'ts', Protocol: 'hls', VideoCodec: 'h264', AudioCodec: 'ac3', SegmentLength: '6'}],
	CodecProfiles: [{Type: 'Video', Codec: 'h264', Conditions: [{Property: 'VideoLevel', Value: '51'}]}]
};
const identity = {serverUrl: 'https://example.test', userId: 'profile-a', accessToken: 'fixture-a'};
const options = {item, maxBitrate: 30000000};
const asked = () => api.getPlaybackInfo.mock.calls.at(-1)[1];

beforeEach(async () => {
	await playback.reportStop(0);
	jest.clearAllMocks();
	jest.spyOn(console, 'log').mockImplementation(() => {});
	api.getServerInfo.mockReturnValue(identity);
	api.getAncestors.mockResolvedValue([{Id: 'nested-folder'}, {Id: 'home-library'}]);
	api.getAllLibraries.mockResolvedValue({Items: [{Id: 'home-library', CollectionType: 'homevideos'}]});
	api.getPlaybackInfo.mockResolvedValue({PlaySessionId: 'session', MediaSources: [source()]});
	api.reportPlaybackStopped.mockResolvedValue(null);
	getDeviceCapabilities.mockResolvedValue({tizenVersion: 4, nativeHls: true, uhd: true});
	getDeviceProfile.mockResolvedValue(baseProfile);
	createApiForServer.mockReturnValue(api);
	window.AtlasFolders = {preferRemuxMov: false};
});
afterEach(() => { delete window.AtlasFolders; jest.restoreAllMocks(); });

test.each(['MP4', 'mov', 'm4v'])('H264 %s from homevideos uses internal HLS despite Force Direct Play', async Container => {
	api.getPlaybackInfo.mockResolvedValue({PlaySessionId: 'session', MediaSources: [source({Container})]});
	const result = await playback.getPlaybackInfo(item.Id, {...options, forceDirectPlay: true});
	expect(result).toMatchObject({homeVideoHls: true, playMethod: 'Transcode', mimeType: 'application/x-mpegURL'});
	expect(result.url).toContain('master.m3u8');
	expect(result.url).not.toContain('Static=true');
	expect(asked()).toMatchObject({EnableDirectPlay: false, EnableDirectStream: true, MaxStreamingBitrate: 30000000, MediaSourceId: 'source-a'});
	expect(asked().DeviceProfile.DirectPlayProfiles).toEqual([{Type: 'Audio', Container: 'aac'}]);
	expect(asked().DeviceProfile.TranscodingProfiles[0]).toMatchObject({VideoCodec: 'h264', AudioCodec: 'ac3', SegmentLength: '6'});
	expect(baseProfile.DirectPlayProfiles).toHaveLength(2);
	expect(playback.getCurrentSession()).toMatchObject({homeVideoHls: true, allowDirectPlay: false, requestAllowDirectPlay: true, reportedPlayMethod: 'DirectStream', item});
});

test.each(['continue-watching', 'search', 'favorite', 'explicit-playlist', 'queue-next', 'remote', 'syncplay'])('%s needs no folder selection and keeps the caller queue', async entry => {
	const videoQueue = [item, {Id: 'next-video'}];
	const result = await playback.getPlaybackInfo(item.Id, {...options, videoQueue, entry});
	expect(result.homeVideoHls).toBe(true);
	expect(videoQueue.map(value => value.Id)).toEqual(['synthetic-video', 'next-video']);
	expect(api.getAncestors).toHaveBeenCalledWith(item.Id);
});

test('hidden but accessible homevideos are read through IncludeHidden views', async () => {
	api.getAllLibraries.mockResolvedValue({Items: [{Id: 'home-library', CollectionType: 'HomeVideos'}]});
	await playback.getPlaybackInfo(item.Id, options);
	expect(api.getAllLibraries).toHaveBeenCalledTimes(1);
	expect(asked().EnableDirectPlay).toBe(false);
});

test.each([
	['hevc', 'MP4'], ['hevc', 'MOV'], ['h264', 'AVI'], ['h264', 'MKV'], ['mpeg4', 'MP4']
])('%s in %s preserves direct playback despite stale archive flag and caller hint', async (Codec, Container) => {
	window.AtlasFolders.preferRemuxMov = true;
	api.getPlaybackInfo.mockResolvedValue({PlaySessionId: 'session', MediaSources: [source({Container, MediaStreams: [{Type: 'Video', Codec}]})]});
	const result = await playback.getPlaybackInfo(item.Id, {...options, homeVideoHls: true});
	expect(result).toMatchObject({homeVideoHls: false, playMethod: 'DirectPlay'});
	expect(api.getPlaybackInfo).toHaveBeenCalledTimes(1);
	expect(api.getAncestors).not.toHaveBeenCalled();
	expect(asked().EnableDirectPlay).toBe(true);
});

test('ordinary movie and unknown library do not inherit an archive policy', async () => {
	window.AtlasFolders.preferRemuxMov = true;
	api.getAllLibraries.mockResolvedValue({Items: [{Id: 'home-library', CollectionType: 'movies'}]});
	const result = await playback.getPlaybackInfo(item.Id, {...options, item: {...item, Type: 'Movie'}, forceDirectPlay: true});
	expect(result).toMatchObject({homeVideoHls: false, playMethod: 'DirectPlay'});
	expect(asked().EnableDirectPlay).toBe(true);
});

test.each(['source-a', 'source-b'])('uses selected version %s, ignoring contradictory item hints', async mediaSourceId => {
	const sources = [source(), source({Id: 'source-b', MediaStreams: [{Type: 'Video', Codec: 'hevc'}]})];
	api.getPlaybackInfo.mockImplementation(async (id, body) => ({PlaySessionId: 'session', MediaSources: body.EnableDirectPlay === false ? sources.filter(value => value.Id === body.MediaSourceId) : sources}));
	const result = await playback.getPlaybackInfo(item.Id, {...options, mediaSourceId, item: {...item, Container: 'AVI', MediaStreams: [{Type: 'Video', Codec: 'hevc'}]}});
	expect(result.mediaSourceId).toBe(mediaSourceId);
	expect(result.homeVideoHls).toBe(mediaSourceId === 'source-a');
});

test('sparse selected source resolves by its exact ID from fresh media info', async () => {
	api.getPlaybackInfo.mockResolvedValueOnce({PlaySessionId: 'first', MediaSources: [source({Container: undefined, MediaStreams: []})]});
	api.getItemMediaInfo.mockResolvedValue({Container: 'mov,mp4,m4a,3gp,3g2,mj2', MediaSources: [source({Id: 'other', MediaStreams: [{Type: 'Video', Codec: 'hevc'}]}), source()]});
	const result = await playback.getPlaybackInfo(item.Id, options);
	expect(result.homeVideoHls).toBe(true);
	expect(api.getItemMediaInfo).toHaveBeenCalledWith(item.Id);
});

test('H264 to HEVC to H264 in one item clears only the source-derived direct-play denial', async () => {
	const sources = [source(), source({Id: 'source-b', MediaStreams: [{Type: 'Video', Codec: 'hevc'}]})];
	api.getPlaybackInfo.mockResolvedValue({PlaySessionId: 'session', MediaSources: sources});
	for (const mediaSourceId of ['source-a', 'source-b', 'source-a']) {
		const result = await playback.getPlaybackInfo(item.Id, {...options, mediaSourceId});
		expect(result.homeVideoHls).toBe(mediaSourceId === 'source-a');
		expect(playback.getCurrentSession().allowDirectPlay).toBe(mediaSourceId === 'source-b');
	}
});

test('audio/subtitle switches and recovery retain item, HLS, source, position and bitrate', async () => {
	await playback.getPlaybackInfo(item.Id, options);
	await playback.changeAudioStream(2, 150000000);
	expect(asked()).toMatchObject({EnableDirectPlay: false, EnableDirectStream: true, AudioStreamIndex: 2, StartTimeTicks: 150000000, MaxStreamingBitrate: 30000000});
	await playback.changeSubtitleStream(-1);
	expect(asked()).toMatchObject({EnableDirectPlay: false, EnableDirectStream: true});
	const reopen = fileReopenOptions({positionTicks: 200000000, session: playback.getCurrentSession(), item, maxBitrate: 30000000, directAllowed: true});
	const result = await playback.getPlaybackInfo(item.Id, reopen);
	expect(result.homeVideoHls).toBe(true);
	expect(asked()).toMatchObject({EnableDirectPlay: false, EnableDirectStream: true, MediaSourceId: 'source-a', StartTimeTicks: 200000000});
	expect(playback.getCurrentSession().item).toEqual(item);
});

test('same item ID in a new profile reclassifies and does not inherit deny flags', async () => {
	await playback.getPlaybackInfo(item.Id, options);
	api.getServerInfo.mockReturnValue({...identity, userId: 'profile-b', accessToken: 'fixture-b'});
	api.getAllLibraries.mockResolvedValue({Items: [{Id: 'home-library', CollectionType: 'movies'}]});
	const result = await playback.getPlaybackInfo(item.Id, options);
	expect(result).toMatchObject({homeVideoHls: false, playMethod: 'DirectPlay'});
	expect(asked().EnableDirectPlay).toBe(true);
});

test('profile switch while resolving ancestors prevents the HLS request', async () => {
	api.getAncestors.mockImplementation(async () => {
		api.getServerInfo.mockReturnValue({...identity, accessToken: 'new-fixture'});
		return [{Id: 'home-library'}];
	});
	await expect(playback.getPlaybackInfo(item.Id, options)).rejects.toThrow('Session changed');
	expect(api.getPlaybackInfo).toHaveBeenCalledTimes(1);
	expect(playback.getCurrentSession()).toBeNull();
});

test('cancellation after HLS negotiation cannot install a stale session', async () => {
	let cancelled = false;
	api.getPlaybackInfo.mockImplementation(async (id, body) => {
		if (!body.EnableDirectPlay) cancelled = true;
		return {PlaySessionId: 'session', MediaSources: [source()]};
	});
	await expect(playback.getPlaybackInfo(item.Id, {...options, shouldAbort: () => cancelled})).rejects.toThrow('cancelled');
	expect(playback.getCurrentSession()).toBeNull();
});

test('missing HLS URL fails rather than playing progressive or forcing an encode retry', async () => {
	api.getPlaybackInfo.mockResolvedValue({PlaySessionId: 'session', MediaSources: [source({TranscodingUrl: undefined})]});
	await expect(playback.getPlaybackInfo(item.Id, options)).rejects.toThrow('HLS playback URL');
	expect(api.getPlaybackInfo).toHaveBeenCalledTimes(2);
	expect(asked().EnableDirectStream).toBe(true);
});

test('a server changing the pinned source during HLS negotiation is rejected', async () => {
	api.getPlaybackInfo.mockResolvedValueOnce({PlaySessionId: 'first', MediaSources: [source()]})
		.mockResolvedValueOnce({PlaySessionId: 'next', MediaSources: [source({Id: 'unexpected'})]});
	await expect(playback.getPlaybackInfo(item.Id, options)).rejects.toThrow('media source changed');
});

test('non-Tizen playback retains its existing route', async () => {
	getDeviceCapabilities.mockResolvedValue({nativeHls: true});
	const result = await playback.getPlaybackInfo(item.Id, options);
	expect(result.playMethod).toBe('DirectPlay');
	expect(api.getAncestors).not.toHaveBeenCalled();
});
