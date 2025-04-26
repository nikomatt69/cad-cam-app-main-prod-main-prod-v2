// src/lib/ai/openaiService.ts - Enhanced for CAD operations & Image Input
import { AIMessage, AIArtifact, AIAction, ResponseStyle, ComplexityLevel, AssistantRole, MessageContent, TextContentBlock, ImageContentBlock } from '@/src/types/AITypes';
import { v4 as uuidv4 } from 'uuid';
import { aiCache } from './ai-new/aiCache';

// Interfaccia per forzare uno strumento specifico
interface ForceToolChoice {
  type: "function";
  function: { name: string };
}

// Update OpenAIRequest to handle complex content
interface OpenAIMessage {
    role: string;
    content: MessageContent; // Use the complex type
    name?: string; // For tool/function roles if used later
    tool_calls?: any; // Keep tool call structure
    tool_call_id?: string;
}

interface OpenAIRequest {
  messages: OpenAIMessage[]; // Use updated message type
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
  fromCache?: boolean;
}

// The specialized CAD system prompt
const CAD_SYSTEM_PROMPT = `You are a specialized CAD modeling AI assistant. Your task is to convert textual descriptions into valid 3D CAD elements that can be rendered in a web-based CAD application.

Output only valid JSON arrays of CAD elements without explanation or commentary.

Guidelines:
- Create geometrically valid elements with realistic dimensions, proportions, and spatial relationships
- Use a coherent design approach with moderate complexity
- Apply a precise design style
- Ensure all elements include required properties for their type
- Position elements appropriately in 3D space with proper relative positions
- Use consistent units (mm) and scale
- For complex assemblies, use hierarchical organization

Element Types & Required Properties:
// Basic Primitives
- cube: x, y, z (center position), width, height, depth, color (hex), wireframe (bool)
- sphere: x, y, z (center position), radius, segments, color (hex), wireframe (bool)
- cylinder: x, y, z (center position), radius, height, segments, color (hex), wireframe (bool)
- cone: x, y, z (base center position), radius, height, segments, color (hex), wireframe (bool)
- torus: x, y, z (center position), radius, tube, radialSegments, tubularSegments, color (hex), wireframe (bool)

// Advanced Primitives
- pyramid: x, y, z (center position), baseWidth, baseDepth, height, color (hex), wireframe (bool)
- prism: x, y, z (center position), radius, height, sides, color (hex), wireframe (bool)
- hemisphere: x, y, z (center position), radius, segments, direction ("up"/"down"), color (hex), wireframe (bool)
- ellipsoid: x, y, z (center position), radiusX, radiusY, radiusZ, segments, color (hex), wireframe (bool)
- capsule: x, y, z (center position), radius, height, direction ("x"/"y"/"z"), color (hex), wireframe (bool)

// 2D Elements
- circle: x, y, z (center position), radius, segments, color (hex), linewidth
- rectangle: x, y, z (center position), width, height, color (hex), linewidth
- triangle: x, y, z (center position), points (array of {x,y}), color (hex), linewidth
- polygon: x, y, z (center position), sides, radius, points (array of {x,y}), color (hex), wireframe (bool)
- ellipse: x, y, z (center position), radiusX, radiusY, segments, color (hex), linewidth
- arc: x, y, z (center position), radius, startAngle, endAngle, segments, color (hex), linewidth

// Curves
- line: x1, y1, z1, x2, y2, z2, color (hex), linewidth
- spline: points (array of {x,y,z}), color (hex), linewidth

All elements can optionally include:
- rotation: {x, y, z} in degrees
- name: descriptive string
- description: additional information

Think of each element as a precise engineering specification.`;

export class OpenAIService {
  private apiEndpoint = '/api/ai/openai-proxy';
  private defaultModel = 'gpt-4.1';
  
