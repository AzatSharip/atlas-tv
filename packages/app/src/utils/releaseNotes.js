// Release notes are written on GitHub and land in the update panel through
// innerHTML, so everything is escaped first and only the shapes below are put
// back as markup. Anything else, including any HTML the notes carry, is shown
// as the text it was written as.

const escapeHtml = (text) => text
	.replace(/&/g, '&amp;')
	.replace(/</g, '&lt;')
	.replace(/>/g, '&gt;');

// Images are decorative here, and a badge wrapped in a link leaves half the
// markup behind if only the link rule runs, so images go first.
const stripLinks = (text) => text
	.replace(/!\[[^\]]*\]\([^)]*\)/g, '')
	.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');

const inlineMarkdown = (text) => {
	const spans = [];
	// Code is set aside before the emphasis rules run, so a star inside a code
	// span stays a star. The marker is a character notes never carry, so a
	// number they wrote themselves cant be taken for one.
	const marked = escapeHtml(stripLinks(text)).replace(/`([^`]+)`/g, (match, body) => {
		spans.push(body);
		return `\u0000${spans.length - 1}\u0000`;
	});

	return marked
		.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
		.replace(/__([^_]+)__/g, '<strong>$1</strong>')
		.replace(/\*([^*]+)\*/g, '<em>$1</em>')
		// Underscores only pair around a whole word, so file_name_here is left be.
		.replace(/(^|\s)_([^_\s][^_]*)_(?=$|[\s.,!?;:])/g, '$1<em>$2</em>')
		.replace(/\u0000(\d+)\u0000/g, (match, at) => `<code>${spans[at]}</code>`)
		.trim();
};

export const renderReleaseNotes = (markdown) => {
	if (!markdown) return '';

	const lines = String(markdown).replace(/\r\n?/g, '\n').split('\n');
	const html = [];
	let listTag = null;
	let paragraph = [];
	let fenced = null;

	const closeList = () => {
		if (listTag) {
			html.push(`</${listTag}>`);
			listTag = null;
		}
	};

	const closeParagraph = () => {
		if (paragraph.length) {
			html.push(`<p>${paragraph.join('<br/>')}</p>`);
			paragraph = [];
		}
	};

	const openList = (tag) => {
		if (listTag !== tag) {
			closeList();
			html.push(`<${tag}>`);
			listTag = tag;
		}
	};

	const closeFence = () => {
		if (fenced && fenced.length) html.push(`<pre>${fenced.join('\n')}</pre>`);
		fenced = null;
	};

	for (const line of lines) {
		if (fenced) {
			if (/^\s*```/.test(line)) closeFence();
			else fenced.push(escapeHtml(line));
			continue;
		}

		if (/^\s*```/.test(line)) {
			closeParagraph();
			closeList();
			fenced = [];
			continue;
		}

		const heading = /^(#{1,3}) +(.+)$/.exec(line);
		if (heading) {
			closeParagraph();
			closeList();
			const level = heading[1].length;
			const headingText = inlineMarkdown(heading[2]);
			if (headingText) html.push(`<h${level}>${headingText}</h${level}>`);
			continue;
		}

		const bullet = /^ *[-*] +(.+)$/.exec(line);
		if (bullet) {
			closeParagraph();
			openList('ul');
			html.push(`<li>${inlineMarkdown(bullet[1])}</li>`);
			continue;
		}

		const numbered = /^ *\d+\. +(.+)$/.exec(line);
		if (numbered) {
			closeParagraph();
			openList('ol');
			html.push(`<li>${inlineMarkdown(numbered[1])}</li>`);
			continue;
		}

		if (!line.trim()) {
			closeParagraph();
			closeList();
			continue;
		}

		closeList();
		// A line that was only a badge has nothing left once the image is gone.
		const rendered = inlineMarkdown(line);
		if (rendered) paragraph.push(rendered);
	}

	// A fence the notes never closed still has to render.
	closeFence();
	closeParagraph();
	closeList();

	return html.join('');
};
