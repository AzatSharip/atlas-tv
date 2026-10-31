import {useState, useEffect} from 'react';

import {useSettings} from '../../context/SettingsContext';
import {
	fetchSeriesMarkers,
	fetchItemMarkers,
	audioForItem,
	markerForEpisode,
	areAnimeMarkersEnabled
} from '../../services/animeMarkersApi';

// Module level so they stay referentially stable and can sit in the effect's deps.
const loadSeries = (seriesId, serverUrl) => fetchSeriesMarkers(seriesId, {serverUrl});

const loadItemAudio = (itemId, serverUrl) =>
	fetchItemMarkers([itemId], {serverUrl}).then(() => audioForItem(itemId));

// Both lookups have the same shape: stay quiet unless the feature is on, optionally wait
// so a row of cards draws before the pills arrive, and drop the answer if the id changed.
const useMarkerLookup = (id, serverUrl, delayMs, load) => {
	const {settings} = useSettings();
	const enabled = areAnimeMarkersEnabled(settings);
	const [value, setValue] = useState(null);

	useEffect(() => {
		if (!enabled || !id) {
			setValue(null);
			return undefined;
		}

		let cancelled = false;
		const ask = () => {
			load(id, serverUrl).then(result => {
				if (!cancelled) setValue(result);
			});
		};

		if (delayMs > 0) {
			const timer = setTimeout(ask, delayMs);
			return () => {
				cancelled = true;
				clearTimeout(timer);
			};
		}

		ask();
		return () => { cancelled = true; };
	}, [enabled, id, serverUrl, delayMs, load]);

	return value;
};

// Every marker for one series, keyed by episode and season id.
const useAnimeMarkers = (seriesId, {serverUrl, delayMs = 0} = {}) =>
	useMarkerLookup(seriesId, serverUrl, delayMs, loadSeries);

export const useEpisodeMarker = (episode, {serverUrl, delayMs = 0} = {}) => {
	const markers = useAnimeMarkers(episode?.SeriesId, {serverUrl, delayMs});
	return markerForEpisode(markers, episode?.Id);
};

// The subbed/dubbed verdict for a standalone item, which in practice means a movie.
export const useItemAudio = (item, {serverUrl, delayMs = 0} = {}) =>
	useMarkerLookup(item?.Id, serverUrl, delayMs, loadItemAudio);
