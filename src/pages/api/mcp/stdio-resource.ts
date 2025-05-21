// Stdio server resource handler
import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/src/lib/prisma';
import { requireAuth } from '@/src/lib/api/auth';
import { stdioProcessManager } from '@/src/server/mcp/StdioProcessManager';
import { filesystemServerManager } from '@/src/server/mcp/FilesystemServerAdapter';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const userId = await requireAuth(req, res);
  if (!userId) return;
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { serverId, resourceUri } = req.body;
  
  if (!serverId || !resourceUri) {
    return res.status(400).json({ error: 'serverId and resourceUri are required' });
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
    
    if (serverConfig.type !== 'stdio') {
      return res.status(400).json({ error: 'Server is not a stdio server' });
    }
    
    // Check if this is a filesystem server
    const isFilesystemServer = (
      typeof serverConfig.command === 'string' && 
      serverConfig.command.includes('modelcontextprotocol/server-filesystem')
    );
    
    if (isFilesystemServer) {
      // Use the specialized filesystem server adapter
      try {
        // Extract server path from command
        const serverPath = typeof serverConfig.command === 'string' ? 
          serverConfig.command.replace(/^npx\s+/, '') : 
          '@modelcontextprotocol/server-filesystem';
        
        const workingDir = serverConfig.workingDirectory as string || process.cwd();
        
        // Get server instance (starting it if needed)
        const server = await filesystemServerManager.getServer(
          serverId, 
          serverPath, 
          workingDir
        );
        
        if (!server.isRunning()) {
          await server.start();
        }
        
        // Read resource
        const resourceData = await server.readResource(resourceUri);
        return res.status(200).json(resourceData);
      } catch (fsError) {
        console.error(`Error reading resource from filesystem server ${serverId}:`, fsError);
        throw fsError;
      }
    }
    
    // For regular stdio servers, use the standard process manager
    // Check if the process is running, start it if not
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
    
    // Read resource from the process manager
    try {
      const resourceData = await stdioProcessManager.readResource(serverId, resourceUri);
      return res.status(200).json(resourceData);
    } catch (resourceError: any) {
      console.error(`Error reading resource from stdio server ${serverId}:`, resourceError);
      
      // For development, return mock data based on the resource URI
      if (process.env.NODE_ENV === 'development') {
        if (resourceUri === 'resource://status') {
          return res.status(200).json({
            status: 'running',
            uptime: 12345,
            pid: 1234,
            startTime: new Date().toISOString(),
            memoryUsage: {
              rss: 123456789,
              heapTotal: 98765432,
              heapUsed: 45678901
            }
          });
        } else if (resourceUri.startsWith('resource://users')) {
          return res.status(200).json([
            { id: 1, name: 'User 1', email: 'user1@example.com' },
            { id: 2, name: 'User 2', email: 'user2@example.com' },
            { id: 3, name: 'User 3', email: 'user3@example.com' }
          ]);
        }
      }
      
      return res.status(404).json({ 
        error: `Resource not found or error reading resource: ${resourceError.message}`, 
        resourceUri 
      });
    }
  } catch (error: any) {
    console.error(`Error fetching resource from stdio server ${serverId}:`, error);
    return res.status(500).json({ 
      error: error.message || 'Failed to fetch resource from stdio server',
      code: 'STDIO_RESOURCE_ERROR'
    });
  }
}
