import { Point, DrawingEntity } from '../../types/TechnicalDrawingTypes';

/**
 * Transformations utility for geometry operations
 * Contains functions for rotation, scaling, mirroring of points and entities
 */

/**
 * Translate a point by dx and dy
 */
export function translatePoint(point: Point, dx: number, dy: number): Point {
  return {
    x: point.x + dx,
    y: point.y + dy
  };
}

/**
 * Rotate a point around a center point by an angle (in radians)
 */
export function rotatePoint(point: Point, center: Point, angle: number): Point {
  // Convert angle to radians if it's in degrees
  if (Math.abs(angle) > Math.PI * 2) {
    angle = angle * Math.PI / 180;
  }
  
  // Calculate relative coordinates
  const relX = point.x - center.x;
  const relY = point.y - center.y;
  
  // Apply rotation using rotation matrix
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  
  return {
    x: center.x + (relX * cos - relY * sin),
    y: center.y + (relX * sin + relY * cos)
  };
}

/**
 * Scale a point relative to a center point
 */
export function scalePoint(point: Point, center: Point, scaleX: number, scaleY: number): Point {
  // Calculate relative coordinates
  const relX = point.x - center.x;
  const relY = point.y - center.y;
  
  // Apply scaling
  return {
    x: center.x + relX * scaleX,
    y: center.y + relY * scaleY
  };
}

/**
 * Uniform scale a point (same scale factor in both directions)
 */
export function uniformScalePoint(point: Point, center: Point, scale: number): Point {
  return scalePoint(point, center, scale, scale);
}

/**
 * Mirror a point around a line defined by two points
 */
export function mirrorPointAroundLine(point: Point, lineStart: Point, lineEnd: Point): Point {
  // Calculate line vector
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  
  // Normalize line vector
  const length = Math.sqrt(dx * dx + dy * dy);
  const nx = dx / length;
  const ny = dy / length;
  
  // Calculate projection of point onto line
  const relX = point.x - lineStart.x;
  const relY = point.y - lineStart.y;
  
  // Calculate dot product (projection length)
  const dot = relX * nx + relY * ny;
  
  // Calculate projection point
  const projX = lineStart.x + dot * nx;
  const projY = lineStart.y + dot * ny;
  
  // Calculate perpendicular vector from point to line
  const perpX = point.x - projX;
  const perpY = point.y - projY;
  
  // Mirror point across the line
  return {
    x: point.x - 2 * perpX,
    y: point.y - 2 * perpY
  };
}

/**
 * Mirror a point around a point (central symmetry)
 */
export function mirrorPointAroundPoint(point: Point, center: Point): Point {
  return {
    x: 2 * center.x - point.x,
    y: 2 * center.y - point.y
  };
}

/**
 * Mirror a point around the X axis
 */
export function mirrorPointAroundXAxis(point: Point, yAxis: number = 0): Point {
  return {
    x: point.x,
    y: 2 * yAxis - point.y
  };
}

/**
 * Mirror a point around the Y axis
 */
export function mirrorPointAroundYAxis(point: Point, xAxis: number = 0): Point {
  return {
    x: 2 * xAxis - point.x,
    y: point.y
  };
}

/**
 * Apply a 2D transformation matrix to a point
 * Matrix format: [a, c, e, b, d, f] (represents a 3x3 matrix with last row [0, 0, 1])
 * | a c e |
 * | b d f |
 * | 0 0 1 |
 */
export function transformPoint(point: Point, matrix: number[]): Point {
  const [a, c, e, b, d, f] = matrix;
  
  return {
    x: a * point.x + c * point.y + e,
    y: b * point.x + d * point.y + f
  };
}

/**
 * Create a translation matrix
 */
export function createTranslationMatrix(dx: number, dy: number): number[] {
  return [
    1, 0, dx,
    0, 1, dy
  ];
}

/**
 * Create a rotation matrix
 */
export function createRotationMatrix(angle: number, centerX: number = 0, centerY: number = 0): number[] {
  // Convert angle to radians if it's in degrees
  if (Math.abs(angle) > Math.PI * 2) {
    angle = angle * Math.PI / 180;
  }
  
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  
  // If rotating around a non-origin point, we need to compose:
  // 1. Translate to origin
  // 2. Rotate
  // 3. Translate back
  if (centerX !== 0 || centerY !== 0) {
    return [
      cos, -sin, centerX - centerX * cos + centerY * sin,
      sin, cos, centerY - centerX * sin - centerY * cos
    ];
  }
  
  // Rotate around origin
  return [
    cos, -sin, 0,
    sin, cos, 0
  ];
}

/**
 * Create a scaling matrix
 */
export function createScalingMatrix(scaleX: number, scaleY: number, centerX: number = 0, centerY: number = 0): number[] {
  // If scaling around a non-origin point, we need to compose:
  // 1. Translate to origin
  // 2. Scale
  // 3. Translate back
  if (centerX !== 0 || centerY !== 0) {
    return [
      scaleX, 0, centerX - centerX * scaleX,
      0, scaleY, centerY - centerY * scaleY
    ];
  }
  
  // Scale around origin
  return [
    scaleX, 0, 0,
    0, scaleY, 0
  ];
}

/**
 * Multiply two transformation matrices
 */
export function multiplyMatrices(matrixA: number[], matrixB: number[]): number[] {
  const a1 = matrixA[0], c1 = matrixA[1], e1 = matrixA[2];
  const b1 = matrixA[3], d1 = matrixA[4], f1 = matrixA[5];
  
  const a2 = matrixB[0], c2 = matrixB[1], e2 = matrixB[2];
  const b2 = matrixB[3], d2 = matrixB[4], f2 = matrixB[5];
  
  return [
    a1 * a2 + c1 * b2, a1 * c2 + c1 * d2, a1 * e2 + c1 * f2 + e1,
    b1 * a2 + d1 * b2, b1 * c2 + d1 * d2, b1 * e2 + d1 * f2 + f1
  ];
}

/**
 * Create a matrix for mirroring around a line
 */
export function createMirrorMatrix(lineStart: Point, lineEnd: Point): number[] {
  // Calculate line vector
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  
  // Normalize
  const length = Math.sqrt(dx * dx + dy * dy);
  const nx = dx / length;
  const ny = dy / length;
  
  // Calculate reflection matrix components
  const a = nx * nx - ny * ny;
  const b = 2 * nx * ny;
  
  // Create reflection matrix
  const reflectMatrix = [
    a, b, (1 - a) * lineStart.x - b * lineStart.y,
    b, -a, (1 + a) * lineStart.y - b * lineStart.x
  ];
  
  return reflectMatrix;
}

/**
 * Create a composite transformation matrix from a sequence of transformations
 */
export function createCompositeMatrix(matrices: number[][]): number[] {
  let result = [1, 0, 0, 0, 1, 0]; // Identity matrix
  
  for (const matrix of matrices) {
    result = multiplyMatrices(result, matrix);
  }
  
  return result;
}

/**
 * Apply a transformation to an array of points
 */
export function transformPoints(points: Point[], transformFn: (p: Point) => Point): Point[] {
  return points.map(point => transformFn(point));
} 