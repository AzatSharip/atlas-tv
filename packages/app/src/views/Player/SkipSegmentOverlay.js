import $L from '@enact/i18n/$L';
import {SpottableButton} from './PlayerConstants';
import {CountdownRing, SkipGlyph, formatRemaining, useOverlayFocus} from './overlayParts';

import css from './SkipSegmentOverlay.module.less';

const RING_SIZE = 52;
const RING_STROKE = 4;

const SEGMENT_LABELS = {
	intro: 'Intro',
	outro: 'Outro',
	preview: 'Preview',
	recap: 'Recap',
	commercial: 'Commercial'
};

const ringClasses = {ring: css.ring, svg: css.ringSvg, track: css.ringTrack, value: css.ringValue, center: css.ringCenter};

/**
 * Offers to jump past a segment the server marked up. The ring drains for as long
 * as the segment has left to run, so the prompt going away is never a surprise.
 */
const SkipSegmentOverlay = ({type, remainingSeconds, progress, countdownStyle, onSkip, spotlightId}) => {
	useOverlayFocus(spotlightId);

	const showRing = countdownStyle === 'progressBar' || countdownStyle === 'both';
	const showTimer = countdownStyle === 'timer' || countdownStyle === 'both';
	const numberInRing = showTimer && showRing && remainingSeconds < 60;

	return (
		<div className={css.overlay}>
			<SpottableButton className={css.button} onClick={onSkip} spotlightId={spotlightId}>
				<SkipGlyph className={css.icon} />
				<span className={css.label}>
					{$L('Skip {segment}').replace('{segment}', $L(SEGMENT_LABELS[type] || SEGMENT_LABELS.intro))}
				</span>
				{showTimer && !numberInRing && (
					<span className={css.timer}>
						{$L('Ends in {time}').replace('{time}', formatRemaining(remainingSeconds))}
					</span>
				)}
				{showRing && (
					<CountdownRing size={RING_SIZE} stroke={RING_STROKE} progress={progress} classes={ringClasses}>
						{numberInRing
							? <span className={css.ringNumber}>{Math.max(0, remainingSeconds)}</span>
							: <SkipGlyph className={css.ringIcon} />}
					</CountdownRing>
				)}
			</SpottableButton>
		</div>
	);
};

export default SkipSegmentOverlay;
