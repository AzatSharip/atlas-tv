import {memo} from 'react';

import {downloadLabelParts} from '../../utils/seerrStatus';

import css from './SeerrDownloadProgress.module.less';

// Progress bar for an active Seerr download. Plain divs, not Spottable, so 5-way
// focus order is unaffected. summary comes from getDownloadSummary or
// getMediaDownloadSummary in utils/seerrStatus. compact is for a poster tile,
// where the verb has no room and the sizes give way before the percentage does.
const SeerrDownloadProgress = ({summary, prefix, compact = false}) => {
	if (!summary) return null;
	const pct = Math.round(summary.fraction * 100);
	const {leading, percent} = downloadLabelParts(summary, compact);
	const lead = leading && prefix ? `${prefix} · ${leading}` : leading;
	return (
		<div className={compact ? `${css.container} ${css.compact}` : css.container}>
			<div className={css.label}>
				{lead && <span className={css.leading}>{lead}</span>}
				{lead && percent && <span className={css.separator}> · </span>}
				{percent && <span className={css.percent}>{percent}</span>}
			</div>
			<div className={css.track}>
				<div className={css.fill} style={{width: `${pct}%`}} />
			</div>
		</div>
	);
};

export default memo(SeerrDownloadProgress);
