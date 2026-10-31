// Cinema mode plays the server's configured intros ahead of a movie. Intros come back as
// ordinary items, so they ride the normal video queue with a mark on each one. The players
// read that mark to run silently into the feature and to swallow a broken intro.

export const isPreroll = (item) => item?._preroll === true;

// Anything but a pre-roll only advances when the viewer asked for it to. An
// absent setting counts as on, the way the app defaults it.
export const shouldAutoAdvance = (autoPlayEnabled, item) => autoPlayEnabled !== false || isPreroll(item);

export const nextInQueue = (videoQueue, item) => {
	if (!videoQueue?.length || !item?.Id) return null;
	const idx = videoQueue.findIndex((entry) => String(entry.Id) === String(item.Id));
	return idx >= 0 && idx < videoQueue.length - 1 ? videoQueue[idx + 1] : null;
};

// Only the caller knows whether this is a fresh start, so it decides when to ask. A failed
// lookup just means no intros, since one must never keep the film from playing.
export const fetchPrerolls = async (api, item, settings) => {
	if (!settings?.cinemaModeEnabled) return [];
	const episodesToo = settings?.cinemaModeEpisodesEnabled === true;
	if (item?.Type !== 'Movie' && !(episodesToo && item?.Type === 'Episode')) return [];
	try {
		const result = await api.getIntros(item.Id);
		return (result?.Items || [])
			.filter((intro) => intro?.Id)
			.map((intro) => ({...intro, _preroll: true}));
	} catch {
		return [];
	}
};
