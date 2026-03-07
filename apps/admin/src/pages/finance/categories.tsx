import React from 'react';

/**
 * Finance Categories Page
 * Allows managing transaction categories (income/expense).
 * Requires: tenant.finance.categories.*
 */
export default function FinanceCategoriesPage() {
  return (
    <div className="finance-categories-container">
      <h1>Finance Categories</h1>
      <p>Manage transaction categories for the tenant.</p>
      {/* TODO: Implement category list/data table and Create/Edit forms */}
    </div>
  );
}
