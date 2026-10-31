# Atlas TV

A personal-media-focused fork of [Moonfin Smart TV](https://github.com/Moonfin-Client/Smart-TV), based on upstream **2.10.0** (`e06c65eb17e7620fab5945bd1d2298ec17ce091a`). Licensed under **MPL-2.0**. Independent project, not an official Moonfin release.

![Atlas](packages/build-tizen/tizen/icon-large.png)

## Что изменено

- Оформление Atlas: прямоугольная плитка Samsung, светлый векторный логотип и движущийся скринсейвер.
- Улучшенные русские подписи.
- В библиотеках Jellyfin типа «Домашние видео и фото» (`homevideos`): запуск ролика одним нажатием, очередь остальных видео текущей папки, возврат в ту же папку, крупные подписи.
- Для домашнего видео на Tizen: предпочтение потокового HLS вместо прямого MP4/MOV; видео может копироваться без перекодирования, если сервер и формат позволяют.
- Учёт поворота телефона при настройке декодера и пропорций вертикального транскодированного видео на старых Samsung.

Оригиналы не перемещаются и не изменяются. Сервер, учётную запись и библиотеки пользователь подключает сам. В исходниках нет настроек конкретного сервера.

## Build a Samsung package

Use Node.js **22 LTS** and npm. Ensure both `node` and `npm` resolve to the same current installation.

```sh
npm ci
node scripts/test-atlas-folders.cjs
npm run build:tizen:oblong -- --skip-tizen-cli
```

The result is an **unsigned** `Atlas_Tizen_Oblong_v2.11.0.wgt` in the repository root. The build runs the upstream lint gate and Tizen compatibility transforms. Sign locally with your own compatible Tizen author/distributor certificates and install through the Samsung developer tools. No certificates or device credentials are shipped here. An unsigned package alone cannot be installed on a retail TV.

This fork intentionally retains the Tizen application/package IDs and existing `moonfin_*` storage keys for an in-place upgrade of an existing Moonfin installation signed with the **same author certificate**. Atlas and Moonfin therefore cannot coexist under these IDs. Do not uninstall your working client just to change the branding; keep a signed rollback package and a private settings backup outside this repository.

## Home-video usage

Add the existing media directory to a Jellyfin **Home videos and photos** library, then open it in Atlas. Folder view defaults on for that library type. Select a video to play it and subsequent video files in that folder, in its displayed sort order. Enable automatic playback in settings; the optional early “Next Up” action can be disabled for short clips. Back returns to the originating folder. Explicit playlists take priority. Subfolders, photos and metadata-only files are not silently added to the queue.

Home-video detection happens at runtime from the library type; no library IDs or private paths are compiled into the app. Other movie/series libraries retain the upstream flow.

## Support and limits

The maintained target is Samsung Tizen, particularly 2018/Tizen 4 hardware. Other platform sources are inherited for provenance and are **not validated Atlas releases**. A successful build is not a promise that every codec, bitrate or server can play smoothly. Full video transcoding needs sufficient server capacity; portrait output and remote seeking still require real-device testing.

Settings, authentication and optional integrations retain upstream behavior. See [PRIVACY.md](PRIVACY.md). Source-code attribution is also present in the app’s legal information. For upstream setup and architecture, see [the preserved upstream README](docs/UPSTREAM_README.md).

## Artwork and license

The launcher is an AI-generated ATLAS wordmark in violet, blue and cyan. The floating light wordmark is an original SVG made from paths, with no external font dependency. Artwork is included under the same MPL-2.0 terms as this fork. It is independent artwork; no film logo or third-party brand asset is included as the Atlas identity.

Original source and retained copyright notices: Moonfin contributors. Atlas modifications: Atlas contributors. See [LICENSE](LICENSE).
