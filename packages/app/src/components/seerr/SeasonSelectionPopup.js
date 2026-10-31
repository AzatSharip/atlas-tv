import {memo, useCallback, useEffect, useMemo, useState} from 'react';
import Popup from '@enact/sandstone/Popup';
import Button from '@enact/sandstone/Button';
import $L from '@enact/i18n/$L';

import {isUnlimitedQuota} from '../../utils/seerrStatus';
import {KEYS} from '../../utils/keys';
import {getSeasonStatusColor, getSeasonStatusLabel, isSeasonRerequestable} from '../../utils/seerrBadges';
import {LastFocusedContainer, SpottableDiv, safeFocus} from './seerrFocus';

import css from './SeerrPopups.module.less';

// Picks which seasons of a series to request. Seasons already requested are shown with what
// became of them, and only the declined and failed ones can be chosen again.

export const SeasonSelectionPopup = memo(({open, title, seasons, seasonStatusMap, quota, onConfirm, onClose}) => {
	const [selectedSeasons, setSelectedSeasons] = useState(new Set());

	const availableSeasons = useMemo(() =>
		(seasons || []).filter(s => s.seasonNumber > 0),
	[seasons]);

	const isSeasonUnavailable = useCallback((seasonNumber) => {
		const status = seasonStatusMap?.get(seasonNumber);
		return status != null && !isSeasonRerequestable(status);
	}, [seasonStatusMap]);

	useEffect(() => {
		if (open) {
			const initialSelection = new Set(
				availableSeasons
					.filter(s => !isSeasonUnavailable(s.seasonNumber))
					.map(s => s.seasonNumber)
			);
			setSelectedSeasons(initialSelection);
		}
	}, [open, availableSeasons, isSeasonUnavailable]);

	const allSelectableSeasons = useMemo(() =>
		availableSeasons.filter(s => !isSeasonUnavailable(s.seasonNumber)),
	[availableSeasons, isSeasonUnavailable]);

	const allSelected = useMemo(() =>
		allSelectableSeasons.length > 0 &&
		allSelectableSeasons.every(s => selectedSeasons.has(s.seasonNumber)),
	[allSelectableSeasons, selectedSeasons]);

	const handleToggleSeason = useCallback((e) => {
		const seasonNumber = parseInt(e.currentTarget.dataset.season, 10);
		if (isNaN(seasonNumber)) return;
		setSelectedSeasons(prev => {
			const next = new Set(prev);
			if (next.has(seasonNumber)) {
				next.delete(seasonNumber);
			} else {
				next.add(seasonNumber);
			}
			return next;
		});
	}, []);

	const handleToggleAll = useCallback(() => {
		if (allSelected) {
			setSelectedSeasons(new Set());
		} else {
			setSelectedSeasons(new Set(allSelectableSeasons.map(s => s.seasonNumber)));
		}
	}, [allSelected, allSelectableSeasons]);

	const handleConfirm = useCallback(() => {
		if (selectedSeasons.size > 0) {
			onConfirm(Array.from(selectedSeasons).sort((a, b) => a - b));
		}
	}, [selectedSeasons, onConfirm]);

	const handleSeasonListKeyDown = useCallback((e) => {
		if (e.keyCode !== KEYS.DOWN) return;

		const seasonItem = e.target.closest(`.${css.seasonCheckItem}`);
		if (!seasonItem) return;

		const seasonItems = Array.from(e.currentTarget.querySelectorAll(`.${css.seasonCheckItem}`));
		const currentIndex = seasonItems.indexOf(seasonItem);
		if (currentIndex === -1 || currentIndex < seasonItems.length - 1) return;

		e.preventDefault();
		e.stopPropagation();
		if (!safeFocus('season-request-button')) {
			safeFocus('season-cancel-button');
		}
	}, []);

	// Up from Request goes to the last season and up from Cancel goes to Request. The buttons sit
	// inside the list's container, so focusing the container would land back on the button.
	const handleRequestButtonKeyDown = useCallback((e) => {
		if (e.keyCode !== KEYS.UP) return;

		const list = e.currentTarget.closest(`.${css.seasonsList}`);
		const seasonItems = list ? list.querySelectorAll(`.${css.seasonCheckItem}`) : [];
		if (!seasonItems.length) return;
		e.preventDefault();
		e.stopPropagation();
		safeFocus(seasonItems[seasonItems.length - 1]);
	}, []);

	const handleCancelButtonKeyDown = useCallback((e) => {
		if (e.keyCode !== KEYS.UP) return;

		e.preventDefault();
		e.stopPropagation();
		safeFocus('season-request-button');
	}, []);

	// TV quota counts seasons, so the selection is capped at what remains.
	const seasonCap = isUnlimitedQuota(quota) ? Infinity : Math.max(quota.remaining || 0, 0);
	const quotaBlocked = !isUnlimitedQuota(quota) && (quota.restricted || seasonCap === 0);
	const overCap = selectedSeasons.size > seasonCap;
	const canConfirm = selectedSeasons.size > 0 && !quotaBlocked && !overCap;

	return (
		<Popup open={open} onClose={onClose} position="center">
			<div className={`${css.popupSurface} ${css.seasonPopupContent}`}>
				<h2 className={css.seasonPopupTitle}>{$L('Select Seasons')}</h2>
				<p className={css.seasonPopupSubtitle}>{title}</p>
				{!isUnlimitedQuota(quota) && (
					<p className={`${css.quotaLine} ${(quotaBlocked || overCap) ? css.quotaLineBlocked : ''}`}>
						{quotaBlocked
							? $L('Request limit reached')
							: $L('{count} seasons remaining').replace('{count}', Math.max(quota.remaining || 0, 0))}
					</p>
				)}

				<LastFocusedContainer className={css.seasonsList} spotlightId="season-selection" onKeyDown={handleSeasonListKeyDown}>
					{allSelectableSeasons.length > 1 && (
						<SpottableDiv
							className={`${css.seasonCheckItem} ${allSelected ? css.seasonCheckItemSelected : ''}`}
							onClick={handleToggleAll}
						>
							<div className={`${css.seasonCheckbox} ${allSelected ? css.seasonCheckboxChecked : ''}`}>
								{allSelected && '✓'}
							</div>
							<span className={css.seasonCheckLabel}>{$L('Select All')}</span>
						</SpottableDiv>
					)}

					{availableSeasons.map(season => {
						const seasonStatus = seasonStatusMap?.get(season.seasonNumber);
						const isUnavailable = isSeasonUnavailable(season.seasonNumber);
						const isSelected = selectedSeasons.has(season.seasonNumber);
						const statusLabel = getSeasonStatusLabel(seasonStatus);
						const statusColor = getSeasonStatusColor(seasonStatus);

						return (
							<SpottableDiv
								key={season.seasonNumber}
								className={`${css.seasonCheckItem} ${isSelected ? css.seasonCheckItemSelected : ''} ${isUnavailable ? css.seasonCheckItemUnavailable : ''}`}
								onClick={!isUnavailable ? handleToggleSeason : undefined}
								data-season={season.seasonNumber}
								disabled={isUnavailable}
							>
								<div className={`${css.seasonCheckbox} ${isSelected ? css.seasonCheckboxChecked : ''} ${isUnavailable ? css.seasonCheckboxDisabled : ''}`}>
									{isSelected && !isUnavailable && '✓'}
									{isUnavailable && '—'}
								</div>
								<div className={css.seasonCheckInfo}>
									<span className={css.seasonCheckLabel}>{season.name || `${$L('Season')} ${season.seasonNumber}`}</span>
									<span className={css.seasonCheckMeta}>
										{season.episodeCount} {season.episodeCount !== 1 ? $L('episodes') : $L('episode')}
									</span>
								</div>
								{statusLabel && (
									<span className={`${css.seasonStatusBadge} ${css[`seasonStatus${statusColor}`]}`}>
										{statusLabel}
									</span>
								)}
							</SpottableDiv>
						);
					})}

					<div className={css.seasonPopupButtons}>
						<Button
							spotlightId="season-request-button"
							className={`${css.seasonConfirmButton} ${!canConfirm ? css.seasonButtonDisabled : ''}`}
							onClick={handleConfirm}
							onKeyDown={handleRequestButtonKeyDown}
							disabled={!canConfirm}
						>
							{$L('Request')} {selectedSeasons.size} {selectedSeasons.size !== 1 ? $L('Seasons') : $L('Season')}
						</Button>
						<Button spotlightId="season-cancel-button" className={css.seasonCancelButton} onClick={onClose} onKeyDown={handleCancelButtonKeyDown}>
							{$L('Cancel')}
						</Button>
					</div>
				</LastFocusedContainer>
			</div>
		</Popup>
	);
});
