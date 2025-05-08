// src/components/production-costs/ToolpathCostPanel.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useProductionCostsStore } from '@/src/store/productionCostsStore';
import { formatCurrency, formatTime, formatPercentage } from '@/src/services/productionCostsService';
import { ProductionCostEstimate } from '@/src/types/costs';

interface ToolpathCostPanelProps {
  toolpathId: string;
}

const ToolpathCostPanel: React.FC<ToolpathCostPanelProps> = ({ toolpathId }) => {
  const {
    getEstimateByToolpathId,
    estimateToolpathCost,
    saveEstimate,
    settings
  } = useProductionCostsStore();
  
  const [estimate, setEstimate] = useState<ProductionCostEstimate | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  
  const generateNewEstimate = useCallback(async () => {
    if (!toolpathId) return;
    setLoading(true);
    try {
      const newEstimateResult = await estimateToolpathCost(toolpathId);
      if (newEstimateResult) {
        await saveEstimate(newEstimateResult);
        setEstimate(newEstimateResult);
      }
    } catch (error) {
      console.error('Errore nella generazione della stima dei costi:', error);
      setEstimate(null); 
    } finally {
      setLoading(false);
    }
  }, [toolpathId, estimateToolpathCost, saveEstimate]);
  
  useEffect(() => {
    const fetchOrGenerateEstimate = async () => {
      if (!toolpathId) {
        setEstimate(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const existingEstimate = await getEstimateByToolpathId(toolpathId);
        if (existingEstimate) {
          setEstimate(existingEstimate);
          setLoading(false);
        } else if (settings.calculateAutomatically) {
          // generateNewEstimate will handle its own setLoading(true/false) and setEstimate
          await generateNewEstimate();
        } else {
          setEstimate(null);
          setLoading(false);
        }
      } catch (error) {
        console.error('Errore nel recupero o generazione della stima:', error);
        setEstimate(null);
      setLoading(false);
    }
  };

    fetchOrGenerateEstimate();
  }, [toolpathId, getEstimateByToolpathId, settings.calculateAutomatically, generateNewEstimate]);
  
  // Se non ci sono dati da mostrare e non sta caricando (dopo il fetch iniziale)
  if (!loading && !estimate && toolpathId) { // ensure toolpathId is present to show generate button
    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-3">Costo di Produzione</h3>
        <p className="text-gray-500">
          Nessuna stima dei costi disponibile per questo toolpath.
        </p>
        <button
          onClick={generateNewEstimate}
          className="mt-3 bg-blue-500 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-600"
        >
          Genera Stima
        </button>
      </div>
    );
  }
  
  // Mostra il caricamento
  if (loading) {
    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-3">Costo di Produzione</h3>
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-2"></div>
          <span>Calcolo in corso...</span>
        </div>
      </div>
    );
  }
  
  // Mostra i dettagli della stima
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-medium mb-3">Costo di Produzione</h3>
      
      {estimate && (
        <div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-gray-50 p-2 rounded">
              <span className="text-sm text-gray-600">Materiale:</span>
              <p className="font-medium">
                {formatCurrency(estimate.materialCost, estimate.currencyCode)}
              </p>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <span className="text-sm text-gray-600">Utensile:</span>
              <p className="font-medium">
                {formatCurrency(estimate.toolWearCost, estimate.currencyCode)}
              </p>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <span className="text-sm text-gray-600">Tempo Macchina:</span>
              <p className="font-medium">
                {formatTime(estimate.machineTime)}
              </p>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <span className="text-sm text-gray-600">Operatore:</span>
              <p className="font-medium">
                {formatCurrency(estimate.operatorTimeCost, estimate.currencyCode)}
              </p>
            </div>
          </div>
          
          {/* Costo totale */}
          <div className="bg-blue-50 p-3 rounded-md flex justify-between items-center">
            <span className="font-medium text-blue-800">COSTO TOTALE:</span>
            <span className="text-lg font-bold">
              {formatCurrency(estimate.totalCost, estimate.currencyCode)}
            </span>
          </div>
          
          {/* Data calcolo */}
          <div className="mt-2 text-xs text-gray-500 text-right">
            Ultimo aggiornamento: {new Date(estimate.updatedAt).toLocaleString('it-IT')}
          </div>
          
          {/* Pulsante per rigenerare la stima */}
          <button
            onClick={generateNewEstimate}
            className="mt-2 text-blue-600 text-sm hover:text-blue-800"
          >
            Aggiorna Stima
          </button>
        </div>
      )}
    </div>
  );
};

export default ToolpathCostPanel;
