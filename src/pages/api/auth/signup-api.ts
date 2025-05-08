// src/pages/api/auth/signup-api.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { hash } from 'bcrypt';
import { prisma } from '@/src/lib/prisma'; // Use shared prisma instance
import { sendErrorResponse, sendSuccessResponse, handleApiError } from '@/src/lib/api/auth';
// Removed PrismaClient import as we use the shared one
// Corrected import for Lemon Squeezy plans
import { SUBSCRIPTION_PLANS } from '@/src/lib/lemonsqueezy';

// Removed local prismaClient instance

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      return sendErrorResponse(res, 'Method not allowed', 405);
    }

    const { name, email, password } = req.body;
    
    // Basic validation
    if (!name || !email || !password) {
      return sendErrorResponse(res, 'Missing required fields', 400);
    }
    
    if (password.length < 8) {
      return sendErrorResponse(res, 'Password must be at least 8 characters long', 400);
    }
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      return sendErrorResponse(res, 'Email already in use', 400);
    }
    
    // Hash the password
    const hashedPassword = await hash(password, 12);
    
    // Create the user using shared prisma instance
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        // Remove explicit createdAt/updatedAt, Prisma handles defaults
      }
    });
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    // --- Create Trial Subscription --- 
    const trialEnds = new Date();
    trialEnds.setDate(trialEnds.getDate() + 7);

    // Ensure PRO plan variant ID exists before creating trial
    if (SUBSCRIPTION_PLANS.PRO) {
        await prisma.subscription.create({ // Use shared prisma instance
          data: {
            userId: user.id,
            plan: SUBSCRIPTION_PLANS.PRO, // Use PRO variant ID from LS plans
            status: 'trialing', 
            trialEndsAt: trialEnds, // *** Uncommented/Added this line ***
            // Other LS/Stripe fields default to null
          }
        });
        console.log(`Trial subscription created for user ${user.id}`);
    } else {
        console.warn('PRO plan variant ID not found in environment variables. Skipping trial creation.');
    }

    return sendSuccessResponse(res, 
      { user: userWithoutPassword }, 
      'User created successfully'
    );
  } catch (error) {
    return handleApiError(error, res);
  }
}