  async sendMessage(
    messages: AIMessage[],
    context: string,
    availableActions: string[] = [],
    responseStyle: ResponseStyle = "detailed",
    complexityLevel: ComplexityLevel = "moderate",
    assistantRole: AssistantRole = "General AI",
    forceToolChoice?: ForceToolChoice,
    structuredContext : string = ""
  ): Promise<OpenAIResponse> {
    // --- Caching Logic Modification --- 
    // Basic check: Disable cache if the last message contains images
    const lastMessage = messages[messages.length - 1];
    const hasImages = Array.isArray(lastMessage?.content) && 
                      lastMessage.content.some(block => block.type === 'image_url');
    
    let cacheKey = null;
    let cachedResponse = null;

    if (!hasImages) { // Only attempt caching if no images in the last message
      const cacheKeyPayload = {
        // Create a serializable representation of messages (e.g., text only or hashes)
        messages: messages.map(m => ({
           role: m.role,
           // For cache key, simplify content: use text or placeholder for complex content
           content: typeof m.content === 'string' ? m.content : 
                    (Array.isArray(m.content) ? m.content.filter(b => b.type === 'text').map(b => (b as TextContentBlock).text).join('\n') : '[Unsupported Content]')
        })),
        context,
        availableActions,
        responseStyle,
        complexityLevel,
        assistantRole,
        forceToolChoice,
        model: this.defaultModel,
        
      };
      cacheKey = aiCache.getKeyForRequest(cacheKeyPayload);
      cachedResponse = aiCache.get<OpenAIResponse>(cacheKey);
    }

    if (cachedResponse) {
      console.log("OpenAIService: Returning cached response for key:", cacheKey);
      return { ...cachedResponse, fromCache: true };
    }
    if (cacheKey) {
      console.log("OpenAIService: No cache hit for key:", cacheKey);
    } else {
      console.log("OpenAIService: Caching disabled for request containing images.");
    }
    // --- End Caching Logic Modification ---

    try {
      // Get formatted messages AND system prompt
      const { apiMessages, systemPromptString } = this.formatMessagesForApi(
        messages,
        context,
        availableActions,
        responseStyle,
        complexityLevel,
        assistantRole
      );
      
      // --- Log availableActions before generating tools --- 
      console.log("--- Available Actions Passed to getAvailableTools ---");
      console.log(availableActions);
      // --- End Log ---
      
      // Generate Tools List
      const toolsList = this.getAvailableTools(availableActions);

      // Create the request body with separate system prompt
      const requestBody: any = { // Use any temporarily for flexibility
        messages: apiMessages, // Use the filtered/formatted messages
        system: systemPromptString, // Add top-level system parameter
        model: this.defaultModel,
        temperature: 0.7,
        tools: toolsList,
        max_tokens: 6000
      };
      
      // Set tool_choice if needed
      if (forceToolChoice) {
        requestBody.tool_choice = forceToolChoice;
      } else if (availableActions.length > 0) {
        requestBody.tool_choice = 'auto'; 
      }

      // --- Add Debug Logging --- 
      console.log("--- OpenAI Request Body --- ");
      console.log("Model:", requestBody.model);
      console.log("Tool Choice:", JSON.stringify(requestBody.tool_choice));
      console.log("Tools Provided Count:", requestBody.tools?.length);
      console.log("Tools Provided Names:", JSON.stringify(requestBody.tools?.map((t: { function: { name: any; }; }) => t.function.name)));
      // console.log("Full Tools Provided:", JSON.stringify(requestBody.tools)); // Optional: Log full tool definitions
      // console.log("Messages:", JSON.stringify(requestBody.messages)); // Optional: Log messages
      // --- End Debug Logging ---

      // Send the request to proxy
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody), // Send the correctly formatted body
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response from AI');
      }
      
      const responseData = await response.json();
      
      const processedResponse = this.processResponse(responseData);

      // --- Cache the new response (only if not an image request) --- 
      if (processedResponse && cacheKey) {
        const responseToCache = { ...processedResponse };
        delete responseToCache.fromCache; 
        aiCache.set(cacheKey, responseToCache);
        console.log("OpenAIService: Cached new response for key:", cacheKey);
      }
      // --- End Caching --- 

