import {
	collectionCardHeight, collectionCardWidth, countRailWidth, discoveryCardWidth,
	episodeCardWidth, episodeImageHeight, fractionalRailWidth,
	mediaRailCardWidth, peopleAvatarSize, peopleCardWidth
} from './nouveauMetrics';

describe('rail widths', () => {
	// Two of the rails divide 1920 evenly, which makes them the honest anchors for the arithmetic.
	it('divides a full width screen the way each rail asks for', () => {
		expect(collectionCardWidth(1920)).toBe(320);
		expect(peopleCardWidth(1920)).toBe(212);
		expect(episodeCardWidth(1920)).toBeCloseTo(561.2308, 3);
		expect(discoveryCardWidth(1920)).toBeCloseTo(273.1707, 3);
		expect(mediaRailCardWidth(1920)).toBeCloseTo(424.0964, 3);
	});

	it('divides a narrower screen the same way', () => {
		expect(peopleCardWidth(1280)).toBe(132);
		expect(episodeCardWidth(1280)).toBeCloseTo(364.3077, 3);
		expect(collectionCardWidth(1280)).toBeCloseTo(203.6364, 3);
		expect(discoveryCardWidth(1280)).toBeCloseTo(169.1057, 3);
	});

	// The whole point of keeping both formulas is that they disagree. If people ever started
	// dividing the fractional way its faces would be cut off at the edge.
	it('keeps the people rail on the whole card formula', () => {
		expect(peopleCardWidth(1920)).not.toBeCloseTo(fractionalRailWidth(1920, 8, 32), 3);
		expect(countRailWidth(1920, 8, 32)).toBe(peopleCardWidth(1920));
	});

	// Discovery keeps the wider gap on every device, so it cant be folded in with the rails that
	// tighten for a remote.
	it('gives discovery the wider gap', () => {
		expect(discoveryCardWidth(1920)).toBeCloseTo(fractionalRailWidth(1920, 6.15, 40), 6);
		expect(discoveryCardWidth(1920)).not.toBeCloseTo(fractionalRailWidth(1920, 6.15, 32), 3);
	});

	it('never hands back something the layout cant use', () => {
		[0, -100, NaN, Infinity, undefined].forEach((bad) => {
			expect(episodeCardWidth(bad)).toBe(0);
			expect(peopleCardWidth(bad)).toBe(0);
			expect(discoveryCardWidth(bad)).toBe(0);
		});
	});
});

describe('rail heights', () => {
	it('shapes stills as widescreen and posters as portrait', () => {
		expect(episodeImageHeight(320)).toBe(180);
		expect(collectionCardHeight(320)).toBe(480);
	});

	it('sizes an avatar inside its card rather than filling it', () => {
		expect(peopleAvatarSize(200)).toBeCloseTo(168, 6);
	});
});
