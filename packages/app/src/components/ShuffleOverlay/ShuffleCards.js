import $L from '@enact/i18n/$L';
import Spottable from '@enact/spotlight/Spottable';

import {buildItemImageUrl} from './shuffleHelpers';

import css from './ShuffleOverlay.module.less';

/* eslint-disable react/jsx-no-bind */

const SpottableButton = Spottable('button');

// The row of random picks, along with the loading, error and empty states that
// stand in for it.
const ShuffleCards = ({items, loading, error, focusedIndex, serverUrl, accessToken, onRetry, onFocusCard, onActivateCard}) => {
	if (loading) {
		return <div className={css.stateLabel}>{$L('Loading your library...')}</div>;
	}

	if (error) {
		return (
			<>
				<div className={css.stateLabel}>{$L('Unable to connect to server')}</div>
				<SpottableButton className={`${css.retryBtn} spottable-default`} onClick={onRetry} spotlightId="shuffle-retry-btn">
					{$L('Try Again')}
				</SpottableButton>
			</>
		);
	}

	if (items.length === 0) {
		return <div className={css.stateLabel}>{$L('No items found')}</div>;
	}

	return items.map((item, index) => {
		const imageUrl = buildItemImageUrl(item, serverUrl, accessToken);
		return (
			<SpottableButton
				key={`${item._serverId || 'single'}-${item.Id}-${index}`}
				className={`${css.card} ${index === focusedIndex ? css.cardActive : ''} ${index === 0 ? 'spottable-default' : ''}`}
				onFocus={() => onFocusCard(index)}
				onClick={() => onActivateCard(item, index)}
				spotlightId={`shuffle-card-${index}`}
			>
				<div className={css.cardPosterWrap}>
					{imageUrl ? (
						<img className={css.cardPoster} src={imageUrl} alt={item.Name || ''} />
					) : (
						<div className={css.posterFallback}>{item.Name?.[0] || '?'}</div>
					)}
				</div>
			</SpottableButton>
		);
	});
};

export default ShuffleCards;
