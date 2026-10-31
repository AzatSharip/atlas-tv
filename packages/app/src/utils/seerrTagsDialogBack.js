// The app reads the back key on window before anything mounted later can, so the tags
// dialog is dismissed through the detail screen's back chain instead of listening for
// itself. It sits apart from the dialog so the request hook can reach it without pulling
// a component in behind it.

let closeOpenDialog = null;

export const registerSeerrTagsDialog = (close) => {
	closeOpenDialog = close;
};

export const unregisterSeerrTagsDialog = (close) => {
	if (closeOpenDialog === close) closeOpenDialog = null;
};

export const closeSeerrTagsDialog = () => {
	if (!closeOpenDialog) return false;
	closeOpenDialog();
	return true;
};
