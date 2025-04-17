// src/components/ai/AIMessage.tsx
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react'; 
import { motion } from 'framer-motion';
import { AIMessage as AIMessageType, AIArtifact, TextContentBlock, ImageContentBlock, MessageContent, AIAction } from '../../../../types/AITypes';
import { Element } from '@/src/store/elementsStore';
import { useAI } from '../AIContextProvider';
import { AIArtifactRenderer } from './AIArtifactRenderer';
import { ThumbsUp, ThumbsDown, PlusSquare, AlertCircle, Cpu } from 'react-feather'; 
import { CADActionHandler } from './CADActionHandler';

interface AIMessageProps {
  message: AIMessageType; // Keep message prop, even for typing indicator
  onFeedback?: (messageId: string, rating: 'good' | 'bad') => void;
  onExecuteAction?: (action: AIAction) => void;
  isTypingIndicator?: boolean; 
}

// Helper function to render message content (text and images)
const renderMessageContent = (content: MessageContent) => {
  if (typeof content === 'string') {
    return <div className="whitespace-pre-wrap break-words">{content}</div>;
  } else if (Array.isArray(content)) {
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

// TypingDots component
const TypingDots = () => (
  <motion.div 
    className="flex space-x-1 items-center justify-center h-full px-1"
    initial="start"
    animate="end"
    variants={{
      start: { transition: { staggerChildren: 0.2 } },
      end: { transition: { staggerChildren: 0.2 } },
    }}
  >
    {[0, 1, 2].map(i => (
      <motion.div
        key={i}
        className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full"
        variants={{
          start: { y: "0%" },
          end: { y: "-40%" },
        }}
        transition={{ duration: 0.4, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
      />
    ))}
  </motion.div>
);

export const AIMessage: React.FC<AIMessageProps> = ({ message, onFeedback, onExecuteAction, isTypingIndicator = false }) => {
  // Call hooks unconditionally at the top
  const { addElementsToCanvas, state } = useAI();
  const { data: session } = useSession(); 
  const [elementsAdded, setElementsAdded] = useState<Record<string, boolean>>({});

  // Destructure message properties *after* hooks
  // Provide defaults for typing indicator case where message might be minimal
  const { 
    id = 'typing-indicator', 
    role = 'assistant', 
    content = '', 
    timestamp = Date.now(), 
    artifacts = [], 
    isError = false 
  } = message || {};

  // Regular message useEffect (only relevant if not typing indicator)
  useEffect(() => {
    if (!isTypingIndicator && artifacts && artifacts.length > 0) {
      // Existing artifact logic
    }
  }, [artifacts, id, isTypingIndicator]);

  // Regular message handler (only relevant if not typing indicator)
  const handleAddElements = (artifactId: string, elements: any) => {
    if (isTypingIndicator || !elements || !Array.isArray(elements)) {
      return;
    }
    addElementsToCanvas(elements as Element[]);
    setElementsAdded(prev => ({ ...prev, [artifactId]: true }));
  };

  // --- Common variables (can be used by both typing indicator and regular message) ---
  const formattedTime = new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  const userInitial = session?.user?.name?.charAt(0) || '?';
  const userImage = session?.user?.image;

  // Determine message bubble style based on role/error, default to assistant style for typing
  const messageBubbleClasses = role === 'user'
    ? 'bg-blue-600 text-white rounded-lg rounded-br-none' 
    : isError
      ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-700 rounded-lg rounded-bl-none' 
      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100 rounded-lg rounded-bl-none'; 
  
  // Determine timestamp style based on role/error, default to assistant style for typing
  const timestampClasses = role === 'user'
    ? 'text-blue-200'
    : isError
      ? 'text-red-600 dark:text-red-400'
      : 'text-gray-400 dark:text-gray-300';

  // --- Render logic ---

  const renderAvatar = () => (
    <div className="flex-shrink-0 w-7 h-7 rounded-full overflow-hidden mt-1 border border-gray-300 dark:border-gray-600">
      {role === 'assistant' ? (
        <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-600">
          <Cpu size={16} className="text-gray-600 dark:text-gray-300" />
        </div>
      ) : userImage ? (
        <img src={userImage} alt="User" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-blue-100 dark:bg-blue-900">
          <span className="text-blue-800 dark:text-blue-300 font-medium">
            {userInitial}
          </span>
        </div>
      )}
    </div>
  );

  const renderMessageBubble = () => (
    <div className={`flex-grow rounded-lg p-2.5 shadow-sm ${messageBubbleClasses} ${isTypingIndicator ? 'min-h-[36px] flex items-center' : ''}`}>
      {isTypingIndicator ? (
        <TypingDots />
      ) : (
        <>
          {/* Content */}
          <div className={`text-sm ${isError ? 'text-red-800 dark:text-red-200' : ''}`}>
            {renderMessageContent(content)}
          </div>
          
          {/* Artifacts */}
          {artifacts && artifacts.length > 0 && !isError && (
             <div className="mt-2 space-y-2">
               {artifacts.map((artifact) => {
                 // ... (existing artifact mapping logic - ensure handleAddElements is called correctly) ...
                  if (artifact.type === 'cad_elements') {
                    const isAdded = !!elementsAdded[artifact.id];
                    return (
                      <div key={artifact.id} className="bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-600">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                          {artifact.title || 'Generated CAD Elements'} ({Array.isArray(artifact.content) ? artifact.content.length : 0} items)
                        </p>
                        <button
                          onClick={() => handleAddElements(artifact.id, artifact.content)} // Pass args
                          disabled={isAdded}
                          className={`flex items-center justify-center w-full px-3 py-1.5 text-xs font-medium rounded ${
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
                      const actionsFromArtifact: AIAction[] = artifact.content || []; 
                      const actionsToRender: AIAction[] = actionsFromArtifact.map((action: AIAction) => ({
                          type: action.type || 'unknown_action',
                          payload: action.payload || {},
                          description: action.description || `Execute ${action.type || 'tool call'}`,
                      }));

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

          {/* Feedback */}
          {role === 'assistant' && onFeedback && !isError && (
            <div className="mt-2 pt-1.5 border-t border-gray-200 dark:border-gray-600 flex justify-end space-x-2">
              <button 
                onClick={() => onFeedback(id, 'good')} 
                className="text-gray-400 hover:text-green-500 transition-colors p-0.5 rounded"
                title="Good response"
              >
                <ThumbsUp size={14} />
              </button>
              <button 
                onClick={() => onFeedback(id, 'bad')} 
                className="text-gray-400 hover:text-red-500 transition-colors p-0.5 rounded"
                title="Bad response"
              >
                <ThumbsDown size={14} />
              </button>
            </div>
          )}
          
          {/* Timestamp */}
          <div className={`text-right mt-1 text-xs ${timestampClasses}`}>
            {formattedTime}
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className={`flex w-full mb-3 ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex items-start space-x-2 max-w-[85%] ${role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
        {renderAvatar()}
        {renderMessageBubble()}
      </div>
    </div>
  );
};