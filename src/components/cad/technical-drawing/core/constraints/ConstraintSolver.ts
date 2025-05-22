// src/components/cad/technical-drawing/core/constraints/ConstraintSolver.ts

import { Constraint, ConstraintType, ConstraintStatus, ConstraintSolverResult } from './ConstraintTypes';
import { AnyEntity, Point } from '../../TechnicalDrawingTypes';

export default class ConstraintSolver {
  private maxIterations: number = 100;
  private tolerance: number = 0.001;

  constructor(maxIterations: number = 100, tolerance: number = 0.001) {
    this.maxIterations = maxIterations;
    this.tolerance = tolerance;
  }

  async solve(constraints: Constraint[], entities: Map<string, AnyEntity>): Promise<ConstraintSolverResult[]> {
    const results: ConstraintSolverResult[] = [];
    
    // Sort constraints by priority
    const sortedConstraints = [...constraints].sort((a, b) => 
      (b.metadata.priority || 5) - (a.metadata.priority || 5)
    );

    for (const constraint of sortedConstraints) {
      if (!constraint.active) {
        results.push({
          constraintId: constraint.id,
          status: ConstraintStatus.DISABLED,
          iterations: 0,
          entityChanges: {}
        });
        continue;
      }

      try {
        const result = await this.solveConstraint(constraint, entities);
        results.push(result);
      } catch (error) {
        results.push({
          constraintId: constraint.id,
          status: ConstraintStatus.UNSATISFIED,
          iterations: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
          entityChanges: {}
        });
      }
    }

    return results;
  }

  private async solveConstraint(constraint: Constraint, entities: Map<string, AnyEntity>): Promise<ConstraintSolverResult> {
    const constraintEntities = constraint.entityIds
      .map(id => entities.get(id))
      .filter(Boolean) as AnyEntity[];

    if (constraintEntities.length !== constraint.entityIds.length) {
      throw new Error('Not all entities found for constraint');
    }

    let iterations = 0;
    let satisfied = false;
    const entityChanges: Record<string, any> = {};

    while (iterations < this.maxIterations && !satisfied) {
      const result = this.applyConstraint(constraint, constraintEntities);
      
      if (result.satisfied) {
        satisfied = true;
        Object.assign(entityChanges, result.changes);
      } else if (result.changes && Object.keys(result.changes).length > 0) {
        // Apply partial changes and continue iterating
        Object.assign(entityChanges, result.changes);
        this.applyChangesToEntities(result.changes, constraintEntities);
      } else {
        // No progress made, break to avoid infinite loop
        break;
      }

      iterations++;
    }

    return {
      constraintId: constraint.id,
      status: satisfied ? ConstraintStatus.SATISFIED : ConstraintStatus.UNSATISFIED,
      iterations,
      entityChanges
    };
  }

  private applyConstraint(constraint: Constraint, entities: AnyEntity[]): { satisfied: boolean; changes?: Record<string, any> } {
    switch (constraint.type) {
      case ConstraintType.DISTANCE:
        return this.applyDistanceConstraint(constraint, entities);
      
      case ConstraintType.PARALLEL:
        return this.applyParallelConstraint(constraint, entities);
      
      case ConstraintType.PERPENDICULAR:
        return this.applyPerpendicularConstraint(constraint, entities);
      
      case ConstraintType.HORIZONTAL:
        return this.applyHorizontalConstraint(constraint, entities);
      
      case ConstraintType.VERTICAL:
        return this.applyVerticalConstraint(constraint, entities);
      
      case ConstraintType.COINCIDENT:
        return this.applyCoincidentConstraint(constraint, entities);
      
      case ConstraintType.FIX:
        return this.applyFixConstraint(constraint, entities);
      
      default:
        return { satisfied: false };
    }
  }

