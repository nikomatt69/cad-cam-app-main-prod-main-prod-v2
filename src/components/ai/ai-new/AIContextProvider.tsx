// src/components/ai/ai-new/AIContextProvider.tsx - Aggiornato per supportare OpenAI
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  AIMode, 
  AIHistoryItem, 
  AISettings, 
  AIModelType, 
  TextToCADRequest, 
  AIState, 
  AIProviderType, 
  AIRequest, 
  AIResponse, 
  AIServiceConfig, 
  AIPerformanceMetrics, 
  GCodeOptimizationRequest, 
  DesignAnalysisRequest,
  TokenUsage,
  AIMessage,
  AssistantRole,
  ResponseStyle,
  ComplexityLevel,
  AIArtifact
} from '@/src/types/AITypes';
import { unifiedAIService } from '@/src/lib/ai/unifiedAIService';
import { aiAnalytics } from '@/src/lib/ai/ai-new/aiAnalytics';
import { aiCache } from '@/src/lib/ai/ai-new/aiCache';
import { AI_MODELS, AI_MODES, aiConfigManager, MODEL_CAPABILITIES } from '@/src/lib/ai/ai-new/aiConfigManager';
import { useContextStore } from '@/src/store/contextStore';
import { openAIService } from '@/src/lib/ai/openaiService';
import { v4 as uuidv4 } from 'uuid';
import { Element } from '@/src/store/elementsStore';

// Stato iniziale dell'AI
const initialState: AIState = {
  isEnabled: true,
  currentModel: AI_MODELS.CLAUDE_SONNET_7,
  temperature: 0.7,
  isProcessing: false,
  mode: 'general',
  assistant: {
    isVisible: false,
    isPanelOpen: false,
    suggestions: [],
    lastAction: null
  },
  history: [],
  settings: {
    autoSuggest: true,
    cacheEnabled: true,
    analyticsEnabled: true,
    maxTokens: 6000,
    mcpEnabled: true,
    mcpStrategy: 'balanced',
    mcpCacheLifetime: 3600,
    suggestThreshold: 0.7,
    customPrompts: {},
    autoModelSelection: true,
    costOptimization: true,
    multiProviderEnabled: true,
    preferredProvider: 'claude'
  },
  performance: {
    averageResponseTime: 0,
    successRate: 100,
    tokenUsage: 0,
    lastSync: Date.now()
  }
};

// Tipi di azioni per il reducer
type AIAction = 
  | { type: 'TOGGLE_AI'; payload: boolean }
  | { type: 'SET_MODEL'; payload: AIModelType }
  | { type: 'SET_TEMPERATURE'; payload: number }
  | { type: 'UPDATE_PERFORMANCE'; payload: Partial<AIState['performance']> }
  | { type: 'OPTIMIZE_SETTINGS'; payload: Partial<AISettings> }
  | { type: 'START_PROCESSING' }
  | { type: 'END_PROCESSING' }
  | { type: 'ADD_TO_HISTORY'; payload: AIHistoryItem }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AISettings> }
  | { type: 'SET_MODE'; payload: AIMode }
  | { type: 'TOGGLE_ASSISTANT_VISIBILITY'; payload: boolean }
  | { type: 'TOGGLE_ASSISTANT_PANEL'; payload: boolean }
  | { type: 'SET_SUGGESTIONS'; payload: any[] }
  | { type: 'RECORD_ASSISTANT_ACTION'; payload: string }
  | { type: 'SET_PROVIDER'; payload: AIProviderType };

