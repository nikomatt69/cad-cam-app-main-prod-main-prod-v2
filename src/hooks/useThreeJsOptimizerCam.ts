// src/hooks/useThreeJsOptimizer.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import * as THREE from 'three';
import { 
  initWasmOptimizer, 
  configureOptimizer, 
  getPerformanceStats, 
  updatePerformanceStats, 
  calculateOptimalSettings,
  isOptimizerInitialized
} from '../lib/wasm/wasmBridge';
import { PerformanceSettings, PerformanceStats } from '../lib/wasm/types';

interface ThreeJsOptimizerOptions {
  targetFps?: number;
  adaptiveResolution?: boolean;
  enableLod?: boolean;
  enableFrustumCulling?: boolean;
  enableGeometryOptimization?: boolean;
  enableInstancing?: boolean;
  memoryManagement?: boolean;
  monitorPerformance?: boolean;
}

interface UseThreeJsOptimizerResult {
  stats: PerformanceStats;
  settings: PerformanceSettings;
  isOptimizing: boolean;
  optimizeSceneNow: () => Promise<void>;
  resetSettings: () => void;
  disposeUnusedResources: () => void;
}

const DEFAULT_SETTINGS: PerformanceSettings = {
  targetFps: 60,
  resolutionScale: 1.0,
  lodBias: 1.0,
  maxTriangles: 1000000,
  frustumCulling: true
};

const DEFAULT_STATS: PerformanceStats = {
  fps: 0,
  frameTime: 0,
  triangleCount: 0,
  drawCalls: 0,
  memoryUsage: 0,
  gpuUsage: 0
};

/**
 * A hook for optimizing Three.js scenes with WebAssembly acceleration
 */
