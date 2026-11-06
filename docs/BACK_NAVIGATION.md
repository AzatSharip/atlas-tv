# Back navigation on Tizen

Atlas 3.0.2 handles each physical Back press once. Holding the key cannot
navigate through several pages or trigger the television's native exit action.
Player teardown is single-flight: a slow stop request cannot cause a second
navigation, and completion after unmount cannot affect a new page or profile.
Tizen always asks for confirmation before exiting from the root, including when
older saved settings disabled that confirmation.

Back first dismisses any open player overlay or controls. Leaving the player
returns to its previous panel. Home-video navigation restores the folder stack
and remembers the selected item's ID and parent folder in memory. The library
loads further pages when needed to restore focus. Missing items use normal grid
focus, and profile changes clear the remembered identity.

Regression coverage includes repeated keydown/keyup, asynchronous teardown,
unmount cancellation, root exit protection, folder focus and profile reset.
See `backKeyGuard.test.js`, `usePlayerBack.test.js`,
`scripts/test-atlas-folders.cjs` and `scripts/test-atlas-folder-filter.cjs`.

The combined release passes the Tizen build and lint gates. Programmatic
checks on a Tizen television confirmed return from playback and root exit
confirmation. These checks do not assert that every physical remote model or
all visual details have been reviewed by the owner.
