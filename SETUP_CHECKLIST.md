# ✅ FarmSquare Backend Setup Checklist

## Current Status Check

Run this to see what's done and what's next!

---

## ✅ What's Already Installed

- [x] **Node.js** - Installed
- [x] **npm** - Installed  
- [x] **All npm dependencies** - 385 packages installed
- [x] **Supabase JS library** - Ready to use
- [x] **Database migrations** - SQL files ready (need to run in Supabase)
- [x] **Edge Functions** - Code ready (need to deploy)

---

## 🔧 What You Need to Do Next

### Step 1: Check/Create `.env` File ⚠️ REQUIRED

**Location:** `farmsquare-connect/.env`

**Check if it exists:**
```powershell
Test-Path .env
```

**If it doesn't exist, create it with:**
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
VITE_PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_public_key_here
```

**Get Supabase credentials:**
1. Go to https://app.supabase.com
2. Select your project
3. Go to **Settings** → **API**
4. Copy **Project URL** and **anon/public key**

---

### Step 2: Run Database Migrations ⚠️ REQUIRED

**Go to:** Supabase Dashboard → SQL Editor

**Run these files IN ORDER:**

1. ✅ `supabase/migrations/001_initial_schema.sql`
2. ✅ `supabase/migrations/002_indexes.sql`
3. ✅ `supabase/migrations/003_rls_policies.sql`
4. ✅ `supabase/migrations/004_functions_triggers.sql`
5. ✅ `supabase/migrations/005_storage_setup.sql`

**See:** `MIGRATION_GUIDE.md` for detailed instructions

---

### Step 3: Create Storage Buckets ⚠️ REQUIRED

**Go to:** Supabase Dashboard → Storage

**Create these 5 buckets (all PRIVATE):**
- [ ] `listing-photos`
- [ ] `kyc-documents`
- [ ] `kyb-documents`
- [ ] `dispute-evidence`
- [ ] `inspection-evidence`

---

### Step 4: Enable Email/Password Auth ⚠️ REQUIRED

**Go to:** Supabase Dashboard → Authentication → Providers

- [ ] Enable **Email** provider (toggle ON)
- [ ] Save

---

### Step 5: Create Admin User ⚠️ REQUIRED

**Go to:** Supabase Dashboard → Authentication → Users

1. Click **Add user** → **Create new user**
2. Email: `admin@farmsquare.com` (or your email)
3. Password: (choose strong password)
4. ✅ Check **Auto Confirm User**
5. Click **Create user**
6. Copy the **User UUID**

**Then run in SQL Editor:**
```sql
UPDATE public.profiles 
SET role = 'admin' 
WHERE id = 'PASTE_USER_UUID_HERE';
```

---

### Step 6: Deploy Edge Functions (Optional but Recommended)

**Option A: Via Supabase Dashboard (Easier - No CLI needed)**

1. Go to **Edge Functions** in Supabase Dashboard
2. For each function:
   - Click **Create Function**
   - Name: `paystack-webhook` (or function name)
   - Copy code from `supabase/functions/[name]/index.ts`
   - Paste and deploy

**Functions to deploy:**
- [ ] `paystack-webhook`
- [ ] `update-order-status`
- [ ] `admin-actions`
- [ ] `signed-url-generator`

**Option B: Via CLI (If you installed Supabase CLI)**
```powershell
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy paystack-webhook
supabase functions deploy update-order-status
supabase functions deploy admin-actions
supabase functions deploy signed-url-generator
```

---

### Step 7: Enable Realtime (Optional)

**Go to:** Supabase Dashboard → Database → Replication

Enable Realtime for:
- [ ] `logistics_status_updates`
- [ ] `order_status_history`

---

### Step 8: Set Edge Function Secrets (If using Edge Functions)

**Go to:** Supabase Dashboard → Edge Functions → Settings → Secrets

Add these secrets:
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Get from Settings → API → service_role key
- [ ] `PAYSTACK_SECRET_KEY` - Your Paystack secret key (if using Paystack)

---

## ✅ Verification Steps

After completing setup, verify:

### 1. Test Database Connection
```powershell
npm run dev
```
Open browser → Check console for Supabase connection errors

### 2. Test Authentication
- Try signing up a new user
- Check if profile is created in `public.profiles` table

### 3. Check Tables Exist
**Go to:** Supabase Dashboard → Database → Tables

Should see:
- ✅ `profiles`
- ✅ `listings`
- ✅ `orders`
- ✅ `wallets`
- ✅ `carts`
- ✅ And 20+ more tables

### 4. Check RLS is Enabled
**Go to:** Supabase Dashboard → Database → Tables → Any table

Should see: **RLS Enabled** badge

---

## 🚨 Common Issues & Fixes

### Issue: "Missing VITE_SUPABASE_URL"
**Fix:** Create `.env` file with Supabase credentials

### Issue: "Cannot connect to Supabase"
**Fix:** 
- Check `.env` file exists
- Check credentials are correct
- Restart dev server: `npm run dev`

### Issue: "Table doesn't exist"
**Fix:** Run database migrations (Step 2)

### Issue: "RLS policy error"
**Fix:** 
- Check migrations ran successfully
- Check user role in `profiles` table
- Verify RLS is enabled on tables

---

## 📋 Quick Status Check Commands

```powershell
# Check if .env exists
Test-Path .env

# Check Node.js version
node --version

# Check npm version
npm --version

# Check Supabase JS installed
npm list @supabase/supabase-js

# Start dev server
npm run dev
```

---

## 🎯 Priority Order

**Do these FIRST (Required):**
1. ✅ Create `.env` file
2. ✅ Run database migrations
3. ✅ Create storage buckets
4. ✅ Enable Email auth
5. ✅ Create admin user

**Then do these (Recommended):**
6. ✅ Deploy Edge Functions
7. ✅ Enable Realtime
8. ✅ Set Edge Function secrets

---

## 📚 Helpful Guides

- `MIGRATION_GUIDE.md` - Detailed migration instructions
- `INSTALL_DEPENDENCIES.md` - Installation guide
- `AUTH_SETUP_CONFIRMATION.md` - Auth configuration
- `QUICK_START_MIGRATIONS.md` - Quick migration reference

---

**Current Status:** Dependencies installed ✅ | Next: Configure `.env` and run migrations 🚀






