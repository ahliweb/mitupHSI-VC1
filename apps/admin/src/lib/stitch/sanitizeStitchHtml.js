import DOMPurify from 'dompurify';
import {
    STITCH_ALLOWED_ATTR,
    STITCH_ALLOWED_TAGS,
    STITCH_ALLOWED_URI_REGEXP,
    STITCH_FORBID_ATTR,
    STITCH_FORBID_TAGS,
} from './constants';

const extractBodyHtml = (rawHtml) => {
    if (typeof window === 'undefined' || typeof window.DOMParser === 'undefined') {
        return rawHtml;
    }

    try {
        const doc = new window.DOMParser().parseFromString(rawHtml, 'text/html');
        return doc?.body?.innerHTML || rawHtml;
    } catch {
        return rawHtml;
    }
};

export const sanitizeStitchHtml = (inputHtml) => {
    if (!inputHtml || typeof inputHtml !== 'string') {
        return { html: '', wasModified: false };
    }

    const extractedHtml = extractBodyHtml(inputHtml).trim();
    const sanitized = DOMPurify.sanitize(extractedHtml, {
        ALLOWED_TAGS: STITCH_ALLOWED_TAGS,
        ALLOWED_ATTR: STITCH_ALLOWED_ATTR,
        FORBID_TAGS: STITCH_FORBID_TAGS,
        FORBID_ATTR: STITCH_FORBID_ATTR,
        ALLOW_DATA_ATTR: false,
        ALLOWED_URI_REGEXP: STITCH_ALLOWED_URI_REGEXP,
    });

    return {
        html: sanitized,
        wasModified: sanitized !== extractedHtml,
    };
};
