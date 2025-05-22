// src/components/cad/technical-drawing/core/ToolsManager.ts

import { createSnapManager, SnapManager } from './SnapManager';
import { useTechnicalDrawingStore } from '../technicalDrawingStore';
import { Point, DrawingEntityType, DimensionType, AnnotationType } from '../TechnicalDrawingTypes';

/**
 * Interfaccia base per tutti gli strumenti di disegno
 */
export interface DrawingTool {
  id: string;
  name: string;
  shortcut?: string;
  icon?: string;
  cursor?: string;
  
  // Metodi di gestione eventi
  onActivate: () => void;
  onDeactivate: () => void;
  onMouseDown: (point: Point, event: MouseEvent) => void;
  onMouseMove: (point: Point, event: MouseEvent) => void;
  onMouseUp: (point: Point, event: MouseEvent) => void;
  onKeyDown: (event: KeyboardEvent) => void;
  onKeyUp: (event: KeyboardEvent) => void;
  
  // Metodo di rendering per preview
  renderPreview?: (ctx: CanvasRenderingContext2D) => void;
  
  // Ripulisce lo stato dello strumento
  reset: () => void;
}

/**
 * Gestore degli strumenti di disegno
 */
export class ToolsManager {
  private tools: Map<string, DrawingTool> = new Map();
  private activeTool: DrawingTool | null = null;
  private store: ReturnType<typeof useTechnicalDrawingStore>;
  private snapManager: SnapManager;
  
  // Stato di input
  private isMouseDown: boolean = false;
  private lastMousePosition: Point = { x: 0, y: 0 };
  private pressedKeys: Set<string> = new Set();
  
  constructor(store: ReturnType<typeof useTechnicalDrawingStore>) {
    this.store = store;
    
    // Inizializza lo snap manager
    this.snapManager = createSnapManager({
      entities: this.store.entities,
      dimensions: this.store.dimensions,
      annotations: this.store.annotations,
      gridSize: this.store.gridSize,
      snapRadius: 10,
      snapOptions: {
        endpoint: true,
        midpoint: true,
        center: true,
        quadrant: true,
        intersection: true,
        grid: true,
        nearest: false,
        perpendicular: false,
        tangent: false,
        extension: false,
        parallel: false,
        polar: false
      }
    });
  }
  
  /**
   * Registra un nuovo strumento
   */
  public registerTool(tool: DrawingTool): void {
    if (this.tools.has(tool.id)) {
      console.warn(`Lo strumento "${tool.id}" è già registrato e sarà sovrascritto.`);
    }
    
    this.tools.set(tool.id, tool);
  }
  
  /**
   * Imposta lo strumento attivo
   */
  public setActiveTool(toolId: string): boolean {
    if (!this.tools.has(toolId)) {
      console.warn(`Strumento "${toolId}" non trovato.`);
      return false;
    }
    
    // Disattiva lo strumento corrente
    if (this.activeTool) {
      this.activeTool.onDeactivate();
    }
    
    // Attiva il nuovo strumento
    this.activeTool = this.tools.get(toolId)!;
    this.activeTool.onActivate();
    
    // Aggiorna il toolId nello store
    this.store.setActiveTool(toolId);
    
    return true;
  }
  
  /**
   * Ottiene lo strumento attualmente attivo
   */
  public getActiveTool(): DrawingTool | null {
    return this.activeTool;
  }
  
  /**
   * Ottiene tutti gli strumenti registrati
   */
  public getAllTools(): DrawingTool[] {
    return Array.from(this.tools.values());
  }
  
  /**
   * Gestisce l'evento mousedown sul canvas
   */
  public handleMouseDown(point: Point, event: MouseEvent): void {
    this.isMouseDown = true;
    this.lastMousePosition = point;
    
    // Aggiorna il punto con il miglior punto di snap, se disponibile
    let finalPoint = point;
    
    if (this.store.snappingEnabled) {
      const bestSnapPoint = this.snapManager.findBestSnapPoint(point);
      if (bestSnapPoint) {
        finalPoint = { x: bestSnapPoint.x, y: bestSnapPoint.y };
      }
    }
    
    // Delega allo strumento attivo
    if (this.activeTool) {
      this.activeTool.onMouseDown(finalPoint, event);
    }
  }
  
