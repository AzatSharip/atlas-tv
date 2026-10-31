import {useEffect, useRef} from 'react';

import {setPlayerControls} from '../../services/remoteControl';

// Hands the running player to another client's remote control and takes it back when the player
// closes. The controls sit in a ref, so a command always reaches the ones from the latest render.
const useRemotePlayerControls = (controls) => {
	const ref = useRef(controls);
	ref.current = controls;
	useEffect(() => setPlayerControls(ref), []);
};

export default useRemotePlayerControls;
