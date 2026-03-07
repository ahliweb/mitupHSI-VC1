import { DEFAULT_STITCH_MAX_INPUT_KB } from './constants';
import { createImportWarnings } from './createImportWarnings';
import { htmlToPuck } from './htmlToPuck';
import { htmlToTiptap } from './htmlToTiptap';
import { sanitizeStitchHtml } from './sanitizeStitchHtml';

const getInputBytes = (value) => {
    if (typeof Blob !== 'undefined') {
        return new Blob([value]).size;
    }

    if (typeof TextEncoder !== 'undefined') {
        return new TextEncoder().encode(value).length;
    }

    return value.length;
};

export const validateInput = ({ html, maxInputKb = DEFAULT_STITCH_MAX_INPUT_KB } = {}) => {
    if (!html || !html.trim()) {
        throw new Error('Stitch HTML is required.');
    }

    const resolvedMaxKb = Number(maxInputKb) || DEFAULT_STITCH_MAX_INPUT_KB;
    const bytes = getInputBytes(html);

    if (bytes > resolvedMaxKb * 1024) {
        throw new Error(`Import exceeds tenant limit of ${resolvedMaxKb}KB.`);
    }

    return {
        bytes,
        maxInputKb: resolvedMaxKb,
    };
};

export const importToTiptap = ({ html, css, config = {} } = {}) => {
    validateInput({ html, maxInputKb: config?.max_input_kb || DEFAULT_STITCH_MAX_INPUT_KB });
    return htmlToTiptap({ html, css });
};

export const importToPuck = ({ html, css, config = {} } = {}) => {
    validateInput({ html, maxInputKb: config?.max_input_kb || DEFAULT_STITCH_MAX_INPUT_KB });

    const { html: sanitizedHtml, wasModified } = sanitizeStitchHtml(html || '');
    const importMode = config?.mode || 'html';

    if (importMode === 'html') {
        const useRawHtmlFallback = config?.allow_raw_html_fallback !== false;
        const block = useRawHtmlFallback
            ? {
                type: 'RawHTML',
                props: {
                    id: `stitch-rawhtml-${Date.now()}`,
                    html: sanitizedHtml,
                },
            }
            : {
                type: 'Text',
                props: {
                    id: `stitch-text-${Date.now()}`,
                    content: sanitizedHtml,
                    alignment: 'left',
                },
            };

        return {
            data: {
                content: sanitizedHtml.trim() ? [block] : [],
                root: { props: {} },
            },
            warnings: createImportWarnings([
                wasModified && {
                    code: 'sanitized',
                    message: 'Unsafe or unsupported HTML attributes were removed during import.',
                },
                css?.trim() && {
                    code: 'css_ignored',
                    message: 'Custom CSS is not imported in this version.',
                },
                {
                    code: 'html_mode',
                    message: useRawHtmlFallback
                        ? 'Imported as a single RawHTML block due to HTML mode.'
                        : 'Imported as a single Text block due to HTML mode with RawHTML fallback disabled.',
                },
            ]),
        };
    }

    const puckResult = htmlToPuck({
        sanitizedHtml,
        allowRawHtmlFallback: config?.allow_raw_html_fallback !== false,
    });

    const warnings = createImportWarnings([
        wasModified && {
            code: 'sanitized',
            message: 'Unsafe or unsupported HTML attributes were removed during import.',
        },
        css?.trim() && {
            code: 'css_ignored',
            message: 'Custom CSS is not imported in this version.',
        },
        ...(puckResult.warnings || []),
    ]);

    return {
        data: puckResult.data,
        warnings,
    };
};

export { DEFAULT_STITCH_MAX_INPUT_KB };
