import {isBackKey, KEYS} from './keys';

// Install before rendering: this listener must precede the page/player listeners
// and survive their unmounts. One held Back must never walk through several pages.
export const installBackKeyGuard = (target = window) => {
	let pressed = false;
	const handleKey = (event) => {
		if (!isBackKey(event)) return;
		const code = event.keyCode || event.which;
		const editing = event.target?.isContentEditable || /^(INPUT|TEXTAREA)$/.test(event.target?.tagName);
		if (!pressed && editing && (code === KEYS.BACKSPACE || event.key === 'Backspace')) return;

		// Cancel both halves, including release after the player has unmounted,
		// so the native browser/TV cannot turn the release into an app exit.
		event.preventDefault();
		if (event.type === 'keyup') {
			pressed = false;
			event.stopImmediatePropagation();
		} else if (pressed || event.repeat) {
			event.stopImmediatePropagation();
		} else {
			pressed = true;
		}
	};
	const reset = () => { pressed = false; };
	target.addEventListener('keydown', handleKey, true);
	target.addEventListener('keyup', handleKey, true);
	target.addEventListener('blur', reset);
	return () => {
		target.removeEventListener('keydown', handleKey, true);
		target.removeEventListener('keyup', handleKey, true);
		target.removeEventListener('blur', reset);
	};
};
