// How long a hero banner waits before moving on, in milliseconds.
//
// Returns 0 when the viewer has turned auto advance off, so a caller only has
// to check the one value rather than remember the toggle as well. The interval
// preference is written in seconds; the older carouselSpeed it falls back to
// was already in milliseconds, and is kept for anyone who never set the newer
// one.
//
// The three preferences come in one at a time rather than as the settings
// object, so the hooks that call this keep listing exactly what they read and
// do not restart their timer every time some unrelated setting changes.
export const carouselIntervalMs = (autoAdvance, autoAdvanceInterval, carouselSpeed) => {
	if (autoAdvance === false) return 0;
	const configured = Number(autoAdvanceInterval);
	return Number.isFinite(configured) && configured > 0
		? configured * 1000
		: (carouselSpeed || 8000);
};
