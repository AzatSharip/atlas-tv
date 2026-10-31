// The windowing itself is shared with the detail screen's rails, so it lives in utils and search
// keeps only the part that is its own.
export {
	CARD_WINDOW_EDGE,
	CARD_WINDOW_STEP,
	INITIAL_CARD_WINDOW,
	ROW_WINDOW_RADIUS,
	expandedCardCount,
	initialCardCount,
	shouldMountRow as shouldMountSearchRow
} from '../../utils/rowWindow';

export const searchArtworkOptions = (aspect, tag) => {
	const options = aspect === 'poster' ? {maxHeight: 300} : {maxWidth: 400};
	options.quality = 80;
	if (tag) options.tag = tag;
	return options;
};
