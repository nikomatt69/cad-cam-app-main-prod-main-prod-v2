// src/pages/api/ai/gcode-optimize.ts
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
    console.error("OpenAI API key is missing");
    return res.status(500).json({ error: 'OpenAI API key is missing' });
  }
  try {
    const { 
      gcode, 
      optimizationType = 'balanced', 
      machineType = 'fanuc',
      temperature = 0.2,
      maxTokens = 2500 
    } = req.body;

    // Basic validation
    if (!gcode) {
      return res.status(400).json({ error: 'G-code is required' });
    }

    // Get the API key from environment variable
    

    // Create a specialized system prompt for GCode optimization
    const systemPrompt = `You are an expert CNC programmer specializing in optimizing G-code for efficiency and quality. 
    Analyze and optimize the provided ${machineType.toUpperCase()} G-code focusing on 
    ${optimizationType === 'speed' 
      ? 'maximizing execution speed, reducing cycle time, and path efficiency.'
      : optimizationType === 'quality' 
      ? 'improving surface finish, tool life, and precision.'
      : 'balancing execution speed and quality.'
    }
    
    Implement the following optimizations:
    - Eliminate redundant commands
    - Optimize rapid movements (G0/G00)
    - Improve cutting movements (G1/G01, G2/G02, G3/G03)
    - Consolidate sequential moves in the same direction
    - ${optimizationType === 'speed' ? 'Optimize feed rates for faster execution' : 'Adjust feed rates for better finish'}
    - Maintain safe tool paths and operations
    
    Return a JSON object with:
    1. "code": The optimized G-code as a string
    2. "improvements": Array of string descriptions of improvements made
    3. "stats": Object with:
       - "originalLines": Number of lines in original code
       - "optimizedLines": Number of lines in optimized code
       - "reductionPercent": Percentage reduction in lines
       - "estimatedTimeReduction": Estimated time saved in minutes
    
    Format the response as valid JSON only.`;

    // Make the request to OpenAI API
    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: gcode }
        ],
        temperature,
        max_tokens: maxTokens,
        response_format: { type: 'json_object' }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );

    // Extract the completion text
    const jsonContent = response.data.choices[0].message.content;
    
    // Parse the JSON response
    try {
      const result = JSON.parse(jsonContent);
      
      // Basic validation of the result structure
      if (!result.code || !Array.isArray(result.improvements) || !result.stats) {
        return res.status(500).json({ error: 'Invalid response format from API' });
      }
      
      return res.status(200).json(result);
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      return res.status(500).json({ error: 'Failed to parse API response' });
    }
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