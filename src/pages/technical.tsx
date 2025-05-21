// src/pages/technical.tsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { 
  Menu, 
  X, 
  Settings, 
  Layers, 
  Save, 
  Download, 
  ArrowLeft, 
  Grid,
  Clipboard,
  FileText,
  Info,
  HelpCircle,
  Tool,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Layout,
  Sliders,
  Maximize2,
  Home,
  Plus,
  Trash,
  Edit,
  Aperture,
  Box,
  Trello,
  File as SheetSetupIcon,
  Target as GDTIcon,
  Cpu as MechanicalSymbolsIcon,
  Command
} from 'react-feather';

import { CADCanvasTechnicalDrawing } from '../components/cad/technical-drawing/CADCanvasTechnicalDrawing';
import { initializeTechnicalDrawingStore, useTechnicalDrawingStore } from '../store/technicalDrawingStore';
import { useElementsStore } from '../store/elementsStore';
import { convert3DTo2D, createOrthographicViews } from '../lib/model3dTo2dConverter';
import { exportToDXF, exportToSVG, exportToPNG } from '../lib/drawingExportUtil';
import { DrawingEntity } from '../types/TechnicalDrawingTypes';
import { Ruler } from 'lucide-react';

import { LayerPanel } from '../components/cad/technical-drawing/LayerPanel';
import { PropertiesPanel } from '../components/cad/technical-drawing/PropertiesPanel';
import { BlocksPanel } from '../components/cad/technical-drawing/BlocksPanel';
import { DimensioningPanel } from '../components/cad/technical-drawing/DimensioningPanel';
import { ViewportsPanel } from '../components/cad/technical-drawing/ViewportsPanel';
import { SheetSetupPanel } from '../components/cad/technical-drawing/SheetSetupPanel';
import { GeometricTolerancePanel } from '../components/cad/technical-drawing/GeometricTolerancePanel';
import { MechanicalSymbolsPanel } from '../components/cad/technical-drawing/MechanicalSymbols';
import { CommandSystem } from '../components/cad/technical-drawing/core/CommandSystem';
import { DrawingTool } from '../components/cad/technical-drawing/core/ToolsManager';
import { S } from 'graphql-ws/dist/server-CRG3y31G';
import { strict } from 'assert';
import { TechnicalDrawingToolbar } from '../components/cad/technical-drawing/TechnicalDrawingToolbar';
import { TechnicalDrawingCanvas } from '../components/cad/technical-drawing/TechnicalDrawingCanvas';

/**
 * Enhanced Technical Drawing Page Component with AutoCAD-like features
 */
