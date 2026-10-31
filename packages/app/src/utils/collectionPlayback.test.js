import {collectionQueue, collectionPlayTarget} from './collectionPlayback';

const movie = (id, userData) => ({Id: id, Type: 'Movie', UserData: userData});

describe('collectionQueue', () => {
	it('keeps the items the player can be handed', () => {
		const items = [movie('a'), {Id: 'b', Type: 'Video'}, {Id: 'c', Type: 'Episode'}];
		expect(collectionQueue(items).map((e) => e.Id)).toEqual(['a', 'b', 'c']);
	});

	// A series opens its own screen rather than playing, so leaving it in would stop the
	// run dead when the queue reached it.
	it('drops what cant be played straight away', () => {
		const items = [movie('a'), {Id: 's', Type: 'Series'}, {Id: 'n', Type: 'BoxSet'}, movie('b')];
		expect(collectionQueue(items).map((e) => e.Id)).toEqual(['a', 'b']);
	});

	it('drops entries with no id and survives nothing at all', () => {
		expect(collectionQueue([{Type: 'Movie'}])).toEqual([]);
		expect(collectionQueue(null)).toEqual([]);
		expect(collectionQueue(undefined)).toEqual([]);
	});
});

describe('collectionPlayTarget', () => {
	it('carries on from the one left part way through', () => {
		const queue = [
			movie('a', {Played: true}),
			movie('b', {PlaybackPositionTicks: 90000000}),
			movie('c')
		];
		expect(collectionPlayTarget(queue).Id).toBe('b');
	});

	it('starts on the first unwatched when none was left part way', () => {
		const queue = [movie('a', {Played: true}), movie('b', {Played: true}), movie('c')];
		expect(collectionPlayTarget(queue).Id).toBe('c');
	});

	it('starts again from the top once the whole collection is watched', () => {
		const queue = [movie('a', {Played: true}), movie('b', {Played: true})];
		expect(collectionPlayTarget(queue).Id).toBe('a');
	});

	it('starts at the beginning of an untouched collection', () => {
		const queue = [movie('a'), movie('b')];
		expect(collectionPlayTarget(queue).Id).toBe('a');
	});

	it('gives nothing for an empty queue', () => {
		expect(collectionPlayTarget([])).toBeNull();
	});
});
