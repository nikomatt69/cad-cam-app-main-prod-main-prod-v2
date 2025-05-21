// src/components/cad/technical-drawing/StatusBar.tsx

import React, { useState } from 'react';
import { Grid, Square, Move, Crosshair, Eye, Lock, Users, AlignLeft, Target, Settings } from 'react-feather';

interface StatusBarProps {
  coords: { x: number; y: number } | null;
  zoom: number;
  tool: string;
  orthoMode: boolean;
  toggleOrtho: () => void;
  polarMode: boolean;
  togglePolar: () => void;
  snapEnabled: boolean;
  toggleSnap: () => void;
  gridEnabled: boolean;
  toggleGrid: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  coords,
  zoom,
  tool,
  orthoMode,
  toggleOrtho,
  polarMode,
  togglePolar,
  snapEnabled,
  toggleSnap,
  gridEnabled,
  toggleGrid
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [snapDistance, setSnapDistance] = useState(10);
  const [gridSize, setGridSize] = useState(10);
  const [polarAngle, setPolarAngle] = useState(45);
  const [objectSnaps, setObjectSnaps] = useState({
    endpoint: true,
    midpoint: true,
    center: true,
    quadrant: false,
    intersection: true,
    extension: false,
    perpendicular: false
  });

  const formatValue = (value: number) => {
    return Math.round(value * 1000) / 1000;
  };

  const toggleObjectSnap = (snapType: keyof typeof objectSnaps) => {
    setObjectSnaps(prev => ({
      ...prev,
      [snapType]: !prev[snapType]
    }));
  };

