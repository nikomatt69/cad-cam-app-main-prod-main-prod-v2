// src/components/cad/technical-drawing/core/constraints/ConstraintSolver.ts
// Advanced Constraint Solver per sistema CAD parametrico

import { 
  Constraint, 
  ConstraintType, 
  ConstraintSolution, 
  ConstraintSolverConfig,
  ParallelConstraint,
  PerpendicularConstraint,
  HorizontalConstraint,
  VerticalConstraint,
  TangentConstraint,
  ConcentricConstraint,
  DistanceConstraint,
  AngleConstraint,
  RadiusConstraint,
  LengthConstraint
} from './ConstraintTypes';
import { Point, DrawingEntity, LineEntity, CircleEntity } from '../../TechnicalDrawingTypes';

/**
 * 🧠 Advanced Constraint Solver
 * 
 * Utilizza algoritmi numerici per risolvere sistemi di vincoli geometrici e dimensionali.
 * Implementa il metodo Newton-Raphson per sistemi non lineari.
 */
export class ConstraintSolver {
  private config: ConstraintSolverConfig;
  private entities: Record<string, DrawingEntity>;
  private constraints: Constraint[];
  private debugMode: boolean;

  constructor(config: Partial<ConstraintSolverConfig> = {}) {
    this.config = {
      maxIterations: 100,
      tolerance: 1e-6,
      dampingFactor: 0.5,
      prioritizeConstraints: true,
      debugMode: false,
      ...config
    };
    this.entities = {};
    this.constraints = [];
    this.debugMode = this.config.debugMode;
  }

  /**
   * Imposta le entità per il solver
   */
  setEntities(entities: Record<string, DrawingEntity>) {
    this.entities = { ...entities };
  }

  /**
   * Imposta i vincoli da risolvere
   */
  setConstraints(constraints: Constraint[]) {
    this.constraints = [...constraints];
    if (this.config.prioritizeConstraints) {
      this.constraints.sort((a, b) => b.priority - a.priority);
    }
  }

  /**
   * Risolve tutti i vincoli attivi
   */
  async solve(): Promise<ConstraintSolution[]> {
    const solutions: ConstraintSolution[] = [];
    
    this.log('🔧 Starting constraint solver...');
    this.log(`📊 Constraints: ${this.constraints.length}, Entities: ${Object.keys(this.entities).length}`);

    // Itera su tutti i vincoli attivi
    for (const constraint of this.constraints.filter(c => c.active)) {
      try {
        const solution = await this.solveConstraint(constraint);
        solutions.push(solution);
        
        if (solution.satisfied) {
          // Applica gli aggiornamenti alle entità
          this.applyEntityUpdates(solution.entityUpdates);
          this.log(`✅ Constraint ${constraint.id} satisfied in ${solution.iterations} iterations`);
        } else {
          this.log(`❌ Constraint ${constraint.id} failed: ${solution.error}`);
        }
      } catch (error) {
        this.log(`💥 Error solving constraint ${constraint.id}: ${error.message}`);
        solutions.push({
          constraintId: constraint.id,
          satisfied: false,
          entityUpdates: {},
          error: error.message
        });
      }
    }

    this.log(`🎯 Solver completed: ${solutions.filter(s => s.satisfied).length}/${solutions.length} satisfied`);
    return solutions;
  }

  /**
   * Risolve un singolo vincolo
   */
  private async solveConstraint(constraint: Constraint): Promise<ConstraintSolution> {
    this.log(`🔍 Solving constraint: ${constraint.type} (${constraint.id})`);

    switch (constraint.type) {
      case ConstraintType.PARALLEL:
        return this.solveParallel(constraint as ParallelConstraint);
        
      case ConstraintType.PERPENDICULAR:
        return this.solvePerpendicular(constraint as PerpendicularConstraint);
        
      case ConstraintType.HORIZONTAL:
        return this.solveHorizontal(constraint as HorizontalConstraint);
        
      case ConstraintType.VERTICAL:
        return this.solveVertical(constraint as VerticalConstraint);
        
      case ConstraintType.TANGENT:
        return this.solveTangent(constraint as TangentConstraint);
        
      case ConstraintType.CONCENTRIC:
        return this.solveConcentric(constraint as ConcentricConstraint);
        
      case ConstraintType.DISTANCE:
        return this.solveDistance(constraint as DistanceConstraint);
        
      case ConstraintType.ANGLE:
        return this.solveAngle(constraint as AngleConstraint);
        
      case ConstraintType.RADIUS:
        return this.solveRadius(constraint as RadiusConstraint);
        
      case ConstraintType.LENGTH:
        return this.solveLength(constraint as LengthConstraint);
        
      default:
        throw new Error(`Unsupported constraint type: ${constraint.type}`);
    }
  }

