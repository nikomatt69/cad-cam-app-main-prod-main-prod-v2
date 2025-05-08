// src/components/production-costs/ToolWearCostForm.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useProductionCostsStore } from '@/src/store/productionCostsStore';
import { ToolWearCost } from '@/src/types/costs';
import { Tool } from '@/src/types/mainTypes';
import { fetchTools } from '@/src/lib/api/tools';

// Placeholder Tool interface removed
// Placeholder ToolService removed

interface ToolWearCostFormProps {
  costToEditId?: string | null;
  onSubmissionDone?: () => void;
}

function ToolWearCostForm({ 
  costToEditId, 
  onSubmissionDone 
}: ToolWearCostFormProps): JSX.Element {
  const { 
    addToolWearCost, 
    updateToolWearCost, 
    toolWearCosts, 
    settings,
    isLoading: isSubmittingCost 
  } = useProductionCostsStore();
  
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const [formData, setFormData] = useState<{
    toolId: string;
    wearRatePerMeter: number;
    replacementCost: number;
    replacementThreshold: number;
    currencyCode: string;
  }>(() => ({
    toolId: '',
    wearRatePerMeter: 0.5,
    replacementCost: 0,
    replacementThreshold: 100,
    currencyCode: settings.defaultCurrencyCode || 'EUR',
  }));
  
  const [allTools, setAllTools] = useState<Tool[]>([]); // Uses imported Tool type
  const [availableToolsForNewCost, setAvailableToolsForNewCost] = useState<Tool[]>([]);
  const [isLoadingTools, setIsLoadingTools] = useState<boolean>(false);
  const [toolError, setToolError] = useState<string | null>(null);
  
  const resetForm = useCallback(() => {
    setFormData({
      toolId: '',
      wearRatePerMeter: 0.5,
      replacementCost: 0,
      replacementThreshold: 100,
      currencyCode: settings.defaultCurrencyCode || 'EUR',
    });
    setIsEditing(false);
    if (onSubmissionDone) {
      onSubmissionDone();
    }
  }, [settings.defaultCurrencyCode, onSubmissionDone]);

  useEffect(() => {
    const loadToolsAndFilter = async () => { // Renamed from fetchToolsAndFilter
      setIsLoadingTools(true);
      setToolError(null);
      try {
        const fetchedTools = await fetchTools(); // Use imported fetchTools
        setAllTools(fetchedTools);
        
        const toolsWithoutCosts = fetchedTools.filter(tool => 
          !toolWearCosts.some(cost => cost.toolId === tool.id)
        );
        setAvailableToolsForNewCost(toolsWithoutCosts);
      } catch (error) {
        console.error("Failed to fetch tools:", error);
        setToolError("Impossibile caricare gli utensili.");
        if (error instanceof Error) {
            setToolError(`Errore caricamento utensili: ${error.message}`);
        } else {
            setToolError("Errore sconosciuto caricamento utensili.");
        }
      } finally {
        setIsLoadingTools(false);
      }
    };
    
    loadToolsAndFilter();
  }, [toolWearCosts]);
  
  useEffect(() => {
    if (costToEditId) {
      const costToEdit = toolWearCosts.find(cost => cost.id === costToEditId);
      if (costToEdit) {
        setFormData({
          toolId: costToEdit.toolId,
          wearRatePerMeter: costToEdit.wearRatePerMeter,
          replacementCost: costToEdit.replacementCost,
          replacementThreshold: costToEdit.replacementThreshold,
          currencyCode: costToEdit.currencyCode,
        });
        setIsEditing(true);
      } else {
        resetForm();
      }
    } else {
      if (isEditing) {
         resetForm();
      }
      setIsEditing(false);
    }
  }, [costToEditId, toolWearCosts, resetForm, isEditing]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'wearRatePerMeter' || name === 'replacementCost' || name === 'replacementThreshold') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingCost) return;

    let success = false;
    if (isEditing && costToEditId) {
      success = await updateToolWearCost(costToEditId, formData);
    } else {
      const newCostId = await addToolWearCost(formData);
      success = !!newCostId;
    }
    
    if (success) {
      resetForm();
    }
  };
    
  return (
    <div className="bg-gray-50 p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4 text-gray-700">
        {isEditing ? 'Modifica Costo Usura Utensile' : 'Aggiungi Nuovo Costo Usura Utensile'}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="toolId" className="block text-sm font-medium text-gray-700 mb-1">
            Utensile
          </label>
          <select
            id="toolId"
            name="toolId"
            value={formData.toolId}
            onChange={handleChange}
            className="w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
            disabled={isEditing || isLoadingTools || !!toolError}
          >
            {isLoadingTools ? (
              <option value="">Caricamento utensili...</option>
            ) : toolError ? (
              <option value="">{toolError}</option>
            ) : (
              <>
                <option value="">Seleziona un utensile</option>
                {isEditing && formData.toolId ? ( // Ensure formData.toolId is present
                  allTools
                    .filter(tool => tool.id === formData.toolId) // Show only the current tool when editing
                    .map(tool => (
                      <option key={tool.id} value={tool.id}>
                        {tool.name} ({tool.diameter}mm {tool.type})
                      </option>
                    ))
                ) : (
                  availableToolsForNewCost.map(tool => (
                    <option key={tool.id} value={tool.id}>
                      {tool.name} ({tool.diameter}mm {tool.type})
                    </option>
                  ))
                )}
                {isEditing && formData.toolId && !allTools.find(tool => tool.id === formData.toolId) && (
                   <option value={formData.toolId} disabled>{`Utensile (ID: ${formData.toolId}) - Caricato`}</option>
                )}
              </>
            )}
          </select>
        </div>
        
        <div>
          <label htmlFor="wearRatePerMeter" className="block text-sm font-medium text-gray-700 mb-1">
            Tasso di Usura per Metro (%)
          </label>
          <input
            id="wearRatePerMeter"
            type="number"
            name="wearRatePerMeter"
            value={formData.wearRatePerMeter}
            onChange={handleChange}
            min="0"
            step="0.01"
            className="w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Percentuale di usura dell&apos;utensile per ogni metro di percorso. Es. 0.5 per 0.5%.
          </p>
        </div>
        
        <div>
          <label htmlFor="replacementCost" className="block text-sm font-medium text-gray-700 mb-1">
            Costo di Sostituzione ({formData.currencyCode})
          </label>
          <input
            id="replacementCost"
            type="number"
            name="replacementCost"
            value={formData.replacementCost}
            onChange={handleChange}
            min="0"
            step="0.01"
            className="w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
        </div>

        <div>
          <label htmlFor="replacementThreshold" className="block text-sm font-medium text-gray-700 mb-1">
            Soglia di Sostituzione (%)
          </label>
          <input
            id="replacementThreshold"
            type="number"
            name="replacementThreshold"
            value={formData.replacementThreshold}
            onChange={handleChange}
            min="0"
            max="100"
            step="1"
            className="w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
           <p className="text-xs text-gray-500 mt-1">
            Percentuale di usura massima prima che l&apos;utensile venga considerato da sostituire.
          </p>
        </div>

        <div>
          <label htmlFor="currencyCode" className="block text-sm font-medium text-gray-700 mb-1">
            Valuta
          </label>
          <select
            id="currencyCode"
            name="currencyCode"
            value={formData.currencyCode}
            onChange={handleChange}
            className="w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          >
            <option value="EUR">EUR (€)</option>
            <option value="USD">USD ($)</option>
            <option value="GBP">GBP (£)</option>
          </select>
        </div>
        
        <div className="flex items-center justify-end space-x-3 pt-2">
          {(isEditing || formData.toolId) && (
            <button
              type="button"
              onClick={() => {
                resetForm();
                if (onSubmissionDone && isEditing) {
                    onSubmissionDone();
                }
              }}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Annulla{isEditing ? '' : '/Pulisci'}
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmittingCost || isLoadingTools || !formData.toolId}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-300"
          >
            {isSubmittingCost ? 'Salvataggio...' : (isEditing ? 'Salva Modifiche' : 'Aggiungi Costo')}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ToolWearCostForm;
