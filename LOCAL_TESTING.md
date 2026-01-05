# 🧪 Local Testing Guide

## ✅ Dev Server Running

Your app is now running at: **http://localhost:8080**

## 🧪 Test the Marketplace Flow

### Step 1: Test as Farmer

1. **Open**: http://localhost:8080
2. **Click "Get Started"** → Select **"Farmer"**
3. **Enter details**:
   - Name: `Test Farmer`
   - Region: `Kaduna`
4. **You'll be logged in** → Redirected to Farmer Dashboard

5. **Create a Listing**:
   - Click **"Create New Listing"** button
   - Select commodity (e.g., "Maize")
   - Enter quantity (e.g., 1000 kg)
   - Add photos (optional)
   - Set price (e.g., 500 ₦/kg)
   - Click **"Publish Listing"**

6. **Verify**:
   - Go to **"Inventory"** → Should see your new listing
   - Go to **"Orders"** → Should see any orders

### Step 2: Test as Buyer

1. **Open a new browser tab** (or incognito)
2. **Go to**: http://localhost:8080/auth
3. **Select "Buyer"**
4. **Enter details**:
   - Name: `Test Buyer`
   - Region: `Lagos`
   - Company: `Test Company` (optional)

5. **Browse Marketplace**:
   - Go to **"Marketplace"**
   - You should see the listing you created as Farmer!
   - Click on the listing

6. **Place Order**:
   - Click **"Place Order"**
   - Enter quantity (e.g., 500 kg)
   - Click **"Confirm Order"**
   - You'll be redirected to Orders page

7. **Check Wallet**:
   - Go to Dashboard
   - Check wallet balance
   - Should show updated balance (payment held)

### Step 3: Complete Order Flow

1. **Back to Farmer Tab**:
   - Go to **"Orders"**
   - You should see the new order!
   - Click on the order

2. **Accept Order**:
   - Click **"Accept Order"**
   - Order status changes to "Accepted"

3. **Update Status**:
   - Click **"Mark as Pickup Scheduled"**
   - Then **"Mark as In Transit"**
   - Then **"Mark as Delivered"**

4. **Back to Buyer Tab**:
   - Go to **"Orders"**
   - Click on the order
   - You should see **"Confirm Delivery"** button
   - Click it → Payment released to farmer!

5. **Check Wallets**:
   - **Buyer wallet**: Should show reduced balance
   - **Farmer wallet**: Should show increased balance
   - Check transaction history in both wallets

## 🎯 What to Test

### ✅ Core Features:
- [ ] Create listing (Farmer)
- [ ] Browse marketplace (Buyer)
- [ ] Place order (Buyer)
- [ ] Accept/Reject order (Farmer)
- [ ] Update order status (Farmer)
- [ ] Confirm delivery (Buyer)
- [ ] Wallet balance updates
- [ ] Transaction history

### ✅ KYC Testing:
- [ ] Go to Farmer → Account (KYC)
- [ ] Upload selfie
- [ ] Upload ID document
- [ ] Submit for review
- [ ] Check status updates

### ✅ Navigation:
- [ ] All sidebar links work
- [ ] All buttons work
- [ ] Mobile navigation works
- [ ] Back buttons work

## 🐛 Debugging Tips

### If something doesn't work:

1. **Check Browser Console** (F12):
   - Look for red errors
   - Check if data is being saved

2. **Check localStorage**:
   - F12 → Application → Local Storage
   - Look for `farmsquare_state`
   - You can see all your data there

3. **Clear Data** (if needed):
   - F12 → Application → Clear Storage
   - Click "Clear site data"
   - Refresh page

4. **Check Network Tab**:
   - F12 → Network
   - Make sure no 404 errors

## 📊 View Your Data

### In Browser Console:
```javascript
// View all state
JSON.parse(localStorage.getItem('farmsquare_state'))

// View listings
JSON.parse(localStorage.getItem('farmsquare_state')).listings

// View orders
JSON.parse(localStorage.getItem('farmsquare_state')).orders

// View wallets
JSON.parse(localStorage.getItem('farmsquare_state')).wallets
```

## 🎨 UI Testing

### Test Responsive Design:
- Resize browser window
- Test on mobile view (F12 → Toggle device toolbar)
- Check sidebar collapse on mobile
- Test bottom navigation on mobile

### Test Interactions:
- Hover effects on buttons
- Click animations
- Loading states
- Toast notifications

## ✅ Success Indicators

You'll know it's working when:
- ✅ Listings appear in marketplace immediately
- ✅ Orders appear in both dashboards
- ✅ Wallet balances update automatically
- ✅ Status changes reflect everywhere
- ✅ No console errors
- ✅ Smooth navigation

---

## 🚀 Ready to Test!

Your dev server is running at: **http://localhost:8080**

Open it in your browser and start testing! 🎉



