import {useSettings} from '../../context/SettingsContext';
import BouncingPosition from './BouncingPosition';
import LoadingOverlay from './LoadingOverlay';
import {positionLayout, speedMultiplier} from './loadingAnimationLayout';

import css from './LoadingAnimation.module.less';

const ANCHOR_X = {'-1': css.anchorLeft, 0: css.anchorCenter, 1: css.anchorRight};
const ANCHOR_Y = {'-1': css.anchorTop, 0: css.anchorMiddle, 1: css.anchorBottom};

// The loading overlay where the settings put it, or bouncing around the whole area. The player
// keeps the margins each position asks for, and the preview passes one small [padding] instead.
const PlacedLoadingOverlay = ({label, padding, pixelSize, labelSpacing}) => {
	const {settings} = useSettings();
	const position = settings.loadingAnimationPosition;

	if (position === 'bouncing') {
		return (
			<BouncingPosition speed={speedMultiplier(settings.loadingAnimationSpeed)} padding={(padding != null ? padding : 40) + 'px'}>
				{(movingLeft) => (
					<LoadingOverlay label={label} pixelSize={pixelSize} labelSpacing={labelSpacing} facingRef={movingLeft} />
				)}
			</BouncingPosition>
		);
	}

	const layout = positionLayout(position);
	return (
		<div className={`${css.anchor} ${ANCHOR_X[layout.x]} ${ANCHOR_Y[layout.y]}`}>
			<div style={{padding: padding != null ? padding + 'px' : layout.padding}}>
				<LoadingOverlay label={label} pixelSize={pixelSize} labelSpacing={labelSpacing} />
			</div>
		</div>
	);
};

export default PlacedLoadingOverlay;
