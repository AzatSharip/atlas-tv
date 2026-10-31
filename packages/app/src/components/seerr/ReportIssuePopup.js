import {memo, useCallback, useEffect, useMemo, useState} from 'react';
import Popup from '@enact/sandstone/Popup';
import Button from '@enact/sandstone/Button';
import $L from '@enact/i18n/$L';

import SpottableInput from '../SpottableInput/SpottableInput';
import {ISSUE_TYPE, getIssueTypeLabel} from '../../utils/seerrStatus';
import {LastFocusedContainer, SpottableDiv} from './seerrFocus';

import css from './SeerrPopups.module.less';

// Reports a problem with a title back to Seerr, optionally against one season or episode.

const ISSUE_TYPES = [ISSUE_TYPE.VIDEO, ISSUE_TYPE.AUDIO, ISSUE_TYPE.SUBTITLES, ISSUE_TYPE.OTHER];

export const ReportIssuePopup = memo(({open, title, isTv, seasons, onSubmit, onClose}) => {
	const [issueType, setIssueType] = useState(ISSUE_TYPE.VIDEO);
	const [season, setSeason] = useState(0);
	const [episode, setEpisode] = useState(0);
	const [message, setMessage] = useState('');
	const [submitting, setSubmitting] = useState(false);

	const seasonNumbers = useMemo(() =>
		(seasons || []).filter(s => s.seasonNumber > 0).map(s => s.seasonNumber),
	[seasons]);

	const episodeCount = useMemo(() => {
		if (season <= 0) return 0;
		const match = (seasons || []).find(s => s.seasonNumber === season);
		return match?.episodeCount || 0;
	}, [seasons, season]);

	useEffect(() => {
		if (open) {
			setIssueType(ISSUE_TYPE.VIDEO);
			setSeason(isTv && seasonNumbers.length === 1 ? seasonNumbers[0] : 0);
			setEpisode(0);
			setMessage('');
			setSubmitting(false);
		}
	}, [open, isTv, seasonNumbers]);

	const handleTypeClick = useCallback((e) => {
		const value = parseInt(e.currentTarget.dataset.type, 10);
		if (!isNaN(value)) setIssueType(value);
	}, []);

	const handleSeasonClick = useCallback((e) => {
		const value = parseInt(e.currentTarget.dataset.season, 10);
		if (isNaN(value)) return;
		setSeason(value);
		setEpisode(0);
	}, []);

	const handleEpisodeClick = useCallback((e) => {
		const value = parseInt(e.currentTarget.dataset.episode, 10);
		if (!isNaN(value)) setEpisode(value);
	}, []);

	const handleMessageChange = useCallback((e) => setMessage(e.target.value), []);

	const handleSubmit = useCallback(async () => {
		const text = message.trim();
		if (!text || submitting) return;
		setSubmitting(true);
		try {
			await onSubmit({
				issueType,
				message: text,
				problemSeason: isTv ? season : 0,
				problemEpisode: isTv && season > 0 ? episode : 0
			});
		} finally {
			setSubmitting(false);
		}
	}, [message, submitting, issueType, isTv, season, episode, onSubmit]);

	const canSubmit = message.trim().length > 0 && !submitting;

	return (
		<Popup open={open} onClose={onClose} position="center" className={css.reportPopup}>
			<div className={`${css.popupSurface} ${css.reportPopupContent}`}>
				<h2 className={css.seasonPopupTitle}>{$L('Report Issue')}</h2>
				<p className={css.seasonPopupSubtitle}>{title}</p>

				<LastFocusedContainer spotlightId="report-issue-form">
					<div className={css.reportChipRow}>
						{ISSUE_TYPES.map((type) => (
							<SpottableDiv
								key={type}
								className={`${css.reportChip} ${issueType === type ? css.reportChipSelected : ''}`}
								data-type={type}
								onClick={handleTypeClick}
							>
								{getIssueTypeLabel(type)}
							</SpottableDiv>
						))}
					</div>

					{isTv && seasonNumbers.length > 0 && (
						<>
							<p className={css.reportLabel}>{$L('Season')}</p>
							<div className={css.reportChipRow}>
								<SpottableDiv
									className={`${css.reportChip} ${season === 0 ? css.reportChipSelected : ''}`}
									data-season={0}
									onClick={handleSeasonClick}
								>
									{$L('All')}
								</SpottableDiv>
								{seasonNumbers.map((num) => (
									<SpottableDiv
										key={num}
										className={`${css.reportChip} ${season === num ? css.reportChipSelected : ''}`}
										data-season={num}
										onClick={handleSeasonClick}
									>
										{`S${num}`}
									</SpottableDiv>
								))}
							</div>
						</>
					)}

					{isTv && season > 0 && episodeCount > 0 && (
						<>
							<p className={css.reportLabel}>{$L('Episode')}</p>
							<div className={css.reportChipRow}>
								<SpottableDiv
									className={`${css.reportChip} ${episode === 0 ? css.reportChipSelected : ''}`}
									data-episode={0}
									onClick={handleEpisodeClick}
								>
									{$L('All')}
								</SpottableDiv>
								{Array.from({length: episodeCount}, (_, i) => i + 1).map((num) => (
									<SpottableDiv
										key={num}
										className={`${css.reportChip} ${episode === num ? css.reportChipSelected : ''}`}
										data-episode={num}
										onClick={handleEpisodeClick}
									>
										{`E${num}`}
									</SpottableDiv>
								))}
							</div>
						</>
					)}

					<SpottableInput
						className={css.reportInput}
						spotlightId="report-issue-message"
						placeholder={$L('Describe the issue...')}
						value={message}
						onChange={handleMessageChange}
						disabled={submitting}
					/>

					<div className={css.seasonPopupButtons}>
						<Button
							className={`${css.seasonConfirmButton} ${!canSubmit ? css.seasonButtonDisabled : ''}`}
							onClick={handleSubmit}
							disabled={!canSubmit}
						>
							{$L('Submit')}
						</Button>
						<Button className={css.seasonCancelButton} onClick={onClose}>
							{$L('Cancel')}
						</Button>
					</div>
				</LastFocusedContainer>
			</div>
		</Popup>
	);
});
