import copy
import os
import tempfile
import unittest
from unittest.mock import patch, MagicMock
from profile_broker import Broker, Denied, digest, verifier, token_from

class SecurityTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.pins = {'adult': verifier('0123'), 'owner': verifier('012345')}

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.now = [100000.0]
        self.revoked = set()
        self.issued = {}
        self.config = {'devices': [digest('test-device')], 'roles': {role: {
            'id': str(n) * 32, 'username': role, 'password': 'synthetic-password-' + role,
            **({'pin': self.pins[role]} if role in self.pins else {})
        } for n, role in enumerate(('child', 'adult', 'owner'), 1)}}
        self.path = self.temp.name + '/state.db'
        self.broker = self.open()

    def open(self):
        return Broker(copy.deepcopy(self.config), self.path, self.upstream, lambda: self.now[0])

    def upstream(self, path, token=None, body=None, device=None):
        if path == '/Users/AuthenticateByName':
            role = body['Username']; token = 'token-' + str(len(self.issued))
            self.issued[token] = role
            return {'User': {'Id': self.config['roles'][role]['id']}, 'AccessToken': token}
        if path == '/Sessions/Logout':
            self.revoked.add(token); return {}
        if token not in self.issued or token in self.revoked:
            raise Denied(401)
        role = self.issued[token]
        if path == '/Users/Me':
            return {'Id': self.config['roles'][role]['id']}
        if path.startswith('/Items/'):
            item = path.split('/')[-1]
            allowed = {'child': ['a'], 'adult': ['a', 'b'], 'owner': ['c']}[role]
            if item[0] not in allowed:
                raise Denied()
        return {}

    def login(self, pin=None):
        return self.broker.login('test-device', {'pin': pin} if pin is not None else {'action': 'child'})['AccessToken']

    def denied(self, action, status=None):
        with self.assertRaises(Denied) as caught: action()
        if status: self.assertEqual(caught.exception.status, status)

    def auth(self, token, path, method='GET'):
        return self.broker.authorize(token, '/jellyfin' + path, '/jellyfin/Users/Me', method)

    def test_backend_token_is_inside_authorization_header(self):
        self.broker.config['backend'] = 'http://example.invalid/jellyfin'
        response = MagicMock()
        response.__enter__.return_value.read.return_value = b'{}'
        with patch('urllib.request.urlopen', return_value=response) as request:
            self.broker.request('/Users/Me', 'synthetic-token')
        header = request.call_args.args[0].get_header('Authorization')
        self.assertIn('Token="synthetic-token"', header)
        self.assertIn('Client="Atlas TV"', header)

    def test_exact_string_pins_prefix_and_leading_zero(self):
        self.assertEqual(self.issued[self.login('0123')], 'adult')
        self.assertEqual(self.issued[self.login('012345')], 'owner')
        for wrong in ('123', '01234', 123, '012346'):
            self.denied(lambda: self.login(wrong), 401)

    def test_device_required(self):
        self.denied(lambda: self.broker.login('wrong', {'action': 'child'}), 401)

    def test_matrix_lists_images_streams_subtitles_and_legacy_ids(self):
        for pin, allowed in [(None, 'a'), ('0123', 'ab'), ('012345', 'c')]:
            token = self.login(pin)
            for item in 'abc':
                for path in ['/Items/{id}', '/Items/{id}/Images/Primary', '/Videos/{id}/stream.mp4',
                             '/Videos/{id}/master.m3u8', '/Videos/{id}/hls1/main/0.ts',
                             '/Videos/{id}/Subtitles/0/Stream.srt', '/Users/' + self.config['roles'][self.issued[token]]['id'] + '/Items/{id}']:
                    call = lambda: self.auth(token, path.format(id=item * 32))
                    if item in allowed: call()
                    else: self.denied(call, 403)

    def test_bulk_ids_parent_and_mixed_selectors_enforce_visibility(self):
        token = self.login()
        self.auth(token, '/Items?Ids=' + 'a' * 32)
        for key in ['Ids', 'ids', 'ParentId', 'ItemId', 'AncestorIds', 'SeriesId']:
            self.denied(lambda: self.auth(token, '/Items?' + key + '=' + 'c' * 32), 403)
        self.denied(lambda: self.auth(token, '/Items?Ids=' + 'a' * 32 + ',' + 'c' * 32), 403)
        self.denied(lambda: self.auth(token, '/Playlists', 'POST'), 403)

    def test_modern_history_ids_and_subtitle_source_are_protected(self):
        token = self.login()
        for prefix in ['UserItems', 'UserFavoriteItems', 'UserPlayedItems', 'Shows', 'Playlists']:
            self.denied(lambda: self.auth(token, '/' + prefix + '/' + 'c' * 32), 403)
        self.denied(lambda: self.auth(token, '/Videos/' + 'a' * 32 + '/' + 'c' * 32 + '/Subtitles/0/0/Stream.srt'), 403)
        self.auth(token, '/Users/Configuration?userId=' + '1' * 32)
        self.denied(lambda: self.auth(token, '/Users/Configuration?userId=' + '1' * 32, 'POST'), 403)
        self.denied(lambda: self.auth(token, '/DisplayPreferences/test', 'POST'), 403)

    def test_progress_cannot_inject_other_library_or_queue(self):
        token = self.login()
        self.broker.report_playback(token, '/jellyfin/Sessions/Playing/Progress', {'ItemId': 'a' * 32, 'PositionTicks': 10, 'NowPlayingQueue': [{'Id': 'c' * 32}]})
        self.denied(lambda: self.broker.report_playback(token, '/jellyfin/Sessions/Playing', {'ItemId': 'c' * 32}), 403)
        self.denied(lambda: self.broker.report_playback(token, '/jellyfin/Sessions/Playing', {'ItemId': 'a' * 32, 'MediaSourceId': 'c' * 32}), 403)
        self.denied(lambda: self.broker.report_playback(token, '/jellyfin/Sessions/Playing', {'ItemId': 'a' * 32, 'itemId': 'c' * 32}), 400)

    def test_session_discovery_remote_control_and_user_spoof(self):
        token = self.login('0123')
        for path in ['/System/Configuration', '/ScheduledTasks', '/Library/VirtualFolders', '/Plugins', '/Auth/Keys', '/Sessions', '/Sessions/another/Playing', '/Devices', '/SyncPlay/List', '/socket',
                     '/Users', '/Users/' + '3' * 32, '/Items?UserId=' + '3' * 32,
                     '/Items/' + 'b' * 32 + '/Download']:
            self.denied(lambda: self.auth(token, path), 403)
        self.auth(token, '/Sessions/Playing/Progress', 'POST')

    def test_no_unregistered_old_token_or_expired_or_revoked(self):
        self.issued['old'] = 'adult'
        self.denied(lambda: self.auth('old', '/Items'), 401)
        token = self.login('012345')
        self.now[0] += 901
        self.denied(lambda: self.auth(token, '/Items'), 401)
        self.denied(lambda: self.broker.heartbeat('test-device', token), 401)
        self.broker.expire()
        self.assertIn(token, self.revoked)
        token = self.login('012345')
        self.broker.revoke(token)
        self.denied(lambda: self.auth(token, '/Items'), 401)

    def test_heartbeat_absolute_expiry(self):
        token = self.login('012345')
        for _ in range(32):
            self.now[0] += 899
            self.broker.heartbeat('test-device', token)
        self.now[0] += 899
        self.denied(lambda: self.broker.heartbeat('test-device', token), 401)

    def test_attempts_survive_restart_and_child_login_and_length_switch(self):
        for pin in ['0000', '000000', '1', '', '5555']:
            self.denied(lambda: self.login(pin), 401)
        self.login()  # child login does not unlock adult attempts
        self.broker.db.close(); self.broker = self.open()
        self.denied(lambda: self.login('012345'), 429)
        self.now[0] += 31
        self.login('012345')

    def test_ambiguous_credentials_denied(self):
        self.denied(lambda: token_from({'X-Emby-Token': 'one', 'Authorization': 'MediaBrowser Token="two"'}), 401)
        self.assertEqual(token_from({'Authorization': 'MediaBrowser Token="same"', 'X-Atlas-Query-Token': 'same'}), 'same')

    def tearDown(self):
        self.broker.db.close(); self.temp.cleanup()

if __name__ == '__main__': unittest.main()
