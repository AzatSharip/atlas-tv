# Family video release

This optional deployment mode requires a separately enrolled television and the
profile broker in `server/`. The generic WGT contains no deployment address,
device key, account mapping, PIN verifier, password or private session.

Two visible entries select three non-administrator Jellyfin users. Child entry
has its own explicit library allowlist. The neutral adult PIN dialog submits only
on OK; leading zeros are preserved. A four-digit code selects the ordinary adult,
a six-digit code selects a separately authorized collection. Ordinary accounts
must explicitly exclude that collection. Existing media must never be relocated.

The broker listens on a Unix socket behind the existing TLS gateway. It keeps
strong Jellyfin passwords server-side and checks scrypt verifiers for both codes.
Five failed attempts start exponential backoff, capped at 15 minutes; a rolling
24-hour bucket permits at most 100 PIN submissions per enrolled device. The same
persistent SQLite counters apply across code lengths, clients and restarts.
Device-key rejection happens before expensive PIN verification. HTTPS login also
needs a request-rate limit. PIN values and tokens must not appear in URL/logs.

Session tokens are valid only while registered in the broker. Inactivity expires
a session after 15 minutes; a foreground heartbeat extends it up to eight hours.
Logout removes registry access immediately and requests backend logout. A reaper
also logs out expired sessions. Managed-user tokens issued outside this mechanism
are rejected by the gateway, including older TV tokens. Backend/admin access
must remain private. Failure of the broker must deny access, never skip checks.

Each authenticated request still checks the Jellyfin user and, for media, the
requested item. Bulk item IDs, parent selectors and modern history/favorite routes
need the same individual visibility checks: a token alone is insufficient. Playback
reports must validate their JSON item/source IDs before forwarding progress; discard
foreign user/queue fields. Reject mismatching media-source selectors and old cache-file HLS
aliases. Block cross-user discovery/control, websocket sessions, shared playback,
other-user IDs, management configuration, password/policy mutation and downloads at the public gateway.
Apply the same policy on every public origin. Deployment must test actual server
permissions as well as gateway refusal. These policies do not hide content from
server/disk administrators and cannot prevent an authorized viewer recording it.

The client starts at the chooser, keeps role sessions/storage in memory, clears
image/folder caches on switches, rejects delayed API responses and revokes the
session on background/exit. A crash is covered by expiry. Nothing should restore
the previous private page on startup. Device enrollment itself is persistent and
must be provisioned privately; possession permits child entry, not adult entry.
PIN recovery is an administrator operation outside the television interface.
The chooser uses an original vector mouse for the child and retains the adult A.
The remote-selectable «Стереть» key removes only the last PIN digit; confirmation
remains explicit OK, including for six-digit codes.

Video UX: recursive index-based empty-folder filtering (four concurrent checks,
30-second presence cache), direct card playback with a server-progress choice,
five movie/cartoon poster columns at the default Full HD library size, movie home-row
posters enlarged by a further third, 15-second jumps and accelerated held-arrow previews.
The three fixed home library tiles and the archive grid retain their dimensions.
The archive's physical hierarchy and folder queue are preserved. Photos are out
of scope. Scan/index configuration must remain enabled on the server.

Validation before rollout: broker unit tests; profile cancellation/background
component tests; folder pagination/queue regression; playback recovery and seek
unit tests; Tizen lint/build. Hardware acceptance must separately cover remote
PIN editing/OK, all three roles, seek/resume, profile changes, background/restart,
newly indexed video, and both public origins' authorization matrices. A passing
local build is not evidence of completed installation or owner acceptance.

For shorter home videos, configure the server resume-duration threshold explicitly;
otherwise the server can discard progress for clips below its default minimum.
Keep previous configuration for rollback. Real filesystem monitoring and a fallback
library scan must remain enabled; discovery delay includes server indexing and the
client's bounded cache refresh.

Operations: preserve the broker runtime directory across restarts so the gateway's
bind mount keeps resolving its socket. Start it before the gateway, with a soft
startup dependency; do not restart the media backend merely to restart PIN checks.
Authorization must still fail closed during a broker outage. Keep registry state
persistent and deploy configuration only through a private administrative channel.

The TV's nonsecret device identifier is stable across role switches. A low Jellyfin
MaxActiveSessions cap is unsuitable here: backend validation and stale device entries
can consume it and reject correct PINs. Enforce enrolled-device admission and bounded
registered tokens at the broker; keep viewing users non-admin with explicit allowlists.
Remove synthetic acceptance media and their index cards before owner acceptance.

Private-profile isolation includes Continue Watching, recent items, search, favorites,
recommendations, artwork, navigation and playback queues. Switching accounts destroys
the previous view tree and clears its volatile storage; late requests cannot repopulate
the next account. Server-side progress remains with its original Jellyfin user.
Regression tests cover owner-to-child and owner-to-adult transitions, delayed content
and storage isolation. Never use an owner's private media as a playback test fixture.
