import React from 'react';
import { motion } from 'framer-motion';
import {
  
  Pencil,
  Square,
  Circle,
  Ruler,
  Type,
  Grid,
  Maximize,
  Minimize,
  PanelLeft,
  PanelRight,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Save,
  Download,
  Magnet,
  Lock,
  Pointer
} from 'lucide-react';

interface ToolbarProps {
  activeTool: string;
  onToolSelect: (tool: string) => void;
  onToggleLeftPanel: () => void;
  onToggleRightPanel: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomToFit: () => void;
  onToggleGrid: () => void;
  onToggleSnap: () => void;
  onToggleOrtho: () => void;
  onFullscreen: () => void;
  gridEnabled: boolean;
  snapEnabled: boolean;
  orthoEnabled: boolean;
  isFullscreen: boolean;
}

const Toolbar: React.FC<ToolbarProps> = ({
  activeTool,
  onToolSelect,
  onToggleLeftPanel,
  onToggleRightPanel,
  onZoomIn,
  onZoomOut,
  onZoomToFit,
  onToggleGrid,
  onToggleSnap,
  onToggleOrtho,
  onFullscreen,
  gridEnabled,
  snapEnabled,
  orthoEnabled,
  isFullscreen
}) => {
  // Definizione degli strumenti
  const tools = [
    { id: 'select', icon: <Pointer size={18} />, label: 'Seleziona' },
    { id: 'line', icon: <Pencil size={18} />, label: 'Linea' },
    { id: 'rectangle', icon: <Square size={18} />, label: 'Rettangolo' },
    { id: 'circle', icon: <Circle size={18} />, label: 'Cerchio' },
    { id: 'dimension', icon: <Ruler size={18} />, label: 'Quota' },
    { id: 'text', icon: <Type size={18} />, label: 'Testo' },
  ];
  
  return (
    <motion.div
      className="toolbar"
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '8px 12px',
        borderBottom: '1px solid #e0e0e0',
        backgroundColor: '#f8f9fa',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Pannelli toggle */}
      <div className="toolbar-group">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="toolbar-button"
          onClick={onToggleLeftPanel}
          title="Pannello Strumenti"
          style={{
            background: 'none',
            border: 'none',
            borderRadius: '4px',
            padding: '6px',
            margin: '0 2px',
            cursor: 'pointer',
            color: '#333'
          }}
        >
          <PanelLeft size={18} />
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="toolbar-button"
          onClick={onToggleRightPanel}
          title="Pannello Proprietà"
          style={{
            background: 'none',
            border: 'none',
            borderRadius: '4px',
            padding: '6px',
            margin: '0 2px',
            cursor: 'pointer',
            color: '#333'
          }}
        >
          <PanelRight size={18} />
        </motion.button>
      </div>
      
      {/* Separatore */}
      <div 
        style={{ 
          width: '1px', 
          height: '24px', 
          backgroundColor: '#e0e0e0', 
          margin: '0 8px' 
        }} 
      />
      
      {/* Strumenti di disegno */}
      <div 
        className="toolbar-group" 
        style={{ 
          display: 'flex',
          alignItems: 'center'
        }}
      >
        {tools.map(tool => (
          <motion.button
            key={tool.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`toolbar-button ${activeTool === tool.id ? 'active' : ''}`}
            onClick={() => onToolSelect(tool.id)}
            title={tool.label}
            style={{
              background: activeTool === tool.id ? '#e6f7ff' : 'none',
              border: activeTool === tool.id ? '1px solid #91d5ff' : '1px solid transparent',
              borderRadius: '4px',
              padding: '6px',
              margin: '0 2px',
              cursor: 'pointer',
              color: activeTool === tool.id ? '#1890ff' : '#333'
            }}
          >
            {tool.icon}
          </motion.button>
        ))}
      </div>
      
      {/* Separatore */}
      <div 
        style={{ 
          width: '1px', 
          height: '24px', 
          backgroundColor: '#e0e0e0', 
          margin: '0 8px' 
        }} 
      />
      
      {/* Controlli di visualizzazione */}
      <div 
        className="toolbar-group"
        style={{ 
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`toolbar-button ${gridEnabled ? 'active' : ''}`}
          onClick={onToggleGrid}
          title="Mostra/Nascondi Griglia"
          style={{
            background: gridEnabled ? '#e6f7ff' : 'none',
            border: gridEnabled ? '1px solid #91d5ff' : '1px solid transparent',
            borderRadius: '4px',
            padding: '6px',
            margin: '0 2px',
            cursor: 'pointer',
            color: gridEnabled ? '#1890ff' : '#333'
          }}
        >
          <Grid size={18} />
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`toolbar-button ${snapEnabled ? 'active' : ''}`}
          onClick={onToggleSnap}
          title="Attiva/Disattiva Snap"
          style={{
            background: snapEnabled ? '#e6f7ff' : 'none',
            border: snapEnabled ? '1px solid #91d5ff' : '1px solid transparent',
            borderRadius: '4px',
            padding: '6px',
            margin: '0 2px',
            cursor: 'pointer',
            color: snapEnabled ? '#1890ff' : '#333'
          }}
        >
          <Magnet size={18} />
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`toolbar-button ${orthoEnabled ? 'active' : ''}`}
          onClick={onToggleOrtho}
          title="Modalità Ortogonale"
          style={{
            background: orthoEnabled ? '#e6f7ff' : 'none',
            border: orthoEnabled ? '1px solid #91d5ff' : '1px solid transparent',
            borderRadius: '4px',
            padding: '6px',
            margin: '0 2px',
            cursor: 'pointer',
            color: orthoEnabled ? '#1890ff' : '#333'
          }}
        >
          <Lock size={18} />
        </motion.button>
      </div>
      
      {/* Separatore */}
      <div 
        style={{ 
          width: '1px', 
          height: '24px', 
          backgroundColor: '#e0e0e0', 
          margin: '0 8px' 
        }} 
      />
      
      {/* Controlli zoom */}
      <div 
        className="toolbar-group"
        style={{ 
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="toolbar-button"
          onClick={onZoomIn}
          title="Zoom In"
          style={{
            background: 'none',
            border: '1px solid transparent',
            borderRadius: '4px',
            padding: '6px',
            margin: '0 2px',
            cursor: 'pointer',
            color: '#333'
          }}
        >
          <ZoomIn size={18} />
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="toolbar-button"
          onClick={onZoomOut}
          title="Zoom Out"
          style={{
            background: 'none',
            border: '1px solid transparent',
            borderRadius: '4px',
            padding: '6px',
            margin: '0 2px',
            cursor: 'pointer',
            color: '#333'
          }}
        >
          <ZoomOut size={18} />
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="toolbar-button"
          onClick={onZoomToFit}
          title="Zoom per Adattare"
          style={{
            background: 'none',
            border: '1px solid transparent',
            borderRadius: '4px',
            padding: '6px',
            margin: '0 2px',
            cursor: 'pointer',
            color: '#333'
          }}
        >
          <RefreshCw size={18} />
        </motion.button>
      </div>
      
      {/* Separatore */}
      <div 
        style={{ 
          width: '1px', 
          height: '24px', 
          backgroundColor: '#e0e0e0', 
          margin: '0 8px' 
        }} 
      />
      
      {/* Controlli file */}
      <div 
        className="toolbar-group"
        style={{ 
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="toolbar-button"
          onClick={() => {}}
          title="Salva"
          style={{
            background: 'none',
            border: '1px solid transparent',
            borderRadius: '4px',
            padding: '6px',
            margin: '0 2px',
            cursor: 'pointer',
            color: '#333'
          }}
        >
          <Save size={18} />
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="toolbar-button"
          onClick={() => {}}
          title="Esporta"
          style={{
            background: 'none',
            border: '1px solid transparent',
            borderRadius: '4px',
            padding: '6px',
            margin: '0 2px',
            cursor: 'pointer',
            color: '#333'
          }}
        >
          <Download size={18} />
        </motion.button>
      </div>
      
      {/* Separatore */}
      <div 
        style={{ 
          width: '1px', 
          height: '24px', 
          backgroundColor: '#e0e0e0', 
          margin: '0 8px' 
        }} 
      />
      
      {/* Fullscreen toggle */}
      <div className="toolbar-group">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="toolbar-button"
          onClick={onFullscreen}
          title={isFullscreen ? 'Esci da Schermo Intero' : 'Schermo Intero'}
          style={{
            background: 'none',
            border: '1px solid transparent',
            borderRadius: '4px',
            padding: '6px',
            margin: '0 2px',
            cursor: 'pointer',
            color: '#333'
          }}
        >
          {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
        </motion.button>
      </div>
    </motion.div>
  );
};

export default Toolbar;