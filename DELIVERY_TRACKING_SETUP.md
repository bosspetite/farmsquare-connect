# Delivery Tracking Setup Guide

## Overview

FarmSquare now includes a comprehensive delivery tracking feature using Google Maps API. This allows buyers and farmers to visually track produce deliveries in real-time.

## Features

✅ **Real-time tracking** - See delivery agent location on map  
✅ **Route visualization** - View delivery route from origin to destination  
✅ **Progress tracking** - Monitor delivery progress with ETA and distance  
✅ **Mock location stream** - Simulated location updates for testing  
✅ **Backend-ready** - Easy to replace with real WebSocket/Supabase Realtime  

## Setup Instructions

### 1. Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - **Maps JavaScript API**
   - **Directions API**
4. Go to "Credentials" → "Create Credentials" → "API Key"
5. Copy your API key

### 2. Configure Environment Variable

Create a `.env` file in the project root (if it doesn't exist):

```env
VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
```

**Important:** 
- Never commit your `.env` file to version control
- The `.env` file is already in `.gitignore`
- For production, set this in your hosting platform's environment variables

### 3. Restart Development Server

After adding the API key, restart your development server:

```bash
npm run dev
```

## Usage

### For Buyers

1. Navigate to "My Orders"
2. Find an order with status "In Transit"
3. Click "Track Delivery" button
4. View the map with:
   - Origin marker (green)
   - Destination marker (red)
   - Delivery agent location (blue truck with pulsing effect)
   - Route visualization
   - ETA and distance remaining

### For Farmers

1. Navigate to "Orders"
2. Find an order with status "In Transit" or "Pickup Scheduled"
3. Click "View Delivery Progress" button
4. Monitor the delivery progress on the map

### For Agents (Testing)

1. Navigate to Agent Dashboard
2. Scroll to "Delivery Simulation" section
3. Click "Start Simulation" to begin mock location updates
4. Click "Stop Simulation" to stop
5. Use "View Tracking" to see how it appears to buyers/farmers

## Architecture

### Module Structure

```
src/modules/delivery-tracking/
├── DeliveryMap.tsx          # Google Maps component
├── DeliveryTrackingModal.tsx # Modal wrapper
├── useDeliveryTracking.ts   # React hook for tracking logic
├── mockLocationStream.ts    # Simulated location updates
└── index.ts                 # Module exports
```

### Key Components

- **DeliveryMap**: Renders Google Maps with route, markers, and live tracking
- **DeliveryTrackingModal**: Modal wrapper for tracking UI
- **useDeliveryTracking**: Hook that manages location updates and state
- **MockLocationStream**: Simulates delivery agent movement

### Replacing Mock Data with Real Backend

The architecture is designed to easily replace mock data with real backend:

**Current (Mock):**
```typescript
const stream = new MockLocationStream({ ... });
```

**Future (Real Backend):**
```typescript
// Replace with WebSocket or Supabase Realtime
const stream = new RealLocationStream({
  orderId: order.id,
  onLocationUpdate: (location) => { ... }
});
```

The `useDeliveryTracking` hook abstracts the location source, so no UI changes are needed.

## API Key Restrictions (Recommended)

For production, restrict your API key:

1. Go to Google Cloud Console → Credentials
2. Click on your API key
3. Under "Application restrictions":
   - Select "HTTP referrers (web sites)"
   - Add your domain: `https://yourdomain.com/*`
4. Under "API restrictions":
   - Select "Restrict key"
   - Choose: Maps JavaScript API, Directions API

## Troubleshooting

### Map Not Loading

- Check that `VITE_GOOGLE_MAPS_API_KEY` is set in `.env`
- Verify API key is valid in Google Cloud Console
- Ensure Maps JavaScript API and Directions API are enabled
- Check browser console for errors

### Route Not Showing

- Verify Directions API is enabled
- Check that origin and destination coordinates are valid
- Look for errors in browser console

### Location Not Updating

- Ensure order status is "InTransit"
- Check that mock location stream is running
- Verify `useDeliveryTracking` hook is properly initialized

## Testing Without API Key

The feature will still work with mock location updates, but the map will show a placeholder message. To fully test:

1. Get a Google Maps API key (free tier available)
2. Add it to `.env` file
3. Restart dev server

## Future Enhancements

- [ ] Real-time WebSocket integration
- [ ] Push notifications for delivery updates
- [ ] Delivery history map view
- [ ] Multiple delivery routes
- [ ] Driver contact information
- [ ] Delivery photo uploads














