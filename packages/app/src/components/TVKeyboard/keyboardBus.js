// One keyboard host lives at the app root and every text field talks to it
// through here, so a field can open the keyboard without knowing where it is.

let host = null;
const visibilityListeners = [];
let visibleState = {visible: false, anchor: null};

export const registerKeyboardHost = (instance) => {
	host = instance;
	return () => {
		if (host === instance) host = null;
	};
};

export const openTvKeyboard = (options) => {
	if (!host) return false;
	host.open(options);
	return true;
};

export const isTvKeyboardVisible = () => visibleState.visible;

// Back handling asks this first so an open keyboard always wins the key.
export const closeTvKeyboard = () => {
	if (!visibleState.visible || !host) return false;
	host.close(false);
	return true;
};

export const publishTvKeyboardVisibility = (visible, anchor) => {
	visibleState = {visible, anchor: visible ? anchor : null};
	visibilityListeners.slice().forEach((listener) => listener(visibleState));
};

// The login screen listens so it can scroll the field into view. The system
// keyboard path publishes here too, which is why this lives outside the host.
export const subscribeTvKeyboardVisibility = (listener) => {
	visibilityListeners.push(listener);
	return () => {
		const index = visibilityListeners.indexOf(listener);
		if (index >= 0) visibilityListeners.splice(index, 1);
	};
};
