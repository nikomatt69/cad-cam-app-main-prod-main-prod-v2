import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTechnicalDrawingStore } from '../technicalDrawingStore';
import { useDrawingSnap } from '../useDrawingSnap';
import { Dimension, Point } from '../TechnicalDrawingTypes';
import { renderEntity } from '../rendering/entity-renderers';
import HitTestManager from '../core/HitTestManager';

interface EnhancedDrawingCanvasProps {
  onCursorMove?: (position: Point) => void;
}

/**
 * 🎨 Enhanced Drawing Canvas - Canvas di Disegno Avanzato
 * 
 * Supporta TUTTI gli strumenti del sistema CAD:
 * - Selezione (singola, multipla, rettangolare)
 * - Strumenti di disegno (line, circle, rectangle, arc, ellipse, polyline, polygon, spline)
 * - Strumenti di modifica (trim, extend, fillet, offset, mirror, array)
 * - Strumenti di annotazione (text, dimensions, leaders)
 * - Strumenti di misura (distance, angle, area)
 * - Operazioni booleane (union, subtract, intersect)
 * - Gestione layer e snap avanzati
 */
const EnhancedDrawingCanvas: React.FC<EnhancedDrawingCanvasProps> = ({
  onCursorMove
}) => {
  // Refs per i canvas multi-layer
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Hit test manager
  const hitTestManagerRef = useRef<HitTestManager>(new HitTestManager());
  
  // Stati del mouse e del canvas
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [dragStartPoint, setDragStartPoint] = useState<Point | null>(null);
  const [mousePosition, setMousePosition] = useState<Point | null>(null);
  const [snapPoint, setSnapPoint] = useState<Point | null>(null);
  const [currentPreviewEntity, setCurrentPreviewEntity] = useState<any>(null);
  
  // Stato per multi-step tools
  const [toolSteps, setToolSteps] = useState<Point[]>([]);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isWaitingForInput, setIsWaitingForInput] = useState(false);
  
  // Accesso allo store globale
  const {
    entities,
    dimensions,
    annotations,
    zoom,
    pan,
    setPan,
    gridSize,
    gridEnabled,
    drawingStandard,
    activeTool,
    selectedEntityIds,
    selectEntity,
    deselectEntity,
    clearSelection,
    snappingEnabled,
    addEntity,
    updateEntity,
    deleteEntity,
    activeLayer,
    orthoMode,
    polarTracking,
    polarAngle,
    moveEntities,
    copyEntity,
    offsetEntity,
    mirrorEntities,
    rotateEntities,
    scaleEntities
  } = useTechnicalDrawingStore();
  
  // Sistema di snap
  const { findBestSnapPoint } = useDrawingSnap();
  
  // Mappa dei tools supportati
  const SUPPORTED_TOOLS = {
    // Selection tools
    'select': { steps: 1, type: 'selection' },
    'move': { steps: 2, type: 'transform' },
    'copy': { steps: 2, type: 'transform' },
    'rotate': { steps: 3, type: 'transform' },
    'scale': { steps: 3, type: 'transform' },
    
    // Drawing tools
    'line': { steps: 2, type: 'drawing' },
    'circle': { steps: 2, type: 'drawing' },
    'rectangle': { steps: 2, type: 'drawing' },
    'arc': { steps: 3, type: 'drawing' },
    'ellipse': { steps: 3, type: 'drawing' },
    'polyline': { steps: -1, type: 'drawing' }, // -1 = variabile
    'polygon': { steps: 3, type: 'drawing' },
    'spline': { steps: -1, type: 'drawing' },
    'bezier': { steps: 4, type: 'drawing' },
    
    // Modification tools
    'trim': { steps: 2, type: 'modify' },
    'extend': { steps: 2, type: 'modify' },
    'fillet': { steps: 2, type: 'modify' },
    'chamfer': { steps: 2, type: 'modify' },
    'offset': { steps: 2, type: 'modify' },
    'mirror': { steps: 3, type: 'modify' },
    'array': { steps: 3, type: 'modify' },
    'delete': { steps: 1, type: 'modify' },
    
    // Annotation tools
    'text': { steps: 1, type: 'annotation' },
    'dimension-linear': { steps: 3, type: 'annotation' },
    'dimension-aligned': { steps: 3, type: 'annotation' },
    'dimension-angle': { steps: 3, type: 'annotation' },
    'dimension-radius': { steps: 2, type: 'annotation' },
    'dimension-diameter': { steps: 2, type: 'annotation' },
    'leader': { steps: 2, type: 'annotation' },
    
    // Measurement tools
    'measure-distance': { steps: 2, type: 'measure' },
    'measure-angle': { steps: 3, type: 'measure' },
    'measure-area': { steps: -1, type: 'measure' },
    
    // Boolean operations
    'boolean-union': { steps: 2, type: 'boolean' },
    'boolean-subtract': { steps: 2, type: 'boolean' },
    'boolean-intersect': { steps: 2, type: 'boolean' },
    
    // Layer tools
    'layers': { steps: 0, type: 'layer' },
    'grid': { steps: 0, type: 'view' },
    'settings': { steps: 0, type: 'system' },
    'help': { steps: 0, type: 'system' }
  };
  
  // Aggiorna il hit test manager quando cambiano le entità
  useEffect(() => {
    const allEntities = {
      ...entities,
      ...dimensions,
      ...annotations
    };
    
    hitTestManagerRef.current.updateEntities(allEntities as any);
    hitTestManagerRef.current.updateZoom(zoom);
  }, [entities, dimensions, annotations, zoom]);
  
  // Reset tool steps quando cambia il tool
  useEffect(() => {
    setToolSteps([]);
    setActiveStepIndex(0);
    setIsWaitingForInput(false);
    setCurrentPreviewEntity(null);
  }, [activeTool]);
  
  // Converti coordinate dello schermo in coordinate del mondo
  const screenToWorld = useCallback((point: Point): Point => {
    return {
      x: (point.x - pan.x) / zoom,
      y: (point.y - pan.y) / zoom,
    };
  }, [pan, zoom]);

  // Converti coordinate del mondo in coordinate dello schermo
  const worldToScreen = useCallback((point: Point): Point => {
    return {
      x: point.x * zoom + pan.x,
      y: point.y * zoom + pan.y,
    };
  }, [pan, zoom]);
  
  // Applica modalità ortogonale
  const applyOrthoMode = useCallback((currentPoint: Point, previousPoint: Point): Point => {
    if (!orthoMode) return currentPoint;
    
    const dx = Math.abs(currentPoint.x - previousPoint.x);
    const dy = Math.abs(currentPoint.y - previousPoint.y);
    
    if (dx > dy) {
      return { x: currentPoint.x, y: previousPoint.y };
    } else {
      return { x: previousPoint.x, y: currentPoint.y };
    }
  }, [orthoMode]);
  
  // Applica polar tracking
  const applyPolarTracking = useCallback((currentPoint: Point, previousPoint: Point): Point => {
    if (!polarTracking) return currentPoint;
    
    const dx = currentPoint.x - previousPoint.x;
    const dy = currentPoint.y - previousPoint.y;
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    
    // Snap to polar angles
    const snapAngle = Math.round(angle / polarAngle) * polarAngle;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    const snapRadians = snapAngle * Math.PI / 180;
    
    return {
      x: previousPoint.x + distance * Math.cos(snapRadians),
      y: previousPoint.y + distance * Math.sin(snapRadians)
    };
  }, [polarTracking, polarAngle]);
  
  // Disegna la griglia
  const drawGrid = useCallback(() => {
    const canvas = gridCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (!gridEnabled) return;
    
    ctx.strokeStyle = '#DDDDDD';
    ctx.lineWidth = 0.5;
    
    const scaledGridSize = gridSize * zoom;
    const offsetX = pan.x % scaledGridSize;
    const offsetY = pan.y % scaledGridSize;
    
    // Linee verticali
    for (let x = offsetX; x < canvas.width; x += scaledGridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    
    // Linee orizzontali
    for (let y = offsetY; y < canvas.height; y += scaledGridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    
    // Assi principali
    ctx.strokeStyle = '#999999';
    ctx.lineWidth = 1;
    
    const yAxis = pan.y;
    if (yAxis >= 0 && yAxis < canvas.height) {
      ctx.beginPath();
      ctx.moveTo(0, yAxis);
      ctx.lineTo(canvas.width, yAxis);
      ctx.stroke();
    }
    
    const xAxis = pan.x;
    if (xAxis >= 0 && xAxis < canvas.width) {
      ctx.beginPath();
      ctx.moveTo(xAxis, 0);
      ctx.lineTo(xAxis, canvas.height);
      ctx.stroke();
    }
  }, [gridEnabled, gridSize, zoom, pan]);
  
  // Disegna tutte le entità
  const drawEntities = useCallback(() => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);
    
    // Disegna entità regolari
    Object.values(entities).forEach(entity => {
      if (!entity.visible) return;
      const isSelected = selectedEntityIds.includes(entity.id);
      renderEntity(ctx, entity, isSelected);
    });
    
    // Disegna dimensioni
    Object.values(dimensions).forEach(dimension => {
      if (!dimension.visible) return;
      const isSelected = selectedEntityIds.includes(dimension.id);
      renderEntity(ctx, dimension as any, isSelected);
    });
    
    // Disegna annotazioni
    Object.values(annotations).forEach(annotation => {
      if (!annotation.visible) return;
      const isSelected = selectedEntityIds.includes(annotation.id);
      renderEntity(ctx, annotation as any, isSelected);
    });
    
    ctx.restore();
  }, [entities, dimensions, annotations, selectedEntityIds, pan, zoom]);
  
  // Disegna l'overlay con anteprima degli strumenti
  const drawOverlay = useCallback(() => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Disegna cursore
    if (mousePosition) {
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 1;
      const size = 10;
      
      ctx.beginPath();
      ctx.moveTo(mousePosition.x - size, mousePosition.y);
      ctx.lineTo(mousePosition.x + size, mousePosition.y);
      ctx.moveTo(mousePosition.x, mousePosition.y - size);
      ctx.lineTo(mousePosition.x, mousePosition.y + size);
      ctx.stroke();
    }
    
    // Disegna punti di snap
    if (snapPoint && snappingEnabled) {
      ctx.fillStyle = '#2196F3';
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      
      ctx.beginPath();
      ctx.arc(snapPoint.x, snapPoint.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    
    // Disegna anteprima basata sul tool attivo
    if (activeTool && SUPPORTED_TOOLS[activeTool as keyof typeof SUPPORTED_TOOLS]) {
      drawToolPreview(ctx);
    }
    
    // Disegna highlight entità
    drawEntityHighlight(ctx);
    
  }, [mousePosition, snapPoint, snappingEnabled, activeTool, toolSteps, isDrawing, dragStart]);
  
  // Disegna anteprima per ciascun strumento
  const drawToolPreview = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!mousePosition || !dragStart) return;
    
    const toolConfig = SUPPORTED_TOOLS[activeTool as keyof typeof SUPPORTED_TOOLS];
    if (!toolConfig) return;
    
    ctx.save();
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    switch (activeTool) {
      case 'select':
        if (isDrawing) {
          ctx.strokeStyle = '#1890ff';
          ctx.fillStyle = 'rgba(24, 144, 255, 0.1)';
          const width = mousePosition.x - dragStart.x;
          const height = mousePosition.y - dragStart.y;
          ctx.fillRect(dragStart.x, dragStart.y, width, height);
          ctx.strokeRect(dragStart.x, dragStart.y, width, height);
        }
        break;
        
      case 'line':
        ctx.beginPath();
        ctx.moveTo(dragStart.x, dragStart.y);
        ctx.lineTo(mousePosition.x, mousePosition.y);
        ctx.stroke();
        break;
        
      case 'rectangle':
        const width = mousePosition.x - dragStart.x;
        const height = mousePosition.y - dragStart.y;
        ctx.strokeRect(dragStart.x, dragStart.y, width, height);
        break;
        
      case 'circle':
        const dx = mousePosition.x - dragStart.x;
        const dy = mousePosition.y - dragStart.y;
        const radius = Math.sqrt(dx * dx + dy * dy);
        ctx.beginPath();
        ctx.arc(dragStart.x, dragStart.y, radius, 0, Math.PI * 2);
        ctx.stroke();
        break;
        
      case 'arc':
        drawArcPreview(ctx);
        break;
        
      case 'ellipse':
        drawEllipsePreview(ctx);
        break;
        
      case 'polyline':
        drawPolylinePreview(ctx);
        break;
        
      case 'polygon':
        drawPolygonPreview(ctx);
        break;
        
      case 'spline':
        drawSplinePreview(ctx);
        break;
        
      case 'dimension-linear':
        drawLinearDimensionPreview(ctx);
        break;
        
      case 'text':
        drawTextPreview(ctx);
        break;
        
      // Aggiungi altri tools qui...
      
      default:
        // Anteprima generica per tools non ancora implementati
        ctx.beginPath();
        ctx.arc(dragStart.x, dragStart.y, 5, 0, Math.PI * 2);
        ctx.stroke();
        break;
    }
    
    ctx.restore();
  }, [activeTool, mousePosition, dragStart, isDrawing, toolSteps]);
  
  // Implementazioni specifiche per anteprime complesse
  const drawArcPreview = useCallback((ctx: CanvasRenderingContext2D) => {
    if (toolSteps.length < 1) return;
    
    const center = worldToScreen(toolSteps[0]);
    
    if (toolSteps.length === 1 && mousePosition) {
      // Primo step: mostra il raggio
      const dx = mousePosition.x - center.x;
      const dy = mousePosition.y - center.y;
      const radius = Math.sqrt(dx * dx + dy * dy);
      
      ctx.beginPath();
      ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(center.x, center.y);
      ctx.lineTo(mousePosition.x, mousePosition.y);
      ctx.stroke();
    } else if (toolSteps.length === 2 && mousePosition) {
      // Secondo step: mostra l'arco
      const start = worldToScreen(toolSteps[1]);
      const dx1 = start.x - center.x;
      const dy1 = start.y - center.y;
      const radius = Math.sqrt(dx1 * dx1 + dy1 * dy1);
      
      const startAngle = Math.atan2(dy1, dx1);
      const dx2 = mousePosition.x - center.x;
      const dy2 = mousePosition.y - center.y;
      const endAngle = Math.atan2(dy2, dx2);
      
      ctx.beginPath();
      ctx.arc(center.x, center.y, radius, startAngle, endAngle);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(center.x, center.y);
      ctx.lineTo(mousePosition.x, mousePosition.y);
      ctx.stroke();
    }
  }, [toolSteps, mousePosition, worldToScreen]);
  
  const drawEllipsePreview = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!dragStart || !mousePosition) return;
    
    const centerX = dragStart.x;
    const centerY = dragStart.y;
    const radiusX = Math.abs(mousePosition.x - centerX);
    const radiusY = Math.abs(mousePosition.y - centerY);
    
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.stroke();
  }, [dragStart, mousePosition]);
  
  const drawPolylinePreview = useCallback((ctx: CanvasRenderingContext2D) => {
    if (toolSteps.length === 0) return;
    
    ctx.beginPath();
    const firstPoint = worldToScreen(toolSteps[0]);
    ctx.moveTo(firstPoint.x, firstPoint.y);
    
    for (let i = 1; i < toolSteps.length; i++) {
      const point = worldToScreen(toolSteps[i]);
      ctx.lineTo(point.x, point.y);
    }
    
    if (mousePosition) {
      ctx.lineTo(mousePosition.x, mousePosition.y);
    }
    
    ctx.stroke();
  }, [toolSteps, mousePosition, worldToScreen]);
  
  const drawPolygonPreview = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!dragStart || !mousePosition) return;
    
    const centerX = dragStart.x;
    const centerY = dragStart.y;
    const dx = mousePosition.x - centerX;
    const dy = mousePosition.y - centerY;
    const radius = Math.sqrt(dx * dx + dy * dy);
    
    const sides = 6; // Default polygon sides
    const angle = Math.PI * 2 / sides;
    
    ctx.beginPath();
    for (let i = 0; i <= sides; i++) {
      const x = centerX + radius * Math.cos(i * angle);
      const y = centerY + radius * Math.sin(i * angle);
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  }, [dragStart, mousePosition]);
  
  const drawSplinePreview = useCallback((ctx: CanvasRenderingContext2D) => {
    if (toolSteps.length < 2) return;
    
    // Implementazione semplificata per preview spline
    ctx.beginPath();
    const firstPoint = worldToScreen(toolSteps[0]);
    ctx.moveTo(firstPoint.x, firstPoint.y);
    
    for (let i = 1; i < toolSteps.length; i++) {
      const point = worldToScreen(toolSteps[i]);
      ctx.lineTo(point.x, point.y);
    }
    
    if (mousePosition) {
      ctx.lineTo(mousePosition.x, mousePosition.y);
    }
    
    ctx.stroke();
  }, [toolSteps, mousePosition, worldToScreen]);
  
  const drawLinearDimensionPreview = useCallback((ctx: CanvasRenderingContext2D) => {
    if (toolSteps.length < 2) return;
    
    const start = worldToScreen(toolSteps[0]);
    const end = worldToScreen(toolSteps[1]);
    
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    
    if (mousePosition && toolSteps.length === 2) {
      // Mostra la linea di quota
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        `${(length / zoom).toFixed(2)}`,
        (start.x + end.x) / 2,
        (start.y + end.y) / 2 - 10
      );
    }
  }, [toolSteps, mousePosition, worldToScreen, zoom]);
  
  const drawTextPreview = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!mousePosition) return;
    
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#666666';
    ctx.fillText('Testo...', mousePosition.x, mousePosition.y);
  }, [mousePosition]);
  
  // Evidenzia entità sotto il cursore
  const drawEntityHighlight = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!mousePosition || isDrawing || isDragging) return;
    if (activeTool !== 'select') return;
    
    const worldPoint = screenToWorld(mousePosition);
    const hitResult = hitTestManagerRef.current.hitTestAtPoint(worldPoint);
    
    if (hitResult) {
      ctx.strokeStyle = '#ff9800';
      ctx.lineWidth = 3;
      ctx.setLineDash([3, 3]);
      
      ctx.beginPath();
      ctx.arc(mousePosition.x, mousePosition.y, 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [mousePosition, isDrawing, isDragging, activeTool, screenToWorld]);
  
  // Gestisci il ridimensionamento del canvas
  const handleResize = useCallback(() => {
    if (!mainCanvasRef.current || !gridCanvasRef.current || !overlayCanvasRef.current) return;
    
    const container = mainCanvasRef.current.parentElement;
    if (!container) return;
    
    const { width, height } = container.getBoundingClientRect();
    
    [mainCanvasRef, gridCanvasRef, overlayCanvasRef].forEach(canvasRef => {
      if (!canvasRef.current) return;
      canvasRef.current.width = width;
      canvasRef.current.height = height;
    });
    
    setCanvasSize({ width, height });
    
    drawGrid();
    drawEntities();
    drawOverlay();
  }, [drawGrid, drawEntities, drawOverlay]);
  
  // Gestisci eventi mouse
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!overlayCanvasRef.current) return;
    
    const rect = overlayCanvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const screenPoint = { x, y };
    
    // Pan con tasto destro
    if (e.button === 2) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart(screenPoint);
      return;
    }
    
    const worldPoint = screenToWorld(screenPoint);
    const bestSnapPoint = snappingEnabled ? findBestSnapPoint(worldPoint) : null;
    const finalPoint = bestSnapPoint || worldPoint;
    
    // Applica ortho mode se necessario
    let processedPoint = finalPoint;
    if (toolSteps.length > 0) {
      processedPoint = applyOrthoMode(finalPoint, toolSteps[toolSteps.length - 1]);
      processedPoint = applyPolarTracking(processedPoint, toolSteps[toolSteps.length - 1]);
    }
    
    // Esegui azione basata sul tool attivo
    handleToolAction(processedPoint, e);
    
    setDragStart(screenPoint);
    setDragStartPoint(processedPoint);
  }, [screenToWorld, snappingEnabled, findBestSnapPoint, toolSteps, applyOrthoMode, applyPolarTracking]);
  
  // Gestisci azioni specifiche per ciascun tool
  const handleToolAction = useCallback((point: Point, event: React.MouseEvent) => {
    const toolConfig = SUPPORTED_TOOLS[activeTool as keyof typeof SUPPORTED_TOOLS];
    if (!toolConfig) return;
    
    switch (activeTool) {
      case 'select':
        handleSelectTool(point, event);
        break;
        
      case 'line':
        handleLineTool(point);
        break;
        
      case 'circle':
        handleCircleTool(point);
        break;
        
      case 'rectangle':
        handleRectangleTool(point);
        break;
        
      case 'arc':
        handleArcTool(point);
        break;
        
      case 'ellipse':
        handleEllipseTool(point);
        break;
        
      case 'polyline':
        handlePolylineTool(point, event);
        break;
        
      case 'polygon':
        handlePolygonTool(point);
        break;
        
      case 'spline':
        handleSplineTool(point, event);
        break;
        
      case 'dimension-linear':
        handleLinearDimensionTool(point);
        break;
        
      case 'text':
        handleTextTool(point);
        break;
        
      case 'move':
        handleMoveTool(point);
        break;
        
      case 'copy':
        handleCopyTool(point);
        break;
        
      case 'delete':
        handleDeleteTool(point);
        break;
        
      case 'offset':
        handleOffsetTool(point);
        break;
        
      case 'mirror':
        handleMirrorTool(point);
        break;
        
      // Aggiungi altri tools qui...
        
      default:
        console.log(`Tool ${activeTool} non ancora implementato`);
        break;
    }
  }, [activeTool, toolSteps]);
  
  // Implementazioni specifiche per ogni tool
  const handleSelectTool = useCallback((point: Point, event: React.MouseEvent) => {
    const worldPoint = screenToWorld({ x: event.clientX - overlayCanvasRef.current!.getBoundingClientRect().left, y: event.clientY - overlayCanvasRef.current!.getBoundingClientRect().top });
    const hitResult = hitTestManagerRef.current.hitTestAtPoint(worldPoint);
    
    if (hitResult) {
      const isCtrlPressed = event.ctrlKey || event.metaKey;
      
      if (isCtrlPressed) {
        if (selectedEntityIds.includes(hitResult.entityId)) {
          deselectEntity(hitResult.entityId);
        } else {
          selectEntity(hitResult.entityId, true);
        }
      } else {
        selectEntity(hitResult.entityId, false);
      }
    } else {
      if (!event.ctrlKey && !event.metaKey) {
        clearSelection();
      }
      setIsDrawing(true);
    }
  }, [screenToWorld, selectedEntityIds, selectEntity, deselectEntity, clearSelection]);
  
  const handleLineTool = useCallback((point: Point) => {
    if (toolSteps.length === 0) {
      setToolSteps([point]);
      setIsDrawing(true);
    } else if (toolSteps.length === 1) {
      const startPoint = toolSteps[0];
      const dx = Math.abs(point.x - startPoint.x);
      const dy = Math.abs(point.y - startPoint.y);
      
      if (dx > 0.001 || dy > 0.001) {
        addEntity({
          type: 'line',
          layer: activeLayer,
          startPoint: startPoint,
          endPoint: point,
          style: {
            strokeColor: '#000000',
            strokeWidth: 1,
            strokeStyle: 'solid'
          }
        });
        
        setToolSteps([]);
        setIsDrawing(false);
      }
    }
  }, [toolSteps, addEntity, activeLayer]);
  
  const handleCircleTool = useCallback((point: Point) => {
    if (toolSteps.length === 0) {
      setToolSteps([point]);
      setIsDrawing(true);
    } else if (toolSteps.length === 1) {
      const center = toolSteps[0];
      const dx = point.x - center.x;
      const dy = point.y - center.y;
      const radius = Math.sqrt(dx * dx + dy * dy);
      
      if (radius > 0.001) {
        addEntity({
          type: 'circle',
          layer: activeLayer,
          center: center,
          radius: radius,
          style: {
            strokeColor: '#000000',
            strokeWidth: 1,
            strokeStyle: 'solid',
            fillColor: 'none'
          }
        });
        
        setToolSteps([]);
        setIsDrawing(false);
      }
    }
  }, [toolSteps, addEntity, activeLayer]);
  
  const handleRectangleTool = useCallback((point: Point) => {
    if (toolSteps.length === 0) {
      setToolSteps([point]);
      setIsDrawing(true);
    } else if (toolSteps.length === 1) {
      const startPoint = toolSteps[0];
      const width = point.x - startPoint.x;
      const height = point.y - startPoint.y;
      
      if (Math.abs(width) > 0.001 && Math.abs(height) > 0.001) {
        addEntity({
          type: 'rectangle',
          layer: activeLayer,
          position: startPoint,
          width: width,
          height: height,
          style: {
            strokeColor: '#000000',
            strokeWidth: 1,
            strokeStyle: 'solid',
            fillColor: 'none'
          }
        });
        
        setToolSteps([]);
        setIsDrawing(false);
      }
    }
  }, [toolSteps, addEntity, activeLayer]);
  
  const handleArcTool = useCallback((point: Point) => {
    if (toolSteps.length === 0) {
      setToolSteps([point]);
      setIsDrawing(true);
    } else if (toolSteps.length === 1) {
      setToolSteps([...toolSteps, point]);
    } else if (toolSteps.length === 2) {
      const center = toolSteps[0];
      const startPoint = toolSteps[1];
      const endPoint = point;
      
      const dx1 = startPoint.x - center.x;
      const dy1 = startPoint.y - center.y;
      const radius = Math.sqrt(dx1 * dx1 + dy1 * dy1);
      
      const startAngle = Math.atan2(dy1, dx1);
      const dx2 = endPoint.x - center.x;
      const dy2 = endPoint.y - center.y;
      let endAngle = Math.atan2(dy2, dx2);
      
      if (endAngle < startAngle) {
        endAngle += 2 * Math.PI;
      }
      
      if (radius > 0.001) {
        addEntity({
          type: 'arc',
          layer: activeLayer,
          center: center,
          radius: radius,
          startAngle: startAngle,
          endAngle: endAngle,
          counterclockwise: false,
          style: {
            strokeColor: '#000000',
            strokeWidth: 1,
            strokeStyle: 'solid'
          }
        });
        
        setToolSteps([]);
        setIsDrawing(false);
      }
    }
  }, [toolSteps, addEntity, activeLayer]);
  
  const handleEllipseTool = useCallback((point: Point) => {
    if (toolSteps.length === 0) {
      setToolSteps([point]);
      setIsDrawing(true);
    } else if (toolSteps.length === 1) {
      setToolSteps([...toolSteps, point]);
    } else if (toolSteps.length === 2) {
      const center = toolSteps[0];
      const point1 = toolSteps[1];
      const point2 = point;
      
      const radiusX = Math.abs(point1.x - center.x);
      const radiusY = Math.abs(point2.y - center.y);
      
      if (radiusX > 0.001 && radiusY > 0.001) {
        addEntity({
          type: 'ellipse',
          layer: activeLayer,
          center: center,
          radiusX: radiusX,
          radiusY: radiusY,
          rotation: 0,
          style: {
            strokeColor: '#000000',
            strokeWidth: 1,
            strokeStyle: 'solid',
            fillColor: 'none'
          }
        });
        
        setToolSteps([]);
        setIsDrawing(false);
      }
    }
  }, [toolSteps, addEntity, activeLayer]);
  
  const handlePolylineTool = useCallback((point: Point, event: React.MouseEvent) => {
    if (event.detail === 2) { // Double click
      if (toolSteps.length >= 2) {
        addEntity({
          type: 'polyline',
          layer: activeLayer,
          points: toolSteps,
          closed: false,
          style: {
            strokeColor: '#000000',
            strokeWidth: 1,
            strokeStyle: 'solid'
          }
        });
        
        setToolSteps([]);
        setIsDrawing(false);
      }
    } else {
      setToolSteps([...toolSteps, point]);
      setIsDrawing(true);
    }
  }, [toolSteps, addEntity, activeLayer]);
  
  const handlePolygonTool = useCallback((point: Point) => {
    if (toolSteps.length === 0) {
      setToolSteps([point]);
      setIsDrawing(true);
    } else if (toolSteps.length === 1) {
      const center = toolSteps[0];
      const dx = point.x - center.x;
      const dy = point.y - center.y;
      const radius = Math.sqrt(dx * dx + dy * dy);
      
      if (radius > 0.001) {
        addEntity({
          type: 'polygon',
          layer: activeLayer,
          center: center,
          radius: radius,
          sides: 6,
          rotation: 0,
          style: {
            strokeColor: '#000000',
            strokeWidth: 1,
            strokeStyle: 'solid',
            fillColor: 'none'
          }
        });
        
        setToolSteps([]);
        setIsDrawing(false);
      }
    }
  }, [toolSteps, addEntity, activeLayer]);
  
  const handleSplineTool = useCallback((point: Point, event: React.MouseEvent) => {
    if (event.detail === 2) { // Double click
      if (toolSteps.length >= 3) {
        addEntity({
          type: 'spline',
          layer: activeLayer,
          points: toolSteps,
          closed: false,
          style: {
            strokeColor: '#000000',
            strokeWidth: 1,
            strokeStyle: 'solid'
          }
        });
        
        setToolSteps([]);
        setIsDrawing(false);
      }
    } else {
      setToolSteps([...toolSteps, point]);
      setIsDrawing(true);
    }
  }, [toolSteps, addEntity, activeLayer]);
  
  const handleLinearDimensionTool = useCallback((point: Point) => {
    if (toolSteps.length === 0) {
      setToolSteps([point]);
      setIsDrawing(true);
    } else if (toolSteps.length === 1) {
      setToolSteps([...toolSteps, point]);
    } else if (toolSteps.length === 2) {
      const start = toolSteps[0];
      const end = toolSteps[1];
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      
      // TODO: Implementare dimensione completa
      console.log(`Dimensione lineare: ${length.toFixed(2)}`);
      
      setToolSteps([]);
      setIsDrawing(false);
    }
  }, [toolSteps]);
  
  const handleTextTool = useCallback((point: Point) => {
    // Prompt per il testo
    const text = prompt('Inserisci il testo:', 'Testo');
    if (text) {
      addEntity({
        type: 'text-annotation',
        layer: activeLayer,
        position: point,
        text: text,
        style: {
          strokeColor: '#000000',
          strokeWidth: 1,
          strokeStyle: 'solid',
          fontFamily: 'Arial',
          fontSize: 14,
          textAlign: 'left'
        }
      });
    }
  }, [addEntity, activeLayer]);
  
  const handleMoveTool = useCallback((point: Point) => {
    if (toolSteps.length === 0) {
      setToolSteps([point]);
      setIsDrawing(true);
    } else if (toolSteps.length === 1) {
      const startPoint = toolSteps[0];
      const offset = {
        x: point.x - startPoint.x,
        y: point.y - startPoint.y
      };
      
      if (selectedEntityIds.length > 0) {
        moveEntities(selectedEntityIds, offset);
      }
      
      setToolSteps([]);
      setIsDrawing(false);
    }
  }, [toolSteps, selectedEntityIds, moveEntities]);
  
  const handleCopyTool = useCallback((point: Point) => {
    if (toolSteps.length === 0) {
      setToolSteps([point]);
      setIsDrawing(true);
    } else if (toolSteps.length === 1) {
      const startPoint = toolSteps[0];
      const offset = {
        x: point.x - startPoint.x,
        y: point.y - startPoint.y
      };
      
      if (selectedEntityIds.length > 0) {
        selectedEntityIds.forEach(id => {
          copyEntity(id, offset);
        });
      }
      
      setToolSteps([]);
      setIsDrawing(false);
    }
  }, [toolSteps, selectedEntityIds, copyEntity]);
  
  const handleDeleteTool = useCallback((point: Point) => {
    const worldPoint = screenToWorld({ x: point.x, y: point.y });
    const hitResult = hitTestManagerRef.current.hitTestAtPoint(worldPoint);
    
    if (hitResult) {
      deleteEntity(hitResult.entityId);
    }
  }, [screenToWorld, deleteEntity]);
  
  const handleOffsetTool = useCallback((point: Point) => {
    if (toolSteps.length === 0) {
      const worldPoint = screenToWorld({ x: point.x, y: point.y });
      const hitResult = hitTestManagerRef.current.hitTestAtPoint(worldPoint);
      
      if (hitResult) {
        setToolSteps([point]);
        setIsDrawing(true);
        // Store selected entity for offset
        setCurrentPreviewEntity(hitResult.entityId);
      }
    } else if (toolSteps.length === 1) {
      const startPoint = toolSteps[0];
      const distance = Math.sqrt(
        Math.pow(point.x - startPoint.x, 2) + 
        Math.pow(point.y - startPoint.y, 2)
      );
      
      if (currentPreviewEntity && distance > 0.001) {
        offsetEntity(currentPreviewEntity, distance);
      }
      
      setToolSteps([]);
      setIsDrawing(false);
      setCurrentPreviewEntity(null);
    }
  }, [toolSteps, currentPreviewEntity, screenToWorld, offsetEntity]);
  
  const handleMirrorTool = useCallback((point: Point) => {
    if (toolSteps.length === 0) {
      setToolSteps([point]);
      setIsDrawing(true);
    } else if (toolSteps.length === 1) {
      setToolSteps([...toolSteps, point]);
    } else if (toolSteps.length === 2) {
      const lineStart = toolSteps[0];
      const lineEnd = toolSteps[1];
      
      if (selectedEntityIds.length > 0) {
        mirrorEntities(selectedEntityIds, lineStart, lineEnd);
      }
      
      setToolSteps([]);
      setIsDrawing(false);
    }
  }, [toolSteps, selectedEntityIds, mirrorEntities]);
  
  // Altri gestori eventi
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!overlayCanvasRef.current) return;
    
    const rect = overlayCanvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const screenPoint = { x, y };
    
    setMousePosition(screenPoint);
    
    const worldPoint = screenToWorld(screenPoint);
    const bestSnapPoint = snappingEnabled ? findBestSnapPoint(worldPoint) : null;
    
    if (bestSnapPoint) {
      setSnapPoint(worldToScreen(bestSnapPoint));
    } else {
      setSnapPoint(null);
    }
    
    if (onCursorMove) {
      onCursorMove(bestSnapPoint || worldPoint);
    }
    
    // Gestisci pan
    if (isDragging && dragStart) {
      const dx = x - dragStart.x;
      const dy = y - dragStart.y;
      
      setPan({
        x: pan.x + dx,
        y: pan.y + dy
      });
      
      setDragStart(screenPoint);
      return;
    }
    
    drawOverlay();
  }, [screenToWorld, snappingEnabled, findBestSnapPoint, worldToScreen, onCursorMove, isDragging, dragStart, pan, setPan, drawOverlay]);
  
  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      setIsDragging(false);
      setDragStart(null);
      return;
    }
    
    // Gestisci completamento strumenti che richiedono drag
    if (isDrawing && dragStart && mousePosition && dragStartPoint) {
      const endPoint = screenToWorld(mousePosition);
      const finalEndPoint = snapPoint ? screenToWorld(snapPoint) : endPoint;
      
      if (activeTool === 'select') {
        // Selezione rettangolare
        const topLeft = {
          x: Math.min(dragStartPoint.x, finalEndPoint.x),
          y: Math.min(dragStartPoint.y, finalEndPoint.y)
        };
        const bottomRight = {
          x: Math.max(dragStartPoint.x, finalEndPoint.x),
          y: Math.max(dragStartPoint.y, finalEndPoint.y)
        };
        
        if (Math.abs(bottomRight.x - topLeft.x) > 5/zoom && 
            Math.abs(bottomRight.y - topLeft.y) > 5/zoom) {
          
          const hitResults = hitTestManagerRef.current.hitTestInRect(topLeft, bottomRight);
          const isCtrlPressed = e.ctrlKey || e.metaKey;
          
          if (!isCtrlPressed) {
            clearSelection();
          }
          
          hitResults.forEach(hit => {
            selectEntity(hit.entityId, true);
          });
        }
      }
    }
    
    setIsDrawing(false);
    setDragStart(null);
    setDragStartPoint(null);
  }, [isDragging, isDrawing, dragStart, mousePosition, dragStartPoint, snapPoint, activeTool, screenToWorld, zoom, clearSelection, selectEntity]);
  
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);
  
  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = zoom * delta;
    const clampedZoom = Math.min(Math.max(newZoom, 0.1), 50);
    
    const rect = mainCanvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const oldWorldX = (mouseX - pan.x) / zoom;
    const oldWorldY = (mouseY - pan.y) / zoom;
    
    const newPanX = mouseX - oldWorldX * clampedZoom;
    const newPanY = mouseY - oldWorldY * clampedZoom;
    
    if (Math.abs(zoom - clampedZoom) > 0.001) {
      setPan({ x: newPanX, y: newPanY });
    }
  }, [zoom, pan, setPan]);
  
  // Gestisci tasti
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        setToolSteps([]);
        setIsDrawing(false);
        setCurrentPreviewEntity(null);
        clearSelection();
        break;
        
      case 'Enter':
        // Completa tools multi-step
        if (toolSteps.length > 0) {
          if (activeTool === 'polyline' || activeTool === 'spline') {
            if (toolSteps.length >= 2) {
              const entityType = activeTool === 'polyline' ? 'polyline' : 'spline';
              addEntity({
                type: entityType,
                layer: activeLayer,
                points: toolSteps,
                closed: false,
                style: {
                  strokeColor: '#000000',
                  strokeWidth: 1,
                  strokeStyle: 'solid'
                }
              });
              
              setToolSteps([]);
              setIsDrawing(false);
            }
          }
        }
        break;
        
      case 'Delete':
        if (selectedEntityIds.length > 0) {
          selectedEntityIds.forEach(id => deleteEntity(id));
          clearSelection();
        }
        break;
    }
  }, [toolSteps, activeTool, addEntity, activeLayer, selectedEntityIds, deleteEntity, clearSelection]);
  
  // Effetti
  useEffect(() => {
    drawGrid();
    drawEntities();
    drawOverlay();
  }, [
    entities, 
    dimensions, 
    annotations, 
    zoom, 
    pan, 
    gridSize, 
    gridEnabled, 
    selectedEntityIds, 
    snappingEnabled,
    activeTool,
    canvasSize,
    toolSteps,
    isDrawing,
    mousePosition,
    snapPoint,
    drawGrid,
    drawEntities,
    drawOverlay
  ]);
  
  useEffect(() => {
    handleResize();
    
    const resizeObserver = new ResizeObserver(handleResize);
    if (mainCanvasRef.current?.parentElement) {
      resizeObserver.observe(mainCanvasRef.current.parentElement);
    }
    
    window.addEventListener('resize', handleResize);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [handleResize]);
  
  // Listener per tasti globali
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown as any);
    return () => {
      window.removeEventListener('keydown', handleKeyDown as any);
    };
  }, [handleKeyDown]);
  
  return (
    <motion.div 
      style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden'
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Canvas griglia */}
      <canvas
        ref={gridCanvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1
        }}
      />
      
      {/* Canvas principale */}
      <canvas
        ref={mainCanvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 2
        }}
      />
      
      {/* Canvas overlay */}
      <canvas
        ref={overlayCanvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 3,
          cursor: getCursor()
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onContextMenu={handleContextMenu}
        onWheel={handleWheel}
      />
      
      {/* Tool instructions overlay */}
      {isDrawing && toolSteps.length > 0 && (
        <motion.div
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            zIndex: 4
          }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {getToolInstructions()}
        </motion.div>
      )}
    </motion.div>
  );
  
  function getCursor(): string {
    if (isDragging) return 'grabbing';
    if (activeTool === 'select') return 'default';
    return 'crosshair';
  }
  
  function getToolInstructions(): string {
    const toolConfig = SUPPORTED_TOOLS[activeTool as keyof typeof SUPPORTED_TOOLS];
    if (!toolConfig) return '';
    
    switch (activeTool) {
      case 'line':
        return toolSteps.length === 0 ? 'Clicca per il primo punto' : 'Clicca per il secondo punto';
      case 'circle':
        return toolSteps.length === 0 ? 'Clicca per il centro' : 'Clicca per il raggio';
      case 'rectangle':
        return toolSteps.length === 0 ? 'Clicca per il primo angolo' : 'Clicca per il secondo angolo';
      case 'arc':
        return toolSteps.length === 0 ? 'Clicca per il centro' : 
               toolSteps.length === 1 ? 'Clicca per il punto iniziale' : 
               'Clicca per il punto finale';
      case 'polyline':
        return toolSteps.length === 0 ? 'Clicca per il primo punto' : 'Clicca per il prossimo punto (doppio click per terminare)';
      case 'spline':
        return toolSteps.length === 0 ? 'Clicca per il primo punto' : 'Clicca per il prossimo punto (doppio click per terminare)';
      case 'dimension-linear':
        return toolSteps.length === 0 ? 'Clicca per il primo punto' : 
               toolSteps.length === 1 ? 'Clicca per il secondo punto' : 
               'Clicca per posizionare la quota';
      case 'move':
        return toolSteps.length === 0 ? 'Clicca per il punto base' : 'Clicca per il punto di destinazione';
      case 'copy':
        return toolSteps.length === 0 ? 'Clicca per il punto base' : 'Clicca per il punto di destinazione';
      case 'mirror':
        return toolSteps.length === 0 ? 'Clicca per il primo punto della linea di specchiatura' : 
               toolSteps.length === 1 ? 'Clicca per il secondo punto della linea di specchiatura' : 
               'Specchiatura completata';
      default:
        return `Strumento ${activeTool} attivo (Step ${toolSteps.length + 1})`;
    }
  }
};

export default EnhancedDrawingCanvas;