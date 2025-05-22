import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTechnicalDrawingStore } from '../../technicalDrawingStore';
import {
  Layers,
  Plus,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  MoveVertical
} from 'lucide-react';

interface LayersPanelProps {
  defaultPosition?: 'left' | 'right';
}

const LayersPanel: React.FC<LayersPanelProps> = ({
  defaultPosition = 'right'
}) => {
  const {
    drawingLayers,
    activeLayer,
    addLayer,
    updateLayer,
    deleteLayer,
    setActiveLayer
  } = useTechnicalDrawingStore();
  
  const [isAddingLayer, setIsAddingLayer] = useState(false);
  const [newLayerName, setNewLayerName] = useState('');
  const [newLayerColor, setNewLayerColor] = useState('#000000');
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingColor, setEditingColor] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);

  const handleAddLayer = () => {
    if (newLayerName.trim() === '') return;
    
    addLayer({
      name: newLayerName.trim(),
      color: newLayerColor,
      visible: true,
      locked: false,
      order: drawingLayers.length
    });
    
    setNewLayerName('');
    setNewLayerColor('#000000');
    setIsAddingLayer(false);
  };
  
  const handleCancelAdd = () => {
    setNewLayerName('');
    setNewLayerColor('#000000');
    setIsAddingLayer(false);
  };
  
  const handleEditLayer = (layerId: string) => {
    const layer = drawingLayers.find(l => l.id === layerId);
    if (!layer) return;
    
    setEditingLayerId(layerId);
    setEditingName(layer.name);
    setEditingColor(layer.color);
  };
  
  const handleSaveEdit = () => {
    if (!editingLayerId || editingName.trim() === '') return;
    
    updateLayer(editingLayerId, {
      name: editingName.trim(),
      color: editingColor
    });
    
    setEditingLayerId(null);
    setEditingName('');
    setEditingColor('');
  };
  
  const handleCancelEdit = () => {
    setEditingLayerId(null);
    setEditingName('');
    setEditingColor('');
  };
  
  const handleToggleVisibility = (layerId: string, visible: boolean) => {
    updateLayer(layerId, { visible: !visible });
  };
  
  const handleToggleLocked = (layerId: string, locked: boolean) => {
    updateLayer(layerId, { locked: !locked });
  };
  
  const handleDeleteLayer = (layerId: string) => {
    if (drawingLayers.length <= 1) return; // Mantieni almeno un livello
    
    const layer = drawingLayers.find(l => l.id === layerId);
    
    // Non eliminare il livello di default
    if (layer?.name === 'default') return;
    
    if (window.confirm(`Sei sicuro di voler eliminare il livello "${layer?.name}"?`)) {
      deleteLayer(layerId);
    }
  };
  
  const handleSetActiveLayer = (layerId: string) => {
    const layer = drawingLayers.find(l => l.id === layerId);
    if (layer) {
      setActiveLayer(layer.name);
    }
  };
  
  // Varianti per animazioni
  const containerVariants = {
    expanded: { height: 'auto', opacity: 1 },
    collapsed: { height: 0, opacity: 0 }
  };
  
  return (
    <motion.div
      className="layers-panel"
      style={{
        width: '100%',
        backgroundColor: '#f8f9fa',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid #e0e0e0',
          paddingBottom: '8px',
          marginBottom: '8px'
        }}
      >
        <Layers size={18} style={{ marginRight: '8px' }} />
        <div
          style={{
            fontWeight: 'bold',
            fontSize: '16px',
            flex: 1
          }}
        >
          Livelli
        </div>
        <motion.button
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px'
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </motion.button>
      </div>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial='collapsed'
            animate='expanded'
            exit='collapsed'
            variants={containerVariants}
            transition={{ duration: 0.3 }}
            style={{ overflow: 'hidden' }}
          >
            {/* Lista dei livelli */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {drawingLayers
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .map(layer => (
                  <div
                    key={layer.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '8px',
                      borderRadius: '4px',
                      backgroundColor: layer.name === activeLayer ? '#e6f7ff' : 'white',
                      border: layer.name === activeLayer ? '1px solid #91d5ff' : '1px solid #e0e0e0'
                    }}
                  >
                    {editingLayerId === layer.id ? (
                      // Modalità di modifica
                      <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <input
                          type="color"
                          value={editingColor}
                          onChange={e => setEditingColor(e.target.value)}
                          style={{ marginRight: '8px', width: '24px', height: '24px' }}
                        />
                        <input
                          type="text"
                          value={editingName}
                          onChange={e => setEditingName(e.target.value)}
                          autoFocus
                          style={{
                            flex: 1,
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: '1px solid #d9d9d9'
                          }}
                        />
                        <div style={{ display: 'flex', marginLeft: '8px' }}>
                          <motion.button
                            onClick={handleSaveEdit}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '4px',
                              color: '#52c41a'
                            }}
                          >
                            <Check size={16} />
                          </motion.button>
                          <motion.button
                            onClick={handleCancelEdit}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '4px',
                              color: '#ff4d4f'
                            }}
                          >
                            <X size={16} />
                          </motion.button>
                        </div>
                      </div>
                    ) : (
                      // Visualizzazione normale
                      <>
                        <div
                          style={{
                            width: '16px',
                            height: '16px',
                            backgroundColor: layer.color,
                            border: '1px solid #d9d9d9',
                            borderRadius: '3px',
                            marginRight: '8px'
                          }}
                        />
                        <div
                          style={{
                            cursor: 'pointer',
                            flex: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            opacity: layer.visible ? 1 : 0.5
                          }}
                          onClick={() => handleSetActiveLayer(layer.id)}
                        >
                          {layer.name}
                        </div>
                        <div style={{ display: 'flex', gap: '2px' }}>
                          {/* Visibilità */}
                          <motion.button
                            onClick={() => handleToggleVisibility(layer.id, layer.visible)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '4px',
                              color: layer.visible ? '#1890ff' : '#d9d9d9'
                            }}
                          >
                            {layer.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                          </motion.button>
                          
                          {/* Blocco */}
                          <motion.button
                            onClick={() => handleToggleLocked(layer.id, layer.locked)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '4px',
                              color: layer.locked ? '#ff4d4f' : '#d9d9d9'
                            }}
                          >
                            {layer.locked ? <Lock size={16} /> : <Unlock size={16} />}
                          </motion.button>
                          
                          {/* Modifica */}
                          <motion.button
                            onClick={() => handleEditLayer(layer.id)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '4px',
                              color: '#666'
                            }}
                          >
                            <Edit size={16} />
                          </motion.button>
                          
                          {/* Elimina (disabilitato per il livello di default) */}
                          <motion.button
                            onClick={() => handleDeleteLayer(layer.id)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: layer.name === 'default' ? 'not-allowed' : 'pointer',
                              padding: '4px',
                              color: layer.name === 'default' ? '#d9d9d9' : '#ff4d4f',
                              opacity: layer.name === 'default' ? 0.5 : 1
                            }}
                            disabled={layer.name === 'default'}
                          >
                            <Trash2 size={16} />
                          </motion.button>
                          
                          {/* Ordine (drag handle) */}
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'grab',
                              padding: '4px',
                              color: '#666'
                            }}
                          >
                            <MoveVertical size={16} />
                          </motion.button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
            </div>
            
            {/* Nuovo livello form */}
            {isAddingLayer ? (
              <motion.div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginTop: '12px',
                  padding: '8px',
                  backgroundColor: 'white',
                  borderRadius: '4px',
                  border: '1px solid #e0e0e0'
                }}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <input
                  type="color"
                  value={newLayerColor}
                  onChange={e => setNewLayerColor(e.target.value)}
                  style={{ marginRight: '8px', width: '24px', height: '24px' }}
                />
                <input
                  type="text"
                  value={newLayerName}
                  onChange={e => setNewLayerName(e.target.value)}
                  placeholder="Nome del livello"
                  autoFocus
                  style={{
                    flex: 1,
                    padding: '4px 8px',
                    borderRadius: '4px',
                    border: '1px solid #d9d9d9'
                  }}
                />
                <div style={{ display: 'flex', marginLeft: '8px' }}>
                  <motion.button
                    onClick={handleAddLayer}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      color: '#52c41a'
                    }}
                  >
                    <Check size={16} />
                  </motion.button>
                  <motion.button
                    onClick={handleCancelAdd}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      color: '#ff4d4f'
                    }}
                  >
                    <X size={16} />
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              <motion.button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: '12px',
                  padding: '8px',
                  backgroundColor: '#e6f7ff',
                  border: '1px dashed #91d5ff',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  color: '#1890ff',
                  width: '100%'
                }}
                whileHover={{ backgroundColor: '#bae7ff' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsAddingLayer(true)}
              >
                <Plus size={16} style={{ marginRight: '8px' }} />
                Aggiungi nuovo livello
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default LayersPanel;