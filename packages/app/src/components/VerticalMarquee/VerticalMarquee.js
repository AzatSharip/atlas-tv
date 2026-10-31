import {useEffect, useRef} from 'react';
import {rem, rootScale} from '../../utils/rootScale';

import css from './VerticalMarquee.module.less';

const setOffset = (node, offset, duration) => {
	node.style.webkitTransition = duration > 0 ? `-webkit-transform ${duration}ms linear` : 'none';
	node.style.transition = duration > 0 ? `transform ${duration}ms linear` : 'none';
	node.style.webkitTransform = `translateY(${-offset}px)`;
	node.style.transform = `translateY(${-offset}px)`;
};

// Text longer than its lines scrolls up through the rest and starts over. The pause comes first,
// the scroll runs at a steady pace per pixel, the text holds at the end for as long as the visible
// lines took to pass, then it snaps back. The line height and the pace are in design pixels.
const VerticalMarquee = ({text, lines, lineHeight, msPerPixel, pauseMs, className}) => {
	const viewportRef = useRef(null);
	const contentRef = useRef(null);
	const height = lines * lineHeight;

	useEffect(() => {
		const content = contentRef.current;
		const viewport = viewportRef.current;
		if (!content || !viewport) return undefined;
		setOffset(content, 0, 0);
		const textHeight = content.scrollHeight;
		const maxOffset = textHeight - viewport.clientHeight;
		if (maxOffset <= 0.5) return undefined;

		const pace = msPerPixel / rootScale();
		let timer = null;
		const cycle = () => {
			timer = setTimeout(() => {
				setOffset(content, maxOffset, maxOffset * pace);
				timer = setTimeout(() => {
					setOffset(content, 0, 0);
					cycle();
				}, textHeight * pace);
			}, pauseMs);
		};
		cycle();
		return () => clearTimeout(timer);
	}, [text, height, msPerPixel, pauseMs]);

	return (
		<div ref={viewportRef} className={`${css.viewport} ${className || ''}`} style={{maxHeight: rem(height)}}>
			<div ref={contentRef} className={css.content}>{text}</div>
		</div>
	);
};

export default VerticalMarquee;
