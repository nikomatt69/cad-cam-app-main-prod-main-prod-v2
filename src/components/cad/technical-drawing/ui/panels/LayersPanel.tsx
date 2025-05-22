// src/components/cad/technical-drawing/ui/panels/LayersPanel.tsx

import React, { useState } from 'react';
import { useTechnicalDrawingStore } from '../../enhancedTechnicalDrawingStore';
import { DrawingLayer } from '../../TechnicalDrawingTypes';
import { Eye, EyeOff, Lock, Unlock, Plus, Trash2, Edit3 } from 'lucide-react';

const LayersPanel: React.FC = () => {
  const [editingLayer, setEditingLayer] = useState<string | null>(null);
  const [newLayerName, setNewLayerName] = useState('');

  const {
    drawingLayers,
    activeLayer,
    addLayer,
    updateLayer,
    deleteLayer,
    setActiveLayer
  } = useTechnicalDrawingStore();

  const handleCreateLayer = () => {
    if (newLayerName.trim()) {
      addLayer({
        name: newLayerName.trim(),
        color: '#000000',
        visible: true,
        locked: false,
        order: drawingLayers.length
      });
      setNewLayerName('');
    }
  };

  const handleDeleteLayer = (layer: DrawingLayer) => {
    if (layer.name !== 'default' && drawingLayers.length > 1) {
      deleteLayer(layer.id);
    }
  };

  const handleToggleVisibility = (layer: DrawingLayer) => {
    updateLayer(layer.id, { visible: !layer.visible });
  };

  const handleToggleLock = (layer: DrawingLayer) => {
    updateLayer(layer.id, { locked: !layer.locked });
  };

  const handleColorChange = (layer: DrawingLayer, color: string) => {
    updateLayer(layer.id, { color });
  };

  const handleNameChange = (layer: DrawingLayer, name: string) => {
    if (name.trim() && name !== layer.name) {
      updateLayer(layer.id, { name: name.trim() });
    }
    setEditingLayer(null);
  };

  const sortedLayers = [...drawingLayers].sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Layers
        </h3>
        <span className="text-sm text-gray-500">
          {drawingLayers.length} layer{drawingLayers.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* New Layer Input */}
      <div className="flex space-x-2">
        <input
          type="text"
          value={newLayerName}
          onChange={(e) => setNewLayerName(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleCreateLayer()}
          placeholder="New layer name"
          className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
        <button
          onClick={handleCreateLayer}
          disabled={!newLayerName.trim()}
          className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Layers List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {sortedLayers.map((layer) => (
          <div
            key={layer.id}
            className={`flex items-center space-x-2 p-2 rounded-md border transition-colors ${
              activeLayer === layer.name
                ? 'bg-blue-50 border-blue-200 dark:bg-blue-900 dark:border-blue-700'
                : 'bg-gray-50 border-gray-200 hover:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600'
            }`}
          >
            {/* Color Swatch */}
            <div className="relative">
              <input
                type="color"
                value={layer.color}
                onChange={(e) => handleColorChange(layer, e.target.value)}
                className="w-6 h-6 rounded border border-gray-300 cursor-pointer"
                title="Change layer color"
              />
            </div>

            {/* Layer Name */}
            <div className="flex-1 min-w-0">
              {editingLayer === layer.id ? (
                <input
                  type="text"
                  defaultValue={layer.name}
                  onBlur={(e) => handleNameChange(layer, e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleNameChange(layer, e.currentTarget.value);
                    }
                  }}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                  autoFocus
                />
              ) : (
                <button
                  onClick={() => setActiveLayer(layer.name)}
                  className="w-full text-left"
                >
                  <div className="font-medium text-sm text-gray-900 dark:text-white truncate">
                    {layer.name}
                    {activeLayer === layer.name && (
                      <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
                        (Active)
                      </span>
                    )}
                  </div>
                  {layer.description && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {layer.description}
                    </div>
                  )}
                </button>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-1">
              {/* Visibility Toggle */}
              <button
                onClick={() => handleToggleVisibility(layer)}
                className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${
                  layer.visible ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'
                }`}
                title={layer.visible ? 'Hide layer' : 'Show layer'}
              >
                {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>

              {/* Lock Toggle */}
              <button
                onClick={() => handleToggleLock(layer)}
                className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${
                  layer.locked ? 'text-red-600' : 'text-gray-700 dark:text-gray-300'
                }`}
                title={layer.locked ? 'Unlock layer' : 'Lock layer'}
              >
                {layer.locked ? <Lock size={14} /> : <Unlock size={14} />}
              </button>

              {/* Edit Name */}
              <button
                onClick={() => setEditingLayer(layer.id)}
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                title="Edit layer name"
              >
                <Edit3 size={14} />
              </button>

              {/* Delete Layer */}
              {layer.name !== 'default' && drawingLayers.length > 1 && (
                <button
                  onClick={() => handleDeleteLayer(layer)}
                  className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900 text-red-600 hover:text-red-700"
                  title="Delete layer"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Layer Statistics */}
      <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <div>Visible: {drawingLayers.filter(l => l.visible).length}</div>
          <div>Locked: {drawingLayers.filter(l => l.locked).length}</div>
        </div>
      </div>
    </div>
  );
};

export default LayersPanel;
