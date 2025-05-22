// src/components/cad/technical-drawing/core/constraints/ConstraintTypes.ts

export enum ConstraintType {
  // Geometric constraints
  DISTANCE = 'distance',
  ANGLE = 'angle',
  PARALLEL = 'parallel',
  PERPENDICULAR = 'perpendicular',
  HORIZONTAL = 'horizontal',
  VERTICAL = 'vertical',
  TANGENT = 'tangent',
  CONCENTRIC = 'concentric',
  COINCIDENT = 'coincident',
  COLLINEAR = 'collinear',
  
  // Dimensional constraints
  LENGTH = 'length',
  RADIUS = 'radius',
  DIAMETER = 'diameter',
  
  // Positional constraints
  FIX = 'fix',
  SYMMETRIC = 'symmetric',
  MIDPOINT = 'midpoint',
  
  // Advanced constraints
  EQUAL = 'equal',
  SMOOTH = 'smooth',
  OFFSET = 'offset'
}

export interface Constraint {
  id: string;
  type: ConstraintType;
  entityIds: string[];
  active: boolean;
  parameters: Record<string, any>;
  metadata: {
    created: number;
    modified: number;
    description?: string;
    priority?: number;
  };
}

export interface ConstraintCreationParams {
  type: ConstraintType;
  entityIds: string[];
  parameters?: Record<string, any>;
  metadata?: {
    description?: string;
    priority?: number;
  };
}

export interface ConstraintVisual {
  id: string;
  constraintId: string;
  type: 'icon' | 'line' | 'arc' | 'symbol';
  position: { x: number; y: number };
  size: number;
  color: string;
  visible: boolean;
}

// Constraint validation functions
export const validateConstraintParams = (type: ConstraintType, entityIds: string[], parameters: Record<string, any>): boolean => {
  switch (type) {
    case ConstraintType.DISTANCE:
      return entityIds.length === 2 && typeof parameters.distance === 'number' && parameters.distance > 0;
    
    case ConstraintType.ANGLE:
      return entityIds.length === 2 && typeof parameters.angle === 'number';
    
    case ConstraintType.PARALLEL:
    case ConstraintType.PERPENDICULAR:
      return entityIds.length === 2;
    
    case ConstraintType.HORIZONTAL:
    case ConstraintType.VERTICAL:
    case ConstraintType.FIX:
      return entityIds.length === 1;
    
    case ConstraintType.COINCIDENT:
      return entityIds.length >= 2;
    
    case ConstraintType.LENGTH:
    case ConstraintType.RADIUS:
    case ConstraintType.DIAMETER:
      return entityIds.length === 1 && typeof parameters.value === 'number' && parameters.value > 0;
    
    default:
      return entityIds.length > 0;
  }
};

// Constraint priority levels
export enum ConstraintPriority {
  LOW = 1,
  NORMAL = 5,
  HIGH = 10,
  CRITICAL = 20
}

// Constraint solver status
export enum ConstraintStatus {
  SATISFIED = 'satisfied',
  UNSATISFIED = 'unsatisfied',
  CONFLICTING = 'conflicting',
  DISABLED = 'disabled'
}

export interface ConstraintSolverResult {
  constraintId: string;
  status: ConstraintStatus;
  iterations: number;
  error?: string;
  entityChanges: Record<string, any>;
}
