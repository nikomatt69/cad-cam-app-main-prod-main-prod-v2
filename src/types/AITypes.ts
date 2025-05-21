// src/types/AITypes.ts
/**
 * Tipi AI unificati per l'intera applicazione
 * Centralizza tutte le definizioni di tipo AI per garantire coerenza e tipo-sicurezza
 */

import { Element } from '@/src/store/elementsStore'; // Import Element type

// === TIPI PER CONTROLLO RISPOSTA ===
export type ResponseStyle = "concise" | "detailed" | "step-by-step" | "professional" | "creative" | "bulleted";
export type ComplexityLevel = "simple" | "moderate" | "complex";
export type AssistantRole = "General AI" | "CAD Expert" | "Code Explainer" | "Helpful Assistant" | "CAD Assistant";


// === MODELLI AI ===
export type AIModelType = 
  // Claude models
  | 'claude-3-5-sonnet-20240229'
  | 'claude-3-opus-20240229'
  | 'claude-3-haiku-20240229'
  | 'claude-3-7-sonnet-20250219'
  // OpenAI models
  | 'gpt-4'
  | 'gpt-4.1'
  | 'gpt-4-turbo-preview'
  | 'gpt-3.5-turbo'
  | 'gpt-4o'
  | 'gpt-4o-mini';

// === PROVIDER AI ===
export type AIProviderType = 'claude' | 'openai' | 'CLAUDE' | 'OPENAI';

// === MODALITÀ AI ===
export type AIMode = 'cad' | 'cam' | 'gcode' | 'toolpath' | 'analysis' | 'general';

// === CONFIG AI ===
export interface AIServiceConfig {
  apiKey?: string;
  defaultModel: AIModelType;
  maxTokens: number;
  temperature: number;
  cacheEnabled: boolean;
  analyticsEnabled: boolean;
  allowBrowser: boolean;
  customPrompts?: Record<string, string>;
  retryAttempts?: number;
  mcpEnabled?: boolean; // Flag per abilitare il protocollo MCP
  mcpEndpoint?: string; // Endpoint per il servizio MCP
  mcpApiKey?: string;   // API key per il servizio MCP
  mcpStrategy?: 'aggressive' | 'balanced' | 'conservative'; // Strategia MCP
  mcpCacheLifetime?: number; // Durata cache in millisecondi
  autoModelSelection?: { enabled: boolean; preferredProvider?: AIProviderType; [key: string]: any }; // Auto model selection settings
  openaiApiKey?: string; // Chiave API specifica per OpenAI
  openaiOrgId?: string;  // ID organizzazione per OpenAI
}

// === MCP REQUEST PARAMS ===
export interface MCPRequestParams {
  cacheStrategy: 'exact' | 'semantic' | 'hybrid';
  minSimilarity?: number; // Per ricerche semantiche, 0-1
  cacheTTL?: number; // Time-to-live in ms
  priority?: 'speed' | 'quality' | 'cost';
  storeResult?: boolean;
  multiProviderEnabled?: boolean;
  preferredProvider?: AIProviderType;
}

// === RICHIESTE AI ===
export interface AIRequest {
  prompt: string;
  model?: AIModelType;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  parseResponse?: (text: string) => Promise<any>;
  onProgress?: (text: string) => void;
  retryCount?: number;
  metadata?: Record<string, any>;
  useMCP?: boolean; // Flag per utilizzare MCP per questa richiesta
  mcpParams?: MCPRequestParams; // Parametri specifici per MCP
  // Parametri specifici per OpenAI
  provider?: AIProviderType;
  openaiOptions?: {
    functions?: any[];
    function_call?: string;
    presence_penalty?: number;
    frequency_penalty?: number;
    top_p?: number;
    stop?: string[];
    logit_bias?: Record<string, number>;
  };
}

