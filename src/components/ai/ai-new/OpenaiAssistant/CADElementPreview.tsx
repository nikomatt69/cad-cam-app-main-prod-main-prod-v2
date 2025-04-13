import React from 'react';
import { AIAction } from '@/src/types/AITypes';
import { Box, Cylinder } from 'lucide-react';


interface CADElementPreviewProps {
  action: AIAction;
}

export const CADElementPreview: React.FC<CADElementPreviewProps> = ({ action }) => {
  if (action.type !== 'generateCADElement' || !action.payload.elements) {
    return null;
  }
  
  return (
    <div className="mt-3 border border-blue-100 rounded-md p-2 bg-blue-50">
      <h4 className="text-xs font-medium text-blue-700 mb-2">
        Elements to be created ({action.payload.elements.length}):
      </h4>
      <div className="max-h-40 overflow-y-auto space-y-1">
        {action.payload.elements.map((element: any, index: number) => (
          <div 
            key={index}
            className="flex items-center p-1.5 bg-white rounded-md border border-blue-100"
          >
            {/* Element icon based on type */}
            <div className="mr-2 text-gray-500">
              {element.type === 'cube' && <Box size={14} />}
              {element.type === 'sphere' && <Circle size={14} />}
              {element.type === 'cylinder' && <Cylinder size={14} />}
              {element.type === 'cone' && <Triangle size={14} />}
              {!['cube', 'sphere', 'cylinder', 'cone'].includes(element.type) && <Box size={14} />}
            </div>
            
            {/* Color preview */}
            <div 
              className="w-4 h-4 rounded-sm mr-2"
              style={{ backgroundColor: element.color || '#1e88e5' }}
            />
            
            {/* Element info */}
            <div className="flex-1">
              <div className="text-xs font-medium capitalize">{element.type}</div>
              <div className="text-xs text-gray-500">
                Position: ({Math.round(element.x || 0)}, {Math.round(element.y || 0)}, {Math.round(element.z || 0)})
              </div>
            </div>
            
            {/* Dimensions */}
            <div className="text-xs text-gray-500">
              {element.type === 'cube' && (
                <span>{element.width || 50}×{element.height || 50}×{element.depth || 50}</span>
              )}
              {['sphere', 'cylinder', 'cone'].includes(element.type) && (
                <span>r: {element.radius || 25}</span>
              )}
              {element.type === 'cylinder' && (
                <span>, h: {element.height || 50}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Simple shape components for icons
const Circle: React.FC<{ size: number }> = ({ size }) => (
  <div 
    style={{ 
      width: size, 
      height: size, 
      borderRadius: '50%', 
      border: '1.5px solid currentColor' 
    }} 
  />
);

const Triangle: React.FC<{ size: number }> = ({ size }) => (
  <div 
    style={{ 
      width: 0,
      height: 0,
      borderLeft: `${size/2}px solid transparent`,
      borderRight: `${size/2}px solid transparent`,
      borderBottom: `${size}px solid currentColor`
    }} 
  />
);