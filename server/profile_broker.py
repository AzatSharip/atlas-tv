#!/usr/bin/env python3
"""Device-bound profile sessions. Unix socket only; no media proxy or admin credentials.
Configuration and SQLite state are private runtime files, never client assets.
"""
import hashlib
import hmac
import json
import os
import re
import secrets
import socketserver
import sqlite3
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from http.server import BaseHTTPRequestHandler


def digest(value):
    return hashlib.sha256(value.encode()).hexdigest()


def pin_hash(pin, salt):
    return hashlib.scrypt(pin.encode(), salt=bytes.fromhex(salt), n=16384, r=8, p=1).hex()


def verifier(pin):
    salt = secrets.token_hex(16)
    return {'salt': salt, 'hash': pin_hash(pin, salt)}


class Denied(Exception):
    def __init__(self, status=403):
        self.status = status


class Broker:
    def __init__(self, config, state, upstream=None, clock=time.time):
        self.config, self.clock = config, clock
        self.call = upstream or self.request
        self.lock = threading.RLock()
        self.db = sqlite3.connect(state, check_same_thread=False)
        self.db.executescript('''
            CREATE TABLE IF NOT EXISTS attempts (device TEXT PRIMARY KEY, failures INTEGER, until REAL, day REAL, count INTEGER);
            CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, device TEXT, role TEXT, expires REAL, absolute REAL);
        ''')
        self.db.commit()

    def request(self, path, token=None, body=None, device='broker'):
        headers = {'Content-Type': 'application/json', 'Authorization':
                   'MediaBrowser Client="Atlas TV", Device="Television", DeviceId="%s", Version="3.0.0"' % device}
        if token:
            headers['Authorization'] += ', Token="' + token + '"'
        req = urllib.request.Request(self.config['backend'] + path, headers=headers,
                                     data=None if body is None else json.dumps(body).encode())
        try:
            with urllib.request.urlopen(req, timeout=8) as res:
                raw = res.read()
                return json.loads(raw) if raw else {}
        except urllib.error.HTTPError as err:
            raise Denied(401 if err.code == 401 else 403) from None

    def device(self, key):
        hashed = digest(key)
        if not any(hmac.compare_digest(hashed, known) for known in self.config['devices']):
            raise Denied(401)
        return hashed

    def revoke(self, token):
        with self.lock:
            self.db.execute('DELETE FROM sessions WHERE token=?', (token,))
            self.db.commit()
        try:
            self.call('/Sessions/Logout', token, {})
        except Exception:
            pass  # Registry denial is authoritative even when backend is down.

    def expire(self):
        with self.lock:
            tokens = [row[0] for row in self.db.execute('SELECT token FROM sessions WHERE expires<=? OR absolute<=?', (self.clock(), self.clock()))]
        for token in tokens:
            self.revoke(token)

    def login(self, key, payload):
        device = self.device(key)
        with self.lock:
            now = self.clock()
            role = 'child'
            if payload.get('action') != 'child':
                row = self.db.execute('SELECT failures,until,day,count FROM attempts WHERE device=?', (device,)).fetchone()
                failures, until, day, count = row or (0, 0, now, 0)
                if now - day >= 86400:
                    day, count = now, 0
                if until > now or count >= 100:
                    raise Denied(429)
                pin = payload.get('pin', '')
                valid = isinstance(pin, str) and re.fullmatch(r'[0-9]{4}|[0-9]{6}', pin)
                role = None
                # Both verifiers always evaluated; no response reveals a partial match.
                for name in ('adult', 'owner'):
                    check = self.config['roles'][name]['pin']
                    matches = hmac.compare_digest(pin_hash(pin if valid else '', check['salt']), check['hash'])
                    if valid and matches:
                        role = name
                count += 1
                failures = 0 if role else failures + 1
                until = 0 if role else now + (min(900, 30 * 2 ** min(5, failures - 5)) if failures >= 5 else 0)
                self.db.execute('INSERT OR REPLACE INTO attempts VALUES (?,?,?,?,?)', (device, failures, until, day, count))
                self.db.commit()
                if not role:
                    raise Denied(401)
            account = self.config['roles'][role]
            auth = self.call('/Users/AuthenticateByName', None,
                             {'Username': account['username'], 'Pw': account['password']}, device='atlas-' + device[:20] + '-' + role)
            if auth['User']['Id'].replace('-', '') != account['id'].replace('-', ''):
                raise Denied()
            token = auth['AccessToken']
            self.db.execute('INSERT OR REPLACE INTO sessions VALUES (?,?,?,?,?)', (token, device, role, now + 900, now + 28800))
            self.db.commit()
            return {'User': auth['User'], 'AccessToken': token, 'Role': role, 'ExpiresIn': 900}

    def heartbeat(self, key, token):
        device = self.device(key)
        with self.lock:
            row = self.db.execute('SELECT device,expires,absolute FROM sessions WHERE token=?', (token,)).fetchone()
            if not row or row[0] != device or min(row[1:]) <= self.clock():
                raise Denied(401)
            self.db.execute('UPDATE sessions SET expires=? WHERE token=?', (min(self.clock() + 900, row[2]), token))
            self.db.commit()
        return {}

    def authorize(self, token, original, checked_path, method):
        if not token:
            raise Denied(401)
        user = self.call('/Users/Me', token)
        uid = user['Id'].replace('-', '').lower()
        managed = any(account['id'].replace('-', '').lower() == uid for account in self.config['roles'].values())
        if managed:
            with self.lock:
                row = self.db.execute('SELECT role,expires,absolute FROM sessions WHERE token=?', (token,)).fetchone()
            if not row or min(row[1:]) <= self.clock():
                raise Denied(401)
        path = urllib.parse.urlsplit(original).path
        path = re.sub(r'^/jellyfin', '', path, flags=re.I)
        query = urllib.parse.parse_qs(urllib.parse.urlsplit(original).query)
        supplied = [v for k, values in query.items() if k.lower().replace('_', '') in ('apikey', 'accesstoken') for v in values]
        if any(not hmac.compare_digest(v, token) for v in supplied):
            raise Denied(401)
        if any(k.lower() in ('userid', 'user_id') and any(v.replace('-', '').lower() != uid for v in values) for k, values in query.items()):
            raise Denied()
        # Jellyfin's bulk Ids lookup does not enforce the same visibility check as
        # the individual item endpoint. Validate every explicit selector ourselves.
        selectors = {'ids', 'id', 'itemid', 'itemids', 'parentid', 'ancestorid',
                     'ancestorids', 'seriesid', 'seasonid', 'startitemid', 'adjacentto',
                     'mediasourceid', 'personid', 'artistids', 'albumartistids', 'genreids', 'studioids'}
        selected = set()
        for key, values in query.items():
            if key.lower().replace('_', '') in selectors:
                for value in values:
                    selected.update(part for part in value.split(',') if part)
        if len(selected) > 256:
            raise Denied(400)
        for selected_id in selected:
            if not re.fullmatch(r'[0-9a-fA-F-]{32,36}', selected_id):
                raise Denied(400)
            self.call('/Items/' + selected_id, token)
        if method.upper() not in ('GET', 'HEAD', 'OPTIONS') and re.match(r'^/(Playlists|Collections)(/|$)', path, re.I):
            raise Denied()
        if managed and row[0] == 'child' and method.upper() not in ('GET', 'HEAD', 'OPTIONS') and (
                re.match(r'^/DisplayPreferences(/|$)', path, re.I) or re.fullmatch(r'/Users/(?:[0-9a-f-]{32,36}/)?Configuration', path, re.I)):
            raise Denied()
        # Management configuration is never needed by a TV viewing profile.
        if re.match(r'^/(System|ScheduledTasks|Plugins|Packages|Environment|Configuration|Backup|Auth|ApiKeys?|Library)(/|$)', path, re.I):
            raise Denied()
        # No discovery/control of somebody else's sessions, devices, users or shared groups.
        if re.match(r'^/(Devices|SyncPlay|QuickConnect|socket)(/|$)', path, re.I):
            raise Denied()
        if re.match(r'^/Sessions(/|$)', path, re.I) and not re.fullmatch(r'/Sessions/(Playing(?:/Progress|/Stopped)?|Capabilities(?:/Full)?|Logout)', path, re.I):
            raise Denied()
        if re.match(r'^/Users(/|$)', path, re.I):
            match = re.match(r'^/Users/([0-9a-f-]{32,36})(?:/|$)', path, re.I)
            if match and match[1].replace('-', '').lower() != uid:
                raise Denied()
            if re.search(r'/(Password|EasyPassword|Policy)$', path, re.I):
                raise Denied()
            if not match and path.lower() not in ('/users/me', '/users/configuration'):
                raise Denied()
        if re.search(r'/(Download|File)$', path, re.I):
            raise Denied()
        # Include older user-prefixed item routes as well as native video/image/subtitle paths.
        subtitle = re.search(r'^/(?:Videos|Audio)/([0-9a-f-]{32,36})/([0-9a-f-]{32,36})/Subtitles/', path, re.I)
        if subtitle and subtitle[1].replace('-', '').lower() != subtitle[2].replace('-', '').lower():
            raise Denied()
        item = re.search(r'/(?:Items|UserItems|UserFavoriteItems|UserPlayedItems|FavoriteItems|PlayedItems|Videos|Audio|Shows|Playlists|Collections)/([0-9a-f-]{32,36})(?:/|$)', path, re.I)
        if item:
            self.call('/Items/' + item[1], token)
        elif checked_path not in ('/jellyfin/Users/Me', '/Users/Me'):
            raise Denied()
        return {}

    def report_playback(self, token, original, payload):
        path = urllib.parse.urlsplit(original).path
        path = re.sub(r'^/jellyfin', '', path, flags=re.I)
        if not re.fullmatch(r'/Sessions/Playing(?:/Progress|/Stopped)?', path, re.I):
            raise Denied(404)
        self.authorize(token, original, '/jellyfin/Users/Me', 'POST')
        if not isinstance(payload, dict):
            raise Denied(400)
        # Do not forward arbitrary user IDs, queue contents or unknown object data.
        names = ['ItemId', 'MediaSourceId', 'PlaySessionId', 'PositionTicks', 'CanSeek',
                 'IsPaused', 'IsMuted', 'VolumeLevel', 'PlayMethod', 'AudioStreamIndex',
                 'SubtitleStreamIndex', 'EventName', 'RepeatMode', 'PlaybackOrder', 'Failed']
        allowed = {name.lower(): name for name in names}
        body = {}
        for key, value in payload.items():
            target = allowed.get(key.lower())
            if target:
                if target in body:
                    raise Denied(400)
                body[target] = value
        item = body.get('ItemId')
        if not isinstance(item, str) or not re.fullmatch(r'[0-9a-fA-F-]{32,36}', item):
            raise Denied(400)
        source = body.get('MediaSourceId')
        if source and (not isinstance(source, str) or source.replace('-', '').lower() != item.replace('-', '').lower()):
            raise Denied()
        self.call('/Items/' + item, token)
        return self.call(path, token, body)


