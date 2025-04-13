import { useState, useCallback } from 'react';
import { useAIAssistantStoreOpenai } from '@/src/store/aiAssistantStoreOpenai';
import { openAIService } from '@/src/lib/ai/openaiService';
import { AIAction, AIMessage } from '@/src/types/AITypes';

export interface UseCADAssistantProps {
  contextData: any;
  actionHandler: {
    executeAction: (action: AIAction) => Promise<{ success: boolean; message: string }>;
    getActionDefinitions: () => any[];
  };
}

export function useCADAssistant({ contextData, actionHandler }: UseCADAssistantProps) {
  const { 
    messages, 
    addMessage, 
    isProcessing, 
    setProcessing, 
    isOpen, 
    toggleAssistant,
    setError,
    clearMessages
  } = useAIAssistantStoreOpenai();
  
  const [pendingActions, setPendingActions] = useState<AIAction[]>([]);
  
  // System prompt specifically for CAD operations
  const CAD_SYSTEM_PROMPT = `You are a CAD/CAM design assistant that helps users create and modify 3D models. Follow these guidelines:

1. When asked to create models, use the generateCADElement function to add elements to the canvas
2. When asked to modify models, use the appropriate function (updateCADElement, removeCADElement)
3. Use standard dimensions in millimeters unless specified otherwise
4. Position elements logically in 3D space
5. Use appropriate colors and visual attributes
6. When creating multiple elements, ensure they form a coherent assembly
7. Explain your design decisions in a clear, conversational manner

Base your answers on the current CAD context provided. If you're unsure about specific details, ask for clarification rather than making assumptions.`;

  // Send a message to the AI assistant
  const sendMessage = useCallback(async (message: string) => {
    // Add user message to chat
    addMessage('user', message);
    setProcessing(true);
    setPendingActions([]);
    
    try {
      // Format the context for the AI
      const contextString = contextData ? 
        `Current CAD canvas: ${JSON.stringify(contextData, null, 2)}` : 
        'Empty CAD canvas';
      
      // Get available actions from the action handler
      const availableActions = actionHandler.getActionDefinitions().map(def => def.name);
      
      // Convert messages to the format expected by the OpenAI service
      const messageHistory: AIMessage[] = messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp
      }));
      
      // Add the new user message
      messageHistory.push({
        id: Date.now().toString(),
        role: 'user',
        content: message,
        timestamp: Date.now()
      });
      
      // Call OpenAI service with the necessary context
      const response = await openAIService.sendMessage(
        messageHistory,
        `${CAD_SYSTEM_PROMPT}\n\n${contextString}`,
        availableActions
      );
      
      // Add assistant's response to the chat
      addMessage('assistant', response.content, response.artifacts);
      
      // Check if there are actions to execute
      if (response.actions && response.actions.length > 0) {
        // Transform to our action format
        const aiActions: AIAction[] = response.actions.map(action => ({
          type: action.type,
          payload: action.payload,
          description: action.description || `Execute ${action.type}`
        }));
        
        // Set pending actions
        setPendingActions(aiActions);
      }
      
      return response;
    } catch (error) {
      console.error('Error sending message to AI:', error);
      setError(error instanceof Error ? error.message : 'Error communicating with AI');
      addMessage('system', 'Sorry, I encountered an error. Please try again.');
      return null;
    } finally {
      setProcessing(false);
    }
  }, [messages, contextData, actionHandler, addMessage, setProcessing, setError]);

  // Execute a pending action
  const executePendingAction = useCallback(async (action: AIAction) => {
    setProcessing(true);
    
    try {
      // Execute the action using the handler
      const result = await actionHandler.executeAction(action);
      
      // Add system message with the result
      addMessage('system', result.message);
      
      // Remove the executed action from pending actions
      setPendingActions(current => current.filter(a => a !== action));
      
      return result;
    } catch (error) {
      console.error('Error executing action:', error);
      setError(error instanceof Error ? error.message : 'Error executing action');
      return { success: false, message: 'Error executing action' };
    } finally {
      setProcessing(false);
    }
  }, [actionHandler, addMessage, setProcessing, setError]);

  return {
    messages,
    isProcessing,
    isOpen,
    pendingActions,
    sendMessage,
    toggleAssistant,
    clearMessages,
    executePendingAction
  };
}