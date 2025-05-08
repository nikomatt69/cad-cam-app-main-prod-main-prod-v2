// Server info API

// src/pages/api/mcp/server-info.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/src/lib/prisma';
import { mcpClientManager } from '@/src/lib/mcp/client'; // Import mcpClientManager

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { serverId } = req.body;
  
  if (!serverId) {
    return res.status(400).json({ error: 'Server ID is required' });
  }
  
  try {
    // Get server configuration from database
    const serverConfig = await prisma.mCPServerConfig.findUnique({
      where: { id: serverId }
    });
    
    if (!serverConfig) {
      return res.status(404).json({ error: 'Server configuration not found' });
    }
    
    if (!serverConfig.enabled) {
      return res.status(400).json({ error: 'Server is disabled' });
    }
    
    const client = mcpClientManager.getServer(serverId);

    if (!client) {
      return res.status(404).json({ error: `MCP Server with ID ${serverId} not connected or found.` });
    }
    
    // Use getServerCapabilities as defined in MCPClient (from SDK)
    // This assumes getServerCapabilities() requires no arguments and returns the desired info.
    // Verify this against the actual SDK Client class definition.
    const info = await client.getServerCapabilities(); 
    
    // Return the server info
    return res.status(200).json(info);

  } catch (error: any) {
    console.error(`Error getting info from server ${serverId}:`, error);
    return res.status(500).json({ error: error.message || 'Failed to get server info' });
  }
}