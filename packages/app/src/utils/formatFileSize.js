// Size the way the details screen has always shown it: megabytes until the number would run to four
// figures, then gigabytes to two places.
//
// Seerr has its own formatter in utils/seerrStatus.js that rounds to one place and carries KB and
// bytes as well. That one is what the Seerr screens show, so it is left alone rather than merged
// into this.
export const formatFileSize = (bytes) => {
	if (!(bytes > 0)) return null;
	const mb = bytes / (1024 * 1024);
	return mb > 999 ? `${(mb / 1024).toFixed(2)} GB` : `${Math.round(mb)} MB`;
};
