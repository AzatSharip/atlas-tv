import {ViewContainer} from './settingsSpottables';

import {keepFocusInView} from '../../utils/focusScroll';

import css from './Settings.module.less';

// The frame every settings screen sits in. Each one is a single spotlight container, which
// is also what the focus fallback lands on when a screen has nothing better to offer.
const SettingsView = ({spotlightId, children}) => {
	return (
		<ViewContainer className={css.viewContainer} spotlightId={spotlightId}>
			<div className={css.listContent} onFocus={keepFocusInView}>
				<div className={css.listInner}>
					{children}
				</div>
			</div>
		</ViewContainer>
	);
};

export default SettingsView;
