import React from 'react';
import { useFinanceCategories, useCreateFinanceCategory } from '../../api/finance/useFinanceCategories';
import { useTenant } from '@/contexts/TenantContext';
import PageHeader from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';

export default function FinanceCategories() {
  const { currentTenant } = useTenant();
  const tenantId = currentTenant?.id;

  const { data: categories, isLoading } = useFinanceCategories(tenantId);
  const createCategory = useCreateFinanceCategory();

  const handleCreateTestCategory = () => {
    createCategory.mutate({
      tenant_id: tenantId,
      name: 'Test Category',
      type: 'expense',
      code: 'TEST-EXP',
      is_system: false,
      is_active: true
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Finance Categories" 
        description="Manage income and expense classifications."
      />

      <div className="flex justify-end">
        <Button onClick={handleCreateTestCategory} disabled={createCategory.isPending}>
          {createCategory.isPending ? 'Creating...' : '+ Create Test Category'}
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-4">
        {isLoading ? (
          <p>Loading categories...</p>
        ) : categories && categories.length > 0 ? (
          <table className="w-full text-left text-sm">
            <thead className="border-b">
              <tr>
                <th className="pb-3 text-gray-500 font-medium">Name</th>
                <th className="pb-3 text-gray-500 font-medium">Type</th>
                <th className="pb-3 text-gray-500 font-medium">Code</th>
                <th className="pb-3 text-gray-500 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(cat => (
                <tr key={cat.id} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="py-3">{cat.name}</td>
                  <td className="py-3 capitalize">
                    <span className={`px-2 py-1 rounded text-xs ${cat.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {cat.type}
                    </span>
                  </td>
                  <td className="py-3 text-gray-600 font-mono text-xs">{cat.code || '-'}</td>
                  <td className="py-3">
                    {cat.is_active ? 'Active' : 'Inactive'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500 text-center py-6">No categories found. Create your first category above.</p>
        )}
      </div>
    </div>
  );
}