  private applyDistanceConstraint(constraint: Constraint, entities: AnyEntity[]): { satisfied: boolean; changes?: Record<string, any> } {
    if (entities.length !== 2) {
      return { satisfied: false };
    }

    const targetDistance = constraint.parameters.distance as number;
    if (!targetDistance || targetDistance <= 0) {
      return { satisfied: false };
    }

    const entity1 = entities[0];
    const entity2 = entities[1];

    // Get representative points from entities
    const point1 = this.getEntityCenterPoint(entity1);
    const point2 = this.getEntityCenterPoint(entity2);

    if (!point1 || !point2) {
      return { satisfied: false };
    }

    const currentDistance = this.calculateDistance(point1, point2);
    
    if (Math.abs(currentDistance - targetDistance) < this.tolerance) {
      return { satisfied: true };
    }

    // Calculate adjustment needed
    const direction = this.normalizeVector({
      x: point2.x - point1.x,
      y: point2.y - point1.y
    });

    const adjustment = (currentDistance - targetDistance) / 2;
    const offset1 = {
      x: direction.x * adjustment,
      y: direction.y * adjustment
    };
    const offset2 = {
      x: -direction.x * adjustment,
      y: -direction.y * adjustment
    };

    return {
      satisfied: false,
      changes: {
        [entity1.id]: this.applyOffsetToEntity(entity1, offset1),
        [entity2.id]: this.applyOffsetToEntity(entity2, offset2)
      }
    };
  }

  private applyParallelConstraint(constraint: Constraint, entities: AnyEntity[]): { satisfied: boolean; changes?: Record<string, any> } {
    if (entities.length !== 2 || entities[0].type !== 'line' || entities[1].type !== 'line') {
      return { satisfied: false };
    }

    const line1 = entities[0] as any;
    const line2 = entities[1] as any;

    const angle1 = this.calculateLineAngle(line1);
    const angle2 = this.calculateLineAngle(line2);

    const angleDiff = Math.abs(angle1 - angle2);
    const normalizedDiff = Math.min(angleDiff, Math.PI - angleDiff);

    if (normalizedDiff < this.tolerance) {
      return { satisfied: true };
    }

    // Adjust second line to be parallel to first
    const length = this.calculateDistance(line2.startPoint, line2.endPoint);
    const newEndPoint = {
      x: line2.startPoint.x + length * Math.cos(angle1),
      y: line2.startPoint.y + length * Math.sin(angle1)
    };

    return {
      satisfied: false,
      changes: {
        [line2.id]: {
          endPoint: newEndPoint
        }
      }
    };
  }

  private applyPerpendicularConstraint(constraint: Constraint, entities: AnyEntity[]): { satisfied: boolean; changes?: Record<string, any> } {
    if (entities.length !== 2 || entities[0].type !== 'line' || entities[1].type !== 'line') {
      return { satisfied: false };
    }

    const line1 = entities[0] as any;
    const line2 = entities[1] as any;

    const angle1 = this.calculateLineAngle(line1);
    const angle2 = this.calculateLineAngle(line2);

    const angleDiff = Math.abs(angle1 - angle2);
    const perpendicularDiff = Math.abs(angleDiff - Math.PI / 2);

    if (perpendicularDiff < this.tolerance || Math.abs(perpendicularDiff - Math.PI) < this.tolerance) {
      return { satisfied: true };
    }

    // Adjust second line to be perpendicular to first
    const perpendicularAngle = angle1 + Math.PI / 2;
    const length = this.calculateDistance(line2.startPoint, line2.endPoint);
    const newEndPoint = {
      x: line2.startPoint.x + length * Math.cos(perpendicularAngle),
      y: line2.startPoint.y + length * Math.sin(perpendicularAngle)
    };

    return {
      satisfied: false,
      changes: {
        [line2.id]: {
          endPoint: newEndPoint
        }
      }
    };
  }

