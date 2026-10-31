import {nouveauCardImageUrl} from './nouveauCardImage';

const SERVER = 'https://tv.example';

describe('nouveauCardImageUrl', () => {
	// Every episode of a season shares one parent backdrop, so reaching for that first leaves the
	// whole rail looking identical.
	it('takes the item\'s own still ahead of anything it inherits', () => {
		const episode = {
			Id: 'e1', Type: 'Episode',
			ImageTags: {Primary: 'still'},
			ParentBackdropItemId: 's1', ParentBackdropImageTags: ['series']
		};
		expect(nouveauCardImageUrl(SERVER, episode)).toBe(`${SERVER}/Items/e1/Images/Primary?maxHeight=360&quality=90&tag=still`);
	});

	it('falls back to the wider search for an item with no still of its own', () => {
		const episode = {Id: 'e2', Type: 'Episode', ParentBackdropItemId: 's1', ParentBackdropImageTags: ['series']};
		expect(nouveauCardImageUrl(SERVER, episode)).toBe(`${SERVER}/Items/s1/Images/Backdrop?maxWidth=640&quality=90&tag=series`);
	});

	it('ends on the page backdrop when the item has nothing at all', () => {
		expect(nouveauCardImageUrl(SERVER, {Id: 'e3', Type: 'Episode'}, {fallbackUrl: 'page'})).toBe('page');
		expect(nouveauCardImageUrl(SERVER, null, {fallbackUrl: 'page'})).toBe('page');
	});

	it('keeps the TMDB art a Seerr entry carries rather than asking the server', () => {
		const entry = {Id: 'tmdb:1', _seerr: true, _externalPosterUrl: 'https://image.tmdb.org/p.jpg'};
		expect(nouveauCardImageUrl(SERVER, entry)).toBe('https://image.tmdb.org/p.jpg');
	});
});
