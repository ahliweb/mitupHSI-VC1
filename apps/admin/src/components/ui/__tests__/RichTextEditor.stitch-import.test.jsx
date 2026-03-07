import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import RichTextEditor from '../RichTextEditor';

const mocks = vi.hoisted(() => {
    const chain = {};
    const chainMethods = [
        'focus',
        'toggleHeading',
        'toggleBold',
        'toggleItalic',
        'toggleUnderline',
        'toggleStrike',
        'toggleCode',
        'toggleBulletList',
        'toggleOrderedList',
        'toggleBlockquote',
        'toggleCodeBlock',
        'extendMarkRange',
        'setLink',
        'setImage',
        'undo',
        'redo',
        'unsetAllMarks',
        'clearNodes',
    ];

    chainMethods.forEach((method) => {
        chain[method] = vi.fn(() => chain);
    });
    chain.run = vi.fn(() => true);

    const editor = {
        chain: vi.fn(() => chain),
        isActive: vi.fn(() => false),
        commands: {
            setContent: vi.fn(),
        },
        getHTML: vi.fn(() => '<p></p>'),
    };

    const useEditorMock = vi.fn(() => editor);
    const importToTiptapMock = vi.fn(() => ({
        html: '<p>Imported from Stitch</p>',
        warnings: [{ code: 'sanitized', message: 'Sanitizer removed unsupported content.' }],
    }));
    const useStitchImportConfigMock = vi.fn(() => ({
        config: {
            enabled: true,
            mode: 'mapped',
            max_input_kb: 512,
            allow_raw_html_fallback: true,
        },
        loading: false,
    }));

    return {
        editor,
        chain,
        useEditorMock,
        importToTiptapMock,
        useStitchImportConfigMock,
    };
});

vi.mock('@tiptap/react', () => ({
    useEditor: (...args) => mocks.useEditorMock(...args),
    EditorContent: () => <div data-testid="editor-content" />,
}));

vi.mock('@tiptap/starter-kit', () => ({
    default: {
        configure: vi.fn(() => ({})),
    },
}));

vi.mock('@tiptap/extension-link', () => ({
    default: {
        configure: vi.fn(() => ({})),
    },
}));

vi.mock('@tiptap/extension-image', () => ({
    default: {
        configure: vi.fn(() => ({})),
    },
}));

vi.mock('@tiptap/extension-placeholder', () => ({
    default: {
        configure: vi.fn(() => ({})),
    },
}));

vi.mock('@tiptap/extension-underline', () => ({
    default: {},
}));

vi.mock('@/hooks/useStitchImportConfig', () => ({
    useStitchImportConfig: (...args) => mocks.useStitchImportConfigMock(...args),
}));

vi.mock('@/lib/stitch', () => ({
    importToTiptap: (...args) => mocks.importToTiptapMock(...args),
}));

vi.mock('@/components/stitch/ImportFromStitchDialog', () => ({
    default: ({ open, onImport, maxInputKb }) => (
        open ? (
            <div data-testid="stitch-import-dialog" data-max-input-kb={maxInputKb}>
                <button
                    type="button"
                    data-testid="confirm-stitch-import"
                    onClick={() => onImport({
                        html: '<p>Dialog HTML</p>',
                        css: '.from-dialog { color: red; }',
                        warnings: [{ code: 'dialog_warning', message: 'Dialog warning payload.' }],
                    })}
                >
                    Confirm Stitch Import
                </button>
                <button
                    type="button"
                    data-testid="confirm-stitch-import-no-warnings"
                    onClick={() => onImport({
                        html: '<p>Dialog HTML</p>',
                        css: '',
                    })}
                >
                    Confirm Stitch Import Without Warnings
                </button>
            </div>
        ) : null
    ),
}));

describe('RichTextEditor stitch import', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.useStitchImportConfigMock.mockReturnValue({
            config: {
                enabled: true,
                mode: 'mapped',
                max_input_kb: 512,
                allow_raw_html_fallback: true,
            },
            loading: false,
        });
        mocks.importToTiptapMock.mockReturnValue({
            html: '<p>Imported from Stitch</p>',
            warnings: [{ code: 'sanitized', message: 'Sanitizer removed unsupported content.' }],
        });
    });

    it('disables import button when stitch feature is disabled', () => {
        mocks.useStitchImportConfigMock.mockReturnValue({
            config: {
                enabled: false,
                mode: 'mapped',
                max_input_kb: 512,
                allow_raw_html_fallback: true,
            },
            loading: false,
        });

        render(<RichTextEditor value={null} onChange={vi.fn()} />);

        const importButton = screen.getByTitle('Stitch import disabled for this tenant');
        expect(importButton).toBeDisabled();
        expect(screen.queryByTestId('stitch-import-dialog')).not.toBeInTheDocument();
    });

    it('opens stitch dialog and imports sanitized HTML', async () => {
        render(<RichTextEditor value={null} onChange={vi.fn()} />);

        const importButton = screen.getByTitle('Import from Stitch');
        fireEvent.click(importButton);

        const dialog = await screen.findByTestId('stitch-import-dialog');
        expect(dialog).toHaveAttribute('data-max-input-kb', '512');

        fireEvent.click(screen.getByTestId('confirm-stitch-import'));

        await waitFor(() => {
            expect(mocks.importToTiptapMock).toHaveBeenCalledWith({
                html: '<p>Dialog HTML</p>',
                css: '.from-dialog { color: red; }',
                config: {
                    enabled: true,
                    mode: 'mapped',
                    max_input_kb: 512,
                    allow_raw_html_fallback: true,
                },
            });
            expect(mocks.editor.commands.setContent).toHaveBeenCalledWith('<p>Imported from Stitch</p>', true);
        });
    });

    it('passes dialog warnings to onStitchImport and uses returned HTML', async () => {
        const onStitchImport = vi.fn(async () => '<p>Custom Override HTML</p>');

        render(
            <RichTextEditor
                value={null}
                onChange={vi.fn()}
                onStitchImport={onStitchImport}
            />,
        );

        fireEvent.click(screen.getByTitle('Import from Stitch'));
        fireEvent.click(await screen.findByTestId('confirm-stitch-import'));

        await waitFor(() => {
            expect(onStitchImport).toHaveBeenCalledWith(expect.objectContaining({
                html: '<p>Dialog HTML</p>',
                css: '.from-dialog { color: red; }',
                warnings: [{ code: 'dialog_warning', message: 'Dialog warning payload.' }],
                defaultHtml: '<p>Imported from Stitch</p>',
            }));
            expect(mocks.editor.commands.setContent).toHaveBeenCalledWith('<p>Custom Override HTML</p>', true);
        });
    });

    it('falls back to importer warnings when dialog warnings are absent', async () => {
        const onStitchImport = vi.fn(async ({ warnings }) => {
            expect(warnings).toEqual([{ code: 'sanitized', message: 'Sanitizer removed unsupported content.' }]);
            return '<p>Warnings From Importer</p>';
        });

        render(
            <RichTextEditor
                value={null}
                onChange={vi.fn()}
                onStitchImport={onStitchImport}
            />,
        );

        fireEvent.click(screen.getByTitle('Import from Stitch'));
        fireEvent.click(await screen.findByTestId('confirm-stitch-import-no-warnings'));

        await waitFor(() => {
            expect(onStitchImport).toHaveBeenCalledTimes(1);
            expect(mocks.editor.commands.setContent).toHaveBeenCalledWith('<p>Warnings From Importer</p>', true);
        });
    });
});
