import {chapterDisplayName, collectionSubtitle, extraSubtitle} from './nouveauLabels';

const MINUTE = 60 * 10000000;

describe('chapterDisplayName', () => {
	it('puts the start time after the name', () => {
		expect(chapterDisplayName('Opening Credits', 0)).toBe('Opening Credits - 0:00');
		expect(chapterDisplayName('The Chase', 2 * MINUTE)).toBe('The Chase - 2:00');
	});

	// Servers often name a chapter after the time it starts at, and printing that twice is the
	// thing this is here to stop.
	it('does not repeat a time the name already ends with', () => {
		expect(chapterDisplayName('Chapter 1 - 0:00', 0)).toBe('Chapter 1 - 0:00');
		expect(chapterDisplayName('The Chase - 2:00', 2 * MINUTE)).toBe('The Chase - 2:00');
	});

	it('matches a time however it was written', () => {
		expect(chapterDisplayName('Intro - 00:00', 0)).toBe('Intro - 0:00');
		expect(chapterDisplayName('Intro - 0:02:00', 2 * MINUTE)).toBe('Intro - 2:00');
	});

	it('keeps a name that only looks like a time', () => {
		expect(chapterDisplayName('Chapter 12', 0)).toBe('Chapter 12 - 0:00');
	});

	it('falls back to the time alone when there is no name', () => {
		expect(chapterDisplayName('', 2 * MINUTE)).toBe('2:00');
		expect(chapterDisplayName(null, 0)).toBe('0:00');
	});

	it('drops a piece the name repeats', () => {
		expect(chapterDisplayName('Intro - Intro', 0)).toBe('Intro - 0:00');
	});
});

describe('extraSubtitle', () => {
	it('names the year and the resolution together', () => {
		expect(extraSubtitle({
			ProductionYear: 2019,
			MediaStreams: [{Type: 'Video', Width: 1920, Height: 1080}]
		})).toBe('2019  •  1080p');
	});

	it('takes whichever one it was given', () => {
		expect(extraSubtitle({ProductionYear: 2019})).toBe('2019');
		expect(extraSubtitle({MediaStreams: [{Type: 'Video', Width: 1920, Height: 1080}]}))
			.toBe('1080p');
	});

	it('goes without when the server said neither', () => {
		expect(extraSubtitle({})).toBeNull();
		expect(extraSubtitle(null)).toBeNull();
	});
});

describe('collectionSubtitle', () => {
	it('names the type beside the year, so a show isn\'t mistaken for a film', () => {
		expect(collectionSubtitle({Type: 'Movie', ProductionYear: 2021})).toBe('Movie · 2021');
		expect(collectionSubtitle({Type: 'Series', ProductionYear: 2019})).toBe('TV Show · 2019');
	});

	it('gives whichever half it has', () => {
		expect(collectionSubtitle({Type: 'Movie'})).toBe('Movie');
		expect(collectionSubtitle({Type: 'Audio', ProductionYear: 2004})).toBe('2004');
	});

	it('goes without for an item the server said nothing about', () => {
		expect(collectionSubtitle({Type: 'Audio'})).toBeNull();
		expect(collectionSubtitle(null)).toBeNull();
	});
});
