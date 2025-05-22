// src/components/cad/tools/DimensionTool.tsx
// Strumento per aggiungere quote e dimensioni
// Tool for adding dimensions and measurements

import React, { useEffect, useRef, useState } from 'react';
import { useTechnicalDrawingStore } from '../../../store/technicalDrawingStore';
import { BaseTool } from '../technical-drawing/core/ToolsManager';
import { DrawingEntityType, Point, DimensionType } from '../../../types/TechnicalDrawingTypes';

/**
 * DimensionTool - Strumento per creare quote nel disegno tecnico
 * DimensionTool - Tool for creating dimensions in technical drawing
 * 
 * Supporta diversi tipi di quote: lineari, angolari, radiali, diametrali
 * Supports different types of dimensions: linear, angular, radial, diametrical
 */
export class DimensionTool extends BaseTool {
  private dimensionType: DimensionType = DimensionType.LINEAR;
  private extensionDistance: number = 10;
  private offsetDistance: number = 15;
  private dimensionText: string | null = null;
  private precision: number = 2;
  private showUnits: boolean = true;
  private units: string = 'mm';
  private autoCalc: boolean = true;
  
  constructor() {
    super(
      'dimension',       // Tool ID
      'Quota',           // Tool name in Italian
      'straighten',      // Material icon name
      'crosshair',       // Cursor type
      {                  // Default style
        strokeColor: '#000000',
        fillColor: '#000000',
        strokeWidth: 1,
        strokeStyle: 'solid'
      },
      2                  // Required points (start and end)
    );
  }
  
  /**
   * Imposta il tipo di quota
   * Set dimension type
   */
  setDimensionType(type: DimensionType): void {
    this.dimensionType = type;
    
    // Resetta lo strumento per evitare comportamenti imprevisti
    // Reset the tool to avoid unexpected behaviors
    this.reset();
  }
  
  /**
   * Imposta parametri della quota
   * Set dimension parameters
   */
  setParameters(params: {
    extensionDistance?: number;
    offsetDistance?: number;
    dimensionText?: string | null;
    precision?: number;
    showUnits?: boolean;
    units?: string;
    autoCalc?: boolean;
  }): void {
    if (params.extensionDistance !== undefined) this.extensionDistance = params.extensionDistance;
    if (params.offsetDistance !== undefined) this.offsetDistance = params.offsetDistance;
    if (params.dimensionText !== undefined) this.dimensionText = params.dimensionText;
    if (params.precision !== undefined) this.precision = params.precision;
    if (params.showUnits !== undefined) this.showUnits = params.showUnits;
    if (params.units !== undefined) this.units = params.units;
    if (params.autoCalc !== undefined) this.autoCalc = params.autoCalc;
  }
  
  onMouseDown(point: Point, event: React.MouseEvent): void {
    // Se è il primo punto, aggiungerlo come inizio della quota
    // If it's the first point, add it as dimension start
    if (this.tempPoints.length === 0) {
      this.tempPoints.push({ ...point });
      return;
    }
    
    // Se è il secondo punto, aggiungerlo come fine della quota
    // If it's the second point, add it as dimension end
    if (this.tempPoints.length === 1) {
      this.tempPoints.push({ ...point });
      
      // Per quote lineari e angolari, abbiamo bisogno di un terzo punto per l'offset
      // For linear and angular dimensions, we need a third point for offset
      if (this.dimensionType === DimensionType.LINEAR || 
          this.dimensionType === DimensionType.ANGULAR) {
        return;
      }
      
      // Per quote radiali e diametrali, completiamo subito
      // For radial and diametrical dimensions, complete immediately
      this.complete();
      return;
    }
    
    // Se è il terzo punto, completiamo la quota
    // If it's the third point, complete the dimension
    if (this.tempPoints.length === 2) {
      this.tempPoints.push({ ...point });
      this.complete();
    }
  }
  
