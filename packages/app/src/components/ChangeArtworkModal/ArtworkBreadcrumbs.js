import {useCallback} from 'react';

import {SpottableButton} from './artworkSpottables';

import css from './ChangeArtworkModal.module.less';

const Crumb = ({id, name, onNavigate}) => {
	const handleClick = useCallback(() => {
		onNavigate?.(id);
	}, [onNavigate, id]);

	return (
		<SpottableButton className={css.breadcrumbLink} onClick={handleClick}>
			{name}
		</SpottableButton>
	);
};

const Separator = () => <span className={css.breadcrumbSep}> \ </span>;

// Episodes and seasons get clickable ancestors so artwork can be fixed up the
// chain without leaving the modal. Everything else is just its own name.
const ArtworkBreadcrumbs = ({item, onNavigate}) => {
	const {Type, Name, SeriesName, SeriesId, SeasonName, SeasonId} = item;
	const showSeries = (Type === 'Episode' || Type === 'Season') && SeriesName;
	const showSeason = Type === 'Episode' && SeasonName;

	return (
		<div className={css.breadcrumbs}>
			{showSeries && <Crumb id={SeriesId} name={SeriesName} onNavigate={onNavigate} />}
			{showSeries && <Separator />}
			{showSeason && <Crumb id={SeasonId} name={SeasonName} onNavigate={onNavigate} />}
			{showSeason && <Separator />}
			<span className={css.breadcrumbText}>{Name}</span>
		</div>
	);
};

export default ArtworkBreadcrumbs;
