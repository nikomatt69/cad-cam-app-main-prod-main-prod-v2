// Stdio server tool handler
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
  
  const { serverId, toolName, parameters } = req.body;
  
  if (!serverId || !toolName) {
    return res.status(400).json({ error: 'serverId and toolName are required' });
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
        
        // Call tool
        const result = await server.callTool(toolName, parameters);
        return res.status(200).json(result);
      } catch (fsError: any) {
        console.error(`Error executing tool on filesystem server ${serverId}:`, fsError);
        
        // For filesystem tools, provide sensible defaults for common tools
        if (toolName === 'readFile') {
          return res.status(400).json({ 
            error: `Failed to read file: ${fsError.message}`,
            path: parameters?.path
          });
        }
        
        if (toolName === 'writeFile') {
          return res.status(400).json({ 
            error: `Failed to write file: ${fsError.message}`,
            path: parameters?.path
          });
        }
        
        if (toolName === 'listFiles') {
          return res.status(400).json({ 
            error: `Failed to list files: ${fsError.message}`,
            path: parameters?.path
          });
        }
        
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
    
    // Execute tool using the process manager
    try {
      const result = await stdioProcessManager.callTool(serverId, toolName, parameters);
      return res.status(200).json(result);
    } catch (toolError: any) {
      console.error(`Error executing tool on stdio server ${serverId}:`, toolError);
      
      // For development, return mock data based on the tool name
      if (process.env.NODE_ENV === 'development') {
        if (toolName === 'echo') {
          return res.status(200).json({
            result: parameters?.text || '',
            timestamp: new Date().toISOString()
          });
        } else if (toolName === 'execute_command') {
          return res.status(200).json({
            commandExecuted: parameters?.command || '',
            args: parameters?.args || [],
            exitCode: 0,
            output: `Executed command: ${parameters?.command || ''} ${parameters?.args ? parameters.args.join(' ') : ''}`,
            timestamp: new Date().toISOString()
          });
        }
      }
      
      return res.status(400).json({ 
        error: `Tool execution failed: ${toolError.message}`,
        toolName,
        parameters
      });
    }
  } catch (error: any) {
    console.error(`Error executing tool on stdio server ${serverId}:`, error);
    return res.status(500).json({ 
      error: error.message || 'Failed to execute tool on stdio server',
      code: 'STDIO_TOOL_ERROR'
    });
  }
}
