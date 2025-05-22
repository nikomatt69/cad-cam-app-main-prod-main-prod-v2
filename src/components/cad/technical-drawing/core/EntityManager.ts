// src/components/cad/technical-drawing/core/EntityManager.ts

import { v4 as uuidv4 } from 'uuid';
import { 
  AnyEntity, 
  DrawingEntity, 
  Dimension, 
  Annotation,
  Point,
  LineEntity,
  CircleEntity,
  RectangleEntity,
  EllipseEntity,
  ArcEntity,
  PolylineEntity,
  SplineEntity,
  TextAnnotation,
  LinearDimension
} from '../../TechnicalDrawingTypes';

// Tipi per operazioni sulle entità
export type EntityUpdateFn = (entity: AnyEntity) => Partial<AnyEntity>;
export type EntityFilterFn = (entity: AnyEntity) => boolean;
export type EntityTransformFn = (point: Point) => Point;

/**
 * Gestore completo delle entità di disegno
 */
export class EntityManager {
  private entities: Record<string, DrawingEntity> = {};
  private dimensions: Record<string, Dimension> = {};
  private annotations: Record<string, Annotation> = {};
  private selectedEntityIds: string[] = [];
  
  // Hooks per notificare cambiamenti
  private onChangeCallbacks: (() => void)[] = [];

  /**
   * Aggiunge un callback da chiamare quando le entità cambiano
   */
  public addChangeListener(callback: () => void): void {
    this.onChangeCallbacks.push(callback);
  }

  /**
   * Rimuove un callback
   */
  public removeChangeListener(callback: () => void): void {
    this.onChangeCallbacks = this.onChangeCallbacks.filter(cb => cb !== callback);
  }

  /**
   * Notifica tutti i listeners di un cambiamento
   */
  private notifyChange(): void {
    this.onChangeCallbacks.forEach(callback => callback());
  }

  /**
   * Ottiene tutti gli ID delle entità
   */
  public getAllEntityIds(): string[] {
    return [
      ...Object.keys(this.entities),
      ...Object.keys(this.dimensions),
      ...Object.keys(this.annotations)
    ];
  }

  /**
   * Ottiene tutte le entità
   */
  public getAllEntities(): AnyEntity[] {
    return [
      ...Object.values(this.entities),
      ...Object.values(this.dimensions),
      ...Object.values(this.annotations)
    ];
  }

  /**
   * Ottiene le entità filtrate per tipo
   */
  public getEntitiesByType(type: string): AnyEntity[] {
    return this.getAllEntities().filter(entity => entity.type === type);
  }

  /**
   * Ottiene le entità filtrate per livello
   */
  public getEntitiesByLayer(layerName: string): AnyEntity[] {
    return this.getAllEntities().filter(entity => entity.layer === layerName);
  }

  /**
   * Ottiene le entità filtrate per una funzione personalizzata
   */
  public getEntitiesByFilter(filterFn: EntityFilterFn): AnyEntity[] {
    return this.getAllEntities().filter(filterFn);
  }

  /**
   * Ottiene un'entità specifica per ID
   */
  public getEntityById(id: string): AnyEntity | undefined {
    return this.entities[id] || this.dimensions[id] || this.annotations[id];
  }

  /**
   * Verifica se un'entità esiste
   */
  public entityExists(id: string): boolean {
    return id in this.entities || id in this.dimensions || id in this.annotations;
  }

  /**
   * Aggiunge una nuova entità di disegno
   */
  public addDrawingEntity(entity: Omit<DrawingEntity, 'id'>): string {
    const id = uuidv4();
    this.entities[id] = { ...entity, id } as DrawingEntity;
    this.notifyChange();
    return id;
  }

  /**
   * Aggiunge una nuova quota
   */
  public addDimension(dimension: Omit<Dimension, 'id'>): string {
    const id = uuidv4();
    this.dimensions[id] = { ...dimension, id } as Dimension;
    this.notifyChange();
    return id;
  }

  /**
   * Aggiunge una nuova annotazione
   */
  public addAnnotation(annotation: Omit<Annotation, 'id'>): string {
    const id = uuidv4();
    this.annotations[id] = { ...annotation, id } as Annotation;
    this.notifyChange();
    return id;
  }

