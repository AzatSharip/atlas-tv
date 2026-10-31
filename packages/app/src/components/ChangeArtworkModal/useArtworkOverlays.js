import {useState, useEffect, useCallback} from 'react';

// Everything that can sit on top of the artwork list: the expanded category,
// the provider filter, the two confirmations and the zoom preview.
const useArtworkOverlays = ({open, resetKey}) => {
	const [focusedCategory, setFocusedCategory] = useState(null);
	const [showSourcesPopup, setShowSourcesPopup] = useState(false);
	const [previewImage, setPreviewImage] = useState(null); // {category, image}
	const [deleteConfirm, setDeleteConfirm] = useState(null); // {category, index}
	const [clearAllConfirm, setClearAllConfirm] = useState(false);

	const closeAll = useCallback(() => {
		setFocusedCategory(null);
		setShowSourcesPopup(false);
		setPreviewImage(null);
		setDeleteConfirm(null);
		setClearAllConfirm(false);
	}, []);

	useEffect(() => {
		if (open) closeAll();
	}, [open, resetKey, closeAll]);

	const openCategory = useCallback((category) => setFocusedCategory(category), []);
	const closeCategory = useCallback(() => setFocusedCategory(null), []);
	const openSources = useCallback(() => setShowSourcesPopup(true), []);
	const closeSources = useCallback(() => setShowSourcesPopup(false), []);
	const openPreview = useCallback((category, image) => setPreviewImage({category, image}), []);
	const closePreview = useCallback(() => setPreviewImage(null), []);
	const openDeleteConfirm = useCallback((category, index) => setDeleteConfirm({category, index}), []);
	const closeDeleteConfirm = useCallback(() => setDeleteConfirm(null), []);
	const openClearAllConfirm = useCallback(() => setClearAllConfirm(true), []);
	const closeClearAllConfirm = useCallback(() => setClearAllConfirm(false), []);

	return {
		focusedCategory, openCategory, closeCategory,
		showSourcesPopup, openSources, closeSources,
		previewImage, openPreview, closePreview,
		deleteConfirm, openDeleteConfirm, closeDeleteConfirm,
		clearAllConfirm, openClearAllConfirm, closeClearAllConfirm
	};
};

export default useArtworkOverlays;
