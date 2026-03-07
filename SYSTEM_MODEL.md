# AWCMS System Model

## Modules

### 1. Finance Module (Duitku)
**Module Key:** `finance`

**Description:** A tenant-aware finance management capability for tracking operational cash inflow and outflow, tracking donations, and lightweight SME finance operations.

#### Database Tables
- `finance_categories`: Transaction categories (income/expense).
- `finance_transactions`: Cash inflow/outflow transaction records with explicit tenant tracking.
- `finance_settings`: Tenant-specific module configuration.

#### Core Capabilities
- Multi-tenant transaction management with Row Level Security (RLS).
- Pre-defined categories and customizable tenant reporting options.
- Basic Income and Expense separation supporting core double-entry concepts at a simple level.

#### Access Roles
- **Platform Admin:** Can enable/disable the finance module globally and manage default configuration.
- **Tenant Admin:** Can enable module per tenant, configure settings, assign ABAC roles, view all tenant finance data.
- **Finance Manager / Staff:** Can manage transactions and categories across the tenant scope.
- **Auditor / Reviewer:** Read-only access to transactions and reports for analysis.
