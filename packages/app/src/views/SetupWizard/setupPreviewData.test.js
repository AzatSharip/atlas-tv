jest.mock('../../utils/helpers', () => ({
	getImageUrl: (server, id, type) => `${server}/${type}/${id}`,
	getBackdropId: (item) => (item.HasBackdrop ? item.Id : null),
	getPrimaryImageId: (item) => (item.HasPoster ? item.Id : null),
	getLogoUrl: () => null
}));

jest.mock('../../services/jellyfinApi', () => ({
	getServerUrl: () => 'http://server'
}));

const posterOnly = [{Id: '1', Name: 'Poster Only', Type: 'Movie', HasPoster: true}];
const withBackdrop = [{Id: '2', Name: 'Has Backdrop', Type: 'Movie', HasBackdrop: true}];

// The module caches its items, so each test needs its own copy of it.
const freshModule = () => {
	let mod;
	jest.isolateModules(() => {
		mod = require('./setupPreviewData');
	});
	return mod;
};

const settle = async (promise) => {
	await jest.runAllTimersAsync();
	await promise;
};

describe('ensurePreviewItemsLoaded', () => {
	beforeEach(() => {
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	test('keeps what the first pull hands back', async () => {
		const mod = freshModule();
		const api = {
			getRandomItems: jest.fn().mockResolvedValue({Items: withBackdrop}),
			getPreviewItems: jest.fn()
		};

		await settle(mod.ensurePreviewItemsLoaded(api));

		expect(mod.getPreviewItems()).toHaveLength(1);
		expect(api.getRandomItems).toHaveBeenCalledTimes(1);
		expect(api.getPreviewItems).not.toHaveBeenCalled();
	});

	// The pull asks the server for a backdrop, so a library that only has
	// posters answers nothing however often it is asked.
	test('asks without the backdrop requirement once the pull stays empty', async () => {
		const mod = freshModule();
		const api = {
			getRandomItems: jest.fn().mockResolvedValue({Items: []}),
			getPreviewItems: jest.fn().mockResolvedValue({Items: posterOnly})
		};

		await settle(mod.ensurePreviewItemsLoaded(api));

		expect(api.getRandomItems).toHaveBeenCalledTimes(4);
		expect(api.getPreviewItems).toHaveBeenCalledTimes(1);
		const items = mod.getPreviewItems();
		expect(items).toHaveLength(1);
		expect(items[0].title).toBe('Poster Only');
		expect(items[0].posterUrl).toBe('http://server/Primary/1');
		expect(items[0].backdropUrl).toBe(null);
	});

	test('falls back when every pull throws as well', async () => {
		const mod = freshModule();
		const api = {
			getRandomItems: jest.fn().mockRejectedValue(new Error('offline')),
			getPreviewItems: jest.fn().mockResolvedValue({Items: posterOnly})
		};

		await settle(mod.ensurePreviewItemsLoaded(api));

		expect(mod.getPreviewItems()).toHaveLength(1);
	});

	test('leaves the stand ins alone when nothing has artwork at all', async () => {
		const mod = freshModule();
		const api = {
			getRandomItems: jest.fn().mockResolvedValue({Items: []}),
			getPreviewItems: jest.fn().mockResolvedValue({Items: []})
		};

		await settle(mod.ensurePreviewItemsLoaded(api));

		expect(mod.getPreviewItems()).toEqual([]);
	});

	// An older api object predates the fallback, and the wizard has to keep
	// working rather than throw on a missing method.
	test('skips the fallback when the api has no such call', async () => {
		const mod = freshModule();
		const api = {getRandomItems: jest.fn().mockResolvedValue({Items: []})};

		await settle(mod.ensurePreviewItemsLoaded(api));

		expect(mod.getPreviewItems()).toEqual([]);
	});

	test('a second ask costs nothing once artwork is in', async () => {
		const mod = freshModule();
		const api = {
			getRandomItems: jest.fn().mockResolvedValue({Items: withBackdrop}),
			getPreviewItems: jest.fn()
		};

		await settle(mod.ensurePreviewItemsLoaded(api));
		await settle(mod.ensurePreviewItemsLoaded(api));

		expect(api.getRandomItems).toHaveBeenCalledTimes(1);
	});

	test('tells its listeners when items land', async () => {
		const mod = freshModule();
		const seen = [];
		mod.subscribePreviewItems((items) => seen.push(items.length));
		const api = {
			getRandomItems: jest.fn().mockResolvedValue({Items: withBackdrop}),
			getPreviewItems: jest.fn()
		};

		await settle(mod.ensurePreviewItemsLoaded(api));

		expect(seen).toEqual([1]);
	});
});
