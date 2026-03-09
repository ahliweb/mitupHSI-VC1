# Finance Module Documentation

## Overview

The Finance module provides tenant-aware personal finance management capabilities for tracking income, expenses, budgets, and donations.

## Module Key

`finance`

## Permission Keys (Canonical Format)

| Permission | Key | Description |
|------------|-----|-------------|
| Dashboard View | `tenant.finance.dashboard.view` | Access finance dashboard |
| Transactions View | `tenant.finance.transactions.view` | View transactions list |
| Transactions Create | `tenant.finance.transactions.create` | Create new transactions |
| Transactions Update | `tenant.finance.transactions.update` | Edit existing transactions |
| Transactions Delete | `tenant.finance.transactions.delete` | Soft delete transactions |
| Categories View | `tenant.finance.categories.view` | View categories list |
| Categories Manage | `tenant.finance.categories.manage` | Create/edit/delete categories |
| Reports View | `tenant.finance.reports.view` | View financial reports |
| Reports Export | `tenant.finance.reports.export` | Export reports to CSV/PDF |
| Settings Configure | `tenant.finance.settings.configure` | Configure finance settings |
| Wallets Manage | `tenant.finance.wallets.manage` | Manage wallets/accounts |
| Budgets Manage | `tenant.finance.budgets.manage` | Manage budgets |
| Approvals Manage | `tenant.finance.approvals.manage` | Manage approval workflows |

## Database Tables

### `finance_categories`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `tenant_id` | uuid | Tenant reference |
| `name` | text | Category name |
| `type` | text | 'income' or 'expense' |
| `is_active` | boolean | Active status |
| `created_at` | timestamptz | Creation timestamp |
| `updated_at` | timestamptz | Update timestamp |
| `deleted_at` | timestamptz | Soft delete timestamp |

### `finance_transactions`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `tenant_id` | uuid | Tenant reference |
| `category_id` | uuid | Category reference |
| `type` | text | 'income' or 'expense' |
| `amount` | numeric | Transaction amount |
| `currency_code` | text | Currency code |
| `transaction_date` | date | Transaction date |
| `description` | text | Description |
| `metadata` | jsonb | Additional metadata |
| `attachment_count` | integer | Number of attachments |
| `created_at` | timestamptz | Creation timestamp |
| `updated_at` | timestamptz | Update timestamp |
| `deleted_at` | timestamptz | Soft delete timestamp |

### `finance_settings`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `tenant_id` | uuid | Tenant reference |
| `default_currency` | text | Default currency |
| `module_enabled` | boolean | Module status |
| `created_at` | timestamptz | Creation timestamp |
| `updated_at` | timestamptz | Update timestamp |

### `finance_wallets`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `tenant_id` | uuid | Tenant reference |
| `name` | text | Wallet name |
| `type` | text | 'cash', 'bank', 'credit' |
| `balance` | numeric | Current balance |
| `currency_code` | text | Currency code |
| `is_active` | boolean | Active status |

### `finance_budgets`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `tenant_id` | uuid | Tenant reference |
| `category_id` | uuid | Category reference |
| `amount` | numeric | Budgeted amount |
| `period` | text | 'monthly', 'yearly' |
| `start_date` | date | Period start |
| `end_date` | date | Period end |

## API Usage

### Fetching Transactions

```javascript
import { supabase } from '@/lib/customSupabaseClient';
import { useQuery } from '@tanstack/react-query';

function useFinanceTransactions(filters) {
  const { tenantId } = useTenant();
  
  return useQuery({
    queryKey: ['finance', 'transactions', tenantId, filters],
    queryFn: async () => {
      let query = supabase
        .from('finance_transactions')
        .select('*, category:finance_categories(id, name, type)')
        .eq('tenant_id', tenantId)
        .is('deleted_at', null)
        .order('transaction_date', { ascending: false });
      
      if (filters?.type) {
        query = query.eq('type', filters.type);
      }
      if (filters?.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }
      if (filters?.startDate) {
        query = query.gte('transaction_date', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('transaction_date', filters.endDate);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });
}
```

### Creating Transactions

```javascript
import { supabase } from '@/lib/customSupabaseClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';

function useCreateTransaction() {
  const { tenantId } = useTenant();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (transaction) => {
      const { data, error } = await supabase
        .from('finance_transactions')
        .insert({
          ...transaction,
          tenant_id: tenantId,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'transactions'] });
    },
  });
}
```

## UI Components

### Admin Panel

- `FinanceDashboard` - Overview with stats and charts
- `TransactionsManager` - Transaction list with filters
- `TransactionEditor` - Create/edit transaction form
- `CategoriesManager` - Category management
- `ReportsView` - Financial reports

### Public Portal

- `PublicFinanceOverview` - Public-facing finance summary
- `DonationWidget` - Donation form for external visitors
- `BudgetProgress` - Budget tracking visualization

## RLS Policies

All finance tables have tenant-scoped RLS:

```sql
CREATE POLICY "finance_tenant_isolation" ON finance_transactions
  AS PERMISSIVE FOR ALL TO authenticated
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());
```

## Soft Delete Pattern

Always use soft delete:

```javascript
// ❌ Never do this
await supabase.from('finance_transactions').delete().eq('id', id);

// ✅ Always do this
await supabase
  .from('finance_transactions')
  .update({ deleted_at: new Date().toISOString() })
  .eq('id', id);
```