  /**
   * Gestisce l'evento mousemove sul canvas
   */
  public handleMouseMove(point: Point, event: MouseEvent): void {
    this.lastMousePosition = point;
    
    // Aggiorna il punto con il miglior punto di snap, se disponibile
    let finalPoint = point;
    
    if (this.store.snappingEnabled) {
      const bestSnapPoint = this.snapManager.findBestSnapPoint(point);
      if (bestSnapPoint) {
        finalPoint = { x: bestSnapPoint.x, y: bestSnapPoint.y };
      }
    }
    
    // Delega allo strumento attivo
    if (this.activeTool) {
      this.activeTool.onMouseMove(finalPoint, event);
    }
  }
  
  /**
   * Gestisce l'evento mouseup sul canvas
   */
  public handleMouseUp(point: Point, event: MouseEvent): void {
    this.isMouseDown = false;
    
    // Aggiorna il punto con il miglior punto di snap, se disponibile
    let finalPoint = point;
    
    if (this.store.snappingEnabled) {
      const bestSnapPoint = this.snapManager.findBestSnapPoint(point);
      if (bestSnapPoint) {
        finalPoint = { x: bestSnapPoint.x, y: bestSnapPoint.y };
      }
    }
    
    // Delega allo strumento attivo
    if (this.activeTool) {
      this.activeTool.onMouseUp(finalPoint, event);
    }
  }
  
  /**
   * Gestisce l'evento keydown
   */
  public handleKeyDown(event: KeyboardEvent): void {
    this.pressedKeys.add(event.key);
    
    // Gestisci scorciatoie da tastiera per il cambio strumento
    if (event.ctrlKey || event.metaKey) {
      // Ctrl+... shortcuts
    }
    
    // Gestisci Escape per cancellare l'operazione corrente
    if (event.key === 'Escape') {
      if (this.activeTool) {
        this.activeTool.reset();
      }
    }
    
    // Delega allo strumento attivo
    if (this.activeTool) {
      this.activeTool.onKeyDown(event);
    }
  }
  
  /**
   * Gestisce l'evento keyup
   */
  public handleKeyUp(event: KeyboardEvent): void {
    this.pressedKeys.delete(event.key);
    
    // Delega allo strumento attivo
    if (this.activeTool) {
      this.activeTool.onKeyUp(event);
    }
  }
  
  /**
   * Disegna l'anteprima dello strumento attivo
   */
  public renderPreview(ctx: CanvasRenderingContext2D): void {
    if (this.activeTool && this.activeTool.renderPreview) {
      this.activeTool.renderPreview(ctx);
    }
  }
  
  /**
   * Verifica se un tasto è premuto
   */
  public isKeyPressed(key: string): boolean {
    return this.pressedKeys.has(key);
  }
  
  /**
   * Ottiene la posizione corrente del mouse
   */
  public getCurrentMousePosition(): Point {
    return { ...this.lastMousePosition };
  }
  
  /**
   * Ottiene lo stato di mousedown
   */
  public isMouseButtonDown(): boolean {
    return this.isMouseDown;
  }
  
  /**
   * Aggiorna lo snap manager con lo stato corrente
   */
  public updateSnapManager(): void {
    this.snapManager.updateParams({
      entities: this.store.entities,
      dimensions: this.store.dimensions,
      annotations: this.store.annotations,
      gridSize: this.store.gridSize,
      snapOptions: {
        endpoint: this.store.objectSnap.endpoint,
        midpoint: this.store.objectSnap.midpoint,
        center: this.store.objectSnap.center,
        quadrant: this.store.objectSnap.quadrant || false,
        intersection: this.store.objectSnap.intersection,
        grid: this.store.gridEnabled,
        nearest: this.store.objectSnap.nearest || false,
        perpendicular: false,
        tangent: false,
        extension: false,
        parallel: false,
        polar: this.store.polarTracking
      }
    });
  }
  
