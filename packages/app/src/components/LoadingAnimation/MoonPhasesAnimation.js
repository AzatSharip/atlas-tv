import {useEffect, useRef} from 'react';

import {startFrames} from './loadingAnimationLayout';

import css from './LoadingAnimation.module.less';

const SAMPLES = 48;

const PALETTES = {
	natural: {
		glow: 'rgba(56, 189, 248, 0.118)',
		base: [[0, '#0f172a'], [1, '#020617']],
		lit: [[0, '#ffffff'], [0.40, '#f8fafc'], [0.75, '#e2e8f0'], [1, '#cbd5e1']],
		rim: 'rgba(255, 255, 255, 0.176)',
		maria: true
	},
	moonfin: {
		glow: 'rgba(0, 164, 220, 0.118)',
		base: [[0, '#0e1118'], [1, '#000000']],
		lit: [[0.10, '#aa5cc3'], [0.20, '#9c62c5'], [0.40, '#7672cb'], [0.66, '#3a8cd4'], [0.90, '#00a4dc']],
		litLinear: true,
		rim: 'rgba(0, 164, 220, 0.157)'
	},
	neonfin: {
		glow: 'rgba(255, 46, 146, 0.118)',
		base: [[0, '#66f0ff'], [0.40, '#00e5ff'], [0.80, '#00b8cc'], [1, '#008fa0']],
		lit: [[0, '#ff66ad'], [0.40, '#ff2e92'], [0.80, '#d61874'], [1, '#a80a55']],
		rim: 'rgba(0, 229, 255, 0.196)'
	}
};

const gradient = (ctx, stops, linear, cx, cy, radius) => {
	const shade = linear
		? ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius)
		: ctx.createRadialGradient(cx - (radius * 0.25), cy - (radius * 0.25), 0, cx - (radius * 0.25), cy - (radius * 0.25), radius * 1.8);
	stops.forEach(([offset, color]) => shade.addColorStop(offset, color));
	return shade;
};

// Canvas here can't blur a shape, but it can blur a shadow. So the shape is drawn well off to
// the side and only its shadow, cast back onto the spot, is left to see.
const BLUR_THROW = 10000;
const blurred = (ctx, sigma, color, draw) => {
	ctx.save();
	ctx.shadowColor = color;
	ctx.shadowBlur = sigma * 2;
	ctx.shadowOffsetX = BLUR_THROW;
	ctx.fillStyle = '#000';
	ctx.strokeStyle = '#000';
	ctx.translate(-BLUR_THROW, 0);
	draw();
	ctx.restore();
};

const oval = (ctx, x, y, width, height) => {
	ctx.save();
	ctx.translate(x, y);
	ctx.scale(width / 2, height / 2);
	ctx.beginPath();
	ctx.arc(0, 0, 1, 0, Math.PI * 2);
	ctx.restore();
	ctx.fill();
};

// The seas of the real moon, softened so they blend like terrain, and on the lit side the bright
// ray craters Tycho and Copernicus.
const drawMaria = (ctx, cx, cy, r, lit) => {
	blurred(ctx, r * 0.12, lit ? 'rgba(100, 116, 139, 0.216)' : 'rgba(0, 0, 0, 0.353)', () => {
		oval(ctx, cx - (r * 0.28), cy - (r * 0.30), r * 0.44, r * 0.38);
		oval(ctx, cx - (r * 0.45), cy + (r * 0.05), r * 0.38, r * 0.55);
		oval(ctx, cx + (r * 0.22), cy - (r * 0.24), r * 0.34, r * 0.30);
		oval(ctx, cx + (r * 0.32), cy - (r * 0.02), r * 0.38, r * 0.32);
		oval(ctx, cx + (r * 0.36), cy + (r * 0.22), r * 0.28, r * 0.24);
		oval(ctx, cx + (r * 0.54), cy - (r * 0.14), r * 0.18, r * 0.14);
		oval(ctx, cx - (r * 0.16), cy + (r * 0.34), r * 0.36, r * 0.30);
	});
	if (!lit) return;

	const tychoX = cx - (r * 0.08);
	const tychoY = cy + (r * 0.52);
	const copernicusX = cx - (r * 0.22);
	const copernicusY = cy - (r * 0.08);

	blurred(ctx, 1, 'rgba(255, 255, 255, 0.137)', () => {
		ctx.lineWidth = Math.min(1.5, Math.max(0.5, 0.8 * (r / 50)));
		[[-0.25, -0.20], [0.28, -0.22], [-0.05, -0.35]].forEach(([dx, dy]) => {
			ctx.beginPath();
			ctx.moveTo(tychoX, tychoY);
			ctx.lineTo(tychoX + (r * dx), tychoY + (r * dy));
			ctx.stroke();
		});
	});

	ctx.fillStyle = 'rgba(255, 255, 255, 0.824)';
	ctx.beginPath();
	ctx.arc(tychoX, tychoY, r * 0.035, 0, Math.PI * 2);
	ctx.fill();
	ctx.beginPath();
	ctx.arc(copernicusX, copernicusY, r * 0.030, 0, Math.PI * 2);
	ctx.fill();
};

