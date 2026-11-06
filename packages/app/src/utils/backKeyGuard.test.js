import {installBackKeyGuard} from './backKeyGuard';
import {isBackKey} from './keys';

jest.mock('../platform', () => ({getPlatform: () => 'tizen'}));

const key = (type, options = {}, target = window) => {
	const event = new window.KeyboardEvent(type, {keyCode: 10009, bubbles: true, cancelable: true, ...options});
	target.dispatchEvent(event);
	return event;
};

let removeGuard;
beforeEach(() => { removeGuard = installBackKeyGuard(); });
afterEach(() => { removeGuard(); });

test('one held Back stays on the returned page, including unflagged repeat events', () => {
	const player = jest.fn();
	const folder = jest.fn();
	window.addEventListener('keydown', player, true);
	expect(key('keydown').defaultPrevented).toBe(true);
	expect(player).toHaveBeenCalledTimes(1);
	window.removeEventListener('keydown', player, true);
	window.addEventListener('keydown', folder, true);
	try {
		key('keydown', {repeat: true});
		key('keydown'); // Some older TV engines do not set repeat.
		expect(folder).not.toHaveBeenCalled();
		expect(key('keyup').defaultPrevented).toBe(true);
		key('keydown');
		expect(folder).toHaveBeenCalledTimes(1);
	} finally {
		window.removeEventListener('keydown', folder, true);
	}
});

test.each([
	{keyCode: 10009}, {keyCode: 27}, {keyCode: 8},
	{keyCode: 0, key: 'GoBack'}, {keyCode: 0, key: 'Escape'}, {keyCode: 0, key: 'Backspace'}
])('cancels native Back down and release for %j, even without a page listener', options => {
	expect(isBackKey(options)).toBe(true);
	expect(key('keydown', options).defaultPrevented).toBe(true);
	expect(key('keyup', options).defaultPrevented).toBe(true);
});

test('release cannot reach another page or native keyup handler', () => {
	const nextPage = jest.fn();
	window.addEventListener('keyup', nextPage, true);
	try {
		key('keydown');
		expect(key('keyup').defaultPrevented).toBe(true);
		expect(nextPage).not.toHaveBeenCalled();
	} finally {
		window.removeEventListener('keyup', nextPage, true);
	}
});

test('preserves typing Backspace and unrelated held arrows', () => {
	const input = document.createElement('input');
	document.body.appendChild(input);
	try {
		expect(key('keydown', {keyCode: 8, key: 'Backspace'}, input).defaultPrevented).toBe(false);
		expect(key('keyup', {keyCode: 8, key: 'Backspace'}, input).defaultPrevented).toBe(false);
		expect(key('keydown', {keyCode: 39, repeat: true}).defaultPrevented).toBe(false);
		expect(key('keydown', {}, input).defaultPrevented).toBe(true);
	} finally {
		input.remove();
	}
});

test('blur recovers a lost release, but an already-held repeat never navigates', () => {
	const page = jest.fn();
	window.addEventListener('keydown', page, true);
	try {
		key('keydown');
		window.dispatchEvent(new Event('blur'));
		key('keydown', {repeat: true});
		expect(page).toHaveBeenCalledTimes(1);
		key('keyup');
		key('keydown');
		expect(page).toHaveBeenCalledTimes(2);
	} finally {
		window.removeEventListener('keydown', page, true);
	}
});

test('removing the guard removes both keyboard listeners', () => {
	removeGuard();
	expect(key('keydown').defaultPrevented).toBe(false);
	expect(key('keyup').defaultPrevented).toBe(false);
});
