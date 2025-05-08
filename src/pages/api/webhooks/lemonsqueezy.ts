import crypto from 'crypto';
import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from 'src/lib/prisma';
import getRawBody from 'raw-body';

// Disable Next.js body parsing for this route to verify the signature
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    console.error('Lemon Squeezy webhook secret is not set.');
    return res.status(500).json({ error: 'Webhook secret not configured.' });
  }

  const rawBody = await getRawBody(req);
  const hmac = crypto.createHmac('sha256', secret);
  const digest = Buffer.from(hmac.update(rawBody).digest('hex'), 'utf8');
  const signature = Buffer.from(req.headers['x-signature'] as string || '', 'utf8');

  if (!crypto.timingSafeEqual(digest, signature)) {
    console.warn('Invalid Lemon Squeezy webhook signature.');
    return res.status(400).json({ error: 'Invalid signature.' });
  }

  const event = JSON.parse(rawBody.toString());
  const eventName = event.meta.event_name;
  const subscriptionData = event.data.attributes;
  const userId = event.meta.custom_data?.userId; // Assuming you pass userId in custom data

  console.log(`Received Lemon Squeezy webhook: ${eventName}`);

  try {
    // --- TODO: Implement logic based on eventName --- 

    if (eventName === 'subscription_created' || eventName === 'subscription_updated') {
      if (!userId) {
        console.error('Missing userId in custom_data for subscription event');
        return res.status(400).json({ error: 'Missing userId' });
      }
      console.log(`Processing ${eventName} for user ${userId}`);

      // Example: Update Prisma Subscription table
      await prisma.subscription.upsert({
        where: { userId },
        create: {
          userId: userId,
          lsSubscriptionId: String(event.data.id),
          lsCustomerId: String(subscriptionData.customer_id),
          lsVariantId: String(subscriptionData.variant_id),
          plan: subscriptionData.variant_name || 'Unknown', // Or map variant_id to plan name
          status: subscriptionData.status,
          lsCurrentPeriodEnd: subscriptionData.renews_at ? new Date(subscriptionData.renews_at) : null,
          cancelAtPeriodEnd: subscriptionData.cancelled,
        },
        update: {
          lsSubscriptionId: String(event.data.id),
          lsCustomerId: String(subscriptionData.customer_id),
          lsVariantId: String(subscriptionData.variant_id),
          plan: subscriptionData.variant_name || 'Unknown', // Or map variant_id to plan name
          status: subscriptionData.status,
          lsCurrentPeriodEnd: subscriptionData.renews_at ? new Date(subscriptionData.renews_at) : null,
          cancelAtPeriodEnd: subscriptionData.cancelled,
        },
      });
      console.log(`Subscription updated for user ${userId}`);

    } else if (eventName === 'subscription_cancelled') {
        // Handle cancellation - potentially update status
        if (!userId) {
            console.error('Missing userId in custom_data for subscription cancellation event');
            // Potentially look up subscription by lsSubscriptionId if userId isn't available
            return res.status(400).json({ error: 'Missing userId' });
        }
        await prisma.subscription.updateMany({
            where: { lsSubscriptionId: String(event.data.id) }, // Or use userId if available
            data: {
                status: 'cancelled',
                cancelAtPeriodEnd: true,
            }
        });
         console.log(`Subscription cancellation processed for user ${userId || event.data.id}`);
    } else {
      console.log(`Unhandled Lemon Squeezy event: ${eventName}`);
    }

    // --- End TODO ---

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error(`Error processing Lemon Squeezy webhook ${eventName}:`, error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
} 