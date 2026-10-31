import $L from '@enact/i18n/$L';

import {compareReleaseAscending, indexEntryFor, orderItemsByIds} from '../collectionPlaylist';

// How a collection's contents are ordered. Release order is what a collection is usually watched
// in, so it is the one everything falls back to.

export const SORT_ALPHABETICAL = 'alphabetical';
export const SORT_RELEASE_ASCENDING = 'releaseAscending';
export const SORT_RELEASE_DESCENDING = 'releaseDescending';
export const SORT_CUSTOM = 'custom';

export const DEFAULT_SORT = SORT_RELEASE_ASCENDING;

// The custom option is named for the order it keeps rather than for any gesture, since a remote
// has none to offer.
export const sortLabel = (option) => {
	if (option === SORT_ALPHABETICAL) return $L('Alphabetical');
	if (option === SORT_RELEASE_DESCENDING) return $L('Release Order (Descending)');
	if (option === SORT_CUSTOM) return $L('Custom Order');
	return $L('Release Order (Ascending)');
};

// The custom option is only worth offering where an order can actually be kept, which means the
// plugin answered.
export const collectionSortOptions = (canReorder = false) => [
	SORT_RELEASE_ASCENDING,
	SORT_RELEASE_DESCENDING,
	SORT_ALPHABETICAL,
	...(canReorder ? [SORT_CUSTOM] : [])
].map((id) => ({id, label: sortLabel(id)}));

const byName = (a, b) => String(a?.Name || '').toLowerCase().localeCompare(String(b?.Name || '').toLowerCase());

const byRelease = (a, b) => compareReleaseAscending(indexEntryFor(a), indexEntryFor(b));

export const applyCollectionSort = (items = [], option = DEFAULT_SORT, customOrder = []) => {
	if (option === SORT_CUSTOM) {
		// A saved order that no longer matches anything leaves every item unplaced, so release
		// order stands in rather than showing an arbitrary one.
		return customOrder.length ? orderItemsByIds(items, customOrder) : [...items].sort(byRelease);
	}

	if (option === SORT_ALPHABETICAL) return [...items].sort(byName);
	if (option === SORT_RELEASE_DESCENDING) return [...items].sort((a, b) => byRelease(b, a));
	return [...items].sort(byRelease);
};
