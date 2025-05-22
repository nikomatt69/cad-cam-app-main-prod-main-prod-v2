// src/components/cad/technical-drawing/ui/panels/PropertiesPanel.tsx

import React, { useMemo } from 'react';
import { useTechnicalDrawingStore } from '../../enhancedTechnicalDrawingStore';
import { AnyEntity, DrawingStyle } from '../../TechnicalDrawingTypes';

interface PropertiesPanelProps {
  selectedEntityIds: string[];
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ selectedEntityIds }) => {
  const {
    entities,
    dimensions,
    annotations,
    drawingLayers,
    updateEntity,
    updateDimension,
    updateAnnotation
  } = useTechnicalDrawingStore();

  // Get selected entities
  const selectedEntities = useMemo(() => {
    return selectedEntityIds.map(id => 
      entities[id] || dimensions[id] || annotations[id]
    ).filter(Boolean);
  }, [selectedEntityIds, entities, dimensions, annotations]);

  // Common properties for multi-selection
  const commonProperties = useMemo(() => {
    if (selectedEntities.length === 0) return null;
    if (selectedEntities.length === 1) return selectedEntities[0];

    // Find common properties among selected entities
    const first = selectedEntities[0];
    return {
      id: 'multiple',
      type: 'multiple',
      layer: selectedEntities.every(e => e.layer === first.layer) ? first.layer : 'mixed',
      visible: selectedEntities.every(e => e.visible === first.visible) ? first.visible : null,
      locked: selectedEntities.every(e => e.locked === first.locked) ? first.locked : null,
      style: {
        strokeColor: selectedEntities.every(e => e.style.strokeColor === first.style.strokeColor) 
          ? first.style.strokeColor : 'mixed',
        strokeWidth: selectedEntities.every(e => e.style.strokeWidth === first.style.strokeWidth) 
          ? first.style.strokeWidth : null,
        strokeStyle: selectedEntities.every(e => e.style.strokeStyle === first.style.strokeStyle) 
          ? first.style.strokeStyle : 'mixed',
        fillColor: selectedEntities.every(e => e.style.fillColor === first.style.fillColor) 
          ? first.style.fillColor : 'mixed'
      }
    };
  }, [selectedEntities]);

  const handlePropertyChange = (property: string, value: any) => {
    selectedEntityIds.forEach(id => {
      const entity = entities[id] || dimensions[id] || annotations[id];
      if (!entity) return;

      const updates: any = {};
      
      if (property.startsWith('style.')) {
        const styleProp = property.substring(6);
        updates.style = { ...entity.style, [styleProp]: value };
      } else {
        updates[property] = value;
      }

      if (entities[id]) {
        updateEntity(id, updates);
      } else if (dimensions[id]) {
        updateDimension(id, updates);
      } else if (annotations[id]) {
        updateAnnotation(id, updates);
      }
    });
  };

  const renderEntitySpecificProperties = (entity: AnyEntity) => {
    switch (entity.type) {
      case 'line': {
        const line = entity as any;
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Point
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={line.startPoint?.x || 0}
                  onChange={(e) => handlePropertyChange('startPoint', { 
                    ...line.startPoint, 
                    x: parseFloat(e.target.value) || 0 
                  })}
                  placeholder="X"
                  className="px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                />
                <input
                  type="number"
                  value={line.startPoint?.y || 0}
                  onChange={(e) => handlePropertyChange('startPoint', { 
                    ...line.startPoint, 
                    y: parseFloat(e.target.value) || 0 
                  })}
                  placeholder="Y"
                  className="px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Point
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={line.endPoint?.x || 0}
                  onChange={(e) => handlePropertyChange('endPoint', { 
                    ...line.endPoint, 
                    x: parseFloat(e.target.value) || 0 
                  })}
                  placeholder="X"
                  className="px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                />
                <input
                  type="number"
                  value={line.endPoint?.y || 0}
                  onChange={(e) => handlePropertyChange('endPoint', { 
                    ...line.endPoint, 
                    y: parseFloat(e.target.value) || 0 
                  })}
                  placeholder="Y"
                  className="px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
            </div>
          </div>
        );
      }

      case 'circle': {
        const circle = entity as any;
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Center
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={circle.center?.x || 0}
                  onChange={(e) => handlePropertyChange('center', { 
                    ...circle.center, 
                    x: parseFloat(e.target.value) || 0 
                  })}
                  placeholder="X"
                  className="px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                />
                <input
                  type="number"
                  value={circle.center?.y || 0}
                  onChange={(e) => handlePropertyChange('center', { 
                    ...circle.center, 
                    y: parseFloat(e.target.value) || 0 
                  })}
                  placeholder="Y"
                  className="px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Radius
              </label>
              <input
                type="number"
                value={circle.radius || 0}
                onChange={(e) => handlePropertyChange('radius', parseFloat(e.target.value) || 0)}
                min="0"
                step="0.1"
                className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
          </div>
        );
      }

      case 'rectangle': {
        const rect = entity as any;
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Position
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={rect.position?.x || 0}
                  onChange={(e) => handlePropertyChange('position', { 
                    ...rect.position, 
                    x: parseFloat(e.target.value) || 0 
                  })}
                  placeholder="X"
                  className="px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                />
                <input
                  type="number"
                  value={rect.position?.y || 0}
                  onChange={(e) => handlePropertyChange('position', { 
                    ...rect.position, 
                    y: parseFloat(e.target.value) || 0 
                  })}
                  placeholder="Y"
                  className="px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Size
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={rect.width || 0}
                  onChange={(e) => handlePropertyChange('width', parseFloat(e.target.value) || 0)}
                  placeholder="Width"
                  min="0"
                  step="0.1"
                  className="px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                />
                <input
                  type="number"
                  value={rect.height || 0}
                  onChange={(e) => handlePropertyChange('height', parseFloat(e.target.value) || 0)}
                  placeholder="Height"
                  min="0"
                  step="0.1"
                  className="px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
            </div>
            {rect.rotation !== undefined && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Rotation (degrees)
                </label>
                <input
                  type="number"
                  value={rect.rotation || 0}
                  onChange={(e) => handlePropertyChange('rotation', parseFloat(e.target.value) || 0)}
                  step="1"
                  className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
            )}
          </div>
        );
      }

      case 'text-annotation': {
        const text = entity as any;
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Text
              </label>
              <textarea
                value={text.text || ''}
                onChange={(e) => handlePropertyChange('text', e.target.value)}
                rows={3}
                className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Font Size
              </label>
              <input
                type="number"
                value={text.style?.fontSize || 12}
                onChange={(e) => handlePropertyChange('style.fontSize', parseFloat(e.target.value) || 12)}
                min="1"
                step="1"
                className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  if (selectedEntities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p>No entities selected</p>
        <p className="text-sm mt-1">Select entities to view and edit their properties</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Properties
        </h3>
        <span className="text-sm text-gray-500">
          {selectedEntities.length} selected
        </span>
      </div>

      {commonProperties && (
        <div className="space-y-4">
          {/* Entity Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Type
            </label>
            <div className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm">
              {selectedEntities.length === 1 ? commonProperties.type : `Multiple (${selectedEntities.length})`}
            </div>
          </div>

          {/* Layer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Layer
            </label>
            <select
              value={commonProperties.layer === 'mixed' ? '' : commonProperties.layer}
              onChange={(e) => handlePropertyChange('layer', e.target.value)}
              className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
            >
              {commonProperties.layer === 'mixed' && (
                <option value="">Mixed</option>
              )}
              {drawingLayers.map(layer => (
                <option key={layer.id} value={layer.name}>
                  {layer.name}
                </option>
              ))}
            </select>
          </div>

          {/* Visibility and Lock */}
          <div className="grid grid-cols-2 gap-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={commonProperties.visible ?? false}
                onChange={(e) => handlePropertyChange('visible', e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Visible</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={commonProperties.locked ?? false}
                onChange={(e) => handlePropertyChange('locked', e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Locked</span>
            </label>
          </div>

          {/* Style Properties */}
          <div className="space-y-3">
            <h4 className="text-md font-medium text-gray-900 dark:text-white">Style</h4>
            
            {/* Stroke Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Color
              </label>
              <div className="flex space-x-2">
                <input
                  type="color"
                  value={commonProperties.style.strokeColor === 'mixed' ? '#000000' : commonProperties.style.strokeColor}
                  onChange={(e) => handlePropertyChange('style.strokeColor', e.target.value)}
                  className="w-12 h-8 border rounded"
                />
                <input
                  type="text"
                  value={commonProperties.style.strokeColor}
                  onChange={(e) => handlePropertyChange('style.strokeColor', e.target.value)}
                  placeholder="Color"
                  className="flex-1 px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
            </div>

            {/* Stroke Width */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Line Width
              </label>
              <input
                type="number"
                value={commonProperties.style.strokeWidth || 1}
                onChange={(e) => handlePropertyChange('style.strokeWidth', parseFloat(e.target.value) || 1)}
                min="0.1"
                step="0.1"
                className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
              />
            </div>

            {/* Stroke Style */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Line Style
              </label>
              <select
                value={commonProperties.style.strokeStyle}
                onChange={(e) => handlePropertyChange('style.strokeStyle', e.target.value)}
                className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="solid">Solid</option>
                <option value="dashed">Dashed</option>
                <option value="dotted">Dotted</option>
                <option value="dash-dot">Dash-Dot</option>
              </select>
            </div>

            {/* Fill Color */}
            {commonProperties.style.fillColor !== undefined && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fill Color
                </label>
                <div className="flex space-x-2">
                  <input
                    type="color"
                    value={commonProperties.style.fillColor === 'mixed' || commonProperties.style.fillColor === 'transparent' ? '#ffffff' : commonProperties.style.fillColor}
                    onChange={(e) => handlePropertyChange('style.fillColor', e.target.value)}
                    className="w-12 h-8 border rounded"
                  />
                  <select
                    value={commonProperties.style.fillColor}
                    onChange={(e) => handlePropertyChange('style.fillColor', e.target.value)}
                    className="flex-1 px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="transparent">No Fill</option>
                    <option value={commonProperties.style.fillColor}>Custom Color</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Entity-Specific Properties */}
          {selectedEntities.length === 1 && renderEntitySpecificProperties(selectedEntities[0])}
        </div>
      )}
    </div>
  );
};

export default PropertiesPanel;
