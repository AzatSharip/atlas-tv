import {SpottableDiv} from '../../detailsSpottables';
import {iconViewBox} from '../../../../components/icons/iconViewBox';
import {DETAIL_ICON_PATHS} from '../../detailIcons';

import css from './NouveauCards.module.less';

// A face in the cast and crew rail. The avatar is a circle inside the card's width rather than the
// whole of it, so the names underneath have room to sit without the faces touching.
const NouveauPeopleCard = ({name, role, imageUrl, width, avatarSize, selectKey, onSelect, spotlightId}) => (
	<SpottableDiv
		className={css.person}
		style={{width: `${width}px`}}
		spotlightId={spotlightId}
		data-select-key={selectKey}
		onClick={onSelect}
	>
		<div className={css.avatar} style={{width: `${avatarSize}px`, height: `${avatarSize}px`}}>
			{imageUrl
				? <img className={css.artworkImage} src={imageUrl} alt="" />
				: (
					<div className={css.placeholder}>
						<svg
							className={css.placeholderIcon}
							viewBox={iconViewBox(DETAIL_ICON_PATHS.group)}
							fill="currentColor"
							aria-hidden="true"
						>
							<path d={DETAIL_ICON_PATHS.group} />
						</svg>
					</div>
				)}
		</div>
		{name && <span className={css.personName}>{name}</span>}
		{role && <span className={css.personRole}>{role}</span>}
	</SpottableDiv>
);

export default NouveauPeopleCard;
