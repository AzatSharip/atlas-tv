import {createVodRecovery, fileReopenOptions} from './vodRecovery';

let now, reopen, onFailed, recovery;
const settle = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
const sample = (positionMs, blocked = false, durationMs = 0) => recovery.observe({positionMs, blocked, durationMs});
beforeEach(() => {
	now = 0;
	reopen = jest.fn().mockResolvedValue(true);
	onFailed = jest.fn();
	recovery = createVodRecovery({reopen, onFailed, now: () => now});
	recovery.begin();
});

test('PLAYING with a stationary clock recovers; moving video does not', async () => {
	for (let i = 0; i < 90; i++) { now += 1000; sample(i * 1000); }
	expect(reopen).not.toHaveBeenCalled();
	now += 29999; sample(89000);
	expect(reopen).not.toHaveBeenCalled();
	now++; sample(89000); await settle();
	expect(reopen).toHaveBeenCalledTimes(1);
});

test.each(['pause', 'seek', 'background', 'group hold'])('%s gets a new grace period', async () => {
	sample(1000); now = 29000; sample(1000);
	now = 90000; sample(1000, true);
	now = 100000; sample(1000);
	now = 129999; sample(1000); await settle();
	expect(reopen).not.toHaveBeenCalled();
	now++; sample(1000); await settle();
	expect(reopen).toHaveBeenCalledTimes(1);
});

test('end of a clip and invalid position do not reopen it', async () => {
	sample(9000, false, 9500); now = 60000; sample(9000, false, 9500);
	sample(NaN); now += 60000; sample(NaN); await settle();
	expect(reopen).not.toHaveBeenCalled();
});

test('errors and polling share one pending recovery; limit survives successful reopens', async () => {
	let resolve;
	reopen.mockImplementationOnce(() => new Promise(r => { resolve = r; }));
	const first = recovery.recover(); await settle();
	expect(recovery.recover()).toBe(first);
	sample(1000); now = 90000; sample(1000);
	expect(reopen).toHaveBeenCalledTimes(1);
	resolve(true); await first;
	await recovery.recover(); await recovery.recover();
	expect(reopen).toHaveBeenCalledTimes(2);
	expect(onFailed).toHaveBeenCalledTimes(1);
	await recovery.recover(); expect(onFailed).toHaveBeenCalledTimes(1);
});

test.each([401, 403, 500])('a failed request (%i) terminates instead of escalating to encoding', async status => {
	reopen.mockRejectedValue(Object.assign(new Error('denied'), {status}));
	await recovery.recover(); await recovery.recover();
	expect(reopen).toHaveBeenCalledTimes(1);
	expect(onFailed).toHaveBeenCalledTimes(1);
});

test('leaving or changing file invalidates a pending response', async () => {
	let valid, resolve;
	reopen.mockImplementationOnce(isCurrent => {
		valid = isCurrent;
		return new Promise(r => { resolve = r; });
	});
	const old = recovery.recover(); await settle();
	recovery.stop(); expect(valid()).toBe(false);
	recovery.begin(); await recovery.recover();
	resolve(false); await old;
	expect(onFailed).not.toHaveBeenCalled();
	expect(recovery.busy()).toBe(false);
});

test('pausing during a request cancels its playback without an error or overlapping retry', async () => {
	let valid, resolve;
	reopen.mockImplementationOnce(isCurrent => {
		valid = isCurrent;
		return new Promise(r => { resolve = r; });
	});
	const old = recovery.recover(); await settle();
	recovery.hold(); expect(valid()).toBe(false);
	expect(recovery.recover()).toBe(old);
	resolve(false); await old;
	expect(onFailed).not.toHaveBeenCalled();
	expect(recovery.busy()).toBe(false);
});

test('failed preparation reports failure once and does not loop', async () => {
	reopen.mockResolvedValue(false);
	await recovery.recover(); await recovery.recover();
	expect(onFailed).toHaveBeenCalledTimes(1);
	expect(reopen).toHaveBeenCalledTimes(1);
});

test.each(['DirectPlay', 'Transcode'])('reopen retains position, tracks and restrictions for %s', playMethod => {
	const options = fileReopenOptions({positionTicks: 123000000, session: {
		playMethod, mediaSourceId: 'source', audioStreamIndex: 2, subtitleStreamIndex: 3,
		allowDirectPlay: false, allowDirectStream: true
	}, audioIndex: 0, subtitleIndex: -1, item: {Id: 'file'}, maxBitrate: 30000000, directAllowed: true});
	expect(options).toMatchObject({startPositionTicks: 123000000, audioStreamIndex: 0,
		subtitleStreamIndex: -1, mediaSourceId: 'source', maxBitrate: 30000000,
		enableDirectPlay: false, enableDirectStream: true});
	expect(options.enableTranscoding).toBeUndefined();
});
