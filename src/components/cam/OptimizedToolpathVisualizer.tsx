// src/components/cam/OptimizedToolpathVisualizer.tsx
import React, { useEffect, useRef, useState } from 'react';

import * as THREE from 'three';
import { useThreeJsOptimizer } from 'src/hooks/useThreeJsOptimizer';
import { PerformanceSettings, PerformanceStats } from 'src/lib/wasm/types';
import ToolpathVisualizer from './ToolpathVisualizer2';
import { memory } from '@/cad-optimizer-wasm/pkg/cad_optimizer_bg.wasm';

interface OptimizedToolpathVisualizerProps {
  width: string;
  height: string;
  gcode: string;
  isSimulating: boolean;
  selectedTool?: string | null;
  showWorkpiece?: boolean;
  onSimulationComplete?: () => void;
  onSimulationProgress?: (progress: number) => void;
  onToolChange?: (toolName: string) => void;
  
  // Optimization options
  optimizationOptions?: {
    targetFps?: number;
    adaptiveResolution?: boolean;
    enableLod?: boolean;
    enableFrustumCulling?: boolean;
    enableGeometryOptimization?: boolean;
    enableInstancing?: boolean;
    memoryManagement?: boolean;
    monitorPerformance?: boolean;
  };
}

/**
 * Optimized version of ToolpathVisualizer that uses WebAssembly modules
 * to improve rendering performance for complex toolpaths.
 */
