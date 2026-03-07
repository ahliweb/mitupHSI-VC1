import React from 'react';

/**
 * Finance Reports Page
 * Displays financial summaries, aggregations, and trends.
 * Requires: tenant.finance.reports.view
 */
export default function FinanceReportsPage() {
  return (
    <div className="finance-reports-container">
      <h1>Reports</h1>
      <p>View financial reports, aggregations, and category breakdowns.</p>
      {/* TODO: Implement report aggregations, date range filters, and export functionality */}
    </div>
  );
}
