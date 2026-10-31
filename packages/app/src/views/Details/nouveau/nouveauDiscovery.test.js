import {PROTECTED_COUNT, buildDiscoveryRails, identityKeys, sharesIdentity} from './nouveauDiscovery';

const libraryItem = (Id, Name, over = {}) => ({Id, Name, Type: 'Movie', ...over});
const seerrCard = (tmdbId, Name, over = {}) => ({
	Id: `seerr-movie-${tmdbId}`,
	Name,
	Type: 'Movie',
	_seerr: true,
	_seerrRaw: {mediaId: tmdbId, mediaType: 'movie'},
	...over
});
const names = (items) => items.map((i) => i.Name);
const library = (count, prefix = 'lib') =>
	Array.from({length: count}, (_, i) => libraryItem(`${prefix}-${i}`, `${prefix} ${i}`));

describe('identityKeys', () => {
	it('recognises the same title from either source by its tmdb id', () => {
		const fromLibrary = libraryItem('a', 'The Thing', {ProviderIds: {Tmdb: '1234'}});
		const fromSeerr = seerrCard(1234, 'Something Else Entirely');
		expect(sharesIdentity(identityKeys(fromLibrary), identityKeys(fromSeerr))).toBe(true);
	});

	// Plenty of library items carry no provider ids at all, so the name and year have to stand in.
	it('falls back to the name and year', () => {
		const a = libraryItem('a', 'The  Thing ', {ProductionYear: 1982});
		const b = libraryItem('b', 'the thing', {ProductionYear: 1982});
		expect(sharesIdentity(identityKeys(a), identityKeys(b))).toBe(true);
	});

	it('keeps a remake apart from its original', () => {
		const a = libraryItem('a', 'The Thing', {ProductionYear: 1982});
		const b = libraryItem('b', 'The Thing', {ProductionYear: 2011});
		expect(sharesIdentity(identityKeys(a), identityKeys(b))).toBe(false);
	});

	it('does not confuse a film with a series of the same name', () => {
		const film = libraryItem('a', 'Fargo', {ProductionYear: 1996});
		const show = libraryItem('b', 'Fargo', {Type: 'Series', ProductionYear: 1996});
		expect(sharesIdentity(identityKeys(film), identityKeys(show))).toBe(false);
	});
});

describe('buildDiscoveryRails', () => {
	it('gives the library rail everything when seerr has nothing to say', () => {
		const {related, recommendations} = buildDiscoveryRails({
			item: libraryItem('me', 'Me'),
			similar: library(9)
		});
		expect(related).toHaveLength(9);
		expect(recommendations).toEqual([]);
	});

	it('never shows the title being looked at', () => {
		const me = libraryItem('me', 'Me', {ProviderIds: {Tmdb: '99'}});
		const {related} = buildDiscoveryRails({
			item: me,
			similar: [libraryItem('other', 'Other'), libraryItem('dupe', 'Me', {ProviderIds: {Tmdb: '99'}})],
			hasSeerr: true
		});
		expect(names(related)).toEqual(['Other']);
	});

	// The head of the library list is what the rail leads with, so a recommendation repeating one
	// of those titles gives way rather than pushing it out.
	it('keeps the head of the library list out of the recommendations', () => {
		const head = library(PROTECTED_COUNT);
		const {recommendations} = buildDiscoveryRails({
			item: libraryItem('me', 'Me'),
			similar: head,
			seerrRecommendations: [seerrCard(1, 'lib 0'), seerrCard(2, 'Fresh')],
			hasSeerr: true
		});
		expect(names(recommendations)).toEqual(['Fresh']);
	});

	it('drops a library overflow title that the recommendations already carry', () => {
		const similar = [...library(PROTECTED_COUNT), libraryItem('tail', 'Overflow')];
		const {related, recommendations} = buildDiscoveryRails({
			item: libraryItem('me', 'Me'),
			similar,
			seerrRecommendations: [seerrCard(7, 'Overflow')],
			hasSeerr: true
		});
		expect(names(recommendations)).toEqual(['Overflow']);
		expect(names(related)).not.toContain('Overflow');
		expect(related).toHaveLength(PROTECTED_COUNT);
	});

	it('tops the library rail up with seerr, without repeating either rail', () => {
		const {related, recommendations} = buildDiscoveryRails({
			item: libraryItem('me', 'Me'),
			similar: [libraryItem('a', 'Already Here')],
			seerrSimilar: [seerrCard(1, 'Already Here'), seerrCard(2, 'Brand New'), seerrCard(3, 'In Recs')],
			seerrRecommendations: [seerrCard(3, 'In Recs')],
			hasSeerr: true
		});
		expect(names(related)).toEqual(['Already Here', 'Brand New']);
		expect(names(recommendations)).toEqual(['In Recs']);
	});

	it('copes with being handed nothing', () => {
		expect(buildDiscoveryRails()).toEqual({related: [], recommendations: []});
	});
});
