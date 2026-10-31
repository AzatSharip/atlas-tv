import {memo, useCallback, useEffect, useMemo, useState} from 'react';
import Popup from '@enact/sandstone/Popup';
import Button from '@enact/sandstone/Button';
import $L from '@enact/i18n/$L';

import seerrApi from '../../services/seerrApi';
import {LastFocusedContainer, SpottableDiv} from './seerrFocus';

import css from './SeerrPopups.module.less';

// Picks which server and profile a request goes to, for viewers allowed to override the
// defaults.

export const AdvancedOptionsPopup = memo(({open, title, servers, is4k, onConfirm, onClose}) => {
	const [selectedServerId, setSelectedServerId] = useState(null);
	const [serverDetails, setServerDetails] = useState(null);
	const [loadingDetails, setLoadingDetails] = useState(false);
	const [selectedProfileId, setSelectedProfileId] = useState(null);
	const [selectedRootFolder, setSelectedRootFolder] = useState(null);

	const availableServers = useMemo(() =>
		(servers || []).filter(s => s.is4k === is4k),
	[servers, is4k]);

	useEffect(() => {
		if (open && availableServers.length > 0) {
			const defaultServer = availableServers[0];
			setSelectedServerId(defaultServer.id);
		}
	}, [open, availableServers]);

	useEffect(() => {
		if (selectedServerId == null || !open) return;

		const loadServerDetails = async () => {
			setLoadingDetails(true);
			try {
				const server = availableServers.find(s => s.id === selectedServerId);
				if (!server) return;

				const details = server.isRadarr !== false
					? await seerrApi.getRadarrServerDetails(selectedServerId)
					: await seerrApi.getSonarrServerDetails(selectedServerId);

				setServerDetails(details);

				if (details.profiles?.length > 0) {
					const defaultProfile = details.profiles.find(p => p.id === details.activeProfileId) || details.profiles[0];
					setSelectedProfileId(defaultProfile?.id);
				}
				if (details.rootFolders?.length > 0) {
					const defaultFolder = details.rootFolders.find(f => f.path === details.activeDirectory) || details.rootFolders[0];
					setSelectedRootFolder(defaultFolder?.path);
				}
			} catch (err) {
				console.error('Failed to load server details:', err);
			} finally {
				setLoadingDetails(false);
			}
		};

		loadServerDetails();
	}, [selectedServerId, open, availableServers]);

	useEffect(() => {
		if (!open) {
			setSelectedServerId(null);
			setServerDetails(null);
			setSelectedProfileId(null);
			setSelectedRootFolder(null);
		}
	}, [open]);

	const handleServerChange = useCallback((e) => {
		setSelectedServerId(parseInt(e.currentTarget.dataset.serverid, 10));
	}, []);

	const handleProfileChange = useCallback((e) => {
		setSelectedProfileId(parseInt(e.currentTarget.dataset.profileid, 10));
	}, []);

	const handleFolderChange = useCallback((e) => {
		setSelectedRootFolder(e.currentTarget.dataset.folderpath);
	}, []);

	const handleConfirm = useCallback(() => {
		onConfirm({
			serverId: selectedServerId,
			profileId: selectedProfileId,
			rootFolder: selectedRootFolder
		});
	}, [selectedServerId, selectedProfileId, selectedRootFolder, onConfirm]);

	const handleSkip = useCallback(() => {
		onConfirm(null);
	}, [onConfirm]);

	const canConfirm = selectedServerId != null;

	return (
		<Popup open={open} onClose={onClose} position="center">
			<div className={`${css.popupSurface} ${css.advancedPopupContent}`}>
				<h2 className={css.advancedPopupTitle}>{$L('Request Options')}</h2>
				<p className={css.advancedPopupSubtitle}>{title} ({is4k ? '4K' : 'HD'})</p>

				<LastFocusedContainer className={css.advancedOptionsList} spotlightId="advanced-options">
					{loadingDetails ? (
						<div className={css.advancedLoading}>{$L('Loading server options...')}</div>
					) : (
						<>
							{availableServers.length > 1 && (
								<div className={css.advancedOptionGroup}>
									<label className={css.advancedOptionLabel}>{$L('Server')}</label>
									<div className={css.advancedOptionButtons}>
										{availableServers.map(server => (
											<SpottableDiv
												key={server.id}
												className={`${css.advancedOptionBtn} ${selectedServerId === server.id ? css.advancedOptionBtnSelected : ''}`}
												onClick={handleServerChange}
												data-serverid={server.id}
											>
												{server.name}
											</SpottableDiv>
										))}
									</div>
								</div>
							)}

							{serverDetails?.profiles?.length > 0 && (
								<div className={css.advancedOptionGroup}>
									<label className={css.advancedOptionLabel}>{$L('Quality Profile')}</label>
									<div className={css.advancedOptionButtons}>
										{serverDetails.profiles.map(profile => (
											<SpottableDiv
												key={profile.id}
												className={`${css.advancedOptionBtn} ${selectedProfileId === profile.id ? css.advancedOptionBtnSelected : ''}`}
												onClick={handleProfileChange}
												data-profileid={profile.id}
											>
												{profile.name}
											</SpottableDiv>
										))}
									</div>
								</div>
							)}

							{serverDetails?.rootFolders?.length > 0 && (
								<div className={css.advancedOptionGroup}>
									<label className={css.advancedOptionLabel}>{$L('Download Location')}</label>
									<div className={css.advancedOptionButtons}>
										{serverDetails.rootFolders.map(folder => (
											<SpottableDiv
												key={folder.id}
												className={`${css.advancedOptionBtn} ${selectedRootFolder === folder.path ? css.advancedOptionBtnSelected : ''}`}
												onClick={handleFolderChange}
												data-folderpath={folder.path}
											>
												{folder.path}
											</SpottableDiv>
										))}
									</div>
								</div>
							)}
						</>
					)}

					<div className={css.advancedPopupButtons}>
						<Button
							className={`${css.advancedConfirmButton} ${!canConfirm ? css.advancedButtonDisabled : ''}`}
							onClick={handleConfirm}
							disabled={!canConfirm || loadingDetails}
						>
							{$L('Continue with Options')}
						</Button>
						<Button className={css.advancedSkipButton} onClick={handleSkip}>
							{$L('Use Defaults')}
						</Button>
						<Button className={css.advancedCancelButton} onClick={onClose}>
							{$L('Cancel')}
						</Button>
					</div>
				</LastFocusedContainer>
			</div>
		</Popup>
	);
});
