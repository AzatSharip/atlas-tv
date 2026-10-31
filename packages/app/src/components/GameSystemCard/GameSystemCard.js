import {memo, useCallback} from 'react';
import $L from '@enact/i18n/$L';
import Spottable from '@enact/spotlight/Spottable';

import {gameFallbackColor, hideBrokenArt} from '../../utils/gameArt';

import css from './GameSystemCard.module.less';

const SpottableDiv = Spottable('div');

// The covers the caller hands over sit behind the tile, which a dark gradient
// reads over.
const GameSystemCard = ({system, games, gameCount, thumbUrl, spotlightId, onSelect}) => {
	const previews = games || [];
	const handleSelect = useCallback(() => onSelect && onSelect(system), [onSelect, system]);

	return (
		<SpottableDiv className={css.card} spotlightId={spotlightId} onClick={handleSelect}>
			<div className={css.artwork} style={{background: gameFallbackColor(system.id)}}>
				{previews.map((game) => (
					<div key={game.id} className={css.artworkCell} style={{background: gameFallbackColor(game.id)}}>
						<img className={css.artworkImage} src={thumbUrl(game.id)} alt="" onError={hideBrokenArt} />
					</div>
				))}
			</div>
			<div className={css.scrim} />
			<div className={css.body}>
				<div className={css.iconBox}>
					<svg className={css.icon} viewBox="0 -960 960 960">
						<path d="M182-200q-51 0-79-35.5T82-322l54-356q9-56 51-89t99-33h388q57 0 99 33t51 89l54 356q7 51-21 86.5T878-200q-21 0-39-7.5T806-230L692-344H268L154-230q-15 15-33 22.5t-39 7.5Zm596-160q17 0 29.5-12.5T820-402q0-17-12.5-29.5T778-444q-17 0-29.5 12.5T736-402q0 17 12.5 29.5T778-360ZM698-500q17 0 29.5-12.5T740-542q0-17-12.5-29.5T698-584q-17 0-29.5 12.5T656-542q0 17 12.5 29.5T698-500ZM324-450q13 0 21.5-8.5T354-480v-40h40q13 0 21.5-8.5T424-550q0-13-8.5-21.5T394-580h-40v-40q0-13-8.5-21.5T324-650q-13 0-21.5 8.5T294-620v40h-40q-13 0-21.5 8.5T224-550q0 13 8.5 21.5T254-520h40v40q0 13 8.5 21.5T324-450Z" />
					</svg>
				</div>
				<div className={css.text}>
					<div className={css.name}>{system.name}</div>
					{gameCount > 0 && <div className={css.count}>{$L('{count} items').replace('{count}', gameCount)}</div>}
				</div>
				<svg className={css.chevron} viewBox="0 -960 960 960">
					<path d="M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z" />
				</svg>
			</div>
		</SpottableDiv>
	);
};

export default memo(GameSystemCard);
