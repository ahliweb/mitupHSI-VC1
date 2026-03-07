import React, { useState } from 'react';
import { useFinanceTransactions } from '../../api/finance/useFinanceTransactions';
import { useExportTransactions } from '../../api/finance/useFinanceExport';
import { useTenant } from '@/contexts/TenantContext';
import PageHeader from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

export default function FinanceTransactions() {
  const { currentTenant } = useTenant();
  const tenantId = currentTenant?.id;

  // Local State for Pagination/Filtering
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data: transactions, isLoading } = useFinanceTransactions(tenantId, page, pageSize, {
    sortBy: 'transaction_date',
    sortAsc: false
  });

  const { refetch: exportToCsv, isFetching: isExporting } = useExportTransactions(tenantId, 'csv');

  const handleExport = async () => {
    const result = await exportToCsv();
    if (result.data && typeof result.data === 'string') {
      const blob = new Blob([result.data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transactions_export_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <PageHeader 
          title="Transactions" 
          description="View and manage ledger entries, invoices, and incomes."
        />
        <Button variant="outline" onClick={handleExport} disabled={isExporting}>
          {isExporting ? 'Generating...' : 'Export CSV'}
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-4 overflow-x-auto">
        {isLoading ? (
          <p>Loading transactions...</p>
        ) : transactions && transactions.length > 0 ? (
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="border-b bg-slate-50">
              <tr>
                <th className="p-3 text-gray-500 font-medium">Date</th>
                <th className="p-3 text-gray-500 font-medium">Description</th>
                <th className="p-3 text-gray-500 font-medium">Category</th>
                <th className="p-3 text-gray-500 font-medium whitespace-nowrap">Amount (IDR)</th>
                <th className="p-3 text-gray-500 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(txn => (
                <tr key={txn.id} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="p-3">
                    {format(new Date(txn.transaction_date), 'MMM dd, yyyy')}
                  </td>
                  <td className="p-3 font-medium">{txn.description || '(No description)'}</td>
                  <td className="p-3 text-gray-600">{txn.finance_categories?.name || '-'}</td>
                  <td className={`p-3 font-medium text-right ${txn.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                    {txn.type === 'income' ? '+' : '-'} {Number(txn.amount).toLocaleString()}
                  </td>
                  <td className="p-3 capitalize">
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                      {txn.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500 text-center py-6">No transactions found.</p>
        )}
      </div>
    </div>
  );
}
