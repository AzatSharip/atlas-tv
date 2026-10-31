import {chapterMarkerPositions} from './chapterMarkers';

const chapters = (startsMs) => startsMs.map((ms) => ({name: 'Chapter', startPositionTicks: ms * 10000}));

test('keeps the starts that fall inside the runtime, in order', () => {
	expect(chapterMarkerPositions(chapters([90000, 30000, 60000]), 120000)).toEqual([30000, 60000, 90000]);
});

test('drops a start at zero, at the runtime, or past it', () => {
	expect(chapterMarkerPositions(chapters([0, 30000, 120000, 130000]), 120000)).toEqual([30000]);
});

test('collapses duplicate starts', () => {
	expect(chapterMarkerPositions(chapters([30000, 30000, 60000]), 120000)).toEqual([30000, 60000]);
});

test('is empty without a runtime to place marks against', () => {
	expect(chapterMarkerPositions(chapters([30000]), 0)).toEqual([]);
	expect(chapterMarkerPositions(chapters([30000]), -1)).toEqual([]);
});

test('is empty when the item has no chapters', () => {
	expect(chapterMarkerPositions([], 120000)).toEqual([]);
});

test('skips an entry with no usable start', () => {
	expect(chapterMarkerPositions([
		{name: 'Chapter'},
		{name: 'Chapter', startPositionTicks: 'nope'},
		{name: 'Chapter', startPositionTicks: 30000 * 10000}
	], 120000)).toEqual([30000]);
});
