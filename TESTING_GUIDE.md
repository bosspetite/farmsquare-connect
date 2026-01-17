# 🧪 Testing Guide - Farmer Dashboard

## ✅ Dev Server Running

Your app is now running at: **http://localhost:8080**

---

## 🧪 Test the Complete Farmer Dashboard Flow

### 1️⃣ Test KYC Verification

**Path:** `/farmer/kyc`

1. **Login as Farmer**
   - Go to http://localhost:8080
   - Click "Get Started" → Select "Farmer"
   - Enter name and region → Login

2. **Complete KYC**
   - Go to Account (KYC) in sidebar
   - Upload selfie photo
   - Upload ID document
   - Submit for review
   - Status should show "Under Review"

3. **Test Withdrawal Block**
   - Go to Wallet
   - Try to withdraw
   - Should see warning: "KYC Verification Required"
   - Withdrawal button should be disabled

4. **Approve KYC (Mock)**
   - In browser console (F12), run:
   ```javascript
   const state = JSON.parse(localStorage.getItem('farmsquare_state'));
   const kyc = state.kycData.find(k => k.userId === 'your_user_id');
   if (kyc) {
     kyc.status = 'APPROVED';
     localStorage.setItem('farmsquare_state', JSON.stringify(state));
     window.location.reload();
   }
   ```
   - Or manually edit localStorage
   - Refresh page → KYC should show "Verified!"
   - Now withdrawal should work

---

### 2️⃣ Test Listings Management

**Path:** `/farmer/create-listing` and `/farmer/listings`

1. **Create Listing**
   - Go to Dashboard → Click "List New Produce"
   - Step 1: Select commodity (e.g., Maize)
   - Step 2: Enter quantity (e.g., 1000 kg)
   - Step 3: Upload photos (optional)
   - Step 4: Set price (e.g., 500 ₦/kg) and grade
   - Step 5: Review → Publish
   - Should redirect to Listings page

2. **View Listings**
   - Go to Inventory (Listings)
   - Should see your new listing
   - Photos should display correctly

3. **Edit Listing**
   - Click "Edit" on a listing
   - Change price or quantity
   - Save changes
   - Should update immediately

4. **Pause Listing**
   - Click "Pause" on an active listing
   - Status should change to "Paused"
   - Go to Buyer marketplace (new tab) → Listing should NOT appear

5. **Resume Listing**
   - Click "Resume" on paused listing
   - Status should change to "Active"
   - Should appear in buyer marketplace again

6. **Delete Listing**
   - Click "Delete" on a listing
   - Confirm deletion
   - Listing should be removed

---

### 3️⃣ Test Orders Flow

**Path:** `/farmer/orders` and `/farmer/orders/:id`

1. **Create Order (as Buyer)**
   - Open new tab/incognito
   - Login as Buyer
   - Go to Marketplace
   - Click on farmer's listing
   - Place order (e.g., 500 kg)
   - Order should be created

2. **View Order (as Farmer)**
   - Back to Farmer tab
   - Go to Orders
   - Should see new order with "Pending" status

3. **Accept Order**
   - Click on order
   - Click "Accept Order"
   - Status should change to "Accepted"
   - Check wallet → Pending balance should increase

4. **Update Order Status**
   - Click "Mark as Pickup Scheduled"
   - Click "Mark as In Transit"
   - Click "Mark as Delivered"
   - Timeline should update
   - Check wallet → Funds should move to farmer pending

5. **Reject Order**
   - Create another order as buyer
   - As farmer, click "Reject Order"
   - Confirm rejection
   - Buyer should be refunded
   - Listing quantity should be restored

---

### 4️⃣ Test Quantity Validation

**Path:** `/farmer/listings`

1. **Create Listing with Orders**
   - Create listing (e.g., 1000 kg)
   - Have buyer place order (e.g., 500 kg)
   - Accept the order

2. **Try to Reduce Quantity**
   - Edit listing
   - Try to set quantity to 300 kg (below ordered 500 kg)
   - Should show error: "Cannot reduce quantity"
   - Should require at least 500 kg

3. **Valid Quantity Change**
   - Set quantity to 600 kg (above ordered 500 kg)
   - Should save successfully

---

### 5️⃣ Test Wallet & Withdrawals

**Path:** `/farmer/wallet`

1. **View Wallet**
   - Go to Wallet
   - Should see Available and Pending balances
   - Should see transaction history

2. **Test Withdrawal (Without KYC)**
   - If KYC not approved
   - Click "Withdraw"
   - Should see warning banner
   - Withdrawal button should be disabled

3. **Test Withdrawal (With KYC)**
   - Complete KYC (or mock approve)
   - Go to Wallet
   - Click "Withdraw"
   - Enter amount (less than available)
   - Select bank
   - Submit
   - Should create withdrawal request
   - Should see in Withdrawals tab

4. **View Transactions**
   - Check Transactions tab
   - Should see all wallet movements
   - Credits (green) and Debits (red)

---

### 6️⃣ Test Dashboard Overview

**Path:** `/farmer/dashboard`

1. **Check Stats**
   - Active Listings count
   - Total Orders count
   - Completed Orders count
   - Total Revenue

2. **Check Active Listings Preview**
   - Should show active listings with photos
   - Click to go to listings page

3. **Check Recent Orders**
   - Should show last 3 orders
   - Click to view details

4. **Check Pending Orders Alert**
   - If there are pending orders
   - Should show alert banner
   - Click "Review" to go to orders

---

## 🐛 Debugging Tips

### View All Data
Open browser console (F12) and run:
```javascript
// View all state
JSON.parse(localStorage.getItem('farmsquare_state'))

// View listings
JSON.parse(localStorage.getItem('farmsquare_state')).listings

// View orders
JSON.parse(localStorage.getItem('farmsquare_state')).orders

// View wallets
JSON.parse(localStorage.getItem('farmsquare_state')).wallets

// View KYC data
JSON.parse(localStorage.getItem('farmsquare_state')).kycData
```

### Clear Data
```javascript
// Clear all data
localStorage.removeItem('farmsquare_state')
window.location.reload()
```

### Mock KYC Approval
```javascript
const state = JSON.parse(localStorage.getItem('farmsquare_state'));
const userId = 'your_user_id'; // Get from state.currentUser.id
const kyc = state.kycData.find(k => k.userId === userId);
if (kyc) {
  kyc.status = 'APPROVED';
  localStorage.setItem('farmsquare_state', JSON.stringify(state));
  window.location.reload();
}
```

---

## ✅ Success Indicators

You'll know everything works when:
- ✅ KYC blocks withdrawals
- ✅ Listings create/edit/delete work
- ✅ Paused listings don't show to buyers
- ✅ Orders accept/reject work
- ✅ Order status updates work
- ✅ Wallet balances update automatically
- ✅ Quantity validation prevents invalid edits
- ✅ All transactions recorded
- ✅ No console errors

---

## 🚀 Ready to Test!

Open **http://localhost:8080** and start testing! 🎉





