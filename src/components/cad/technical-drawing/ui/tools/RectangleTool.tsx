// src/components/cad/tools/RectangleTool.tsx
// Strumento per disegnare rettangoli
// Tool for drawing rectangles

import React, { useEffect, useRef } from 'react';
import { useTechnicalDrawingStore } from '../../enhancedTechnicalDrawingStore';
import { BaseTool } from '../../core/ToolsManager';
import { DrawingEntityType, Point } from '../../TechnicalDrawingTypes';

/**
 * RectangleTool - Strumento per creare entità rettangolari
 * RectangleTool - Tool for creating rectangle entities
 * 
 * Permette di disegnare rettangoli specificando due punti diagonalmente opposti.
 * Allows drawing rectangles by specifying two diagonally opposite points.
 */
export class RectangleTool extends BaseTool {
  constructor() {
    super(
      'rectangle',        // Tool ID
      'Rettangolo',       // Tool name in Italian
      'rectangle',        // Material icon name
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
    // Se è il primo punto, aggiungerlo come primo angolo del rettangolo
    // If it's the first point, add it as the first corner of the rectangle
    if (this.tempPoints.length === 0) {
      this.tempPoints.push({ ...point });
    } 
    // Se è il secondo punto, usarlo come angolo opposto e completare
    // If it's the second point, use it as the opposite corner and complete
    else if (this.tempPoints.length === 1) {
      this.tempPoints.push({ ...point });
      this.complete();
    }
  }
  
  onMouseMove(point: Point, event: React.MouseEvent): void {
    // Se abbiamo già il primo angolo, aggiorniamo l'anteprima del secondo
    // If we already have the first corner, update the preview of the second
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
      
      // Calcola posizione, larghezza e altezza
      // Calculate position, width, and height
      const p1 = this.tempPoints[0];
      const p2 = this.tempPoints[1];
      
      const minX = Math.min(p1.x, p2.x);
      const minY = Math.min(p1.y, p2.y);
      const maxX = Math.max(p1.x, p2.x);
      const maxY = Math.max(p1.y, p2.y);
      
      const width = maxX - minX;
      const height = maxY - minY;
      
      // Verifica che il rettangolo abbia dimensioni
      // Check that the rectangle has dimensions
      if (width > 0.001 && height > 0.001) {
        // Crea l'entità rettangolo
        // Create the rectangle entity
        const rectangleEntity = {
          type: DrawingEntityType.RECTANGLE,
          position: { x: minX, y: minY },
          width,
          height,
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
        store.addEntity(rectangleEntity);
      }
      
      // Resetta lo strumento per disegnare un altro rettangolo
      // Reset the tool to draw another rectangle
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
    
    // Disegna rettangolo tratteggiato per l'anteprima
    // Draw dashed rectangle for the preview
    ctx.setLineDash([5, 5]);
    
    // Se abbiamo entrambi i punti, disegna il rettangolo
    // If we have both points, draw the rectangle
    if (this.tempPoints.length > 1) {
      const p1 = this.tempPoints[0];
      const p2 = this.tempPoints[1];
      
      const minX = Math.min(p1.x, p2.x);
      const minY = Math.min(p1.y, p2.y);
      const width = Math.abs(p2.x - p1.x);
      const height = Math.abs(p2.y - p1.y);
      
      ctx.beginPath();
      ctx.rect(minX, minY, width, height);
      ctx.stroke();
    }
    
    // Disegna marcatori per i punti
    // Draw markers for the points
    this.tempPoints.forEach(point => {
      ctx.fillStyle = '#0066FF';
      ctx.beginPath();
      ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
    
    ctx.restore();
  }
  
  // Overrida il metodo onKeyDown per gestire la creazione di quadrati con il tasto Shift
  // Override the onKeyDown method to handle square creation with the Shift key
  onKeyDown(event: React.KeyboardEvent): void {
    super.onKeyDown(event);
    
    // Se viene premuto o rilasciato il tasto Shift, aggiorniamo l'anteprima
    // If the Shift key is pressed or released, update the preview
    if (event.key === 'Shift' && this.tempPoints.length > 1) {
      this.renderPreview(document.createElement('canvas').getContext('2d')!);
    }
  }
}

/**
 * Componente di integrazione React per RectangleTool
 * React integration component for RectangleTool
 */
const RectangleToolComponent: React.FC = () => {
  const toolInstance = useRef<RectangleTool | null>(null);
  
  useEffect(() => {
    // Crea l'istanza dello strumento
    // Create the tool instance
    if (!toolInstance.current) {
      toolInstance.current = new RectangleTool();
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

export default RectangleToolComponent;