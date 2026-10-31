import {selectPreferredAudioStream, isCommentaryAudioStream, isAudioDescriptionAudioStream} from './audioTrackSelection';

const track = (index, language, extra) => ({index, language, channels: 2, ...extra});

describe('selectPreferredAudioStream', () => {
	test('takes the preferred language over a louder track in another one', () => {
		const list = [track(1, 'fre', {channels: 6, isDefault: true}), track(2, 'ger')];
		expect(selectPreferredAudioStream(list, {audioLanguage: 'deu'})).toBe(list[1]);
	});

	test('matches German however the file spells it', () => {
		for (const tag of ['de', 'deu', 'ger', 'de-DE']) {
			const list = [track(1, 'fra', {channels: 6}), track(2, tag)];
			expect(selectPreferredAudioStream(list, {audioLanguage: 'deu'})).toBe(list[1]);
		}
	});

	test('falls to the second language, then English, then the best of the rest', () => {
		const ger = track(2, 'ger');
		const eng = track(3, 'eng');
		const fre = track(4, 'fre', {channels: 6});
		expect(selectPreferredAudioStream([fre, ger, eng], {audioLanguage: 'jpn', fallbackAudioLanguage: 'deu'})).toBe(ger);
		expect(selectPreferredAudioStream([fre, eng], {audioLanguage: 'jpn', fallbackAudioLanguage: 'kor'})).toBe(eng);
		expect(selectPreferredAudioStream([track(1, 'ita'), fre], {audioLanguage: 'jpn'})).toBe(fre);
	});

	test('with no preference at all the loudest track wins, which is the old complaint', () => {
		const list = [track(1, 'fre', {channels: 6}), track(2, 'ger')];
		expect(selectPreferredAudioStream(list, {})).toBe(list[0]);
	});

	test('surround beats stereo inside the chosen language', () => {
		const list = [track(1, 'ger', {channels: 2}), track(2, 'ger', {channels: 6})];
		expect(selectPreferredAudioStream(list, {audioLanguage: 'deu'})).toBe(list[1]);
	});

	test('commentary is skipped unless it is all there is', () => {
		const commentary = track(1, 'eng', {displayTitle: 'English Director Commentary', channels: 6});
		const plain = track(2, 'eng');
		expect(selectPreferredAudioStream([commentary, plain], {audioLanguage: 'eng'})).toBe(plain);
		expect(selectPreferredAudioStream([commentary], {audioLanguage: 'eng'})).toBe(commentary);
	});

	test('audio description is skipped unless it is asked for', () => {
		const described = track(1, 'eng', {isAudioDescription: true, channels: 6});
		const plain = track(2, 'eng');
		expect(selectPreferredAudioStream([described, plain], {audioLanguage: 'eng'})).toBe(plain);
		expect(selectPreferredAudioStream([described, plain], {audioLanguage: 'eng', preferAudioDescription: true})).toBe(described);
	});

	test('the default track shortcut wins over the language match', () => {
		const list = [track(1, 'fre', {isDefault: true}), track(2, 'ger')];
		expect(selectPreferredAudioStream(list, {audioLanguage: 'deu', preferDefaultAudioTrack: true})).toBe(list[0]);
	});

	test('the default flag only breaks a tie when default tracks are not preferred', () => {
		const list = [track(1, 'ger', {channels: 2, isDefault: true}), track(2, 'ger', {channels: 6})];
		expect(selectPreferredAudioStream(list, {audioLanguage: 'deu'})).toBe(list[1]);
	});

	test('an explicit pick wins over everything', () => {
		const list = [track(1, 'ger'), track(2, 'fre')];
		expect(selectPreferredAudioStream(list, {audioLanguage: 'deu', explicitAudioIndex: 2})).toBe(list[1]);
	});

	test('an explicit pick that is gone falls back to the language match', () => {
		const list = [track(1, 'ger'), track(2, 'fre')];
		expect(selectPreferredAudioStream(list, {audioLanguage: 'deu', explicitAudioIndex: 99})).toBe(list[0]);
	});

	test('the last hand picked track is kept inside its language, by index then by name', () => {
		const list = [track(1, 'ger', {channels: 6}), track(2, 'ger', {title: 'Kommentar'})];
		expect(selectPreferredAudioStream(list, {audioLanguage: 'deu', lastExplicitAudioIndex: 2})).toBe(list[1]);
		expect(selectPreferredAudioStream(list, {audioLanguage: 'deu', lastExplicitAudioTitle: 'Kommentar'})).toBe(list[1]);
	});

	test('nothing to choose from has no answer', () => {
		expect(selectPreferredAudioStream([], {})).toBeNull();
		expect(selectPreferredAudioStream(null, {})).toBeNull();
	});
});

describe('track labelling', () => {
	test('commentary is read from any of the three title fields and the flag', () => {
		expect(isCommentaryAudioStream({displayTitle: 'Commentary'})).toBe(true);
		expect(isCommentaryAudioStream({title: 'Director Commentary'})).toBe(true);
		expect(isCommentaryAudioStream({name: 'Commentaries'})).toBe(true);
		expect(isCommentaryAudioStream({isCommentary: true})).toBe(true);
		expect(isCommentaryAudioStream({displayTitle: 'English 5.1'})).toBe(false);
	});

	test('audio description is read the same way', () => {
		expect(isAudioDescriptionAudioStream({title: 'Audio Description'})).toBe(true);
		expect(isAudioDescriptionAudioStream({isAudioDescription: true})).toBe(true);
		expect(isAudioDescriptionAudioStream({displayTitle: 'German'})).toBe(false);
	});
});