// Reducer per gestire lo stato dell'AI
function aiReducer(state: AIState, action: AIAction): AIState {
  switch (action.type) {
    case 'TOGGLE_AI':
      return { ...state, isEnabled: action.payload };
    case 'SET_MODEL':
      return { ...state, currentModel: action.payload };
    case 'SET_TEMPERATURE':
      return { ...state, temperature: action.payload };
    case 'UPDATE_PERFORMANCE':
      return { 
        ...state, 
        performance: { ...state.performance, ...action.payload } 
      };
    case 'OPTIMIZE_SETTINGS':
      return { 
        ...state, 
        settings: { ...state.settings, ...action.payload } 
      };
    case 'START_PROCESSING':
      return { ...state, isProcessing: true };
    case 'END_PROCESSING':
      return { ...state, isProcessing: false };
    case 'ADD_TO_HISTORY':
      return { 
        ...state, 
        history: [action.payload, ...state.history].slice(0, 50) 
      };
    case 'CLEAR_HISTORY':
      return { ...state, history: [] };
    case 'UPDATE_SETTINGS':
      return { 
        ...state, 
        settings: { ...state.settings, ...action.payload } 
      };
    case 'SET_MODE':
      return { ...state, mode: action.payload };
    case 'TOGGLE_ASSISTANT_VISIBILITY':
      return { 
        ...state, 
        assistant: { ...state.assistant, isVisible: action.payload } 
      };
    case 'TOGGLE_ASSISTANT_PANEL':
      return { 
        ...state, 
        assistant: { ...state.assistant, isPanelOpen: action.payload } 
      };
    case 'SET_SUGGESTIONS':
      return { 
        ...state, 
        assistant: { ...state.assistant, suggestions: action.payload } 
      };
    case 'RECORD_ASSISTANT_ACTION':
      return { 
        ...state, 
        assistant: { ...state.assistant, lastAction: action.payload } 
      };
    case 'SET_PROVIDER':
      // Quando imposta il provider, aggiorna anche la preferenza nelle impostazioni
      return {
        ...state,
        settings: {
          ...state.settings,
          preferredProvider: action.payload
        }
      };
    default:
      return state;
  }
}

// Interfaccia del contesto AI
interface AIContextType {
  state: AIState;
  dispatch: React.Dispatch<AIAction>;
  // Metodi per operazioni AI core
  textToCAD: (description: string, constraints?: any, context?: string[]) => Promise<any>;
  optimizeGCode: (gcode: string, machineType: string) => Promise<any>;
  analyzeDesign: (elements: any[]) => Promise<any>;
  generateSuggestions: (context: string) => Promise<any[]>;
  // Canvas interaction function
  addElementsToCanvas: (elements: Element[]) => void;
  // Operazioni dell'assistente
  showAssistant: () => void;
  hideAssistant: () => void;
  toggleAssistantPanel: () => void;
  // Selezione del modello
  selectOptimalModel: (taskComplexity: 'low' | 'medium' | 'high') => AIModelType;
  // Gestione del provider
  setProvider: (provider: AIProviderType) => void;
  getProviderForModel: (model: AIModelType) => AIProviderType;
  // Chat dell'assistente
  sendAssistantMessage: (message: string) => Promise<any>;
}

// Creazione del contesto
const AIContext = createContext<AIContextType | undefined>(undefined);

// Define Props for the Provider
interface AIContextProviderProps {
  children: React.ReactNode;
  addElementsToCanvas: (elements: Element[]) => void;
}

