import React, { useRef, useEffect, useState } from 'react';
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
import toast, { Toaster } from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

import { useAI } from '../AIContextProvider';

import { AIAction, AIModelType, AIMessage as AIMessageType, AIHistoryItem, MessageContent } from '@/src/types/AITypes';
import { CADAssistantExamples } from './CADAssistantExample';
import { AIActionHandler } from './AIActionHandler';
import { AIMessageInput, ToolName, SelectedFileData } from './AIMessageInput';
import { FeedbackForm } from './FeedbackForm';
import { CADAssistantSettingsPanel } from './CADAssistantSettingsPanel';
import { AIMessage } from './AIMessage';
import AISettingsPanel from '../AISettingsPanel';
import AIProcessingIndicator from '../AIProcessingIndicator';
import { useElementsStore } from '@/src/store/elementsStore';
import { AIMessage as AIMessageComponent } from './AIMessage';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/Tabs";
import { ContextAwareGenerationPanel } from './ContextAwareGenerationPanel';

interface ConstraintPreset {
  id: string;
  name: string;
  description: string;
  constraints: Record<string, any>;
}

interface CADAssistantOpenaiProps {
  contextData: any;
  actionHandler: any;
  onClose: () => void;
  availableModels?: AIModelType[];
  constraintPresets?: ConstraintPreset[];
  availableElementTypes?: string[];
  isProcessing: boolean;
  pendingActions: AIAction[];
  clearMessages: () => void;
  executePendingAction: (action: AIAction) => Promise<{ success: boolean; message: string }>;
}

