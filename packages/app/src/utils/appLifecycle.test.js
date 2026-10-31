import {activateApp, exitApp} from './appLifecycle';

const asWebOS = () => {
	window.PalmServiceBridge = {};
};

describe('activateApp', () => {
	afterEach(() => {
		delete window.PalmServiceBridge;
		delete window.webOSSystem;
		delete window.PalmSystem;
	});

	test('brings the app forward through the name newer sets carry', () => {
		asWebOS();
		const activate = jest.fn();
		window.webOSSystem = {activate};

		activateApp();

		expect(activate).toHaveBeenCalled();
	});

	test('falls back to the name older sets carry', () => {
		asWebOS();
		const activate = jest.fn();
		window.PalmSystem = {activate};

		activateApp();

		expect(activate).toHaveBeenCalled();
	});

	test('a set carrying neither is left alone', () => {
		asWebOS();

		expect(() => activateApp()).not.toThrow();
	});

	test('a throw on the way through is held', () => {
		asWebOS();
		window.webOSSystem = {activate: () => {
			throw new Error('refused');
		}};

		expect(() => activateApp()).not.toThrow();
	});

	test('nothing is asked of a set that is not webOS', () => {
		const activate = jest.fn();
		window.webOSSystem = {activate};

		activateApp();

		expect(activate).not.toHaveBeenCalled();
	});
});

describe('exitApp', () => {
	afterEach(() => {
		delete window.tizen;
	});

	test('a tizen set is asked to close its own application', () => {
		const exit = jest.fn();
		window.tizen = {application: {getCurrentApplication: () => ({exit})}};

		exitApp();

		expect(exit).toHaveBeenCalled();
	});

	test('anything else closes the window', () => {
		const close = jest.spyOn(window, 'close').mockImplementation(() => {});

		exitApp();

		expect(close).toHaveBeenCalled();
		close.mockRestore();
	});
});
