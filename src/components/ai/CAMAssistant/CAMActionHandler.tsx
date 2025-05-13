// src/components/ai/CAMAssistant/CAMActionHandler.tsx
import React, { useCallback } from 'react';
import { 
  Toolpath, 
  Tool, 
  Material, 
  MachiningOperation,
  CAMAction
} from '../../../types/CAMTypes';
import { useCAMAssistant } from './CAMAssistantBridge';
import { camActionHandler } from '../../../lib/ai/camActionHandler';
import { useToast } from '@/src/contexts/ToastContext';
import toast from 'react-hot-toast';



/**
 * Proprietà del componente CAMActionHandler
 */
interface CAMActionHandlerProps {
  onActionComplete?: (result: any, action: CAMAction) => void;
  children: React.ReactNode;
}

/**
 * Componente che gestisce l'esecuzione delle azioni CAM
 */
export const CAMActionHandler: React.FC<CAMActionHandlerProps> = ({ 
  onActionComplete,
  children 
}) => {
  // Context e hooks
  const camAssistant = useCAMAssistant();


  /**
   * Esegue un'azione CAM
   */
  const handleAction = useCallback(async (action: CAMAction) => {
    try {
      // Mostra un toast di inizio
      toast(`Processing ${action.type} action...`, {
        duration: 3000
      });
      
      // Utilizza il camActionHandler per eseguire l'azione
      const result = await camActionHandler.handleAction(action);
      
      // Notifica il completamento
      if (onActionComplete) {
        onActionComplete(result, action);
      }
      
      // Gestisci il risultato in base al tipo di azione
      switch (action.type) {
        case 'ANALYZE_TOOLPATH':
          if (result) {
            toast.success('Toolpath Analysis Complete', {
              id: `Analysis completed with ${result.issues.length} issues found.`,
              duration: 5000
            });
          }
          break;
          
        case 'OPTIMIZE_TOOLPATH':
          if (result) {
            // Aggiungi il percorso ottimizzato alla collezione
            camAssistant.addToolpath(result);
            
            toast.success('Toolpath Optimization Complete', {
              
              duration: 5000
            });
          }
          break;
          
        case 'ANALYZE_TOOL':
          if (result) {
            toast.success('Tool Analysis Complete', {
              
              duration: 5000
            });
          }
          break;
          
        case 'OPTIMIZE_TOOL':
          if (result && result.recommendedToolId) {
            const recommendedTool = camAssistant.state.tools.find(t => t.id === result.recommendedToolId);
            
            toast.success('Tool Optimization Complete', {
              id: recommendedTool 
                ? `Recommended tool: ${recommendedTool.name}` 
                : 'Tool optimization has been completed.',
              duration: 5000
            });
          }
          break;
          
        case 'ANALYZE_MATERIAL':
          if (result) {
            toast.success('Material Analysis Complete', {
              id: 'Material analysis has been completed successfully.',
              duration: 5000
            });
          }
          break;
          
        case 'CALCULATE_COST':
          if (result) {
            toast.success('Cost Calculation Complete', {
              id: `Estimated total cost: ${result.totalCost.toFixed(2)}`,
              duration: 5000
            });
          }
          break;
          
        case 'ANALYZE_GCODE':
          if (result) {
            toast.success('G-code Analysis Complete', {
              id: `Analysis completed with ${result.errors.length} errors and ${result.warnings.length} warnings.`,
              duration: 5000
            });
          }
          break;
          
        case 'OPTIMIZE_GCODE':
          if (result) {
            toast.success('G-code Optimization Complete', {
              id: 'G-code has been optimized successfully.',
              duration: 5000
            });
          }
          break;
          
        case 'SIMULATE_MACHINING':
          if (result) {
            toast.success('Machining Simulation Complete', {
              id: `Estimated machining time: ${(result.simulationResults.totalTime / 60).toFixed(2)} minutes`,
              duration: 5000
            });
          }
          break;
          
        case 'GENERATE_REPORT':
          if (result) {
            toast.success('Report Generation Complete', {
              id: 'CAM report has been generated successfully.',
              duration: 5000
            });
          }
          break;
          
        default:
          toast.success('Action Complete', {
            id: 'The CAM action has been completed successfully.',
            duration: 3000
          });
      }
      
      return result;
    } catch (error) {
      // Gestisci errori
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      toast.error('Error', {
        id: `Error processing action: ${errorMessage}`,
        duration: 5000
      });
      
      console.error('Error processing CAM action:', error);
      return null;
    }
  }, [camAssistant, onActionComplete, toast]);

  /**
   * Azioni di analisi percorso utensile
   */
  const analyzeToolpath = useCallback((toolpath: Toolpath, tool?: Tool, material?: Material) => {
    return handleAction({
      type: 'ANALYZE_TOOLPATH',
      payload: toolpath
    });
  }, [handleAction]);

  /**
   * Azioni di ottimizzazione percorso utensile
   */
  const optimizeToolpath = useCallback((
    toolpath: Toolpath, 
    goals: ('time' | 'quality' | 'tool_life' | 'cost')[]
  ) => {
    return handleAction({
      type: 'OPTIMIZE_TOOLPATH',
      payload: { toolpath, goals }
    });
  }, [handleAction]);

  /**
   * Azioni di analisi utensile
   */
  const analyzeTool = useCallback((
    tool: Tool, 
    material?: Material, 
    operation?: MachiningOperation
  ) => {
    return handleAction({
      type: 'ANALYZE_TOOL',
      payload: { tool, material, operation }
    });
  }, [handleAction]);

  /**
   * Azioni di ottimizzazione utensile
   */
  const optimizeTool = useCallback((
    toolpath: Toolpath, 
    currentTool: Tool, 
    availableTools?: Tool[]
  ) => {
    return handleAction({
      type: 'OPTIMIZE_TOOL',
      payload: { toolpath, currentTool, availableTools }
    });
  }, [handleAction]);

  /**
   * Azioni di analisi materiale
   */
  const analyzeMaterial = useCallback((
    material: Material, 
    tools?: Tool[], 
    operation?: MachiningOperation
  ) => {
    return handleAction({
      type: 'ANALYZE_MATERIAL',
      payload: { material, tools, operation }
    });
  }, [handleAction]);

  /**
   * Azioni di calcolo costi
   */
  const calculateCost = useCallback((
    toolpath: Toolpath, 
    tool: Tool, 
    material?: Material, 
    rates?: { machine: number; labor: number }
  ) => {
    return handleAction({
      type: 'CALCULATE_COST',
      payload: { toolpath, tool, material, rates }
    });
  }, [handleAction]);

  /**
   * Azioni di analisi G-code
   */
  const analyzeGCode = useCallback((
    gcode: string, 
    tool?: Tool, 
    material?: Material
  ) => {
    return handleAction({
      type: 'ANALYZE_GCODE',
      payload: { gcode, tool, material }
    });
  }, [handleAction]);

  /**
   * Azioni di ottimizzazione G-code
   */
  const optimizeGCode = useCallback((
    gcode: string, 
    goals: ('time' | 'quality' | 'tool_life' | 'cost')[], 
    tool?: Tool, 
    material?: Material
  ) => {
    return handleAction({
      type: 'OPTIMIZE_GCODE',
      payload: { gcode, tool, material, goals }
    });
  }, [handleAction]);

  /**
   * Azioni di simulazione lavorazione
   */
  const simulateMachining = useCallback((
    toolpath: Toolpath, 
    tool: Tool, 
    material?: Material
  ) => {
    return handleAction({
      type: 'SIMULATE_MACHINING',
      payload: { toolpath, tool, material }
    });
  }, [handleAction]);

  /**
   * Azioni di generazione report
   */
  const generateReport = useCallback((
    analyses: any[]
  ) => {
    return handleAction({
      type: 'GENERATE_REPORT',
      payload: { analyses }
    });
  }, [handleAction]);

  // Esponi le azioni tramite il contesto React o come props direttamente
  const actionHandlers = {
    handleAction,
    analyzeToolpath,
    optimizeToolpath,
    analyzeTool,
    optimizeTool,
    analyzeMaterial,
    calculateCost,
    analyzeGCode,
    optimizeGCode,
    simulateMachining,
    generateReport
  };

  // Clona i figli con le proprietà delle azioni
  return (
    <>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(
            child as React.ReactElement<{ camActions: typeof actionHandlers }>, 
            { 
              camActions: actionHandlers
            }
          );
        }
        return child;
      })}
    </>
  );
};

export default CAMActionHandler;
