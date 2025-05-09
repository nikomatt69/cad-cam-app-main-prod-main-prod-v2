// src/lib/nextAuthConfig.ts
import { NextAuthOptions, UserRole } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './prisma';
import { compare } from 'bcrypt';
import jwt from 'jsonwebtoken';
// Function to generate a minimal WebSocket token
export const generateWebSocketToken = (userId: string): string => {
  return jwt.sign(
    { sub: userId },
    process.env.NEXTAUTH_SECRET || process.env.NEXTAUTH_SECRET!,
    { expiresIn: '24h' }
  );
};

// Force HTTP in dev environment
const isDevEnvironment = process.env.NODE_ENV === 'development';
const baseUrl = isDevEnvironment ? 'http://localhost:3000' : process.env.NEXTAUTH_URL;

export const nextAuthConfig: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password required');
        }
        
        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          },
          include: {
            organizations: {
              select: {
                organizationId: true,
                role: true
              }
            }
          }
        });
        
        if (!user || !user.password) {
          throw new Error('No user found with this email');
        }
        
        const isValid = await compare(credentials.password, user.password);
        
        if (!isValid) {
          throw new Error('Invalid password');
        }
        
        // Estrai i ruoli dagli organigrammi e converti in minuscolo
        const roles = user.organizations.map(org => org.role.toLowerCase());
        // Ruolo di default se non ci sono organizzazioni
        if (roles.length === 0) {
          roles.push("admin");
        }
        
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          roles: roles.map(r => r as import("next-auth").UserRole)
        };
      }
    }),
  ],
  
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.roles = user.roles;
      }
      return token;
    },
    
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        // Ensure session.user object has proper structure
        if (!session.user.id) {
          session.user.id = token.id as string;
        }
        
        // Add roles to session if available
        if (token.roles) {
          session.user.roles = token.roles as UserRole[];
        }
      }
      return session;
    },
  },
  
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};