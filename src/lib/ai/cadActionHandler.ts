import { v4 as uuidv4 } from 'uuid';
import { AIAction, AIMessage, ResponseStyle, ComplexityLevel, AssistantRole } from '@/src/types/AITypes';
import { Element } from '@/src/store/elementsStore';
import { openAIService } from './openaiService';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export interface CADActionHandlerOptions {
  addElementsToCanvas: (elements: Element[]) => void;
  updateElementInCanvas: (id: string, properties: Partial<Element>) => void;
  removeElementFromCanvas: (id: string) => void;
  getCanvasElements: () => Element[];
}

export function createCadActionHandler(options: CADActionHandlerOptions) {
  const {
    addElementsToCanvas,
    updateElementInCanvas,
    removeElementFromCanvas,
    getCanvasElements,
  } = options;
  
  return {
    executeAction: async (action: AIAction): Promise<{ success: boolean; message: string; [key: string]: any }> => {
      try {
        switch (action.type) {
          case 'generateCADElement':
            return handleGenerateCADElement(action.payload);
            
          case 'updateCADElement':
            return handleUpdateCADElement(action.payload);
            
          case 'removeCADElement':
            return handleRemoveCADElement(action.payload);
            
          case 'groupCADElements':
            return handleGroupCADElements(action.payload);

          // --- NEW ACTION CASES --- 
          case 'exportCADProjectAsZip':
            return handleExportCADProjectAsZip(action.payload);

          case 'thinkAloudMode':
            return handleThinkAloudMode(action.payload);
          
          case 'chainOfThoughtAnalysis':
            return handleChainOfThoughtAnalysis(action.payload);

          case 'suggestOptimizations':
            return handleSuggestOptimizations(action.payload);
          // --- END NEW ACTION CASES ---
            
          default:
            return { 
              success: false, 
              message: `Unknown action type: ${action.type}` 
            };
        }
      } catch (error) {
        console.error('Error executing CAD action:', error);
        return { 
          success: false, 
          message: error instanceof Error 
            ? error.message 
            : 'Unknown error executing CAD action' 
        };
      }
    },
    
    getActionDefinitions: () => [
      {
        name: 'generateCADElement',
        description: 'Generate one or more CAD elements based on description',
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
                    // IMPORTANT: Keep this enum in sync with openaiService.ts
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
                  name: { type: 'string', description: 'Optional name/label' },
                  material: { type: 'string', description: 'Material (e.g., Steel, ABS)' },
                  width: { type: 'number', description: 'Width' },
                  height: { type: 'number', description: 'Height' },
                  depth: { type: 'number', description: 'Depth' },
                  radius: { type: 'number', description: 'Radius' },
                  color: { type: 'string', description: 'Color (hex)' },
                  rotation: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' }, z: { type: 'number' } } },
                  scale: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' }, z: { type: 'number' } } },
                  additionalProps: { type: 'object', description: 'Type-specific parameters', additionalProperties: true },
                  thickness: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' }, z: { type: 'number' } } }
                },
                required: ['type']
              }
            }
          },
          required: ['elements']
        }
      },
      {
        name: 'updateCADElement',
        description: 'Update properties of an existing CAD element',
        // Ensure this definition matches openaiService.ts
        parameters: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'ID of the element to update' },
            properties: {
              type: 'object',
              description: 'Properties to update',
              // Add all potentially updatable properties here, mirroring generateCADElement for consistency
              properties: {
                x: { type: 'number', description: 'X position' },
                y: { type: 'number', description: 'Y position' },
                z: { type: 'number', description: 'Z position' },
                name: { type: 'string', description: 'Optional name/label' },
                material: { type: 'string', description: 'Material (e.g., Steel, ABS)' },
                width: { type: 'number', description: 'Width' },
                height: { type: 'number', description: 'Height' },
                depth: { type: 'number', description: 'Depth' },
                radius: { type: 'number', description: 'Radius' },
                color: { type: 'string', description: 'Color (hex)' },
                rotation: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' }, z: { type: 'number' } } },
                scale: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' }, z: { type: 'number' } } },
                additionalProps: { type: 'object', description: 'Type-specific parameters', additionalProperties: true },
                thickness: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' }, z: { type: 'number' } } }
              }
            }
          },
          required: ['id', 'properties']
        }
      },
      {
        name: 'removeCADElement',
        description: 'Remove a CAD element from the canvas',
        parameters: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'ID of the element to remove' }
          },
          required: ['id']
        }
      },
      {
        name: 'groupCADElements',
        description: 'Group multiple CAD elements together',
        parameters: {
          type: 'object',
          properties: {
            elementIds: {
              type: 'array',
              items: { type: 'string' },
              description: 'IDs of elements to group'
            },
            groupName: { type: 'string', description: 'Name for the group' }
          },
          required: ['elementIds']
        }
      },
      // --- NEW ACTION DEFINITIONS --- 
      {
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
      },
      {
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
      },
      {
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
      },
      {
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
      // --- END NEW ACTION DEFINITIONS ---
    ]
  };
  
  // Handler implementations
  function handleGenerateCADElement(payload: any): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve) => {
      try {
        if (!payload.elements || !Array.isArray(payload.elements)) {
          throw new Error('Invalid elements payload: "elements" array is required.');
        }
        
        let addedCount = 0;
        let skippedCount = 0;
        const errorMessages: string[] = [];
        
        const processedElements = payload.elements.map((el: any, index: number): Element | null => {
          // Basic validation/defaults
          if (!el || typeof el !== 'object' || !el.type) {
            console.warn(`Skipping element at index ${index}: Invalid or missing element data.`);
            skippedCount++;
            errorMessages.push(`Element at index ${index} skipped: Invalid or missing data.`);
            return null;
          }

          const baseElement: Omit<Element, 'type' | 'id'> & { id?: string } = {
            // Let the AI assign the ID if provided, otherwise generate one
            id: el.id || uuidv4(), 
            type: el.type, // Type is already validated above
            x: el.x ?? 0,
            y: el.y ?? 0,
            z: el.z ?? 0,
            name: el.name,
            material: el.material,
            color: el.color ?? '#1e88e5',
            rotation: el.rotation ? { 
              x: el.rotation.x ?? 0, 
              y: el.rotation.y ?? 0, 
              z: el.rotation.z ?? 0 
            } : { x: 0, y: 0, z: 0 },
            scale: el.scale ? { 
              x: el.scale.x ?? 1, 
              y: el.scale.y ?? 1, 
              z: el.scale.z ?? 1 
            } : { x: 1, y: 1, z: 1 },
            additionalProps: el.additionalProps ?? {},
            thickness: el.thickness // Only include if provided, don't default object
              ? { 
              x: el.thickness.x ?? 0, 
              y: el.thickness.y ?? 0, 
              z: el.thickness.z ?? 0 
                } 
              : undefined,
            wireframe: el.wireframe ?? false,
            visible: el.visible ?? true,
            layer: el.layer ?? 'default',
            // Include any other common properties passed by the AI
            ...Object.fromEntries(Object.entries(el).filter(([key]) => ![
              'id', 'type', 'x', 'y', 'z', 'name', 'material', 'color', 
              'rotation', 'scale', 'additionalProps', 'thickness', 'wireframe',
              'visible', 'layer', 'width', 'height', 'depth', 'radius' // Handle dimensions separately below
            ].includes(key)))
          };

          // Add dimension/radius properties based on type and payload
          // Default values should match CADCanvas defaults where possible for consistency
          let specificProps: Partial<Element> = {};
          switch (el.type) {
            case 'cube':
            case 'rectangle': // Includes 2D rectangle
            case 'workpiece':
            case 'wall': // Has length, height, thickness, but thickness is already handled
            case 'floor': // Has width, length, thickness
            case 'window': // Has width, height, thickness
            case 'door':   // Has width, height, thickness
              specificProps = { 
                width: el.width ?? (el.type === 'wall' || el.type === 'floor' ? 100 : 50), 
                height: el.height ?? (el.type === 'wall' ? 30 : (el.type === 'window' ? 15 : (el.type === 'door' ? 20 : 50))), 
                depth: el.depth ?? (el.type === 'workpiece' ? 50 : undefined) // Depth may not apply to all (e.g., 2D rect)
              };
              if(el.type === 'wall' || el.type === 'floor' || el.type === 'window' || el.type === 'door') {
                // Overwrite thickness if provided specifically for these types
                specificProps.thickness = el.thickness?.x ?? 
                  (el.type === 'wall' ? 5 : 
                  (el.type === 'floor' ? 2 : 
                  (el.type === 'window' ? 0.5 : 
                  (el.type === 'door' ? 1 : undefined))));
              }
              break;
            case 'sphere':
            case 'hemisphere':
            case 'ellipsoid': // Uses radiusX, radiusY, radiusZ instead
            case 'capsule': // Uses radius, height
            case 'circle': // Includes 2D circle
            case 'torus': // Needs tubeRadius in additionalProps maybe? Handled by generic spread
            case 'cylinder': // Needs height as well
            case 'cone': // Needs height as well
            case 'prism': // Needs height and sides
            case 'gear': // Needs moduleValue, teeth, thickness
            case 'spring': // Needs wireRadius, turns, height
            case 'column': // Needs height
              specificProps = { 
                radius: el.radius ?? (el.type === 'spring' ? 1 : (el.type === 'column' ? 5 : 25)), 
                height: el.height ?? (['cylinder', 'cone', 'prism'].includes(el.type) ? 50 : (el.type === 'capsule' ? 2 : (el.type === 'spring' ? 5 : (el.type === 'column' ? 30 : undefined)))),
                ...(el.type === 'ellipsoid' && { radiusX: el.radiusX ?? 1, radiusY: el.radiusY ?? 0.75, radiusZ: el.radiusZ ?? 0.5 }),
                ...(el.type === 'capsule' && { capSegments: el.capSegments ?? 8, radialSegments: el.radialSegments ?? 16 }),
                ...(el.type === 'prism' && { sides: el.sides ?? 6 }),
                ...(el.type === 'gear' && { moduleValue: el.moduleValue ?? 1, teeth: el.teeth ?? 20, thickness: el.thickness?.x ?? 5 }), // Assume thickness.x is gear thickness
                ...(el.type === 'spring' && { wireRadius: el.wireRadius ?? 0.1, turns: el.turns ?? 5 }),
              };
              // Torus tubeRadius might come via additionalProps or specific payload prop
              if (el.type === 'torus') specificProps.tubeRadius = el.tubeRadius ?? (el.radius ?? 25) / 4;
              break;
            case 'pyramid':
              specificProps = { baseWidth: el.baseWidth ?? 1, baseDepth: el.baseDepth ?? 1, height: el.height ?? 1 };
              break;
            case 'line':
              specificProps = { x1: el.x1, y1: el.y1, z1: el.z1, x2: el.x2, y2: el.y2, z2: el.z2, linewidth: el.linewidth ?? 1 };
              if (specificProps.x1 === undefined || specificProps.y1 === undefined || specificProps.x2 === undefined || specificProps.y2 === undefined) {
                 console.warn(`Skipping element at index ${index} ('line'): Missing start/end points (x1, y1, x2, y2).`);
                 skippedCount++;
                 errorMessages.push(`Element 'line' at index ${index} skipped: Missing start/end points.`);
                 return null;
              }
              break;
            case 'triangle':
            case 'polygon':
            case 'spline':
            case 'bezier':
            case 'nurbs':
            case 'revolution': // Needs profile points
            case 'sweep': // Needs profile and path points
            case 'loft': // Needs array of profiles and positions
            case 'path3d':
            case 'point-cloud':
            case 'mesh': // Needs vertices and faces
            case 'drawing-pen':
            case 'drawing-highlighter':
            case 'drawing-eraser':
              specificProps = { points: el.points, vertices: el.vertices, faces: el.faces, profile: el.profile, path: el.path, profiles: el.profiles, positions: el.positions };
              // Basic validation for point-based elements
              if (['spline', 'bezier', 'nurbs', 'revolution', 'sweep', 'loft', 'path3d', 'drawing-pen', 'drawing-highlighter', 'drawing-eraser'].includes(el.type)) {
                 if (!specificProps.points && !specificProps.profile && !specificProps.path && !(specificProps.profiles && specificProps.positions)) {
                    console.warn(`Skipping element at index ${index} ('${el.type}'): Missing required points/profile/path data.`);
                    skippedCount++;
                    errorMessages.push(`Element '${el.type}' at index ${index} skipped: Missing points/profile/path data.`);
                    return null;
                 }
              }
               if (el.type === 'mesh' && (!specificProps.vertices || !specificProps.faces)) {
                 console.warn(`Skipping element at index ${index} ('mesh'): Missing vertices or faces.`);
                 skippedCount++;
                 errorMessages.push(`Element 'mesh' at index ${index} skipped: Missing vertices or faces.`);
                 return null;
               }
              // Pass through other relevant props
              specificProps.divisions = el.divisions;
              specificProps.linewidth = el.linewidth;
              specificProps.penSize = el.penSize;
              specificProps.highlighterSize = el.highlighterSize;
              specificProps.opacity = el.opacity;
              specificProps.showEraserPath = el.showEraserPath;
              specificProps.pointSize = el.pointSize;
              specificProps.colors = el.colors; // For point cloud
              specificProps.closed = el.closed; // For sweep, path3d
              specificProps.segments = el.segments;
              specificProps.radialSegments = el.radialSegments;
              break;
            case 'extrusion':
              specificProps = { 
                shape: el.shape, // 'rect', 'circle', or uses profile
                profile: el.profile, // Alternative to shape
                width: el.width ?? (el.shape === 'rect' ? 50 : undefined), 
                height: el.height ?? (el.shape === 'rect' ? 30 : undefined), 
                radius: el.radius ?? (el.shape === 'circle' ? 25 : undefined), 
                depth: el.depth ?? 10,
                bevel: el.bevel ?? false,
                bevelThickness: el.bevelThickness ?? 1,
                bevelSize: el.bevelSize ?? 1,
                bevelSegments: el.bevelSegments ?? 1
              };
              if (!specificProps.shape && !specificProps.profile) {
                 console.warn(`Skipping element at index ${index} ('extrusion'): Missing shape or profile.`);
                 skippedCount++;
                 errorMessages.push(`Element 'extrusion' at index ${index} skipped: Missing shape or profile.`);
                 return null;
              }
              break;
            case 'boolean-union':
            case 'boolean-subtract':
            case 'boolean-intersect':
              specificProps = { operands: el.operands };
               if (!specificProps.operands || !Array.isArray(specificProps.operands) || specificProps.operands.length < 2) {
                 console.warn(`Skipping element at index ${index} ('${el.type}'): Requires at least two operand IDs.`);
                 skippedCount++;
                 errorMessages.push(`Element '${el.type}' at index ${index} skipped: Requires at least two operand IDs.`);
                 return null;
               }
              break;
            case 'thread':
              specificProps = { 
                  diameter: el.diameter ?? 5, 
                  length: el.length ?? 10, 
                  pitch: el.pitch ?? 1, 
                  handedness: el.handedness ?? 'right' 
              };
              break;
            case 'chamfer':
            case 'fillet':
              specificProps = { 
                  targetId: el.targetId, // ID of the element to modify
                  edges: el.edges, // Indices or identifiers of edges
                  distance: el.distance, // For chamfer
                  radius: el.radius, // For fillet
                  width: el.width, // For placeholder viz
                  height: el.height, // For placeholder viz
                  depth: el.depth // For placeholder viz
              };
              // Note: Actual chamfer/fillet needs more complex handling, maybe separate actions
              // This handles the placeholder generation if the AI sends these types
              break;
            case 'screw':
            case 'bolt':
            case 'nut':
            case 'washer':
            case 'rivet':
              specificProps = { 
                  size: el.size, // e.g., "M5"
                  length: el.length, // For screw/bolt/rivet
                  diameter: el.diameter, // For rivet/thread fallback
                  thickness: el.thickness?.x // For nut/washer - use thickness prop
              };
               // Need size or diameter/length for most
               if (!specificProps.size && !specificProps.diameter && !specificProps.length) {
                 console.warn(`Skipping element at index ${index} ('${el.type}'): Missing size or dimensions.`);
                 skippedCount++;
                 errorMessages.push(`Element '${el.type}' at index ${index} skipped: Missing size or dimensions.`);
                 return null;
               }
              break;
             case 'stair':
              specificProps = { 
                  width: el.width ?? 10, 
                  height: el.height ?? 20, 
                  depth: el.depth ?? 30, 
                  steps: el.steps ?? 10 
              };
              break;
            case 'roof':
               specificProps = { 
                  width: el.width ?? 100, 
                  length: el.length ?? 100, 
                  height: el.height ?? 20, // Pitch height for pitched roof
                  style: el.style ?? 'pitched', // 'pitched', 'flat'
                  thickness: el.thickness?.x // For flat roof - use thickness prop
               };
               break;
             case 'text3d':
               specificProps = { 
                  text: el.text, 
                  height: el.height ?? 5, // Font size essentially
                  depth: el.depth ?? 2, // Extrusion depth
                  font: el.font // Font name (requires font loading)
               };
               if (!specificProps.text) {
                 console.warn(`Skipping element at index ${index} ('text3d'): Missing text content.`);
                 skippedCount++;
                 errorMessages.push(`Element 'text3d' at index ${index} skipped: Missing text content.`);
                 return null;
               }
               break;
             case 'group':
             case 'component': // Components can also have child elements
               specificProps = { 
                   elements: el.elements ?? [], // Array of child element definitions
                   // For component placeholder viz:
                   width: el.width, 
                   height: el.height, 
                   depth: el.depth 
               };
               // Recursively process child elements? Might be complex.
               // Assume child elements in payload are already valid definitions.
               break;
             case 'linear-dimension':
             case 'radius-dimension':
             case 'diameter-dimension':
             case 'angular-dimension':
                specificProps = {
                    startPoint: el.startPoint, // {x, y, z}
                    endPoint: el.endPoint,     // {x, y, z}
                    center: el.center,         // {x, y, z}
                    pointOnCircle: el.pointOnCircle, // {x, y, z}
                    vertex: el.vertex,         // {x, y, z} - for angular
                    offsetDirection: el.offsetDirection, // 'x', 'y', 'z' - for linear
                    offsetAmount: el.offsetAmount,
                    radius: el.radius, // For angular arc representation
                    value: el.value, // Override calculated value
                    unit: el.unit,
                    linewidth: el.linewidth ?? 1
                };
                // Add validation for required points per dimension type
                if (el.type === 'linear-dimension' && (!specificProps.startPoint || !specificProps.endPoint)) { /* skip */ }
                if (el.type === 'radius-dimension' && (!specificProps.center || !specificProps.pointOnCircle)) { /* skip */ }
                if (el.type === 'diameter-dimension' && (!specificProps.center || !specificProps.pointOnCircle)) { /* skip */ }
                if (el.type === 'angular-dimension' && (!specificProps.vertex || !specificProps.startPoint || !specificProps.endPoint)) { /* skip */ }
                // Simplified skip logic - replace with proper error handling
                if (false) { // Placeholder for actual skip logic
                    console.warn(`Skipping element at index ${index} ('${el.type}'): Missing required points.`);
                    skippedCount++;
                    errorMessages.push(`Element '${el.type}' at index ${index} skipped: Missing required points.`);
                    return null;
                }
                break;
             case 'drawing-text':
                specificProps = {
                    position: el.position, // {x, y, z}
                    text: el.text,
                    textSize: el.textSize ?? 12,
                    font: el.font ?? 'Arial'
                };
                 if (!specificProps.position || !specificProps.text) {
                    console.warn(`Skipping element at index ${index} ('drawing-text'): Missing position or text.`);
                    skippedCount++;
                    errorMessages.push(`Element 'drawing-text' at index ${index} skipped: Missing position or text.`);
                    return null;
                 }
                break;
            case 'drawing-screenshot-area':
                 specificProps = {
                    startPoint: el.startPoint, // {x, y, z}
                    endPoint: el.endPoint      // {x, y, z}
                 };
                 if (!specificProps.startPoint || !specificProps.endPoint) {
                    console.warn(`Skipping element at index ${index} ('drawing-screenshot-area'): Missing start or end point.`);
                    skippedCount++;
                    errorMessages.push(`Element 'drawing-screenshot-area' at index ${index} skipped: Missing start or end point.`);
                    return null;
                 }
                 break;
            // Default case handles types not explicitly listed or those only needing base props + dimensions
            default:
              // Pass through common dimension properties if provided
              specificProps = {
                ...(el.width && { width: el.width }),
                ...(el.height && { height: el.height }),
                ...(el.depth && { depth: el.depth }),
                ...(el.radius && { radius: el.radius }),
              };
              // Log if a type wasn't explicitly handled but maybe should have been?
              // console.log(`Element type "${el.type}" using default property handling.`);
              break;
          }
          
          // Combine base, specific, and ensure ID and Type are correct
          const finalElement = {
              ...baseElement,
              ...specificProps,
              id: baseElement.id || uuidv4(), // Ensure ID exists
              type: el.type // Ensure type is set from original payload
          } as Element; // Cast might be needed depending on full Element type def
          
          addedCount++;
          return finalElement;

        }).filter((el: Element | null): el is Element => el !== null); // Filter out skipped elements
        
        if (processedElements.length > 0) {
           addElementsToCanvas(processedElements as Element[]); // Add valid elements
        }
        
        // Construct final message
        let message = '';
        if (addedCount > 0) {
            message += `Added ${addedCount} element(s) to the canvas.`;
        }
        if (skippedCount > 0) {
            message += ` Skipped ${skippedCount} element(s) due to errors: ${errorMessages.join('; ')}`;
        }
        if (addedCount === 0 && skippedCount === 0) {
            message = 'No elements provided in the payload.';
        } else if (addedCount === 0 && skippedCount > 0) {
             message = `Failed to add any elements. Skipped ${skippedCount} element(s) due to errors: ${errorMessages.join('; ')}`;
             resolve({ success: false, message }); // Overall failure if nothing was added
             return;
        }

        
        resolve({
          success: addedCount > 0, // Success if at least one element was added
          message: message.trim()
        });
      } catch (error) {
        console.error("Error in handleGenerateCADElement:", error);
        resolve({
          success: false,
          message: error instanceof Error ? error.message : 'Error adding elements'
        });
      }
    });
  }
  
  function handleUpdateCADElement(payload: any): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve) => {
      try {
        if (!payload.id || !payload.properties) {
          throw new Error('Invalid update payload: id and properties are required');
        }
        
        const elements = getCanvasElements();
        const elementExists = elements.some(el => el.id === payload.id);
        
        if (!elementExists) {
          throw new Error(`Element with id ${payload.id} not found`);
        }
        
        // Ensure properties are applied correctly (handle nested objects like rotation/scale)
        const propertiesToUpdate: Partial<Element> = { ...payload.properties };
        if (propertiesToUpdate.rotation) {
          propertiesToUpdate.rotation = { x: 0, y: 0, z: 0, ...propertiesToUpdate.rotation };
        }
        if (propertiesToUpdate.scale) {
          propertiesToUpdate.scale = { x: 1, y: 1, z: 1, ...propertiesToUpdate.scale };
        }
        if (propertiesToUpdate.thickness) {
          propertiesToUpdate.thickness = { x: 0, y: 0, z: 0, ...propertiesToUpdate.thickness };
        }

        updateElementInCanvas(payload.id, propertiesToUpdate);
        
        resolve({
          success: true,
          message: `Updated element ${payload.id}`
        });
      } catch (error) {
        console.error("Error in handleUpdateCADElement:", error);
        resolve({
          success: false,
          message: error instanceof Error ? error.message : 'Error updating element'
        });
      }
    });
  }
  
  function handleRemoveCADElement(payload: any): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve) => {
      try {
        if (!payload.id) {
          throw new Error('Invalid remove payload: id is required');
        }
        
        const elements = getCanvasElements();
        const elementExists = elements.some(el => el.id === payload.id);
        
        if (!elementExists) {
          throw new Error(`Element with id ${payload.id} not found`);
        }
        
        removeElementFromCanvas(payload.id);
        
        resolve({
          success: true,
          message: `Removed element ${payload.id}`
        });
      } catch (error) {
        console.error("Error in handleRemoveCADElement:", error);
        resolve({
          success: false,
          message: error instanceof Error ? error.message : 'Error removing element'
        });
      }
    });
  }
  
  function handleGroupCADElements(payload: any): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve) => {
      try {
        if (!payload.elementIds || !Array.isArray(payload.elementIds) || payload.elementIds.length === 0) {
          throw new Error('Invalid group payload: elementIds array is required');
        }
        
        console.log("Grouping elements (placeholder):", payload.elementIds, payload.groupName);
        // TODO: Implement actual grouping logic (e.g., update element store or canvas state)
        
        resolve({
          success: true,
          message: `Grouped ${payload.elementIds.length} elements${payload.groupName ? ` as \"${payload.groupName}\"` : ''} (Placeholder Implementation)`
        });
      } catch (error) {
        console.error("Error in handleGroupCADElements:", error);
        resolve({
          success: false,
          message: error instanceof Error ? error.message : 'Error grouping elements'
        });
      }
    });
  }

  // --- NEW HANDLER IMPLEMENTATIONS (Placeholders) ---

  async function handleExportCADProjectAsZip(payload: any): Promise<{ success: boolean; message: string }> {
    console.log("Exporting project as ZIP:", payload);
    const { includePreviews, fileName: requestedFileName } = payload;
    const fileName = requestedFileName || `cad-project-export-${Date.now()}.zip`;

    if (includePreviews) {
      console.warn("Preview generation during export is not yet implemented and will be skipped.");
      // Optionally, return a specific message indicating previews were skipped
    }

    try {
      const elements = getCanvasElements();
      const metadata = {
        exportedAt: new Date().toISOString(),
        elementCount: elements.length,
        // Add any other relevant project metadata here
      };

      const zip = new JSZip();

      // Add elements data
      zip.file("elements.json", JSON.stringify(elements, null, 2));

      // Add metadata
      zip.file("metadata.json", JSON.stringify(metadata, null, 2));

      // Generate the ZIP file content
      const content = await zip.generateAsync({ type: "blob" });

      // Trigger the download
      saveAs(content, fileName);

      return {
        success: true,
        message: `Project exported successfully as ${fileName}.`
      };

    } catch (error) {
      console.error("Error during project export:", error);
      return {
        success: false,
        message: `Project export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  function handleThinkAloudMode(payload: any): Promise<{ success: boolean; message: string; enabled: boolean }> {
    return new Promise((resolve) => {
      const enabled = payload.enable ?? true;
      console.log(`Action indicates Think Aloud Mode should be set to ${enabled}`);
      resolve({ 
        success: true, 
        message: `Think Aloud Mode ${enabled ? 'enabled' : 'disabled'}.`,
        enabled: enabled
      });
    });
  }

  async function handleChainOfThoughtAnalysis(payload: any): Promise<{ success: boolean; message: string }> {
    // Use async here as we are calling the AI service
    console.log("Performing Chain of Thought Analysis:", payload);
    const { goal, context } = payload;

    if (!goal) {
      return { success: false, message: "Analysis failed: Goal is required." };
    }

    try {
      // Construct a focused prompt for the analysis
      let analysisPrompt = `Perform a detailed chain-of-thought analysis for the following goal: "${goal}". Break down the problem, consider constraints, and outline the steps needed to achieve the goal.`;
      if (context && Object.keys(context).length > 0) {
        analysisPrompt += `\n\nConsider the following context:\n${JSON.stringify(context, null, 2)}`;
      }
      analysisPrompt += `\n\nProvide only the step-by-step analysis as your response.`;

      // Prepare minimal messages for this specific task
      const analysisMessages: AIMessage[] = [
        { id: uuidv4(), role: 'user', content: analysisPrompt, timestamp: Date.now() }
      ];

      // Call the OpenAI service for the analysis
      // Use appropriate settings for analysis, not necessarily the user's current settings
      const analysisResponse = await openAIService.sendMessage(
        analysisMessages,
        "You are an analytical assistant performing chain-of-thought reasoning.", // Specific system context for this internal call
        [], // No actions available for this internal call
        "detailed", // Ensure detailed output
        "moderate", // Moderate complexity is usually fine for analysis
        "Helpful Assistant" // Role focused on explanation
        // No forceToolChoice needed
      );

      if (analysisResponse.content) {
        // Return the AI's analysis as the message
        return {
          success: true,
          message: `Chain of Thought Analysis Result:\n---\n${analysisResponse.content}`
        };
      } else {
        throw new Error("AI returned no content for the analysis.");
      }

    } catch (error) {
      console.error("Error during Chain of Thought Analysis:", error);
      return {
        success: false,
        message: `Chain of Thought Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async function handleSuggestOptimizations(payload: any): Promise<{ success: boolean; message: string }> {
    console.log("Suggesting Optimizations:", payload);
    const { target, selectedIds } = payload;

    try {
      let relevantElements = getCanvasElements();
      let contextDescription = "the entire current scene";

      // Filter elements if specific IDs are targeted
      if (selectedIds && Array.isArray(selectedIds) && selectedIds.length > 0) {
        relevantElements = relevantElements.filter(el => selectedIds.includes(el.id));
        if (relevantElements.length === 0 && selectedIds.length > 0) {
          return { success: false, message: `Optimization suggestion failed: No elements found with the specified IDs: ${selectedIds.join(', ')}.` };
        }
        contextDescription = `the following selected element(s):\n${JSON.stringify(relevantElements.map(el => ({ id: el.id, type: el.type, name: el.name })), null, 2)}`;
      } else if (relevantElements.length === 0) {
          return { success: false, message: "Optimization suggestion failed: The canvas is empty." };
      }
      
      // Construct a focused prompt for optimization suggestions
      let optimizationPrompt = `Please suggest potential optimizations for ${contextDescription}.`;
      if (target) {
        optimizationPrompt += `\nFocus specifically on optimizations related to: ${target}.`;
      }
      optimizationPrompt += `\n
Consider aspects like performance, manufacturability, cost-effectiveness, or design principles based on the target. Provide actionable suggestions.`;

      // Include summary of relevant elements in the prompt if helpful (avoid overly large prompts)
      const elementSummary = relevantElements.slice(0, 10).map(el => ({ // Limit summary size
          id: el.id,
          type: el.type,
          name: el.name,
          // Add a few key properties if relevant to optimization target
          ...(target === 'geometry' && { 
              position: {x: el.x, y: el.y, z: el.z }, 
              dimensions: { w: el.width, h: el.height, d: el.depth, r: el.radius }
          }),
          ...(target === 'materials' && { material: el.material, color: el.color })
      }));

      if (relevantElements.length > 0) {
          optimizationPrompt += `\n\nRelevant Element Summary:\n${JSON.stringify(elementSummary, null, 2)}`;
          if (relevantElements.length > 10) {
              optimizationPrompt += `\n...(summary truncated for brevity, ${relevantElements.length} elements total in scope)`
          }
      }

      optimizationPrompt += `\n\nProvide only the optimization suggestions as your response.`;

      // Prepare messages for this specific task
      const optimizationMessages: AIMessage[] = [
        { id: uuidv4(), role: 'user', content: optimizationPrompt, timestamp: Date.now() }
      ];

      // Call the OpenAI service for the suggestions
      const optimizationResponse = await openAIService.sendMessage(
        optimizationMessages,
        "You are a CAD/CAM optimization expert providing actionable suggestions.", // System context
        [], // No actions
        "detailed",
        "moderate",
        "CAD Expert" // Role
      );

      if (optimizationResponse.content) {
        return {
          success: true,
          message: `Optimization Suggestions:\n---\n${optimizationResponse.content}`
        };
      } else {
        throw new Error("AI returned no content for optimization suggestions.");
      }

    } catch (error) {
      console.error("Error during Suggest Optimizations:", error);
      return {
        success: false,
        message: `Suggest Optimizations failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
  // --- END NEW HANDLER IMPLEMENTATIONS ---
}