import Stripe from 'stripe';

const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey) {
  // Throw error only in development/build time, avoid crashing production server if env var is momentarily unavailable.
  // Consider more robust error handling or logging here for production.
  if (process.env.NODE_ENV !== 'production') {
    throw new Error("Stripe secret key is not defined. Please set STRIPE_SECRET_KEY in your environment variables.");
  }
  console.error("Stripe secret key is not defined.");
}

// Initialize Stripe instance - use a default dummy key if the real key is missing in production to avoid crashes
// You might want a stricter approach depending on your needs.
const stripe = new Stripe(secretKey || '', {
  apiVersion: '2025-02-24.acacia', // Use the expected API version
  typescript: true,
});

export default stripe; 