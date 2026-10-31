import $L from '@enact/i18n/$L';

import ArtworkBreadcrumbs from './ArtworkBreadcrumbs';
import {SpottableButton} from './artworkSpottables';

import css from './ChangeArtworkModal.module.less';

const CHEVRON_LEFT_PATH = 'M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z';
const CHEVRON_RIGHT_PATH = 'M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z';
const CLOSE_PATH = 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z';

const ArtworkHeader = ({item, canGoBack, canGoForward, onNavigate, onBack, onForward, onClose}) => (
	<div className={css.header}>
		<div className={css.headerLeft}>
			<h1 className={css.title}>{$L('Change Artwork')}</h1>
			<ArtworkBreadcrumbs item={item} onNavigate={onNavigate} />
		</div>
		<div className={css.headerRight}>
			<SpottableButton
				className={`${css.chevronBtn} ${canGoBack ? '' : css.disabled}`}
				onClick={onBack}
				disabled={!canGoBack}
				spotlightId="history-back-btn"
			>
				<svg viewBox="0 0 24 24"><path fill="currentColor" d={CHEVRON_LEFT_PATH} /></svg>
			</SpottableButton>
			<SpottableButton
				className={`${css.chevronBtn} ${canGoForward ? '' : css.disabled}`}
				onClick={onForward}
				disabled={!canGoForward}
				spotlightId="history-forward-btn"
			>
				<svg viewBox="0 0 24 24"><path fill="currentColor" d={CHEVRON_RIGHT_PATH} /></svg>
			</SpottableButton>
			<SpottableButton className={css.closeBtn} onClick={onClose} spotlightId="dialog-close-btn">
				<svg viewBox="0 0 24 24"><path fill="currentColor" d={CLOSE_PATH} /></svg>
			</SpottableButton>
		</div>
	</div>
);

export default ArtworkHeader;
