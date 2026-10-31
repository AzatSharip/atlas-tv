import Spottable from '@enact/spotlight/Spottable';
import SpotlightContainerDecorator from '@enact/spotlight/SpotlightContainerDecorator';

export const SpottableDiv = Spottable('div');
export const SpottableButton = Spottable('button');

// Every screen holds focus on its own, so a 5-way press at the edge stays put rather than
// jumping to whatever the panel is sitting on top of.
export const ViewContainer = SpotlightContainerDecorator({
	enterTo: 'last-focused',
	restrict: 'self-only',
	leaveFor: {left: '', right: '', up: '', down: ''}
}, 'div');