// === RISPOSTE AI ===
export interface AIResponse<T = any> {
  rawResponse: string | null;
  data: T | null;
  error?: string;
  parsingError?: Error | null;
  processingTime?: number;
  model?: AIModelType;
  provider?: AIProviderType;
  success: boolean;
  fromCache?: boolean;
  fromMCP?: boolean; // Indica se la risposta proviene dal servizio MCP
  warnings?: string[];
  suggestions?: string[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost?: number;
  };
  metadata?: Record<string, any>;
}

// === MCP (Model-Completions-Protocol) ===
export interface MCPResponse<T = any> {
  cacheHit: boolean;
  similarity?: number;
  response: AIResponse<T>;
  savingsEstimate?: {
    tokens: number;
    cost: number;
    timeMs: number;
  };
}

// === EVENTI ANALYTICS AI ===
export interface AIAnalyticsEvent {
  eventType: 'request' | 'response' | 'error' | 'feedback' | 'mcp' | 'cam_gcode' | 'toolpath_analysis' | 'cam_cost' | 'cam_action' | 'cam_optimizer' | 'cam_analyzer' | 'cam_text_to_gcode';
  eventName: string;
  timestamp: number;
  duration?: number;
  model?: string;
  promptTokens?: number;
  completionTokens?: number;
  success?: boolean;
  errorType?: string;
  feedbackRating?: number;
  metadata?: Record<string, any>;
}

// === TOKEN USAGE ===
export interface TokenUsage {
  prompt: number;
  completion: number;
  total: number;
}

// === CONTEXT SUMMARY ===
export interface ContextSummary {
  elements: {
    count: number;
    types: Record<string, number>;
    summary: string;
  };
  documents: {
    count: number;
    summary: string;
  };
  history: {
    count: number;
    recentActions: string[];
  };
  environment: {
    browser: string;
    screen: string;
    os: string;
  };
}

// === DOCUMENT INSIGHT ===
export interface DocumentInsight {
  key: string;
  value: string;
  confidence: number;
}

// === MACHINE LEARNING ANALYSIS ===
export interface DocumentClassification {
  category: string;
  confidence: number;
  keywords: string[];
}

export interface CADModelAnalysis {
  complexity: number;
  suggestions: string[];
  features: string[];
}

// === GENERATED COMPONENT ===
export interface GeneratedComponent {
  id: string;
  name: string;
  description: string;
  timestamp: number;
  elements: Element[];
  preview?: string; // Base64 immagine preview
  source: 'ai' | 'user' | 'imported';
  tags: string[];
  metadata: Record<string, any>;
}

// === RICHIESTE SPECIFICHE ===
export interface TextToCADRequest {
  description: string;
  context?: string[];
  constraints?: {
    maxElements?: number;
    maxDimensions?: {
      width: number;
      height: number;
      depth: number;
    };
    preferredTypes?: string[];
    mustInclude?: string[];
    mustExclude?: string[];
    [key: string]: any;
  };
  style?: 'precise' | 'artistic' | 'mechanical' | 'organic';
  complexity?: 'simple' | 'moderate' | 'complex' | 'creative';
  useMCP?: boolean;
  mcpParams?: MCPRequestParams;
  structuredContext?: Record<string, any>; // Structured context from EnhancedContext
}

export interface DesignAnalysisRequest {
  elements: any[];
  analysisType: 'structural' | 'manufacturability' | 'cost' | 'performance' | 'comprehensive';
  materialContext?: string;
  manufacturingMethod?: string;
  specificConcerns?: string[];
  useMCP?: boolean;
  mcpParams?: MCPRequestParams;
  structuredContext?: Record<string, any>; // Structured context from EnhancedContext
}

export interface GCodeOptimizationRequest {
  gcode: string;
  machineType: string;
  material?: string;
  toolDiameter?: number;
  optimizationGoal?: 'speed' | 'quality' | 'toolLife' | 'balanced';
  constraints?: {
    maxFeedRate?: number;
    maxSpindleSpeed?: number;
    minToolLife?: number;
    [key: string]: any;
  };
  useMCP?: boolean;
  mcpParams?: MCPRequestParams;
  structuredContext?: Record<string, any>; // Structured context from EnhancedContext
}

