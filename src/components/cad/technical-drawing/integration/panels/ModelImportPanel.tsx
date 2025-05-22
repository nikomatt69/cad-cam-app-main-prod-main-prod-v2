import React, { useState } from 'react';
import { Upload, File, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface ModelImportPanelProps {
  onImport: (data: any) => void;
}

/**
 * Pannello per l'importazione di modelli 3D e conversione in disegni 2D
 * Panel for importing 3D models and converting them to 2D drawings
 */
const ModelImportPanel: React.FC<ModelImportPanelProps> = ({ onImport }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importMethod, setImportMethod] = useState<'file' | 'url'>('file');
  const [modelUrl, setModelUrl] = useState('');
  const [viewOption, setViewOption] = useState<'front' | 'top' | 'side' | 'iso'>('front');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Formati supportati per l'importazione
  // Supported formats for import
  const supportedFormats = ['STEP', 'IGES', 'STL', 'OBJ', 'DXF', 'DWG'];
  
  // Gestisce il cambiamento del file selezionato
  // Handles the change of the selected file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  };
  
  // Gestisce l'invio del modulo di importazione
  // Handles the submission of the import form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (importMethod === 'file' && !selectedFile) {
      alert('Seleziona un file da importare.');
      return;
    }
    
    if (importMethod === 'url' && !modelUrl) {
      alert('Inserisci un URL valido.');
      return;
    }
    
    // Simula il caricamento del file
    // Simulates file upload
    setIsUploading(true);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          
          // Simula dati importati per la demo
          // Simulates imported data for the demo
          const importedData = {
            type: importMethod === 'file' ? 'file' : 'url',
            source: importMethod === 'file' ? selectedFile?.name : modelUrl,
            view: viewOption,
            timestamp: new Date().toISOString()
          };
          
          onImport(importedData);
          return 0;
        }
        return prev + 10;
      });
    }, 300);
  };
  
  return (
    <div className="p-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg">Importa modello 3D</h3>
      </div>
      
      <p className="text-sm text-gray-600 mb-4">
        Importa un modello 3D per convertirlo in un disegno tecnico 2D. Supportiamo vari formati come STEP, IGES, STL e altri.
      </p>
      
      <div className="mb-6">
        <div className="border-b mb-4">
          <div className="flex">
            <button
              className={`px-4 py-2 text-sm font-medium ${
                importMethod === 'file' 
                  ? 'border-b-2 border-blue-500 text-blue-600' 
                  : 'text-gray-500'
              }`}
              onClick={() => setImportMethod('file')}
            >
              Carica file
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium ${
                importMethod === 'url' 
                  ? 'border-b-2 border-blue-500 text-blue-600' 
                  : 'text-gray-500'
              }`}
              onClick={() => setImportMethod('url')}
            >
              Da URL
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          {importMethod === 'file' ? (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Seleziona file
              </label>
              
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <Upload 
                    className="mx-auto h-12 w-12 text-gray-400" 
                    strokeWidth={1} 
                  />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                    >
                      <span>Carica un file</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        onChange={handleFileChange}
                        accept=".step,.stp,.iges,.igs,.stl,.obj,.dxf,.dwg"
                      />
                    </label>
                    <p className="pl-1">o trascina e rilascia</p>
                  </div>
                  
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-1 text-sm text-green-600">
                      <CheckCircle size={16} />
                      <span>{selectedFile.name}</span>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">
                      Formati supportati: {supportedFormats.join(', ')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL del modello
              </label>
              <input
                type="url"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://esempio.com/modello.step"
                value={modelUrl}
                onChange={(e) => setModelUrl(e.target.value)}
              />
              <p className="mt-1 text-xs text-gray-500">
                Inserisci l&apos;URL di un modello 3D accessibile pubblicamente
              </p>
            </div>
          )}
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vista da generare
            </label>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                className={`p-2 border rounded-md text-sm ${
                  viewOption === 'front' 
                    ? 'bg-blue-50 border-blue-300 text-blue-700' 
                    : 'border-gray-300 text-gray-700'
                }`}
                onClick={() => setViewOption('front')}
              >
                Frontale
              </button>
              <button
                type="button"
                className={`p-2 border rounded-md text-sm ${
                  viewOption === 'top' 
                    ? 'bg-blue-50 border-blue-300 text-blue-700' 
                    : 'border-gray-300 text-gray-700'
                }`}
                onClick={() => setViewOption('top')}
              >
                Dall&apos;alto
              </button>
              <button
                type="button"
                className={`p-2 border rounded-md text-sm ${
                  viewOption === 'side' 
                    ? 'bg-blue-50 border-blue-300 text-blue-700' 
                    : 'border-gray-300 text-gray-700'
                }`}
                onClick={() => setViewOption('side')}
              >
                Laterale
              </button>
              <button
                type="button"
                className={`p-2 border rounded-md text-sm ${
                  viewOption === 'iso' 
                    ? 'bg-blue-50 border-blue-300 text-blue-700' 
                    : 'border-gray-300 text-gray-700'
                }`}
                onClick={() => setViewOption('iso')}
              >
                Isometrica
              </button>
            </div>
          </div>
          
          {isUploading ? (
            <div className="mb-4">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-2 text-center">
                Elaborazione in corso... {uploadProgress}%
              </p>
            </div>
          ) : (
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Importa modello
            </button>
          )}
        </form>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-start gap-2 bg-blue-50 text-blue-800 p-3 rounded-md text-sm">
          <Info size={16} className="mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Conversione 3D in 2D</p>
            <p className="mt-1">
              Il sistema convertirà automaticamente il modello 3D in un disegno tecnico 2D basato sulla vista selezionata.
            </p>
          </div>
        </div>
        
        <div className="flex items-start gap-2 bg-yellow-50 text-yellow-800 p-3 rounded-md text-sm">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Precisione della conversione</p>
            <p className="mt-1">
              La conversione potrebbe richiedere modifiche manuali per ottenere un disegno tecnico preciso e completo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelImportPanel;
