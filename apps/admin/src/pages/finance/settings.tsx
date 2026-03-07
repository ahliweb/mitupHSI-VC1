import React from 'react';

/**
 * Finance Settings Page
 * Tenant-specific module configuration.
 * Requires: tenant.finance.settings.configure
 */
export default function FinanceSettingsPage() {
  return (
    <div className="finance-settings-container">
      <h1>Finance Settings</h1>
      <p>Configure tenant-specific settings like default currency or module status.</p>
      {/* TODO: Implement settings form for default_currency, date_format, allow_negative_balance, etc. */}
    </div>
  );
}
