// src/components/ai/CAMAssistant/CAMAssistantOpenai.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useCAMAssistant } from './CAMAssistantBridge';
import { AIMessage, AssistantRole, ComplexityLevel, ResponseStyle } from '../../../types/AITypes';
import { unifiedAIService } from '../../../lib/ai/unifiedAIServiceCAM';
import { camActionHandler } from '../../../lib/ai/camActionHandler';


import { Loader2 } from 'lucide-react';
import { Button } from '../../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Textarea } from '../../ui/textarea';
import { Card, CardContent } from 'src/components/ui/Card';
import { useToast } from '@/src/contexts/ToastContext';
import toast from 'react-hot-toast';

/**
 * Proprietà del componente CAMAssistantOpenai
 */
interface CAMAssistantOpenaiProps {
  role?: AssistantRole;
  responseStyle?: ResponseStyle;
  complexityLevel?: ComplexityLevel;
  initialMessage?: string;
  availableActions?: string[];
  onGeneratedResponse?: (response: string) => void;
  onGeneratedAction?: (action: any) => void;
  className?: string;
}

/**
 * Componente che fornisce un'interfaccia per interagire con il CAM Assistant
 */
export const CAMAssistantOpenai: React.FC<CAMAssistantOpenaiProps> = ({
  role = 'CAM Assistant',
  responseStyle = 'detailed',
  complexityLevel = 'moderate',
  initialMessage,
  availableActions = [],
  onGeneratedResponse,
  onGeneratedAction,
  className = ''
}) => {
  // Stati per la conversazione
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTool, setSelectedTool] = useState<string>('');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('');
  
  // Context e hooks
  const camAssistant = useCAMAssistant();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Effetto per scrollare automaticamente alla fine della conversazione
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Effetto per impostare un messaggio iniziale di benvenuto
  useEffect(() => {
    if (initialMessage && messages.length === 0) {
      const welcomeMessage: AIMessage = {
        id: crypto.randomUUID(),
        timestamp: Number(new Date()),
        role: 'assistant',
        content: initialMessage || "Welcome to the CAM Assistant. I can help you generate G-code from text descriptions, analyze and optimize G-code, and assist with other CAM operations. How can I help you today?"
      };
      setMessages([welcomeMessage]);
    }
  }, [initialMessage, messages.length]);
  
  // Gestisce l'invio del messaggio
  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim()) return;
    
    // Aggiunge il messaggio dell'utente alla conversazione
    const userMessage: AIMessage = {
      id: crypto.randomUUID(),
      timestamp: Number(new Date()),
      role: 'user',
      content: inputValue
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    
    try {
      // Prepara il contesto strutturato
      const structuredContext = {
        selectedTool: camAssistant.state.activeTool 
          ? { id: camAssistant.state.activeTool.id, name: camAssistant.state.activeTool.name }
          : undefined,
        selectedMaterial: camAssistant.state.activeMaterial
          ? { id: camAssistant.state.activeMaterial.id, name: camAssistant.state.activeMaterial.name, type: camAssistant.state.activeMaterial.type }
          : undefined,
        selectedToolpath: camAssistant.state.activeToolpath
          ? { id: camAssistant.state.activeToolpath.id, name: camAssistant.state.activeToolpath.name }
          : undefined,
        currentGCode: camAssistant.state.currentGCode,
        toolpathsCount: camAssistant.state.toolpaths.length,
        toolsCount: camAssistant.state.tools.length,
        materialsCount: camAssistant.state.materials.length
      };
      
      // Crea il contesto testuale
      const contextString = `You are helping with CAM operations, focusing primarily on G-code generation and optimization. ` +
        (camAssistant.state.activeTool ? `Current Tool: ${camAssistant.state.activeTool.name} (${camAssistant.state.activeTool.diameter}mm diameter). ` : '') +
        (camAssistant.state.activeMaterial ? `Current Material: ${camAssistant.state.activeMaterial.name} (${camAssistant.state.activeMaterial.type}). ` : '') +
        (camAssistant.state.activeToolpath ? `Current Toolpath: ${camAssistant.state.activeToolpath.name}. ` : '') +
        (camAssistant.state.currentGCode ? `G-code is loaded (${camAssistant.state.currentGCode.length} characters). ` : '');

      // Verifica se il messaggio contiene richieste di generazione di G-code
      const isGCodeGenerationRequest = 
        inputValue.toLowerCase().includes('generate g-code') || 
        inputValue.toLowerCase().includes('create g-code') || 
        inputValue.toLowerCase().includes('make g-code') ||
        inputValue.toLowerCase().includes('convert to g-code');
        
      // Se è una richiesta di generazione di G-code, aggiungi azioni disponibili specifiche
      const enhancedActions = [...availableActions];
      if (isGCodeGenerationRequest) {
        enhancedActions.push('[Action:generateGCodeFromText:description]');
      }
      
      // Ottieni la risposta dall'assistente
      const response = await unifiedAIService.getAssistantCompletion(
        [...messages, userMessage],
        contextString,
        enhancedActions,
        responseStyle,
        complexityLevel,
        role as AssistantRole,
        undefined,
        'claude-3-7-sonnet-20250219',
        structuredContext
      );
      
      if (response.success && response.data) {
        // Aggiungi la risposta dell'assistente alla conversazione
        const assistantMessage: AIMessage = {
          id: crypto.randomUUID(),
          timestamp: Number(new Date()),
          role: 'assistant',
          content: response.data.content
        };
        
        setMessages(prev => [...prev, assistantMessage]);
        
        // Notifica la risposta generata
        if (onGeneratedResponse) {
          onGeneratedResponse(response.data.content);
        }
        
        // Gestisci eventuali azioni generate
        if (response.data.actions && response.data.actions.length > 0) {
          const action = response.data.actions[0];
          
          // Notifica l'azione generata
          if (onGeneratedAction) {
            onGeneratedAction(action);
          }
          
          // Esegui l'azione in base al tipo
          await handleAssistantAction(action);
        } else if (isGCodeGenerationRequest) {
          // Se è una richiesta di generazione di G-code ma non è stata rilevata un'azione automatica,
          // prova a generare G-code direttamente
          await handleGCodeGeneration(inputValue);
        }
      } else {
        // Gestisci errori nella risposta
        toast('Error',{
          id: response.error || 'Failed to get a response from the assistant',
        });
        
        // Aggiungi un messaggio di errore alla conversazione
        const errorMessage: AIMessage = {
          id: crypto.randomUUID(),
          timestamp: Number(new Date()),
          role: 'assistant',
          content: 'Sorry, I encountered an error while processing your request. Please try again.'
        };
        
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      // Gestisci errori generici
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      
      toast('Error',{
        id: errorMessage,
      });
      
      // Aggiungi un messaggio di errore alla conversazione
      const assistantErrorMessage: AIMessage = {
        id: crypto.randomUUID(),
        timestamp: Number(new Date()),
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please try again.'
      };
      
      setMessages(prev => [...prev, assistantErrorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, camAssistant.state.activeTool, camAssistant.state.activeMaterial, camAssistant.state.activeToolpath, camAssistant.state.toolpaths.length, camAssistant.state.tools.length, camAssistant.state.materials.length, camAssistant.state.currentGCode, messages, availableActions, responseStyle, complexityLevel, role, onGeneratedResponse, onGeneratedAction]);
  
  // Gestisce la generazione di G-code da testo
  const handleGCodeGeneration = useCallback(async (description: string) => {
    try {
      toast('Generating G-code', {
        id: 'Generating G-code from your description...',
        duration: 3000
      });
      
      const result = await camActionHandler.handleAction({
        type: 'GENERATE_GCODE_FROM_TEXT',
        payload: {
          description,
          tool: camAssistant.state.activeTool,
          material: camAssistant.state.activeMaterial,
          machineConfig: {
            type: 'CNC Mill',
            wcs: 'G54',
            units: 'mm'
          }
        }
      });
      
      if (result) {
        // Salva il G-code generato nello stato
        camAssistant.setCurrentGCode(result.gcode);
        
        // Aggiungi un messaggio con il risultato della generazione
        const resultMessage: AIMessage = {
          id: crypto.randomUUID(),
          timestamp: Number(new Date()),
          role: 'assistant',
          content: `I've generated G-code based on your description. Here's a preview of the first few lines:\n\n\`\`\`gcode\n${result.gcode.split('\n').slice(0, 10).join('\n')}\n...\n\`\`\`\n\nThe complete G-code has been saved and is ready for use. Would you like me to analyze it for quality and efficiency?`
        };
        
        setMessages(prev => [...prev, resultMessage]);
        
        toast.success('G-code Generated', {
          id: 'G-code has been generated successfully!',
          duration: 3000
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      
      toast.error('Error', {
        id: `Error generating G-code: ${errorMessage}`,
        duration: 5000
      });
      
      // Aggiungi un messaggio di errore alla conversazione
      const errorResponseMessage: AIMessage = {
        id: crypto.randomUUID(),
        timestamp: Number(new Date()),
        role: 'assistant',
        content: `I encountered an error while generating G-code: ${errorMessage}`
      };
      
      setMessages(prev => [...prev, errorResponseMessage]);
    }
  }, [camAssistant]);
  
  // Gestisce le azioni generate dall'assistente
  const handleAssistantAction = useCallback(async (action: any) => {
    try {
      // Mostra un toast che indica l'azione in corso
      toast('Executing Action',{
        id: `Executing ${action.type} action...`,
        duration: 3000
      });
      
      // Esegui l'azione in base al tipo
      switch (action.type) {
        case 'analyzeToolpath':
          if (camAssistant.state.activeToolpath) {
            const result = await camAssistant.analyzeToolpath(
              camAssistant.state.activeToolpath,
              camAssistant.state.activeTool,
              camAssistant.state.activeMaterial
            );
            
            if (result) {
              // Aggiungi un messaggio con i risultati dell'analisi
              const summaryMessage: AIMessage = {
                id: crypto.randomUUID(),
                timestamp: Number(new Date()),
                role: 'assistant',
                content: `Toolpath Analysis Results:
                - Efficiency: ${result.efficiency}%
                - Quality Score: ${result.quality}%
                - Issues Found: ${result.issues.length}
                - Top Recommendations: ${result.recommendations.slice(0, 2).map(r => r.description).join(', ')}
                `
              };
              
              setMessages(prev => [...prev, summaryMessage]);
            }
          } else {
            throw new Error('No active toolpath selected');
          }
          break;
          
        case 'optimizeToolpath':
          if (camAssistant.state.activeToolpath) {
            const goals = action.payload?.goals || ['time', 'quality'];
            
            const result = await camAssistant.optimizeToolpath(
              camAssistant.state.activeToolpath,
              goals,
              camAssistant.state.activeTool,
              camAssistant.state.activeMaterial
            );
            
            if (result) {
              // Aggiungi un messaggio con i risultati dell'ottimizzazione
              const summaryMessage: AIMessage = {
                id: crypto.randomUUID(),
                timestamp: Number(new Date()),
                role: 'assistant',
                content: `Toolpath Optimization Complete: Created optimized toolpath "${result.name}".`
              };
              
              setMessages(prev => [...prev, summaryMessage]);
            }
          } else {
            throw new Error('No active toolpath selected');
          }
          break;
          
        case 'analyzeTool':
          if (camAssistant.state.activeTool) {
            const result = await camAssistant.analyzeTool(
              camAssistant.state.activeTool,
              camAssistant.state.activeMaterial,
              camAssistant.state.activeOperation
            );
            
            if (result) {
              // Aggiungi un messaggio con i risultati dell'analisi
              const summaryMessage: AIMessage = {
                id: crypto.randomUUID(),
                timestamp: Number(new Date()),
                role: 'assistant',
                content: `Tool Analysis Complete: ${JSON.stringify(result.analysis || result, null, 2)}`
              };
              
              setMessages(prev => [...prev, summaryMessage]);
            }
          } else {
            throw new Error('No active tool selected');
          }
          break;
          
        case 'analyzeMaterial':
          if (camAssistant.state.activeMaterial) {
            const result = await camAssistant.analyzeMaterial(
              camAssistant.state.activeMaterial,
              camAssistant.state.tools,
              camAssistant.state.activeOperation
            );
            
            if (result) {
              // Aggiungi un messaggio con i risultati dell'analisi
              const summaryMessage: AIMessage = {
                id: crypto.randomUUID(),
                timestamp: Number(new Date()),
                role: 'assistant',
                content: `Material Analysis Complete: ${JSON.stringify(result.summary || result, null, 2)}`
              };
              
              setMessages(prev => [...prev, summaryMessage]);
            }
          } else {
            throw new Error('No active material selected');
          }
          break;
          
        case 'calculateCost':
          if (camAssistant.state.activeToolpath && camAssistant.state.activeTool) {
            const rates = action.payload?.rates;
            
            const result = await camAssistant.calculateCost(
              camAssistant.state.activeToolpath,
              camAssistant.state.activeTool,
              camAssistant.state.activeMaterial,
              rates
            );
            
            if (result) {
              // Aggiungi un messaggio con i risultati del calcolo dei costi
              const summaryMessage: AIMessage = {
                id: crypto.randomUUID(),
                timestamp: Number(new Date()),
                role: 'assistant',
                content: `Cost Calculation Results:
                - Total Cost: ${result.totalCost.toFixed(2)}
                - Machine Cost: ${result.breakdown.machineCost.toFixed(2)}
                - Labor Cost: ${result.breakdown.laborCost.toFixed(2)}
                - Tool Cost: ${result.breakdown.toolCost.toFixed(2)}
                - Material Cost: ${result.breakdown.materialCost.toFixed(2)}
                - Setup Cost: ${result.breakdown.setupCost.toFixed(2)}
                - Machining Time: ${result.machiningTime.toFixed(2)} minutes
                `
              };
              
              setMessages(prev => [...prev, summaryMessage]);
            }
          } else {
            throw new Error('Active toolpath and tool required for cost calculation');
          }
          break;
          
        case 'analyzeGCode':
          if (camAssistant.state.currentGCode) {
            const result = await camAssistant.analyzeGCode(
              camAssistant.state.currentGCode,
              camAssistant.state.activeTool,
              camAssistant.state.activeMaterial
            );
            
            if (result) {
              // Aggiungi un messaggio con i risultati dell'analisi
              const summaryMessage: AIMessage = {
                id: crypto.randomUUID(),
                timestamp: Number(new Date()),
                role: 'assistant',
                content: `G-code Analysis Results:
                - Lines: ${result.lineCount}
                - Errors: ${result.errors.length}
                - Warnings: ${result.warnings.length}
                - Estimated Machining Time: ${(result.estimatedMachiningTime / 60).toFixed(2)} minutes
                - Optimization Potential: ${result.optimization.recommendations.length} recommendations available
                `
              };
              
              setMessages(prev => [...prev, summaryMessage]);
            }
          } else {
            throw new Error('No G-code loaded');
          }
          break;
          
        case 'optimizeGCode':
          if (camAssistant.state.currentGCode) {
            const goals = action.payload?.goals || ['time'];
            
            const result = await camAssistant.optimizeGCode(
              camAssistant.state.currentGCode,
              goals,
              camAssistant.state.activeTool,
              camAssistant.state.activeMaterial
            );
            
            if (result) {
              // Aggiorna il G-code corrente
              camAssistant.setCurrentGCode(result);
              
              // Aggiungi un messaggio con i risultati dell'ottimizzazione
              const summaryMessage: AIMessage = {
                id: crypto.randomUUID(),
                timestamp: Number(new Date()),
                role: 'assistant',
                content: `G-code Optimization Complete: G-code has been updated. Here's a preview of the optimized code:\n\n\`\`\`gcode\n${result.split('\n').slice(0, 10).join('\n')}\n...\n\`\`\``
              };
              
              setMessages(prev => [...prev, summaryMessage]);
            }
          } else {
            throw new Error('No G-code loaded');
          }
          break;
          
        case 'simulateMachining':
          if (camAssistant.state.activeToolpath && camAssistant.state.activeTool) {
            const result = await camAssistant.simulateMachining(
              camAssistant.state.activeToolpath,
              camAssistant.state.activeTool,
              camAssistant.state.activeMaterial
            );
            
            if (result) {
              // Aggiungi un messaggio con i risultati della simulazione
              const summaryMessage: AIMessage = {
                id: crypto.randomUUID(),
                timestamp: Number(new Date()),
                role: 'assistant',
                content: `Machining Simulation Results:
                - Estimated Machining Time: ${(result.machiningTime / 60).toFixed(2)} minutes
                - Total Distance: ${result.totalDistance.toFixed(2)} mm
                - Cutting Distance: ${result.cuttingDistance.toFixed(2)} mm
                - Rapid Distance: ${result.rapidDistance.toFixed(2)} mm
                - Efficiency Score: ${result.efficiency}%
                - Quality Score: ${result.quality}%
                `
              };
              
              setMessages(prev => [...prev, summaryMessage]);
            }
          } else {
            throw new Error('Active toolpath and tool required for simulation');
          }
          break;
          
        case 'generateGCodeFromText':
          await handleGCodeGeneration(action.payload || inputValue);
          break;
          
        case 'enhanceGCode':
          if (camAssistant.state.currentGCode) {
            const goal = action.payload?.goal || 'all';
            
            const result = await camActionHandler.handleAction({
              type: 'ENHANCE_GCODE',
              payload: {
                gcode: camAssistant.state.currentGCode,
                enhancementGoal: goal,
                tool: camAssistant.state.activeTool,
                material: camAssistant.state.activeMaterial
              }
            });
            
            if (result) {
              // Aggiorna il G-code corrente
              camAssistant.setCurrentGCode(result.gcode);
              
              // Aggiungi un messaggio con i risultati del miglioramento
              const summaryMessage: AIMessage = {
                id: crypto.randomUUID(),
                timestamp: Number(new Date()),
                role: 'assistant',
                content: `G-code Enhancement Complete: The G-code has been improved for ${goal}. Here's a preview of the enhanced code:\n\n\`\`\`gcode\n${result.gcode.split('\n').slice(0, 10).join('\n')}\n...\n\`\`\``
              };
              
              setMessages(prev => [...prev, summaryMessage]);
            }
          } else {
            throw new Error('No G-code loaded');
          }
          break;
          
        case 'convertGCode':
          if (camAssistant.state.currentGCode) {
            const source = action.payload?.source || 'Generic';
            const target = action.payload?.target || 'Haas';
            
            const result = await camActionHandler.handleAction({
              type: 'CONVERT_GCODE',
              payload: {
                gcode: camAssistant.state.currentGCode,
                sourceController: source,
                targetController: target
              }
            });
            
            if (result) {
              // Aggiorna il G-code corrente
              camAssistant.setCurrentGCode(result.gcode);
              
              // Aggiungi un messaggio con i risultati della conversione
              const summaryMessage: AIMessage = {
                id: crypto.randomUUID(),
                timestamp: Number(new Date()),
                role: 'assistant',
                content: `G-code Conversion Complete: The G-code has been converted from ${source} to ${target} format. Here's a preview of the converted code:\n\n\`\`\`gcode\n${result.gcode.split('\n').slice(0, 10).join('\n')}\n...\n\`\`\``
              };
              
              setMessages(prev => [...prev, summaryMessage]);
            }
          } else {
            throw new Error('No G-code loaded');
          }
          break;
          
        default:
          console.warn(`Unhandled action type: ${action.type}`);
      }
      
      toast('Action Complete',{
        id: `${action.type} action completed successfully.`,
        duration: 3000
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      
      toast('Action Error',{
        id: errorMessage,
        duration: 5000
      });
      
      // Aggiungi un messaggio di errore alla conversazione
      const errorResponseMessage: AIMessage = {
        id: crypto.randomUUID(),
        timestamp: Number(new Date()),
        role: 'assistant',
        content: `I encountered an error while executing the ${action.type} action: ${errorMessage}`
      };
      
      setMessages(prev => [...prev, errorResponseMessage]);
    }
  }, [camAssistant, toast, inputValue, handleGCodeGeneration]);
  
  // Gestisce la pressione del tasto Invio per inviare il messaggio
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);
  
  // Gestisce la selezione di un utensile
  const handleToolSelection = useCallback((value: string) => {
    setSelectedTool(value);
    
    // Trova l'utensile selezionato
    const tool = camAssistant.state.tools.find(t => t.id === value);
    
    // Imposta l'utensile attivo
    camAssistant.setActiveTool(tool);
    
    // Notifica l'utente
    if (tool) {
      toast('Tool Selected',{
        id: `Selected tool: ${tool.name}`,
        duration: 3000
      });
    }
  }, [camAssistant, toast]);
  
  // Gestisce la selezione di un materiale
  const handleMaterialSelection = useCallback((value: string) => {
    setSelectedMaterial(value);
    
    // Trova il materiale selezionato
    const material = camAssistant.state.materials.find(m => m.id === value);
    
    // Imposta il materiale attivo
    camAssistant.setActiveMaterial(material);
    
    // Notifica l'utente
    if (material) {
      toast('Material Selected',{
        id: `Selected material: ${material.name}`,
        duration: 3000
      });
    }
  }, [camAssistant, toast]);
  
  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Intestazione */}
      <div className="flex items-center justify-between border-b p-3">
        <h2 className="text-lg font-semibold">CAM Assistant</h2>
        
        {/* Selettori strumento e materiale */}
        <div className="flex space-x-2">
          {/* Selettore utensile */}
          <Select value={selectedTool} onValueChange={handleToolSelection}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select Tool" />
            </SelectTrigger>
            <SelectContent>
              {camAssistant.state.tools.map(tool => (
                <SelectItem key={tool.id} value={tool.id}>
                  {tool.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Selettore materiale */}
          <Select value={selectedMaterial} onValueChange={handleMaterialSelection}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select Material" />
            </SelectTrigger>
            <SelectContent>
              {camAssistant.state.materials.map(material => (
                <SelectItem key={material.id} value={material.id}>
                  {material.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Area messaggi */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <Card key={index} className={`p-0 ${message.role === 'user' ? 'ml-12 bg-blue-50' : 'mr-12 bg-gray-50'}`}>
            <CardContent className="p-3">
              <div className="font-medium mb-1">
                {message.role === 'user' ? 'You' : 'CAM Assistant'}
              </div>
              <div className="whitespace-pre-wrap">{message.content as string}</div>
            </CardContent>
          </Card>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input area */}
      <div className="border-t p-3">
        <div className="flex space-x-2">
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Describe a machining operation or ask for G-code generation..."
            className="flex-1 min-h-[60px] max-h-[120px]"
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || !inputValue.trim()}
            className="self-end"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CAMAssistantOpenai;