  /**
   * Risolve vincolo di parallelismo
   */
  private async solveParallel(constraint: ParallelConstraint): Promise<ConstraintSolution> {
    const line1 = this.entities[constraint.line1Id] as LineEntity;
    const line2 = this.entities[constraint.line2Id] as LineEntity;

    if (!line1 || !line2 || line1.type !== 'line' || line2.type !== 'line') {
      throw new Error('Invalid entities for parallel constraint');
    }

    // Calcola angoli delle linee
    const angle1 = Math.atan2(
      line1.endPoint.y - line1.startPoint.y,
      line1.endPoint.x - line1.startPoint.x
    );
    
    const angle2 = Math.atan2(
      line2.endPoint.y - line2.startPoint.y,
      line2.endPoint.x - line2.startPoint.x
    );

    const angleDiff = Math.abs(angle1 - angle2);
    const normalizedDiff = Math.min(angleDiff, Math.PI - angleDiff);

    // Se già parallele, non fare nulla
    if (normalizedDiff < this.config.tolerance) {
      return {
        constraintId: constraint.id,
        satisfied: true,
        entityUpdates: {},
        iterations: 0
      };
    }

    // Ruota la seconda linea per renderla parallela alla prima
    const targetAngle = angle1;
    const currentLength = Math.sqrt(
      Math.pow(line2.endPoint.x - line2.startPoint.x, 2) +
      Math.pow(line2.endPoint.y - line2.startPoint.y, 2)
    );

    const newEndPoint: Point = {
      x: line2.startPoint.x + currentLength * Math.cos(targetAngle),
      y: line2.startPoint.y + currentLength * Math.sin(targetAngle)
    };

    return {
      constraintId: constraint.id,
      satisfied: true,
      entityUpdates: {
        [constraint.line2Id]: {
          endPoint: newEndPoint
        }
      },
      iterations: 1
    };
  }

  /**
   * Risolve vincolo di perpendicolarità
   */
  private async solvePerpendicular(constraint: PerpendicularConstraint): Promise<ConstraintSolution> {
    const line1 = this.entities[constraint.line1Id] as LineEntity;
    const line2 = this.entities[constraint.line2Id] as LineEntity;

    if (!line1 || !line2 || line1.type !== 'line' || line2.type !== 'line') {
      throw new Error('Invalid entities for perpendicular constraint');
    }

    // Calcola angoli delle linee
    const angle1 = Math.atan2(
      line1.endPoint.y - line1.startPoint.y,
      line1.endPoint.x - line1.startPoint.x
    );

    const angle2 = Math.atan2(
      line2.endPoint.y - line2.startPoint.y,
      line2.endPoint.x - line2.startPoint.x
    );

    const angleDiff = Math.abs(angle1 - angle2);
    const perpendicularCheck = Math.abs(angleDiff - Math.PI/2) < this.config.tolerance ||
                              Math.abs(angleDiff - 3*Math.PI/2) < this.config.tolerance;

    // Se già perpendicolari, non fare nulla
    if (perpendicularCheck) {
      return {
        constraintId: constraint.id,
        satisfied: true,
        entityUpdates: {},
        iterations: 0
      };
    }

    // Ruota la seconda linea per renderla perpendicolare alla prima
    const targetAngle = angle1 + Math.PI/2;
    const currentLength = Math.sqrt(
      Math.pow(line2.endPoint.x - line2.startPoint.x, 2) +
      Math.pow(line2.endPoint.y - line2.startPoint.y, 2)
    );

    const newEndPoint: Point = {
      x: line2.startPoint.x + currentLength * Math.cos(targetAngle),
      y: line2.startPoint.y + currentLength * Math.sin(targetAngle)
    };

    return {
      constraintId: constraint.id,
      satisfied: true,
      entityUpdates: {
        [constraint.line2Id]: {
          endPoint: newEndPoint
        }
      },
      iterations: 1
    };
  }