  /**
   * Ottiene lo snap manager
   */
  public getSnapManager(): SnapManager {
    return this.snapManager;
  }
}

/**
 * Implementazione base per gli strumenti di disegno
 */
export abstract class BaseDrawingTool implements DrawingTool {
  id: string;
  name: string;
  shortcut?: string;
  icon?: string;
  cursor: string = 'crosshair';
  
  protected store: ReturnType<typeof useTechnicalDrawingStore>;
  protected toolsManager: ToolsManager;
  
  constructor(id: string, name: string, store: ReturnType<typeof useTechnicalDrawingStore>, toolsManager: ToolsManager) {
    this.id = id;
    this.name = name;
    this.store = store;
    this.toolsManager = toolsManager;
  }
  
  onActivate(): void {
    // Da sovrascrivere nelle classi figlie
  }
  
  onDeactivate(): void {
    // Da sovrascrivere nelle classi figlie
  }
  
  onMouseDown(point: Point, event: MouseEvent): void {
    // Da sovrascrivere nelle classi figlie
  }
  
  onMouseMove(point: Point, event: MouseEvent): void {
    // Da sovrascrivere nelle classi figlie
  }
  
  onMouseUp(point: Point, event: MouseEvent): void {
    // Da sovrascrivere nelle classi figlie
  }
  
  onKeyDown(event: KeyboardEvent): void {
    // Da sovrascrivere nelle classi figlie
  }
  
  onKeyUp(event: KeyboardEvent): void {
    // Da sovrascrivere nelle classi figlie
  }
  
  renderPreview?(ctx: CanvasRenderingContext2D): void {
    // Da sovrascrivere nelle classi figlie
  }
  
  reset(): void {
    // Da sovrascrivere nelle classi figlie
  }
  
  protected getSnapPoint(point: Point): Point {
    if (!this.store.snappingEnabled) {
      return point;
    }
    
    const snapManager = this.toolsManager.getSnapManager();
    const bestSnapPoint = snapManager.findBestSnapPoint(point);
    
    if (bestSnapPoint) {
      return { x: bestSnapPoint.x, y: bestSnapPoint.y };
    }
    
    return point;
  }
}

/**
 * Strumento Select
 */
export class SelectTool extends BaseDrawingTool {
  private selectionStart: Point | null = null;
  private selectionBox: { x: number, y: number, width: number, height: number } | null = null;
  private isDragging: boolean = false;
  private draggedEntityIds: string[] = [];
  private lastDragPoint: Point | null = null;
  
  constructor(store: ReturnType<typeof useTechnicalDrawingStore>, toolsManager: ToolsManager) {
    super('select', 'Seleziona', store, toolsManager);
    this.cursor = 'default';
  }
  
  onActivate(): void {
    this.reset();
  }
  
  onMouseDown(point: Point, event: MouseEvent): void {
    this.selectionStart = point;
    this.selectionBox = null;
    
    // Verifica se il click è su un'entità
    const entityId = this.hitTest(point);
    
    if (entityId) {
      // Se l'entità non è già selezionata, selezionala
      if (!this.store.selectedEntityIds.includes(entityId)) {
        this.store.selectEntity(entityId, event.shiftKey);
      }
      
      // Prepara per il drag & drop
      this.isDragging = true;
      this.draggedEntityIds = [...this.store.selectedEntityIds];
      this.lastDragPoint = point;
    } else {
      // Click su un'area vuota, inizia selezione rettangolare
      if (!event.shiftKey) {
        this.store.clearSelection();
      }
    }
  }
  
