import React, { useState, useEffect } from 'react';
import DockPanel from './DockPanel';

interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  color: string;
}

interface LayersPanelProps {
  layers: Layer[];
  activeLayerId?: string;
  onLayerSelect?: (layerId: string) => void;
  onLayerVisibilityChange?: (layerId: string, visible: boolean) => void;
  onLayerLockChange?: (layerId: string, locked: boolean) => void;
  onLayerColorChange?: (layerId: string, color: string) => void;
  onLayerRename?: (layerId: string, name: string) => void;
  onLayerAdd?: (layer: Omit<Layer, 'id'>) => void;
  onLayerDelete?: (layerId: string) => void;
  defaultPosition?: 'left' | 'right' | 'top' | 'bottom' | 'float';
}

const LayersPanel: React.FC<LayersPanelProps> = ({
  layers,
  activeLayerId,
  onLayerSelect,
  onLayerVisibilityChange,
  onLayerLockChange,
  onLayerColorChange,
  onLayerRename,
  onLayerAdd,
  onLayerDelete,
  defaultPosition = 'right',
}) => {
  const [newLayerName, setNewLayerName] = useState('');
  const [editLayerId, setEditLayerId] = useState<string | null>(null);
  const [editLayerName, setEditLayerName] = useState('');

  // Handle adding a new layer
  const handleAddLayer = () => {
    if (!newLayerName.trim()) return;
    
    if (onLayerAdd) {
      onLayerAdd({
        name: newLayerName,
        visible: true,
        locked: false,
        color: generateRandomColor(),
      });
    }
    
    setNewLayerName('');
  };

  // Handle deleting a layer
  const handleDeleteLayer = (layerId: string) => {
    if (onLayerDelete) {
      onLayerDelete(layerId);
    }
  };

  // Handle starting to rename a layer
  const handleStartRename = (layer: Layer) => {
    setEditLayerId(layer.id);
    setEditLayerName(layer.name);
  };

  // Handle saving the rename operation
  const handleSaveRename = () => {
    if (!editLayerId || !editLayerName.trim()) {
      setEditLayerId(null);
      return;
    }
    
    if (onLayerRename) {
      onLayerRename(editLayerId, editLayerName);
    }
    
    setEditLayerId(null);
  };

  // Generate a random color for new layers
  const generateRandomColor = (): string => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  // Render each layer row
  const renderLayerRow = (layer: Layer) => {
    const isActive = layer.id === activeLayerId;
    const isEditing = layer.id === editLayerId;
    
    return (
      <div
        key={layer.id}
        className={`layer-row ${isActive ? 'active' : ''}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px',
          marginBottom: '4px',
          backgroundColor: isActive ? '#e6f7ff' : 'transparent',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
        onClick={() => onLayerSelect && onLayerSelect(layer.id)}
      >
        {/* Visibility toggle */}
        <button
          type="button"
          className="visibility-btn"
          onClick={(e) => {
            e.stopPropagation();
            onLayerVisibilityChange && onLayerVisibilityChange(layer.id, !layer.visible);
          }}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
          }}
          title={layer.visible ? 'Hide layer' : 'Show layer'}
        >
          <span style={{ fontSize: '14px' }}>{layer.visible ? '👁️' : '👁️‍🗨️'}</span>
        </button>
        
        {/* Lock toggle */}
        <button
          type="button"
          className="lock-btn"
          onClick={(e) => {
            e.stopPropagation();
            onLayerLockChange && onLayerLockChange(layer.id, !layer.locked);
          }}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
          }}
          title={layer.locked ? 'Unlock layer' : 'Lock layer'}
        >
          <span style={{ fontSize: '14px' }}>{layer.locked ? '🔒' : '🔓'}</span>
        </button>
        
        {/* Color indicator */}
        <div
          className="color-indicator"
          style={{
            width: '16px',
            height: '16px',
            backgroundColor: layer.color,
            borderRadius: '3px',
            marginRight: '8px',
            cursor: 'pointer',
          }}
          onClick={(e) => {
            e.stopPropagation();
            const newColor = prompt('Enter new color (hex format, e.g. #FF0000):', layer.color);
            if (newColor && onLayerColorChange) {
              onLayerColorChange(layer.id, newColor);
            }
          }}
          title="Change layer color"
        />
        
        {/* Layer name (editable or not) */}
        {isEditing ? (
          <input
            type="text"
            value={editLayerName}
            onChange={(e) => setEditLayerName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSaveRename();
              } else if (e.key === 'Escape') {
                setEditLayerId(null);
              }
            }}
            onBlur={handleSaveRename}
            autoFocus
            onClick={(e) => e.stopPropagation()}
            style={{
              flexGrow: 1,
              border: '1px solid #ddd',
              borderRadius: '3px',
              padding: '2px 4px',
            }}
          />
        ) : (
          <div
            className="layer-name"
            style={{ flexGrow: 1 }}
            onDoubleClick={() => handleStartRename(layer)}
          >
            {layer.name}
          </div>
        )}
        
        {/* Delete button */}
        <button
          type="button"
          className="delete-btn"
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm(`Are you sure you want to delete layer "${layer.name}"?`)) {
              handleDeleteLayer(layer.id);
            }
          }}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            marginLeft: '4px',
          }}
          title="Delete layer"
        >
          <span style={{ fontSize: '14px' }}>🗑️</span>
        </button>
      </div>
    );
  };

  return (
    <DockPanel
      title="Layers"
      defaultPosition={defaultPosition}
      defaultWidth={280}
      minWidth={200}
    >
      <div className="layers-panel-content">
        {/* Layer list */}
        <div className="layer-list" style={{ marginBottom: '16px' }}>
          {layers.map(renderLayerRow)}
          
          {layers.length === 0 && (
            <div className="no-layers" style={{ color: '#888', textAlign: 'center', padding: '16px' }}>
              No layers found. Create a new layer below.
            </div>
          )}
        </div>
        
        {/* Add layer form */}
        <div className="add-layer-form" style={{ display: 'flex', marginTop: '12px' }}>
          <input
            type="text"
            value={newLayerName}
            onChange={(e) => setNewLayerName(e.target.value)}
            placeholder="New layer name"
            style={{
              flexGrow: 1,
              borderRadius: '4px 0 0 4px',
              border: '1px solid #ddd',
              padding: '6px 8px',
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAddLayer();
              }
            }}
          />
          <button
            type="button"
            onClick={handleAddLayer}
            disabled={!newLayerName.trim()}
            style={{
              backgroundColor: '#1890ff',
              color: 'white',
              border: 'none',
              borderRadius: '0 4px 4px 0',
              padding: '6px 12px',
              cursor: newLayerName.trim() ? 'pointer' : 'not-allowed',
              opacity: newLayerName.trim() ? 1 : 0.7,
            }}
          >
            Add
          </button>
        </div>
      </div>
    </DockPanel>
  );
};

export default LayersPanel; 