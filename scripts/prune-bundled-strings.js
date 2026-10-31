/**
 * Drop the translation JSON that the bundle already carries.
 *
 * App.js pre-populates ilib.data from a lazy require.context, so the string
 * catalogue for the locale the app boots into arrives as a webpack chunk and
 * ilib never fetches resources/<locale>/strings.json over XHR. Shipping both
 * copies would put every language in the package twice, which is megabytes on
 * a TV.
 *
 * The base resources/strings.json stays: it's the root of ilib's merge chain
 * and it's only the source text, so it costs little and keeps the Loader from
 * 404ing on a device where the XHR path does run.
 *
 * Usage (from a build script):
 *   require('./prune-bundled-strings')(distDir);
 */

const fs = require('fs');
const path = require('path');

module.exports = function pruneBundledStrings (distDir) {
	const resDir = path.join(distDir, 'resources');
	if (!fs.existsSync(resDir)) {
		console.log('  No resources directory found — skipping string pruning');
		return;
	}

	let removed = 0;
	let count = 0;
	for (const entry of fs.readdirSync(resDir, {withFileTypes: true})) {
		if (!entry.isDirectory()) continue;
		const file = path.join(resDir, entry.name, 'strings.json');
		if (!fs.existsSync(file)) continue;
		removed += fs.statSync(file).size;
		fs.rmSync(path.join(resDir, entry.name), {recursive: true, force: true});
		count++;
	}

	// Leave the manifest describing only what is still on disk.
	const manifestPath = path.join(resDir, 'ilibmanifest.json');
	if (fs.existsSync(manifestPath)) {
		const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
		manifest.files = (manifest.files || []).filter((f) => f.indexOf('/') === -1);
		manifest.locales = ['en-US'];
		fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, '\t') + '\n', 'utf8');
	}

	console.log(`  Pruned bundled strings: removed ${count} locale files (${(removed / 1024 / 1024).toFixed(1)} MB)`);
};
