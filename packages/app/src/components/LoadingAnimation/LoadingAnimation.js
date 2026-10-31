import ScreensaverRunner from '../Screensaver/ScreensaverRunner';

import MoonfinLogoAnimation from './MoonfinLogoAnimation';
import MoonPhasesAnimation from './MoonPhasesAnimation';
import SpinnerAnimation from './SpinnerAnimation';

const MOON_PALETTES = {moonPhases: 'natural', moonfinPhases: 'moonfin', neonfinPhases: 'neonfin'};

// Draws the chosen loading animation. The runner reads which way to face from [facingRef] on
// every frame, so a turn doesn't have to re-render anything.
const LoadingAnimation = ({image, size, speed, facingRef}) => {
	if (image === 'moonfinLogo') return <MoonfinLogoAnimation size={size} speed={speed} />;
	if (image === 'spinner') return <SpinnerAnimation size={size} speed={speed} />;
	if (image === 'runner') return <ScreensaverRunner size={size} speedMultiplier={speed} facingRef={facingRef} />;
	if (MOON_PALETTES[image]) return <MoonPhasesAnimation size={size} speed={speed} palette={MOON_PALETTES[image]} />;
	return null;
};

export default LoadingAnimation;
