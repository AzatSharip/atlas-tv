import {renderHook} from '@testing-library/react';

import useSortSettingsPanels from './useSortSettingsPanels';

jest.mock('@enact/spotlight', () => ({__esModule: true, default: {focus: jest.fn()}}));

const setup = (backHandlerRef, over = {}) => renderHook(() => useSortSettingsPanels({
	backHandlerRef,
	sortFocusId: 'sort-option-0',
	settingsFocusId: 'settings-first-row',
	...over
}));

describe('useSortSettingsPanels back handler', () => {
	test('claims the back slot on mount', () => {
		const ref = {current: null};

		setup(ref);

		expect(typeof ref.current).toBe('function');
	});

	test('hands the slot back when it unmounts', () => {
		const ref = {current: null};
		const {unmount} = setup(ref);

		unmount();

		expect(ref.current).toBeNull();
	});

	// There is one slot for the whole app. A screen opened on top of this one owns it, and
	// this one unmounting behind it must not take the new owner's handler away.
	test('leaves the slot alone when someone else has taken it', () => {
		const ref = {current: null};
		const {unmount} = setup(ref);
		const laterOwner = () => true;
		ref.current = laterOwner;

		unmount();

		expect(ref.current).toBe(laterOwner);
	});

	test('takes no slot at all when switched off', () => {
		const ref = {current: null};

		setup(ref, {enabled: false});

		expect(ref.current).toBeNull();
	});
});
