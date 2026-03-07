import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/customSupabaseClient';
import { FinanceTransaction } from './models';

// Query Key Factory
export const transactionKeys = {
  all: ['finance', 'transactions'] as const,
  lists: (tenantId: string) => [...transactionKeys.all, tenantId, 'list'] as const,
  filtered: (tenantId: string, filters: Record<string, any>) => [...transactionKeys.all, tenantId, 'filter', filters] as const,
  detail: (tenantId: string, id: string) => [...transactionKeys.all, tenantId, 'detail', id] as const,
};

/**
 * Hook to fetch filtered finance transactions for a tenant.
 */
export function useFinanceTransactions(tenantId?: string, filters?: { type?: string; categoryId?: string }) {
  return useQuery({
    queryKey: transactionKeys.filtered(tenantId || '', filters || {}),
    queryFn: async (): Promise<FinanceTransaction[]> => {
      let query = supabase
        .from('finance_transactions')
        .select('*, finance_categories (name, color)')
        .eq('tenant_id', tenantId)
        .order('transaction_date', { ascending: false });

      if (filters?.type) {
        query = query.eq('type', filters.type);
      }
      if (filters?.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data as FinanceTransaction[];
    },
    enabled: !!tenantId,
  });
}

/**
 * Hook to create a finance transaction.
 */
export function useCreateFinanceTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newRecord: Omit<FinanceTransaction, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('finance_transactions')
        .insert(newRecord)
        .select()
        .single();
        
      if (error) throw new Error(error.message);
      return data as FinanceTransaction;
    },
    onSuccess: (data) => {
      // Invalidate exact tenant list caches
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists(data.tenant_id) });
      queryClient.invalidateQueries({ queryKey: ['finance', 'transactions', data.tenant_id] });
    },
  });
}
