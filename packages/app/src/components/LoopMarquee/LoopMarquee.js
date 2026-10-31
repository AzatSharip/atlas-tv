import {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {TV_CANVAS_SCALE} from '../../utils/liveTvGuide';
import {rootScale} from '../../utils/rootScale';

import css from './LoopMarquee.module.less';

// 50ms a canvas point, with a 1.5 second rest between runs.
const MS_PER_PIXEL = 50 / TV_CANVAS_SCALE;
const PAUSE_MS = 1500;

const setOffset = (node, offset, duration) => {
	node.style.webkitTransition = duration > 0 ? `-webkit-transform ${duration}ms linear` : 'none';
	node.style.transition = duration > 0 ? `transform ${duration}ms linear` : 'none';
	node.style.webkitTransform = `translateX(${-offset}px)`;
	node.style.transform = `translateX(${-offset}px)`;
};

// A line too long for its box scrolls while `active`, with a second copy trailing the first
// behind a dot so the start comes round again without a jump. It rests, scrolls one copy along at
// a steady pace, snaps back to where it began and goes again. The box is the element's max-width
// when it has one, since a box still opening up would read as too narrow for anything.
const LoopMarquee = ({text, active, className}) => {
	const viewportRef = useRef(null);
	const trackRef = useRef(null);
	const firstRef = useRef(null);
	const secondRef = useRef(null);
	const [overflows, setOverflows] = useState(false);

	useLayoutEffect(() => {
		const viewport = viewportRef.current;
		const first = firstRef.current;
		if (!active || !viewport || !first) {
			setOverflows(false);
			return;
		}
		const limit = parseFloat(window.getComputedStyle(viewport).maxWidth) || viewport.clientWidth;
		setOverflows(first.offsetWidth > limit + 0.5);
	}, [active, text]);

	useEffect(() => {
		const track = trackRef.current;
		const second = secondRef.current;
		if (!overflows || !track || !second) return undefined;
		const distance = second.offsetLeft;
		const duration = distance * MS_PER_PIXEL / rootScale();
		let timer = null;
		const cycle = () => {
			timer = setTimeout(() => {
				setOffset(track, distance, duration);
				timer = setTimeout(() => {
					setOffset(track, 0, 0);
					cycle();
				}, duration);
			}, PAUSE_MS);
		};
		cycle();
		return () => {
			clearTimeout(timer);
			setOffset(track, 0, 0);
		};
	}, [overflows, text]);

	return (
		<span ref={viewportRef} className={`${css.viewport} ${className || ''}`}>
			<span ref={trackRef} className={overflows ? css.track : null}>
				<span ref={firstRef}>{text}</span>
				{overflows && <span className={css.dot} />}
				{overflows && <span ref={secondRef} aria-hidden="true">{text}</span>}
			</span>
		</span>
	);
};

export default LoopMarquee;
