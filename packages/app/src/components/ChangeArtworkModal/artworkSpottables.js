import Spottable from '@enact/spotlight/Spottable';
import SpotlightContainerDecorator from '@enact/spotlight/SpotlightContainerDecorator';

import css from './ChangeArtworkModal.module.less';

export const ModalContainer = SpotlightContainerDecorator({
	enterTo: 'default-element',
	defaultElement: [`.${css.cardWrapper}`, '[data-spotlight-id="dialog-close-btn"]'],
	restrict: 'self-only',
	leaveFor: {left: '', right: '', up: '', down: ''}
}, 'div');

// Used by every overlay panel, which has to hold focus until it's dismissed.
export const RestrictedContainer = SpotlightContainerDecorator({
	enterTo: 'default-element',
	restrict: 'self-only',
	leaveFor: {left: '', right: '', up: '', down: ''}
}, 'div');

export const SpottableDiv = Spottable('div');
export const SpottableButton = Spottable('button');
