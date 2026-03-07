import { describe, expect, it } from 'vitest';
import { htmlToTiptap } from '../htmlToTiptap';

describe('htmlToTiptap', () => {
    it('keeps safe HTML without warnings', () => {
        const result = htmlToTiptap({ html: '<p><strong>Safe</strong> content</p>' });

        expect(result.html).toContain('<p><strong>Safe</strong> content</p>');
        expect(result.warnings).toEqual([]);
    });

    it('removes unsafe tags and reports sanitized warning', () => {
        const result = htmlToTiptap({ html: '<p>Hello</p><script>alert(1)</script>' });

        expect(result.html).toContain('<p>Hello</p>');
        expect(result.html).not.toContain('<script');
        expect(result.warnings.some((warning) => warning.code === 'sanitized')).toBe(true);
    });

    it('reports css_ignored warning when CSS is provided', () => {
        const result = htmlToTiptap({
            html: '<p>Styled text</p>',
            css: '.prose p { color: red; }',
        });

        expect(result.html).toContain('<p>Styled text</p>');
        expect(result.warnings.some((warning) => warning.code === 'css_ignored')).toBe(true);
    });

    it('returns fallback empty paragraph when all content is removed', () => {
        const result = htmlToTiptap({ html: '<script>alert(1)</script>' });

        expect(result.html).toBe('<p></p>');
        expect(result.warnings.some((warning) => warning.code === 'sanitized')).toBe(true);
    });
});
