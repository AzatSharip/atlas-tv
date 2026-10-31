import {useState, useEffect, useCallback, useRef} from 'react';

/**
 * Wall clock sleep timer for the player.
 *
 * The countdown runs regardless of what the user presses, and on expiry it calls
 * onExpire, which should be the player's handleBack so the stop position is
 * reported and the platform pipeline is torn down properly.
 *
 * State lasts for the playback session only, nothing is persisted.
 */
export const SLEEP_TIMER_MINUTES = [15, 30, 45, 60, 90];

const useSleepTimer = ({onExpire, ticking = false}) => {
	// null means off, otherwise the duration originally armed, in minutes.
	const [sleepMinutes, setSleepMinutes] = useState(null);
	const [remainingSeconds, setRemainingSeconds] = useState(null);

	const timeoutRef = useRef(null);
	const intervalRef = useRef(null);
	const expiresAtRef = useRef(null);
	// Mirrored so the expiry callback never becomes a dependency of the timer
	// itself, which would restart the countdown whenever the player re-renders.
	const onExpireRef = useRef(onExpire);

	useEffect(() => {
		onExpireRef.current = onExpire;
	}, [onExpire]);

	const stopInterval = useCallback(() => {
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}
	}, []);

	const clearTimers = useCallback(() => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
		}
		stopInterval();
		expiresAtRef.current = null;
	}, [stopInterval]);

	const startSleepTimer = useCallback((minutes) => {
		clearTimers();
		if (!minutes) {
			setSleepMinutes(null);
			setRemainingSeconds(null);
			return;
		}

		const durationMs = minutes * 60 * 1000;
		expiresAtRef.current = Date.now() + durationMs;
		setSleepMinutes(minutes);

		timeoutRef.current = setTimeout(() => {
			timeoutRef.current = null;
			clearTimers();
			setSleepMinutes(null);
			setRemainingSeconds(null);
			onExpireRef.current?.();
		}, durationMs);
	}, [clearTimers]);

	// The remaining time is only ever read by the sleep panel, so the per second
	// tick runs while that panel is open and nowhere else. Leaving it running
	// would re-render the whole player once a second for the entire film.
	useEffect(() => {
		if (!ticking || !expiresAtRef.current) return undefined;
		const tick = () => {
			const left = Math.max(0, Math.round((expiresAtRef.current - Date.now()) / 1000));
			setRemainingSeconds(left);
		};
		tick();
		intervalRef.current = setInterval(tick, 1000);
		return stopInterval;
	}, [ticking, sleepMinutes, stopInterval]);

	useEffect(() => clearTimers, [clearTimers]);

	return {sleepMinutes, remainingSeconds, startSleepTimer};
};

export default useSleepTimer;
