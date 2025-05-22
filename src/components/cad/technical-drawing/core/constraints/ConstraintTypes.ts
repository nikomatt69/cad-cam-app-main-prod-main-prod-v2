// src/components/cad/technical-drawing/core/constraints/ConstraintTypes.ts
// Sistema di vincoli parametrici per CAD professionale

import { Point } from '../../TechnicalDrawingTypes';

export interface BaseConstraint {
  id: string;
  type: ConstraintType;
  entityIds: string[];
  active: boolean;
  satisfied: boolean;
  priority: number;
  description?: string;
  metadata?: Record<string, any>;
}

export enum ConstraintType {
  // Geometric Constraints
  PARALLEL = 'parallel',
  PERPENDICULAR = 'perpendicular',
  HORIZONTAL = 'horizontal',
  VERTICAL = 'vertical',
  TANGENT = 'tangent',
  CONCENTRIC = 'concentric',
  COLLINEAR = 'collinear',
  COINCIDENT = 'coincident',
  EQUAL_LENGTH = 'equal_length',
  EQUAL_RADIUS = 'equal_radius',
  SYMMETRIC = 'symmetric',
  MIDPOINT = 'midpoint',
  
  // Dimensional Constraints
  DISTANCE = 'distance',
  ANGLE = 'angle',
  RADIUS = 'radius',
  DIAMETER = 'diameter',
  LENGTH = 'length',
  
  // Advanced Constraints
  PATTERN = 'pattern',
  OFFSET_DISTANCE = 'offset_distance'
}

// Geometric Constraints
export interface ParallelConstraint extends BaseConstraint {
  type: ConstraintType.PARALLEL;
  line1Id: string;
  line2Id: string;
}

export interface PerpendicularConstraint extends BaseConstraint {
  type: ConstraintType.PERPENDICULAR;
  line1Id: string;
  line2Id: string;
}

export interface HorizontalConstraint extends BaseConstraint {
  type: ConstraintType.HORIZONTAL;
  lineId: string;
}

export interface VerticalConstraint extends BaseConstraint {
  type: ConstraintType.VERTICAL;
  lineId: string;
}

export interface TangentConstraint extends BaseConstraint {
  type: ConstraintType.TANGENT;
  circleId: string;
  lineId: string;
  touchPoint?: Point;
}

export interface ConcentricConstraint extends BaseConstraint {
  type: ConstraintType.CONCENTRIC;
  circle1Id: string;
  circle2Id: string;
}

export interface CollinearConstraint extends BaseConstraint {
  type: ConstraintType.COLLINEAR;
  line1Id: string;
  line2Id: string;
}

export interface CoincidentConstraint extends BaseConstraint {
  type: ConstraintType.COINCIDENT;
  entity1Id: string;
  entity2Id: string;
  point1?: Point;
  point2?: Point;
}

export interface EqualLengthConstraint extends BaseConstraint {
  type: ConstraintType.EQUAL_LENGTH;
  line1Id: string;
  line2Id: string;
}

export interface EqualRadiusConstraint extends BaseConstraint {
  type: ConstraintType.EQUAL_RADIUS;
  circle1Id: string;
  circle2Id: string;
}

export interface SymmetricConstraint extends BaseConstraint {
  type: ConstraintType.SYMMETRIC;
  entity1Id: string;
  entity2Id: string;
  symmetryLineId: string;
}

export interface MidpointConstraint extends BaseConstraint {
  type: ConstraintType.MIDPOINT;
  pointEntityId: string;
  lineId: string;
}

// Dimensional Constraints
export interface DistanceConstraint extends BaseConstraint {
  type: ConstraintType.DISTANCE;
  entity1Id: string;
  entity2Id: string;
  distance: number;
  point1?: Point;
  point2?: Point;
}

export interface AngleConstraint extends BaseConstraint {
  type: ConstraintType.ANGLE;
  line1Id: string;
  line2Id: string;
  angle: number; // in radians
  vertex?: Point;
}

export interface RadiusConstraint extends BaseConstraint {
  type: ConstraintType.RADIUS;
  circleId: string;
  radius: number;
}

export interface DiameterConstraint extends BaseConstraint {
  type: ConstraintType.DIAMETER;
  circleId: string;
  diameter: number;
}

export interface LengthConstraint extends BaseConstraint {
  type: ConstraintType.LENGTH;
  lineId: string;
  length: number;
}

// Advanced Constraints
export interface PatternConstraint extends BaseConstraint {
  type: ConstraintType.PATTERN;
  seedEntityIds: string[];
  patternType: 'rectangular' | 'circular' | 'linear';
  count: number;
  spacing?: number;
  angle?: number;
}

export interface OffsetDistanceConstraint extends BaseConstraint {
  type: ConstraintType.OFFSET_DISTANCE;
  sourceEntityId: string;
  targetEntityId: string;
  distance: number;
}

// Union type for all constraints
export type Constraint = 
  | ParallelConstraint
  | PerpendicularConstraint
  | HorizontalConstraint
  | VerticalConstraint
  | TangentConstraint
  | ConcentricConstraint
  | CollinearConstraint
  | CoincidentConstraint
  | EqualLengthConstraint
  | EqualRadiusConstraint
  | SymmetricConstraint
  | MidpointConstraint
  | DistanceConstraint
  | AngleConstraint
  | RadiusConstraint
  | DiameterConstraint
  | LengthConstraint
  | PatternConstraint
  | OffsetDistanceConstraint;

// Constraint satisfaction result
export interface ConstraintSolution {
  constraintId: string;
  satisfied: boolean;
  entityUpdates: Record<string, Partial<any>>;
  error?: string;
  iterations?: number;
}

// Constraint solver configuration
export interface ConstraintSolverConfig {
  maxIterations: number;
  tolerance: number;
  dampingFactor: number;
  prioritizeConstraints: boolean;
  debugMode: boolean;
}

// Constraint visualization
export interface ConstraintVisual {
  constraintId: string;
  type: 'icon' | 'line' | 'arc' | 'symbol';
  position: Point;
  size: number;
  color: string;
  visible: boolean;
  symbol?: string;
}

// Constraint creation parameters
export interface ConstraintCreationParams {
  type: ConstraintType;
  entityIds: string[];
  value?: number; // For dimensional constraints
  point?: Point; // For point-based constraints
  priority?: number;
  description?: string;
}

// Constraint validation result
export interface ConstraintValidation {
  valid: boolean;
  reason?: string;
  suggestions?: string[];
}

export default {
  ConstraintType,
  BaseConstraint,
  Constraint,
  ConstraintSolution,
  ConstraintSolverConfig,
  ConstraintVisual,
  ConstraintCreationParams,
  ConstraintValidation
};