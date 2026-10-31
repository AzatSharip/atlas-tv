import {useLayoutEffect, useRef} from 'react';

import {startFrames} from './loadingAnimationLayout';

import css from './LoadingAnimation.module.less';

// Drifts its child around the area inside [padding] and turns it off the walls, the way the old
// DVD screensaver did. The two speeds don't divide evenly, so it wanders rather than repeating a
// short loop. [children] is called with a ref that says whether it's heading left.
const BouncingPosition = ({speed, padding, children}) => {
	const areaRef = useRef(null);
	const boxRef = useRef(null);
	const speedRef = useRef(speed);
	const movingLeft = useRef(false);
	const motion = useRef({x: -0.5, y: -0.3, vx: 0.42, vy: 0.54});
	speedRef.current = speed;

	useLayoutEffect(() => {
		let last = null;
		return startFrames((elapsed) => {
			const m = motion.current;
			const dt = last == null ? 0 : Math.min(0.05, (elapsed - last) / 1000);
			last = elapsed;
			m.x += m.vx * dt * speedRef.current;
			m.y += m.vy * dt * speedRef.current;
			if (m.x >= 1) {
				m.x = 1;
				m.vx = -Math.abs(m.vx);
			} else if (m.x <= -1) {
				m.x = -1;
				m.vx = Math.abs(m.vx);
			}
			if (m.y >= 1) {
				m.y = 1;
				m.vy = -Math.abs(m.vy);
			} else if (m.y <= -1) {
				m.y = -1;
				m.vy = Math.abs(m.vy);
			}
			movingLeft.current = m.vx < 0;

			const area = areaRef.current;
			const box = boxRef.current;
			if (!area || !box) return;
			const left = Math.round(((m.x + 1) / 2) * (area.clientWidth - box.offsetWidth));
			const top = Math.round(((m.y + 1) / 2) * (area.clientHeight - box.offsetHeight));
			const transform = 'translate(' + left + 'px, ' + top + 'px)';
			box.style.webkitTransform = transform;
			box.style.transform = transform;
		});
	}, []);

	return (
		<div ref={areaRef} className={css.bounceArea} style={{top: padding, right: padding, bottom: padding, left: padding}}>
			<div ref={boxRef} className={css.bounceBox}>
				{children(movingLeft)}
			</div>
		</div>
	);
};

export default BouncingPosition;
