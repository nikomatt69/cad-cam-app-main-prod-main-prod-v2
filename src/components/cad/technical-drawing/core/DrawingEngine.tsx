// src/components/cad/technical-drawing/core/DrawingEngine.tsx
// Main drawing engine for the technical drawing system

import React, { useRef, useEffect, useState } from 'react';
import { useTechnicalDrawingStore } from '../technicalDrawingStore';
import { Point, AnyEntity, isDrawingEntity, isDimension, isAnnotation } from '../../../../types/TechnicalDrawingTypes';
import { renderEntity } from '../rendering/entity-renderers';

interface DrawingEngineProps {
  width: number;
  height: number;
  viewportId?: string;
  gridSize?: number;
  showGrid?: boolean;
  snapToGrid?: boolean;
  backgroundColor?: string;
  onEntityClick?: (entityId: string) => void;
  onCanvasClick?: (point: Point) => void;
  onCanvasMove?: (point: Point) => void;
}

/**
 * DrawingEngine - Core component responsible for rendering the technical drawing canvas
 * Handles rendering, transformations, and user interactions
 */
export const DrawingEngine: React.FC<DrawingEngineProps> = ({
  width,
  height,
  viewportId,
  gridSize = 10,
  showGrid = true,
  snapToGrid = true,
  backgroundColor = '#FFFFFF',
  onEntityClick,
  onCanvasClick,
  onCanvasMove,
}) => {
  // Get drawing store state
  const {
    entities,
    layers,
    activeLayer,
    viewports,
    activeViewport,
    zoom,
    pan,
    selectedEntities,
    setSelectedEntities,
  } = useTechnicalDrawingStore();

  // Set up canvas refs for main drawing and grid
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // State for tracking mouse position and interactions
  const [mousePosition, setMousePosition] = useState<Point | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  
  // Use the provided viewportId or the active viewport
  const currentViewportId = viewportId || activeViewport;
  const viewport = currentViewportId ? viewports[currentViewportId] : null;

  // Convert screen coordinates to world coordinates
  const screenToWorld = (point: Point): Point => {
    if (!viewport) return point;
    return {
      x: (point.x - pan.x) / zoom,
      y: (point.y - pan.y) / zoom,
    };
  };

  // Convert world coordinates to screen coordinates
  const worldToScreen = (point: Point): Point => {
    if (!viewport) return point;
    return {
      x: point.x * zoom + pan.x,
      y: point.y * zoom + pan.y,
    };
  };

  // Snap point to grid if enabled
  const snapToGridPoint = (point: Point): Point => {
    if (!snapToGrid) return point;
    return {
      x: Math.round(point.x / gridSize) * gridSize,
      y: Math.round(point.y / gridSize) * gridSize,
    };
  };

  // Draw grid on grid canvas
  const drawGrid = () => {
    const gridCanvas = gridCanvasRef.current;
    if (!gridCanvas) return;

    const ctx = gridCanvas.getContext('2d');
    if (!ctx) return;

    // Clear the canvas
    ctx.clearRect(0, 0, width, height);
    
    if (!showGrid) return;

    // Set grid style
    ctx.strokeStyle = '#CCCCCC';
    ctx.lineWidth = 0.5;
    
    // Calculate grid spacing based on zoom level
    const scaledGridSize = gridSize * zoom;
    
    // Offset based on pan
    const offsetX = pan.x % scaledGridSize;
    const offsetY = pan.y % scaledGridSize;
    
    // Draw vertical lines
    for (let x = offsetX; x < width; x += scaledGridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // Draw horizontal lines
    for (let y = offsetY; y < height; y += scaledGridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };

  // Draw all entities on main canvas
  const drawEntities = () => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with background color
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
    
    // Apply global transformation based on zoom and pan
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);
    
    // Get entities to render (either from viewport or all entities)
    const entitiesToRender = viewport ? 
      viewport.entities.map(id => entities[id]).filter(Boolean) : 
      Object.values(entities);
    
    // Filter by visible layers
    const visibleLayers = Object.values(layers).filter(layer => layer.visible);
    const visibleLayerIds = visibleLayers.map(layer => layer.id);
    
    const visibleEntities = entitiesToRender.filter(
      entity => entity && visibleLayerIds.includes(entity.layer) && entity.visible
    );
    
    // Draw entities by layer order (bottom to top)
    visibleLayers
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .forEach(layer => {
        const layerEntities = visibleEntities.filter(entity => entity.layer === layer.id);
        
        // Draw regular entities first, then dimensions, then annotations
        const drawingEntities = layerEntities.filter(entity => isDrawingEntity(entity));
        const dimensionEntities = layerEntities.filter(entity => isDimension(entity));
        const annotationEntities = layerEntities.filter(entity => isAnnotation(entity));
        
        [...drawingEntities, ...dimensionEntities, ...annotationEntities].forEach(entity => {
          ctx.save();
          // Highlight selected entities
          const isSelected = selectedEntities.includes(entity.id);
          renderEntity(ctx, entity as AnyEntity, isSelected);
          ctx.restore();
        });
      });
    
    ctx.restore();
  };

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (mainCanvasRef.current && gridCanvasRef.current) {
        drawGrid();
        drawEntities();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [width, height]);

  // Redraw when relevant state changes
  useEffect(() => {
    drawGrid();
    drawEntities();
  }, [
    entities, 
    layers, 
    activeLayer, 
    viewports, 
    activeViewport, 
    zoom, 
    pan, 
    selectedEntities,
    showGrid,
    snapToGrid,
    width,
    height,
    backgroundColor
  ]);

  // Event handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = mainCanvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const clickPoint = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    const worldPoint = screenToWorld(clickPoint);
    const snappedPoint = snapToGridPoint(worldPoint);
    
    setIsDragging(true);
    setDragStart(clickPoint);
    
    // TODO: Implement hit testing logic to select entities
    
    if (onCanvasClick) {
      onCanvasClick(snappedPoint);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = mainCanvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const movePoint = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    const worldPoint = screenToWorld(movePoint);
    const snappedPoint = snapToGridPoint(worldPoint);
    
    setMousePosition(snappedPoint);
    
    if (isDragging && dragStart) {
      // Handle dragging logic
      // This could be panning or moving entities depending on context
    }
    
    if (onCanvasMove) {
      onCanvasMove(snappedPoint);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  return (
    <div 
      className="drawing-engine-container"
      style={{ 
        position: 'relative', 
        width, 
        height, 
        overflow: 'hidden',
        backgroundColor: '#F5F5F5',
        border: '1px solid #CCCCCC' 
      }}
    >
      {/* Grid Canvas Layer */}
      <canvas
        ref={gridCanvasRef}
        width={width}
        height={height}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 1
        }}
      />
      
      {/* Main Drawing Canvas Layer */}
      <canvas
        ref={mainCanvasRef}
        width={width}
        height={height}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 2
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      
      {/* Status overlay (optional) */}
      {mousePosition && (
        <div 
          className="coordinates-display"
          style={{
            position: 'absolute',
            bottom: 5,
            left: 5,
            zIndex: 3,
            padding: '2px 5px',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            color: 'white',
            borderRadius: 3,
            fontSize: 12
          }}
        >
          X: {mousePosition.x.toFixed(2)}, Y: {mousePosition.y.toFixed(2)}
        </div>
      )}
    </div>
  );
};

export default DrawingEngine;