import $L from '@enact/i18n/$L';

import RatingsRow from '../RatingsRow';
import {getInfoBits} from './shuffleHelpers';

import css from './ShuffleOverlay.module.less';

// Details for whichever card is currently focused.
const ShuffleInfoPanel = ({item, serverUrl, mdblistEnabled}) => {
	const infoBits = getInfoBits(item);

	return (
		<div className={css.infoPanel}>
			<div className={css.itemTitle}>{item?.Name || $L('No items found')}</div>
			<div className={css.metaLine}>
				{infoBits.map((text) => (
					<span key={text} className={css.metaItem}>{text}</span>
				))}
			</div>
			<div className={css.ratingsLine}>
				<RatingsRow item={item} serverUrl={serverUrl} compact pluginEnabled={mdblistEnabled} />
			</div>
			<div className={css.overview}>{item?.Overview || $L('Discover a random item from your library.')}</div>
		</div>
	);
};

export default ShuffleInfoPanel;
