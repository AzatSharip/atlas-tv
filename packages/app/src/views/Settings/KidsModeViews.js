import {useCallback} from 'react';
import $L from '@enact/i18n/$L';

import Button from '@enact/sandstone/Button';

import SpottableInput from '../../components/SpottableInput/SpottableInput';
import SettingsView from './SettingsView';
import {SectionTitle} from './settingsRows';

import css from './Settings.module.less';

// The field hands back an event, and both screens only want the digits out of it.
const usePinInput = (onPinChange) => useCallback(
	(e) => onPinChange(String(e.target.value || '').replace(/\D/g, '').slice(0, 4)),
	[onPinChange]
);

const PinField = ({pin, error, onChange}) => (
	<>
		<div className={css.inputGroup}>
			<label>{$L('PIN')}</label>
			<SpottableInput
				className={css.input}
				type="password"
				purpose="numeric"
				value={pin}
				onChange={onChange}
				placeholder={$L('4 digits')}
				maxLength={4}
				spotlightId="kids-pin-input"
			/>
		</div>
		{error && <div className={`${css.statusMessage} ${css.statusError}`}>{error}</div>}
	</>
);

// Choosing the PIN that turns the mode on. A fresh one every time, since there is nowhere else to
// change it and carrying an old one over would hand the mode a code the parent turning it on
// never chose and may not know.
export const KidsModeSetView = ({pin, error, onPinChange, onCancel, onSave}) => {
	const handleChange = usePinInput(onPinChange);

	return (
		<SettingsView spotlightId="kids-mode-set-view">
			<SectionTitle>{$L('Set Kids Mode PIN')}</SectionTitle>
			<div className={css.viewDescription}>
				{$L('Choose a 4-digit PIN. You will need it to turn Kids Mode off.')}
			</div>
			<PinField pin={pin} error={error} onChange={handleChange} />
			<div className={css.actionBar}>
				<Button onClick={onCancel} size="small" spotlightId="kids-pin-cancel">
					{$L('Cancel')}
				</Button>
				<Button onClick={onSave} size="small" spotlightId="kids-pin-save">
					{$L('Save')}
				</Button>
			</div>
		</SettingsView>
	);
};

// The way out. The PIN is the whole boundary, so a wrong guess costs a growing wait rather than
// nothing at all.
export const KidsModeExitView = ({pin, error, onPinChange, onCancel, onSubmit}) => {
	const handleChange = usePinInput(onPinChange);

	return (
		<SettingsView spotlightId="kids-mode-exit-view">
			<SectionTitle>{$L('Exit Kids Mode')}</SectionTitle>
			<div className={css.viewDescription}>
				{$L('Enter your PIN to restore the full app')}
			</div>
			<PinField pin={pin} error={error} onChange={handleChange} />
			<div className={css.actionBar}>
				<Button onClick={onCancel} size="small" spotlightId="kids-pin-cancel">
					{$L('Cancel')}
				</Button>
				<Button onClick={onSubmit} size="small" spotlightId="kids-pin-save">
					{$L('Unlock')}
				</Button>
			</div>
		</SettingsView>
	);
};
