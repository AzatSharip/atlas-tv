// Where the seek bar draws a chapter mark, in milliseconds, in order and with duplicates collapsed.
// A mark at either end sits under the thumb where it rests and reads as an artifact rather than a
// chapter, so those are left out.
export const chapterMarkerPositions = (chapters, durationMs) => {
	if (!(durationMs > 0) || !chapters?.length) return [];
	const starts = [];
	for (const chapter of chapters) {
		const ticks = chapter?.startPositionTicks;
		if (typeof ticks !== 'number' || !isFinite(ticks)) continue;
		const ms = Math.floor(ticks / 10000);
		if (ms > 0 && ms < durationMs && starts.indexOf(ms) < 0) starts.push(ms);
	}
	return starts.sort((a, b) => a - b);
};
