// src/components/cad/technical-drawing/core/PolygonTool.ts

import { BaseDrawingTool, ToolsManager } from './ToolsManager';
import { useTechnicalDrawingStore } from '../../technicalDrawingStore';
import { DrawingEntityType, Point } from '../../TechnicalDrawingTypes';

/**
 * Strumento per disegnare poligoni regolari
 */
export class PolygonTool extends BaseDrawingTool {
  private centerPoint: Point | null = null;
  private radiusPoint: Point | null = null;
  private isDrawing: boolean = false;
  private sides: number = 6; // Numero di lati di default
  
  constructor(
    store: ReturnType<typeof useTechnicalDrawingStore>, 
    toolsManager: ToolsManager,
    sides: number = 6
  ) {
    super('polygon', 'Poligono', store, toolsManager);
    this.sides = sides;
  }
  
  onActivate(): void {
    this.reset();
  }
  
  onMouseDown(point: Point, event: MouseEvent): void {
    if (!this.isDrawing) {
      // Centro del poligono
      this.centerPoint = point;
      this.isDrawing = true;
    } else {
      // Punto sul raggio, completa il disegno
      this.radiusPoint = point;
      this.completePolygon();
    }
  }
  
  onMouseMove(point: Point, event: MouseEvent): void {
    if (this.isDrawing) {
      // Aggiorna il punto del raggio per la preview
      this.radiusPoint = point;
    }
  }
  
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      // Annulla l'operazione corrente
      this.reset();
    } else if (event.key === 'Enter' && this.isDrawing && this.centerPoint && this.radiusPoint) {
      // Completa il poligono con Enter
      this.completePolygon();
    } else if (this.isDrawing && !isNaN(parseInt(event.key))) {
      // Cambia il numero di lati con i tasti numerici (minimo 3)
      const newSides = parseInt(event.key);
      if (newSides >= 3) {
        this.sides = newSides;
      }
    } else if (event.key === 'ArrowUp' && this.isDrawing) {
      // Aumenta il numero di lati
      this.sides = Math.min(this.sides + 1, 12);
    } else if (event.key === 'ArrowDown' && this.isDrawing) {
      // Diminuisci il numero di lati
      this.sides = Math.max(this.sides - 1, 3);
    }
  }
  
  renderPreview(ctx: CanvasRenderingContext2D): void {
    if (this.isDrawing && this.centerPoint && this.radiusPoint) {
      // Calcola il raggio
      const dx = this.radiusPoint.x - this.centerPoint.x;
      const dy = this.radiusPoint.y - this.centerPoint.y;
      const radius = Math.sqrt(dx * dx + dy * dy);
      
      // Calcola l'angolo di rotazione
      const angle = Math.atan2(dy, dx);
      
      // Calcola i punti del poligono
      const points = this.calculatePolygonPoints(this.centerPoint, radius, this.sides, angle);
      
      // Disegna l'anteprima del poligono
      ctx.strokeStyle = '#1890ff';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      
      ctx.closePath();
      ctx.stroke();
      
      ctx.setLineDash([]);
      
      // Disegna i punti di controllo
      ctx.fillStyle = '#1890ff';
      ctx.beginPath();
      ctx.arc(this.centerPoint.x, this.centerPoint.y, 4, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(this.radiusPoint.x, this.radiusPoint.y, 4, 0, Math.PI * 2);
      ctx.fill();
      
      // Disegna il cerchio di riferimento
      ctx.strokeStyle = '#1890ff';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      
      ctx.beginPath();
      ctx.arc(this.centerPoint.x, this.centerPoint.y, radius, 0, Math.PI * 2);
      ctx.stroke();
      
      // Disegna la linea del raggio
      ctx.beginPath();
      ctx.moveTo(this.centerPoint.x, this.centerPoint.y);
      ctx.lineTo(this.radiusPoint.x, this.radiusPoint.y);
      ctx.stroke();
      
      ctx.setLineDash([]);
      
      // Mostra il numero di lati
      ctx.font = '12px Arial';
      ctx.fillStyle = '#1890ff';
      ctx.textAlign = 'center';
      ctx.fillText(`Lati: ${this.sides}`, this.centerPoint.x, this.centerPoint.y - radius - 10);
      ctx.fillText(`Raggio: ${radius.toFixed(2)}`, this.centerPoint.x, this.centerPoint.y - radius - 25);
      
      // Istruzioni per l'utente
      ctx.fillText('↑/↓ o tasti numerici per cambiare il numero di lati', this.centerPoint.x, this.centerPoint.y + radius + 20);
    }
  }
  
  reset(): void {
    this.centerPoint = null;
    this.radiusPoint = null;
    this.isDrawing = false;
    this.sides = 6; // Ripristina il valore di default
  }
  
  setSides(sides: number): void {
    if (sides >= 3) {
      this.sides = sides;
    }
  }
  
  private completePolygon(): void {
    if (!this.centerPoint || !this.radiusPoint) return;
    
    // Calcola il raggio
    const dx = this.radiusPoint.x - this.centerPoint.x;
    const dy = this.radiusPoint.y - this.centerPoint.y;
    const radius = Math.sqrt(dx * dx + dy * dy);
    
    // Calcola l'angolo di rotazione
    const angle = Math.atan2(dy, dx);
    
    // Crea la nuova entità poligono
    this.store.addEntity({
      type: DrawingEntityType.POLYGON,
      layer: this.store.activeLayer,
      center: this.centerPoint,
      radius,
      sides: this.sides,
      rotation: angle * 180 / Math.PI, // Converti radianti in gradi
      style: {
        strokeColor: '#000000',
        strokeWidth: 1,
        strokeStyle: 'solid',
        fillColor: 'none'
      }
    });
    
    // Resetta lo stato per un nuovo disegno
    this.reset();
  }
  
  /**
   * Calcola i punti di un poligono regolare
   */
  private calculatePolygonPoints(center: Point, radius: number, sides: number, startAngle: number = 0): Point[] {
    const points: Point[] = [];
    const angleStep = (Math.PI * 2) / sides;
    
    for (let i = 0; i < sides; i++) {
      const angle = startAngle + i * angleStep;
      points.push({
        x: center.x + radius * Math.cos(angle),
        y: center.y + radius * Math.sin(angle)
      });
    }
    
    return points;
  }
}