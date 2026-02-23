# 🚀 Quick Start: Run Migrations in 5 Minutes

## Super Quick Guide

### Step 1: Open Supabase SQL Editor
1. Go to https://app.supabase.com
2. Select your project
3. Click **SQL Editor** → **New Query**

### Step 2: Run Each Migration File (In Order!)

Copy and paste each file's contents one by one:

1. ✅ **001_initial_schema.sql** → Paste → Run → Wait for "Success"
2. ✅ **002_indexes.sql** → Paste → Run → Wait for "Success"  
3. ✅ **003_rls_policies.sql** → Paste → Run → Wait for "Success"
4. ✅ **004_functions_triggers.sql** → Paste → Run → Wait for "Success"
5. ✅ **005_storage_setup.sql** → Paste → Run → Wait for "Success"

### Step 3: Enable Email/Password Auth
1. Go to **Authentication** → **Providers**
2. Enable **Email** provider (toggle ON)
3. Save

### Step 4: Create Storage Buckets
Go to **Storage** → Create these buckets (all PRIVATE):
- `listing-photos`
- `kyc-documents`  
- `kyb-documents`
- `dispute-evidence`
- `inspection-evidence`

### Step 5: Create Admin User
1. **Authentication** → **Users** → **Add user**
2. Email: your-email@example.com
3. Password: (choose strong password)
4. ✅ Check "Auto Confirm User"
5. Copy the User UUID
6. Run in SQL Editor:
```sql
UPDATE public.profiles SET role = 'admin' WHERE id = 'PASTE_UUID_HERE';
```

## ✅ Done!

**Password Security:** ✅ Supabase automatically hashes all passwords - no manual work needed!

See `MIGRATION_GUIDE.md` for detailed instructions.






