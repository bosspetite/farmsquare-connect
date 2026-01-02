# 🗑️ How to Clear Old Data (localStorage)

## Quick Method - Browser Console

1. **Open your browser** (Chrome, Firefox, Edge, etc.)
2. **Open Developer Tools**:
   - Press `F12` OR
   - Right-click → "Inspect" OR
   - Press `Ctrl + Shift + I` (Windows) / `Cmd + Option + I` (Mac)
3. **Go to Console tab**
4. **Paste this code and press Enter**:

```javascript
localStorage.removeItem('farmsquare_state');
window.location.reload();
```

That's it! Your data is cleared and the page will reload.

---

## Alternative Method - Application Tab

1. **Open Developer Tools** (`F12`)
2. **Go to "Application" tab** (Chrome) or "Storage" tab (Firefox)
3. **Click "Local Storage"** in the left sidebar
4. **Click on your website URL** (e.g., `http://localhost:8080`)
5. **Find `farmsquare_state`** in the list
6. **Right-click** → **Delete** OR click the **trash icon**
7. **Refresh the page** (`F5`)

---

## What This Does

- Removes all stored data (listings, orders, wallet, KYC, etc.)
- Resets to initial seed data
- Starts fresh with default farmer/buyer accounts

---

## When to Clear Data

Clear data when:
- ✅ Testing KYC flow from scratch
- ✅ Testing with fresh accounts
- ✅ Data seems corrupted
- ✅ Want to reset everything

---

## After Clearing

After clearing, you'll need to:
1. **Login again** (as Farmer or Buyer)
2. **Start fresh** with new listings/orders
3. **Complete KYC** from the beginning

---

## View Current Data (Without Clearing)

To see what's stored without clearing:

```javascript
// View all data
JSON.parse(localStorage.getItem('farmsquare_state'))

// View just KYC data
JSON.parse(localStorage.getItem('farmsquare_state')).kycData

// View listings
JSON.parse(localStorage.getItem('farmsquare_state')).listings
```

---

## Quick Clear Button (For Testing)

You can also add this to your browser bookmarks for quick access:

**Bookmark URL:**
```javascript
javascript:(function(){localStorage.removeItem('farmsquare_state');alert('Data cleared!');location.reload();})();
```

Then just click the bookmark to clear data instantly!

