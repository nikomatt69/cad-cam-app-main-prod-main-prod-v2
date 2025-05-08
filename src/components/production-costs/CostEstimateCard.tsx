// src/components/production-costs/CostEstimateCard.tsx
import React, { useState } from 'react';
import { ProductionCostEstimate } from '@/src/types/costs';
import ProductionCostsAPI, { 
  formatCurrency, 
  formatTime, 
  formatPercentage,
  formatVolume,
  formatDimension,
} from '@/src/services/productionCostsService'; // Import ProductionCostsAPI and formatters
import { useLocalToolsLibraryStore } from '@/src/store/localToolsLibraryStore';
import { useLocalMaterialsLibraryStore } from '@/src/store/localMaterialsLibraryStore';

interface CostEstimateCardProps {
  estimate: ProductionCostEstimate;
  toolpathName: string;
  onDelete: (id: string) => void;
}

const CostEstimateCard: React.FC<CostEstimateCardProps> = ({ 
  estimate, 
  toolpathName,
  onDelete
}) => {
  const [expanded, setExpanded] = useState(false);
  
  const { tools } = useLocalToolsLibraryStore();
  const { materials } = useLocalMaterialsLibraryStore();
  
  // Ottieni il nome dell'utensile
  const getToolName = (toolId: string | undefined) => {
    if (!toolId) return 'N/A';
    const tool = tools.find(t => t.id === toolId);
    return tool ? tool.name : 'Utensile sconosciuto';
  };
  
  // Ottieni il nome del materiale
  const getMaterialName = (materialId: string | undefined) => {
    if (!materialId) return 'N/A';
    const material = materials.find(m => m.id === materialId);
    return material ? material.name : 'Materiale sconosciuto';
  };
  
  // Formatta la data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Copia report negli appunti
  const copyReport = () => {
    const report = ProductionCostsAPI.Utils.generateCostReport(estimate, true);
    navigator.clipboard.writeText(report)
      .then(() => alert('Report copiato negli appunti!'))
      .catch(() => alert('Impossibile copiare il report.'));
  };
  
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div 
        className="bg-gray-50 p-4 flex justify-between items-center cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div>
          <h3 className="font-medium">{toolpathName}</h3>
          <p className="text-sm text-gray-600">
            Creato il {formatDate(estimate.createdAt)}
          </p>
        </div>
        <div className="flex flex-col items-end">
          <span className="font-bold text-lg">
            {formatCurrency(estimate.totalCost, estimate.currencyCode)}
          </span>
          <button className="text-blue-600 text-sm">
            {expanded ? 'Nascondi dettagli' : 'Mostra dettagli'}
          </button>
        </div>
      </div>
      
      {expanded && (
        <div className="p-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <h4 className="font-medium mb-2">Dettagli Costi</h4>
              <ul className="space-y-1 text-sm">
                <li className="flex justify-between">
                  <span>Costo Materiale:</span>
                  <span>{formatCurrency(estimate.materialCost, estimate.currencyCode)}</span>
                </li>
                <li className="flex justify-between">
                  <span>Costo Usura Utensile:</span>
                  <span>{formatCurrency(estimate.toolWearCost, estimate.currencyCode)}</span>
                </li>
                <li className="flex justify-between">
                  <span>Tempo Macchina:</span>
                  <span>{formatTime(estimate.machineTime)}</span>
                </li>
                <li className="flex justify-between">
                  <span>Costo Tempo Macchina:</span>
                  <span>{formatCurrency(estimate.machineTimeCost, estimate.currencyCode)}</span>
                </li>
                <li className="flex justify-between">
                  <span>Costo Operatore:</span>
                  <span>{formatCurrency(estimate.operatorTimeCost, estimate.currencyCode)}</span>
                </li>
                <li className="flex justify-between">
                  <span>Costo Setup:</span>
                  <span>{formatCurrency(estimate.setupCost, estimate.currencyCode)}</span>
                </li>
                <li className="flex justify-between font-bold border-t border-gray-200 pt-1 mt-1">
                  <span>TOTALE:</span>
                  <span>{formatCurrency(estimate.totalCost, estimate.currencyCode)}</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Dettagli Lavorazione</h4>
              <ul className="space-y-1 text-sm">
                {estimate.details.materialId && (
                  <li className="flex justify-between">
                    <span>Materiale:</span>
                    <span>{getMaterialName(estimate.details.materialId)}</span>
                  </li>
                )}
                {estimate.details.toolId && (
                  <li className="flex justify-between">
                    <span>Utensile:</span>
                    <span>{getToolName(estimate.details.toolId)}</span>
                  </li>
                )}
                {estimate.details.materialVolume && (
                  <li className="flex justify-between">
                    <span>Volume Materiale:</span>
                    <span>{formatVolume(estimate.details.materialVolume)}</span>
                  </li>
                )}
                {estimate.details.toolPathLength && (
                  <li className="flex justify-between">
                    <span>Lunghezza Percorso:</span>
                    <span>{formatDimension(estimate.details.toolPathLength)}</span>
                  </li>
                )}
                {estimate.details.toolWearPercentage !== undefined && (
                  <li className="flex justify-between">
                    <span>Usura Utensile:</span>
                    <span>{formatPercentage(estimate.details.toolWearPercentage)}</span>
                  </li>
                )}
                {estimate.details.feedRate && (
                  <li className="flex justify-between">
                    <span>Velocità Avanzamento:</span>
                    <span>{estimate.details.feedRate} mm/min</span>
                  </li>
                )}
              </ul>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 mt-4">
            <button
              className="text-red-600 hover:text-red-800"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Sei sicuro di voler eliminare questa stima?')) {
                  onDelete(estimate.id);
                }
              }}
            >
              Elimina
            </button>
            <button 
              className="text-blue-600 hover:text-blue-800"
              onClick={(e) => {
                e.stopPropagation();
                copyReport();
              }}
            >
              Copia Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CostEstimateCard;
