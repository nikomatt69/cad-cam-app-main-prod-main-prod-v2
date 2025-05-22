// src/components/cad/tools/CircleTool.tsx
// Strumento per disegnare cerchi
// Tool for drawing circles

import React, { useEffect, useRef } from 'react';
import { useTechnicalDrawingStore } from '../../enhancedTechnicalDrawingStore';
import { BaseTool } from '../../core/ToolsManager';
import { DrawingEntityType, Point } from '../../TechnicalDrawingTypes';

/**
 * CircleTool - Strumento per creare entità circolari
 * CircleTool - Tool for creating circle entities
 * 
 * Permette di disegnare cerchi specificando centro e raggio.
 * Allows drawing circles by specifying center and radius.
 */
export class CircleTool extends BaseTool {
  constructor() {
    super(
      'circle',           // Tool ID
      'Cerchio',          // Tool name in Italian
      'circle',           // Material icon name
      'crosshair',        // Cursor type
      {                   // Default style
        strokeColor: '#000000',
        strokeWidth: 1,
        strokeStyle: 'solid'
      },
      2                   // Required points
    );
  }
  
  onMouseDown(point: Point, event: React.MouseEvent): void {
    // Se è il primo punto, aggiungerlo come centro del cerchio
    // If it's the first point, add it as circle center
    if (this.tempPoints.length === 0) {
      this.tempPoints.push({ ...point });
    } 
    // Se è il secondo punto, usarlo per calcolare il raggio e completare
    // If it's the second point, use it to calculate radius and complete
    else if (this.tempPoints.length === 1) {
      this.tempPoints.push({ ...point });
      this.complete();
    }
  }
  
  onMouseMove(point: Point, event: React.MouseEvent): void {
    // Se abbiamo già il centro, aggiorniamo l'anteprima del raggio
    // If we already have the center, update the radius preview
    if (this.tempPoints.length === 1) {
      // Se c'è già un secondo punto temporaneo, aggiornalo
      // If there's already a temporary second point, update it
      if (this.tempPoints.length > 1) {
        this.tempPoints[1] = { ...point };
      } else {
        // Altrimenti, aggiungi il secondo punto
        // Otherwise, add the second point
        this.tempPoints.push({ ...point });
      }
    }
  }
  
  complete(): void {
    if (this.tempPoints.length >= 2) {
      const store = useTechnicalDrawingStore.getState();
      
      // Calcola il raggio dalla distanza tra i due punti
      // Calculate radius from distance between the two points
      const center = this.tempPoints[0];
      const radiusPoint = this.tempPoints[1];
      
      const dx = radiusPoint.x - center.x;
      const dy = radiusPoint.y - center.y;
      const radius = Math.sqrt(dx * dx + dy * dy);
      
      // Verifica che il raggio non sia zero
      // Check that radius is not zero
      if (radius > 0.001) {
        // Crea l'entità cerchio
        // Create the circle entity
        const circleEntity = {
          type: DrawingEntityType.CIRCLE,
          center: { ...center },
          radius,
          layer: store.activeLayer,
          visible: true,
          locked: false,
          style: {
            strokeColor: this.defaultStyle?.strokeColor || '#000000',
            strokeWidth: this.defaultStyle?.strokeWidth || 1,
            strokeStyle: this.defaultStyle?.strokeStyle || 'solid'
          }
        };
        
        // Aggiungi l'entità allo store
        // Add the entity to the store
        store.addEntity(circleEntity);
      }
      
      // Resetta lo strumento per disegnare un altro cerchio
      // Reset the tool to draw another circle
      this.reset();
    }
  }
  
  renderPreview(ctx: CanvasRenderingContext2D): void {
    if (this.tempPoints.length === 0) return;
    
    ctx.save();
    
    // Imposta lo stile per l'anteprima
    // Set the style for the preview
    ctx.strokeStyle = this.defaultStyle?.strokeColor || '#000000';
    ctx.lineWidth = this.defaultStyle?.strokeWidth || 1;
    
    // Disegna cerchio tratteggiato per l'anteprima
    // Draw dashed circle for the preview
    ctx.setLineDash([5, 5]);
    
    // Se abbiamo entrambi i punti, disegna il cerchio
    // If we have both points, draw the circle
    if (this.tempPoints.length > 1) {
      const center = this.tempPoints[0];
      const radiusPoint = this.tempPoints[1];
      
      const dx = radiusPoint.x - center.x;
      const dy = radiusPoint.y - center.y;
      const radius = Math.sqrt(dx * dx + dy * dy);
      
      ctx.beginPath();
      ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
      ctx.stroke();
      
      // Disegna una linea dal centro al punto di raggio
      // Draw a line from center to radius point
      ctx.beginPath();
      ctx.moveTo(center.x, center.y);
      ctx.lineTo(radiusPoint.x, radiusPoint.y);
      ctx.stroke();
    }
    
    // Disegna marcatori per il centro
    // Draw markers for the center
    const center = this.tempPoints[0];
    ctx.fillStyle = '#0066FF';
    ctx.beginPath();
    ctx.arc(center.x, center.y, 3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
}

/**
 * Componente di integrazione React per CircleTool
 * React integration component for CircleTool
 */
const CircleToolComponent: React.FC = () => {
  const toolInstance = useRef<CircleTool | null>(null);
  
  useEffect(() => {
    // Crea l'istanza dello strumento
    // Create the tool instance
    if (!toolInstance.current) {
      toolInstance.current = new CircleTool();
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

export default CircleToolComponent;