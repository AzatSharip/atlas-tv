import {DETAIL_ICON_PATHS} from '../../views/Details/detailIcons';
import {RATING_ICON_PATHS} from './ratingIcons';
import {iconViewBox, DEFAULT_ICON_VIEW_BOX} from './iconViewBox';

const viewBoxOf = (name, paths) => iconViewBox(paths[name]);

describe('iconViewBox', () => {
	test('an icon drawn evenly in its square keeps the plain window', () => {
		expect(viewBoxOf('shuffle', DETAIL_ICON_PATHS)).toBe(DEFAULT_ICON_VIEW_BOX);
		expect(viewBoxOf('watched', DETAIL_ICON_PATHS)).toBe(DEFAULT_ICON_VIEW_BOX);
	});

	test('an icon drawn off to one side has its window shifted the same way', () => {
		expect(viewBoxOf('playlist', DETAIL_ICON_PATHS)).toBe('20 -920 960 960');
		expect(viewBoxOf('collection', DETAIL_ICON_PATHS)).toBe('20 -940 960 960');
		expect(viewBoxOf('thumbUp', RATING_ICON_PATHS)).toBe('20 -1000 960 960');
		expect(viewBoxOf('thumbDown', RATING_ICON_PATHS)).toBe('-20 -920 960 960');
	});

	test('play keeps the plain window, since its triangle is balanced on its mass', () => {
		expect(viewBoxOf('play', DETAIL_ICON_PATHS)).toBe(DEFAULT_ICON_VIEW_BOX);
	});

	test('a path it has never seen falls back rather than returning nothing', () => {
		expect(iconViewBox('M0 0h10v10H0Z')).toBe(DEFAULT_ICON_VIEW_BOX);
		expect(iconViewBox(undefined)).toBe(DEFAULT_ICON_VIEW_BOX);
	});

	test('the corrections land on the icons they were measured for', () => {
		// An icon dropped from either set would leave its correction behind with
		// nothing to apply to, and the list here would quietly get shorter.
		const shifted = (paths) => Object.keys(paths)
			.filter((name) => iconViewBox(paths[name]) !== DEFAULT_ICON_VIEW_BOX)
			.sort();

		expect(shifted(DETAIL_ICON_PATHS)).toEqual(
			['artwork', 'collection', 'manageRequests', 'playlist', 'reportIssue', 'restart']);
		expect(shifted(RATING_ICON_PATHS)).toEqual(
			['star', 'starFull', 'starHalf', 'thumbDown', 'thumbUp']);
	});
});