  /**
   * Aggiunge una qualsiasi entità (factory)
   */
  public addEntity(entity: Omit<AnyEntity, 'id'>): string {
    const type = entity.type;
    
    // Determina il tipo di entità
    if (this.isDrawingEntityType(type)) {
      return this.addDrawingEntity(entity as Omit<DrawingEntity, 'id'>);
    } else if (this.isDimensionType(type)) {
      return this.addDimension(entity as Omit<Dimension, 'id'>);
    } else if (this.isAnnotationType(type)) {
      return this.addAnnotation(entity as Omit<Annotation, 'id'>);
    }
    
    throw new Error(`Tipo di entità non supportato: ${type}`);
  }

  /**
   * Aggiorna un'entità esistente
   */
  public updateEntity(id: string, updates: Partial<AnyEntity>): boolean {
    // Determina quale tipo di entità stiamo aggiornando
    if (id in this.entities) {
      this.entities[id] = { ...this.entities[id], ...updates } as DrawingEntity;
      this.notifyChange();
      return true;
    } else if (id in this.dimensions) {
      this.dimensions[id] = { ...this.dimensions[id], ...updates } as Dimension;
      this.notifyChange();
      return true;
    } else if (id in this.annotations) {
      this.annotations[id] = { ...this.annotations[id], ...updates } as Annotation;
      this.notifyChange();
      return true;
    }
    
    return false;
  }

  /**
   * Aggiorna più entità in base a un filtro
   */
  public updateEntitiesByFilter(filterFn: EntityFilterFn, updateFn: EntityUpdateFn): number {
    let updatedCount = 0;
    
    // Entità di disegno
    Object.entries(this.entities).forEach(([id, entity]) => {
      if (filterFn(entity)) {
        const updates = updateFn(entity);
        if (Object.keys(updates).length > 0) {
          this.entities[id] = { ...entity, ...updates } as DrawingEntity;
          updatedCount++;
        }
      }
    });
    
    // Quote
    Object.entries(this.dimensions).forEach(([id, entity]) => {
      if (filterFn(entity)) {
        const updates = updateFn(entity);
        if (Object.keys(updates).length > 0) {
          this.dimensions[id] = { ...entity, ...updates } as Dimension;
          updatedCount++;
        }
      }
    });
    
    // Annotazioni
    Object.entries(this.annotations).forEach(([id, entity]) => {
      if (filterFn(entity)) {
        const updates = updateFn(entity);
        if (Object.keys(updates).length > 0) {
          this.annotations[id] = { ...entity, ...updates } as Annotation;
          updatedCount++;
        }
      }
    });
    
    if (updatedCount > 0) {
      this.notifyChange();
    }
    
    return updatedCount;
  }

  /**
   * Elimina un'entità
   */
  public deleteEntity(id: string): boolean {
    // Determina quale tipo di entità stiamo eliminando
    if (id in this.entities) {
      delete this.entities[id];
      this.notifyChange();
      return true;
    } else if (id in this.dimensions) {
      delete this.dimensions[id];
      this.notifyChange();
      return true;
    } else if (id in this.annotations) {
      delete this.annotations[id];
      this.notifyChange();
      return true;
    }
    
    return false;
  }

  /**
   * Elimina più entità in base a un filtro
   */
  public deleteEntitiesByFilter(filterFn: EntityFilterFn): number {
    let deletedCount = 0;
    
    // Entità di disegno
    Object.entries(this.entities).forEach(([id, entity]) => {
      if (filterFn(entity)) {
        delete this.entities[id];
        deletedCount++;
      }
    });
    
    // Quote
    Object.entries(this.dimensions).forEach(([id, entity]) => {
      if (filterFn(entity)) {
        delete this.dimensions[id];
        deletedCount++;
      }
    });
    
    // Annotazioni
    Object.entries(this.annotations).forEach(([id, entity]) => {
      if (filterFn(entity)) {
        delete this.annotations[id];
        deletedCount++;
      }
    });
    
    if (deletedCount > 0) {
      this.notifyChange();
    }
    
    return deletedCount;
  }

  /**
   * Seleziona un'entità
   */
  public selectEntity(id: string, addToSelection: boolean = false): void {
    if (!this.entityExists(id)) return;
    
    if (addToSelection) {
      if (!this.selectedEntityIds.includes(id)) {
        this.selectedEntityIds.push(id);
        this.notifyChange();
      }
    } else {
      this.selectedEntityIds = [id];
      this.notifyChange();
    }
  }

  /**
   * Deseleziona un'entità
   */
  public deselectEntity(id: string): void {
    const index = this.selectedEntityIds.indexOf(id);
    if (index !== -1) {
      this.selectedEntityIds.splice(index, 1);
      this.notifyChange();
    }
  }

