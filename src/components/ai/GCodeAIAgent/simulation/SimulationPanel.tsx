import React, { useState } from 'react';
import { 
  PlayCircle, 
  PauseCircle, 
  Box, 
  LineChart, 
  BarChart,
  RefreshCw,
  Zap, 
  Sparkles,
  Layers,
  AlertTriangle
} from 'react-feather';
import GCodeSimulator from './GCodeSimulator';
import GCode3DViewer from './3d/GCode3DViewer';

interface SimulationPanelProps {
  gcode: string;
  onOptimizedCode?: (code: string) => void;
  onFixedCode?: (code: string) => void;
}

type SimulationView = '2d' | '3d' | 'analysis' | 'optimization';

const SimulationPanel: React.FC<SimulationPanelProps> = ({
  gcode,
  onOptimizedCode,
  onFixedCode
}) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentView, setCurrentView] = useState<SimulationView>('2d');
  const [optimizationType, setOptimizationType] = useState<string | null>(null);
  
  const handleSimulationToggle = () => {
    setIsSimulating(!isSimulating);
  };
  
  const handleSimulationEnd = () => {
    setIsSimulating(false);
  };
  
  const handleOptimizationRequest = (type: string) => {
    setOptimizationType(type);
    setCurrentView('optimization');
    
    // Mock implementation for optimization
    // In a real implementation, this would call an API to optimize the GCode
    setTimeout(() => {
      const optimizedCode = `; Optimized GCode (${type})\n${gcode}`;
      if (onOptimizedCode) {
        onOptimizedCode(optimizedCode);
      }
      setCurrentView('analysis');
      setOptimizationType(null);
    }, 1500);
  };
  
  const handleFixRequest = () => {
    setOptimizationType('safety');
    setCurrentView('optimization');
    
    // Mock implementation for safety fixes
    setTimeout(() => {
      const fixedCode = `; Safety Fixes Applied\n${gcode}`;
      if (onFixedCode) {
        onFixedCode(fixedCode);
      }
      setCurrentView('analysis');
      setOptimizationType(null);
    }, 1000);
  };
  
  const handleCancelOptimization = () => {
    setCurrentView('analysis');
    setOptimizationType(null);
  };
  
  const renderOptimizationContent = () => {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4 bg-gray-900">
        <div className="text-center mb-4">
          <div className="text-lg text-gray-300 mb-2">
            {optimizationType === 'speed' && "Ottimizzazione per velocità in corso..."}
            {optimizationType === 'quality' && "Ottimizzazione per qualità in corso..."}
            {optimizationType === 'safety' && "Applicazione controlli di sicurezza..."}
          </div>
          <div className="text-sm text-gray-500">
            {optimizationType === 'speed' && "Riduzione dei tempi di lavorazione mantenendo i percorsi essenziali"}
            {optimizationType === 'quality' && "Miglioramento della finitura superficiale e precisione"}
            {optimizationType === 'safety' && "Verifica e correzione di potenziali problemi di sicurezza"}
          </div>
        </div>
        
        <div className="w-64 h-4 bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 animate-[progress_2s_ease-in-out_infinite]"></div>
        </div>
        
        <button
          className="mt-6 px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 rounded"
          onClick={handleCancelOptimization}
        >
          Annulla
        </button>
      </div>
    );
  };
  
  const renderAnalysisContent = () => {
    return (
      <div className="h-full flex flex-col p-4 bg-gray-900 overflow-y-auto">
        <h3 className="text-xl text-gray-200 mb-3">Analisi G-Code</h3>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-800 p-3 rounded">
            <h4 className="text-sm font-medium text-gray-300 mb-2">Informazioni Generali</h4>
            <div className="text-xs text-gray-400">
              <div className="flex justify-between mb-1">
                <span>Linee di codice:</span>
                <span>{gcode.split('\n').length}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>Dimensioni file:</span>
                <span>{(gcode.length / 1024).toFixed(2)} KB</span>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 p-3 rounded">
            <h4 className="text-sm font-medium text-gray-300 mb-2">Comandi</h4>
            <div className="text-xs text-gray-400">
              <div className="flex justify-between mb-1">
                <span>Movimenti rapidi (G0):</span>
                <span>{(gcode.match(/G0|G00/g) || []).length}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>Movimenti lineari (G1):</span>
                <span>{(gcode.match(/G1|G01/g) || []).length}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>Movimenti circolari (G2/G3):</span>
                <span>{(gcode.match(/G2|G02|G3|G03/g) || []).length}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 p-3 rounded mb-4">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Avvisi</h4>
          <div className="text-xs">
            {gcode.includes('G28') ? (
              <div className="text-green-400 mb-1 flex items-start">
                <AlertTriangle size={12} className="mr-1 mt-0.5" />
                <span>Home position (G28) trovata nel codice. Buona prassi!</span>
              </div>
            ) : (
              <div className="text-yellow-400 mb-1 flex items-start">
                <AlertTriangle size={12} className="mr-1 mt-0.5" />
                <span>Nessun comando G28 (home position) trovato. Considera di aggiungerlo per sicurezza.</span>
              </div>
            )}
            
            {!gcode.includes('M2') && !gcode.includes('M30') && (
              <div className="text-yellow-400 mb-1 flex items-start">
                <AlertTriangle size={12} className="mr-1 mt-0.5" />
                <span>Nessun comando di fine programma (M2/M30) trovato. Considera di aggiungerlo.</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-gray-800 p-3 rounded">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Suggerimenti per Ottimizzazione</h4>
          <div className="text-xs text-gray-400 space-y-2">
            <p>Per migliorare questo G-code, considera le seguenti ottimizzazioni:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Ottimizzazione per velocità: riduce i movimenti non necessari</li>
              <li>Ottimizzazione per qualità: migliora le transizioni e il controllo della velocità</li>
              <li>Controlli di sicurezza: aggiunge controlli per evitare collisioni</li>
            </ul>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="h-full flex flex-col bg-gray-800 text-gray-300">
      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        <button
          className={`px-3 py-2 flex items-center ${
            currentView === '2d' 
              ? 'bg-gray-700 text-gray-100 border-b-2 border-blue-500' 
              : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'
          }`}
          onClick={() => setCurrentView('2d')}
        >
          <LineChart size={16} className="mr-2" />
          2D Simulazione
        </button>
        
        <button
          className={`px-3 py-2 flex items-center ${
            currentView === '3d' 
              ? 'bg-gray-700 text-gray-100 border-b-2 border-blue-500' 
              : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'
          }`}
          onClick={() => setCurrentView('3d')}
        >
          <Box size={16} className="mr-2" />
          3D Visualizzazione
        </button>
        
        <button
          className={`px-3 py-2 flex items-center ${
            currentView === 'analysis' 
              ? 'bg-gray-700 text-gray-100 border-b-2 border-blue-500' 
              : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'
          }`}
          onClick={() => setCurrentView('analysis')}
        >
          <BarChart size={16} className="mr-2" />
          Analisi
        </button>
        
        <div className="flex-1"></div>
        
        <button
          className={`px-3 py-2 flex items-center ${
            isSimulating
              ? 'text-green-400 hover:text-green-300' 
              : 'text-gray-400 hover:text-gray-200'
          }`}
          onClick={handleSimulationToggle}
          title={isSimulating ? 'Pausa simulazione' : 'Avvia simulazione'}
        >
          {isSimulating ? (
            <>
              <PauseCircle size={16} className="mr-2" />
              Pausa
            </>
          ) : (
            <>
              <PlayCircle size={16} className="mr-2" />
              Simula
            </>
          )}
        </button>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {currentView === '2d' && (
          <GCodeSimulator 
            gcode={gcode}
            isSimulating={isSimulating}
            onSimulationEnd={handleSimulationEnd}
          />
        )}
        
        {currentView === '3d' && (
          <GCode3DViewer 
            gcode={gcode}
            isAnimating={isSimulating}
            onAnimationEnd={handleSimulationEnd}
          />
        )}
        
        {currentView === 'analysis' && renderAnalysisContent()}
        
        {currentView === 'optimization' && renderOptimizationContent()}
      </div>
      
      {/* Actions Bar */}
      <div className="p-2 border-t border-gray-700 bg-gray-900 flex justify-between">
        <div className="flex space-x-1">
          <button
            className="p-1.5 rounded-md hover:bg-gray-700 text-gray-400"
            onClick={() => {
              setIsSimulating(false);
              
              // Reset to view current GCode from beginning
              if (currentView === '2d' || currentView === '3d') {
                const currentView2 = currentView;
                setCurrentView('analysis');
                setTimeout(() => setCurrentView(currentView2), 10);
              }
            }}
            title="Reset simulazione"
          >
            <RefreshCw size={16} />
          </button>
        </div>
        
        <div className="flex space-x-2 text-xs items-center">
          {currentView === '2d' && (
            <span className="text-gray-500">
              Simulazione 2D
            </span>
          )}
          
          {currentView === '3d' && (
            <span className="text-gray-500">
              Usa il mouse per ruotare e zoomare
            </span>
          )}
          
          {currentView === 'analysis' && (
            <div className="flex space-x-2">
              <button
                className="px-2 py-1 rounded flex items-center bg-blue-900/30 hover:bg-blue-900/50 text-blue-200"
                onClick={() => handleOptimizationRequest('speed')}
              >
                <Zap size={12} className="mr-1" />
                Ottimizza Velocità
              </button>
              
              <button
                className="px-2 py-1 rounded flex items-center bg-purple-900/30 hover:bg-purple-900/50 text-purple-200"
                onClick={() => handleOptimizationRequest('quality')}
              >
                <Sparkles size={12} className="mr-1" />
                Ottimizza Qualità
              </button>
              
              <button
                className="px-2 py-1 rounded flex items-center bg-yellow-900/30 hover:bg-yellow-900/50 text-yellow-200"
                onClick={() => handleFixRequest()}
              >
                <AlertTriangle size={12} className="mr-1" />
                Sicurezza
              </button>
            </div>
          )}
        </div>
        
        <div className="flex space-x-1">
          <button
            className={`p-1.5 rounded-md hover:bg-gray-700 text-gray-400 ${currentView === '3d' ? 'text-blue-400' : ''}`}
            onClick={() => setCurrentView('3d')}
            title="Vista 3D"
          >
            <Layers size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimulationPanel;