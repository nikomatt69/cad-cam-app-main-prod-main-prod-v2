import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { PLAN_FEATURES, SUBSCRIPTION_PLANS, getPlanByVariantId, hasAccess } from '@/src/lib/lemonsqueezy';
import axios from 'axios';

interface SubscriptionContextType {
  plan: string;
  status: string;
  periodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  isLoading: boolean;
  error: string | null;
  features: {
    name: string;
    price: string;
    features: string[];
    limits: {
      maxProjects: number;
      maxComponents: number;
      maxStorage: number;
    };
  };
  canAccess: (featureLevelVariantId: string) => boolean;
  createCheckoutSession: (variantId: string) => Promise<void>;
  createBillingPortalSession: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { data: session, status: sessionStatus } = useSession();
  const [plan, setPlan] = useState<string>(SUBSCRIPTION_PLANS.FREE);
  const [status, setStatus] = useState<string>('active');
  const [periodEnd, setPeriodEnd] = useState<Date | null>(null);
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load subscription data when session is available
  useEffect(() => {
    async function loadSubscriptionData() {
      if (sessionStatus === 'loading') return;
      if (!session) {
        setPlan(SUBSCRIPTION_PLANS.FREE);
        setStatus('active');
        setPeriodEnd(null);
        setCancelAtPeriodEnd(false);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const { data } = await axios.get('/api/subscriptions');
        setPlan(data.plan);
        setStatus(data.status);
        setPeriodEnd(data.periodEnd ? new Date(data.periodEnd) : null);
        setCancelAtPeriodEnd(data.cancelAtPeriodEnd);
      } catch (err: any) {
        console.error("Failed to load subscription data:", err);
        setError(err.response?.data?.message || err.message || 'Failed to load subscription data');
        setPlan(SUBSCRIPTION_PLANS.FREE);
        setStatus('active');
      } finally {
        setIsLoading(false);
      }
    }

    loadSubscriptionData();
  }, [session, sessionStatus]);

  // Check if user can access a feature based on their plan
  const canAccess = (featureLevelVariantId: string) => {
    return hasAccess(plan, featureLevelVariantId);
  };

  // Create a checkout session
  const createCheckoutSession = async (variantId: string): Promise<void> => {
    console.log('Creating Lemon Squeezy checkout for variantId:', variantId);
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ variantId }),
      });

      if (!response.ok) {
         const errorData = await response.json();
         throw new Error(errorData.message || 'Failed to create checkout session');
      }

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
         throw new Error('No checkout URL received');
      }
    } catch (err: any) {
      console.error("Checkout session creation failed:", err);
      setError(err.message || 'Failed to initiate checkout');
      setIsLoading(false);
    }
  };

  // Create a billing portal session
  const createBillingPortalSession = async (): Promise<void> => {
    const portalUrl = `https://${process.env.LEMONSQUEEZY_STORE_DOMAIN || 'cadcamfun.lemonsqueezy.com'}/billing`;
    console.log('Redirecting to Lemon Squeezy billing portal:', portalUrl);
    window.location.href = portalUrl;
    return Promise.resolve();
  };

  // Get features for current plan
  const features = getPlanByVariantId(plan);

  return (
    <SubscriptionContext.Provider
      value={{
        plan,
        status,
        periodEnd,
        cancelAtPeriodEnd,
        isLoading,
        error,
        features,
        canAccess,
        createCheckoutSession,
        createBillingPortalSession,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}