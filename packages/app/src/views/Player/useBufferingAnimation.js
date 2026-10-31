import {useCallback, useEffect, useRef, useState} from 'react';

// How long after a seek lands the trickplay preview is still the thing to look at.
const SEEK_PREVIEW_GRACE = 3000;

// Whether the loading animation should show while the stream buffers. With a trickplay preview
// to look at, it stays off while a seek is picked and for a few seconds after one lands, so it
// doesn't sit on top of the preview. Call [noteSeek] whenever the viewer seeks.
const useBufferingAnimation = ({isBuffering, isSeeking, hasPreview}) => {
	const lastSeekRef = useRef(0);
	const [, setRecheck] = useState(0);

	const noteSeek = useCallback(() => {
		lastSeekRef.current = Date.now();
	}, []);

	const graceEnds = lastSeekRef.current + SEEK_PREVIEW_GRACE;
	const behindPreview = hasPreview && (isSeeking || Date.now() < graceEnds);

	// Buffering that outlasts the grace shows once it runs out, even if nothing else re-renders.
	useEffect(() => {
		const left = graceEnds - Date.now();
		if (!isBuffering || !hasPreview || isSeeking || left <= 0) return undefined;
		const timer = setTimeout(() => setRecheck((n) => n + 1), left);
		return () => clearTimeout(timer);
	}, [isBuffering, hasPreview, isSeeking, graceEnds]);

	return {showBuffering: isBuffering && !behindPreview, noteSeek};
};

export default useBufferingAnimation;
