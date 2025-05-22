import React from 'react';
import { RotateCcw, Clock, AlertCircle } from 'lucide-react';

export interface DrawingHistoryPanelProps {
  currentCommandIndex: number;
  onRevert: (index: number) => void;
}

/**
 * Pannello per visualizzare e gestire la cronologia del disegno
 * Panel to view and manage drawing history
 */
const DrawingHistoryPanel: React.FC<DrawingHistoryPanelProps> = ({ 
  currentCommandIndex,
  onRevert
}) => {
  // In un'implementazione reale, otterremmo la cronologia completa dallo store
  // In a real implementation, we would get the complete history from the store
  const mockHistory = [
    { id: 1, action: 'Creazione entità', timestamp: new Date(Date.now() - 3600000 * 5) },
    { id: 2, action: 'Modifica proprietà', timestamp: new Date(Date.now() - 3600000 * 4) },
    { id: 3, action: 'Aggiunta dimensione', timestamp: new Date(Date.now() - 3600000 * 3) },
    { id: 4, action: 'Creazione layer', timestamp: new Date(Date.now() - 3600000 * 2) },
    { id: 5, action: 'Modifica annotazione', timestamp: new Date(Date.now() - 3600000) },
    { id: 6, action: 'Ultimo stato', timestamp: new Date() },
  ];

  return (
    <div className="p-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg">Cronologia del disegno</h3>
        <span className="text-xs text-gray-500">Stato corrente: {currentCommandIndex + 1}</span>
      </div>
      
      <p className="text-sm text-gray-600 mb-4">
        Seleziona uno stato precedente per ripristinare il disegno a quel punto nella cronologia.
      </p>
      
      <div className="border rounded-md divide-y">
        {mockHistory.map((item, index) => (
          <div 
            key={item.id}
            className={`p-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer ${
              index === currentCommandIndex ? 'bg-blue-50' : ''
            }`}
            onClick={() => onRevert(index)}
          >
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-gray-400" />
              <div>
                <div className="font-medium">{item.action}</div>
                <div className="text-xs text-gray-500">
                  {item.timestamp.toLocaleString()}
                </div>
              </div>
            </div>
            
            {index !== currentCommandIndex && (
              <button
                className="p-1.5 rounded-full text-blue-500 hover:bg-blue-50"
                onClick={(e) => {
                  e.stopPropagation();
                  onRevert(index);
                }}
              >
                <RotateCcw size={16} />
              </button>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-start gap-2 text-sm text-yellow-800">
        <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
        <p>
          Ripristinare a uno stato precedente annullerà tutte le modifiche effettuate dopo quel punto. Questa azione non può essere annullata.
        </p>
      </div>
    </div>
  );
};

export default DrawingHistoryPanel;
