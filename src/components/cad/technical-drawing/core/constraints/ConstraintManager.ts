// src/components/cad/technical-drawing/core/constraints/ConstraintManager.ts
// Sistema di gestione vincoli parametrici

import { v4 as uuidv4 } from 'uuid';
import { 
  Constraint, 
  ConstraintType, 
  ConstraintCreationParams, 
  ConstraintValidation,
  ConstraintVisual,
  ConstraintSolution
} from './ConstraintTypes';
import ConstraintSolver from './ConstraintSolver';
import { DrawingEntity, Point } from '../../TechnicalDrawingTypes';

/**
 * 🎛️ Constraint Manager
 * 
 * Gestisce la creazione, validazione, visualizzazione e risoluzione
 * di tutti i vincoli parametrici nel sistema CAD.
 */
export class ConstraintManager {
  private constraints: Map<string, Constraint> = new Map();
  private solver: ConstraintSolver;
  private entities: Record<string, DrawingEntity> = {};
  private visualizations: Map<string, ConstraintVisual> = new Map();
  private changeListeners: ((constraints: Constraint[]) => void)[] = [];

  constructor() {
    this.solver = new ConstraintSolver({
      maxIterations: 100,
      tolerance: 1e-6,
      dampingFactor: 0.5,
      prioritizeConstraints: true,
      debugMode: true
    });
  }

  /**
   * Aggiorna le entità nel manager
   */
  updateEntities(entities: Record<string, DrawingEntity>) {
    this.entities = { ...entities };
    this.solver.setEntities(this.entities);
  }

  /**
   * Crea un nuovo vincolo
   */
  createConstraint(params: ConstraintCreationParams): string | null {
    // Valida i parametri
    const validation = this.validateConstraintParams(params);
    if (!validation.valid) {
      console.error(`Cannot create constraint: ${validation.reason}`);
      return null;
    }

    // Crea il vincolo
    const constraint = this.buildConstraint(params);
    if (!constraint) {
      console.error(`Failed to build constraint of type: ${params.type}`);
      return null;
    }

    // Aggiungi alla collezione
    this.constraints.set(constraint.id, constraint);
    
    // Crea visualizzazione
    this.createConstraintVisualization(constraint);
    
    // Notifica i listener
    this.notifyListeners();
    
    console.log(`✅ Created constraint: ${constraint.type} (${constraint.id})`);
    return constraint.id;
  }

  /**
   * Rimuove un vincolo
   */
  removeConstraint(constraintId: string): boolean {
    if (!this.constraints.has(constraintId)) {
      return false;
    }

    this.constraints.delete(constraintId);
    this.visualizations.delete(constraintId);
    this.notifyListeners();
    
    console.log(`🗑️ Removed constraint: ${constraintId}`);
    return true;
  }

  /**
   * Attiva/disattiva un vincolo
   */
  toggleConstraint(constraintId: string, active?: boolean): boolean {
    const constraint = this.constraints.get(constraintId);
    if (!constraint) {
      return false;
    }

    constraint.active = active !== undefined ? active : !constraint.active;
    
    // Aggiorna visualizzazione
    const visual = this.visualizations.get(constraintId);
    if (visual) {
      visual.visible = constraint.active;
    }
    
    this.notifyListeners();
    return true;
  }

  /**
   * Ottiene tutti i vincoli
   */
  getAllConstraints(): Constraint[] {
    return Array.from(this.constraints.values());
  }

  /**
   * Ottiene vincoli per entità
   */
  getConstraintsForEntity(entityId: string): Constraint[] {
    return Array.from(this.constraints.values()).filter(
      constraint => constraint.entityIds.includes(entityId)
    );
  }

  /**
   * Ottiene vincoli attivi
   */
  getActiveConstraints(): Constraint[] {
    return Array.from(this.constraints.values()).filter(c => c.active);
  }

