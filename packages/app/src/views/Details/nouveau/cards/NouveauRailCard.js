import {SpottableDiv} from '../../detailsSpottables';

import css from './NouveauCards.module.less';

// The widescreen card the chapters and extras rails are made of: artwork with a title and a second
// line under it. Where there is no artwork it says what the thing is instead of drawing an icon,
// since a chapter without a still is still worth naming.
const NouveauRailCard = ({
	imageUrl, title, subtitle, placeholderLabel, width, artworkHeight, progress = 0,
	selectKey, onSelect, spotlightId
}) => {
	const shown = progress > 0 && progress < 1;

	return (
		<SpottableDiv
			className={css.card}
			style={{width: `${width}px`}}
			spotlightId={spotlightId}
			data-select-key={selectKey}
			onClick={onSelect}
		>
			<div className={css.artwork} style={{height: `${artworkHeight}px`}}>
				{imageUrl
					? <img className={css.artworkImage} src={imageUrl} alt="" />
					: <div className={css.placeholder}>{placeholderLabel}</div>}
				{shown && (
					<div className={css.progressTrack}>
						<div className={css.progressFill} style={{width: `${Math.round(progress * 100)}%`}} />
					</div>
				)}
			</div>
			<div className={css.caption}>
				{title && <div className={css.title}>{title}</div>}
				{subtitle && <div className={css.subtitle}>{subtitle}</div>}
			</div>
		</SpottableDiv>
	);
};

export default NouveauRailCard;
