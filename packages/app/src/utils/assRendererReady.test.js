import {waitForAssReady} from './assRendererReady';

// Stands in for SubtitlesOctopus. A request is only answered once the test says the worker has
// loaded, and otherwise gives up after five seconds the way the library's own does.
const fakeOctopus = () => {
	const pending = [];
	const octopus = {
		asks: 0,
		getEvents: (onSuccess, onError) => {
			octopus.asks++;
			const request = {onSuccess, onError};
			request.timer = setTimeout(() => {
				pending.splice(pending.indexOf(request), 1);
				onError(new Error('Error: Timeout while try to fetch get-events'));
			}, 5000);
			pending.push(request);
		},
		load: () => {
			pending.splice(0).forEach((request) => {
				clearTimeout(request.timer);
				request.onSuccess([]);
			});
		},
		fail: () => {
			pending.splice(0).forEach((request) => {
				clearTimeout(request.timer);
				request.onError({type: 'error'});
			});
		}
	};
	return octopus;
};

describe('waitForAssReady', () => {
	beforeEach(() => {
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	test('is ready once the worker answers', async () => {
		const octopus = fakeOctopus();
		const ready = waitForAssReady(octopus, 15000);
		jest.advanceTimersByTime(1200);
		octopus.load();
		await expect(ready).resolves.toBe(true);
		expect(jest.getTimerCount()).toBe(0);
	});

	test('asks again when the library gives up before the track has loaded', async () => {
		const octopus = fakeOctopus();
		const ready = waitForAssReady(octopus, 15000);
		jest.advanceTimersByTime(5000);
		expect(octopus.asks).toBe(2);
		jest.advanceTimersByTime(3000);
		octopus.load();
		await expect(ready).resolves.toBe(true);
	});

	test('stops at the deadline', async () => {
		const octopus = fakeOctopus();
		const ready = waitForAssReady(octopus, 12000);
		jest.advanceTimersByTime(12250);
		await expect(ready).resolves.toBe(false);
	});

	test('stops on a worker error without asking again', async () => {
		const octopus = fakeOctopus();
		const ready = waitForAssReady(octopus, 15000);
		octopus.fail();
		await expect(ready).resolves.toBe(false);
		expect(octopus.asks).toBe(1);
	});

	test('stops once the caller has moved on', async () => {
		const octopus = fakeOctopus();
		let current = true;
		const ready = waitForAssReady(octopus, 15000, () => current);
		jest.advanceTimersByTime(1000);
		current = false;
		jest.advanceTimersByTime(250);
		await expect(ready).resolves.toBe(false);
	});

	test('is not ready without a renderer to ask', async () => {
		await expect(waitForAssReady(null, 15000)).resolves.toBe(false);
		await expect(waitForAssReady({}, 15000)).resolves.toBe(false);
	});
});
