import {renderHook} from '@testing-library/react';

// The real one reaches for ilib, which the test runner cant resolve.
jest.mock('@enact/i18n/$L', () => ({__esModule: true, default: (text) => text}));

import useSeerrRequests from './useSeerrRequests';
import {PERMISSIONS} from '../../services/seerrApi';

// A series nobody owns or has asked for.
const setup = (over = {}) => renderHook(() => useSeerrRequests({
	mediaId: 1,
	mediaType: 'tv',
	details: {seasons: [{seasonNumber: 1}], numberOfSeasons: 1, mediaInfo: null},
	setDetails: () => {},
	setError: () => {},
	isAuthenticated: true,
	userPermissions: PERMISSIONS.REQUEST,
	currentUserId: 7,
	is4kEnabled: false,
	hdStatus: 1,
	status4k: 1,
	...over
}));

describe('seerr request gate', () => {
	test('offers a request on the permission alone', () => {
		expect(setup().result.current.canRequestHd).toBe(true);
	});

	test('says no without the permission', () => {
		expect(setup({userPermissions: PERMISSIONS.NONE}).result.current.canRequestHd).toBe(false);
		expect(setup({userPermissions: null}).result.current.canRequestHd).toBe(false);
	});

	test('says no when the viewer is not signed in to seerr', () => {
		expect(setup({isAuthenticated: false}).result.current.canRequestHd).toBe(false);
	});

	test('takes the per media type permission too', () => {
		expect(setup({userPermissions: PERMISSIONS.REQUEST_TV}).result.current.canRequestHd).toBe(true);
		expect(setup({userPermissions: PERMISSIONS.REQUEST_MOVIE}).result.current.canRequestHd).toBe(false);
	});
});
