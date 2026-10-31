import css from './LoadingAnimation.module.less';

// Keep the exported component and stored option key compatible with existing installs.
const MoonfinLogoAnimation = ({size, speed}) => {
	const duration = Math.round(8000 / speed) + 'ms';
	return (
		<div className={css.logoSpin} style={{width: size + 'px', height: size + 'px', WebkitAnimationDuration: duration, animationDuration: duration}}>
			<img src="resources/atlas-wordmark.svg" width={size} height={size} alt="Atlas" style={{objectFit: 'contain'}} />
		</div>
	);
};

export default MoonfinLogoAnimation;
