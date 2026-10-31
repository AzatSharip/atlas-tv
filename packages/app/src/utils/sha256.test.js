import {sha256} from './sha256';

describe('sha256', () => {
	// The published vectors, so a rewrite of the inner loop has something to fail against.
	test('matches the published vectors', () => {
		expect(sha256('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
		expect(sha256('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
		expect(sha256('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq'))
			.toBe('248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1');
	});

	test('hashes a PIN the same way every time, and each one differently', () => {
		expect(sha256('1234')).toBe(sha256('1234'));
		expect(sha256('1234')).not.toBe(sha256('4321'));
		expect(sha256('0000')).toHaveLength(64);
	});

	// A message long enough to need a second block, which is where a padding mistake shows up.
	test('spans more than one block', () => {
		expect(sha256('a'.repeat(1000)))
			.toBe('41edece42d63e8d9bf515a9ba6932e1c20cbc9f5a5d134645adb5db1b9737ea3');
	});

	test('reads a string as UTF-8 rather than as code units', () => {
		expect(sha256('é')).toBe(sha256('é'));
		expect(sha256('é')).toHaveLength(64);
	});
});
