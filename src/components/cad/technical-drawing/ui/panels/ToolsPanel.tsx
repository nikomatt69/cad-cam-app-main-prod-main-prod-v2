import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
 
  Pencil, 
  Square, 
  Circle, 
  Ruler,
  Type,

  Pentagon,
  Spline,

  Scissors,
  Move,
  Copy,
 
  HelpCircle,
  Edit,
  Trash2,
  Layers,
  Grid,
  Hash,
  Compass,
  Settings,
  ChevronDown,
  ChevronRight,
  Pointer,
  EllipsisIcon,
  BeanIcon,
  RotateCw
} from 'lucide-react';

interface ToolsPanelProps {
  activeTool: string;
  onToolSelect: (tool: string) => void;
  defaultPosition?: 'left' | 'right';
}

const ToolsPanel: React.FC<ToolsPanelProps> = ({
  activeTool,
  onToolSelect,
  defaultPosition = 'left'
}) => {
  const [expandedCategory, setExpandedCategory] = useState<string>('drawing');
  
  const toggleCategory = (category: string) => {
    setExpandedCategory(prevCategory => 
      prevCategory === category ? '' : category
    );
  };
  
  // Definiamo le categorie di strumenti
  const toolCategories = [
    {
      id: 'selection',
      name: 'Selezione',
      icon: <Pointer size={18} />,
      tools: [
        { id: 'select', name: 'Seleziona', icon: <Pointer size={18} /> },
        { id: 'move', name: 'Sposta', icon: <Move size={18} /> },
        { id: 'copy', name: 'Copia', icon: <Copy size={18} /> },
        { id: 'rotate', name: 'Ruota', icon: <RotateCw size={18} /> }
      ]
    },
    {
      id: 'drawing',
      name: 'Disegno',
      icon: <Pencil size={18} />,
      tools: [
        { id: 'line', name: 'Linea', icon: <Pencil size={18} /> },
        { id: 'rectangle', name: 'Rettangolo', icon: <Square size={18} /> },
        { id: 'circle', name: 'Cerchio', icon: <Circle size={18} /> },
        { id: 'ellipse', name: 'Ellisse', icon: <EllipsisIcon size={18} /> },
        { id: 'arc', name: 'Arco', icon: <Compass size={18} /> },
        { id: 'polyline', name: 'Polilinea', icon: <Hash size={18} /> },
        { id: 'polygon', name: 'Poligono', icon: <Pentagon size={18} /> },
        { id: 'spline', name: 'Spline', icon: <Spline size={18} /> },
        { id: 'bezier', name: 'Bezier', icon: <BeanIcon size={18} /> }
      ]
    },
    {
      id: 'modification',
      name: 'Modifica',
      icon: <Edit size={18} />,
      tools: [
        { id: 'trim', name: 'Taglia', icon: <Scissors size={18} /> },
        { id: 'extend', name: 'Estendi', icon: <Edit size={18} /> },
        { id: 'fillet', name: 'Raccordo', icon: <Edit size={18} /> },
        { id: 'chamfer', name: 'Smusso', icon: <Edit size={18} /> },
        { id: 'offset', name: 'Offset', icon: <Edit size={18} /> },
        { id: 'delete', name: 'Elimina', icon: <Trash2 size={18} /> }
      ]
    },
    {
      id: 'annotation',
      name: 'Annotazioni',
      icon: <Type size={18} />,
      tools: [
        { id: 'text', name: 'Testo', icon: <Type size={18} /> },
        { id: 'dimension-linear', name: 'Quota lineare', icon: <Ruler size={18} /> },
        { id: 'dimension-aligned', name: 'Quota allineata', icon: <Ruler size={18} /> },
        { id: 'dimension-angle', name: 'Quota angolare', icon: <Ruler size={18} /> },
        { id: 'dimension-radius', name: 'Quota raggio', icon: <Circle size={18} /> },
        { id: 'dimension-diameter', name: 'Quota diametro', icon: <Circle size={18} /> }
      ]
    },
    {
      id: 'settings',
      name: 'Impostazioni',
      icon: <Settings size={18} />,
      tools: [
        { id: 'layers', name: 'Livelli', icon: <Layers size={18} /> },
        { id: 'grid', name: 'Griglia', icon: <Grid size={18} /> },
        { id: 'settings', name: 'Preferenze', icon: <Settings size={18} /> },
        { id: 'help', name: 'Aiuto', icon: <HelpCircle size={18} /> }
      ]
    }
  ];
  
  return (
    <motion.div
      className="tools-panel"
      style={{
        width: '250px',
        height: '100%',
        overflowY: 'auto',
        backgroundColor: '#f8f9fa',
        borderRight: defaultPosition === 'left' ? '1px solid #e0e0e0' : 'none',
        borderLeft: defaultPosition === 'right' ? '1px solid #e0e0e0' : 'none',
        padding: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}
      initial={{ opacity: 0, x: defaultPosition === 'left' ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div 
        className="tools-panel-header"
        style={{
          fontWeight: 'bold',
          fontSize: '16px',
          padding: '8px',
          borderBottom: '1px solid #e0e0e0',
          marginBottom: '8px'
        }}
      >
        Strumenti
      </div>
      
      {toolCategories.map(category => (
        <div key={category.id} className="tools-category">
          <motion.div
            className="category-header"
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px',
              borderRadius: '4px',
              cursor: 'pointer',
              backgroundColor: expandedCategory === category.id ? '#e6f7ff' : 'transparent',
              color: expandedCategory === category.id ? '#1890ff' : '#333'
            }}
            onClick={() => toggleCategory(category.id)}
            whileHover={{ backgroundColor: expandedCategory === category.id ? '#e6f7ff' : '#f0f0f0' }}
          >
            <div style={{ marginRight: '8px' }}>
              {category.icon}
            </div>
            <div style={{ flex: 1 }}>
              {category.name}
            </div>
            <div>
              {expandedCategory === category.id ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </div>
          </motion.div>
          
          <AnimatePresence>
            {expandedCategory === category.id && (
              <motion.div
                className="tools-list"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '8px',
                  padding: '8px'
                }}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                {category.tools.map(tool => (
                  <motion.div
                    key={tool.id}
                    className="tool-item"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      backgroundColor: activeTool === tool.id ? '#1890ff' : 'transparent',
                      color: activeTool === tool.id ? 'white' : '#333'
                    }}
                    onClick={() => onToolSelect(tool.id)}
                    whileHover={{ 
                      backgroundColor: activeTool === tool.id ? '#1890ff' : '#f0f0f0',
                      scale: 1.05
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div style={{ marginBottom: '4px' }}>
                      {tool.icon}
                    </div>
                    <div style={{ 
                      fontSize: '12px',
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      width: '100%'
                    }}>
                      {tool.name}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
      
      {/* Tooltip per lo strumento attivo */}
      <motion.div
        style={{
          marginTop: 'auto',
          padding: '12px',
          backgroundColor: '#e6f7ff',
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.3 }}
      >
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
          {toolCategories
            .flatMap(category => category.tools)
            .find(tool => tool.id === activeTool)?.name || 'Strumento'}
        </div>
        <div style={{ fontSize: '12px', color: '#666' }}>
          {getToolDescription(activeTool)}
        </div>
      </motion.div>
    </motion.div>
  );
};

function getToolDescription(toolId: string): string {
  switch(toolId) {
    case 'select':
      return 'Seleziona oggetti singoli o multipli. Tieni premuto Shift per una selezione multipla.';
    case 'line':
      return 'Disegna una linea retta. Fai clic per impostare il punto iniziale, poi fai clic di nuovo per il punto finale.';
    case 'rectangle':
      return 'Disegna un rettangolo. Fai clic e trascina per definire gli angoli opposti.';
    case 'circle':
      return 'Disegna un cerchio. Fai clic per impostare il centro, poi trascina per definire il raggio.';
    case 'ellipse':
      return 'Disegna un\'ellisse. Fai clic per impostare il centro, poi trascina per definire i raggi.';
    case 'polyline':
      return 'Disegna una polilinea. Fai clic per aggiungere vertici, doppio clic per terminare.';
    case 'dimension-linear':
      return 'Aggiungi una quota lineare. Seleziona due punti da quotare, poi posiziona la linea di quota.';
    case 'text':
      return 'Aggiungi un\'annotazione testuale. Fai clic per posizionare, poi digita il testo.';
    default:
      return 'Strumento di disegno. Consulta la documentazione per maggiori dettagli.';
  }
}

export default ToolsPanel;