// === RISULTATI SPECIFICI ===
export interface AIDesignSuggestion {
  id: string;
  type: 'optimization' | 'alternative' | 'improvement' | 'warning' | 'critical';
  title: string;
  description: string;
  confidence: number;
  potentialImpact: {
    performanceGain: number;
    costReduction: number;
    manufacturabilityScore?: number;
  };
  suggestedModifications: any[];
}

export interface ToolpathParameters {
  operation: string;
  tool: {
    type: string;
    diameter: number;
  };
  cutting: {
    speed: number;
    feedRate: number;
  };
}

export interface Toolpath {
  id?: string;
  name?: string;
  points?: { x: number; y: number; z: number }[];
  segments?: { start: number; end: number; type: string }[];
  aiOptimizations?: {
    description: string;
    optimizationScore: number;
    suggestedModifications: ToolpathModification[];
  };
}

export interface ToolpathModification {
  id: string;
  type: 'path' | 'speed' | 'feedRate' | 'toolChange';
  description: string;
  priority: number;
  impact: {
    timeReduction?: number;
    toolWearReduction?: number;
    surfaceQualityImprovement?: number;
  };
}

// === PERFORMANCE METRICS ===
export interface AIPerformanceMetrics {
  averageResponseTime: number;
  successRate: number;
  tokenUsage: number;
  costEfficiency: number;
  modelUsage: Record<AIModelType, number>;
  mcpStats?: {
    cacheHits: number;
    totalRequests: number;
    averageSavings: number;
  };
  errors: {
    count: number;
    types: Record<string, number>;
  };
}

// === STATO AI DELL'APPLICAZIONE ===
export interface AIState {
  isEnabled: boolean;
  currentModel: AIModelType;
  temperature: number;
  isProcessing: boolean;
  mode: AIMode;
  assistant: {
    isVisible: boolean;
    isPanelOpen: boolean;
    suggestions: any[];
    lastAction: string | null;
  };
  history: AIHistoryItem[];
  settings: AISettings;
  performance: {
    averageResponseTime: number;
    successRate: number;
    tokenUsage: number;
    lastSync: number;
  };
  pendingActions: AIAction[];
}

export interface AIHistoryItem {
  id: string;
  type: string;
  timestamp: number;
  prompt?: string;
  userContent?: MessageContent;
  result?: any;
  modelUsed: AIModelType | string | null;
  processingTime: number;
  tokenUsage?: {
    prompt: number;
    completion: number;
    total: number;
  };
  fromMCP?: boolean;
  mcpSavings?: {
    tokens: number;
    cost: number;
    timeMs: number;
  };
  artifacts?: AIArtifact[];
}

export interface AISettings {
  autoSuggest: boolean;
  cacheEnabled: boolean;
  analyticsEnabled: boolean;
  maxTokens: number;
  suggestThreshold: number;
  customPrompts: Record<string, string>;
  autoModelSelection: boolean;
  costOptimization: boolean;
  mcpEnabled: boolean;
  mcpStrategy: 'aggressive' | 'balanced' | 'conservative';
  mcpCacheLifetime: number;
  mcpEndpoint?: string;
  mcpApiKey?: string;
  multiProviderEnabled?: boolean;
  preferredProvider?: AIProviderType;
  openaiApiKey?: string;
  openaiOrgId?: string;
}

export type MessageRole = 'user' | 'assistant' | 'system';

// --- Define complex message content structure --- 
export interface TextContentBlock {
  type: "text";
  text: string;
}

export interface ImageUrl {
  url: string; // Can be http(s) URL or data URL
  detail?: "low" | "high" | "auto"; // Optional detail level
}

