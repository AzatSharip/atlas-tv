import {clearCapabilitiesCache, getJellyfinDeviceProfile} from '../../../platform-tizen/src/deviceProfile';
import {homeVideoHlsProfile} from './homeVideoPlayback';

test('real Tizen 4 profile keeps H264-copy eligibility and old-Tizen audio policy without global selection', async () => {
	const originalAgent = window.navigator.userAgent;
	Object.defineProperty(window.navigator, 'userAgent', {value: 'Mozilla/5.0 (SMART-TV; Linux; Tizen 4.0)', configurable: true});
	window.AtlasFolders = {preferRemuxMov: true};
	jest.spyOn(console, 'log').mockImplementation(() => {});
	try {
		clearCapabilitiesCache();
		const profile = await getJellyfinDeviceProfile();
		const mp4 = profile.DirectPlayProfiles.find(entry => entry.Type === 'Video' && entry.Container.split(',').includes('mp4'));
		expect(mp4.VideoCodec).toContain('hevc');
		const home = homeVideoHlsProfile(profile);
		const video = home.TranscodingProfiles.find(entry => entry.Type === 'Video');
		expect(video).toMatchObject({Protocol: 'hls', Container: 'ts', VideoCodec: 'h264', SegmentLength: '6', BreakOnNonKeyFrames: false});
		expect(video.AudioCodec.split(',')).not.toContain('aac');
		expect(home.CodecProfiles).toEqual(profile.CodecProfiles);
		expect(home.MaxStreamingBitrate).toBe(profile.MaxStreamingBitrate);
		expect(home.DirectPlayProfiles.every(entry => entry.Type !== 'Video')).toBe(true);
		expect(profile.DirectPlayProfiles).toContain(mp4);
	} finally {
		Object.defineProperty(window.navigator, 'userAgent', {value: originalAgent, configurable: true});
		delete window.AtlasFolders;
		clearCapabilitiesCache();
		jest.restoreAllMocks();
	}
});