  /**
   * Pulisce la selezione
   */
  public clearSelection(): void {
    if (this.selectedEntityIds.length > 0) {
      this.selectedEntityIds = [];
      this.notifyChange();
    }
  }

  /**
   * Ottiene gli ID delle entità selezionate
   */
  public getSelectedEntityIds(): string[] {
    return [...this.selectedEntityIds];
  }

  /**
   * Ottiene le entità selezionate
   */
  public getSelectedEntities(): AnyEntity[] {
    return this.selectedEntityIds.map(id => this.getEntityById(id)).filter(Boolean) as AnyEntity[];
  }

  /**
   * Copia un'entità
   */
  public copyEntity(id: string, offset?: Point): string | null {
    const entity = this.getEntityById(id);
    if (!entity) return null;
    
    // Clone dell'entità senza ID
    const { id: _, ...entityData } = entity;
    
    // Applica offset se specificato
    if (offset) {
      this.applyOffsetToEntity(entityData as AnyEntity, offset);
    }
    
    // Aggiungi la nuova entità
    return this.addEntity(entityData as Omit<AnyEntity, 'id'>);
  }

  /**
   * Copia le entità selezionate
   */
  public copySelectedEntities(offset?: Point): string[] {
    return this.selectedEntityIds
      .map(id => this.copyEntity(id, offset))
      .filter(Boolean) as string[];
  }

  /**
   * Sposta un'entità
   */
  public moveEntity(id: string, offset: Point): boolean {
    const entity = this.getEntityById(id);
    if (!entity) return false;
    
    // Clone dell'entità
    const entityData = { ...entity };
    
    // Applica offset
    this.applyOffsetToEntity(entityData, offset);
    
    // Aggiorna l'entità
    return this.updateEntity(id, entityData);
  }

  /**
   * Sposta le entità selezionate
   */
  public moveSelectedEntities(offset: Point): number {
    let movedCount = 0;
    
    this.selectedEntityIds.forEach(id => {
      if (this.moveEntity(id, offset)) {
        movedCount++;
      }
    });
    
    return movedCount;
  }

  /**
   * Ruota un'entità attorno a un punto
   */
  public rotateEntity(id: string, center: Point, angle: number): boolean {
    const entity = this.getEntityById(id);
    if (!entity) return false;
    
    // Clone dell'entità
    const entityData = { ...entity };
    
    // Applica rotazione
    this.applyRotationToEntity(entityData, center, angle);
    
    // Aggiorna l'entità
    return this.updateEntity(id, entityData);
  }

  /**
   * Ruota le entità selezionate
   */
  public rotateSelectedEntities(center: Point, angle: number): number {
    let rotatedCount = 0;
    
    this.selectedEntityIds.forEach(id => {
      if (this.rotateEntity(id, center, angle)) {
        rotatedCount++;
      }
    });
    
    return rotatedCount;
  }

  /**
   * Scala un'entità rispetto a un punto
   */
  public scaleEntity(id: string, center: Point, scaleX: number, scaleY: number): boolean {
    const entity = this.getEntityById(id);
    if (!entity) return false;
    
    // Clone dell'entità
    const entityData = { ...entity };
    
    // Applica scala
    this.applyScaleToEntity(entityData, center, scaleX, scaleY);
    
    // Aggiorna l'entità
    return this.updateEntity(id, entityData);
  }

  /**
   * Scala le entità selezionate
   */
  public scaleSelectedEntities(center: Point, scaleX: number, scaleY: number): number {
    let scaledCount = 0;
    
    this.selectedEntityIds.forEach(id => {
      if (this.scaleEntity(id, center, scaleX, scaleY)) {
        scaledCount++;
      }
    });
    
    return scaledCount;
  }

  /**
   * Imposta lo stato delle entità
   */
  public setEntityState(
    entities: Record<string, DrawingEntity>,
    dimensions: Record<string, Dimension>,
    annotations: Record<string, Annotation>
  ): void {
    this.entities = { ...entities };
    this.dimensions = { ...dimensions };
    this.annotations = { ...annotations };
    this.selectedEntityIds = [];
    
    this.notifyChange();
  }

  /**
   * Esporta lo stato delle entità
   */
  public getEntityState(): {
    entities: Record<string, DrawingEntity>,
    dimensions: Record<string, Dimension>,
    annotations: Record<string, Annotation>
  } {
    return {
      entities: { ...this.entities },
      dimensions: { ...this.dimensions },
      annotations: { ...this.annotations }
    };
  }

