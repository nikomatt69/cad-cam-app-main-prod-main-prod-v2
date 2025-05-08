// src/pages/api/graphql.ts
import { ApolloServer } from 'apollo-server-micro';
import { NextApiRequest, NextApiResponse } from 'next';
import Cors from 'micro-cors';
import { typeDefs } from '@/src/graphql/graphql-schema';
import { resolvers } from '@/src/graphql/graphql-resolvers';
import { getSession } from 'next-auth/react';
import { getToken } from 'next-auth/jwt';
import { requireAuth } from '@/src/lib/api/auth';
import { PrismaClient } from '@prisma/client';

// Initialize Prisma Client
const prisma = new PrismaClient();

// Setup CORS
const cors = Cors({
  allowMethods: ['POST', 'OPTIONS', 'GET', 'HEAD'],
  allowHeaders: ['X-Requested-With', 'Content-Type', 'Authorization', 'Accept'],
});

const secret = process.env.NEXTAUTH_SECRET;
if (!secret) {
  console.error("FATAL_ERROR: NEXTAUTH_SECRET is not defined.");
  // Avoid throwing in production, but ensure it's logged prominently
  if (process.env.NODE_ENV !== 'production') {
    throw new Error("NEXTAUTH_SECRET is not defined. Please set NEXTAUTH_SECRET in your environment variables.");
  }
}

// Apollo Server configuration
const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: process.env.NODE_ENV !== 'production',
  context: async ({ req }) => {
    // Get JWT token for user ID and potentially other details
    const token = await getToken({ req, secret });
    // Get session data if needed by some resolvers (might be redundant if only userId is needed)
    const session = await getSession({ req });

    return { 
      req,
      prisma,
      userId: token?.sub || null,
      token: token || null,
      session: session || null,
    };
  },
});

// Start the Apollo Server - Do this once outside the handler
const startServerPromise = apolloServer.start();

// Disable Next.js body parsing, required for Apollo Server
export const config = {
  api: {
    bodyParser: false,
  },
};

// API handler logic
async function graphqlHandler(req: NextApiRequest, res: NextApiResponse) {
  // Wait for Apollo Server to start *first*
  await startServerPromise;

  // --- Authentication Check --- 
  // requireAuth checks if a valid token exists and returns userId or sends 401
  const userId = await requireAuth(req, res); 
  if (!userId) {
    // requireAuth already handled the response if auth failed
    return; 
  }
  // If we reach here, the user is authenticated.
  // The actual userId is made available to resolvers via the context function.
  // --- End Authentication Check ---
  
  // createHandler will handle OPTIONS internally if needed, but explicit check is fine
  if (req.method === 'OPTIONS') {
    res.end();
    return;
  }
  
  try {
    // Let Apollo Server handle the GraphQL request
    await apolloServer.createHandler({
      path: '/api/graphql',
    })(req, res);
  } catch (error) {
    console.error('Error in GraphQL handler:', error);
    // Ensure response isn't sent twice
    if (!res.headersSent) {
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
}

// Export the handler wrapped in CORS middleware
export default cors(graphqlHandler as any); // Use `as any` if CORS type conflicts arise

