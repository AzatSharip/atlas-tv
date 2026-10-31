import $L from '@enact/i18n/$L';

export const TIMEOUT = 'timeout';
export const DNS_OR_NETWORK = 'network';
export const INVALID_ADDRESS = 'invalid_address';
export const SERVER_NOT_JELLYFIN = 'not_jellyfin';
export const VERSION_UNSUPPORTED = 'version_unsupported';
export const AUTH_FAILED = 'auth_failed';
export const SERVER_ERROR = 'server_error';
export const INSECURE_CERT = 'insecure_cert';

export const MIN_SERVER_VERSION = '10.9.0';

// Looked up rather than stored, because $L only has the strings once the locale
// chunk has landed and these modules are imported well before that.
const MESSAGES = {
	[TIMEOUT]: () => $L('Connection timed out. Check the address and your network.'),
	[DNS_OR_NETWORK]: () => $L('Could not reach server. Check the address and that the server is running.'),
	[INVALID_ADDRESS]: () => $L('Invalid server address format.'),
	[SERVER_NOT_JELLYFIN]: () => $L('Server responded but does not appear to be Jellyfin or Emby.'),
	[VERSION_UNSUPPORTED]: () => $L('Server version is not supported. Minimum: {version}').replace('{version}', MIN_SERVER_VERSION) + '.',
	[AUTH_FAILED]: () => $L('Invalid username or password.'),
	[SERVER_ERROR]: () => $L('Server error. Please try again later.'),
	[INSECURE_CERT]: () => $L('Your TV rejected this server\'s security certificate. Check the TV\'s date & time, update webOS, or use a server whose certificate your TV trusts. Public servers using Let\'s Encrypt may not work on older TVs.')
};

const LOGIN_MESSAGES = {
	[AUTH_FAILED]: () => $L('Invalid username or password.'),
	[TIMEOUT]: () => $L('Server timed out during login.')
};

export function getConnectionMessage (type) {
	return MESSAGES[type] ? MESSAGES[type]() : $L('Failed to connect. Check the address and try again.');
}

export function getLoginMessage (type) {
	return LOGIN_MESSAGES[type] ? LOGIN_MESSAGES[type]() : $L('Login failed. Please try again.');
}

export function classifyError (err) {
	if (!err) return null;
	if (err.connectionType) return err.connectionType;
	if (err.name === 'AbortError' || err.message === 'The operation was aborted.') return TIMEOUT;
	if (err instanceof TypeError) return DNS_OR_NETWORK;
	const status = err.status || err.response?.status;
	if (status === 401 || status === 403) return AUTH_FAILED;
	if (status >= 500) return SERVER_ERROR;
	return null;
}

/**
 * Work out which media server answered. A server that names itself is taken at
 * its word, and past that Emby is the only one that ships a four part version
 * below 10. Null means the reply came from something else entirely.
 *
 * @param {string} [productName]
 * @param {string} [version]
 * @returns {string|null} 'jellyfin', 'emby', or null
 */
export function detectServerType (productName, version) {
	const named = String(productName || '').toLowerCase();
	if (named.indexOf('jellyfin') >= 0) return 'jellyfin';
	if (named.indexOf('emby') >= 0) return 'emby';

	const parts = String(version || '').split('.');
	const major = parseInt(parts[0], 10);
	if (!Number.isNaN(major) && parts.length >= 4 && major < 10) return 'emby';
	return null;
}

export function isVersionSupported (versionString) {
	if (!versionString) return false;
	const parts = versionString.split('.').map(Number);
	const min = MIN_SERVER_VERSION.split('.').map(Number);
	for (let i = 0; i < min.length; i++) {
		if ((parts[i] || 0) > min[i]) return true;
		if ((parts[i] || 0) < min[i]) return false;
	}
	return true;
}
