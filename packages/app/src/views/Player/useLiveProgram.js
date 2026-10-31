import {useState, useEffect} from 'react';
import {api as jellyfinApi, createApiForServer} from '../../services/jellyfinApi';
import {programAiringAt} from '../../utils/liveTvGuide';

const MINUTE = 60000;

// The program airing on a live channel, for the OSD's name, episode line and progress, checked
// every minute. When nothing covers now, the earliest program in the fetch stands in. A failed
// or empty fetch leaves whatever was showing.
const useLiveProgram = (item, isLiveTV) => {
	const [program, setProgram] = useState(null);

	useEffect(() => {
		setProgram(null);
		if (!isLiveTV || !item?.Id) return undefined;

		let cancelled = false;
		const apiClient = item._serverUrl
			? createApiForServer(item._serverUrl, item._serverAccessToken, item._serverUserId)
			: jellyfinApi;

		const load = async () => {
			try {
				const now = Date.now();
				const result = await apiClient.getLiveTvPrograms([item.Id], new Date(now - 30 * MINUTE), new Date(now + 180 * MINUTE));
				const programs = (result?.Items || []).filter((p) => p.StartDate && p.EndDate);
				if (cancelled || !programs.length) return;
				setProgram(programAiringAt(programs, Date.now()) || programs[0]);
			} catch {
				// The OSD keeps the program it had.
			}
		};

		load();
		const timer = setInterval(load, MINUTE);
		return () => {
			cancelled = true;
			clearInterval(timer);
		};
	}, [item, isLiveTV]);

	return program;
};

export default useLiveProgram;
