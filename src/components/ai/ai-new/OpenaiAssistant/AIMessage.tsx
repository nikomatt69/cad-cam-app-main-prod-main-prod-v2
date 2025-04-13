// src/components/ai/AIMessage.tsx
import React from 'react';
import { AIMessage as AIMessageType, AIArtifact } from '../../../../types/AITypes';
import { AIArtifactRenderer } from './AIArtifactRenderer';

interface AIMessageProps {
  message: AIMessageType;
}

export const AIMessage: React.FC<AIMessageProps> = ({ message }) => {
  const { role, content, timestamp, artifacts } = message;
  
  // Format the timestamp
  const formattedTime = new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
  
  return (
    <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[80%] rounded-lg p-3 ${
        role === 'user'
          ? 'bg-blue-600 text-white'
          : role === 'system' 
            ? 'bg-gray-200 text-gray-800 border border-gray-300'
            : 'bg-gray-100 text-gray-800'
      }`}>
        {/* Role indicator */}
        <div className="flex items-center mb-1">
          <span className={`text-xs font-semibold ${
            role === 'user' ? 'text-blue-200' : 'text-gray-500'
          }`}>
            {role === 'user' ? 'You' : role === 'assistant' ? 'AI Assistant' : 'System'}
          </span>
          <span className={`ml-auto text-xs ${
            role === 'user' ? 'text-blue-200' : 'text-gray-500'
          }`}>
            {formattedTime}
          </span>
        </div>
        
        {/* Message content */}
        <div className="whitespace-pre-wrap break-words">
          {content}
        </div>
        
        {/* Render any artifacts */}
        {artifacts && artifacts.length > 0 && (
          <div className="mt-2 space-y-2">
            {artifacts.map((artifact: { id: any; }) => ( 
              <AIArtifactRenderer 
                key={artifact.id} 
                artifact={artifact.id} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};