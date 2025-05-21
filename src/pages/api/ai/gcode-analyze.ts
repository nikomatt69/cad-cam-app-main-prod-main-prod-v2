// src/pages/api/ai/gcode-analyze.ts
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
      gcode, 
      temperature = 0.2,
      maxTokens = 1500 
    } = req.body;

    // Basic validation
    if (!gcode) {
      return res.status(400).json({ error: 'G-code is required' });
    }

    // Get the API key from environment variable
    

    // Create a specialized system prompt for GCode analysis
    const systemPrompt = `You are an expert CNC programmer with extensive experience in analyzing G-code.
    Analyze the provided G-code for potential issues, inefficiencies, or improvements.
    
    Return a JSON object with:
    1. "summary": A concise summary of your analysis
    2. "issues": An array of issue objects, each with:
       - "severity": "critical", "warning", or "info"
       - "description": Detailed description of the issue
       - "lineNumbers": Array of line numbers where the issue occurs
    
    Format the response as valid JSON only.`;

    // Make the request to OpenAI API
    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: 'gpt-4.1',
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
      if (!result.summary || !Array.isArray(result.issues)) {
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