# Development Setup Guide

This guide will help you set up the development environment for meetuphsi-personalfinance.

## Prerequisites

- **Node.js**: >= 22.12.0 (managed via nvm)
- **npm**: >= 10.0.0
- **Supabase CLI**: Latest version
- **Git**: Latest version

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/meetuphsi-personalfinance.git
cd meetuphsi-personalfinance
```

### 2. Install Dependencies

```bash
# Admin Panel
cd apps/admin
npm install

# Public Portal
cd ../../awcms-public/personalfinance
npm install
```

### 3. Configure Environment

```bash
# Copy environment template
cp apps/admin/.env.example apps/admin/.env.local

# Edit with your values
# - Supabase URL and keys
# - Cloudflare R2 credentials
# - Turnstile keys
# - Email service credentials
```

### 4. Run Development Servers

```bash
# Admin Panel (Port 3000)
cd apps/admin
npm run dev

# Public Portal (Port 4321)
cd awcms-public/personalfinance
npm run dev
```

## Environment Variables

### Required Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable (anon) key |
| `VITE_SUPABASE_SECRET_KEY` | Supabase secret key (server-only) |
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_BUCKET_NAME` | R2 bucket name |

### Optional Variables

| Variable | Description |
|----------|-------------|
| `CONTEXT7_API_KEY` | Context7 AI documentation |
| `MAILKETING_API_TOKEN` | Email service token |
| `VITE_TURNSTILE_SITE_KEY` | Cloudflare Turnstile key |

## Database Setup

### Local Development

```bash
# Start local Supabase
npx supabase start

# Run migrations
npx supabase db push --local

# Generate types
npx supabase gen types
```

### Remote Development

```bash
# Link to remote project
npx supabase link --project-ref pzenkzipagidjtsdxaxe

# Pull remote schema
npx supabase db pull --linked

# Push migrations
npx supabase db push --linked
```

## Testing

```bash
# Run tests
cd apps/admin
npm run test

# Run linting
npm run lint

# Type checking
npm run typecheck
```

## Building

```bash
# Admin Panel
cd apps/admin
npm run build

# Public Portal
cd awcms-public/personalfinance
npm run build
```

## Troubleshooting

### Common Issues

1. **Node version mismatch**
   ```bash
   nvm install 22
   nvm use 22
   ```

2. **Supabase CLI issues**
   ```bash
   npm install -g supabase
   supabase login
   ```

3. **Migration conflicts**
   ```bash
   ./scripts/repair_supabase_migration_history.sh --linked --apply
   ```

## Next Steps

- Read [AGENTS.md](../../AGENTS.md) for coding standards
- Read [SYSTEM_MODEL.md](../../SYSTEM_MODEL.md) for architecture
- Review Finance module in [docs/modules/finance.md](../modules/finance.md)
