import {memo} from 'react';
import $L from '@enact/i18n/$L';

import css from './SeerrMediaTypeBadge.module.less';

// The MOVIE / SERIES badge that sits on the corner of Seerr artwork. mediaType
// is Seerr's own string, movie or tv, and anything else reads as a series,
// which is what the API sends for shows. suffix is appended after a separator,
// for the requests grid's MOVIE · 4K.
const SeerrMediaTypeBadge = ({mediaType, suffix, className = ''}) => {
	const isMovie = String(mediaType || '').toLowerCase() === 'movie';
	const label = (isMovie ? $L('Movie') : $L('Series')).toUpperCase();
	return (
		<span className={[css.badge, isMovie ? css.movie : css.show, className].filter(Boolean).join(' ')}>
			{suffix ? `${label} · ${suffix}` : label}
		</span>
	);
};

export default memo(SeerrMediaTypeBadge);
