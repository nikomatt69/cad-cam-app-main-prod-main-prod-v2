// src/components/cad/technical-drawing/core/dimensions/AssociativeDimensions.ts

import { v4 as uuidv4 } from 'uuid';
import { Dimension, DrawingEntity, Point } from '../../TechnicalDrawingTypes';

export interface AssociativeRelationship {
  id: string;
  dimensionId: string;
  entityIds: string[];
  relationshipType: 'linear' | 'angular' | 'radial' | 'area' | 'custom';
  formula?: string;
  parameters: Record<string, any>;
  metadata: {
    created: number;
    modified: number;
    description?: string;
  };
}

export interface DimensionDependency {
  dependentId: string;
  independentIds: string[];
  formula: string;
}

export interface DimensionUpdateEvent {
  dimensionId: string;
  oldValue: number;
  newValue: number;
  updateSource: 'user' | 'calculation' | 'constraint';
  timestamp: number;
  affectedDimensions: string[];
}

export default class AssociativeDimensionsManager {
  private relationships: Map<string, AssociativeRelationship> = new Map();
  private dependencies: Map<string, DimensionDependency> = new Map();
  private entities: Map<string, DrawingEntity> = new Map();
  private dimensions: Map<string, Dimension> = new Map();
  private updateListeners: Array<(event: DimensionUpdateEvent) => void> = [];

  constructor() {
    console.log('📏 AssociativeDimensionsManager initialized');
  }

  createAssociativeRelationship(
    dimensionId: string,
    entityIds: string[],
    relationshipType: 'linear' | 'angular' | 'radial' | 'area' | 'custom',
    formula?: string
  ): string {
    const id = uuidv4();
    const relationship: AssociativeRelationship = {
      id,
      dimensionId,
      entityIds,
      relationshipType,
      formula,
      parameters: {},
      metadata: {
        created: Date.now(),
        modified: Date.now()
      }
    };

    this.relationships.set(id, relationship);
    console.log(`✅ Associative relationship created: ${relationshipType} (${id})`);
    return id;
  }

  removeAssociativeRelationship(relationshipId: string): boolean {
    const success = this.relationships.delete(relationshipId);
    if (success) {
      console.log(`🗑️ Associative relationship removed: ${relationshipId}`);
    }
    return success;
  }

  updateData(entities: Record<string, DrawingEntity>, dimensions: Record<string, Dimension>): void {
    // Update internal maps
    this.entities.clear();
    this.dimensions.clear();

    Object.entries(entities).forEach(([id, entity]) => {
      this.entities.set(id, entity);
    });

    Object.entries(dimensions).forEach(([id, dimension]) => {
      this.dimensions.set(id, dimension);
    });

    // Recalculate all associative dimensions
    this.recalculateAssociativeDimensions();
  }

  async updateDimension(dimensionId: string, newValue: number, source: 'user' | 'calculation' | 'constraint'): Promise<DimensionUpdateEvent[]> {
    const dimension = this.dimensions.get(dimensionId);
    if (!dimension) {
      throw new Error(`Dimension not found: ${dimensionId}`);
    }

    // Get current value
    const oldValue = this.extractDimensionValue(dimension);
    
    // Create update event
    const updateEvent: DimensionUpdateEvent = {
      dimensionId,
      oldValue,
      newValue,
      updateSource: source,
      timestamp: Date.now(),
      affectedDimensions: []
    };

    // Update the dimension
    this.updateDimensionValue(dimension, newValue);

    // Find and update dependent dimensions
    const dependentEvents = await this.updateDependentDimensions(dimensionId, updateEvent);
    updateEvent.affectedDimensions = dependentEvents.map(e => e.dimensionId);

    // Notify listeners
    this.notifyUpdateListeners(updateEvent);
    dependentEvents.forEach(event => this.notifyUpdateListeners(event));

    return [updateEvent, ...dependentEvents];
  }

