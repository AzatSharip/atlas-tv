import {createContext, useContext} from 'react';

import css from './Skeleton.module.less';

const ShimmerScope = createContext(false);

const px = (value) => (typeof value === 'number' ? value + 'px' : value);

// Breathes placeholders in and out while something loads. A screen wraps its whole skeleton,
// and the pieces it's built from wrap themselves so they still breathe when used alone.
// Nesting two would multiply their opacity and let the two drift apart, so the inner one
// passes its children straight through.
export const SkeletonShimmer = ({className, style, children}) => {
	const nested = useContext(ShimmerScope);
	if (nested) return <div className={className} style={style}>{children}</div>;
	return (
		<ShimmerScope.Provider value>
			<div className={className ? `${css.shimmer} ${className}` : css.shimmer} style={style}>
				{children}
			</div>
		</ShimmerScope.Provider>
	);
};

// A rounded placeholder in the theme's text color at low strength. Sizes given as numbers are
// pixels, and a stylesheet class can size it instead so it scales with the rest of the screen.
export const SkeletonBox = ({className, width, height, radius = 8, style}) => (
	<div
		className={className ? `${css.box} ${className}` : css.box}
		style={{width: px(width), height: px(height), borderRadius: px(radius), ...style}}
	/>
);
