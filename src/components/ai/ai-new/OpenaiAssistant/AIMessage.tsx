// src/components/ai/AIMessage.tsx
import React, { useState, useEffect } from 'react';
// Import specific content types
import { AIMessage as AIMessageType, AIArtifact, TextContentBlock, ImageContentBlock, MessageContent, AIAction } from '../../../../types/AITypes';
import { Element } from '@/src/store/elementsStore';
import { useAI } from '../AIContextProvider';
import { AIArtifactRenderer } from './AIArtifactRenderer';
import { ThumbsUp, ThumbsDown, PlusSquare, AlertCircle } from 'react-feather';
import { CADActionHandler } from './CADActionHandler';

interface AIMessageProps {
  message: AIMessageType;
  onFeedback?: (messageId: string, rating: 'good' | 'bad') => void;
  onExecuteAction?: (action: AIAction) => void;
}

// Helper function to render message content (text and images)
const renderMessageContent = (content: MessageContent) => {
  if (typeof content === 'string') {
    // Simple text content
    return <div className="whitespace-pre-wrap break-words">{content}</div>;
  } else if (Array.isArray(content)) {
    // Complex content (array of blocks)
    return (
      <div className="space-y-2">
        {content.map((block, index) => {
          if (block.type === 'text') {
            return (
              <div key={index} className="whitespace-pre-wrap break-words">
                {(block as TextContentBlock).text}
              </div>
            );
          } else if (block.type === 'image_url') {
            return (
              <div key={index} className="mt-1">
                <img 
                  src={(block as ImageContentBlock).image_url.url} 
                  alt="User uploaded content" 
                  className="max-w-full h-auto rounded border border-gray-300 max-h-60 object-contain"
                />
              </div>
            );
          } else {
            return <div key={index}>[Unsupported content block type]</div>;
          }
        })}
      </div>
    );
  } else {
    return <div>[Invalid content format]</div>;
  }
};

export const AIMessage: React.FC<AIMessageProps> = ({ message, onFeedback, onExecuteAction }) => {
  const { id, role, content, timestamp, artifacts, isError } = message;
  const { addElementsToCanvas, state } = useAI();
  const [elementsAdded, setElementsAdded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (artifacts && artifacts.length > 0) {
      console.log(`[AIMessage ${id}] Received artifacts:`, artifacts);
    }
  }, [artifacts, id]);

  const handleAddElements = (artifactId: string, elements: any) => {
    if (!elements || !Array.isArray(elements)) {
      console.error("Invalid elements data in artifact:", elements);
      return;
    }
    addElementsToCanvas(elements as Element[]);
    setElementsAdded(prev => ({ ...prev, [artifactId]: true }));
  };

  const formattedTime = new Date(timestamp ?? Date.now()).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
  
  return (
    <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[80%] rounded-lg p-3 ${
        role === 'user'
          ? 'bg-blue-600 text-white'
          : isError
            ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-700'
            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100'
      } dark:border-gray-600`}>
        <div className="flex items-center mb-1">
          {isError && <AlertCircle size={14} className="mr-1.5 text-red-600 dark:text-red-400 flex-shrink-0" />}
          <span className={`text-xs font-semibold ${
            role === 'user' ? 'text-blue-200' :
            isError ? 'text-red-700 dark:text-red-300'
            : 'text-gray-400 dark:text-gray-300'
          }`}>
            {role === 'user' ? 'You' : role === 'assistant' ? 'AI Assistant' : 'System'} {isError ? '(Error)' : ''}
          </span>
          <span className={`ml-auto text-xs ${
            role === 'user' ? 'text-blue-200' :
            isError ? 'text-red-600 dark:text-red-400'
            : 'text-gray-400 dark:text-gray-300'
          }`}>
            {formattedTime}
          </span>
        </div>
        
        <div className={isError ? 'text-red-800 dark:text-red-200' : ''}>
          {renderMessageContent(content)}
        </div>
        
        {artifacts && artifacts.length > 0 && !isError && (
          <div className="mt-2 space-y-2">
            {artifacts.map((artifact) => {
              console.log(`[AIMessage ${id}] Mapping artifact:`, artifact.id, artifact.type);

              if (artifact.type === 'cad_elements') {
                console.log(`[AIMessage ${id}] Rendering cad_elements artifact:`, artifact.id);
                const isAdded = !!elementsAdded[artifact.id];
                return (
                  <div key={artifact.id} className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded border border-blue-200 dark:border-blue-700">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                      {artifact.title || 'Generated CAD Elements'} ({Array.isArray(artifact.content) ? artifact.content.length : 0} items)
                    </p>
                    <button
                      onClick={() => handleAddElements(artifact.id, artifact.content)}
                      disabled={isAdded}
                      className={`flex items-center justify-center w-full px-3 py-1.5 text-sm font-medium rounded ${
                        isAdded
                          ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      } transition-colors`}
                    >
                      <PlusSquare size={14} className="mr-1.5" />
                      {isAdded ? 'Elements Added' : 'Add to Canvas'}
                    </button>
                  </div>
                );
              } else if (artifact.type === 'tool_calls') {
                  console.log(`[AIMessage ${id}] Rendering tool_calls artifact:`, artifact.id);
                  const actionsFromArtifact: AIAction[] = artifact.content || []; 
                  const actionsToRender: AIAction[] = actionsFromArtifact.map((action: AIAction) => { 
                      return {
                          type: action.type || 'unknown_action',
                          payload: action.payload || {},
                          description: action.description || `Execute ${action.type || 'tool call'}`,
                      };
                  });

                  if (actionsToRender.length === 0) return null; 

                  return (
                      <CADActionHandler
                          key={artifact.id} 
                          actions={actionsToRender}
                          onExecute={onExecuteAction || (() => console.error('onExecuteAction prop not provided to AIMessage'))} 
                          isProcessing={state.isProcessing} 
                      />
                  );
              }
              
              return (
                <AIArtifactRenderer
                  key={artifact.id}
                  artifact={artifact}
                />
              );
            })}
          </div>
        )}

        {role === 'assistant' && onFeedback && !isError && (
          <div className="mt-2 pt-1 border-t border-gray-200 dark:border-gray-600 flex justify-end space-x-2">
            <button 
              onClick={() => onFeedback(id, 'good')} 
              className="text-gray-400 hover:text-green-500 transition-colors"
              title="Good response"
            >
              <ThumbsUp size={14} />
            </button>
            <button 
              onClick={() => onFeedback(id, 'bad')} 
              className="text-gray-400 hover:text-red-500 transition-colors"
              title="Bad response"
            >
              <ThumbsDown size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};