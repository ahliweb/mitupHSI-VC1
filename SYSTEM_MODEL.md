# AWCMS System Model

## Version 3.1.0

## Tech Stack

| Technology | Version | Notes |
|------------|---------|-------|
| React | 19.2.4 | Admin + Public |
| Vite | 7.2.7 | Admin |
| Astro | 5.17.1 | Public Portal |
| TailwindCSS | 4.1.18 | Styling |
| Supabase JS | 2.93.3 | Database/Auth |
| React Router DOM | 7.10.1 | Routing |
| Puck | 0.21.0 | Visual Editor |
| TipTap | 3.13.0 | Rich Text Editor |
| Framer Motion | 12.23.26 | Animations |
| Node.js | >= 22.12.0 | Required runtime |
| Cloudflare Workers | Latest | Edge Logic |
| Cloudflare R2 | - | Media storage |

## Architecture

### Multi-Tenant Architecture

- **Tenant Isolation**: All data scoped by `tenant_id`
- **5-Level Hierarchy**: Parent/child tenant relationships
- **RLS**: Row Level Security enforced at database level
- **10-Level Staff Hierarchy**: Role-based workflow logic

### Project Structure

```
meetuphsi-personalfinance/
├── apps/admin/                    # React Admin Panel
├── awcms-public/
│   └── personalfinance/           # Astro Public Portal
├── supabase/                      # Database Migrations
├── docs/                          # Documentation
└── scripts/                       # Utility Scripts
```

## Modules

### 1. Finance Module (Duitku)
**Module Key:** `finance`

**Description:** A tenant-aware finance management capability for tracking operational cash inflow and outflow, tracking donations, and lightweight SME finance operations.

#### Database Tables
- `finance_categories`: Transaction categories (income/expense).
- `finance_transactions`: Cash inflow/outflow transaction records with explicit tenant tracking.
- `finance_settings`: Tenant-specific module configuration.
- `finance_wallets`: Wallet/account management.
- `finance_budgets`: Budget planning and tracking.
- `finance_approvals`: Approval workflow for transactions.

#### Core Capabilities
- Multi-tenant transaction management with Row Level Security (RLS).
- Pre-defined categories and customizable tenant reporting options.
- Basic Income and Expense separation supporting core double-entry concepts at a simple level.
- Budget tracking and approval workflows.
- Wallet/account management.

#### Access Roles
- **Platform Admin:** Can enable/disable the finance module globally and manage default configuration.
- **Tenant Admin:** Can enable module per tenant, configure settings, assign ABAC roles, view all tenant finance data.
- **Finance Manager / Staff:** Can manage transactions and categories across the tenant scope.
- **Auditor / Reviewer:** Read-only access to transactions and reports for analysis.

#### Permission Keys (Canonical Format)
| Permission | Key |
|------------|-----|
| Dashboard View | `tenant.finance.dashboard.view` |
| Transactions View | `tenant.finance.transactions.view` |
| Transactions Create | `tenant.finance.transactions.create` |
| Transactions Update | `tenant.finance.transactions.update` |
| Transactions Delete | `tenant.finance.transactions.delete` |
| Categories View | `tenant.finance.categories.view` |
| Categories Manage | `tenant.finance.categories.manage` |
| Reports View | `tenant.finance.reports.view` |
| Reports Export | `tenant.finance.reports.export` |
| Settings Configure | `tenant.finance.settings.configure` |
| Wallets Manage | `tenant.finance.wallets.manage` |
| Budgets Manage | `tenant.finance.budgets.manage` |
| Approvals Manage | `tenant.finance.approvals.manage` |

## Security

### Soft Delete Pattern
All business data uses soft delete:
```sql
-- Never use DELETE
UPDATE table SET deleted_at = NOW() WHERE id = ?;
-- Always filter
SELECT * FROM table WHERE deleted_at IS NULL;
```

### Permission Format
Strict format: `scope.resource.action`
- Scopes: `platform`, `tenant`, `content`, `module`
- Actions: `create`, `read`, `update`, `publish`, `delete`, `restore`, `permanent_delete`

### Environment Security
- `.env`, `.env.local`, `.env.production` always gitignored
- Use `VITE_SUPABASE_PUBLISHABLE_KEY` for client
- Use `SUPABASE_SECRET_KEY` for server-only operations

## Public Portal

### Configuration
- **URL**: personalfinance.ahlikoding.com
- **R2 Bucket**: awcms-personalfinance
- **Cloudflare Account**: 5255727b7269584897c8c97ebdd3347f

### Build Model
- Static output with Astro
- Build-time tenant resolution via `PUBLIC_TENANT_ID`
- No runtime database access (use Supabase JS Client)

## Database

### Migrations
- Timestamped migrations in `supabase/migrations/`
- Non-migration SQL in `supabase/manual/`

### Key Tables
- `tenants`: Multi-tenant organization
- `users`: User accounts with tenant association
- `roles`: Role definitions with flags
- `permissions`: ABAC permission definitions
- `role_permissions`: Role-permission mapping
- `resources_registry`: Dynamic resource definitions

## Context7 Integration

Library IDs for documentation:
- `supabase/supabase` - Database/RLS
- `supabase/supabase-js` - Client
- `vitejs/vite` - Build tool
- `cloudflare/cloudflare-docs` - Workers/R2
- `withastro/docs` - Public portal
- `websites/react_dev` - React 19
- `websites/tailwindcss` - TailwindCSS v4
