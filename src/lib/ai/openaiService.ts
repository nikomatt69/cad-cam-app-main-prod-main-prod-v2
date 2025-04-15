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
  private defaultModel = 'gpt-4o-mini';
  
  async sendMessage(
    messages: AIMessage[],
    context: string,
    availableActions: string[] = [],
    responseStyle: ResponseStyle = "detailed",
    complexityLevel: ComplexityLevel = "moderate",
    assistantRole: AssistantRole = "General AI",
    forceToolChoice?: ForceToolChoice
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
        model: this.defaultModel
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
      // Format messages for the OpenAI API (system prompt + history)
      const formattedApiMessages = this.formatMessagesForApi(
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

      // Create the request body using the potentially complex messages
      const requestBody: OpenAIRequest = {
        messages: formattedApiMessages,
        model: this.defaultModel,
        temperature: 0.7,
        tools: toolsList, // Use the generated list
        max_tokens: 6000
      };
      
      // Set tool_choice if needed
      if (forceToolChoice) {
        requestBody.tool_choice = forceToolChoice;
      } else if (availableActions.length > 0) {
        // Let the model choose if actions are available but none are forced
        requestBody.tool_choice = 'auto'; 
      }

      // --- Add Debug Logging --- 
      console.log("--- OpenAI Request Body --- ");
      console.log("Model:", requestBody.model);
      console.log("Tool Choice:", JSON.stringify(requestBody.tool_choice));
      console.log("Tools Provided Count:", requestBody.tools?.length);
      console.log("Tools Provided Names:", JSON.stringify(requestBody.tools?.map(t => t.function.name)));
      // console.log("Full Tools Provided:", JSON.stringify(requestBody.tools)); // Optional: Log full tool definitions
      // console.log("Messages:", JSON.stringify(requestBody.messages)); // Optional: Log messages
      // --- End Debug Logging ---

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
  ): OpenAIMessage[] {
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
        systemContent += `\n\nYou have the capability to use the following tools/actions: ${availableActions.join(', ')}. Use them when appropriate to fulfill the user's request.`;
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

    const systemMessage: OpenAIMessage = {
      role: 'system',
      content: systemContent
    };
    
    const historyMessages: OpenAIMessage[] = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    return [systemMessage, ...historyMessages];
  }
  
  private getAvailableTools(availableActions: string[]) {
    const tools = [];
    
    if (availableActions.includes('generateCADElement')) {
      tools.push({
        type: 'function',
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
                    },
                    scale: {
                      type: 'object',
                      description: 'Scale factor',
                      properties: {
                        x: { type: 'number', default: 1, description: 'X scale factor' },
                        y: { type: 'number', default: 1, description: 'Y scale factor' },
                        z: { type: 'number', default: 1, description: 'Z scale factor' }
                      }
                    },
                    additionalProps: {
                      type: "object",
                      description: "Object containing type-specific parameters not covered by common properties (e.g., 'tube' for torus, 'pitch' for thread, 'points' for spline/polygon, 'sides' for prism/polygon, 'startAngle'/'endAngle' for arc, etc.). Populate based on the element 'type'.",
                      additionalProperties: true
                    },
                    thickness: {  type: 'object',
                      description: 'Thickness',
                      properties: {
                        x: { type: 'number', description: 'X thickness' },
                        y: { type: 'number', description: 'Y thickness' },
                        z: { type: 'number', description: 'Z thickness' }
                      } }
                  },
                  required: ['type']
                }
              }
            },
            required: ['elements']
          }
        }
      });
    }
    
    if (availableActions.includes('updateCADElement')) {
      tools.push({
        type: 'function',
        function: {
          name: 'updateCADElement',
          description: 'Update an existing CAD element',
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
      });
    }
    
    if (availableActions.includes('removeCADElement')) {
      tools.push({
        type: 'function',
        function: {
          name: 'removeCADElement',
          description: 'Remove a CAD element from the canvas',
          parameters: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'ID of the element to remove' }
            },
            required: ['id']
          }
        }
      });
    }
    
    if (availableActions.includes('exportCADProjectAsZip')) {
      tools.push({
        type: 'function',
        function: {
          name: 'exportCADProjectAsZip',
          description: 'Export the entire CAD project as a compressed .zip file, including geometry, metadata, and preview images if available',
          parameters: {
            type: 'object',
            properties: {
              includePreviews: {
                type: 'boolean',
                description: 'Whether to include PNG previews of each element',
                default: false
              },
              fileName: {
                type: 'string',
                description: 'Optional name for the ZIP file (default: project-export.zip)'
              }
            }
          }
        }
      });
    }

    if (availableActions.includes('thinkAloudMode')) {
      tools.push({
        type: 'function',
        function: {
          name: 'thinkAloudMode',
          description: 'Enable think-aloud mode to let the assistant verbalize its reasoning during each design step',
          parameters: {
            type: 'object',
            properties: {
              enable: {
                type: 'boolean',
                description: 'Toggle think-aloud mode on or off',
                default: true
              }
            },
            required: ['enable']
          }
        }
      });
    }

    if (availableActions.includes('chainOfThoughtAnalysis')) {
      tools.push({
        type: 'function',
        function: {
          name: 'chainOfThoughtAnalysis',
          description: 'Perform a step-by-step analysis and breakdown of the CAD task or problem before executing it',
          parameters: {
            type: 'object',
            properties: {
              goal: {
                type: 'string',
                description: 'Describe the objective or challenge to analyze logically'
              },
              context: {
                type: 'object',
                description: 'Optional additional context like current scene, constraints, or user preferences',
                additionalProperties: true
              }
            },
            required: ['goal']
          }
        }
      });
    }

    if (availableActions.includes('suggestOptimizations')) {
      tools.push({
        type: 'function',
        function: {
          name: 'suggestOptimizations',
          description: 'Suggest design or performance optimizations for the current CAD scene or selected elements',
          parameters: {
            type: 'object',
            properties: {
              target: {
                type: 'string',
                enum: ['geometry', 'materials', 'transformations', 'scene'],
                description: 'Area to focus optimization suggestions on'
              },
              selectedIds: {
                type: 'array',
                description: 'Optional array of selected element IDs to focus optimization on',
                items: { type: 'string' }
              }
            }
          }
        }
      });
    }
    
    return tools;
  }
  
  private processResponse(responseData: any): OpenAIResponse {
    const message = responseData.choices[0].message;
    
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
      // If there are tool calls, often the main content is less important or null
      content = content || `Suggested action: ${actions.map(a => a.type).join(', ')}`;
    }
    
    // Extract artifacts if any
    const artifacts = this.extractArtifacts(content);
    
    return {
      content: content,
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