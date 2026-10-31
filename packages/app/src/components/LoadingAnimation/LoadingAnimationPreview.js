import $L from '@enact/i18n/$L';

import {useSettings} from '../../context/SettingsContext';
import PlacedLoadingOverlay from './PlacedLoadingOverlay';

import css from './LoadingAnimation.module.less';

// Scaled down so the large size still fits the preview window.
const PREVIEW_SIZE = {
	thumbnail: {pixelSize: 24, labelSpacing: 6},
	small: {pixelSize: 44, labelSpacing: 10},
	medium: {pixelSize: 72, labelSpacing: 14},
	large: {pixelSize: 104, labelSpacing: 20}
};

// The loading animation as the player would show it, inside a small window in settings.
const LoadingAnimationPreview = () => {
	const {settings} = useSettings();
	const preview = PREVIEW_SIZE[settings.loadingAnimationSize] || PREVIEW_SIZE.medium;

	return (
		<div className={css.preview}>
			<div className={css.stage}>
				<div className={css.badge}>
					<div className={css.badgeDot} />
					<div className={css.badgeLabel}>{$L('Preview').toUpperCase()}</div>
				</div>
				<PlacedLoadingOverlay
					label={$L('Loading Stream...')}
					padding={16}
					pixelSize={preview.pixelSize}
					labelSpacing={preview.labelSpacing}
				/>
			</div>
		</div>
	);
};

export default LoadingAnimationPreview;
