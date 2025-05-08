// Server-specific config API

// src/pages/api/mcp/config/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/src/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  
  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: 'Invalid server ID' });
  }
  
  // Add your authentication check here
  
  try {
    switch (req.method) {
      case 'GET':
        // Get a specific MCP server configuration
        const config = await prisma.mCPServerConfig.findUnique({
          where: { id }
        });
        
        if (!config) {
          return res.status(404).json({ error: 'Configuration not found' });
        }
        
        return res.status(200).json(config);
        
      case 'PUT':
        // Update a server configuration
        const updatedConfig = await prisma.mCPServerConfig.update({
          where: { id },
          data: req.body
        });
        
        return res.status(200).json(updatedConfig);
        
      case 'DELETE':
        // Delete a server configuration
        await prisma.mCPServerConfig.delete({
          where: { id }
        });
        
        return res.status(204).end();
        
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error(`Error handling MCP config/${id} request:`, error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}