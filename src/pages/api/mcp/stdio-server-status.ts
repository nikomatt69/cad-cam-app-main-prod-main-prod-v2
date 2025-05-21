// Check stdio server status
import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/src/lib/prisma';
import { requireAuth } from '@/src/lib/api/auth';
import { stdioProcessManager } from '@/src/server/mcp/StdioProcessManager';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
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
    
    if (serverConfig.type !== 'stdio') {
      return res.status(400).json({ error: 'Server is not a stdio server' });
    }
    
    // Check if the process is running, start it if not
    const isRunning = stdioProcessManager.isProcessRunning(serverId);
    if (!isRunning) {
      // Try to start the process
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
        return res.status(500).json({ 
          status: 'error',
          message: 'Failed to start stdio server process'
        });
      }
      
      return res.status(200).json({
        status: 'started',
        message: 'stdio server process started successfully'
      });
    }
    
    // Process is already running
    return res.status(200).json({
      status: 'running',
      message: 'stdio server process is running'
    });
  } catch (error: any) {
    console.error(`Error checking stdio server status for ${serverId}:`, error);
    return res.status(500).json({ 
      status: 'error',
      error: error.message || 'Failed to check server status' 
    });
  }
}
