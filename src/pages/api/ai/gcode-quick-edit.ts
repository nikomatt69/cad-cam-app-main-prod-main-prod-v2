import { NextApiRequest, NextApiResponse } from 'next';
import openAiGCodeService from '../../../services/openAiGCodeService';
import { requireAuth } from '@/src/lib/api/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {

  const userId = await requireAuth(req, res);
  if (!userId) return;
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("OpenAI API key is missing");
    return res.status(500).json({ error: 'OpenAI API key is missing' });
  }

  try {
    const { instruction, code, context } = req.body;

    if (!instruction || !code) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Create a specialized system prompt for GCode quick edit
    const systemPrompt = `You are an expert CNC programmer specialized in modifying G-code based on user instructions.
    The user has provided an instruction to modify a selected portion of G-code.
    
    Apply the requested changes to the selected G-code following these guidelines:
    - Make the exact changes requested by the user
    - Maintain proper syntax and safety
    - Optimize the code if appropriate based on the request
    - Preserve line numbers and formatting when possible
    
    Only return the modified G-code without any explanations or markdown.`;

    // Prepare a user prompt that includes both the instruction and code
    const userPrompt = `INSTRUCTION: "${instruction}"
    
SELECTED G-CODE:
${code}

${context ? `CONTEXT (surrounding G-code for reference, do not modify this):
${context}` : ''}

Return only the modified G-code that will replace the selected portion.`;

    // Call OpenAI to get the modified code
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: openAiGCodeService.getModel(),
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
        max_tokens: 2000,
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to modify G-code');
    }

    const data = await response.json();
    const modifiedCode = data.choices[0]?.message?.content?.trim() || '';

    return res.status(200).json({ modifiedCode });
  } catch (error) {
    console.error('Error in gcode-quick-edit API:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    });
  }
}
