# File playback recovery on Tizen

Atlas 2.11.5 adds a position-based watchdog for file playback. It applies to
direct playback and HLS, including streams that only convert audio. Live TV
continues to use its separate recovery policy.

- A stationary playback position for 30 seconds triggers a fresh negotiation
  and reopen at the saved position, retaining selected audio/subtitle tracks,
  the source, bitrate ceiling and direct-play restrictions.
- Pause, seeking, backgrounding, group playback and the end of a clip do not
  count as stalls. Cancellation prevents an obsolete response from starting
  a previous selection after Back or a file change.
- After playback has started, native errors and stall recovery share one pending
  recovery. At most two
  recovery attempts are allowed per load; a failed request or exhausted budget
  surfaces an error instead of looping.
- Recovery does not raise bitrate limits, weaken authentication, or force a
  lower bitrate/full video transcode. A slow encoder or insufficient sustained
  bandwidth needs a suitable playback profile; reopening cannot supply missing
  CPU or network capacity. Original media are never rewritten by this feature.

The source tests cover stationary versus advancing time, pause/seek/background
grace periods, end of file, cancellation, concurrent recovery requests, failed
authorization/preparation, attempt limits and track/constraint preservation.
They complement device testing; they do not guarantee all codecs or file sizes.

Install an update with the same Tizen application identity and signing author.
Keep a previously working signed package for rollback. Source publication and
CI builds do not deploy to a television or change a server's configuration.
