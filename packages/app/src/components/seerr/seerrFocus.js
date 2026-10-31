import Spottable from '@enact/spotlight/Spottable';
import SpotlightContainerDecorator from '@enact/spotlight/SpotlightContainerDecorator';
import Spotlight from '@enact/spotlight';

// Spotlight throws when asked to focus something that has gone, which happens whenever a
// popup closes while a focus is still queued. Without this every caller would need the
// same guard.
export const safeFocus = (spotlightId) => {
	try {
		return Spotlight.focus(spotlightId);
	} catch (e) {
		console.warn('[safeFocus] Failed to focus:', spotlightId, e.message);
		return false;
	}
};

export const SpottableDiv = Spottable('div');

// Rows and popups all want focus to land back where it left off, so they share one container.
export const LastFocusedContainer = SpotlightContainerDecorator({
	enterTo: 'last-focused'
}, 'div');
