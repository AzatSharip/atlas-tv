jest.mock('react', () => jest.requireActual('../../../../node_modules/react'));
import {createRoot} from 'react-dom/client';
import {act, useContext, useEffect, useState} from 'react';
import {AuthContext, clearAllCaches} from './AuthContext';
import {stopProfilePlayback} from '../services/video';
import {FamilyAuthProvider} from './FamilyAuthContext';
import {profileRequest} from '../services/familySession';

jest.mock('@enact/spotlight/Spottable', () => tag => function MockSpot(props) { const clean = {...props}; delete clean.spotlightId; return require('react').createElement(tag, clean); });
jest.mock('@enact/spotlight', () => ({focus: jest.fn()}));
jest.mock('./AuthContext', () => ({AuthContext: require('react').createContext(null), clearAllCaches: jest.fn()}));
jest.mock('../services/jellyfinApi', () => ({setAuth: jest.fn(), setServer: jest.fn(), setServerType: jest.fn(), initDeviceId: jest.fn(), api: {}}));
jest.mock('../services/storage', () => ({initStorage: jest.fn(), beginVolatileStorage: jest.fn(), endVolatileStorage: jest.fn()}));
jest.mock('../services/multiServerManager', () => ({addServer: async () => ({serverId: 'test-server'}), setActiveServer: jest.fn()}));
jest.mock('../services/familySession', () => ({familyEnrollment: () => ({server: 'https://example.test/jellyfin', key: 'fixture'}), profileRequest: jest.fn(), setFamilyRole: jest.fn()}));
jest.mock('../services/playback', () => ({reportStop: jest.fn(), getCurrentSession: () => null}));
jest.mock('../services/video', () => ({stopProfilePlayback: jest.fn()}));
let container, root;
const click = async text => {
    const button = Array.from(container.querySelectorAll('button')).find(b => b.textContent === text || b.textContent.endsWith(text));
    expect(button).toBeTruthy();
    await act(async () => button.click());
};
beforeEach(() => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
    window.AtlasFolders = {reset: jest.fn()};
    Object.defineProperty(document, 'hidden', {configurable: true, value: false});
    container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
    profileRequest.mockReset();
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
test('only two entries; full PIN including prefix/zeros submitted only on explicit OK', async () => {
    profileRequest.mockImplementation(async action => action === 'login' ? {Role: 'owner', User: {Id: 'owner-fixture'}, AccessToken: 'fixture-token'} : {});
    // React DOM root (not Testing Library) requires act.
    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => root.render(<FamilyAuthProvider><div>CONTENT</div></FamilyAuthProvider>));
    expect(container.textContent).not.toMatch(/Личный|Скрытый/);
    expect(container.textContent).not.toContain('CONTENT');
    await click('Взрослый');
    for (const digit of '0123') await click(digit);
    expect(profileRequest).not.toHaveBeenCalled();
    for (const digit of '45') await click(digit);
    await click('OK');
    expect(profileRequest).toHaveBeenCalledWith('login', {action: 'pin', pin: '012345'});
    expect(container.textContent).toContain('CONTENT');
    Object.defineProperty(document, 'hidden', {configurable: true, value: true});
    await act(async () => document.dispatchEvent(new Event('visibilitychange')));
    expect(container.textContent).not.toContain('CONTENT');
    expect(container.textContent).toContain('Кто смотрит?');
    expect(profileRequest).toHaveBeenCalledWith('logout', {}, 'fixture-token');
});
test('cancelled delayed login cannot reveal private content', async () => {
    let resolve;
    profileRequest.mockImplementation(action => action === 'login' ? new Promise(r => { resolve = r; }) : Promise.resolve({}));
    // React DOM root (not Testing Library) requires act.
    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => root.render(<FamilyAuthProvider><div>PRIVATE</div></FamilyAuthProvider>));
    await click('Взрослый');
    await click('1'); await click('OK'); await click('Отмена');
    await act(async () => resolve({Role: 'owner', User: {Id: 'owner-fixture'}, AccessToken: 'late-token'}));
    expect(container.textContent).not.toContain('PRIVATE');
    expect(profileRequest).toHaveBeenCalledWith('logout', {}, 'late-token');
});

test('cancelling a delayed same-account login preserves its existing session', async () => {
    const session = {Role: 'adult', User: {Id: 'adult-fixture'}, AccessToken: 'existing-token'};
    profileRequest.mockImplementation(async action => action === 'login' ? session : {});
    function Actions() {
        const auth = useContext(AuthContext);
        return <button onClick={auth.openProfiles}>Сменить</button>;
    }
    // React DOM root (not Testing Library) requires act.
    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => root.render(<FamilyAuthProvider><Actions /></FamilyAuthProvider>));
    await click('Взрослый'); await click('1'); await click('OK'); await click('Сменить');
    let resolve;
    profileRequest.mockImplementation(action => action === 'login' ? new Promise(r => { resolve = r; }) : Promise.resolve({}));
    await click('Взрослый'); await click('1'); await click('OK'); await click('Отмена');
    await act(async () => resolve(session));
    expect(profileRequest).not.toHaveBeenCalledWith('logout', {}, 'existing-token');
    await click('Вернуться');
    expect(container.textContent).toContain('Сменить');
    expect(container.textContent).not.toContain('Кто смотрит?');
});

// Private content must disappear even if its previous request resolves after a switch.
test.each(['child', 'adult'])('private history and delayed content cannot survive a switch to %s', async target => {
    let nextRole = 'owner';
    let resolvePrivate;
    const pendingPrivate = new Promise(resolve => { resolvePrivate = resolve; });
    profileRequest.mockImplementation(async action => action === 'login' ? {
        Role: nextRole, User: {Id: nextRole + '-fixture'}, AccessToken: nextRole + '-token'
    } : {});
    function Screen() {
        const auth = useContext(AuthContext);
        const [recent, setRecent] = useState(auth.managedProfile === 'owner' ? 'PRIVATE-RECENT' : 'ORDINARY-RECENT');
        useEffect(() => {
            if (auth.managedProfile === 'owner') pendingPrivate.then(setRecent);
        }, [auth.managedProfile]);
        return <div><span>{recent}</span><button onClick={auth.openProfiles}>Сменить</button></div>;
    }
    // React DOM root requires act.
    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => root.render(<FamilyAuthProvider><Screen /></FamilyAuthProvider>));
    await click('Взрослый'); await click('1'); await click('OK');
    expect(container.textContent).toContain('PRIVATE-RECENT');
    clearAllCaches.mockClear(); stopProfilePlayback.mockClear();
    await click('Сменить');
    nextRole = target;
    if (target === 'child') await click('Детский');
    else { await click('Взрослый'); await click('1'); await click('OK'); }
    expect(container.textContent).toContain('ORDINARY-RECENT');
    expect(container.textContent).not.toContain('PRIVATE-RECENT');
    expect(clearAllCaches).toHaveBeenCalled();
    expect(stopProfilePlayback).toHaveBeenCalled();
    expect(window.AtlasFolders.reset).toHaveBeenCalled();
    expect(profileRequest).toHaveBeenCalledWith('logout', {}, 'owner-token');
    await act(async () => resolvePrivate('PRIVATE-LATE-RECOMMENDATION'));
    expect(container.textContent).not.toContain('PRIVATE');
    await act(async () => window.dispatchEvent(new window.KeyboardEvent('keydown', {key: 'Escape', bubbles: true})));
    expect(container.textContent).not.toContain('PRIVATE');
});
