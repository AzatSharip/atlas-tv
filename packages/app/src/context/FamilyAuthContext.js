import {useState, useRef, useEffect, useCallback} from 'react';
import Spottable from '@enact/spotlight/Spottable';
import Spotlight from '@enact/spotlight';
import {AuthContext, clearAllCaches} from './AuthContext';
import * as apiService from '../services/jellyfinApi';
import {initStorage, beginVolatileStorage, endVolatileStorage} from '../services/storage';
import * as multiServer from '../services/multiServerManager';
import {familyEnrollment, profileRequest, setFamilyRole} from '../services/familySession';
import * as playback from '../services/playback';
import {stopProfilePlayback} from '../services/video';
import {isBackKey} from '../utils/keys';
import ChildMouseAvatar from '../components/icons/ChildMouseAvatar';
import css from './FamilyAuthContext.module.less';

const Button = Spottable('button');
const nothing = () => {};

export const FamilyAuthProvider = ({children}) => {
    const [session, setSession] = useState(null);
    const [picker, setPicker] = useState(true);
    const [pinOpen, setPinOpen] = useState(false);
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const generation = useRef(0);
    const active = useRef(null);
    const layer = useRef(null);
    const enrollment = familyEnrollment();

    const clearSession = useCallback(() => {
        generation.current++;
        const old = active.current;
        active.current = null;
        // Hide synchronously, including native video, before React schedules a render.
        if (layer.current) layer.current.style.visibility = 'hidden';
        let position;
        try { position = stopProfilePlayback(); } catch (_) { /* Player may not be initialized. */ }
        playback.reportStop(position ?? playback.getCurrentSession()?.positionTicks ?? 0);
        apiService.setAuth(null, null);
        clearAllCaches();
        window.AtlasFolders.reset();
        endVolatileStorage();
        setFamilyRole(null);
        setSession(null); setPicker(true); setPinOpen(false); setPin(''); setBusy(false);
        if (old) { profileRequest('logout', {}, old.AccessToken).catch(nothing); }
    }, []);

    useEffect(() => {
        const hidden = () => { if (document.hidden) clearSession(); };
        window.addEventListener('pagehide', clearSession);
        document.addEventListener('visibilitychange', hidden, true);
        const timer = setInterval(() => {
            const current = active.current;
            if (current && !document.hidden) { profileRequest('heartbeat', {}, current.AccessToken).catch(() => {
                if (active.current === current) clearSession();
            }); }
        }, 60000);
        return () => { clearInterval(timer); window.removeEventListener('pagehide', clearSession); document.removeEventListener('visibilitychange', hidden, true); };
    }, [clearSession]);

    const enter = useCallback(async (child) => {
        if (busy) return;
        const ticket = ++generation.current;
        setBusy(true); setError('');
        let result;
        const revokeUnused = value => {
            // Jellyfin may reuse this account/device's existing token. Cancelling
            // a delayed re-login must not revoke the still-active original profile.
            if (value && value.AccessToken !== active.current?.AccessToken) {
                profileRequest('logout', {}, value.AccessToken).catch(nothing);
            }
        };
        try {
            result = await profileRequest('login', child ? {action: 'child'} : {action: 'pin', pin});
            if (ticket !== generation.current || document.hidden) {
                revokeUnused(result); return;
            }
            const previous = active.current;
            if (layer.current) layer.current.style.visibility = 'hidden';
            setSession(null);
            const position = stopProfilePlayback();
            await playback.reportStop(position ?? playback.getCurrentSession()?.positionTicks ?? 0);
            if (ticket !== generation.current) { revokeUnused(result); return; }
            apiService.setAuth(null, null);
            clearAllCaches(); window.AtlasFolders.reset();
            await initStorage();
            await beginVolatileStorage(result.Role);
            await apiService.initDeviceId();
            if (ticket !== generation.current || document.hidden) {
                endVolatileStorage(); revokeUnused(result); return;
            }
            apiService.setServer(enrollment.server);
            apiService.setServerType('jellyfin');
            apiService.setAuth(result.User.Id, result.AccessToken);
            // Compatibility readers see only this session, in volatile storage.
            const server = await multiServer.addServer(enrollment.server, 'Atlas', result.User.Id,
                result.User.Name, result.AccessToken, null, 'jellyfin');
            await multiServer.setActiveServer(server.serverId, result.User.Id);
            if (ticket !== generation.current || document.hidden) {
                apiService.setAuth(null, null); endVolatileStorage();
                revokeUnused(result); return;
            }
            setFamilyRole(result.Role);
            active.current = result;
            setSession(result); setPicker(false); setPinOpen(false); setPin('');
            if (previous && previous.AccessToken !== result.AccessToken) profileRequest('logout', {}, previous.AccessToken).catch(nothing);
        } catch (e) {
            if (ticket === generation.current) { setError(e.message); setPin(''); }
            if (result) revokeUnused(result);
        } finally { if (ticket === generation.current) setBusy(false); }
    }, [busy, pin, enrollment.server]);

    const cancel = useCallback(() => {
        generation.current++; setBusy(false); setPin(''); setError('');
        if (pinOpen) setPinOpen(false);
        else if (session) setPicker(false);
    }, [pinOpen, session]);
    useEffect(() => {
        if (!picker) return undefined;
        const key = e => {
            if (isBackKey(e) || e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); cancel(); }
            if (!pinOpen || busy) return;
            const digit = e.key?.match(/^[0-9]$/)?.[0] || (e.keyCode >= 48 && e.keyCode <= 57 ? String(e.keyCode - 48) : null);
            if (digit) { e.preventDefault(); e.stopImmediatePropagation(); setPin(value => (value + digit).slice(0, 6)); }
        };
        window.addEventListener('keydown', key, true);
        window.requestAnimationFrame(() => Spotlight.focus(pinOpen ? 'profile-digit-1' : 'profile-child'));
        return () => window.removeEventListener('keydown', key, true);
    }, [picker, pinOpen, busy, cancel]);

    const enterChild = useCallback(() => enter(true), [enter]);
    const submitPin = useCallback(() => enter(false), [enter]);
    const openPin = useCallback(() => { setPinOpen(true); setError(''); }, []);
    const digitPress = useCallback(e => { const digit = e.currentTarget.dataset.digit; setPin(value => (value + digit).slice(0, 6)); }, []);
    const erase = useCallback(() => setPin(value => value.slice(0, -1)), []);
    const context = session ? {
        isAuthenticated: true, isLoading: false, user: session.User,
        serverUrl: enrollment.server, serverName: 'Atlas', serverType: 'jellyfin', accessToken: session.AccessToken,
        managedProfile: session.Role, openProfiles: () => { setError(''); setPicker(true); },
        servers: [], uniqueServers: [], activeServerInfo: null, serverCount: 1, totalUserCount: 1,
        hasMultipleUsers: false, hasMultipleServers: false, isAddingServer: false, connectionState: 'connected',
        logout: clearSession, logoutAll: clearSession, revalidateSession: nothing,
        startAddServerFlow: nothing, cancelAddServerFlow: nothing, completeAddServerFlow: nothing,
        loadServers: nothing, api: apiService.api
    } : null;
    return <>
        {context && <AuthContext.Provider value={context}>
            <div key={session.AccessToken} ref={layer} style={{display: picker ? 'none' : undefined}}>{children}</div>
        </AuthContext.Provider>}
        {picker && <div className={css.screen}>
            <h1><img src="resources/atlas-wordmark.svg" alt="ATLAS" /></h1>
            {!pinOpen ? <>
                <h2>Кто смотрит?</h2>
                <div className={css.profiles}>
                    <Button spotlightId="profile-child" disabled={busy} onClick={enterChild} className={css.tile}>
                        <span className={css.childAvatar}><ChildMouseAvatar /></span><span>Детский</span>
                    </Button>
                    <Button spotlightId="profile-adult" disabled={busy} onClick={openPin} className={css.tile}>
                        <span className={css.adultAvatar}>A</span><span>Взрослый</span>
                    </Button>
                </div>
                {session && <Button onClick={cancel}>Вернуться</Button>}
            </> : <>
                <h2>Введите PIN</h2>
                <div className={css.dots} aria-label="PIN">{pin.replace(/./g, '●') || '—'}</div>
                <div className={css.keys}>
                    {'123456789'.split('').map(digit => <Button key={digit} spotlightId={'profile-digit-' + digit} disabled={busy} data-digit={digit} onClick={digitPress}>{digit}</Button>)}
                    <Button disabled={busy} spotlightId="profile-erase" className={css.erase} aria-label="Стереть последнюю цифру" onClick={erase}>Стереть</Button>
                    <Button disabled={busy} spotlightId="profile-digit-0" data-digit="0" onClick={digitPress}>0</Button>
                    <Button disabled={busy} spotlightId="profile-submit" onClick={submitPin}>OK</Button>
                </div>
                <Button onClick={cancel}>Отмена</Button>
            </>}
            <p role="alert">{busy ? 'Подключение…' : error}</p>
        </div>}
    </>;
};