  private async updateDependentDimensions(changedDimensionId: string, sourceEvent: DimensionUpdateEvent): Promise<DimensionUpdateEvent[]> {
    const events: DimensionUpdateEvent[] = [];

    // Find all relationships that depend on this dimension
    for (const relationship of this.relationships.values()) {
      if (relationship.entityIds.some(id => this.isEntityRelatedToDimension(id, changedDimensionId))) {
        const newValue = this.calculateRelationshipValue(relationship);
        if (newValue !== null) {
          const dimension = this.dimensions.get(relationship.dimensionId);
          if (dimension) {
            const oldValue = this.extractDimensionValue(dimension);
            
            if (Math.abs(newValue - oldValue) > 0.001) { // Tolerance check
              this.updateDimensionValue(dimension, newValue);
              
              events.push({
                dimensionId: relationship.dimensionId,
                oldValue,
                newValue,
                updateSource: 'calculation',
                timestamp: Date.now(),
                affectedDimensions: []
              });
            }
          }
        }
      }
    }

    return events;
  }

  private calculateRelationshipValue(relationship: AssociativeRelationship): number | null {
    const relatedEntities = relationship.entityIds
      .map(id => this.entities.get(id))
      .filter(Boolean) as DrawingEntity[];

    if (relatedEntities.length === 0) {
      return null;
    }

    switch (relationship.relationshipType) {
      case 'linear':
        return this.calculateLinearDimension(relatedEntities);
      
      case 'angular':
        return this.calculateAngularDimension(relatedEntities);
      
      case 'radial':
        return this.calculateRadialDimension(relatedEntities);
      
      case 'area':
        return this.calculateAreaDimension(relatedEntities);
      
      case 'custom':
        return this.evaluateCustomFormula(relationship.formula || '', relatedEntities);
      
      default:
        return null;
    }
  }

  private calculateLinearDimension(entities: DrawingEntity[]): number | null {
    if (entities.length < 2) return null;

    const entity1 = entities[0];
    const entity2 = entities[1];

    // Get representative points from each entity
    const point1 = this.getEntityReferencePoint(entity1);
    const point2 = this.getEntityReferencePoint(entity2);

    if (!point1 || !point2) return null;

    return Math.sqrt(
      Math.pow(point2.x - point1.x, 2) + 
      Math.pow(point2.y - point1.y, 2)
    );
  }

  private calculateAngularDimension(entities: DrawingEntity[]): number | null {
    if (entities.length < 2) return null;

    const entity1 = entities[0];
    const entity2 = entities[1];

    if (entity1.type === 'line' && entity2.type === 'line') {
      const line1 = entity1 as any;
      const line2 = entity2 as any;

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

    return null;
  }

  private calculateRadialDimension(entities: DrawingEntity[]): number | null {
    if (entities.length === 0) return null;

    const entity = entities[0];
    
    if (entity.type === 'circle') {
      const circle = entity as any;
      return circle.radius;
    }

    if (entity.type === 'arc') {
      const arc = entity as any;
      return arc.radius;
    }

    return null;
  }

  private calculateAreaDimension(entities: DrawingEntity[]): number | null {
    if (entities.length === 0) return null;

    const entity = entities[0];

    switch (entity.type) {
      case 'circle': {
        const circle = entity as any;
        return Math.PI * circle.radius * circle.radius;
      }
      
      case 'rectangle': {
        const rect = entity as any;
        return rect.width * rect.height;
      }
      
      case 'polyline': {
        const polyline = entity as any;
        if (polyline.closed && polyline.points.length >= 3) {
          return this.calculatePolygonArea(polyline.points);
        }
        return null;
      }
      
      default:
        return null;
    }
  }

  private calculatePolygonArea(points: Point[]): number {
    let area = 0;
    const n = points.length;

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }

    return Math.abs(area) / 2;
  }

  private evaluateCustomFormula(formula: string, entities: DrawingEntity[]): number | null {
    try {
      // This is a simplified formula evaluator
      // In a real implementation, you'd use a proper expression parser
      
      // Replace entity references with actual values
      let evaluatedFormula = formula;
      
      entities.forEach((entity, index) => {
        const entityVar = `entity${index}`;
        
        if (entity.type === 'line') {
          const line = entity as any;
          const length = Math.sqrt(
            Math.pow(line.endPoint.x - line.startPoint.x, 2) +
            Math.pow(line.endPoint.y - line.startPoint.y, 2)
          );
          evaluatedFormula = evaluatedFormula.replace(new RegExp(`${entityVar}\\.length`, 'g'), length.toString());
        }
        
        if (entity.type === 'circle') {
          const circle = entity as any;
          evaluatedFormula = evaluatedFormula.replace(new RegExp(`${entityVar}\\.radius`, 'g'), circle.radius.toString());
          evaluatedFormula = evaluatedFormula.replace(new RegExp(`${entityVar}\\.diameter`, 'g'), (circle.radius * 2).toString());
        }
      });

      // Evaluate the formula (simplified - in production use a safe evaluator)
      return eval(evaluatedFormula);
    } catch (error) {
      console.error('Error evaluating custom formula:', error);
      return null;
    }
  }

