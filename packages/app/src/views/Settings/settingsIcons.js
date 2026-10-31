// Category art for the settings list, and the small marks the rows draw for themselves.

import {materialIconPath} from './materialIconMap';

import css from './Settings.module.less';

const IconChevron = () => (
	<svg viewBox='0 0 24 24' fill='currentColor'>
		<path d='M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z' />
	</svg>
);

// The reorder buttons draw their arrows as inline SVG rather than Sandstone font
// icons, which render on webOS but not Tizen.
export const IconArrowUp = () => (
	<svg width='36' height='36' viewBox='0 -960 960 960' fill='currentColor' aria-hidden='true' focusable='false'>
		<path d='M480-528 296-344l-56-56 240-240 240 240-56 56-184-184Z' />
	</svg>
);

export const IconArrowDown = () => (
	<svg width='36' height='36' viewBox='0 -960 960 960' fill='currentColor' aria-hidden='true' focusable='false'>
		<path d='M480-344 240-584l56-56 184 184 184-184 56 56-240 240Z' />
	</svg>
);

export const renderSettingsIcon = (iconName) => {
	if (!iconName) return null;

	return (
		<div className={css.listItemIcon}>
			<svg
				className={css.materialIconSvg}
				viewBox='0 -960 960 960'
				fill='currentColor'
				aria-hidden='true'
				focusable='false'
			>
				<path d={materialIconPath(iconName)} />
			</svg>
		</div>
	);
};

export const renderToggle = (isOn) => (
	<div className={`${css.toggleTrack} ${isOn ? css.toggleOn : ''}`}>
		<div className={css.toggleThumb} />
	</div>
);

export const renderRadio = (isSelected) => (
	<div className={`${css.radioOuter} ${isSelected ? css.radioSelected : ''}`}>
		<div className={css.radioInner} />
	</div>
);

export const renderChevron = () => (
	<div className={css.chevronIcon}>
		<IconChevron />
	</div>
);