// Everything that doesn't change with the phase: the glow, which reaches past the moon's own
// square, the night side and its seas.
const paintBackdrop = (canvas, size, palette) => {
	const ctx = canvas.getContext('2d');
	if (!ctx) return;
	const center = canvas.width / 2;
	const r = size * 0.40;
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	blurred(ctx, r * 0.40, palette.glow, () => {
		ctx.beginPath();
		ctx.arc(center, center, r * 1.12, 0, Math.PI * 2);
		ctx.fill();
	});

	ctx.fillStyle = gradient(ctx, palette.base, false, center, center, r);
	ctx.beginPath();
	ctx.arc(center, center, r, 0, Math.PI * 2);
	ctx.fill();

	if (palette.maria) drawMaria(ctx, center, center, r, false);
};

// The lit side traced down the limb and back up the terminator, which sweeps across as the
// phase goes from new through full and back.
const tracePhase = (ctx, phase, cx, cy, r) => {
	const cosT = Math.cos(phase * 2 * Math.PI);
	const waxing = phase < 0.5;
	ctx.beginPath();
	for (let i = 0; i <= SAMPLES; i++) {
		const y = -r + (2 * r * i / SAMPLES);
		const w = Math.sqrt(Math.max(0, (r * r) - (y * y)));
		const x = waxing ? w : -w;
		if (i === 0) ctx.moveTo(cx + x, cy + y);
		else ctx.lineTo(cx + x, cy + y);
	}
	for (let i = SAMPLES; i >= 0; i--) {
		const y = -r + (2 * r * i / SAMPLES);
		const w = Math.sqrt(Math.max(0, (r * r) - (y * y)));
		ctx.lineTo(cx + (waxing ? w * cosT : -w * cosT), cy + y);
	}
	ctx.closePath();
};

// A moon going through its phases, new to full and back, every six seconds at full speed.
const MoonPhasesAnimation = ({size, speed, palette: paletteName}) => {
	const backdropRef = useRef(null);
	const phaseRef = useRef(null);

	useEffect(() => {
		const palette = PALETTES[paletteName];
		paintBackdrop(backdropRef.current, size, palette);

		const ctx = phaseRef.current.getContext('2d');
		if (!ctx) return undefined;

		const center = size / 2;
		const r = size * 0.40;
		const litShade = gradient(ctx, palette.lit, palette.litLinear, center, center, r);
		const rimWidth = Math.min(2, Math.max(0.8, 1.4 * (size / 100)));
		let litMaria = null;
		if (palette.maria) {
			litMaria = document.createElement('canvas');
			litMaria.width = size;
			litMaria.height = size;
			drawMaria(litMaria.getContext('2d'), center, center, r, true);
		}

		const period = 6000 / speed;
		return startFrames((elapsed) => {
			ctx.clearRect(0, 0, size, size);
			tracePhase(ctx, (elapsed % period) / period, center, center, r);
			ctx.fillStyle = litShade;
			ctx.fill();
			if (litMaria) {
				ctx.save();
				ctx.clip();
				ctx.drawImage(litMaria, 0, 0);
				ctx.restore();
			}
			ctx.strokeStyle = palette.rim;
			ctx.lineWidth = rimWidth;
			ctx.beginPath();
			ctx.arc(center, center, r, 0, Math.PI * 2);
			ctx.stroke();
		});
	}, [size, speed, paletteName]);

	return (
		<div className={css.moon} style={{width: size + 'px', height: size + 'px'}}>
			<canvas
				ref={backdropRef}
				className={css.moonBackdrop}
				width={size * 2}
				height={size * 2}
				style={{left: -(size / 2) + 'px', top: -(size / 2) + 'px'}}
			/>
			<canvas ref={phaseRef} className={css.moonPhase} width={size} height={size} />
		</div>
	);
};

export default MoonPhasesAnimation;
