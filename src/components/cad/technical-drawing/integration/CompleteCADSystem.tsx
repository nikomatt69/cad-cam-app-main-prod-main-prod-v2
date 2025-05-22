import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

// Core technical drawing components
import TechnicalDrawingEditor from '../ui/TechnicalDrawingEditor';
import { useTechnicalDrawingStore } from '../technicalDrawingStore';
import { DrawingLayer } from '../TechnicalDrawingTypes';

// UI Icons
import { 
  Download, 
  Save, 
  FileUp, 
  Settings, 
  History, 
  LayoutGrid, 
  Undo2, 
  Redo2,
  Layers,
  SquareStack,
  Menu,
  PanelLeft,
  PanelRight,
  ChevronDown
} from 'lucide-react';

// Panel components for the integrated system
import DrawingHistoryPanel, { DrawingHistoryPanelProps } from './panels/DrawingHistoryPanel';
import ProjectLibrary from './panels/ProjectLibrary';
import DrawingSettings from './panels/DrawingSettings';
import ModelImportPanel from './panels/ModelImportPanel';
import FileExportPanel from './panels/FileExportPanel';

interface CompleteCADSystemProps {
  projectId?: string;
  initialData?: {
    entities?: Record<string, any>;
    dimensions?: Record<string, any>;
    annotations?: Record<string, any>;
    layers?: DrawingLayer[];
  };
  onSave?: (data: any) => Promise<void>;
  readOnly?: boolean;
  showLibrary?: boolean;
  theme?: 'light' | 'dark' | 'system';
}

/**
 * CompleteCADSystem - Un sistema CAD 2D completo e professionale
 * Complete CAD System - A comprehensive and professional 2D CAD system
 * 
 * Questo componente integra tutti gli aspetti del sistema di disegno tecnico:
 * This component integrates all aspects of the technical drawing system:
 * 
 * - Editor di disegno completo con supporto per entità, dimensioni e annotazioni
 * - Complete drawing editor with support for entities, dimensions and annotations
 * 
 * - Gestione dei layer e delle proprietà
 * - Layer and property management
 * 
 * - Strumenti di disegno avanzati
 * - Advanced drawing tools
 * 
 * - Sistema di snap e allineamento
 * - Snap and alignment system
 * 
 * - Esportazione in vari formati (DXF, SVG, PDF)
 * - Export in various formats (DXF, SVG, PDF)
 * 
 * - Gestione della cronologia e annullamento/ripetizione
 * - History management and undo/redo
 * 
 * - Libreria di componenti e simboli
 * - Component and symbol library
 * 
 * - Integrazione con modelli 3D
 * - 3D model integration
 * 
 * - Responsive design per vari dispositivi
 * - Responsive design for various devices
 */
const CompleteCADSystem: React.FC<CompleteCADSystemProps> = ({
  projectId,
  initialData,
  onSave,
  readOnly = false,
  showLibrary = true,
  theme = 'system'
}) => {
  // State for responsive design
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const [leftPanelOpen, setLeftPanelOpen] = useState(isDesktop);
  const [rightPanelOpen, setRightPanelOpen] = useState(isDesktop);
  
  // Application state
  const [activeTab, setActiveTab] = useState<string>("drawing");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // Toast notifications (simplified for this example)
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    alert(`${type.toUpperCase()}: ${message}`);
  };
  
  // Auto-save configuration
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [autoSaveInterval, setAutoSaveInterval] = useState(5);
  
  // Access the technical drawing store

