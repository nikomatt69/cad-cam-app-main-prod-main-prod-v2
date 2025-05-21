import { lemonSqueezySetup, createCheckout } from '@lemonsqueezy/lemonsqueezy.js';



// --- Public Config ---
export const config = {
  storeId: process.env.LEMONSQUEEZY_STORE_ID!,
  plans: {
    basic: process.env.LEMONSQUEEZY_BASIC_VARIANT_ID!,
    pro: process.env.LEMONSQUEEZY_PRO_VARIANT_ID!,
    enterprise: process.env.LEMONSQUEEZY_ENTERPRISE_VARIANT_ID!,
  }
} as const;

// Ensure required public env vars are set
if (!config.plans.basic || !config.plans.pro || !config.plans.enterprise) {
  console.warn("One or more Lemon Squeezy public variant IDs are not defined. Check NEXT_PUBLIC_LEMONSQUEEZY_*_VARIANT_ID environment variables.");
  // You might throw an error here in development if required
}

// Define plan constants for internal use (using variant IDs)
export const SUBSCRIPTION_PLANS = {
  FREE: 'free',
  BASIC: process.env.NEXT_PUBLIC_LEMONSQUEEZY_BASIC_VARIANT_ID!,
  PRO: process.env.NEXT_PUBLIC_LEMONSQUEEZY_PRO_VARIANT_ID!,
  ENTERPRISE: process.env.NEXT_PUBLIC_LEMONSQUEEZY_ENTERPRISE_VARIANT_ID!,
};

// Mapping from plan name (used internally/in UI) back to Variant ID
export const LEMONSQUEEZY_PLAN_MAP: { [key: string]: string | undefined } = {
    BASIC: config.plans.basic,
    PRO: config.plans.pro,
    ENTERPRISE: config.plans.enterprise
}

// Define plan features (similar to Stripe setup)
// Use string literals for keys if needed, or ensure SUBSCRIPTION_PLANS values are treated as strings
export const PLAN_FEATURES: Record<string, any> = {
  [SUBSCRIPTION_PLANS.FREE]: {
    name: 'Free',
    price: '$0',
    features: [
      'Basic CAD functionality',
      '2 projects',
      'Limited components',
      'Community support',
    ],
    limits: {
      maxProjects: 2,
      maxComponents: 10,
      maxStorage: 100, // MB
    }
  },
  [SUBSCRIPTION_PLANS.BASIC]: {
    name: 'Basic',
    price: '$9.99', // Update with actual LS price if needed
    features: [
      'Full CAD functionality',
      '10 projects',
      'Unlimited components',
      'Email support',
      '1GB storage',
    ],
    limits: {
      maxProjects: 10,
      maxComponents: 100,
      maxStorage: 1024, // MB
    }
  },
  [SUBSCRIPTION_PLANS.PRO]: {
    name: 'Professional',
    price: '$49.99', // Update with actual LS price if needed
    features: [
      'Full CAD/CAM functionality',
      'Unlimited projects',
      'Advanced AI assistance',
      'Priority support',
      '10GB storage',
    ],
    limits: {
      maxProjects: 50,
      maxComponents: 1000,
      maxStorage: 5120, // MB
    }
  },
  [SUBSCRIPTION_PLANS.ENTERPRISE]: {
    name: 'Enterprise',
    price: '$100.00', // Update with actual LS price if needed
    features: [
      'Full CAD/CAM functionality',
      'Unlimited projects',
      'Advanced AI assistance',
      'Priority support',
      '10GB storage',
    ],
    limits: {
      maxProjects: 100,
      maxComponents: 5000,
      maxStorage: 10240, // MB
    }
  },
};

// Helper function to get plan details by variant ID
export function getPlanByVariantId(variantId: string | null | undefined) {
    if (!variantId || !PLAN_FEATURES[variantId]) { // Check if variantId exists as a key in PLAN_FEATURES
        return PLAN_FEATURES[SUBSCRIPTION_PLANS.FREE]; // Default to Free plan features
    }
    return PLAN_FEATURES[variantId]; // Directly return features for the given variantId
}

// Helper function to check if user has access (remains the same logic conceptually)
export function hasAccess(userPlanVariantId: string | null | undefined, featureLevelVariantId: string | null | undefined): boolean {
  const plansOrder = [SUBSCRIPTION_PLANS.FREE, SUBSCRIPTION_PLANS.BASIC, SUBSCRIPTION_PLANS.PRO, SUBSCRIPTION_PLANS.ENTERPRISE];

  const userPlanIndex = plansOrder.findIndex(id => id === userPlanVariantId);
  const featurePlanIndex = plansOrder.findIndex(id => id === featureLevelVariantId);

  // Handle cases where IDs might be null or 'free'
  const effectiveUserIndex = userPlanVariantId === SUBSCRIPTION_PLANS.FREE ? 0 : (userPlanIndex > -1 ? userPlanIndex : -1);
  const effectiveFeatureIndex = featureLevelVariantId === SUBSCRIPTION_PLANS.FREE ? 0 : (featurePlanIndex > -1 ? featurePlanIndex : -1);

  if (effectiveUserIndex === -1 || effectiveFeatureIndex === -1) {
      return false; // One of the plans is unknown (and not 'free')
  }

  return effectiveUserIndex >= effectiveFeatureIndex;
}

// Export the createCheckout function for potential server-side use elsewhere
export { createCheckout };
// Removed problematic type exports for now
// export type { CreateCheckoutOptions, CreateCheckoutResult }; 

console.log("LS Basic Variant ID:", process.env.NEXT_PUBLIC_LEMONSQUEEZY_BASIC_VARIANT_ID);
console.log("LS Pro Variant ID:", process.env.NEXT_PUBLIC_LEMONSQUEEZY_PRO_VARIANT_ID);
console.log("LS Enterprise Variant ID:", process.env.NEXT_PUBLIC_LEMONSQUEEZY_ENTERPRISE_VARIANT_ID);
console.log("SUBSCRIPTION_PLANS object:", SUBSCRIPTION_PLANS);
console.log("PLAN_FEATURES keys:", Object.keys(PLAN_FEATURES)); 