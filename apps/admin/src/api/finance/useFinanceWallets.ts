import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/customSupabaseClient';
import { FinanceWallet, FinanceAttachment } from './models';

// Query Key Factory for Wallets
export const walletKeys = {
  all: ['finance', 'wallets'] as const,
  lists: (tenantId: string) => [...walletKeys.all, tenantId, 'list'] as const,
  detail: (tenantId: string, id: string) => [...walletKeys.all, tenantId, 'detail', id] as const,
};

// Query Key Factory for Attachments
export const attachmentKeys = {
  all: ['finance', 'attachments'] as const,
  byTransaction: (tenantId: string, transactionId: string) => [...attachmentKeys.all, tenantId, 'transaction', transactionId] as const,
};

/**
 * Hook to fetch finance wallets for a given tenant.
 */
export function useFinanceWallets(tenantId?: string) {
  return useQuery({
    queryKey: walletKeys.lists(tenantId || ''),
    queryFn: async (): Promise<FinanceWallet[]> => {
      const { data, error } = await supabase
        .from('finance_wallets')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('is_default', { ascending: false })
        .order('name');

      if (error) throw new Error(error.message);
      return data as FinanceWallet[];
    },
    enabled: !!tenantId,
  });
}

/**
 * Hook to fetch attachments linked to a specific transaction.
 */
export function useTransactionAttachments(tenantId?: string, transactionId?: string) {
  return useQuery({
    queryKey: attachmentKeys.byTransaction(tenantId || '', transactionId || ''),
    queryFn: async (): Promise<FinanceAttachment[]> => {
      const { data, error } = await supabase
        .from('finance_transaction_attachments')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('transaction_id', transactionId);

      if (error) throw new Error(error.message);
      return data as FinanceAttachment[];
    },
    enabled: !!tenantId && !!transactionId,
  });
}
