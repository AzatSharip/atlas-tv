import {useCallback} from 'react';
import $L from '@enact/i18n/$L';

import {RestrictedContainer, SpottableDiv, SpottableButton} from './artworkSpottables';

import css from './ChangeArtworkModal.module.less';

// Every overlay in the modal shares this shell: a dimmer plus a focus-trapping
// panel, so only the ids and the body differ.
const OverlayPanel = ({spotlightId, className, children}) => (
	<div className={css.modalOverlay}>
		<RestrictedContainer className={className} spotlightId={spotlightId}>
			{children}
		</RestrictedContainer>
	</div>
);

// Yes / no prompt used for both the single delete and the clear-all.
export const ConfirmDialog = ({spotlightId, title, message, confirmLabel, confirmSpotlightId, cancelSpotlightId, onConfirm, onCancel}) => (
	<OverlayPanel spotlightId={spotlightId} className={css.confirmPanel}>
		<h3 className={css.panelTitle}>{title}</h3>
		<p className={css.panelMessage}>{message}</p>
		<div className={css.formButtons}>
			<SpottableButton className={`${css.btn} ${css.btnPrimary}`} onClick={onConfirm} spotlightId={confirmSpotlightId}>
				{confirmLabel}
			</SpottableButton>
			<SpottableButton className={css.btn} onClick={onCancel} spotlightId={cancelSpotlightId}>
				{$L('Cancel')}
			</SpottableButton>
		</div>
	</OverlayPanel>
);

const SourceRow = ({source, checked, onToggle}) => {
	const handleClick = useCallback(() => {
		onToggle?.(source);
	}, [onToggle, source]);

	return (
		<SpottableDiv className={css.sourceItem} onClick={handleClick}>
			<input type="checkbox" className={css.checkbox} checked={checked} readOnly />
			<span className={css.sourceName}>{source}</span>
		</SpottableDiv>
	);
};

export const SourcesDialog = ({sources, deselectedSources, onToggle, onClose}) => (
	<OverlayPanel spotlightId="sources-popup" className={css.sourcesPanel}>
		<h3 className={css.panelTitle}>{$L('Filter Providers')}</h3>
		<div className={css.sourcesList}>
			{sources.map(src => (
				<SourceRow
					key={src}
					source={src}
					checked={!deselectedSources.has(src)}
					onToggle={onToggle}
				/>
			))}
		</div>
		<SpottableButton className={css.btn} onClick={onClose} spotlightId="sources-close-btn">
			{$L('Close')}
		</SpottableButton>
	</OverlayPanel>
);

export const WriteAccessDialog = ({message, onDismiss}) => (
	<OverlayPanel spotlightId="write-access-warning" className={css.warningPanel}>
		<h3 className={css.panelTitle}>{$L('Warning: No Write Access')}</h3>
		<p className={css.panelMessage}>{message}</p>
		<p className={css.panelTip}>
			{$L('Make sure the media folders are writable by the Jellyfin system user on your host.')}
		</p>
		<SpottableButton className={css.btn} onClick={onDismiss} spotlightId="warning-dismiss-btn">
			{$L('Dismiss')}
		</SpottableButton>
	</OverlayPanel>
);

// Full resolution look at a candidate image before committing to it.
export const ImagePreviewDialog = ({image, onUse, onCancel}) => (
	<OverlayPanel spotlightId="zoom-preview" className={css.previewPanel}>
		<div className={css.previewHeader}>
			<h3>{$L('Preview: {provider}').replace('{provider}', image.ProviderName)}</h3>
			{image.Width && image.Height && (
				<span className={css.previewResolution}>{image.Width}x{image.Height}</span>
			)}
		</div>
		<div className={css.previewImgWrapper}>
			<img src={image.Url} className={css.previewImg} alt="" />
		</div>
		<div className={css.formButtons}>
			<SpottableButton className={`${css.btn} ${css.btnPrimary}`} onClick={onUse} spotlightId="preview-use-btn">
				{$L('Use Image')}
			</SpottableButton>
			<SpottableButton className={css.btn} onClick={onCancel} spotlightId="preview-cancel-btn">
				{$L('Cancel')}
			</SpottableButton>
		</div>
	</OverlayPanel>
);
