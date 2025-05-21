// src/pages/api/ai/gcode-generate.ts
import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { requireAuth } from '@/src/lib/api/auth';

// OpenAI API endpoint
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = await requireAuth(req, res);
  if (!userId) return;
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // Throw error only in development/build time, avoid crashing production server if env var is momentarily unavailable.
    // Consider more robust error handling or logging here for production.
    if (process.env.NODE_ENV !== 'production') {
      throw new Error("Openai API key is not defined");
    }
    console.error("Openai API key is not defined.");
  }
  try {
    const { 
      prompt, 
      machineType = 'fanuc', 
      temperature = 0.3,
      maxTokens = 1500 
    } = req.body;

    // Basic validation
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Get the API key from environment variable
    

    // Create a specialized system prompt for GCode generation
    const systemPrompt = `You are an expert CNC programmer with extensive experience in creating G-code programs. 
    Generate well-formatted, efficient, and safe ${machineType.toUpperCase()} G-code based on the following description.
    Follow these guidelines:
    - Include safety features like proper tool changes, spindle control, and coolant commands
    - Use common ${machineType.toUpperCase()} G-code syntax and conventions
    - Add helpful comments to explain key operations
    - Focus on creating a complete, executable program
    - Start with a proper program header and end with a proper program end
    - Only output valid G-code, no explanations or markdown
    
    For reference:
    - Fanuc uses O#### for program numbers, N#### for line numbers, and % at program start/end
    - Heidenhain uses BEGIN PGM for program start and END PGM for program end
    - Siemens uses ; for comments
    - Use G90 for absolute coordinates, G91 for incremental
    
    Output the complete G-code program with no other text.`;

    // Make the request to OpenAI API
    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: 'gpt-4.1',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature,
        max_tokens: maxTokens
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );

    // Extract the completion text
    const generatedGcode = response.data.choices[0].message.content;

    // Return the generated G-code
    return res.status(200).json({ gcode: generatedGcode });
  } catch (error: any) {
    console.error('Error communicating with OpenAI API:', error);
    
    // Handle OpenAI API errors
    if (error.response) {
      return res.status(error.response.status).json({
        error: error.response.data.error?.message || 'Error from OpenAI API'
      });
    }

    return res.status(500).json({ error: 'Failed to communicate with OpenAI API' });
  }
}