  onMouseMove(point: Point, event: MouseEvent): void {
    if (this.isDragging && this.lastDragPoint) {
      // Calcola l'offset per il drag
      const dx = point.x - this.lastDragPoint.x;
      const dy = point.y - this.lastDragPoint.y;
      
      if (dx !== 0 || dy !== 0) {
        this.store.moveEntities(this.draggedEntityIds, { x: dx, y: dy });
        this.lastDragPoint = point;
      }
    } else if (this.selectionStart) {
      // Aggiorna il rettangolo di selezione
      this.selectionBox = {
        x: Math.min(this.selectionStart.x, point.x),
        y: Math.min(this.selectionStart.y, point.y),
        width: Math.abs(point.x - this.selectionStart.x),
        height: Math.abs(point.y - this.selectionStart.y)
      };
    }
  }
  
  onMouseUp(point: Point, event: MouseEvent): void {
    if (this.isDragging) {
      // Fine del drag
      this.isDragging = false;
      this.draggedEntityIds = [];
      this.lastDragPoint = null;
    } else if (this.selectionBox && this.selectionBox.width > 3 && this.selectionBox.height > 3) {
      // Selezione rettangolare completata, trova entità nel rettangolo
      this.selectEntitiesInBox(this.selectionBox, event.shiftKey);
    } else if (this.selectionStart && 
               Math.abs(point.x - this.selectionStart.x) < 3 && 
               Math.abs(point.y - this.selectionStart.y) < 3) {
      // È un click semplice, gestito in onMouseDown
    }
    
    this.selectionStart = null;
    this.selectionBox = null;
  }
  
  renderPreview(ctx: CanvasRenderingContext2D): void {
    if (this.selectionBox) {
      // Disegna il rettangolo di selezione
      ctx.strokeStyle = '#1890ff';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(
        this.selectionBox.x, 
        this.selectionBox.y, 
        this.selectionBox.width, 
        this.selectionBox.height
      );
      ctx.setLineDash([]);
      
      // Riempimento semitrasparente
      ctx.fillStyle = 'rgba(24, 144, 255, 0.1)';
      ctx.fillRect(
        this.selectionBox.x, 
        this.selectionBox.y, 
        this.selectionBox.width, 
        this.selectionBox.height
      );
    }
  }
  
  reset(): void {
    this.selectionStart = null;
    this.selectionBox = null;
    this.isDragging = false;
    this.draggedEntityIds = [];
    this.lastDragPoint = null;
  }
  
  private hitTest(point: Point): string | null {
    // Versione semplificata del hit testing
    // In un'implementazione reale, dovresti implementare un algoritmo più robusto
    // che controlli correttamente l'intersezione con ogni tipo di entità
    
    // Ottieni tutte le entità
    const allEntities = [
      ...Object.entries(this.store.entities),
      ...Object.entries(this.store.dimensions),
      ...Object.entries(this.store.annotations)
    ];
    
    // Verifica l'hit per ogni entità
    for (const [id, entity] of allEntities) {
      if (!entity.visible) continue;
      
      let hit = false;
      
      switch (entity.type) {
        case 'line':
          // Hit test semplificato per una linea
          const line = entity as any;
          hit = this.pointToLineDistance(
            point, 
            line.startPoint, 
            line.endPoint
          ) < 5;
          break;
          
        case 'circle':
          // Hit test per un cerchio
          const circle = entity as any;
          const dx = point.x - circle.center.x;
          const dy = point.y - circle.center.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          hit = Math.abs(distance - circle.radius) < 5;
          break;
          
        case 'rectangle':
          // Hit test per un rettangolo
          const rect = entity as any;
          hit = point.x >= rect.position.x && 
                point.x <= rect.position.x + rect.width &&
                point.y >= rect.position.y && 
                point.y <= rect.position.y + rect.height;
          break;
          
        // Altri tipi di entità...
      }
      
      if (hit) {
        return id;
      }
    }
    
    return null;
  }
  
