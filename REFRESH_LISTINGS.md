# 🔄 Refresh Listings - See All Commodities

## ✅ What Was Fixed

I've added **seed listings for ALL commodities**:
- ✅ **Maize** (2 listings)
- ✅ **Cassava** (1 listing)
- ✅ **Rice** (1 listing) - NEW!
- ✅ **Yam** (1 listing) - NEW!
- ✅ **Sorghum** (1 listing) - NEW!

**Total: 6 active listings** from 3 different farmers across multiple regions.

---

## 🚀 How to See the New Listings

### Option 1: Clear Local Storage (Recommended)

**In Browser Console (F12):**
```javascript
localStorage.removeItem('farmsquare_state');
location.reload();
```

This will:
- ✅ Reset to fresh seed data
- ✅ Show all 6 listings
- ✅ Include all commodities (Maize, Cassava, Rice, Yam, Sorghum)

---

### Option 2: Manual Clear

1. Press **F12** to open Developer Tools
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Expand **Local Storage** → Click your site URL
4. Find `farmsquare_state` → Right-click → **Delete**
5. **Refresh** the page (F5)

---

## 📸 About Images

**Current Status:**
- All listings start with **empty photos arrays** (no images uploaded yet)
- **Emoji fallbacks** show automatically:
  - 🌽 Maize
  - 🌾 Rice
  - 🥔 Cassava
  - 🍠 Yam
  - 🌾 Sorghum

**To Add Real Images:**
1. Log in as a **Farmer**
2. Go to **Create Listing**
3. Upload images when creating the listing
4. Images will be stored and displayed

---

## 🎯 New Listings Added

| Commodity | Farmer | Region | Grade | Quantity | Price/kg |
|-----------|--------|--------|-------|----------|----------|
| **Rice** | Adamu Bello | Kano | A | 4,000kg | ₦850 |
| **Yam** | Hassan Musa | Benue | A | 2,500kg | ₦550 |
| **Sorghum** | Amina Usman | Sokoto | B | 3,500kg | ₦380 |
| **Maize** | Hassan Musa | Benue | B | 6,000kg | ₦420 |

---

## ✅ After Clearing

You should now see:
- **6 total listings** in the marketplace
- **All 5 commodities** represented
- **Multiple regions** (Kaduna, Kano, Benue, Sokoto)
- **Different grades** (A and B)
- **Various prices** and quantities

---

**Note:** If you created custom listings before, they will be removed when you clear localStorage. You can always create new ones!

