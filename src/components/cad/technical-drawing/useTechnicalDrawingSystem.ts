// src/components/cad/technical-drawing/useTechnicalDrawingSystem.ts

import { useEffect, useRef, useState } from 'react';
import { useTechnicalDrawingStore } from './technicalDrawingStore';
import KeyboardShortcutManager from './core/shortcuts/KeyboardShortcutManager';
import RenderOptimizer, { ViewportInfo } from './core/performance/RenderOptimizer';
import DxfImporter from './utils/import/DxfImporter';
import { CommandSystem } from './core/CommandSystem';
import { Point, DrawingViewport } from './TechnicalDrawingTypes';

interface TechnicalDrawingSystemConfig {
  enableShortcuts?: boolean;
  enablePerformanceOptimization?: boolean;
  enableContextMenus?: boolean;
  enableTooltips?: boolean;
  enableVisualFeedback?: boolean;
  optimizationLevel?: 'low' | 'medium' | 'high';
  chunkSize?: number;
  maxEntitiesPerChunk?: number;
}

interface TechnicalDrawingSystemState {
  isInitialized: boolean;
  performanceMetrics: any;
  shortcutManager: KeyboardShortcutManager | null;
  renderOptimizer: RenderOptimizer | null;
  commandSystem: CommandSystem | null;
  contextMenuPosition: Point | null;
  tooltipVisible: boolean;
}

