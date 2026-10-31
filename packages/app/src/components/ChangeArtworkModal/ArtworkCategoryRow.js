import {useCallback} from 'react';
import Spotlight from '@enact/spotlight';
import $L from '@enact/i18n/$L';

import {KEYS} from '../../utils/keys';
import {SpottableButton} from './artworkSpottables';
import {CurrentArtworkCard, RemoteArtworkCard, EmptyArtworkCard, LoadingArtworkCard} from './ArtworkCard';
import {getCardSizeClass, getCategoryDisplayName, getCurrentTags, getRemoteImageWidth} from './artworkTypes';

import css from './ChangeArtworkModal.module.less';

const ROW_SCROLL_MARGIN = 40;
// The row only teases a few results, the rest sit behind View All.
const ROW_PREVIEW_COUNT = 8;

// One horizontal strip of artwork for a single image category. It handles its
// own scrolling because nesting a Scroller here would make both it and the
// vertical one answer the same focus event, with the outer one measuring a row
// that was still moving.
const ArtworkCategoryRow = ({item, serverUrl, category, remoteList, loading, onRequestDelete, onSelectRemote, onViewAll}) => {
	const imageWidth = getRemoteImageWidth(category, item.Type);
	const sizeClass = css[getCardSizeClass(category, item.Type)];
	const currentTags = getCurrentTags(item, category);

	const handleFocus = useCallback((ev) => {
		const card = ev.target.closest('.spottable');
		if (!card) return;
		const row = ev.currentTarget;
		window.requestAnimationFrame(() => {
			const cardRect = card.getBoundingClientRect();
			const rowRect = row.getBoundingClientRect();
			if (cardRect.left < rowRect.left) {
				row.scrollLeft -= rowRect.left - cardRect.left + ROW_SCROLL_MARGIN;
			} else if (cardRect.right > rowRect.right) {
				row.scrollLeft += cardRect.right - rowRect.right + ROW_SCROLL_MARGIN;
			}
		});
	}, []);

	const handleKeyDown = useCallback((ev) => {
		if (ev.keyCode !== KEYS.LEFT && ev.keyCode !== KEYS.RIGHT) return;
		const card = ev.target.closest('.spottable');
		if (!card) return;
		const cards = Array.from(ev.currentTarget.querySelectorAll('.spottable'));
		const idx = cards.indexOf(card);
		if (idx === -1) return;
		// Handled either way so the ends of a row don't leak sideways out of it.
		ev.preventDefault();
		ev.stopPropagation();
		const next = ev.keyCode === KEYS.LEFT ? idx - 1 : idx + 1;
		if (next >= 0 && next < cards.length) Spotlight.focus(cards[next]);
	}, []);

	const handleViewAll = useCallback(() => {
		onViewAll?.(category);
	}, [onViewAll, category]);

	return (
		<div className={css.categorySection}>
			<div className={css.categoryHeader}>
				<span className={css.categoryTitle}>{getCategoryDisplayName(category, item.Type)}</span>
				{remoteList.length > 0 && (
					<SpottableButton className={css.viewAllBtn} onClick={handleViewAll}>
						{$L('View All ({count})').replace('{count}', remoteList.length)}
					</SpottableButton>
				)}
			</div>

			<div className={css.cardRowScroller} onFocus={handleFocus} onKeyDown={handleKeyDown}>
				<div className={css.cardRow}>
					{currentTags.map((tag, idx) => (
						<CurrentArtworkCard
							key={`current-${tag}-${idx}`}
							serverUrl={serverUrl}
							itemId={item.Id}
							category={category}
							tag={tag}
							index={idx}
							sizeClass={sizeClass}
							onRequestDelete={onRequestDelete}
						/>
					))}

					{loading && <LoadingArtworkCard sizeClass={sizeClass} />}

					{!loading && remoteList.slice(0, ROW_PREVIEW_COUNT).map((img, idx) => (
						<RemoteArtworkCard
							key={`remote-${img.Url || idx}`}
							image={img}
							category={category}
							imageWidth={imageWidth}
							sizeClass={sizeClass}
							onSelect={onSelectRemote}
						/>
					))}

					{!loading && currentTags.length === 0 && remoteList.length === 0 && (
						<EmptyArtworkCard sizeClass={sizeClass} />
					)}
				</div>
			</div>
		</div>
	);
};

export default ArtworkCategoryRow;
