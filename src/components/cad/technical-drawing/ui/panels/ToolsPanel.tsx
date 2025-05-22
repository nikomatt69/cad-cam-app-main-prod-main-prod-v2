// src/components/cad/technical-drawing/ui/panels/ToolsPanel.tsx

import React from 'react';
import { useTechnicalDrawingStore } from '../../enhancedTechnicalDrawingStore';
import { 
  MousePointer, 
  Minus, 
  Circle, 
  Square, 
  Pencil, 
  Type, 
  Ruler,
  Move3D,
  RotateCw,
  Scissors,
  Copy,
  Trash2,
  ZoomIn,
  ZoomOut,
  Grid,
  Magnet,
  Lock,
  Eye
} from 'lucide-react';

interface ToolButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  shortcut?: string;
}

const ToolButton: React.FC<ToolButtonProps> = ({ icon, label, isActive, onClick, shortcut }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
      isActive
        ? 'bg-blue-600 text-white border-blue-600 shadow-lg'
        : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600'
    }`}
    title={shortcut ? `${label} (${shortcut})` : label}
  >
    <div className="mb-1">{icon}</div>
    <span className="text-xs font-medium">{label}</span>
  </button>
);

const ToolsPanel: React.FC = () => {
  const {
    activeTool,
    setActiveTool,
    selectedEntityIds,
    moveEntities,
    rotateEntities,
    scaleEntities,
    copyEntity,
    deleteEntity,
    clearSelection,
    zoomToFit,
    setZoom,
    zoom,
    toggleGrid,
    toggleSnapping,
    gridEnabled,
    snappingEnabled
  } = useTechnicalDrawingStore();

  const drawingTools = [
    { id: 'select', icon: <MousePointer size={20} />, label: 'Select', shortcut: 'S' },
    { id: 'line', icon: <Minus size={20} />, label: 'Line', shortcut: 'L' },
    { id: 'circle', icon: <Circle size={20} />, label: 'Circle', shortcut: 'C' },
    { id: 'rectangle', icon: <Square size={20} />, label: 'Rectangle', shortcut: 'R' },
    { id: 'polyline', icon: <Pencil size={20} />, label: 'Polyline', shortcut: 'P' },
    { id: 'text', icon: <Type size={20} />, label: 'Text', shortcut: 'T' },
    { id: 'dimension', icon: <Ruler size={20} />, label: 'Dimension', shortcut: 'D' }
  ];

  const transformTools = [
    { 
      id: 'move', 
      icon: <Move3D size={18} />, 
      label: 'Move', 
      action: () => {
        if (selectedEntityIds.length > 0) {
          // In a real implementation, this would start move mode
          console.log('Move tool activated');
        }
      },
      disabled: selectedEntityIds.length === 0
    },
    { 
      id: 'rotate', 
      icon: <RotateCw size={18} />, 
      label: 'Rotate', 
      action: () => {
        if (selectedEntityIds.length > 0) {
          // In a real implementation, this would start rotate mode
          console.log('Rotate tool activated');
        }
      },
      disabled: selectedEntityIds.length === 0
    },
    { 
      id: 'copy', 
      icon: <Copy size={18} />, 
      label: 'Copy', 
      action: () => {
        selectedEntityIds.forEach(id => {
          copyEntity(id, { x: 10, y: 10 });
        });
      },
      disabled: selectedEntityIds.length === 0
    },
    { 
      id: 'delete', 
      icon: <Trash2 size={18} />, 
      label: 'Delete', 
      action: () => {
        selectedEntityIds.forEach(id => deleteEntity(id));
        clearSelection();
      },
      disabled: selectedEntityIds.length === 0
    }
  ];

  const viewTools = [
    { 
      id: 'zoom-in', 
      icon: <ZoomIn size={18} />, 
      label: 'Zoom In', 
      action: () => setZoom(Math.min(zoom * 1.25, 10))
    },
    { 
      id: 'zoom-out', 
      icon: <ZoomOut size={18} />, 
      label: 'Zoom Out', 
      action: () => setZoom(Math.max(zoom * 0.8, 0.1))
    },
    { 
      id: 'zoom-fit', 
      icon: <Eye size={18} />, 
      label: 'Fit All', 
      action: () => zoomToFit()
    }
  ];

  const settingTools = [
    { 
      id: 'grid', 
      icon: <Grid size={18} />, 
      label: 'Grid', 
      action: toggleGrid,
      active: gridEnabled
    },
    { 
      id: 'snap', 
      icon: <Magnet size={18} />, 
      label: 'Snap', 
      action: toggleSnapping,
      active: snappingEnabled
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Tools
        </h3>
      </div>

      {/* Drawing Tools */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Drawing
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {drawingTools.map(tool => (
            <ToolButton
              key={tool.id}
              icon={tool.icon}
              label={tool.label}
              isActive={activeTool === tool.id}
              onClick={() => setActiveTool(tool.id)}
              shortcut={tool.shortcut}
            />
          ))}
        </div>
      </div>

      {/* Transform Tools */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Modify
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {transformTools.map(tool => (
            <button
              key={tool.id}
              onClick={tool.action}
              disabled={tool.disabled}
              className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
                tool.disabled
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                  : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600'
              }`}
              title={tool.label}
            >
              <div className="mb-1">{tool.icon}</div>
              <span className="text-xs font-medium">{tool.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* View Tools */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          View
        </h4>
        <div className="grid grid-cols-3 gap-2">
          {viewTools.map(tool => (
            <button
              key={tool.id}
              onClick={tool.action}
              className="flex flex-col items-center justify-center p-2 rounded-lg border bg-white hover:bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300 transition-all dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
              title={tool.label}
            >
              <div className="mb-1">{tool.icon}</div>
              <span className="text-xs font-medium">{tool.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Settings Tools */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Settings
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {settingTools.map(tool => (
            <button
              key={tool.id}
              onClick={tool.action}
              className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
                tool.active
                  ? 'bg-green-600 text-white border-green-600 shadow-lg'
                  : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600'
              }`}
              title={tool.label}
            >
              <div className="mb-1">{tool.icon}</div>
              <span className="text-xs font-medium">{tool.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tool Information */}
      {selectedEntityIds.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900 p-3 rounded-lg">
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <strong>{selectedEntityIds.length}</strong> entities selected
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-300 mt-1">
            Use modify tools to transform selected entities
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Quick Actions
        </h4>
        <div className="space-y-2">
          <button
            onClick={clearSelection}
            className="w-full px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300"
          >
            Clear Selection
          </button>
          <button
            onClick={() => setZoom(1)}
            className="w-full px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300"
          >
            Reset Zoom (100%)
          </button>
        </div>
      </div>

      {/* Current Tool Info */}
      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          Active Tool
        </div>
        <div className="text-lg font-bold text-blue-600 dark:text-blue-400 capitalize">
          {activeTool}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {activeTool === 'select' && 'Click to select entities'}
          {activeTool === 'line' && 'Click two points to draw a line'}
          {activeTool === 'circle' && 'Click center, then drag for radius'}
          {activeTool === 'rectangle' && 'Click and drag to draw rectangle'}
          {activeTool === 'text' && 'Click to place text'}
          {activeTool === 'dimension' && 'Click two points to dimension'}
        </div>
      </div>
    </div>
  );
};

export default ToolsPanel;