  /**
   * Applica un offset a un'entità (helper interno)
   */
  private applyOffsetToEntity(entity: AnyEntity, offset: Point): void {
    switch (entity.type) {
      case 'line':
        const line = entity as LineEntity;
        line.startPoint = {
          x: line.startPoint.x + offset.x,
          y: line.startPoint.y + offset.y
        };
        line.endPoint = {
          x: line.endPoint.x + offset.x,
          y: line.endPoint.y + offset.y
        };
        break;
        
      case 'circle':
        const circle = entity as CircleEntity;
        circle.center = {
          x: circle.center.x + offset.x,
          y: circle.center.y + offset.y
        };
        break;
        
      case 'rectangle':
        const rect = entity as RectangleEntity;
        rect.position = {
          x: rect.position.x + offset.x,
          y: rect.position.y + offset.y
        };
        break;
        
      case 'ellipse':
        const ellipse = entity as EllipseEntity;
        ellipse.center = {
          x: ellipse.center.x + offset.x,
          y: ellipse.center.y + offset.y
        };
        break;
        
      case 'arc':
        const arc = entity as ArcEntity;
        arc.center = {
          x: arc.center.x + offset.x,
          y: arc.center.y + offset.y
        };
        break;
        
      case 'polyline':
        const polyline = entity as PolylineEntity;
        polyline.points = polyline.points.map(point => ({
          x: point.x + offset.x,
          y: point.y + offset.y
        }));
        break;
        
      case 'spline':
        const spline = entity as SplineEntity;
        spline.points = spline.points.map(point => ({
          x: point.x + offset.x,
          y: point.y + offset.y
        }));
        
        if (spline.controlPoints) {
          spline.controlPoints = spline.controlPoints.map(point => ({
            x: point.x + offset.x,
            y: point.y + offset.y
          }));
        }
        break;
        
      case 'text-annotation':
        const text = entity as TextAnnotation;
        text.position = {
          x: text.position.x + offset.x,
          y: text.position.y + offset.y
        };
        break;
        
      case 'linear-dimension':
        const dimension = entity as LinearDimension;
        dimension.startPoint = {
          x: dimension.startPoint.x + offset.x,
          y: dimension.startPoint.y + offset.y
        };
        dimension.endPoint = {
          x: dimension.endPoint.x + offset.x,
          y: dimension.endPoint.y + offset.y
        };
        
        if (dimension.textPosition) {
          dimension.textPosition = {
            x: dimension.textPosition.x + offset.x,
            y: dimension.textPosition.y + offset.y
          };
        }
        break;
        
      // Altri tipi di entità...
    }
  }

  /**
   * Applica una rotazione a un'entità (helper interno)
   */
  private applyRotationToEntity(entity: AnyEntity, center: Point, angle: number): void {
    const rad = angle * Math.PI / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    
    // Funzione per ruotare un punto
    const rotatePoint = (point: Point): Point => {
      const dx = point.x - center.x;
      const dy = point.y - center.y;
      
      return {
        x: center.x + dx * cos - dy * sin,
        y: center.y + dx * sin + dy * cos
      };
    };
    
    switch (entity.type) {
      case 'line':
        const line = entity as LineEntity;
        line.startPoint = rotatePoint(line.startPoint);
        line.endPoint = rotatePoint(line.endPoint);
        break;
        
      case 'circle':
        const circle = entity as CircleEntity;
        circle.center = rotatePoint(circle.center);
        break;
        
      case 'rectangle':
        const rect = entity as RectangleEntity;
        rect.position = rotatePoint(rect.position);
        rect.rotation = (rect.rotation || 0) + angle;
        break;
        
      case 'ellipse':
        const ellipse = entity as EllipseEntity;
        ellipse.center = rotatePoint(ellipse.center);
        ellipse.rotation = (ellipse.rotation || 0) + angle;
        break;
        
      case 'arc':
        const arc = entity as ArcEntity;
        arc.center = rotatePoint(arc.center);
        arc.startAngle += rad;
        arc.endAngle += rad;
        break;
        
      case 'polyline':
        const polyline = entity as PolylineEntity;
        polyline.points = polyline.points.map(rotatePoint);
        break;
        
      case 'spline':
        const spline = entity as SplineEntity;
        spline.points = spline.points.map(rotatePoint);
        
        if (spline.controlPoints) {
          spline.controlPoints = spline.controlPoints.map(rotatePoint);
        }
        break;
        
      case 'text-annotation':
        const text = entity as TextAnnotation;
        text.position = rotatePoint(text.position);
        text.rotation = (text.rotation || 0) + angle;
        break;
        
      case 'linear-dimension':
        const dimension = entity as LinearDimension;
        dimension.startPoint = rotatePoint(dimension.startPoint);
        dimension.endPoint = rotatePoint(dimension.endPoint);
        
        if (dimension.textPosition) {
          dimension.textPosition = rotatePoint(dimension.textPosition);
        }
        break;
        
      // Altri tipi di entità...
    }
  }