  return (
    <div className="w-full h-full flex items-center text-xs text-gray-700 dark:text-gray-300">
      <div className="flex-1 flex items-center space-x-4">
        {/* Coordinates */}
        <div className="flex items-center space-x-2">
          <span className="font-medium">X:</span>
          <span className="font-mono bg-gray-200 dark:bg-gray-800 px-2 py-0.5 rounded">
            {coords ? formatValue(coords.x) : '0.000'}
          </span>
          
          <span className="font-medium">Y:</span>
          <span className="font-mono bg-gray-200 dark:bg-gray-800 px-2 py-0.5 rounded">
            {coords ? formatValue(coords.y) : '0.000'}
          </span>
        </div>
        
        {/* Zoom Level */}
        <div className="flex items-center space-x-2">
          <span className="font-medium">Zoom:</span>
          <span className="font-mono bg-gray-200 dark:bg-gray-800 px-2 py-0.5 rounded">
            {Math.round(zoom * 100)}%
          </span>
        </div>
        
        {/* Active Tool */}
        <div className="flex items-center space-x-2">
          <span className="font-medium">Tool:</span>
          <span className="font-mono bg-gray-200 dark:bg-gray-800 px-2 py-0.5 rounded capitalize">
            {tool.replace(/-/g, ' ')}
          </span>
        </div>
        
        {/* Model/Paper */}
        <div className="flex h-full">
          <button className="px-3 bg-blue-600 text-white font-medium h-full flex items-center">
            Model
          </button>
          <button className="px-3 hover:bg-gray-700 font-medium h-full flex items-center">
            Paper
          </button>
        </div>
      </div>
      
      {/* Toggle Buttons */}
      <div className="flex items-center space-x-1">
        <button
          onClick={toggleGrid}
          className={`flex items-center space-x-1 px-2 py-1 rounded-md ${
            gridEnabled ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' : 'hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          title="Toggle Grid (F7)"
        >
          <Grid size={14} />
          <span>GRID</span>
        </button>
        
        <button
          onClick={toggleSnap}
          className={`flex items-center space-x-1 px-2 py-1 rounded-md ${
            snapEnabled ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' : 'hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          title="Toggle Snap (F9)"
        >
          <Crosshair size={14} />
          <span>SNAP</span>
        </button>
        
        <button
          onClick={toggleOrtho}
          className={`flex items-center space-x-1 px-2 py-1 rounded-md ${
            orthoMode ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' : 'hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          title="Toggle Ortho Mode (F8)"
        >
          <Square size={14} />
          <span>ORTHO</span>
        </button>
        
        <button
          onClick={togglePolar}
          className={`flex items-center space-x-1 px-2 py-1 rounded-md ${
            polarMode ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' : 'hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          title="Toggle Polar Mode (F10)"
        >
          <Move size={14} />
          <span>POLAR</span>
        </button>
        
        <div className="h-5 w-px bg-gray-300 dark:bg-gray-700 mx-2"></div>
        
        {/* Object Snap Button with Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`flex items-center space-x-1 px-2 py-1 rounded-md ${
              Object.values(objectSnaps).some(val => val) 
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' 
                : 'hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            title="Object Snap Settings"
          >
            <Target size={14} />
            <span>OSNAP</span>
          </button>
          
          {showSettings && (
            <div className="absolute bottom-full right-0 mb-1 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-50 w-64">
              <div className="p-3">
                <h3 className="text-sm font-semibold text-gray-300 mb-2">Drawing Settings</h3>
                
                <div className="space-y-3 mb-3">
                  <div>
                    <h4 className="text-xs font-medium text-gray-400 mb-1">Snap Settings</h4>
                    <div className="flex items-center">
                      <span className="text-gray-300 text-xs mr-2">Snap Distance:</span>
                      <input 
                        type="number" 
                        value={snapDistance}
                        onChange={(e) => setSnapDistance(parseInt(e.target.value) || 0)}
                        className="bg-gray-700 border border-gray-600 rounded w-16 px-2 py-1 text-white text-xs"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-medium text-gray-400 mb-1">Grid Settings</h4>
                    <div className="flex items-center">
                      <span className="text-gray-300 text-xs mr-2">Grid Size:</span>
                      <input 
                        type="number" 
                        value={gridSize}
                        onChange={(e) => setGridSize(parseInt(e.target.value) || 0)}
                        className="bg-gray-700 border border-gray-600 rounded w-16 px-2 py-1 text-white text-xs"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-medium text-gray-400 mb-1">Polar Settings</h4>
                    <div className="flex items-center">
                      <span className="text-gray-300 text-xs mr-2">Increment Angle:</span>
                      <select
                        value={polarAngle}
                        onChange={(e) => setPolarAngle(parseInt(e.target.value))}
                        className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-xs"
                      >
                        <option value="15">15°</option>
                        <option value="30">30°</option>
                        <option value="45">45°</option>
                        <option value="90">90°</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <h4 className="text-xs font-medium text-gray-400 mb-1">Object Snaps</h4>
                <div className="grid grid-cols-2 gap-1">
                  <button
                    onClick={() => toggleObjectSnap('endpoint')}
                    className={`flex items-center text-xs px-2 py-1 rounded ${
                      objectSnaps.endpoint ? 'bg-blue-900 text-blue-200' : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded mr-1 border ${objectSnaps.endpoint ? 'bg-blue-500 border-blue-300' : 'border-gray-500'}`}></div>
                    Endpoint
                  </button>
                  
                  <button
                    onClick={() => toggleObjectSnap('midpoint')}
                    className={`flex items-center text-xs px-2 py-1 rounded ${
                      objectSnaps.midpoint ? 'bg-blue-900 text-blue-200' : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded mr-1 border ${objectSnaps.midpoint ? 'bg-blue-500 border-blue-300' : 'border-gray-500'}`}></div>
                    Midpoint
                  </button>
                  
                  <button
                    onClick={() => toggleObjectSnap('center')}
                    className={`flex items-center text-xs px-2 py-1 rounded ${
                      objectSnaps.center ? 'bg-blue-900 text-blue-200' : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded mr-1 border ${objectSnaps.center ? 'bg-blue-500 border-blue-300' : 'border-gray-500'}`}></div>
                    Center
                  </button>
                  
                  <button
                    onClick={() => toggleObjectSnap('quadrant')}
                    className={`flex items-center text-xs px-2 py-1 rounded ${
                      objectSnaps.quadrant ? 'bg-blue-900 text-blue-200' : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded mr-1 border ${objectSnaps.quadrant ? 'bg-blue-500 border-blue-300' : 'border-gray-500'}`}></div>
                    Quadrant
                  </button>
                  
                  <button
                    onClick={() => toggleObjectSnap('intersection')}
                    className={`flex items-center text-xs px-2 py-1 rounded ${
                      objectSnaps.intersection ? 'bg-blue-900 text-blue-200' : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded mr-1 border ${objectSnaps.intersection ? 'bg-blue-500 border-blue-300' : 'border-gray-500'}`}></div>
                    Intersection
                  </button>
                  
                  <button
                    onClick={() => toggleObjectSnap('perpendicular')}
                    className={`flex items-center text-xs px-2 py-1 rounded ${
                      objectSnaps.perpendicular ? 'bg-blue-900 text-blue-200' : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded mr-1 border ${objectSnaps.perpendicular ? 'bg-blue-500 border-blue-300' : 'border-gray-500'}`}></div>
                    Perpendicular
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Additional status indicators */}
        <div className="flex items-center space-x-3 ml-3">
          <div className="flex items-center text-gray-400 hover:text-white cursor-pointer">
            <Eye size={16} className="mr-1" />
            <span className="hidden sm:inline">Visibility</span>
          </div>
          
          <div className="flex items-center text-gray-400 hover:text-white cursor-pointer">
            <Lock size={16} className="mr-1" />
            <span className="hidden sm:inline">Lock</span>
          </div>
          
          <div className="flex items-center text-gray-400 hover:text-white cursor-pointer">
            <AlignLeft size={16} className="mr-1" />
            <span className="hidden sm:inline">Properties</span>
          </div>
          
          <div className="flex items-center text-gray-400 hover:text-white cursor-pointer">
            <Settings size={16} className="mr-1" />
            <span className="hidden sm:inline">Settings</span>
          </div>
        </div>
      </div>
    </div>
  );
};