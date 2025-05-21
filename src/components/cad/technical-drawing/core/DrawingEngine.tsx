import React, { useRef, useEffect, useState } from 'react';
import { useTechnicalDrawingStore } from '../../../../store/technicalDrawingStore';
import { DrawingEntity, Point, DrawingStyle, ViewportDefinition } from '../../../../types/TechnicalDrawingTypes';
import { renderEntity } from '../rendering/entity-renderers';

interface DrawingEngineProps {
  width: number;
  height: number;
  onMouseDown?: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseMove?: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseUp?: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLCanvasElement>) => void;
  onKeyUp?: (e: React.KeyboardEvent<HTMLCanvasElement>) => void;
  onWheel?: (e: React.WheelEvent<HTMLCanvasElement>) => void;
}

export const DrawingEngine: React.FC<DrawingEngineProps> = ({
  width,
  height,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onKeyDown,
  onKeyUp,
  onWheel
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  
  // Get state from technical drawing store
  const {
    entities,
    dimensions,
    annotations,
    viewports,
    activeViewportId,
    sheet,
    gridEnabled,
    zoom,
    pan,
    selectedEntityIds,
    
    drawingLayers
  } = useTechnicalDrawingStore();

  // Initialize canvas context
  useEffect(() => {
    if (canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        // Set high DPI canvas if needed
        const dpr = window.devicePixelRatio || 1;
        const rect = canvasRef.current.getBoundingClientRect();
        
        canvasRef.current.width = rect.width * dpr;
        canvasRef.current.height = rect.height * dpr;
        
        context.scale(dpr, dpr);
        
        // Enable anti-aliasing
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        
        setCtx(context);
      }
    }
  }, [width, height]);

  // Main rendering function
  const renderCanvas = () => {
    if (!ctx || !canvasRef.current) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Apply transformations
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);
    
    // Draw grid if enabled
    if (gridEnabled) {
      drawGrid(ctx);
    }
    
    // Draw sheet border
    drawSheetBorder(ctx);

    // Draw entities based on current viewport and layers
    const visibleLayers = drawingLayers.filter(layer => layer.visible).map(layer => layer.id);
    
    // If there's an active viewport, only render entities in that viewport
    if (activeViewportId && viewports[activeViewportId]) {
      const viewport = viewports[activeViewportId];
      drawViewport(ctx, viewport);
      
      // Draw entities within this viewport
      viewport.entities.forEach(entityId => {
        if (entities[entityId] && visibleLayers.includes(entities[entityId].layer)) {
          renderEntity(ctx, entities[entityId], selectedEntityIds.includes(entityId));
        }
      });
    } else {
      // Draw all entities not in viewports
      Object.entries(entities).forEach(([id, entity]) => {
        // Check if entity is in any viewport
        const isInViewport = Object.values(viewports).some(vp => 
          vp.entities.includes(id)
        );
        
        // If not in viewport and visible, render it
        if (!isInViewport && visibleLayers.includes(entity.layer)) {
          renderEntity(ctx, entity, selectedEntityIds.includes(id));
        }
      });
    }
    
    // Draw dimensions
    Object.entries(dimensions).forEach(([id, dimension]) => {
      if (visibleLayers.includes(dimension.layer)) {
        renderEntity(ctx, dimension, selectedEntityIds.includes(id));
      }
    });
    
    // Draw annotations
    Object.entries(annotations).forEach(([id, annotation]) => {
      if (visibleLayers.includes(annotation.layer)) {
        renderEntity(ctx, annotation, selectedEntityIds.includes(id));
      }
    });
    
    // Draw snap points
    if (snapPoints.length > 0) {
      drawSnapPoints(ctx);
    }
    
    ctx.restore();
  };

  // Draw grid
  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    const gridSize = 10; // Base grid size in drawing units
    const scaledGridSize = gridSize;
    
    // Calculate grid boundaries based on view
    const minX = -pan.x / zoom;
    const minY = -pan.y / zoom;
    const maxX = (width - pan.x) / zoom;
    const maxY = (height - pan.y) / zoom;
    
    // Adjust starting points to gridSize intervals
    const startX = Math.floor(minX / scaledGridSize) * scaledGridSize;
    const startY = Math.floor(minY / scaledGridSize) * scaledGridSize;
    
    // Draw the grid
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(80, 80, 80, 0.3)';
    ctx.lineWidth = 0.5 / zoom;
    
    // Draw vertical lines
    for (let x = startX; x <= maxX; x += scaledGridSize) {
      ctx.moveTo(x, minY);
      ctx.lineTo(x, maxY);
    }
    
    // Draw horizontal lines
    for (let y = startY; y <= maxY; y += scaledGridSize) {
      ctx.moveTo(minX, y);
      ctx.lineTo(maxX, y);
    }
    
    ctx.stroke();
    
    // Draw major grid lines (every 10 units)
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(100, 100, 100, 0.5)';
    
    // Draw major vertical lines
    for (let x = startX; x <= maxX; x += scaledGridSize * 10) {
      ctx.moveTo(x, minY);
      ctx.lineTo(x, maxY);
    }
    
    // Draw major horizontal lines
    for (let y = startY; y <= maxY; y += scaledGridSize * 10) {
      ctx.moveTo(minX, y);
      ctx.lineTo(maxX, y);
    }
    
    ctx.stroke();
  };

  // Draw sheet border
  const drawSheetBorder = (ctx: CanvasRenderingContext2D) => {
    ctx.beginPath();
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 1 / zoom;
    ctx.rect(0, 0, sheet.width, sheet.height);
    ctx.stroke();
    
    // Draw sheet title block
    if (sheet.titleBlock) {
      drawTitleBlock(ctx);
    }
  };

  // Draw title block
  const drawTitleBlock = (ctx: CanvasRenderingContext2D) => {
    // Draw title block border
    const blockHeight = 50;
    const blockWidth = 180;
    
    ctx.beginPath();
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 1 / zoom;
    ctx.rect(
      sheet.width - blockWidth,
      sheet.height - blockHeight,
      blockWidth,
      blockHeight
    );
    ctx.stroke();
    
    // Draw title block content
    ctx.fillStyle = '#222222';
    ctx.font = `${12 / zoom}px Arial`;
    ctx.fillText(
      sheet.titleBlock?.fields?.title || 'Technical Drawing',
      sheet.width - blockWidth + 10,
      sheet.height - blockHeight + 20
    );
    
    ctx.font = `${8 / zoom}px Arial`;
    ctx.fillText(
      `Scale: ${sheet.scale || '1:1'}`,
      sheet.width - blockWidth + 10,
      sheet.height - blockHeight + 35
    );
    
    ctx.fillText(
      `Date: ${new Date().toLocaleDateString()}`,
      sheet.width - blockWidth + 100,
      sheet.height - blockHeight + 35
    );
  };

  // Draw a viewport
  const drawViewport = (ctx: CanvasRenderingContext2D, viewport: ViewportDefinition) => {
    // Draw viewport border
    ctx.beginPath();
    ctx.strokeStyle = '#777777';
    ctx.lineWidth = 1 / zoom;
    ctx.rect(
      viewport.position.x,
      viewport.position.y,
      viewport.width,
      viewport.height
    );
    ctx.stroke();
    
    // Draw viewport title
    ctx.fillStyle = '#777777';
    ctx.font = `${8 / zoom}px Arial`;
    ctx.fillText(
      viewport.name,
      viewport.position.x + 5,
      viewport.position.y - 5
    );
  };

  // Draw snap points
  const drawSnapPoints = (ctx: CanvasRenderingContext2D) => {
    snapPoints.forEach(point  => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 5 / zoom, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 150, 255, 0.5)';
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(point.x, point.y, 2 / zoom, 0, Math.PI * 2);
      ctx.fillStyle = '#00AAFF';
      ctx.fill();
    });
  };

  // Run the rendering on each frame
  useEffect(() => {
    let animationFrameId: number;
    
    const render = () => {
      renderCanvas();
      animationFrameId = window.requestAnimationFrame(render);
    };
    
    // Start the animation loop
    if (ctx) {
      animationFrameId = window.requestAnimationFrame(render);
    }
    
    // Clean up
    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [ctx, entities, dimensions, annotations, viewports, activeViewportId, zoom, pan, selectedEntityIds, snapPoints, gridEnabled, drawingLayers]);

  // Handle canvas tabindex and focus
  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.tabIndex = 1; // Make canvas focusable
    }
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ width: '100%', height: '100%' }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
      onWheel={onWheel}
    />
  );
}; 