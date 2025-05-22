import React from 'react';
import { Save, AlertCircle, Info, Monitor, Sun, Moon } from 'lucide-react';

interface DrawingSettingsProps {
  autoSaveEnabled: boolean;
  autoSaveInterval: number;
  onChangeAutoSave: (enabled: boolean) => void;
  onChangeInterval: (interval: number) => void;
  theme: 'light' | 'dark' | 'system';
}

/**
 * Pannello di configurazione per il sistema di disegno tecnico
 * Configuration panel for the technical drawing system
 */
const DrawingSettings: React.FC<DrawingSettingsProps> = ({
  autoSaveEnabled,
  autoSaveInterval,
  onChangeAutoSave,
  onChangeInterval,
  theme
}) => {
  // Unità di misura disponibili
  // Available measurement units
  const measurementUnits = [
    { id: 'mm', name: 'Millimetri (mm)' },
    { id: 'cm', name: 'Centimetri (cm)' },
    { id: 'in', name: 'Pollici (in)' },
    { id: 'ft', name: 'Piedi (ft)' },
  ];
  
  // Standard di disegno disponibili
  // Available drawing standards
  const drawingStandards = [
    { id: 'iso', name: 'ISO' },
    { id: 'ansi', name: 'ANSI' },
    { id: 'din', name: 'DIN' },
    { id: 'jis', name: 'JIS' },
    { id: 'gb', name: 'GB' },
  ];
  
  return (
    <div className="p-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg">Impostazioni disegno</h3>
        <button className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm flex items-center gap-1 hover:bg-blue-700">
          <Save size={16} />
          <span>Salva</span>
        </button>
      </div>
      
      <div className="space-y-6">
        {/* Sezione Unità e Precisione */}
        {/* Units and Precision section */}
        <section className="border rounded-md p-4">
          <h4 className="font-medium mb-3">Unità e Precisione</h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unità di misura
              </label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                defaultValue="mm"
              >
                {measurementUnits.map(unit => (
                  <option key={unit.id} value={unit.id}>{unit.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precisione
              </label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                defaultValue="2"
              >
                <option value="0">0</option>
                <option value="1">0.0</option>
                <option value="2">0.00</option>
                <option value="3">0.000</option>
                <option value="4">0.0000</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Numero di decimali da visualizzare per le dimensioni
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Standard di disegno
              </label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                defaultValue="iso"
              >
                {drawingStandards.map(standard => (
                  <option key={standard.id} value={standard.id}>{standard.name}</option>
                ))}
              </select>
            </div>
          </div>
        </section>
        
        {/* Sezione Griglia e Snap */}
        {/* Grid and Snap section */}
        <section className="border rounded-md p-4">
          <h4 className="font-medium mb-3">Griglia e Snap</h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Spaziatura griglia
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  defaultValue="10"
                  min="1"
                />
                <span className="text-gray-500">mm</span>
              </div>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showGrid"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                defaultChecked
              />
              <label htmlFor="showGrid" className="ml-2 block text-sm text-gray-700">
                Mostra griglia
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="enableSnap"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                defaultChecked
              />
              <label htmlFor="enableSnap" className="ml-2 block text-sm text-gray-700">
                Abilita snap
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="orthoMode"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                defaultChecked
              />
              <label htmlFor="orthoMode" className="ml-2 block text-sm text-gray-700">
                Modalità ortogonale
              </label>
            </div>
          </div>
        </section>
        
        {/* Sezione Autosalvataggio */}
        {/* Autosave section */}
        <section className="border rounded-md p-4">
          <h4 className="font-medium mb-3">Autosalvataggio</h4>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="enableAutosave"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={autoSaveEnabled}
                onChange={(e) => onChangeAutoSave(e.target.checked)}
              />
              <label htmlFor="enableAutosave" className="ml-2 block text-sm text-gray-700">
                Abilita autosalvataggio
              </label>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Intervallo (minuti)
              </label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={autoSaveInterval}
                onChange={(e) => onChangeInterval(parseInt(e.target.value) || 5)}
                min="1"
                max="60"
                disabled={!autoSaveEnabled}
              />
            </div>
            
            <div className="flex items-start gap-2 bg-blue-50 text-blue-800 p-3 rounded-md text-sm">
              <Info size={16} className="mt-0.5 flex-shrink-0" />
              <p>
                L&apos;autosalvataggio salverà automaticamente il tuo lavoro all&apos;intervallo specificato quando vengono rilevate modifiche.
              </p>
            </div>
          </div>
        </section>
        
        {/* Sezione Tema */}
        {/* Theme section */}
        <section className="border rounded-md p-4">
          <h4 className="font-medium mb-3">Tema</h4>
          
          <div className="grid grid-cols-3 gap-2">
            <div
              className={`border rounded-md p-3 flex flex-col items-center cursor-pointer ${
                theme === 'light' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <Sun size={24} className="mb-2" />
              <span className="text-sm">Chiaro</span>
            </div>
            
            <div
              className={`border rounded-md p-3 flex flex-col items-center cursor-pointer ${
                theme === 'dark' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <Moon size={24} className="mb-2" />
              <span className="text-sm">Scuro</span>
            </div>
            
            <div
              className={`border rounded-md p-3 flex flex-col items-center cursor-pointer ${
                theme === 'system' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <Monitor size={24} className="mb-2" />
              <span className="text-sm">Sistema</span>
            </div>
          </div>
        </section>
        
        <div className="flex items-start gap-2 bg-yellow-50 text-yellow-800 p-3 rounded-md text-sm">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <p>
            Alcune impostazioni richiedono il ricaricamento dell&apos;editor per essere applicate completamente.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DrawingSettings;
