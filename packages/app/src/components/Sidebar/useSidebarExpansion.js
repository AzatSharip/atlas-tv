import {useCallback, useEffect, useRef, useState} from 'react';

// The sidebar sits collapsed until it's hovered or holds focus. Collapsing is
// the fiddly half. A blur fires before the next element is focused, so the
// check waits a frame, and a global listener catches focus jumping straight out
// of the sidebar without a blur we can see.
const useSidebarExpansion = () => {
	const [isHovered, setIsHovered] = useState(false);
	const [isFocused, setIsFocused] = useState(false);
	const [librariesOpen, setLibrariesOpen] = useState(false);
	const blurCheckRef = useRef(null);

	const collapse = useCallback(() => {
		setIsFocused(false);
		setLibrariesOpen(false);
	}, []);

	useEffect(() => {
		if (!isFocused) return undefined;
		const onGlobalFocus = () => {
			const sidebar = document.querySelector('[data-spotlight-id="navbar"]');
			if (!sidebar || !sidebar.contains(document.activeElement)) collapse();
		};
		document.addEventListener('focusin', onGlobalFocus);
		return () => document.removeEventListener('focusin', onGlobalFocus);
	}, [isFocused, collapse]);

	useEffect(() => {
		return () => window.cancelAnimationFrame(blurCheckRef.current);
	}, []);

	const onMouseEnter = useCallback(() => setIsHovered(true), []);
	const onMouseLeave = useCallback(() => setIsHovered(false), []);
	const onFocus = useCallback(() => setIsFocused(true), []);
	const onBlur = useCallback((e) => {
		const container = e.currentTarget;
		window.cancelAnimationFrame(blurCheckRef.current);
		blurCheckRef.current = window.requestAnimationFrame(() => {
			if (!container.contains(document.activeElement)) collapse();
		});
	}, [collapse]);

	const toggleLibraries = useCallback(() => setLibrariesOpen(prev => !prev), []);
	const expanded = isHovered || isFocused;

	return {
		expanded,
		librariesExpanded: expanded && librariesOpen,
		toggleLibraries,
		handlers: {onMouseEnter, onMouseLeave, onFocus, onBlur}
	};
};

export default useSidebarExpansion;
