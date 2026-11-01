// Position-based recovery for files. Reopen the negotiated route, never infer
// that a network stall requires expensive video encoding. Live TV has its own policy.
export const createVodRecovery = ({reopen, onFailed, now = () => Date.now(), stallMs = 30000, maxAttempts = 2}) => {
	let active = false, generation = 0, attempts = 0, pending = null;
	let position = null, progressedAt = now();
	const hold = () => {
		if (pending) generation++;
		position = null;
		progressedAt = now();
	};
	const stop = () => {
		active = false;
		generation++;
		pending = null;
		hold();
	};
	const fail = () => {
		stop();
		onFailed();
	};
	const recover = () => {
		if (!active) return Promise.resolve(false);
		if (pending) return pending;
		if (attempts >= maxAttempts) {
			fail();
			return Promise.resolve(false);
		}
		attempts++;
		const ownGeneration = generation;
		const isCurrent = () => active && generation === ownGeneration;
		// Defer the callback so even a synchronous native error sees the lock.
		const attempt = Promise.resolve().then(() => isCurrent() && reopen(isCurrent)).then(ok => {
			if (!isCurrent()) return false;
			if (!ok) fail();
			return !!ok;
		}, () => {
			if (isCurrent()) fail();
			return false;
		}).finally(() => {
			if (pending === attempt) {
				pending = null;
				hold();
			}
		});
		pending = attempt;
		return pending;
	};
	return {
		begin() { stop(); active = true; attempts = 0; },
		stop,
		hold,
		busy: () => !!pending,
		recover,
		observe({positionMs, durationMs = 0, blocked = false}) {
			if (!active) return;
			if (blocked || !Number.isFinite(positionMs) || positionMs < 0 ||
				(durationMs > 0 && durationMs - positionMs < 1000)) {
				hold();
				return;
			}
			if (pending) return;
			const time = now();
			if (position === null || positionMs !== position || time < progressedAt) {
				position = positionMs;
				progressedAt = time;
			} else if (time - progressedAt >= stallMs) {
				recover();
			}
		}
	};
};

export const fileReopenOptions = ({positionTicks, session, audioIndex, subtitleIndex, item, maxBitrate, stereoUpmixEnabled, directAllowed}) => ({
	startPositionTicks: positionTicks,
	maxBitrate,
	mediaSourceId: session?.mediaSourceId,
	audioStreamIndex: audioIndex ?? session?.audioStreamIndex,
	subtitleStreamIndex: subtitleIndex ?? session?.subtitleStreamIndex,
	enableDirectPlay: directAllowed && session?.allowDirectPlay !== false,
	enableDirectStream: directAllowed && session?.allowDirectStream !== false,
	item,
	stereoUpmixEnabled
});
