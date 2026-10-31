import {useCallback, useEffect, useState} from 'react';

import {fetchThemeStoreCatalog, fetchThemeJson} from '../../services/themeStoreApi';

// The theme picker and the downloadable store behind it. The catalogue is fetched the first
// time the store is opened rather than on mount, since most viewers never go looking.
const useThemeStore = ({currentViewName, pushView, availableThemes, selectThemeById, saveStoreTheme, deleteStoreTheme}) => {
	const [themeStoreCatalog, setThemeStoreCatalog] = useState([]);
	const [themeStoreLoading, setThemeStoreLoading] = useState(false);
	const [themeStoreError, setThemeStoreError] = useState(false);
	const [themeStoreBusyId, setThemeStoreBusyId] = useState(null);

	const openThemes = useCallback(() => {
		pushView({ view: 'themes', returnFocusTo: 'setting-themeSelection' });
	}, [pushView]);

	const openThemeStore = useCallback(() => {
		pushView({ view: 'themeStore', returnFocusTo: 'setting-themeStore' });
	}, [pushView]);

	useEffect(() => {
		if (currentViewName !== 'themeStore' || themeStoreCatalog.length > 0 || themeStoreLoading) return;
		setThemeStoreLoading(true);
		setThemeStoreError(false);
		fetchThemeStoreCatalog()
			.then((list) => setThemeStoreCatalog(list))
			.catch(() => setThemeStoreError(true))
			.finally(() => setThemeStoreLoading(false));
	}, [currentViewName, themeStoreCatalog.length, themeStoreLoading]);

	// Store cards act like install and uninstall. Saving applies the theme straight away, and
	// a theme already saved is removed here, which still leaves it in the Theme picker.
	const handleStoreThemeClick = useCallback(async (entry) => {
		if (themeStoreBusyId) return;
		setThemeStoreBusyId(entry.id);
		try {
			if (availableThemes.some((t) => t.id === entry.id)) {
				await deleteStoreTheme(entry.id);
			} else {
				const raw = await fetchThemeJson(entry.file);
				const spec = await saveStoreTheme(raw);
				selectThemeById(spec.id);
			}
		} catch (e) {
			void e;
		} finally {
			setThemeStoreBusyId(null);
		}
	}, [themeStoreBusyId, availableThemes, selectThemeById, saveStoreTheme, deleteStoreTheme]);

	return {
		themeStoreCatalog,
		themeStoreLoading,
		themeStoreError,
		themeStoreBusyId,
		openThemes,
		openThemeStore,
		handleStoreThemeClick
	};
};

export default useThemeStore;
