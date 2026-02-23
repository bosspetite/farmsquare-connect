# 🚀 Install Dependencies for Supabase Backend

Complete guide to install everything needed to run the Supabase backend.

---

## ✅ Step 1: Install Node.js Dependencies

Your project already has `package.json` with all required dependencies. Just install them:

### Open Terminal/PowerShell in project folder:

```bash
# Navigate to project folder
cd "C:\Users\user\Desktop\MY FARM SQUARE WORK\farmsquare-connect"

# Install all dependencies
npm install
```

**This installs:**
- ✅ `@supabase/supabase-js` - Supabase client library
- ✅ All React dependencies
- ✅ All UI components
- ✅ Everything else needed

**Wait for:** `npm install` to finish (may take 2-5 minutes)

---

## ✅ Step 2: Install Supabase CLI (For Edge Functions)

The Supabase CLI lets you deploy Edge Functions easily.

**⚠️ Note:** Supabase CLI cannot be installed via `npm install -g` anymore. Use one of these methods:

### Option A: Install via Scoop (Windows - Recommended)

```powershell
# Install Scoop first (if not installed)
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex

# Install Supabase CLI
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Option B: Install via Chocolatey (Windows)

```powershell
# Install Chocolatey first (if not installed)
# Run PowerShell as Administrator, then:
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install Supabase CLI
choco install supabase
```

### Option C: Download Binary (Windows)

1. Go to: https://github.com/supabase/cli/releases
2. Download latest `supabase_windows_amd64.zip`
3. Extract to a folder (e.g., `C:\supabase\`)
4. Add to PATH environment variable

### Option D: Use Supabase Dashboard (No CLI Needed!)

You can deploy Edge Functions directly via Supabase Dashboard:
1. Go to **Edge Functions** in Supabase Dashboard
2. Click **Create Function**
3. Copy code from `supabase/functions/[function-name]/index.ts`
4. Paste and deploy

**This method doesn't require CLI installation!**

### Verify Installation:

```bash
# Check if Supabase CLI is installed
supabase --version
```

**Expected output:** `supabase version X.X.X`

---

## ✅ Step 3: Set Up Environment Variables

### Create `.env` file in project root:

1. Navigate to: `farmsquare-connect/` folder
2. Create a new file named `.env` (no extension)
3. Add your Supabase credentials:

```env
# Supabase Configuration (REQUIRED)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Google Maps API (REQUIRED for delivery tracking)
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Paystack Configuration (REQUIRED for payments)
VITE_PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_public_key_here
```

### Get Your Supabase Credentials:

1. Go to https://app.supabase.com
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → Paste as `VITE_SUPABASE_URL`
   - **anon/public key** → Paste as `VITE_SUPABASE_ANON_KEY`

---

## ✅ Step 4: Login to Supabase CLI

```bash
# Login to Supabase
supabase login
```

**This will:**
1. Open browser for authentication
2. Ask you to authorize
3. Save your credentials locally

---

## ✅ Step 5: Link Your Project

```bash
# Link to your Supabase project
supabase link --project-ref your-project-ref
```

**To find your project ref:**
1. Go to Supabase Dashboard
2. Go to **Settings** → **General**
3. Find **Reference ID** (looks like: `abcdefghijklmnop`)
4. Use it in the command above

**Example:**
```bash
supabase link --project-ref abcdefghijklmnop
```

---

## ✅ Step 6: Verify Everything Works

### Test Supabase Connection:

Create a test file `test-supabase.js`:

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file!');
} else {
  console.log('✅ Supabase URL:', supabaseUrl);
  console.log('✅ Supabase Key found');
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  console.log('✅ Supabase client created successfully!');
}
```

### Or test via your app:

```bash
# Start development server
npm run dev
```

Open browser and check console - should see no Supabase errors.

---

## ✅ Step 7: Install Deno (For Edge Functions - Optional)

Edge Functions run on Deno runtime. If deploying via CLI, Deno is auto-installed.

### Manual Install (if needed):

**Windows (PowerShell):**
```powershell
irm https://deno.land/install.ps1 | iex
```

**Or via Chocolatey:**
```powershell
choco install deno
```

**Verify:**
```bash
deno --version
```

---

## 📋 Complete Installation Checklist

After running all steps, verify:

- [ ] ✅ `npm install` completed successfully
- [ ] ✅ `supabase --version` shows version number
- [ ] ✅ `.env` file created with Supabase credentials
- [ ] ✅ `supabase login` successful
- [ ] ✅ `supabase link` connected to your project
- [ ] ✅ `npm run dev` starts without errors
- [ ] ✅ No Supabase connection errors in browser console

---

## 🚨 Troubleshooting

### Error: "npm: command not found"
**Solution:** Install Node.js from https://nodejs.org/

### Error: "supabase: command not found"
**Solution:** 
- Make sure you ran `npm install -g supabase`
- Restart terminal/PowerShell
- Check PATH environment variable

### Error: "Cannot find module '@supabase/supabase-js'"
**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Error: "Missing VITE_SUPABASE_URL"
**Solution:**
- Check `.env` file exists in `farmsquare-connect/` folder
- Check file is named exactly `.env` (not `.env.txt`)
- Restart dev server after creating `.env`

### Error: "Permission denied" when installing globally
**Solution (Windows):**
```powershell
# Run PowerShell as Administrator
# Then try again
npm install -g supabase
```

---

## 🎯 Quick Commands Reference

```bash
# Install dependencies
npm install

# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy Edge Functions (after migrations)
supabase functions deploy paystack-webhook
supabase functions deploy update-order-status
supabase functions deploy admin-actions
supabase functions deploy signed-url-generator

# Start dev server
npm run dev
```

---

## ✅ Next Steps

After installing dependencies:

1. ✅ Run database migrations (see `MIGRATION_GUIDE.md`)
2. ✅ Set up storage buckets
3. ✅ Deploy Edge Functions
4. ✅ Test authentication

---

## 📚 Additional Resources

- Node.js: https://nodejs.org/
- Supabase CLI Docs: https://supabase.com/docs/reference/cli
- Supabase JS Docs: https://supabase.com/docs/reference/javascript

---

**Need Help?** Check the error message and refer to troubleshooting section above.