  private pointToLineDistance(point: Point, lineStart: Point, lineEnd: Point): number {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;
    
    const dot = A * C + B * D;
    const len_sq = C * C + D * D;
    let param = -1;
    
    if (len_sq !== 0) {
      param = dot / len_sq;
    }
    
    let xx, yy;
    
    if (param < 0) {
      xx = lineStart.x;
      yy = lineStart.y;
    } else if (param > 1) {
      xx = lineEnd.x;
      yy = lineEnd.y;
    } else {
      xx = lineStart.x + param * C;
      yy = lineStart.y + param * D;
    }
    
    const dx = point.x - xx;
    const dy = point.y - yy;
    
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  private selectEntitiesInBox(box: { x: number, y: number, width: number, height: number }, addToSelection: boolean): void {
    if (!addToSelection) {
      this.store.clearSelection();
    }
    
    // Ottieni tutte le entità
    const allEntities = [
      ...Object.entries(this.store.entities),
      ...Object.entries(this.store.dimensions),
      ...Object.entries(this.store.annotations)
    ];
    
    // Seleziona le entità che intersecano il box
    for (const [id, entity] of allEntities) {
      if (!entity.visible) continue;
      
      let inBox = false;
      
      switch (entity.type) {
        case 'line':
          // Verifica se la linea interseca il box
          const line = entity as any;
          inBox = this.lineIntersectsBox(line.startPoint, line.endPoint, box);
          break;
          
        case 'circle':
          // Verifica se il cerchio interseca il box
          const circle = entity as any;
          inBox = this.circleIntersectsBox(circle.center, circle.radius, box);
          break;
          
        case 'rectangle':
          // Verifica se il rettangolo interseca il box
          const rect = entity as any;
          inBox = this.rectangleIntersectsBox(
            { x: rect.position.x, y: rect.position.y, width: rect.width, height: rect.height },
            box
          );
          break;
          
        // Altri tipi di entità...
      }
      
      if (inBox) {
        this.store.selectEntity(id, true);
      }
    }
  }
  
  private lineIntersectsBox(p1: Point, p2: Point, box: { x: number, y: number, width: number, height: number }): boolean {
    // Verifica se uno dei punti finali è all'interno del box
    const p1InBox = p1.x >= box.x && p1.x <= box.x + box.width && 
                    p1.y >= box.y && p1.y <= box.y + box.height;
                    
    const p2InBox = p2.x >= box.x && p2.x <= box.x + box.width && 
                    p2.y >= box.y && p2.y <= box.y + box.height;
    
    if (p1InBox || p2InBox) {
      return true;
    }
    
    // Verifica se la linea interseca uno dei lati del box
    const boxLines = [
      { p1: { x: box.x, y: box.y }, p2: { x: box.x + box.width, y: box.y } },
      { p1: { x: box.x + box.width, y: box.y }, p2: { x: box.x + box.width, y: box.y + box.height } },
      { p1: { x: box.x + box.width, y: box.y + box.height }, p2: { x: box.x, y: box.y + box.height } },
      { p1: { x: box.x, y: box.y + box.height }, p2: { x: box.x, y: box.y } }
    ];
    
    for (const boxLine of boxLines) {
      if (this.linesIntersect(p1, p2, boxLine.p1, boxLine.p2)) {
        return true;
      }
    }
    
    return false;
  }
  
  private linesIntersect(p1: Point, p2: Point, p3: Point, p4: Point): boolean {
    // Implementazione dell'algoritmo di intersezione tra due segmenti di linea
    const d1x = p2.x - p1.x;
    const d1y = p2.y - p1.y;
    const d2x = p4.x - p3.x;
    const d2y = p4.y - p3.y;
    
    const determinant = d1x * d2y - d1y * d2x;
    
    if (determinant === 0) {
      return false; // Linee parallele
    }
    
    const dx = p3.x - p1.x;
    const dy = p3.y - p1.y;
    
    const t1 = (dx * d2y - dy * d2x) / determinant;
    const t2 = (dx * d1y - dy * d1x) / determinant;
    
    return t1 >= 0 && t1 <= 1 && t2 >= 0 && t2 <= 1;
  }
  
  private circleIntersectsBox(center: Point, radius: number, box: { x: number, y: number, width: number, height: number }): boolean {
    // Find the closest point to the circle within the rectangle
    const closestX = Math.max(box.x, Math.min(center.x, box.x + box.width));
    const closestY = Math.max(box.y, Math.min(center.y, box.y + box.height));
    
    // Calculate the distance between the circle's center and this closest point
    const distanceX = center.x - closestX;
    const distanceY = center.y - closestY;
    
    // If the distance is less than the circle's radius, an intersection occurs
    const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);
    return distanceSquared <= (radius * radius);
  }
  
