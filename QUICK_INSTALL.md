# ⚡ Quick Install Guide

## Run These Commands (Copy-Paste Ready)

### 1. Install Node.js Dependencies

```bash
cd "C:\Users\user\Desktop\MY FARM SQUARE WORK\farmsquare-connect"
npm install
```

**Wait 2-5 minutes for installation to complete.**

---

### 2. Install Supabase CLI (Choose One Method)

**Option A: Via Scoop (Recommended for Windows)**
```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**Option B: Via Chocolatey**
```powershell
choco install supabase
```

**Option C: Skip CLI - Use Supabase Dashboard Instead!**
- Go to Supabase Dashboard → Edge Functions
- Deploy functions manually (no CLI needed)

---

### 3. Create .env File

Create a file named `.env` in `farmsquare-connect/` folder with:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
VITE_PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_public_key_here
```

---

### 4. Login to Supabase

```bash
supabase login
```

---

### 5. Link Your Project

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

**Get project ref from:** Supabase Dashboard → Settings → General → Reference ID

---

## ✅ Done!

See `INSTALL_DEPENDENCIES.md` for detailed instructions.

