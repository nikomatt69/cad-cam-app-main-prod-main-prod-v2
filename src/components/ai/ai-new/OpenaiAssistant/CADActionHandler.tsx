import React from 'react';
import { AIAction } from '@/src/types/AITypes';
import { CADElementPreview } from './CADElementPreview';
import { ComponentPreviewSection } from '../ComponentPreviewSection';
import { ThreeDPreview } from 'src/pages/components/[id]';
import { ComponentData } from '@/src/types/component';
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
      case 'autoQuoteCADElements':
        return 'Auto Quote Elements';
      case 'generate2DTechnicalDrawings':
        return 'Generate 2D Technical Drawings';
      case 'simulatePhysicalProperties':
        return 'Simulate Physical Properties';  
      case 'analyzeManufacturability':
        return 'Analyze Manufacturability';
        
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
            
            {/* Render action-specific preview or general payload */}
            <div className="mt-2 text-xs">
              <div className="font-medium text-gray-600 mb-1">Payload Preview:</div>
              <pre className="bg-white dark:bg-gray-700 p-2 rounded border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {action.payload ? JSON.stringify(action.payload, null, 2) : '{}'}
              </pre>
            </div>
            
            {/* Aggiungi l'anteprima per le azioni di generazione */}
            <ComponentPreviewSection action={action.payload} />
           
            {/* Specific previews (can be removed if general payload is sufficient) */}
            {/* Example: Keep specific preview for generateCADElement if needed */}
             
            {action.type === 'generateCADElement' && (
              <CADElementPreview action={action} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};