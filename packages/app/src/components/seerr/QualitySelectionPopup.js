import {memo, useCallback} from 'react';
import Popup from '@enact/sandstone/Popup';
import Button from '@enact/sandstone/Button';
import $L from '@enact/i18n/$L';

import {MEDIA_STATUS, isUnlimitedQuota} from '../../utils/seerrStatus';

import css from './SeerrPopups.module.less';

// Asks whether a request is for HD or 4K, when the viewer is allowed to choose.

export const QualitySelectionPopup = memo(({open, title, hdStatus, status4k, canRequestHd, canRequest4k, quota, isTv, onSelect, onClose}) => {
	const getButtonLabel = useCallback((is4k, currentStatus) => {
		const quality = is4k ? '4K' : 'HD';
		if (currentStatus === MEDIA_STATUS.PENDING) return `${quality} (${$L('Pending')})`;
		if (currentStatus === MEDIA_STATUS.PROCESSING) return `${quality} (${$L('Processing')})`;
		if (currentStatus === MEDIA_STATUS.AVAILABLE) return `${quality} (${$L('Available')})`;
		if (currentStatus === MEDIA_STATUS.PARTIALLY_AVAILABLE) return `${$L('Request More')} ${quality}`;
		return `${$L('Request')} ${quality}`;
	}, []);

	const quotaBlocked = !isUnlimitedQuota(quota) &&
		(quota.restricted || (quota.remaining || 0) <= 0);

	const handleHdClick = useCallback(() => {
		if (canRequestHd && !quotaBlocked) onSelect(false);
	}, [canRequestHd, quotaBlocked, onSelect]);

	const handleFourKClick = useCallback(() => {
		if (canRequest4k && !quotaBlocked) onSelect(true);
	}, [canRequest4k, quotaBlocked, onSelect]);

	return (
		<Popup open={open} onClose={onClose} position="center">
			<div className={`${css.popupSurface} ${css.qualityPopupContent}`}>
				<h2 className={css.qualityPopupTitle}>{$L('Request')} {title}</h2>
				<p className={css.qualityPopupSubtitle}>{$L('Select quality to request')}</p>
				<div className={css.qualityButtons}>
					<Button
						className={`${css.qualityButton} ${(!canRequestHd || quotaBlocked) ? css.qualityButtonDisabled : ''}`}
						onClick={handleHdClick}
						disabled={!canRequestHd || quotaBlocked}
					>
						{getButtonLabel(false, hdStatus)}
					</Button>
					<Button
						className={`${css.qualityButton} ${(!canRequest4k || quotaBlocked) ? css.qualityButtonDisabled : ''}`}
						onClick={handleFourKClick}
						disabled={!canRequest4k || quotaBlocked}
					>
						{getButtonLabel(true, status4k)}
					</Button>
				</div>
				{!isUnlimitedQuota(quota) && (
					<p className={`${css.quotaLine} ${quotaBlocked ? css.quotaLineBlocked : ''}`}>
						{quotaBlocked
							? $L('Request limit reached')
							: (isTv
								? $L('{count} seasons remaining').replace('{count}', Math.max(quota.remaining || 0, 0))
								: $L('{count} requests remaining').replace('{count}', Math.max(quota.remaining || 0, 0)))}
					</p>
				)}
				<Button className={css.qualityCancelButton} onClick={onClose}>
					{$L('Cancel')}
				</Button>
			</div>
		</Popup>
	);
});
