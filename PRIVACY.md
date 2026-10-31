# Privacy and deployment boundaries

Atlas TV is a client. It needs a user-selected Jellyfin server and account; there is no Atlas-operated login or media relay. It connects to the configured server directly. Internet exposure, HTTPS, firewall rules and account permissions are the server operator's responsibility.

The public source contains no preconfigured server address, household library IDs, media listings, credentials, tokens, private SSH material or Tizen signing certificates. Runtime server URLs, accounts, tokens, preferences and navigation state stay in the TV's local storage/session storage. Anyone with debugging or filesystem access to the TV may be able to inspect them. Deleting or signing out of the app may change that local state.

Inherited optional features may contact third parties: GitHub for version/theme information, user-configured integrations and metadata/image services. The Atlas version checker points to this repository's releases. The optional server plugin still uses the original Moonfin API routes; protocol names and storage keys are not branding. The upstream theme store remains external. This is not an assertion that every inherited optional feature is offline.

Diagnostic reports can contain personal metadata and deployment details. Inspect and redact them before posting an issue. Do not publish local-storage snapshots, server logs, signed personal packages or certificates. Build outputs and common credential formats are ignored by Git, but always review staged files before publishing.
