# FarmSquare Backend Migration Guide

## Step-by-Step Guide to Run Migrations in Supabase

This guide will walk you through setting up the complete backend database, ensuring **email/password authentication** for all users (farmers, buyers, agents, admins).

---

## ✅ Prerequisites

Before starting, make sure you have:
1. ✅ Supabase project created at https://app.supabase.com
2. ✅ Your Supabase project URL and API keys
3. ✅ Access to Supabase Dashboard

---

## 📋 Step 1: Open Supabase SQL Editor

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query** button

---

## 📋 Step 2: Run Migration 001 - Initial Schema

1. Open the file: `supabase/migrations/001_initial_schema.sql`
2. **Copy ALL the contents** of the file
3. Paste into the SQL Editor
4. Click **Run** (or press Ctrl+Enter)
5. ✅ Wait for success message: "Success. No rows returned"

**What this does:**
- Creates all database tables (profiles, listings, orders, etc.)
- Creates all ENUM types (user_role, order_status, etc.)
- Sets up foreign key relationships
- **Note:** Passwords are automatically hashed by Supabase Auth - no manual hashing needed!

---

## 📋 Step 3: Run Migration 002 - Indexes

1. Open the file: `supabase/migrations/002_indexes.sql`
2. **Copy ALL the contents** of the file
3. Paste into the SQL Editor
4. Click **Run**
5. ✅ Wait for success message

**What this does:**
- Creates performance indexes for fast queries
- Critical for RLS (Row Level Security) performance

---

## 📋 Step 4: Run Migration 003 - RLS Policies

1. Open the file: `supabase/migrations/003_rls_policies.sql`
2. **Copy ALL the contents** of the file
3. Paste into the SQL Editor
4. Click **Run**
5. ✅ Wait for success message

**What this does:**
- Enables Row Level Security on all tables
- Creates security policies for buyer/farmer/agent/admin access
- **Important:** This allows email/password signup for all roles

---

## 📋 Step 5: Run Migration 004 - Functions & Triggers

1. Open the file: `supabase/migrations/004_functions_triggers.sql`
2. **Copy ALL the contents** of the file
3. Paste into the SQL Editor
4. Click **Run**
5. ✅ Wait for success message

**What this does:**
- Creates database functions (status validation, etc.)
- Sets up automatic triggers (wallet creation, timestamps, etc.)

---

## 📋 Step 6: Configure Authentication (Email/Password for ALL)

**IMPORTANT:** Configure Supabase Auth to use Email/Password for all users:

1. Go to **Authentication** → **Providers** in Supabase Dashboard
2. Find **Email** provider
3. Click to expand settings
4. ✅ **Enable Email provider** (toggle ON)
5. ✅ **Enable "Confirm email"** (optional, recommended for production)
6. ✅ **Enable "Secure email change"** (optional)
7. Click **Save**

