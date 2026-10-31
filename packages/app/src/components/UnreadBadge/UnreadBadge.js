import css from './UnreadBadge.module.less';

// A small red circle with a count, sitting on the top right corner of its
// child. Counts above 9 show as 9+ to keep the circle small enough for a
// collapsed nav icon.
const UnreadBadge = ({count = 0, className = '', children}) => (
	<span className={[css.host, className].filter(Boolean).join(' ')}>
		{children}
		{count > 0 && <span className={css.badge}>{count > 9 ? '9+' : count}</span>}
	</span>
);

export default UnreadBadge;
