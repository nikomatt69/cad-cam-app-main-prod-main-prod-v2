import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTechnicalDrawingStore } from '../../technicalDrawingStore';
import {
  Settings,
  ChevronDown,
  ChevronRight,
  Square,
  Circle,
  Pencil,
  Ruler,
  Type,
  FileDigit,
  Layers,
  Eye,
  Palette,

  Lock,
  Info
} from 'lucide-react';
import { DrawingEntity } from '../../TechnicalDrawingTypes';

interface PropertiesPanelProps {
  selectedEntityIds: string[];
  defaultPosition?: 'left' | 'right';
}

/**
 * Pannello delle proprietà che mostra e permette di modificare le proprietà delle entità selezionate.
 */
const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedEntityIds,
  defaultPosition = 'right'
}) => {
  const {
    entities,
    dimensions,
    annotations,
    drawingLayers,
    updateEntity,
    updateDimension,
    updateAnnotation
  } = useTechnicalDrawingStore();
  
  // Stati di espansione delle sezioni
  const [expandedSections, setExpandedSections] = useState({
    main: true,
    geometry: true,
    style: true,
    layer: true
  });
  
  // Stato delle proprietà comuni
  const [commonProps, setCommonProps] = useState<Record<string, any>>({});
  
  // Tipo di entità selezionate (se omogenee)
  const [entityType, setEntityType] = useState<string | null>(null);
  
  // Aggiorna le proprietà comuni quando cambiano le selezioni
  useEffect(() => {
    if (selectedEntityIds.length === 0) {
      // Prevent unnecessary re-renders if commonProps is already empty
      if (Object.keys(commonProps).length > 0) {
        setCommonProps({});
      }
      if (entityType !== null) {
        setEntityType(null);
      }
      return;
    }
    
    // Recupera le entità selezionate
    const selectedEntities = selectedEntityIds.map(id => 
      entities[id] || dimensions[id] || annotations[id]
    ).filter(Boolean);
    
    if (selectedEntities.length === 0) {
      setCommonProps({ });
      setEntityType(null);
      return;
    }
    
    // Controlla se tutte le entità sono dello stesso tipo
    const firstType = selectedEntities[0]?.type;
    const allSameType = selectedEntities.every(e => e?.type === firstType);
    
    if (allSameType) {
      setEntityType(firstType);
    } else {
      setEntityType('mixed');
    }
    
    // Trova le proprietà comuni
    const props: Record<string, any> = {};
    
    // Inizializza con tutte le proprietà della prima entità
    if (selectedEntities[0]) {
      Object.entries(selectedEntities[0]).forEach(([key, value]) => {
        // Ignora id e proprietà non modificabili
        if (key !== 'id') {
          props[key] = value;
        }
      });
    }
    
    // Mantieni solo le proprietà con valori uguali in tutte le entità
    for (let i = 1; i < selectedEntities.length; i++) {
      Object.keys(props).forEach(key => {
        // Se il valore è diverso o non esiste nell'entità corrente, impostalo a undefined
        if (!selectedEntities[i] || JSON.stringify(props[key]) !== JSON.stringify(selectedEntities[i]?.[key as keyof typeof selectedEntities[ typeof i]])) {
          props[key] = undefined;
        }
      });
    }
    
    setCommonProps(props);
  }, [selectedEntityIds, entities, dimensions, annotations, commonProps, entityType]);
  
  // Toggle per le sezioni espandibili
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  // Aggiorna una proprietà per tutte le entità selezionate
  const updateProperty = (path: string, value: any) => {
    const pathParts = path.split('.');
    
    selectedEntityIds.forEach(id => {
      const entity = entities[id] || dimensions[id] || annotations[id];
      if (!entity) return;
      
      // Costruisci l'oggetto di aggiornamento
      let update: Record<string, any> = {};
      let current = update;
      
      // Gestisci i percorsi nidificati
      for (let i = 0; i < pathParts.length - 1; i++) {
        current[pathParts[i]] = {};
        current = current[pathParts[i]];
      }
      
      // Imposta il valore finale
      current[pathParts[pathParts.length - 1]] = value;
      
      // Applica l'aggiornamento all'entità appropriata
      if (entities[id]) {
        updateEntity(id, update);
      } else if (dimensions[id]) {
        updateDimension(id, update);
      } else if (annotations[id]) {
        updateAnnotation(id, update);
      }
    });
    
    // Aggiorna anche lo stato locale
    setCommonProps(prev => {
      const result = { ...prev };
      let current = result;
      
      // Naviga nel percorso
      for (let i = 0; i < pathParts.length - 1; i++) {
        if (!current[pathParts[i]]) {
          current[pathParts[i]] = {};
        }
        current = current[pathParts[i]];
      }
      
      // Imposta il valore finale
      current[pathParts[pathParts.length - 1]] = value;
      
      return result;
    });
  };
  
  // Ottieni l'icona per il tipo di entità
  const getEntityTypeIcon = (type: string) => {
    switch (type) {
      case 'line':
        return <Pencil size={16} />;
      case 'rectangle':
        return <Square size={16} />;
      case 'circle':
        return <Circle size={16} />;
      case 'linear-dimension':
      case 'aligned-dimension':
      case 'angular-dimension':
      case 'radial-dimension':
      case 'diameter-dimension':
        return <Ruler size={16} />;
      case 'text-annotation':
        return <Type size={16} />;
      default:
        return <Info size={16} />;
    }
  };
  
  // Ottieni una descrizione leggibile per il tipo di entità
  const getEntityTypeName = (type: string) => {
    switch (type) {
      case 'line':
        return 'Linea';
      case 'rectangle':
        return 'Rettangolo';
      case 'circle':
        return 'Cerchio';
      case 'ellipse':
        return 'Ellisse';
      case 'arc':
        return 'Arco';
      case 'polyline':
        return 'Polilinea';
      case 'spline':
        return 'Spline';
      case 'polygon':
        return 'Poligono';
      case 'linear-dimension':
        return 'Quota lineare';
      case 'aligned-dimension':
        return 'Quota allineata';
      case 'angular-dimension':
        return 'Quota angolare';
      case 'radial-dimension':
        return 'Quota radiale';
      case 'diameter-dimension':
        return 'Quota diametrale';
      case 'text-annotation':
        return 'Testo';
      case 'mixed':
        return 'Tipi multipli';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };
  
  // Varianti per animazioni
  const sectionVariants = {
    expanded: { height: 'auto', opacity: 1 },
    collapsed: { height: 0, opacity: 0, overflow: 'hidden' }
  };
  
  // Renderizza i campi in base al tipo di entità e sezione
  const renderFields = (section: string) => {
    if (selectedEntityIds.length === 0) return null;
    
    switch (section) {
      case 'main':
        return (
          <div style={{ padding: '8px', display: 'grid', gap: '8px', gridTemplateColumns: '1fr' }}>
            <div className="property-field">
              <label>Tipo</label>
              <div className="property-value">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {entityType && getEntityTypeIcon(entityType)}
                  <span style={{ marginLeft: '4px' }}>
                    {entityType ? getEntityTypeName(entityType) : 'Nessun tipo'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="property-field">
              <label>ID</label>
              <div className="property-value">
                {selectedEntityIds.length === 1 ? selectedEntityIds[0] : `${selectedEntityIds.length} elementi`}
              </div>
            </div>
            
            <div className="property-field">
              <label>Visibile</label>
              <div className="property-value">
                <input
                  type="checkbox"
                  checked={commonProps.visible === undefined ? false : commonProps.visible}
                  onChange={e => updateProperty('visible', e.target.checked)}
                  disabled={commonProps.visible === undefined}
                />
              </div>
            </div>
            
            <div className="property-field">
              <label>Bloccato</label>
              <div className="property-value">
                <input
                  type="checkbox"
                  checked={commonProps.locked === undefined ? false : commonProps.locked}
                  onChange={e => updateProperty('locked', e.target.checked)}
                  disabled={commonProps.locked === undefined}
                />
              </div>
            </div>
          </div>
        );
        
      case 'geometry':
        return (
          <div style={{ padding: '8px', display: 'grid', gap: '8px', gridTemplateColumns: '1fr 1fr' }}>
            {/* Campi specifici in base al tipo di entità */}
            {entityType === 'line' && (
              <>
                <div className="property-field">
                  <label>X1</label>
                  <input
                    type="number"
                    value={commonProps.startPoint?.x ?? ''}
                    onChange={e => updateProperty('startPoint.x', parseFloat(e.target.value))}
                    disabled={commonProps.startPoint?.x === undefined}
                    step="0.1"
                  />
                </div>
                <div className="property-field">
                  <label>Y1</label>
                  <input
                    type="number"
                    value={commonProps.startPoint?.y ?? ''}
                    onChange={e => updateProperty('startPoint.y', parseFloat(e.target.value))}
                    disabled={commonProps.startPoint?.y === undefined}
                    step="0.1"
                  />
                </div>
                <div className="property-field">
                  <label>X2</label>
                  <input
                    type="number"
                    value={commonProps.endPoint?.x ?? ''}
                    onChange={e => updateProperty('endPoint.x', parseFloat(e.target.value))}
                    disabled={commonProps.endPoint?.x === undefined}
                    step="0.1"
                  />
                </div>
                <div className="property-field">
                  <label>Y2</label>
                  <input
                    type="number"
                    value={commonProps.endPoint?.y ?? ''}
                    onChange={e => updateProperty('endPoint.y', parseFloat(e.target.value))}
                    disabled={commonProps.endPoint?.y === undefined}
                    step="0.1"
                  />
                </div>
                <div className="property-field" style={{ gridColumn: '1 / span 2' }}>
                  <label>Lunghezza</label>
                  <div className="property-value">
                    {commonProps.startPoint && commonProps.endPoint
                      ? Math.sqrt(
                          Math.pow(commonProps.endPoint.x - commonProps.startPoint.x, 2) +
                          Math.pow(commonProps.endPoint.y - commonProps.startPoint.y, 2)
                        ).toFixed(2)
                      : '—'}
                  </div>
                </div>
              </>
            )}
            
            {entityType === 'circle' && (
              <>
                <div className="property-field">
                  <label>Centro X</label>
                  <input
                    type="number"
                    value={commonProps.center?.x ?? ''}
                    onChange={e => updateProperty('center.x', parseFloat(e.target.value))}
                    disabled={commonProps.center?.x === undefined}
                    step="0.1"
                  />
                </div>
                <div className="property-field">
                  <label>Centro Y</label>
                  <input
                    type="number"
                    value={commonProps.center?.y ?? ''}
                    onChange={e => updateProperty('center.y', parseFloat(e.target.value))}
                    disabled={commonProps.center?.y === undefined}
                    step="0.1"
                  />
                </div>
                <div className="property-field" style={{ gridColumn: '1 / span 2' }}>
                  <label>Raggio</label>
                  <input
                    type="number"
                    value={commonProps.radius ?? ''}
                    onChange={e => updateProperty('radius', parseFloat(e.target.value))}
                    disabled={commonProps.radius === undefined}
                    step="0.1"
                    min="0"
                  />
                </div>
                <div className="property-field" style={{ gridColumn: '1 / span 2' }}>
                  <label>Diametro</label>
                  <div className="property-value">
                    {commonProps.radius !== undefined 
                      ? (commonProps.radius * 2).toFixed(2) 
                      : '—'}
                  </div>
                </div>
              </>
            )}
            
            {entityType === 'rectangle' && (
              <>
                <div className="property-field">
                  <label>X</label>
                  <input
                    type="number"
                    value={commonProps.position?.x ?? ''}
                    onChange={e => updateProperty('position.x', parseFloat(e.target.value))}
                    disabled={commonProps.position?.x === undefined}
                    step="0.1"
                  />
                </div>
                <div className="property-field">
                  <label>Y</label>
                  <input
                    type="number"
                    value={commonProps.position?.y ?? ''}
                    onChange={e => updateProperty('position.y', parseFloat(e.target.value))}
                    disabled={commonProps.position?.y === undefined}
                    step="0.1"
                  />
                </div>
                <div className="property-field">
                  <label>Larghezza</label>
                  <input
                    type="number"
                    value={commonProps.width ?? ''}
                    onChange={e => updateProperty('width', parseFloat(e.target.value))}
                    disabled={commonProps.width === undefined}
                    step="0.1"
                    min="0"
                  />
                </div>
                <div className="property-field">
                  <label>Altezza</label>
                  <input
                    type="number"
                    value={commonProps.height ?? ''}
                    onChange={e => updateProperty('height', parseFloat(e.target.value))}
                    disabled={commonProps.height === undefined}
                    step="0.1"
                    min="0"
                  />
                </div>
                <div className="property-field">
                  <label>Rotazione</label>
                  <input
                    type="number"
                    value={commonProps.rotation ?? ''}
                    onChange={e => updateProperty('rotation', parseFloat(e.target.value))}
                    disabled={commonProps.rotation === undefined}
                    step="1"
                  />
                </div>
                <div className="property-field">
                  <label>Raggio angoli</label>
                  <input
                    type="number"
                    value={commonProps.cornerRadius ?? ''}
                    onChange={e => updateProperty('cornerRadius', parseFloat(e.target.value))}
                    disabled={commonProps.cornerRadius === undefined}
                    step="0.1"
                    min="0"
                  />
                </div>
              </>
            )}
            
            {entityType === 'text-annotation' && (
              <>
                <div className="property-field">
                  <label>X</label>
                  <input
                    type="number"
                    value={commonProps.position?.x ?? ''}
                    onChange={e => updateProperty('position.x', parseFloat(e.target.value))}
                    disabled={commonProps.position?.x === undefined}
                    step="0.1"
                  />
                </div>
                <div className="property-field">
                  <label>Y</label>
                  <input
                    type="number"
                    value={commonProps.position?.y ?? ''}
                    onChange={e => updateProperty('position.y', parseFloat(e.target.value))}
                    disabled={commonProps.position?.y === undefined}
                    step="0.1"
                  />
                </div>
                <div className="property-field" style={{ gridColumn: '1 / span 2' }}>
                  <label>Testo</label>
                  <textarea
                    value={commonProps.text ?? ''}
                    onChange={e => updateProperty('text', e.target.value)}
                    disabled={commonProps.text === undefined}
                    rows={3}
                    style={{ width: '100%', resize: 'vertical' }}
                  />
                </div>
                <div className="property-field">
                  <label>Rotazione</label>
                  <input
                    type="number"
                    value={commonProps.rotation ?? ''}
                    onChange={e => updateProperty('rotation', parseFloat(e.target.value))}
                    disabled={commonProps.rotation === undefined}
                    step="1"
                  />
                </div>
                <div className="property-field">
                  <label>Larghezza</label>
                  <input
                    type="number"
                    value={commonProps.width ?? ''}
                    onChange={e => updateProperty('width', parseFloat(e.target.value))}
                    disabled={commonProps.width === undefined}
                    step="0.1"
                    min="0"
                  />
                </div>
              </>
            )}
            
            {/* Per tipi misti o non supportati specificamente */}
            {(entityType === 'mixed' || !(entityType === 'line' || entityType === 'circle' || entityType === 'rectangle' || entityType === 'text-annotation')) && (
              <div className="property-field" style={{ gridColumn: '1 / span 2' }}>
                <div style={{ textAlign: 'center', padding: '10px', color: '#666' }}>
                  {entityType === 'mixed'
                    ? 'Le proprietà geometriche non sono disponibili per tipi di entità misti.'
                    : 'Le proprietà geometriche avanzate sono disponibili nell\'editor proprietà.'}
                </div>
              </div>
            )}
          </div>
        );
        
      case 'style':
        return (
          <div style={{ padding: '8px', display: 'grid', gap: '8px', gridTemplateColumns: '1fr 1fr' }}>
            {/* Proprietà di stile comuni a tutte le entità */}
            <div className="property-field">
              <label>Colore linea</label>
              <input
                type="color"
                value={commonProps.style?.strokeColor ?? '#000000'}
                onChange={e => updateProperty('style.strokeColor', e.target.value)}
                disabled={commonProps.style?.strokeColor === undefined}
                style={{ width: '100%', height: '24px' }}
              />
            </div>
            <div className="property-field">
              <label>Spessore</label>
              <input
                type="number"
                value={commonProps.style?.strokeWidth ?? ''}
                onChange={e => updateProperty('style.strokeWidth', parseFloat(e.target.value))}
                disabled={commonProps.style?.strokeWidth === undefined}
                step="0.1"
                min="0"
              />
            </div>
            <div className="property-field">
              <label>Stile linea</label>
              <select
                value={commonProps.style?.strokeStyle ?? ''}
                onChange={e => updateProperty('style.strokeStyle', e.target.value)}
                disabled={commonProps.style?.strokeStyle === undefined}
                style={{ width: '100%', height: '32px' }}
              >
                <option value="solid">Continua</option>
                <option value="dashed">Tratteggiata</option>
                <option value="dotted">Punteggiata</option>
                <option value="dash-dot">Tratto-punto</option>
                <option value="center">Asse</option>
                <option value="phantom">Phantom</option>
                <option value="hidden">Nascosta</option>
              </select>
            </div>
            <div className="property-field">
              <label>Opacità</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={commonProps.style?.fillOpacity ?? '1'}
                onChange={e => updateProperty('style.fillOpacity', parseFloat(e.target.value))}
                disabled={commonProps.style?.fillOpacity === undefined}
                style={{ width: '100%' }}
              />
            </div>
            <div className="property-field">
              <label>Colore riempimento</label>
              <input
                type="color"
                value={commonProps.style?.fillColor ?? '#ffffff'}
                onChange={e => updateProperty('style.fillColor', e.target.value)}
                disabled={commonProps.style?.fillColor === undefined}
                style={{ width: '100%', height: '24px' }}
              />
            </div>
            <div className="property-field">
              <label>No riempimento</label>
              <input
                type="checkbox"
                checked={commonProps.style?.fillColor === 'none'}
                onChange={e => updateProperty('style.fillColor', e.target.checked ? 'none' : '#ffffff')}
                disabled={commonProps.style?.fillColor === undefined}
              />
            </div>
            
            {/* Proprietà di stile specifiche per il testo */}
            {(entityType === 'text-annotation' || commonProps.style?.fontFamily !== undefined) && (
              <>
                <div className="property-field" style={{ gridColumn: '1 / span 2' }}>
                  <label>Font</label>
                  <select
                    value={commonProps.style?.fontFamily ?? ''}
                    onChange={e => updateProperty('style.fontFamily', e.target.value)}
                    disabled={commonProps.style?.fontFamily === undefined}
                    style={{ width: '100%', height: '32px' }}
                  >
                    <option value="Arial">Arial</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Verdana">Verdana</option>
                    <option value="Tahoma">Tahoma</option>
                  </select>
                </div>
                <div className="property-field">
                  <label>Dimensione font</label>
                  <input
                    type="number"
                    value={commonProps.style?.fontSize ?? ''}
                    onChange={e => updateProperty('style.fontSize', parseFloat(e.target.value))}
                    disabled={commonProps.style?.fontSize === undefined}
                    step="0.5"
                    min="1"
                  />
                </div>
                <div className="property-field">
                  <label>Peso font</label>
                  <select
                    value={commonProps.style?.fontWeight ?? ''}
                    onChange={e => updateProperty('style.fontWeight', e.target.value)}
                    disabled={commonProps.style?.fontWeight === undefined}
                    style={{ width: '100%', height: '32px' }}
                  >
                    <option value="normal">Normale</option>
                    <option value="bold">Grassetto</option>
                  </select>
                </div>
                <div className="property-field">
                  <label>Allineamento</label>
                  <select
                    value={commonProps.style?.textAlign ?? ''}
                    onChange={e => updateProperty('style.textAlign', e.target.value)}
                    disabled={commonProps.style?.textAlign === undefined}
                    style={{ width: '100%', height: '32px' }}
                  >
                    <option value="left">Sinistra</option>
                    <option value="center">Centro</option>
                    <option value="right">Destra</option>
                  </select>
                </div>
              </>
            )}
          </div>
        );
        
      case 'layer':
        return (
          <div style={{ padding: '8px', display: 'grid', gap: '8px', gridTemplateColumns: '1fr' }}>
            <div className="property-field">
              <label>Livello</label>
              <select
                value={commonProps.layer ?? ''}
                onChange={e => updateProperty('layer', e.target.value)}
                disabled={commonProps.layer === undefined}
                style={{ width: '100%', height: '32px' }}
              >
                {drawingLayers.map(layer => (
                  <option key={layer.id} value={layer.name}>
                    {layer.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="property-field">
              <label>Colore livello</label>
              <div className="property-value" style={{ display: 'flex', alignItems: 'center' }}>
                {commonProps.layer && (
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      backgroundColor: drawingLayers.find(l => l.name === commonProps.layer)?.color || '#000000',
                      border: '1px solid #d9d9d9',
                      borderRadius: '3px',
                      marginRight: '8px'
                    }}
                  />
                )}
                <span>
                  {commonProps.layer 
                    ? drawingLayers.find(l => l.name === commonProps.layer)?.color || '—'
                    : '—'}
                </span>
              </div>
            </div>
            <div className="property-field">
              <label>Usa colore livello</label>
              <div className="property-value">
                <button
                  onClick={() => {
                    const layer = drawingLayers.find(l => l.name === commonProps.layer);
                    if (layer) {
                      updateProperty('style.strokeColor', layer.color);
                    }
                  }}
                  disabled={!commonProps.layer}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: '#e6f7ff',
                    border: '1px solid #91d5ff',
                    borderRadius: '4px',
                    cursor: commonProps.layer ? 'pointer' : 'not-allowed'
                  }}
                >
                  Applica
                </button>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <motion.div
      className="properties-panel"
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
        <Settings size={18} style={{ marginRight: '8px' }} />
        <div
          style={{
            fontWeight: 'bold',
            fontSize: '16px',
            flex: 1
          }}
        >
          Proprietà
        </div>
      </div>
      
      {selectedEntityIds.length === 0 ? (
        <div
          style={{
            padding: '16px',
            textAlign: 'center',
            color: '#666',
            backgroundColor: '#f5f5f5',
            borderRadius: '4px'
          }}
        >
          Nessuna entità selezionata
        </div>
      ) : (
        <>
          {/* Sezione principale */}
          <div className="properties-section">
            <motion.div
              className="section-header"
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px',
                borderRadius: '4px',
                cursor: 'pointer',
                backgroundColor: expandedSections.main ? '#e6f7ff' : '#f0f0f0',
                color: expandedSections.main ? '#1890ff' : '#333'
              }}
              onClick={() => toggleSection('main')}
              whileHover={{ backgroundColor: expandedSections.main ? '#e6f7ff' : '#e0e0e0' }}
            >
              <Info size={16} style={{ marginRight: '8px' }} />
              <div style={{ flex: 1 }}>
                Informazioni
              </div>
              <div>
                {expandedSections.main ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
              </div>
            </motion.div>
            
            <AnimatePresence>
              {expandedSections.main && (
                <motion.div
                  initial="collapsed"
                  animate="expanded"
                  exit="collapsed"
                  variants={sectionVariants}
                  transition={{ duration: 0.2 }}
                >
                  {renderFields('main')}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Sezione geometria */}
          <div className="properties-section">
            <motion.div
              className="section-header"
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px',
                borderRadius: '4px',
                cursor: 'pointer',
                backgroundColor: expandedSections.geometry ? '#e6f7ff' : '#f0f0f0',
                color: expandedSections.geometry ? '#1890ff' : '#333'
              }}
              onClick={() => toggleSection('geometry')}
              whileHover={{ backgroundColor: expandedSections.geometry ? '#e6f7ff' : '#e0e0e0' }}
            >
              <Square size={16} style={{ marginRight: '8px' }} />
              <div style={{ flex: 1 }}>
                Geometria
              </div>
              <div>
                {expandedSections.geometry ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
              </div>
            </motion.div>
            
            <AnimatePresence>
              {expandedSections.geometry && (
                <motion.div
                  initial="collapsed"
                  animate="expanded"
                  exit="collapsed"
                  variants={sectionVariants}
                  transition={{ duration: 0.2 }}
                >
                  {renderFields('geometry')}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Sezione stile */}
          <div className="properties-section">
            <motion.div
              className="section-header"
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px',
                borderRadius: '4px',
                cursor: 'pointer',
                backgroundColor: expandedSections.style ? '#e6f7ff' : '#f0f0f0',
                color: expandedSections.style ? '#1890ff' : '#333'
              }}
              onClick={() => toggleSection('style')}
              whileHover={{ backgroundColor: expandedSections.style ? '#e6f7ff' : '#e0e0e0' }}
            >
              <Palette size={16} style={{ marginRight: '8px' }} />
              <div style={{ flex: 1 }}>
                Stile
              </div>
              <div>
                {expandedSections.style ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
              </div>
            </motion.div>
            
            <AnimatePresence>
              {expandedSections.style && (
                <motion.div
                  initial="collapsed"
                  animate="expanded"
                  exit="collapsed"
                  variants={sectionVariants}
                  transition={{ duration: 0.2 }}
                >
                  {renderFields('style')}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Sezione livello */}
          <div className="properties-section">
            <motion.div
              className="section-header"
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px',
                borderRadius: '4px',
                cursor: 'pointer',
                backgroundColor: expandedSections.layer ? '#e6f7ff' : '#f0f0f0',
                color: expandedSections.layer ? '#1890ff' : '#333'
              }}
              onClick={() => toggleSection('layer')}
              whileHover={{ backgroundColor: expandedSections.layer ? '#e6f7ff' : '#e0e0e0' }}
            >
              <Layers size={16} style={{ marginRight: '8px' }} />
              <div style={{ flex: 1 }}>
                Livello
              </div>
              <div>
                {expandedSections.layer ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
              </div>
            </motion.div>
            
            <AnimatePresence>
              {expandedSections.layer && (
                <motion.div
                  initial="collapsed"
                  animate="expanded"
                  exit="collapsed"
                  variants={sectionVariants}
                  transition={{ duration: 0.2 }}
                >
                  {renderFields('layer')}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      )}
      
      {/* Stile globale per i campi */}
      <style jsx global>{`
        .property-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .property-field label {
          font-size: 12px;
          color: #666;
        }
        
        .property-field input, 
        .property-field select, 
        .property-field textarea {
          padding: 6px 8px;
          border: 1px solid #d9d9d9;
          border-radius: 4px;
          font-size: 14px;
        }
        
        .property-field input[type="checkbox"] {
          width: 16px;
          height: 16px;
        }
        
        .property-value {
          padding: 6px 0;
          font-size: 14px;
        }
      `}</style>
    </motion.div>
  );
};

export default PropertiesPanel;