import { describe, expect, it } from 'vitest';
import { sanitizeStitchHtml } from '../sanitizeStitchHtml';

describe('sanitizeStitchHtml', () => {
    it('returns empty result for non-string input', () => {
        expect(sanitizeStitchHtml(null)).toEqual({ html: '', wasModified: false });
        expect(sanitizeStitchHtml(undefined)).toEqual({ html: '', wasModified: false });
        expect(sanitizeStitchHtml(123)).toEqual({ html: '', wasModified: false });
    });

    it('removes unsafe tags and attributes', () => {
        const result = sanitizeStitchHtml(
            '<div style="color:red" onclick="alert(1)">Safe<script>alert(1)</script></div>',
        );

        expect(result.html).toContain('<div>Safe</div>');
        expect(result.html).not.toContain('<script');
        expect(result.html).not.toContain('style=');
        expect(result.html).not.toContain('onclick=');
        expect(result.wasModified).toBe(true);
    });

    it('keeps allowed attributes and safe protocols', () => {
        const result = sanitizeStitchHtml(
            '<a href="https://example.com" class="btn">Link</a><img src="data:image/png;base64,AAA" alt="x" />',
        );

        expect(result.html).toContain('href="https://example.com"');
        expect(result.html).toContain('class="btn"');
        expect(result.html).toContain('src="data:image/png;base64,AAA"');
        expect(result.wasModified).toBe(false);
    });

    it('strips javascript protocol from links', () => {
        const result = sanitizeStitchHtml('<a href="javascript:alert(1)">Bad</a>');

        expect(result.html).toContain('<a>Bad</a>');
        expect(result.html).not.toContain('javascript:');
        expect(result.wasModified).toBe(true);
    });
});
