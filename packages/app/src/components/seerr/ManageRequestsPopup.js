import {memo, useCallback, useEffect} from 'react';
import Popup from '@enact/sandstone/Popup';
import Button from '@enact/sandstone/Button';
import $L from '@enact/i18n/$L';

import {LastFocusedContainer, safeFocus} from './seerrFocus';

import css from './SeerrPopups.module.less';

// Approving or declining the requests waiting on this title, for a viewer allowed to moderate.

const requestedByName = (request) => request?.requestedBy?.displayName ||
	request?.requestedBy?.username ||
	request?.requestedBy?.plexUsername ||
	$L('Unknown');

const seasonSummary = (request) => {
	const numbers = (request?.seasons || [])
		.map((s) => s.seasonNumber)
		.filter((n) => n > 0);
	if (numbers.length === 0) return '';
	return `${$L('Seasons')} ${numbers.join(', ')}`;
};

const ManageRequestRow = ({request, onResolve}) => {
	const handleApprove = useCallback(() => onResolve(request.id, true), [request.id, onResolve]);
	const handleDecline = useCallback(() => onResolve(request.id, false), [request.id, onResolve]);
	const seasons = seasonSummary(request);

	return (
		<div className={css.manageRow}>
			<div className={css.manageRowInfo}>
				<span className={css.manageRowName}>{requestedByName(request)}</span>
				<span className={css.manageRowMeta}>
					{request.is4k ? '4K' : 'HD'}{seasons ? ` · ${seasons}` : ''}
				</span>
			</div>
			<div className={css.manageRowButtons}>
				<Button className={css.manageApproveButton} onClick={handleApprove}>{$L('Approve')}</Button>
				<Button className={css.manageDeclineButton} onClick={handleDecline}>{$L('Decline')}</Button>
			</div>
		</div>
	);
};

export const ManageRequestsPopup = memo(({open, pendingRequests, title, onResolve, onClose}) => {
	useEffect(() => {
		if (!open) return;
		window.requestAnimationFrame(() => {
			safeFocus('manage-requests-list');
		});
	}, [open]);

	return (
		<Popup open={open} onClose={onClose} position="center">
			<div className={`${css.popupSurface} ${css.managePopupContent}`}>
				<h2 className={css.managePopupTitle}>{$L('Manage Requests')}</h2>
				<p className={css.managePopupSubtitle}>{title}</p>
				<LastFocusedContainer className={css.manageList} spotlightId="manage-requests-list">
					{(pendingRequests || []).map((request) => (
						<ManageRequestRow key={request.id} request={request} onResolve={onResolve} />
					))}
				</LastFocusedContainer>
				<div className={css.managePopupButtons}>
					<Button className={css.manageCloseButton} onClick={onClose}>{$L('Close')}</Button>
				</div>
			</div>
		</Popup>
	);
});
