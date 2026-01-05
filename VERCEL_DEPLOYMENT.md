# 🚀 Vercel Deployment Guide

## ✅ What's Fixed

Your app is now configured to work on both:
- **GitHub Pages**: Uses `/farmsquare-connect/` base path
- **Vercel**: Uses `/` root path (automatic detection)

## 📋 How It Works

The `vite.config.ts` automatically detects the deployment platform:
- **Vercel**: Sets `VERCEL=1` automatically → uses root path `/`
- **GitHub Pages**: Sets `VITE_BASE_PATH=/farmsquare-connect/` → uses repo path
- **Local dev**: Uses root path `/`

## 🚀 Deploy to Vercel

### Option 1: Connect GitHub Repository (Recommended)

1. Go to: https://vercel.com
2. Sign in with GitHub
3. Click **"Add New Project"**
4. Import your repository: `bosspetite/farmsquare-connect`
5. Vercel will auto-detect Vite
6. **Build Settings** (should auto-fill):
   - Framework Preset: **Vite**
   - Root Directory: `./` (or leave blank)
   - Build Command: `npm run build`
   - Output Directory: `dist`
7. Click **"Deploy"**

### Option 2: Vercel CLI

```bash
npm i -g vercel
cd farmsquare-connect
vercel
```

## ⚙️ Vercel Configuration

The `vercel.json` file is already configured:
- ✅ Build command: `npm run build`
- ✅ Output directory: `dist`
- ✅ Framework: `vite`
- ✅ Rewrites all routes to `index.html` (for React Router)

## 🔍 Verify It's Working

After deployment:

1. **Check the build logs** in Vercel dashboard
2. **Visit your Vercel URL** (e.g., `your-app.vercel.app`)
3. **Open browser console** (F12) - should see "App rendered successfully"
4. **Test navigation** - all routes should work

## 🐛 If Still Blank on Vercel

### Check 1: Build Logs
1. Go to Vercel dashboard → Your project → Deployments
2. Click on the latest deployment
3. Check the build logs for errors

### Check 2: Environment Variables
- Vercel automatically sets `VERCEL=1`
- Don't set `VITE_BASE_PATH` in Vercel (it will break)

### Check 3: Browser Console
1. Open your Vercel URL
2. Press F12 → Console tab
3. Look for errors
4. Check Network tab - are files loading?

### Check 4: Verify Base Path
The built `index.html` should have:
- ✅ `/assets/...` (root paths) for Vercel
- ❌ NOT `/farmsquare-connect/assets/...` (that's for GitHub Pages)

## 📝 Important Notes

- **GitHub Pages** and **Vercel** can both work from the same codebase
- The config automatically detects which platform you're on
- **Don't set VITE_BASE_PATH in Vercel** - it will override the auto-detection
- The `vercel.json` handles routing for React Router

## 🎉 That's It!

Your app should now work on both platforms:
- **GitHub Pages**: https://bosspetite.github.io/farmsquare-connect/
- **Vercel**: Your Vercel URL (after deployment)



