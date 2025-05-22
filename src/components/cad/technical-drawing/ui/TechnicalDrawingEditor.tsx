import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTechnicalDrawingStore } from '../technicalDrawingStore';
import DrawingCanvas from './DrawingCanvas';
import CommandLine from './CommandLine';
import ToolsPanel from './panels/ToolsPanel';
import LayersPanel from './panels/LayersPanel';
import PropertiesPanel from './panels/PropertiesPanel';
import CoordinateInput from './inputs/CoordinateInput';
import StatusBar from './StatusBar';
import Toolbar from './Toolbar';

// Icone per la UI
import { 
  PanelLeft, 
  PanelRight, 
  Grid, 
  ZoomIn, 
  ZoomOut, 
  RefreshCw, 
  Command, 
  Save, 
  Download,
  Maximize, 
  Minimize,
  Lock,
  Unlock
} from 'lucide-react';

interface TechnicalDrawingEditorProps {
  width?: number | string;
  height?: number | string;
  className?: string;
  onSave?: () => void;
  onExport?: (format: 'dxf' | 'svg' | 'pdf' | 'png') => void;
}

const TechnicalDrawingEditor: React.FC<TechnicalDrawingEditorProps> = ({
  width = '100%',
  height = '100%',
  className = '',
  onSave,
  onExport
}) => {
  // Refs
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  
  // Accesso allo store Zustand
  const { 
    activeTool, 
    setActiveTool, 
    zoom, 
    setZoom, 
    pan, 
    setPan, 
    selectedEntityIds, 
    zoomToFit, 
    gridEnabled, 
    toggleGrid,
    snappingEnabled, 
    toggleSnapping,
    orthoMode,
    toggleOrthoMode,
    clearSelection
  } = useTechnicalDrawingStore();
  
  // Stato locale UI
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [showCommandLine, setShowCommandLine] = useState(true);
  const [showCoordinateInput, setShowCoordinateInput] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  
  // Varianti per animazioni
  const panelVariants = {
    open: { opacity: 1, x: 0 },
    closed: { opacity: 0, x: -300 }
  };
  
  const rightPanelVariants = {
    open: { opacity: 1, x: 0 },
    closed: { opacity: 0, x: 300 }
  };
  
  const bottomPanelVariants = {
    open: { opacity: 1, y: 0 },
    closed: { opacity: 0, y: 100 }
  };
  
  // Gestione fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.log(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };
  
  // Gestione zoom
  const handleZoomIn = () => {
    setZoom(Math.min(zoom * 1.2, 50));
  };
  
  const handleZoomOut = () => {
    setZoom(Math.max(zoom / 1.2, 0.1));
  };
  
  // Gestione coordinate
  const handleCoordinateInput = (x: number, y: number) => {
    if (activeTool === 'select') {
      setPan({ x, y });
    } else {
      // Qui la logica per utilizzare le coordinate con lo strumento attivo
      console.log(`Using coordinates ${x}, ${y} with tool: ${activeTool}`);
    }
  };
  
  // Gestione eventi di tasti
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape: deseleziona tutto o annulla l'operazione corrente
      if (e.key === 'Escape') {
        clearSelection();
      }
      
      // CTRL+Z: undo
      if (e.ctrlKey && e.key === 'z') {
        // TODO: implementare undo
      }
      
      // CTRL+SHIFT+Z o CTRL+Y: redo
      if ((e.ctrlKey && e.shiftKey && e.key === 'z') || 
          (e.ctrlKey && e.key === 'y')) {
        // TODO: implementare redo
      }
      
      // CTRL+S: salva
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        if (onSave) onSave();
      }
      
      // Spazio: attiva temporaneamente lo strumento pan
      if (e.key === ' ' && !e.repeat) {
        // TODO: attivazione temporanea del pan
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [clearSelection, onSave]);
  
  return (
    <div 
      className={`technical-drawing-editor ${className}`}
      style={{ 
        width, 
        height, 
        display: 'grid',
        gridTemplateRows: 'auto 1fr auto auto',
        gridTemplateColumns: `${showLeftPanel ? '300px' : '0'} 1fr ${showRightPanel ? '300px' : '0'}`,
        gridTemplateAreas: `
          "toolbar toolbar toolbar"
          "leftpanel content rightpanel"
          "statusbar statusbar statusbar"
          "commandline commandline commandline"
        `,
        overflow: 'hidden'
      }}
    >
      {/* Toolbar principale */}
      <motion.div 
        style={{ gridArea: 'toolbar' }}
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Toolbar 
          activeTool={activeTool}
          onToolSelect={setActiveTool}
          onToggleLeftPanel={() => setShowLeftPanel(!showLeftPanel)}
          onToggleRightPanel={() => setShowRightPanel(!showRightPanel)}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onZoomToFit={zoomToFit}
          onToggleGrid={toggleGrid}
          onToggleSnap={toggleSnapping}
          onToggleOrtho={toggleOrthoMode}
          onFullscreen={toggleFullscreen}
          gridEnabled={gridEnabled}
          snapEnabled={snappingEnabled}
          orthoEnabled={orthoMode}
          isFullscreen={isFullscreen}
        />
      </motion.div>
      
      {/* Pannello sinistro (strumenti) */}
      <AnimatePresence>
        {showLeftPanel && (
          <motion.div 
            style={{ 
              gridArea: 'leftpanel', 
              borderRight: '1px solid #e0e0e0',
              overflow: 'auto'
            }}
            initial="closed"
            animate="open"
            exit="closed"
            variants={panelVariants}
          >
            <ToolsPanel activeTool={activeTool} onToolSelect={setActiveTool} />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Area principale di disegno */}
      <div 
        ref={canvasContainerRef}
        style={{ 
          gridArea: 'content', 
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: '#f8f9fa'
        }}
      >
        <DrawingCanvas 
          onCursorMove={setCursorPosition}
        />
        
        {/* Strumenti di navigazione rapida */}
        <motion.div
          style={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            background: 'rgba(255, 255, 255, 0.7)',
            borderRadius: 8,
            padding: 8,
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
          }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            style={{
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            onClick={handleZoomIn}
          >
            <ZoomIn size={20} />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            style={{
              background: '#F44336',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            onClick={handleZoomOut}
          >
            <ZoomOut size={20} />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            style={{
              background: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            onClick={() => zoomToFit}
          >
            <RefreshCw size={20} />
          </motion.button>
        </motion.div>
      </div>
      
      {/* Pannello destro (proprietà e livelli) */}
      <AnimatePresence>
        {showRightPanel && (
          <motion.div 
            style={{ 
              gridArea: 'rightpanel', 
              borderLeft: '1px solid #e0e0e0',
              overflow: 'auto'
            }}
            initial="closed"
            animate="open"
            exit="closed"
            variants={rightPanelVariants}
          >
            <PropertiesPanel selectedEntityIds={selectedEntityIds} />
            <LayersPanel />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Status bar */}
      <motion.div 
        style={{ 
          gridArea: 'statusbar', 
          borderTop: '1px solid #e0e0e0',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#f8f9fa'
        }}
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <StatusBar 
          cursorPosition={cursorPosition}
          zoom={zoom}
          tool={activeTool}
          selectedCount={selectedEntityIds.length}
          gridEnabled={gridEnabled}
          snapEnabled={snappingEnabled}
          orthoEnabled={orthoMode}
        />
        
        {showCoordinateInput && (
          <motion.div 
            style={{ marginLeft: 'auto' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <CoordinateInput 
              onSubmit={handleCoordinateInput} 
              initialValue={cursorPosition}
            />
          </motion.div>
        )}
      </motion.div>
      
      {/* Command line */}
      <AnimatePresence>
        {showCommandLine && (
          <motion.div 
            style={{ gridArea: 'commandline' }}
            initial="closed"
            animate="open"
            exit="closed"
            variants={bottomPanelVariants}
          >
            <CommandLine />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TechnicalDrawingEditor;