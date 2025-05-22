// src/components/cad/technical-drawing/ui/IndustryLeaderCanvas.tsx

import React, { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { useTechnicalDrawingStore } from '../enhancedTechnicalDrawingStore';
import { useDrawingSnap } from '../useDrawingSnap';
import { Point, DrawingEntity, Dimension, Annotation } from '../TechnicalDrawingTypes';

interface IndustryLeaderCanvasProps {
  width: number;
  height: number;
  readOnly?: boolean;
}

const IndustryLeaderCanvas = forwardRef<HTMLCanvasElement, IndustryLeaderCanvasProps>(
  ({ width, height, readOnly = false }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number>();
    const isDrawingRef = useRef(false);
    const lastPointRef = useRef<Point | null>(null);

    // Expose canvas ref to parent
    useImperativeHandle(ref, () => canvasRef.current!);

    const {
      entities,
      dimensions,
      annotations,
      drawingLayers,
      activeTool,
      zoom,
      pan,
      selectedEntityIds,
      hoveredEntityId,
      gridEnabled,
      gridSize,
      snappingEnabled,
      addEntity,
      updateEntity,
      selectEntity,
      setHoveredEntity,
      setPan,
      setZoom
    } = useTechnicalDrawingStore();

    const { findBestSnapPoint } = useDrawingSnap();

    // Canvas drawing functions
    const clearCanvas = useCallback((ctx: CanvasRenderingContext2D) => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
    }, [width, height]);

    const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
      if (!gridEnabled) return;

      ctx.save();
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 1;
      ctx.setLineDash([]);

      const gridStep = gridSize * zoom;
      const offsetX = (pan.x * zoom) % gridStep;
      const offsetY = (pan.y * zoom) % gridStep;

      // Vertical lines
      for (let x = offsetX; x < width; x += gridStep) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Horizontal lines
      for (let y = offsetY; y < height; y += gridStep) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      ctx.restore();
    }, [gridEnabled, gridSize, zoom, pan, width, height]);

    const transformPoint = useCallback((point: Point): Point => {
      return {
        x: (point.x + pan.x) * zoom,
        y: (point.y + pan.y) * zoom
      };
    }, [zoom, pan]);

    const inverseTransformPoint = useCallback((screenPoint: Point): Point => {
      return {
        x: screenPoint.x / zoom - pan.x,
        y: screenPoint.y / zoom - pan.y
      };
    }, [zoom, pan]);

    const drawEntity = useCallback((ctx: CanvasRenderingContext2D, entity: DrawingEntity | Dimension | Annotation) => {
      if (!entity.visible) return;

      const layer = drawingLayers.find(l => l.name === entity.layer);
      if (layer && !layer.visible) return;

      ctx.save();

      // Apply entity style
      ctx.strokeStyle = entity.style.strokeColor || '#000000';
      ctx.lineWidth = (entity.style.strokeWidth || 1) * zoom;
      ctx.fillStyle = entity.style.fillColor || 'transparent';

      // Set line dash based on stroke style
      switch (entity.style.strokeStyle) {
        case 'dashed':
          ctx.setLineDash([10 * zoom, 5 * zoom]);
          break;
        case 'dotted':
          ctx.setLineDash([2 * zoom, 3 * zoom]);
          break;
        case 'dash-dot':
          ctx.setLineDash([10 * zoom, 5 * zoom, 2 * zoom, 5 * zoom]);
          break;
        default:
          ctx.setLineDash([]);
      }

      // Highlight if selected or hovered
      if (selectedEntityIds.includes(entity.id)) {
        ctx.strokeStyle = '#0080ff';
        ctx.lineWidth = Math.max(2, (entity.style.strokeWidth || 1) * zoom);
      } else if (hoveredEntityId === entity.id) {
        ctx.strokeStyle = '#ff8000';
        ctx.lineWidth = Math.max(1.5, (entity.style.strokeWidth || 1) * zoom);
      }

      // Draw based on entity type
      switch (entity.type) {
        case 'line': {
          const line = entity as any;
          const start = transformPoint(line.startPoint);
          const end = transformPoint(line.endPoint);
          
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          ctx.stroke();
          break;
        }

        case 'circle': {
          const circle = entity as any;
          const center = transformPoint(circle.center);
          const radius = circle.radius * zoom;
          
          ctx.beginPath();
          ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
          ctx.stroke();
          if (entity.style.fillColor && entity.style.fillColor !== 'transparent') {
            ctx.fill();
          }
          break;
        }

        case 'rectangle': {
          const rect = entity as any;
          const pos = transformPoint(rect.position);
          const w = rect.width * zoom;
          const h = rect.height * zoom;
          
          if (rect.rotation) {
            ctx.save();
            ctx.translate(pos.x + w/2, pos.y + h/2);
            ctx.rotate(rect.rotation * Math.PI / 180);
            ctx.strokeRect(-w/2, -h/2, w, h);
            if (entity.style.fillColor && entity.style.fillColor !== 'transparent') {
              ctx.fillRect(-w/2, -h/2, w, h);
            }
            ctx.restore();
          } else {
            ctx.strokeRect(pos.x, pos.y, w, h);
            if (entity.style.fillColor && entity.style.fillColor !== 'transparent') {
              ctx.fillRect(pos.x, pos.y, w, h);
            }
          }
          break;
        }

        case 'polyline': {
          const polyline = entity as any;
          if (polyline.points && polyline.points.length > 1) {
            ctx.beginPath();
            const firstPoint = transformPoint(polyline.points[0]);
            ctx.moveTo(firstPoint.x, firstPoint.y);
            
            for (let i = 1; i < polyline.points.length; i++) {
              const point = transformPoint(polyline.points[i]);
              ctx.lineTo(point.x, point.y);
            }
            
            if (polyline.closed) {
              ctx.closePath();
            }
            
            ctx.stroke();
            if (polyline.closed && entity.style.fillColor && entity.style.fillColor !== 'transparent') {
              ctx.fill();
            }
          }
          break;
        }

        case 'arc': {
          const arc = entity as any;
          const center = transformPoint(arc.center);
          const radius = arc.radius * zoom;
          
          ctx.beginPath();
          ctx.arc(
            center.x, 
            center.y, 
            radius, 
            arc.startAngle, 
            arc.endAngle, 
            arc.counterclockwise
          );
          ctx.stroke();
          break;
        }

        case 'text-annotation': {
          const text = entity as any;
          const pos = transformPoint(text.position);
          const fontSize = (text.style.fontSize || 12) * zoom;
          
          ctx.font = `${text.style.fontWeight || 'normal'} ${fontSize}px ${text.style.fontFamily || 'Arial'}`;
          ctx.fillStyle = text.style.strokeColor || '#000000';
          ctx.textAlign = text.style.textAlign || 'left';
          
          if (text.rotation) {
            ctx.save();
            ctx.translate(pos.x, pos.y);
            ctx.rotate(text.rotation * Math.PI / 180);
            ctx.fillText(text.text, 0, 0);
            ctx.restore();
          } else {
            ctx.fillText(text.text, pos.x, pos.y);
          }
          break;
        }

        // Add dimension rendering
        case 'linear-dimension': {
          const dim = entity as any;
          const start = transformPoint(dim.startPoint);
          const end = transformPoint(dim.endPoint);
          const offset = dim.offsetDistance * zoom;
          
          // Draw dimension line
          ctx.beginPath();
          ctx.moveTo(start.x, start.y - offset);
          ctx.lineTo(end.x, end.y - offset);
          ctx.stroke();
          
          // Draw extension lines
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(start.x, start.y - offset - 5);
          ctx.moveTo(end.x, end.y);
          ctx.lineTo(end.x, end.y - offset - 5);
          ctx.stroke();
          
          // Draw arrows
          const arrowSize = 5 * zoom;
          ctx.beginPath();
          ctx.moveTo(start.x, start.y - offset);
          ctx.lineTo(start.x + arrowSize, start.y - offset + arrowSize/2);
          ctx.lineTo(start.x + arrowSize, start.y - offset - arrowSize/2);
          ctx.closePath();
          ctx.fill();
          
          ctx.beginPath();
          ctx.moveTo(end.x, end.y - offset);
          ctx.lineTo(end.x - arrowSize, end.y - offset + arrowSize/2);
          ctx.lineTo(end.x - arrowSize, end.y - offset - arrowSize/2);
          ctx.closePath();
          ctx.fill();
          
          // Draw text
          if (dim.text) {
            const textX = (start.x + end.x) / 2;
            const textY = start.y - offset - 10;
            ctx.font = `${12 * zoom}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText(dim.text, textX, textY);
          }
          break;
        }
      }

      ctx.restore();
    }, [transformPoint, drawingLayers, selectedEntityIds, hoveredEntityId, zoom]);

    const drawAll = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear and draw background
      clearCanvas(ctx);

      // Draw grid
      drawGrid(ctx);

      // Draw all entities
      Object.values(entities).forEach(entity => drawEntity(ctx, entity));
      Object.values(dimensions).forEach(dimension => drawEntity(ctx, dimension));
      Object.values(annotations).forEach(annotation => drawEntity(ctx, annotation));

      // Draw crosshair for active tool
      if (activeTool !== 'select' && !readOnly) {
        // Draw crosshair at mouse position
      }
    }, [clearCanvas, drawGrid, drawEntity, entities, dimensions, annotations, activeTool, readOnly]);

    // Animation loop
    useEffect(() => {
      const animate = () => {
        drawAll();
        animationFrameRef.current = requestAnimationFrame(animate);
      };

      animationFrameRef.current = requestAnimationFrame(animate);

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }, [drawAll]);

    // Mouse event handlers
    const handleMouseDown = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
      if (readOnly) return;

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const screenPoint: Point = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };

      const worldPoint = inverseTransformPoint(screenPoint);

      // Handle snapping
      let finalPoint = worldPoint;
      if (snappingEnabled) {
        const snapPoint = findBestSnapPoint(worldPoint);
        if (snapPoint) {
          finalPoint = { x: snapPoint.x, y: snapPoint.y };
        }
      }

      isDrawingRef.current = true;
      lastPointRef.current = finalPoint;

      // Handle tool-specific logic
      switch (activeTool) {
        case 'line':
          // Start line drawing
          break;
        case 'circle':
          // Start circle drawing
          break;
        case 'rectangle':
          // Start rectangle drawing
          break;
        case 'select':
        default:
          // Handle selection
          break;
      }
    }, [readOnly, inverseTransformPoint, snappingEnabled, findBestSnapPoint, activeTool]);

    const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const screenPoint: Point = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };

      const worldPoint = inverseTransformPoint(screenPoint);

      // Handle tool preview
      if (isDrawingRef.current && !readOnly) {
        // Update preview for current tool
      }

      // Handle hover detection for selection
      if (activeTool === 'select') {
        // Find entity under cursor
        let hoveredId: string | null = null;
        
        // Simple hit testing - in production you'd use more sophisticated methods
        for (const [id, entity] of Object.entries(entities)) {
          if (entity.visible && isPointNearEntity(worldPoint, entity)) {
            hoveredId = id;
            break;
          }
        }

        setHoveredEntity(hoveredId);
      }
    }, [inverseTransformPoint, readOnly, activeTool, entities, setHoveredEntity]);

    const handleMouseUp = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
      if (readOnly || !isDrawingRef.current) return;

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const screenPoint: Point = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };

      const worldPoint = inverseTransformPoint(screenPoint);
      const startPoint = lastPointRef.current;

      if (!startPoint) return;

      // Handle snapping
      let finalPoint = worldPoint;
      if (snappingEnabled) {
        const snapPoint = findBestSnapPoint(worldPoint);
        if (snapPoint) {
          finalPoint = { x: snapPoint.x, y: snapPoint.y };
        }
      }

      // Create entity based on active tool
      switch (activeTool) {
        case 'line':
          if (Math.abs(finalPoint.x - startPoint.x) > 1 || Math.abs(finalPoint.y - startPoint.y) > 1) {
            addEntity({
              type: 'line',
              startPoint: startPoint,
              endPoint: finalPoint
            });
          }
          break;

        case 'circle': {
          const radius = Math.sqrt(
            Math.pow(finalPoint.x - startPoint.x, 2) + 
            Math.pow(finalPoint.y - startPoint.y, 2)
          );
          if (radius > 1) {
            addEntity({
              type: 'circle',
              center: startPoint,
              radius: radius
            });
          }
          break;
        }

        case 'rectangle': {
          const width = Math.abs(finalPoint.x - startPoint.x);
          const height = Math.abs(finalPoint.y - startPoint.y);
          if (width > 1 && height > 1) {
            addEntity({
              type: 'rectangle',
              position: {
                x: Math.min(startPoint.x, finalPoint.x),
                y: Math.min(startPoint.y, finalPoint.y)
              },
              width: width,
              height: height
            });
          }
          break;
        }

        case 'select':
        default:
          // Handle selection
          const clickedEntity = findEntityAtPoint(worldPoint);
          if (clickedEntity) {
            selectEntity(clickedEntity, event.ctrlKey || event.metaKey);
          }
          break;
      }

      isDrawingRef.current = false;
      lastPointRef.current = null;
    }, [readOnly, inverseTransformPoint, snappingEnabled, findBestSnapPoint, activeTool, addEntity, selectEntity]);

    // Wheel event for zooming
    const handleWheel = useCallback((event: React.WheelEvent<HTMLCanvasElement>) => {
      event.preventDefault();
      
      const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.1, Math.min(10, zoom * zoomFactor));
      
      setZoom(newZoom);
    }, [zoom, setZoom]);

    // Helper functions
    const isPointNearEntity = (point: Point, entity: DrawingEntity): boolean => {
      const tolerance = 5 / zoom; // 5 pixels tolerance
      
      switch (entity.type) {
        case 'line': {
          const line = entity as any;
          return isPointNearLine(point, line.startPoint, line.endPoint, tolerance);
        }
        case 'circle': {
          const circle = entity as any;
          const distance = Math.sqrt(
            Math.pow(point.x - circle.center.x, 2) + 
            Math.pow(point.y - circle.center.y, 2)
          );
          return Math.abs(distance - circle.radius) <= tolerance;
        }
        case 'rectangle': {
          const rect = entity as any;
          return point.x >= rect.position.x - tolerance &&
                 point.x <= rect.position.x + rect.width + tolerance &&
                 point.y >= rect.position.y - tolerance &&
                 point.y <= rect.position.y + rect.height + tolerance;
        }
        default:
          return false;
      }
    };

    const isPointNearLine = (point: Point, lineStart: Point, lineEnd: Point, tolerance: number): boolean => {
      const A = point.x - lineStart.x;
      const B = point.y - lineStart.y;
      const C = lineEnd.x - lineStart.x;
      const D = lineEnd.y - lineStart.y;

      const dot = A * C + B * D;
      const lenSq = C * C + D * D;
      
      if (lenSq === 0) return Math.sqrt(A * A + B * B) <= tolerance;

      const param = dot / lenSq;
      
      let xx, yy;
      if (param < 0) {
        xx = lineStart.x;
        yy = lineStart.y;
      } else if (param > 1) {
        xx = lineEnd.x;
        yy = lineEnd.y;
      } else {
        xx = lineStart.x + param * C;
        yy = lineStart.y + param * D;
      }

      const dx = point.x - xx;
      const dy = point.y - yy;
      return Math.sqrt(dx * dx + dy * dy) <= tolerance;
    };

    const findEntityAtPoint = (point: Point): string | null => {
      // Find the topmost entity at the given point
      const allEntities = [
        ...Object.entries(entities),
        ...Object.entries(dimensions),
        ...Object.entries(annotations)
      ];

      for (const [id, entity] of allEntities.reverse()) {
        if (entity.visible && isPointNearEntity(point, entity as DrawingEntity)) {
          return id;
        }
      }

      return null;
    };

    return (
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="cursor-crosshair bg-white border border-gray-200"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        style={{ 
          width: `${width}px`, 
          height: `${height}px`,
          imageRendering: 'pixelated'
        }}
      />
    );
  }
);

IndustryLeaderCanvas.displayName = 'IndustryLeaderCanvas';

export default IndustryLeaderCanvas;
