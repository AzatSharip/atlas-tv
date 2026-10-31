// Store/preview artwork is kept in source, but unreferenced duplicates do not
// belong on storage-constrained TVs. Never remove the primary icon or SVG.
const fs = require('fs');
const path = require('path');
module.exports = function pruneArtwork(dist) {
	let text = '';
	function walk(dir) {
		for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
			const file = path.join(dir, entry.name);
			if (entry.isDirectory()) walk(file);
			else if (/\.(js|html|css|xml|json)$/.test(entry.name)) text += fs.readFileSync(file, 'utf8');
		}
	}
	walk(dist);
	let bytes = 0;
	for (const name of ['icon-large.png', 'icon-small.png', 'icon-oblong.png', 'splash.png']) {
		const file = path.join(dist, name);
		if (!text.includes(name) && fs.existsSync(file)) {
			bytes += fs.statSync(file).size;
			fs.unlinkSync(file);
		}
	}
	if (!fs.existsSync(path.join(dist, 'resources', 'atlas-wordmark.svg'))) throw new Error('Atlas SVG missing');
	if (!fs.existsSync(path.join(dist, 'icon.png'))) throw new Error('Primary icon missing');
	console.log(`Pruned ${bytes} bytes of unreferenced store artwork`);
};
