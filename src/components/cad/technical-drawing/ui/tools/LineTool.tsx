// src/components/cad/tools/LineTool.tsx
// Strumento per disegnare linee
// Tool for drawing lines

import React, { useEffect, useRef } from 'react';
import { useTechnicalDrawingStore } from '../../../store/technicalDrawingStore';
import { BaseTool } from '../technical-drawing/core/ToolsManager';
import { DrawingEntityType, Point } from '../../../types/TechnicalDrawingTypes';

/**
 * LineTool - Strumento per creare entità lineari
 * LineTool - Tool for creating line entities
 * 
 * Permette di disegnare linee cliccando su due punti.
 * Allows drawing lines by clicking on two points.
 */
export class LineTool extends BaseTool {
  constructor() {
    super(
      'line',             // Tool ID
      'Linea',            // Tool name in Italian
      'straighten',       // Material icon name
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
    // Se è il primo punto, aggiungerlo ai punti temporanei
    // If it's the first point, add it to temp points
    if (this.tempPoints.length === 0) {
      this.tempPoints.push({ ...point });
    } 
    // Se è il secondo punto e diverso dal primo, completare la linea
    // If it's the second point and different from the first, complete the line
    else if (this.tempPoints.length === 1) {
      const firstPoint = this.tempPoints[0];
      // Verifica che i punti non coincidano
      // Check that points don't coincide
      if (Math.abs(firstPoint.x - point.x) > 0.001 || Math.abs(firstPoint.y - point.y) > 0.001) {
        this.tempPoints.push({ ...point });
        this.complete();
      }
    }
  }
  
  onMouseMove(point: Point, event: React.MouseEvent): void {
    // Se abbiamo già il primo punto, aggiorniamo l'anteprima del secondo
    // If we already have the first point, update the preview of the second
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
      
      // Crea l'entità linea
      // Create the line entity
      const lineEntity = {
        type: DrawingEntityType.LINE,
        startPoint: { ...this.tempPoints[0] },
        endPoint: { ...this.tempPoints[1] },
        layer: store.activeLayer,
        visible: true,
        locked: false,
        style: {
          strokeColor: this.defaultStyle?.strokeColor || '#000000',
          strokeWidth: this.defaultStyle?.strokeWidth || 1,
          strokeStyle: this.defaultStyle?.strokeStyle || 'solid'
        }
      };
      
      // Aggiungi l'entità allo store e registra per l'annullamento
      // Add the entity to the store and register for undo
      store.addEntity(lineEntity);
      
      // Resetta lo strumento per disegnare un'altra linea
      // Reset the tool to draw another line
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
    
    // Disegna linea tratteggiata per l'anteprima
    // Draw dashed line for the preview
    ctx.setLineDash([5, 5]);
    
    ctx.beginPath();
    ctx.moveTo(this.tempPoints[0].x, this.tempPoints[0].y);
    
    // Se abbiamo un secondo punto, disegna fino a quel punto
    // If we have a second point, draw to that point
    if (this.tempPoints.length > 1) {
      ctx.lineTo(this.tempPoints[1].x, this.tempPoints[1].y);
    }
    
    ctx.stroke();
    
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
}

/**
 * Componente di integrazione React per LineTool
 * React integration component for LineTool
 */
const LineToolComponent: React.FC = () => {
  const toolInstance = useRef<LineTool | null>(null);
  
  useEffect(() => {
    // Crea l'istanza dello strumento
    // Create the tool instance
    if (!toolInstance.current) {
      toolInstance.current = new LineTool();
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

export default LineToolComponent;