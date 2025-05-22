import React, { useState } from 'react';
import { Download, FileDown, FileText, Loader2, CheckCircle, Settings, AlertCircle } from 'lucide-react';

interface FileExportPanelProps {
  isExporting: boolean;
  onExport: (format: 'dxf' | 'svg' | 'pdf' | 'png') => void;
}

/**
 * Pannello per l'esportazione di disegni tecnici in vari formati
 * Panel for exporting technical drawings in various formats
 */
const FileExportPanel: React.FC<FileExportPanelProps> = ({ 
  isExporting,
  onExport
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'dxf' | 'svg' | 'pdf' | 'png'>('dxf');
  const [exportQuality, setExportQuality] = useState<'low' | 'medium' | 'high'>('medium');
  const [includeGrid, setIncludeGrid] = useState(false);
  const [exportScale, setExportScale] = useState('1:1');
  const [paperSize, setPaperSize] = useState('A4');
  
  // Formati disponibili per l'esportazione
  // Available formats for export
  const exportFormats = [
    { 
      id: 'dxf' as const, 
      name: 'DXF', 
      description: 'Drawing Exchange Format - Compatibile con la maggior parte dei software CAD',
      icon: FileText
    },
    { 
      id: 'svg' as const, 
      name: 'SVG', 
      description: 'Scalable Vector Graphics - Ideale per web e grafica vettoriale',
      icon: FileText
    },
    { 
      id: 'pdf' as const, 
      name: 'PDF', 
      description: 'Portable Document Format - Per documentazione e stampa',
      icon: FileDown
    },
    { 
      id: 'png' as const, 
      name: 'PNG', 
      description: 'Immagine raster - Per screenshot e presentazioni',
      icon: FileDown
    }
  ];
  
  // Dimensioni della carta disponibili
  // Available paper sizes
  const paperSizes = ['A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'Letter', 'Legal', 'Tabloid'];
  
  // Scale di esportazione disponibili
  // Available export scales
  const exportScales = ['1:1', '1:2', '1:5', '1:10', '1:20', '1:50', '1:100'];
  
  // Gestisce l'esportazione con il formato selezionato
  // Handles export with the selected format
  const handleExport = () => {
    onExport(selectedFormat);
  };
  
  return (
    <div className="p-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg">Esporta disegno</h3>
      </div>
      
      <p className="text-sm text-gray-600 mb-4">
        Esporta il tuo disegno tecnico in vari formati per condivisione, documentazione o ulteriori modifiche in altri software.
      </p>
      
      <div className="space-y-6">
        {/* Selezione formato */}
        {/* Format selection */}
        <section>
          <h4 className="font-medium mb-3 text-sm">Seleziona formato</h4>
          
          <div className="grid grid-cols-1 gap-2">
            {exportFormats.map(format => (
              <label
                key={format.id}
                className={`flex items-start p-3 border rounded-md cursor-pointer ${
                  selectedFormat === format.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
                htmlFor={`format-${format.id}`}
              >
                <input
                  type="radio"
                  id={`format-${format.id}`}
                  name="exportFormat"
                  className="h-4 w-4 text-blue-600 mt-1"
                  checked={selectedFormat === format.id}
                  onChange={() => setSelectedFormat(format.id)}
                />
                <div className="ml-3 flex items-start gap-3 flex-1">
                  <format.icon size={24} className={selectedFormat === format.id ? 'text-blue-500' : 'text-gray-400'} />
                  <div>
                    <div className="font-medium">{format.name}</div>
                    <div className="text-xs text-gray-500">{format.description}</div>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </section>
        
        {/* Opzioni di esportazione */}
        {/* Export options */}
        <section className="border rounded-md p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-sm">Opzioni di esportazione</h4>
            <button className="p-1 text-gray-500 hover:text-gray-700 rounded-md">
              <Settings size={16} />
            </button>
          </div>
          
          <div className="space-y-4">
            {(selectedFormat === 'pdf' || selectedFormat === 'png') && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Formato carta
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={paperSize}
                    onChange={(e) => setPaperSize(e.target.value)}
                  >
                    {paperSizes.map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="landscape"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    defaultChecked
                  />
                  <label htmlFor="landscape" className="ml-2 block text-sm text-gray-700">
                    Orientamento orizzontale
                  </label>
                </div>
              </>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Scala
              </label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={exportScale}
                onChange={(e) => setExportScale(e.target.value)}
              >
                {exportScales.map(scale => (
                  <option key={scale} value={scale}>{scale}</option>
                ))}
              </select>
            </div>
            
            {selectedFormat === 'png' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Qualità
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={`flex-1 p-2 border rounded-md text-sm ${
                      exportQuality === 'low' 
                        ? 'bg-blue-50 border-blue-300 text-blue-700' 
                        : 'border-gray-300 text-gray-700'
                    }`}
                    onClick={() => setExportQuality('low')}
                  >
                    Bassa
                  </button>
                  <button
                    type="button"
                    className={`flex-1 p-2 border rounded-md text-sm ${
                      exportQuality === 'medium' 
                        ? 'bg-blue-50 border-blue-300 text-blue-700' 
                        : 'border-gray-300 text-gray-700'
                    }`}
                    onClick={() => setExportQuality('medium')}
                  >
                    Media
                  </button>
                  <button
                    type="button"
                    className={`flex-1 p-2 border rounded-md text-sm ${
                      exportQuality === 'high' 
                        ? 'bg-blue-50 border-blue-300 text-blue-700' 
                        : 'border-gray-300 text-gray-700'
                    }`}
                    onClick={() => setExportQuality('high')}
                  >
                    Alta
                  </button>
                </div>
              </div>
            )}
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="includeGrid"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={includeGrid}
                onChange={(e) => setIncludeGrid(e.target.checked)}
              />
              <label htmlFor="includeGrid" className="ml-2 block text-sm text-gray-700">
                Includi griglia
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="fitToPage"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                defaultChecked
              />
              <label htmlFor="fitToPage" className="ml-2 block text-sm text-gray-700">
                Adatta alla pagina
              </label>
            </div>
          </div>
        </section>
        
        {/* Pulsante di esportazione */}
        {/* Export button */}
        <button
          className={`w-full py-2 px-4 rounded-md flex items-center justify-center gap-2 ${
            isExporting 
              ? 'bg-gray-300 cursor-not-allowed' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
          onClick={handleExport}
          disabled={isExporting}
        >
          {isExporting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Esportazione in corso...</span>
            </>
          ) : (
            <>
              <Download size={18} />
              <span>Esporta come {selectedFormat.toUpperCase()}</span>
            </>
          )}
        </button>
        
        {/* Informazioni aggiuntive */}
        {/* Additional information */}
        <div className="flex items-start gap-2 bg-yellow-50 text-yellow-800 p-3 rounded-md text-sm">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Compatibilità del formato</p>
            <p className="mt-1">
              {selectedFormat === 'dxf' && 'Il formato DXF è compatibile con AutoCAD e la maggior parte dei software CAD. Alcune funzionalità complesse potrebbero non essere supportate in tutti i programmi.'}
              {selectedFormat === 'svg' && 'Il formato SVG è ideale per web e illustrazioni. Supporta tutti gli elementi grafici ma potrebbe non mantenere le quote e altre informazioni tecniche.'}
              {selectedFormat === 'pdf' && 'Il PDF è perfetto per la documentazione e la stampa. Tutte le geometrie e i testi saranno preservati esattamente come visualizzati.'}
              {selectedFormat === 'png' && 'Il formato PNG è un\'immagine raster e non mantiene le informazioni vettoriali. La risoluzione dipenderà dalla qualità selezionata.'}
            </p>
          </div>
        </div>
        
        {/* Esportazioni recenti */}
        {/* Recent exports */}
        <section>
          <h4 className="font-medium mb-3 text-sm">Esportazioni recenti</h4>
          
          <div className="border rounded-md divide-y">
            <div className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileDown size={16} className="text-gray-400" />
                <div>
                  <div className="text-sm font-medium">disegno_tecnico.pdf</div>
                  <div className="text-xs text-gray-500">Esportato 2 ore fa</div>
                </div>
              </div>
              <CheckCircle size={16} className="text-green-500" />
            </div>
            
            <div className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-gray-400" />
                <div>
                  <div className="text-sm font-medium">progetto_meccanico.dxf</div>
                  <div className="text-xs text-gray-500">Esportato ieri</div>
                </div>
              </div>
              <CheckCircle size={16} className="text-green-500" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default FileExportPanel;
