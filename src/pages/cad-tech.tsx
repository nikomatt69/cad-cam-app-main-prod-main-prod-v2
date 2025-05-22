import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import CompleteCADSystem from 'src/components/cad/technical-drawing/integration/CompleteCADSystem';
import { DrawingLayer } from 'src/components/cad/technical-drawing/TechnicalDrawingTypes';
import { useTechnicalDrawingStore } from 'src/components/cad/technical-drawing/technicalDrawingStore';
import { saveAs } from 'file-saver';
import { Sun, Moon, Monitor, Menu, X, Save, Download, Upload, Info, Settings as SettingsIcon } from 'lucide-react';

/**
 * CAD Technical Drawing System - Professional Edition
 * 
 * A complete and professional CAD 2D technical drawing system that integrates
 * all aspects of the technical drawing workflow in a single, coherent interface.
 * 
 * Features:
 * - Full-featured drawing tools (lines, circles, arcs, splines, etc.)
 * - Advanced editing capabilities (trim, extend, fillet, chamfer)
 * - Dimensioning and annotation tools
 * - Layer management system
 * - Snap and alignment system
 * - Import/export support (DXF, SVG, PDF)
 * - Command line interface
 * - Customizable workspace
 * - History and version tracking
 */
export default function CADTechnicalDrawing() {
  // Router for navigation and query parameters
  const router = useRouter();
  
  // References
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const cadSystemRef = useRef<any>(null);
  
  // UI State
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [projectName, setProjectName] = useState('Nuovo Progetto CAD');
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [projectId, setProjectId] = useState<string>('cad-project-' + Date.now());
  const [statusMessage, setStatusMessage] = useState('');
  
  // Settings
  const [autoSave, setAutoSave] = useState(true);
  const [autoSaveInterval, setAutoSaveInterval] = useState(5); // minutes
  const [gridSnap, setGridSnap] = useState(true);
  const [gridSize, setGridSize] = useState(10); // pixels
  const [angularSnap, setAngularSnap] = useState(true);
  const [angularSnapValue, setAngularSnapValue] = useState(15); // degrees
  
  // Drawing state from the store
  const { 
    entities, 
    dimensions, 
    annotations, 
    drawingLayers,
    commandHistory,
    currentCommandIndex
  } = useTechnicalDrawingStore();
  
  // Initial data for the CAD system
  // Professional initial data structure for the CAD system
  const initialData = {
    entities: {
      'line1': {
        id: 'line1',
        type: 'line',
        startPoint: { x: 100, y: 200 },
        endPoint: { x: 300, y: 200 },
        layer: 'construction',
        visible: true,
        locked: false,
        style: {
          strokeColor: '#0066CC',
          strokeWidth: 1.5,
          strokeStyle: 'solid'
        }
      },
      'circle1': {
        id: 'circle1',
        type: 'circle',
        center: { x: 350, y: 300 },
        radius: 80,
        layer: 'geometry',
        visible: true,
        locked: false,
        style: {
          strokeColor: '#3366FF',
          strokeWidth: 1.5,
          strokeStyle: 'solid',
          fillColor: 'rgba(200, 220, 255, 0.1)'
        }
      },
      'arc1': {
        id: 'arc1',
        type: 'arc',
        center: { x: 200, y: 300 },
        radius: 100,
        startAngle: 0,
        endAngle: Math.PI,
        layer: 'geometry',
        visible: true,
        locked: false,
        style: {
          strokeColor: '#2277CC',
          strokeWidth: 1.5,
          strokeStyle: 'solid'
        }
      },
      'polyline1': {
        id: 'polyline1',
        type: 'polyline',
        points: [
          { x: 500, y: 150 },
          { x: 600, y: 200 },
          { x: 550, y: 300 },
          { x: 650, y: 350 }
        ],
        closed: false,
        layer: 'geometry',
        visible: true,
        locked: false,
        style: {
          strokeColor: '#AA3366',
          strokeWidth: 1.5,
          strokeStyle: 'solid'
        }
      },
      'rect1': {
        id: 'rect1',
        type: 'rectangle',
        position: { x: 450, y: 150 },
        width: 180,
        height: 100,
        layer: 'details',
        visible: true,
        locked: false,
        style: {
          strokeColor: '#CC5500',
          strokeWidth: 1.5,
          strokeStyle: 'dashed',
          fillColor: 'rgba(255, 200, 200, 0.1)'
        }
      },
      'spline1': {
        id: 'spline1',
        type: 'spline',
        controlPoints: [
          { x: 100, y: 400 },
          { x: 150, y: 450 },
          { x: 250, y: 430 },
          { x: 300, y: 500 }
        ],
        layer: 'geometry',
        visible: true,
        locked: false,
        style: {
          strokeColor: '#663399',
          strokeWidth: 2,
          strokeStyle: 'solid'
        }
      },
      'ellipse1': {
        id: 'ellipse1',
        type: 'ellipse',
        center: { x: 500, y: 400 },
        radiusX: 80,
        radiusY: 40,
        rotation: Math.PI / 6,
        layer: 'geometry',
        visible: true,
        locked: false,
        style: {
          strokeColor: '#009966',
          strokeWidth: 1.5,
          strokeStyle: 'solid',
          fillColor: 'rgba(200, 255, 220, 0.1)'
        }
      }
    },
    dimensions: {
      'dim1': {
        id: 'dim1',
        type: 'linear-dimension',
        startPoint: { x: 100, y: 200 },
        endPoint: { x: 300, y: 200 },
        offsetDistance: 30,
        text: '200.00',
        layer: 'dimensions',
        visible: true,
        locked: false,
        style: {
          strokeColor: '#006633',
          strokeWidth: 1,
          strokeStyle: 'solid',
          fontFamily: 'Arial',
          fontSize: 12
        }
      },
      'dim2': {
        id: 'dim2',
        type: 'radial-dimension',
        center: { x: 350, y: 300 },
        radius: 80,
        angle: Math.PI / 4,
        text: 'R80.00',
        layer: 'dimensions',
        visible: true,
        locked: false,
        style: {
          strokeColor: '#006633',
          strokeWidth: 1,
          strokeStyle: 'solid',
          fontFamily: 'Arial',
          fontSize: 12
        }
      },
      'dim3': {
        id: 'dim3',
        type: 'angular-dimension',
        center: { x: 200, y: 300 },
        startPoint: { x: 300, y: 300 },
        endPoint: { x: 200, y: 200 },
        text: '45°',
        layer: 'dimensions',
        visible: true,
        locked: false,
        style: {
          strokeColor: '#006633',
          strokeWidth: 1,
          strokeStyle: 'solid',
          fontFamily: 'Arial',
          fontSize: 12
        }
      }
    },
    annotations: {
      'note1': {
        id: 'note1',
        type: 'text-annotation',
        position: { x: 450, y: 350 },
        text: 'Dettaglio tecnico',
        layer: 'annotations',
        visible: true,
        locked: false,
        style: {
          fontFamily: 'Arial',
          fontSize: 14,
          strokeColor: '#333333',
          textAlign: 'left'
        }
      },
      'note2': {
        id: 'note2',
        type: 'text-annotation',
        position: { x: 200, y: 450 },
        text: 'Profilo NURBS',
        layer: 'annotations',
        visible: true,
        locked: false,
        style: {
          fontFamily: 'Arial',
          fontSize: 14,
          strokeColor: '#333333',
          textAlign: 'left'
        }
      },
      'leader1': {
        id: 'leader1',
        type: 'leader',
        startPoint: { x: 450, y: 350 },
        endPoint: { x: 500, y: 300 },
        text: 'R80',
        layer: 'annotations',
        visible: true,
        locked: false,
        style: {
          strokeColor: '#333333',
          strokeWidth: 1,
          strokeStyle: 'solid',
          fontFamily: 'Arial',
          fontSize: 12
        }
      }
    },
    layers: [
      {
        id: 'grid',
        name: 'Griglia',
        color: '#CCCCCC',
        visible: true,
        locked: true,
        order: 0
      },
      {
        id: 'construction',
        name: 'Costruzione',
        color: '#0066CC',
        visible: true,
        locked: false,
        order: 1
      },
      {
        id: 'geometry',
        name: 'Geometria',
        color: '#3366FF',
        visible: true,
        locked: false,
        order: 2
      },
      {
        id: 'details',
        name: 'Dettagli',
        color: '#CC5500',
        visible: true,
        locked: false,
        order: 3
      },
      {
        id: 'dimensions',
        name: 'Dimensioni',
        color: '#006633',
        visible: true,
        locked: false,
        order: 4
      },
      {
        id: 'annotations',
        name: 'Annotazioni',
        color: '#333333',
        visible: true,
        locked: false,
        order: 5
      }
    ] as DrawingLayer[]
  };

  // Event handlers
  const handleSave = async (data: any) => {
    setIsLoading(true);
    setStatusMessage('Salvataggio in corso...');
    
    try {
      // Simulate API call
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          console.log('Disegno salvato:', data);
          resolve();
        }, 1500);
      });
      
      const timestamp = new Date().toLocaleTimeString();
      setStatusMessage(`Disegno salvato con successo alle ${timestamp}`);
      setSaveDialogOpen(false);
    } catch (error) {
      console.error('Errore durante il salvataggio:', error);
      setStatusMessage('Errore durante il salvataggio. Riprova.');
    } finally {
      setIsLoading(false);
    }
  };

  // Export drawing to DXF
  const handleExportDXF = () => {
    setIsLoading(true);
    setStatusMessage('Esportazione DXF in corso...');
    
    setTimeout(() => {
      // In a real app, you would generate a DXF file here
      const dxfContent = 'Simulated DXF content';
      const blob = new Blob([dxfContent], { type: 'application/dxf' });
      saveAs(blob, `${projectName.replace(/\s+/g, '_')}.dxf`);
      
      setIsLoading(false);
      setStatusMessage('DXF esportato con successo');
    }, 1500);
  };

  // Export drawing to SVG
  const handleExportSVG = () => {
    setIsLoading(true);
    setStatusMessage('Esportazione SVG in corso...');
    
    setTimeout(() => {
      // In a real app, you would generate an SVG file here
      const svgContent = '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><!-- Simulated SVG content --></svg>';
      const blob = new Blob([svgContent], { type: 'image/svg+xml' });
      saveAs(blob, `${projectName.replace(/\s+/g, '_')}.svg`);
      
      setIsLoading(false);
      setStatusMessage('SVG esportato con successo');
    }, 1500);
  };

  // Export drawing to PDF
  const handleExportPDF = () => {
    setIsLoading(true);
    setStatusMessage('Esportazione PDF in corso...');
    
    setTimeout(() => {
      // In a real app, you would generate a PDF file here
      setIsLoading(false);
      setStatusMessage('PDF esportato con successo');
    }, 1500);
  };

  // Toggle theme between light, dark, and system
  const toggleTheme = () => {
    setTheme(prevTheme => {
      switch (prevTheme) {
        case 'light': return 'dark';
        case 'dark': return 'system';
        case 'system': return 'light';
        default: return 'light';
      }
    });
  };

  // Set up keyboard shortcuts and event listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S for save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        setSaveDialogOpen(true);
      }
      
      // Ctrl+Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        useTechnicalDrawingStore.getState().undo();
      }
      
      // Ctrl+Shift+Z or Ctrl+Y for redo
      if (((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) || 
          ((e.ctrlKey || e.metaKey) && e.key === 'y')) {
        e.preventDefault();
        useTechnicalDrawingStore.getState().redo();
      }
      
      // ESC to cancel current operation
      if (e.key === 'Escape') {
        // Cancel current operation
      }
    };
    
    // Set up auto-save interval
    let autoSaveTimer: NodeJS.Timeout | null = null;
    
    if (autoSave) {
      autoSaveTimer = setInterval(() => {
        const data = {
          entities,
          dimensions,
          annotations,
          layers: drawingLayers
        };
        
        handleSave(data);
      }, autoSaveInterval * 60 * 1000);
    }
    
    window.addEventListener('keydown', handleKeyDown);
    
    // Clean up
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (autoSaveTimer) clearInterval(autoSaveTimer);
    };
  }, [autoSave, autoSaveInterval, entities, dimensions, annotations, drawingLayers]);

  return (
    <>
      <Head>
        <title>CAD/CAM Professional | Technical Drawing System</title>
        <meta name="description" content="Sistema CAD professionale per disegni tecnici 2D con funzionalità complete" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>
      
      <div 
        className={`min-h-screen flex flex-col ${theme === 'dark' ? 'dark bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}
        ref={mainContainerRef}
      >
        {/* Header Bar with Project Info and Controls */}
        <header className="bg-white dark:bg-gray-800 shadow-md py-2 px-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <button 
              className="md:hidden mr-4 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            
            <div className="flex flex-col">
              <div className="flex items-center">
                <h1 className="text-xl font-bold mr-3">CAD Technical</h1>
                <input 
                  type="text" 
                  value={projectName} 
                  onChange={(e) => setProjectName(e.target.value)}
                  className="text-sm px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">ID: {projectId}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Save Button */}
            <button 
              className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              onClick={() => setSaveDialogOpen(true)}
              disabled={isLoading}
            >
              {isLoading ? 'Salvando...' : 'Salva'}
              <Save size={16} className="ml-1" />
            </button>
            
            {/* Export Button */}
            <div className="relative group">
              <button className="flex items-center px-3 py-1.5 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                Esporta
                <Download size={16} className="ml-1" />
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 hidden group-hover:block z-10">
                <button 
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={handleExportDXF}
                >
                  Esporta come DXF
                </button>
                <button 
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={handleExportSVG}
                >
                  Esporta come SVG
                </button>
                <button 
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={handleExportPDF}
                >
                  Esporta come PDF
                </button>
              </div>
            </div>
            
            {/* Theme Toggle */}
            <button 
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={toggleTheme}
              title={`Tema attuale: ${theme}`}
            >
              {theme === 'light' && <Sun size={20} />}
              {theme === 'dark' && <Moon size={20} />}
              {theme === 'system' && <Monitor size={20} />}
            </button>
            
            {/* Settings */}
            <button 
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Impostazioni"
            >
              <SettingsIcon size={20} />
            </button>
          </div>
        </header>
        
        {/* Main CAD Interface */}
        <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Main CAD System Integration */}
          <div className="flex-1 h-full relative">
            <CompleteCADSystem
              
              projectId={projectId}
              initialData={initialData}
              onSave={handleSave}
              theme={theme}
              showLibrary={true}
            />
          </div>
        </main>
        
        {/* Status Bar */}
        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-1 px-4 text-sm flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span>{statusMessage || 'Pronto'}</span>
            <span>Elementi: {Object.keys(entities).length + Object.keys(dimensions).length + Object.keys(annotations).length}</span>
            <span>Livelli: {drawingLayers.length}</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <span>Snap: {gridSnap ? 'ON' : 'OFF'}</span>
            <span>Griglia: {gridSize}px</span>
            <span>Coordinate: 0,0</span>
          </div>
        </footer>
        
        {/* Save Dialog */}
        {saveDialogOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Salva Progetto</h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Nome Progetto</label>
                <input 
                  type="text" 
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button 
                  className="px-4 py-2 border rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => setSaveDialogOpen(false)}
                >
                  Annulla
                </button>
                <button 
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  disabled={isLoading}
                  onClick={() => {
                    const data = {
                      entities,
                      dimensions,
                      annotations,
                      layers: drawingLayers
                    };
                    handleSave(data);
                  }}
                >
                  {isLoading ? 'Salvando...' : 'Salva'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

