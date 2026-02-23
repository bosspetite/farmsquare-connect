# 🔧 Fix: Install Supabase CLI (Windows)

## ❌ Problem
Supabase CLI cannot be installed via `npm install -g supabase` anymore.

## ✅ Solution: Install via Scoop (Easiest for Windows)

### Step 1: Install Scoop (If you don't have it)

Run this in PowerShell (as Administrator):

```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex
```

**If you get permission error:**
- Right-click PowerShell → Run as Administrator
- Then run the command above

### Step 2: Install Supabase CLI via Scoop

```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Step 3: Verify Installation

```powershell
supabase --version
```

Should show: `supabase version X.X.X`

---

## ✅ Alternative: Install via Chocolatey

If you prefer Chocolatey:

### Step 1: Install Chocolatey (If you don't have it)

Run PowerShell as Administrator:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

### Step 2: Install Supabase CLI

```powershell
choco install supabase
```

---

## ✅ Alternative: Skip CLI - Use Dashboard Instead!

**You don't actually need CLI!** You can deploy Edge Functions via Supabase Dashboard:

1. Go to Supabase Dashboard → Edge Functions
2. Click "Create Function"
3. Copy code from `supabase/functions/[name]/index.ts`
4. Paste and deploy

**This is easier and doesn't require CLI installation!**

---

## 🚀 After Installing CLI

Once CLI is installed, you can:

```powershell
# Login
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy functions
supabase functions deploy paystack-webhook
supabase functions deploy update-order-status
supabase functions deploy admin-actions
supabase functions deploy signed-url-generator
```

---

## 💡 Recommendation

**For now, skip CLI installation and use Supabase Dashboard** - it's easier and you don't need CLI to run migrations or deploy functions manually!






