import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTechnicalDrawingStore } from '../technicalDrawingStore';
import { useDrawingSnap } from '../useDrawingSnap';
import { Dimension, Point } from '../TechnicalDrawingTypes';
import { renderEntity } from '../rendering/entity-renderers';
import HitTestManager from '../core/HitTestManager';

interface DrawingCanvasProps {
  onCursorMove?: (position: Point) => void;
}

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  onCursorMove
}) => {
  // Refs per i canvas
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Hit test manager
  const hitTestManagerRef = useRef<HitTestManager>(new HitTestManager());
  
  // Stato del mouse e del canvas
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [dragStartPoint, setDragStartPoint] = useState<Point | null>(null);
  const [mousePosition, setMousePosition] = useState<Point | null>(null);
  const [snapPoint, setSnapPoint] = useState<Point | null>(null);
  
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
    activeLayer
  } = useTechnicalDrawingStore();
  
  // Sistema di snap
  const { findBestSnapPoint } = useDrawingSnap();
  
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
  
  // Converti coordinate dello schermo in coordinate del mondo
  const screenToWorld = (point: Point): Point => {
    return {
      x: (point.x - pan.x) / zoom,
      y: (point.y - pan.y) / zoom,
    };
  };

  // Converti coordinate del mondo in coordinate dello schermo
  const worldToScreen = (point: Point): Point => {
    return {
      x: point.x * zoom + pan.x,
      y: point.y * zoom + pan.y,
    };
  };
  
  // Disegna la griglia
  const drawGrid = () => {
    const canvas = gridCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Pulisci il canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (!gridEnabled) return;
    
    // Imposta lo stile della griglia
    ctx.strokeStyle = '#DDDDDD';
    ctx.lineWidth = 0.5;
    
    // Calcola spaziatura della griglia in base allo zoom
    const scaledGridSize = gridSize * zoom;
    
    // Offset basato sul pan
    const offsetX = pan.x % scaledGridSize;
    const offsetY = pan.y % scaledGridSize;
    
    // Disegna linee verticali
    for (let x = offsetX; x < canvas.width; x += scaledGridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    
    // Disegna linee orizzontali
    for (let y = offsetY; y < canvas.height; y += scaledGridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    
    // Disegna assi principali con colore più scuro
    ctx.strokeStyle = '#999999';
    ctx.lineWidth = 1;
    
    // Asse X
    const yAxis = pan.y;
    if (yAxis >= 0 && yAxis < canvas.height) {
      ctx.beginPath();
      ctx.moveTo(0, yAxis);
      ctx.lineTo(canvas.width, yAxis);
      ctx.stroke();
    }
    
    // Asse Y
    const xAxis = pan.x;
    if (xAxis >= 0 && xAxis < canvas.width) {
      ctx.beginPath();
      ctx.moveTo(xAxis, 0);
      ctx.lineTo(xAxis, canvas.height);
      ctx.stroke();
    }
  };
  
  // Disegna tutte le entità
  const drawEntities = () => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Pulisci il canvas con sfondo bianco
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Applica trasformazione globale basata su zoom e pan
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);
    
    // Disegna prima le entità regolari
    Object.values(entities).forEach(entity => {
      if (!entity.visible) return;
      
      const isSelected = selectedEntityIds.includes(entity.id);
      renderEntity(ctx, entity, isSelected);
    });
    
    // Poi disegna le dimensioni
    Object.values(dimensions).forEach(dimension => {
      if (!dimension.visible) return;
      
      const isSelected = selectedEntityIds.includes(dimension.id);
      renderEntity(ctx, dimension as any, isSelected);
    });
    
    // Infine disegna le annotazioni
    Object.values(annotations).forEach(annotation => {
      if (!annotation.visible) return;
      
      const isSelected = selectedEntityIds.includes(annotation.id);
      renderEntity(ctx, annotation as any, isSelected);
    });
    
    ctx.restore();
  };
  
  // Disegna l'overlay (punti di snap, cursore, ecc.)
  const drawOverlay = () => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Pulisci l'overlay
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Disegna il cursore
    if (mousePosition) {
      // Disegna mirino al cursore
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
    
    // Disegna punti di snap se presenti
    if (snapPoint && snappingEnabled) {
      ctx.fillStyle = '#2196F3';
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      
      // Disegna un cerchio per il punto di snap
      ctx.beginPath();
      ctx.arc(snapPoint.x, snapPoint.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    
    // Disegna anteprima in base allo strumento attivo
    if (isDrawing && dragStart && mousePosition) {
      if (activeTool === 'select') {
        // Disegna rettangolo di selezione
        ctx.strokeStyle = '#1890ff';
        ctx.fillStyle = 'rgba(24, 144, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        
        const width = mousePosition.x - dragStart.x;
        const height = mousePosition.y - dragStart.y;
        
        ctx.fillRect(dragStart.x, dragStart.y, width, height);
        ctx.strokeRect(dragStart.x, dragStart.y, width, height);
        ctx.setLineDash([]);
      } else {
        // Anteprima per strumenti di disegno
        switch (activeTool) {
          case 'line':
            ctx.strokeStyle = '#333333';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            
            ctx.beginPath();
            ctx.moveTo(dragStart.x, dragStart.y);
            ctx.lineTo(mousePosition.x, mousePosition.y);
            ctx.stroke();
            ctx.setLineDash([]);
            break;
            
          case 'rectangle':
            ctx.strokeStyle = '#333333';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            
            const width = mousePosition.x - dragStart.x;
            const height = mousePosition.y - dragStart.y;
            
            ctx.beginPath();
            ctx.rect(dragStart.x, dragStart.y, width, height);
            ctx.stroke();
            ctx.setLineDash([]);
            break;
            
          case 'circle':
            ctx.strokeStyle = '#333333';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            
            const dx = mousePosition.x - dragStart.x;
            const dy = mousePosition.y - dragStart.y;
            const radius = Math.sqrt(dx * dx + dy * dy);
            
            ctx.beginPath();
            ctx.arc(dragStart.x, dragStart.y, radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            break;
            
          // Aggiungi altri strumenti qui...
        }
      }
    }
    
    // Disegna feedback per entità evidenziate
    if (mousePosition && !isDrawing && !isDragging) {
      const worldPoint = screenToWorld(mousePosition);
      const hitResult = hitTestManagerRef.current.hitTestAtPoint(worldPoint);
      
      if (hitResult && activeTool === 'select') {
        // Evidenzia l'entità sotto il cursore
        ctx.strokeStyle = '#ff9800';
        ctx.lineWidth = 3;
        ctx.setLineDash([3, 3]);
        
        // Disegna un highlight approssimativo (questo potrebbe essere migliorato)
        // Per ora disegnamo solo un piccolo cerchio al punto hit
        ctx.beginPath();
        ctx.arc(mousePosition.x, mousePosition.y, 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  };
  
  // Gestisci il ridimensionamento del canvas
  const handleResize = () => {
    if (!mainCanvasRef.current || !gridCanvasRef.current || !overlayCanvasRef.current) return;
    
    const container = mainCanvasRef.current.parentElement;
    if (!container) return;
    
    const { width, height } = container.getBoundingClientRect();
    
    // Imposta le dimensioni di tutti i canvas
    [mainCanvasRef, gridCanvasRef, overlayCanvasRef].forEach(canvasRef => {
      if (!canvasRef.current) return;
      
      canvasRef.current.width = width;
      canvasRef.current.height = height;
    });
    
    setCanvasSize({ width, height });
    
    // Ridisegna tutto
    drawGrid();
    drawEntities();
    drawOverlay();
  };
  
  // Gestisci gli eventi mouse
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!overlayCanvasRef.current) return;
    
    const rect = overlayCanvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Punto corrente sullo schermo
    const screenPoint = { x, y };
    
    // Se il tasto destro è premuto, avvia il pan
    if (e.button === 2) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart(screenPoint);
      return;
    }
    
    // Converti in coordinate mondo
    const worldPoint = screenToWorld(screenPoint);
    
    // Cerca il punto di snap se snapping è abilitato
    const bestSnapPoint = snappingEnabled ? findBestSnapPoint(worldPoint) : null;
    
    // Punto di inizio (snap o normale)
    const startPoint = bestSnapPoint || worldPoint;
    
    // Se lo strumento è select, cerca di selezionare un'entità
    if (activeTool === 'select') {
      // Esegui hit testing
      const hitResult = hitTestManagerRef.current.hitTestAtPoint(worldPoint);
      
      if (hitResult) {
        // Entity trovata - gestisci la selezione
        const isCtrlPressed = e.ctrlKey || e.metaKey;
        
        if (isCtrlPressed) {
          // Aggiungi/rimuovi dalla selezione
          if (selectedEntityIds.includes(hitResult.entityId)) {
            deselectEntity(hitResult.entityId);
          } else {
            selectEntity(hitResult.entityId, true);
          }
        } else {
          // Selezione singola
          selectEntity(hitResult.entityId, false);
        }
      } else {
        // Nessuna entity trovata - inizia selezione rettangolare se non Ctrl
        if (!e.ctrlKey && !e.metaKey) {
          clearSelection();
        }
        // Imposta per selezione rettangolare
        setIsDrawing(true);
        setDragStart(screenPoint);
        setDragStartPoint(startPoint);
      }
      return;
    }
    
    // Per gli altri strumenti, inizia a disegnare
    setIsDrawing(true);
    setDragStart(screenPoint);
    setDragStartPoint(startPoint);
  };
  
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!overlayCanvasRef.current) return;
    
    const rect = overlayCanvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Punto corrente sullo schermo
    const screenPoint = { x, y };
    setMousePosition(screenPoint);
    
    // Converti in coordinate mondo
    const worldPoint = screenToWorld(screenPoint);
    
    // Cerca il punto di snap se snapping è abilitato
    const bestSnapPoint = snappingEnabled ? findBestSnapPoint(worldPoint) : null;
    
    // Aggiorna il punto di snap
    if (bestSnapPoint) {
      setSnapPoint(worldToScreen(bestSnapPoint));
    } else {
      setSnapPoint(null);
    }
    
    // Notifica il movimento del cursore
    if (onCursorMove) {
      onCursorMove(bestSnapPoint || worldPoint);
    }
    
    // Gestisci il pan con il tasto destro
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
    
    // Aggiorna l'overlay per mostrare l'anteprima dello strumento
    drawOverlay();
  };
  
  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Se stavamo facendo pan, interrompi
    if (isDragging) {
      setIsDragging(false);
      setDragStart(null);
      return;
    }
    
    // Se stavamo disegnando, completa l'operazione
    if (isDrawing && dragStart && mousePosition && dragStartPoint) {
      const endPoint = screenToWorld(mousePosition);
      
      // Usa il punto di snap se disponibile
      const finalEndPoint = snapPoint ? screenToWorld(snapPoint) : endPoint;
      
      // Se siamo in modalità select e stavamo trascinando, è una selezione rettangolare
      if (activeTool === 'select') {
        const topLeft = {
          x: Math.min(dragStartPoint.x, finalEndPoint.x),
          y: Math.min(dragStartPoint.y, finalEndPoint.y)
        };
        const bottomRight = {
          x: Math.max(dragStartPoint.x, finalEndPoint.x),
          y: Math.max(dragStartPoint.y, finalEndPoint.y)
        };
        
        // Solo se il rettangolo ha una dimensione minima
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
      } else {
        // Crea l'entità appropriata in base allo strumento attivo
        switch (activeTool) {
          case 'line':
            addEntity({
              type: 'line',
              layer: activeLayer,
              startPoint: dragStartPoint,
              endPoint: finalEndPoint,
              style: {
                strokeColor: '#000000',
                strokeWidth: 1,
                strokeStyle: 'solid'
              }
            });
            break;
            
          case 'rectangle':
            const width = finalEndPoint.x - dragStartPoint.x;
            const height = finalEndPoint.y - dragStartPoint.y;
            
            addEntity({
              type: 'rectangle',
              layer: activeLayer,
              position: dragStartPoint,
              width,
              height,
              style: {
                strokeColor: '#000000',
                strokeWidth: 1,
                strokeStyle: 'solid',
                fillColor: 'none'
              }
            });
            break;
            
          case 'circle':
            const dx = finalEndPoint.x - dragStartPoint.x;
            const dy = finalEndPoint.y - dragStartPoint.y;
            const radius = Math.sqrt(dx * dx + dy * dy);
            
            addEntity({
              type: 'circle',
              layer: activeLayer,
              center: dragStartPoint,
              radius,
              style: {
                strokeColor: '#000000',
                strokeWidth: 1,
                strokeStyle: 'solid',
                fillColor: 'none'
              }
            });
            break;
            
          // Aggiungi altri strumenti qui...
        }
      }
    }
    
    // Ripulisci lo stato
    setIsDrawing(false);
    setDragStart(null);
    setDragStartPoint(null);
  };
  
  // Previeni il menu contestuale predefinito
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };
  
  // Gestisci lo zoom con la rotella del mouse
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = zoom * delta;
    
    // Limita lo zoom a un range ragionevole
    const clampedZoom = Math.min(Math.max(newZoom, 0.1), 50);
    
    // Calcola il punto sotto il mouse in coordinate mondo
    const rect = mainCanvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Aggiorna lo zoom mantenendo il punto sotto il mouse fisso
    const oldWorldX = (mouseX - pan.x) / zoom;
    const oldWorldY = (mouseY - pan.y) / zoom;
    
    const newPanX = mouseX - oldWorldX * clampedZoom;
    const newPanY = mouseY - oldWorldY * clampedZoom;
    
    // Aggiorna zoom e pan
    if (Math.abs(zoom - clampedZoom) > 0.001) {
      setPan({ x: newPanX, y: newPanY });
    }
  };
  
  // Aggiorna il canvas quando cambiano le props rilevanti
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
    canvasSize
  ]);
  
  // Setup iniziale e gestione resize
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
  }, []);
  
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
      
      {/* Canvas principale per le entità */}
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
      
      {/* Canvas overlay per interazioni */}
      <canvas
        ref={overlayCanvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 3,
          cursor: activeTool === 'select' ? 'default' : 'crosshair'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onContextMenu={handleContextMenu}
        onWheel={handleWheel}
      />
    </motion.div>
  );
};

export default DrawingCanvas;