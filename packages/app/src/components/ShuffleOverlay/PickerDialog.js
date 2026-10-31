import $L from '@enact/i18n/$L';
import Spottable from '@enact/spotlight/Spottable';
import SpotlightContainerDecorator from '@enact/spotlight/SpotlightContainerDecorator';

import css from './ShuffleOverlay.module.less';

/* eslint-disable react/jsx-no-bind */

const PickerContainer = SpotlightContainerDecorator({
	enterTo: 'default-element',
	restrict: 'self-only',
	leaveFor: {left: '', right: '', up: '', down: ''}
}, 'div');

const SpottableButton = Spottable('button');

// Shared chooser for both the library and genre shuffles. It stays mounted
// while closed so the open and close transitions can play, which is why the
// caller has to hand it a unique spotlightId.
const PickerDialog = ({open, title, items, loading, emptyLabel, onClose, onPick, spotlightId}) => {
	const overlayClassName = `${css.pickerOverlay} ${open ? css.pickerOverlayOpen : css.pickerOverlayHidden}`;
	const dialogClassName = `${css.pickerDialog} ${open ? css.pickerDialogOpen : css.pickerDialogClosed}`;

	return (
		<div aria-hidden={!open} className={overlayClassName}>
			<PickerContainer className={dialogClassName} spotlightDisabled={!open} spotlightId={spotlightId}>
				<h3 className={css.pickerTitle}>{title}</h3>
				{loading ? (
					<div className={css.pickerLoading}>{$L('Loading...')}</div>
				) : items.length === 0 ? (
					<div className={css.pickerEmpty}>{emptyLabel}</div>
				) : (
					<div className={css.pickerList}>
						{items.map((item, index) => (
							<SpottableButton
								key={item?.Id || item}
								className={`${css.pickerItem} ${index === 0 ? 'spottable-default' : ''}`}
								onClick={() => onPick(item)}
								spotlightId={`${spotlightId}-item-${index}`}
							>
								{item?._shuffleLabel || item?.Name || String(item)}
							</SpottableButton>
						))}
					</div>
				)}
				<SpottableButton className={css.pickerCancel} onClick={onClose} spotlightId={`${spotlightId}-cancel`}>
					{$L('Cancel')}
				</SpottableButton>
			</PickerContainer>
		</div>
	);
};

export default PickerDialog;
