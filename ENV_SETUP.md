# Environment Variables Setup

## Required Environment Variables

Create a `.env` file in the root directory (`farmsquare-connect/.env`) with the following variables:

```env
# Google Maps API Key
# Get your API key from: https://console.cloud.google.com/
# Enable: Maps JavaScript API and Directions API
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Paystack Public Key
# Get your public key from: https://dashboard.paystack.com/#/settings/developer
# Use pk_test_... for test mode or pk_live_... for production
VITE_PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_public_key_here
```

## Setup Instructions

### Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - **Maps JavaScript API**
   - **Directions API**
4. Go to "Credentials" → "Create Credentials" → "API Key"
5. Copy your API key and add it to `.env` as `VITE_GOOGLE_MAPS_API_KEY`

### Paystack Public Key

1. Go to [Paystack Dashboard](https://dashboard.paystack.com/)
2. Navigate to Settings → Developer → API Keys
3. Copy your **Public Key** (starts with `pk_test_` for test mode or `pk_live_` for production)
4. Add it to `.env` as `VITE_PAYSTACK_PUBLIC_KEY`

## Important Notes

- Never commit your `.env` file to version control (it's already in `.gitignore`)
- For production deployments, set these variables in your hosting platform's environment settings
- Restart your development server after adding/changing environment variables

## Testing

After setting up your environment variables:

1. Restart the development server: `npm run dev`
2. Test the payment gateway by placing an order
3. Test Google Maps by viewing delivery tracking










