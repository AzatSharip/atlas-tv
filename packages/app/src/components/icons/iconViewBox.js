import {DETAIL_ICON_PATHS} from '../../views/Details/detailIcons';
import {RATING_ICON_PATHS} from './ratingIcons';

// A few icons are drawn nearer one edge of their square than the other, which goes
// unnoticed in a square button and shows plainly in a round one at half size.
// Shifting the window by the measured amount brings the shape back to the middle
// and leaves the artwork untouched.
//
// Play is deliberately absent. Its triangle is balanced on its centre of mass
// rather than its box, and squaring it up by the box pushes it visibly left.

const VIEW_BOX_SIZE = 960;
export const DEFAULT_ICON_VIEW_BOX = `0 -${VIEW_BOX_SIZE} ${VIEW_BOX_SIZE} ${VIEW_BOX_SIZE}`;

const OFF_CENTRE = [
	[DETAIL_ICON_PATHS.playlist, 20, 40],
	[DETAIL_ICON_PATHS.collection, 20, 20],
	[DETAIL_ICON_PATHS.manageRequests, 0, -21.5],
	[DETAIL_ICON_PATHS.restart, 0, -20],
	[DETAIL_ICON_PATHS.artwork, 0, -20],
	[DETAIL_ICON_PATHS.reportIssue, 0, -20],
	[RATING_ICON_PATHS.thumbUp, 20, -40],
	[RATING_ICON_PATHS.thumbDown, -20, 40],
	[RATING_ICON_PATHS.star, 0, -20],
	[RATING_ICON_PATHS.starHalf, 0, -20],
	[RATING_ICON_PATHS.starFull, 0, -20]
];

// A correction for an icon that no longer exists would otherwise key the lookup on
// undefined and hand its window to every caller that asks about a path it lacks.
const BY_PATH = new Map(OFF_CENTRE
	.filter(([path]) => path)
	.map(([path, x, y]) => [path, `${x} ${y - VIEW_BOX_SIZE} ${VIEW_BOX_SIZE} ${VIEW_BOX_SIZE}`]));

export const iconViewBox = (path) => BY_PATH.get(path) || DEFAULT_ICON_VIEW_BOX;
