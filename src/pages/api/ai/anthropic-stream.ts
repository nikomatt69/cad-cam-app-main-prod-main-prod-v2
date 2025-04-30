import { NextApiRequest, NextApiResponse } from 'next';
import Anthropic from '@anthropic-ai/sdk';
import { MessageParam } from '@anthropic-ai/sdk/resources/messages';

// Ensure Anthropic API key is available
if (!process.env.ANTHROPIC_API_KEY) {
  console.error("ANTHROPIC_API_KEY environment variable is not set.");
  // Optionally throw an error during build/startup if preferred
}

const client = new Anthropic(); // ANTHROPIC_API_KEY is read from env automatically

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  console.log("--- [/api/ai/anthropic-stream] Received Request ---");

  try {
    // --- Extract and Map Parameters ---
    const { 
      model = 'claude-3-7-sonnet-20250219', 
      messages: incomingMessages = [],
      max_tokens = 4096,
      temperature = 1,
      system, // Receive the final system prompt from UnifiedAIService
      reasoningEnabled = true // <<< Receive the flag from the frontend service
    } = req.body;

    // Map messages (assuming system prompt is already handled by UnifiedAIService and passed in `system`)
    const anthropicMessages: MessageParam[] = [];
    for (const msg of incomingMessages) {
       if (msg.role === 'user' || msg.role === 'assistant') {
         anthropicMessages.push({
           role: msg.role,
           content: msg.content,
         });
       }
    }
    
    console.log(`Reasoning Enabled Flag: ${reasoningEnabled}`); // Log the received flag

    // --- Set Up Streaming Response ---
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // Send headers immediately

    let streamClosed = false;
    const closeStream = (reason: string) => { 
      if (!streamClosed) {
        console.log(`Closing stream. Reason: ${reason}`);
        res.write(`event: done\ndata: ${JSON.stringify({ reason })}\n\n`);
        res.end();
        streamClosed = true;
      }
    };

    // --- Prepare Stream Parameters --- 
    const streamParams: Anthropic.MessageStreamParams = {
        model: model,
        messages: anthropicMessages,
        system: system,
        max_tokens: max_tokens,
    };
    if (temperature !== undefined) {
        streamParams.temperature = temperature;
    }
    // Conditionally add the thinking parameter
    if (reasoningEnabled) {
        streamParams.thinking = { type: 'enabled', budget_tokens: Math.min(1600, max_tokens / 2) };
        console.log("Anthropic stream requested WITH thinking enabled.");
    } else {
         console.log("Anthropic stream requested WITHOUT thinking enabled.");
    }

    let stream: any; // Declare stream variable
    try {
        // --- Call Anthropic Stream --- 
        console.log("[Anthropic Stream Route] Attempting to initiate stream with params:", streamParams);
        stream = client.messages.stream(streamParams);
        console.log("[Anthropic Stream Route] Stream initiated successfully.");
    } catch (initError: any) {
        console.error("Error initiating Anthropic stream:", initError);
        if (!streamClosed) {
            res.write(`event: error\ndata: ${JSON.stringify({ message: initError.message || 'Failed to initiate stream' })}\n\n`);
            closeStream('init_error');
        }
        return; // Stop further processing if initiation failed
    }

    // --- Handle stream events using async iteration (Type Assertion) ---
    try {
      for await (const event of stream) {
        if (streamClosed) break; 

        // Instead of checking event.type against 'thinking', which doesn't exist in the union,
        // we verify if the event contains a 'thinking' property.
        if ('thinking' in event) {
           // Use type assertion to access 'thinking' property after runtime check
           const thinkingEvent = event as any; // Assert to any as TS struggles with type narrowing here
           res.write(`event: thinking\ndata: ${JSON.stringify({ chunk: thinkingEvent.thinking })}\n\n`);
        } else if (event.type === 'content_block_delta') {
           // Use type assertion for delta
           const deltaEvent = event as Anthropic.Messages.ContentBlockDeltaEvent;
           if (deltaEvent.delta.type === 'text_delta') {
             // Now access text via asserted type
             res.write(`event: text\ndata: ${JSON.stringify({ chunk: deltaEvent.delta.text })}\n\n`);
           }
        } else if (event.type === 'message_stop') {
           closeStream('stop');
           break; 
        }
      }
    } catch (error: any) {
      console.error("Anthropic stream processing error:", error);
      if (!streamClosed) {
         res.write(`event: error\ndata: ${JSON.stringify({ message: error.message || 'Stream processing error' })}\n\n`);
         closeStream('error');
      }
    } finally {
       if (!streamClosed) {
           console.warn("Stream loop finished without explicit stop/error, ensuring closure.");
           closeStream('finished');
       }
    }

  } catch (error: any) {
    console.error('Error in anthropic-stream handler:', error);
    if (!res.writableEnded) {
        if (!res.headersSent) {
             res.status(500).json({ error: 'Failed to process request', details: error.message || String(error) });
        } else {
             // Attempt to send SSE error if possible
             try {
                res.write(`event: error\ndata: ${JSON.stringify({ message: error.message || 'Handler error' })}\n\n`);
             } catch (writeError) {
                 console.error("Failed to write SSE error:", writeError);
             } finally {
                 res.end();
             }
        }
    }
  }
} 