  private rectangleIntersectsBox(rect1: { x: number, y: number, width: number, height: number }, 
                                rect2: { x: number, y: number, width: number, height: number }): boolean {
    // Verifica se un rettangolo interseca l'altro
    return !(rect2.x > rect1.x + rect1.width || 
           rect2.x + rect2.width < rect1.x || 
           rect2.y > rect1.y + rect1.height ||
           rect2.y + rect2.height < rect1.y);
  }
}

/**
 * Strumento LineTool
 */
export class LineTool extends BaseDrawingTool {
  private startPoint: Point | null = null;
  private endPoint: Point | null = null;
  private isDrawing: boolean = false;
  
  constructor(store: ReturnType<typeof useTechnicalDrawingStore>, toolsManager: ToolsManager) {
    super('line', 'Linea', store, toolsManager);
  }
  
  onActivate(): void {
    this.reset();
  }
  
  onMouseDown(point: Point, event: MouseEvent): void {
    if (!this.isDrawing) {
      // Primo punto della linea
      this.startPoint = point;
      this.isDrawing = true;
    } else {
      // Secondo punto della linea, completa il disegno
      this.endPoint = point;
      this.completeLine();
    }
  }
  
  onMouseMove(point: Point, event: MouseEvent): void {
    if (this.isDrawing) {
      // Aggiorna il punto finale per la preview
      this.endPoint = point;
    }
  }
  
  onMouseUp(point: Point, event: MouseEvent): void {
    // Nessuna azione particolare qui, gestiamo il disegno in onMouseDown
  }
  
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      // Annulla l'operazione corrente
      this.reset();
    } else if (event.key === 'Enter' && this.isDrawing && this.startPoint && this.endPoint) {
      // Completa la linea con Enter
      this.completeLine();
    }
  }
  
  renderPreview(ctx: CanvasRenderingContext2D): void {
    if (this.isDrawing && this.startPoint && this.endPoint) {
      // Disegna l'anteprima della linea
      ctx.strokeStyle = '#1890ff';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      
      ctx.beginPath();
      ctx.moveTo(this.startPoint.x, this.startPoint.y);
      ctx.lineTo(this.endPoint.x, this.endPoint.y);
      ctx.stroke();
      
      ctx.setLineDash([]);
      
      // Disegna i punti di controllo
      ctx.fillStyle = '#1890ff';
      ctx.beginPath();
      ctx.arc(this.startPoint.x, this.startPoint.y, 4, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(this.endPoint.x, this.endPoint.y, 4, 0, Math.PI * 2);
      ctx.fill();
      
      // Mostra la lunghezza
      const dx = this.endPoint.x - this.startPoint.x;
      const dy = this.endPoint.y - this.startPoint.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      
      const midX = (this.startPoint.x + this.endPoint.x) / 2;
      const midY = (this.startPoint.y + this.endPoint.y) / 2;
      
      ctx.font = '12px Arial';
      ctx.fillStyle = '#1890ff';
      ctx.textAlign = 'center';
      ctx.fillText(`${length.toFixed(2)}`, midX, midY - 10);
    }
  }
  
  reset(): void {
    this.startPoint = null;
    this.endPoint = null;
    this.isDrawing = false;
  }
  
  private completeLine(): void {
    if (!this.startPoint || !this.endPoint) return;
    
    // Crea la nuova entità linea
    this.store.addEntity({
      type: DrawingEntityType.LINE,
      layer: this.store.activeLayer,
      startPoint: this.startPoint,
      endPoint: this.endPoint,
      style: {
        strokeColor: '#000000',
        strokeWidth: 1,
        strokeStyle: 'solid'
      }
    });
    
    // Resetta lo stato per un nuovo disegno
    this.reset();
  }
}

