import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      'x-application-name': 'meetuphsi-personalfinance-public',
    },
  },
});

export async function getTenant(tenantId: string) {
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .is('deleted_at', null)
    .single();
  
  if (error) throw error;
  return data;
}

export async function getFinanceSettings(tenantId: string) {
  const { data, error } = await supabase
    .from('finance_settings')
    .select('*')
    .eq('tenant_id', tenantId)
    .single();
  
  if (error) throw error;
  return data;
}

export async function getPublicFinanceSummary(tenantId: string) {
  const { data: settings, error: settingsError } = await supabase
    .from('finance_settings')
    .select('module_enabled, default_currency')
    .eq('tenant_id', tenantId)
    .single();
  
  if (settingsError) throw settingsError;
  
  if (!settings?.module_enabled) {
    return null;
  }
  
  const { data: stats, error: statsError } = await supabase
    .rpc('get_public_finance_stats', { p_tenant_id: tenantId })
    .single();
  
  if (statsError) {
    // Fallback if RPC doesn't exist
    return {
      currency: settings.default_currency,
      enabled: true,
    };
  }
  
  return {
    ...stats,
    currency: settings.default_currency,
    enabled: true,
  };
}
