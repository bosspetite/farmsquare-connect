# FarmSquare Supabase Backend Setup

This directory contains all Supabase backend configuration files for FarmSquare Phase 2.

## Directory Structure

```
supabase/
├── migrations/          # SQL migration files (run in order)
│   ├── 001_initial_schema.sql      # Core database schema
│   ├── 002_indexes.sql            # Performance indexes
│   ├── 003_rls_policies.sql        # Row Level Security policies
│   ├── 004_functions_triggers.sql # Database functions & triggers
│   ├── 005_storage_setup.sql      # Storage bucket policies
│   └── 006_seed_data.sql          # Demo/test data (optional)
├── functions/          # Supabase Edge Functions
│   ├── paystack-webhook/          # Paystack payment webhook handler
│   ├── update-order-status/       # Order/logistics status updates
│   ├── admin-actions/             # Admin-only operations
│   └── signed-url-generator/      # Generate signed URLs for storage
└── README.md           # This file
```

## Setup Instructions

### 1. Prerequisites

- Supabase project created at https://app.supabase.com
- Supabase project URL and API keys
- Supabase CLI installed (optional, for local development)

### 2. Database Setup

Run migrations in order using Supabase SQL Editor:

1. Go to Supabase Dashboard > SQL Editor
2. Run each migration file in sequence:
   - `001_initial_schema.sql` - Creates all tables, enums, constraints
   - `002_indexes.sql` - Creates performance indexes
   - `003_rls_policies.sql` - Enables RLS and creates policies
   - `004_functions_triggers.sql` - Creates functions and triggers
   - `005_storage_setup.sql` - Sets up storage bucket policies
   - `006_seed_data.sql` - (Optional) Creates demo data

**Important:** Run migrations in order. Each migration depends on the previous one.

### 3. Storage Buckets Setup

1. Go to Supabase Dashboard > Storage
2. Create these buckets (all PRIVATE):
   - `listing-photos`
   - `kyc-documents`
   - `kyb-documents`
   - `dispute-evidence`
   - `inspection-evidence`

3. Run `005_storage_setup.sql` to create bucket policies

### 4. Edge Functions Setup

Deploy Edge Functions using Supabase CLI:

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Deploy all functions
supabase functions deploy paystack-webhook
supabase functions deploy update-order-status
supabase functions deploy admin-actions
supabase functions deploy signed-url-generator
```

Or deploy manually via Supabase Dashboard:
1. Go to Edge Functions
2. Create new function for each directory
3. Copy the code from `index.ts` files

### 5. Environment Variables

1. Copy `.env.example` to `.env` in project root
2. Fill in your Supabase credentials:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Set Edge Function secrets in Supabase Dashboard:
   - `SUPABASE_SERVICE_ROLE_KEY` (for Edge Functions)
   - `PAYSTACK_SECRET_KEY` (for webhook verification)

### 6. Auth Configuration

1. Go to Supabase Dashboard > Authentication > Providers
2. Enable **Phone** provider (for farmers/buyers)
3. Enable **Email** provider (for admins/agents)
4. Configure OTP settings as needed

### 7. Realtime Setup

1. Go to Supabase Dashboard > Database > Replication
2. Enable Realtime for:
   - `logistics_status_updates`
   - `order_status_history`

### 8. Create Seed Admin (One-time)

Create your first admin user:

1. Go to Supabase Dashboard > Authentication > Users
2. Create user with email/password
3. Go to SQL Editor and run:

```sql
-- Replace 'user-uuid' with the actual auth.users.id
UPDATE public.profiles
SET role = 'admin'
WHERE id = 'user-uuid';
```

## Testing

After setup, verify:

1. **Database**: Run queries to check tables exist
2. **RLS**: Try accessing data as different user roles
3. **Edge Functions**: Test each function endpoint
4. **Storage**: Try uploading/downloading files
5. **Auth**: Test signup/login flows

## Troubleshooting

### Migration Errors

- Ensure migrations run in order
- Check for existing tables/enums before creating
- Verify all dependencies are created first

### RLS Policy Issues

- Check user role in `profiles` table
- Verify `auth.uid()` returns correct user ID
- Test policies with different user roles

### Edge Function Errors

- Verify environment variables are set
- Check function logs in Supabase Dashboard
- Ensure service role key has correct permissions

### Storage Access Issues

- Verify buckets are created and PRIVATE
- Check bucket policies match user roles
- Test signed URL generation

## Production Checklist

Before deploying to production:

- [ ] All migrations run successfully
- [ ] RLS policies tested for all roles
- [ ] Edge Functions deployed and tested
- [ ] Storage buckets created and configured
- [ ] Environment variables set in production
- [ ] Paystack webhook URL configured
- [ ] Realtime enabled for required tables
- [ ] Backup strategy in place
- [ ] Monitoring/logging configured

## Support

For issues or questions:
- Check Supabase documentation: https://supabase.com/docs
- Review migration files for schema details
- Check Edge Function logs in Supabase Dashboard






