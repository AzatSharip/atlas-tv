import {memo, useEffect, useMemo} from 'react';
import Popup from '@enact/sandstone/Popup';
import Button from '@enact/sandstone/Button';
import $L from '@enact/i18n/$L';

import {safeFocus} from './seerrFocus';

import css from './SeerrPopups.module.less';

// Confirms cancelling a request that hasn't been fulfilled yet.

export const CancelRequestPopup = memo(({open, requests, title, onConfirm, onClose}) => {
	const description = useMemo(() => {
		if (!requests || requests.length === 0) return '';
		if (requests.length === 1) {
			const req = requests[0];
			const quality = req.is4k ? '4K' : 'HD';
			return $L('Cancel {quality} request for "{title}"?').replace('{quality}', quality).replace('{title}', title);
		}
		const hdCount = requests.filter(r => !r.is4k).length;
		const fourKCount = requests.filter(r => r.is4k).length;
		const parts = [];
		if (hdCount > 0) parts.push(`${hdCount} HD`);
		if (fourKCount > 0) parts.push(`${fourKCount} 4K`);
		const partsStr = parts.join(` ${$L('and')} `);
		return $L('Cancel {parts} requests for "{title}"?').replace('{parts}', partsStr).replace('{title}', title);
	}, [requests, title]);

	useEffect(() => {
		if (!open) return;
		window.requestAnimationFrame(() => {
			safeFocus('cancel-request-keep');
		});
	}, [open]);

	return (
		<Popup open={open} onClose={onClose} position="center">
			<div className={`${css.popupSurface} ${css.cancelPopupContent}`}>
				<h2 className={css.cancelPopupTitle}>{$L('Cancel Request')}</h2>
				<p className={css.cancelPopupDescription}>{description}</p>
				<div className={css.cancelButtons}>
					<Button
						className={css.cancelKeepButton}
						spotlightId="cancel-request-keep"
						onClick={onClose}
					>
						{$L('Keep Request')}
					</Button>
					<Button className={css.cancelConfirmButton} onClick={onConfirm}>
						{$L('Cancel Request')}
					</Button>
				</div>
			</div>
		</Popup>
	);
});
