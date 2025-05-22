// src/components/cad/technical-drawing/core/dimensions/AssociativeDimensions.ts
// Sistema di dimensioni associative per CAD professionale

import { v4 as uuidv4 } from 'uuid';
import { Point, DrawingEntity, Dimension, LinearDimension, AngularDimension, RadialDimension } from '../../TechnicalDrawingTypes';

export interface AssociativeRelationship {
  id: string;
  dimensionId: string;
  entityIds: string[];
  relationshipType: 'linear' | 'angular' | 'radial' | 'diametral';
  measurementPoints: Point[];
  autoUpdate: boolean;
  tolerance: number;
  lastValue: number;
  formula?: string; // For calculated dimensions
}

export interface DimensionDependency {
  id: string;
  parentDimensionId: string;
  childDimensionIds: string[];
  dependencyType: 'direct' | 'calculated' | 'constraint';
  updateChain: string[];
}

export interface DimensionUpdateEvent {
  dimensionId: string;
  oldValue: number;
  newValue: number;
  affectedEntities: string[];
  timestamp: number;
  source: 'user' | 'constraint' | 'calculation';
}

/**
 * 📏 Associative Dimensions Manager
 * 
 * Gestisce dimensioni che si aggiornano automaticamente quando la geometria cambia.
 * Implementa un sistema di dipendenze per dimensioni collegate e calcoli derivati.
 */
export class AssociativeDimensionsManager {
  private relationships: Map<string, AssociativeRelationship> = new Map();
  private dependencies: Map<string, DimensionDependency> = new Map();
  private entities: Record<string, DrawingEntity> = {};
  private dimensions: Record<string, Dimension> = {};
  private updateListeners: ((event: DimensionUpdateEvent) => void)[] = [];
  private isUpdating = false;

  constructor() {
    console.log('🔗 Associative Dimensions Manager initialized');
  }

  /**
   * Aggiorna entità e dimensioni
   */
  updateData(entities: Record<string, DrawingEntity>, dimensions: Record<string, Dimension>) {
    const previousEntities = this.entities;
    this.entities = { ...entities };
    this.dimensions = { ...dimensions };

    if (!this.isUpdating) {
      this.checkForGeometryChanges(previousEntities);
    }
  }

  /**
   * Crea una relazione associativa tra dimensione e entità
   */
  createAssociativeRelationship(
    dimensionId: string,
    entityIds: string[],
    relationshipType: AssociativeRelationship['relationshipType'],
    measurementPoints?: Point[]
  ): string {
    const dimension = this.dimensions[dimensionId];
    if (!dimension) {
      throw new Error(`Dimension ${dimensionId} not found`);
    }

    // Verifica che le entità esistano
    for (const entityId of entityIds) {
      if (!this.entities[entityId]) {
        throw new Error(`Entity ${entityId} not found`);
      }
    }

    const relationship: AssociativeRelationship = {
      id: uuidv4(),
      dimensionId,
      entityIds,
      relationshipType,
      measurementPoints: measurementPoints || [],
      autoUpdate: true,
      tolerance: 0.001,
      lastValue: this.calculateCurrentValue(relationshipType, entityIds, measurementPoints),
      formula: undefined
    };

    this.relationships.set(relationship.id, relationship);
    
    console.log(`✅ Created associative relationship: ${dimensionId} ↔ [${entityIds.join(', ')}]`);
    return relationship.id;
  }

  /**
   * Crea una dipendenza tra dimensioni
   */
  createDimensionDependency(
    parentDimensionId: string,
    childDimensionIds: string[],
    dependencyType: DimensionDependency['dependencyType'] = 'direct'
  ): string {
    const dependency: DimensionDependency = {
      id: uuidv4(),
      parentDimensionId,
      childDimensionIds,
      dependencyType,
      updateChain: [parentDimensionId, ...childDimensionIds]
    };

    this.dependencies.set(dependency.id, dependency);
    
    console.log(`🔗 Created dimension dependency: ${parentDimensionId} → [${childDimensionIds.join(', ')}]`);
    return dependency.id;
  }

  /**
   * Aggiorna una dimensione e propaga le modifiche
   */
  async updateDimension(dimensionId: string, newValue: number, source: DimensionUpdateEvent['source'] = 'user'): Promise<DimensionUpdateEvent[]> {
    if (this.isUpdating) {
      return [];
    }

    this.isUpdating = true;
    const events: DimensionUpdateEvent[] = [];

    try {
      const dimension = this.dimensions[dimensionId];
      if (!dimension) {
        throw new Error(`Dimension ${dimensionId} not found`);
      }

      const oldValue = this.extractDimensionValue(dimension);
      
      // Crea evento principale
      const mainEvent: DimensionUpdateEvent = {
        dimensionId,
        oldValue,
        newValue,
        affectedEntities: [],
        timestamp: Date.now(),
        source
      };

      // Aggiorna la dimensione
      await this.applyDimensionUpdate(dimensionId, newValue);
      mainEvent.affectedEntities = await this.getAffectedEntities(dimensionId);
      
      events.push(mainEvent);

      // Propaga alle dimensioni dipendenti
      const cascadeEvents = await this.propagateUpdate(dimensionId, newValue);
      events.push(...cascadeEvents);

      // Notifica listeners
      events.forEach(event => {
        this.updateListeners.forEach(listener => {
          try {
            listener(event);
          } catch (error) {
            console.error('Error in dimension update listener:', error);
          }
        });
      });

      console.log(`📏 Updated dimension ${dimensionId}: ${oldValue} → ${newValue} (${events.length} total updates)`);
      
    } finally {
      this.isUpdating = false;
    }

    return events;
  }

