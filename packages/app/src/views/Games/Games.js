import {useState, useEffect, useCallback, useMemo} from 'react';
import $L from '@enact/i18n/$L';
import Spotlight from '@enact/spotlight';
import Spottable from '@enact/spotlight/Spottable';
import SpotlightContainerDecorator from '@enact/spotlight/SpotlightContainerDecorator';
import Scroller from '@enact/sandstone/Scroller';

import GameSystemCard from '../../components/GameSystemCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import * as gamesApi from '../../services/gamesApi';

import css from './Games.module.less';

const SpottableButton = Spottable('button');
const GridContainer = SpotlightContainerDecorator({enterTo: 'last-focused'}, 'div');

// Only the first few covers of a system are worth holding on to, since they are
// all the tile shows behind its name.
const PREVIEWS_PER_SYSTEM = 4;

// A game names its system in whatever case the folder used.
const systemKey = (id) => (id || '').toLowerCase();

const Games = ({library, onSelectSystem, onHome, backHandlerRef}) => {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [systems, setSystems] = useState([]);
	const [previews, setPreviews] = useState({});
	const [counts, setCounts] = useState({});

	const libraryId = library?.Id;

	useEffect(() => {
		let cancelled = false;
		if (!libraryId) {
			setLoading(false);
			return undefined;
		}
		setLoading(true);
		// The systems answer alone is enough to draw the screen, so the covers
		// follow rather than holding it up, and a system counts what the server
		// said it held until they arrive.
		gamesApi.getSystems(libraryId)
			.then((sys) => {
				if (cancelled) return;
				const list = sys || [];
				setSystems(list);
				setCounts(list.reduce((totals, system) => {
					if (system.gameCount > 0) totals[systemKey(system.id)] = system.gameCount;
					return totals;
				}, {}));
				setLoading(false);
			})
			.catch((e) => {
				if (cancelled) return;
				// A 404 means the server has no Moonfin plugin, which is worth saying plainly.
				setError(e?.status === 404
					? $L('This server does not have the server plugin installed.')
					: e?.message || $L('Failed to load games'));
				setLoading(false);
			});

		// Covers are worth having but not worth an error screen, since the list
		// they decorate is already up.
		gamesApi.getGames(libraryId)
			.then((all) => {
				if (cancelled || !all) return;
				const grouped = {};
				const totals = {};
				all.forEach((game) => {
					const key = systemKey(game.system);
					totals[key] = (totals[key] || 0) + 1;
					if (!grouped[key]) grouped[key] = [];
					if (grouped[key].length < PREVIEWS_PER_SYSTEM) grouped[key].push(game);
				});
				setPreviews(grouped);
				setCounts(totals);
			})
			.catch(() => {});
		return () => { cancelled = true; };
	}, [libraryId]);

	useEffect(() => {
		if (!backHandlerRef) return undefined;
		const handler = () => { if (onHome) onHome(); return true; };
		backHandlerRef.current = handler;
		return () => { if (backHandlerRef.current === handler) backHandlerRef.current = null; };
	}, [backHandlerRef, onHome]);

	useEffect(() => {
		if (!loading && systems.length) {
			setTimeout(() => Spotlight.focus('games-first-system'), 0);
		}
	}, [loading, systems.length]);

	const thumbUrl = useCallback((gameId) => gamesApi.gameThumbUrl(libraryId, gameId), [libraryId]);
	const handleSelect = useCallback((system) => onSelectSystem && onSelectSystem(library, system), [onSelectSystem, library]);

	// A system the server sent no games for has nothing to show.
	const visibleSystems = useMemo(
		() => systems.filter((system) => counts[systemKey(system.id)] > 0),
		[systems, counts]
	);

	if (loading) {
		return <div className={css.center}><LoadingSpinner /></div>;
	}
	if (error) {
		return <div className={css.center}><div className={css.message}>{error}</div></div>;
	}
	if (!visibleSystems.length) {
		return <div className={css.center}><div className={css.message}>{$L('No games found.')}</div></div>;
	}

	return (
		<div className={css.root}>
			<div className={css.header}>
				<SpottableButton className={css.backBtn} onClick={onHome} spotlightId="games-back-btn">
					<svg className={css.backIcon} viewBox="0 -960 960 960">
						<path d="M313-440l224 224-57 56-320-320 320-320 57 56-224 224h487v80H313Z" />
					</svg>
				</SpottableButton>
				<h1 className={css.heading}>{library?.Name || $L('Games')}</h1>
			</div>
			<Scroller className={css.scroller}>
				<GridContainer className={css.grid}>
					{visibleSystems.map((system, index) => {
						const key = systemKey(system.id);
						return (
							<div key={system.id} className={css.cell}>
								<GameSystemCard
									system={system}
									games={previews[key]}
									gameCount={counts[key]}
									thumbUrl={thumbUrl}
									spotlightId={index === 0 ? 'games-first-system' : undefined}
									onSelect={handleSelect}
								/>
							</div>
						);
					})}
				</GridContainer>
			</Scroller>
		</div>
	);
};

export default Games;
