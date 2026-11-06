// Grid and skeleton share these dimensions. Movie posters default to five
// columns at 1920px; archive thumbnails retain their compact folder layout.
export const libraryCardMetrics = ({collectionType, imageType, imageSize}) => {
	const isArchive = collectionType?.toLowerCase() === 'homevideos';
	const isMovie = collectionType?.toLowerCase() === 'movies';
	const isWide = imageType === 'thumbnail';
	const isSquare = imageType === 'square';
	const movieScale = isMovie ? (isWide || isSquare ? 1.2 : 2.15) : 1;
	const posterHeight = isArchive ? 128 : movieScale * (isWide
		? ({small: 128, medium: 160, large: 191, extraLarge: 223}[imageSize] || 160)
		: ({small: 174, medium: 217, large: 261, extraLarge: 304}[imageSize] || 217));
	const cardWidth = isSquare ? posterHeight : movieScale * (isWide
		? ({small: 227, medium: 284, large: 340, extraLarge: 397}[imageSize] || 284)
		: ({small: 116, medium: 145, large: 174, extraLarge: 203}[imageSize] || 145));
	return {posterHeight, cardWidth};
};