export const useTechnicalDrawingSystem = (config: TechnicalDrawingSystemConfig = {}) => {
  const store = useTechnicalDrawingStore();
  const [systemState, setSystemState] = useState<TechnicalDrawingSystemState>({
    isInitialized: false,
    performanceMetrics: null,
    shortcutManager: null,
    renderOptimizer: null,
    commandSystem: null,
    contextMenuPosition: null,
    tooltipVisible: false
  });

  const shortcutManagerRef = useRef<KeyboardShortcutManager | null>(null);
  const renderOptimizerRef = useRef<RenderOptimizer | null>(null);
  const commandSystemRef = useRef<CommandSystem | null>(null);

  // Initialize system
  useEffect(() => {
    const initializeSystem = async () => {
      // Initialize keyboard shortcuts
      if (config.enableShortcuts !== false) {
        shortcutManagerRef.current = new KeyboardShortcutManager(store);
        console.log('✅ Keyboard shortcuts initialized');
      }

      // Initialize performance optimization
      if (config.enablePerformanceOptimization !== false) {
        renderOptimizerRef.current = new RenderOptimizer(
          config.chunkSize || 1000,
          config.maxEntitiesPerChunk || 500
        );
        
        if (config.optimizationLevel) {
          renderOptimizerRef.current.setOptimizationLevel(config.optimizationLevel);
        }
        
        console.log('✅ Performance optimization initialized');
      }

      // Initialize command system
      if (commandSystemRef.current === null) {
        commandSystemRef.current = new CommandSystem(store);
        console.log('✅ Command system initialized');
      }

      setSystemState(prev => ({
        ...prev,
        isInitialized: true,
        shortcutManager: shortcutManagerRef.current,
        renderOptimizer: renderOptimizerRef.current,
        commandSystem: commandSystemRef.current
      }));

      console.log('🎉 Technical Drawing System fully initialized');
    };

    initializeSystem();

    // Cleanup
    return () => {
      if (shortcutManagerRef.current) {
        shortcutManagerRef.current.destroy();
      }
      if (renderOptimizerRef.current) {
        renderOptimizerRef.current.cleanup();
      }
    };
  }, []);

  // Update performance metrics
  useEffect(() => {
    if (!renderOptimizerRef.current) return;

    const updateMetrics = () => {
      const metrics = renderOptimizerRef.current?.getPerformanceMetrics();
      setSystemState(prev => ({
        ...prev,
        performanceMetrics: metrics
      }));
    };

    const interval = setInterval(updateMetrics, 1000);
    return () => clearInterval(interval);
  }, [systemState.isInitialized]);

  // Update render optimizer when entities change
  useEffect(() => {
    if (renderOptimizerRef.current && systemState.isInitialized) {
      const allEntities = {
        ...store.entities,
        ...store.dimensions,
        ...store.annotations
      };
      
      renderOptimizerRef.current.updateEntities(allEntities as any);
    }
  }, [store.entities, store.dimensions, store.annotations, systemState.isInitialized]);

  // System control functions
  const enableShortcuts = () => {
    if (shortcutManagerRef.current) {
      shortcutManagerRef.current.setActive(true);
    }
  };

  const disableShortcuts = () => {
    if (shortcutManagerRef.current) {
      shortcutManagerRef.current.setActive(false);
    }
  };

  const getVisibleEntities = (viewport: ViewportInfo) => {
    if (!renderOptimizerRef.current) {
      return Object.values({
        ...store.entities,
        ...store.dimensions,
        ...store.annotations
      });
    }

    return renderOptimizerRef.current.getVisibleEntities(viewport);
  };

  const optimizedRender = (
    ctx: CanvasRenderingContext2D,
    entities: any[],
    viewport: ViewportInfo,
    renderEntity: (ctx: CanvasRenderingContext2D, entity: any, lod: number) => void
  ) => {
    if (!renderOptimizerRef.current) {
      entities.forEach(entity => renderEntity(ctx, entity, 0));
      return;
    }

    renderOptimizerRef.current.renderOptimized(ctx, entities, viewport, renderEntity);
  };

  const executeCommand = async (commandLine: string) => {
    if (!commandSystemRef.current) {
      throw new Error('Command system not initialized');
    }

    return commandSystemRef.current.executeCommand(commandLine);
  };

  const getCommandSuggestions = (input: string) => {
    if (!commandSystemRef.current) return [];
    return commandSystemRef.current.getCompletionSuggestions(input);
  };

  const importDxfFile = async (file: File) => {
    const importer = new DxfImporter({
      createMissingLayers: true,
      mergeWithExisting: true
    });

    const result = await importer.importFromFile(file);
    
    if (result.success) {
      // Add imported entities to store
      Object.values(result.entities).forEach(entity => {
        store.addEntity(entity as any);
      });

      // Add imported layers
      result.layers.forEach(layer => {
        const existing = store.drawingLayers.find(l => l.name === layer.name);
        if (!existing) {
          store.addLayer(layer);
        }
      });

      console.log(`✅ Imported ${result.importedCount} entities from DXF`);
    }

    return result;
  };

  const importDxfString = async (dxfContent: string) => {
    const importer = new DxfImporter({
      createMissingLayers: true,
      mergeWithExisting: true
    });

    const result = await importer.importFromString(dxfContent);
    
    if (result.success) {
      // Add imported entities to store
      Object.values(result.entities).forEach(entity => {
        store.addEntity(entity as any);
      });

      // Add imported layers
      result.layers.forEach(layer => {
        const existing = store.drawingLayers.find(l => l.name === layer.name);
        if (!existing) {
          store.addLayer(layer);
        }
      });

      console.log(`✅ Imported ${result.importedCount} entities from DXF string`);
    }

    return result;
  };

  const showContextMenu = (position: Point, entityId?: string, entityIds?: string[]) => {
    setSystemState(prev => ({
      ...prev,
      contextMenuPosition: position
    }));

    // Dispatch event for context menu component
    const event = new CustomEvent('cad_context_menu', {
      detail: { position, entityId, entityIds }
    });
    window.dispatchEvent(event);
  };

  const hideContextMenu = () => {
    setSystemState(prev => ({
      ...prev,
      contextMenuPosition: null
    }));

    const event = new CustomEvent('cad_context_menu_hide');
    window.dispatchEvent(event);
  };

  const showTooltip = (content: React.ReactNode, position: Point) => {
    setSystemState(prev => ({
      ...prev,
      tooltipVisible: true
    }));

    const event = new CustomEvent('cad_tooltip_show', {
      detail: { content, position }
    });
    window.dispatchEvent(event);
  };

  const hideTooltip = () => {
    setSystemState(prev => ({
      ...prev,
      tooltipVisible: false
    }));

    const event = new CustomEvent('cad_tooltip_hide');
    window.dispatchEvent(event);
  };

  const markEntityDirty = (entityId: string) => {
    if (renderOptimizerRef.current) {
      renderOptimizerRef.current.markEntityDirty(entityId);
    }
  };

  const exportShortcuts = () => {
    if (!shortcutManagerRef.current) return null;
    return shortcutManagerRef.current.exportConfig();
  };

  const importShortcuts = (config: Record<string, { key: string; modifiers: string[] }>) => {
    if (shortcutManagerRef.current) {
      shortcutManagerRef.current.importConfig(config);
    }
  };

  const resetShortcuts = () => {
    if (shortcutManagerRef.current) {
      shortcutManagerRef.current.resetToDefaults();
    }
  };

  const getAllShortcuts = () => {
    if (!shortcutManagerRef.current) return [];
    return shortcutManagerRef.current.getAllActions();
  };

  const updateShortcut = (actionId: string, key: string, modifiers: string[] = []) => {
    if (!shortcutManagerRef.current) return false;
    return shortcutManagerRef.current.updateMapping(actionId, key, modifiers);
  };

  const isShortcutAvailable = (key: string, modifiers: string[] = []) => {
    if (!shortcutManagerRef.current) return true;
    return shortcutManagerRef.current.isKeyComboAvailable(key, modifiers);
  };

  // Development helpers
  const getSystemInfo = () => {
    return {
      isInitialized: systemState.isInitialized,
      hasShortcuts: !!shortcutManagerRef.current,
      hasPerformanceOptimization: !!renderOptimizerRef.current,
      hasCommandSystem: !!commandSystemRef.current,
      performanceMetrics: systemState.performanceMetrics,
      entityCount: Object.keys({
        ...store.entities,
        ...store.dimensions,
        ...store.annotations
      }).length,
      layerCount: store.drawingLayers.length,
      commandHistoryLength: store.commandHistory.length
    };
  };

  const dumpSystemState = () => {
    console.group('🔧 Technical Drawing System State');
    console.log('System Info:', getSystemInfo());
    console.log('Store State:', {
      entities: Object.keys(store.entities).length,
      dimensions: Object.keys(store.dimensions).length,
      annotations: Object.keys(store.annotations).length,
      layers: store.drawingLayers.length,
      selectedEntities: store.selectedEntityIds.length,
      activeTool: store.activeTool,
      zoom: store.zoom
    });
    if (systemState.performanceMetrics) {
      console.log('Performance Metrics:', systemState.performanceMetrics);
    }
    console.groupEnd();
  };

  return {
    // System state
    isInitialized: systemState.isInitialized,
    performanceMetrics: systemState.performanceMetrics,
    
    // Shortcuts
    enableShortcuts,
    disableShortcuts,
    getAllShortcuts,
    updateShortcut,
    isShortcutAvailable,
    exportShortcuts,
    importShortcuts,
    resetShortcuts,
    
    // Performance optimization
    getVisibleEntities,
    optimizedRender,
    markEntityDirty,
    
    // Command system
    executeCommand,
    getCommandSuggestions,
    
    // Import/Export
    importDxfFile,
    importDxfString,
    
    // UI interactions
    showContextMenu,
    hideContextMenu,
    showTooltip,
    hideTooltip,
    
    // Development
    getSystemInfo,
    dumpSystemState,
    
    // Access to subsystems (for advanced usage)
    shortcutManager: shortcutManagerRef.current,
    renderOptimizer: renderOptimizerRef.current,
    commandSystem: commandSystemRef.current
  };
};

export default useTechnicalDrawingSystem;
