import {useCallback, useEffect, useState} from 'react';

import seerrApi from '../../services/seerrApi';

// Seerr keeps a watchlist per viewer, and the title arrives saying whether it is already on
// there. The button turns over as it is pressed rather than after the round trip, and goes
// back the way it was if the server turns the change down.
const useSeerrWatchlist = ({mediaId, mediaType, details}) => {
	const [onWatchlist, setOnWatchlist] = useState(false);
	const [toggling, setToggling] = useState(false);

	useEffect(() => {
		setOnWatchlist(details?.onUserWatchlist === true);
	}, [details]);

	const toggle = useCallback(async () => {
		if (toggling || !mediaId) return;
		const wasOn = onWatchlist;

		setToggling(true);
		setOnWatchlist(!wasOn);

		try {
			if (wasOn) {
				await seerrApi.removeFromWatchlist(mediaId, mediaType);
			} else {
				await seerrApi.addToWatchlist(mediaId, mediaType);
			}
		} catch (err) {
			console.error('Watchlist change failed:', err);
			setOnWatchlist(wasOn);
		} finally {
			setToggling(false);
		}
	}, [toggling, onWatchlist, mediaId, mediaType]);

	return {onWatchlist, toggleWatchlist: toggle};
};

export default useSeerrWatchlist;
