import {makeState, insertText, backspace, moveCursor, clearText} from './keyboardTextModel';

describe('keyboardTextModel', () => {
	test('insert lands at the caret', () => {
		let state = makeState('moonfin');
		state = moveCursor(moveCursor(moveCursor(state, -1), -1), -1);
		state = insertText(state, 'X');
		expect(state.text).toBe('moonXfin');
		expect(state.cursor).toBe(5);
	});

	test('backspace deletes before the caret', () => {
		let state = makeState('abc', 2);
		state = backspace(state);
		expect(state.text).toBe('ac');
		expect(state.cursor).toBe(1);
	});

	test('backspace at the start does nothing', () => {
		const state = makeState('abc', 0);
		expect(backspace(state)).toBe(state);
	});

	test('caret clamps at both ends', () => {
		let state = makeState('ab', 0);
		state = moveCursor(state, -1);
		expect(state.cursor).toBe(0);
		state = makeState('ab');
		state = moveCursor(state, 1);
		expect(state.cursor).toBe(2);
	});

	test('surrogate pairs move and delete as one character', () => {
		const emoji = '🍿';
		let state = makeState(`a${emoji}b`);
		state = moveCursor(state, -1);
		expect(state.cursor).toBe(3);
		state = moveCursor(state, -1);
		expect(state.cursor).toBe(1);
		state = makeState(`a${emoji}`, 3);
		state = backspace(state);
		expect(state.text).toBe('a');
		expect(state.cursor).toBe(1);
	});

	test('replacing the text puts the caret at the end', () => {
		const state = makeState('replaced');
		expect(state.text).toBe('replaced');
		expect(state.cursor).toBe(8);
	});

	test('clearText resets everything', () => {
		const state = clearText();
		expect(state.text).toBe('');
		expect(state.cursor).toBe(0);
	});
});
