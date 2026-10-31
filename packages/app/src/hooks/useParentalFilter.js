import {useEffect, useState} from 'react';

import {getActiveParentalFilter, getBlockedRatings, subscribeParentalControls} from '../services/parentalControls';

// Both keep their identity until the list or the account changes, so they're safe to depend on.
const useParentalFilter = () => {
	const [, setVersion] = useState(0);

	useEffect(() => subscribeParentalControls(() => setVersion((version) => version + 1)), []);

	return {blockedRatings: getBlockedRatings(), parentalFilter: getActiveParentalFilter()};
};

export default useParentalFilter;
