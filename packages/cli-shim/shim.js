'use strict';

const path = require('path');
const {spawnSync} = require('child_process');

// Forwards a command to the matching CLI in tools/, see tools/package.json.
module.exports = function (pkgName, binName) {
	const pkgDir = path.join(__dirname, '..', '..', 'tools', 'node_modules', pkgName);

	let pkg;
	try {
		pkg = require(path.join(pkgDir, 'package.json'));
	} catch (e) {
		console.error(`[moonfin] ${binName} is not installed (missing ${pkgName} in tools/).`);
		console.error('[moonfin] Run "npm install" at the repo root to set it up.');
		process.exit(1);
	}

	const result = spawnSync(process.execPath, [path.join(pkgDir, pkg.bin[binName]), ...process.argv.slice(2)], {
		stdio: 'inherit'
	});
	process.exit(result.status === null ? 1 : result.status);
};
