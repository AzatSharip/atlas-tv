const mockDisk = {};
const mockImpl = {
    getFromStorage: jest.fn(async key => mockDisk[key]),
    saveToStorage: jest.fn(async (key, value) => { mockDisk[key] = value; }),
    initStorage: jest.fn()
};
jest.mock('./platformModule', () => ({resolvePlatformModule: async () => mockImpl}));
import {beginVolatileStorage, endVolatileStorage, getFromStorage, saveToStorage} from './storage';
test('role switches preserve one device identity without persisting account tokens/history', async () => {
    mockImpl.getFromStorage.mockImplementation(async key => mockDisk[key]);
    mockImpl.saveToStorage.mockImplementation(async (key, value) => { mockDisk[key] = value; });
    mockDisk.settings = {modernCardsOnMyMediaRow: false};
    await beginVolatileStorage('adult');
    await saveToStorage('_deviceId', 'synthetic-stable-television');
    await saveToStorage('account', {token: 'synthetic-private-token'});
    await saveToStorage('library_history', 'private-media-title');
    endVolatileStorage();
    await beginVolatileStorage('child');
    expect(await getFromStorage('_deviceId')).toBe('synthetic-stable-television');
    expect(await getFromStorage('account')).toBeNull();
    expect(await getFromStorage('library_history')).toBeNull();
    expect(mockDisk.account).toBeUndefined();
    expect(mockDisk.library_history).toBeUndefined();
    expect((await getFromStorage('settings')).modernCardsOnMyMediaRow).toBe(false);
});

test.each(['child', 'adult'])('owner browse, search, favorites and navigation storage are absent in %s', async target => {
    await beginVolatileStorage('owner');
    const keys = ['browse_cache_v5', 'library_history', 'searchHistory', 'favorites', 'queue', 'account'];
    for (const key of keys) await saveToStorage(key, {privateMarker: 'owner-only-fixture'});
    endVolatileStorage();
    await beginVolatileStorage(target);
    for (const key of keys) {
        expect(await getFromStorage(key)).toBeNull();
        expect(mockDisk[key]).toBeUndefined();
    }
});
