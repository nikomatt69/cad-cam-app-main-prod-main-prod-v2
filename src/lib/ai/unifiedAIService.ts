import { AIModelType, AIRequest, AIResponse, TextToCADRequest, AIDesignSuggestion, MCPRequestParams, MCPResponse } from '@/src/types/AITypes';
import { aiCache } from './ai-new/aiCache';
import { aiAnalytics } from './ai-new/aiAnalytics';
import { promptTemplates } from './promptTemplates';
import { Element } from '@/src/store/elementsStore';
import { mcpService } from './ai-new/mcpService';
import { aiConfigManager } from './ai-new/aiConfigManager';
import { v4 as uuidv4 } from 'uuid';

// Add necessary imports from openaiService and AITypes if not already present
import { openAIService } from './openaiService'; // Assuming relative path is correct
// Adjust import to include types specifically used by the new method
import { 
  AIMessage, AIArtifact, AIAction, ResponseStyle, ComplexityLevel, AssistantRole, 
  MessageContent, TextContentBlock, ImageContentBlock
  // Removed OpenAI specific types - will use general types or 'any' for now
} from '@/src/types/AITypes'; // Adjust path as needed

// Define ForceToolChoice locally if not exported elsewhere
interface ForceToolChoice {
  type: "function";
  function: { name: string };
}

/**
 * Servizio AI unificato che gestisce tutte le interazioni con i modelli AI
 * e fornisce metodi specializzati per i diversi casi d'uso dell'applicazione.
 */
export class UnifiedAIService {
  private apiKey: string;
  private allowBrowser: boolean = true;
  private defaultModel: AIModelType = 'claude-3-7-sonnet-20250219';
  private defaultMaxTokens: number = 6000;
  private mcpEnabled: boolean = false;
  private mcpStrategy: 'aggressive' | 'balanced' | 'conservative' = 'balanced';
  private mcpCacheLifetime: number = 3600000; // 1 ora in millisecondi
  private apiEndpoint = '/api/ai/proxy'; // Added apiEndpoint property

  constructor(apiKey?: string) {
    this.apiKey = apiKey || '';
    
    // Leggi le configurazioni da aiConfigManager se disponibili
    const config = aiConfigManager.getConfig();
    if (config) {
      this.defaultModel = config.defaultModel || this.defaultModel;
      this.defaultMaxTokens = config.maxTokens || this.defaultMaxTokens;
      this.allowBrowser = config.allowBrowser ?? this.allowBrowser;
      this.mcpEnabled = config.mcpEnabled ?? this.mcpEnabled;
      
      // Carica le impostazioni MCP se disponibili
      if (config.mcpStrategy) {
        this.mcpStrategy = config.mcpStrategy as 'aggressive' | 'balanced' | 'conservative';
      }
      if (config.mcpCacheLifetime) {
        this.mcpCacheLifetime = config.mcpCacheLifetime;
      }
    }
  }

