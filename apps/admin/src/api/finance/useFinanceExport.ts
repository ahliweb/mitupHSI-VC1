import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/customSupabaseClient';
import { FinanceTransaction } from './models';

/**
 * Hook to directly fetch and prepare CSV data for exports.
 * Typically invoked lazily on button click rather than on mount.
 */
export function useExportTransactions(tenantId?: string, exportFormat: 'csv' | 'json' = 'csv') {
  return useQuery({
    queryKey: ['finance', 'export', tenantId, exportFormat],
    queryFn: async (): Promise<string | FinanceTransaction[]> => {
      const { data, error } = await supabase
        .from('finance_transactions')
        .select(`
          id,
          type,
          amount,
          currency_code,
          transaction_date,
          description,
          finance_categories (name),
          finance_wallets (name)
        `)
        .eq('tenant_id', tenantId)
        .order('transaction_date', { ascending: false });

      if (error) throw new Error(error.message);

      if (exportFormat === 'csv') {
        const headers = ['ID', 'Type', 'Amount', 'Currency', 'Date', 'Description', 'Category', 'Wallet'];
        const rows = data.map((tx: any) => [
          tx.id,
          tx.type,
          tx.amount,
          tx.currency_code,
          tx.transaction_date,
          tx.description || '',
          tx.finance_categories?.name || '',
          tx.finance_wallets?.name || ''
        ]);
        
        const csvContent = [
          headers.join(','),
          ...rows.map((row: any[]) => row.map((cell: any) => `"${cell}"`).join(','))
        ].join('\n');
        
        return csvContent;
      }

      return data as FinanceTransaction[];
    },
    // Only run this query explicitly when commanded to export
    enabled: false,
  });
}