/**
 * Strumento CircleTool
 */
export class CircleTool extends BaseDrawingTool {
  private centerPoint: Point | null = null;
  private radiusPoint: Point | null = null;
  private isDrawing: boolean = false;
  
  constructor(store: ReturnType<typeof useTechnicalDrawingStore>, toolsManager: ToolsManager) {
    super('circle', 'Cerchio', store, toolsManager);
  }
  
  onActivate(): void {
    this.reset();
  }
  
  onMouseDown(point: Point, event: MouseEvent): void {
    if (!this.isDrawing) {
      // Centro del cerchio
      this.centerPoint = point;
      this.isDrawing = true;
    } else {
      // Punto sul raggio, completa il disegno
      this.radiusPoint = point;
      this.completeCircle();
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
      // Completa il cerchio con Enter
      this.completeCircle();
    }
  }
  
  renderPreview(ctx: CanvasRenderingContext2D): void {
    if (this.isDrawing && this.centerPoint && this.radiusPoint) {
      // Calcola il raggio
      const dx = this.radiusPoint.x - this.centerPoint.x;
      const dy = this.radiusPoint.y - this.centerPoint.y;
      const radius = Math.sqrt(dx * dx + dy * dy);
      
      // Disegna l'anteprima del cerchio
      ctx.strokeStyle = '#1890ff';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      
      ctx.beginPath();
      ctx.arc(this.centerPoint.x, this.centerPoint.y, radius, 0, Math.PI * 2);
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
      
      // Disegna la linea del raggio
      ctx.strokeStyle = '#1890ff';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      
      ctx.beginPath();
      ctx.moveTo(this.centerPoint.x, this.centerPoint.y);
      ctx.lineTo(this.radiusPoint.x, this.radiusPoint.y);
      ctx.stroke();
      
      ctx.setLineDash([]);
      
      // Mostra il raggio e il diametro
      ctx.font = '12px Arial';
      ctx.fillStyle = '#1890ff';
      ctx.textAlign = 'center';
      
      // Raggio
      const midX = (this.centerPoint.x + this.radiusPoint.x) / 2;
      const midY = (this.centerPoint.y + this.radiusPoint.y) / 2;
      ctx.fillText(`R=${radius.toFixed(2)}`, midX, midY - 5);
      
      // Diametro
      ctx.fillText(`Ø=${(radius * 2).toFixed(2)}`, this.centerPoint.x, this.centerPoint.y - radius - 10);
    }
  }
  
  reset(): void {
    this.centerPoint = null;
    this.radiusPoint = null;
    this.isDrawing = false;
  }
  
  private completeCircle(): void {
    if (!this.centerPoint || !this.radiusPoint) return;
    
    // Calcola il raggio
    const dx = this.radiusPoint.x - this.centerPoint.x;
    const dy = this.radiusPoint.y - this.centerPoint.y;
    const radius = Math.sqrt(dx * dx + dy * dy);
    
    // Crea la nuova entità cerchio
    this.store.addEntity({
      type: DrawingEntityType.CIRCLE,
      layer: this.store.activeLayer,
      center: this.centerPoint,
      radius,
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
}

/**
 * Factory per creare un'istanza di ToolsManager con strumenti di base
 */
export function createToolsManager(store: ReturnType<typeof useTechnicalDrawingStore>): ToolsManager {
  const toolsManager = new ToolsManager(store);
  
  // Registra gli strumenti di base
  toolsManager.registerTool(new SelectTool(store, toolsManager));
  toolsManager.registerTool(new LineTool(store, toolsManager));
  toolsManager.registerTool(new CircleTool(store, toolsManager));
  
  // Imposta lo strumento di selezione come default
  toolsManager.setActiveTool('select');
  
  return toolsManager;
}