  private applyHorizontalConstraint(constraint: Constraint, entities: AnyEntity[]): { satisfied: boolean; changes?: Record<string, any> } {
    if (entities.length !== 1 || entities[0].type !== 'line') {
      return { satisfied: false };
    }

    const line = entities[0] as any;
    const yDiff = Math.abs(line.endPoint.y - line.startPoint.y);

    if (yDiff < this.tolerance) {
      return { satisfied: true };
    }

    return {
      satisfied: false,
      changes: {
        [line.id]: {
          endPoint: {
            x: line.endPoint.x,
            y: line.startPoint.y
          }
        }
      }
    };
  }

  private applyVerticalConstraint(constraint: Constraint, entities: AnyEntity[]): { satisfied: boolean; changes?: Record<string, any> } {
    if (entities.length !== 1 || entities[0].type !== 'line') {
      return { satisfied: false };
    }

    const line = entities[0] as any;
    const xDiff = Math.abs(line.endPoint.x - line.startPoint.x);

    if (xDiff < this.tolerance) {
      return { satisfied: true };
    }

    return {
      satisfied: false,
      changes: {
        [line.id]: {
          endPoint: {
            x: line.startPoint.x,
            y: line.endPoint.y
          }
        }
      }
    };
  }

  private applyCoincidentConstraint(constraint: Constraint, entities: AnyEntity[]): { satisfied: boolean; changes?: Record<string, any> } {
    if (entities.length < 2) {
      return { satisfied: false };
    }

    const referencePoint = this.getEntityCenterPoint(entities[0]);
    if (!referencePoint) {
      return { satisfied: false };
    }

    const changes: Record<string, any> = {};
    let allCoincident = true;

    for (let i = 1; i < entities.length; i++) {
      const entity = entities[i];
      const entityPoint = this.getEntityCenterPoint(entity);
      
      if (!entityPoint) continue;

      const distance = this.calculateDistance(referencePoint, entityPoint);
      
      if (distance > this.tolerance) {
        allCoincident = false;
        const offset = {
          x: referencePoint.x - entityPoint.x,
          y: referencePoint.y - entityPoint.y
        };
        changes[entity.id] = this.applyOffsetToEntity(entity, offset);
      }
    }

    return {
      satisfied: allCoincident,
      changes: Object.keys(changes).length > 0 ? changes : undefined
    };
  }

  private applyFixConstraint(constraint: Constraint, entities: AnyEntity[]): { satisfied: boolean; changes?: Record<string, any> } {
    // Fix constraint prevents movement - always satisfied by definition
    return { satisfied: true };
  }

  private getEntityCenterPoint(entity: AnyEntity): Point | null {
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

  private calculateDistance(p1: Point, p2: Point): number {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  }

  private calculateLineAngle(line: any): number {
    return Math.atan2(
      line.endPoint.y - line.startPoint.y,
      line.endPoint.x - line.startPoint.x
    );
  }

  private normalizeVector(vector: Point): Point {
    const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
    if (length === 0) return { x: 0, y: 0 };
    return { x: vector.x / length, y: vector.y / length };
  }

  private applyOffsetToEntity(entity: AnyEntity, offset: Point): Partial<AnyEntity> {
    const changes: any = {};

    switch (entity.type) {
      case 'line': {
        const line = entity as any;
        changes.startPoint = {
          x: line.startPoint.x + offset.x,
          y: line.startPoint.y + offset.y
        };
        changes.endPoint = {
          x: line.endPoint.x + offset.x,
          y: line.endPoint.y + offset.y
        };
        break;
      }
      case 'circle': {
        const circle = entity as any;
        changes.center = {
          x: circle.center.x + offset.x,
          y: circle.center.y + offset.y
        };
        break;
      }
      case 'rectangle': {
        const rect = entity as any;
        changes.position = {
          x: rect.position.x + offset.x,
          y: rect.position.y + offset.y
        };
        break;
      }
    }

    return changes;
  }

  private applyChangesToEntities(changes: Record<string, any>, entities: AnyEntity[]): void {
    entities.forEach(entity => {
      const entityChanges = changes[entity.id];
      if (entityChanges) {
        Object.assign(entity, entityChanges);
      }
    });
  }
}
