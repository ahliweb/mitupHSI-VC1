# AWCMS Resource Map

This document registers all resources and permissions governed by ABAC in the AWCMS system.

## Finance Module

| Resource | Description | Available Actions |
| --- | --- | --- |
| `finance.dashboard` | Finance module dashboard overview | `view` |
| `finance.transactions` | Income and expense transaction records | `view`, `create`, `update`, `delete`, `export` |
| `finance.categories` | Transaction category definitions | `view`, `create`, `update`, `delete`, `manage` |
| `finance.wallets` | Cash, bank, and electronic wallet accounts | `view`, `create`, `update`, `delete` |
| `finance.attachments` | Uploaded receipt/invoice records | `view`, `create`, `delete` |
| `finance.budgets` | Tenant budget boundaries mapped to categories | `view`, `create`, `update`, `delete` |
| `finance.approvals` | Review workflows for submitted transactions | `view`, `approve`, `reject` |
| `finance.reports` | Financial summaries and aggregations | `view`, `export` |
| `finance.settings` | Tenant-specific module configuration | `view`, `configure` |

### Core Permissions
- `tenant.finance.dashboard.view`
- `tenant.finance.transactions.create`
- `tenant.finance.transactions.update`
- `tenant.finance.transactions.delete`
- `tenant.finance.transactions.view`
- `tenant.finance.categories.manage`
- `tenant.finance.categories.view`
- `tenant.finance.wallets.create`
- `tenant.finance.wallets.update`
- `tenant.finance.wallets.view`
- `tenant.finance.wallets.delete`
- `tenant.finance.attachments.create`
- `tenant.finance.attachments.view`
- `tenant.finance.budgets.manage`
- `tenant.finance.budgets.view`
- `tenant.finance.approvals.approve`
- `tenant.finance.approvals.view`
- `tenant.finance.reports.view`
- `tenant.finance.reports.export`
- `tenant.finance.settings.configure`
