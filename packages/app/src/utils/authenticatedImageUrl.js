// Session state only; never persist credentials or send them to artwork providers.
let server = '';
let token = '';
let parameter = 'ApiKey';
export const setImageSession = (url, value, type) => {
	server = (url || '').replace(/\/+$/, '');
	token = value || '';
	parameter = type === 'emby' ? 'api_key' : 'ApiKey';
};
export const authenticatedImageUrl = (url) => {
	if (!url || !server || !token || !url.startsWith(server + '/')) return url;
	const relative = url.slice(server.length);
	if (!/^\/(Items|Users|UserImage)(?:\/|\?)/i.test(relative) || !/Images?\b/i.test(relative)) return url;
	if (/[?&](ApiKey|api_key)=/i.test(url)) return url;
	return url + (url.includes('?') ? '&' : '?') + parameter + '=' + encodeURIComponent(token);
};
