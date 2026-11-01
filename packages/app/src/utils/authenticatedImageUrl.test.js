import {setImageSession, authenticatedImageUrl as image} from './authenticatedImageUrl';
const server = 'https://media.example/jellyfin';
const url = server + '/Items/fixture/Images/Primary?quality=90';
afterEach(() => setImageSession('', '', 'jellyfin'));
test('adds the current token to same-server item images only', () => {
	setImageSession(server, 'test-session', 'jellyfin');
	expect(image(url)).toBe(url + '&ApiKey=test-session');
	expect(image(image(url))).toBe(image(url));
	for (const other of ['https://images.example/Items/fixture/Images/Primary', server + '.evil/Items/fixture/Images/Primary', server + '/Items/fixture']) expect(image(other)).toBe(other);
});
test('logout removes image authentication and Emby uses its own parameter', () => {
	setImageSession(server, 'test-session', 'emby');
	expect(image(url)).toBe(url + '&api_key=test-session');
	setImageSession(server, '', 'jellyfin');
	expect(image(url)).toBe(url);
});
