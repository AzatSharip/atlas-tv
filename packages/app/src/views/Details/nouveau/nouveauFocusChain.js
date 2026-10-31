// Nouveau's vertical focus chain, in the order the stops sit down the screen: the overview where
// there is one, then the action row, then the season selector, then one stop per rail, then a stop
// per focusable row in the details footer.
//
// The overview comes before the action row because that is where it is drawn, above the buttons at
// the foot of the hero. The row is still where focus starts, since play is what the screen is for.
//
// The rails own left and right themselves, so this only ever walks up and down. Keeping it as a
// list rather than measuring the page means a press costs a lookup instead of a bounding box read
// over every focusable element on screen.

export const HERO = 'hero';
export const OVERVIEW = 'overview';
export const SEASONS = 'seasons';

export const railNode = (id) => `rail:${id}`;
export const footerNode = (index) => `footer:${index}`;

const isRailNode = (node) => typeof node === 'string' && node.startsWith('rail:');
const isFooterNode = (node) => typeof node === 'string' && node.startsWith('footer:');
const railIdOf = (node) => node.slice(5);
const footerIndexOf = (node) => parseInt(node.slice(7), 10);

export const NOUVEAU_FOCUS_IDS = {
	[HERO]: 'details-action-buttons',
	[OVERVIEW]: 'nouveau-overview',
	[SEASONS]: 'nouveau-season-selector'
};

// The overview only takes focus when its text is long enough to be worth expanding, and the season
// selector only exists for a series or a season, so both are asked for rather than assumed.
export const buildNouveauChain = ({
	hasOverview = false,
	hasSeasonSelector = false,
	rails = [],
	footerRows = 0
} = {}) => [
	...(hasOverview ? [OVERVIEW] : []),
	HERO,
	...(hasSeasonSelector ? [SEASONS] : []),
	...rails.map(railNode),
	...Array.from({length: Math.max(0, footerRows)}, (_, i) => footerNode(i))
];

export const nextNouveauNode = (chain, current, direction) => {
	const index = chain.indexOf(current);
	if (index < 0) return null;
	const next = index + (direction === 'up' ? -1 : 1);
	if (next < 0 || next >= chain.length) return null;
	return chain[next];
};

// Sections fill in behind the first paint and a season change can empty the rail focus was sitting
// in, so a node remembered from a moment ago can name something that is no longer there. Snap to
// the nearest survivor rather than leaving focus nowhere.
export const clampNouveauNode = (chain, node) => {
	if (chain.includes(node)) return node;

	if (isRailNode(node)) {
		const rails = chain.filter(isRailNode);
		if (rails.length > 0) return rails[rails.length - 1];
		return chain[0];
	}

	if (isFooterNode(node)) {
		const rows = chain.filter(isFooterNode);
		if (rows.length > 0) return rows[Math.min(footerIndexOf(node), rows.length - 1)];
		const rails = chain.filter(isRailNode);
		return rails.length > 0 ? rails[rails.length - 1] : chain[0];
	}

	return chain[0];
};

export const spotlightIdForNouveauNode = (node) => {
	if (isRailNode(node)) return `nouveau-rail-${railIdOf(node)}`;
	if (isFooterNode(node)) return `nouveau-footer-${footerIndexOf(node)}`;
	return NOUVEAU_FOCUS_IDS[node] || null;
};
