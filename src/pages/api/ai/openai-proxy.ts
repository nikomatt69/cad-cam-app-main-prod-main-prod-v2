// src/pages/api/ai/openai-proxy.ts
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { model, messages, max_tokens, temperature, tools, tool_choice } = req.body;

    // Get the API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'OpenAI API key is missing' });
    }

    // Configure request
    const openaiEndpoint = 'https://api.openai.com/v1/chat/completions';
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    };

    // Add organization ID if available
    if (process.env.OPENAI_ORG_ID) {
      Object.assign(headers, { 'OpenAI-Organization': process.env.OPENAI_ORG_ID });
    }

    // Build request body
    const requestBody: any = {
      model,
      messages,
      temperature: temperature || 0.7,
    };

    // Add optional parameters
    if (max_tokens) requestBody.max_tokens = max_tokens;
    if (tools) requestBody.tools = tools;
    if (tool_choice) requestBody.tool_choice = tool_choice;

    // Call OpenAI API
    const openaiResponse = await fetch(openaiEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      return res.status(openaiResponse.status).json(errorData);
    }

    const data = await openaiResponse.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('OpenAI proxy error:', error);
    return res.status(500).json({ 
      error: 'An error occurred while processing your request',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}