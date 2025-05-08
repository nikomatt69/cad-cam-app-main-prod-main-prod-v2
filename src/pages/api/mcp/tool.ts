// Tool execution API
// src/pages/api/mcp/tool.ts
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
  
  const { serverId, toolName, parameters } = req.body;
  
  if (!serverId || !toolName) {
    return res.status(400).json({ error: 'Server ID and tool name are required' });
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
      // Similar to resource.ts, handle case where server might not be connected yet.
      return res.status(404).json({ error: `MCP Server with ID ${serverId} not connected or found.` });
    }

    // Assuming callTool is the correct method on the client from mcpClientManager
    const result = await client.callTool({
      name: toolName,      // Reverted to 'name' as per SDK type definition
      arguments: parameters // Reverted to 'arguments' as per SDK type definition
    });

    return res.status(200).json(result);
  } catch (error: any) {
    console.error(`Error executing tool ${toolName} on server ${serverId}:`, error);
    return res.status(500).json({ error: error.message || 'Failed to execute tool' });
  }
}