  /**
   * Risolve tutti i vincoli attivi
   */
  async solveConstraints(): Promise<ConstraintSolution[]> {
    const activeConstraints = this.getActiveConstraints();
    if (activeConstraints.length === 0) {
      return [];
    }

    console.log(`🔧 Solving ${activeConstraints.length} active constraints...`);
    
    this.solver.setConstraints(activeConstraints);
    const solutions = await this.solver.solve();
    
    // Aggiorna stato di soddisfazione dei vincoli
    solutions.forEach(solution => {
      const constraint = this.constraints.get(solution.constraintId);
      if (constraint) {
        constraint.satisfied = solution.satisfied;
      }
    });
    
    this.notifyListeners();
    return solutions;
  }

  /**
   * Ottiene visualizzazioni dei vincoli
   */
  getConstraintVisuals(): ConstraintVisual[] {
    return Array.from(this.visualizations.values()).filter(v => v.visible);
  }

  /**
   * Aggiunge listener per cambiamenti
   */
  addChangeListener(listener: (constraints: Constraint[]) => void) {
    this.changeListeners.push(listener);
  }

  /**
   * Rimuove listener
   */
  removeChangeListener(listener: (constraints: Constraint[]) => void) {
    const index = this.changeListeners.indexOf(listener);
    if (index > -1) {
      this.changeListeners.splice(index, 1);
    }
  }

  /**
   * Crea vincoli automatici per pattern comuni
   */
  createAutoConstraints(entityIds: string[]): string[] {
    const createdIds: string[] = [];
    
    if (entityIds.length === 2) {
      const entity1 = this.entities[entityIds[0]];
      const entity2 = this.entities[entityIds[1]];
      
      if (entity1 && entity2) {
        // Auto-vincoli per due linee
        if (entity1.type === 'line' && entity2.type === 'line') {
          const constraint = this.suggestLineConstraints(entityIds[0], entityIds[1]);
          if (constraint) {
            const id = this.createConstraint(constraint);
            if (id) createdIds.push(id);
          }
        }
        
        // Auto-vincoli per due cerchi
        if (entity1.type === 'circle' && entity2.type === 'circle') {
          const constraint = this.suggestCircleConstraints(entityIds[0], entityIds[1]);
          if (constraint) {
            const id = this.createConstraint(constraint);
            if (id) createdIds.push(id);
          }
        }
      }
    }
    
    return createdIds;
  }

  // Private methods

  private buildConstraint(params: ConstraintCreationParams): Constraint | null {
    const baseConstraint = {
      id: uuidv4(),
      type: params.type,
      entityIds: params.entityIds,
      active: true,
      satisfied: false,
      priority: params.priority || 1,
      description: params.description,
      metadata: {}
    };

    switch (params.type) {
      case ConstraintType.PARALLEL:
        if (params.entityIds.length !== 2) return null;
        return {
          ...baseConstraint,
          line1Id: params.entityIds[0],
          line2Id: params.entityIds[1]
        } as any;

      case ConstraintType.PERPENDICULAR:
        if (params.entityIds.length !== 2) return null;
        return {
          ...baseConstraint,
          line1Id: params.entityIds[0],
          line2Id: params.entityIds[1]
        } as any;

      case ConstraintType.HORIZONTAL:
        if (params.entityIds.length !== 1) return null;
        return {
          ...baseConstraint,
          lineId: params.entityIds[0]
        } as any;

      case ConstraintType.VERTICAL:
        if (params.entityIds.length !== 1) return null;
        return {
          ...baseConstraint,
          lineId: params.entityIds[0]
        } as any;

      case ConstraintType.TANGENT:
        if (params.entityIds.length !== 2) return null;
        return {
          ...baseConstraint,
          circleId: params.entityIds[0],
          lineId: params.entityIds[1],
          touchPoint: params.point
        } as any;

      case ConstraintType.CONCENTRIC:
        if (params.entityIds.length !== 2) return null;
        return {
          ...baseConstraint,
          circle1Id: params.entityIds[0],
          circle2Id: params.entityIds[1]
        } as any;

      case ConstraintType.DISTANCE:
        if (params.entityIds.length !== 2 || !params.value) return null;
        return {
          ...baseConstraint,
          entity1Id: params.entityIds[0],
          entity2Id: params.entityIds[1],
          distance: params.value
        } as any;

      case ConstraintType.ANGLE:
        if (params.entityIds.length !== 2 || !params.value) return null;
        return {
          ...baseConstraint,
          line1Id: params.entityIds[0],
          line2Id: params.entityIds[1],
          angle: params.value * Math.PI / 180 // Convert to radians
        } as any;

      case ConstraintType.RADIUS:
        if (params.entityIds.length !== 1 || !params.value) return null;
        return {
          ...baseConstraint,
          circleId: params.entityIds[0],
          radius: params.value
        } as any;

      case ConstraintType.LENGTH:
        if (params.entityIds.length !== 1 || !params.value) return null;
        return {
          ...baseConstraint,
          lineId: params.entityIds[0],
          length: params.value
        } as any;

      default:
        return null;
    }
  }

