import React from 'react';

/**
 * Shared Tenant Portal Summary Widget
 * Can be embedded on other AWCMS domain surfaces (e.g. School Dashboard, Main Org Overview).
 * Requires permission to view dashboard (or custom portal reporting permission if enabled)
 */
export function FinanceSummaryWidget({
  title = "Finance Overview",
  totalIncome,
  totalExpense,
  netBalance,
  isLoading
}: {
  title?: string;
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  isLoading: boolean;
}) {
  if (isLoading) {
    return <div className="animate-pulse bg-gray-100 rounded p-4 h-32 w-full">Loading finance overview...</div>;
  }

  return (
    <div className="border rounded-lg p-6 bg-white shadow-sm flex flex-col gap-4">
      <h3 className="font-semibold text-lg">{title}</h3>
      <div className="grid grid-cols-3 gap-4 text-sm mt-2">
        <div className="flex flex-col">
          <span className="text-gray-500">Income</span>
          <span className="font-medium text-green-600">IDR {totalIncome.toLocaleString()}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-gray-500">Expense</span>
          <span className="font-medium text-red-600">IDR {totalExpense.toLocaleString()}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-gray-500">Net Balance</span>
          <span className={`font-medium ${netBalance >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
            IDR {netBalance.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