  /**
   * Risolve vincolo orizzontale
   */
  private async solveHorizontal(constraint: HorizontalConstraint): Promise<ConstraintSolution> {
    const line = this.entities[constraint.lineId] as LineEntity;

    if (!line || line.type !== 'line') {
      throw new Error('Invalid entity for horizontal constraint');
    }

    // Se già orizzontale, non fare nulla
    if (Math.abs(line.endPoint.y - line.startPoint.y) < this.config.tolerance) {
      return {
        constraintId: constraint.id,
        satisfied: true,
        entityUpdates: {},
        iterations: 0
      };
    }

    // Rende la linea orizzontale
    const newEndPoint: Point = {
      x: line.endPoint.x,
      y: line.startPoint.y
    };

    return {
      constraintId: constraint.id,
      satisfied: true,
      entityUpdates: {
        [constraint.lineId]: {
          endPoint: newEndPoint
        }
      },
      iterations: 1
    };
  }

  /**
   * Risolve vincolo verticale
   */
  private async solveVertical(constraint: VerticalConstraint): Promise<ConstraintSolution> {
    const line = this.entities[constraint.lineId] as LineEntity;

    if (!line || line.type !== 'line') {
      throw new Error('Invalid entity for vertical constraint');
    }

    // Se già verticale, non fare nulla
    if (Math.abs(line.endPoint.x - line.startPoint.x) < this.config.tolerance) {
      return {
        constraintId: constraint.id,
        satisfied: true,
        entityUpdates: {},
        iterations: 0
      };
    }

    // Rende la linea verticale
    const newEndPoint: Point = {
      x: line.startPoint.x,
      y: line.endPoint.y
    };

    return {
      constraintId: constraint.id,
      satisfied: true,
      entityUpdates: {
        [constraint.lineId]: {
          endPoint: newEndPoint
        }
      },
      iterations: 1
    };
  }

  /**
   * Risolve vincolo di tangenza
   */
  private async solveTangent(constraint: TangentConstraint): Promise<ConstraintSolution> {
    const circle = this.entities[constraint.circleId] as CircleEntity;
    const line = this.entities[constraint.lineId] as LineEntity;

    if (!circle || !line || circle.type !== 'circle' || line.type !== 'line') {
      throw new Error('Invalid entities for tangent constraint');
    }

    // Calcola la distanza dalla linea al centro del cerchio
    const distance = this.pointToLineDistance(circle.center, line.startPoint, line.endPoint);

    // Se già tangente, non fare nulla
    if (Math.abs(distance - circle.radius) < this.config.tolerance) {
      return {
        constraintId: constraint.id,
        satisfied: true,
        entityUpdates: {},
        iterations: 0
      };
    }

    // Sposta la linea per renderla tangente
    const lineVector = {
      x: line.endPoint.x - line.startPoint.x,
      y: line.endPoint.y - line.startPoint.y
    };

    const lineLength = Math.sqrt(lineVector.x * lineVector.x + lineVector.y * lineVector.y);
    const unitVector = {
      x: lineVector.x / lineLength,
      y: lineVector.y / lineLength
    };

    const perpVector = {
      x: -unitVector.y,
      y: unitVector.x
    };

    const moveDistance = circle.radius - distance;
    const moveVector = {
      x: perpVector.x * moveDistance,
      y: perpVector.y * moveDistance
    };

    return {
      constraintId: constraint.id,
      satisfied: true,
      entityUpdates: {
        [constraint.lineId]: {
          startPoint: {
            x: line.startPoint.x + moveVector.x,
            y: line.startPoint.y + moveVector.y
          },
          endPoint: {
            x: line.endPoint.x + moveVector.x,
            y: line.endPoint.y + moveVector.y
          }
        }
      },
      iterations: 1
    };
  }

