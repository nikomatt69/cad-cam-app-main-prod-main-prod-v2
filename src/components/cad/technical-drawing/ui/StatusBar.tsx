// src/components/cad/technical-drawing/ui/StatusBar.tsx

import React from 'react';
import { useTechnicalDrawingStore } from '../enhancedTechnicalDrawingStore';

interface StatusBarProps {
  height: number;
  activeTool: string;
  zoom: number;
  entitiesCount: number;
  selectedCount: number;
}

const StatusBar: React.FC<StatusBarProps> = ({
  height,
  activeTool,
  zoom,
  entitiesCount,
  selectedCount
}) => {
  const {
    pan,
    gridEnabled,
    snappingEnabled,
    orthoMode,
    polarTracking,
    getSystemCapabilities
  } = useTechnicalDrawingStore();

  const capabilities = getSystemCapabilities();

  const formatCoordinate = (value: number): string => {
    return value.toFixed(2);
  };

  const formatZoom = (zoomValue: number): string => {
    return `${Math.round(zoomValue * 100)}%`;
  };

  return (
    <div 
      className="bg-gray-800 text-white text-xs flex items-center justify-between px-4 border-t border-gray-600"
      style={{ height: `${height}px` }}
    >
      {/* Left side - Tool and mode indicators */}
      <div className="flex items-center space-x-4">
        {/* Active Tool */}
        <div className="flex items-center space-x-2">
          <span className="text-gray-300">Tool:</span>
          <span className="bg-blue-600 px-2 py-1 rounded text-white font-medium">
            {activeTool?.toUpperCase()}
          </span>
        </div>

        {/* Mode Indicators */}
        <div className="flex items-center space-x-2">
          {gridEnabled && (
            <span className="bg-green-600 px-2 py-1 rounded text-white text-xs">
              GRID
            </span>
          )}
          {snappingEnabled && (
            <span className="bg-green-600 px-2 py-1 rounded text-white text-xs">
              SNAP
            </span>
          )}
          {orthoMode && (
            <span className="bg-yellow-600 px-2 py-1 rounded text-white text-xs">
              ORTHO
            </span>
          )}
          {polarTracking && (
            <span className="bg-purple-600 px-2 py-1 rounded text-white text-xs">
              POLAR
            </span>
          )}
        </div>

        {/* Professional Features Indicators */}
        <div className="flex items-center space-x-1">
          {capabilities.constraintsCount > 0 && (
            <span className="bg-indigo-600 px-2 py-1 rounded text-white text-xs">
              C:{capabilities.constraintsCount}
            </span>
          )}
          {capabilities.associativeRelationshipsCount > 0 && (
            <span className="bg-teal-600 px-2 py-1 rounded text-white text-xs">
              A:{capabilities.associativeRelationshipsCount}
            </span>
          )}
          {capabilities.blockDefinitionsCount > 0 && (
            <span className="bg-orange-600 px-2 py-1 rounded text-white text-xs">
              B:{capabilities.blockDefinitionsCount}
            </span>
          )}
        </div>
      </div>

      {/* Center - Coordinates and cursor info */}
      <div className="flex items-center space-x-6">
        {/* Pan Position */}
        <div className="flex items-center space-x-2">
          <span className="text-gray-300">Pan:</span>
          <span className="font-mono">
            X:{formatCoordinate(pan.x)} Y:{formatCoordinate(pan.y)}
          </span>
        </div>

        {/* Zoom Level */}
        <div className="flex items-center space-x-2">
          <span className="text-gray-300">Zoom:</span>
          <span className="font-mono font-medium">
            {formatZoom(zoom)}
          </span>
        </div>
      </div>

      {/* Right side - Counts and system info */}
      <div className="flex items-center space-x-4">
        {/* Entity Counts */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            <span className="text-gray-300">Entities:</span>
            <span className="font-medium">{entitiesCount}</span>
          </div>
          
          {selectedCount > 0 && (
            <div className="flex items-center space-x-1">
              <span className="text-gray-300">Selected:</span>
              <span className="font-medium text-yellow-400">{selectedCount}</span>
            </div>
          )}
        </div>

        {/* System Status */}
        <div className="flex items-center space-x-2">
          {capabilities.professionalFeaturesEnabled && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-400 text-xs font-medium">PRO</span>
            </div>
          )}
          
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <span className="text-blue-400 text-xs">
              READY
            </span>
          </div>
        </div>

        {/* Units */}
        <div className="text-gray-300 text-xs">
          Units: mm
        </div>
      </div>
    </div>
  );
};

export default StatusBar;
