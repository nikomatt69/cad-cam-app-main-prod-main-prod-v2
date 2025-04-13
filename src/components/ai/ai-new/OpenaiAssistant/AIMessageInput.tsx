// src/components/ai/AIMessageInput.tsx
import React, { useState, useRef, useEffect } from 'react';

interface AIMessageInputProps {
  onSendMessage: (message: string) => void;
  isProcessing: boolean;
  placeholder?: string;
}

export const AIMessageInput: React.FC<AIMessageInputProps> = ({
  onSendMessage,
  isProcessing,
  placeholder = 'Type a message...'
}) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Auto-resize textarea as user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);
  
  const handleSend = () => {
    if (message.trim() && !isProcessing) {
      onSendMessage(message);
      setMessage('');
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  return (
    <div className="border-t border-gray-200 p-3">
      <div className="flex items-end space-x-2">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isProcessing}
          rows={1}
          className="flex-1 resize-none max-h-[120px] p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 overflow-y-auto"
        />
        <button
          onClick={handleSend}
          disabled={!message.trim() || isProcessing}
          className={`px-4 py-2 rounded-md transition-colors ${
            !message.trim() || isProcessing
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isProcessing ? (
            <div className="w-5 h-5 border-t-2 border-r-2 border-white rounded-full animate-spin" />
          ) : (
            'Send'
          )}
        </button>
      </div>
    </div>
  );
};