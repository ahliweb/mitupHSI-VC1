import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/customSupabaseClient';

// Query Key Factory
export const reportKeys = {
  all: ['finance', 'reports'] as const,
  summary: (tenantId: string, period?: string) => [...reportKeys.all, tenantId, 'summary', period || 'all'] as const,
};

export interface FinanceSummary {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
}

/**
 * Hook to fetch high-level financial summary for the dashboard.
 */
export function useFinanceSummary(tenantId?: string, periodStartDate?: string) {
  return useQuery({
    queryKey: reportKeys.summary(tenantId || '', periodStartDate),
    queryFn: async (): Promise<FinanceSummary> => {
      let query = supabase
        .from('finance_transactions')
        .select('type, amount')
        .eq('tenant_id', tenantId);

      if (periodStartDate) {
        query = query.gte('transaction_date', periodStartDate);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);

      const summary = data.reduce(
        (acc: FinanceSummary, curr: { type: string; amount: number }) => {
          if (curr.type === 'income') acc.totalIncome += Number(curr.amount);
          if (curr.type === 'expense') acc.totalExpense += Number(curr.amount);
          return acc;
        },
        { totalIncome: 0, totalExpense: 0, netBalance: 0 }
      );

      summary.netBalance = summary.totalIncome - summary.totalExpense;
      return summary;
    },
    enabled: !!tenantId,
  });
}
