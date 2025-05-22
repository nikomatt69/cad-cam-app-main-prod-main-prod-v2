// src/components/cad/technical-drawing/core/constraints/ConstraintManager.ts

import { v4 as uuidv4 } from 'uuid';
import { Constraint, ConstraintType, ConstraintCreationParams } from './ConstraintTypes';
import { Point, AnyEntity } from '../../TechnicalDrawingTypes';

export interface ConstraintSolution {
  satisfied: boolean;
  entityUpdates: Record<string, Partial<AnyEntity>>;
  error?: string;
}

export default class ConstraintManager {
  private constraints: Map<string, Constraint> = new Map();
  private entities: Map<string, AnyEntity> = new Map();

  constructor() {
    console.log('🔧 ConstraintManager initialized');
  }

  createConstraint(params: ConstraintCreationParams): string | null {
    try {
      const id = uuidv4();
      const constraint: Constraint = {
        id,
        type: params.type,
        entityIds: params.entityIds,
        active: true,
        parameters: params.parameters || {},
        metadata: {
          created: Date.now(),
          modified: Date.now(),
          ...params.metadata
        }
      };

      this.constraints.set(id, constraint);
      console.log(`✅ Constraint created: ${params.type} (${id})`);
      return id;
    } catch (error) {
      console.error('❌ Failed to create constraint:', error);
      return null;
    }
  }

  removeConstraint(constraintId: string): boolean {
    const success = this.constraints.delete(constraintId);
    if (success) {
      console.log(`🗑️ Constraint removed: ${constraintId}`);
    }
    return success;
  }

  toggleConstraint(constraintId: string, active?: boolean): boolean {
    const constraint = this.constraints.get(constraintId);
    if (!constraint) return false;

    constraint.active = active !== undefined ? active : !constraint.active;
    constraint.metadata.modified = Date.now();
    
    console.log(`🔄 Constraint ${constraint.active ? 'enabled' : 'disabled'}: ${constraintId}`);
    return true;
  }

  getConstraintsForEntity(entityId: string): Constraint[] {
    return Array.from(this.constraints.values()).filter(constraint =>
      constraint.entityIds.includes(entityId)
    );
  }

  getAllConstraints(): Constraint[] {
    return Array.from(this.constraints.values());
  }

  updateEntities(entities: Record<string, AnyEntity>): void {
    this.entities.clear();
    Object.entries(entities).forEach(([id, entity]) => {
      this.entities.set(id, entity);
    });
  }

