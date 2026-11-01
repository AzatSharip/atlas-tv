// No player calls here: repeated keys only update a preview; release commits once.
export const createSeekGesture = () => {
    let direction = 0, started = 0, last = 0;
    return {
        step(next, now) {
            if (next !== direction || now - last > 1200) { direction = next; started = now; }
            last = now;
            return next * (now - started < 1200 ? 15 : now - started < 3000 ? 30 : now - started < 6000 ? 60 : 120);
        },
        reset() { direction = 0; started = 0; last = 0; }
    };
};
export const seekTarget = (base, delta, duration) => Math.max(0, Math.min(Math.max(0, duration - 250), base + delta * 1000));
