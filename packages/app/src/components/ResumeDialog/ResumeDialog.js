import {useCallback, useEffect, useRef, useState} from 'react';
import Spottable from '@enact/spotlight/Spottable';
import Spotlight from '@enact/spotlight';
import SpotlightContainerDecorator from '@enact/spotlight/SpotlightContainerDecorator';
import {isBackKey} from '../../utils/keys';
import {resumeLabel} from '../../utils/videoResume';
import css from './ResumeDialog.module.less';

const Container = SpotlightContainerDecorator({enterTo: 'default-element', restrict: 'self-only'}, 'div');
const Button = Spottable('button');
const ids = ['atlas-resume-continue', 'atlas-resume-restart', 'atlas-resume-cancel'];

export default function ResumeDialog({item, ticks, onContinue, onRestart, onCancel}) {
    const [selected, setSelected] = useState(0);
    const index = useRef(0);
    const callbacks = useRef([]);
    callbacks.current = [onContinue, onRestart, onCancel];
    useEffect(() => {
        const focus = value => {
            index.current = value;
            setSelected(value);
            const node = document.querySelector(`[data-spotlight-id="${ids[value]}"]`);
            if (node) { Spotlight.focus(node); node.focus(); }
        };
        const timer = setTimeout(() => focus(0), 100);
        // Capture OK as well as directions: native TV keyup must not activate
        // the underlying card again after this modal has opened or closed.
        const key = event => {
            const code = event.keyCode || event.which;
            const back = isBackKey(event) || event.key === 'Escape';
            if (!back && ![13, 37, 38, 39, 40].includes(code)) return;
            event.preventDefault(); event.stopImmediatePropagation();
            if (event.type === 'keyup') return;
            if (back) { callbacks.current[2](); return; }
            if (code === 13) { if (!event.repeat) callbacks.current[index.current](); return; }
            if (code === 40) focus(2);
            else if (code === 38) focus(index.current === 2 ? 0 : index.current);
            else if (code === 37) focus(0);
            else if (code === 39) focus(1);
        };
        window.addEventListener('keydown', key, true);
        window.addEventListener('keyup', key, true);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('keydown', key, true);
            window.removeEventListener('keyup', key, true);
        };
    }, []);
    const selectContinue = useCallback(() => { index.current = 0; setSelected(0); }, []);
    const selectRestart = useCallback(() => { index.current = 1; setSelected(1); }, []);
    const selectCancel = useCallback(() => { index.current = 2; setSelected(2); }, []);
    return <div className={css.overlay}>
        <Container className={css.dialog} spotlightId="atlas-resume-dialog" role="dialog" aria-modal="true" aria-labelledby="atlas-resume-title">
            <div className={css.eyebrow}>ATLAS</div>
            <h2 id="atlas-resume-title" className={css.title}>Продолжить просмотр?</h2>
            <p className={css.name}>{item.Name}</p>
            <div className={css.actions}>
                <Button spotlightId={ids[0]} className={`${css.action} ${selected === 0 ? css.selected : ''} spottable-default`}
                    onFocus={selectContinue} onClick={onContinue}>
                    <span className={css.label}>Продолжить</span>
                    <span className={css.description}>С {resumeLabel(ticks)}</span>
                </Button>
                <Button spotlightId={ids[1]} className={`${css.action} ${selected === 1 ? css.selected : ''}`}
                    onFocus={selectRestart} onClick={onRestart}>
                    <span className={css.label}>Начать сначала</span>
                    <span className={css.description}>С начала видео</span>
                </Button>
            </div>
            <Button spotlightId={ids[2]} className={`${css.cancel} ${selected === 2 ? css.selected : ''}`}
                onFocus={selectCancel} onClick={onCancel}>Отмена</Button>
        </Container>
    </div>;
}
