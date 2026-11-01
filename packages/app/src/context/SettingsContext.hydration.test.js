jest.mock('react', () => jest.requireActual('../../../../node_modules/react'));
import {createRoot} from 'react-dom/client';
import {act, useEffect} from 'react';
import {SettingsProvider, useSettings} from './SettingsContext';
import {getFromStorage, saveToStorage} from '../services/storage';
jest.mock('../services/storage', () => ({getFromStorage: jest.fn(), saveToStorage: jest.fn()}));
jest.mock('../services/seerrApi', () => ({}));
jest.mock('../services/familySession', () => ({familyRole: () => 'adult'}));
jest.mock('../utils/setupWizardGate', () => ({noteAnsweredSettings: jest.fn(), SETUP_QUESTION_KEYS: []}));

test('descendant mount writes cannot overwrite saved static library tiles before hydration', async () => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
    let resolve; const saved = new Promise(r => { resolve = r; });
    getFromStorage.mockImplementation(key => key === 'settings' ? saved : Promise.resolve(null));
    const observed = [];
    function Descendant() {
        const {settings, updateSetting} = useSettings();
        useEffect(() => { observed.push(settings.modernCardsOnMyMediaRow); updateSetting('uiLanguage', 'ru-RU'); }, []); // eslint-disable-line react-hooks/exhaustive-deps
        return <span>{String(settings.modernCardsOnMyMediaRow)}</span>;
    }
    const container = document.createElement('div'); document.body.appendChild(container);
    const root = createRoot(container);
    // React DOM root, not Testing Library.
    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => root.render(<SettingsProvider><Descendant /></SettingsProvider>));
    expect(observed).toEqual([]);
    expect(saveToStorage).not.toHaveBeenCalled();
    await act(async () => resolve({modernCardsOnMyMediaRow: false, homeRowsStyle: 'v2'}));
    expect(observed).toEqual([false]);
    expect(container.textContent).toBe('false');
    expect(saveToStorage.mock.calls.filter(([key]) => key === 'settings').every(([, value]) => value.modernCardsOnMyMediaRow === false)).toBe(true);
    await act(async () => root.unmount()); container.remove();
});
