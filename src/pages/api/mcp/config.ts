// Server config API
// src/pages/api/mcp/config.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { MCPApiClient, MCPServerConfig } from '../../../lib/mcp/api-client';

// Import your database library here (e.g., Prisma)
import { prisma } from '@/src/lib/prisma';
import { requireAuth } from '@/src/lib/api/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
    const userId = await requireAuth(req, res);
    if (!userId) return;
  
    
  
  try {
    switch (req.method) {
      case 'GET':
        // Get all MCP server configurations
          const configs = await prisma.mCPServerConfig.findMany();
        return res.status(200).json(configs);
        
      case 'POST':
        // Create new configuration
        const newConfigData = req.body;
          const newConfig = await prisma.mCPServerConfig.create({
          data: newConfigData
        });
        return res.status(201).json(newConfig);
        
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Error handling MCP config request:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}