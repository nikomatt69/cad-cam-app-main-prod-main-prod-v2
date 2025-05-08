import type { NextApiRequest, NextApiResponse } from 'next';
import { SessionManager } from '@/src/server/mcp/sessionManager';  // Adjust path if needed
import { cadCamAgent } from '@/src/server/mcp/cadcamAgent'; // Import cadCamAgent
import { validateAction } from '@/src/server/mcp/validators';    // Adjust path if needed
import { logger } from '@/src/server/mcp/logger';                // Adjust path if needed
import { ActionRequest, ActionResponse } from '@/src/server/mcp/types'; // Adjust path if needed
import { sessionManager } from '@/src/server/mcp/sharedInstances'; // Import shared instance

// --- IMPORTANT: Manage Instances ---
// Use the shared instance
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

    // Execute action using the cadCamAgent
    const agentResult = await cadCamAgent.executeAction(
      { 
        action: actionRequest.action, // Pass action name (ID)
        parameters: actionRequest.parameters // Pass parameters
      },
      session // Pass the full session
    );

    // --- Context Update --- 
    // The agent currently logs a warning and doesn't update context directly.
    // A more robust implementation would involve the agent returning the precise context changes,
    // and this endpoint applying them via session.updateContext(mergedContext).
    // For now, we rely on the agent potentially logging or having side effects, 
    // or subsequent process-context calls refreshing the state.
    if (agentResult.success && agentResult.updatedContext) {
        logger.info(`Action "${actionRequest.action}" suggests context updates. Manual update required or rely on process-context.`);
        // Potential future implementation:
        // const currentContext = session.getContext();
        // const newContext = { ...currentContext, ...agentResult.updatedContext }; // Needs careful merging
        // session.updateContext(newContext);
    }
    // ---------------------
    
    // Record action using session history (assuming SessionImpl supports it)
    // Adapt the result details recorded if needed
    session.recordAction(actionRequest.action, actionRequest.parameters, { 
        success: agentResult.success,
        message: agentResult.message,
        artifacts: agentResult.artifacts // Include artifacts if relevant
    });

    // --- Apply Context Update --- 
    if (agentResult.success && agentResult.updatedContext) {
        const currentContext = session.getContext();
        if (currentContext) {
            // Simple merge - use a deep merge function if necessary for nested objects
            const newContext = { ...currentContext, ...agentResult.updatedContext }; 
            session.updateContext(newContext);
            logger.info(`Context updated after action: ${actionRequest.action}`);
        } else {
            logger.warn(`Cannot update context after action ${actionRequest.action}: current context is null.`);
        }
    }
    // -------------------------

    const duration = Date.now() - start;
    logger.info(`MCP Response (execute-action): 200 - ${duration}ms`);
    
    // Map agentResult to ActionResponse format
    const response: ActionResponse = {
      success: agentResult.success,
      // Include results/artifacts based on ActionResponse definition
      result: { 
          message: agentResult.message,
          artifacts: agentResult.artifacts
      }, 
      error: agentResult.success ? undefined : agentResult.message
    }
    
    return res.status(200).json(response);

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
