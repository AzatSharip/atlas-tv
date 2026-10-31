# Atlas launcher artwork

The active launcher is `launcher-wide.svg`, exported to `launcher-wide.png` and
the Tizen primary/Oblong icon assets. Canvas: **1024 × 512**, exactly **2:1**.
It extends the existing Atlas path-based wordmark: slightly wider letter spacing,
blue/violet/cyan face gradient, restrained extrusion, rim light and soft glow.
No external fonts, bitmap texture, indexed palette or dithering are used.

The PNG was rendered from SVG at four times its target size, then downsampled
with Lanczos3 to a full-color, opaque RGB PNG. Keep the SVG as the editable master;
do not repeatedly resize an older raster icon. The light in-app/screensaver mark
and the 50%-opacity library-cover logos are separate assets.

`launcher-padded-source.png` and its prompt are the superseded generated design,
retained for provenance. They are not the current launcher.

Samsung's store artwork workflow is separate from a developer-installed WGT.
The packaged icon has a 2:1 aspect ratio; the final Smart Hub tile is controlled
by the TV firmware and must be verified on the device.