  onMouseMove(point: Point, event: React.MouseEvent): void {
    // Se abbiamo già il primo punto, aggiorna l'anteprima
    // If we already have the first point, update the preview
    if (this.tempPoints.length === 1) {
      if (this.tempPoints.length > 1) {
        this.tempPoints[1] = { ...point };
      } else {
        this.tempPoints.push({ ...point });
      }
    } 
    // Se abbiamo già due punti, aggiorna il terzo punto per l'offset
    // If we already have two points, update the third point for offset
    else if (this.tempPoints.length === 2 && 
            (this.dimensionType === DimensionType.LINEAR || 
             this.dimensionType === DimensionType.ANGULAR)) {
      if (this.tempPoints.length > 2) {
        this.tempPoints[2] = { ...point };
      } else {
        this.tempPoints.push({ ...point });
      }
    }
  }
  
  onKeyDown(event: React.KeyboardEvent): void {
    super.onKeyDown(event);
    
    // Se viene premuto Invio con i punti necessari, completa la quota
    // If Enter is pressed with needed points, complete the dimension
    if (event.key === 'Enter') {
      if ((this.dimensionType === DimensionType.RADIAL || 
           this.dimensionType === DimensionType.DIAMETRICAL) && 
          this.tempPoints.length >= 2) {
        this.complete();
      } else if (this.tempPoints.length >= 3) {
        this.complete();
      }
    }
  }
  
  /**
   * Calcola il valore della quota in base al tipo e ai punti
   * Calculate dimension value based on type and points
   */
  calculateDimensionValue(): number {
    if (this.tempPoints.length < 2) return 0;
    
    const start = this.tempPoints[0];
    const end = this.tempPoints[1];
    
    switch (this.dimensionType) {
      case DimensionType.LINEAR: {
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        return Math.sqrt(dx * dx + dy * dy);
      }
      
      case DimensionType.ANGULAR: {
        if (this.tempPoints.length < 3) return 0;
        
        const center = this.tempPoints[0];
        const p1 = this.tempPoints[1];
        const p2 = this.tempPoints[2];
        
        const angle1 = Math.atan2(p1.y - center.y, p1.x - center.x);
        const angle2 = Math.atan2(p2.y - center.y, p2.x - center.x);
        
        // Calcola la differenza di angolo in gradi
        // Calculate angle difference in degrees
        let angleDiff = (angle2 - angle1) * 180 / Math.PI;
        if (angleDiff < 0) angleDiff += 360;
        
        return angleDiff;
      }
      
      case DimensionType.RADIAL: {
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        return Math.sqrt(dx * dx + dy * dy);
      }
      
      case DimensionType.DIAMETRICAL: {
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        return Math.sqrt(dx * dx + dy * dy) * 2;
      }
      
      default:
        return 0;
    }
  }
  
  /**
   * Formatta il valore della quota come testo
   * Format dimension value as text
   */
  formatDimensionText(value: number): string {
    if (this.dimensionText) {
      return this.dimensionText;
    }
    
    if (this.autoCalc) {
      const formattedValue = value.toFixed(this.precision);
      
      if (this.showUnits) {
        if (this.dimensionType === DimensionType.ANGULAR) {
          return `${formattedValue}°`;
        } else {
          return `${formattedValue} ${this.units}`;
        }
      } else {
        return formattedValue;
      }
    }
    
    return '';
  }
  
  complete(): void {
    if ((this.dimensionType === DimensionType.RADIAL || 
         this.dimensionType === DimensionType.DIAMETRICAL) && 
        this.tempPoints.length >= 2) {
      this.createDimension();
    } else if (this.tempPoints.length >= 3) {
      this.createDimension();
    }
  }
  
