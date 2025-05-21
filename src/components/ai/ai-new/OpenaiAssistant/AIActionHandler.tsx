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
    <div className=" border-gray-200 p-3 dark:bg-gray-900 dark:border-gray-700 rounded-2xl dark:text-white bg-gray-50">
      <h3 className="text-sm font-medium text-gray-700 dark:text-white mb-2">Pending Actions</h3>
      <div className="space-y-2">
        {actions.map((action, index) => (
          <div 
            key={`${action.type}-${index}`}
            className="border border-blue-200 dark:border-blue-700 rounded-md bg-blue-50 dark:bg-blue-900 p-3"
          >
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium text-blue-700 dark:text-blue-400">{action.type}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{action.description}</p>
              </div>
              <button
                onClick={() => onExecute(action)}
                disabled={isProcessing}
                className={`px-3 py-1 rounded-md text-sm ${
                  isProcessing
                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-800'
                }`}
              >
                {isProcessing ? 'Processing...' : 'Execute'}
              </button>
            </div>
            <div className="mt-2 text-xs bg-white dark:bg-gray-900 p-2 rounded border border-gray-200 dark:border-gray-700 overflow-x-auto max-h-40 overflow-y-auto">
              <pre>{JSON.stringify(action.payload, null, 2)}</pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};