// Provider del contesto
export const AIContextProvider: React.FC<AIContextProviderProps> = ({ children, addElementsToCanvas }) => {
  const [state, dispatch] = useReducer(aiReducer, initialState);
  const router = useRouter();
  const { getActiveContexts } = useContextStore();

  /**
   * Imposta il provider AI preferito
   */
  const setProvider = (provider: AIProviderType): void => {
    dispatch({ type: 'SET_PROVIDER', payload: provider });
    
    // Aggiorna il model se necessario
    const currentModel = state.currentModel;
    const currentProviderType = getProviderForModel(currentModel);
    
    // Normalize providers for comparison
    const normalizedCurrentProvider = currentProviderType.toLowerCase();
    const normalizedNewProvider = provider.toLowerCase();
    
    // Se il modello attuale non è compatibile con il nuovo provider, seleziona un nuovo modello
    if (normalizedCurrentProvider !== normalizedNewProvider) {
      // Convert to the format expected by MODEL_CAPABILITIES
      const providerKey = normalizedNewProvider === 'openai' ? 'OPENAI' : 'CLAUDE';
      
      const models = Object.entries(MODEL_CAPABILITIES)
        .filter(([_, capability]) => capability.provider === provider)
        .map(([model]) => model as AIModelType);
      
      if (models.length > 0) {
        dispatch({ type: 'SET_MODEL', payload: models[0] });
      }
    }
  };

  /**
   * Ottiene il provider associato a un modello
   */
  const getProviderForModel = (model: AIModelType): AIProviderType => {
    // Get the provider in the format expected by the rest of the application
    return MODEL_CAPABILITIES[model]?.provider as AIProviderType;
  };

  // Seleziona il modello ottimale in base alla complessità del task
  const selectOptimalModel = (taskComplexity: 'low' | 'medium' | 'high'): AIModelType => {
    if (!state.settings.autoModelSelection) return state.currentModel;
    
    // Considera il provider preferito nelle impostazioni (se multi-provider è abilitato)
    const preferredProvider = state.settings.multiProviderEnabled
      ? state.settings.preferredProvider
      : getProviderForModel(state.currentModel);
    
    return aiConfigManager.selectOptimalModel(taskComplexity, preferredProvider as 'CLAUDE' | 'OPENAI');
  };

  // Monitora le prestazioni dell'AI
  useEffect(() => {
    const interval = setInterval(() => {
      const stats = aiAnalytics.getStats();
      dispatch({ 
        type: 'UPDATE_PERFORMANCE', 
        payload: {
          averageResponseTime: stats.averageResponseTime,
          successRate: stats.successRate,
          tokenUsage: stats.tokenUsage,
          lastSync: Date.now()
        }
      });
    }, 300000); // Ogni 5 minuti

    return () => clearInterval(interval);
  }, []);

  // Imposta la modalità in base al percorso URL
  useEffect(() => {
    const path = router.pathname;
    
    if (path.includes('/cad')) {
      dispatch({ type: 'SET_MODE', payload: 'cad' });
    } else if (path.includes('/cam')) {
      dispatch({ type: 'SET_MODE', payload: 'cam' });
    } else if (path.includes('/gcode')) {
      dispatch({ type: 'SET_MODE', payload: 'gcode' });
    } else if (path.includes('/toolpath')) {
      dispatch({ type: 'SET_MODE', payload: 'toolpath' });
    } else if (path.includes('/analysis')) {
      dispatch({ type: 'SET_MODE', payload: 'analysis' });
    } else {
      dispatch({ type: 'SET_MODE', payload: 'general' });
    }
  }, [router.pathname]);

  // Aggiorna la configurazione quando cambiano le impostazioni
  useEffect(() => {
    // Aggiorna la configurazione AI
    aiConfigManager.updateConfig({
      defaultModel: state.currentModel,
      maxTokens: state.settings.maxTokens,
      mcpEnabled: state.settings.mcpEnabled,
      mcpStrategy: state.settings.mcpStrategy,
      mcpCacheLifetime: state.settings.mcpCacheLifetime * 1000, // Convert to ms
      openaiApiKey: state.settings.openaiApiKey || '',
      openaiOrgId: state.settings.openaiOrgId || ''
    });
    
    // Aggiorna anche il servizio OpenAI direttamente
    
  }, [
    state.currentModel, 
    state.settings.maxTokens,
    state.settings.mcpEnabled,
    state.settings.mcpStrategy,
    state.settings.mcpCacheLifetime,
    state.settings.openaiApiKey,
    state.settings.openaiOrgId
  ]);

  // Conversione da testo a elementi CAD
  const textToCAD = async (description: string, constraints?: any, providedContext?: string[]) => {
    if (!state.isEnabled) return { success: false, data: null, error: 'AI is disabled' };
    
    dispatch({ type: 'START_PROCESSING' });
    let historyUserItemId = uuidv4();
    let historyAssistantItemId = uuidv4();

    try {
      let model = state.currentModel;
      if (state.settings.autoModelSelection) {
        model = selectOptimalModel('medium');
      }
      const startTime = Date.now();
      const activeContextFiles = getActiveContexts();
      const contextTexts = [
        ...(providedContext || []),
        ...activeContextFiles.map(file => file.content)
      ];
      const requestWithContext: TextToCADRequest = {
        description,
        constraints,
        complexity: 'moderate',
        style: 'precise',
        context: contextTexts.length > 0 ? contextTexts : undefined,
      };
      
      const result = await unifiedAIService.textToCADElements(requestWithContext);
      const processingTime = Date.now() - startTime;
      
      if (result.success && result.data && Array.isArray(result.data) && result.data.length > 0) {
        const generatedElements: Element[] = result.data;
        const elementCount = generatedElements.length;

        const cadArtifact: AIArtifact = {
          id: uuidv4(),
          type: 'cad_elements',
          content: generatedElements,
          title: `Generated ${elementCount} CAD Element(s)`
        };
        
        console.log("[AIContextProvider] Created cad_elements artifact:", cadArtifact);

        const historyPayload: AIHistoryItem = {
          id: historyAssistantItemId,
          type: 'assistant_response',
          timestamp: Date.now(),
          prompt: description,
          result: `Ho generato ${elementCount} element${elementCount > 1 ? 'i' : 'o'}. Aggiungil${elementCount > 1 ? 'i' : 'o'} alla tela?`,
          modelUsed: result.model || model,
          processingTime,
          tokenUsage: result.usage ? {
            prompt: result.usage.promptTokens,
            completion: result.usage.completionTokens,
            total: result.usage.totalTokens
          } : undefined,
          artifacts: [cadArtifact]
        };
        
        console.log("[AIContextProvider] Dispatching ADD_TO_HISTORY with payload:", historyPayload);

        dispatch({ 
          type: 'ADD_TO_HISTORY', 
          payload: historyPayload satisfies AIHistoryItem
        });
        return { ...result, data: null };
      } else if (result.success) {
        dispatch({ 
          type: 'ADD_TO_HISTORY', 
          payload: {
            id: historyAssistantItemId,
            type: 'assistant_response',
            timestamp: Date.now(),
            prompt: description,
            result: 'AI generated no elements.',
            modelUsed: result.model || model,
            processingTime,
            tokenUsage: result.usage ? {
              prompt: result.usage.promptTokens,
              completion: result.usage.completionTokens,
              total: result.usage.totalTokens
            } : undefined,
          } satisfies AIHistoryItem
        });
        return { ...result, error: 'AI generated no elements.' };
      } else {
        dispatch({ 
          type: 'ADD_TO_HISTORY', 
          payload: {
            id: historyAssistantItemId,
            type: 'assistant_error',
            timestamp: Date.now(),
            modelUsed: result.model || model,
            processingTime,
            result: `Error: ${result.error || 'Unknown AI error'}`,
            prompt: description,
          } satisfies AIHistoryItem
        });
        return result;
      }
    } catch (error) {
      console.error('Error in textToCAD:', error);
      dispatch({ 
        type: 'ADD_TO_HISTORY', 
        payload: {
          id: historyAssistantItemId,
          type: 'system_error',
          timestamp: Date.now(),
          modelUsed: state.currentModel,
          processingTime: 0,
          result: `System Error: ${error instanceof Error ? error.message : 'Unknown system error'}`,
          prompt: description,
        } satisfies AIHistoryItem
      });
      return { 
        success: false, 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    } finally {
      dispatch({ type: 'END_PROCESSING' });
    }
  };
  
  // Ottimizzazione del G-code
  const optimizeGCode = async (gcode: string, machineType: string) => {
    if (!state.isEnabled) return { success: false, data: null, error: 'AI is disabled' };
    
    dispatch({ type: 'START_PROCESSING' });
    
    try {
      const model = selectOptimalModel('medium');
      const provider = state.settings.preferredProvider;
      const startTime = Date.now();
      
      const result = await unifiedAIService.optimizeGCode(gcode, machineType);
      
      const processingTime = Date.now() - startTime;
      
      if (result.success) {
        dispatch({
          type: 'ADD_TO_HISTORY',
          payload: {
            id: `gcode_${Date.now()}`,
            type: 'gcode_optimization',
            timestamp: Date.now(),
            prompt: `Optimize G-code for ${machineType}`,
            modelUsed: result.model || model,
            processingTime,
            tokenUsage: result.usage ? {
              prompt: result.usage.promptTokens,
              completion: result.usage.completionTokens,
              total: result.usage.totalTokens
            } : undefined,
           
          }
        });
      }
      return result;
    } catch (error) {
      console.error('Error in optimizeGCode:', error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      dispatch({ type: 'END_PROCESSING' });
    }
  };
  
  // Analisi del design
  const analyzeDesign = async (elements: any[]) => {
    if (!state.isEnabled) return { success: false, data: null, error: 'AI is disabled' };
    
    dispatch({ type: 'START_PROCESSING' });
    
    try {
      const model = selectOptimalModel('high');
      const provider = state.settings.preferredProvider;
      const startTime = Date.now();
      
      const result = await unifiedAIService.analyzeDesign(elements);
      
      const processingTime = Date.now() - startTime;
      
      if (result.success) {
        dispatch({
          type: 'ADD_TO_HISTORY',
          payload: {
            id: `analysis_${Date.now()}`,
            type: 'design_analysis',
            timestamp: Date.now(),
            result: result.data,
            modelUsed: result.model || model,
            processingTime,
            tokenUsage: result.usage ? {
              prompt: result.usage.promptTokens,
              completion: result.usage.completionTokens,
              total: result.usage.totalTokens
            } : undefined,
       
          }
        });
      }
      return result;
    } catch (error) {
      console.error('Error in analyzeDesign:', error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      dispatch({ type: 'END_PROCESSING' });
    }
  };
  
  // Generazione di suggerimenti contestuali
  const generateSuggestions = async (context: string) => {
    if (!state.isEnabled || !state.settings.autoSuggest) {
      return [];
    }
    
    try {
      const model = selectOptimalModel('low');
      const provider = state.settings.preferredProvider;
      
      const result = await unifiedAIService.generateSuggestions(context, state.mode);
      
      if (result.success && result.data) {
        dispatch({ type: 'SET_SUGGESTIONS', payload: result.data });
        return result.data;
      }
      
      return [];
    } catch (error) {
      console.error('Error generating suggestions:', error);
      return [];
    }
  };
  
  // Invia un messaggio all'assistente
  const sendAssistantMessage = async (messageText: string) => {
    if (!state.isEnabled) return;
    dispatch({ type: 'START_PROCESSING' });

    // 1. Format the new user message
    const newUserMessage: AIMessage = {
      id: uuidv4(), 
      role: 'user',
      content: messageText,
      timestamp: Date.now(),
    };

    // Map history to AIMessage format
    const currentMessages: AIMessage[] = state.history.reduce((acc: AIMessage[], item: AIHistoryItem) => {
      if (item.type === 'user_message' && item.prompt) {
        acc.push({ id: item.id, role: 'user', content: item.prompt, timestamp: item.timestamp });
      } else if (item.type === 'assistant_response' && item.result) {
        // Assuming item.result stores the assistant's response content (text/artifacts)
        // This might need adjustment based on the actual structure of item.result
        acc.push({ 
          id: item.id, 
          role: 'assistant', 
          content: typeof item.result === 'string' ? item.result : JSON.stringify(item.result), // Simple string conversion for now
          timestamp: item.timestamp 
        });
      }
      return acc;
    }, []);

    const messagesToSend = [...currentMessages, newUserMessage];

    // 2. Gather context and parameters
    const activeContexts = getActiveContexts();
    const contextString = `Current application context: ${activeContexts.join(', ')}`;
    const assistantActions = ['generateCADElement', 'updateCADElement', 'removeCADElement', 'suggestOptimizations', 'chainOfThoughtAnalysis', 'thinkAloudMode', 'exportCADProjectAsZip']; 
    const assistantRole: AssistantRole = "CAD Assistant"; 
    const responseStyle: ResponseStyle = "detailed"; 
    const complexityLevel: ComplexityLevel = "moderate";
    
    // --- Determine Model --- 
    // For general chat, force OpenAI. Allow override if needed later.
    const modelToUse: AIModelType = 'gpt-4o-mini'; 
    // We could add logic here later to use state.currentModel if needed for specific roles/modes
    // console.log(`[AIContextProvider] Using model for general chat: ${modelToUse}`);

    let historyUserItemId = uuidv4();
    let historyAssistantItemId = uuidv4();

    // Add user message history item immediately
    dispatch({ 
      type: 'ADD_TO_HISTORY', 
      payload: { 
        id: historyUserItemId, 
        type: 'user_message', 
        timestamp: newUserMessage.timestamp, 
        prompt: messageText,
        modelUsed: modelToUse, // Track model used even for user prompt context
        processingTime: 0, // Placeholder
        result: null // No result for user message
      } satisfies AIHistoryItem // Use satisfies for type checking
    });

    try {
      // 3. Call unifiedAiService, explicitly passing the desired model
      const response = await unifiedAIService.getAssistantCompletion(
        messagesToSend,
        contextString,
        assistantActions,
        responseStyle,
        complexityLevel,
        assistantRole,
        undefined, // Explicitly no tool override from here
        modelToUse // Pass the chosen model as override
      );
      
      console.log("[AIContextProvider] Received response from getAssistantCompletion:", response);

      // 4. Process Response
      if (response.success && response.data) {
        console.log("[AIContextProvider] Processing successful response data:", response.data);
        const assistantResponseContent = response.data.content || ""; 
        dispatch({ 
          type: 'ADD_TO_HISTORY', 
          payload: { 
            id: historyAssistantItemId, 
            type: 'assistant_response', 
            timestamp: Date.now(), 
            result: assistantResponseContent || "(No text content received)",
            modelUsed: modelToUse, 
            processingTime: response.processingTime ?? 0, 
            tokenUsage: response.usage ? {  
              prompt: response.usage.promptTokens,
              completion: response.usage.completionTokens,
              total: response.usage.totalTokens
            } : undefined, 
            prompt: messageText,
          } satisfies AIHistoryItem 
        });

        // --- Handle potential actions --- 
        if (response.data.actions && response.data.actions.length > 0) { 
          console.log("AI Assistant suggested actions:", response.data.actions);
          dispatch({ type: 'RECORD_ASSISTANT_ACTION', payload: JSON.stringify(response.data.actions) });
          // TODO: Implement logic to handle/execute these actions
        }

      } else {
        // Handle error response from AI service
        console.error("Error from AI Assistant:", response.error);
        dispatch({ 
          type: 'ADD_TO_HISTORY', 
          payload: { 
            id: historyAssistantItemId,
            type: 'assistant_error',
            timestamp: Date.now(),
            modelUsed: modelToUse,
            processingTime: response.processingTime ?? 0,
            result: `Error: ${response.error || 'Unknown AI error'}`,
            prompt: messageText,
          } satisfies AIHistoryItem
        });
      }

    } catch (error) {
      console.error("Failed to send message to AI Assistant:", error);
      // Handle unexpected error during the call
      dispatch({ 
          type: 'ADD_TO_HISTORY', 
          payload: { 
             id: historyAssistantItemId,
             type: 'system_error', // Use a specific type for system errors
             timestamp: Date.now(),
             modelUsed: modelToUse, // Model that was attempted
             processingTime: 0, // Or calculate time until error
             result: `System Error: ${error instanceof Error ? error.message : 'Unknown system error'}`, // Store error in result
             prompt: messageText
          } satisfies AIHistoryItem
        });
    } finally {
      dispatch({ type: 'END_PROCESSING' });
    }
  };
  
  // Operazioni dell'assistente
  const showAssistant = () => {
    dispatch({ type: 'TOGGLE_ASSISTANT_VISIBILITY', payload: true });
  };
  
  const hideAssistant = () => {
    dispatch({ type: 'TOGGLE_ASSISTANT_VISIBILITY', payload: false });
  };
  
  const toggleAssistantPanel = () => {
    dispatch({ 
      type: 'TOGGLE_ASSISTANT_PANEL', 
      payload: !state.assistant.isPanelOpen 
    });
  };

  // Valore del contesto
  const contextValue: AIContextType = {
    state,
    dispatch,
    textToCAD,
    optimizeGCode,
    analyzeDesign,
    generateSuggestions,
    addElementsToCanvas,
    showAssistant,
    hideAssistant,
    toggleAssistantPanel,
    selectOptimalModel,
    setProvider,
    getProviderForModel,
    sendAssistantMessage
  };

  return (
    <AIContext.Provider value={contextValue}>
      {children}
    </AIContext.Provider>
  );
};

// Hook personalizzato per utilizzare il contesto AI
export const useAI = () => {
  const context = useContext(AIContext);
  if (context === undefined) {
    throw new Error('useAI must be used within an AIContextProvider');
  }
  return context;
};