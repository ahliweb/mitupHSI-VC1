import { createImportWarnings } from './createImportWarnings';
import { sanitizeStitchHtml } from './sanitizeStitchHtml';

export const htmlToTiptap = ({ html, css } = {}) => {
    const { html: sanitizedHtml, wasModified } = sanitizeStitchHtml(html || '');

    const warnings = createImportWarnings([
        wasModified && {
            code: 'sanitized',
            message: 'Unsafe or unsupported HTML attributes were removed during import.',
        },
        css?.trim() && {
            code: 'css_ignored',
            message: 'Custom CSS is not imported in this version.',
        },
    ]);

    return {
        html: sanitizedHtml || '<p></p>',
        warnings,
    };
};
