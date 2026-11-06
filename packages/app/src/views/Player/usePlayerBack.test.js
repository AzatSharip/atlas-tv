import {act, renderHook} from '@testing-library/react';
import {useEffect} from 'react';
import {installBackKeyGuard} from '../../utils/backKeyGuard';
import {isBackKey} from '../../utils/keys';
import usePlayerBack from './usePlayerBack';

jest.mock('../../platform', () => ({getPlatform: () => 'tizen'}));

const deferred = () => {
	let resolve;
	const promise = new Promise(done => { resolve = done; });
	return {promise, resolve};
};

test('repeated Back during a delayed stop reports once and returns exactly once', async () => {
	const stop = deferred();
	const teardown = jest.fn(() => stop.promise);
	const onBack = jest.fn();
	const {result, rerender} = renderHook(() => usePlayerBack(teardown, onBack));
	const first = result.current();
	rerender();
	await result.current();
	await result.current();
	expect(teardown).toHaveBeenCalledTimes(1);
	expect(onBack).not.toHaveBeenCalled();
	await act(async () => { stop.resolve(); await first; });
	expect(onBack).toHaveBeenCalledTimes(1);
	await result.current();
	expect(onBack).toHaveBeenCalledTimes(1);
});

test('a stop completing after unmount cannot navigate the next profile or page', async () => {
	const stop = deferred();
	const onBack = jest.fn();
	const {result, unmount} = renderHook(() => usePlayerBack(() => stop.promise, onBack));
	const pending = result.current();
	unmount();
	stop.resolve();
	await pending;
	expect(onBack).not.toHaveBeenCalled();
});

test('a failed teardown still returns once without an unhandled rejection', async () => {
	const warning = jest.spyOn(console, 'warn').mockImplementation(() => {});
	const teardown = jest.fn().mockRejectedValue(new Error('synthetic stop failure'));
	const onBack = jest.fn();
	try {
		const {result} = renderHook(() => usePlayerBack(teardown, onBack));
		await result.current();
		await result.current();
		expect(onBack).toHaveBeenCalledTimes(1);
		expect(teardown).toHaveBeenCalledTimes(1);
	} finally {
		warning.mockRestore();
	}
});

test.each(['folder', 'search', 'home'])('remote Back returns to %s once despite separate presses and a held repeat', async origin => {
	const removeGuard = installBackKeyGuard();
	const stop = deferred();
	const teardown = jest.fn(() => stop.promise);
	const history = ['home', origin];
	let page = 'player';
	const onBack = jest.fn(() => { page = history.pop(); });
	const {unmount} = renderHook(() => {
		const back = usePlayerBack(teardown, onBack);
		useEffect(() => {
			const handler = event => { if (isBackKey(event)) back(); };
			window.addEventListener('keydown', handler, true);
			return () => window.removeEventListener('keydown', handler, true);
		}, [back]);
	});
	const send = (type, repeat = false) => {
		const event = new window.KeyboardEvent(type, {keyCode: 10009, repeat, cancelable: true});
		window.dispatchEvent(event);
		expect(event.defaultPrevented).toBe(true);
	};
	const underlyingPage = jest.fn();
	try {
		send('keydown'); send('keyup'); send('keydown');
		expect(teardown).toHaveBeenCalledTimes(1);
		await act(async () => { stop.resolve(); await stop.promise; });
		expect(page).toBe(origin);
		expect(history).toEqual(['home']);
		expect(onBack).toHaveBeenCalledTimes(1);
		unmount();
		window.addEventListener('keydown', underlyingPage, true);
		send('keydown', true); send('keydown'); send('keyup');
		expect(underlyingPage).not.toHaveBeenCalled();
	} finally {
		unmount();
		window.removeEventListener('keydown', underlyingPage, true);
		removeGuard();
	}
});
