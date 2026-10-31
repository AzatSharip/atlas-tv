import {useState, useEffect, useCallback, useRef} from 'react';
import $L from '@enact/i18n/$L';
import Spottable from '@enact/spotlight/Spottable';
import Spotlight from '@enact/spotlight';

import {api, getServerUrl} from '../../services/jellyfinApi';
import {confirmOffline} from '../../utils/connectionProbe';
import {OverlayContainer} from '../../utils/spotlightContainers';

import css from './NoConnection.module.less';

const SpottableButton = Spottable('button');

const NoConnection = () => {
	const [offline, setOffline] = useState(false);
	const checkingRef = useRef(false);

	// Retry asks the server again rather than reading the flag back, so a set that never
	// changes its mind still has a way through.
	const check = useCallback(async () => {
		if (checkingRef.current) return;
		checkingRef.current = true;
		try {
			setOffline(await confirmOffline({
				probe: () => api.getPublicInfo(),
				serverUrl: getServerUrl()
			}));
		} finally {
			checkingRef.current = false;
		}
	}, []);

	useEffect(() => {
		if (!navigator.onLine) check();
		const goOffline = () => check();
		const goOnline = () => setOffline(false);

		window.addEventListener('offline', goOffline);
		window.addEventListener('online', goOnline);

		return () => {
			window.removeEventListener('offline', goOffline);
			window.removeEventListener('online', goOnline);
		};
	}, [check]);

	useEffect(() => {
		if (offline) {
			setTimeout(() => Spotlight.focus('[data-spotlight-id="no-connection-retry"]'), 200);
		}
	}, [offline]);

	if (!offline) return null;

	return (
		<OverlayContainer className={css.overlay}>
			<div className={css.content}>
				<div className={css.icon}>
					<svg viewBox="0 0 24 24" width="120" height="120" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
						<line x1="1" y1="1" x2="23" y2="23" />
						<path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
						<path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
						<path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
						<path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
						<path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
						<line x1="12" y1="20" x2="12.01" y2="20" />
					</svg>
				</div>
				<h1 className={css.title}>{$L('No Internet Connection')}</h1>
				<p className={css.message}>{$L('Check your network settings and try again.')}</p>
				<SpottableButton
					className={css.retryButton}
					data-spotlight-id="no-connection-retry"
					onClick={check}
				>
					{$L('Retry')}
				</SpottableButton>
			</div>
		</OverlayContainer>
	);
};

export default NoConnection;
