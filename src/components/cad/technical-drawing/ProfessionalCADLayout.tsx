import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTechnicalDrawingStore } from './technicalDrawingStore';
import EnhancedDrawingCanvas from './ui/EnhancedDrawingCanvas';
import CADSystemIntegration from './CADSystemIntegration';


// UI Components
import CommandLine from './ui/CommandLine';
import StatusBar from './ui/StatusBar';
import ToolsPanel from './ui/panels/ToolsPanel';
import LayersPanel from './ui/panels/LayersPanel';
import PropertiesPanel from './ui/panels/PropertiesPanel';
import CoordinateInput from './ui/inputs/CoordinateInput';

// Icons
import {
  Menu,
  Save,
  FolderOpen,
  Download,
  Printer,
  Undo2,
  Redo2,
  Copy,
  Scissors,
  RotateCw,
  Move,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Grid,
  Magnet,
  Lock,
  Eye,
  EyeOff,
  Settings,
  HelpCircle,
  Monitor,
  Layers,
  PanelLeftOpen,
  PanelLeftClose,
  PanelRightOpen,
  PanelRightClose,
  Terminal,
  Maximize2,
  Minimize2,
  Square,
  Circle,
  Triangle,
  Ruler,
  Type,
  Pencil,
  MousePointer,
  Target,
  Compass,
  Hash,
  Spline,
  FileText,
  TestTube,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface ProfessionalCADLayoutProps {
  title?: string;
  theme?: 'light' | 'dark' | 'auto';
  workspace?: 'drafting' | 'modeling' | 'annotation' | 'custom';
  showWelcome?: boolean;
}

/**
 * 🚀 Professional CAD Layout - AutoCAD-Style Interface
 * 
 * Layout professionale che integra tutto il sistema CAD con:
 * - Ribbon interface stile AutoCAD
 * - Pannelli dock personalizzabili
 * - Command line professionale
 * - Status bar completa
 * - Canvas di disegno avanzato
 * - Gestione workspace
 * - Keyboard shortcuts
 * - Context menus
 * - Theme management
 */
const ProfessionalCADLayout: React.FC<ProfessionalCADLayoutProps> = ({
  title = "Professional CAD System 2D",
  theme = 'light',
  workspace = 'drafting',
  showWelcome = false
}) => {
  // Estado del layout
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [isCommandLineOpen, setIsCommandLineOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [activeLeftPanel, setActiveLeftPanel] = useState('tools');
  const [activeRightPanel, setActiveRightPanel] = useState('properties');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [currentView, setCurrentView] = useState<'cad' | 'audit' | 'integration'>('cad');
  
  // Layout state
  const [leftPanelWidth, setLeftPanelWidth] = useState(280);
  const [rightPanelWidth, setRightPanelWidth] = useState(320);
  const [commandLineHeight, setCommandLineHeight] = useState(120);
  const [ribbonCollapsed, setRibbonCollapsed] = useState(false);
  
  // Riferimenti
  const layoutRef = useRef<HTMLDivElement>(null);
  const resizeTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Store CAD
  const {
    activeTool,
    setActiveTool,
    zoom,
    setZoom,
    pan,
    setPan,
    selectedEntityIds,
    gridEnabled,
    toggleGrid,
    snappingEnabled,
    toggleSnapping,
    orthoMode,
    toggleOrthoMode,
    zoomToFit,
    undo,
    redo,
    entities,
    dimensions,
    annotations,
    drawingLayers,
    activeLayer,
    setActiveLayer
  } = useTechnicalDrawingStore();
  
  // Ribbon tabs configuration
  const RIBBON_TABS = {
    home: {
      label: 'Home',
      icon: <Monitor size={16} />,
      groups: [
        {
          title: 'Draw',
          tools: [
            { id: 'line', icon: <Pencil size={20} />, label: 'Line', shortcut: 'L' },
            { id: 'circle', icon: <Circle size={20} />, label: 'Circle', shortcut: 'C' },
            { id: 'rectangle', icon: <Square size={20} />, label: 'Rectangle', shortcut: 'R' },
            { id: 'arc', icon: <Compass size={20} />, label: 'Arc', shortcut: 'A' },
            { id: 'polyline', icon: <Hash size={20} />, label: 'Polyline', shortcut: 'PL' },
            { id: 'spline', icon: <Spline size={20} />, label: 'Spline', shortcut: 'SPL' }
          ]
        },
        {
          title: 'Modify',
          tools: [
            { id: 'move', icon: <Move size={20} />, label: 'Move', shortcut: 'M' },
            { id: 'copy', icon: <Copy size={20} />, label: 'Copy', shortcut: 'CO' },
            { id: 'rotate', icon: <RotateCw size={20} />, label: 'Rotate', shortcut: 'RO' },
            { id: 'mirror', icon: <Copy size={20} />, label: 'Mirror', shortcut: 'MI' },
            { id: 'offset', icon: <Target size={20} />, label: 'Offset', shortcut: 'O' },
            { id: 'trim', icon: <Scissors size={20} />, label: 'Trim', shortcut: 'TR' }
          ]
        },
        {
          title: 'Annotate',
          tools: [
            { id: 'text', icon: <Type size={20} />, label: 'Text', shortcut: 'T' },
            { id: 'dimension-linear', icon: <Ruler size={20} />, label: 'Linear', shortcut: 'DLI' },
            { id: 'dimension-angular', icon: <Ruler size={20} />, label: 'Angular', shortcut: 'DAN' },
            { id: 'leader', icon: <MousePointer size={20} />, label: 'Leader', shortcut: 'LE' }
          ]
        },
        {
          title: 'Layers',
          tools: [
            { id: 'layer-new', icon: <Layers size={20} />, label: 'New Layer' },
            { id: 'layer-properties', icon: <Settings size={20} />, label: 'Properties' }
          ]
        }
      ]
    },
    insert: {
      label: 'Insert',
      icon: <FolderOpen size={16} />,
      groups: [
        {
          title: 'Block',
          tools: [
            { id: 'insert-block', icon: <Square size={20} />, label: 'Insert' },
            { id: 'create-block', icon: <Copy size={20} />, label: 'Create' }
          ]
        },
        {
          title: 'Reference',
          tools: [
            { id: 'attach-xref', icon: <FileText size={20} />, label: 'Attach' },
            { id: 'image', icon: <Monitor size={20} />, label: 'Image' }
          ]
        }
      ]
    },
    annotate: {
      label: 'Annotate',
      icon: <Type size={16} />,
      groups: [
        {
          title: 'Dimensions',
          tools: [
            { id: 'dim-linear', icon: <Ruler size={20} />, label: 'Linear' },
            { id: 'dim-angular', icon: <Triangle size={20} />, label: 'Angular' },
            { id: 'dim-radial', icon: <Circle size={20} />, label: 'Radial' }
          ]
        },
        {
          title: 'Text',
          tools: [
            { id: 'text-single', icon: <Type size={20} />, label: 'Single Line' },
            { id: 'text-multi', icon: <FileText size={20} />, label: 'Multiline' }
          ]
        }
      ]
    },
    view: {
      label: 'View',
      icon: <Eye size={16} />,
      groups: [
        {
          title: 'Navigate',
          tools: [
            { id: 'zoom-extents', icon: <RefreshCw size={20} />, label: 'Zoom Extents' },
            { id: 'zoom-window', icon: <ZoomIn size={20} />, label: 'Zoom Window' },
            { id: 'pan', icon: <Move size={20} />, label: 'Pan' }
          ]
        },
        {
          title: 'Visual Styles',
          tools: [
            { id: 'wireframe', icon: <Grid size={20} />, label: 'Wireframe' },
            { id: 'hidden', icon: <EyeOff size={20} />, label: 'Hidden' }
          ]
        }
      ]
    },
    tools: {
      label: 'Tools',
      icon: <Settings size={16} />,
      groups: [
        {
          title: 'Draft Settings',
          tools: [
            { id: 'osnap', icon: <Target size={20} />, label: 'Object Snap' },
            { id: 'grid', icon: <Grid size={20} />, label: 'Grid' },
            { id: 'ortho', icon: <Lock size={20} />, label: 'Ortho' }
          ]
        },
        {
          title: 'Inquiry',
          tools: [
            { id: 'distance', icon: <Ruler size={20} />, label: 'Distance' },
            { id: 'area', icon: <Square size={20} />, label: 'Area' }
          ]
        }
      ]
    }
  };
  
  // Gestione fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(console.error);
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  }, []);
  
  // Gestione zoom
  const handleZoomIn = useCallback(() => {
    setZoom(Math.min(zoom * 1.2, 50));
  }, [zoom, setZoom]);
  
  const handleZoomOut = useCallback(() => {
    setZoom(Math.max(zoom / 1.2, 0.1));
  }, [zoom, setZoom]);
  
  // Gestione tool selection
  const handleToolSelect = useCallback((toolId: string) => {
    setActiveTool(toolId);
  }, [setActiveTool]);
  
  // Gestione coordinate input
  const handleCoordinateInput = useCallback((x: number, y: number) => {
    setPan({ x, y });
  }, [setPan]);
  
  // Gestione resize panels
  const handlePanelResize = useCallback((panel: 'left' | 'right' | 'command', delta: number) => {
    switch (panel) {
      case 'left':
        setLeftPanelWidth(Math.max(200, Math.min(500, leftPanelWidth + delta)));
        break;
      case 'right':
        setRightPanelWidth(Math.max(200, Math.min(500, rightPanelWidth + delta)));
        break;
      case 'command':
        setCommandLineHeight(Math.max(80, Math.min(300, commandLineHeight + delta)));
        break;
    }
  }, [leftPanelWidth, rightPanelWidth, commandLineHeight]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Gestione shortcuts globali
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 's':
            e.preventDefault();
            console.log('Save triggered');
            break;
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
            break;
          case 'y':
            e.preventDefault();
            redo();
            break;
          case 'a':
            e.preventDefault();
            // Select all
            break;
        }
      } else {
        // Tool shortcuts
        switch (e.key.toLowerCase()) {
          case 'l':
            if (!e.ctrlKey && !e.altKey) {
              setActiveTool('line');
            }
            break;
          case 'c':
            if (!e.ctrlKey && !e.altKey) {
              setActiveTool('circle');
            }
            break;
          case 'r':
            if (!e.ctrlKey && !e.altKey) {
              setActiveTool('rectangle');
            }
            break;
          case 'escape':
            setActiveTool('select');
            break;
          case 'f8':
            toggleOrthoMode();
            break;
          case 'f9':
            toggleGrid();
            break;
          case 'f3':
            toggleSnapping();
            break;
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, setActiveTool, toggleOrthoMode, toggleGrid, toggleSnapping]);
  
  // Auto-save functionality
  useEffect(() => {
    const autoSave = () => {
      const drawingData = {
        entities,
        dimensions,
        annotations,
        layers: drawingLayers,
        timestamp: Date.now()
      };
      localStorage.setItem('cad_autosave', JSON.stringify(drawingData));
    };
    
    const interval = setInterval(autoSave, 30000); // Auto-save every 30 seconds
    return () => clearInterval(interval);
  }, [entities, dimensions, annotations, drawingLayers]);
  
  // Render ribbon tool button
  const renderToolButton = (tool: any) => (
    <motion.button
      key={tool.id}
      className={`ribbon-tool-btn ${activeTool === tool.id ? 'active' : ''}`}
      onClick={() => handleToolSelect(tool.id)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px',
        minWidth: '60px',
        minHeight: '60px',
        backgroundColor: activeTool === tool.id ? '#e6f7ff' : 'transparent',
        border: activeTool === tool.id ? '1px solid #91d5ff' : '1px solid transparent',
        borderRadius: '4px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        fontSize: '11px',
        fontWeight: '500',
        color: activeTool === tool.id ? '#1890ff' : '#333'
      }}
      title={`${tool.label}${tool.shortcut ? ` (${tool.shortcut})` : ''}`}
    >
      <div style={{ marginBottom: '4px' }}>
        {tool.icon}
      </div>
      <div style={{ 
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: '100%'
      }}>
        {tool.label}
      </div>
    </motion.button>
  );
  
  // Render ribbon group
  const renderRibbonGroup = (group: any) => (
    <div
      key={group.title}
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid #e0e0e0',
        paddingRight: '12px',
        marginRight: '12px'
      }}
    >
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '4px',
        marginBottom: '8px',
        minHeight: '64px',
        alignItems: 'center'
      }}>
        {group.tools.map(renderToolButton)}
      </div>
      <div style={{
        fontSize: '12px',
        color: '#666',
        textAlign: 'center',
        borderTop: '1px solid #f0f0f0',
        paddingTop: '4px',
        fontWeight: '500'
      }}>
        {group.title}
      </div>
    </div>
  );
  
  // Render left panel content
  const renderLeftPanelContent = () => {
    switch (activeLeftPanel) {
      case 'tools':
        return (
          <ToolsPanel
            activeTool={activeTool}
            onToolSelect={handleToolSelect}
          />
        );
      case 'layers':
        return <LayersPanel />;
      case 'blocks':
        return (
          <div style={{ padding: '16px' }}>
            <h3>Block Library</h3>
            <p>Block library coming soon...</p>
          </div>
        );
      default:
        return null;
    }
  };
  
  // Render right panel content
  const renderRightPanelContent = () => {
    switch (activeRightPanel) {
      case 'properties':
        return <PropertiesPanel selectedEntityIds={selectedEntityIds} />;
      case 'design':
        return (
          <div style={{ padding: '16px' }}>
            <h3>Design Center</h3>
            <p>Design center coming soon...</p>
          </div>
        );
     
      default:
        return null;
    }
  };
  
  return (
    <div
      ref={layoutRef}
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f5f5f5',
        fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
        overflow: 'hidden'
      }}
      className="professional-cad-layout"
    >
      {/* Application Title Bar */}
      <div style={{
        height: '32px',
        backgroundColor: '#2c3e50',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        fontSize: '14px',
        userSelect: 'none'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Monitor size={16} />
          <span>{title}</span>
          <span style={{ color: '#bdc3c7', fontSize: '12px' }}>
            - Untitled Drawing
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              padding: '4px 8px',
              cursor: 'pointer',
              borderRadius: '2px'
            }}
            onClick={() => setCurrentView(currentView === 'cad' ? 'integration' : 'cad')}
          >
            <TestTube size={14} />
          </button>
          <button
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              padding: '4px 8px',
              cursor: 'pointer',
              borderRadius: '2px'
            }}
            onClick={toggleFullscreen}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>
      
      {/* Menu Bar */}
      <div style={{
        height: '28px',
        backgroundColor: '#34495e',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        fontSize: '13px',
        borderBottom: '1px solid #2c3e50'
      }}>
        <div style={{ display: 'flex', gap: '20px' }}>
          {['File', 'Edit', 'View', 'Insert', 'Format', 'Tools', 'Draw', 'Dimension', 'Modify', 'Window', 'Help'].map(item => (
            <span
              key={item}
              style={{
                padding: '4px 8px',
                cursor: 'pointer',
                borderRadius: '2px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#3498db';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {item}
            </span>
          ))}
        </div>
      </div>
      
      {/* Ribbon */}
      <div style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #d0d0d0',
        minHeight: ribbonCollapsed ? '40px' : '120px',
        transition: 'min-height 0.3s ease'
      }}>
        {/* Ribbon Tabs */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          height: '32px',
          backgroundColor: '#f8f9fa',
          borderBottom: '1px solid #e0e0e0',
          padding: '0 8px'
        }}>
          {Object.entries(RIBBON_TABS).map(([tabId, tab]) => (
            <button
              key={tabId}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                backgroundColor: activeTab === tabId ? 'white' : 'transparent',
                border: activeTab === tabId ? '1px solid #d0d0d0' : '1px solid transparent',
                borderBottom: activeTab === tabId ? '1px solid white' : '1px solid transparent',
                borderRadius: '4px 4px 0 0',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                color: activeTab === tabId ? '#1890ff' : '#666',
                marginBottom: '-1px',
                zIndex: activeTab === tabId ? 1 : 0
              }}
              onClick={() => setActiveTab(tabId)}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
          
          <button
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              padding: '4px',
              cursor: 'pointer',
              color: '#666'
            }}
            onClick={() => setRibbonCollapsed(!ribbonCollapsed)}
            title={ribbonCollapsed ? 'Expand Ribbon' : 'Collapse Ribbon'}
          >
            {ribbonCollapsed ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>
        
        {/* Ribbon Content */}
        <AnimatePresence>
          {!ribbonCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                padding: '12px 16px',
                backgroundColor: 'white',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0px',
                overflowX: 'auto'
              }}
            >
              {RIBBON_TABS[activeTab as keyof typeof RIBBON_TABS]?.groups.map(renderRibbonGroup)}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Main Content Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden'
      }}>
        {/* Left Panel */}
        <AnimatePresence>
          {isLeftPanelOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: leftPanelWidth, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                backgroundColor: 'white',
                borderRight: '1px solid #d0d0d0',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
            >
              {/* Left Panel Tabs */}
              <div style={{
                display: 'flex',
                backgroundColor: '#f8f9fa',
                borderBottom: '1px solid #e0e0e0'
              }}>
                {[
                  { id: 'tools', label: 'Tools', icon: <Settings size={14} /> },
                  { id: 'layers', label: 'Layers', icon: <Layers size={14} /> },
                  { id: 'blocks', label: 'Blocks', icon: <Square size={14} /> }
                ].map(tab => (
                  <button
                    key={tab.id}
                    style={{
                      flex: 1,
                      padding: '8px 4px',
                      backgroundColor: activeLeftPanel === tab.id ? 'white' : 'transparent',
                      border: 'none',
                      borderBottom: activeLeftPanel === tab.id ? '2px solid #1890ff' : '2px solid transparent',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500',
                      color: activeLeftPanel === tab.id ? '#1890ff' : '#666',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '2px'
                    }}
                    onClick={() => setActiveLeftPanel(tab.id)}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>
              
              {/* Left Panel Content */}
              <div style={{ flex: 1, overflow: 'auto' }}>
                {renderLeftPanelContent()}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Center Drawing Area */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          backgroundColor: '#ffffff'
        }}>
          {/* Quick Access Toolbar */}
          <div style={{
            height: '36px',
            backgroundColor: '#f8f9fa',
            borderBottom: '1px solid #e0e0e0',
            display: 'flex',
            alignItems: 'center',
            padding: '0 12px',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                style={{
                  background: 'none',
                  border: '1px solid #d0d0d0',
                  borderRadius: '4px',
                  padding: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  color: '#666'
                }}
                onClick={() => console.log('New')}
                title="New (Ctrl+N)"
              >
                <FileText size={16} />
              </button>
              
              <button
                style={{
                  background: 'none',
                  border: '1px solid #d0d0d0',
                  borderRadius: '4px',
                  padding: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  color: '#666'
                }}
                onClick={() => console.log('Open')}
                title="Open (Ctrl+O)"
              >
                <FolderOpen size={16} />
              </button>
              
              <button
                style={{
                  background: 'none',
                  border: '1px solid #d0d0d0',
                  borderRadius: '4px',
                  padding: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  color: '#666'
                }}
                onClick={() => console.log('Save')}
                title="Save (Ctrl+S)"
              >
                <Save size={16} />
              </button>
              
              <div style={{ width: '1px', height: '20px', backgroundColor: '#d0d0d0', margin: '0 4px' }} />
              
              <button
                style={{
                  background: 'none',
                  border: '1px solid #d0d0d0',
                  borderRadius: '4px',
                  padding: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  color: '#666'
                }}
                onClick={undo}
                title="Undo (Ctrl+Z)"
              >
                <Undo2 size={16} />
              </button>
              
              <button
                style={{
                  background: 'none',
                  border: '1px solid #d0d0d0',
                  borderRadius: '4px',
                  padding: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  color: '#666'
                }}
                onClick={redo}
                title="Redo (Ctrl+Y)"
              >
                <Redo2 size={16} />
              </button>
            </div>
            
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                color: '#666'
              }}>
                <span>Layer:</span>
                <select
                  value={activeLayer}
                  onChange={(e) => setActiveLayer(e.target.value)}
                  style={{
                    border: '1px solid #d0d0d0',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    fontSize: '12px',
                    minWidth: '100px'
                  }}
                >
                  {drawingLayers.map(layer => (
                    <option key={layer.id} value={layer.name}>
                      {layer.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  style={{
                    background: 'none',
                    border: '1px solid #d0d0d0',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    color: '#666',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  onClick={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
                  title="Toggle Left Panel"
                >
                  {isLeftPanelOpen ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />}
                </button>
                
                <button
                  style={{
                    background: 'none',
                    border: '1px solid #d0d0d0',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    color: '#666',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
                  title="Toggle Right Panel"
                >
                  {isRightPanelOpen ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
                </button>
              </div>
            </div>
          </div>
          
          {/* Drawing Canvas */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            {currentView === 'cad' ? (
              <EnhancedDrawingCanvas
                onCursorMove={setCursorPosition}
              />
            ) : (
              <CADSystemIntegration
                mode="development"
                showAudit={true}
                enableAdvancedFeatures={true}
              />
            )}
            
            {/* ViewCube (top-right corner) */}
            <div style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              width: '80px',
              height: '80px',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              border: '1px solid #d0d0d0',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 'bold',
              color: '#666',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              2D
            </div>
            
            {/* Navigation Controls (bottom-right) */}
            <div style={{
              position: 'absolute',
              bottom: '16px',
              right: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  border: '1px solid #d0d0d0',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
                onClick={handleZoomIn}
                title="Zoom In"
              >
                <ZoomIn size={20} color="#666" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  border: '1px solid #d0d0d0',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
                onClick={handleZoomOut}
                title="Zoom Out"
              >
                <ZoomOut size={20} color="#666" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  border: '1px solid #d0d0d0',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
                onClick={() => zoomToFit()}
                title="Zoom Extents"
              >
                <RefreshCw size={20} color="#666" />
              </motion.button>
            </div>
          </div>
        </div>
        
        {/* Right Panel */}
        <AnimatePresence>
          {isRightPanelOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: rightPanelWidth, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                backgroundColor: 'white',
                borderLeft: '1px solid #d0d0d0',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
            >
              {/* Right Panel Tabs */}
              <div style={{
                display: 'flex',
                backgroundColor: '#f8f9fa',
                borderBottom: '1px solid #e0e0e0'
              }}>
                {[
                  { id: 'properties', label: 'Properties', icon: <Settings size={14} /> },
                  { id: 'design', label: 'Design Center', icon: <FileText size={14} /> },
                  { id: 'audit', label: 'Audit', icon: <TestTube size={14} /> }
                ].map(tab => (
                  <button
                    key={tab.id}
                    style={{
                      flex: 1,
                      padding: '8px 4px',
                      backgroundColor: activeRightPanel === tab.id ? 'white' : 'transparent',
                      border: 'none',
                      borderBottom: activeRightPanel === tab.id ? '2px solid #1890ff' : '2px solid transparent',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500',
                      color: activeRightPanel === tab.id ? '#1890ff' : '#666',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '2px'
                    }}
                    onClick={() => setActiveRightPanel(tab.id)}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>
              
              {/* Right Panel Content */}
              <div style={{ flex: 1, overflow: 'auto' }}>
                {renderRightPanelContent()}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Command Line */}
      <AnimatePresence>
        {isCommandLineOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: commandLineHeight, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              backgroundColor: '#1e1e1e',
              borderTop: '1px solid #333',
              display: 'flex',
              flexDirection: 'column',
              color: 'white',
              fontFamily: 'Consolas, Monaco, monospace',
              fontSize: '13px'
            }}
          >
            {/* Command Line Header */}
            <div style={{
              height: '28px',
              backgroundColor: '#333',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 12px',
              borderBottom: '1px solid #444'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Terminal size={14} />
                <span style={{ fontSize: '12px', fontWeight: '500' }}>Command Line</span>
              </div>
              
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#999',
                  cursor: 'pointer',
                  padding: '2px'
                }}
                onClick={() => setIsCommandLineOpen(false)}
                title="Close Command Line"
              >
                ×
              </button>
            </div>
            
            {/* Command Line Content */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <CommandLine />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Status Bar */}
      <div style={{
        height: '24px',
        backgroundColor: '#34495e',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        fontSize: '12px',
        borderTop: '1px solid #2c3e50'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span>
            {cursorPosition.x.toFixed(2)}, {cursorPosition.y.toFixed(2)}
          </span>
          <span>Zoom: {(zoom * 100).toFixed(0)}%</span>
          <span>Layer: {activeLayer}</span>
          <span>Tool: {activeTool}</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            style={{
              background: 'none',
              border: '1px solid #5d6d7e',
              borderRadius: '2px',
              color: 'white',
              padding: '2px 6px',
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: gridEnabled ? '#3498db' : 'transparent'
            }}
            onClick={toggleGrid}
            title="Grid (F9)"
          >
            <Grid size={12} />
            GRID
          </button>
          
          <button
            style={{
              background: 'none',
              border: '1px solid #5d6d7e',
              borderRadius: '2px',
              color: 'white',
              padding: '2px 6px',
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: snappingEnabled ? '#3498db' : 'transparent'
            }}
            onClick={toggleSnapping}
            title="Object Snap (F3)"
          >
            <Target size={12} />
            OSNAP
          </button>
          
          <button
            style={{
              background: 'none',
              border: '1px solid #5d6d7e',
              borderRadius: '2px',
              color: 'white',
              padding: '2px 6px',
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: orthoMode ? '#3498db' : 'transparent'
            }}
            onClick={toggleOrthoMode}
            title="Ortho Mode (F8)"
          >
            <Lock size={12} />
            ORTHO
          </button>
          
          <button
            style={{
              background: 'none',
              border: '1px solid #5d6d7e',
              borderRadius: '2px',
              color: 'white',
              padding: '2px 6px',
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            onClick={() => setIsCommandLineOpen(!isCommandLineOpen)}
            title="Toggle Command Line"
          >
            <Terminal size={12} />
            CMD
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalCADLayout;