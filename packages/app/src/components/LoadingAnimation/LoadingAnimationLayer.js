import PlacedLoadingOverlay from './PlacedLoadingOverlay';

import css from './LoadingAnimation.module.less';

// The player's loading animation over the whole screen. While a stream comes up the screen
// behind it is [dimmed], and while one buffers the picture stays as it is.
const LoadingAnimationLayer = ({label, dimmed}) => (
	<div className={dimmed ? `${css.layer} ${css.dimmed}` : css.layer}>
		<PlacedLoadingOverlay label={label} />
	</div>
);

export default LoadingAnimationLayer;
