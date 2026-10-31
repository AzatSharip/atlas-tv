/* eslint-disable react/jsx-no-bind */
import $L from '@enact/i18n/$L';
import Button from '@enact/sandstone/Button';

import {getPluginSectionSourceLabel, isHomeRowVisibleByGates} from './homeSectionsModel';
import {IconArrowUp, IconArrowDown, renderToggle} from './settingsIcons';
import {SpottableDiv} from './settingsSpottables';
import {SectionTitle, OptionRow} from './settingsRows';
import SettingsView from './SettingsView';

import css from './Settings.module.less';

// Rows the viewer has switched off elsewhere are filtered out, so the up and down buttons
// step between the rows actually on show rather than over gaps.
const HomeRowsView = ({
	settings,
	rowsTypeCaption,
	onOpenRowsType,
	tempHomeRows,
	tempPluginSections,
	pluginSectionRenderLimit,
	onShowMoreSections,
	onToggleHomeRow,
	onMoveHomeRowUp,
	onMoveHomeRowDown,
	onTogglePluginSection,
	onMovePluginSectionUp,
	onMovePluginSectionDown,
	onReset,
	onSave
}) => (
	<SettingsView spotlightId='homerows-view'>
		<SectionTitle>{$L('Configure Home Rows')}</SectionTitle>
		<div className={css.viewDescription}>
			{$L('Enable/disable and reorder the rows that appear on your home screen.')}
		</div>
		<OptionRow
			settingKey='homeRowsStyle'
			title={$L('Row Type')}
			caption={rowsTypeCaption}
			icon='appscontents'
			onOpen={onOpenRowsType}
		/>
		{tempHomeRows.filter((row) => isHomeRowVisibleByGates(row.id, settings)).map((row, index, visibleRows) => (
			<div key={row.id} className={css.homeRowItem}>
				<SpottableDiv
					className={css.listItem}
					onClick={() => onToggleHomeRow(row.id)}
					spotlightId={`homerow-${row.id}`}
				>
					<div className={css.listItemBody}>
						<div className={css.listItemHeading}>{$L(row.name)}</div>
					</div>
					<div className={css.listItemTrailing}>{renderToggle(row.enabled)}</div>
				</SpottableDiv>
				<div className={css.homeRowControls}>
					<Button
						onClick={() => onMoveHomeRowUp(row.id)}
						disabled={index === 0}
						size='small'
						aria-label={$L('Up')}
						spotlightId={`homerow-up-${row.id}`}
					>
						<IconArrowUp />
					</Button>
					<Button
						onClick={() => onMoveHomeRowDown(row.id)}
						disabled={index === visibleRows.length - 1}
						size='small'
						aria-label={$L('Down')}
						spotlightId={`homerow-down-${row.id}`}
					>
						<IconArrowDown />
					</Button>
				</div>
			</div>
		))}
		{tempPluginSections.length > 0 && (
			<>
				<SectionTitle>{$L('Plugin Sections')}</SectionTitle>
				{tempPluginSections.slice(0, pluginSectionRenderLimit).map((section, index) => (
					<div key={section.id} className={css.homeRowItem}>
						<SpottableDiv
							className={css.listItem}
							onClick={() => onTogglePluginSection(section.id)}
							spotlightId={`pluginrow-${section.id}`}
						>
							<div className={css.listItemBody}>
								<div className={css.listItemHeading}>{section.name}</div>
								<div className={css.listItemCaption}>{getPluginSectionSourceLabel(section.source)}</div>
							</div>
							<div className={css.listItemTrailing}>{renderToggle(section.enabled)}</div>
						</SpottableDiv>
						<div className={css.homeRowControls}>
							<Button
								onClick={() => onMovePluginSectionUp(section.id)}
								disabled={index === 0}
								size='small'
								aria-label={$L('Up')}
								spotlightId={`pluginrow-up-${section.id}`}
							>
								<IconArrowUp />
							</Button>
							<Button
								onClick={() => onMovePluginSectionDown(section.id)}
								disabled={index === tempPluginSections.length - 1}
								size='small'
								aria-label={$L('Down')}
								spotlightId={`pluginrow-down-${section.id}`}
							>
								<IconArrowDown />
							</Button>
						</div>
					</div>
				))}
				{tempPluginSections.length > pluginSectionRenderLimit && (
					<div className={css.actionBar}>
						<Button
							onClick={onShowMoreSections}
							size='small'
							spotlightId='pluginrow-show-more'
						>
							{$L('Show More')} ({tempPluginSections.length - pluginSectionRenderLimit})
						</Button>
					</div>
				)}
			</>
		)}
		<div className={css.actionBar}>
			<Button onClick={onReset} size='small' spotlightId='homerow-reset'>
				{$L('Reset to defaults')}
			</Button>
			<Button onClick={onSave} size='small' spotlightId='homerow-save'>
				{$L('Save')}
			</Button>
		</div>
	</SettingsView>
);

export default HomeRowsView;
