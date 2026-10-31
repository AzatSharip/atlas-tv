import {useEffect, useMemo} from 'react';
import Spotlight from '@enact/spotlight';

import {isBackKey, KEYS} from '../../utils/keys';
import {getFocusList} from './shuffleHelpers';

const ARROW_KEYS = [KEYS.LEFT, KEYS.RIGHT, KEYS.UP, KEYS.DOWN];
const SETTLE_DELAY = 50;

// The overlay covers the whole screen, so focus has to be kept inside it by
// hand. Land on the first card when results arrive, bounce anything that
// escapes back to the last known control, and route back out on the back key.
const useShuffleFocus = ({open, items, pickerMode, pickerLoading, pickerSpotlightId, lastFocusRef, onClosePicker, onClose}) => {
	const focusIds = useMemo(() => getFocusList(items), [items]);

	useEffect(() => {
		if (!open || pickerMode) return undefined;
		const timer = setTimeout(() => {
			Spotlight.focus(items.length ? 'shuffle-card-0' : lastFocusRef.current);
		}, SETTLE_DELAY);
		return () => clearTimeout(timer);
	}, [open, items, pickerMode, lastFocusRef]);

	// Waiting for the list to be on screen is what puts focus on the first entry.
	// Doing it as the picker opens only ever finds the Cancel button, since that
	// is all there is while the fetch runs. Loading finishing either way is what
	// starts this, so a failed fetch still leaves the dialog somewhere to be.
	useEffect(() => {
		if (!open || !pickerMode || pickerLoading || !pickerSpotlightId) return undefined;
		const timer = setTimeout(() => Spotlight.focus(pickerSpotlightId), SETTLE_DELAY);
		return () => clearTimeout(timer);
	}, [open, pickerMode, pickerLoading, pickerSpotlightId]);

	useEffect(() => {
		if (!open) return undefined;
		const handleKey = (e) => {
			if (isBackKey(e)) {
				e.preventDefault();
				e.stopPropagation();
				if (pickerMode) {
					onClosePicker();
				} else {
					onClose();
				}
				return;
			}

			if (pickerMode) return;
			const code = e.keyCode || e.which;
			if (!ARROW_KEYS.includes(code)) return;
			const current = Spotlight.getCurrent();
			if (!current) return;
			const currentId = current.getAttribute?.('data-spotlight-id') || '';

			if (currentId.indexOf('shuffle-card-') === 0) {
				const index = Number(currentId.replace('shuffle-card-', ''));
				// Down off a card goes to the action row rather than wherever
				// spotlight would have guessed.
				if (code === KEYS.DOWN) {
					e.preventDefault();
					e.stopPropagation();
					Spotlight.focus('shuffle-action-random');
					return;
				}
				// Right off the last card would fall out of the dialog.
				if (code === KEYS.RIGHT && index === items.length - 1) {
					e.preventDefault();
					e.stopPropagation();
					return;
				}
			}

			if (!focusIds.includes(currentId)) {
				e.preventDefault();
				e.stopPropagation();
				Spotlight.focus(lastFocusRef.current);
			}
		};

		window.addEventListener('keydown', handleKey, true);
		return () => window.removeEventListener('keydown', handleKey, true);
	}, [open, pickerMode, focusIds, items.length, lastFocusRef, onClosePicker, onClose]);
};

export default useShuffleFocus;
