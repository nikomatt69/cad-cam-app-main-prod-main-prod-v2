import Link from 'next/link';
import React from 'react';
import { useSubscription } from '@/src/contexts/SubscriptionContext';
import { SUBSCRIPTION_PLANS } from '@/src/lib/lemonsqueezy';

export default function SubscriptionSettings() {
  const { 
    plan, 
    status, 
    periodEnd, 
    cancelAtPeriodEnd,
    isLoading,
    features,
    createBillingPortalSession,
  } = useSubscription();
  
  // Format date for display
  const formattedPeriodEnd = periodEnd 
    ? new Date(periodEnd).toLocaleDateString('en-US', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      })
    : null;
  
  // New logic for button visibility
  const isTrialing = status === 'trialing';
  // User is on the actual free plan if their plan is FREE and they are not currently trialing a paid plan.
  const isOnActualFreePlan = plan === SUBSCRIPTION_PLANS.FREE && !isTrialing;

  const showUpgradeLink = isOnActualFreePlan || isTrialing;
  const showManageBillingButton = plan !== SUBSCRIPTION_PLANS.FREE && !isTrialing;
  
  // Handle manage billing button click
  const handleManageBilling = async () => {
    await createBillingPortalSession();
  };
  
  if (isLoading) {
    return (
      <div className="rounded-lg bg-white shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 shadow  rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
          Subscription
        </h3>
        
        <div className="mt-5 border-t border-gray-200 dark:border-gray-700 pt-5">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Plan</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">{features?.name || 'Free'}</dd>
            </div>
            
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</dt>
              <dd className="mt-1 text-sm text-gray-900 capitalize dark:text-gray-400">
                {cancelAtPeriodEnd ? 'Cancelled' : status}
              </dd>
            </div>
            
            {status === 'trialing' && (
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Trial Ends On</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-400">
                  {formattedPeriodEnd || 'N/A'}
                </dd>
              </div>
            )}
            
            {plan !== SUBSCRIPTION_PLANS.FREE && features?.price && (
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Price</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-gray-400">{features.price}/month</dd>
                  </div>
            )}
            
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Features</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-400">
                <ul className="list-disc pl-5 space-y-1">
                  {features.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </dd>
            </div>
            
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Limits</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-400">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Projects: {features.limits.maxProjects === -1 ? 'Unlimited' : features.limits.maxProjects}</li>
                  <li>Components: {features.limits.maxComponents === -1 ? 'Unlimited' : features.limits.maxComponents}</li>
                  <li>Storage: {features.limits.maxStorage / 1024} GB</li>
                </ul>
              </dd>
            </div>
          </dl>
        </div>
        
        <div className="mt-8 flex justify-end">
          {showManageBillingButton && (
            <button
              type="button"
              onClick={handleManageBilling}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Manage Billing
            </button>
          )}
              
          {showUpgradeLink && (
            <Link
              href="/pricing"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Upgrade Plan
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}