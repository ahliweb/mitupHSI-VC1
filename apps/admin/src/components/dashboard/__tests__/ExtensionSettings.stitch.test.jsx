import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ExtensionSettings from '../ExtensionSettings';
import { useStitchImportConfig } from '@/hooks/useStitchImportConfig';
import { useTenant } from '@/contexts/TenantContext';
import { useToast } from '@/components/ui/use-toast';

const mocks = vi.hoisted(() => {
    const navigate = vi.fn();
    const toast = vi.fn();
    const updateStitchConfig = vi.fn(() => Promise.resolve({}));
    const refreshStitchConfig = vi.fn(() => Promise.resolve({}));

    const createThenableQuery = (result) => {
        const promise = Promise.resolve(result);
        const query = {
            eq: vi.fn(() => query),
            is: vi.fn(() => query),
            then: promise.then.bind(promise),
            catch: promise.catch.bind(promise),
            finally: promise.finally.bind(promise),
        };
        return query;
    };

    const extensionRows = [{ id: 'ext-1', name: 'Analytics', config: { enabled: true } }];
    const selectExtensions = vi.fn(() => createThenableQuery({ data: extensionRows, error: null }));
    const updateExtensionEq = vi.fn(() => Promise.resolve({ error: null }));
    const updateExtensions = vi.fn(() => ({ eq: updateExtensionEq }));

    const from = vi.fn((table) => {
        if (table === 'extensions') {
            return {
                select: selectExtensions,
                update: updateExtensions,
            };
        }

        return {
            select: vi.fn(() => createThenableQuery({ data: null, error: null })),
            update: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) })),
        };
    });

    return {
        navigate,
        toast,
        updateStitchConfig,
        refreshStitchConfig,
        from,
    };
});

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mocks.navigate,
        useParams: () => ({}),
    };
});

vi.mock('@/lib/customSupabaseClient', () => ({
    supabase: {
        from: mocks.from,
    },
}));

vi.mock('@/hooks/useSecureRouteParam', () => ({
    default: () => ({ value: null, loading: false, isLegacy: false }),
}));

vi.mock('@/contexts/PermissionContext', () => ({
    usePermissions: () => ({ isPlatformAdmin: false }),
}));

vi.mock('@/contexts/TenantContext', () => ({
    useTenant: vi.fn(),
}));

vi.mock('@/hooks/useStitchImportConfig', () => ({
    useStitchImportConfig: vi.fn(),
}));

vi.mock('@/components/ui/use-toast', () => ({
    useToast: vi.fn(),
}));

describe('ExtensionSettings stitch controls', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        useToast.mockReturnValue({ toast: mocks.toast });
        useTenant.mockReturnValue({ currentTenant: { id: 'tenant-1' } });
        useStitchImportConfig.mockReturnValue({
            config: {
                enabled: true,
                mode: 'mapped',
                max_input_kb: 512,
                allow_raw_html_fallback: true,
            },
            loading: false,
            updateConfig: mocks.updateStitchConfig,
            refresh: mocks.refreshStitchConfig,
        });
    });

    it('saves stitch settings with normalized max_input_kb', async () => {
        render(<ExtensionSettings />);

        const maxInputField = await screen.findByLabelText(/Max Input Size \(KB\)/i);
        fireEvent.change(maxInputField, { target: { value: '1024' } });
        fireEvent.click(screen.getByRole('button', { name: /Save Stitch Settings/i }));

        await waitFor(() => {
            expect(mocks.updateStitchConfig).toHaveBeenCalledWith(expect.objectContaining({
                enabled: true,
                mode: 'mapped',
                max_input_kb: 1024,
                allow_raw_html_fallback: true,
            }));
        });
    });

    it('blocks save when max_input_kb is outside allowed range', async () => {
        render(<ExtensionSettings />);

        const maxInputField = await screen.findByLabelText(/Max Input Size \(KB\)/i);
        fireEvent.change(maxInputField, { target: { value: '8' } });
        fireEvent.click(screen.getByRole('button', { name: /Save Stitch Settings/i }));

        await waitFor(() => {
            expect(mocks.updateStitchConfig).not.toHaveBeenCalled();
            expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({
                title: 'Invalid Limit',
            }));
        });
    });

    it('refreshes stitch settings on demand', async () => {
        render(<ExtensionSettings />);

        fireEvent.click(await screen.findByRole('button', { name: /^Refresh$/i }));

        await waitFor(() => {
            expect(mocks.refreshStitchConfig).toHaveBeenCalledTimes(1);
        });
    });

    it('shows tenant warning when no tenant context exists', async () => {
        useTenant.mockReturnValue({ currentTenant: null });

        render(<ExtensionSettings />);

        expect(await screen.findByText(/available only when a tenant context is active/i)).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Save Stitch Settings/i })).not.toBeInTheDocument();
    });
});
