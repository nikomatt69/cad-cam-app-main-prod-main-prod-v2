// src/hooks/useAIAssistant.ts
import { useState, useCallback, useEffect } from 'react';
import { useAIAssistantStore } from '../store/aiAssistantStore';
import { AIAction, AIArtifact } from '../types/AITypes';
import { useElementsStore } from '../store/elementsStore'; // Assuming you have this store

export function useAIAssistant() {
  const {
    isVisible,
    isExpanded,
    currentMode,
    selectedModel,
    position,
    messageHistory,
    toggle,
    setVisible,
    setExpanded,
    setMode,
    setModel,
    setPosition,
    addMessage,
    clearMessages
  } = useAIAssistantStore();
  
  // New state from your store implementation
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [pendingActions, setPendingActions] = useState<AIAction[]>([]);
  
  // Get CAD elements store to collect context
  const { 
    elements, 
    selectedElements 
  } = useElementsStore();
  
  // Initialize session on mount
  useEffect(() => {
    const initSession = async () => {
      try {
        const response = await fetch('/api/mcp-agent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            // Empty request just to create a session
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.sessionId) {
            setSessionId(data.sessionId);
          }
        }
      } catch (error) {
        console.error('Failed to initialize session:', error);
      }
    };
    
    initSession();
  }, []);
  
  // Collect application context
  const collectContext = useCallback(() => {
    // Get selected elements with their properties
    const selectedElementsIds = selectedElements.map(id => {
      const element = elements.find(el => el.id === id);
      if (!element) return null;
      
      return {
        id,
        type: element.type,
        properties: {
          // Include relevant properties based on element type
          ...(element.type === 'cube' && {
            width: element.width,
            height: element.height,
            depth: element.depth
          }),
          ...(element.type === 'cylinder' && {
            radius: element.radius,
            height: element.height
          }),
          ...(element.type === 'sphere' && {
            radius: element.radius
          }),
          // Add other element types as needed
          position: {
            x: element.x,
            y: element.y,
            z: element.z
          },
          color: element.color
        }
      };
    }).filter(Boolean);
    
    // Build complete context object
    return {
      sessionId,
      mode: currentMode,
      activeView: '3d', // This could be dynamic based on your application state
      selectedElementsIds,
      // Add other context information
      activeTool: {
        name: 'select', // This should be dynamic based on your application state
        parameters: {}
      },
      currentProject: {
        name: 'Current Project' // This should be dynamic based on your application state
      },
      // Add viewState, recentOperations, etc.
    };
  }, [elements, selectedElements, currentMode, sessionId]);
  
  // Send a message to the AI assistant
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isProcessing) return;
    
    // Add user message to history
    addMessage('user', content, currentMode);
    setIsProcessing(true);
    setError(null);
    
    try {
      // Collect application context
      const context = collectContext();
      
      // Send message to API route with context
      const response = await fetch('/api/mcp-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          context,
          sessionId,
          model: selectedModel
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Update session ID if returned
      if (data.sessionId) {
        setSessionId(data.sessionId);
      }
      
      // Check for action
      if (data.action) {
        setPendingActions([data.action]);
      }
      
      // Process artifacts if any (such as code blocks or JSON data)
      const artifacts = extractArtifacts(data.content);
      
      // Add assistant message (without artifacts argument)
      addMessage('assistant', data.content, currentMode);
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
      
      // Add error message
      addMessage(
        'system',
        `Sorry, I encountered an error: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        currentMode
      );
    } finally {
      setIsProcessing(false);
    }
  }, [
    isProcessing, 
    addMessage, 
    currentMode, 
    collectContext, 
    sessionId, 
    selectedModel
  ]);
  
  // Execute an action
  const executeAction = useCallback(async (action: AIAction) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      // Call the API with the action
      const response = await fetch('/api/mcp-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          sessionId,
          context: collectContext()
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Remove the executed action from pending actions
      setPendingActions(prev => prev.filter(a => a.type !== action.type));
      
      // Add result message (without artifacts argument)
      addMessage(
        'system',
        `Action "${action.type}" executed successfully.`,
        currentMode
      );
      
      // If there's a content response, add it as an assistant message
      if (data.content) {
        addMessage('assistant', data.content, currentMode);
      }
    } catch (error) {
      console.error('Error executing action:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
      
      // Add error message
      addMessage(
        'system',
        `Error executing action "${action.type}": ${ error instanceof Error ? error.message : 'Unknown error' }`,
        currentMode
      );
    } finally {
      setIsProcessing(false);
    }
  }, [
    isProcessing, 
    sessionId, 
    collectContext, 
    addMessage, 
    currentMode
  ]);
  
  // Extract artifacts from text content
  const extractArtifacts = (content: string): AIArtifact[] => {
    const artifacts: AIArtifact[] = [];
    
    // Extract code blocks as artifacts
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;
    
    while ((match = codeBlockRegex.exec(content)) !== null) {
      const language = match[1] || '';
      const code = match[2];
      
      // Determine the artifact type based on language
      let type: 'code' | 'json' | 'cad' | 'markdown' = 'code';
      if (language === 'json') {
        // Check if this is specifically a CAD component
        if (code.includes('"type":') && 
            (code.includes('"cube"') || code.includes('"cylinder"') || code.includes('"sphere"'))) {
          type = 'cad';
        } else {
          type = 'json';
        }
      }
      
      artifacts.push({
        id: crypto.randomUUID(),
        type,
        content: code,
        language,
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} Artifact`
      });
    }
    
    return artifacts;
  };
  
  return {
    // Original state
    isVisible,
    isExpanded,
    currentMode,
    selectedModel,
    position,
    messageHistory,
    
    // New state
    isProcessing,
    error,
    sessionId,
    pendingActions,
    
    // Original actions
    toggle,
    setVisible,
    setExpanded,
    setMode,
    setModel,
    setPosition,
    clearMessages,
    
    // New actions
    sendMessage,
    executeAction
  };
}