  /**
   * Applica una scala a un'entità (helper interno)
   */
  private applyScaleToEntity(entity: AnyEntity, center: Point, scaleX: number, scaleY: number): void {
    // Funzione per scalare un punto
    const scalePoint = (point: Point): Point => {
      return {
        x: center.x + (point.x - center.x) * scaleX,
        y: center.y + (point.y - center.y) * scaleY
      };
    };
    
    switch (entity.type) {
      case 'line':
        const line = entity as LineEntity;
        line.startPoint = scalePoint(line.startPoint);
        line.endPoint = scalePoint(line.endPoint);
        break;
        
      case 'circle':
        const circle = entity as CircleEntity;
        circle.center = scalePoint(circle.center);
        circle.radius *= Math.max(Math.abs(scaleX), Math.abs(scaleY));
        break;
        
      case 'rectangle':
        const rect = entity as RectangleEntity;
        
        // Se manteniamo la posizione come angolo in alto a sinistra
        const oldPos = rect.position;
        rect.position = scalePoint(oldPos);
        
        // Scala larghezza e altezza
        rect.width *= Math.abs(scaleX);
        rect.height *= Math.abs(scaleY);
        break;
        
      case 'ellipse':
        const ellipse = entity as EllipseEntity;
        ellipse.center = scalePoint(ellipse.center);
        ellipse.radiusX *= Math.abs(scaleX);
        ellipse.radiusY *= Math.abs(scaleY);
        break;
        
      case 'arc':
        const arc = entity as ArcEntity;
        arc.center = scalePoint(arc.center);
        arc.radius *= Math.max(Math.abs(scaleX), Math.abs(scaleY));
        break;
        
      case 'polyline':
        const polyline = entity as PolylineEntity;
        polyline.points = polyline.points.map(scalePoint);
        break;
        
      case 'spline':
        const spline = entity as SplineEntity;
        spline.points = spline.points.map(scalePoint);
        
        if (spline.controlPoints) {
          spline.controlPoints = spline.controlPoints.map(scalePoint);
        }
        break;
        
      case 'text-annotation':
        const text = entity as TextAnnotation;
        text.position = scalePoint(text.position);
        
        // Opzionalmente scala anche il testo
        if (text.width) text.width *= Math.abs(scaleX);
        if (text.height) text.height *= Math.abs(scaleY);
        if (text.style?.fontSize) {
          text.style.fontSize *= Math.max(Math.abs(scaleX), Math.abs(scaleY));
        }
        break;
        
      case 'linear-dimension':
        const dimension = entity as LinearDimension;
        dimension.startPoint = scalePoint(dimension.startPoint);
        dimension.endPoint = scalePoint(dimension.endPoint);
        dimension.offsetDistance *= Math.abs(scaleY);
        
        if (dimension.textPosition) {
          dimension.textPosition = scalePoint(dimension.textPosition);
        }
        break;
        
      // Altri tipi di entità...
    }
  }

  /**
   * Verifica se un tipo è un'entità di disegno
   */
  private isDrawingEntityType(type: string): boolean {
    const drawingTypes = [
      'line', 
      'circle', 
      'rectangle', 
      'ellipse', 
      'arc', 
      'polyline', 
      'spline', 
      'polygon', 
      'path',
      'hatch'
    ];
    
    return drawingTypes.includes(type);
  }

  /**
   * Verifica se un tipo è una quota
   */
  private isDimensionType(type: string): boolean {
    const dimensionTypes = [
      'linear-dimension', 
      'aligned-dimension', 
      'angular-dimension', 
      'radial-dimension', 
      'diameter-dimension'
    ];
    
    return dimensionTypes.includes(type);
  }

  /**
   * Verifica se un tipo è un'annotazione
   */
  private isAnnotationType(type: string): boolean {
    const annotationTypes = [
      'text-annotation', 
      'leader-annotation', 
      'symbol-annotation', 
      'tolerance-annotation'
    ];
    
    return annotationTypes.includes(type);
  }
}

/**
 * Factory per creare un'istanza del gestore entità
 */
export function createEntityManager(): EntityManager {
  return new EntityManager();
}