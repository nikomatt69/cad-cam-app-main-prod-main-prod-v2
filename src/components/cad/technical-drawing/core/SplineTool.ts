// src/components/cad/technical-drawing/core/SplineTool.ts

import { BaseDrawingTool, ToolsManager } from './ToolsManager';
import { useTechnicalDrawingStore } from '../../technicalDrawingStore';
import { DrawingEntityType, Point } from '../../TechnicalDrawingTypes';

/**
 * Strumento per disegnare curve spline
 */
export class SplineTool extends BaseDrawingTool {
  private points: Point[] = [];
  private tempPoint: Point | null = null;
  private isDrawing: boolean = false;
  private isClosed: boolean = false;
  
  constructor(store: ReturnType<typeof useTechnicalDrawingStore>, toolsManager: ToolsManager) {
    super('spline', 'Spline', store, toolsManager);
  }
  
  onActivate(): void {
    this.reset();
  }
  
  onMouseDown(point: Point, event: MouseEvent): void {
    if (!this.isDrawing || this.points.length === 0) {
      // Primo punto, inizia a disegnare
      this.points = [point];
      this.isDrawing = true;
    } else {
      // Aggiungi un nuovo punto
      this.points.push(point);
    }
  }
  
  onMouseMove(point: Point, event: MouseEvent): void {
    if (this.isDrawing) {
      // Aggiorna il punto temporaneo per la preview
      this.tempPoint = point;
    }
  }
  
