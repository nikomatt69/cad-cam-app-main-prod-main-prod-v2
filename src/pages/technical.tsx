// src/pages/technical.tsx

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { TechnicalDrawingCanvas } from '../components/cad/technical-drawing/TechnicalDrawingCanvas';
import { SheetSetupPanel } from '../components/cad/technical-drawing/SheetSetupPanel';
import { ViewportsPanel } from '../components/cad/technical-drawing/ViewportsPanel';
import { DimensioningPanel } from '../components/cad/technical-drawing/DimensioningPanel';
import { LayerPanel } from '../components/cad/technical-drawing/LayerPanel';
import { PropertiesPanel } from '../components/cad/technical-drawing/PropertiesPanel';
import { CommandLine } from '../components/cad/technical-drawing/CommandLine';
import { StatusBar } from '../components/cad/technical-drawing/StatusBar';
import { useTechnicalDrawingStore } from '../store/technicalDrawingStore';
import { useElementsStore } from '../store/elementsStore';
import { 
  Menu, 
  X, 
  Settings, 
  Layers, 
  Save, 
  Download, 
  ArrowLeft, 
  Plus,
  Grid,
  Copy,
  Clipboard,
  FileText,
  ChevronRight,
  ChevronDown,
  Info,
  HelpCircle,
  Tool,
  PenTool,
  Sliders,
  Type,
  Compass,
  CornerDownRight,
  ArrowUp,
  Hash,
  MousePointer,
  Square,
  Slash,
  Circle,
  Scissors,
  ArrowRight,
  Move,
  List,
  Octagon,
  RefreshCw,
  Maximize
} from 'react-feather';
import { convert3DTo2D, createOrthographicViews } from 'src/lib/model3dTo2dConverter';
import { exportToDXF, exportToSVG, exportToPNG } from '../lib/drawingExportUtil';
import { initializeTechnicalDrawingStore } from '../store/technicalDrawingStore';
import { DrawingEntity } from '../types/TechnicalDrawingTypes';
import { PenTool as PenToolIcon, Info as InfoIcon, Sliders as SlidersIcon, Eye, Lock } from 'react-feather';
import MetaTags from '../components/layout/Metatags';
import Layout from '../components/layout/Layout';
import { TechnicalDrawingToolbar } from '../components/cad/technical-drawing/TechnicalDrawingToolbar';

