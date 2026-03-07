import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/customSupabaseClient'; // Adjust standard path matching AWCMS
import { FinanceCategory } from './models';

// Query Key Factory
export const categoryKeys = {
  all: ['finance', 'categories'] as const,
  lists: (tenantId: string) => [...categoryKeys.all, tenantId, 'list'] as const,
  detail: (tenantId: string, id: string) => [...categoryKeys.all, tenantId, 'detail', id] as const,
};

/**
 * Hook to fetch finance categories for a tenant.
 */
export function useFinanceCategories(tenantId?: string) {
  return useQuery({
    queryKey: categoryKeys.lists(tenantId || ''),
    queryFn: async (): Promise<FinanceCategory[]> => {
      const { data, error } = await supabase
        .from('finance_categories')
        .select('*')
        // We still provide exact filtering at the client level, but RLS protects the actual exposure
        .eq('tenant_id', tenantId)
        .order('name');

      if (error) throw new Error(error.message);
      return data as FinanceCategory[];
    },
    // Query depends on tenantId resolution
    enabled: !!tenantId,
  });
}

/**
 * Hook to create a finance category.
 */
export function useCreateFinanceCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newCategory: Omit<FinanceCategory, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('finance_categories')
        .insert(newCategory)
        .select()
        .single();
        
      if (error) throw new Error(error.message);
      return data as FinanceCategory;
    },
    onSuccess: (data) => {
      // Invalidate the cache for this tenant's categories
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists(data.tenant_id) });
    },
  });
}
