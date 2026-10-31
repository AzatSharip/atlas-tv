import {readServerRatings} from './serverRatings';

const page = (ratings) => ({Items: ratings.map((OfficialRating, i) => ({Id: String(i), OfficialRating}))});

describe('the ratings the server holds', () => {
	test('are read off the items, upper cased and without repeats', async () => {
		const api = {getItems: jest.fn(() => Promise.resolve({...page(['pg-13', 'R', ' r ', '', null]), TotalRecordCount: 5}))};
		expect((await readServerRatings(api)).sort()).toEqual(['PG-13', 'R']);
		expect(api.getItems).toHaveBeenCalledWith(expect.objectContaining({Fields: 'OfficialRating', StartIndex: 0, Limit: 200}));
	});

	test('page on until a short page', async () => {
		const full = page(new Array(200).fill('G'));
		const api = {getItems: jest.fn()
			.mockResolvedValueOnce({...full, TotalRecordCount: 250})
			.mockResolvedValueOnce({...page(['TV-MA']), TotalRecordCount: 250})};
		expect((await readServerRatings(api)).sort()).toEqual(['G', 'TV-MA']);
		expect(api.getItems).toHaveBeenLastCalledWith(expect.objectContaining({StartIndex: 200}));
	});

	// A huge library would otherwise hold the screen on a spinner.
	test('stop after fifteen pages', async () => {
		const full = page(new Array(200).fill('G'));
		const api = {getItems: jest.fn(() => Promise.resolve({...full, TotalRecordCount: 100000}))};
		await readServerRatings(api);
		expect(api.getItems).toHaveBeenCalledTimes(15);
	});

	test('let a failure through so the screen can say so', async () => {
		const api = {getItems: () => Promise.reject(new Error('offline'))};
		await expect(readServerRatings(api)).rejects.toThrow('offline');
	});
});
