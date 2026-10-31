#!/usr/bin/env node
/*
 * Installs the build CLIs into the git-ignored tools/ folder from the root
 * postinstall, so a plain "npm install" is still all you need.
 * See tools/package.json for why they don't live in devDependencies.
 */
'use strict';

const {execSync} = require('child_process');
const path = require('path');

const TOOLS_DIR = path.join(__dirname, '..', 'tools');
const wanted = require(path.join(TOOLS_DIR, 'package.json')).dependencies;

const upToDate = Object.entries(wanted).every(([name, version]) => {
	try {
		return require(path.join(TOOLS_DIR, 'node_modules', name, 'package.json')).version === version;
	} catch (e) {
		return false;
	}
});

if (upToDate) process.exit(0);

// When npm runs this from postinstall it exports npm_config_local_prefix
// pointing at the repo root, and a nested install that inherits it can disturb
// the tree the parent is still building, so hand the child a clean environment.
const env = Object.fromEntries(
	Object.entries(process.env).filter(([key]) => !key.startsWith('npm_'))
);

console.log('[moonfin] Installing build CLIs into tools/...');
try {
	execSync('npm install --no-audit --no-fund --loglevel=error', {
		cwd: TOOLS_DIR,
		env,
		stdio: 'inherit'
	});
} catch (e) {
	// A missing CLI should not block the root install, so warn and move on.
	console.warn('[moonfin] Could not install the build CLIs automatically.');
	console.warn('[moonfin] Builds need them, so run "npm install" inside tools/ before building.');
}