  private getEntityReferencePoint(entity: DrawingEntity): Point | null {
    switch (entity.type) {
      case 'line': {
        const line = entity as any;
        return {
          x: (line.startPoint.x + line.endPoint.x) / 2,
          y: (line.startPoint.y + line.endPoint.y) / 2
        };
      }
      
      case 'circle': {
        const circle = entity as any;
        return circle.center;
      }
      
      case 'rectangle': {
        const rect = entity as any;
        return {
          x: rect.position.x + rect.width / 2,
          y: rect.position.y + rect.height / 2
        };
      }
      
      default:
        return null;
    }
  }

  private extractDimensionValue(dimension: Dimension): number {
    // Extract numeric value from dimension text
    // This is a simplified implementation
    const text = (dimension as any).text || '';
    const match = text.match(/[\d.]+/);
    return match ? parseFloat(match[0]) : 0;
  }

  private updateDimensionValue(dimension: Dimension, newValue: number): void {
    // Update dimension text with new value
    const formattedValue = newValue.toFixed(2);
    (dimension as any).text = formattedValue;
    
    // Update metadata
    if (dimension.metadata) {
      dimension.metadata.modified = Date.now();
    }
  }

  private isEntityRelatedToDimension(entityId: string, dimensionId: string): boolean {
    // Check if an entity is related to a dimension through any relationship
    for (const relationship of this.relationships.values()) {
      if (relationship.dimensionId === dimensionId && relationship.entityIds.includes(entityId)) {
        return true;
      }
    }
    return false;
  }

  private recalculateAssociativeDimensions(): void {
    // Recalculate all associative dimensions when data changes
    for (const relationship of this.relationships.values()) {
      const newValue = this.calculateRelationshipValue(relationship);
      if (newValue !== null) {
        const dimension = this.dimensions.get(relationship.dimensionId);
        if (dimension) {
          this.updateDimensionValue(dimension, newValue);
        }
      }
    }
  }

  private notifyUpdateListeners(event: DimensionUpdateEvent): void {
    this.updateListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in dimension update listener:', error);
      }
    });
  }

  // Public API methods
  getAllRelationships(): AssociativeRelationship[] {
    return Array.from(this.relationships.values());
  }

  getRelationshipsForDimension(dimensionId: string): AssociativeRelationship[] {
    return Array.from(this.relationships.values()).filter(
      relationship => relationship.dimensionId === dimensionId
    );
  }

  getRelationshipsForEntity(entityId: string): AssociativeRelationship[] {
    return Array.from(this.relationships.values()).filter(
      relationship => relationship.entityIds.includes(entityId)
    );
  }

  addUpdateListener(listener: (event: DimensionUpdateEvent) => void): void {
    this.updateListeners.push(listener);
  }

  removeUpdateListener(listener: (event: DimensionUpdateEvent) => void): void {
    const index = this.updateListeners.indexOf(listener);
    if (index > -1) {
      this.updateListeners.splice(index, 1);
    }
  }

  createDependency(dependentId: string, independentIds: string[], formula: string): void {
    const dependency: DimensionDependency = {
      dependentId,
      independentIds,
      formula
    };
    
    this.dependencies.set(dependentId, dependency);
    console.log(`📊 Dimension dependency created: ${dependentId} depends on ${independentIds.join(', ')}`);
  }

  removeDependency(dependentId: string): boolean {
    return this.dependencies.delete(dependentId);
  }

  getDependency(dependentId: string): DimensionDependency | undefined {
    return this.dependencies.get(dependentId);
  }
}
