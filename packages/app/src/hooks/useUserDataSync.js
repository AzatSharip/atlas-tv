// Lays the newest known watched state over what a screen holds, and draws it again whenever the
// store learns something new.

import {useEffect, useMemo, useReducer} from 'react';

import * as userDataSync from '../services/userDataSync';

// Moves each time the store changes, for memos that patch several lists at once.
export const useUserDataVersion = () => {
	const [version, bump] = useReducer((count) => count + 1, 0);
	useEffect(() => userDataSync.subscribe(bump), []);
	return version;
};

// The version stands in for the store, which the memos can't see changing on their own.
export const useUserDataList = (items) => {
	const version = useUserDataVersion();
	return useMemo(() => userDataSync.applyAll(items), [items, version]); // eslint-disable-line react-hooks/exhaustive-deps
};

export const useUserDataRows = (rows) => {
	const version = useUserDataVersion();
	return useMemo(() => userDataSync.applyToRows(rows), [rows, version]); // eslint-disable-line react-hooks/exhaustive-deps
};
