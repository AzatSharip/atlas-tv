import {
	PERSON_APPEARANCES, PERSON_CREW, PERSON_GUEST, PERSON_MOVIES, PERSON_MUSIC, PERSON_SERIES,
	buildPersonRails
} from './nouveauPersonRails';

const item = (Id) => ({Id, Name: Id});
const ids = (rails) => rails.map((rail) => rail.id);

describe('buildPersonRails', () => {
	it('gives a person nothing to show when every list is empty', () => {
		expect(buildPersonRails()).toEqual([]);
		expect(buildPersonRails({filmography: {movies: [], series: []}})).toEqual([]);
	});

	it('leaves out a group that has nothing in it', () => {
		const rails = buildPersonRails({filmography: {movies: [item('m1')], musicVideos: [item('v1')]}});
		expect(ids(rails)).toEqual([PERSON_MOVIES, PERSON_MUSIC]);
	});

	it('leads with the library lists and puts what only seerr knows after them', () => {
		const rails = buildPersonRails({
			filmography: {
				movies: [item('m1')],
				series: [item('s1')],
				guestAppearances: [item('g1')],
				musicVideos: [item('v1')]
			},
			crewCredits: [item('c1')],
			appearances: [item('a1')]
		});
		expect(ids(rails)).toEqual([
			PERSON_MOVIES, PERSON_SERIES, PERSON_GUEST, PERSON_MUSIC, PERSON_CREW, PERSON_APPEARANCES
		]);
	});

	it('carries the items it was handed', () => {
		const rails = buildPersonRails({filmography: {series: [item('s1'), item('s2')]}});
		expect(rails[0].items).toHaveLength(2);
		expect(rails[0].title).toBeTruthy();
	});
});
