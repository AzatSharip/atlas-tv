import {useState, useEffect, useCallback, useMemo} from 'react';

import {useSettings} from '../../context/SettingsContext';
import {matchesLanguage, matchesResolution} from './artworkTypes';

// The provider, language and resolution filters applied to every remote image
// list, plus the providers actually present in the current results.
const useArtworkFilters = ({open, resetKey, remoteImages}) => {
	const {settings} = useSettings();
	const [onlyShowInterfaceLanguage, setOnlyShowInterfaceLanguage] = useState(true);
	const [deselectedSources, setDeselectedSources] = useState(new Set());
	const [selectedResolution, setSelectedResolution] = useState('All');

	// Cleared whenever the modal opens or is handed a different item, so nothing
	// carries over from the last thing that was edited.
	useEffect(() => {
		if (open) {
			setOnlyShowInterfaceLanguage(true);
			setDeselectedSources(new Set());
			setSelectedResolution('All');
		}
	}, [open, resetKey]);

	const availableSources = useMemo(() => {
		const sources = new Set();
		Object.values(remoteImages).forEach(list => {
			list.forEach(img => {
				if (img.ProviderName) sources.add(img.ProviderName);
			});
		});
		return Array.from(sources);
	}, [remoteImages]);

	const shouldShowImage = useCallback((img) => {
		if (deselectedSources.has(img.ProviderName)) return false;
		if (onlyShowInterfaceLanguage && !matchesLanguage(img, settings.uiLanguage)) return false;
		return matchesResolution(img, selectedResolution);
	}, [deselectedSources, onlyShowInterfaceLanguage, selectedResolution, settings.uiLanguage]);

	const toggleLanguageFilter = useCallback(() => {
		setOnlyShowInterfaceLanguage(prev => !prev);
	}, []);

	const toggleSource = useCallback((source) => {
		setDeselectedSources(prev => {
			const next = new Set(prev);
			if (next.has(source)) {
				next.delete(source);
			} else {
				next.add(source);
			}
			return next;
		});
	}, []);

	return {
		onlyShowInterfaceLanguage,
		toggleLanguageFilter,
		deselectedSources,
		toggleSource,
		availableSources,
		selectedResolution,
		setSelectedResolution,
		shouldShowImage
	};
};

export default useArtworkFilters;
