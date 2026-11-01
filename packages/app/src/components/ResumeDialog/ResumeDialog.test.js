jest.mock('react', () => jest.requireActual('../../../../../node_modules/react'));
import {createRoot} from 'react-dom/client';
import {act} from 'react';
import ResumeDialog from './ResumeDialog';

jest.mock('../../platform', () => ({getPlatform: () => 'tizen'}));

jest.mock('@enact/spotlight/Spottable', () => tag => function Spot({spotlightId, ...props}) {
    return require('react').createElement(tag, {...props, 'data-spotlight-id': spotlightId});
});
jest.mock('@enact/spotlight/SpotlightContainerDecorator', () => () => function Container({spotlightId, ...props}) {
    return require('react').createElement('div', {...props, 'data-spotlight-id': spotlightId});
});
jest.mock('@enact/spotlight', () => ({focus: node => node.focus()}));
let container, root, callbacks;
beforeEach(async () => {
    global.IS_REACT_ACT_ENVIRONMENT = true; jest.useFakeTimers();
    callbacks = {onContinue: jest.fn(), onRestart: jest.fn(), onCancel: jest.fn()};
    container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
    // React DOM root, not Testing Library.
    // eslint-disable-next-line testing-library/no-unnecessary-act, testing-library/no-render-in-lifecycle
    await act(async () => { root.render(<ResumeDialog item={{Name: 'Example movie'}} ticks={12420000000} {...callbacks} />); });
    await act(async () => jest.runOnlyPendingTimers());
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); jest.useRealTimers(); });
const key = async code => {
    await act(async () => {
        window.dispatchEvent(new window.KeyboardEvent('keydown', {keyCode: code, bubbles: true, cancelable: true}));
        window.dispatchEvent(new window.KeyboardEvent('keyup', {keyCode: code, bubbles: true, cancelable: true}));
    });
};
const focused = () => document.activeElement.getAttribute('data-spotlight-id');
test('remote directions/OK choose restart exactly once without a mouse click', async () => {
    expect(focused()).toBe('atlas-resume-continue');
    expect(container.textContent).toContain('20:42');
    await key(39); expect(focused()).toBe('atlas-resume-restart');
    await key(13); expect(callbacks.onRestart).toHaveBeenCalledTimes(1);
    expect(callbacks.onContinue).not.toHaveBeenCalled();
});
test('focus remains inside modal and cancel/Back work', async () => {
    await key(40); expect(focused()).toBe('atlas-resume-cancel');
    await key(38); expect(focused()).toBe('atlas-resume-continue');
    await key(37); expect(focused()).toBe('atlas-resume-continue');
    await key(13); expect(callbacks.onContinue).toHaveBeenCalledTimes(1);
    await key(10009); expect(callbacks.onCancel).toHaveBeenCalledTimes(1);
});
