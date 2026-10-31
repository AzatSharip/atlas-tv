import {parseServerMessage, parseServerMessages, hasAction, webLink, stripMarkdown} from './serverMessages';

// The one address that must never get through, spelled out once.
const SCRIPT_URL = 'javascript:alert(1)'; // eslint-disable-line no-script-url

describe('parseServerMessage', () => {
	test('PascalCase keys from Emby are read', () => {
		const message = parseServerMessage({
			Id: 'x', Title: 'Hello', Body: 'World', Color: 'red', Delivery: 'popup',
			ActionLabel: 'Open', ActionUrl: 'https://example.com', CreatedUtc: '2026-08-24T12:00:00Z'
		});

		expect(message.title).toBe('Hello');
		expect(message.color).toBe('red');
		expect(message.delivery).toBe('popup');
		expect(hasAction(message)).toBe(true);
		expect(message.createdUtc).toBe('2026-08-24T12:00:00Z');
	});

	test('unknown colour and delivery fall back to the quiet defaults', () => {
		const message = parseServerMessage({id: 'x', title: 'Hello', color: 'chartreuse', delivery: 'smoke-signal'});

		expect(message.color).toBe('white');
		expect(message.delivery).toBe('inbox');
	});

	test('a message with no id or no text is skipped', () => {
		expect(parseServerMessage({title: 'No id'})).toBeNull();
		expect(parseServerMessage({id: 'x', title: '  ', body: ''})).toBeNull();
	});

	test('an action needs both a label and a link to count', () => {
		const full = parseServerMessage({id: 'x', title: 'T', actionLabel: 'Open', actionUrl: 'https://example.com'});
		expect(hasAction(full)).toBe(true);

		const labelOnly = parseServerMessage({id: 'y', title: 'T', actionLabel: 'Open'});
		expect(hasAction(labelOnly)).toBe(false);
	});

	test('an action link has to be a web address', () => {
		const parse = (url) => parseServerMessage({id: 'x', title: 'T', actionLabel: 'Open', actionUrl: url});

		expect(hasAction(parse('https://example.com/a'))).toBe(true);
		expect(hasAction(parse('http://example.com'))).toBe(true);

		// Anything else would end up on the viewer's phone.
		[
			SCRIPT_URL,
			'file:///etc/passwd',
			'moonfin://server/item/1',
			'intent://x#Intent;scheme=http;end',
			'data:text/html,hi',
			'example.com',
			'ht tp://broken',
			':::'
		].forEach((url) => {
			expect(hasAction(parse(url))).toBe(false);
			expect(parse(url).actionUrl).toBeNull();
		});
	});

	test('a date that does not parse is left out', () => {
		expect(parseServerMessage({id: 'x', title: 'T', createdUtc: '2026-08-24T12:00:00Z'}).createdUtc).toBe('2026-08-24T12:00:00Z');
		expect(parseServerMessage({id: 'x', title: 'T', createdUtc: 'yesterday-ish'}).createdUtc).toBeNull();
	});
});

describe('parseServerMessages', () => {
	const a = {id: 'a', title: 'A'};
	const b = {id: 'b', title: 'B'};

	test('takes the list under either spelling of items or bare', () => {
		expect(parseServerMessages({items: [a, b]}).map((m) => m.id)).toEqual(['a', 'b']);
		expect(parseServerMessages({Items: [a]}).map((m) => m.id)).toEqual(['a']);
		expect(parseServerMessages([b]).map((m) => m.id)).toEqual(['b']);
	});

	test('keeps the order the server sent and drops what is not a message', () => {
		expect(parseServerMessages([{id: 'c', title: 'C'}, 'junk', null, {title: 'no id'}, a]).map((m) => m.id)).toEqual(['c', 'a']);
	});

	test('nothing usable comes back empty', () => {
		expect(parseServerMessages(null)).toEqual([]);
		expect(parseServerMessages('text')).toEqual([]);
		expect(parseServerMessages({})).toEqual([]);
	});
});

describe('webLink', () => {
	test('links inside the body are held to the same rule', () => {
		expect(webLink('https://a.test/x')).toBe('https://a.test/x');
		expect(webLink('  https://a.test/x  ')).toBe('https://a.test/x');
		expect(webLink('http://[::1]:8096/web')).toBe('http://[::1]:8096/web');
		expect(webLink(SCRIPT_URL)).toBeNull();
		expect(webLink('moonfin://x')).toBeNull();
		expect(webLink('http://[bad')).toBeNull();
		expect(webLink('https://')).toBeNull();
		expect(webLink('')).toBeNull();
		expect(webLink(null)).toBeNull();
	});
});

describe('stripMarkdown', () => {
	test('drops heading, quote and list markers', () => {
		expect(stripMarkdown('## Maintenance')).toBe('Maintenance');
		expect(stripMarkdown('> heads up')).toBe('heads up');
		expect(stripMarkdown('- first\n- second')).toBe('first\nsecond');
		expect(stripMarkdown('* starred')).toBe('starred');
	});

	test('drops emphasis and code marks but keeps the words', () => {
		expect(stripMarkdown('**bold** and *italic*')).toBe('bold and italic');
		expect(stripMarkdown('__strong__ and _thin_')).toBe('strong and thin');
		expect(stripMarkdown('use `curl` here')).toBe('use curl here');
	});

	test('keeps the link text and drops the address', () => {
		expect(stripMarkdown('see [the notes](https://example.com/a_b)')).toBe('see the notes');
	});

	test('collapses blank lines so the preview stays on few lines', () => {
		expect(stripMarkdown('one\n\n\ntwo')).toBe('one\ntwo');
	});

	test('leaves plain text alone', () => {
		expect(stripMarkdown('Server reboot at 2am, sorry for the noise.')).toBe('Server reboot at 2am, sorry for the noise.');
	});

	test('a hash inside a sentence is not a heading', () => {
		expect(stripMarkdown('issue #1234 is fixed')).toBe('issue #1234 is fixed');
	});
});
