import {useCallback} from 'react';
import $L from '@enact/i18n/$L';
import Spottable from '@enact/spotlight/Spottable';
import SpotlightContainerDecorator from '@enact/spotlight/SpotlightContainerDecorator';

import {ChevronDownIcon, LibrariesIcon} from '../icons/navIcons';
import {pointerHover} from '../../utils/focusScroll';
import SidebarItem from './SidebarItem';

import css from './Sidebar.module.less';

const LibrariesContainer = SpotlightContainerDecorator({
	enterTo: 'last-focused'
}, 'div');

const SpottableButton = Spottable('button');

// Collapsible list of the user's libraries. It stays in the DOM while closed so
// the expand animation has something to grow, and only becomes focusable once
// it's actually open.
const SidebarLibraries = ({libraries, slot, expanded, onToggle, onSelectLibrary}) => {
	const handleLibraryClick = useCallback((e) => {
		const libId = e.currentTarget.dataset.libraryId;
		const lib = libraries.find(l => l.Id === libId);
		if (lib) onSelectLibrary?.(lib);
	}, [libraries, onSelectLibrary]);

	const handleLibraryFocus = useCallback((e) => {
		if (pointerHover()) return;
		e.target?.scrollIntoView?.({behavior: 'smooth', block: 'nearest'});
	}, []);

	return (
		<div>
			<SidebarItem
				Icon={LibrariesIcon}
				slot={slot}
				label={$L('Libraries')}
				onClick={onToggle}
				className={`${css.librariesToggle} ${expanded ? css.librariesExpandedState : ''}`}
			>
				<ChevronDownIcon className={css.chevron} />
			</SidebarItem>

			<LibrariesContainer
				className={`${css.librariesList} ${expanded ? css.librariesListExpanded : ''}`}
				spotlightDisabled={!expanded}
			>
				{libraries.map((lib, index) => (
					<SpottableButton
						key={lib.Id}
						className={css.libraryItem}
						onClick={handleLibraryClick}
						onFocus={handleLibraryFocus}
						data-library-id={lib.Id}
						data-nav-slot={(index % 16) + 1}
					>
						<span className={css.libraryName}>{lib.Name}</span>
					</SpottableButton>
				))}
			</LibrariesContainer>
		</div>
	);
};

export default SidebarLibraries;