def token_from(headers):
    tokens = []
    for name in ('X-Emby-Token', 'X-Atlas-Query-Token'):
        if headers.get(name):
            tokens.append(headers[name])
    tokens.extend(re.findall(r'\bToken="([^"]+)"', headers.get('Authorization', ''), re.I))
    if len(set(tokens)) > 1:
        raise Denied(401)
    return tokens[0] if tokens else ''


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass  # Never log bodies, tokens, PINs, or media paths.

    def reply(self, status, result):
        data = json.dumps(result).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Atlas-Device, X-Emby-Token')
        self.send_header('Content-Length', '0')
        self.end_headers()

    def do_GET(self):
        try:
            if self.path != '/authorize':
                raise Denied(404)
            self.server.broker.authorize(token_from(self.headers), self.headers.get('X-Atlas-Original', ''),
                                         self.headers.get('X-Atlas-Checked', ''), self.headers.get('X-Atlas-Method', 'GET'))
            self.reply(200, {})
        except Denied as err:
            self.reply(err.status, {'error': 'Access denied'})
        except Exception:
            self.reply(503, {'error': 'Unavailable'})

    def do_POST(self):
        try:
            size = int(self.headers.get('Content-Length', '0'))
            playback_route = bool(re.fullmatch(r'/(?:jellyfin/)?Sessions/Playing(?:/Progress|/Stopped)?', urllib.parse.urlsplit(self.path).path, re.I))
            if size < 2 or size > (65536 if playback_route else 2048):
                raise Denied(400)
            body = json.loads(self.rfile.read(size))
            if playback_route:
                result = self.server.broker.report_playback(token_from(self.headers), self.headers.get('X-Atlas-Original', ''), body)
                self.reply(200, result)
                return
            key = self.headers.get('X-Atlas-Device', '')
            broker = self.server.broker
            device = broker.device(key)
            if self.path == '/login':
                result = broker.login(key, body)
            elif self.path == '/heartbeat':
                result = broker.heartbeat(key, token_from(self.headers))
            elif self.path == '/logout':
                token = token_from(self.headers)
                with broker.lock:
                    row = broker.db.execute('SELECT device FROM sessions WHERE token=?', (token,)).fetchone()
                if row and row[0] != device:
                    raise Denied()
                broker.revoke(token)
                result = {}
            else:
                raise Denied(404)
            self.reply(200, result)
        except Denied as err:
            self.reply(err.status, {'error': 'Не удалось войти. Проверьте код или повторите позже.'})
        except Exception:
            self.reply(503, {'error': 'Сервер недоступен'})


class Server(socketserver.ThreadingMixIn, socketserver.UnixStreamServer):
    daemon_threads = True


def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--config', required=True)
    parser.add_argument('--state', required=True)
    parser.add_argument('--socket', required=True)
    args = parser.parse_args()
    os.umask(0o077)
    broker = Broker(json.load(open(args.config)), args.state)
    if os.path.exists(args.socket):
        os.unlink(args.socket)
    server = Server(args.socket, Handler)
    os.chmod(args.socket, 0o666)
    server.broker = broker
    def reap():
        while True:
            broker.expire()
            time.sleep(10)
    threading.Thread(target=reap, daemon=True).start()
    server.serve_forever()


if __name__ == '__main__':
    main()
