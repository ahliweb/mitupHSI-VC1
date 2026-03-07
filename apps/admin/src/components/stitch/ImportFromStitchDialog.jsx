import { useEffect, useMemo, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { importToTiptap, validateInput } from '@/lib/stitch';

const formatWarningSummary = (warnings = []) => {
    if (!warnings.length) return 'No warnings.';
    return warnings.map((warning) => warning.message).join(' ');
};

const ImportFromStitchDialog = ({
    open,
    onOpenChange,
    onImport,
    maxInputKb = 256,
    title = 'Import from Stitch',
    description = 'Paste Stitch HTML export below. Unsupported structures use configured fallback rules.',
}) => {
    const [htmlInput, setHtmlInput] = useState('');
    const [cssInput, setCssInput] = useState('');
    const [previewHtml, setPreviewHtml] = useState('');
    const [warnings, setWarnings] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');
    const [isImporting, setIsImporting] = useState(false);

    useEffect(() => {
        if (!open) {
            setHtmlInput('');
            setCssInput('');
            setPreviewHtml('');
            setWarnings([]);
            setErrorMessage('');
            setIsImporting(false);
        }
    }, [open]);

    useEffect(() => {
        if (!open) return;

        if (!htmlInput.trim()) {
            setPreviewHtml('');
            setWarnings([]);
            setErrorMessage('');
            return;
        }

        try {
            validateInput({ html: htmlInput, maxInputKb });
            const result = importToTiptap({
                html: htmlInput,
                css: cssInput,
                config: { max_input_kb: maxInputKb },
            });
            setPreviewHtml(result.html);
            setWarnings(result.warnings || []);
            setErrorMessage('');
        } catch (error) {
            setPreviewHtml('');
            setWarnings([]);
            setErrorMessage(error.message || 'Failed to validate Stitch import input.');
        }
    }, [open, htmlInput, cssInput, maxInputKb]);

    const warningSummary = useMemo(() => formatWarningSummary(warnings), [warnings]);

    const handleImport = async () => {
        try {
            setIsImporting(true);
            setErrorMessage('');
            await onImport?.({ html: htmlInput, css: cssInput, previewHtml, warnings });
            onOpenChange(false);
        } catch (error) {
            setErrorMessage(error.message || 'Failed to import Stitch content.');
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] p-0 overflow-hidden">
                <DialogHeader className="px-6 py-5 border-b border-slate-200">
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                <div className="grid md:grid-cols-2 gap-0 min-h-[60vh]">
                    <div className="border-r border-slate-200 p-5 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="stitch-html">Stitch HTML</Label>
                            <Textarea
                                id="stitch-html"
                                value={htmlInput}
                                onChange={(event) => setHtmlInput(event.target.value)}
                                placeholder="Paste exported HTML from Stitch"
                                className="min-h-[220px] font-mono text-xs"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="stitch-css">Optional CSS (currently ignored)</Label>
                            <Textarea
                                id="stitch-css"
                                value={cssInput}
                                onChange={(event) => setCssInput(event.target.value)}
                                placeholder="Paste CSS if available"
                                className="min-h-[120px] font-mono text-xs"
                            />
                        </div>

                        <div className="text-xs text-slate-500">Tenant input limit: {maxInputKb}KB</div>
                    </div>

                    <div className="p-5 space-y-4">
                        <div>
                            <h4 className="text-sm font-semibold text-slate-900">Sanitized Preview</h4>
                            <p className="text-xs text-slate-500">Preview is sanitized before import.</p>
                        </div>

                        <ScrollArea className="h-[320px] rounded-md border border-slate-200 p-4 bg-slate-50/50">
                            {previewHtml ? (
                                <div
                                    className="prose prose-sm max-w-none"
                                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                                />
                            ) : (
                                <div className="text-sm text-slate-400">Paste HTML to preview sanitized output.</div>
                            )}
                        </ScrollArea>

                        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                            <div className="text-xs font-semibold text-slate-700">Warnings</div>
                            <div className="text-xs text-slate-600 mt-1">{warningSummary}</div>
                        </div>

                        {errorMessage && (
                            <div className="rounded-md border border-red-200 bg-red-50 text-red-700 text-xs px-3 py-2">
                                {errorMessage}
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="px-6 py-4 border-t border-slate-200">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isImporting}>
                        Cancel
                    </Button>
                    <Button onClick={handleImport} disabled={isImporting || !htmlInput.trim()}>
                        {isImporting ? 'Importing...' : 'Import Content'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ImportFromStitchDialog;
