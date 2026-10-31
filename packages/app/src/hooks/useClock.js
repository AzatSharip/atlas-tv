import {useState, useEffect} from 'react';
import {useSettings} from '../context/SettingsContext';
import {formatClockTime, shiftedNow} from '../utils/clock';

// The wall clock both navigations show. Ticks once a minute, and stays idle
// when the caller has the clock hidden. Reads through shiftedNow so sets that
// report the wrong time land on the offset the viewer configured.
export function useClock(enabled = true) {
	const {settings} = useSettings();
	const [clock, setClock] = useState('');
	const {clockDisplay, timeOffsetHours} = settings;

	useEffect(() => {
		if (!enabled) return undefined;
		const tick = () => setClock(formatClockTime(shiftedNow(timeOffsetHours), clockDisplay));
		tick();
		const interval = setInterval(tick, 60000);
		return () => clearInterval(interval);
	}, [enabled, clockDisplay, timeOffsetHours]);

	return clock;
}

export default useClock;
