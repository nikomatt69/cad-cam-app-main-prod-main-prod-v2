// src/components/cad/tools/EllipseTool.tsx
// Strumento per disegnare ellissi
// Tool for drawing ellipses

import React, { useEffect, useRef } from 'react';
import { useTechnicalDrawingStore } from '../../../store/technicalDrawingStore';
import { BaseTool } from '../technical-drawing/core/ToolsManager';
import { DrawingEntityType, Point } from '../../../types/TechnicalDrawingTypes';

/**
 * EllipseTool - Strumento per creare entità ellissi
 * EllipseTool - Tool for creating ellipse entities
 * 
 * Permette di disegnare ellissi specificando centro, raggio X e raggio Y
 * Allows drawing ellipses by specifying center, X radius and Y radius
 */
export class EllipseTool extends BaseTool {
  private rotationAngle: number = 0;
  private isDefiningRotation: boolean = false;
  private dragPointIndex: number = -1;
  
  constructor() {
    super(
      'ellipse',          // Tool ID
      'Ellisse',          // Tool name in Italian
      'panorama_fish_eye', // Material icon name
      'crosshair',        // Cursor type
      {                   // Default style
        strokeColor: '#000000',
        strokeWidth: 1,
        strokeStyle: 'solid'
      },
      3                   // Required points (center, width point, height point)
    );
  }
  
  onMouseDown(point: Point, event: React.MouseEvent): void {
    // Se è il primo punto, aggiungerlo come centro dell'ellisse
    // If it's the first point, add it as ellipse center
    if (this.tempPoints.length === 0) {
      this.tempPoints.push({ ...point });
      return;
    }
    
    // Se è il secondo punto, usarlo per definire il raggio X
    // If it's the second point, use it to define X radius
    if (this.tempPoints.length === 1) {
      this.tempPoints.push({ ...point });
      return;
    }
    
    // Se è il terzo punto, usarlo per definire il raggio Y
    // If it's the third point, use it to define Y radius
    if (this.tempPoints.length === 2) {
      this.tempPoints.push({ ...point });
      
      // Se il tasto Shift è premuto, abilita la definizione della rotazione
      // If Shift key is pressed, enable rotation definition
      if (event.shiftKey) {
        this.isDefiningRotation = true;
      } else {
        // Altrimenti completa subito l'ellisse senza rotazione
        // Otherwise complete the ellipse immediately without rotation
        this.complete();
      }
      
      return;
    }
    
    // Se stiamo definendo la rotazione, usa il quarto punto per questo
    // If we're defining rotation, use the fourth point for this
    if (this.isDefiningRotation && this.tempPoints.length === 3) {
      this.tempPoints.push({ ...point });
      this.calculateRotation();
      this.complete();
    }
  }
  
  onMouseMove(point: Point, event: React.MouseEvent): void {
    if (this.tempPoints.length === 0) return;
    
    if (this.dragPointIndex >= 0) {
      // Se stiamo trascinando un punto, aggiorna quel punto
      // If we're dragging a point, update that point
      this.tempPoints[this.dragPointIndex] = { ...point };
      
      if (this.dragPointIndex === 3) {
        this.calculateRotation();
      }
      return;
    }
    
    // Se abbiamo già il centro, aggiorniamo l'anteprima del punto successivo
    // If we already have the center, update the preview of the next point
    if (this.tempPoints.length === 1) {
      if (this.tempPoints.length > 1) {
        this.tempPoints[1] = { ...point };
      } else {
        this.tempPoints.push({ ...point });
      }
    } 
    // Se abbiamo già centro e punto per raggio X, aggiorna il punto per raggio Y
    // If we already have center and X radius point, update Y radius point
    else if (this.tempPoints.length === 2) {
      if (this.tempPoints.length > 2) {
        this.tempPoints[2] = { ...point };
      } else {
        this.tempPoints.push({ ...point });
      }
    }
    // Se stiamo definendo la rotazione, aggiorna il punto di rotazione
    // If we're defining rotation, update the rotation point
    else if (this.isDefiningRotation && this.tempPoints.length === 3) {
      if (this.tempPoints.length > 3) {
        this.tempPoints[3] = { ...point };
      } else {
        this.tempPoints.push({ ...point });
      }
      this.calculateRotation();
    }
  }
  
  calculateRotation(): void {
    if (this.tempPoints.length < 4) return;
    
    const center = this.tempPoints[0];
    const radiusXPoint = this.tempPoints[1];
    const rotationPoint = this.tempPoints[3];
    
    // Calcola l'angolo tra la linea centro->rotationPoint e l'asse X
    // Calculate the angle between center->rotationPoint line and X axis
    const dx = rotationPoint.x - center.x;
    const dy = rotationPoint.y - center.y;
    
    this.rotationAngle = Math.atan2(dy, dx) * 180 / Math.PI;
  }
  
  onKeyDown(event: React.KeyboardEvent): void {
    super.onKeyDown(event);
    
    // Se viene premuto Shift, imposta la modalità rotazione
    // If Shift is pressed, set rotation mode
    if (event.key === 'Shift' && this.tempPoints.length === 3 && !this.isDefiningRotation) {
      this.isDefiningRotation = true;
      this.tempPoints.push({ ...this.tempPoints[1] }); // Punto iniziale per rotazione / Initial point for rotation
    }
    
    // Se viene premuto Invio con almeno 3 punti, completa l'ellisse
    // If Enter is pressed with at least 3 points, complete the ellipse
    if (event.key === 'Enter' && this.tempPoints.length >= 3) {
      // Se stiamo definendo la rotazione, calcola la rotazione finale
      // If we're defining rotation, calculate final rotation
      if (this.isDefiningRotation && this.tempPoints.length >= 4) {
        this.calculateRotation();
      }
      this.complete();
    }
  }
  
