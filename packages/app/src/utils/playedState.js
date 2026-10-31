// The server counts a season with nothing unplayed as played, and a season that isn't in the
// library has nothing unplayed by definition, so the ones it lists as Virtual come back played
// as well. Only something really in the library gets the mark.
export const showsWatchedCheck = (item) =>
	Boolean(item?.UserData?.Played) && item?.LocationType !== 'Virtual';

// Whether two copies of an item would draw the same card, going by the parts of its user data a
// card shows: the progress bar, the watched mark, the unplayed count and the favorite heart.
export const sameCardUserData = (a, b) => {
	const before = a?.UserData;
	const after = b?.UserData;
	return before?.PlayedPercentage === after?.PlayedPercentage &&
		before?.Played === after?.Played &&
		before?.UnplayedItemCount === after?.UnplayedItemCount &&
		before?.IsFavorite === after?.IsFavorite;
};