const OptimizedToolpathVisualizer: React.FC<OptimizedToolpathVisualizerProps> = ({
  width,
  height,
  gcode,
  isSimulating,
  selectedTool = null,
  showWorkpiece = true,
  onSimulationComplete,
  onSimulationProgress,
  onToolChange,
  optimizationOptions = {}
}) => {
  // References to Three.js entities
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.Camera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  
  // Reference to the inner ToolpathVisualizer component
  const toolpathVisualizerRef = useRef<any>(null);
  
  // Default optimization options
  const defaultOptions = {
    targetFps: 60,
    adaptiveResolution: true,
    enableLod: true,
    enableFrustumCulling: true,
    enableGeometryOptimization: true,
    enableInstancing: true,
    memoryManagement: true,
    monitorPerformance: true
  };
  
  // Merge default options with provided options
  const options = { ...defaultOptions, ...optimizationOptions };
  
  // Use the optimizer
  const {
    stats,
    settings,
    isOptimizing,
    optimizeSceneNow
  } = useThreeJsOptimizer(
    sceneRef,
    cameraRef,
    rendererRef,
    options
  );

  // Get references to scene, camera, and renderer from ToolpathVisualizer
  useEffect(() => {
    if (toolpathVisualizerRef.current) {
      // Wait for ToolpathVisualizer to be initialized
      const checkForReferences = () => {
        // Access Three.js entities from ToolpathVisualizer
        if (window.toolpathVisualizerScene && window.toolpathVisualizerCamera) {
          sceneRef.current = window.toolpathVisualizerScene;
          cameraRef.current = window.toolpathVisualizerCamera;
          
          // Look for the renderer in the DOM
          const canvasElement = document.querySelector('canvas');
          if (canvasElement) {
            // The renderer is associated with the canvas
            const contextAttributes = (canvasElement as any).__proto__.getContext.call(
              canvasElement,
              'webgl2'
            ) || (canvasElement as any).__proto__.getContext.call(
              canvasElement,
              'webgl'
            );
            
            if (contextAttributes) {
              // Find the renderer instance associated with the canvas
              rendererRef.current = (window as any).__THREEJS_RENDERER__ || null;
              
              // If we don't find the renderer globally, try to extract it from events
              if (!rendererRef.current) {
                console.warn('Renderer not found in global scope, extracting from canvas');
                
                // Alternative technique: create a new renderer that reuses the same context
                const extractedRenderer = new THREE.WebGLRenderer({
                  canvas: canvasElement,
                  context: contextAttributes
                });
                
                rendererRef.current = extractedRenderer;
              }
              
              console.log('Three.js references acquired, initializing optimizer');
              
              // Force an optimization once references are obtained
              setTimeout(() => {
                optimizeSceneNow();
              }, 1000);
            }
          }
        } else {
          // Try again after a short delay
          setTimeout(checkForReferences, 500);
        }
      };
      
      // Enable exposure of ToolpathVisualizer API
      window.exposeToolpathVisualizerAPI = true;
      
      // Start checking for references
      checkForReferences();
    }
  }, [toolpathVisualizerRef, optimizeSceneNow]);

  // Handle changes in visualization mode or scene content
  useEffect(() => {
    // Re-run optimization when gcode or simulation state changes
    if (sceneRef.current && cameraRef.current) {
      // Wait for changes to be applied
      setTimeout(() => {
        optimizeSceneNow();
      }, 100);
    }
  }, [gcode, isSimulating, optimizeSceneNow]);

  // Show stats overlay if monitoring is enabled
  const renderStatsOverlay = () => {
    if (!options.monitorPerformance) return null;
    
    return (
      <div className="absolute bottom-20 left-4 bg-black bg-opacity-75 text-white text-xs p-2 rounded font-mono">
        <div>FPS: {stats.fps.toFixed(1)}</div>
        <div>Triangles: {stats.triangleCount.toLocaleString()}</div>
        <div>Draw Calls: {stats.drawCalls}</div>
        <div>Resolution: {(settings.resolutionScale * 100).toFixed(0)}%</div>
        {isOptimizing && <div className="text-green-400">Optimizing...</div>}
      </div>
    );
  };

  // Register a global reference to expose Scene and Camera
  useEffect(() => {
    return () => {
      // Clean up global references on unmount
      if (window.toolpathVisualizerScene) {
        window.toolpathVisualizerScene = undefined;
      }
      if (window.toolpathVisualizerCamera) {
        window.toolpathVisualizerCamera = undefined;
      }
    };
  }, []);

  // Add manual optimization button for toolpath debugging
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);
  
  return (
    <div className="relative w-full h-full">
      {/* Original ToolpathVisualizer */}
      <ToolpathVisualizer
        
        width={width}
        height={height}
        gcode={gcode}
        isSimulating={isSimulating}
        selectedTool={selectedTool}
        showWorkpiece={showWorkpiece}
        onSimulationComplete={onSimulationComplete}
        onSimulationProgress={onSimulationProgress}
        onToolChange={onToolChange}
      />
      
      {/* Stats overlay */}
      {renderStatsOverlay()}
      
      {/* Advanced controls toggle button */}
      <button
        className="absolute top-4 right-4 bg-gray-800 hover:bg-gray-700 text-white text-xs px-2 py-1 rounded opacity-60 hover:opacity-100"
        onClick={() => setShowAdvancedControls(!showAdvancedControls)}
      >
        {showAdvancedControls ? "Hide Controls" : "Advanced"}
      </button>
      
      {/* Advanced optimization controls */}
      {showAdvancedControls && (
        <div className="absolute top-12 right-4 bg-gray-800 bg-opacity-90 text-white text-xs p-2 rounded">
          <button
            className="w-full bg-blue-500 hover:bg-blue-600 text-white text-xs px-2 py-1 rounded mb-2"
            onClick={optimizeSceneNow}
            disabled={isOptimizing}
          >
            {isOptimizing ? 'Optimizing...' : 'Optimize Now'}
          </button>
          
          <div className="flex justify-between items-center mb-1">
            <label>Target FPS:</label>
            <span>{stats.fps.toFixed(1)}</span>
          </div>
          
          <div className="flex justify-between items-center mb-1">
            <label>Resolution:</label>
            <span>{(settings.resolutionScale * 100).toFixed(0)}%</span>
          </div>
          
          <div className="flex justify-between items-center mb-1">
            <label>LOD Bias:</label>
            <span>{settings.lodBias.toFixed(1)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <label>Memory:</label>
            <span>{(stats.memoryUsage / 1024 / 1024).toFixed(1)} MB</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default OptimizedToolpathVisualizer;