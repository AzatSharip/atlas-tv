import {useState, useEffect} from 'react';

import {useSeerr} from '../context/SeerrContext';
import * as seerrApi from '../services/seerrApi';
import {prepareCredits} from '../utils/personCredits';
import {normalizeMediaItem} from '../utils/seerrHomeRows';

const EMPTY = [];

/**
 * The work a person is credited with beyond what the server holds a copy of.
 * Quiet when there is no metadata id or no Seerr to ask.
 */
const usePersonSeerrCredits = (tmdbId) => {
	const {isEnabled} = useSeerr();
	const [credits, setCredits] = useState(null);

	useEffect(() => {
		setCredits(null);
		if (!tmdbId || !isEnabled) return;

		let cancelled = false;
		seerrApi.getPersonCombinedCredits(tmdbId)
			.then((data) => {
				if (!cancelled) setCredits(data);
			})
			.catch(() => {});

		return () => { cancelled = true; };
	}, [tmdbId, isEnabled]);

	return {
		appearances: credits ? prepareCredits(credits.cast, {isCrew: false}).map(normalizeMediaItem) : EMPTY,
		crewCredits: credits ? prepareCredits(credits.crew, {isCrew: true}).map(normalizeMediaItem) : EMPTY,
		seerrEnabled: isEnabled
	};
};

export default usePersonSeerrCredits;
