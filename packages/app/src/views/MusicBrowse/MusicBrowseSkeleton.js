import MediaRow from '../../components/MediaRow';
import {SkeletonBox, SkeletonShimmer, skeletonTitleWidths} from '../../components/Skeleton';

import chipsCss from './MusicChips.module.less';
import css from './MusicBrowse.module.less';

const ROW_TITLE_WIDTHS = skeletonTitleWidths(3, 20);

// The music home while it loads: the featured banner, the category chips and three rows of albums.
const MusicBrowseSkeleton = () => (
	<SkeletonShimmer>
		<div className={css.skeletonHero}>
			<SkeletonBox className={css.skeletonHeroArt} radius={8} />
			<div className={css.skeletonHeroText}>
				<SkeletonBox width={220} height={22} radius={4} />
				<SkeletonBox width={140} height={14} radius={4} style={{marginTop: '10px'}} />
				<SkeletonBox width={80} height={12} radius={4} style={{marginTop: '8px'}} />
			</div>
		</div>
		<div className={chipsCss.chips}>
			{Array.from({length: 5}, (_, i) => <SkeletonBox key={i} className={css.skeletonChip} radius={22} />)}
		</div>
		{ROW_TITLE_WIDTHS.map((titleWidth, index) => (
			<MediaRow key={index} loading titleWidth={titleWidth} cardType="square" />
		))}
	</SkeletonShimmer>
);

export default MusicBrowseSkeleton;
