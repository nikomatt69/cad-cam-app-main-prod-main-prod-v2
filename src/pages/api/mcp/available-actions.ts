import type { NextApiRequest, NextApiResponse } from 'next';
import { SessionManager } from '@/src/server/mcp/sessionManager'; // Import SessionManager
import { cadCamAgent } from '@/src/server/mcp/cadcamAgent'; // Import cadCamAgent
import { AvailableAction } from '@/src/server/mcp/types'; // Import AvailableAction type
import { logger } from '@/src/server/mcp/logger';
import { sessionManager } from '@/src/server/mcp/sharedInstances'; // Import shared instance

// --- IMPORTANT: Manage Instances ---
// Use the shared instance
// const sessionManager = new SessionManager(); // Remove this line
// ----------------------------------

export default async function handler( // Make handler async
  req: NextApiRequest,
  res: NextApiResponse
) {
  // MCP usually uses POST for requests needing a body (like sessionId)
  if (req.method !== 'POST') { 
    res.setHeader('Allow', ['POST']); // Allow POST
    return res.status(405).json({ success: false, error: `Method ${req.method} Not Allowed` });
  }

  logger.info(`MCP Request: ${req.method} ${req.url}`);
  const start = Date.now();

  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'sessionId is required' });
    }

    const session = sessionManager.getSession(sessionId);
    if (!session) {
      logger.warn(`MCP Session Not Found (available-actions): ${sessionId}`);
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    // Get actions from the agent based on context
    const agentActions = await cadCamAgent.getAvailableActions(session);

    // Format agent actions into the standard AvailableAction[] format
    const availableActions: AvailableAction[] = agentActions.map(agentAction => ({
      name: agentAction.name, // Corresponds to the action ID for executeAction
      description: agentAction.description,
      // Refined parameter mapping
      parameters: Object.entries(agentAction.parameters).map(([name, exampleValue]) => {
        let type: string = 'string';
        let description = `Parameter: ${name}`;
        let required = true; // Assume required by default, adjust in agent if needed

        if (name === 'dimensions' && typeof exampleValue === 'object') {
          type = 'object'; // Could be more specific like 'DimensionsRecord' if defined
          description = 'Object containing dimension key-value pairs (e.g., { length: 10, width: 5 })';
        } else if (typeof exampleValue === 'number') {
          type = 'number';
        } else if (typeof exampleValue === 'object') {
          type = 'object'; // Generic object
          description = 'Object containing key-value pairs';
        } else if (typeof exampleValue === 'boolean') {
          type = 'boolean';
        }
        // Add more specific type checks if needed (e.g., for enums like operationType)

        // You might want to define which params are optional in the agentAction itself
        // and check that here to set required = false
        if (name.endsWith('?')) { // Simple check for optional based on name
          // required = false; // Uncomment if you adopt this convention
        }

        return {
          name: name,
          type: type,
          description: description, // TODO: Add more specific descriptions
          required: required,       // TODO: Set accurately based on action logic
          // Add other fields like defaultValue, enum, min, max based on action needs
        };
      }),
      contextualHints: agentAction.contextualHints,
      applicableElementTypes: agentAction.applicableElementTypes,
    }));

    const duration = Date.now() - start;
    logger.info(`MCP Response (available-actions): 200 - ${duration}ms`);
    // Return the standard list
    return res.status(200).json({ success: true, actions: availableActions }); 

  } catch (error) {
    logger.error('Error getting available actions:', { error, url: req.url, body: req.body });
    const duration = Date.now() - start;
    logger.info(`MCP Response (available-actions): 500 - ${duration}ms`);
    return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error getting available actions'
      });
  }
}