  async solveConstraints(): Promise<ConstraintSolution[]> {
    const solutions: ConstraintSolution[] = [];
    const activeConstraints = Array.from(this.constraints.values()).filter(c => c.active);

    console.log(`🔄 Solving ${activeConstraints.length} constraints...`);

    for (const constraint of activeConstraints) {
      try {
        const solution = await this.solveConstraint(constraint);
        solutions.push(solution);
      } catch (error) {
        console.error(`❌ Error solving constraint ${constraint.id}:`, error);
        solutions.push({
          satisfied: false,
          entityUpdates: {},
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const satisfiedCount = solutions.filter(s => s.satisfied).length;
    console.log(`✅ Constraints solved: ${satisfiedCount}/${solutions.length}`);

    return solutions;
  }

  private async solveConstraint(constraint: Constraint): Promise<ConstraintSolution> {
    const entities = constraint.entityIds
      .map(id => this.entities.get(id))
      .filter(Boolean) as AnyEntity[];

    if (entities.length < constraint.entityIds.length) {
      return {
        satisfied: false,
        entityUpdates: {},
        error: 'Not all entities found'
      };
    }

    switch (constraint.type) {
      case ConstraintType.DISTANCE:
        return this.solveDistanceConstraint(constraint, entities);
      
      case ConstraintType.COINCIDENT:
        return this.solveCoincidentConstraint(constraint, entities);
      
      case ConstraintType.PARALLEL:
        return this.solveParallelConstraint(constraint, entities);
      
      case ConstraintType.PERPENDICULAR:
        return this.solvePerpendicularConstraint(constraint, entities);
      
      case ConstraintType.HORIZONTAL:
        return this.solveHorizontalConstraint(constraint, entities);
      
      case ConstraintType.VERTICAL:
        return this.solveVerticalConstraint(constraint, entities);
      
      default:
        return {
          satisfied: false,
          entityUpdates: {},
          error: `Unsupported constraint type: ${constraint.type}`
        };
    }
  }

  private solveDistanceConstraint(constraint: Constraint, entities: AnyEntity[]): ConstraintSolution {
    if (entities.length !== 2) {
      return {
        satisfied: false,
        entityUpdates: {},
        error: 'Distance constraint requires exactly 2 entities'
      };
    }

    const targetDistance = constraint.parameters.distance as number;
    if (!targetDistance) {
      return {
        satisfied: false,
        entityUpdates: {},
        error: 'Distance parameter missing'
      };
    }

    // Simple implementation for line entities
    const entity1 = entities[0];
    const entity2 = entities[1];

    if (entity1.type === 'line' && entity2.type === 'line') {
      return this.solveLineDistanceConstraint(entity1 as any, entity2 as any, targetDistance);
    }

    return {
      satisfied: false,
      entityUpdates: {},
      error: 'Distance constraint not implemented for these entity types'
    };
  }

  private solveLineDistanceConstraint(line1: any, line2: any, targetDistance: number): ConstraintSolution {
    // Calculate current distance between lines
    const p1 = line1.startPoint;
    const p2 = line2.startPoint;
    const currentDistance = Math.sqrt(
      Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)
    );

    // If already satisfied, no changes needed
    if (Math.abs(currentDistance - targetDistance) < 0.001) {
      return {
        satisfied: true,
        entityUpdates: {}
      };
    }

    // Calculate adjustment needed
    const ratio = targetDistance / currentDistance;
    const adjustment = {
      x: (p2.x - p1.x) * (ratio - 1),
      y: (p2.y - p1.y) * (ratio - 1)
    };

    // Move second line to satisfy constraint
    return {
      satisfied: true,
      entityUpdates: {
        [line2.id]: {
          startPoint: {
            x: line2.startPoint.x + adjustment.x,
            y: line2.startPoint.y + adjustment.y
          },
          endPoint: {
            x: line2.endPoint.x + adjustment.x,
            y: line2.endPoint.y + adjustment.y
          }
        }
      }
    };
  }

  private solveCoincidentConstraint(constraint: Constraint, entities: AnyEntity[]): ConstraintSolution {
    // Simple implementation: make points coincident
    if (entities.length === 2) {
      const entity1 = entities[0];
      const entity2 = entities[1];

      // Get reference points from entities
      const point1 = this.getEntityReferencePoint(entity1);
      const point2 = this.getEntityReferencePoint(entity2);

      if (point1 && point2) {
        // Move second entity to match first
        const offset = {
          x: point1.x - point2.x,
          y: point1.y - point2.y
        };

        return {
          satisfied: true,
          entityUpdates: {
            [entity2.id]: this.applyOffsetToEntity(entity2, offset)
          }
        };
      }
    }

    return {
      satisfied: false,
      entityUpdates: {},
      error: 'Coincident constraint not applicable to these entities'
    };
  }

  private solveParallelConstraint(constraint: Constraint, entities: AnyEntity[]): ConstraintSolution {
    if (entities.length !== 2 || entities[0].type !== 'line' || entities[1].type !== 'line') {
      return {
        satisfied: false,
        entityUpdates: {},
        error: 'Parallel constraint requires exactly 2 lines'
      };
    }

    const line1 = entities[0] as any;
    const line2 = entities[1] as any;

    // Calculate angles
    const angle1 = Math.atan2(
      line1.endPoint.y - line1.startPoint.y,
      line1.endPoint.x - line1.startPoint.x
    );

    const angle2 = Math.atan2(
      line2.endPoint.y - line2.startPoint.y,
      line2.endPoint.x - line2.startPoint.x
    );

    // If already parallel, no changes needed
    if (Math.abs(angle1 - angle2) < 0.001) {
      return {
        satisfied: true,
        entityUpdates: {}
      };
    }

    // Rotate second line to be parallel to first
    const length = Math.sqrt(
      Math.pow(line2.endPoint.x - line2.startPoint.x, 2) +
      Math.pow(line2.endPoint.y - line2.startPoint.y, 2)
    );

    const newEndPoint = {
      x: line2.startPoint.x + length * Math.cos(angle1),
      y: line2.startPoint.y + length * Math.sin(angle1)
    };

    return {
      satisfied: true,
      entityUpdates: {
        [line2.id]: {
          endPoint: newEndPoint
        }
      }
    };
  }

  private solvePerpendicularConstraint(constraint: Constraint, entities: AnyEntity[]): ConstraintSolution {
    if (entities.length !== 2 || entities[0].type !== 'line' || entities[1].type !== 'line') {
      return {
        satisfied: false,
        entityUpdates: {},
        error: 'Perpendicular constraint requires exactly 2 lines'
      };
    }

    const line1 = entities[0] as any;
    const line2 = entities[1] as any;

    // Calculate angle for first line
    const angle1 = Math.atan2(
      line1.endPoint.y - line1.startPoint.y,
      line1.endPoint.x - line1.startPoint.x
    );

    // Perpendicular angle is 90 degrees (π/2 radians) offset
    const perpendicularAngle = angle1 + Math.PI / 2;

    const length = Math.sqrt(
      Math.pow(line2.endPoint.x - line2.startPoint.x, 2) +
      Math.pow(line2.endPoint.y - line2.startPoint.y, 2)
    );

    const newEndPoint = {
      x: line2.startPoint.x + length * Math.cos(perpendicularAngle),
      y: line2.startPoint.y + length * Math.sin(perpendicularAngle)
    };

    return {
      satisfied: true,
      entityUpdates: {
        [line2.id]: {
          endPoint: newEndPoint
        }
      }
    };
  }

  private solveHorizontalConstraint(constraint: Constraint, entities: AnyEntity[]): ConstraintSolution {
    if (entities.length !== 1 || entities[0].type !== 'line') {
      return {
        satisfied: false,
        entityUpdates: {},
        error: 'Horizontal constraint requires exactly 1 line'
      };
    }

    const line = entities[0] as any;

    // Make line horizontal by adjusting end point Y to match start point Y
    return {
      satisfied: true,
      entityUpdates: {
        [line.id]: {
          endPoint: {
            x: line.endPoint.x,
            y: line.startPoint.y
          }
        }
      }
    };
  }

  private solveVerticalConstraint(constraint: Constraint, entities: AnyEntity[]): ConstraintSolution {
    if (entities.length !== 1 || entities[0].type !== 'line') {
      return {
        satisfied: false,
        entityUpdates: {},
        error: 'Vertical constraint requires exactly 1 line'
      };
    }

    const line = entities[0] as any;

    // Make line vertical by adjusting end point X to match start point X
    return {
      satisfied: true,
      entityUpdates: {
        [line.id]: {
          endPoint: {
            x: line.startPoint.x,
            y: line.endPoint.y
          }
        }
      }
    };
  }

  private getEntityReferencePoint(entity: AnyEntity): Point | null {
    switch (entity.type) {
      case 'line': {
        const line = entity as any;
        return line.startPoint;
      }
      case 'circle': {
        const circle = entity as any;
        return circle.center;
      }
      case 'rectangle': {
        const rect = entity as any;
        return rect.position;
      }
      default:
        return null;
    }
  }

  private applyOffsetToEntity(entity: AnyEntity, offset: Point): Partial<AnyEntity> {
    const updates: any = {};

    if (entity.type === 'line') {
      const line = entity as any;
      updates.startPoint = {
        x: line.startPoint.x + offset.x,
        y: line.startPoint.y + offset.y
      };
      updates.endPoint = {
        x: line.endPoint.x + offset.x,
        y: line.endPoint.y + offset.y
      };
    } else if (entity.type === 'circle') {
      const circle = entity as any;
      updates.center = {
        x: circle.center.x + offset.x,
        y: circle.center.y + offset.y
      };
    } else if (entity.type === 'rectangle') {
      const rect = entity as any;
      updates.position = {
        x: rect.position.x + offset.x,
        y: rect.position.y + offset.y
      };
    }

    return updates;
  }

  createAutoConstraints(entityIds: string[]): string[] {
    const autoConstraints: string[] = [];
    const entities = entityIds
      .map(id => this.entities.get(id))
      .filter(Boolean) as AnyEntity[];

    // Auto-create constraints based on geometric relationships
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const entity1 = entities[i];
        const entity2 = entities[j];

        // Auto-detect parallel lines
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

          const angleDiff = Math.abs(angle1 - angle2);
          
          // If lines are nearly parallel (within 5 degrees)
          if (angleDiff < 0.087 || Math.abs(angleDiff - Math.PI) < 0.087) {
            const constraintId = this.createConstraint({
              type: ConstraintType.PARALLEL,
              entityIds: [entity1.id, entity2.id]
            });
            if (constraintId) {
              autoConstraints.push(constraintId);
            }
          }

          // If lines are nearly perpendicular (within 5 degrees of 90 degrees)
          const perpDiff = Math.abs(angleDiff - Math.PI / 2);
          const perpDiff2 = Math.abs(angleDiff - 3 * Math.PI / 2);
          if (perpDiff < 0.087 || perpDiff2 < 0.087) {
            const constraintId = this.createConstraint({
              type: ConstraintType.PERPENDICULAR,
              entityIds: [entity1.id, entity2.id]
            });
            if (constraintId) {
              autoConstraints.push(constraintId);
            }
          }
        }
      }
    }

    console.log(`🤖 Auto-created ${autoConstraints.length} constraints`);
    return autoConstraints;
  }
}
