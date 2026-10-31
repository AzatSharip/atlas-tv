// Read off the items rather than the filters route, since Jellyfin 12 answers that one with an
// empty rating list. Capped at fifteen pages so a huge library can't pin the screen on a spinner.

const PAGE_SIZE = 200;
const MAX_PAGES = 15;

const RATED_TYPES = ['Movie', 'Series', 'Episode', 'Video', 'MusicVideo', 'Book', 'AudioBook'].join(',');

export const readServerRatings = async (api) => {
	const discovered = new Set();
	let startIndex = 0;

	for (let pages = 0; pages < MAX_PAGES; pages++) {
		const response = await api.getItems({
			IncludeItemTypes: RATED_TYPES,
			Recursive: true,
			Fields: 'OfficialRating',
			StartIndex: startIndex,
			Limit: PAGE_SIZE,
			EnableTotalRecordCount: true
		});
		const page = Array.isArray(response?.Items) ? response.Items : [];
		page.forEach((item) => {
			const rating = typeof item?.OfficialRating === 'string' ? item.OfficialRating.trim() : '';
			if (rating) discovered.add(rating.toUpperCase());
		});

		if (page.length < PAGE_SIZE) break;
		startIndex += page.length;
		const total = response?.TotalRecordCount;
		if (typeof total === 'number' && startIndex >= total) break;
	}

	return Array.from(discovered);
};
