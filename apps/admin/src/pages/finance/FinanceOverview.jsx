import React from 'react';
import { useFinanceSummary } from '../../api/finance/useFinanceReports';
import { useFinanceBudgets } from '../../api/finance/useFinanceBudgets';
import { useTenant } from '@/contexts/TenantContext';
import { FinanceSummaryWidget } from '../../components/FinanceSummaryWidget';
import PageHeader from '@/components/ui/PageHeader';

export default function FinanceOverview() {
  const { currentTenant } = useTenant();
  const tenantId = currentTenant?.id;

  const { data: report, isLoading: isReportLoading } = useFinanceSummary(tenantId);
  const { data: budgets, isLoading: isBudgetsLoading } = useFinanceBudgets(tenantId);

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Finance Overview" 
        description="Monitor your tenant's financial health, budgets, and cash flow."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FinanceSummaryWidget 
          totalIncome={report?.total_income || 0}
          totalExpense={report?.total_expense || 0}
          netBalance={report?.net_balance || 0}
          isLoading={isReportLoading}
        />

        <div className="border rounded-lg p-6 bg-white shadow-sm flex flex-col gap-4">
          <h3 className="font-semibold text-lg">Active Budgets</h3>
          {isBudgetsLoading ? (
             <div className="animate-pulse bg-gray-100 rounded p-4 h-24 w-full">Loading budgets...</div>
          ) : budgets && budgets.length > 0 ? (
             <ul className="space-y-3">
               {budgets.map(b => (
                 <li key={b.id} className="flex justify-between items-center text-sm border-b pb-2">
                   <span>{b.name} <span className="text-gray-400">({b.period})</span></span>
                   <span className="font-medium">IDR {b.amount.toLocaleString()}</span>
                 </li>
               ))}
             </ul>
          ) : (
            <p className="text-gray-500 text-sm">No active budgets found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
