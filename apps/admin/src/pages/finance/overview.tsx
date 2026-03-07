import React from 'react';

/**
 * Finance Overview Dashboard
 * Displays tenant-scoped summaries like total income/expense, net balance, and recent transactions.
 * Requires: tenant.finance.dashboard.view
 */
export default function FinanceOverviewPage() {
  return (
    <div className="finance-overview-container">
      <h1>Finance Overview</h1>
      <p>Tenant-scoped financial summaries will be displayed here.</p>
      {/* TODO: Implement dashboard metrics, charts, and recent transaction list */}
    </div>
  );
}
