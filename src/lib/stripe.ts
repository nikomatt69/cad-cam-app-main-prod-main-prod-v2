import { NextApiRequest, NextApiResponse } from 'next';

export const config = {
  stripe: {
    basicPlanId: process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID,
    proPlanId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
    enterprisePlanId: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID,
  }
} as const;

if (!config.stripe.basicPlanId) {
  throw new Error("Stripe Basic Price ID is not defined. Please set NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID in your environment variables.");
}
if (!config.stripe.proPlanId) {
  throw new Error("Stripe Pro Price ID is not defined. Please set NEXT_PUBLIC_STRIPE_PRO_PRICE_ID in your environment variables.");
}
if (!config.stripe.enterprisePlanId) {
  throw new Error("Stripe Enterprise Price ID is not defined. Please set NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID in your environment variables.");
}

// Price IDs for your subscription plans - Use PUBLIC Price IDs here for client-side reference if needed
export const SUBSCRIPTION_PLANS = {
  FREE: 'free',
  BASIC: config.stripe.basicPlanId,
  PRO: config.stripe.proPlanId,
  ENTERPRISE: config.stripe.enterprisePlanId,
};

// Features available in each plan
export const PLAN_FEATURES = {
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
    price: '$9.99',
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
    price: '$49.99',
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
    price: '$100.00',
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

// Helper function to get plan by price ID
export function getPlanByPriceId(priceId: string) {
  const entry = Object.entries(SUBSCRIPTION_PLANS).find(([_, id]) => id === priceId);
  return entry ? entry[0] : null;
}

// Helper function to check if user has access to a feature
export function hasAccess(userPlan: string, featureLevel: string) {
  const plans = Object.keys(SUBSCRIPTION_PLANS);
  const userPlanIndex = plans.indexOf(userPlan);
  const featurePlanIndex = plans.indexOf(featureLevel);
  
  return userPlanIndex >= featurePlanIndex;
}
