import {confirmOffline} from './connectionProbe';

const SERVER = 'http://jellyfin.local:8096';

describe('confirmOffline', () => {
	// The case this exists for: webOS calls itself offline because LG's own domains are
	// blocked, while the media server is right there answering.
	it('says the app is online when the server answers', async () => {
		const probe = jest.fn().mockResolvedValue({Version: '10.11.11'});
		await expect(confirmOffline({probe, serverUrl: SERVER})).resolves.toBe(false);
		expect(probe).toHaveBeenCalled();
	});

	it('says the app is offline when the server cant be reached', async () => {
		const probe = jest.fn().mockRejectedValue(new Error('network error'));
		await expect(confirmOffline({probe, serverUrl: SERVER})).resolves.toBe(true);
	});

	// Nothing is set up yet, so there is nothing to be cut off from and the setup screen
	// reports its own errors rather than a full screen block standing in front of it.
	it('stays out of the way when no server is set up', async () => {
		const probe = jest.fn();
		await expect(confirmOffline({probe, serverUrl: ''})).resolves.toBe(false);
		await expect(confirmOffline({probe, serverUrl: null})).resolves.toBe(false);
		expect(probe).not.toHaveBeenCalled();
	});
});
