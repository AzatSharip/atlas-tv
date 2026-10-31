import Spottable from '@enact/spotlight/Spottable';
import SpotlightContainerDecorator from '@enact/spotlight/SpotlightContainerDecorator';

export const SpottableDiv = Spottable('div');
export const SpottableButton = Spottable('button');

export const HorizontalContainer = SpotlightContainerDecorator({restrict: 'self-first'}, 'div');
export const RowContainer = SpotlightContainerDecorator({enterTo: 'last-focused'}, 'div');
