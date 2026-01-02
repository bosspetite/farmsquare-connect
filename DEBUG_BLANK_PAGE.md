# 🔍 Debug Blank Page - Step by Step

## Quick Fix Steps

### Step 1: Check Browser Console
1. **Press `F12`** (opens Developer Tools)
2. **Click "Console" tab**
3. **Look for RED errors**
4. **Copy any error messages** you see

### Step 2: Check Network Tab
1. **Press `F12`**
2. **Click "Network" tab**
3. **Refresh the page** (`F5`)
4. **Look for RED failed requests** (404, 500, etc.)
5. **Check if `main.tsx` or `index.html` loaded**

### Step 3: Clear Everything
1. **Press `F12`** → **Console tab**
2. **Paste this and press Enter:**
```javascript
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### Step 4: Hard Refresh
- **Windows**: `Ctrl + Shift + R` or `Ctrl + F5`
- **Mac**: `Cmd + Shift + R`

### Step 5: Check if Dev Server is Running
Look at your terminal/command prompt. You should see:
```
VITE v7.x.x  ready in xxx ms

➜  Local:   http://localhost:8080/
```

If you don't see this, the server isn't running!

---

## Common Issues & Fixes

### Issue 1: "Cannot find module" or "Failed to resolve"
**Fix**: Stop the server (`Ctrl + C`) and restart:
```bash
npm run dev
```

### Issue 2: "Unexpected token" or Syntax Error
**Fix**: Check browser console for the exact file/line with the error

### Issue 3: White/Blank Page
**Possible causes:**
- JavaScript error preventing render
- CSS not loading
- React error boundary catching error

**Fix**: 
1. Check console (F12) for errors
2. Check if you see "✅ App rendered successfully" in console
3. If you see an error boundary message, click "Reload Page"

### Issue 4: Port Already in Use
**Error**: `Port 8080 is already in use`

**Fix**:
```bash
# Find and kill the process using port 8080
# Windows PowerShell:
Get-Process -Id (Get-NetTCPConnection -LocalPort 8080).OwningProcess | Stop-Process
```

---

## What to Check in Console

### ✅ Good Signs:
- `✅ App rendered successfully`
- `📍 Base URL: /`
- `🌐 Current URL: http://localhost:8080/`
- No red errors

### ❌ Bad Signs:
- Red error messages
- `Failed to load resource`
- `Uncaught Error`
- `Cannot read property of undefined`

---

## Quick Test

Open browser console (F12) and run:
```javascript
// Check if React is loaded
console.log('React:', typeof React !== 'undefined' ? '✅ Loaded' : '❌ Not loaded');

// Check if root element exists
console.log('Root element:', document.getElementById('root') ? '✅ Found' : '❌ Not found');

// Check localStorage
console.log('localStorage:', localStorage.getItem('farmsquare_state') ? '✅ Has data' : '✅ Empty (OK)');
```

---

## Still Blank?

1. **Share the console errors** (F12 → Console → Copy errors)
2. **Check terminal** for dev server errors
3. **Try a different browser** (Chrome, Firefox, Edge)
4. **Clear browser cache** completely

---

## Emergency Fix

If nothing works, try this in console:
```javascript
// Nuclear option - clear everything
localStorage.clear();
sessionStorage.clear();
indexedDB.deleteDatabase('farmsquare');
location.reload(true);
```
