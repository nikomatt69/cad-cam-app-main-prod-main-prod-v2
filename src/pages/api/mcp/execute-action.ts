import type { NextApiRequest, NextApiResponse } from 'next';
import { ActionHandler } from '@/src/server/mcp/actionHandler';   // Adjust path if needed
import { SessionManager } from '@/src/server/mcp/sessionManager';  // Adjust path if needed
import { validateAction } from '@/src/server/mcp/validators';    // Adjust path if needed
import { logger } from '@/src/server/mcp/logger';                // Adjust path if needed
import { ActionRequest, ActionResponse } from '@/src/server/mcp/types'; // Adjust path if needed

// --- IMPORTANT: Manage Instances ---
const actionHandler = new ActionHandler();
const sessionManager = new SessionManager();
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
    const actionRequest: ActionRequest = req.body;

    const validationError = validateAction(actionRequest);
    if (validationError) {
      logger.warn(`MCP Validation Error (execute-action): ${validationError}`);
      return res.status(400).json({ success: false, error: validationError });
    }

    const session = sessionManager.getSession(actionRequest.sessionId);
    if (!session) {
      logger.warn(`MCP Session Not Found (execute-action): ${actionRequest.sessionId}`);
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    // NOTE: ActionHandler might need adaptation for serverless environment.
    const result = await actionHandler.executeAction(
      actionRequest.action,
      actionRequest.parameters,
      session.getContext() // Pass necessary context
    );

    session.recordAction(actionRequest.action, actionRequest.parameters, result);

    const duration = Date.now() - start;
    logger.info(`MCP Response (execute-action): 200 - ${duration}ms`);
    return res.status(200).json({ success: true, result } as ActionResponse);

  } catch (error) {
    logger.error('Error executing action:', { error, url: req.url });
    const duration = Date.now() - start;
    logger.info(`MCP Response (execute-action): 500 - ${duration}ms`);
    return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error executing action'
      });
  }
}
