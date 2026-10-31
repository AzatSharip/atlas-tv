// What each saved loading animation choice turns into on screen.

export const IMAGES = ['none', 'moonfinLogo', 'spinner', 'runner', 'moonPhases', 'moonfinPhases', 'neonfinPhases'];

export const SIZE_LAYOUT = {
	thumbnail: {pixelSize: 36, labelSpacing: 8, labelFontSize: 10, labelLetterSpacing: 1.5},
	small: {pixelSize: 64, labelSpacing: 14, labelFontSize: 12, labelLetterSpacing: 2.5},
	medium: {pixelSize: 110, labelSpacing: 24, labelFontSize: 14, labelLetterSpacing: 3.5},
	large: {pixelSize: 170, labelSpacing: 40, labelFontSize: 16, labelLetterSpacing: 4}
};

export const SPEED_MULTIPLIER = {slow: 0.45, moderate: 0.70, fast: 1.0, ultra: 1.60};

// Where each position anchors the animation, with -1 and 1 as the two edges, and how far it
// keeps from them.
export const POSITION_LAYOUT = {
	topLeft: {x: -1, y: -1, padding: '40px'},
	topCenter: {x: 0, y: -1, padding: '40px 24px 0'},
	topRight: {x: 1, y: -1, padding: '40px'},
	middleLeft: {x: -1, y: 0, padding: '24px 0 24px 40px'},
	middle: {x: 0, y: 0, padding: '0'},
	middleRight: {x: 1, y: 0, padding: '24px 40px 24px 0'},
	bottomLeft: {x: -1, y: 1, padding: '40px'},
	bottomCenter: {x: 0, y: 1, padding: '0 24px 40px'},
	bottomRight: {x: 1, y: 1, padding: '40px'},
	bouncing: {x: 0, y: 0, padding: '0'}
};

export const SIZES = Object.keys(SIZE_LAYOUT);
export const SPEEDS = Object.keys(SPEED_MULTIPLIER);
export const POSITIONS = Object.keys(POSITION_LAYOUT);

export const sizeLayout = (size) => SIZE_LAYOUT[size] || SIZE_LAYOUT.medium;
export const speedMultiplier = (speed) => SPEED_MULTIPLIER[speed] || SPEED_MULTIPLIER.fast;
export const positionLayout = (position) => POSITION_LAYOUT[position] || POSITION_LAYOUT.middle;

// A runner on the right hand side turns to run toward the middle.
export const facesLeft = (position) => positionLayout(position).x === 1;

// Draws frame after frame until the returned stop is called, handing each frame the time
// since it started.
export const startFrames = (draw) => {
	const started = Date.now();
	let handle = null;
	let running = true;

	const frame = () => {
		if (!running) return;
		draw(Date.now() - started);
		handle = window.requestAnimationFrame ? window.requestAnimationFrame(frame) : setTimeout(frame, 16);
	};
	frame();

	return () => {
		running = false;
		if (handle == null) return;
		if (window.requestAnimationFrame) {
			window.cancelAnimationFrame(handle);
		} else {
			clearTimeout(handle);
		}
	};
};