export const CADAssistantOpenai: React.FC<CADAssistantOpenaiProps> = ({
  contextData,
  actionHandler,
  onClose,
  availableModels = ['gpt-4.1' as AIModelType],
  constraintPresets = [],
  availableElementTypes = [],
  isProcessing,
  pendingActions,
  clearMessages,
  executePendingAction
}) => {
  const { state, textToCAD: contextTextToCAD, sendAssistantMessage: contextSendAssistantMessage, dispatch } = useAI();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isPanelExpanded, setIsPanelExpanded] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedModel, setSelectedModel] = useState<AIModelType>(state.currentModel || availableModels[0] || 'gpt-4.1' as AIModelType);
  const [maxTokens, setMaxTokens] = useState<number>(state.settings.maxTokens || 6000);
  const [complexity, setComplexity] = useState<number>(0.5);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('custom');
  const [customMaxWidth, setCustomMaxWidth] = useState<number>(200);
  const [customMaxHeight, setCustomMaxHeight] = useState<number>(200);
  const [customMaxDepth, setCustomMaxDepth] = useState<number>(200);
  const [customPreferredTypes, setCustomPreferredTypes] = useState<string[]>([]);
  const [generationStatus, setGenerationStatus] = useState<'idle' | 'generating' | 'success' | 'error'>('idle');
  const [generationHistory, setGenerationHistory] = useState<Array<{
    id: string;
    description: string;
    timestamp: number;
    elements: any[];
  }>>([]);

  const [activeTab, setActiveTab] = useState('assistant');

  const submitFeedbackHandler = async (messageId: string, comment: string) => {
    console.log(`Feedback Submitted - Message ID: ${messageId}, Comment: ${comment}`);
    try {
      const response = await fetch('/api/ai/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messageId, rating: 'bad', comment }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit feedback');
      }
      toast.success('Feedback submitted. Thank you!');
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error('Could not submit feedback. Please try again.');
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    const currentStatus = state.isProcessing ? 'processing' : 'idle';

    if (currentStatus === 'processing') {
      setProgress(prev => (prev === 100 ? 0 : prev));
      interval = setInterval(() => {
        setProgress(prev => {
          const increment = prev < 30 ? 5 : prev < 60 ? 3 : prev < 80 ? 1 : 0.5;
          return Math.min(prev + increment, 90);
        });
      }, 300);
    } else {
      setProgress(prev => (prev < 90 ? 100 : prev));
      if (interval) {
         clearInterval(interval);
         interval = null;
      }
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state.isProcessing]);
  
  const handleFeedback = async (messageId: string, rating: 'good' | 'bad') => {
    console.log(`Feedback received for message ${messageId}: ${rating}`);
    if (rating === 'good') {
      toast.success('Thanks for the feedback!', { duration: 1500 });
      try {
        await fetch('/api/ai/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messageId, rating: 'good' }),
        });
      } catch (error) {
        console.error("Error submitting positive feedback:", error);
      }
    } else {
      toast.custom(
        (t) => (
          <FeedbackForm
            messageId={messageId}
            onSubmit={submitFeedbackHandler}
            toastId={t.id}
          />
        ),
        {
          duration: Infinity,
          position: 'bottom-center',
        }
      );
    }
  };
  
  const handleModelChange = (model: AIModelType) => {
    setSelectedModel(model);
    dispatch({ type: 'SET_MODEL', payload: model });
  };
  const handleMaxTokensChange = (tokens: number) => {
    setMaxTokens(tokens);
  };
  const handleComplexityChange = (complexity: number) => setComplexity(complexity);
  const handlePresetChange = (presetId: string) => setSelectedPresetId(presetId);
  const handleCustomMaxWidthChange = (width: number) => setCustomMaxWidth(width);
  const handleCustomMaxHeightChange = (height: number) => setCustomMaxHeight(height);
  const handleCustomMaxDepthChange = (depth: number) => setCustomMaxDepth(depth);
  const handleCustomPreferredTypesChange = (types: string[]) => setCustomPreferredTypes(types);
  const { addElements } = useElementsStore();
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.history.length]);
  
  const handleSendMessage = async (messageText: string, filesData?: SelectedFileData[], activeTool?: ToolName | null) => {
    console.log(`[CADAssistantOpenai] handleSendMessage called. Message: "${messageText}", Active Tool:`, activeTool);
    let textContents: string[] = [];
    let imageDataUrls: string[] = [];

    if (filesData && filesData.length > 0) {
      filesData.forEach(fileData => {
        if (fileData.type === 'text') {
          textContents.push(`--- File: ${fileData.name} ---\n${fileData.content}`);
        } else if (fileData.type === 'image') {
          imageDataUrls.push(fileData.content);
        }
      });
      console.log("Processed Text Contents:", textContents.length, "files");
      console.log("Processed Image Data URLs:", imageDataUrls.length, "files");
    }

    const generationKeywords = ['create', 'generate', 'make', 'draw', 'model', 'design', 'build', 'construct', 'add'];
    const useTextToCAD = 
      activeTool === 'textToCAD' || 
      (!activeTool && generationKeywords.some(keyword => messageText.toLowerCase().trim().startsWith(keyword)));

    if (useTextToCAD && contextTextToCAD) {
      console.log("[CADAssistantOpenai] Handling as Text-to-CAD request.");
      let constraintsToSend = {};
      if (selectedPresetId === 'custom') {
        constraintsToSend = {
          maxDimensions: { width: customMaxWidth, height: customMaxHeight, depth: customMaxDepth },
          preferredTypes: customPreferredTypes.length > 0 ? customPreferredTypes : undefined,
        };
      } else {
        const preset = constraintPresets.find(p => p.id === selectedPresetId);
        constraintsToSend = preset ? preset.constraints : {};
      }
      
      try {
        const result = await contextTextToCAD(messageText, constraintsToSend, textContents);
        console.log("Text-to-CAD Result:", result);
        if (result.success) {
           toast.success('CAD elements generated (check history)');
        } else {
           toast.error(`CAD generation failed: ${result.error}`);
        }
      } catch (error) {
        console.error("Error calling textToCAD:", error);
        toast.error("An error occurred during CAD generation.");
      }
    } else {
      console.log(`[CADAssistantOpenai] Handling as general assistant message or specific tool call (${activeTool || 'No specific tool'}). Passing to contextSendAssistantMessage.`);
      if (contextSendAssistantMessage) {
        contextSendAssistantMessage(messageText, imageDataUrls, activeTool); 
      } else {
          console.error("sendAssistantMessage function from context is not available!");
          toast.error("Error: Could not send message.");
      }
    }
  };
  const handleAddFromHistory = (historyItem: {id: string, elements: any[]}) => {
    addElements(historyItem.elements);
  };
  const handleExecuteAction = async (action: AIAction) => {
    console.log(`[CADAssistantOpenai] Executing action: ${action.type}`);
    if (!executePendingAction) {
      console.error("executePendingAction prop is not provided!");
      toast.error("Cannot execute action.");
      return; 
    }

    let historyAssistantItemId = uuidv4();
    const startTime = Date.now();

    try {
      const result = await executePendingAction(action);
      const processingTime = Date.now() - startTime;

      console.log("Action execution result:", result);

      if (dispatch) {
        dispatch({ 
          type: 'ADD_TO_HISTORY', 
          payload: { 
            id: historyAssistantItemId, 
            type: result.success ? 'assistant_response' : 'assistant_error',  
            timestamp: Date.now(), 
            result: result.message,
            modelUsed: 'N/A (Tool Execution)',
            processingTime: processingTime, 
            tokenUsage: undefined,
            prompt: `Executed Action: ${action.type}`,
          } satisfies AIHistoryItem 
        });
      } else {
        console.error("AIContext dispatch is not available!");
      }

      if (result.success) {
        toast.success(`Action executed: ${action.type}`);
      } else {
        toast.error(`Action failed: ${result.message}`);
      }
      
    } catch (error) {
      console.error("Error executing action:", error);
      toast.error("An unexpected error occurred while executing the action.");
      if (dispatch) {
         dispatch({ 
            type: 'ADD_TO_HISTORY', 
            payload: { 
              id: historyAssistantItemId,
              type: 'system_error',
              timestamp: Date.now(),
              result: `System Error executing ${action.type}: ${error instanceof Error ? error.message : 'Unknown error'}`,
              modelUsed: 'N/A (System)',
              processingTime: Date.now() - startTime,
            } satisfies AIHistoryItem
         });
      }
    } finally {
      if (dispatch) {
        console.log("[CADAssistantOpenai] Clearing pending actions after execution.");
        dispatch({ type: 'CLEAR_PENDING_ACTIONS' });
      }
    }
  };

  const mapHistoryItemToAIMessage = (item: AIHistoryItem): AIMessageType | null => {
    let role: 'user' | 'assistant' | 'system' | null = null;
    let content: MessageContent | null = null;
    let isError = false;

    if (item.type === 'user_message' && (item.userContent || item.prompt)) {
      role = 'user';
      content = item.userContent || item.prompt || "";
    } else if (item.type === 'assistant_response' && item.result) {
      role = 'assistant'; 
      content = typeof item.result === 'string' ? item.result : JSON.stringify(item.result);
    } else if ((item.type === 'assistant_error' || item.type === 'system_error') && item.result) {
      role = 'assistant';
      content = typeof item.result === 'string' ? item.result : JSON.stringify(item.result);
      isError = true;
    } else if (item.type === 'text_to_cad') {
      return null; 
    }
    
    if (role && content !== null) {
      return {
        id: item.id,
        role: role,
        content: content,
        timestamp: item.timestamp,
        artifacts: item.artifacts,
        isError: isError,
      };
    } 
    return null;
  };

  const indicatorStatus = state.isProcessing ? 'processing' : 'idle';

  const typingIndicatorMessage: AIMessageType = {
    id: 'ai-typing-indicator',
    role: 'assistant',
    content: '',
    timestamp: Date.now(),
  };

  return (
    <AnimatePresence>
      <Toaster />
      <motion.div
        key="cad-assistant-panel"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed z-60 bottom-6 right-6 shadow-xl rounded-t-3xl rounded-b-3xl bg-white border-2 border-gray-200 transition-all duration-200 dark:bg-gray-800 dark:border-2 dark:border-gray-700"
        style={{ 
          width: isPanelExpanded ? '420px' : 'auto', 
          height: isPanelExpanded ? 'calc(100vh - 80px)': 'auto',
          maxHeight: '80vh'
        }}
      >
        {isPanelExpanded ? (
          <div className="flex flex-col rounded-t-3xl rounded-b-3xl h-full overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b bg-gradient-to-r from-blue-400 to-blue-700 text-white rounded-t-3xl dark:from-gray-700 dark:to-gray-800 dark:border-gray-600">
              <div className="flex rounded-t-3xl items-center">
                <img src="/icon.png" className="mr-2 w-6 h-6" />
                <div>
                  <h3 className="font-medium">CAD Assistant</h3> 
                  <div className="text-xs text-blue-100">
                    {state.pendingActions.length || contextData.elementCount || 0} elements on canvas
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
            
            <AnimatePresence>
              {showSettings && (
                <div className="overflow-y-auto max-h-[80%] border-b border-gray-200 dark:border-gray-700">
                  <AISettingsPanel />
                 <motion.div
                 initial={{ height: 0, opacity: 0 }}
                 animate={{ height: 'auto', opacity: 1 }}
                 exit={{ height: 0, opacity: 0 }}
                 className="overflow-hidden"
               >
                 <div className="p-3 space-y-2 rounded-b-2xl text-sm bg-gray-50">
                   <button
                     onClick={clearMessages}
                     className="flex items-center text-xs text-red-600 hover:text-red-800"
                   >
                     <X size={12} className="mr-1" />
                     Clear Conversation
                   </button>
                 </div>
               </motion.div>
             
                </div>
              )}
            </AnimatePresence>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col dark:bg-gray-800 flex-grow min-h-0">
              <TabsList className="shrink-0 border-b bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300">
                <TabsTrigger value="assistant">Assistant</TabsTrigger>
                <TabsTrigger value="contextual">Contextual</TabsTrigger>
              </TabsList>
              
              <TabsContent value="assistant" className="flex flex-col flex-grow min-h-0 overflow-hidden mt-0">
                <div className="flex-grow overflow-y-auto p-3 space-y-2 bg-white dark:bg-gray-800 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                  {state.history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
                      <Cpu size={32} className="mb-2" />
                      <p className="text-sm">I&apos;m your CAD assistant. How can I help?</p>
                      <p className="text-xs text-center mt-2 text-gray-400">
                        Try asking me to create models, modify elements, or optimize your design.
                      </p>
                    </div>
                  ) : (
                    [...state.history].reverse().map((item) => { 
                      const message = mapHistoryItemToAIMessage(item);
                      if (!message) return null; 
                      return (
                        <AIMessageComponent 
                          key={message.id} 
                          message={message} 
                          onFeedback={handleFeedback}
                          onExecuteAction={handleExecuteAction}
                        />
                      )
                    })
                  )}
                  {state.isProcessing && !state.pendingActions.length && (
                    <AIMessageComponent 
                      key="typing-indicator"
                      message={typingIndicatorMessage} 
                      isTypingIndicator={true} 
                    />
                  )}
                  <div ref={messagesEndRef} />
                </div>
                
                {state.pendingActions && state.pendingActions.length > 0 && handleExecuteAction &&(
                  <div className="p-2  border-gray-200 dark:border-gray-700 rounded-t-xl bg-gray-50 dark:bg-gray-900 shrink-0">
                    <AIActionHandler
                      key="action-handler-assistant-tab"
                      actions={state.pendingActions}
                      onExecute={handleExecuteAction}
                      isProcessing={state.isProcessing}
                    />
                  </div>
                )}
                 <div className="p-2 border-t rounded-b-3xl border-gray-200 dark:border-gray-700 shrink-0"> 
                  <AIProcessingIndicator status={indicatorStatus} progress={progress} />
                </div> 
                
                <div className="shrink-0 rounded-b-3xl border-b border-gray-200 dark:border-gray-700">
                  <AIMessageInput
                    onSendMessage={handleSendMessage}
                    isProcessing={state.isProcessing}
                    placeholder="Type a message..."
                  />
                </div> 
              </TabsContent>

              <TabsContent value="contextual" className="flex-grow overflow-y-auto p-4 mt-0 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                <ContextAwareGenerationPanel />
              </TabsContent>
            </Tabs>
          </div>
        ) : (
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