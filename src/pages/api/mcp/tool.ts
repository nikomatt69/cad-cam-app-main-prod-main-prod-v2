// Tool execution API
// src/pages/api/mcp/tool.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/src/lib/prisma';
import { mcpClientManager } from '@/src/lib/mcp/client'; // Import mcpClientManager
import { requireAuth } from '@/src/lib/api/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const userId = await requireAuth(req, res);
  if (!userId) return;
  
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
    
    // Handle tool execution based on server type
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
          
          const result = await newClient.callTool({
            name: toolName,
            arguments: parameters
          });
          
          return res.status(200).json(result);
        } catch (connectError) {
          console.error(`Failed to connect to SSE server ${serverId}:`, connectError);
          return res.status(500).json({ error: 'Failed to connect to SSE server' });
        }
      }
      
      try {
        const result = await client.callTool({
          name: toolName,
          arguments: parameters
        });
        
        return res.status(200).json(result);
      } catch (toolError) {
        console.error(`Failed to execute tool ${toolName} on SSE server ${serverId}:`, toolError);
        return res.status(500).json({ 
          error: toolError || 'Failed to execute tool',
          code: toolError || 'TOOL_ERROR'
        });
      }
    } else if (serverConfig.type === 'stdio') {
      // For stdio servers, use a server-side proxy
      try {
        // Call the stdio-specific tool endpoint
        const response = await fetch('/api/mcp/stdio-tool', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            serverId,
            toolName,
            parameters
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to execute tool on stdio server');
        }
        
        const resultData = await response.json();
        return res.status(200).json(resultData);
      } catch (proxyError) {
        console.error(`Failed to execute tool ${toolName} on stdio server ${serverId}:`, proxyError);
        
        // If we're in development mode, provide mock results for certain tools
        if (process.env.NODE_ENV === 'development') {
          if (toolName === 'echo' && parameters && parameters.text) {
            return res.status(200).json({
              result: parameters.text,
              timestamp: new Date().toISOString()
            });
          }
          
          if (toolName === 'execute_command' && parameters && parameters.command) {
            return res.status(200).json({
              commandExecuted: parameters.command,
              args: parameters.args || [],
              exitCode: 0,
              output: `Executed command: ${parameters.command} ${parameters.args ? parameters.args.join(' ') : ''}`,
              timestamp: new Date().toISOString()
            });
          }
        }
        
        return res.status(500).json({ 
          error: proxyError || 'Failed to execute tool on stdio server',
          code: 'STDIO_TOOL_ERROR'
        });
      }
    } else {
      return res.status(400).json({ error: `Unknown server type: ${serverConfig.type}` });
    }
  } catch (error: any) {
    console.error(`Error executing tool ${toolName} on server ${serverId}:`, error);
    return res.status(500).json({ 
      error: error.message || 'Failed to execute tool',
      code: error.code || 'INTERNAL_ERROR'
    });
  }
}