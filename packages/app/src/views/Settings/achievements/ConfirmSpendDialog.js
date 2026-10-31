import {useEffect} from 'react';
import $L from '@enact/i18n/$L';
import Spottable from '@enact/spotlight/Spottable';
import Spotlight from '@enact/spotlight';
import SpotlightContainerDecorator from '@enact/spotlight/SpotlightContainerDecorator';

import {isBackKey, KEYS} from '../../../utils/keys';

import css from '../../../components/ClearDataDialog/ClearDataDialog.module.less';

const DialogContainer = SpotlightContainerDecorator({
	enterTo: 'default-element',
	restrict: 'self-only',
	leaveFor: {left: '', right: '', up: '', down: ''}
}, 'div');

const SpottableButton = Spottable('button');

const CANCEL_ID = 'confirm-spend-cancel-btn';
const CONFIRM_ID = 'confirm-spend-ok-btn';

// Settings binds its back key listener before this one, so it asks here and leaves the key alone
// while a confirm is up. Otherwise one press would both cancel the spend and leave the screen.
let openDialogs = 0;
export const isConfirmSpendOpen = () => openDialogs > 0;

// Asks before spending something the user only gets so many of.
const ConfirmSpendDialog = ({open, title, body, onCancel, onConfirm}) => {
	useEffect(() => {
		if (!open) return undefined;
		// The dialog mounts before Spotlight has anywhere to put focus, so it lands a moment later.
		const timer = setTimeout(() => Spotlight.focus(CANCEL_ID), 100);
		return () => clearTimeout(timer);
	}, [open]);

	useEffect(() => {
		if (!open) return undefined;
		openDialogs += 1;
		const handleKey = (e) => {
			if (isBackKey(e)) {
				e.preventDefault();
				e.stopPropagation();
				onCancel?.();
				return;
			}
			const code = e.keyCode || e.which;
			if (code === KEYS.LEFT || code === KEYS.RIGHT) {
				e.preventDefault();
				e.stopPropagation();
				const current = Spotlight.getCurrent();
				const cancel = document.querySelector(`[data-spotlight-id="${CANCEL_ID}"]`);
				const onCancelButton = current === cancel || (cancel && cancel.contains(current));
				Spotlight.focus(onCancelButton ? CONFIRM_ID : CANCEL_ID);
			} else if (code === KEYS.UP || code === KEYS.DOWN) {
				e.preventDefault();
				e.stopPropagation();
			}
		};
		window.addEventListener('keydown', handleKey, true);
		return () => {
			openDialogs -= 1;
			window.removeEventListener('keydown', handleKey, true);
		};
	}, [open, onCancel]);

	if (!open) return null;

	return (
		<div className={css.overlay}>
			<DialogContainer className={css.dialog} spotlightId="confirm-spend-dialog">
				<h2 className={css.title}>{title}</h2>
				<p className={css.message}>{body}</p>
				<div className={css.buttons}>
					<SpottableButton className={css.btn} onClick={onCancel} spotlightId={CANCEL_ID}>
						{$L('Cancel')}
					</SpottableButton>
					<SpottableButton
						className={`${css.btn} ${css.confirmBtn} spottable-default`}
						onClick={onConfirm}
						spotlightId={CONFIRM_ID}
					>
						{$L('Confirm')}
					</SpottableButton>
				</div>
			</DialogContainer>
		</div>
	);
};

export default ConfirmSpendDialog;
