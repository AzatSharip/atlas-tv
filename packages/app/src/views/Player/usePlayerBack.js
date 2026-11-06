import {useCallback, useEffect, useRef} from 'react';

// reportStop releases its session before awaiting the network. A second Back
// used to finish first, then the original completion popped another history entry.
export default function usePlayerBack (teardown, onBack) {
	const leaving = useRef(false);
	const mounted = useRef(true);
	useEffect(() => {
		mounted.current = true;
		return () => { mounted.current = false; };
	}, []);
	return useCallback(async () => {
		if (leaving.current || !mounted.current) return;
		leaving.current = true;
		try {
			await teardown();
		} catch (error) {
			console.warn('[Player] Back cleanup failed:', error);
		} finally {
			if (mounted.current) onBack?.();
		}
	}, [teardown, onBack]);
}
