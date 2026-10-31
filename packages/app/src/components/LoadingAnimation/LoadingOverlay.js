import {useRef} from 'react';

import {useSettings} from '../../context/SettingsContext';
import LoadingAnimation from './LoadingAnimation';
import {facesLeft, sizeLayout, speedMultiplier} from './loadingAnimationLayout';

import css from './LoadingAnimation.module.less';

// The chosen animation with its label under it, pulsing in the Moonfin gradient. The preview
// draws it smaller, so it can hand in its own size and gap.
const LoadingOverlay = ({label, pixelSize, labelSpacing, facingRef}) => {
	const {settings} = useSettings();
	const staticFacing = useRef(false);
	staticFacing.current = facesLeft(settings.loadingAnimationPosition);

	const image = settings.loadingAnimationImage;
	const layout = sizeLayout(settings.loadingAnimationSize);
	const text = label ? label.trim() : '';
	const hasLabel = settings.showLoadingAnimationText !== false && text.length > 0;
	const hasImage = image !== 'none';
	if (!hasImage && !hasLabel) return null;

	return (
		<div className={css.overlay}>
			{hasImage && (
				<LoadingAnimation
					image={image}
					size={pixelSize || layout.pixelSize}
					speed={speedMultiplier(settings.loadingAnimationSpeed)}
					facingRef={facingRef || staticFacing}
				/>
			)}
			{hasLabel && (
				<div
					className={css.label}
					style={{
						marginTop: hasImage ? (labelSpacing != null ? labelSpacing : layout.labelSpacing) + 'px' : 0,
						fontSize: layout.labelFontSize + 'px',
						letterSpacing: layout.labelLetterSpacing + 'px'
					}}
				>
					{text.toUpperCase()}
				</div>
			)}
		</div>
	);
};

export default LoadingOverlay;
