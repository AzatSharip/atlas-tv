import {resolvePlatformModule} from './platformModule';

let impl;
let volatile = null;
let storageEpoch = 0;
let baselineSettings = null;
let stableDeviceId = null;

const loadImpl = async () => {
	if (impl) return impl;
	impl = await resolvePlatformModule('storage');
	return impl;
};

export const beginVolatileStorage = async role => {
    await loadImpl();
    if (!baselineSettings) baselineSettings = await impl.getFromStorage('settings') || {};
    if (!stableDeviceId) stableDeviceId = await impl.getFromStorage('_deviceId');
    storageEpoch++;
    volatile = {_deviceId: stableDeviceId, settings: {...baselineSettings, kidsModeEnabled: role === 'child', pinCodeProtection: false,
        pinCodeHash: '', kidsPinHash: '', syncplayEnabled: false, showServerMessagesButton: false,
        showFriendsButton: false, autoLoginBehavior: 'disabled', autoLogin: false}};
};
export const endVolatileStorage = () => { storageEpoch++; volatile = {}; };

export const initStorage = async () => {
	const mod = await loadImpl();
	return mod.initStorage();
};

export const getFromStorage = async (...args) => {
	const epoch = storageEpoch;
    await loadImpl();
    if (epoch !== storageEpoch) return null;
    if (volatile) return volatile[args[0]] ?? null;
    return impl.getFromStorage(...args);
};

export const saveToStorage = async (...args) => {
	const epoch = storageEpoch;
    await loadImpl();
    if (epoch !== storageEpoch) return false;
    if (volatile) {
        volatile[args[0]] = args[1];
        // A device identifier contains no account data and must survive role changes.
        // Otherwise every login creates another apparent television on Jellyfin.
        if (args[0] === '_deviceId') { stableDeviceId = args[1]; await impl.saveToStorage(...args); }
        return true;
    }
    return impl.saveToStorage(...args);
};

export const removeFromStorage = async (...args) => {
	await loadImpl();
    if (volatile) { delete volatile[args[0]]; return true; }
    return impl.removeFromStorage(...args);
};

export const clearAllStorage = async (...args) => {
	await loadImpl();
    if (volatile) { volatile = {}; return true; }
	return impl.clearAllStorage(...args);
};

export const getAllKeys = async (...args) => {
	await loadImpl();
    if (volatile) return Object.keys(volatile);
	return impl.getAllKeys(...args);
};

export const getStorageInfo = async (...args) => {
	await loadImpl();
	return impl.getStorageInfo?.(...args);
};
