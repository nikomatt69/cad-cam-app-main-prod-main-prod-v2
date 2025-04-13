import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  X, 
  Maximize2, 
  Minimize2,
  Cpu,
  Settings,
  AlertTriangle,
  Layers
} from 'react-feather';

import { useCADAssistant } from '@/src/hooks/useCADAssistant';

import { AIAction } from '@/src/types/AITypes';
import { AIMessage } from './AIMessage';
import { CADAssistantExamples } from './CADAssistantExample';
import { AIActionHandler } from './AIActionHandler';
import { AIMessageInput } from './AIMessageInput';

interface CADAssistantOpenaiProps {
  contextData: any;
  actionHandler: any;
  onClose: () => void;
}

export const CADAssistantOpenai: React.FC<CADAssistantOpenaiProps> = ({
  contextData,
  actionHandler,
  onClose
}) => {
  const {
    messages,
    isProcessing,
    isOpen,
    pendingActions,
    sendMessage,
    toggleAssistant,
    clearMessages,
    executePendingAction
  } = useCADAssistant({ 
    contextData, 
    actionHandler 
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isPanelExpanded, setIsPanelExpanded] = React.useState(true);
  const [showSettings, setShowSettings] = React.useState(false);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed z-50 bottom-4 right-4 shadow-xl rounded-lg bg-white transition-all duration-200"
        style={{ 
          width: isPanelExpanded ? '380px' : 'auto', 
          height: isPanelExpanded ? '500px' : 'auto' 
        }}
      >
        {isPanelExpanded ? (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
              <div className="flex items-center">
                <Layers size={18} className="mr-2" />
                <div>
                  <h3 className="font-medium">CAD Assistant</h3> 
                  <div className="text-xs text-blue-100">
                    {contextData?.elementCount || 0} elements on canvas
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-1.5 rounded-full hover:bg-blue-500 transition-colors"
                  title="Settings"
                >
                  <Settings size={16} />
                </button>
                <button
                  onClick={() => setIsPanelExpanded(false)}
                  className="p-1.5 rounded-full hover:bg-blue-500 transition-colors"
                  title="Minimize"
                >
                  <Minimize2 size={16} />
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full hover:bg-blue-500 transition-colors"
                  title="Close"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            
            {/* Settings Panel */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-b border-gray-200 overflow-hidden"
                >
                  <div className="p-3 space-y-2 text-sm bg-gray-50">
                    <button
                      onClick={clearMessages}
                      className="flex items-center text-xs text-red-600 hover:text-red-800"
                    >
                      <X size={12} className="mr-1" />
                      Clear Conversation
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <Cpu size={32} className="mb-2" />
                  <p className="text-sm">I&apos;m your CAD assistant. How can I help?</p>
                  <p className="text-xs text-center mt-2 text-gray-400">
                    Try asking me to create models, modify elements, or optimize your design.
                  </p>
                </div>
              ) : (
                messages.map((message) => (
                  <AIMessage key={message.id} message={message} />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Examples Panel - only shown when no messages */}
            {messages.length === 0 && (
              <CADAssistantExamples onSelectExample={sendMessage} />
            )}
            
            {/* Action Handler */}
            {pendingActions.length > 0 && (
              <AIActionHandler
                actions={pendingActions}
                onExecute={executePendingAction}
                isProcessing={isProcessing}
              />
            )}
            
            {/* Input Area */}
            <AIMessageInput
              onSendMessage={sendMessage}
              isProcessing={isProcessing}
              placeholder="Describe what you want to create or modify..."
            />
          </div>
        ) : (
          // Minimized version
          <div className="flex items-center p-2 space-x-2">
            <button
              onClick={() => setIsPanelExpanded(true)}
              className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
              title="Expand Assistant"
            >
              <Maximize2 size={16} />
            </button>
            <span className="text-sm font-medium">CAD Assistant</span>
            <button
              onClick={onClose}
              className="p-1 text-gray-500 hover:text-gray-700 rounded-full"
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};