  createDimension(): void {
    const store = useTechnicalDrawingStore.getState();
    
    // Calcola il valore della quota
    // Calculate dimension value
    const value = this.calculateDimensionValue();
    const text = this.formatDimensionText(value);
    
    // Crea l'entità quota
    // Create dimension entity
    const dimensionEntity = {
      type: DrawingEntityType.DIMENSION,
      dimensionType: this.dimensionType,
      points: [...this.tempPoints], // Clona tutti i punti / Clone all points
      extensionDistance: this.extensionDistance,
      offsetDistance: this.offsetDistance,
      text,
      layer: store.activeLayer,
      visible: true,
      locked: false,
      style: {
        strokeColor: this.defaultStyle?.strokeColor || '#000000',
        fillColor: this.defaultStyle?.fillColor || '#000000',
        strokeWidth: this.defaultStyle?.strokeWidth || 1,
        strokeStyle: this.defaultStyle?.strokeStyle || 'solid',
        fontSize: 10,
        fontFamily: 'Arial'
      }
    };
    
    // Aggiungi l'entità allo store
    // Add the entity to the store
    store.addEntity(dimensionEntity);
    
    // Resetta lo strumento per creare un'altra quota
    // Reset the tool to create another dimension
    this.reset();
  }
  
  reset(): void {
    super.reset();
    // Mantieni le impostazioni di stile ma resetta il testo personalizzato
    // Keep style settings but reset custom text
    if (!this.autoCalc) {
      this.dimensionText = null;
    }
  }
  
