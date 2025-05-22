// src/components/cad/tools/PolylineTool.tsx
// Strumento per disegnare polilinee
// Tool for drawing polylines

import React, { useEffect, useRef } from 'react';
import { useTechnicalDrawingStore } from '../../../store/technicalDrawingStore';
import { BaseTool } from '../technical-drawing/core/ToolsManager';
import { DrawingEntityType, Point } from '../../../types/TechnicalDrawingTypes';

/**
 * PolylineTool - Strumento per creare entità polilinea
 * PolylineTool - Tool for creating polyline entities
 * 
 * Permette di disegnare polilinee aggiungendo più punti e supporta la creazione di forme chiuse.
 * Allows drawing polylines by adding multiple points and supports creating closed shapes.
 */
export class PolylineTool extends BaseTool {
  private isClosed: boolean = false;
  private tempPreviewPoint: Point | null = null;
  
  constructor() {
    super(
      'polyline',         // Tool ID
      'Polilinea',        // Tool name in Italian
      'polyline',         // Material icon name
      'crosshair',        // Cursor type
      {                   // Default style
        strokeColor: '#000000',
        strokeWidth: 1,
        strokeStyle: 'solid'
      },
      2                   // Minimum required points
    );
  }
  
  onMouseDown(point: Point, event: React.MouseEvent): void {
    // Se stiamo facendo doppio click, completiamo la polilinea
    // If we're double-clicking, complete the polyline
    if (event.detail === 2 && this.tempPoints.length >= 2) {
      this.complete();
      return;
    }
    
    // Se è il primo punto, aggiungerlo all'array
    // If it's the first point, add it to the array
    if (this.tempPoints.length === 0) {
      this.tempPoints.push({ ...point });
      return;
    }
    
    // Controlla se stiamo facendo click vicino al punto iniziale per chiudere
    // Check if we're clicking near the start point to close
    const firstPoint = this.tempPoints[0];
    const dx = point.x - firstPoint.x;
    const dy = point.y - firstPoint.y;
    const distToStart = Math.sqrt(dx * dx + dy * dy);
    
    // Se siamo abbastanza vicini al punto iniziale e abbiamo almeno 3 punti, chiudi la polilinea
    // If we're close enough to the start point and have at least 3 points, close the polyline
    if (distToStart < 10 && this.tempPoints.length >= 3) {
      this.isClosed = true;
      this.complete();
      return;
    }
    
    // Altrimenti aggiungi un nuovo punto alla polilinea
    // Otherwise add a new point to the polyline
    this.tempPoints.push({ ...point });
  }
  
  onMouseMove(point: Point, event: React.MouseEvent): void {
    // Aggiorna il punto temporaneo per l'anteprima
    // Update the temporary point for preview
    this.tempPreviewPoint = { ...point };
  }
  
  onKeyDown(event: React.KeyboardEvent): void {
    super.onKeyDown(event);
    
    // Se viene premuto il tasto C, chiudi la polilinea
    // If C key is pressed, close the polyline
    if (event.key.toLowerCase() === 'c' && this.tempPoints.length >= 3) {
      this.isClosed = true;
      this.complete();
    }
    
    // Se viene premuto Invio e abbiamo almeno 2 punti, completa la polilinea senza chiuderla
    // If Enter is pressed and we have at least 2 points, complete the polyline without closing it
    if (event.key === 'Enter' && this.tempPoints.length >= 2) {
      this.complete();
    }
  }
  
  complete(): void {
    if (this.tempPoints.length >= 2) {
      const store = useTechnicalDrawingStore.getState();
      
      // Crea l'entità polilinea
      // Create the polyline entity
      const polylineEntity = {
        type: DrawingEntityType.POLYLINE,
        points: [...this.tempPoints], // Clona tutti i punti / Clone all points
        closed: this.isClosed,
        layer: store.activeLayer,
        visible: true,
        locked: false,
        style: {
          strokeColor: this.defaultStyle?.strokeColor || '#000000',
          strokeWidth: this.defaultStyle?.strokeWidth || 1,
          strokeStyle: this.defaultStyle?.strokeStyle || 'solid',
          fillColor: this.isClosed ? 'rgba(200, 200, 200, 0.2)' : undefined,
          fillOpacity: this.isClosed ? 0.2 : undefined
        }
      };
      
      // Aggiungi l'entità allo store
      // Add the entity to the store
      store.addEntity(polylineEntity);
      
      // Resetta lo strumento per disegnare un'altra polilinea
      // Reset the tool to draw another polyline
      this.reset();
      this.isClosed = false;
      this.tempPreviewPoint = null;
    }
  }
  
