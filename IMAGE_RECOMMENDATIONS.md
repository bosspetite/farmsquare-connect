# Farm Produce Image Recommendations for Landing Page Carousel

## Current Status
The landing page carousel currently uses 5 existing images. We need 3 more beautiful farm produce images to complete the 8-image carousel.

## Recommended Images to Add

### 1. Fresh Peppers & Onions
**File name:** `fresh-peppers-onions.jpg`
- **Description:** Close-up of vibrant red/green/yellow peppers and white/yellow onions arranged beautifully
- **Style:** Colorful, vibrant, market-fresh look
- **Recommended size:** 1920x1080px or larger (landscape)
- **Where to find:**
  - Unsplash: https://unsplash.com/s/photos/fresh-peppers-onions
  - Pexels: https://www.pexels.com/search/peppers%20onions/
  - Search terms: "fresh peppers onions vegetables Nigeria market"

### 2. Grains Harvest
**File name:** `grains-harvest.jpg`
- **Description:** Golden rice/wheat grains in traditional baskets or being harvested
- **Style:** Warm, golden tones, traditional farming aesthetic
- **Recommended size:** 1920x1080px or larger (landscape)
- **Where to find:**
  - Unsplash: https://unsplash.com/s/photos/rice-grains
  - Pexels: https://www.pexels.com/search/rice%20grains/
  - Search terms: "rice grains harvest Nigeria basket"

### 3. Vegetables Market
**File name:** `vegetables-market.jpg`
- **Description:** Colorful array of fresh vegetables (okra, eggplant, leafy greens, etc.) in market setting
- **Style:** Market scene, vibrant colors, authentic Nigerian market feel
- **Recommended size:** 1920x1080px or larger (landscape)
- **Where to find:**
  - Pixabay: https://pixabay.com/images/search/vegetables/
  - Unsplash: https://unsplash.com/s/photos/fresh-vegetables-market
  - Search terms: "fresh vegetables market Nigeria farm"

## How to Add Images

1. Download the 3 images from the recommended sources above
2. Save them in: `farmsquare-connect/src/assets/`
3. Update `LandingPage.tsx`:
   - Add imports at the top:
     ```typescript
     import freshPeppersImg from '@/assets/fresh-peppers-onions.jpg';
     import grainsHarvestImg from '@/assets/grains-harvest.jpg';
     import vegetablesMarketImg from '@/assets/vegetables-market.jpg';
     ```
   - Replace the temporary image references in the `carouselImages` array (last 3 items)

## Image Quality Guidelines
- High resolution (at least 1920x1080px)
- Landscape orientation preferred
- Good lighting and vibrant colors
- Authentic Nigerian agricultural context when possible
- Professional quality (not blurry or pixelated)















