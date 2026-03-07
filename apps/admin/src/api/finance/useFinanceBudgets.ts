import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/customSupabaseClient';
import { FinanceBudget, FinanceApproval } from './models';

// Query Key Factory for Budgets
export const budgetKeys = {
  all: ['finance', 'budgets'] as const,
  lists: (tenantId: string) => [...budgetKeys.all, tenantId, 'list'] as const,
};

// Query Key Factory for Approvals
export const approvalKeys = {
  all: ['finance', 'approvals'] as const,
  lists: (tenantId: string) => [...approvalKeys.all, tenantId, 'list'] as const,
  pending: (tenantId: string) => [...approvalKeys.all, tenantId, 'pending'] as const,
};

/**
 * Hook to fetch active finance budgets.
 */
export function useFinanceBudgets(tenantId?: string) {
  return useQuery({
    queryKey: budgetKeys.lists(tenantId || ''),
    queryFn: async (): Promise<FinanceBudget[]> => {
      const { data, error } = await supabase
        .from('finance_budgets')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('end_date', { ascending: false });

      if (error) throw new Error(error.message);
      return data as FinanceBudget[];
    },
    enabled: !!tenantId,
  });
}

/**
 * Hook to fetch finance approvals pending action for a tenant.
 */
export function usePendingApprovals(tenantId?: string) {
  return useQuery({
    queryKey: approvalKeys.pending(tenantId || ''),
    queryFn: async (): Promise<FinanceApproval[]> => {
      const { data, error } = await supabase
        .from('finance_approvals')
        .select('*, finance_transactions(*)')
        .eq('tenant_id', tenantId)
        .eq('status', 'pending');

      if (error) throw new Error(error.message);
      return data as FinanceApproval[];
    },
    enabled: !!tenantId,
  });
}

/**
 * Hook to process (approve/reject) a transaction.
 */
export function useProcessApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, comments }: { id: string, status: 'approved' | 'rejected', comments?: string }) => {
      const { data, error } = await supabase
        .from('finance_approvals')
        .update({ status, comments, processed_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw new Error(error.message);
      return data as FinanceApproval;
    },
    onSuccess: (data) => {
      // Invalidate the cache for this tenant's approvals and conditionally transactions
      queryClient.invalidateQueries({ queryKey: approvalKeys.lists(data.tenant_id) });
      queryClient.invalidateQueries({ queryKey: approvalKeys.pending(data.tenant_id) });
      queryClient.invalidateQueries({ queryKey: ['finance', 'transactions', data.tenant_id] });
    },
  });
}
