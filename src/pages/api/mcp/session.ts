import type { NextApiRequest, NextApiResponse } from 'next';
import { SessionManager } from '@/src/server/mcp/sessionManager'; // Adjust path if needed
import { logger } from '@/src/server/mcp/logger';               // Adjust path if needed
import { sessionManager } from '@/src/server/mcp/sharedInstances'; // Import shared instance

// --- IMPORTANT: Manage Instances ---
// Use the shared instance
// const sessionManager = new SessionManager(); // Remove this line
// ----------------------------------

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
   if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, error: `Method ${req.method} Not Allowed` });
  }

  logger.info(`MCP Request: ${req.method} ${req.url}`);
  const start = Date.now();

  try {
    const { sessionId } = req.body;
    const session = sessionId
      ? sessionManager.getOrCreateSession(sessionId)
      : sessionManager.createSession();

    const duration = Date.now() - start;
    logger.info(`MCP Response (session): 200 - ${duration}ms`);
    return res.status(200).json({
        success: true,
        sessionId: session.getId(),
        created: !sessionId || sessionId !== session.getId()
      });
  } catch (error) {
    logger.error('Error managing session:', { error, url: req.url });
    const duration = Date.now() - start;
    logger.info(`MCP Response (session): 500 - ${duration}ms`);
     return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error managing session'
      });
  }
} 