  complete(): void {
    if (this.tempPoints.length >= 3) {
      const store = useTechnicalDrawingStore.getState();
      
      const center = this.tempPoints[0];
      const radiusXPoint = this.tempPoints[1];
      const radiusYPoint = this.tempPoints[2];
      
      // Calcola i raggi
      // Calculate radii
      const dx = radiusXPoint.x - center.x;
      const dy = radiusXPoint.y - center.y;
      const radiusX = Math.sqrt(dx * dx + dy * dy);
      
      const dx2 = radiusYPoint.x - center.x;
      const dy2 = radiusYPoint.y - center.y;
      const radiusY = Math.sqrt(dx2 * dx2 + dy2 * dy2);
      
      // Verifica che i raggi non siano zero
      // Check that radii are not zero
      if (radiusX > 0.001 && radiusY > 0.001) {
        // Crea l'entità ellisse
        // Create the ellipse entity
        const ellipseEntity = {
          type: DrawingEntityType.ELLIPSE,
          center: { ...center },
          radiusX,
          radiusY,
          rotation: this.isDefiningRotation ? this.rotationAngle : 0,
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
        store.addEntity(ellipseEntity);
      }
      
      // Resetta lo strumento per disegnare un'altra ellisse
      // Reset the tool to draw another ellipse
      this.reset();
    }
  }
  
  reset(): void {
    super.reset();
    this.rotationAngle = 0;
    this.isDefiningRotation = false;
    this.dragPointIndex = -1;
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
    
    const center = this.tempPoints[0];
    
    // Disegna i raggi
    // Draw the radii
    if (this.tempPoints.length > 1) {
      const radiusXPoint = this.tempPoints[1];
      
      ctx.beginPath();
      ctx.moveTo(center.x, center.y);
      ctx.lineTo(radiusXPoint.x, radiusXPoint.y);
      ctx.stroke();
      
      // Se abbiamo anche il punto di raggio Y
      // If we also have the Y radius point
      if (this.tempPoints.length > 2) {
        const radiusYPoint = this.tempPoints[2];
        
        ctx.beginPath();
        ctx.moveTo(center.x, center.y);
        ctx.lineTo(radiusYPoint.x, radiusYPoint.y);
        ctx.stroke();
        
        // Calcola i raggi per disegnare l'ellisse
        // Calculate radii to draw the ellipse
        const dx = radiusXPoint.x - center.x;
        const dy = radiusXPoint.y - center.y;
        const radiusX = Math.sqrt(dx * dx + dy * dy);
        
        const dx2 = radiusYPoint.x - center.x;
        const dy2 = radiusYPoint.y - center.y;
        const radiusY = Math.sqrt(dx2 * dx2 + dy2 * dy2);
        
        // Disegna l'ellisse
        // Draw the ellipse
        if (radiusX > 0 && radiusY > 0) {
          ctx.beginPath();
          
          // Se stiamo definendo la rotazione
          // If we're defining rotation
          if (this.isDefiningRotation && this.tempPoints.length > 3) {
            const rotationPoint = this.tempPoints[3];
            
            // Disegna linea per indicare la rotazione
            // Draw line to indicate rotation
            ctx.beginPath();
            ctx.moveTo(center.x, center.y);
            ctx.lineTo(rotationPoint.x, rotationPoint.y);
            ctx.strokeStyle = '#0066FF';
            ctx.stroke();
            
            // Disegna ellisse ruotata
            // Draw rotated ellipse
            ctx.save();
            ctx.translate(center.x, center.y);
            ctx.rotate(this.rotationAngle * Math.PI / 180);
            ctx.beginPath();
            ctx.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2);
            ctx.restore();
            
            // Disegna testo dell'angolo
            // Draw angle text
            ctx.fillStyle = '#0066FF';
            ctx.font = '12px Arial';
            ctx.fillText(`${Math.round(this.rotationAngle)}°`, 
                         center.x + 10, 
                         center.y - 10);
          } else {
            // Ellisse non ruotata / Non-rotated ellipse
            ctx.ellipse(center.x, center.y, radiusX, radiusY, 0, 0, Math.PI * 2);
          }
          
          ctx.stroke();
        }
      }
    }
    
    // Disegna marcatori per i punti
    // Draw markers for the points
    for (let i = 0; i < this.tempPoints.length; i++) {
      const point = this.tempPoints[i];
      
      // Il centro è rosso, i raggi sono blu, la rotazione è verde
      // Center is red, radii are blue, rotation is green
      if (i === 0) {
        ctx.fillStyle = '#FF0000'; // Centro / Center
      } else if (i === 3) {
        ctx.fillStyle = '#00FF00'; // Punto rotazione / Rotation point
      } else {
        ctx.fillStyle = '#0066FF'; // Punti raggio / Radius points
      }
      
      ctx.beginPath();
      ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  }
}

/**
 * Componente di integrazione React per EllipseTool
 * React integration component for EllipseTool
 */
const EllipseToolComponent: React.FC = () => {
  const toolInstance = useRef<EllipseTool | null>(null);
  
  useEffect(() => {
    // Crea l'istanza dello strumento
    // Create the tool instance
    if (!toolInstance.current) {
      toolInstance.current = new EllipseTool();
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

export default EllipseToolComponent;