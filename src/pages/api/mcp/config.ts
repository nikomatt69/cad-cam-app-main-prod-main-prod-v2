// Server config API
// src/pages/api/mcp/config.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { MCPApiClient } from '../../../lib/mcp/api-client';
import { MCPServerConfig, MCPSseConfig, MCPStdioServerConfig } from '../../../lib/mcp/client';

// Import your database library here (e.g., Prisma)
import { prisma } from '@/src/lib/prisma';
import { requireAuth } from '@/src/lib/api/auth';
import { mcpClientManager } from '@/src/lib/mcp/client';

// Validate the server config data based on type
function validateServerConfig(data: any): { isValid: boolean; error?: string } {
  // Common validations
  if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
    return { isValid: false, error: 'Server name is required' };
  }
  
  if (!data.type || (data.type !== 'sse' && data.type !== 'stdio')) {
    return { isValid: false, error: 'Server type must be either "sse" or "stdio"' };
  }
  
  // Type-specific validations
  if (data.type === 'sse') {
    if (!data.url || typeof data.url !== 'string' || data.url.trim() === '') {
      return { isValid: false, error: 'URL is required for SSE servers' };
    }
  } else if (data.type === 'stdio') {
    if (!data.command || typeof data.command !== 'string' || data.command.trim() === '') {
      return { isValid: false, error: 'Command is required for stdio servers' };
    }
    
    // Ensure args is properly formatted if present
    if (data.args && !Array.isArray(data.args)) {
      return { isValid: false, error: 'Arguments must be an array of strings' };
    }
  }
  
  return { isValid: true };
}

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
        
        // Validate the configuration
        const validation = validateServerConfig(newConfigData);
        if (!validation.isValid) {
          return res.status(400).json({ error: validation.error });
        }
        
        // Process the data before saving
        let dataToSave: any = {
          name: newConfigData.name,
          type: newConfigData.type,
          enabled: newConfigData.enabled !== false, // Default to true if not specified
          userId: userId // Associate with the current user
        };
        
        // Add type-specific fields
        if (newConfigData.type === 'sse') {
          dataToSave.url = newConfigData.url;
        } else if (newConfigData.type === 'stdio') {
          dataToSave.command = newConfigData.command;
          
          if (newConfigData.args) {
            dataToSave.args = newConfigData.args; // Should be already an array from validation
          }
          
          if (newConfigData.workingDirectory) {
            dataToSave.workingDirectory = newConfigData.workingDirectory;
          }
        }
        
        // Save to database
        const newConfig = await prisma.mCPServerConfig.create({
          data: dataToSave
        });
        
        // If enabled, try to connect the server
        if (newConfig.enabled) {
          // Convert DB model to MCPServerConfig
          const serverConfig: MCPServerConfig = newConfig.type === 'sse' 
            ? {
                id: newConfig.id,
                name: newConfig.name,
                type: 'sse',
                url: newConfig.url as string,
                enabled: newConfig.enabled
              } as MCPSseConfig
            : {
                id: newConfig.id,
                name: newConfig.name,
                type: 'stdio',
                command: newConfig.command as string,
                args: (newConfig.args as string[] | undefined) || [],
                workingDirectory: newConfig.workingDirectory as string | undefined,
                enabled: newConfig.enabled
              } as MCPStdioServerConfig;
          
          // Connect the server
          await mcpClientManager.connectServer(serverConfig);
        }
        
        return res.status(201).json(newConfig);
        
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Error handling MCP config request:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}