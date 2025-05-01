// src/pages/api/graphql.ts
import { ApolloServer } from 'apollo-server-micro';
import { NextApiRequest, NextApiResponse } from 'next';
import Cors from 'micro-cors';
import { typeDefs } from 'src/graphql/graphql-schema';
import { resolvers } from 'src/graphql/graphql-resolvers';
import { getSession } from 'next-auth/react';
import { getToken } from 'next-auth/jwt';

// Setup CORS
const cors = Cors({
  allowMethods: ['POST', 'OPTIONS', 'GET', 'HEAD'],
  allowHeaders: ['X-Requested-With', 'Content-Type', 'Authorization'],
});

// Apollo Server configuration
const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: process.env.NODE_ENV !== 'production',
  context: async ({ req }) => {
    // Get authentication token from request
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const session = await getSession({ req });

    return { 
      token,
      session,
      userId: token?.sub || null,
    };
  },
});

// Start the Apollo Server
const startServer = apolloServer.start();

// Disable Next.js body parsing
export const config = {
  api: {
    bodyParser: false,
  },
};

// API handler
async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Wait for Apollo Server to start
  await startServer;
  
  // Check for preflight request
  if (req.method === 'OPTIONS') {
    res.end();
    return false;
  }
  
  // Handle request
  await apolloServer.createHandler({
    path: '/api/graphql',
  })(req, res);
}

// Export handler with CORS
export default cors(handler as any);
