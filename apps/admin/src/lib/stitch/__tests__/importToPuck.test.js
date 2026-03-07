import { describe, expect, it } from 'vitest';
import { importToPuck } from '../index';

describe('importToPuck', () => {
    it('uses single RawHTML block in html mode with fallback enabled', () => {
        const result = importToPuck({
            html: '<p>Hello from Stitch</p><script>alert(1)</script>',
            config: {
                mode: 'html',
                max_input_kb: 256,
                allow_raw_html_fallback: true,
            },
        });

        expect(result.data.content).toHaveLength(1);
        expect(result.data.content[0].type).toBe('RawHTML');
        expect(result.data.content[0].props.html).toContain('<p>Hello from Stitch</p>');
        expect(result.data.content[0].props.html).not.toContain('<script');
        expect(result.warnings.some((warning) => warning.code === 'html_mode')).toBe(true);
    });

    it('uses single Text block in html mode when RawHTML fallback is disabled', () => {
        const result = importToPuck({
            html: '<h2>Heading</h2><p>Body</p>',
            config: {
                mode: 'html',
                max_input_kb: 256,
                allow_raw_html_fallback: false,
            },
        });

        expect(result.data.content).toHaveLength(1);
        expect(result.data.content[0].type).toBe('Text');
        expect(result.data.content[0].props.content).toContain('<h2>Heading</h2>');
    });

    it('uses mapped mode to generate structured blocks', () => {
        const result = importToPuck({
            html: '<img src="https://cdn.example.com/hero.jpg" alt="Hero" />',
            config: {
                mode: 'mapped',
                max_input_kb: 256,
                allow_raw_html_fallback: true,
            },
        });

        expect(result.data.content).toHaveLength(1);
        expect(result.data.content[0].type).toBe('Image');
        expect(result.data.content[0].props.src).toBe('https://cdn.example.com/hero.jpg');
    });

    it('throws when input exceeds tenant max_input_kb', () => {
        const largeHtml = `<p>${'x'.repeat(3000)}</p>`;

        expect(() => importToPuck({
            html: largeHtml,
            config: { mode: 'mapped', max_input_kb: 1 },
        })).toThrow(/Import exceeds tenant limit/i);
    });
});
