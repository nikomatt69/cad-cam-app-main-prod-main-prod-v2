// src/hooks/useTechnicalDrawing.ts

import { useCallback } from 'react';
import { useTechnicalDrawingStore } from '../store/technicalDrawingStore';
import { 
  DrawingEntity, 
  DrawingStandard, 
  Dimension, 
  Annotation, 
  Point 
} from '../types/TechnicalDrawingTypes';

export function useTechnicalDrawing() {
  const {
    entities,
    dimensions,
    annotations,
    viewports,
    activeViewportId,
    sheet,
    drawingStandard,
    selectedEntityIds,
    hoveredEntityId,
    zoom,
    pan,
    activeTool,
    snappingEnabled,
    gridEnabled,
    gridSize,
    
    // Actions
    addEntity,
    updateEntity,
    deleteEntity,
    addDimension,
    updateDimension,
    deleteDimension,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    addViewport,
    updateViewport,
    deleteViewport,
    setActiveViewport,
    updateSheet,
    setDrawingStandard,
    selectEntity,
    deselectEntity,
    clearSelection,
    setHoveredEntity,
    setZoom,
    setPan,
    zoomToFit,
    zoomToSelection,
    setActiveTool,
    toggleSnapping,
    toggleGrid,
    setGridSize
  } = useTechnicalDrawingStore();
  
  // Collect all entities for active viewport
  const getActiveViewportEntities = useCallback(() => {
    if (!activeViewportId || !viewports[activeViewportId]) {
      return [];
    }
    
    const viewport = viewports[activeViewportId];
    return viewport.entities.map(id => {
      if (entities[id]) return { ...entities[id], entityType: 'geometry' };
      if (dimensions[id]) return { ...dimensions[id], entityType: 'dimension' };
      if (annotations[id]) return { ...annotations[id], entityType: 'annotation' };
      return null;
    }).filter(Boolean);
  }, [activeViewportId, viewports, entities, dimensions, annotations]);
  
  const activeViewportEntities = getActiveViewportEntities();
  
  const activeViewport = activeViewportId ? viewports[activeViewportId] : null;
  
  // Generate export data
  const exportDrawingData = useCallback(() => {
    return {
      entities,
      dimensions,
      annotations,
      viewports,
      sheet,
      drawingStandard
    };
  }, [entities, dimensions, annotations, viewports, sheet, drawingStandard]);
  
  // Import drawing data
  const importDrawingData = useCallback((data: any) => {
    // This would need proper implementation to replace the current state
    console.log('importDrawingData not yet implemented', data);
  }, []);
  
  // Convert 3D models to 2D drawing
  const convertModelTo2D = useCallback((modelData: any, viewType: 'front' | 'top' | 'side' | 'isometric') => {
    // This would need implementation based on your 3D model structure
    console.log('convertModelTo2D not yet implemented', modelData, viewType);
    return [];
  }, []);
  
  return {
    // State
    entities,
    dimensions,
    annotations,
    viewports,
    activeViewportId,
    activeViewport,
    activeViewportEntities,
    sheet,
    drawingStandard,
    selectedEntityIds,
    hoveredEntityId,
    zoom,
    pan,
    activeTool,
    snappingEnabled,
    gridEnabled,
    gridSize,
    
    // Entity actions
    addEntity,
    updateEntity,
    deleteEntity,
    
    // Dimension actions
    addDimension,
    updateDimension,
    deleteDimension,
    
    // Annotation actions
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    
    // Viewport actions
    addViewport,
    updateViewport,
    deleteViewport,
    setActiveViewport,
    
    // Sheet actions
    updateSheet,
    
    // Standard actions
    setDrawingStandard,
    
    // Selection actions
    selectEntity,
    deselectEntity,
    clearSelection,
    setHoveredEntity,
    
    // View actions
    setZoom,
    setPan,
    zoomToFit,
    zoomToSelection,
    
    // Drawing tools
    setActiveTool,
    toggleSnapping,
    toggleGrid,
    setGridSize,
    
    // Utility functions
    exportDrawingData,
    importDrawingData,
    convertModelTo2D
  };
}