import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { prisma } from 'src/lib/prisma';
import stripe from 'src/lib/stripe-server';

import { requireAuth } from 'src/lib/api/auth';
import { createCheckout } from '@lemonsqueezy/lemonsqueezy.js';
import { LEMONSQUEEZY_PLAN_MAP, SUBSCRIPTION_PLANS } from '@/src/lib/lemonsqueezy';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = await requireAuth(req, res);
  if (!userId) return;
  
  // GET - Get current subscription
  if (req.method === 'GET') {
    try {
      const userSubscription = await prisma.subscription.findUnique({
        where: { userId }
      });
      
      // If no subscription record, treat as Free
      if (!userSubscription) {
        return res.status(200).json({
          plan: SUBSCRIPTION_PLANS.FREE, 
          status: 'active', // Default to active free
          periodEnd: null,
          cancelAtPeriodEnd: false
        });
      }
      
      // --- Trial Logic --- 
      if (userSubscription.status === 'trialing') {
        const now = new Date();
        const trialEnds = userSubscription.trialEndsAt ? new Date(userSubscription.trialEndsAt) : null;
        
        // Check if trial has expired
        if (trialEnds && trialEnds <= now) {
           console.log(`User ${userId} trial expired on ${trialEnds}. Reporting as FREE.`);
           // Ideally, update the DB via a cron job.
           // For now, just report as free. The DB record remains 'trialing' until updated.
           // TODO: Implement background job to update status to 'expired'/'active' (free) 
           //       and plan to FREE, and clear trialEndsAt.
           return res.status(200).json({
             plan: SUBSCRIPTION_PLANS.FREE, // Report as Free after expiry
             status: 'expired', // Report status as expired trial
             periodEnd: null, // No period end for expired trial / free
             cancelAtPeriodEnd: false
           });
        } else {
           // Trial is active, return trial details
           console.log(`User ${userId} is trialing PRO until ${trialEnds}`);
           return res.status(200).json({
             plan: userSubscription.plan, // Should be the PRO variant ID
             status: 'trialing',
             periodEnd: userSubscription.trialEndsAt, // Report trial end date
             cancelAtPeriodEnd: false // Not applicable during trial
           });
        }
      }
      // --- End Trial Logic ---
      
      // --- Regular Lemon Squeezy Subscription Logic ---
      // If status is not trialing, use LS data (assuming webhook updated it)
      if (!userSubscription.lsVariantId) {
           // If not trialing and no LS data, default to Free (edge case?)
           console.warn(`User ${userId} subscription status is ${userSubscription.status} but no lsVariantId found. Defaulting to FREE.`);
            return res.status(200).json({
                plan: SUBSCRIPTION_PLANS.FREE, 
                status: 'active',
                periodEnd: null,
                cancelAtPeriodEnd: false
            });
      }
      
      // Return details based on LS data updated by webhooks
      return res.status(200).json({
        plan: userSubscription.lsVariantId, // Return the variant ID from LS
        status: userSubscription.status, // Return the status from LS (e.g., active, cancelled, past_due)
        periodEnd: userSubscription.lsCurrentPeriodEnd, // Return billing cycle end from LS
        cancelAtPeriodEnd: userSubscription.cancelAtPeriodEnd
      });

    } catch (error) {
      console.error('Failed to fetch subscription:', error);
      return res.status(500).json({ message: 'Failed to fetch subscription' });
    }
  }
  
  // POST - Create Lemon Squeezy checkout session
  else if (req.method === 'POST') {
    try {
      const { variantId } = req.body;
      const storeId = process.env.LEMONSQUEEZY_STORE_ID;

      if (!variantId) {
        return res.status(400).json({ message: 'Missing required field: variantId' });
      }
      if (!storeId) {
        console.error('LEMONSQUEEZY_STORE_ID is not set');
        return res.status(500).json({ message: 'Server configuration error' });
      }

      // Get user data for pre-filling checkout
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Define checkout data separately
      const checkoutData = {
          email: user.email ?? undefined,
          name: user.name ?? undefined,
          custom: {
            user_id: userId,
          },
      };
      
      // Define product options with correct casing
      const productOptions = {
          redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/settings/subscription`
      };
      
      // Define checkout options
      const checkoutOptions = {
           // Add checkout options here if needed (e.g., button_color)
      }

      console.log('Creating Lemon Squeezy checkout for variant:', variantId);

      // Create Lemon Squeezy checkout - Pass options correctly
      const checkout = await createCheckout( 
          parseInt(storeId!, 10),
          parseInt(variantId, 10),
          { checkoutData, productOptions, checkoutOptions } // Pass structured options
      );

      if (!checkout.data?.data.attributes.url) {
        console.error('Lemon Squeezy checkout creation failed:', checkout.error || checkout.data);
        throw new Error('Failed to create Lemon Squeezy checkout URL');
      }

      return res.status(200).json({ url: checkout.data.data.attributes.url });
    } catch (error: any) {
      console.error('Failed to create Lemon Squeezy checkout session:', error);
      return res.status(500).json({ message: 'Failed to create checkout session' });
    }
  }
  
  else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}

function getPlanNameByVariantId(variantId: string | null): string {
    if (!variantId) return SUBSCRIPTION_PLANS.FREE;
    const entry = Object.entries(LEMONSQUEEZY_PLAN_MAP).find(([_, id]) => id === variantId);
    return entry ? entry[0] : SUBSCRIPTION_PLANS.FREE;
}