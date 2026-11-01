# Atlas TV source boundaries

This is a public client source repository, separate from any server operations repository.

- Never commit server addresses, tokens, passwords, local-storage snapshots, private library IDs, media inventories, signing certificates or private keys.
- Preserve upstream MPL-2.0 notices and legal attribution.
- Preserve Tizen package/app IDs and stored settings keys unless an explicit migration is designed and approved.
- Do not access or modify a production server, media originals or a TV merely to build this repository. Deployment is a separate authorized operation.
- Keep home-video behavior scoped to runtime-discovered `homevideos` libraries. Preserve movie and explicit playlist behavior.
- Run the archive regression script and the normal Tizen build/lint gate for relevant changes. Report real-device checks separately from build/test success.

- Before owner acceptance, remove every synthetic test video and associated image/subtitle created in live libraries; verify they disappear from the index. Preserve user media and recovery backups.
