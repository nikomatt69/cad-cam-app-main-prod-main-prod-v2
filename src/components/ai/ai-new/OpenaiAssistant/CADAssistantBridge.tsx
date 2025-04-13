import React, { useState, useEffect } from 'react';
import { useElementsStore } from '@/src/store/elementsStore';
import { CADAssistantOpenai } from './CADAssistantOpenai';
import { createCadActionHandler } from '@/src/lib/ai/cadActionHandler';

interface CADAssistantBridgeProps {
  isVisible: boolean;
  onClose: () => void;
}

export const CADAssistantBridge: React.FC<CADAssistantBridgeProps> = ({
  isVisible,
  onClose
}) => {
  // Get access to the elements store
  const { elements, addElements, updateElement, deleteElement } = useElementsStore();
  
  // Create a context provider for the CAD operations
  const [cadContext, setCadContext] = useState<any>(null);
  
  // Update CAD context when elements change
  useEffect(() => {
    // Extract relevant information from elements for the AI
    const cadContextData = {
      elementCount: elements.length,
      elementTypes: Array.from(new Set(elements.map(el => el.type))),
      elementSummary: elements.map(el => ({
        id: el.id,
        type: el.type,
        position: { x: el.x, y: el.y, z: el.z },
        dimensions: {
          width: el.width,
          height: el.height,
          depth: el.depth,
          radius: el.radius
        },
        color: el.color
      }))
    };
    
    setCadContext(cadContextData);
  }, [elements]);
  
  // Initialize the CAD action handler
  const cadActionHandler = createCadActionHandler({
    addElementsToCanvas: addElements,
    updateElementInCanvas: updateElement,
    removeElementFromCanvas: deleteElement,
    getCanvasElements: () => elements
  });
  
  if (!isVisible) return null;
  
  return (
    <div className="cad-assistant-container">
      <CADAssistantOpenai 
        contextData={cadContext}
        actionHandler={cadActionHandler}
        onClose={onClose}
      />
    </div>
  );
};