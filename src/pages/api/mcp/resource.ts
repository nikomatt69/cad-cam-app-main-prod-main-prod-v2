// src/pages/api/mcp/resource.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/src/lib/prisma';
import { mcpClientManager } from '@/src/lib/mcp/client';
import { requireAuth } from '@/src/lib/api/auth';
import { error } from 'console';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const userId = await requireAuth(req, res);
  if (!userId) return;
  
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

    if (!serverConfig) {
      return res.status(404).json({ error: 'Server configuration not found' });
    }

    if (!serverConfig.enabled) {
      return res.status(400).json({ error: 'Server is disabled' });
    }

    // Handle resource fetching based on server type
    if (serverConfig.type === 'sse') {
      // For SSE servers, use the client directly
      const client = mcpClientManager.getServer(serverId);

      if (!client) {
        // Try to connect if not already connected
        try {
          await mcpClientManager.connectServer({
            id: serverConfig.id,
            name: serverConfig.name,
            type: 'sse',
            url: serverConfig.url as string,
            enabled: true
          });
          
          const newClient = mcpClientManager.getServer(serverId);
          if (!newClient) {
            return res.status(500).json({ error: 'Failed to connect to SSE server' });
          }
          
          const resource = await newClient.readResource({
            uri: resourceUri
          });
          
          return res.status(200).json(resource.content);
        } catch (connectError) {
          console.error(`Failed to connect to SSE server ${serverId}:`, connectError);
          return res.status(500).json({ error: 'Failed to connect to SSE server' });
        }
      }
      
      try {
        const resource = await client.readResource({
          uri: resourceUri
        });
        
        return res.status(200).json(resource.content);
      } catch (resourceError) {
        console.error(`Failed to read resource ${resourceUri} from SSE server ${serverId}:`, resourceError);
        return res.status(500).json({ 
          error: error || 'Failed to read resource',
          code: error || 'RESOURCE_ERROR'
        });
      }
    } else if (serverConfig.type === 'stdio') {
      // For stdio servers, use a server-side proxy
      try {
        // Call the stdio-specific resource endpoint
        const response = await fetch('/api/mcp/stdio-resource', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            serverId,
            resourceUri
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to read resource from stdio server');
        }
        
        const resourceData = await response.json();
        return res.status(200).json(resourceData);
      } catch (proxyError) {
        console.error(`Failed to read resource ${resourceUri} from stdio server ${serverId}:`, proxyError);
        
        // If we're in development mode, provide some mock data
        if (process.env.NODE_ENV === 'development' && resourceUri === 'resource://status') {
          return res.status(200).json({
            status: 'running',
            uptime: Math.floor(Math.random() * 100000),
            pid: Math.floor(Math.random() * 10000),
            memoryUsage: {
              rss: Math.floor(Math.random() * 1000000),
              heapTotal: Math.floor(Math.random() * 500000),
              heapUsed: Math.floor(Math.random() * 400000)
            }
          });
        }
        
        return res.status(500).json({ 
          error: proxyError || 'Failed to read resource from stdio server',
          code: 'STDIO_RESOURCE_ERROR'
        });
      }
    } else {
      return res.status(400).json({ error: `Unknown server type: ${serverConfig.type}` });
    }
  } catch (error: any) {
    console.error('MCP Resource Error:', error);
    return res.status(500).json({ 
      error: error.message || 'Unknown error',
      code: error.code || 'INTERNAL_ERROR'
    });
  }
}