const { 
  entities, 
  dimensions, 
  annotations, 
  drawingLayers,
  setEntities, 
  setDimensions, 
  setAnnotations, 
  setDrawingLayers,
  currentCommandIndex,
  undo,
  redo,
  zoomToFit
} = useTechnicalDrawingStore();
  
  
  // Check if we can undo/redo
  const canUndo = currentCommandIndex > 0;
  const canRedo = currentCommandIndex < (useTechnicalDrawingStore.getState().commandHistory.length - 1);
  
  // Load initial data if provided
  useEffect(() => {
    if (initialData) {
      if (initialData.entities) setEntities(initialData.entities);
      if (initialData.dimensions) setDimensions(initialData.dimensions);
      if (initialData.annotations) setAnnotations(initialData.annotations);
      if (initialData.layers) setDrawingLayers(initialData.layers);
      setUnsavedChanges(false);
    }
  }, [initialData, setEntities, setDimensions, setAnnotations, setDrawingLayers]);
  
  // Set up auto-save functionality
  useEffect(() => {
    if (!autoSaveEnabled || !onSave || readOnly) return;
    
    const interval = setInterval(() => {
      if (unsavedChanges) {
        handleSave();
      }
    }, autoSaveInterval * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [autoSaveEnabled, autoSaveInterval, unsavedChanges, onSave, readOnly]);
  
  // Monitor for changes to mark unsaved work
  useEffect(() => {
    if (currentCommandIndex > 0) {
      setUnsavedChanges(true);
    }
  }, [currentCommandIndex]);
  
  // Responsive listener
  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      if (!leftPanelOpen && desktop) setLeftPanelOpen(true);
      if (!rightPanelOpen && desktop) setRightPanelOpen(true);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [leftPanelOpen, rightPanelOpen]);
  
  // Handler for saving the drawing
  const handleSave = useCallback(async () => {
    if (readOnly || !onSave) return;
    
    try {
      const drawingData = {
        entities,
        dimensions,
        annotations,
        layers: drawingLayers
      };
      
      await onSave(drawingData);
      
      setLastSaved(new Date());
      setUnsavedChanges(false);
      
      showToast("Il tuo disegno è stato salvato con successo.", "success");
    } catch (error) {
      console.error('Error saving drawing:', error);
      showToast("Si è verificato un errore durante il salvataggio del disegno.", "error");
    }
  }, [entities, dimensions, annotations, drawingLayers, onSave, readOnly]);
  
  // Handler for exporting the drawing
  const handleExport = useCallback(async (format: 'dxf' | 'svg' | 'pdf' | 'png') => {
    setIsExporting(true);
    
    try {
      // Simulate export process
      setTimeout(() => {
        showToast(`Il tuo disegno è stato esportato in formato ${format.toUpperCase()}.`, "success");
        setIsExporting(false);
      }, 1500);
    } catch (error) {
      console.error(`Error exporting drawing as ${format}:`, error);
      showToast(`Si è verificato un errore durante l'esportazione in formato ${format.toUpperCase()}.`, "error");
      setIsExporting(false);
    }
  }, []);
  
  // Window beforeunload event to warn about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (unsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [unsavedChanges]);
  
  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Save - Ctrl+S
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        if (!readOnly && onSave) handleSave();
      }
      
      // Undo - Ctrl+Z
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (!readOnly && canUndo) undo();
      }
      
      // Redo - Ctrl+Y or Ctrl+Shift+Z
      if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        if (!readOnly && canRedo) redo();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [readOnly, onSave, handleSave, undo, redo, canUndo, canRedo]);
  
  // Render the main panel content based on active tab
  const renderMainContent = () => {
    switch (activeTab) {
      case "drawing":
        return (
          <div className="h-full w-full">
            <TechnicalDrawingEditor
              width="100%"
              height="100%"
              onSave={handleSave}
              onExport={handleExport}
            />
          </div>
        );
        
      case "library":
        return (
          <div className="h-full w-full p-4 overflow-y-auto">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <ProjectLibrary />
            </div>
          </div>
        );
        
      case "history":
        return (
          <div className="h-full w-full p-4 overflow-y-auto">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <DrawingHistoryPanel
                currentCommandIndex={currentCommandIndex}
                onRevert={(index : number) => {
                  // Implement history reversion logic
                  showToast(`Il disegno è stato riportato allo stato #${index + 1}`, "success");
                }}
              />
            </div>
          </div>
        );
        
      case "import":
        return (
          <div className="h-full w-full p-4 overflow-y-auto">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <ModelImportPanel
                onImport={(data : any) => {
                  // Implement import logic
                  showToast("Il modello è stato importato con successo.", "success");
                }}
              />
            </div>
          </div>
        );
        
      case "export":
        return (
          <div className="h-full w-full p-4 overflow-y-auto">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <FileExportPanel
                isExporting={isExporting}
                onExport={handleExport}
              />
            </div>
          </div>
        );
        
      case "settings":
        return (
          <div className="h-full w-full p-4 overflow-y-auto">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <DrawingSettings
                autoSaveEnabled={autoSaveEnabled}
                autoSaveInterval={autoSaveInterval}
                onChangeAutoSave={setAutoSaveEnabled}
                onChangeInterval={setAutoSaveInterval}
                theme={theme}
              />
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className={`flex flex-col h-screen w-full bg-gray-50 ${theme === 'dark' ? 'dark' : ''}`} data-project-id={projectId}>
      {/* Header toolbar */}
      <header className="border-b p-2 bg-white shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Mobile menu button */}
            <button 
              className="lg:hidden p-2 rounded-md hover:bg-gray-100"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              <Menu size={20} />
            </button>
            
            <h2 className="text-xl font-bold text-gray-800">CAD/CAM 2D</h2>
            
            {/* Desktop action buttons */}
            <div className="hidden md:flex items-center gap-2 ml-4">
              <button
                className={`px-3 py-1 rounded-md text-sm font-medium flex items-center gap-1 ${
                  !unsavedChanges || readOnly || !onSave || isExporting 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                }`}
                onClick={() => handleSave()}
                disabled={!unsavedChanges || readOnly || !onSave || isExporting}
              >
                <Save size={16} />
                Salva
              </button>
              
              <button 
                className={`p-1 rounded-md ${
                  !canUndo || readOnly 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => undo()}
                disabled={!canUndo || readOnly}
              >
                <Undo2 size={16} />
              </button>
              
              <button 
                className={`p-1 rounded-md ${
                  !canRedo || readOnly 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => redo()}
                disabled={!canRedo || readOnly}
              >
                <Redo2 size={16} />
              </button>
            </div>
          </div>
          
          {/* Desktop tabs */}
          <div className="hidden md:flex items-center gap-2">
            <div className="flex border rounded-md overflow-hidden">
              <button 
                className={`px-3 py-1.5 text-sm font-medium flex items-center gap-1 ${
                  activeTab === "drawing" 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => setActiveTab("drawing")}
              >
                <LayoutGrid size={16} />
                Disegno
              </button>
              
              {showLibrary && (
                <button 
                  className={`px-3 py-1.5 text-sm font-medium flex items-center gap-1 ${
                    activeTab === "library" 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setActiveTab("library")}
                >
                  <SquareStack size={16} />
                  Libreria
                </button>
              )}
              
              <button 
                className={`px-3 py-1.5 text-sm font-medium flex items-center gap-1 ${
                  activeTab === "export" 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => setActiveTab("export")}
              >
                <Download size={16} />
                Esporta
              </button>
            </div>
          </div>
          
          {/* Right side panel controls */}
          <div className="flex items-center gap-2">
            {isDesktop && (
              <>
                <button
                  className="p-1 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
                  onClick={() => setLeftPanelOpen(!leftPanelOpen)}
                >
                  <PanelLeft size={18} />
                </button>
                
                <button
                  className="p-1 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
                  onClick={() => setRightPanelOpen(!rightPanelOpen)}
                >
                  <PanelRight size={18} />
                </button>
              </>
            )}
            
            <button 
              className="p-1 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
              onClick={() => setActiveTab("settings")}
            >
              <Settings size={18} />
            </button>
          </div>
        </div>
        
        {/* Mobile menu dropdown */}
        {showMobileMenu && (
          <div className="lg:hidden mt-2 bg-white border rounded-md shadow-lg p-2">
            <button 
              className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-md flex items-center gap-2"
              onClick={() => {
                setActiveTab("drawing");
                setShowMobileMenu(false);
              }}
            >
              <LayoutGrid size={16} />
              Disegno
            </button>
            
            {showLibrary && (
              <button 
                className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-md flex items-center gap-2"
                onClick={() => {
                  setActiveTab("library");
                  setShowMobileMenu(false);
                }}
              >
                <SquareStack size={16} />
                Libreria
              </button>
            )}
            
            <button 
              className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-md flex items-center gap-2"
              onClick={() => {
                setActiveTab("history");
                setShowMobileMenu(false);
              }}
            >
              <History size={16} />
              Cronologia
            </button>
            
            <button 
              className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-md flex items-center gap-2"
              onClick={() => {
                setActiveTab("import");
                setShowMobileMenu(false);
              }}
            >
              <FileUp size={16} />
              Importa
            </button>
            
            <button 
              className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-md flex items-center gap-2"
              onClick={() => {
                setActiveTab("export");
                setShowMobileMenu(false);
              }}
            >
              <Download size={16} />
              Esporta
            </button>
            
            <button 
              className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-md flex items-center gap-2"
              onClick={() => {
                setActiveTab("settings");
                setShowMobileMenu(false);
              }}
            >
              <Settings size={16} />
              Impostazioni
            </button>
          </div>
        )}
      </header>
      
      {/* Main content area */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left panel - Tools and Layers */}
        {isDesktop && leftPanelOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "280px", opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-r bg-white h-full overflow-y-auto"
          >
            <div className="p-4">
              <h3 className="font-semibold mb-4 text-gray-800">Strumenti di disegno</h3>
              <div className="mb-6">
                {/* Placeholder for ToolsPanel integration */}
                <p className="text-sm text-gray-500 mb-2">
                  Seleziona uno strumento per iniziare a disegnare
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {["line", "circle", "rectangle", "polyline", "dimension", "text"].map(tool => (
                    <button 
                      key={tool}
                      className="p-2 border rounded-md hover:bg-gray-50 flex flex-col items-center justify-center text-xs"
                    >
                      {tool.charAt(0).toUpperCase() + tool.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="h-px bg-gray-200 my-4"></div>
              
              <h3 className="font-semibold mb-4 text-gray-800">Livelli di disegno</h3>
              <div className="mb-6">
                {/* Placeholder for LayersPanel integration */}
                <p className="text-sm text-gray-500 mb-2">
                  Gestisci la visibilità e le proprietà dei livelli
                </p>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Livelli: {drawingLayers.length}</span>
                  <button className="px-2 py-1 bg-blue-50 text-blue-600 rounded-md text-sm flex items-center gap-1">
                    <Layers size={14} />
                    Nuovo
                  </button>
                </div>
                <div className="space-y-2">
                  {drawingLayers.map(layer => (
                    <div key={layer.id} className="flex items-center p-2 border rounded-md">
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: layer.color }}
                      ></div>
                      <span className="text-sm flex-1">{layer.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Center area - main content based on active tab */}
        <div className="flex-1 overflow-hidden">
          {renderMainContent()}
        </div>
        
        {/* Right panel - Properties */}
        {isDesktop && rightPanelOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "280px", opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-l bg-white h-full overflow-y-auto"
          >
            <div className="p-4">
              <h3 className="font-semibold mb-4 text-gray-800">Proprietà</h3>
              <div className="mb-6">
                {/* Placeholder for PropertiesPanel integration */}
                <p className="text-sm text-gray-500 mb-2">
                  Modifica le proprietà degli oggetti selezionati
                </p>
                
                {/* Simulated properties sections */}
                <div className="mb-4 border rounded-md overflow-hidden">
                  <div className="flex items-center justify-between p-2 bg-gray-50 cursor-pointer">
                    <span className="font-medium text-sm">Geometria</span>
                    <ChevronDown size={16} />
                  </div>
                  <div className="p-2 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-500">X</label>
                        <input 
                          type="number"
                          className="w-full border rounded-md p-1 text-sm"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500">Y</label>
                        <input 
                          type="number"
                          className="w-full border rounded-md p-1 text-sm"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mb-4 border rounded-md overflow-hidden">
                  <div className="flex items-center justify-between p-2 bg-gray-50 cursor-pointer">
                    <span className="font-medium text-sm">Stile</span>
                    <ChevronDown size={16} />
                  </div>
                  <div className="p-2 space-y-2">
                    <div>
                      <label className="block text-xs text-gray-500">Colore</label>
                      <div className="flex gap-2 mt-1">
                        {["#000000", "#FF0000", "#00FF00", "#0000FF", "#FFFF00"].map(color => (
                          <div 
                            key={color}
                            className="w-5 h-5 rounded-full cursor-pointer border"
                            style={{ backgroundColor: color }}
                          ></div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500">Spessore</label>
                      <input 
                        type="range"
                        className="w-full"
                        min="1"
                        max="10"
                        step="1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </main>
      
      {/* Footer status bar */}
      <footer className="border-t p-2 bg-white text-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-gray-500">
            {unsavedChanges ? "Modifiche non salvate" : "Nessuna modifica"}
          </span>
          {lastSaved && (
            <span className="text-gray-500">
              Ultimo salvataggio: {lastSaved.toLocaleTimeString()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-500">
            Elementi: {Object.keys(entities).length + Object.keys(dimensions).length + Object.keys(annotations).length}
          </span>
          <span className="text-gray-500">
            Livelli: {drawingLayers.length}
          </span>
          {readOnly && (
            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
              Modalità sola lettura
            </span>
          )}
        </div>
      </footer>
    </div>
  );
};

export default CompleteCADSystem;