const TechnicalPage: React.FC = () => {
  const router = useRouter();
  const commandSystemRef = useRef<CommandSystem | null>(null);
  const [commandLineInput, setCommandLineInput] = useState('');
  
  // Panel and UI states
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'draw' | 'modify' | 'annotate' | 'mechanical' | 'view'>('home');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showHelpPanel, setShowHelpPanel] = useState(false);
  const [showCommandPanel, setShowCommandPanel] = useState(true);
  const [workingMode, setWorkingMode] = useState<'2D' | '3D-to-2D'>('2D');
  const [currentTool, setCurrentTool] = useState('select');
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [rightPanelContent, setRightPanelContent] = useState<
    'layers' | 'properties' | 'tools' | 'blocks' | 'styles' | 'mechanical' | 'dimensions' | 'viewports' | 'settings' | 'sheet-setup' | 'gdt'
  >('properties');
  
  // Reference to the drawing canvas container
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  
  // Get state from technical drawing store
  const { 
    entities, 
    dimensions, 
    annotations, 
    sheet, 
    viewports,
    zoom,
    zoomToFit,
    addEntity,
    deleteEntity,
    clearSelection,
    selectedEntityIds,
    activeTool,
    setActiveTool
  } = useTechnicalDrawingStore();
  
  // Get elements from 3D store
  const { elements } = useElementsStore();
  
  // Initialize the store and command system when the component mounts
  useEffect(() => {
    initializeTechnicalDrawingStore();
    commandSystemRef.current = new CommandSystem();
  }, []);
  
  const handleCommandSubmit = () => {
    if (commandSystemRef.current && commandLineInput) {
      commandSystemRef.current.processCommandLine(commandLineInput);
      setCommandLineInput('');
    }
  };
  
  // Monitor tool changes from the canvas component
  const handleToolChange = useCallback((tool: string) => {
    setCurrentTool(tool);
  }, []);
  
  // Handle entity creation
  const handleEntityCreated = useCallback((entityId: string) => {
    console.log(`Entity created: ${entityId}`);
  }, []);
  
  // Handle entity selection
  const handleEntitySelected = useCallback((entityId: string | string[]) => {
    console.log(`Entity selected: ${Array.isArray(entityId) ? entityId.join(', ') : entityId}`);
    
    // Show properties panel when entity is selected
    if (entityId && !isRightPanelOpen) {
      setRightPanelContent('properties');
      setIsRightPanelOpen(true);
    }
  }, [isRightPanelOpen]);
  
  // Handle entity deletion
  const handleEntityDeleted = useCallback((entityId: string) => {
    console.log(`Entity deleted: ${entityId}`);
  }, []);
  
  // Convert 3D to 2D and add to drawing
  const handleConvert3DTo2D = useCallback(() => {
    const viewType = 'front';
    const convertedEntities = convert3DTo2D(elements, viewType);
    
    if (convertedEntities.length === 0) {
      alert('No entities were created from the 3D model.');
      return;
    }
    
    convertedEntities.forEach((entity: DrawingEntity) => {
      addEntity({
        ...entity
      });
    });
    
    alert(`Converted ${convertedEntities.length} entities from 3D to 2D.`);
  }, [elements, addEntity]);
  
  // Generate orthographic views
  const handleGenerateViews = useCallback(() => {
    if (!elements || Object.keys(elements).length === 0) {
      alert('No 3D model available for generating views.');
      return;
    }
    
    // Clear current selection
    clearSelection();
    
    try {
      // Create front, top, and side views
      const views = createOrthographicViews(elements);
      
      if (Object.values(views).every(entities => entities.length === 0)) {
        alert('No entities were created from the 3D model.');
        return;
      }
      
      // Add entities for each view
      let totalEntities = 0;
      
      Object.entries(views).forEach(([viewName, viewEntities]) => {
        viewEntities.forEach((entity: DrawingEntity) => {
          addEntity({ ...entity });
          totalEntities++;
        });
      });
      
      // Zoom to fit all entities
      zoomToFit();
      
      alert(`Created ${totalEntities} entities in orthographic views.`);
    } catch (error) {
      console.error('Error generating views:', error);
      alert('An error occurred while generating views.');
    }
  }, [elements, clearSelection, addEntity, zoomToFit]);
  
  // Create a new empty drawing
  const handleNewDrawing = useCallback(() => {
    if (Object.keys(entities).length > 0 || Object.keys(dimensions).length > 0 || Object.keys(annotations).length > 0) {
      if (confirm('Creating a new drawing will discard your current work. Continue?')) {
        initializeTechnicalDrawingStore();
        setActiveTool('select');
      }
    } else {
      initializeTechnicalDrawingStore();
      setActiveTool('select');
    }
    
    setIsMenuOpen(false);
  }, [entities, dimensions, annotations, setActiveTool]);
  
  // Export drawing
  const handleExport = useCallback((format: 'dxf' | 'svg' | 'png' | 'pdf' | 'dwg') => {
    switch (format) {
      case 'dxf':
        exportToDXF(entities, dimensions, annotations, sheet);
        break;
      case 'svg':
        exportToSVG(entities, dimensions, annotations, sheet, viewports);
        break;
      case 'png':
        // Find the canvas element
        if (canvasContainerRef.current) {
          const canvas = canvasContainerRef.current.querySelector('canvas');
          if (canvas) {
            exportToPNG(canvas, 'technical_drawing.png');
          } else {
            alert('Canvas element not found.');
          }
        } else {
          alert('Canvas container not found.');
        }
        break;
      case 'pdf':
        alert('PDF export is available in the pro version.');
        break;
      case 'dwg':
        alert('DWG export is available in the pro version.');
        break;
    }
    
    setShowExportMenu(false);
  }, [entities, dimensions, annotations, sheet, viewports]);
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+N for new drawing
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        handleNewDrawing();
      }
      
      // Ctrl+S for save
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        // Implement save functionality
        alert('Drawing saved');
      }
      
      // Ctrl+E for export
      if (e.ctrlKey && e.key === 'e') {
        e.preventDefault();
        setShowExportMenu(prev => !prev);
      }
      
      // F1 for help
      if (e.key === 'F1') {
        e.preventDefault();
        setShowHelpPanel(prev => !prev);
      }
      
      // Escape to close panels
      if (e.key === 'Escape') {
        if (isMenuOpen) setIsMenuOpen(false);
        if (showExportMenu) setShowExportMenu(false);
        if (isRightPanelOpen) setIsRightPanelOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleNewDrawing, isMenuOpen, showExportMenu, isRightPanelOpen]);
  
  // Define tabs for ribbon menu
  const ribbonTabs = {
    home: (
      <div className="flex items-center space-x-4">
        <div className="border-r border-gray-700 pr-4">
          <div className="flex space-x-1">
            <button 
              onClick={() => setActiveTool('select')}
              className={`p-2 rounded ${activeTool === 'select' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
              title="Select (S)"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" 
                   strokeWidth="2" fill="none" className="text-gray-200">
                <path d="M3 3l7 7m0 0v-6m0 6h-6"></path>
              </svg>
            </button>
            <button 
              onClick={() => setActiveTool('move')}
              className={`p-2 rounded ${activeTool === 'move' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
              title="Move (M)"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" 
                   strokeWidth="2" fill="none" className="text-gray-200">
                <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M5 12h14"></path>
              </svg>
            </button>
            <button 
              onClick={() => setActiveTool('copy')}
              className={`p-2 rounded ${activeTool === 'copy' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
              title="Copy (CP)"
            >
              <Clipboard size={20} className="text-gray-200" />
            </button>
          </div>
          <div className="text-center text-xs text-gray-500 mt-1">Modify</div>
        </div>
        
        <div className="border-r border-gray-700 pr-4">
          <div className="flex space-x-1">
            <button 
              onClick={() => setActiveTool('line')}
              className={`p-2 rounded ${activeTool === 'line' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
              title="Line (L)"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" 
                   strokeWidth="2" fill="none" className="text-gray-200">
                <path d="M5 19l14-14"></path>
              </svg>
            </button>
            <button 
              onClick={() => setActiveTool('circle')}
              className={`p-2 rounded ${activeTool === 'circle' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
              title="Circle (C)"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" 
                   strokeWidth="2" fill="none" className="text-gray-200">
                <circle cx="12" cy="12" r="10"></circle>
              </svg>
            </button>
            <button 
              onClick={() => setActiveTool('rectangle')}
              className={`p-2 rounded ${activeTool === 'rectangle' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
              title="Rectangle (R)"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" 
                   strokeWidth="2" fill="none" className="text-gray-200">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              </svg>
            </button>
          </div>
          <div className="text-center text-xs text-gray-500 mt-1">Draw</div>
        </div>
        
        <div className="border-r border-gray-700 pr-4">
          <div className="flex space-x-1">
            <button 
              onClick={() => setActiveTool('dimension-linear')}
              className={`p-2 rounded ${activeTool === 'dimension-linear' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
              title="Linear Dimension (DIM)"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" 
                   strokeWidth="2" fill="none" className="text-gray-200">
                <path d="M3 6h18M3 12h18M3 18h18"></path>
              </svg>
            </button>
            <button 
              onClick={() => setActiveTool('text')}
              className={`p-2 rounded ${activeTool === 'text' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
              title="Text (T)"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" 
                   strokeWidth="2" fill="none" className="text-gray-200">
                <path d="M12 5v14M5 12h14"></path>
              </svg>
            </button>
          </div>
          <div className="text-center text-xs text-gray-500 mt-1">Annotate</div>
        </div>
        
        <div>
          <div className="flex space-x-1">
            <button 
              onClick={() => {
                setRightPanelContent('layers');
                setIsRightPanelOpen(true);
              }}
              className={`p-2 rounded ${rightPanelContent === 'layers' && isRightPanelOpen ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
              title="Layers (LA)"
            >
              <Layers size={20} className="text-gray-200" />
            </button>
            <button 
              onClick={() => {
                setRightPanelContent('properties');
                setIsRightPanelOpen(true);
              }}
              className={`p-2 rounded ${rightPanelContent === 'properties' && isRightPanelOpen ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
              title="Properties (PR)"
            >
              <Sliders size={20} className="text-gray-200" />
            </button>
            <button 
              onClick={() => {
                setRightPanelContent('blocks');
                setIsRightPanelOpen(true);
              }}
              className={`p-2 rounded ${rightPanelContent === 'blocks' && isRightPanelOpen ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
              title="Blocks (B)"
            >
              <Box size={20} className="text-gray-200" />
            </button>
          </div>
          <div className="text-center text-xs text-gray-500 mt-1">Tools</div>
        </div>
      </div>
    ),
    
    draw: (
      <div className="flex items-center space-x-4">
        <div className="border-r border-gray-700 pr-4">
          <div className="flex space-x-1">
            <button 
              onClick={() => setActiveTool('line')}
              className={`p-2 rounded ${activeTool === 'line' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
              title="Line (L)"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" 
                   strokeWidth="2" fill="none" className="text-gray-200">
                <path d="M5 19l14-14"></path>
              </svg>
            </button>
            <button 
              onClick={() => setActiveTool('polyline')}
              className={`p-2 rounded ${activeTool === 'polyline' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
              title="Polyline (PL)"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" 
                   strokeWidth="2" fill="none" className="text-gray-200">
                <path d="M3 3l3 9-9 3"></path>
              </svg>
            </button>
          </div>
          <div className="text-center text-xs text-gray-500 mt-1">Lines</div>
        </div>
        
        <div className="border-r border-gray-700 pr-4">
          <div className="flex space-x-1">
            <button 
              onClick={() => setActiveTool('circle')}
              className={`p-2 rounded ${activeTool === 'circle' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
              title="Circle (C)"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" 
                   strokeWidth="2" fill="none" className="text-gray-200">
                <circle cx="12" cy="12" r="10"></circle>
              </svg>
            </button>
            <button 
              onClick={() => setActiveTool('arc')}
              className={`p-2 rounded ${activeTool === 'arc' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
              title="Arc (A)"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" 
                   strokeWidth="2" fill="none" className="text-gray-200">
                <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-9-9"></path>
              </svg>
            </button>
            <button 
              onClick={() => setActiveTool('ellipse')}
              className={`p-2 rounded ${activeTool === 'ellipse' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
              title="Ellipse (EL)"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" 
                   strokeWidth="2" fill="none" className="text-gray-200">
                <circle cx="12" cy="12" r="10" transform="scale(1.2, 0.8)"></circle>
              </svg>
            </button>
          </div>
          <div className="text-center text-xs text-gray-500 mt-1">Curves</div>
        </div>
        
        <div className="border-r border-gray-700 pr-4">
          <div className="flex space-x-1">
            <button 
              onClick={() => setActiveTool('rectangle')}
              className={`p-2 rounded ${activeTool === 'rectangle' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
              title="Rectangle (R)"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" 
                   strokeWidth="2" fill="none" className="text-gray-200">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              </svg>
            </button>
            <button 
              onClick={() => setActiveTool('polygon')}
              className={`p-2 rounded ${activeTool === 'polygon' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
              title="Polygon (POL)"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" 
                   strokeWidth="2" fill="none" className="text-gray-200">
                <path d="M12 2l5 5 5 10-5 5-10 0-5-5 0-10 5-5z"></path>
              </svg>
            </button>
          </div>
          <div className="text-center text-xs text-gray-500 mt-1">Shapes</div>
        </div>
        
        <div>
          <div className="flex space-x-1">
            <button 
              onClick={() => setActiveTool('hatch')}
              className={`p-2 rounded ${activeTool === 'hatch' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
              title="Hatch (H)"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" 
                   strokeWidth="2" fill="none" className="text-gray-200">
                <path d="M2 2l4 4m0 0l4 4m-4-4l-4 4m8 0l4 4m0 0l4 4m-4-4l-4 4"></path>
              </svg>
            </button>
            <button 
              onClick={() => setActiveTool('spline')}
              className={`p-2 rounded ${activeTool === 'spline' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
              title="Spline (SPL)"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" 
                   strokeWidth="2" fill="none" className="text-gray-200">
                <path d="M3 20c6-9 10-9 21-3"></path>
              </svg>
            </button>
          </div>
          <div className="text-center text-xs text-gray-500 mt-1">Advanced</div>
        </div>
      </div>
    ),
    
    modify: (
      <div className="flex items-center space-x-4">
        <div className="border-r border-gray-700 pr-4">
          <div className="flex space-x-1">
            <button 
              onClick={() => setActiveTool('move')}
              className={`p-2 rounded ${activeTool === 'move' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
              title="Move (M)"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" 
                   strokeWidth="2" fill="none" className="text-gray-200">
                <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M5 12h14"></path>
              </svg>
            </button>
            <button 
              onClick={() => setActiveTool('copy')}
              className={`p-2 rounded ${activeTool === 'copy' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
              title="Copy (CP)"
            >
              <Clipboard size={20} className="text-gray-200" />
            </button>
            <button 
              onClick={() => setActiveTool('rotate')}
              className={`p-2 rounded ${activeTool === 'rotate' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
              title="Rotate (RO)"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" 
                   strokeWidth="2" fill="none" className="text-gray-200">
                <path d="M23 4v6h-6M1 20v-6h6"></path>
                <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"></path>
              </svg>
            </button>
          </div>
          <div className="text-center text-xs text-gray-500 mt-1">Transform</div>
        </div>
        
        <div className="border-r border-gray-700 pr-4">
          <div className="flex space-x-1">
            <button 
              onClick={() => setActiveTool('trim')}
              className={`p-2 rounded ${activeTool === 'trim' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
              title="Trim (TR)"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" 
                   strokeWidth="2" fill="none" className="text-gray-200">
                <path d="M6 12l12 0M3 3l6 6M15 15l6 6"></path>
              </svg>
            </button>
            <button 
              onClick={() => setActiveTool('extend')}
              className={`p-2 rounded ${activeTool === 'extend' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
              title="Extend (EX)"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" 
                   strokeWidth="2" fill="none" className="text-gray-200">
                <path d="M3 8l3 4"></path>
                <path d="M18 12l3 -4"></path>
                <path d="M3 16l18 0"></path>
              </svg>
            </button>
            <button 
              onClick={() => setActiveTool('offset')}
              className={`p-2 rounded ${activeTool === 'offset' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
              title="Offset (O)"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" 
                   strokeWidth="2" fill="none" className="text-gray-200">
                <path d="M3 10h18"></path>
                <path d="M6 14h12"></path>
              </svg>
            </button>
          </div>
          <div className="text-center text-xs text-gray-500 mt-1">Modify</div>
        </div>
        
        <div>
          <div className="flex space-x-1">
            <button 
              onClick={() => setActiveTool('fillet')}
              className={`p-2 rounded ${activeTool === 'fillet' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
              title="Fillet (F)"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" 
                   strokeWidth="2" fill="none" className="text-gray-200">
                <path d="M7 5v7a5 5 0 0 0 5 5h7"></path>
              </svg>
            </button>
            <button 
              onClick={() => setActiveTool('chamfer')}
              className={`p-2 rounded ${activeTool === 'chamfer' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
              title="Chamfer (CHA)"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" 
                   strokeWidth="2" fill="none" className="text-gray-200">
                <path d="M6 6l6 12l6 -12"></path>
              </svg>
            </button>
            <button 
              onClick={() => setActiveTool('mirror')}
              className={`p-2 rounded ${activeTool === 'mirror' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
              title="Mirror (MI)"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" 
                   strokeWidth="2" fill="none" className="text-gray-200">
                <path d="M12 3l0 18M19 5l-7 7l7 7M5 5l7 7l-7 7"></path>
              </svg>
            </button>
          </div>
          <div className="text-center text-xs text-gray-500 mt-1">Construction</div>
        </div>
      </div>
    ),
    
    annotate: (
      <div className="flex items-center space-x-4">
        <div className="border-r border-gray-700 pr-4">
          <div className="flex space-x-1">
            <button 
              onClick={() => setActiveTool('dimension-linear')}
              className={`p-2 rounded ${activeTool === 'dimension-linear' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
              title="Linear Dimension (DL)"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" 
                   strokeWidth="2" fill="none" className="text-gray-200">
                <line x1="6" y1="6" x2="6" y2="18"></line>
                <line x1="18" y1="6" x2="18" y2="18"></line>
                <line x1="6" y1="12" x2="18" y2="12"></line>
              </svg>
            </button>
            <button 
              onClick={() => setActiveTool('dimension-angular')}
              className={`p-2 rounded ${activeTool === 'dimension-angular' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
              title="Angular Dimension (DA)"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" 
                   strokeWidth="2" fill="none" className="text-gray-200">
                <path d="M12 12L3 12"></path>
                <path d="M12 12L18 5"></path>
                <path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"></path>
                <path d="M7 12a5 5 0 1 0 5 -5"></path>
              </svg>
            </button>
            <button 
              onClick={() => setActiveTool('dimension-radius')}
              className={`p-2 rounded ${activeTool === 'dimension-radius' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
              title="Radius Dimension (DR)"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" 
                   strokeWidth="2" fill="none" className="text-gray-200">
                <circle cx="12" cy="12" r="9"></circle>
                <line x1="12" y1="12" x2="21" y2="12"></line>
              </svg>
            </button>
          </div>
          <div className="text-center text-xs text-gray-500 mt-1">Dimensions</div>
        </div>
        
        <div className="border-r border-gray-700 pr-4">
          <div className="flex space-x-1">
            <button 
              onClick={() => setActiveTool('text')}
              className={`p-2 rounded ${activeTool === 'text' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
              title="Text (T)"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" 
                   strokeWidth="2" fill="none" className="text-gray-200">
                <text x="6" y="16" fontSize="14" strokeWidth="0" fill="currentColor">Aa</text>
              </svg>
            </button>
            <button 
              onClick={() => setActiveTool('leader')}
              className={`p-2 rounded ${activeTool === 'leader' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
              title="Leader (LE)"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" 
                   strokeWidth="2" fill="none" className="text-gray-200">
                <path d="M4 21v-4a3 3 0 0 1 3 -3h5"></path>
                <path d="M18 16l-2 -2l2 -2"></path>
              </svg>
            </button>
            <button 
              onClick={() => setActiveTool('table')}
              className={`p-2 rounded ${activeTool === 'table' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
              title="Table (TB)"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" 
                   strokeWidth="2" fill="none" className="text-gray-200">
                <rect x="4" y="4" width="16" height="16" rx="0"></rect>
                <line x1="4" y1="10" x2="20" y2="10"></line>
                <line x1="4" y1="16" x2="20" y2="16"></line>
                <line x1="10" y1="4" x2="10" y2="20"></line>
              </svg>
            </button>
          </div>
          <div className="text-center text-xs text-gray-500 mt-1">Text</div>
        </div>
        
        <div>
          <div className="flex space-x-1">
            <button 
              onClick={() => {
                setRightPanelContent('dimensions');
                setIsRightPanelOpen(true);
              }}
              className={`p-2 rounded ${rightPanelContent === 'dimensions' && isRightPanelOpen ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
              title="Dimension Styles"
            >
              <Settings size={20} className="text-gray-200" />
            </button>
            <button 
              onClick={() => setActiveTool('centermark')}
              className={`p-2 rounded ${activeTool === 'centermark' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
              title="Center Mark (CM)"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" 
                   strokeWidth="2" fill="none" className="text-gray-200">
                <path d="M12 3v3m0 12v3M3 12h3m12 0h3M7.5 7.5l1.5 1.5m6 6l1.5 1.5M7.5 16.5l1.5-1.5m6-6l1.5-1.5"></path>
              </svg>
            </button>
          </div>
          <div className="text-center text-xs text-gray-500 mt-1">Styles</div>
        </div>
      </div>
    ),
    
    mechanical: (
      <div className="flex items-center space-x-4">
        <div className="border-r border-gray-700 pr-4">
          <div className="flex space-x-1">
            <button 
              onClick={() => setActiveTool('centerline')}
              className={`p-2 rounded ${activeTool === 'centerline' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
              title="Centerline (CL)"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" 
                   strokeWidth="2" fill="none" className="text-gray-200" strokeDasharray="4,2">
                <line x1="12" y1="3" x2="12" y2="21"></line>
              </svg>
            </button>
            <button 
              onClick={() => setActiveTool('centermark')}
              className={`p-2 rounded ${activeTool === 'centermark' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
              title="Center Mark (CM)"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" 
                   strokeWidth="2" fill="none" className="text-gray-200">
                <path d="M12 3v3m0 12v3M3 12h3m12 0h3M7.5 7.5l1.5 1.5m6 6l1.5 1.5M7.5 16.5l1.5-1.5m6-6l1.5-1.5"></path>
              </svg>
            </button>
          </div>
          <div className="text-center text-xs text-gray-500 mt-1">Centerlines</div>
        </div>
        
        <div className="border-r border-gray-700 pr-4">
          <div className="flex space-x-1">
            <button 
              onClick={() => setActiveTool('section-line')}
              className={`p-2 rounded ${activeTool === 'section-line' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
              title="Section Line (SL)"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" 
                   strokeWidth="2" fill="none" className="text-gray-200">
                <line x1="3" y1="3" x2="21" y2="21" strokeDasharray="6,3"></line>
              </svg>
            </button>
            <button 
              onClick={() => setActiveTool('hatch')}
              className={`p-2 rounded ${activeTool === 'hatch' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
              title="Hatch (H)"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" 
                   strokeWidth="2" fill="none" className="text-gray-200">
                <path d="M2 2l4 4m0 0l4 4m-4-4l-4 4m8 0l4 4m0 0l4 4m-4-4l-4 4"></path>
              </svg>
            </button>
          </div>
          <div className="text-center text-xs text-gray-500 mt-1">Sections</div>
        </div>
        
        <div className="border-r border-gray-700 pr-4">
          <div className="flex space-x-1">
            <button 
              onClick={() => setActiveTool('gdt')}
              className={`p-2 rounded ${activeTool === 'gdt' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
              title="Geometric Tolerancing (GDT)"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" 
                   strokeWidth="2" fill="none" className="text-gray-200">
                <rect x="4" y="8" width="16" height="8" rx="1"></rect>
              </svg>
            </button>
            <button 
              onClick={() => setActiveTool('surface-finish')}
              className={`p-2 rounded ${activeTool === 'surface-finish' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
              title="Surface Finish (SF)"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" 
                   strokeWidth="2" fill="none" className="text-gray-200">
                <path d="M3 10l2 -2l2 2l2 -2l2 2l2 -2l2 2l2 -2l2 2"></path>
                <path d="M5 8l0 10"></path>
              </svg>
            </button>
          </div>
          <div className="text-center text-xs text-gray-500 mt-1">Symbols</div>
        </div>
        
        <div>
          <div className="flex space-x-1">
            <button 
              onClick={() => setActiveTool('balloontext')}
              className={`p-2 rounded ${activeTool === 'balloontext' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
              title="Balloon (BL)"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" 
                   strokeWidth="2" fill="none" className="text-gray-200">
                <circle cx="12" cy="10" r="6"></circle>
                <path d="M12 16v5"></path>
              </svg>
            </button>
            <button 
              onClick={() => setActiveTool('partslist')}
              className={`p-2 rounded ${activeTool === 'partslist' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
              title="Parts List (PL)"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" 
                   strokeWidth="2" fill="none" className="text-gray-200">
                <rect x="4" y="4" width="16" height="16" rx="2"></rect>
                <line x1="4" y1="10" x2="20" y2="10"></line>
                <line x1="10" y1="4" x2="10" y2="20"></line>
              </svg>
            </button>
          </div>
          <div className="text-center text-xs text-gray-500 mt-1">BOM</div>
        </div>
      </div>
    ),
    
    view: (
      <div className="flex items-center space-x-4">
        <div className="border-r border-gray-700 pr-4">
          <div className="flex space-x-1">
            <button 
              onClick={() => zoomToFit()}
              className="p-2 rounded hover:bg-gray-700"
              title="Zoom Extents (ZE)"
            >
              <Maximize2 size={20} className="text-gray-200" />
            </button>
            <button 
              onClick={() => setActiveTool('pan')}
              className={`p-2 rounded ${activeTool === 'pan' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
              title="Pan (P)"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" 
                   strokeWidth="2" fill="none" className="text-gray-200">
                <path d="M14 7l-5 5 5 5"></path>
              </svg>
            </button>
          </div>
          <div className="text-center text-xs text-gray-500 mt-1">Navigation</div>
        </div>
        
        <div className="border-r border-gray-700 pr-4">
          <div className="flex space-x-1">
            <button 
              onClick={() => {
                setRightPanelContent('viewports');
                setIsRightPanelOpen(true);
              }}
              className={`p-2 rounded ${rightPanelContent === 'viewports' && isRightPanelOpen ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
              title="Viewports (VP)"
            >
              <Layout size={20} className="text-gray-200" />
            </button>
            <button 
              onClick={() => {
                setRightPanelContent('layers');
                setIsRightPanelOpen(true);
              }}
              className={`p-2 rounded ${rightPanelContent === 'layers' && isRightPanelOpen ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
              title="Layers (LA)"
            >
              <Layers size={20} className="text-gray-200" />
            </button>
          </div>
          <div className="text-center text-xs text-gray-500 mt-1">Display</div>
        </div>
        
        <div>
          <div className="flex space-x-1">
            <button 
              onClick={() => setActiveTool('measure-distance')}
              className={`p-2 rounded ${activeTool === 'measure-distance' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
              title="Measure Distance (MD)"
            >
              <Ruler size={20} className="text-gray-200" />
            </button>
            <button 
              onClick={() => setActiveTool('measure-angle')}
              className={`p-2 rounded ${activeTool === 'measure-angle' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
              title="Measure Angle (MA)"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" 
                   strokeWidth="2" fill="none" className="text-gray-200">
                <path d="M15 12h3"></path>
                <path d="M12 12a3 3 0 1 0 -3 -3"></path>
                <path d="M12 12v9"></path>
              </svg>
            </button>
          </div>
          <div className="text-center text-xs text-gray-500 mt-1">Measure</div>
        </div>
      </div>
    )
  };
  
  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden">
      <Head>
        <title>CAD Technical Drawing</title>
        <meta name="description" content="Advanced technical drawing application" />
      </Head>
      
      {/* Header Bar */}
      <header className="bg-gray-900 text-white border-b border-gray-700 py-2 px-4 flex items-center justify-between shadow-md z-30">
        <div className="flex items-center">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center text-gray-300 hover:text-white mr-4 transition-colors duration-150"
          >
            <Menu size={18} className="mr-2" />
            <span className="font-medium">Menu</span>
          </button>
          <div className="flex items-center">
            <button
              className={`flex items-center px-3 py-1.5 rounded-md text-white ${workingMode === '2D' ? 'bg-blue-900 hover:bg-blue-800' : 'bg-gray-800 hover:bg-gray-700'} font-medium mr-2`}
              onClick={() => setWorkingMode('2D')}
            >
              <span>2D</span>
            </button>
            <button
              className={`flex items-center px-3 py-1.5 rounded-md text-white ${workingMode === '3D-to-2D' ? 'bg-blue-900 hover:bg-blue-800' : 'bg-gray-800 hover:bg-gray-700'} font-medium`}
              onClick={() => setWorkingMode('3D-to-2D')}
            >
              <span>3D-to-2D</span>
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {workingMode === '3D-to-2D' && (
            <button
              onClick={handleGenerateViews}
              className="flex items-center px-4 py-1.5 border border-gray-600 rounded-md text-gray-300 hover:bg-gray-700 transition-colors duration-150 font-medium"
            >
              <Aperture size={16} className="mr-1.5" />
              <span>Generate Views</span>
            </button>
          )}
          
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center px-4 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-md text-white transition-colors duration-150 font-medium"
          >
            <Download size={16} className="mr-1.5" />
            <span>Export</span>
          </button>
          
          <button
            onClick={() => router.push('/cad')}
            className="flex items-center text-gray-300 hover:text-white transition-colors duration-150"
          >
            <ArrowLeft size={18} className="mr-1.5" />
            <span className="font-medium">Back</span>
          </button>
        </div>
      </header>
      
      {/* Main Menu - conditionally rendered */}
      {isMenuOpen && (
        <div className="absolute top-12 left-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-40 w-64 overflow-hidden transition-all duration-150">
          <div className="py-1">
            <button
              onClick={handleNewDrawing}
              className="flex items-center w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 transition-colors duration-150"
            >
              <FileText size={16} className="mr-2.5 text-gray-400" />
              <span>New Drawing</span>
              <span className="ml-auto text-xs text-gray-500">Ctrl+N</span>
            </button>
            <button
              className="flex items-center w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 transition-colors duration-150"
            >
              <Save size={16} className="mr-2.5 text-gray-400" />
              <span>Save Drawing</span>
              <span className="ml-auto text-xs text-gray-500">Ctrl+S</span>
            </button>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 transition-colors duration-150"
            >
              <Download size={16} className="mr-2.5 text-gray-400" />
              <span>Export Drawing</span>
              <span className="ml-auto text-xs text-gray-500">Ctrl+E</span>
            </button>
            <div className="border-t border-gray-700 my-1"></div>
            <button
              onClick={() => setWorkingMode(workingMode === '2D' ? '3D-to-2D' : '2D')}
              className="flex items-center w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 transition-colors duration-150"
            >
              <Tool size={16} className="mr-2.5 text-gray-400" />
              <span>{workingMode === '2D' ? 'Switch to 3D-to-2D Mode' : 'Switch to 2D Mode'}</span>
            </button>
            <button
              onClick={() => setShowHelpPanel(!showHelpPanel)}
              className="flex items-center w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 transition-colors duration-150"
            >
              <HelpCircle size={16} className="mr-2.5 text-gray-400" />
              <span>Help</span>
              <span className="ml-auto text-xs text-gray-500">F1</span>
            </button>
          </div>
        </div>
      )}
      
      {/* Export Menu - conditionally rendered */}
      {showExportMenu && (
        <div className="absolute top-12 right-[150px] mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-40 w-56 overflow-hidden transition-all duration-150">
          <div className="py-1">
            <div className="px-4 py-2 bg-gray-750 border-b border-gray-700">
              <h3 className="text-sm font-semibold text-gray-300">Export Options</h3>
            </div>
            <button
              onClick={() => handleExport('dxf')}
              className="flex items-center w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 transition-colors duration-150"
            >
              <FileText size={16} className="mr-2.5 text-gray-400" />
              <span>Export as DXF</span>
              <span className="ml-auto text-xs text-gray-500">CAD</span>
            </button>
            <button
              onClick={() => handleExport('svg')}
              className="flex items-center w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 transition-colors duration-150"
            >
              <FileText size={16} className="mr-2.5 text-gray-400" />
              <span>Export as SVG</span>
              <span className="ml-auto text-xs text-gray-500">Vector</span>
            </button>
            <button
              onClick={() => handleExport('png')}
              className="flex items-center w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 transition-colors duration-150"
            >
              <FileText size={16} className="mr-2.5 text-gray-400" />
              <span>Export as PNG</span>
              <span className="ml-auto text-xs text-gray-500">Image</span>
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="flex items-center w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 transition-colors duration-150"
            >
              <FileText size={16} className="mr-2.5 text-gray-400" />
              <span>Export as PDF</span>
              <span className="ml-auto text-xs text-gray-500">Document</span>
            </button>
            <button
              onClick={() => handleExport('dwg')}
              className="flex items-center w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 transition-colors duration-150"
            >
              <FileText size={16} className="mr-2.5 text-gray-400" />
              <span>Export as DWG</span>
              <span className="ml-auto text-xs text-gray-500">AutoCAD</span>
            </button>
          </div>
        </div>
      )}
      
      {/* Ribbon Tabs */}
      <div className="bg-gray-850 border-b border-gray-700 z-20">
        <div className="flex">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex items-center py-2 px-4 ${activeTab === 'home' ? 'bg-gray-900 text-blue-400 border-t-2 border-blue-500' : 'text-gray-400 hover:text-gray-300 border-t-2 border-transparent'}`}
          >
            <Home size={16} className="mr-1.5" />
            <span className="font-medium">Home</span>
          </button>
          <button
            onClick={() => setActiveTab('draw')}
            className={`flex items-center py-2 px-4 ${activeTab === 'draw' ? 'bg-gray-900 text-blue-400 border-t-2 border-blue-500' : 'text-gray-400 hover:text-gray-300 border-t-2 border-transparent'}`}
          >
            <Edit size={16} className="mr-1.5" />
            <span className="font-medium">Draw</span>
          </button>
          <button
            onClick={() => setActiveTab('modify')}
            className={`flex items-center py-2 px-4 ${activeTab === 'modify' ? 'bg-gray-900 text-blue-400 border-t-2 border-blue-500' : 'text-gray-400 hover:text-gray-300 border-t-2 border-transparent'}`}
          >
            <Tool size={16} className="mr-1.5" />
            <span className="font-medium">Modify</span>
          </button>
          <button
            onClick={() => setActiveTab('annotate')}
            className={`flex items-center py-2 px-4 ${activeTab === 'annotate' ? 'bg-gray-900 text-blue-400 border-t-2 border-blue-500' : 'text-gray-400 hover:text-gray-300 border-t-2 border-transparent'}`}
          >
            <Info size={16} className="mr-1.5" />
            <span className="font-medium">Annotate</span>
          </button>
          <button
            onClick={() => setActiveTab('mechanical')}
            className={`flex items-center py-2 px-4 ${activeTab === 'mechanical' ? 'bg-gray-900 text-blue-400 border-t-2 border-blue-500' : 'text-gray-400 hover:text-gray-300 border-t-2 border-transparent'}`}
          >
            <Aperture size={16} className="mr-1.5" />
            <span className="font-medium">Mechanical</span>
          </button>
          <button
            onClick={() => setActiveTab('view')}
            className={`flex items-center py-2 px-4 ${activeTab === 'view' ? 'bg-gray-900 text-blue-400 border-t-2 border-blue-500' : 'text-gray-400 hover:text-gray-300 border-t-2 border-transparent'}`}
          >
            <Eye size={16} className="mr-1.5" />
            <span className="font-medium">View</span>
          </button>
        </div>
        
        {/* Ribbon Content */}
        <div className="bg-gray-900 py-2 px-4 border-b border-gray-700">
          {activeTab === 'home' && ribbonTabs.home}
          {activeTab === 'draw' && ribbonTabs.draw}
          {activeTab === 'modify' && ribbonTabs.modify}
          {activeTab === 'annotate' && ribbonTabs.annotate}
          {activeTab === 'mechanical' && ribbonTabs.mechanical}
          {activeTab === 'view' && ribbonTabs.view}
        </div>
      </div>
      <div className="flex-1 flex relative">
      <div className="w-64 bg-white border-r border-gray-200 shadow-lg ">
        <TechnicalDrawingToolbar />
        </div>
      {/* Main Content Area */}
      <div ref={canvasContainerRef} className="flex-1 relative">
      
        <TechnicalDrawingCanvas 
          width="100%" 
          height="100%" 
     
         
   

         
        />
        </div>
        {/* Right Hand Panel */}
        {isRightPanelOpen && (
          <div className="absolute top-0 right-0 h-full w-80 bg-gray-800 border-l border-gray-700 shadow-lg z-20 overflow-y-auto p-4">
            <button 
              onClick={() => setIsRightPanelOpen(false)} 
              className="absolute top-2 right-2 text-gray-400 hover:text-white"
            >
              <X size={18} />
            </button>
            {rightPanelContent === 'layers' && <LayerPanel onClose={() => setIsRightPanelOpen(false)} />}
            {rightPanelContent === 'properties' && selectedEntityIds.length > 0 && <PropertiesPanel entityIds={selectedEntityIds} onClose={() => setIsRightPanelOpen(false)} />}
            {rightPanelContent === 'properties' && selectedEntityIds.length === 0 && (
              <div className="text-gray-400 text-center mt-10">Select an entity to see its properties.</div>
            )}
            {rightPanelContent === 'blocks' && <BlocksPanel onClose={() => setIsRightPanelOpen(false)} />}
            {rightPanelContent === 'styles' && <div className="text-white">Styles Panel (TODO)</div>}
            {rightPanelContent === 'mechanical' && <MechanicalSymbolsPanel onClose={() => setIsRightPanelOpen(false)} />}
            {rightPanelContent === 'dimensions' && <DimensioningPanel />}
            {rightPanelContent === 'viewports' && <ViewportsPanel />}
            {rightPanelContent === 'settings' && <div className="text-white">Settings Panel (TODO)</div>}
            {rightPanelContent === 'sheet-setup' && <SheetSetupPanel />}
            {rightPanelContent === 'gdt' && <GeometricTolerancePanel onClose={() => setIsRightPanelOpen(false)}/>}

            {/* Fallback for unhandled content */}
            {!['layers', 'properties', 'tools', 'blocks', 'styles', 'mechanical', 'dimensions', 'viewports', 'settings', 'sheet-setup', 'gdt'].includes(rightPanelContent) && (
                 <div className="text-gray-400 text-center mt-10">Panel content not available yet.</div>
            )}
          </div>
        )}
      </div>
      
      {/* Command Bar */}
      {showCommandPanel && (
        <div className="bg-gray-900 border-t border-gray-700 py-2 px-4">
          <div className="flex items-center">
            <Command size={16} className="text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Type a command..."
              className="flex-1 bg-gray-800 text-white border border-gray-700 rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={commandLineInput}
              onChange={(e) => setCommandLineInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCommandSubmit();
                }
              }}
            />
          </div>
        </div>
      )}
      
      {/* Help Panel - conditionally rendered */}
      {showHelpPanel && (
        <div className="absolute top-16 right-4 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 w-96 max-h-[calc(100vh-8rem)] overflow-y-auto">
          <div className="px-4 py-3 bg-gray-750 border-b border-gray-700 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-gray-300">Help & Shortcuts</h3>
            <button 
              onClick={() => setShowHelpPanel(false)}
              className="text-gray-400 hover:text-gray-200"
            >
              <X size={16} />
            </button>
          </div>
          <div className="p-4">
            <h4 className="text-sm font-medium text-gray-300 mb-2">Common Shortcuts</h4>
            <div className="space-y-1 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-400">F1</span>
                <span className="text-gray-300">Show help panel</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Ctrl+N</span>
                <span className="text-gray-300">New drawing</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Ctrl+S</span>
                <span className="text-gray-300">Save drawing</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Ctrl+E</span>
                <span className="text-gray-300">Export drawing</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">F7</span>
                <span className="text-gray-300">Toggle grid</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">F8</span>
                <span className="text-gray-300">Toggle ortho mode</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">F9</span>
                <span className="text-gray-300">Toggle snap</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Escape</span>
                <span className="text-gray-300">Cancel current operation</span>
              </div>
            </div>
            
            <h4 className="text-sm font-medium text-gray-300 mb-2">Tool Shortcuts</h4>
            <div className="space-y-1 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-400">L</span>
                <span className="text-gray-300">Line tool</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">C</span>
                <span className="text-gray-300">Circle tool</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">A</span>
                <span className="text-gray-300">Arc tool</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">R</span>
                <span className="text-gray-300">Rectangle tool</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">P</span>
                <span className="text-gray-300">Polyline tool</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">T</span>
                <span className="text-gray-300">Text tool</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">D</span>
                <span className="text-gray-300">Dimension tool</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">M</span>
                <span className="text-gray-300">Move tool</span>
              </div>
            </div>
            
            <h4 className="text-sm font-medium text-gray-300 mb-2">Mouse Controls</h4>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-400">Left Click</span>
                <span className="text-gray-300">Select or place point</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Right Click</span>
                <span className="text-gray-300">Context menu</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Scroll Wheel</span>
                <span className="text-gray-300">Zoom in/out</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Middle Click + Drag</span>
                <span className="text-gray-300">Pan view</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Double Click</span>
                <span className="text-gray-300">Edit properties / complete action</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TechnicalPage;