import css from './ServerMessagesDialog.module.less';

// The formatted body of an opened message, drawn from the tree the reader
// hands back so nothing the admin typed reaches innerHTML.

const renderInlines = (nodes) => nodes.map((node, i) => {
	switch (node.type) {
		case 'strong': return <strong key={i}>{renderInlines(node.children)}</strong>;
		case 'em': return <em key={i}>{renderInlines(node.children)}</em>;
		case 'code': return <code key={i} className={css.code}>{node.text}</code>;
		case 'link': return <span key={i} className={css.link}>{renderInlines(node.children)}</span>;
		default: return node.text;
	}
});

const headingClass = (level) => {
	if (level <= 1) return css.h1;
	if (level === 2) return css.h2;
	return css.h3;
};

const renderBlock = (block, i) => {
	switch (block.type) {
		case 'heading':
			return <div key={i} className={headingClass(block.level)}>{renderInlines(block.children)}</div>;
		case 'list': {
			const items = block.items.map((item, j) => <li key={j}>{renderInlines(item)}</li>);
			return block.ordered
				? <ol key={i} className={css.mdList}>{items}</ol>
				: <ul key={i} className={css.mdList}>{items}</ul>;
		}
		case 'quote':
			return <blockquote key={i} className={css.quote}>{renderInlines(block.children)}</blockquote>;
		case 'code':
			return <pre key={i} className={css.codeBlock}>{block.text}</pre>;
		default:
			return <p key={i} className={css.paragraph}>{renderInlines(block.children)}</p>;
	}
};

const MessageMarkdown = ({blocks}) => (
	<div className={css.body}>{blocks.map(renderBlock)}</div>
);

export default MessageMarkdown;
