import React from 'react';
import { motion } from 'framer-motion';
import { Point } from '../TechnicalDrawingTypes';

interface StatusBarProps {
  cursorPosition: Point;
  zoom: number;
  tool: string;
  selectedCount: number;
  gridEnabled: boolean;
  snapEnabled: boolean;
  orthoEnabled: boolean;
}

const StatusBar: React.FC<StatusBarProps> = ({
  cursorPosition,
  zoom,
  tool,
  selectedCount,
  gridEnabled,
  snapEnabled,
  orthoEnabled
}) => {
  return (
    <motion.div
      className="status-bar"
      style={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        height: '30px',
        fontSize: '12px',
        color: '#555',
        backgroundColor: '#f8f9fa'
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      {/* Coordinate */}
      <div className="status-item coordinates"
        style={{
          padding: '0 10px',
          display: 'flex',
          alignItems: 'center',
          borderRight: '1px solid #e0e0e0'
        }}
      >
        <span>X: {cursorPosition.x.toFixed(2)}</span>
        <span style={{ margin: '0 5px' }}>|</span>
        <span>Y: {cursorPosition.y.toFixed(2)}</span>
      </div>
      
      {/* Zoom */}
      <div className="status-item zoom"
        style={{
          padding: '0 10px',
          display: 'flex',
          alignItems: 'center',
          borderRight: '1px solid #e0e0e0'
        }}
      >
        <span>Zoom: {(zoom * 100).toFixed(0)}%</span>
      </div>
      
      {/* Tool */}
      <div className="status-item tool"
        style={{
          padding: '0 10px',
          display: 'flex',
          alignItems: 'center',
          borderRight: '1px solid #e0e0e0'
        }}
      >
        <span>Strumento: {tool.charAt(0).toUpperCase() + tool.slice(1)}</span>
      </div>
      
      {/* Objects Selected */}
      <div className="status-item selection"
        style={{
          padding: '0 10px',
          display: 'flex',
          alignItems: 'center',
          borderRight: '1px solid #e0e0e0'
        }}
      >
        <span>Selezionati: {selectedCount}</span>
      </div>
      
      {/* Toggle States */}
      <div className="status-item toggles"
        style={{
          padding: '0 10px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}
      >
        <div 
          className={`toggle-indicator ${gridEnabled ? 'active' : ''}`}
          style={{
            backgroundColor: gridEnabled ? '#91d5ff' : '#e0e0e0',
            padding: '2px 6px',
            borderRadius: '10px',
            fontSize: '10px',
            color: gridEnabled ? '#1890ff' : '#666'
          }}
        >
          GRIGLIA
        </div>
        
        <div 
          className={`toggle-indicator ${snapEnabled ? 'active' : ''}`}
          style={{
            backgroundColor: snapEnabled ? '#91d5ff' : '#e0e0e0',
            padding: '2px 6px',
            borderRadius: '10px',
            fontSize: '10px',
            color: snapEnabled ? '#1890ff' : '#666'
          }}
        >
          SNAP
        </div>
        
        <div 
          className={`toggle-indicator ${orthoEnabled ? 'active' : ''}`}
          style={{
            backgroundColor: orthoEnabled ? '#91d5ff' : '#e0e0e0',
            padding: '2px 6px',
            borderRadius: '10px',
            fontSize: '10px',
            color: orthoEnabled ? '#1890ff' : '#666'
          }}
        >
          ORTO
        </div>
      </div>
    </motion.div>
  );
};

export default StatusBar;