  /**
   * Verifica modifiche alla geometria e aggiorna dimensioni associative
   */
  private async checkForGeometryChanges(previousEntities: Record<string, DrawingEntity>) {
    const updatedDimensions: string[] = [];

    for (const [relationshipId, relationship] of this.relationships) {
      if (!relationship.autoUpdate) continue;

      const currentValue = this.calculateCurrentValue(
        relationship.relationshipType,
        relationship.entityIds,
        relationship.measurementPoints
      );

      if (Math.abs(currentValue - relationship.lastValue) > relationship.tolerance) {
        console.log(`📐 Geometry change detected for dimension ${relationship.dimensionId}: ${relationship.lastValue} → ${currentValue}`);
        
        // Aggiorna la dimensione
        await this.applyDimensionUpdate(relationship.dimensionId, currentValue);
        relationship.lastValue = currentValue;
        
        updatedDimensions.push(relationship.dimensionId);

        // Crea evento di aggiornamento
        const event: DimensionUpdateEvent = {
          dimensionId: relationship.dimensionId,
          oldValue: relationship.lastValue,
          newValue: currentValue,
          affectedEntities: relationship.entityIds,
          timestamp: Date.now(),
          source: 'constraint'
        };

        this.updateListeners.forEach(listener => {
          try {
            listener(event);
          } catch (error) {
            console.error('Error in dimension update listener:', error);
          }
        });
      }
    }

    if (updatedDimensions.length > 0) {
      console.log(`🔄 Auto-updated ${updatedDimensions.length} associative dimensions`);
    }
  }

  /**
   * Calcola il valore corrente in base al tipo di relazione
   */
  private calculateCurrentValue(
    relationshipType: AssociativeRelationship['relationshipType'],
    entityIds: string[],
    measurementPoints?: Point[]
  ): number {
    const entities = entityIds.map(id => this.entities[id]).filter(Boolean);

    switch (relationshipType) {
      case 'linear':
        return this.calculateLinearDistance(entities, measurementPoints);
      case 'angular':
        return this.calculateAngularDistance(entities, measurementPoints);
      case 'radial':
        return this.calculateRadialDistance(entities);
      case 'diametral':
        return this.calculateRadialDistance(entities) * 2;
      default:
        return 0;
    }
  }

  /**
   * Calcola distanza lineare
   */
  private calculateLinearDistance(entities: DrawingEntity[], measurementPoints?: Point[]): number {
    if (measurementPoints && measurementPoints.length >= 2) {
      const p1 = measurementPoints[0];
      const p2 = measurementPoints[1];
      return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    }

    if (entities.length >= 2) {
      const point1 = this.getEntityReferencePoint(entities[0]);
      const point2 = this.getEntityReferencePoint(entities[1]);
      return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
    }

    if (entities.length === 1 && entities[0].type === 'line') {
      const line = entities[0] as any;
      return Math.sqrt(
        Math.pow(line.endPoint.x - line.startPoint.x, 2) +
        Math.pow(line.endPoint.y - line.startPoint.y, 2)
      );
    }

    return 0;
  }

  /**
   * Calcola distanza angolare
   */
  private calculateAngularDistance(entities: DrawingEntity[], measurementPoints?: Point[]): number {
    if (entities.length < 2 || entities[0].type !== 'line' || entities[1].type !== 'line') {
      return 0;
    }

    const line1 = entities[0] as any;
    const line2 = entities[1] as any;

    const angle1 = Math.atan2(
      line1.endPoint.y - line1.startPoint.y,
      line1.endPoint.x - line1.startPoint.x
    );

    const angle2 = Math.atan2(
      line2.endPoint.y - line2.startPoint.y,
      line2.endPoint.x - line2.startPoint.x
    );

    let angleDiff = Math.abs(angle2 - angle1);
    if (angleDiff > Math.PI) {
      angleDiff = 2 * Math.PI - angleDiff;
    }

    return angleDiff * 180 / Math.PI; // Convert to degrees
  }

  /**
   * Calcola distanza radiale
   */
  private calculateRadialDistance(entities: DrawingEntity[]): number {
    const circleEntity = entities.find(e => e.type === 'circle') as any;
    if (circleEntity) {
      return circleEntity.radius;
    }

    return 0;
  }