      return { ...processedResponse, fromCache: false };
    } catch (error) {
      console.error('Error in OpenAI service:', error);
      return { 
        content: "Sorry, an error occurred while contacting the AI.",
        artifacts: [],
        actions: [],
        fromCache: false 
      };
    }
  }
  
  private formatMessagesForApi(
    messages: AIMessage[],
    context: string,
    availableActions: string[],
    responseStyle: ResponseStyle,
    complexityLevel: ComplexityLevel,
    assistantRole: AssistantRole
  ): { apiMessages: OpenAIMessage[], systemPromptString: string } {
    let systemContent = '';

    // Use specialized CAD prompt if the role is CAD Assistant or CAD Expert
    if (assistantRole === "CAD Assistant" || assistantRole === "CAD Expert") {
      systemContent = CAD_SYSTEM_PROMPT;
      // Optionally append style/complexity if still relevant
      systemContent += `\n\nYou should tailor your response complexity to a '${complexityLevel}' level.`;
      systemContent += `\nYour response style should be: ${responseStyle}.`;
       // Append general context if provided and not already covered implicitly
      if (context) {
        systemContent += `\n\nAdditional Context: ${context}`;
      }
      // NOTE: We are *not* appending the availableActions list here, as the prompt is specific
    } else {
      // Original logic for other roles
      systemContent = `You are an AI assistant. Your current role is: ${assistantRole}.`;
      systemContent += `\nYou should tailor your response complexity to a '${complexityLevel}' level.`;
      systemContent += `\nYour response style should be: ${responseStyle}.`;
      systemContent += `\n${context}`;

      if (availableActions.length > 0) {
        systemContent += `\nAvailable tools: ${availableActions.join(', ')}`;
      }

      switch (assistantRole) {
        // Keep existing role-specific instructions for non-CAD roles
        case "Code Explainer":
          systemContent += `\nFocus on explaining code snippets, identifying potential issues, suggesting improvements, and using precise programming terminology.`;
          break;
        case "Helpful Assistant":
        default:
          systemContent += `\nBe helpful, clear, and provide comprehensive answers to the user's queries. Remember to consider any images provided in the user messages.`;
          break;
      }
    }

    // Append available actions if any
    // Only include if the role is more general, CAD prompt is specific
    if (assistantRole !== "CAD Assistant" && assistantRole !== "CAD Expert") {
      if (availableActions.length > 0) {
        systemContent += `\n\nAvailable Actions: ${availableActions.join(', ')}`;
      }
    }

    // Format messages, handling complex content types
    const apiMessages = messages.map(msg => {
      let formattedContent: any = msg.content;
      if (typeof msg.content !== 'string') {
        // Assume array of content blocks if not string
        formattedContent = msg.content;
      }
      return { 
        role: msg.role, 
        content: formattedContent 
      } as OpenAIMessage;
    });

    // Prepend system message if content exists
    if (systemContent) {
      return { 
        apiMessages: [{ role: 'system', content: systemContent } as OpenAIMessage, ...apiMessages],
        systemPromptString: "" // System prompt now handled in messages array
      };
    } else {
      return { apiMessages, systemPromptString: "" };
    }
  }
  
  private getAvailableTools(availableActions: string[]) {
    // Define all possible tools with detailed schemas and instructions
    const allTools = {
      generateCADElement: {
        type: "function",
        function: {
          name: 'generateCADElement',
          description: 'Generate one or more CAD components based on a description',
          parameters: {
            type: 'object',
            properties: {
              elements: {
                type: 'array',
                description: 'Array of CAD elements to create',
                items: {
                  type: 'object',
                  properties: {
                    type: {
                      type: 'string',
                      enum: [
                        'cube', 'sphere', 'cylinder', 'cone', 'torus', 'pyramid', 'prism',
                        'hemisphere', 'ellipsoid', 'capsule', 'circle', 'rectangle', 'triangle',
                        'polygon', 'ellipse', 'arc', 'line', 'spline', 'bezier', 'nurbs',
                        'boolean-union', 'boolean-subtract', 'boolean-intersect', 'extrusion',
                        'revolution', 'sweep', 'loft', 'thread', 'chamfer', 'fillet', 'gear',
                        'spring', 'screw', 'nut', 'bolt', 'washer', 'rivet', 'linear-dimension',
                        'angular-dimension', 'radius-dimension', 'diameter-dimension',
                        'drawing-pen', 'drawing-highlighter', 'drawing-text', 'drawing-eraser',
                        'drawing-screenshot-area', 'wall', 'floor', 'roof', 'window', 'door',
                        'stair', 'column', 'text3d', 'path3d', 'point-cloud', 'mesh', 'group'
                      ],
                      description: 'Type of CAD element'
                    },
                    x: { type: 'number', description: 'X position' },
                    y: { type: 'number', description: 'Y position' },
                    z: { type: 'number', description: 'Z position' },
                    name: {
                      type: 'string',
                      description: 'Optional name or label for the element'
                    },
                    material: {
                      type: 'string',
                      description: 'Material of the element (e.g., Steel, Aluminum, ABS Plastic)'
                    },
                    segments: {
                      type: 'integer',
                      description: 'Number of segments for curved surfaces (controls smoothness)'
                    },
                    width: { type: 'number', description: 'Width (for cube, rectangle etc.)' },
                    height: { type: 'number', description: 'Height (for cube, cylinder etc.)' },
                    depth: { type: 'number', description: 'Depth (for cube etc.)' },
                    radius: { type: 'number', description: 'Radius (for sphere, cylinder etc.)' },
                    color: { type: 'string', description: 'Color in hex format (e.g., #FF0000)' },
                    rotation: {
                      type: 'object',
                      description: 'Rotation in degrees',
                      properties: {
                        x: { type: 'number', description: 'X rotation' },
                        y: { type: 'number', description: 'Y rotation' },
                        z: { type: 'number', description: 'Z rotation' }
                      }
                    }
                  },
                  required: ['type','id', 'properties']
                }
              }
            },
            required: ['elements']
          }
        }
      },
      updateCADElement: {
        type: "function",
        function: {
          name: "updateCADElement",
          description: "Modifies properties of an existing CAD element. Identify the target element using the 'Current Canvas Elements' context. Match the user's description (e.g., 'the screen', 'the large cube') to an element ID in the context. Parse the user request to determine the specific properties to change (e.g., color, size, position) and format them in the 'properties' parameter. If the target element or the properties to change are ambiguous, ask the user for clarification instead of calling this tool.",
          parameters: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'ID of the element to update' },
              properties: {
                type: 'object',
                description: 'Properties to update',
                properties: {
                  x: { type: 'number', description: 'X position' },
                  y: { type: 'number', description: 'Y position' },
                  z: { type: 'number', description: 'Z position' },
                  width: { type: 'number', description: 'Width' },
                  height: { type: 'number', description: 'Height' },
                  depth: { type: 'number', description: 'Depth' },
                  radius: { type: 'number', description: 'Radius' },
                  color: { type: 'string', description: 'Color in hex format' },
                  wireframe: { type: 'boolean', description: 'Wireframe' },
                  rotation: {
                    type: 'object',
                    description: 'Rotation in degrees',
                    properties: {
                      x: { type: 'number', description: 'X rotation' },
                      y: { type: 'number', description: 'Y rotation' },
                      z: { type: 'number', description: 'Z rotation' }
                    }
                  }
                }
              }
            },
            required: ['id', 'properties']
          }
        }
      },
      removeCADElement: {
        type: "function",
        function: {
          name: "removeCADElement",
          description: "Deletes an existing CAD element. Identify the target element using the 'Current Canvas Elements' context provided. Match the user's description (e.g., 'the screen', 'the large cube') to an element ID in the context. If the target is ambiguous or not found, ask the user for clarification instead of calling this tool.",
          parameters: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'ID of the element to remove' },
              properties: {
                type: 'object',
                description: 'Properties to remove',
                properties: {
                  x: { type: 'number', description: 'X position' },
                  y: { type: 'number', description: 'Y position' },
                  z: { type: 'number', description: 'Z position' },
                  width: { type: 'number', description: 'Width' },
                  height: { type: 'number', description: 'Height' },
                  depth: { type: 'number', description: 'Depth' },
                  radius: { type: 'number', description: 'Radius' },
                  color: { type: 'string', description: 'Color in hex format' },
                  wireframe: { type: 'boolean', description: 'Wireframe' },
                  rotation: {
                    type: 'object',
                    description: 'Rotation in degrees',
                    properties: {
                      x: { type: 'number', description: 'X rotation' },
                      y: { type: 'number', description: 'Y rotation' },
                      z: { type: 'number', description: 'Z rotation' }
                    }
                  }
                }
              }
            },
            required: ['id', 'properties']
          }
        }
      },
      chainOfThoughtAnalysis: {
        type: "function",
        function: {
          name: "chainOfThoughtAnalysis",
          description: "Performs a step-by-step analysis of a user request or goal to break it down into smaller actions or provide insights.",
          parameters: {
            type: "object",
            properties: {
              goal: {
                type: "string",
                description: "The user's high-level goal or request to analyze."
              }
            },
            required: ["goal"]
          }
        }
      },
      suggestOptimizations: {
        type: "function",
        function: {
          name: "suggestOptimizations",
          description: "Analyzes the current CAD model (elements provided in context) and suggests potential design optimizations or improvements.",
          parameters: { type: "object", properties: {} } // No specific parameters needed, uses context
        }
      },
      thinkAloudMode: {
        type: "function",
        function: {
           name: "thinkAloudMode",
           description: "Enables or disables a mode where the assistant explains its reasoning process step-by-step.",
           parameters: {
             type: "object",
             properties: {
                enable: { type: "boolean", description: "Set to true to enable, false to disable." }
             },
             required: ["enable"]
           }
        }
      },
      exportCADProjectAsZip: {
         type: "function",
         function: {
            name: "exportCADProjectAsZip",
            description: "Exports the current CAD project elements as a downloadable ZIP archive.",
            parameters: {
               type: "object",
               properties: {
                  filename: { type: "string", description: "Optional filename for the exported ZIP file." }
               }
            }
         }
      }
      // Add other tools here as needed
    };

    if (!availableActions || availableActions.length === 0) {
      return undefined;
    }

    // Filter the tools based on the availableActions list
    const tools = availableActions
      .map(actionName => allTools[actionName as keyof typeof allTools])
      .filter(tool => tool !== undefined);
      
    // --- REMOVED: Log Filtered Tools --- 
    // console.log("--- Filtered Tools Provided to AI ---");
    // console.log(JSON.stringify(tools.map(t => t.function.name), null, 2)); // Log names

    return tools.length > 0 ? tools : undefined;
  }
  
  private processResponse(responseData: any): OpenAIResponse {
    const message = responseData.choices[0].message;
    
    // Get the original content, default to empty string if null
    let content = message.content || ''; 
    
    let actions: { type: string; payload: any; description: string }[] = [];
    if (message.tool_calls && message.tool_calls.length > 0) {
      actions = message.tool_calls.map((call: any) => {
        let payload = {};
        try {
          payload = JSON.parse(call.function.arguments || '{}');
        } catch (e) {
          console.error('Error parsing tool call arguments:', e);
        }
        return {
          type: call.function.name,
          payload: payload,
          description: `Execute ${call.function.name}` // Placeholder description
        };
      });
    }
    
    // Extract artifacts if any
    const artifacts = this.extractArtifacts(content);
    
    return {
      content: content, // Return the original content (which might be empty string)
      actions: actions.length > 0 ? actions : undefined,
      artifacts: artifacts.length > 0 ? artifacts : undefined,
      fromCache: false
    };
  }
  
  private extractArtifacts(content: string): AIArtifact[] {
    const artifacts: AIArtifact[] = [];
    // Use simpler regex if language detection isn't critical right now
    const codeBlockRegex = /```(?:json|javascript|python|html|css|typescript|tsx|jsx|bash|sh|text)?\\n([\s\\S]*?)\\n```/g;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
        const language = match[0].match(/```(.*?)\\n/)?.[1] || 'text';
        const code = match[1];
        artifacts.push({
            id: uuidv4(),
            type: 'code', 
            language: language,
            content: code
        });
    }
    return artifacts;
  }
  
  private cleanContentFromArtifacts(content: string): string {
    // Remove code blocks to clean up the content
    return content.replace(/```(?:json|javascript|python|html|css|typescript|tsx|jsx|bash|sh|text)?\\n[\s\\S]*?\\n```/g, '');
  }
}

// Export a singleton instance
export const openAIService = new OpenAIService();