export interface ImageContentBlock {
  type: "image_url";
  image_url: ImageUrl;
}

// Union type for message content
export type MessageContent = string | (TextContentBlock | ImageContentBlock)[];
// --- End complex message content structure --- 

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: MessageContent; // Allow complex content
  timestamp: number;
  name?: string; // For function/tool role
  tool_call_id?: string; // For tool role
  artifacts?: AIArtifact[];
  isError?: boolean; // Add optional error flag
}

export interface AIArtifact {
  id: string;
  // Add 'cad_elements' and 'tool_calls' to the allowed types
  type: 'code' | 'json' | 'cad' | 'image' | 'markdown' | 'cad_elements' | 'tool_calls'; 
  content: any; // Change content to 'any' to allow storing Element[] or tool_calls array
  language?: string;
  title?: string;
}

export interface AIAction {
  type: string;
  payload: any;
  description: string;
}

export interface AIAssistantState {
  messages: AIMessage[];
  isProcessing: boolean;
  isOpen: boolean;
  error: string | null;
  context: string;
  availableActions: string[];
}

export interface AIAssistantOptions {
  initialContext?: string;
  enabledActions?: string[];
  model?: string;
  temperature?: number;
}

export interface DesignContext {
  complexity: number; // 0-1 scale
  features: string[];
  elementTypes: Record<string, number>;
  boundingBox: {
    min: { x: number; y: number; z: number };
    max: { x: number; y: number; z: number };
  };
  styleMetrics: {
    colorPalette: string[];
    dominantColor: string;
    cornerStyle: 'sharp' | 'rounded' | 'mixed';
    surfaceFinish: 'smooth' | 'textured' | 'mixed';
    proportions: 'uniform' | 'varied';
    symmetry: 'symmetric' | 'asymmetric' | 'partial';
  };
  spatialRelationships: {
    primaryAxis: 'x' | 'y' | 'z' | 'none';
    connections: { type: string; count: number }[];
    hierarchy: 'flat' | 'nested' | 'layered';
    density: number; // 0-1 scale
  };
  designSystem: {
    type: 'mechanical' | 'organic' | 'architectural' | 'abstract' | 'unknown';
    gridSize: number | null;
    modularity: number; // 0-1 scale
  };
  scale: {
    category: 'microscopic' | 'small' | 'medium' | 'large' | 'architectural' | 'unknown';
    maxDimension: number;
    typicalUnit: 'mm' | 'cm' | 'm' | 'unknown';
  };
  metadata: {
    elementCount: number;
    dominantColor: string;
    timestamp: number;
    [key: string]: any;
  };
}

export interface GenerationConstraints {
  maxElements?: number;
  enforceStyleConsistency?: boolean;
  scaleToMatch?: boolean;
  preferredTypes?: string[];
  colorPalette?: string[];
  maxDimensions?: {
    width: number;
    height: number;
    depth: number;
  };
  symmetryType?: 'symmetric' | 'asymmetric';
  namePrefix?: string;
  [key: string]: any;
}

export interface GenerationOptions {
  useCache?: boolean;
  cacheTTL?: number;
  fallbackOnError?: boolean;
  attemptFix?: boolean;
  positioning?: 'adjacent' | 'smart' | 'centered' | 'origin' | 'custom';
  includeExamples?: boolean;
  temperature?: number;
  maxTokens?: number;
  modelOverride?: string;
  [key: string]: any;
}

export interface GenerationResult {
  requestId: string;
  generatedElements: Element[];
  originalDescription: string;
  designContext: DesignContext;
  appliedConstraints: GenerationConstraints;
  metadata: {
    processingTimeMs: number;
    elementCount: number;
    confidenceScore: number;
    modelUsed: string;
    [key: string]: any;
  };
  fromCache?: boolean;
  fallbackUsed?: boolean;
  emergencyFallback?: boolean;
}