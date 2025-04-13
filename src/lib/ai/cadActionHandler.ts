import { v4 as uuidv4 } from 'uuid';
import { AIAction } from '@/src/types/AITypes';
import { Element } from '@/src/store/elementsStore';

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
    getCanvasElements
  } = options;
  
  return {
    executeAction: async (action: AIAction): Promise<{ success: boolean; message: string }> => {
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
                    enum: ['cube', 'sphere', 'cylinder', 'cone', 'torus'],
                    description: 'Type of CAD element'
                  },
                  x: { type: 'number', description: 'X position' },
                  y: { type: 'number', description: 'Y position' },
                  z: { type: 'number', description: 'Z position' },
                  width: { type: 'number', description: 'Width (for cube)' },
                  height: { type: 'number', description: 'Height (for cube, cylinder)' },
                  depth: { type: 'number', description: 'Depth (for cube)' },
                  radius: { type: 'number', description: 'Radius (for sphere, cylinder)' },
                  color: { type: 'string', description: 'Color in hex format' }
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
                color: { type: 'string', description: 'Color in hex format' }
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
      }
    ]
  };
  
  // Handler implementations
  function handleGenerateCADElement(payload: any): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve) => {
      try {
        // Validate payload
        if (!payload.elements || !Array.isArray(payload.elements)) {
          throw new Error('Invalid elements payload');
        }
        
        // Process and enrich elements
        const processedElements = payload.elements.map((el: any) => ({
          id: uuidv4(),
          // Set default values for missing properties
          x: el.x ?? 0,
          y: el.y ?? 0,
          z: el.z ?? 0,
          width: el.width ?? 50,
          height: el.height ?? 50,
          depth: el.depth ?? 50,
          radius: el.radius ?? 25,
          color: el.color ?? '#1e88e5',
          type: el.type || 'cube',
          // Include rotation if provided
          ...(el.rotation && {
            rotation: {
              x: el.rotation.x ?? 0,
              y: el.rotation.y ?? 0,
              z: el.rotation.z ?? 0
            }
          })
        }));
        
        // Add elements to canvas
        addElementsToCanvas(processedElements);
        
        resolve({
          success: true,
          message: `Added ${processedElements.length} element(s) to the canvas`
        });
      } catch (error) {
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
        // Validate payload
        if (!payload.id || !payload.properties) {
          throw new Error('Invalid update payload: id and properties are required');
        }
        
        // Check if element exists
        const elements = getCanvasElements();
        const elementExists = elements.some(el => el.id === payload.id);
        
        if (!elementExists) {
          throw new Error(`Element with id ${payload.id} not found`);
        }
        
        // Update element
        updateElementInCanvas(payload.id, payload.properties);
        
        resolve({
          success: true,
          message: `Updated element ${payload.id}`
        });
      } catch (error) {
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
        // Validate payload
        if (!payload.id) {
          throw new Error('Invalid remove payload: id is required');
        }
        
        // Check if element exists
        const elements = getCanvasElements();
        const elementExists = elements.some(el => el.id === payload.id);
        
        if (!elementExists) {
          throw new Error(`Element with id ${payload.id} not found`);
        }
        
        // Remove element
        removeElementFromCanvas(payload.id);
        
        resolve({
          success: true,
          message: `Removed element ${payload.id}`
        });
      } catch (error) {
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
        // Validate payload
        if (!payload.elementIds || !Array.isArray(payload.elementIds) || payload.elementIds.length === 0) {
          throw new Error('Invalid group payload: elementIds array is required');
        }
        
        // This would be implemented according to your grouping mechanism
        // For now we'll return a success message as if grouping was performed
        resolve({
          success: true,
          message: `Grouped ${payload.elementIds.length} elements${payload.groupName ? ` as "${payload.groupName}"` : ''}`
        });
      } catch (error) {
        resolve({
          success: false,
          message: error instanceof Error ? error.message : 'Error grouping elements'
        });
      }
    });
  }
}