  renderPreview(ctx: CanvasRenderingContext2D): void {
    if (this.tempPoints.length === 0) return;
    
    ctx.save();
    
    // Imposta lo stile per l'anteprima
    // Set the style for the preview
    ctx.strokeStyle = this.defaultStyle?.strokeColor || '#000000';
    ctx.fillStyle = this.defaultStyle?.fillColor || '#000000';
    ctx.lineWidth = this.defaultStyle?.strokeWidth || 1;
    
    // Disegna linea tratteggiata per l'anteprima
    // Draw dashed line for the preview
    ctx.setLineDash([5, 5]);
    
    const start = this.tempPoints[0];
    
    // Se abbiamo solo il primo punto, disegna un marker
    // If we only have the first point, draw a marker
    if (this.tempPoints.length === 1) {
      ctx.fillStyle = '#FF0000';
      ctx.beginPath();
      ctx.arc(start.x, start.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }
    
    const end = this.tempPoints[1];
    
    // Disegna in base al tipo di quota
    // Draw based on dimension type
    switch (this.dimensionType) {
      case DimensionType.LINEAR:
        this.drawLinearDimension(ctx, start, end);
        break;
        
      case DimensionType.ANGULAR:
        this.drawAngularDimension(ctx, start, end);
        break;
        
      case DimensionType.RADIAL:
        this.drawRadialDimension(ctx, start, end);
        break;
        
      case DimensionType.DIAMETRICAL:
        this.drawDiametricalDimension(ctx, start, end);
        break;
    }
    
    ctx.restore();
  }
  
  drawLinearDimension(ctx: CanvasRenderingContext2D, start: Point, end: Point): void {
    // Disegna la linea principale tra i punti
    // Draw the main line between points
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    
    // Se abbiamo il terzo punto per l'offset, disegna la quota completa
    // If we have the third point for offset, draw the complete dimension
    if (this.tempPoints.length >= 3) {
      const offset = this.tempPoints[2];
      
      // Calcola il valore della quota
      // Calculate dimension value
      const value = this.calculateDimensionValue();
      const text = this.formatDimensionText(value);
      
      // Calcola la direzione della linea
      // Calculate line direction
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const angle = Math.atan2(dy, dx);
      
      // Calcola le linee di estensione
      // Calculate extension lines
      const extDx = this.extensionDistance * Math.sin(angle);
      const extDy = -this.extensionDistance * Math.cos(angle);
      
      // Disegna le linee di estensione
      // Draw extension lines
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(start.x + extDx, start.y + extDy);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(end.x, end.y);
      ctx.lineTo(end.x + extDx, end.y + extDy);
      ctx.stroke();
      
      // Disegna la linea di quota
      // Draw dimension line
      ctx.beginPath();
      ctx.moveTo(start.x + extDx, start.y + extDy);
      ctx.lineTo(end.x + extDx, end.y + extDy);
      ctx.stroke();
      
      // Disegna le frecce
      // Draw arrows
      this.drawArrow(ctx, start.x + extDx, start.y + extDy, angle + Math.PI);
      this.drawArrow(ctx, end.x + extDx, end.y + extDy, angle);
      
      // Disegna il testo
      // Draw text
      const centerX = (start.x + end.x) / 2 + extDx;
      const centerY = (start.y + end.y) / 2 + extDy - 5;
      
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(text, centerX, centerY);
    }
  }
  
  drawAngularDimension(ctx: CanvasRenderingContext2D, center: Point, p1: Point): void {
    // Disegna le linee dal centro ai punti
    // Draw lines from center to points
    ctx.beginPath();
    ctx.moveTo(center.x, center.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.stroke();
    
    if (this.tempPoints.length >= 3) {
      const p2 = this.tempPoints[2];
      
      ctx.beginPath();
      ctx.moveTo(center.x, center.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
      
      // Calcola gli angoli
      // Calculate angles
      const angle1 = Math.atan2(p1.y - center.y, p1.x - center.x);
      const angle2 = Math.atan2(p2.y - center.y, p2.x - center.x);
      
      // Calcola la differenza di angolo
      // Calculate angle difference
      let angleDiff = angle2 - angle1;
      if (angleDiff < 0) angleDiff += Math.PI * 2;
      
      // Calcola il raggio dell'arco
      // Calculate arc radius
      const radius1 = Math.sqrt(
        Math.pow(p1.x - center.x, 2) + Math.pow(p1.y - center.y, 2)
      );
      const radius2 = Math.sqrt(
        Math.pow(p2.x - center.x, 2) + Math.pow(p2.y - center.y, 2)
      );
      const radius = Math.min(radius1, radius2) * 0.7;
      
      // Disegna l'arco tra gli angoli
      // Draw arc between angles
      ctx.beginPath();
      ctx.arc(center.x, center.y, radius, angle1, angle2, false);
      ctx.stroke();
      
      // Disegna le frecce agli estremi dell'arco
      // Draw arrows at arc ends
      this.drawArrow(
        ctx, 
        center.x + radius * Math.cos(angle1), 
        center.y + radius * Math.sin(angle1), 
        angle1 + Math.PI / 2
      );
      
      this.drawArrow(
        ctx, 
        center.x + radius * Math.cos(angle2), 
        center.y + radius * Math.sin(angle2), 
        angle2 - Math.PI / 2
      );
      
      // Calcola e disegna il testo
      // Calculate and draw text
      const midAngle = angle1 + angleDiff / 2;
      const textX = center.x + (radius + 10) * Math.cos(midAngle);
      const textY = center.y + (radius + 10) * Math.sin(midAngle);
      
      // Formatta il testo con il valore dell'angolo
      // Format text with angle value
      const angleValue = angleDiff * 180 / Math.PI;
      const text = this.formatDimensionText(angleValue);
      
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, textX, textY);
    }
  }
  
  drawRadialDimension(ctx: CanvasRenderingContext2D, center: Point, point: Point): void {
    // Disegna la linea dal centro al punto
    // Draw line from center to point
    ctx.beginPath();
    ctx.moveTo(center.x, center.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    
    // Disegna il cerchio
    // Draw circle
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    const radius = Math.sqrt(dx * dx + dy * dy);
    
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Calcola l'angolo per posizionare il testo
    // Calculate angle to position text
    const angle = Math.atan2(dy, dx);
    
    // Disegna il testo della quota
    // Draw dimension text
    const value = radius;
    const text = `R${this.formatDimensionText(value)}`;
    
    const textX = center.x + (radius + 10) * Math.cos(angle);
    const textY = center.y + (radius + 10) * Math.sin(angle);
    
    // Disegna il testo con un rettangolo bianco di sfondo per leggibilità
    // Draw text with white background rectangle for readability
    const textMetrics = ctx.measureText(text);
    const textWidth = textMetrics.width + 4;
    const textHeight = 14;
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillRect(
      textX - textWidth / 2, 
      textY - textHeight / 2, 
      textWidth, 
      textHeight
    );
    
    ctx.fillStyle = this.defaultStyle?.fillColor || '#000000';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, textX, textY);
    
    // Disegna la freccia verso il cerchio
    // Draw arrow toward the circle
    const arrowX = center.x + radius * Math.cos(angle);
    const arrowY = center.y + radius * Math.sin(angle);
    this.drawArrow(ctx, arrowX, arrowY, angle + Math.PI);
  }
  
  drawDiametricalDimension(ctx: CanvasRenderingContext2D, p1: Point, p2: Point): void {
    // Calcola il centro ed il raggio
    // Calculate center and radius
    const centerX = (p1.x + p2.x) / 2;
    const centerY = (p1.y + p2.y) / 2;
    
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const diameter = Math.sqrt(dx * dx + dy * dy);
    const radius = diameter / 2;
    
    // Disegna la linea del diametro
    // Draw diameter line
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
    
    // Disegna il cerchio
    // Draw circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Calcola l'angolo per posizionare il testo
    // Calculate angle to position text
    const angle = Math.atan2(dy, dx);
    
    // Disegna il testo della quota
    // Draw dimension text
    const value = diameter;
    const text = `Ø${this.formatDimensionText(value)}`;
    
    // Posiziona il testo al centro della linea del diametro
    // Position text at the center of diameter line
    const textX = centerX;
    const textY = centerY - 10;
    
    // Disegna il testo con un rettangolo bianco di sfondo per leggibilità
    // Draw text with white background rectangle for readability
    const textMetrics = ctx.measureText(text);
    const textWidth = textMetrics.width + 4;
    const textHeight = 14;
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillRect(
      textX - textWidth / 2, 
      textY - textHeight / 2, 
      textWidth, 
      textHeight
    );
    
    ctx.fillStyle = this.defaultStyle?.fillColor || '#000000';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, textX, textY);
    
    // Disegna le frecce alle estremità
    // Draw arrows at ends
    this.drawArrow(ctx, p1.x, p1.y, angle);
    this.drawArrow(ctx, p2.x, p2.y, angle + Math.PI);
  }
  
  drawArrow(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number): void {
    const arrowSize = 6;
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    
    // Disegna la punta della freccia
    // Draw arrow tip
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-arrowSize, -arrowSize / 2);
    ctx.lineTo(-arrowSize, arrowSize / 2);
    ctx.closePath();
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();
    
    ctx.restore();
  }
}

/**
 * Componente di integrazione React per DimensionTool
 * React integration component for DimensionTool
 */
const DimensionToolComponent: React.FC = () => {
  const toolInstance = useRef<DimensionTool | null>(null);
  const [dimensionType, setDimensionType] = useState<DimensionType>(DimensionType.LINEAR);
  
  useEffect(() => {
    // Crea l'istanza dello strumento
    // Create the tool instance
    if (!toolInstance.current) {
      toolInstance.current = new DimensionTool();
    }
    
    // Imposta il tipo di quota
    // Set dimension type
    if (toolInstance.current && dimensionType) {
      toolInstance.current.setDimensionType(dimensionType);
    }
    
    // Cleanup quando il componente viene smontato
    // Cleanup when component is unmounted
    return () => {
      // Eventuale pulizia
      // Potential cleanup
    };
  }, [dimensionType]);
  
  return null; // Questo componente non renderizza UI propria
};

export default DimensionToolComponent;