  private validateConstraintParams(params: ConstraintCreationParams): ConstraintValidation {
    // Verifica entità esistenti
    for (const entityId of params.entityIds) {
      if (!this.entities[entityId]) {
        return {
          valid: false,
          reason: `Entity ${entityId} not found`,
          suggestions: ['Check entity IDs']
        };
      }
    }

    // Verifica tipo-specifica
    switch (params.type) {
      case ConstraintType.PARALLEL:
      case ConstraintType.PERPENDICULAR:
        if (params.entityIds.length !== 2) {
          return {
            valid: false,
            reason: 'Requires exactly 2 entities',
            suggestions: ['Select 2 lines']
          };
        }
        
        const line1 = this.entities[params.entityIds[0]];
        const line2 = this.entities[params.entityIds[1]];
        
        if (line1.type !== 'line' || line2.type !== 'line') {
          return {
            valid: false,
            reason: 'Both entities must be lines',
            suggestions: ['Select line entities only']
          };
        }
        break;

      case ConstraintType.DISTANCE:
      case ConstraintType.ANGLE:
      case ConstraintType.RADIUS:
      case ConstraintType.LENGTH:
        if (!params.value || params.value <= 0) {
          return {
            valid: false,
            reason: 'Requires positive value',
            suggestions: ['Provide a positive numeric value']
          };
        }
        break;
    }

    return { valid: true };
  }

  private createConstraintVisualization(constraint: Constraint) {
    const position = this.calculateConstraintPosition(constraint);
    const symbol = this.getConstraintSymbol(constraint.type);
    
    const visual: ConstraintVisual = {
      constraintId: constraint.id,
      type: 'symbol',
      position,
      size: 16,
      color: constraint.satisfied ? '#52c41a' : '#1890ff',
      visible: constraint.active,
      symbol
    };
    
    this.visualizations.set(constraint.id, visual);
  }

  private calculateConstraintPosition(constraint: Constraint): Point {
    // Calcola posizione media delle entità coinvolte
    const entityPositions = constraint.entityIds.map(id => {
      const entity = this.entities[id];
      return this.getEntityCenter(entity);
    });

    if (entityPositions.length === 0) {
      return { x: 0, y: 0 };
    }

    const avgX = entityPositions.reduce((sum, pos) => sum + pos.x, 0) / entityPositions.length;
    const avgY = entityPositions.reduce((sum, pos) => sum + pos.y, 0) / entityPositions.length;

    return { x: avgX, y: avgY };
  }

  private getEntityCenter(entity: DrawingEntity): Point {
    switch (entity.type) {
      case 'circle':
        return (entity as any).center;
      case 'line':
        const line = entity as any;
        return {
          x: (line.startPoint.x + line.endPoint.x) / 2,
          y: (line.startPoint.y + line.endPoint.y) / 2
        };
      default:
        return { x: 0, y: 0 };
    }
  }

