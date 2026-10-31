import {useCallback, useEffect, useRef, useState} from 'react';

import {fetchShuffleGenres, fetchShuffleLibraries, fetchRandomItems} from '../../services/shuffleOverlayService';

const ITEM_LIMIT = 5;

// Loads the random picks and the two filter pickers. Also remembers which
// control triggered the last load, so focus returns there once it settles.
const useShuffleItems = ({open, api, unifiedMode, contentType}) => {
	const [items, setItems] = useState([]);
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(false);
	const [activeLibrary, setActiveLibrary] = useState(null);
	const [activeGenre, setActiveGenre] = useState(null);
	const [pickerMode, setPickerMode] = useState('');
	const [pickerItems, setPickerItems] = useState([]);
	const [pickerLoading, setPickerLoading] = useState(false);
	const lastFocusRef = useRef('shuffle-action-random');

	const loadItems = useCallback(async ({libraryId = null, genreName = null, restoreFocusId = 'shuffle-action-random'} = {}) => {
		setLoading(true);
		setError(false);
		try {
			const result = await fetchRandomItems({api, unifiedMode, contentType, limit: ITEM_LIMIT, libraryId, genreName});
			setItems(result);
			setSelectedIndex(0);
			lastFocusRef.current = restoreFocusId;
		} catch {
			setItems([]);
			setSelectedIndex(0);
			setError(true);
		} finally {
			setLoading(false);
		}
	}, [api, contentType, unifiedMode]);

	useEffect(() => {
		if (!open) return;
		setActiveLibrary(null);
		setActiveGenre(null);
		setPickerMode('');
		setPickerItems([]);
		loadItems({libraryId: null, genreName: null});
	}, [open, loadItems]);

	const reshuffle = useCallback(() => {
		loadItems({libraryId: null, genreName: null, restoreFocusId: 'shuffle-action-random'});
	}, [loadItems]);

	const retry = useCallback(() => {
		loadItems({
			libraryId: activeLibrary?.Id || null,
			genreName: activeGenre || null,
			restoreFocusId: lastFocusRef.current
		});
	}, [activeGenre, activeLibrary?.Id, loadItems]);

	const openPicker = useCallback(async (mode) => {
		setPickerMode(mode);
		setPickerLoading(true);
		try {
			const fetcher = mode === 'library' ? fetchShuffleLibraries : fetchShuffleGenres;
			setPickerItems(await fetcher({api, unifiedMode, contentType}));
		} finally {
			setPickerLoading(false);
		}
	}, [api, contentType, unifiedMode]);

	const closePicker = useCallback(() => setPickerMode(''), []);

	const pickLibrary = useCallback((library) => {
		setActiveLibrary(library);
		setActiveGenre(null);
		setPickerMode('');
		setPickerItems([]);
		loadItems({libraryId: library.Id, genreName: null, restoreFocusId: 'shuffle-action-library'});
	}, [loadItems]);

	const pickGenre = useCallback((genreName) => {
		setActiveGenre(genreName);
		setActiveLibrary(null);
		setPickerMode('');
		setPickerItems([]);
		loadItems({libraryId: null, genreName, restoreFocusId: 'shuffle-action-genres'});
	}, [loadItems]);

	return {
		items, selectedIndex, setSelectedIndex, loading, error,
		activeLibrary, activeGenre,
		pickerMode, pickerItems, pickerLoading,
		lastFocusRef, reshuffle, retry, openPicker, closePicker, pickLibrary, pickGenre
	};
};

export default useShuffleItems;