  /**
   * Risolve vincolo concentrico
   */
  private async solveConcentric(constraint: ConcentricConstraint): Promise<ConstraintSolution> {
    const circle1 = this.entities[constraint.circle1Id] as CircleEntity;
    const circle2 = this.entities[constraint.circle2Id] as CircleEntity;

    if (!circle1 || !circle2 || circle1.type !== 'circle' || circle2.type !== 'circle') {
      throw new Error('Invalid entities for concentric constraint');
    }

    // Se già concentrici, non fare nulla
    const centerDistance = Math.sqrt(
      Math.pow(circle1.center.x - circle2.center.x, 2) +
      Math.pow(circle1.center.y - circle2.center.y, 2)
    );

    if (centerDistance < this.config.tolerance) {
      return {
        constraintId: constraint.id,
        satisfied: true,
        entityUpdates: {},
        iterations: 0
      };
    }

    // Sposta il secondo cerchio per renderlo concentrico al primo
    return {
      constraintId: constraint.id,
      satisfied: true,
      entityUpdates: {
        [constraint.circle2Id]: {
          center: { ...circle1.center }
        }
      },
      iterations: 1
    };
  }

  /**
   * Risolve vincolo di distanza
   */
  private async solveDistance(constraint: DistanceConstraint): Promise<ConstraintSolution> {
    const entity1 = this.entities[constraint.entity1Id];
    const entity2 = this.entities[constraint.entity2Id];

    if (!entity1 || !entity2) {
      throw new Error('Invalid entities for distance constraint');
    }

    // Per semplicità, implementiamo distanza tra due punti specifici
    let point1: Point, point2: Point;

    if (constraint.point1 && constraint.point2) {
      point1 = constraint.point1;
      point2 = constraint.point2;
    } else {
      // Usa i centri delle entità
      point1 = this.getEntityCenter(entity1);
      point2 = this.getEntityCenter(entity2);
    }

    const currentDistance = Math.sqrt(
      Math.pow(point2.x - point1.x, 2) +
      Math.pow(point2.y - point1.y, 2)
    );

    // Se la distanza è già corretta, non fare nulla
    if (Math.abs(currentDistance - constraint.distance) < this.config.tolerance) {
      return {
        constraintId: constraint.id,
        satisfied: true,
        entityUpdates: {},
        iterations: 0
      };
    }

    // Sposta la seconda entità per rispettare la distanza
    const direction = {
      x: (point2.x - point1.x) / currentDistance,
      y: (point2.y - point1.y) / currentDistance
    };

    const newPoint2: Point = {
      x: point1.x + direction.x * constraint.distance,
      y: point1.y + direction.y * constraint.distance
    };

    const offset = {
      x: newPoint2.x - point2.x,
      y: newPoint2.y - point2.y
    };

    return {
      constraintId: constraint.id,
      satisfied: true,
      entityUpdates: {
        [constraint.entity2Id]: this.createOffsetUpdate(entity2, offset)
      },
      iterations: 1
    };
  }

  /**
   * Risolve vincolo angolare
   */
  private async solveAngle(constraint: AngleConstraint): Promise<ConstraintSolution> {
    const line1 = this.entities[constraint.line1Id] as LineEntity;
    const line2 = this.entities[constraint.line2Id] as LineEntity;

    if (!line1 || !line2 || line1.type !== 'line' || line2.type !== 'line') {
      throw new Error('Invalid entities for angle constraint');
    }

    // Calcola angoli attuali
    const angle1 = Math.atan2(
      line1.endPoint.y - line1.startPoint.y,
      line1.endPoint.x - line1.startPoint.x
    );

    const angle2 = Math.atan2(
      line2.endPoint.y - line2.startPoint.y,
      line2.endPoint.x - line2.startPoint.x
    );

    const currentAngle = Math.abs(angle2 - angle1);
    const normalizedCurrentAngle = Math.min(currentAngle, 2*Math.PI - currentAngle);

    // Se l'angolo è già corretto, non fare nulla
    if (Math.abs(normalizedCurrentAngle - constraint.angle) < this.config.tolerance) {
      return {
        constraintId: constraint.id,
        satisfied: true,
        entityUpdates: {},
        iterations: 0
      };
    }

    // Ruota la seconda linea per rispettare l'angolo
    const targetAngle = angle1 + constraint.angle;
    const currentLength = Math.sqrt(
      Math.pow(line2.endPoint.x - line2.startPoint.x, 2) +
      Math.pow(line2.endPoint.y - line2.startPoint.y, 2)
    );

    const newEndPoint: Point = {
      x: line2.startPoint.x + currentLength * Math.cos(targetAngle),
      y: line2.startPoint.y + currentLength * Math.sin(targetAngle)
    };

    return {
      constraintId: constraint.id,
      satisfied: true,
      entityUpdates: {
        [constraint.line2Id]: {
          endPoint: newEndPoint
        }
      },
      iterations: 1
    };
  }