  reset(): void {
    super.reset();
    this.isClosed = false;
    this.tempPreviewPoint = null;
  }
  
  renderPreview(ctx: CanvasRenderingContext2D): void {
    if (this.tempPoints.length === 0) return;
    
    ctx.save();
    
    // Imposta lo stile per l'anteprima
    // Set the style for the preview
    ctx.strokeStyle = this.defaultStyle?.strokeColor || '#000000';
    ctx.lineWidth = this.defaultStyle?.strokeWidth || 1;
    
    // Disegna linea tratteggiata per l'anteprima
    // Draw dashed line for the preview
    ctx.setLineDash([5, 5]);
    
    // Disegna i segmenti della polilinea
    // Draw the polyline segments
    ctx.beginPath();
    ctx.moveTo(this.tempPoints[0].x, this.tempPoints[0].y);
    
    for (let i = 1; i < this.tempPoints.length; i++) {
      ctx.lineTo(this.tempPoints[i].x, this.tempPoints[i].y);
    }
    
    // Se abbiamo un punto temporaneo di anteprima e almeno un punto esistente,
    // mostra una linea dal punto più recente al punto del mouse
    // If we have a temporary preview point and at least one existing point,
    // show a line from the most recent point to the mouse point
    if (this.tempPreviewPoint && this.tempPoints.length > 0) {
      ctx.lineTo(this.tempPreviewPoint.x, this.tempPreviewPoint.y);
      
      // Se abbiamo almeno 3 punti, mostra in anteprima una possibile chiusura
      // If we have at least 3 points, preview a possible closure
      const firstPoint = this.tempPoints[0];
      const dx = this.tempPreviewPoint.x - firstPoint.x;
      const dy = this.tempPreviewPoint.y - firstPoint.y;
      const distToStart = Math.sqrt(dx * dx + dy * dy);
      
      if (distToStart < 10 && this.tempPoints.length >= 3) {
        // Disegna una linea al punto iniziale per mostrare la chiusura
        // Draw a line to the start point to show closure
        ctx.lineTo(firstPoint.x, firstPoint.y);
        
        // Cambia il colore per indicare la chiusura
        // Change color to indicate closure
        ctx.strokeStyle = '#0066FF';
      }
    }
    
    ctx.stroke();
    
    // Se abbiamo già la polilinea chiusa, riempi con colore trasparente
    // If we already have a closed polyline, fill with transparent color
    if (this.isClosed && this.tempPoints.length >= 3) {
      ctx.fillStyle = 'rgba(200, 200, 200, 0.2)';
      ctx.fill();
    }
    
    // Disegna marcatori per i punti
    // Draw markers for the points
    for (let i = 0; i < this.tempPoints.length; i++) {
      const point = this.tempPoints[i];
      
      // Il primo punto è rosso, gli altri sono blu
      // The first point is red, others are blue
      ctx.fillStyle = i === 0 ? '#FF0000' : '#0066FF';
      ctx.beginPath();
      ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
      ctx.fill();
      
      // Se è il primo punto e abbiamo almeno 3 punti, disegna un indicatore per la chiusura
      // If it's the first point and we have at least 3 points, draw an indicator for closure
      if (i === 0 && this.tempPoints.length >= 3) {
        ctx.strokeStyle = '#FF0000';
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    
    ctx.restore();
  }
}

/**
 * Componente di integrazione React per PolylineTool
 * React integration component for PolylineTool
 */
const PolylineToolComponent: React.FC = () => {
  const toolInstance = useRef<PolylineTool | null>(null);
  
  useEffect(() => {
    // Crea l'istanza dello strumento
    // Create the tool instance
    if (!toolInstance.current) {
      toolInstance.current = new PolylineTool();
    }
    
    // Cleanup quando il componente viene smontato
    // Cleanup when component is unmounted
    return () => {
      // Eventuale pulizia
      // Potential cleanup
    };
  }, []);
  
  return null; // Questo componente non renderizza UI propria
};

export default PolylineToolComponent;