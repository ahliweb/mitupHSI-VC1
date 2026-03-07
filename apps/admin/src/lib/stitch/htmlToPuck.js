import { createImportWarnings } from './createImportWarnings';

const YOUTUBE_DOMAINS = ['youtube.com', 'www.youtube.com', 'youtu.be', 'www.youtu.be'];

const createBlockId = (prefix, index) => `${prefix}-${Date.now()}-${index}`;

const TEXT_NODE = 3;
const ELEMENT_NODE = 1;

const isTextNode = (node) => node?.nodeType === TEXT_NODE;
const isElementNode = (node) => node?.nodeType === ELEMENT_NODE;

const normalizeInlineText = (value) => (value || '').replace(/\s+/g, ' ').trim();

const escapeHtml = (value = '') => value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const createTextBlock = (content, index) => ({
    type: 'Text',
    props: {
        id: createBlockId('stitch-text', index),
        content,
        alignment: 'left',
    },
});

const createRawHtmlBlock = (content, index) => ({
    type: 'RawHTML',
    props: {
        id: createBlockId('stitch-rawhtml', index),
        html: content,
    },
});

const isSimpleTextAnchor = (node) => {
    if (!isElementNode(node) || node.tagName.toLowerCase() !== 'a') return false;
    const childElements = Array.from(node.children || []);
    return childElements.length === 0 && normalizeInlineText(node.textContent).length > 0;
};

const getTopLevelNodes = (sanitizedHtml) => {
    if (typeof window === 'undefined' || typeof window.DOMParser === 'undefined') {
        return [];
    }

    const doc = new window.DOMParser().parseFromString(sanitizedHtml, 'text/html');
    return Array.from(doc.body.childNodes || []).filter((node) => {
        if (isTextNode(node)) {
            return normalizeInlineText(node.textContent).length > 0;
        }
        return isElementNode(node);
    });
};

const isYouTubeUrl = (urlValue) => {
    if (!urlValue) return false;
    try {
        const parsed = new URL(urlValue, window.location.origin);
        return YOUTUBE_DOMAINS.some((domain) => parsed.hostname === domain);
    } catch {
        return false;
    }
};

const mapNodeToBlock = (node, index, allowRawHtmlFallback) => {
    if (isTextNode(node)) {
        const text = normalizeInlineText(node.textContent);
        if (!text) return { block: null, warnings: [] };
        return {
            block: createTextBlock(`<p>${escapeHtml(text)}</p>`, index),
            warnings: [],
        };
    }

    if (!isElementNode(node)) {
        return { block: null, warnings: [] };
    }

    const tag = node.tagName.toLowerCase();
    const outerHtml = node.outerHTML || '';

    if (tag === 'img') {
        const src = node.getAttribute('src') || '';
        if (!src) {
            return {
                block: null,
                warnings: [{ code: 'dropped_image', message: 'An image without src was dropped.' }],
            };
        }

        return {
            block: {
                type: 'Image',
                props: {
                    id: createBlockId('stitch-image', index),
                    src,
                    alt: node.getAttribute('alt') || '',
                    caption: node.getAttribute('title') || '',
                    width: 'full',
                    borderRadius: 'none',
                },
            },
            warnings: [],
        };
    }

    if (tag === 'hr') {
        return {
            block: {
                type: 'Divider',
                props: {
                    id: createBlockId('stitch-divider', index),
                    color: '#e2e8f0',
                    height: '1px',
                    width: '100%',
                    style: 'solid',
                },
            },
            warnings: [],
        };
    }

    if (tag === 'iframe') {
        const src = node.getAttribute('src') || '';
        if (isYouTubeUrl(src)) {
            return {
                block: {
                    type: 'YouTube',
                    props: {
                        id: createBlockId('stitch-youtube', index),
                        url: src,
                        aspectRatio: '16/9',
                        autoplay: false,
                    },
                },
                warnings: [],
            };
        }

        if (allowRawHtmlFallback) {
            return {
                block: createRawHtmlBlock(outerHtml, index),
                warnings: [{ code: 'raw_html_fallback', message: 'Embedded iframe was imported as RawHTML fallback.' }],
            };
        }

        return {
            block: null,
            warnings: [{ code: 'dropped_iframe', message: 'Unsupported iframe was dropped because RawHTML fallback is disabled.' }],
        };
    }

    if (isSimpleTextAnchor(node) || tag === 'button') {
        const text = normalizeInlineText(node.textContent) || 'Button';
        const link = node.getAttribute('href') || '#';

        return {
            block: {
                type: 'Button',
                props: {
                    id: createBlockId('stitch-button', index),
                    text,
                    link,
                    variant: 'primary',
                    size: 'medium',
                    alignment: 'left',
                },
            },
            warnings: [],
        };
    }

    if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'blockquote', 'pre', 'code', 'table', 'div', 'section', 'article', 'span', 'figure', 'figcaption'].includes(tag)) {
        return {
            block: createTextBlock(outerHtml, index),
            warnings: [],
        };
    }

    if (allowRawHtmlFallback) {
        return {
            block: createRawHtmlBlock(outerHtml, index),
            warnings: [{ code: 'raw_html_fallback', message: `Unsupported <${tag}> imported via RawHTML fallback.` }],
        };
    }

    return {
        block: null,
        warnings: [{ code: 'dropped_unsupported', message: `Unsupported <${tag}> was dropped.` }],
    };
};

export const htmlToPuck = ({ sanitizedHtml, allowRawHtmlFallback = true } = {}) => {
    const nodes = getTopLevelNodes(sanitizedHtml || '');
    const blocks = [];
    const warnings = [];

    nodes.forEach((node, index) => {
        const { block, warnings: nodeWarnings } = mapNodeToBlock(node, index, allowRawHtmlFallback);
        if (block) {
            blocks.push(block);
        }
        if (nodeWarnings?.length) {
            warnings.push(...nodeWarnings);
        }
    });

    if (blocks.length === 0 && sanitizedHtml?.trim() && allowRawHtmlFallback) {
        blocks.push(createRawHtmlBlock(sanitizedHtml, 0));
        warnings.push({
            code: 'raw_html_fallback',
            message: 'Content was imported as a single RawHTML fallback block.',
        });
    }

    return {
        data: {
            content: blocks,
            root: { props: {} },
        },
        warnings: createImportWarnings(warnings),
    };
};
