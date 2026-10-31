// The sort and settings panels that sit over the favorites, genres and library grids. Back
// closes whichever is open, and opening one puts focus on its first row.

import {useCallback, useEffect, useState} from 'react';
import Spotlight from '@enact/spotlight';

const useSortSettingsPanels = ({backHandlerRef, sortFocusId, settingsFocusId, onBack, enabled = true}) => {
	const [showSortPanel, setShowSortPanel] = useState(false);
	const [showSettingsPanel, setShowSettingsPanel] = useState(false);

	const handleToggleSortPanel = useCallback(() => setShowSortPanel(prev => !prev), []);
	const handleCloseSortPanel = useCallback(() => setShowSortPanel(false), []);
	const handleToggleSettingsPanel = useCallback(() => setShowSettingsPanel(prev => !prev), []);
	const handleCloseSettingsPanel = useCallback(() => setShowSettingsPanel(false), []);

	// The panel isn't in the tree until the state lands, so the focus waits a beat for it.
	useEffect(() => {
		if (!showSortPanel) return undefined;
		const id = setTimeout(() => Spotlight.focus(sortFocusId), 100);
		return () => clearTimeout(id);
	}, [showSortPanel, sortFocusId]);

	useEffect(() => {
		if (!showSettingsPanel) return undefined;
		const id = setTimeout(() => Spotlight.focus(settingsFocusId), 100);
		return () => clearTimeout(id);
	}, [showSettingsPanel, settingsFocusId]);

	useEffect(() => {
		if (!backHandlerRef || !enabled) return undefined;

		const handler = () => {
			if (showSettingsPanel) {
				setShowSettingsPanel(false);
				return true;
			}
			if (showSortPanel) {
				setShowSortPanel(false);
				return true;
			}
			return onBack ? onBack() : false;
		};
		backHandlerRef.current = handler;

		// Only hand the slot back if it's still ours, so a late cleanup can't null out
		// whoever claimed it after us.
		return () => {
			if (backHandlerRef.current === handler) backHandlerRef.current = null;
		};
	}, [backHandlerRef, enabled, showSortPanel, showSettingsPanel, onBack]);

	return {
		showSortPanel,
		showSettingsPanel,
		handleToggleSortPanel,
		handleCloseSortPanel,
		handleToggleSettingsPanel,
		handleCloseSettingsPanel
	};
};

export default useSortSettingsPanels;
