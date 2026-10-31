import {memo, useCallback, useEffect, useState} from 'react';
import $L from '@enact/i18n/$L';
import Spotlight from '@enact/spotlight';
import SpotlightContainerDecorator from '@enact/spotlight/SpotlightContainerDecorator';

import {isMdblistEnabled} from '../../services/mdblistApi';
import {useSettings} from '../../context/SettingsContext';
import PickerDialog from './PickerDialog';
import ShuffleActions from './ShuffleActions';
import ShuffleCards from './ShuffleCards';
import ShuffleInfoPanel from './ShuffleInfoPanel';
import useShuffleFocus from './useShuffleFocus';
import useShuffleItems from './useShuffleItems';

import css from './ShuffleOverlay.module.less';

const DialogContainer = SpotlightContainerDecorator({
	enterTo: 'default-element',
	restrict: 'self-only',
	leaveFor: {left: '', right: '', up: '', down: ''}
}, 'div');

// Both pickers stay mounted, so each needs its own id or Spotlight only keeps
// one of them.
const PICKER_SPOTLIGHT_IDS = {
	library: 'shuffle-library-picker-dialog',
	genre: 'shuffle-genre-picker-dialog'
};

const ShuffleOverlay = ({
	open,
	onClose,
	onSelectItem,
	api,
	unifiedMode,
	contentType,
	serverUrl,
	accessToken,
	originSpotlightId
}) => {
	const {settings} = useSettings();
	const [focusedCardIndex, setFocusedCardIndex] = useState(null);
	const shuffle = useShuffleItems({open, api, unifiedMode, contentType});
	const {items, selectedIndex, setSelectedIndex, pickerMode, lastFocusRef, openPicker, closePicker} = shuffle;

	useEffect(() => {
		if (open) setFocusedCardIndex(null);
	}, [open]);

	// Hand focus back to whatever opened the overlay, so closing it doesn't
	// strand the cursor on a screen that's no longer there.
	const closeAndRestore = useCallback(() => {
		onClose?.();
		const originId = originSpotlightId || 'navbar-shuffle';
		setTimeout(() => {
			if (!Spotlight.focus(originId)) Spotlight.focus('navbar-home');
		}, 0);
	}, [onClose, originSpotlightId]);

	useShuffleFocus({
		open,
		items,
		pickerMode,
		pickerLoading: shuffle.pickerLoading,
		pickerSpotlightId: PICKER_SPOTLIGHT_IDS[pickerMode],
		lastFocusRef,
		onClosePicker: closePicker,
		onClose: closeAndRestore
	});

	const handleFocusCard = useCallback((index) => {
		setFocusedCardIndex(index);
		setSelectedIndex(index);
		lastFocusRef.current = `shuffle-card-${index}`;
	}, [setSelectedIndex, lastFocusRef]);

	// First press selects the card, second one plays it.
	const handleActivateCard = useCallback((item, index) => {
		if (selectedIndex !== index) {
			setSelectedIndex(index);
			return;
		}
		onSelectItem?.(item);
		onClose?.();
	}, [selectedIndex, setSelectedIndex, onSelectItem, onClose]);

	const handleFocusAction = useCallback((spotlightId) => {
		setFocusedCardIndex(null);
		lastFocusRef.current = spotlightId;
	}, [lastFocusRef]);

	const handleLibraryShuffle = useCallback(() => openPicker('library'), [openPicker]);
	const handleGenreShuffle = useCallback(() => openPicker('genre'), [openPicker]);

	if (!open) return null;

	const selectedItem = items[selectedIndex] || null;
	const filterSummary = shuffle.activeLibrary
		? `${$L('Library')}: ${shuffle.activeLibrary._shuffleLabel || shuffle.activeLibrary.Name}`
		: shuffle.activeGenre
			? `${$L('Genre')}: ${shuffle.activeGenre}`
			: $L('All Libraries');

	return (
		<div className={css.overlay}>
			<DialogContainer className={`${css.dialog} ${pickerMode ? css.dialogDimmed : ''}`} spotlightId="shuffle-overlay-dialog">
				<div className={css.topStrip}>
					<div className={css.badge}>{$L('RANDOM SHUFFLE')}</div>
					<div className={css.filterSummary}>{filterSummary}</div>
				</div>

				<div className={css.cardsRow}>
					<ShuffleCards
						items={items}
						loading={shuffle.loading}
						error={shuffle.error}
						focusedIndex={focusedCardIndex}
						serverUrl={serverUrl}
						accessToken={accessToken}
						onRetry={shuffle.retry}
						onFocusCard={handleFocusCard}
						onActivateCard={handleActivateCard}
					/>
				</div>

				<ShuffleInfoPanel
					item={selectedItem}
					serverUrl={selectedItem?._serverUrl || serverUrl}
					mdblistEnabled={isMdblistEnabled(settings)}
				/>

				<ShuffleActions
					onLibraryShuffle={handleLibraryShuffle}
					onRandomShuffle={shuffle.reshuffle}
					onGenreShuffle={handleGenreShuffle}
					onFocusAction={handleFocusAction}
				/>
			</DialogContainer>

			<PickerDialog
				open={pickerMode === 'library'}
				title={$L('Select Library')}
				items={shuffle.pickerItems}
				loading={shuffle.pickerLoading}
				emptyLabel={$L('No libraries found')}
				onClose={closePicker}
				onPick={shuffle.pickLibrary}
				spotlightId={PICKER_SPOTLIGHT_IDS.library}
			/>
			<PickerDialog
				open={pickerMode === 'genre'}
				title={$L('Select Genre')}
				items={shuffle.pickerItems}
				loading={shuffle.pickerLoading}
				emptyLabel={$L('No genres found')}
				onClose={closePicker}
				onPick={shuffle.pickGenre}
				spotlightId={PICKER_SPOTLIGHT_IDS.genre}
			/>
		</div>
	);
};

export default memo(ShuffleOverlay);
