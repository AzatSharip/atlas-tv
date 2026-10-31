/* eslint-disable react/jsx-no-bind */
import $L from '@enact/i18n/$L';
import Button from '@enact/sandstone/Button';

import {renderToggle} from './settingsIcons';
import {SpottableDiv} from './settingsSpottables';
import {SectionTitle} from './settingsRows';
import SettingsView from './SettingsView';

import css from './Settings.module.less';

// In unified mode the same library name can appear once per server, so each row says which
// server it came from.
const LibrariesView = ({
	libraries,
	hiddenLibraries,
	showServerName,
	loading,
	saving,
	onToggleLibrary,
	onCancel,
	onSave
}) => (
	<SettingsView spotlightId='libraries-view'>
		<SectionTitle>{$L('Hide Libraries')}</SectionTitle>
		<div className={css.viewDescription}>
			{$L('Hidden libraries are removed from all Jellyfin clients. This is a server-level setting.')}
		</div>
		{loading ? (
			<div className={css.loadingMessage}>{$L('Loading libraries...')}</div>
		) : (
			libraries.map((lib) => {
				const isHidden = hiddenLibraries.includes(lib.Id);
				return (
					<SpottableDiv
						key={`${lib._serverUrl || 'local'}-${lib.Id}`}
						className={css.listItem}
						onClick={() => onToggleLibrary(lib.Id)}
						spotlightId={`lib-${lib.Id}`}
					>
						<div className={css.listItemBody}>
							<div className={css.listItemHeading}>
								{lib.Name}
								{showServerName && lib._serverName ? ` (${lib._serverName})` : ''}
							</div>
							<div className={css.listItemCaption}>{isHidden ? $L('Hidden') : $L('Visible')}</div>
						</div>
						<div className={css.listItemTrailing}>{renderToggle(!isHidden)}</div>
					</SpottableDiv>
				);
			})
		)}
		{!loading && (
			<div className={css.actionBar}>
				<Button onClick={onCancel} size='small' spotlightId='lib-cancel'>
					{$L('Cancel')}
				</Button>
				<Button onClick={onSave} size='small' disabled={saving} spotlightId='lib-save'>
					{saving ? $L('Saving...') : $L('Save')}
				</Button>
			</div>
		)}
	</SettingsView>
);

export default LibrariesView;
