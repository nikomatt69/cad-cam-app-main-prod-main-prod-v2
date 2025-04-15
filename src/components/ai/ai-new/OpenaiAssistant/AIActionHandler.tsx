// src/components/ai/AIActionHandler.tsx
import React from 'react';
import { AIAction } from '../../../../types/AITypes';

interface AIActionHandlerProps {
  actions: AIAction[];
  onExecute: (action: AIAction) => void;
  isProcessing: boolean;
}

export const AIActionHandler: React.FC<AIActionHandlerProps> = ({
  actions,
  onExecute,
  isProcessing
}) => {
  if (actions.length === 0) return null;
  
  return (
    <div className="border-t border-gray-200 p-3 bg-gray-50">
      <h3 className="text-sm font-medium text-gray-700 mb-2">Pending Actions</h3>
      <div className="space-y-2">
        {actions.map((action, index) => (
          <div 
            key={`${action.type}-${index}`}
            className="border border-blue-200 rounded-md bg-blue-50 p-3"
          >
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium text-blue-700">{action.type}</h4>
                <p className="text-sm text-gray-600">{action.description}</p>
              </div>
              <button
                onClick={() => onExecute(action)}
                disabled={isProcessing}
                className={`px-3 py-1 rounded-md text-sm ${
                  isProcessing
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isProcessing ? 'Processing...' : 'Execute'}
              </button>
            </div>
            <div className="mt-2 text-xs bg-white p-2 rounded border border-gray-200 overflow-x-auto max-h-40 overflow-y-auto">
              <pre>{JSON.stringify(action.payload, null, 2)}</pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};