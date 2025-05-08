// src/pages/api/mcp/resource.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/src/lib/prisma';
// import { MCPApiClient, MCPServerConfig } from '@/src/lib/mcp/api-client'; // Assuming MCPApiClient is not needed here
import { mcpClientManager } from '@/src/lib/mcp/client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { serverId, resourceUri } = req.body;

    if (!serverId || !resourceUri) {
      return res.status(400).json({ error: 'serverId and resourceUri are required' });
    }

    const serverConfig = await prisma.mCPServerConfig.findUnique({
      where: { id: serverId }
    });

    if (!serverConfig?.enabled) {
      return res.status(400).json({ error: 'Server not available or disabled' });
    }

    const client = mcpClientManager.getServer(serverId);

    if (!client) {
      // Attempt to connect if not found (e.g. server was enabled after manager initialization)
      // This assumes serverConfig has the necessary details for connection.
      // Ensure mcpClientManager can dynamically connect or is re-initialized if configs change.
      // For simplicity, returning an error if not immediately available.
      return res.status(404).json({ error: `MCP Server with ID ${serverId} not connected or found.` });
    }
    
    // Assuming readResource is the correct method on the client from mcpClientManager
    const resource = await client.readResource({
      uri: resourceUri, // Corrected from 'id' back to 'uri' to match SDK type definition
      // accept: 'application/json' // This might be part of readResource options or handled by the server/transport
    });

    // Assuming resource.content is the structure; adjust based on actual SDK response
    return res.status(200).json(resource.content);
  } catch (error: any) {
    console.error('MCP Resource Error:', error);
    return res.status(500).json({ 
      error: error.message,
      code: error.code || 'INTERNAL_ERROR'
    });
  }
}