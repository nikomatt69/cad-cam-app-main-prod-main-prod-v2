import type { NextApiRequest, NextApiResponse } from 'next';
import { ActionHandler } from '@/src/server/mcp/actionHandler'; // Adjust path if needed
import { logger } from '@/src/server/mcp/logger';               // Adjust path if needed

// --- IMPORTANT: Manage Instances ---
const actionHandler = new ActionHandler();
// ----------------------------------

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
   if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ success: false, error: `Method ${req.method} Not Allowed` });
  }

  logger.info(`MCP Request: ${req.method} ${req.url}`);
  const start = Date.now();

  try {
    const actions = actionHandler.getAvailableActions();
    const duration = Date.now() - start;
    logger.info(`MCP Response (available-actions): 200 - ${duration}ms`);
    return res.status(200).json({ success: true, actions });
  } catch (error) {
    logger.error('Error getting available actions:', { error, url: req.url });
    const duration = Date.now() - start;
    logger.info(`MCP Response (available-actions): 500 - ${duration}ms`);
    return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error getting available actions'
      });
  }
}
