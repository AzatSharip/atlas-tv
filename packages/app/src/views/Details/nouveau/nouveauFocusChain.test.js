import {
	buildNouveauChain, clampNouveauNode, footerNode, nextNouveauNode, railNode,
	spotlightIdForNouveauNode
} from './nouveauFocusChain';

describe('buildNouveauChain', () => {
	it('leads with the hero and ends with the footer rows', () => {
		expect(buildNouveauChain({rails: ['people'], footerRows: 2})).toEqual([
			'hero', 'rail:people', 'footer:0', 'footer:1'
		]);
	});

	it('leaves out the stops the page does not have', () => {
		expect(buildNouveauChain({})).toEqual(['hero']);
	});

	// The selector belongs above the episode rail it drives, which is the arrangement the chain is
	// kept for rather than measuring the page.
	it('puts the season selector between the hero and the first rail', () => {
		expect(buildNouveauChain({
			hasOverview: true,
			hasSeasonSelector: true,
			rails: ['episodes', 'people']
		})).toEqual(['overview', 'hero', 'seasons', 'rail:episodes', 'rail:people']);
	});

	// The overview is drawn above the buttons, so it comes before them here. Having it after would
	// send a press down the page to something sat higher up it.
	it('puts the overview above the action row', () => {
		const chain = buildNouveauChain({hasOverview: true, rails: ['people']});
		expect(chain.indexOf('overview')).toBeLessThan(chain.indexOf('hero'));
		expect(nextNouveauNode(chain, 'hero', 'up')).toBe('overview');
		expect(nextNouveauNode(chain, 'hero', 'down')).toBe('rail:people');
	});
});

describe('nextNouveauNode', () => {
	const chain = buildNouveauChain({rails: ['episodes', 'people'], footerRows: 1});

	it('walks both ways', () => {
		expect(nextNouveauNode(chain, 'hero', 'down')).toBe('rail:episodes');
		expect(nextNouveauNode(chain, 'rail:people', 'up')).toBe('rail:episodes');
	});

	// Up from the first rail reaches the action row by walking, with nothing hardcoded about which
	// node happens to sit at the top.
	it('reaches the hero from the first rail', () => {
		expect(nextNouveauNode(chain, 'rail:episodes', 'up')).toBe('hero');
	});

	it('has nothing past either end, so the caller can hand the press on', () => {
		expect(nextNouveauNode(chain, 'hero', 'up')).toBeNull();
		expect(nextNouveauNode(chain, 'footer:0', 'down')).toBeNull();
		expect(nextNouveauNode(chain, 'rail:nothing', 'down')).toBeNull();
	});
});

describe('clampNouveauNode', () => {
	it('keeps a node the chain still has', () => {
		const chain = buildNouveauChain({rails: ['people']});
		expect(clampNouveauNode(chain, 'rail:people')).toBe('rail:people');
	});

	it('falls back to the last rail when the one it named has gone', () => {
		const chain = buildNouveauChain({rails: ['chapters', 'people']});
		expect(clampNouveauNode(chain, 'rail:discovery')).toBe('rail:people');
	});

	it('comes back to the hero when every rail has gone', () => {
		expect(clampNouveauNode(buildNouveauChain({}), 'rail:people')).toBe('hero');
	});

	it('holds a footer row at the last one that is left', () => {
		const chain = buildNouveauChain({rails: ['people'], footerRows: 2});
		expect(clampNouveauNode(chain, footerNode(9))).toBe('footer:1');
	});
});

describe('spotlightIdForNouveauNode', () => {
	it('sends the hero to the action row the navbar already looks for', () => {
		expect(spotlightIdForNouveauNode('hero')).toBe('details-action-buttons');
	});

	it('names rails and footer rows by their position', () => {
		expect(spotlightIdForNouveauNode(railNode('chapters'))).toBe('nouveau-rail-chapters');
		expect(spotlightIdForNouveauNode(footerNode(2))).toBe('nouveau-footer-2');
	});

	it('has nothing for a node it does not know', () => {
		expect(spotlightIdForNouveauNode('mystery')).toBeNull();
	});
});
