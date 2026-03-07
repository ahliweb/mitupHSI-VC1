import { describe, expect, it } from 'vitest';
import { htmlToPuck } from '../htmlToPuck';

describe('htmlToPuck', () => {
    it('maps image elements to Image blocks', () => {
        const result = htmlToPuck({
            sanitizedHtml: '<img src="https://cdn.example.com/image.jpg" alt="Hero" />',
            allowRawHtmlFallback: true,
        });

        expect(result.data.content).toHaveLength(1);
        expect(result.data.content[0].type).toBe('Image');
        expect(result.data.content[0].props.src).toBe('https://cdn.example.com/image.jpg');
        expect(result.data.content[0].props.alt).toBe('Hero');
        expect(result.warnings).toEqual([]);
    });

    it('maps supported youtube iframes to YouTube blocks', () => {
        const result = htmlToPuck({
            sanitizedHtml: '<iframe src="https://www.youtube.com/watch?v=abc123"></iframe>',
            allowRawHtmlFallback: true,
        });

        expect(result.data.content).toHaveLength(1);
        expect(result.data.content[0].type).toBe('YouTube');
        expect(result.data.content[0].props.url).toContain('youtube.com/watch?v=abc123');
    });

    it('uses RawHTML fallback for unsupported elements when enabled', () => {
        const result = htmlToPuck({
            sanitizedHtml: '<svg><circle cx="5" cy="5" r="5"></circle></svg>',
            allowRawHtmlFallback: true,
        });

        expect(result.data.content).toHaveLength(1);
        expect(result.data.content[0].type).toBe('RawHTML');
        expect(result.warnings.some((warning) => warning.code === 'raw_html_fallback')).toBe(true);
    });

    it('drops unsupported elements when fallback is disabled', () => {
        const result = htmlToPuck({
            sanitizedHtml: '<svg><circle cx="5" cy="5" r="5"></circle></svg>',
            allowRawHtmlFallback: false,
        });

        expect(result.data.content).toHaveLength(0);
        expect(result.warnings.some((warning) => warning.code === 'dropped_unsupported')).toBe(true);
    });
});
