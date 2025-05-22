// src/components/cad/technical-drawing/ui/panels/AdvancedPropertiesPanel.tsx

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTechnicalDrawingStore } from '../../technicalDrawingStore';
import { 
  AnyEntity, 
  DrawingStyle, 
  Point,
  LineEntity,
  CircleEntity,
  RectangleEntity,
  TextAnnotation
} from '../../TechnicalDrawingTypes';
import { 
  Palette, 
  Settings, 
  Move, 
  RotateCcw, 
  Maximize, 
  Copy, 
  Trash2,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  AlignLeft,
  AlignCenter,
  AlignRight
} from 'lucide-react';

interface AdvancedPropertiesPanelProps {
  selectedEntityIds: string[];
}

const AdvancedPropertiesPanel: React.FC<AdvancedPropertiesPanelProps> = ({ 
  selectedEntityIds 
}) => {
  const {
    entities,
    dimensions,
    annotations,
    updateEntity,
    updateDimension,
    updateAnnotation,
    deleteEntity,
    copyEntity,
    drawingLayers,
    moveEntities,
    rotateEntities,
    scaleEntities
  } = useTechnicalDrawingStore();

  const [activeTab, setActiveTab] = useState<'style' | 'geometry' | 'transform' | 'info'>('style');
  const [transformValues, setTransformValues] = useState({
    offsetX: 0,
    offsetY: 0,
    rotation: 0,
    scaleX: 1,
    scaleY: 1
  });

  // Get selected entities
  const selectedEntities = useMemo(() => {
    return selectedEntityIds.map(id => 
      entities[id] || dimensions[id] || annotations[id]
    ).filter(Boolean);
  }, [selectedEntityIds, entities, dimensions, annotations]);

  // Get common properties
  const commonProperties = useMemo(() => {
    if (selectedEntities.length === 0) return null;
    
    const first = selectedEntities[0];
    const common = {
      layer: first.layer,
      visible: first.visible,
      locked: first.locked,
      style: { ...first.style }
    };

    // Check if all entities have the same properties
    for (const entity of selectedEntities.slice(1)) {
      if (entity.layer !== common.layer) common.layer = '';
      if (entity.visible !== common.visible) common.visible = false;
      if (entity.locked !== common.locked) common.locked = false;
      
      // Style properties
      if (entity.style.strokeColor !== common.style.strokeColor) {
        common.style.strokeColor = '';
      }
      if (entity.style.strokeWidth !== common.style.strokeWidth) {
        common.style.strokeWidth = 0;
      }
      if (entity.style.fillColor !== common.style.fillColor) {
        common.style.fillColor = '';
      }
    }

    return common;
  }, [selectedEntities]);

  const updateSelectedEntities = (updates: Partial<AnyEntity>) => {
    selectedEntityIds.forEach(id => {
      if (entities[id]) {
        updateEntity(id, updates);
      } else if (dimensions[id]) {
        updateDimension(id, updates as any);
      } else if (annotations[id]) {
        updateAnnotation(id, updates as any);
      }
    });
  };

  const updateSelectedStyle = (styleUpdates: Partial<DrawingStyle>) => {
    updateSelectedEntities({
      style: {
        ...commonProperties?.style,
        ...styleUpdates
      }
    });
  };

  const handleTransform = (type: 'move' | 'rotate' | 'scale') => {
    const { offsetX, offsetY, rotation, scaleX, scaleY } = transformValues;
    
    switch (type) {
      case 'move':
        if (offsetX !== 0 || offsetY !== 0) {
          moveEntities(selectedEntityIds, { x: offsetX, y: offsetY });
          setTransformValues(prev => ({ ...prev, offsetX: 0, offsetY: 0 }));
        }
        break;
        
      case 'rotate':
        if (rotation !== 0 && selectedEntities.length > 0) {
          // Use the center of the first entity as rotation center
          const firstEntity = selectedEntities[0];
          let center: Point = { x: 0, y: 0 };
          
          if ('center' in firstEntity) {
            center = (firstEntity as CircleEntity).center;
          } else if ('position' in firstEntity) {
            const rect = firstEntity as RectangleEntity;
            center = { 
              x: rect.position.x + rect.width / 2, 
              y: rect.position.y + rect.height / 2 
            };
          } else if ('startPoint' in firstEntity && 'endPoint' in firstEntity) {
            const line = firstEntity as LineEntity;
            center = {
              x: (line.startPoint.x + line.endPoint.x) / 2,
              y: (line.startPoint.y + line.endPoint.y) / 2
            };
          }
          
          rotateEntities(selectedEntityIds, center, rotation);
          setTransformValues(prev => ({ ...prev, rotation: 0 }));
        }
        break;
        
      case 'scale':
        if ((scaleX !== 1 || scaleY !== 1) && selectedEntities.length > 0) {
          // Use the center of the first entity as scale center
          const firstEntity = selectedEntities[0];
          let center: Point = { x: 0, y: 0 };
          
          if ('center' in firstEntity) {
            center = (firstEntity as CircleEntity).center;
          } else if ('position' in firstEntity) {
            const rect = firstEntity as RectangleEntity;
            center = { 
              x: rect.position.x + rect.width / 2, 
              y: rect.position.y + rect.height / 2 
            };
          }
          
          scaleEntities(selectedEntityIds, center, scaleX, scaleY);
          setTransformValues(prev => ({ ...prev, scaleX: 1, scaleY: 1 }));
        }
        break;
    }
  };

  const deleteSelected = () => {
    selectedEntityIds.forEach(id => deleteEntity(id));
  };

  const copySelected = () => {
    selectedEntityIds.forEach(id => copyEntity(id));
  };

  if (selectedEntityIds.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-4 text-center text-gray-500"
      >
        <Settings size={48} className="mx-auto mb-2 opacity-30" />
        <p>Seleziona un'entità per vedere le proprietà</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="advanced-properties-panel p-4 bg-white border-l"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">
          Proprietà Avanzate ({selectedEntityIds.length})
        </h3>
        
        {/* Quick Actions */}
        <div className="flex gap-1">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => updateSelectedEntities({ visible: !commonProperties?.visible })}
            className="p-1 rounded hover:bg-gray-100"
            title={commonProperties?.visible ? "Nascondi" : "Mostra"}
          >
            {commonProperties?.visible ? <Eye size={16} /> : <EyeOff size={16} />}
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => updateSelectedEntities({ locked: !commonProperties?.locked })}
            className="p-1 rounded hover:bg-gray-100"
            title={commonProperties?.locked ? "Sblocca" : "Blocca"}
          >
            {commonProperties?.locked ? <Lock size={16} /> : <Unlock size={16} />}
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={copySelected}
            className="p-1 rounded hover:bg-gray-100"
            title="Copia"
          >
            <Copy size={16} />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={deleteSelected}
            className="p-1 rounded hover:bg-gray-100 text-red-600"
            title="Elimina"
          >
            <Trash2 size={16} />
          </motion.button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-4">
        {[
          { id: 'style', label: 'Stile', icon: Palette },
          { id: 'geometry', label: 'Geometria', icon: Settings },
          { id: 'transform', label: 'Trasforma', icon: Move },
          { id: 'info', label: 'Info', icon: Settings }
        ].map(tab => (
          <motion.button
            key={tab.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-3 py-2 text-sm border-b-2 transition-colors ${
              activeTab === tab.id 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </motion.button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Style Tab */}
        {activeTab === 'style' && (
          <motion.div
            key="style"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Stroke Color */}
            <div>
              <label className="block text-sm font-medium mb-1">Colore Linea:</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={commonProperties?.style.strokeColor || '#000000'}
                  onChange={(e) => updateSelectedStyle({ strokeColor: e.target.value })}
                  className="w-8 h-8 border rounded"
                />
                <input
                  type="text"
                  value={commonProperties?.style.strokeColor || ''}
                  onChange={(e) => updateSelectedStyle({ strokeColor: e.target.value })}
                  className="flex-1 px-2 py-1 border rounded text-sm"
                  placeholder="#000000"
                />
              </div>
            </div>

            {/* Stroke Width */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Spessore Linea: {commonProperties?.style.strokeWidth || 1}px
              </label>
              <input
                type="range"
                min="0.5"
                max="10"
                step="0.5"
                value={commonProperties?.style.strokeWidth || 1}
                onChange={(e) => updateSelectedStyle({ strokeWidth: Number(e.target.value) })}
                className="w-full"
              />
            </div>

            {/* Stroke Style */}
            <div>
              <label className="block text-sm font-medium mb-1">Stile Linea:</label>
              <select
                value={commonProperties?.style.strokeStyle || 'solid'}
                onChange={(e) => updateSelectedStyle({ strokeStyle: e.target.value as any })}
                className="w-full p-2 border rounded"
              >
                <option value="solid">Continua</option>
                <option value="dashed">Tratteggiata</option>
                <option value="dotted">Punteggiata</option>
                <option value="dash-dot">Tratto-Punto</option>
                <option value="center">Centrale</option>
                <option value="phantom">Fantasma</option>
                <option value="hidden">Nascosta</option>
              </select>
            </div>

            {/* Fill Color */}
            <div>
              <label className="block text-sm font-medium mb-1">Colore Riempimento:</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={commonProperties?.style.fillColor?.startsWith('#') ? commonProperties.style.fillColor : '#ffffff'}
                  onChange={(e) => updateSelectedStyle({ fillColor: e.target.value })}
                  className="w-8 h-8 border rounded"
                />
                <input
                  type="text"
                  value={commonProperties?.style.fillColor || 'none'}
                  onChange={(e) => updateSelectedStyle({ fillColor: e.target.value })}
                  className="flex-1 px-2 py-1 border rounded text-sm"
                  placeholder="none"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => updateSelectedStyle({ fillColor: 'none' })}
                  className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200"
                >
                  Nessuno
                </motion.button>
              </div>
            </div>

            {/* Fill Opacity */}
            {commonProperties?.style.fillColor && 
             commonProperties.style.fillColor !== 'none' && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Opacità Riempimento: {((commonProperties?.style.fillOpacity || 1) * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={commonProperties?.style.fillOpacity || 1}
                  onChange={(e) => updateSelectedStyle({ fillOpacity: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
            )}

            {/* Text Properties (for text entities) */}
            {selectedEntities.some(e => e.type.includes('text') || e.type.includes('annotation')) && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">Font Family:</label>
                  <select
                    value={commonProperties?.style.fontFamily || 'Arial'}
                    onChange={(e) => updateSelectedStyle({ fontFamily: e.target.value })}
                    className="w-full p-2 border rounded"
                  >
                    <option value="Arial">Arial</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Verdana">Verdana</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Dimensione Font: {commonProperties?.style.fontSize || 12}px
                  </label>
                  <input
                    type="range"
                    min="8"
                    max="72"
                    step="1"
                    value={commonProperties?.style.fontSize || 12}
                    onChange={(e) => updateSelectedStyle({ fontSize: Number(e.target.value) })}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Allineamento Testo:</label>
                  <div className="flex gap-1">
                    {[
                      { value: 'left', icon: AlignLeft, label: 'Sinistra' },
                      { value: 'center', icon: AlignCenter, label: 'Centro' },
                      { value: 'right', icon: AlignRight, label: 'Destra' }
                    ].map(align => (
                      <motion.button
                        key={align.value}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => updateSelectedStyle({ textAlign: align.value as any })}
                        className={`flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs border rounded ${
                          commonProperties?.style.textAlign === align.value
                            ? 'bg-blue-100 border-blue-300 text-blue-700'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                        title={align.label}
                      >
                        <align.icon size={14} />
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Peso Font:</label>
                  <div className="flex gap-1">
                    {[
                      { value: 'normal', label: 'Normale' },
                      { value: 'bold', label: 'Grassetto' }
                    ].map(weight => (
                      <motion.button
                        key={weight.value}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => updateSelectedStyle({ fontWeight: weight.value as any })}
                        className={`flex-1 px-2 py-1 text-xs border rounded ${
                          commonProperties?.style.fontWeight === weight.value
                            ? 'bg-blue-100 border-blue-300 text-blue-700'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        {weight.label}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* Geometry Tab */}
        {activeTab === 'geometry' && (
          <motion.div
            key="geometry"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {selectedEntities.map((entity, index) => (
              <div key={entity.id} className="p-3 bg-gray-50 rounded">
                <h4 className="font-medium mb-2">
                  {entity.type} - {entity.id.slice(0, 8)}...
                </h4>
                
                {/* Line Properties */}
                {entity.type === 'line' && (
                  <div className="space-y-2 text-sm">
                    <div>Punto Inizio: ({(entity as LineEntity).startPoint.x.toFixed(2)}, {(entity as LineEntity).startPoint.y.toFixed(2)})</div>
                    <div>Punto Fine: ({(entity as LineEntity).endPoint.x.toFixed(2)}, {(entity as LineEntity).endPoint.y.toFixed(2)})</div>
                    <div>
                      Lunghezza: {Math.sqrt(
                        Math.pow((entity as LineEntity).endPoint.x - (entity as LineEntity).startPoint.x, 2) +
                        Math.pow((entity as LineEntity).endPoint.y - (entity as LineEntity).startPoint.y, 2)
                      ).toFixed(2)}
                    </div>
                  </div>
                )}

                {/* Circle Properties */}
                {entity.type === 'circle' && (
                  <div className="space-y-2 text-sm">
                    <div>Centro: ({(entity as CircleEntity).center.x.toFixed(2)}, {(entity as CircleEntity).center.y.toFixed(2)})</div>
                    <div>Raggio: {(entity as CircleEntity).radius.toFixed(2)}</div>
                    <div>Diametro: {((entity as CircleEntity).radius * 2).toFixed(2)}</div>
                    <div>Area: {(Math.PI * Math.pow((entity as CircleEntity).radius, 2)).toFixed(2)}</div>
                    <div>Circonferenza: {(2 * Math.PI * (entity as CircleEntity).radius).toFixed(2)}</div>
                  </div>
                )}

                {/* Rectangle Properties */}
                {entity.type === 'rectangle' && (
                  <div className="space-y-2 text-sm">
                    <div>Posizione: ({(entity as RectangleEntity).position.x.toFixed(2)}, {(entity as RectangleEntity).position.y.toFixed(2)})</div>
                    <div>Larghezza: {(entity as RectangleEntity).width.toFixed(2)}</div>
                    <div>Altezza: {(entity as RectangleEntity).height.toFixed(2)}</div>
                    <div>Area: {((entity as RectangleEntity).width * (entity as RectangleEntity).height).toFixed(2)}</div>
                    <div>Perimetro: {(2 * ((entity as RectangleEntity).width + (entity as RectangleEntity).height)).toFixed(2)}</div>
                    {(entity as RectangleEntity).rotation && (
                      <div>Rotazione: {(entity as RectangleEntity).rotation}°</div>
                    )}
                  </div>
                )}

                {/* Text Properties */}
                {entity.type.includes('text') && (
                  <div className="space-y-2 text-sm">
                    <div>Posizione: ({(entity as TextAnnotation).position.x.toFixed(2)}, {(entity as TextAnnotation).position.y.toFixed(2)})</div>
                    <div>Testo: "{(entity as TextAnnotation).text}"</div>
                    <div>Lunghezza: {(entity as TextAnnotation).text.length} caratteri</div>
                    {(entity as TextAnnotation).rotation && (
                      <div>Rotazione: {(entity as TextAnnotation).rotation}°</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </motion.div>
        )}

        {/* Transform Tab */}
        {activeTab === 'transform' && (
          <motion.div
            key="transform"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Move */}
            <div className="p-3 border rounded">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Move size={16} />
                Sposta
              </h4>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Offset X:</label>
                  <input
                    type="number"
                    value={transformValues.offsetX}
                    onChange={(e) => setTransformValues(prev => ({ ...prev, offsetX: Number(e.target.value) }))}
                    className="w-full px-2 py-1 border rounded text-sm"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Offset Y:</label>
                  <input
                    type="number"
                    value={transformValues.offsetY}
                    onChange={(e) => setTransformValues(prev => ({ ...prev, offsetY: Number(e.target.value) }))}
                    className="w-full px-2 py-1 border rounded text-sm"
                    step="0.1"
                  />
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleTransform('move')}
                className="w-full px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
              >
                Applica Spostamento
              </motion.button>
            </div>

            {/* Rotate */}
            <div className="p-3 border rounded">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <RotateCcw size={16} />
                Ruota
              </h4>
              <div className="mb-3">
                <label className="block text-xs text-gray-600 mb-1">
                  Angolo: {transformValues.rotation}°
                </label>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="15"
                  value={transformValues.rotation}
                  onChange={(e) => setTransformValues(prev => ({ ...prev, rotation: Number(e.target.value) }))}
                  className="w-full"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleTransform('rotate')}
                className="w-full px-3 py-2 bg-green-500 text-white rounded text-sm hover:bg-green-600"
              >
                Applica Rotazione
              </motion.button>
            </div>

            {/* Scale */}
            <div className="p-3 border rounded">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Maximize size={16} />
                Scala
              </h4>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Scala X:</label>
                  <input
                    type="number"
                    value={transformValues.scaleX}
                    onChange={(e) => setTransformValues(prev => ({ ...prev, scaleX: Number(e.target.value) }))}
                    className="w-full px-2 py-1 border rounded text-sm"
                    step="0.1"
                    min="0.1"
                    max="10"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Scala Y:</label>
                  <input
                    type="number"
                    value={transformValues.scaleY}
                    onChange={(e) => setTransformValues(prev => ({ ...prev, scaleY: Number(e.target.value) }))}
                    className="w-full px-2 py-1 border rounded text-sm"
                    step="0.1"
                    min="0.1"
                    max="10"
                  />
                </div>
              </div>
              <div className="flex gap-2 mb-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setTransformValues(prev => ({ ...prev, scaleX: prev.scaleY, scaleY: prev.scaleX }))}
                  className="flex-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200"
                >
                  Uniforme
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setTransformValues(prev => ({ ...prev, scaleX: 1, scaleY: 1 }))}
                  className="flex-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200"
                >
                  Reset
                </motion.button>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleTransform('scale')}
                className="w-full px-3 py-2 bg-purple-500 text-white rounded text-sm hover:bg-purple-600"
              >
                Applica Scala
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Info Tab */}
        {activeTab === 'info' && (
          <motion.div
            key="info"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Informazioni Generali</h4>
                <div className="text-sm space-y-1 text-gray-600">
                  <div>Entità selezionate: {selectedEntityIds.length}</div>
                  <div>Layer: {commonProperties?.layer || 'Misti'}</div>
                  <div>Visibili: {selectedEntities.filter(e => e.visible).length}</div>
                  <div>Bloccate: {selectedEntities.filter(e => e.locked).length}</div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Tipi di Entità</h4>
                <div className="text-sm space-y-1 text-gray-600">
                  {Object.entries(
                    selectedEntities.reduce((acc, entity) => {
                      acc[entity.type] = (acc[entity.type] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([type, count]) => (
                    <div key={type}>
                      {type}: {count}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Layers Utilizzati</h4>
                <div className="text-sm space-y-1 text-gray-600">
                  {Array.from(new Set(selectedEntities.map(e => e.layer))).map(layerName => {
                    const layer = drawingLayers.find(l => l.name === layerName);
                    const count = selectedEntities.filter(e => e.layer === layerName).length;
                    return (
                      <div key={layerName} className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 border rounded"
                          style={{ backgroundColor: layer?.color || '#000000' }}
                        />
                        <span>{layerName}: {count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Entity IDs */}
              <div>
                <h4 className="font-medium mb-2">ID Entità</h4>
                <div className="max-h-32 overflow-y-auto text-xs text-gray-500 space-y-1">
                  {selectedEntityIds.map(id => (
                    <div key={id} className="font-mono">{id}</div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdvancedPropertiesPanel;
