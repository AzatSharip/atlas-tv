import {useCallback, useEffect, useRef, useState} from 'react';
import $L from '@enact/i18n/$L';
import Spottable from '@enact/spotlight/Spottable';
import Spotlight from '@enact/spotlight';
import SpotlightContainerDecorator from '@enact/spotlight/SpotlightContainerDecorator';

import {isBackKey, KEYS} from '../../utils/keys';
import {clampRating, displayRatingLikes, personalRatingOf, starsFromRating} from '../../utils/personalRating';
import {RATING_ICON_PATHS} from '../icons/ratingIcons';
import {iconViewBox} from '../icons/iconViewBox';

import dialogCss from '../ClearDataDialog/ClearDataDialog.module.less';
import css from './PersonalRatingDialog.module.less';

const DialogContainer = SpotlightContainerDecorator({
	enterTo: 'default-element',
	restrict: 'self-only',
	leaveFor: {left: '', right: '', up: '', down: ''}
}, 'div');

const SpottableButton = Spottable('button');
const SpottableDiv = Spottable('div');

const Glyph = ({path}) => (
	<svg viewBox={iconViewBox(path)} aria-hidden="true"><path d={path} /></svg>
);

const STAR_STEP = 0.5;

// The viewer's own rating of a title. Which control it offers comes from the
// rating style setting, and every one of them saves to the same score the server
// keeps.
const PersonalRatingDialog = ({open, style, userData, onSetThumbRating, onSetNumericRating, onClearRating, onClose}) => {
	const savedRating = personalRatingOf(userData);
	const savedLikes = displayRatingLikes(userData);
	const [draft, setDraft] = useState(0);
	const savingRef = useRef(false);

	useEffect(() => {
		if (!open) return;
		setDraft(clampRating(savedRating ?? 0));
		savingRef.current = false;
		// The saved rating is only read as the dialog opens, since editing it after
		// that is the whole point.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open]);

	useEffect(() => {
		if (!open) return undefined;
		const timer = setTimeout(() => {
			Spotlight.focus('personal-rating-dialog');
		}, 100);
		return () => clearTimeout(timer);
	}, [open]);

	// One save at a time, so a repeated press cant send the same rating twice.
	const submit = useCallback(async (mutation) => {
		if (savingRef.current) return;
		savingRef.current = true;
		try {
			await mutation();
			onClose?.();
		} catch {
			savingRef.current = false;
		}
	}, [onClose]);

	const handleLike = useCallback(() => submit(() => onSetThumbRating(true)), [submit, onSetThumbRating]);
	const handleDislike = useCallback(() => submit(() => onSetThumbRating(false)), [submit, onSetThumbRating]);
	const handleClear = useCallback(() => submit(() => onClearRating()), [submit, onClearRating]);
	const handleSave = useCallback(() => submit(() => onSetNumericRating(draft)), [submit, onSetNumericRating, draft]);

	const adjust = useCallback((direction) => {
		setDraft((prev) => clampRating(prev + (direction * STAR_STEP)));
	}, []);

	// A whole point at a time, landing on a round number when the score arrived
	// with a half point on it from the stars.
	const handleStepDown = useCallback(() => {
		setDraft((prev) => clampRating(Math.ceil(prev) - 1));
	}, []);

	const handleStepUp = useCallback(() => {
		setDraft((prev) => clampRating(Math.floor(prev) + 1));
	}, []);

	const handleKeyDown = useCallback((e) => {
		if (!isBackKey(e)) return;
		e.preventDefault();
		e.stopPropagation();
		onClose?.();
	}, [onClose]);

	// The five stars are one control, so left and right set the rating while the
	// strip holds focus. The handler rides on the strip rather than the dialog
	// because that is what tells us the press landed there. A ref would not, since
	// a Spottable hands back its component instead of its element.
	const handleStarsKeyDown = useCallback((e) => {
		if (savingRef.current) return;
		const code = e.keyCode || e.which;
		if (code !== KEYS.LEFT && code !== KEYS.RIGHT) return;
		e.preventDefault();
		e.stopPropagation();
		adjust(code === KEYS.RIGHT ? 1 : -1);
	}, [adjust]);

	if (!open) return null;

	const stars = starsFromRating(draft);
	const editor = style === 'thumbs' ? (
		<div className={css.editor}>
			<SpottableButton
				className={`${css.thumb} ${savedLikes === true ? css.thumbSelected : ''} spottable-default`}
				onClick={handleLike}
				spotlightId="personal-rating-like"
			>
				<Glyph path={RATING_ICON_PATHS.thumbUp} />
			</SpottableButton>
			<SpottableButton
				className={`${css.thumb} ${savedLikes === false ? css.thumbSelected : ''}`}
				onClick={handleDislike}
			>
				<Glyph path={RATING_ICON_PATHS.thumbDown} />
			</SpottableButton>
		</div>
	) : style === 'stars' ? (
		<div className={css.editor}>
			<SpottableDiv className={`${css.stars} spottable-default`} spotlightId="personal-rating-stars" onKeyDown={handleStarsKeyDown}>
				{[0, 1, 2, 3, 4].map((index) => {
					const remaining = stars - index;
					const path = remaining >= 0.75 ? RATING_ICON_PATHS.starFull : remaining >= 0.25 ? RATING_ICON_PATHS.starHalf : RATING_ICON_PATHS.star;
					return <Glyph key={index} path={path} />;
				})}
			</SpottableDiv>
		</div>
	) : (
		<div className={css.editor}>
			<SpottableButton
				className={`${css.step} ${draft <= 0 ? css.stepDisabled : ''}`}
				onClick={handleStepDown}
			>
				<Glyph path={RATING_ICON_PATHS.remove} />
			</SpottableButton>
			<span className={css.score}>{$L('{rating} / 10').replace('{rating}', draft)}</span>
			<SpottableButton
				className={`${css.step} ${draft >= 10 ? css.stepDisabled : ''} spottable-default`}
				onClick={handleStepUp}
				spotlightId="personal-rating-score"
			>
				<Glyph path={RATING_ICON_PATHS.add} />
			</SpottableButton>
		</div>
	);

	return (
		<div className={dialogCss.overlay}>
			<DialogContainer
				className={dialogCss.dialog}
				spotlightId="personal-rating-dialog"
				onKeyDown={handleKeyDown}
			>
				<h2 className={dialogCss.title}>{$L('Rate')}</h2>
				{editor}
				{style === 'stars' && (
					<p className={css.hint}>{$L('{rating} / 5').replace('{rating}', stars)}</p>
				)}
				<div className={dialogCss.buttons}>
					<SpottableButton className={dialogCss.btn} onClick={onClose}>
						{$L('Cancel')}
					</SpottableButton>
					{style !== 'thumbs' && (
						<SpottableButton className={dialogCss.btn} onClick={handleSave}>
							{$L('Save')}
						</SpottableButton>
					)}
					{savedRating !== null || savedLikes !== null ? (
						<SpottableButton className={dialogCss.btn} onClick={handleClear}>
							{$L('Clear rating')}
						</SpottableButton>
					) : null}
				</div>
			</DialogContainer>
		</div>
	);
};

export default PersonalRatingDialog;
