// Stdio server capabilities endpoint
import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/src/lib/prisma';
import { requireAuth } from '@/src/lib/api/auth';
import { stdioProcessManager } from '@/src/server/mcp/StdioProcessManager';
import { filesystemServerManager } from '@/src/server/mcp/FilesystemServerAdapter';

// Define simple interfaces for Tool and Resource structure
interface Tool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: { [key: string]: any }; // Allow any properties for now
    required: string[];
  };
}

interface Resource {
  name: string;
  description: string;
  uriTemplate: string;
}

// This endpoint communicates with the stdio server process manager to get capabilities
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  let serverIdForLogging: string | undefined = undefined;

  try {
    if (process.env.SKIP_AUTH !== 'true') {
      const userId = await requireAuth(req, res);
      if (!userId) return;
    }
    
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    const { serverId } = req.body;
    serverIdForLogging = serverId; // Assign for potential use in outer catch
    
    if (!serverId) {
      return res.status(400).json({ error: 'Server ID is required' });
    }
  
    // Inner try for the main logic
    try {
      const serverConfig = await prisma.mCPServerConfig.findUnique({
        where: { id: serverId }
      });
      
      if (!serverConfig) {
        return res.status(404).json({ error: 'Server configuration not found' });
      }
      
      if (!serverConfig.enabled) {
        return res.status(400).json({ error: 'Server is disabled' });
      }
      
      if (serverConfig.type !== 'stdio') {
        return res.status(400).json({ error: 'Server is not a stdio server' });
      }
      
      const isFilesystemServer = (
        typeof serverConfig.command === 'string' && 
        serverConfig.command.includes('modelcontextprotocol/server-filesystem')
      );
      
      if (isFilesystemServer) {
        try {
          const serverPath = typeof serverConfig.command === 'string' ? 
            serverConfig.command.replace(/^npx\s+/, '') : 
            '@modelcontextprotocol/server-filesystem';
          const workingDir = serverConfig.workingDirectory as string || process.cwd();
          await filesystemServerManager.startServer(serverId, serverPath, workingDir);
          const server = await filesystemServerManager.getServer(serverId, serverPath, workingDir);
          const capabilities = await server.getCapabilities();
          return res.status(200).json(capabilities);
        } catch (fsError: any) {
          console.error(`Error with filesystem server ${serverId}:`, fsError);
          return res.status(500).json({
            error: 'Filesystem server operation failed',
            details: fsError.message || 'Unknown error from filesystem server adapter'
          });
        }
      }
      
      if (!stdioProcessManager.isProcessRunning(serverId)) {
        const started = await stdioProcessManager.startProcess({
          id: serverConfig.id,
          name: serverConfig.name,
          type: 'stdio',
          command: serverConfig.command as string,
          args: serverConfig.args as string[] | undefined,
          workingDirectory: serverConfig.workingDirectory as string | undefined,
          enabled: true
        });
        if (!started) {
          return res.status(500).json({ error: 'Failed to start stdio server process' });
        }
      }
      
      try {
        const capabilities = await stdioProcessManager.getServerCapabilities(serverId);
        return res.status(200).json(capabilities);
      } catch (capabilitiesError: any) {
        console.error(`Error getting capabilities from stdio server ${serverId}:`, capabilitiesError);
        const defaultCapabilities: {
          name: string;
          version: string;
          instructions: string;
          resources: Resource[];
          tools: Tool[];
        } = {
          name: serverConfig.name,
          version: '1.0.0',
          instructions: 'Error retrieving capabilities: ' + capabilitiesError.message,
          resources: [{ name: 'Status', description: 'Server status information', uriTemplate: 'resource://status' }],
          tools: [{ name: 'echo', description: 'Echo the input back to the output', parameters: { type: 'object', properties: { text: { type: 'string', description: 'Text to echo' } }, required: ['text'] } }]
        };
        return res.status(200).json(defaultCapabilities);
      }
    } catch (innerError: any) {
      // This catch is for errors within the main logic block (after serverId is defined)
      console.error(`Error processing stdio server capabilities for ${serverId}:`, innerError);
      return res.status(500).json({ error: innerError.message || 'Failed to process server capabilities' });
    }
  } catch (error: any) { // This catch corresponds to the outer try
    const idForLog = typeof serverIdForLogging === 'string' ? serverIdForLogging : 'unknown_server (error before ID extraction)';
    console.error(`Outer error in stdio-server-capabilities for ${idForLog}:`, error);
    return res.status(500).json({ error: error.message || 'An unexpected error occurred' });
  }
}
