import React from 'react';
import { AIAction } from '@/src/types/AITypes';
import { CADElementPreview } from './CADElementPreview';

interface CADActionHandlerProps {
  actions: AIAction[];
  onExecute: (action: AIAction) => void;
  isProcessing: boolean;
}

export const CADActionHandler: React.FC<CADActionHandlerProps> = ({
  actions,
  onExecute,
  isProcessing
}) => {
  if (actions.length === 0) return null;
  
  // Get a user-friendly name for the action type
  const getActionName = (type: string): string => {
    switch (type) {
      case 'generateCADElement':
        return 'Create Elements';
      case 'updateCADElement':
        return 'Update Element';
      case 'removeCADElement':
        return 'Remove Element';
      case 'groupCADElements':
        return 'Group Elements';
      default:
        return type.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    }
  };
  
  return (
    <div className="border-t border-gray-200 p-3 bg-gray-50">
      <h3 className="text-sm font-medium text-gray-700 mb-2">CAD Operations</h3>
      <div className="space-y-3">
        {actions.map((action, index) => (
          <div 
            key={`${action.type}-${index}`}
            className="border border-blue-200 rounded-md bg-blue-50 p-3"
          >
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium text-blue-700">{getActionName(action.type)}</h4>
                <p className="text-sm text-gray-600">{action.description}</p>
              </div>
              <button
                onClick={() => onExecute(action)}
                disabled={isProcessing}
                className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                  isProcessing
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isProcessing ? 'Processing...' : 'Apply Changes'}
              </button>
            </div>
            
            {/* Render action-specific preview */}
            {action.type === 'generateCADElement' && (
              <CADElementPreview action={action} />
            )}
            
            {action.type === 'updateCADElement' && (
              <div className="mt-2 bg-white p-2 rounded border border-gray-200 text-xs">
                <div className="font-medium">Element ID: {action.payload.id}</div>
                <div className="mt-1">Properties to update:</div>
                <pre className="mt-1 text-xs bg-gray-50 p-1 rounded">
                  {JSON.stringify(action.payload.properties, null, 2)}
                </pre>
              </div>
            )}
            
            {action.type === 'removeCADElement' && (
              <div className="mt-2 bg-white p-2 rounded border border-gray-200 text-xs">
                <div className="font-medium text-red-600">
                  Remove element with ID: {action.payload.id}
                </div>
              </div>
            )}
            
            {action.type === 'groupCADElements' && (
              <div className="mt-2 bg-white p-2 rounded border border-gray-200 text-xs">
                <div className="font-medium">
                  Group {action.payload.elementIds?.length || 0} elements
                  {action.payload.groupName ? ` as "${action.payload.groupName}"` : ''}
                </div>
                <div className="mt-1">Element IDs:</div>
                <div className="mt-1 bg-gray-50 p-1 rounded max-h-20 overflow-y-auto">
                  {action.payload.elementIds?.map((id: string) => (
                    <div key={id} className="text-xs">{id}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};