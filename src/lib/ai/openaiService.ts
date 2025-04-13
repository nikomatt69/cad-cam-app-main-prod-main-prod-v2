// src/services/ai/openAIService.ts
import { AIMessage, AIArtifact } from '../../types/AITypes';
import { v4 as uuidv4 } from 'uuid';

interface OpenAIRequest {
  messages: {
    role: string;
    content: string;
  }[];
  model: string;
  temperature: number;
  max_tokens?: number;
  tools?: any[];
  tool_choice?: string | { type: string };
}

interface OpenAIResponse {
  content: string;
  artifacts?: AIArtifact[];
  actions?: { type: string; payload: any; description: string }[];
}

export class OpenAIService {
  private apiEndpoint = '/api/ai/openai-proxy';
  private defaultModel = 'gpt-4';
  
  async sendMessage(
    messages: AIMessage[],
    context: string,
    availableActions: string[] = []
  ): Promise<OpenAIResponse> {
    try {
      // Format messages for the OpenAI API
      const formattedMessages = this.formatMessages(messages, context, availableActions);
      
      // Create the request body
      const requestBody: OpenAIRequest = {
        messages: formattedMessages,
        model: this.defaultModel,
        temperature: 0.7,
        tools: this.getAvailableTools(availableActions)
      };
      
      // If actions are available, instruct OpenAI to consider using tools
      if (availableActions.length > 0) {
        requestBody.tool_choice = 'auto';
      }
      
      // Send the request to our proxy endpoint
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response from AI');
      }
      
      const responseData = await response.json();
      
      // Process the response
      return this.processResponse(responseData);
    } catch (error) {
      console.error('Error in OpenAI service:', error);
      throw error;
    }
  }
  
  private formatMessages(
    messages: AIMessage[],
    context: string,
    availableActions: string[]
  ) {
    // Create a system message with context and available actions
    const systemMessage = {
      role: 'system',
      content: `You are an AI assistant specialized in CAD/CAM software. Current context: ${context}.` +
        (availableActions.length > 0 ? 
          ` You can perform the following actions: ${availableActions.join(', ')}.` : '') +
        ` When you want to generate CAD components, create JSON artifacts with proper structure. Be helpful and concise.`
    };
    
    // Convert our messages to the format expected by OpenAI
    const formattedMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    // Add the system message at the beginning
    return [systemMessage, ...formattedMessages];
  }
  
  private getAvailableTools(availableActions: string[]) {
    // Define the tools based on available actions
    const tools = [];
    
    if (availableActions.includes('generateCADComponent')) {
      tools.push({
        type: 'function',
        function: {
          name: 'generateCADComponent',
          description: 'Generate a CAD component based on a description',
          parameters: {
            type: 'object',
            properties: {
              description: {
                type: 'string',
                description: 'Description of the CAD component to generate'
              },
              dimensions: {
                type: 'object',
                description: 'Dimensions of the component',
                properties: {
                  width: { type: 'number' },
                  height: { type: 'number' },
                  depth: { type: 'number' }
                }
              },
              type: {
                type: 'string',
                description: 'Type of component (cube, cylinder, etc.)'
              }
            },
            required: ['description', 'type']
          }
        }
      });
    }
    
    if (availableActions.includes('analyzeDesign')) {
      tools.push({
        type: 'function',
        function: {
          name: 'analyzeDesign',
          description: 'Analyze a CAD design for improvements',
          parameters: {
            type: 'object',
            properties: {
              designId: {
                type: 'string',
                description: 'ID of the design to analyze'
              },
              aspects: {
                type: 'array',
                items: { type: 'string' },
                description: 'Aspects to analyze (structural, aesthetic, etc.)'
              }
            },
            required: ['designId']
          }
        }
      });
    }
    
    return tools;
  }
  
  private processResponse(responseData: any): OpenAIResponse {
    const message = responseData.choices[0].message;
    
    // Extract regular content
    const content = message.content || '';
    
    // Check for tool calls (actions)
    const actions = [];
    if (message.tool_calls && message.tool_calls.length > 0) {
      for (const toolCall of message.tool_calls) {
        if (toolCall.type === 'function') {
          try {
            const functionArgs = JSON.parse(toolCall.function.arguments);
            actions.push({
              type: toolCall.function.name,
              payload: functionArgs,
              description: `Executing ${toolCall.function.name}`
            });
          } catch (e) {
            console.error('Error parsing tool call arguments:', e);
          }
        }
      }
    }
    
    // Extract artifacts if any
    const artifacts = this.extractArtifacts(content);
    
    return {
      content: this.cleanContentFromArtifacts(content),
      artifacts,
      actions
    };
  }
  
  private extractArtifacts(content: string): AIArtifact[] {
    const artifacts: AIArtifact[] = [];
    
    // Extract code blocks as artifacts
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;
    
    while ((match = codeBlockRegex.exec(content)) !== null) {
      const language = match[1] || '';
      const code = match[2];
      
      // Determine the artifact type based on language
      let type: 'code' | 'json' | 'cad' | 'markdown' = 'code';
      if (language === 'json') {
        // Check if this is specifically a CAD component
        if (code.includes('"type":') && 
            (code.includes('"cube"') || code.includes('"cylinder"') || code.includes('"sphere"'))) {
          type = 'cad';
        } else {
          type = 'json';
        }
      }
      
      artifacts.push({
        id: uuidv4(),
        type,
        content: code,
        language,
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} Artifact`
      });
    }
    
    return artifacts;
  }
  
  private cleanContentFromArtifacts(content: string): string {
    // Remove code blocks to clean up the content
    return content.replace(/```(\w+)?\n[\s\S]*?```/g, '');
  }
}

// Export a singleton instance
export const openAIService = new OpenAIService();