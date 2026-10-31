/* global __dirname */

// $L reaches for ilib, which a plain unit test has no way to load. Every key is its own
// English source string, so handing the string straight back is faithful enough here.
jest.mock('@enact/i18n/$L', () => ({__esModule: true, default: (str) => str}));

import fs from 'fs';
import path from 'path';

import {getUiLanguageOptions} from './settingsOptions';

// The language picker, the ilib manifest, the enact locale list and the folders on disk
// all have to name the same set. Any one of them drifting leaves a language that is
// offered but never translated, or translated but never offered.

const RESOURCES = path.resolve(__dirname, '../../../resources');
const manifest = JSON.parse(fs.readFileSync(path.join(RESOURCES, 'ilibmanifest.json'), 'utf8'));
const appPkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../package.json'), 'utf8'));

// English is the base catalogue at the root of resources rather than a folder of its own.
const offered = getUiLanguageOptions().map((option) => option.value);
const translated = offered.filter((value) => value !== 'en-US');

describe('ui language options', () => {
	test('every offered language has a strings file', () => {
		const missing = translated.filter((value) => !fs.existsSync(path.join(RESOURCES, value, 'strings.json')));
		expect(missing).toEqual([]);
	});

	test('every strings file is offered in the picker', () => {
		const onDisk = fs.readdirSync(RESOURCES, {withFileTypes: true})
			.filter((entry) => entry.isDirectory() && fs.existsSync(path.join(RESOURCES, entry.name, 'strings.json')))
			.map((entry) => entry.name);
		expect(onDisk.sort()).toEqual([...translated].sort());
	});

	test('the ilib manifest and the enact locale list match the picker', () => {
		expect([...manifest.locales].sort()).toEqual([...offered].sort());
		expect([...appPkg.enact.locales].sort()).toEqual([...offered].sort());
		expect([...manifest.files].sort()).toEqual(
			['strings.json', ...translated.map((value) => `${value}/strings.json`)].sort()
		);
	});

	test('no language is listed twice', () => {
		expect(new Set(offered).size).toBe(offered.length);
	});

	test('each language is named in itself rather than translated', () => {
		const source = fs.readFileSync(path.join(__dirname, 'settingsOptions.js'), 'utf8');
		const list = source.slice(source.indexOf('export const getUiLanguageOptions'));
		expect(list.slice(0, list.indexOf('];'))).not.toMatch(/\$L\(/);
	});
});
