// src/components/cad/OptimizedCADCanvas.tsx
import React, { useEffect, useRef } from 'react';
import CADCanvas from './CADCanvas';
import useThreeJsOptimizer from '../../hooks/useThreeJsOptimizer'; // Restore this hook
import { useLOD } from 'src/hooks/useLodWasm'; // Keep the LOD hook
import { useCADStore } from 'src/store/cadStore';
import * as THREE from 'three';


interface OptimizedCADCanvasProps {
  width?: string | number;
  height?: string | number;
  previewComponent?: string | null;
  onComponentPlaced?: (component: string, position: {x: number, y: number, z: number}) => void;
  allowDragDrop?: boolean;

  // Optimization options (will be split between hooks)
  optimizationOptions?: {
    targetFps?: number;            // For useThreeJsOptimizer
    adaptiveResolution?: boolean;  // For useThreeJsOptimizer
    enableLod?: boolean;           // Controls useLOD activation
    enableFrustumCulling?: boolean;// Note: Frustum culling is in useLOD
    enableGeometryOptimization?: boolean; // Note: Geometry optimization is useLOD
    enableInstancing?: boolean;    // For useThreeJsOptimizer
    memoryManagement?: boolean;    // For useThreeJsOptimizer (disposeUnused is separate in useLOD)
    monitorPerformance?: boolean;  // General flag
    // LOD Specific Options
    highDetailThreshold?: number;
    mediumDetailThreshold?: number;
    lowDetailReduction?: number;
    mediumDetailReduction?: number;
    updateInterval?: number; // LOD update interval
    optimizeTextures?: boolean;
    disposeUnused?: boolean; // LOD specific disposal
    frustumMargin?: number;
  };
}

/**
 * Optimized CADCanvas using both useThreeJsOptimizer and useLOD (WASM).
 */
