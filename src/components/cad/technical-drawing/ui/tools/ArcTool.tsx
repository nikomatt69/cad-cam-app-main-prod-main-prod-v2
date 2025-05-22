// src/components/cad/tools/ArcTool.tsx
// Strumento per disegnare archi
// Tool for drawing arcs

import React, { useEffect, useRef } from 'react';
import { useTechnicalDrawingStore } from '../../../store/technicalDrawingStore';
import { BaseTool } from '../technical-drawing/core/ToolsManager';
import { DrawingEntityType, Point } from '../../../types/TechnicalDrawingTypes';

/**
 * ArcTool - Strumento per creare entità arco
 * ArcTool - Tool for creating arc entities
 * 
 * Permette di disegnare archi specificando centro, raggio e angoli.
 * Allows drawing arcs by specifying center, radius and angles.
 */
export class ArcTool extends BaseTool {
  constructor() {
    super(
      'arc',              // Tool ID
      'Arco',             // Tool name in Italian
      'radio_button_unchecked',  // Material icon name
      'crosshair',        // Cursor type
      {                   // Default style
        strokeColor: '#000000',
        strokeWidth: 1,
        strokeStyle: 'solid'
      },
      3                   // Required points (center, start angle, end angle)
    );
  }
  
  onMouseDown(point: Point, event: React.MouseEvent): void {
    // Se è il primo punto, aggiungerlo come centro dell'arco
    // If it's the first point, add it as arc center
    if (this.tempPoints.length === 0) {
      this.tempPoints.push({ ...point });
    } 
    // Se è il secondo punto, usarlo per definire raggio e angolo iniziale
    // If it's the second point, use it to define radius and start angle
    else if (this.tempPoints.length === 1) {
      this.tempPoints.push({ ...point });
    }
    // Se è il terzo punto, usarlo per definire l'angolo finale e completare
    // If it's the third point, use it to define end angle and complete
    else if (this.tempPoints.length === 2) {
      this.tempPoints.push({ ...point });
      this.complete();
    }
  }
  
  onMouseMove(point: Point, event: React.MouseEvent): void {
    // Se abbiamo già il centro, aggiorniamo l'anteprima
    // If we already have the center, update the preview
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
    // Se abbiamo già il centro e il punto iniziale, aggiorniamo l'anteprima del punto finale
    // If we already have the center and start point, update the preview of the end point
    else if (this.tempPoints.length === 2) {
      // Se c'è già un terzo punto temporaneo, aggiornalo
      // If there's already a temporary third point, update it
      if (this.tempPoints.length > 2) {
        this.tempPoints[2] = { ...point };
      } else {
        // Altrimenti, aggiungi il terzo punto
        // Otherwise, add the third point
        this.tempPoints.push({ ...point });
      }
    }
  }
  
