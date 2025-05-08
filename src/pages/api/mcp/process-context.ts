import type { NextApiRequest, NextApiResponse } from 'next';
import { ContextProcessor } from '@/src/server/mcp/contextProcessor'; // Adjust path if needed
import { SessionManager } from '@/src/server/mcp/sessionManager';   // Adjust path if needed
import { validateContext } from '@/src/server/mcp/validators';     // Adjust path if needed
import { logger } from '@/src/server/mcp/logger';                 // Adjust path if needed
import { RawApplicationContext } from '@/src/server/mcp/types';      // Adjust path if needed
import { sessionManager, contextProcessor } from '@/src/server/mcp/sharedInstances'; // Import shared instances

// --- IMPORTANT: Manage Instances ---
// Use shared instances
// const contextProcessor = new ContextProcessor(); // Remove this line
// const sessionManager = new SessionManager(); // Remove this line
// ----------------------------------

export default async function handler(
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
    const rawContext: RawApplicationContext = req.body;

    const validationError = validateContext(rawContext);
    if (validationError) {
        logger.warn(`MCP Validation Error (process-context): ${validationError}`);
        return res.status(400).json({ success: false, error: validationError });
    }

    const sessionId = rawContext.sessionId || sessionManager.createSession().getId(); // Ensure session exists
    const session = sessionManager.getOrCreateSession(sessionId);
    const contextWithHistory = { ...rawContext, sessionHistory: session.getHistory() };
    const enrichedContext = await contextProcessor.processContext(contextWithHistory);

    session.updateContext(enrichedContext);

    const duration = Date.now() - start;
    logger.info(`MCP Response (process-context): 200 - ${duration}ms`);
    return res.status(200).json({
        success: true,
        sessionId: sessionId,
        context: enrichedContext
      });
  } catch (error) {
    logger.error('Error processing context:', { error, url: req.url });
    const duration = Date.now() - start;
    logger.info(`MCP Response (process-context): 500 - ${duration}ms`);
    return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error processing context'
      });
  }
}
