// Server info API

// src/pages/api/mcp/server-info.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/src/lib/prisma';
import { mcpClientManager } from '@/src/lib/mcp/client'; // Import mcpClientManager
import { requireAuth } from '@/src/lib/api/auth';

interface ServerCapabilities {
  name?: string;
  version?: string;
  instructions?: string;
  resources?: { [x: string]: unknown; listChanged?: boolean | undefined; subscribe?: boolean | undefined; };
  tools?: { [x: string]: unknown; listChanged?: boolean | undefined; };
}

// Add default filesystem tools and resources for development
function addDefaultTools(info: ServerCapabilities): ServerCapabilities {
  if (process.env.NODE_ENV === 'development') {
    info.tools = {
      readFile: {
        name: 'readFile',
        description: 'Read a file from the filesystem',
        parameters: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Path to the file'
            },
            encoding: {
              type: 'string',
              description: 'File encoding (default: utf8)'
            }
          },
          required: ['path']
        }
      },
      writeFile: {
        name: 'writeFile',
        description: 'Write a file to the filesystem',
        parameters: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Path to the file'
            },
            content: {
              type: 'string',
              description: 'Content to write'
            },
            encoding: {
              type: 'string',
              description: 'File encoding (default: utf8)'
            }
          },
          required: ['path', 'content']
        }
      },
      listFiles: {
        name: 'listFiles',
        description: 'List files in a directory',
        parameters: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Path to the directory'
            }
          },
          required: ['path']
        }
      }
    };
    
    info.resources = {
      Directory: {
        name: 'Directory',
        description: 'Directory contents',
        uriTemplate: 'resource://directory/{path}'
      },
      File: {
        name: 'File',
        description: 'File contents',
        uriTemplate: 'resource://file/{path}'
      },
      Status: {
        name: 'Status',
        description: 'Server status information',
        uriTemplate: 'resource://status'
      }
    };
  }
  
  return info;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Check if authentication is required based on environment

    const userId = await requireAuth(req, res);
    if (!userId) return;


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
    
    let info: ServerCapabilities;
    
    // Handle differently based on server type
    if (serverConfig.type === 'sse') {
      // For SSE servers, get capabilities from the client
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
          
          const capabilities = await newClient.getServerCapabilities();
          if (!capabilities) {
            throw new Error('getServerCapabilities returned undefined');
          }
          info = capabilities;
        } catch (connectError) {
          console.error(`Failed to connect to SSE server ${serverId}:`, connectError);
          return res.status(500).json({ error: 'Failed to connect to SSE server' });
        }
      } else {
        // Get capabilities from existing client
        try {
          const capabilities = await client.getServerCapabilities();
          if (!capabilities) {
            throw new Error('getServerCapabilities returned undefined');
          }
          info = capabilities;
        } catch (capabilitiesError) {
          console.error(`Failed to get capabilities from SSE server ${serverId}:`, capabilitiesError);
          return res.status(500).json({ error: 'Failed to get server capabilities' });
        }
      }
    } else if (serverConfig.type === 'stdio') {
      // For stdio servers, get capabilities through server-side proxy
      try {
        // Call the stdio-specific endpoint to get server information
        // Force HTTP for localhost
        const host = req.headers.host || 'localhost:3000';
        let baseUrl = process.env.NODE_ENV === 'development' 
          ? `http://${host}` 
          : (process.env.NEXTAUTH_URL || `https://${host}`);
        
        // Ensure baseUrl doesn't end with a slash
        baseUrl = baseUrl.replace(/\/$/, '');
        
        const capabilitiesUrl = `${baseUrl}/api/mcp/stdio-server-capabilities`;
        
        console.log('Fetching capabilities from:', capabilitiesUrl);
        
        const response = await fetch(capabilitiesUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ serverId }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to get stdio server capabilities');
        }
        
        info = await response.json();
      } catch (proxyError) {  
        // If proxy call fails, provide a default set of capabilities based on the server config
        console.warn(`Using default capabilities for stdio server ${serverId}:`, proxyError);
        
        // Create a basic info structure for stdio servers when proxy fails
        info = {
          name: serverConfig.name,
          version: '1.0.0',
          instructions: 'stdio server capabilities could not be retrieved. Using default configuration.',
          resources: {},
          tools: {}
        };
        
        // Add default tools and resources
        info = addDefaultTools(info);
      }
    } else {
      return res.status(400).json({ error: `Unknown server type: ${serverConfig.type}` });
    }
    
    // Return the server info
    return res.status(200).json(info);

  } catch (error: any) {
    console.error(`Error getting info from server ${serverId}:`, error);
    return res.status(500).json({ error: error.message || 'Failed to get server info' });
  }
}