  /**
   * Processo generico per le richieste AI con supporto per caching e analytics
   */
  async processRequest<T>({
    prompt,
    model = this.defaultModel,
    systemPrompt,
    temperature = 0.7,
    maxTokens = this.defaultMaxTokens,
    parseResponse,
    onProgress,
    metadata = {},
    useMCP,
    mcpParams
  }: AIRequest): Promise<AIResponse<T>> {
    // Determina se utilizzare MCP
    const shouldUseMCP = useMCP ?? this.mcpEnabled;
    
    // Se MCP è abilitato, utilizza il servizio MCP
    if (shouldUseMCP) {
      return this.processMCPRequest<T>({
        prompt,
        model,
        systemPrompt,
        temperature,
        maxTokens,
        parseResponse,
        onProgress,
        metadata,
        mcpParams
      });
    }
    
    // Genera una chiave di cache basata sui parametri della richiesta
    const cacheKey = aiCache.getKeyForRequest({ 
      prompt, 
      model, 
      systemPrompt, 
      temperature 
    });
    
    // Verifica se la risposta è già in cache
    const cachedResponse = aiCache.get<AIResponse<T>>(cacheKey);
    if (cachedResponse) {
      return {
        ...cachedResponse,
        fromCache: true
      };
    }
    
    // Traccia l'inizio della richiesta per analytics
    const requestId = aiAnalytics.trackRequestStart(
      'ai_request', 
      model, 
      { promptLength: prompt.length, ...metadata }
    );
    
    const startTime = Date.now();
    
    try {
      let fullResponse = '';
      let tokenUsage = {
        promptTokens: Math.round(prompt.length / 4), // stima approssimativa
        completionTokens: 0,
        totalTokens: Math.round(prompt.length / 4)
      };
      
      // Usa il proxy API invece di chiamare direttamente Anthropic
      const response = await fetch('/api/ai/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: maxTokens,
          temperature,
          system: systemPrompt
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'API request failed');
      }
      
      const data = await response.json();
      
      // Estrai il testo dalla risposta
      fullResponse = data.content[0]?.type === 'text' 
        ? data.content[0].text 
        : '';
        
      // Ottieni l'utilizzo dei token dalla risposta
      if (data.usage) {
        tokenUsage = {
          promptTokens: data.usage.input_tokens,
          completionTokens: data.usage.output_tokens,
          totalTokens: data.usage.input_tokens + data.usage.output_tokens
        };
      } else {
        // Stima dei token se non disponibile nella risposta
        tokenUsage.completionTokens = Math.round(fullResponse.length / 4);
        tokenUsage.totalTokens = tokenUsage.promptTokens + tokenUsage.completionTokens;
      }
      
      // Calcola il tempo di elaborazione
      const processingTime = Date.now() - startTime;
      
      // Registra il completamento della richiesta
      aiAnalytics.trackRequestComplete(
        requestId,
        processingTime,
        true,
        tokenUsage.promptTokens,
        tokenUsage.completionTokens
      );
      
      // Analizza la risposta se è fornita una funzione di parsing
      let parsedData: T | null = null;
      let parsingError: Error | null = null;
      
      if (parseResponse && fullResponse) {
        try {
          parsedData = await parseResponse(fullResponse);
        } catch (err) {
          parsingError = err instanceof Error ? err : new Error('Failed to parse response');
          
          // Traccia l'errore di parsing
          aiAnalytics.trackEvent({
            eventType: 'error',
            eventName: 'parsing_error',
            success: false,
            metadata: { 
              requestId, 
              error: parsingError.message 
            }
          });
        }
      }
      
      // Prepara la risposta finale
      const finalResponse: AIResponse<T> = {
        rawResponse: fullResponse,
        data: parsedData,
        error: parsingError?.message,
        parsingError,
        processingTime,
        model,
        success: !parsingError,
        usage: tokenUsage,
        metadata: {
          ...metadata,
          requestId
        }
      };
      
      // Memorizza la risposta nella cache
      aiCache.set(cacheKey, finalResponse);
      
      return finalResponse;
    } catch (error) {
      // Traccia l'errore
      aiAnalytics.trackEvent({
        eventType: 'error',
        eventName: 'api_error',
        errorType: error instanceof Error ? error.name : 'unknown',
        success: false,
        metadata: { 
          requestId, 
          message: error instanceof Error ? error.message : 'Unknown error' 
        }
      });
      
      // Restituisci una risposta di errore
      return {
        rawResponse: null,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
        usage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0
        },
        metadata: {
          ...metadata,
          requestId
        }
      };
    }
  }

  /**
   * Elabora una richiesta tramite il protocollo MCP
   */
  private async processMCPRequest<T>(request: AIRequest): Promise<AIResponse<T>> {
    // Configura parametri MCP basati sulla strategia selezionata
    const defaultMCPParams: MCPRequestParams = this.getMCPParamsFromStrategy();
    
    // Unisci i parametri di default con quelli forniti (se presenti)
    const mcpParams: MCPRequestParams = {
      ...defaultMCPParams,
      ...(request.mcpParams || {})
    };
    
    // Aggiungi parametri MCP alla richiesta
    const mcpRequest: AIRequest = {
      ...request,
      mcpParams
    };
    
    try {
      // Determina la priorità in base al tipo di richiesta
      const priority = this.getMCPPriorityFromMetadata(request.metadata);
      
      // Invia la richiesta tramite MCP service
      const mcpResponse = await mcpService.enqueue<T>(mcpRequest, priority);
      
      // Registra analisi MCP se è stata utilizzata la cache
      if (mcpResponse.cacheHit) {
        aiAnalytics.trackEvent({
          eventType: 'mcp',
          eventName: 'cache_hit',
          success: true,
          metadata: {
            similarity: mcpResponse.similarity,
            savings: mcpResponse.savingsEstimate
          }
        });
      }
      
      return mcpResponse.response;
    } catch (error) {
      console.error('MCP request failed:', error);
      
      // Fallback al processamento standard in caso di errore MCP
      console.log('Falling back to standard request processing');
      
      // Rimuovi i parametri MCP e riprova con il processamento standard
      const { mcpParams, useMCP, ...standardRequest } = request;
      return this.processRequest<T>(standardRequest);
    }
  }
  
  /**
   * Determina i parametri MCP basati sulla strategia configurata
   */
  private getMCPParamsFromStrategy(): MCPRequestParams {
    switch (this.mcpStrategy) {
      case 'aggressive':
        return {
          cacheStrategy: 'hybrid',
          minSimilarity: 0.65,
          cacheTTL: this.mcpCacheLifetime,
          priority: 'speed',
          storeResult: true
        };
      case 'conservative':
        return {
          cacheStrategy: 'exact',
          minSimilarity: 0.9,
          cacheTTL: this.mcpCacheLifetime,
          priority: 'quality',
          storeResult: true
        };
      case 'balanced':
      default:
        return {
          cacheStrategy: 'semantic',
          minSimilarity: 0.8,
          cacheTTL: this.mcpCacheLifetime,
          priority: 'quality',
          storeResult: true
        };
    }
  }
  
  /**
   * Determina la priorità MCP in base ai metadati della richiesta
   */
  private getMCPPriorityFromMetadata(metadata: Record<string, any> = {}): 'high' | 'normal' | 'low' {
    const requestType = metadata?.type || '';
    
    // Richieste ad alta priorità
    if (
      requestType.includes('message') || 
      requestType.includes('critical') ||
      requestType.includes('interactive')
    ) {
      return 'high';
    }
    
    // Richieste a bassa priorità
    if (
      requestType.includes('background') || 
      requestType.includes('batch') ||
      requestType.includes('analysis')
    ) {
      return 'low';
    }
    
    // Priorità normale di default
    return 'normal';
  }

  /**
   * Converte descrizione di testo in elementi CAD
   */
  async textToCADElements(request: TextToCADRequest): Promise<AIResponse<Element[]>> {
    const { 
      description, 
      constraints, 
      style = 'precise', 
      complexity = 'moderate',
      context = [] 
    } = request;
    
    // Costruisce il prompt di sistema utilizzando il template
    const systemPrompt = promptTemplates.textToCAD.system
      .replace('{{complexity}}', complexity)
      .replace('{{style}}', style);
    
    // Costruisce il prompt utente
    let userPrompt = promptTemplates.textToCAD.user.replace('{{description}}', description);
    if (constraints) {
      userPrompt += '\n\nConstraints:\n' + JSON.stringify(constraints, null, 2);
    }
    if (context && context.length > 0) {
      userPrompt += '\n\nReference Context:\n';
      const maxContextLength = 3000; // Limit context size
      context.forEach((contextItem, index) => {
        const truncatedContext = contextItem.length > maxContextLength 
          ? contextItem.substring(0, maxContextLength) + '... [content truncated]' 
          : contextItem;
        userPrompt += `\n--- Context Document ${index + 1} ---\n${truncatedContext}\n`;
      });
      userPrompt += '\n\nPlease consider the above reference context...';
    }
    
    // Revert to calling this.processRequest
    return this.processRequest<Element[]>({
      prompt: userPrompt, // Pass the constructed user prompt
      systemPrompt,
      model: 'claude-3-7-sonnet-20250219', // Explicitly use Claude model
      temperature: complexity === 'creative' ? 0.8 : 0.5,
      maxTokens: this.defaultMaxTokens,
      parseResponse: this.parseTextToCADResponse, // Use the parsing function
      metadata: { // Pass relevant metadata
        type: 'text_to_cad',
        description: description.substring(0, 100),
        complexity,
        style,
        contextCount: context?.length || 0
      }
      // Add useMCP/mcpParams here if needed based on request
      // useMCP: request.useMCP,
      // mcpParams: request.mcpParams
    });
  }

  /**
   * Analizza progetti CAD e fornisce suggerimenti
   */
  async analyzeDesign(elements: Element[]): Promise<AIResponse<AIDesignSuggestion[]>> {
    const prompt = promptTemplates.designAnalysis.user
      .replace('{{elements}}', JSON.stringify(elements, null, 2));
    
    return this.processRequest<AIDesignSuggestion[]>({
      prompt,
      systemPrompt: promptTemplates.designAnalysis.system,
      model: 'claude-3-7-sonnet-20250219', // Usa il modello più potente per analisi approfondite
      temperature: 0.3, // Temperatura bassa per risposte più analitiche
      maxTokens: this.defaultMaxTokens,
      parseResponse: this.parseDesignResponse,
      metadata: {
        type: 'design_analysis',
        elementCount: elements.length
      }
    });
  }

  /**
   * Ottimizza G-code per macchine CNC
   */
  async optimizeGCode(gcode: string, machineType: string, material?: string): Promise<AIResponse<string>> {
    const systemPrompt = promptTemplates.gcodeOptimization.system
      .replace('{{machineType}}', machineType);
    
    const constraints = `- Optimize for speed and efficiency
    - Maintain part accuracy and quality
    - Ensure safe machine operation
    - Follow ${machineType} best practices`;
    
    const prompt = promptTemplates.gcodeOptimization.user
      .replace('{{machineType}}', machineType)
      .replace('{{material}}', material || 'unknown material')
      .replace('{{gcode}}', gcode)
      .replace('{{constraints}}', constraints);
    
    return this.processRequest<string>({
      prompt,
      systemPrompt,
      model: 'claude-3-5-sonnet-20240229',
      temperature: 0.3,
      maxTokens: this.defaultMaxTokens,
      parseResponse: (text) => Promise.resolve(text), // Non serve parsing speciale
      metadata: {
        type: 'gcode_optimization',
        machineType,
        material,
        codeLength: gcode.length
      }
    });
  }

  /**
   * Genera suggerimenti specifici per il contesto corrente
   */
  async generateSuggestions(context: string, mode: string): Promise<AIResponse<string[]>> {
    const prompt = `Based on the current ${mode} context, generate 3-5 helpful suggestions.
    
    Context details:
    ${context}
    
    Provide suggestions as a JSON array of strings. Each suggestion should be clear, specific, and actionable.`;
    
    return this.processRequest<string[]>({
      prompt,
      systemPrompt: `You are an AI CAD/CAM assistant helping users with ${mode} tasks. Generate helpful context-aware suggestions.`,
      model: 'claude-3-haiku-20240229', // Usa il modello più veloce per suggerimenti
      temperature: 0.7,
      maxTokens: 1000,
      parseResponse: this.parseSuggestionsResponse,
      metadata: {
        type: 'suggestions',
        mode
      }
    });
  }

  /**
   * Ottimizza parametri di lavorazione in base al materiale e all'utensile
   */
  async optimizeMachiningParameters(material: string, toolType: string, operation: string): Promise<AIResponse<any>> {
    const prompt = promptTemplates.machiningParameters.user
      .replace('{{material}}', material)
      .replace('{{tool}}', toolType)
      .replace('{{operation}}', operation)
      .replace('{{machine}}', 'Generic CNC');
    
    return this.processRequest<any>({
      prompt,
      systemPrompt: promptTemplates.machiningParameters.system,
      model: 'claude-3-5-sonnet-20240229',
      temperature: 0.3,
      maxTokens: 4000,
      parseResponse: this.parseMachiningResponse,
      metadata: {
        type: 'machining_parameters',
        material,
        toolType,
        operation
      }
    });
  }

  /**
   * Genera completamenti per G-code durante l'editing
   */
  async completeGCode(context: string, cursorPosition: any): Promise<AIResponse<string>> {
    const prompt = `Complete the following G-code at the cursor position.
    
    Current G-code:
    ${context}
    
    Cursor position: line ${cursorPosition.lineNumber}, column ${cursorPosition.column}
    
    Provide only the completion text, no explanations.`;
    
    return this.processRequest<string>({
      prompt,
      systemPrompt: `You are a CNC programming expert. Complete G-code accurately and efficiently.`,
      model: 'claude-3-haiku-20240229', // Modello veloce per completamenti in tempo reale
      temperature: 0.2,
      maxTokens: 100,
      parseResponse: (text) => Promise.resolve(text.trim()),
      metadata: {
        type: 'gcode_completion',
        contextLength: context.length
      }
    });
  }

  /**
   * Processa un messaggio diretto dall'assistente AI
   */
  async processMessage(message: string, mode: string): Promise<AIResponse<string>> {
    let contextPrefix = '';
    
    // Aggiunge contesto in base alla modalità
    switch (mode) {
      case 'cad':
        contextPrefix = 'You are an expert CAD design assistant helping with 3D modeling. ';
        break;
      case 'cam':
        contextPrefix = 'You are an expert CAM programming assistant helping with CNC manufacturing. ';
        break;
      case 'gcode':
        contextPrefix = 'You are an expert G-code programming assistant helping with CNC code. ';
        break;
      case 'toolpath':
        contextPrefix = 'You are an expert toolpath optimization assistant for CNC machines. ';
        break;
      default:
        contextPrefix = 'You are a helpful CAD/CAM software assistant. ';
    }
    
    return this.processRequest<string>({
      prompt: message,
      systemPrompt: contextPrefix + 'Provide helpful, concise, and accurate responses to the user.',
      model: 'claude-3-5-sonnet-20240229',
      temperature: 0.7,
      maxTokens: 4000,
      parseResponse: (text) => Promise.resolve(text),
      metadata: {
        type: 'assistant_message',
        mode,
        messageLength: message.length
      }
    });
  }

  /**
   * Configura i parametri del servizio AI
   */
  setConfig(config: {
    defaultModel?: AIModelType;
    defaultMaxTokens?: number;
    allowBrowser?: boolean;
    mcpEnabled?: boolean;
    mcpStrategy?: 'aggressive' | 'balanced' | 'conservative';
    mcpCacheLifetime?: number;
  }): void {
    if (config.defaultModel) this.defaultModel = config.defaultModel;
    if (config.defaultMaxTokens) this.defaultMaxTokens = config.defaultMaxTokens;
    if (config.allowBrowser !== undefined) this.allowBrowser = config.allowBrowser;
    
    // Aggiungi configurazioni MCP
    if (config.mcpEnabled !== undefined) this.mcpEnabled = config.mcpEnabled;
    if (config.mcpStrategy) this.mcpStrategy = config.mcpStrategy;
    if (config.mcpCacheLifetime) this.mcpCacheLifetime = config.mcpCacheLifetime;
  }

  /**
   * Parser: Converti testo in elementi CAD
   */
  private parseTextToCADResponse = async (text: string): Promise<Element[]> => {
    try {
      // Cerca blocchi JSON nella risposta
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || 
                        text.match(/\[\s*\{[\s\S]*\}\s*\]/);
                        
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }
      
      const json = jsonMatch[1] || jsonMatch[0];
      const elements = JSON.parse(json);
      
      // Valida e arricchisce gli elementi con valori predefiniti
      return elements.map((el: any) => ({
        type: el.type || 'cube',
        x: el.x ?? 0,
        y: el.y ?? 0,
        z: el.z ?? 0,
        width: el.width ?? 50,
        height: el.height ?? 50,
        depth: el.depth ?? 50,
        radius: el.radius ?? 25,
        color: el.color ?? '#1e88e5',
        ...(el.rotation && {
          rotation: {
            x: el.rotation.x ?? 0,
            y: el.rotation.y ?? 0,
            z: el.rotation.z ?? 0
          }
        }),
        ...el
      }));
    } catch (error) {
      console.error('Failed to parse CAD elements:', error);
      throw error;
    }
  };

  /**
   * Parser: Analisi del design
   */
  private parseDesignResponse = async (text: string): Promise<AIDesignSuggestion[]> => {
    try {
      // Cerca JSON in diversi formati
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || 
                        text.match(/```\n([\s\S]*?)\n```/) ||
                        text.match(/\[\s*\{[\s\S]*\}\s*\]/);
                        
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }
      
      const json = jsonMatch[1] || jsonMatch[0];
      const parsed = JSON.parse(json);
      
      // Gestisce sia array diretti che oggetti annidati
      if (Array.isArray(parsed)) {
        return parsed;
      } else if (parsed.suggestions) {
        return parsed.suggestions;
      } else {
        throw new Error('Unexpected JSON format in design response');
      }
    } catch (error) {
      console.error('Failed to parse design response:', error);
      throw error;
    }
  };

  /**
   * Parser: Suggerimenti
   */
  private parseSuggestionsResponse = async (text: string): Promise<string[]> => {
    try {
      // Cerca JSON in diversi formati
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || 
                        text.match(/\[\s*"[\s\S]*"\s*\]/) ||
                        text.match(/\[\s*\{[\s\S]*\}\s*\]/);
                        
      if (!jsonMatch) {
        // Se non trova JSON, estrae elenchi puntati
        const bulletPoints = text.match(/[-*]\s+([^\n]+)/g);
        if (bulletPoints) {
          return bulletPoints.map(point => point.replace(/^[-*]\s+/, '').trim());
        }
        
        // Altrimenti divide per righe
        return text.split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0);
      }
      
      const json = jsonMatch[1] || jsonMatch[0];
      const parsed = JSON.parse(json);
      
      // Gestisce sia array di stringhe che array di oggetti
      if (Array.isArray(parsed)) {
        if (typeof parsed[0] === 'string') {
          return parsed;
        } else if (typeof parsed[0] === 'object') {
          return parsed.map(item => item.text || item.suggestion || item.description || JSON.stringify(item));
        }
      }
      
      throw new Error('Unexpected JSON format in suggestions response');
    } catch (error) {
      console.error('Failed to parse suggestions:', error);
      return [];
    }
  };

  /**
   * Parser: Parametri di lavorazione
   */
  private parseMachiningResponse = async (text: string): Promise<any> => {
    try {
      // Cerca JSON in diversi formati
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || 
                        text.match(/\{[\s\S]*\}/);
                        
      if (jsonMatch) {
        const json = jsonMatch[1] || jsonMatch[0];
        return JSON.parse(json);
      }
      
      // Se non trova JSON, crea un oggetto strutturato
      const params: any = {};
      
      // Estrae velocità di taglio (SFM o m/min)
      const speedMatch = text.match(/cutting speed:?\s*([\d.]+)\s*(sfm|m\/min)/i);
      if (speedMatch) {
        params.cuttingSpeed = {
          value: parseFloat(speedMatch[1]),
          unit: speedMatch[2].toLowerCase()
        };
      }
      
      // Estrae avanzamento (feed rate)
      const feedMatch = text.match(/feed(?:\s*rate)?:?\s*([\d.]+)\s*(ipr|mm\/rev)/i);
      if (feedMatch) {
        params.feedRate = {
          value: parseFloat(feedMatch[1]),
          unit: feedMatch[2].toLowerCase()
        };
      }
      
      // Estrae profondità di taglio
      const depthMatch = text.match(/depth of cut:?\s*([\d.]+)\s*(in|mm)/i);
      if (depthMatch) {
        params.depthOfCut = {
          value: parseFloat(depthMatch[1]),
          unit: depthMatch[2].toLowerCase()
        };
      }
      
      // Estrae step-over
      const stepoverMatch = text.match(/step(?:\s*over|\-over):?\s*([\d.]+)(?:\s*%)?/i);
      if (stepoverMatch) {
        params.stepover = parseFloat(stepoverMatch[1]);
      }
      
      return params;
    } catch (error) {
      console.error('Failed to parse machining parameters:', error);
      throw error;
    }
  };

  /**
   * Handles conversational AI requests, similar to openaiService.sendMessage,
   * but integrated into the unified service flow (including MCP).
   */
  async getAssistantCompletion(
    messages: AIMessage[],
    context: string,
    availableActions: string[] = [],
    responseStyle: ResponseStyle = "detailed",
    complexityLevel: ComplexityLevel = "moderate",
    assistantRole: AssistantRole = "General AI",
    forceToolChoice?: ForceToolChoice,
    modelOverride?: AIModelType
  ): Promise<AIResponse<any>> { 
    
    const modelToUse = modelOverride || this.defaultModel;
    const startTime = Date.now();
    const requestId = uuidv4(); 

    // --- Caching Logic --- 
    const lastMessage = messages[messages.length - 1];
    const hasImages = Array.isArray(lastMessage?.content) &&
                      lastMessage.content.some(block => block.type === 'image_url');
    let cacheKey = null;
    let cachedResponse = null;
    if (!hasImages) {
       // Re-add cache key payload generation
       const cacheKeyPayload = {
         messages: messages.map(m => ({
            role: m.role,
            content: typeof m.content === 'string' ? m.content :
                     (Array.isArray(m.content) ? m.content.filter(b => b.type === 'text').map(b => (b as TextContentBlock).text).join('\\n') : '[Unsupported Content]')
         })),
         context,
         availableActions,
         responseStyle,
         complexityLevel,
         assistantRole,
         forceToolChoice,
         model: modelToUse 
       };
       cacheKey = aiCache.getKeyForRequest(cacheKeyPayload); // Pass payload
       cachedResponse = aiCache.get<AIResponse<{ content: string; actions?: AIAction[]; artifacts?: AIArtifact[] }>>(cacheKey);
    }
    if (cachedResponse) {
       return { ...cachedResponse, fromCache: true };
    }
    // --- End Caching Logic --- 

    // --- Analytics Start (Reverting to 3 args) --- 
    const metadata = { assistantRole, responseStyle, complexityLevel, requestId };
    aiAnalytics.trackRequestStart( 
      'assistant_completion', // eventName (string)
      modelToUse,           // model (string)
      { // metadata (object)
        messageCount: messages.length, 
        actionCount: availableActions.length, 
        forcedTool: !!forceToolChoice,
        ...metadata // Spread the specific metadata 
      }
    );
    // --- End Analytics Start --- 

    try {
      // --- Prepare Request for openaiService.sendMessage --- 
      
      // 1. Construct System Prompt
      let systemPrompt = `You are an AI assistant integrated into a CAD/CAM application. Your role is: ${assistantRole}. `; 
      systemPrompt += `Current context: ${context}. `;
      systemPrompt += `Respond in a ${responseStyle} manner, appropriate for a user with ${complexityLevel} understanding. `;
      if (availableActions.length > 0) {
        systemPrompt += `You have the following tools available: ${availableActions.join(', ')}. Only use tools when specifically requested or clearly necessary based on the user's request.`;
      }

      // 2. Filter Messages (exclude system roles)
      const filteredMessages = messages.filter(msg => msg.role === 'user' || msg.role === 'assistant');

      // 3. Map availableActions to the format expected by OpenAI tools
      const tools = availableActions.map(actionName => ({ 
          type: "function", 
          function: { name: actionName, description: "" } // Add descriptions if available/needed 
      })); 
      
      // 4. Remove messageOptions object, not needed for this signature
      
      // 5. Call openaiService.sendMessage with potentially correct arguments
      console.log("[UnifiedAIService] Calling openaiService.sendMessage with messages, system prompt, and available actions:");
      const response: any = await openAIService.sendMessage(
          filteredMessages, // 1st arg: messages array
          systemPrompt,     // 2nd arg: system prompt string
          availableActions  // 3rd arg: available actions string array
      ); 
      console.log("[UnifiedAIService] Received response from openaiService:", response);

      // --- Process Response (adapted from previous attempt) --- 
      const processingTime = Date.now() - startTime;
      const success = !response?.error; // Infer success
      const errorMessage = response?.error || response?.message || null;
      const usageData = response?.usage; // Assume usage object exists
      const promptTokens = usageData?.promptTokens ?? usageData?.prompt_tokens ?? usageData?.input_tokens ?? 0;
      const completionTokens = usageData?.completionTokens ?? usageData?.completion_tokens ?? usageData?.output_tokens ?? 0;
      const totalTokens = usageData?.totalTokens ?? (promptTokens + completionTokens);
      const extractedContent = response?.data?.content ?? response?.content ?? ""; // Prioritize response.data.content if exists
      const extractedActions = response?.data?.actions; // Check standard location
      const extractedArtifacts = response?.data?.artifacts; // Check standard location

      // --- Analytics Complete (Reverting to 5 args) --- 
      aiAnalytics.trackRequestComplete(
        requestId, // string
        processingTime, // number
        success, // boolean
        promptTokens, // number
        completionTokens // number
      );
      
      // --- Construct Final AIResponse --- 
      if (success) {
        const finalData = {
            content: extractedContent || "(No content)",
            actions: extractedActions,
            artifacts: extractedArtifacts
        };
        const finalResponse: AIResponse<typeof finalData> = {
            rawResponse: JSON.stringify(response), 
            data: finalData,
            success: true,
            error: undefined, 
            processingTime: processingTime,
            model: modelToUse,
            provider: 'openai',
            usage: { promptTokens, completionTokens, totalTokens },
            metadata: { ...metadata, ...(response?.metadata || {}) }
        };
         // Cache the successful response
        if (cacheKey) {
            aiCache.set(cacheKey, finalResponse);
            console.log("UnifiedAIService (getAssistantCompletion): Cached new response for key:", cacheKey);
        }
        return finalResponse;
      } else {
        throw new Error(errorMessage || 'openaiService.sendMessage returned an error');
      }

    } catch (error) {
      // --- Error Handling --- 
      const processingTime = Date.now() - startTime;
      console.error("Error in getAssistantCompletion:", error);
      // --- Analytics Complete (Error - Reverting to 5 args) --- 
      aiAnalytics.trackRequestComplete(requestId, processingTime, false, 0, 0); 
      // --- Analytics Event Error (Restoring full object) ---
      aiAnalytics.trackEvent({ 
          eventType: 'error',
          eventName: 'assistant_completion_error',
          errorType: error instanceof Error ? error.name : 'unknown',
          success: false,
          duration: processingTime, // Add duration back?
          metadata: { requestId, message: error instanceof Error ? error.message : 'Unknown error' }
      });
      const errorResponse: AIResponse<any> = {
        rawResponse: null,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        metadata: metadata
      };
      return errorResponse;
    }
  }
}

// Esporta un'istanza singleton
export const unifiedAIService = new UnifiedAIService();