import {libraryCardMetrics} from './libraryCardMetrics';
import {horizontalCellPad} from '../../utils/gridChrome';

jest.mock('@enact/spotlight', () => ({focus: jest.fn()}));

const metrics = overrides => libraryCardMetrics({
	collectionType: 'movies', imageType: 'poster', imageSize: 'medium', ...overrides
});

test('default film and cartoon libraries fit five large poster columns at Full HD', () => {
	const {cardWidth, posterHeight} = metrics();
	const gridWidth = 1920 - 174;
	const columns = Math.floor(gridWidth / (cardWidth + 2 * horizontalCellPad(cardWidth, gridWidth)));
	expect(columns).toBe(5);
	expect(posterHeight).toBeGreaterThan(450);
	expect(cardWidth / posterHeight).toBeCloseTo(2 / 3, 2);
	expect(metrics({collectionType: 'Movies'})).toEqual(metrics());
});

test('archive thumbnails keep the existing grid size and other libraries stay unchanged', () => {
	expect(metrics({collectionType: 'homevideos', imageType: 'thumbnail'})).toEqual({cardWidth: 284, posterHeight: 128});
	expect(metrics({collectionType: 'homevideos'})).toEqual({cardWidth: 145, posterHeight: 128});
	expect(metrics({collectionType: 'tvshows'})).toEqual({cardWidth: 145, posterHeight: 217});
	expect(metrics({collectionType: 'music', imageType: 'square'})).toEqual({cardWidth: 217, posterHeight: 217});
});

test('poster size preferences still change density; invalid size falls back to medium', () => {
	expect(metrics({imageSize: 'small'}).cardWidth).toBeLessThan(metrics().cardWidth);
	expect(metrics({imageSize: 'large'}).cardWidth).toBeGreaterThan(metrics().cardWidth);
	expect(metrics({imageSize: 'extraLarge'}).cardWidth).toBeGreaterThan(metrics({imageSize: 'large'}).cardWidth);
	expect(metrics({imageSize: 'obsolete'})).toEqual(metrics());
	const wide = metrics({imageType: 'thumbnail'});
	expect(wide.cardWidth).toBeCloseTo(340.8);
	expect(wide.posterHeight).toBe(192);
});
