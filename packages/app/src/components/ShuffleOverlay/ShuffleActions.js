import $L from '@enact/i18n/$L';
import Spottable from '@enact/spotlight/Spottable';

import css from './ShuffleOverlay.module.less';

/* eslint-disable react/jsx-no-bind */

const SpottableButton = Spottable('button');

// The three shuffle modes. Focusing any of them steps out of the card row, so
// they all report which one took focus.
const ShuffleActions = ({onLibraryShuffle, onRandomShuffle, onGenreShuffle, onFocusAction}) => (
	<div className={css.actions}>
		<SpottableButton
			className={css.actionBtn}
			onFocus={() => onFocusAction('shuffle-action-library')}
			onClick={onLibraryShuffle}
			spotlightId="shuffle-action-library"
		>
			{$L('LIBRARY SHUFFLE')}
		</SpottableButton>
		<SpottableButton
			className={`${css.actionBtn} ${css.actionPrimary}`}
			onFocus={() => onFocusAction('shuffle-action-random')}
			onClick={onRandomShuffle}
			spotlightId="shuffle-action-random"
		>
			{$L('RANDOM SHUFFLE')}
		</SpottableButton>
		<SpottableButton
			className={css.actionBtn}
			onFocus={() => onFocusAction('shuffle-action-genres')}
			onClick={onGenreShuffle}
			spotlightId="shuffle-action-genres"
		>
			{$L('GENRES SHUFFLE')}
		</SpottableButton>
	</div>
);

export default ShuffleActions;