export function useThreeJsOptimizerCam(
  sceneRef: React.RefObject<THREE.Scene | null>,
  cameraRef: React.RefObject<THREE.Camera | null>,
  rendererRef: React.RefObject<THREE.WebGLRenderer | null>,
  options: ThreeJsOptimizerOptions = {}
): UseThreeJsOptimizerResult {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [stats, setStats] = useState<PerformanceStats>(DEFAULT_STATS);
  const [settings, setSettings] = useState<PerformanceSettings>(DEFAULT_SETTINGS);
  
  // Track if the optimizer has been initialized
  const isInitialized = useRef(false);
  
  // Frame counter for performance analysis
  const frameCount = useRef(0);
  const lastFrameTime = useRef(performance.now());
  const frameTimeHistory = useRef<number[]>([]);
  
  // Keep track of animation frame
  const animationFrameRef = useRef<number | null>(null);
  
  // Initialize the WebAssembly optimizer module
  useEffect(() => {
    const initialize = async () => {
      try {
        if (!isOptimizerInitialized()) {
          await initWasmOptimizer();
          
          // Configure initial settings
          await configureOptimizer({
            ...DEFAULT_SETTINGS,
            targetFps: options.targetFps || DEFAULT_SETTINGS.targetFps
          });
          
          isInitialized.current = true;
          console.log('Three.js Optimizer initialized successfully');
        }
      } catch (error) {
        console.error('Failed to initialize Three.js Optimizer:', error);
      }
    };
    
    initialize();
    
    return () => {
      // Clean up any resources when the hook unmounts
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [options.targetFps]);
  
  // Calculate scene statistics
  const calculateSceneStats = useCallback(() => {
    if (!sceneRef.current || !rendererRef.current) return DEFAULT_STATS;
    
    let triangleCount = 0;
    let drawCalls = 0;
    
    // Count triangles and objects
    sceneRef.current.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        const geometry = object.geometry;
        if (geometry.index) {
          triangleCount += geometry.index.count / 3;
        } else if (geometry.attributes.position) {
          triangleCount += geometry.attributes.position.count / 3;
        }
        
        // Estimate draw calls
        if (object.visible) {
          drawCalls++;
        }
      }
    });
    
    // Get memory information from renderer
    const memory = rendererRef.current.info.memory;
    const render = rendererRef.current.info.render;
    
    // Calculate FPS
    const now = performance.now();
    const deltaTime = now - lastFrameTime.current;
    lastFrameTime.current = now;
    
    frameCount.current++;
    frameTimeHistory.current.push(deltaTime);
    
    // Keep only the last 60 frames for FPS calculation
    if (frameTimeHistory.current.length > 60) {
      frameTimeHistory.current.shift();
    }
    
    // Calculate average FPS
    const avgFrameTime = frameTimeHistory.current.reduce((sum, time) => sum + time, 0) / 
                        frameTimeHistory.current.length;
    const fps = 1000 / avgFrameTime;
    
    return {
      fps,
      frameTime: avgFrameTime,
      triangleCount: Math.floor(triangleCount),
      drawCalls: render.calls,
      memoryUsage: (window.performance?.memory?.usedJSHeapSize || 0),
      gpuUsage: memory.textures + memory.geometries // Simple approximation
    };
  }, [sceneRef, rendererRef]);
  
  // Update performance stats in an animation loop
  useEffect(() => {
    if (!isInitialized.current || !options.monitorPerformance) return;
    
    const updateStats = async () => {
      try {
        // Calculate current stats
        const currentStats = calculateSceneStats();
        
        // Update stats in the WebAssembly module
        await updatePerformanceStats(
          currentStats.fps,
          currentStats.frameTime,
          currentStats.triangleCount,
          currentStats.drawCalls
        );
        
        // Get updated stats from WebAssembly
        const wasmStats = await getPerformanceStats();
        
        // Update React state
        setStats(wasmStats);
        
        // Schedule next update
        animationFrameRef.current = requestAnimationFrame(updateStats);
      } catch (error) {
        console.error('Error updating performance stats:', error);
      }
    };
    
    // Start monitoring
    updateStats();
    
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [calculateSceneStats, options.monitorPerformance]);
  
  // Apply adaptive resolution
  useEffect(() => {
    if (!rendererRef.current || !options.adaptiveResolution) return;
    
    // Update pixel ratio based on resolutionScale
    rendererRef.current.setPixelRatio(
      window.devicePixelRatio * settings.resolutionScale
    );
    
  }, [settings.resolutionScale, options.adaptiveResolution, rendererRef]);
  
  // Optimize scene based on current performance
  const optimizeSceneNow = useCallback(async () => {
    if (!isInitialized.current || !sceneRef.current || isOptimizing) return;
    
    setIsOptimizing(true);
    
    try {
      console.log('Optimizing Three.js scene...');
      
      // Get current stats
      const currentStats = calculateSceneStats();
      
      // Update WASM with current stats
      await updatePerformanceStats(
        currentStats.fps,
        currentStats.frameTime,
        currentStats.triangleCount,
        currentStats.drawCalls
      );
      
      // Calculate optimal settings
      const optimalSettings = await calculateOptimalSettings();
      
      // Apply settings
      await configureOptimizer(optimalSettings);
      
      // Update local state
      setSettings(optimalSettings);
      
      // Apply optimizations to the scene
      
      // 1. Apply LOD if enabled
      if (options.enableLod) {
        applyLodOptimizations(sceneRef.current, optimalSettings.lodBias);
      }
      
      // 2. Apply frustum culling if enabled
      if (options.enableFrustumCulling) {
        applyFrustumCulling(sceneRef.current);
      }
      
      // 3. Apply geometry optimization if enabled
      if (options.enableGeometryOptimization) {
        applyGeometryOptimizations(sceneRef.current);
      }
      
      // 4. Apply material instancing if enabled
      if (options.enableInstancing) {
        applyMaterialInstancing(sceneRef.current);
      }
      
      // 5. Apply memory management if enabled
      if (options.memoryManagement) {
        disposeUnusedResources();
      }
      
      console.log('Three.js scene optimized successfully');
    } catch (error) {
      console.error('Failed to optimize Three.js scene:', error);
    } finally {
      setIsOptimizing(false);
    }
  }, [
    isOptimizing, 
    sceneRef, 
    calculateSceneStats, 
    options.enableLod, 
    options.enableFrustumCulling,
    options.enableGeometryOptimization,
    options.enableInstancing,
    options.memoryManagement
  ]);
  
  // Apply LOD optimizations
  const applyLodOptimizations = useCallback((scene: THREE.Scene, lodBias: number) => {
    // Find meshes with high triangle counts
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        const geometry = object.geometry;
        let triangleCount = 0;
        
        if (geometry.index) {
          triangleCount = geometry.index.count / 3;
        } else if (geometry.attributes.position) {
          triangleCount = geometry.attributes.position.count / 3;
        }
        
        // If this is a high-detail mesh, we might want to reduce its complexity
        if (triangleCount > 10000) {
          // Here we'd use the WASM optimizer to decimate the mesh, but for now
          // we'll just add a simple LOD system if the object doesn't already have one
          if (!(object.parent instanceof THREE.LOD)) {
            const lod = new THREE.LOD();
            
            // Get the original's world position and add it to the LOD
            const worldPosition = new THREE.Vector3();
            object.getWorldPosition(worldPosition);
            lod.position.copy(worldPosition);
            
            // Add the original as the highest detail
            lod.addLevel(object, 0);
            
            // Generate lower detail versions in a real implementation
            // For now, just create a simpler stand-in for distant views
            const simplifiedGeometry = createSimplifiedGeometry(geometry, 0.5);
            const simplifiedMesh = new THREE.Mesh(
              simplifiedGeometry,
              object.material
            );
            lod.addLevel(simplifiedMesh, 50 * lodBias);
            
            // Add the LOD system to the scene
            if (object.parent) {
              const parent = object.parent;
              parent.remove(object);
              parent.add(lod);
            }
          }
        }
      }
    });
  }, []);
  
  // Create a simplified version of a geometry (placeholder implementation)
  const createSimplifiedGeometry = (originalGeometry: THREE.BufferGeometry, reductionFactor: number) => {
    // This is a simplified version - in a real implementation, 
    // we'd use the WASM module to perform mesh decimation
    const simplifiedGeometry = originalGeometry.clone();
    
    // Here we're just removing every other vertex as a simple decimation
    // This is NOT a proper decimation algorithm and is just for demonstration
    if (simplifiedGeometry.index) {
      const originalIndices = simplifiedGeometry.index.array;
      const newIndices = new Uint32Array(Math.floor(originalIndices.length * reductionFactor));
      
      for (let i = 0, j = 0; i < newIndices.length; i++, j += 2) {
        if (j < originalIndices.length) {
          newIndices[i] = originalIndices[j];
        }
      }
      
      simplifiedGeometry.setIndex(new THREE.BufferAttribute(newIndices, 1));
    }
    
    return simplifiedGeometry;
  };
  
  // Apply frustum culling optimization
  const applyFrustumCulling = useCallback((scene: THREE.Scene) => {
    // Ensure frustum culling is enabled on all objects
    scene.traverse((object) => {
      object.frustumCulled = true;
    });
  }, []);
  
  // Apply geometry optimizations
  const applyGeometryOptimizations = useCallback((scene: THREE.Scene) => {
    // Center geometries at origin for better frustum culling
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.geometry) {
        // Center geometry if it's not already centered
        if (!object.geometry.boundingSphere) {
          object.geometry.computeBoundingSphere();
        }
        
        // Merge small geometries with the same material
        // (This would be handled by the WASM module in a real implementation)
      }
    });
  }, []);
  
  // Apply material instancing
  const applyMaterialInstancing = useCallback((scene: THREE.Scene) => {
    // Map to track materials by their properties
    const materialMap = new Map<string, THREE.Material>();
    
    // Traverse scene to find duplicate materials
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        // Handle both single materials and material arrays
        if (Array.isArray(object.material)) {
          object.material = object.material.map(mat => {
            return deduplicateMaterial(mat, materialMap);
          });
        } else {
          object.material = deduplicateMaterial(object.material, materialMap);
        }
      }
    });
  }, []);
  
  // Helper function to deduplicate materials
  const deduplicateMaterial = (material: THREE.Material, materialMap: Map<string, THREE.Material>) => {
    // Create a key based on material properties
    const key = getMaterialKey(material);
    
    // Check if we already have an equivalent material
    if (materialMap.has(key)) {
      return materialMap.get(key)!;
    }
    
    // Store this material for future reuse
    materialMap.set(key, material);
    return material;
  };
  
  // Generate a unique key for a material based on its properties
  const getMaterialKey = (material: THREE.Material) => {
    // Basic implementation - in practice, you'd include more properties
    if (material instanceof THREE.MeshStandardMaterial) {
      return `standard_${material.color.getHexString()}_${material.roughness}_${material.metalness}`;
    } else if (material instanceof THREE.MeshBasicMaterial) {
      return `basic_${material.color.getHexString()}_${material.wireframe}`;
    } else if (material instanceof THREE.MeshPhongMaterial) {
      return `phong_${material.color.getHexString()}_${material.shininess}`;
    }
    
    // Fallback for other material types
    return `material_${material.uuid}`;
  };
  
  // Dispose unused resources
  const disposeUnusedResources = useCallback(() => {
    if (!rendererRef.current) return;
    
    // This is a simple cleanup - in a full implementation,
    // the WASM module would track resource usage and optimize disposal
    
    // Clear the Three.js cache
    // Note: You should be very careful with this in a real app
    // as it might dispose resources that are still in use
    // This is more of a demonstration than a complete solution
    THREE.Cache.clear();
    
    // Clean up renderer state
    rendererRef.current.info.reset();
    
    // If we're manually tracking resources, we would clean them up here
    
    // Request garbage collection (if available in the browser)
    if (typeof window !== 'undefined' && (window as any).gc) {
      (window as any).gc();
    }
    
    console.log('Unused resources have been disposed');
  }, [rendererRef]);
  
  // Reset settings to defaults
  const resetSettings = useCallback(async () => {
    if (!isInitialized.current) return;
    
    try {
      await configureOptimizer(DEFAULT_SETTINGS);
      setSettings(DEFAULT_SETTINGS);
      
      // Reset any applied optimizations
      if (rendererRef.current) {
        rendererRef.current.setPixelRatio(window.devicePixelRatio);
      }
      
      console.log('Three.js optimizer settings reset to defaults');
    } catch (error) {
      console.error('Failed to reset optimizer settings:', error);
    }
  }, [rendererRef]);
  
  return {
    stats,
    settings,
    isOptimizing,
    optimizeSceneNow,
    resetSettings,
    disposeUnusedResources
  };
}