  onMouseUp(point: Point, event: MouseEvent): void {
    // Nessuna azione particolare qui, gestiamo l'aggiunta di punti in onMouseDown
  }
  
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      if (this.points.length > 0) {
        // Se ci sono punti, cancella l'ultimo punto
        this.points.pop();
        
        if (this.points.length === 0) {
          this.reset();
        }
      } else {
        // Altrimenti annulla l'operazione
        this.reset();
      }
    } else if (event.key === 'Enter' && this.isDrawing && this.points.length >= 2) {
      // Completa la spline
      this.completeSpline();
    } else if (event.key === 'Backspace' && this.points.length > 0) {
      // Cancella l'ultimo punto
      this.points.pop();
    } else if (event.key === 'c' && this.isDrawing && this.points.length >= 3) {
      // Chiudi la spline
      this.isClosed = !this.isClosed;
    }
  }
  
  renderPreview(ctx: CanvasRenderingContext2D): void {
    if (this.isDrawing && this.points.length > 0) {
      // Prepara array dei punti di controllo includendo il punto temporaneo
      const previewPoints = [...this.points];
      
      if (this.tempPoint) {
        // Aggiungi il punto temporaneo solo per la preview
        previewPoints.push(this.tempPoint);
      }
      
      // Disegna i punti di controllo
      ctx.fillStyle = '#1890ff';
      
      previewPoints.forEach((point, index) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Etichetta per i punti
        ctx.font = '10px Arial';
        ctx.fillText(`${index + 1}`, point.x + 6, point.y - 6);
      });
      
      // Disegna linee di connessione tra i punti
      ctx.strokeStyle = '#666666';
      ctx.lineWidth = 0.5;
      ctx.setLineDash([3, 3]);
      
      ctx.beginPath();
      ctx.moveTo(previewPoints[0].x, previewPoints[0].y);
      
      for (let i = 1; i < previewPoints.length; i++) {
        ctx.lineTo(previewPoints[i].x, previewPoints[i].y);
      }
      
      // Chiudi il percorso se richiesto
      if (this.isClosed && previewPoints.length > 2) {
        ctx.lineTo(previewPoints[0].x, previewPoints[0].y);
      }
      
      ctx.stroke();
      
      // Disegna la curva spline
      ctx.strokeStyle = '#1890ff';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      
      // Calcola e disegna la spline
      if (previewPoints.length >= 2) {
        this.drawSpline(ctx, previewPoints, this.isClosed);
      }
      
      // Mostra istruzioni
      ctx.font = '12px Arial';
      ctx.fillStyle = '#1890ff';
      ctx.textAlign = 'left';
      ctx.fillText('Click: aggiungi punto', 10, 20);
      ctx.fillText('Enter: termina', 10, 40);
      ctx.fillText('Backspace: cancella ultimo punto', 10, 60);
      ctx.fillText('C: chiudi/apri curva', 10, 80);
    }
  }
  
  reset(): void {
    this.points = [];
    this.tempPoint = null;
    this.isDrawing = false;
    this.isClosed = false;
  }
  
  private completeSpline(): void {
    if (!this.isDrawing || this.points.length < 2) return;
    
    // Calcola i punti di controllo
    // In un'implementazione reale, potresti voler calcolare i punti di controllo
    // in modo più sofisticato per ottenere curve più fluide
    const controlPoints = this.calculateControlPoints(this.points);
    
    // Crea la nuova entità spline
    this.store.addEntity({
      type: DrawingEntityType.SPLINE,
      layer: this.store.activeLayer,
      points: [...this.points],
      controlPoints: controlPoints,
      closed: this.isClosed,
      style: {
        strokeColor: '#000000',
        strokeWidth: 1,
        strokeStyle: 'solid',
        fillColor: this.isClosed ? 'none' : undefined
      }
    });
    
    // Resetta lo stato per un nuovo disegno
    this.reset();
  }
  
  /**
   * Calcola i punti di controllo per la curva spline
   * Questo è un approccio semplificato, per una spline più sofisticata
   * potresti voler utilizzare algoritmi come Catmull-Rom o B-Spline
   */
  private calculateControlPoints(points: Point[]): Point[] {
    if (points.length < 2) return [];
    
    const controlPoints: Point[] = [];
    
    // Per ogni segmento di linea tra due punti, calcoliamo due punti di controllo
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = i > 0 ? points[i - 1] : points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = i < points.length - 2 ? points[i + 2] : p2;
      
      // Punto di controllo 1 per il segmento corrente
      controlPoints.push({
        x: p1.x + (p2.x - p0.x) / 6,
        y: p1.y + (p2.y - p0.y) / 6
      });
      
      // Punto di controllo 2 per il segmento corrente
      controlPoints.push({
        x: p2.x - (p3.x - p1.x) / 6,
        y: p2.y - (p3.y - p1.y) / 6
      });
    }
    
    // Per spline chiusa, aggiungi punti di controllo per il segmento finale
    if (this.isClosed && points.length > 2) {
      const p0 = points[points.length - 2];
      const p1 = points[points.length - 1];
      const p2 = points[0];
      const p3 = points[1];
      
      // Punto di controllo 1 per il segmento finale
      controlPoints.push({
        x: p1.x + (p2.x - p0.x) / 6,
        y: p1.y + (p2.y - p0.y) / 6
      });
      
      // Punto di controllo 2 per il segmento finale
      controlPoints.push({
        x: p2.x - (p3.x - p1.x) / 6,
        y: p2.y - (p3.y - p1.y) / 6
      });
    }
    
    return controlPoints;
  }
  
  /**
   * Disegna una curva spline utilizzando curve di Bezier
   */
  private drawSpline(ctx: CanvasRenderingContext2D, points: Point[], closed: boolean): void {
    if (points.length < 2) return;
    
    const controlPoints = this.calculateControlPoints(points);
    
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    
    // Disegna ciascun segmento con curve di Bezier cubiche
    for (let i = 0; i < points.length - 1; i++) {
      const cp1 = controlPoints[i * 2];
      const cp2 = controlPoints[i * 2 + 1];
      const p2 = points[i + 1];
      
      ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, p2.x, p2.y);
    }
    
    // Chiudi la spline se richiesto
    if (closed && points.length > 2) {
      const cp1 = controlPoints[controlPoints.length - 2];
      const cp2 = controlPoints[controlPoints.length - 1];
      
      ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, points[0].x, points[0].y);
      ctx.closePath();
    }
    
    ctx.stroke();
  }
}