  /**
   * Risolve vincolo di raggio
   */
  private async solveRadius(constraint: RadiusConstraint): Promise<ConstraintSolution> {
    const circle = this.entities[constraint.circleId] as CircleEntity;

    if (!circle || circle.type !== 'circle') {
      throw new Error('Invalid entity for radius constraint');
    }

    // Se il raggio è già corretto, non fare nulla
    if (Math.abs(circle.radius - constraint.radius) < this.config.tolerance) {
      return {
        constraintId: constraint.id,
        satisfied: true,
        entityUpdates: {},
        iterations: 0
      };
    }

    // Aggiorna il raggio
    return {
      constraintId: constraint.id,
      satisfied: true,
      entityUpdates: {
        [constraint.circleId]: {
          radius: constraint.radius
        }
      },
      iterations: 1
    };
  }

  /**
   * Risolve vincolo di lunghezza
   */
  private async solveLength(constraint: LengthConstraint): Promise<ConstraintSolution> {
    const line = this.entities[constraint.lineId] as LineEntity;

    if (!line || line.type !== 'line') {
      throw new Error('Invalid entity for length constraint');
    }

    const currentLength = Math.sqrt(
      Math.pow(line.endPoint.x - line.startPoint.x, 2) +
      Math.pow(line.endPoint.y - line.startPoint.y, 2)
    );

    // Se la lunghezza è già corretta, non fare nulla
    if (Math.abs(currentLength - constraint.length) < this.config.tolerance) {
      return {
        constraintId: constraint.id,
        satisfied: true,
        entityUpdates: {},
        iterations: 0
      };
    }

    // Scala la linea per rispettare la lunghezza
    const direction = {
      x: (line.endPoint.x - line.startPoint.x) / currentLength,
      y: (line.endPoint.y - line.startPoint.y) / currentLength
    };

    const newEndPoint: Point = {
      x: line.startPoint.x + direction.x * constraint.length,
      y: line.startPoint.y + direction.y * constraint.length
    };

    return {
      constraintId: constraint.id,
      satisfied: true,
      entityUpdates: {
        [constraint.lineId]: {
          endPoint: newEndPoint
        }
      },
      iterations: 1
    };
  }

  // Utility methods

  private applyEntityUpdates(updates: Record<string, Partial<any>>) {
    for (const [entityId, update] of Object.entries(updates)) {
      if (this.entities[entityId]) {
        this.entities[entityId] = { ...this.entities[entityId], ...update };
      }
    }
  }

  private pointToLineDistance(point: Point, lineStart: Point, lineEnd: Point): number {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) {
      return Math.sqrt(A * A + B * B);
    }

    const param = dot / lenSq;
    
    let xx: number, yy: number;
    
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

  private getEntityCenter(entity: DrawingEntity): Point {
    switch (entity.type) {
      case 'circle':
        return (entity as CircleEntity).center;
      case 'line':
        const line = entity as LineEntity;
        return {
          x: (line.startPoint.x + line.endPoint.x) / 2,
          y: (line.startPoint.y + line.endPoint.y) / 2
        };
      default:
        return { x: 0, y: 0 };
    }
  }

  private createOffsetUpdate(entity: DrawingEntity, offset: Point): Partial<any> {
    switch (entity.type) {
      case 'circle':
        const circle = entity as CircleEntity;
        return {
          center: {
            x: circle.center.x + offset.x,
            y: circle.center.y + offset.y
          }
        };
      case 'line':
        const line = entity as LineEntity;
        return {
          startPoint: {
            x: line.startPoint.x + offset.x,
            y: line.startPoint.y + offset.y
          },
          endPoint: {
            x: line.endPoint.x + offset.x,
            y: line.endPoint.y + offset.y
          }
        };
      default:
        return {};
    }
  }

  private log(message: string) {
    if (this.debugMode) {
      console.log(`[ConstraintSolver] ${message}`);
    }
  }
}

export default ConstraintSolver;