const TechnicalDrawingPage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Panel states
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [rightPanelTab, setRightPanelTab] = useState<'properties' | 'layers' | 'sheet' | 'dimension' | 'viewport' | 'styles' | 'mechanical' | 'blocks'>('sheet');
  const [rightPanelWidth, setRightPanelWidth] = useState(320);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showMainMenu, setShowMainMenu] = useState(false);
  const [showHelpPanel, setShowHelpPanel] = useState(false);
  const [showCommandLinePanel, setShowCommandLinePanel] = useState(true);
  const [showRibbonTabs, setShowRibbonTabs] = useState(true);
  const [activeRibbonTab, setActiveRibbonTab] = useState<'home' | 'draw' | 'modify' | 'annotate' | 'view' | 'format' | 'mechanical'>('home');
  const [workingMode, setWorkingMode] = useState<'2D' | '3D-to-2D'>('2D');
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const commandHistoryRef = useRef<string[]>([]);
  
  // Get technical drawing state
  const { 
    entities, 
    dimensions, 
    annotations, 
    viewports, 
    sheet, 
    drawingStandard,
    zoom,
    setZoom,
    zoomToFit,
    zoomToSelection,
    updateSheet,
    selectedEntityIds,
    clearSelection,
    setActiveTool,
    activeTool,
    addViewport,
    setActiveViewport,
    addEntity,
    updateViewport,
    gridEnabled,
    toggleGrid,
    orthoMode,
    toggleOrthoMode,
    snappingEnabled,
    toggleSnapping,
    drawingLayers,
    activeLayer
  } = useTechnicalDrawingStore();
  
  // Get 3D elements for conversion
  const { elements } = useElementsStore();
  
  // Initialize the technical drawing store when the component mounts
  useEffect(() => {
    initializeTechnicalDrawingStore();
  }, []);
  
  // Convert 3D to 2D and add to drawing
  const handleConvert3DTo2D = () => {
    const viewType = 'front';
    const convertedEntities = convert3DTo2D(elements, viewType);
    
    if (convertedEntities.length === 0) {
      alert('No entities were created from the 3D model.');
      return;
    }
    
    const { addEntity } = useTechnicalDrawingStore.getState();
    convertedEntities.forEach((entity: DrawingEntity) => {
      addEntity({
        ...entity
      });
    });
    
    alert(`Converted ${convertedEntities.length} entities from 3D to 2D.`);
  };
  
  // Generate orthographic views
  const handleGenerateViews = () => {
    // Clear current selection
    clearSelection();
    
    // Create front, top, and side views
    const views = createOrthographicViews(elements);
    
    if (Object.values(views).every(entities => entities.length === 0)) {
      alert('No entities were created from the 3D model.');
      return;
    }
    
    // Create viewports for each view
    const frontViewId = addViewport({
      name: 'Front View',
      type: 'front',
      position: { x: 50, y: 50 },
      width: 150,
      height: 100,
      scale: 1,
      entities: []
    });
    
    const topViewId = addViewport({
      name: 'Top View',
      type: 'top',
      position: { x: 50, y: 200 },
      width: 150,
      height: 100,
      scale: 1,
      entities: []
    });
    
    const sideViewId = addViewport({
      name: 'Right View',
      type: 'side',
      position: { x: 250, y: 50 },
      width: 150,
      height: 100,
      scale: 1,
      entities: []
    });
    
    // Add isometric view if elements are 3D
    const isoViewId = addViewport({
      name: 'Isometric View',
      type: 'isometric',
      position: { x: 250, y: 200 },
      width: 150,
      height: 100,
      scale: 1,
      entities: []
    });
    
    setActiveViewport(frontViewId);
    
    const viewportEntities: Record<string, string[]> = {
      [frontViewId]: [],
      [topViewId]: [],
      [sideViewId]: [],
      [isoViewId]: []
    };
    
    // Add entities to each viewport
    views.front.forEach((entity: DrawingEntity) => {
      const entityId = addEntity({ ...entity });
      viewportEntities[frontViewId].push(entityId);
    });
    
    views.top.forEach((entity: DrawingEntity) => {
      const entityId = addEntity({ ...entity });
      viewportEntities[topViewId].push(entityId);
    });
    
    views.side.forEach((entity: DrawingEntity) => {
      const entityId = addEntity({ ...entity });
      viewportEntities[sideViewId].push(entityId);
    });
    
    // Generate isometric view entities
    views.isometric?.forEach((entity: DrawingEntity) => {
      const entityId = addEntity({ ...entity });
      viewportEntities[isoViewId].push(entityId);
    });
    
    // Update viewports with entity IDs
    Object.entries(viewportEntities).forEach(([viewportId, entityIds]) => {
      updateViewport(viewportId, {
        entities: entityIds
      });
    });
    
    // Switch to viewport tab in the right panel
    setRightPanelTab('viewport');
    setRightPanelOpen(true);
    
    // Show success message
    alert('Orthographic views created successfully. Added front, top, right, and isometric views.');
  };
  
  // Export drawing
  const handleExport = (format: 'dxf' | 'svg' | 'png' | 'pdf' | 'dwg') => {
    switch (format) {
      case 'dxf':
        exportToDXF(entities, dimensions, annotations, sheet);
        break;
      case 'svg':
        exportToSVG(entities, dimensions, annotations, sheet, viewports);
        break;
      case 'png':
        // Find the canvas element
        if (canvasRef.current) {
          const canvas = canvasRef.current.querySelector('canvas');
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
  };

  // Create a new empty drawing
  const handleNewDrawing = () => {
    if (Object.keys(entities).length > 0 || Object.keys(dimensions).length > 0 || Object.keys(annotations).length > 0) {
      if (confirm('Creating a new drawing will discard your current work. Continue?')) {
        initializeTechnicalDrawingStore();
        setActiveTool('select');
      }
    } else {
      initializeTechnicalDrawingStore();
      setActiveTool('select');
    }
    
    setShowMainMenu(false);
  };

  // Handle keyboard shortcuts for panel size
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt+Shift+Right Arrow to increase panel width
      if (e.altKey && e.shiftKey && e.key === 'ArrowRight' && rightPanelOpen) {
        setRightPanelWidth(prev => Math.min(prev + 40, 480));
      }
      
      // Alt+Shift+Left Arrow to decrease panel width
      if (e.altKey && e.shiftKey && e.key === 'ArrowLeft' && rightPanelOpen) {
        setRightPanelWidth(prev => Math.max(prev - 40, 240));
      }
      
      // Alt+Shift+P to toggle panel
      if (e.altKey && e.shiftKey && e.key === 'p') {
        setRightPanelOpen(prev => !prev);
      }
      
      // Ctrl+N for new drawing
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        handleNewDrawing();
      }
      
      // Ctrl+S for save
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        // Implement save functionality here
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

      // F2 for command line
      if (e.key === 'F2') {
        e.preventDefault();
        setShowCommandLinePanel(prev => !prev);
      }
      
      // F10 to toggle ribbon tabs
      if (e.key === 'F10') {
        e.preventDefault();
        setShowRibbonTabs(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [rightPanelOpen, rightPanelWidth]);
  
  // Process command from command line
  const handleCommand = (command: string) => {
    // Add command to history
    commandHistoryRef.current = [...commandHistoryRef.current, command];
    
    // Process command
    const parts = command.trim().toLowerCase().split(' ');
    const cmdName = parts[0];
    
    switch (cmdName) {
      case 'line':
      case 'l':
        setActiveTool('line');
        break;
      case 'circle':
      case 'c':
        setActiveTool('circle');
        break;
      case 'rectangle':
      case 'rect':
      case 'r':
        setActiveTool('rectangle');
        break;
      case 'arc':
      case 'a':
        setActiveTool('arc');
        break;
      case 'polyline':
      case 'pl':
        setActiveTool('polyline');
        break;
      case 'ellipse':
      case 'el':
        setActiveTool('ellipse');
        break;
      case 'text':
      case 't':
        setActiveTool('text');
        break;
      case 'dim':
      case 'linear':
        setActiveTool('dimension-linear');
        break;
      case 'dimangular':
        setActiveTool('dimension-angular');
        break;
      case 'dimradius':
        setActiveTool('dimension-radius');
        break;
      case 'dimdiameter':
        setActiveTool('dimension-diameter');
        break;
      case 'leader':
        setActiveTool('leader');
        break;
      case 'centermark':
      case 'center':
        setActiveTool('centermark');
        break;
      case 'centerline':
        setActiveTool('centerline');
        break;
      case 'hatch':
      case 'h':
        setActiveTool('hatch');
        break;
      case 'grid':
        toggleGrid();
        break;
      case 'snap':
        toggleSnapping();
        break;
      case 'ortho':
        toggleOrthoMode();
        break;
      case 'zoom':
        const subCmd = parts[1];
        if (subCmd === 'in') {
          setZoom(zoom * 1.2);
        } else if (subCmd === 'out') {
          setZoom(zoom * 0.8);
        } else if (subCmd === 'all' || subCmd === 'fit') {
          zoomToFit();
        } else if (subCmd === 'selection' || subCmd === 'sel') {
          zoomToSelection();
        } else {
          try {
            const factor = parseFloat(subCmd);
            if (!isNaN(factor)) {
              setZoom(factor);
            }
          } catch (e) {
            console.error('Invalid zoom factor');
          }
        }
        break;
      default:
        console.log(`Command not recognized: ${command}`);
    }
  };
  
  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }
  
  // Ribbon tabs definition
  const ribbonTabs = {
    home: (
      <div className="flex space-x-1 p-1">
        {/* Selection group */}
        <div className="border-r border-gray-700 pr-4 flex items-center space-x-2">
          <button 
            onClick={() => setActiveTool('select')}
            className={`p-2 rounded-md ${activeTool === 'select' ? 'bg-blue-900 text-blue-300' : 'text-gray-300 hover:bg-gray-700'}`}
            title="Select (S)"
          >
            <MousePointer size={18} />
          </button>
          <div className="flex flex-col items-center">
            <button 
              onClick={() => setActiveTool('select-window')}
              className={`p-2 rounded-md ${activeTool === 'select-window' ? 'bg-blue-900 text-blue-300' : 'text-gray-300 hover:bg-gray-700'}`}
              title="Window Select"
            >
              <Square size={18} />
            </button>
            <span className="text-xs text-gray-400 mt-1">Window</span>
          </div>
          <div className="flex flex-col items-center">
            <button 
              onClick={() => setActiveTool('select-crossing')}
              className={`p-2 rounded-md ${activeTool === 'select-crossing' ? 'bg-blue-900 text-blue-300' : 'text-gray-300 hover:bg-gray-700'}`}
              title="Crossing Select"
            >
              <X size={18} />
            </button>
            <span className="text-xs text-gray-400 mt-1">Crossing</span>
          </div>
        </div>
        
        {/* Draw group */}
        <div className="border-r border-gray-700 pr-4 flex items-center space-x-2">
          <div className="flex flex-col items-center">
            <button 
              onClick={() => setActiveTool('line')}
              className={`p-2 rounded-md ${activeTool === 'line' ? 'bg-blue-900 text-blue-300' : 'text-gray-300 hover:bg-gray-700'}`}
              title="Line (L)"
            >
              <Slash size={18} />
            </button>
            <span className="text-xs text-gray-400 mt-1">Line</span>
          </div>
          <div className="flex flex-col items-center">
            <button 
              onClick={() => setActiveTool('circle')}
              className={`p-2 rounded-md ${activeTool === 'circle' ? 'bg-blue-900 text-blue-300' : 'text-gray-300 hover:bg-gray-700'}`}
              title="Circle (C)"
            >
              <Circle size={18} />
            </button>
            <span className="text-xs text-gray-400 mt-1">Circle</span>
          </div>
          <div className="flex flex-col items-center">
            <button 
              onClick={() => setActiveTool('arc')}
              className={`p-2 rounded-md ${activeTool === 'arc' ? 'bg-blue-900 text-blue-300' : 'text-gray-300 hover:bg-gray-700'}`}
              title="Arc (A)"
            >
              <Compass size={18} />
            </button>
            <span className="text-xs text-gray-400 mt-1">Arc</span>
          </div>
          <div className="flex flex-col items-center">
            <button 
              onClick={() => setActiveTool('rectangle')}
              className={`p-2 rounded-md ${activeTool === 'rectangle' ? 'bg-blue-900 text-blue-300' : 'text-gray-300 hover:bg-gray-700'}`}
              title="Rectangle (RECT)"
            >
              <Square size={18} />
            </button>
            <span className="text-xs text-gray-400 mt-1">Rectangle</span>
          </div>
        </div>
        
        {/* Modify group */}
        <div className="border-r border-gray-700 pr-4 flex items-center space-x-2">
          <div className="flex flex-col items-center">
            <button 
              onClick={() => setActiveTool('move')}
              className={`p-2 rounded-md ${activeTool === 'move' ? 'bg-blue-900 text-blue-300' : 'text-gray-300 hover:bg-gray-700'}`}
              title="Move (M)"
            >
              <Move size={18} />
            </button>
            <span className="text-xs text-gray-400 mt-1">Move</span>
          </div>
          <div className="flex flex-col items-center">
            <button 
              onClick={() => setActiveTool('copy')}
              className={`p-2 rounded-md ${activeTool === 'copy' ? 'bg-blue-900 text-blue-300' : 'text-gray-300 hover:bg-gray-700'}`}
              title="Copy (CO)"
            >
              <Copy size={18} />
            </button>
            <span className="text-xs text-gray-400 mt-1">Copy</span>
          </div>
          <div className="flex flex-col items-center">
            <button 
              onClick={() => setActiveTool('trim')}
              className={`p-2 rounded-md ${activeTool === 'trim' ? 'bg-blue-900 text-blue-300' : 'text-gray-300 hover:bg-gray-700'}`}
              title="Trim (TR)"
            >
              <Scissors size={18} />
            </button>
            <span className="text-xs text-gray-400 mt-1">Trim</span>
          </div>
        </div>
        
        {/* Annotation group */}
        <div className="border-r border-gray-700 pr-4 flex items-center space-x-2">
          <div className="flex flex-col items-center">
            <button 
              onClick={() => setActiveTool('dimension-linear')}
              className={`p-2 rounded-md ${activeTool === 'dimension-linear' ? 'bg-blue-900 text-blue-300' : 'text-gray-300 hover:bg-gray-700'}`}
              title="Linear Dimension (DIM)"
            >
              <ArrowRight size={18} />
            </button>
            <span className="text-xs text-gray-400 mt-1">Dimension</span>
          </div>
          <div className="flex flex-col items-center">
            <button 
              onClick={() => setActiveTool('text')}
              className={`p-2 rounded-md ${activeTool === 'text' ? 'bg-blue-900 text-blue-300' : 'text-gray-300 hover:bg-gray-700'}`}
              title="Text (T)"
            >
              <Type size={18} />
            </button>
            <span className="text-xs text-gray-400 mt-1">Text</span>
          </div>
          <div className="flex flex-col items-center">
            <button 
              onClick={() => setActiveTool('leader')}
              className={`p-2 rounded-md ${activeTool === 'leader' ? 'bg-blue-900 text-blue-300' : 'text-gray-300 hover:bg-gray-700'}`}
              title="Leader (LE)"
            >
              <CornerDownRight size={18} />
            </button>
            <span className="text-xs text-gray-400 mt-1">Leader</span>
          </div>
        </div>
        
        {/* Layers and Properties group */}
        <div className="flex items-center space-x-2">
          <div className="flex flex-col items-center">
            <button 
              onClick={() => setRightPanelTab('layers')}
              className={`p-2 rounded-md ${rightPanelTab === 'layers' ? 'bg-blue-900 text-blue-300' : 'text-gray-300 hover:bg-gray-700'}`}
              title="Layers (LA)"
            >
              <Layers size={18} />
            </button>
            <span className="text-xs text-gray-400 mt-1">Layers</span>
          </div>
          <div className="flex flex-col items-center">
            <button 
              onClick={() => setRightPanelTab('properties')}
              className={`p-2 rounded-md ${rightPanelTab === 'properties' ? 'bg-blue-900 text-blue-300' : 'text-gray-300 hover:bg-gray-700'}`}
              title="Properties (PR)"
            >
              <Sliders size={18} />
            </button>
            <span className="text-xs text-gray-400 mt-1">Properties</span>
          </div>
          <div className="flex flex-col items-center">
            <button 
              onClick={() => toggleGrid()}
              className={`p-2 rounded-md ${gridEnabled ? 'bg-blue-900 text-blue-300' : 'text-gray-300 hover:bg-gray-700'}`}
              title="Grid (F7)"
            >
              <Grid size={18} />
            </button>
            <span className="text-xs text-gray-400 mt-1">Grid</span>
          </div>
        </div>
      </div>
    ),
    
    mechanical: (
      <div className="flex space-x-1 p-1">
        {/* Centerline Tools */}
        <div className="border-r border-gray-700 pr-4 flex items-center space-x-2">
          <div className="flex flex-col items-center">
            <button 
              onClick={() => setActiveTool('centermark')}
              className={`p-2 rounded-md ${activeTool === 'centermark' ? 'bg-blue-900 text-blue-300' : 'text-gray-300 hover:bg-gray-700'}`}
              title="Center Mark (CM)"
            >
              <Plus size={18} />
            </button>
            <span className="text-xs text-gray-400 mt-1">Center Mark</span>
          </div>
          <div className="flex flex-col items-center">
            <button 
              onClick={() => setActiveTool('centerline')}
              className={`p-2 rounded-md ${activeTool === 'centerline' ? 'bg-blue-900 text-blue-300' : 'text-gray-300 hover:bg-gray-700'}`}
              title="Centerline (CL)"
            >
              <ArrowUp size={18} />
            </button>
            <span className="text-xs text-gray-400 mt-1">Centerline</span>
          </div>
        </div>
        
        {/* Symbols */}
        <div className="border-r border-gray-700 pr-4 flex items-center space-x-2">
          <div className="flex flex-col items-center">
            <button 
              onClick={() => setActiveTool('weldsymbol')}
              className={`p-2 rounded-md ${activeTool === 'weldsymbol' ? 'bg-blue-900 text-blue-300' : 'text-gray-300 hover:bg-gray-700'}`}
              title="Weld Symbol (WELD)"
            >
              <Hash size={18} />
            </button>
            <span className="text-xs text-gray-400 mt-1">Weld Symbol</span>
          </div>
          <div className="flex flex-col items-center">
            <button 
              onClick={() => setActiveTool('surface-finish')}
              className={`p-2 rounded-md ${activeTool === 'surface-finish' ? 'bg-blue-900 text-blue-300' : 'text-gray-300 hover:bg-gray-700'}`}
              title="Surface Finish (SF)"
            >
              <Hash size={18} />
            </button>
            <span className="text-xs text-gray-400 mt-1">Surface Finish</span>
          </div>
          <div className="flex flex-col items-center">
            <button 
              onClick={() => setActiveTool('feature-control-frame')}
              className={`p-2 rounded-md ${activeTool === 'feature-control-frame' ? 'bg-blue-900 text-blue-300' : 'text-gray-300 hover:bg-gray-700'}`}
              title="Feature Control Frame (FCF)"
            >
              <Square size={18} />
            </button>
            <span className="text-xs text-gray-400 mt-1">GD&T</span>
          </div>
        </div>
        
        {/* BOM and Callouts */}
        <div className="border-r border-gray-700 pr-4 flex items-center space-x-2">
          <div className="flex flex-col items-center">
            <button 
              onClick={() => setActiveTool('balloontext')}
              className={`p-2 rounded-md ${activeTool === 'balloontext' ? 'bg-blue-900 text-blue-300' : 'text-gray-300 hover:bg-gray-700'}`}
              title="Balloon Text (BT)"
            >
              <Circle size={18} />
            </button>
            <span className="text-xs text-gray-400 mt-1">Balloon</span>
          </div>
          <div className="flex flex-col items-center">
            <button 
              onClick={() => setActiveTool('partslist')}
              className={`p-2 rounded-md ${activeTool === 'partslist' ? 'bg-blue-900 text-blue-300' : 'text-gray-300 hover:bg-gray-700'}`}
              title="Parts List (PL)"
            >
              <List size={18} />
            </button>
            <span className="text-xs text-gray-400 mt-1">Parts List</span>
          </div>
        </div>
        
        {/* Section Views */}
        <div className="flex items-center space-x-2">
          <div className="flex flex-col items-center">
            <button 
              onClick={() => setActiveTool('section-line')}
              className={`p-2 rounded-md ${activeTool === 'section-line' ? 'bg-blue-900 text-blue-300' : 'text-gray-300 hover:bg-gray-700'}`}
              title="Section Line (SL)"
            >
              <Slash size={18} />
            </button>
            <span className="text-xs text-gray-400 mt-1">Section Line</span>
          </div>
          <div className="flex flex-col items-center">
            <button 
              onClick={() => setActiveTool('hatch')}
              className={`p-2 rounded-md ${activeTool === 'hatch' ? 'bg-blue-900 text-blue-300' : 'text-gray-300 hover:bg-gray-700'}`}
              title="Hatch Pattern (H)"
            >
              <Grid size={18} />
            </button>
            <span className="text-xs text-gray-400 mt-1">Hatch</span>
          </div>
        </div>
      </div>
    ),
    
    draw: (
      <div className="flex space-x-1 p-1">
        {/* Lines */}
        <div className="border-r border-gray-700 pr-4 flex items-center space-x-2">
          <div className="flex flex-col items-center">
            <button 
              onClick={() => setActiveTool('line')}
              className={`p-2 rounded-md ${activeTool === 'line' ? 'bg-blue-900 text-blue-300' : 'text-gray-300 hover:bg-gray-700'}`}
              title="Line (L)"
            >
              <Slash size={18} />
            </button>
            <span className="text-xs text-gray-400 mt-1">Line</span>
          </div>
          <div className="flex flex-col items-center">
            <button 
              onClick={() => setActiveTool('polyline')}
              className={`p-2 rounded-md ${activeTool === 'polyline' ? 'bg-blue-900 text-blue-300' : 'text-gray-300 hover:bg-gray-700'}`}
              title="Polyline (PL)"
            >
              <PenTool size={18} />
            </button>
            <span className="text-xs text-gray-400 mt-1">Polyline</span>
          </div>
          <div className="flex flex-col items-center">
            <button 
              onClick={() => setActiveTool('construction-line')}
              className={`p-2 rounded-md ${activeTool === 'construction-line' ? 'bg-blue-900 text-blue-300' : 'text-gray-300 hover:bg-gray-700'}`}
              title="Construction Line (XL)"
            >
              <Slash size={18} className="opacity-50" />
            </button>
            <span className="text-xs text-gray-400 mt-1">Construction</span>
          </div>
        </div>
        
        {/* Circles and Arcs */}
        <div className="border-r border-gray-700 pr-4 flex items-center space-x-2">
          <div className="flex flex-col items-center">
            <button 
              onClick={() => setActiveTool('circle')}
              className={`p-2 rounded-md ${activeTool === 'circle' ? 'bg-blue-900 text-blue-300' : 'text-gray-300 hover:bg-gray-700'}`}
              title="Circle (C)"
            >
              <Circle size={18} />
            </button>
            <span className="text-xs text-gray-400 mt-1">Circle</span>
          </div>
          <div className="flex flex-col items-center">
            <button 
              onClick={() => setActiveTool('arc')}
              className={`p-2 rounded-md ${activeTool === 'arc' ? 'bg-blue-900 text-blue-300' : 'text-gray-300 hover:bg-gray-700'}`}
              title="Arc (A)"
            >
              <Compass size={18} />
            </button>
            <span className="text-xs text-gray-400 mt-1">Arc</span>
          </div>
          <div className="flex flex-col items-center">
            <button 
              onClick={() => setActiveTool('ellipse')}
              className={`p-2 rounded-md ${activeTool === 'ellipse' ? 'bg-blue-900 text-blue-300' : 'text-gray-300 hover:bg-gray-700'}`}
              title="Ellipse (EL)"
            >
              <Circle size={18} className="opacity-70" />
            </button>
            <span className="text-xs text-gray-400 mt-1">Ellipse</span>
          </div>
        </div>
        
        {/* Rectangles and Polygons */}
        <div className="border-r border-gray-700 pr-4 flex items-center space-x-2">
          <div className="flex flex-col items-center">
            <button 
              onClick={() => setActiveTool('rectangle')}
              className={`p-2 rounded-md ${activeTool === 'rectangle' ? 'bg-blue-900 text-blue-300' : 'text-gray-300 hover:bg-gray-700'}`}
              title="Rectangle (RECT)"
            >
              <Square size={18} />
            </button>
            <span className="text-xs text-gray-400 mt-1">Rectangle</span>
          </div>
          <div className="flex flex-col items-center">
            <button 
              onClick={() => setActiveTool('polygon')}
              className={`p-2 rounded-md ${activeTool === 'polygon' ? 'bg-blue-900 text-blue-300' : 'text-gray-300 hover:bg-gray-700'}`}
              title="Polygon (POL)"
            >
              <Octagon size={18} />
            </button>
            <span className="text-xs text-gray-400 mt-1">Polygon</span>
          </div>
        </div>
        
        {/* Curves */}
        <div className="flex items-center space-x-2">
          <div className="flex flex-col items-center">
            <button 
              onClick={() => setActiveTool('spline')}
              className={`p-2 rounded-md ${activeTool === 'spline' ? 'bg-blue-900 text-blue-300' : 'text-gray-300 hover:bg-gray-700'}`}
              title="Spline (SP)"
            >
              <PenTool size={18} />
            </button>
            <span className="text-xs text-gray-400 mt-1">Spline</span>
          </div>
          <div className="flex flex-col items-center">
            <button 
              onClick={() => setActiveTool('point')}
              className={`p-2 rounded-md ${activeTool === 'point' ? 'bg-blue-900 text-blue-300' : 'text-gray-300 hover:bg-gray-700'}`}
              title="Point (PO)"
            >
              <X size={18} className="transform scale-50" />
            </button>
            <span className="text-xs text-gray-400 mt-1">Point</span>
          </div>
        </div>
      </div>
    ),
    
    annotate: (
      <div className="flex space-x-1 p-1">
        {/* Dimension Group */}
        <div className="border-r border-gray-700 pr-4 flex items-center space-x-2">
          <div className="flex flex-col items-center">
            <button 
              onClick={() => setActiveTool('dimension-linear')}
              className={`p-2 rounded-md ${activeTool === 'dimension-linear' ? 'bg-blue-900 text-blue-300' : 'text-gray-300 hover:bg-gray-700'}`}
              title="Linear Dimension (DIMLIN)"
            >
              <ArrowRight size={18} />
            </button>
            <span className="text-xs text-gray-400 mt-1">Linear</span>
          </div>
          <div className="flex flex-col items-center">
            <button 
              onClick={() => setActiveTool('dimension-aligned')}
              className={`p-2 rounded-md ${activeTool === 'dimension-aligned' ? 'bg-blue-900 text-blue-300' : 'text-gray-300 hover:bg-gray-700'}`}
              title="Aligned Dimension (DIMALIGNED)"
            >
              <ArrowUp size={18} className="transform -rotate-45" />
            </button>
            <span className="text-xs text-gray-400 mt-1">Aligned</span>
          </div>
          <div className="flex flex-col items-center">
            <button 
              onClick={() => setActiveTool('dimension-angular')}
              className={`p-2 rounded-md ${activeTool === 'dimension-angular' ? 'bg-blue-900 text-blue-300' : 'text-gray-300 hover:bg-gray-700'}`}
              title="Angular Dimension (DIMANG)"
            >
              <Compass size={18} />
            </button>
            <span className="text-xs text-gray-400 mt-1">Angular</span>
          </div>
          <div className="flex flex-col items-center">
            <button 
              onClick={() => setActiveTool('dimension-radius')}
              className={`p-2 rounded-md ${activeTool === 'dimension-radius' ? 'bg-blue-900 text-blue-300' : 'text-gray-300 hover:bg-gray-700'}`}
              title="Radius Dimension (DIMRAD)"
            >
              <Circle size={18} />
            </button>
            <span className="text-xs text-gray-400 mt-1">Radius</span>
          </div>
          <div className="flex flex-col items-center">
            <button 
              onClick={() => setActiveTool('dimension-diameter')}
              className={`p-2 rounded-md ${activeTool === 'dimension-diameter' ? 'bg-blue-900 text-blue-300' : 'text-gray-300 hover:bg-gray-700'}`}
              title="Diameter Dimension (DIMDIA)"
            >
              <Circle size={18} className="font-bold" />
            </button>
            <span className="text-xs text-gray-400 mt-1">Diameter</span>
          </div>
        </div>
        
        {/* Leaders and Text */}
        <div className="border-r border-gray-700 pr-4 flex items-center space-x-2">
          <div className="flex flex-col items-center">
            <button 
              onClick={() => setActiveTool('leader')}
              className={`p-2 rounded-md ${activeTool === 'leader' ? 'bg-blue-900 text-blue-300' : 'text-gray-300 hover:bg-gray-700'}`}
              title="Leader (LE)"
            >
              <CornerDownRight size={18} />
            </button>
            <span className="text-xs text-gray-400 mt-1">Leader</span>
          </div>
          <div className="flex flex-col items-center">
            <button 
              onClick={() => setActiveTool('text')}
              className={`p-2 rounded-md ${activeTool === 'text' ? 'bg-blue-900 text-blue-300' : 'text-gray-300 hover:bg-gray-700'}`}
              title="Text (T)"
            >
              <Type size={18} />
            </button>
            <span className="text-xs text-gray-400 mt-1">Text</span>
          </div>
          <div className="flex flex-col items-center">
            <button 
              onClick={() => setActiveTool('mtext')}
              className={`p-2 rounded-md ${activeTool === 'mtext' ? 'bg-blue-900 text-blue-300' : 'text-gray-300 hover:bg-gray-700'}`}
              title="Multiline Text (MT)"
            >
              <Type size={18} className="font-bold" />
            </button>
            <span className="text-xs text-gray-400 mt-1">MText</span>
          </div>
        </div>
        
        {/* Tolerances and Tables */}
        <div className="flex items-center space-x-2">
          <div className="flex flex-col items-center">
            <button 
              onClick={() => setActiveTool('tolerance')}
              className={`p-2 rounded-md ${activeTool === 'tolerance' ? 'bg-blue-900 text-blue-300' : 'text-gray-300 hover:bg-gray-700'}`}
              title="Tolerance (TOL)"
            >
              <Hash size={18} />
            </button>
            <span className="text-xs text-gray-400 mt-1">Tolerance</span>
          </div>
          <div className="flex flex-col items-center">
            <button 
              onClick={() => setActiveTool('table')}
              className={`p-2 rounded-md ${activeTool === 'table' ? 'bg-blue-900 text-blue-300' : 'text-gray-300 hover:bg-gray-700'}`}
              title="Table (TB)"
            >
              <Grid size={18} />
            </button>
            <span className="text-xs text-gray-400 mt-1">Table</span>
          </div>
          <div className="flex flex-col items-center">
            <button 
              onClick={() => setRightPanelTab('dimension')}
              className={`p-2 rounded-md ${rightPanelTab === 'dimension' ? 'bg-blue-900 text-blue-300' : 'text-gray-300 hover:bg-gray-700'}`}
              title="Dimension Style"
            >
              <Settings size={18} />
            </button>
            <span className="text-xs text-gray-400 mt-1">Dim Style</span>
          </div>
        </div>
      </div>
    ),
    
    modify: (
      <div className="flex space-x-1 p-1">
        {/* Modify Group */}
        <div className="border-r border-gray-700 pr-4 flex items-center space-x-2">
          <div className="flex flex-col items-center">
            <button 
              onClick={() => setActiveTool('move')}
              className={`p-2 rounded-md ${activeTool === 'move' ? 'bg-blue-900 text-blue-300' : 'text-gray-300 hover:bg-gray-700'}`}
              title="Move (M)"
            >
              <Move size={18} />
            </button>
            <span className="text-xs text-gray-400 mt-1">Move</span>
          </div>
          <div className="flex flex-col items-center">
            <button 
              onClick={() => setActiveTool('copy')}
              className={`p-2 rounded-md ${activeTool === 'copy' ? 'bg-blue-900 text-blue-300' : 'text-gray-300 hover:bg-gray-700'}`}
              title="Copy (CO)"
            >
              <Copy size={18} />
            </button>
            <span className="text-xs text-gray-400 mt-1">Copy</span>
          </div>
          <div className="flex flex-col items-center">
            <button 
              onClick={() => setActiveTool('rotate')}
              className={`p-2 rounded-md ${activeTool === 'rotate' ? 'bg-blue-900 text-blue-300' : 'text-gray-300 hover:bg-gray-700'}`}
              title="Rotate (RO)"
            >
              <RefreshCw size={18} />
            </button>
            <span className="text-xs text-gray-400 mt-1">Rotate</span>
          </div>
          <div className="flex flex-col items-center">
            <button 
              onClick={() => setActiveTool('scale')}
              className={`p-2 rounded-md ${activeTool === 'scale' ? 'bg-blue-900 text-blue-300' : 'text-gray-300 hover:bg-gray-700'}`}
              title="Scale (SC)"
            >
              <Maximize size={18} />
            </button>
            <span className="text-xs text-gray-400 mt-1">Scale</span>
          </div>
        </div>
        
        {/* Edit Group */}
        <div className="border-r border-gray-700 pr-4 flex items-center space-x-2">
          <div className="flex flex-col items-center">
            <button 
              onClick={() => setActiveTool('trim')}
              className={`p-2 rounded-md ${activeTool === 'trim' ? 'bg-blue-900 text-blue-300' : 'text-gray-300 hover:bg-gray-700'}`}
              title="Trim (TR)"
            >
              <Scissors size={18} />
            </button>
            <span className="text-xs text-gray-400 mt-1">Trim</span>
          </div>
          <div className="flex flex-col items-center">
            <button 
              onClick={() => setActiveTool('extend')}
              className={`p-2 rounded-md ${activeTool === 'extend' ? 'bg-blue-900 text-blue-300' : 'text-gray-300 hover:bg-gray-700'}`}
              title="Extend (EX)"
            >
              <ArrowRight size={18} />
            </button>
            <span className="text-xs text-gray-400 mt-1">Extend</span>
          </div>
          <div className="flex flex-col items-center">
            <button 
              onClick={() => setActiveTool('offset')}
              className={`p-2 rounded-md ${activeTool === 'offset' ? 'bg-blue-900 text-blue-300' : 'text-gray-300 hover:bg-gray-700'}`}
              title="Offset (O)"
            >
              <Square size={18} className="transform scale-75" />
            </button>
            <span className="text-xs text-gray-400 mt-1">Offset</span>
          </div>
          <div className="flex flex-col items-center">
            <button 
              onClick={() => setActiveTool('fillet')}
              className={`p-2 rounded-md ${activeTool === 'fillet' ? 'bg-blue-900 text-blue-300' : 'text-gray-300 hover:bg-gray-700'}`}
              title="Fillet (F)"
            >
              <CornerDownRight size={18} />
            </button>
            <span className="text-xs text-gray-400 mt-1">Fillet</span>
          </div>
          <div className="flex flex-col items-center">
            <button 
              onClick={() => setActiveTool('chamfer')}
              className={`p-2 rounded-md ${activeTool === 'chamfer' ? 'bg-blue-900 text-blue-300' : 'text-gray-300 hover:bg-gray-700'}`}
              title="Chamfer (CHA)"
            >
              <CornerDownRight size={18} className="transform scale-75" />
            </button>
            <span className="text-xs text-gray-400 mt-1">Chamfer</span>
          </div>
        </div>
        
        {/* Array Group */}
        <div className="flex items-center space-x-2">
          <div className="flex flex-col items-center">
            <button 
              onClick={() => setActiveTool('array-rectangular')}
              className={`p-2 rounded-md ${activeTool === 'array-rectangular' ? 'bg-blue-900 text-blue-300' : 'text-gray-300 hover:bg-gray-700'}`}
              title="Rectangular Array (AR)"
            >
              <Grid size={18} />
            </button>
            <span className="text-xs text-gray-400 mt-1">Rect Array</span>
          </div>
          <div className="flex flex-col items-center">
            <button 
              onClick={() => setActiveTool('array-polar')}
              className={`p-2 rounded-md ${activeTool === 'array-polar' ? 'bg-blue-900 text-blue-300' : 'text-gray-300 hover:bg-gray-700'}`}
              title="Polar Array (AP)"
            >
              <Circle size={18} />
            </button>
            <span className="text-xs text-gray-400 mt-1">Polar Array</span>
          </div>
          <div className="flex flex-col items-center">
            <button 
              onClick={() => setActiveTool('mirror')}
              className={`p-2 rounded-md ${activeTool === 'mirror' ? 'bg-blue-900 text-blue-300' : 'text-gray-300 hover:bg-gray-700'}`}
              title="Mirror (MI)"
            >
              <Slash size={18} className="transform -rotate-90" />
            </button>
            <span className="text-xs text-gray-400 mt-1">Mirror</span>
          </div>
        </div>
      </div>
    ),
  };
  
  // Custom PlusMinusIcon for tolerance
  const PlusMinusIcon = ({ size }: { size: number }) => (
    <div className="flex flex-col items-center justify-center h-full">
      <span className="text-sm font-bold leading-none">±</span>
    </div>
  );
  
  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <MetaTags
        title="Technical Drawing"
        description="Create precision technical drawings with multiple views"
        ogImage="/og-images/technical-drawing.png"
      />
      
      {/* Header Bar */}
      <header className="bg-gray-900 text-white border-b border-gray-700 py-2 px-4 flex items-center justify-between shadow-md z-20">
        <div className="flex items-center">
          <button
            onClick={() => setShowMainMenu(!showMainMenu)}
            className="flex items-center text-gray-300 hover:text-white mr-4 transition-colors duration-150"
          >
            <Menu size={18} className="mr-2" />
            <span className="font-medium">Menu</span>
          </button>
          {showMainMenu && (
            <div className="absolute top-12 left-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 w-64 overflow-hidden transition-all duration-150">
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
              <Sliders size={16} className="mr-1.5" />
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
          
          {showExportMenu && (
            <div className="absolute top-12 right-40 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 w-56 overflow-hidden transition-all duration-150">
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
          
          <button
            onClick={() => router.push('/cad')}
            className="flex items-center text-gray-300 hover:text-white transition-colors duration-150"
          >
            <ArrowLeft size={18} className="mr-1.5" />
            <span className="font-medium">Back</span>
          </button>
        </div>
      </header>

      {/* Ribbon Tabs */}
      {showRibbonTabs && (
        <div className="bg-gray-850 border-b border-gray-700 z-10">
          <div className="flex">
            <button
              onClick={() => setActiveRibbonTab('home')}
              className={`flex items-center py-2 px-4 ${activeRibbonTab === 'home' ? 'bg-gray-900 text-blue-400 border-t-2 border-blue-500' : 'text-gray-400 hover:text-gray-300 border-t-2 border-transparent'}`}
            >
              <span className="font-medium">Home</span>
            </button>
            <button
              onClick={() => setActiveRibbonTab('draw')}
              className={`flex items-center py-2 px-4 ${activeRibbonTab === 'draw' ? 'bg-gray-900 text-blue-400 border-t-2 border-blue-500' : 'text-gray-400 hover:text-gray-300 border-t-2 border-transparent'}`}
            >
              <span className="font-medium">Draw</span>
            </button>
            <button
              onClick={() => setActiveRibbonTab('modify')}
              className={`flex items-center py-2 px-4 ${activeRibbonTab === 'modify' ? 'bg-gray-900 text-blue-400 border-t-2 border-blue-500' : 'text-gray-400 hover:text-gray-300 border-t-2 border-transparent'}`}
            >
              <span className="font-medium">Modify</span>
            </button>
            <button
              onClick={() => setActiveRibbonTab('annotate')}
              className={`flex items-center py-2 px-4 ${activeRibbonTab === 'annotate' ? 'bg-gray-900 text-blue-400 border-t-2 border-blue-500' : 'text-gray-400 hover:text-gray-300 border-t-2 border-transparent'}`}
            >
              <span className="font-medium">Annotate</span>
            </button>
            <button
              onClick={() => setActiveRibbonTab('mechanical')}
              className={`flex items-center py-2 px-4 ${activeRibbonTab === 'mechanical' ? 'bg-gray-900 text-blue-400 border-t-2 border-blue-500' : 'text-gray-400 hover:text-gray-300 border-t-2 border-transparent'}`}
            >
              <span className="font-medium">Mechanical</span>
            </button>
          </div>
          
          {/* Ribbon Content */}
          <div className="bg-gray-900 border-b border-gray-700">
            {activeRibbonTab === 'home' && ribbonTabs.home}
            {activeRibbonTab === 'draw' && ribbonTabs.draw}
            {activeRibbonTab === 'modify' && ribbonTabs.modify}
            {activeRibbonTab === 'annotate' && ribbonTabs.annotate}
            {activeRibbonTab === 'mechanical' && ribbonTabs.mechanical}
          </div>
        </div>
      )}

      {/* Properties Tabs */}
      <div className="flex bg-gray-850 border-b border-gray-700 z-10">
        <button
          onClick={() => setRightPanelTab('properties')}
          className={`flex items-center py-3 px-6 ${rightPanelTab === 'properties' ? 'bg-gray-900 text-blue-400' : 'text-gray-400 hover:text-gray-300'}`}
        >
          <Sliders size={16} className="mr-2" />
          <span className="font-medium">Properties</span>
        </button>
        <button
          onClick={() => setRightPanelTab('layers')}
          className={`flex items-center py-3 px-6 ${rightPanelTab === 'layers' ? 'bg-gray-900 text-blue-400' : 'text-gray-400 hover:text-gray-300'}`}
        >
          <Layers size={16} className="mr-2" />
          <span className="font-medium">Layers</span>
        </button>
        <button
          onClick={() => setRightPanelTab('styles')}
          className={`flex items-center py-3 px-6 ${rightPanelTab === 'styles' ? 'bg-gray-900 text-blue-400' : 'text-gray-400 hover:text-gray-300'}`}
        >
          <PenTool size={16} className="mr-2" />
          <span className="font-medium">Styles</span>
        </button>
        <button
          onClick={() => setRightPanelTab('dimension')}
          className={`flex items-center py-3 px-6 ${rightPanelTab === 'dimension' ? 'bg-gray-900 text-blue-400' : 'text-gray-400 hover:text-gray-300'}`}
        >
          <ArrowRight size={16} className="mr-2" />
          <span className="font-medium">Dimensions</span>
        </button>
        <button
          onClick={() => setRightPanelTab('blocks')}
          className={`flex items-center py-3 px-6 ${rightPanelTab === 'blocks' ? 'bg-gray-900 text-blue-400' : 'text-gray-400 hover:text-gray-300'}`}
        >
          <Grid size={16} className="mr-2" />
          <span className="font-medium">Blocks</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden bg-gray-900">
        {/* Left Toolbar */}
        
        
        {/* Drawing Canvas */}
        <div ref={canvasRef} className="flex-1 relative bg-gray-900">
          <TechnicalDrawingCanvas />
        </div>
        
        {/* Right Properties Panel */}
        <div className={`h-full bg-gray-900 border-l border-gray-700 transition-all duration-200 ease-in-out ${rightPanelOpen ? `w-${rightPanelWidth}` : 'w-0'}`}>
          {rightPanelOpen && (
            <>
              {rightPanelTab === 'properties' && (
                <PropertiesPanel 
                  entityIds={selectedEntityIds} 
                  onClose={() => setRightPanelOpen(false)} 
                />
              )}
              
              {rightPanelTab === 'layers' && (
                <LayerPanel onClose={() => setRightPanelOpen(false)} />
              )}
              
              {rightPanelTab === 'dimension' && (
                <DimensioningPanel />
              )}
              
              {rightPanelTab === 'sheet' && (
                <SheetSetupPanel />
              )}
              
              {rightPanelTab === 'viewport' && (
                <ViewportsPanel />
              )}
              
              {rightPanelTab === 'styles' && (
                <div className="h-full p-4 overflow-y-auto">
                  <h2 className="text-lg font-semibold text-white mb-4">Drawing Styles</h2>
                  
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-300 mb-2">Line Styles</h3>
                    <div className="space-y-2">
                      <div className="flex items-center p-2 bg-gray-800 rounded-md">
                        <div className="w-16 h-px bg-white mr-2"></div>
                        <span className="text-white">Solid</span>
                      </div>
                      <div className="flex items-center p-2 hover:bg-gray-800 rounded-md">
                        <div className="w-16 border-t border-dashed border-white mr-2"></div>
                        <span className="text-gray-300">Dashed</span>
                      </div>
                      <div className="flex items-center p-2 hover:bg-gray-800 rounded-md">
                        <div className="w-16 border-t border-dotted border-white mr-2"></div>
                        <span className="text-gray-300">Dotted</span>
                      </div>
                      <div className="flex items-center p-2 hover:bg-gray-800 rounded-md">
                        <div className="w-16 h-px bg-white mr-2" style={{ backgroundImage: 'linear-gradient(to right, white 50%, transparent 50%)', backgroundSize: '8px 1px' }}></div>
                        <span className="text-gray-300">Center</span>
                      </div>
                      <div className="flex items-center p-2 hover:bg-gray-800 rounded-md">
                        <div className="w-16 border-t border-white border-opacity-50 mr-2"></div>
                        <span className="text-gray-300">Hidden</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-300 mb-2">Text Styles</h3>
                    <div className="space-y-2">
                      <div className="flex items-center p-2 bg-gray-800 rounded-md">
                        <span className="text-white">Standard</span>
                        <span className="ml-auto text-gray-400 text-xs">Arial, 3.5mm</span>
                      </div>
                      <div className="flex items-center p-2 hover:bg-gray-800 rounded-md">
                        <span className="text-gray-300 font-bold">Title</span>
                        <span className="ml-auto text-gray-400 text-xs">Arial Bold, 5mm</span>
                      </div>
                      <div className="flex items-center p-2 hover:bg-gray-800 rounded-md">
                        <span className="text-gray-300">Annotation</span>
                        <span className="ml-auto text-gray-400 text-xs">Arial, 2.5mm</span>
                      </div>
                      <div className="flex items-center p-2 hover:bg-gray-800 rounded-md">
                        <span className="text-gray-300 italic">Notes</span>
                        <span className="ml-auto text-gray-400 text-xs">Arial Italic, 2.5mm</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-300 mb-2">Dimension Styles</h3>
                    <div className="space-y-2">
                      <div className="flex items-center p-2 bg-gray-800 rounded-md">
                        <span className="text-white">Standard</span>
                        <span className="ml-auto text-gray-400 text-xs">ISO</span>
                      </div>
                      <div className="flex items-center p-2 hover:bg-gray-800 rounded-md">
                        <span className="text-gray-300">Mechanical</span>
                        <span className="ml-auto text-gray-400 text-xs">ANSI</span>
                      </div>
                      <div className="flex items-center p-2 hover:bg-gray-800 rounded-md">
                        <span className="text-gray-300">Architectural</span>
                        <span className="ml-auto text-gray-400 text-xs">Custom</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {rightPanelTab === 'blocks' && (
                <div className="h-full p-4 overflow-y-auto">
                  <h2 className="text-lg font-semibold text-white mb-4">Block Library</h2>
                  
                  <div className="mb-4">
                    <div className="flex items-center mb-2">
                      <h3 className="text-sm font-medium text-gray-300">Mechanical Symbols</h3>
                      <button className="ml-auto p-1 text-gray-400 hover:text-gray-200">
                        <Plus size={16} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 border border-gray-700 rounded-md hover:bg-gray-800 cursor-pointer">
                        <div className="h-16 flex items-center justify-center mb-1">
                          <Plus size={24} className="text-gray-400" />
                        </div>
                        <div className="text-xs text-center text-gray-300">Center Mark</div>
                      </div>
                      <div className="p-2 border border-gray-700 rounded-md hover:bg-gray-800 cursor-pointer">
                        <div className="h-16 flex items-center justify-center mb-1">
                          <Compass size={24} className="text-gray-400" />
                        </div>
                        <div className="text-xs text-center text-gray-300">Datum Symbol</div>
                      </div>
                      <div className="p-2 border border-gray-700 rounded-md hover:bg-gray-800 cursor-pointer">
                        <div className="h-16 flex items-center justify-center mb-1">
                          <Square size={24} className="text-gray-400" />
                        </div>
                        <div className="text-xs text-center text-gray-300">FCF</div>
                      </div>
                      <div className="p-2 border border-gray-700 rounded-md hover:bg-gray-800 cursor-pointer">
                        <div className="h-16 flex items-center justify-center mb-1">
                          <Hash size={24} className="text-gray-400" />
                        </div>
                        <div className="text-xs text-center text-gray-300">Surface Finish</div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center mb-2">
                      <h3 className="text-sm font-medium text-gray-300">User Blocks</h3>
                      <button className="ml-auto p-1 text-gray-400 hover:text-gray-200">
                        <Plus size={16} />
                      </button>
                    </div>
                    <div className="text-center p-4 text-gray-500 text-sm border border-gray-700 border-dashed rounded-md">
                      No user blocks created yet
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Footer Status Bar */}
      <div className="bg-gray-850 border-t border-gray-700 py-1 px-4 flex justify-between items-center text-xs text-gray-400">
        <StatusBar
          coords={null}
          zoom={zoom}
          tool={activeTool || ''}
          orthoMode={orthoMode}
          toggleOrtho={toggleOrthoMode}
          polarMode={false}
          togglePolar={() => {}}
          snapEnabled={snappingEnabled}
          toggleSnap={toggleSnapping}
          gridEnabled={gridEnabled}
          toggleGrid={toggleGrid}
        />
      </div>
      
      {/* Command Line */}
      {showCommandLinePanel && (
        <div className="bg-gray-900 border-t border-gray-700 p-2 flex items-center">
          <CommandLine onSubmit={handleCommand} onCancel={() => {}} />
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
                <span className="text-gray-400">F2</span>
                <span className="text-gray-300">Toggle command line</span>
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
                <span className="text-gray-400">F10</span>
                <span className="text-gray-300">Toggle ribbon</span>
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
                <span className="text-gray-400">T</span>
                <span className="text-gray-300">Text tool</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">DIM</span>
                <span className="text-gray-300">Dimension tool</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">S</span>
                <span className="text-gray-300">Select tool</span>
              </div>
            </div>
            
            <h4 className="text-sm font-medium text-gray-300 mb-2">Command Line Usage</h4>
            <p className="text-gray-400 text-sm mb-2">
              Enter commands directly in the command line at the bottom of the screen. Prefix coordinate input with @ for relative coordinates.
            </p>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-400">LINE</span>
                <span className="text-gray-300">Start line tool</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">CIRCLE</span>
                <span className="text-gray-300">Start circle tool</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">ZOOM ALL</span>
                <span className="text-gray-300">Zoom to fit</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">GRID</span>
                <span className="text-gray-300">Toggle grid</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TechnicalDrawingPage;