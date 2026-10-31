import Spottable from '@enact/spotlight/Spottable';
import UnreadBadge from '../UnreadBadge';

import css from './NavBar.module.less';

const SpottableButton = Spottable('button');

// One entry in the centre pill, an icon that grows a label when focused. Every
// nav destination goes through this so they all look and behave the same. The
// slot lets themes with a nav color cycle tint each entry on its own. A badge
// count draws as a small red circle on the icon, and zero draws nothing.
const NavPillButton = ({Icon, slot, label, onClick, spotlightId, active = false, isDefault = false, className = '', onSpotlightLeft, badge = 0}) => (
	<SpottableButton
		className={[css.navBtn, css.navBtnIcon, css.expandableBtn, active && css.active, isDefault && 'spottable-default', className].filter(Boolean).join(' ')}
		onClick={onClick}
		spotlightId={spotlightId}
		onSpotlightLeft={onSpotlightLeft}
		data-nav-slot={slot}
	>
		<UnreadBadge count={badge}>
			<Icon className={css.navIcon} />
		</UnreadBadge>
		<span className={css.expandLabel}>{label}</span>
	</SpottableButton>
);

export default NavPillButton;
