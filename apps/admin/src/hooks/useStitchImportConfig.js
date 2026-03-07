import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useTenant } from '@/contexts/TenantContext';
import { useToast } from '@/components/ui/use-toast';

const DEFAULT_STITCH_IMPORT_CONFIG = {
    enabled: false,
    mode: 'html',
    max_input_kb: 256,
    allow_raw_html_fallback: true,
};

const normalizeConfig = (value) => {
    if (!value) return DEFAULT_STITCH_IMPORT_CONFIG;

    let parsed = value;
    if (typeof value === 'string') {
        try {
            parsed = JSON.parse(value);
        } catch {
            parsed = null;
        }
    }

    return {
        ...DEFAULT_STITCH_IMPORT_CONFIG,
        ...(parsed && typeof parsed === 'object' ? parsed : {}),
    };
};

export const useStitchImportConfig = () => {
    const { currentTenant } = useTenant();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [config, setConfig] = useState(DEFAULT_STITCH_IMPORT_CONFIG);

    const refresh = useCallback(async () => {
        if (!currentTenant?.id) {
            setConfig(DEFAULT_STITCH_IMPORT_CONFIG);
            return;
        }

        setLoading(true);

        try {
            const { data, error } = await supabase
                .from('settings')
                .select('value')
                .eq('tenant_id', currentTenant.id)
                .eq('key', 'stitch_import')
                .maybeSingle();

            if (error) throw error;
            setConfig(normalizeConfig(data?.value));
        } catch (error) {
            console.error('[useStitchImportConfig] Failed to load stitch_import setting:', error);
            setConfig(DEFAULT_STITCH_IMPORT_CONFIG);
            toast({
                variant: 'destructive',
                title: 'Failed to load Stitch import settings',
                description: error.message,
            });
        } finally {
            setLoading(false);
        }
    }, [currentTenant?.id, toast]);

    const updateConfig = useCallback(async (partialConfig) => {
        if (!currentTenant?.id) {
            throw new Error('Missing tenant context');
        }

        const nextConfig = {
            ...config,
            ...(partialConfig || {}),
        };

        const { error } = await supabase
            .from('settings')
            .upsert(
                {
                    tenant_id: currentTenant.id,
                    key: 'stitch_import',
                    value: nextConfig,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: 'tenant_id,key' },
            );

        if (error) throw error;
        setConfig(nextConfig);
        return nextConfig;
    }, [config, currentTenant?.id]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return {
        config,
        loading,
        refresh,
        updateConfig,
    };
};