  private getConstraintSymbol(type: ConstraintType): string {
    const symbols: Record<ConstraintType, string> = {
      [ConstraintType.PARALLEL]: '∥',
      [ConstraintType.PERPENDICULAR]: '⊥',
      [ConstraintType.HORIZONTAL]: '─',
      [ConstraintType.VERTICAL]: '│',
      [ConstraintType.TANGENT]: '○',
      [ConstraintType.CONCENTRIC]: '◎',
      [ConstraintType.COLLINEAR]: '···',
      [ConstraintType.COINCIDENT]: '●',
      [ConstraintType.EQUAL_LENGTH]: '=',
      [ConstraintType.EQUAL_RADIUS]: '≈',
      [ConstraintType.SYMMETRIC]: '↔',
      [ConstraintType.MIDPOINT]: '⊡',
      [ConstraintType.DISTANCE]: 'D',
      [ConstraintType.ANGLE]: '∠',
      [ConstraintType.RADIUS]: 'R',
      [ConstraintType.DIAMETER]: 'Ø',
      [ConstraintType.LENGTH]: 'L',
      [ConstraintType.PATTERN]: '#',
      [ConstraintType.OFFSET_DISTANCE]: '↕'
    };

    return symbols[type] || '?';
  }

  private suggestLineConstraints(line1Id: string, line2Id: string): ConstraintCreationParams | null {
    const line1 = this.entities[line1Id] as any;
    const line2 = this.entities[line2Id] as any;

    if (!line1 || !line2 || line1.type !== 'line' || line2.type !== 'line') {
      return null;
    }

    // Calcola angoli
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

    // Suggerisci vincolo in base all'angolo
    if (normalizedDiff < Math.PI / 12) { // ~15 gradi
      return {
        type: ConstraintType.PARALLEL,
        entityIds: [line1Id, line2Id],
        description: 'Auto-suggested parallel constraint'
      };
    } else if (Math.abs(normalizedDiff - Math.PI/2) < Math.PI / 12) { // ~15 gradi da 90°
      return {
        type: ConstraintType.PERPENDICULAR,
        entityIds: [line1Id, line2Id],
        description: 'Auto-suggested perpendicular constraint'
      };
    }

    return null;
  }

  private suggestCircleConstraints(circle1Id: string, circle2Id: string): ConstraintCreationParams | null {
    const circle1 = this.entities[circle1Id] as any;
    const circle2 = this.entities[circle2Id] as any;

    if (!circle1 || !circle2 || circle1.type !== 'circle' || circle2.type !== 'circle') {
      return null;
    }

    // Calcola distanza tra centri
    const centerDistance = Math.sqrt(
      Math.pow(circle1.center.x - circle2.center.x, 2) +
      Math.pow(circle1.center.y - circle2.center.y, 2)
    );

    // Se i centri sono molto vicini, suggerisci vincolo concentrico
    if (centerDistance < 10) { // 10 pixel di tolleranza
      return {
        type: ConstraintType.CONCENTRIC,
        entityIds: [circle1Id, circle2Id],
        description: 'Auto-suggested concentric constraint'
      };
    }

    // Se i raggi sono simili, suggerisci vincolo raggio uguale
    if (Math.abs(circle1.radius - circle2.radius) < 2) { // 2 pixel di tolleranza
      return {
        type: ConstraintType.EQUAL_RADIUS,
        entityIds: [circle1Id, circle2Id],
        description: 'Auto-suggested equal radius constraint'
      };
    }

    return null;
  }

  private notifyListeners() {
    const constraints = this.getAllConstraints();
    this.changeListeners.forEach(listener => {
      try {
        listener(constraints);
      } catch (error) {
        console.error('Error in constraint change listener:', error);
      }
    });
  }
}

export default ConstraintManager;