  complete(): void {
    if (this.tempPoints.length >= 3) {
      const store = useTechnicalDrawingStore.getState();
      
      // Calcola centro, raggio e angoli
      // Calculate center, radius and angles
      const center = this.tempPoints[0];
      const startPoint = this.tempPoints[1];
      const endPoint = this.tempPoints[2];
      
      // Calcola il raggio usando la distanza dal centro al punto iniziale
      // Calculate the radius using the distance from center to start point
      const dx1 = startPoint.x - center.x;
      const dy1 = startPoint.y - center.y;
      const radius = Math.sqrt(dx1 * dx1 + dy1 * dy1);
      
      // Calcola gli angoli
      // Calculate the angles
      const startAngle = Math.atan2(dy1, dx1);
      
      const dx2 = endPoint.x - center.x;
      const dy2 = endPoint.y - center.y;
      let endAngle = Math.atan2(dy2, dx2);
      
      // Determina se l'arco deve essere disegnato in senso orario o antiorario
      // Determine if the arc should be drawn clockwise or counterclockwise
      let counterclockwise = false;
      
      // Assicurati che endAngle sia maggiore di startAngle per avere un arco continuo
      // Make sure endAngle is greater than startAngle to have a continuous arc
      if (endAngle < startAngle) {
        endAngle += 2 * Math.PI;
      }
      
      // Se Shift è premuto, crea un arco di 90, 180 o 270 gradi
      // If Shift is pressed, create an arc of 90, 180 or 270 degrees
      if (event.shiftKey) {
        const angleRange = endAngle - startAngle;
        if (angleRange <= Math.PI / 2) {
          endAngle = startAngle + Math.PI / 2;
        } else if (angleRange <= Math.PI) {
          endAngle = startAngle + Math.PI;
        } else if (angleRange <= 3 * Math.PI / 2) {
          endAngle = startAngle + 3 * Math.PI / 2;
        } else {
          endAngle = startAngle + 2 * Math.PI;
        }
      }
      
      // Verifica che il raggio non sia zero
      // Check that radius is not zero
      if (radius > 0.001) {
        // Crea l'entità arco
        // Create the arc entity
        const arcEntity = {
          type: DrawingEntityType.ARC,
          center: { ...center },
          radius,
          startAngle,
          endAngle,
          counterclockwise,
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
        store.addEntity(arcEntity);
      }
      
      // Resetta lo strumento per disegnare un altro arco
      // Reset the tool to draw another arc
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
    
    // Disegna arco tratteggiato per l'anteprima
    // Draw dashed arc for the preview
    ctx.setLineDash([5, 5]);
    
    const center = this.tempPoints[0];
    
    // Se abbiamo il centro e il punto iniziale, disegna il raggio
    // If we have the center and the start point, draw the radius
    if (this.tempPoints.length > 1) {
      const startPoint = this.tempPoints[1];
      
      const dx1 = startPoint.x - center.x;
      const dy1 = startPoint.y - center.y;
      const radius = Math.sqrt(dx1 * dx1 + dy1 * dy1);
      const startAngle = Math.atan2(dy1, dx1);
      
      // Disegna il raggio dal centro al punto iniziale
      // Draw the radius from center to start point
      ctx.beginPath();
      ctx.moveTo(center.x, center.y);
      ctx.lineTo(startPoint.x, startPoint.y);
      ctx.stroke();
      
      // Se abbiamo anche il punto finale, disegna l'arco completo
      // If we also have the end point, draw the complete arc
      if (this.tempPoints.length > 2) {
        const endPoint = this.tempPoints[2];
        
        const dx2 = endPoint.x - center.x;
        const dy2 = endPoint.y - center.y;
        let endAngle = Math.atan2(dy2, dx2);
        
        // Assicurati che endAngle sia maggiore di startAngle per avere un arco continuo
        // Make sure endAngle is greater than startAngle to have a continuous arc
        if (endAngle < startAngle) {
          endAngle += 2 * Math.PI;
        }
        
        // Disegna l'arco
        // Draw the arc
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, startAngle, endAngle);
        ctx.stroke();
        
        // Disegna il raggio dal centro al punto finale
        // Draw the radius from center to end point
        ctx.beginPath();
        ctx.moveTo(center.x, center.y);
        ctx.lineTo(endPoint.x, endPoint.y);
        ctx.stroke();
      } else {
        // Se abbiamo solo il centro e il punto iniziale, disegna un cerchio completo
        // If we only have the center and start point, draw a complete circle
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    
    // Disegna marcatori per i punti
    // Draw markers for the points
    this.tempPoints.forEach((point, index) => {
      ctx.fillStyle = index === 0 ? '#FF0000' : '#0066FF';
      ctx.beginPath();
      ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
    
    ctx.restore();
  }
}

/**
 * Componente di integrazione React per ArcTool
 * React integration component for ArcTool
 */
const ArcToolComponent: React.FC = () => {
  const toolInstance = useRef<ArcTool | null>(null);
  
  useEffect(() => {
    // Crea l'istanza dello strumento
    // Create the tool instance
    if (!toolInstance.current) {
      toolInstance.current = new ArcTool();
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

export default ArcToolComponent;