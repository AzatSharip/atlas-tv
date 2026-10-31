import {effectiveSeason, groupEpisodesBySeason, seasonLabel, seasonOptions} from './nouveauSeasons';

const episode = (season, index, Id = `${season}-${index}`) => ({
	Id, ParentIndexNumber: season, IndexNumber: index, Name: `S${season}E${index}`
});
const names = (items) => items.map((i) => i.Name);

describe('groupEpisodesBySeason', () => {
	it('splits a flat run into seasons, each in episode order', () => {
		const groups = groupEpisodesBySeason([
			episode(2, 1), episode(1, 2), episode(1, 1), episode(2, 2)
		]);
		expect([...groups.keys()]).toEqual([1, 2]);
		expect(names(groups.get(1))).toEqual(['S1E1', 'S1E2']);
		expect(names(groups.get(2))).toEqual(['S2E1', 'S2E2']);
	});

	// Season zero is where a server keeps specials, so it leads rather than being dropped.
	it('keeps specials as their own season, ahead of the rest', () => {
		const groups = groupEpisodesBySeason([episode(1, 1), episode(0, 1)]);
		expect([...groups.keys()]).toEqual([0, 1]);
	});

	it('files an episode with no season of its own with the specials', () => {
		const groups = groupEpisodesBySeason([{Id: 'x', Name: 'Loose', IndexNumber: 1}]);
		expect([...groups.keys()]).toEqual([0]);
	});

	it('has nothing to group when there are no episodes', () => {
		expect([...groupEpisodesBySeason().keys()]).toEqual([]);
	});
});

describe('seasonLabel', () => {
	it('names a season by its number, and season zero for what it holds', () => {
		expect(seasonLabel(3)).toBe('Season 3');
		expect(seasonLabel(0)).toBe('Specials');
	});
});

describe('seasonOptions', () => {
	it('offers one option per season, in order', () => {
		const options = seasonOptions(groupEpisodesBySeason([episode(2, 1), episode(1, 1)]));
		expect(options).toEqual([
			{id: '1', number: 1, label: 'Season 1'},
			{id: '2', number: 2, label: 'Season 2'}
		]);
	});

	it('takes the name the server gave a season over the numbered one', () => {
		const groups = groupEpisodesBySeason([episode(1, 1), episode(2, 1)]);
		const options = seasonOptions(groups, [
			{IndexNumber: 1, Name: 'Book One'},
			{IndexNumber: 2, Name: '   '}
		]);
		expect(options.map((o) => o.label)).toEqual(['Book One', 'Season 2']);
	});
});

describe('effectiveSeason', () => {
	it('keeps the season the viewer picked', () => {
		expect(effectiveSeason([1, 2, 3], 2)).toBe(2);
	});

	// The episodes arrive after the first paint, so a remembered season can name one that the run
	// being shown no longer has.
	it('falls back to the first when the picked one has gone', () => {
		expect(effectiveSeason([1, 2], 5)).toBe(1);
		expect(effectiveSeason([1, 2], undefined)).toBe(1);
		expect(effectiveSeason([], 1)).toBeUndefined();
	});

	it('opens on the season holding the episode the viewer is up to', () => {
		expect(effectiveSeason([1, 2, 3], undefined, 3)).toBe(3);
	});

	it('still prefers the picked season over the one up next', () => {
		expect(effectiveSeason([1, 2, 3], 1, 3)).toBe(1);
	});

	it('ignores an up next season the run doesn\'t have', () => {
		expect(effectiveSeason([1, 2], undefined, 9)).toBe(1);
	});
});
