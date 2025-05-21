import React from 'react';
import { AIAction } from '@/src/types/AITypes';
import { Box, Cylinder, Dot, Minus, Pyramid, Torus } from 'lucide-react';


interface CADElementPreviewProps {
  action: AIAction;
}

export const CADElementPreview: React.FC<CADElementPreviewProps> = ({ action }) => {
  if (action.type !== 'generateCADElement' || !action.payload.elements) {
    return null;
  }
  const PrismIcon = () => (
    <svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="12,2 20,7 20,17 12,22 4,17 4,7" />
    </svg>
  );

  const HemisphereIcon = () => (
    <svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12,12 C16.4183,12 20,8.41828 20,4 C20,-0.418278 16.4183,-4 12,-4 C7.58172,-4 4,-0.418278 4,4 C4,8.41828 7.58172,12 12,12 Z" />
      <line x1="4" y1="4" x2="20" y2="4" />
    </svg>
  );

  const EllipsoidIcon = () => (
    <svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
      <ellipse cx="12" cy="12" rx="8" ry="5" />
    </svg>
  );

  const CapsuleIcon = () => (
    <svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12,20 L12,4" />
      <path d="M7,4 A5,5 0 0 1 17,4" />
      <path d="M7,20 A5,5 0 0 0 17,20" />
    </svg>
  );

  const EllipseIcon = () => (
    <svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
      <ellipse cx="12" cy="12" rx="10" ry="6" />
    </svg>
  );

  return (
    <div className="mt-3 border border-blue-100 dark:border-blue-700 rounded-md p-2 bg-blue-50 dark:bg-blue-900">
      <h4 className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-2">
        Elements to be created ({action.payload.elements.length}):
      </h4>
      <div className="max-h-40 overflow-y-auto space-y-1">
        {action.payload.elements.map((element: any, index: number) => (
          <div 
            key={index}
            className="flex items-center p-1.5 bg-white dark:bg-gray-900 rounded-md border border-blue-100 dark:border-blue-700"
          >
            {/* Element icon based on type */}
            <div className="mr-2 text-gray-500 dark:text-gray-400 ">
              {element.type === 'cube' && <Box size={14} />}
              {element.type === 'sphere' && <Circle size={14} />}
              {element.type === 'cylinder' && <Cylinder size={14} />}
              {element.type === 'cone' && <Triangle size={14} />}
              {element.type === 'torus' && <Torus size={14} />}
              {element.type === 'pyramid' && <Pyramid size={14} />}
              {element.type === 'prism' && <PrismIcon />}
              {element.type === 'line' && <Minus size={14} />}
              {element.type === 'hemisphere' && <HemisphereIcon  />}
              {element.type === 'ellipsoid' && <EllipsoidIcon  />}
              {element.type === 'capsule' && <CapsuleIcon  />}
              {element.type === 'ellipse' && <EllipseIcon  />}
              {!['cube', 'sphere', 'cylinder', 'cone', 'ellipse', 'prism', 'hemisphere', 'pyramid', 'torus'].includes(element.type) && <Box size={14} />}
            </div>
            
            {/* Color preview */}
            <div 
              className="w-4 h-4 rounded-sm mr-2"
              style={{ backgroundColor: element.color || '#1e88e5' }}
            />
            
            {/* Element info */}  
            <div className="flex-1">
              <div className="text-xs font-medium capitalize">{element.type}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Position: ({Math.round(element.x || 0)}, {Math.round(element.y || 0)}, {Math.round(element.z || 0)})
              </div>
            </div>
            
            {/* Dimensions */}
            <div className="text-xs text-gray-500 dark:text-gray-400">
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