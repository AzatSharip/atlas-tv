import {useCallback} from 'react';
import $L from '@enact/i18n/$L';
import {Scroller} from '@enact/sandstone/Scroller';

import {SpottableButton} from './artworkSpottables';
import {CurrentArtworkCard, RemoteArtworkCard, EmptyArtworkCard} from './ArtworkCard';
import {RESOLUTIONS, getCardSizeClass, getCategoryDisplayName, getCurrentTags, getRemoteImageWidth} from './artworkTypes';

import css from './ChangeArtworkModal.module.less';

const BACK_ARROW_PATH = 'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z';

const ResolutionChip = ({resolution, active, onSelect}) => {
	const handleClick = useCallback(() => {
		onSelect?.(resolution);
	}, [onSelect, resolution]);

	return (
		<SpottableButton
			className={`${css.resolutionChip} ${active ? css.activeChip : ''}`}
			onClick={handleClick}
		>
			{$L(resolution)}
		</SpottableButton>
	);
};

// Every image for one category, in a scrollable grid with the resolution chips
// that narrow it down.
const ArtworkCategoryGrid = ({item, serverUrl, category, remoteList, selectedResolution, onSelectResolution, onRequestDelete, onSelectRemote, onBack}) => {
	const sizeClass = css[getCardSizeClass(category, item.Type)];
	const imageWidth = getRemoteImageWidth(category, item.Type);
	const currentTags = getCurrentTags(item, category);

	return (
		<div className={css.gridView}>
			<div className={css.gridHeader}>
				<SpottableButton className={css.backBtn} onClick={onBack} spotlightId="grid-back-btn">
					<svg viewBox="0 0 24 24" className={css.backBtnIcon}><path fill="currentColor" d={BACK_ARROW_PATH} /></svg>
					{$L('Back')}
				</SpottableButton>
				<h2 className={css.gridTitle}>{getCategoryDisplayName(category, item.Type)}</h2>

				<div className={css.resolutionChips}>
					{RESOLUTIONS.map((res) => (
						<ResolutionChip
							key={res}
							resolution={res}
							active={selectedResolution === res}
							onSelect={onSelectResolution}
						/>
					))}
				</div>
			</div>

			<Scroller className={css.gridScroller} direction="vertical">
				<div className={css.gridContent}>
					{currentTags.map((tag, idx) => (
						<CurrentArtworkCard
							key={`grid-current-${tag}-${idx}`}
							serverUrl={serverUrl}
							itemId={item.Id}
							category={category}
							tag={tag}
							index={idx}
							sizeClass={sizeClass}
							onRequestDelete={onRequestDelete}
						/>
					))}

					{remoteList.map((img, idx) => (
						<RemoteArtworkCard
							key={`grid-remote-${img.Url || idx}`}
							image={img}
							category={category}
							imageWidth={imageWidth}
							sizeClass={sizeClass}
							onSelect={onSelectRemote}
						/>
					))}

					{currentTags.length === 0 && remoteList.length === 0 && <EmptyArtworkCard />}
				</div>
			</Scroller>
		</div>
	);
};

export default ArtworkCategoryGrid;