**For Phone OTP (DISABLE if not using):**
- Find **Phone** provider
- Toggle it **OFF** (since we're using email/password)

**Password Security:**
- ✅ Supabase **automatically hashes all passwords** using bcrypt
- ✅ No manual password hashing needed
- ✅ Passwords are stored securely in `auth.users` table (not in your app tables)

---

## 📋 Step 7: Create Storage Buckets

1. Go to **Storage** in Supabase Dashboard
2. Click **New bucket**
3. Create these buckets (all should be **PRIVATE**):

   **Bucket 1: listing-photos**
   - Name: `listing-photos`
   - Public: **NO** (Private)
   - File size limit: 5MB (or as needed)
   - Allowed MIME types: `image/*`
   - Click **Create bucket**

   **Bucket 2: kyc-documents**
   - Name: `kyc-documents`
   - Public: **NO** (Private)
   - Click **Create bucket**

   **Bucket 3: kyb-documents**
   - Name: `kyb-documents`
   - Public: **NO** (Private)
   - Click **Create bucket**

   **Bucket 4: dispute-evidence**
   - Name: `dispute-evidence`
   - Public: **NO** (Private)
   - Click **Create bucket**

   **Bucket 5: inspection-evidence**
   - Name: `inspection-evidence`
   - Public: **NO** (Private)
   - Click **Create bucket**

---

## 📋 Step 8: Run Migration 005 - Storage Policies

1. Open the file: `supabase/migrations/005_storage_setup.sql`
2. **Copy ALL the contents** of the file
3. Paste into the SQL Editor
4. Click **Run**
5. ✅ Wait for success message

**What this does:**
- Creates storage bucket policies
- Controls who can read/upload files in each bucket

---

## 📋 Step 9: Verify Migrations (Optional but Recommended)

Run this query to verify everything is set up correctly:

```sql
-- Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check if indexes exist
SELECT indexname 
FROM pg_indexes 
WHERE schemaname = 'public';
```

You should see all your tables listed, RLS enabled, and indexes created.

---

## 📋 Step 10: Create Your First Admin User

**Method 1: Via Supabase Dashboard (Recommended)**

1. Go to **Authentication** → **Users** in Supabase Dashboard
2. Click **Add user** → **Create new user**
3. Fill in:
   - **Email:** admin@farmsquare.com (or your email)
   - **Password:** (choose a strong password)
   - **Auto Confirm User:** ✅ Check this (so you can login immediately)
4. Click **Create user**
5. Copy the **User UID** (you'll need this)

6. Go to **SQL Editor** and run:

```sql
-- Replace 'USER_UUID_HERE' with the actual UUID from step 5
UPDATE public.profiles
SET role = 'admin'
WHERE id = 'USER_UUID_HERE';
```

**Method 2: Via SQL (if profile already exists)**

If a profile was auto-created, just update the role:

```sql
-- Find your user first
SELECT id, email, role FROM public.profiles WHERE email = 'your-email@example.com';

-- Update to admin
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

---

## 📋 Step 11: Enable Realtime (Optional)

For live order tracking and status updates:

1. Go to **Database** → **Replication** in Supabase Dashboard
2. Find these tables:
   - `logistics_status_updates`
   - `order_status_history`
3. Toggle **ON** for both tables
4. Click **Save**

---

## ✅ Verification Checklist

After completing all steps, verify:

- [ ] All 6 migrations ran successfully
- [ ] Email provider is enabled in Authentication
- [ ] All 5 storage buckets created (all PRIVATE)
- [ ] Admin user created and role set to 'admin'
- [ ] Can see tables in Database → Tables
- [ ] RLS is enabled (check Database → Tables → any table → RLS enabled)

---

## 🔐 Password Security Confirmation

**✅ Passwords are automatically hashed by Supabase:**

- Supabase Auth uses **bcrypt** for password hashing
- Passwords are stored in `auth.users` table (not in `public.profiles`)
- Never store passwords in your application tables
- All password operations go through Supabase Auth API

**To verify password hashing:**
1. Create a test user via Supabase Dashboard
2. Go to Database → Tables → `auth.users`
3. Check the `encrypted_password` column - it will be a long hash string
4. ✅ This confirms passwords are hashed automatically

---

## 🚨 Troubleshooting

### Error: "relation already exists"
- Some tables might already exist
- Drop them first or skip that part of the migration

### Error: "permission denied"
- Make sure you're running as the database owner
- Check you're in the correct Supabase project

### Error: "enum already exists"
- Some ENUMs might already exist
- Comment out the CREATE TYPE lines and re-run

### RLS policies not working
- Verify RLS is enabled: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';`
- Check user role in profiles table matches auth.uid()

### Can't login after creating user
- Check if email confirmation is required
- Enable "Auto Confirm User" when creating users
- Or confirm email via Supabase Dashboard

---

## 📞 Next Steps

After migrations are complete:

1. ✅ Update your `.env` file with Supabase credentials
2. ✅ Deploy Edge Functions (see `supabase/README.md`)
3. ✅ Test authentication flow
4. ✅ Create test users (buyer, farmer, agent)
5. ✅ Test RLS policies with different user roles

---

## 📚 Additional Resources

- Supabase Docs: https://supabase.com/docs
- SQL Editor Guide: https://supabase.com/docs/guides/database/overview
- Auth Setup: https://supabase.com/docs/guides/auth

---

**Need Help?** Check the migration files for comments explaining each section.