  /**
   * Ottiene punto di riferimento di un'entità
   */
  private getEntityReferencePoint(entity: DrawingEntity): Point {
    switch (entity.type) {
      case 'circle':
        return (entity as any).center;
      case 'line':
        const line = entity as any;
        return {
          x: (line.startPoint.x + line.endPoint.x) / 2,
          y: (line.startPoint.y + line.endPoint.y) / 2
        };
      case 'rectangle':
        return (entity as any).position;
      default:
        return { x: 0, y: 0 };
    }
  }

  /**
   * Applica aggiornamento alla dimensione
   */
  private async applyDimensionUpdate(dimensionId: string, newValue: number): Promise<void> {
    const dimension = this.dimensions[dimensionId];
    if (!dimension) return;

    // Aggiorna il testo della dimensione
    let updatedText: string;

    switch (dimension.type) {
      case 'linear-dimension':
        updatedText = `${newValue.toFixed(2)}`;
        break;
      case 'angular-dimension':
        updatedText = `${newValue.toFixed(1)}°`;
        break;
      case 'radial-dimension':
        updatedText = `R${newValue.toFixed(2)}`;
        break;
      default:
        updatedText = `${newValue.toFixed(2)}`;
    }

    // Aggiorna nel record locale
    if ('text' in dimension) {
      (dimension as any).text = updatedText;
    }
  }

  /**
   * Propaga aggiornamento alle dimensioni dipendenti
   */
  private async propagateUpdate(dimensionId: string, newValue: number): Promise<DimensionUpdateEvent[]> {
    const events: DimensionUpdateEvent[] = [];
    const visited = new Set<string>();

    for (const [depId, dependency] of this.dependencies) {
      if (dependency.parentDimensionId === dimensionId) {
        for (const childId of dependency.childDimensionIds) {
          if (!visited.has(childId)) {
            visited.add(childId);
            
            // Calcola nuovo valore per la dimensione figlia
            const childValue = await this.calculateDependentValue(childId, newValue, dependency);
            
            if (childValue !== null) {
              const childEvents = await this.updateDimension(childId, childValue, 'calculation');
              events.push(...childEvents);
            }
          }
        }
      }
    }

    return events;
  }

  /**
   * Calcola valore dipendente
   */
  private async calculateDependentValue(
    childDimensionId: string,
    parentValue: number,
    dependency: DimensionDependency
  ): Promise<number | null> {
    // Implementazione semplificata - in un sistema reale, questo userebbe
    // formule più complesse e parser di espressioni
    switch (dependency.dependencyType) {
      case 'direct':
        return parentValue;
      case 'calculated':
        // Esempio: dimensione figlio = dimensione padre * 2
        return parentValue * 2;
      default:
        return parentValue;
    }
  }

  /**
   * Ottiene entità affette da una dimensione
   */
  private async getAffectedEntities(dimensionId: string): Promise<string[]> {
    const relationship = Array.from(this.relationships.values())
      .find(r => r.dimensionId === dimensionId);
    
    return relationship ? relationship.entityIds : [];
  }

  /**
   * Estrae valore numerico da una dimensione
   */
  private extractDimensionValue(dimension: Dimension): number {
    if ('text' in dimension) {
      const text = (dimension as any).text as string;
      const match = text.match(/[\d.]+/);
      return match ? parseFloat(match[0]) : 0;
    }
    return 0;
  }

  /**
   * Aggiunge listener per aggiornamenti
   */
  addUpdateListener(listener: (event: DimensionUpdateEvent) => void) {
    this.updateListeners.push(listener);
  }

  /**
   * Rimuove listener
   */
  removeUpdateListener(listener: (event: DimensionUpdateEvent) => void) {
    const index = this.updateListeners.indexOf(listener);
    if (index > -1) {
      this.updateListeners.splice(index, 1);
    }
  }

  /**
   * Ottiene tutte le relazioni associative
   */
  getAllRelationships(): AssociativeRelationship[] {
    return Array.from(this.relationships.values());
  }

  /**
   * Ottiene tutte le dipendenze
   */
  getAllDependencies(): DimensionDependency[] {
    return Array.from(this.dependencies.values());
  }

  /**
   * Rimuove relazione associativa
   */
  removeRelationship(relationshipId: string): boolean {
    return this.relationships.delete(relationshipId);
  }

  /**
   * Rimuove dipendenza
   */
  removeDependency(dependencyId: string): boolean {
    return this.dependencies.delete(dependencyId);
  }

  /**
   * Abilita/disabilita auto-aggiornamento per una relazione
   */
  setAutoUpdate(relationshipId: string, autoUpdate: boolean): boolean {
    const relationship = this.relationships.get(relationshipId);
    if (relationship) {
      relationship.autoUpdate = autoUpdate;
      return true;
    }
    return false;
  }
}

export default AssociativeDimensionsManager;