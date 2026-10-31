import {SkeletonBox, SkeletonShimmer} from '../../components/Skeleton';
import {focusOverhang} from '../../utils/gridChrome';

import css from './Library.module.less';

// Room for a card's title and subtitle, the two lines most libraries fill.
const TEXT_HEIGHT = 61;

// Placeholder cells in the grid's own layout while a library loads, sized the way the grid sizes
// a card with both lines of text under it. A horizontal grid gets a single row running off the
// side instead.
const LibrarySkeleton = ({gridWidth, cardWidth, posterHeight, padX, minRowGap, showText, horizontal}) => {
	const cardHeight = posterHeight + (showText ? TEXT_HEIGHT : 0);
	const padY = Math.max(minRowGap, focusOverhang(cardHeight));
	const minWidth = cardWidth + (padX * 2);
	const minHeight = cardHeight + (padY * 2);
	// The grid stretches its cells across the full width and keeps their shape as it does.
	const columns = Math.max(1, Math.floor(gridWidth / minWidth));
	const cellWidth = horizontal ? minWidth : Math.floor(gridWidth / columns);
	const cellHeight = horizontal ? minHeight : Math.floor((minHeight * cellWidth) / minWidth);
	const textWidth = cellWidth - (padX * 2);

	return (
		<SkeletonShimmer className={`${css.grid} ${horizontal ? css.skeletonRow : css.skeletonGrid}`}>
			{Array.from({length: horizontal ? 10 : 20}, (_, i) => (
				<div
					key={i}
					className={css.skeletonCell}
					style={{width: cellWidth + 'px', height: cellHeight + 'px', padding: `${padY}px ${padX}px`}}
				>
					<SkeletonBox width="100%" height={posterHeight} radius={10} />
					{showText && <SkeletonBox className={css.skeletonTitle} width={textWidth * 0.75} radius={4} />}
					{showText && <SkeletonBox className={css.skeletonSubtitle} width={textWidth * 0.45} radius={4} />}
				</div>
			))}
		</SkeletonShimmer>
	);
};

export default LibrarySkeleton;