const OptimizedCADCanvas: React.FC<OptimizedCADCanvasProps> = ({
  width = '100%',
  height = '100%',
  previewComponent = null,
  onComponentPlaced,
  allowDragDrop = true,
  optimizationOptions = {}
}) => {
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.Camera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cadCanvasRef = useRef<any>(null);

  // --- Default Options & Configuration --- 
  const defaultOptions = {
    targetFps: 60,
    adaptiveResolution: true,
    enableLod: true,
    enableFrustumCulling: true, // Corresponds to LOD's frustum culling
    enableGeometryOptimization: true, // Corresponds to LOD process
    enableInstancing: true,
    memoryManagement: true,
    monitorPerformance: true,
    // LOD defaults
    highDetailThreshold: 150,
    mediumDetailThreshold: 500,
    lowDetailReduction: 0.2,
    mediumDetailReduction: 0.5,
    updateInterval: 100,
    optimizeTextures: true,
    disposeUnused: true,
    frustumMargin: 1.2
  };

  // Merge provided options with defaults
  const mergedOptions = { ...defaultOptions, ...optimizationOptions };

  // --- Hook Setup --- 

  // 1. useThreeJsOptimizer Hook (for general optimizations)
  const optimizerOptions = {
    targetFps: mergedOptions.targetFps,
    adaptiveResolution: mergedOptions.adaptiveResolution,
    // Pass flags for LOD/Frustum/Geometry opt, but the actual work is done by useLOD
    enableLod: mergedOptions.enableLod,
    enableFrustumCulling: mergedOptions.enableFrustumCulling,
    enableGeometryOptimization: mergedOptions.enableGeometryOptimization,
    enableInstancing: mergedOptions.enableInstancing,
    memoryManagement: mergedOptions.memoryManagement,
    monitorPerformance: mergedOptions.monitorPerformance
  };

  const { 
    stats: optimizerStats, 
    settings: optimizerSettings, 
    isOptimizing, 
    optimizeSceneNow 
  } = useThreeJsOptimizer(
    sceneRef,
    cameraRef,
    rendererRef,
    optimizerOptions
  );

  // 2. useLOD Hook (for WASM-based Level of Detail)
  const lodOptions = {
    highDetailThreshold: mergedOptions.highDetailThreshold,
    mediumDetailThreshold: mergedOptions.mediumDetailThreshold,
    lowDetailReduction: mergedOptions.lowDetailReduction,
    mediumDetailReduction: mergedOptions.mediumDetailReduction,
    updateInterval: mergedOptions.updateInterval,
    optimizeTextures: mergedOptions.optimizeTextures,
    disposeUnused: mergedOptions.disposeUnused,
    frustumMargin: mergedOptions.frustumMargin
  };

  const { statistics: lodStats } = useLOD(
    sceneRef,
    cameraRef,
    mergedOptions.enableLod ? lodOptions : {} // Only pass options if LOD is enabled
  );

  // --- Effects --- 

  // Get references effect (Remains the same)
  useEffect(() => {
    if (cadCanvasRef.current) {
        const checkForReferences = () => {
          if (window.cadCanvasScene && window.cadCanvasCamera) {
            sceneRef.current = window.cadCanvasScene;
            cameraRef.current = window.cadCanvasCamera;

            const canvasElement = document.querySelector('canvas');
            if (canvasElement) {
              const contextAttributes = (canvasElement as any).__proto__.getContext.call(
                canvasElement,
                'webgl2'
              ) || (canvasElement as any).__proto__.getContext.call(
                canvasElement,
                'webgl'
              );

              if (contextAttributes) {
                rendererRef.current = (window as any).__THREEJS_RENDERER__ || null;
                if (!rendererRef.current) {
                  console.warn('Renderer not found in global scope, attempting fallback.');
                   try {
                      const extractedRenderer = new THREE.WebGLRenderer({
                        canvas: canvasElement,
                        context: contextAttributes,
                        preserveDrawingBuffer: true
                      });
                      rendererRef.current = extractedRenderer;
                   } catch (e) {
                      console.error("Failed to create fallback renderer:", e);
                   }
                }
                if (rendererRef.current) {
                   console.log('Three.js references acquired for OptimizedCADCanvas');
                } else {
                   console.error('Failed to acquire Renderer reference.');
                }
              }
            }
          } else {
            setTimeout(checkForReferences, 500);
          }
        };
        window.exposeCADCanvasAPI = true;
        checkForReferences();
    }
  }, [cadCanvasRef]);

  // Effect to re-run optimization when content changes significantly
  // optimizeSceneNow from useThreeJsOptimizer might trigger internal updates
  // including potentially interacting with LOD if designed that way.
  useEffect(() => {
    const handleContentChange = () => {
      console.log('[OptimizedCADCanvas] Content changed, calling optimizeSceneNow...');
      optimizeSceneNow(); // Trigger general optimizer
    };

    const { useElementsStore } = require('src/store/elementsStore');
    const unsubscribeElements = useElementsStore.subscribe(
      (state: any, prevState: any) => {
        const currentLength = state.elements?.length ?? 0;
        const prevLength = prevState.elements?.length ?? 0;
        if (currentLength !== prevLength) {
          handleContentChange();
        }
      }
    );

     const unsubscribeViewMode = useCADStore.subscribe(
      (state, prevState) => {
        if (state.viewMode !== prevState.viewMode || state.gridVisible !== prevState.gridVisible || state.axisVisible !== prevState.axisVisible) {
          handleContentChange();
        }
      }
    );

    return () => {
      unsubscribeViewMode();
      unsubscribeElements();
    };
  }, [optimizeSceneNow]);

  // Mostra HUD delle statistiche combinando dati dai due hook
  const renderStatsOverlay = () => {
    if (!mergedOptions.monitorPerformance) return null;

    return (
      <div className="absolute bottom-14 left-4 bg-black bg-opacity-75 text-white text-xs p-2 rounded font-mono space-y-1">
        {/* Stats from useThreeJsOptimizer */}
        <div>FPS: {optimizerStats.fps.toFixed(1)}</div>
        <div>Triangles: {optimizerStats.triangleCount.toLocaleString()}</div>
        <div>Draw Calls: {optimizerStats.drawCalls}</div>
        <div>Resolution: {(optimizerSettings.resolutionScale * 100).toFixed(0)}%</div>
        {/* LOD Stats from useLOD */}
        {mergedOptions.enableLod && (
          <div className="pt-1 mt-1 border-t border-gray-600">
            <div>LOD High: {lodStats.highDetailCount}</div>
            <div>LOD Medium: {lodStats.mediumDetailCount}</div>
            <div>LOD Low: {lodStats.lowDetailCount}</div>
            <div>LOD Culled: {lodStats.culledCount}</div>
            <div>Mem Reduced: {(lodStats.memoryReduction * 100).toFixed(1)}%</div>
          </div>
        )}
        {isOptimizing && <div className="text-green-400">Optimizing...</div>}
      </div>
    );
  };

  return (
    <div className="relative w-full h-full">
      <CADCanvas
        // ref={cadCanvasRef} // Needs forwardRef in CADCanvas
        width={width}
        height={height}
        previewComponent={previewComponent}
        onComponentPlaced={onComponentPlaced}
        allowDragDrop={allowDragDrop}
      />

      {renderStatsOverlay()}

      {/* Keep Optimize Now button, it triggers useThreeJsOptimizer */}
      <button
        className="absolute top-5 right-28 bg-blue-500 hover:bg-blue-600 text-white text-xs px-2 py-1 rounded"
        onClick={optimizeSceneNow} // Still call the optimizer's manual trigger
        disabled={isOptimizing}
        title="Run manual optimization cycle"
      >
        {isOptimizing ? 'Optimizing...' : 'Optimize Now'}
      </button>
    </div>
  );
};

export default OptimizedCADCanvas;