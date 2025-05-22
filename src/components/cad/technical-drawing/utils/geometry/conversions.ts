import { Point } from '../../types/TechnicalDrawingTypes';

/**
 * Coordinate conversion utilities
 * Contains functions for converting between different coordinate systems
 */

/**
 * Convert cartesian (x,y) coordinates to polar (r,θ) coordinates
 * Returns [radius, angleInRadians]
 */
export function cartesianToPolar(x: number, y: number): [number, number] {
  const radius = Math.sqrt(x * x + y * y);
  const angle = Math.atan2(y, x);
  return [radius, angle];
}

/**
 * Convert cartesian point to polar coordinates
 * Returns [radius, angleInRadians]
 */
export function pointToPolar(point: Point): [number, number] {
  return cartesianToPolar(point.x, point.y);
}

/**
 * Convert polar (r,θ) coordinates to cartesian (x,y) coordinates
 * Angle should be in radians
 */
export function polarToCartesian(radius: number, angle: number): Point {
  return {
    x: radius * Math.cos(angle),
    y: radius * Math.sin(angle)
  };
}

/**
 * Convert degrees to radians
 */
export function degreesToRadians(degrees: number): number {
  return degrees * Math.PI / 180;
}

/**
 * Convert radians to degrees
 */
export function radiansToDegrees(radians: number): number {
  return radians * 180 / Math.PI;
}

/**
 * Convert a point from screen coordinates to world coordinates
 * Accounts for pan and zoom transformations
 */
export function screenToWorld(
  screenX: number, 
  screenY: number, 
  pan: Point, 
  zoom: number
): Point {
  return {
    x: (screenX - pan.x) / zoom,
    y: (screenY - pan.y) / zoom
  };
}

/**
 * Convert a point from world coordinates to screen coordinates
 * Accounts for pan and zoom transformations
 */
export function worldToScreen(
  worldX: number, 
  worldY: number, 
  pan: Point, 
  zoom: number
): Point {
  return {
    x: worldX * zoom + pan.x,
    y: worldY * zoom + pan.y
  };
}

/**
 * Convert a point from screen coordinates to world coordinates
 */
export function screenPointToWorld(
  point: Point, 
  pan: Point, 
  zoom: number
): Point {
  return screenToWorld(point.x, point.y, pan, zoom);
}

/**
 * Convert a point from world coordinates to screen coordinates
 */
export function worldPointToScreen(
  point: Point, 
  pan: Point, 
  zoom: number
): Point {
  return worldToScreen(point.x, point.y, pan, zoom);
}

/**
 * Convert a distance from world coordinates to screen coordinates
 */
export function worldDistanceToScreen(distance: number, zoom: number): number {
  return distance * zoom;
}

/**
 * Convert a distance from screen coordinates to world coordinates
 */
export function screenDistanceToWorld(distance: number, zoom: number): number {
  return distance / zoom;
}

/**
 * Normalize an angle to be within [0, 2π)
 */
export function normalizeAngle(angle: number): number {
  angle = angle % (2 * Math.PI);
  if (angle < 0) angle += 2 * Math.PI;
  return angle;
}

/**
 * Normalize an angle to be within [-π, π)
 */
export function normalizeAngleAroundZero(angle: number): number {
  angle = angle % (2 * Math.PI);
  if (angle > Math.PI) angle -= 2 * Math.PI;
  if (angle < -Math.PI) angle += 2 * Math.PI;
  return angle;
}

/**
 * Convert a point from Cartesian coordinates to local coordinates 
 * given a local coordinate system defined by origin and rotation
 */
export function worldToLocalCoordinates(
  point: Point, 
  origin: Point, 
  rotation: number = 0
): Point {
  // Translate
  const translatedX = point.x - origin.x;
  const translatedY = point.y - origin.y;
  
  // Rotate
  if (rotation !== 0) {
    const cos = Math.cos(-rotation);
    const sin = Math.sin(-rotation);
    
    return {
      x: translatedX * cos - translatedY * sin,
      y: translatedX * sin + translatedY * cos
    };
  }
  
  return { x: translatedX, y: translatedY };
}

/**
 * Convert a point from local coordinates to world coordinates
 * given a local coordinate system defined by origin and rotation
 */
export function localToWorldCoordinates(
  point: Point, 
  origin: Point, 
  rotation: number = 0
): Point {
  let x = point.x;
  let y = point.y;
  
  // Rotate
  if (rotation !== 0) {
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    
    x = point.x * cos - point.y * sin;
    y = point.x * sin + point.y * cos;
  }
  
  // Translate
  return {
    x: x + origin.x,
    y: y + origin.y
  };
}

/**
 * Convert between different unit systems
 * Supported units: 'mm', 'cm', 'in', 'ft'
 */
export function convertUnits(
  value: number, 
  fromUnit: 'mm' | 'cm' | 'in' | 'ft', 
  toUnit: 'mm' | 'cm' | 'in' | 'ft'
): number {
  // Convert to mm as base unit
  let valueInMm: number;
  
  switch (fromUnit) {
    case 'mm':
      valueInMm = value;
      break;
    case 'cm':
      valueInMm = value * 10;
      break;
    case 'in':
      valueInMm = value * 25.4;
      break;
    case 'ft':
      valueInMm = value * 304.8;
      break;
    default:
      throw new Error(`Unsupported unit: ${fromUnit}`);
  }
  
  // Convert from mm to target unit
  switch (toUnit) {
    case 'mm':
      return valueInMm;
    case 'cm':
      return valueInMm / 10;
    case 'in':
      return valueInMm / 25.4;
    case 'ft':
      return valueInMm / 304.8;
    default:
      throw new Error(`Unsupported unit: ${toUnit}`);
  }
}

/**
 * Convert a point from one unit system to another
 */
export function convertPointUnits(
  point: Point,
  fromUnit: 'mm' | 'cm' | 'in' | 'ft', 
  toUnit: 'mm' | 'cm' | 'in' | 'ft'
): Point {
  return {
    x: convertUnits(point.x, fromUnit, toUnit),
    y: convertUnits(point.y, fromUnit, toUnit)
  };
}

/**
 * Convert an array of points from one unit system to another
 */
export function convertPointsUnits(
  points: Point[],
  fromUnit: 'mm' | 'cm' | 'in' | 'ft', 
  toUnit: 'mm' | 'cm' | 'in' | 'ft'
): Point[] {
  return points.map(point => convertPointUnits(point, fromUnit, toUnit));
}

/**
 * Convert paper size from one unit to another
 * Common paper sizes in mm: A4 = [210, 297], A3 = [297, 420], etc.
 */
export function convertPaperSize(
  width: number,
  height: number,
  fromUnit: 'mm' | 'cm' | 'in' | 'ft', 
  toUnit: 'mm' | 'cm' | 'in' | 'ft'
): [number, number] {
  return [
    convertUnits(width, fromUnit, toUnit),
    convertUnits(height, fromUnit, toUnit)
  ];
}

/**
 * Get common paper size dimensions in the specified unit
 */
export function getPaperSizeDimensions(
  paperSize: 'A4' | 'A3' | 'A2' | 'A1' | 'A0' | 'Letter' | 'Legal' | 'Tabloid',
  unit: 'mm' | 'cm' | 'in' | 'ft',
  landscape: boolean = false
): [number, number] {
  // Paper sizes in mm (width, height) - portrait orientation
  const paperSizes: Record<string, [number, number]> = {
    'A4': [210, 297],
    'A3': [297, 420],
    'A2': [420, 594],
    'A1': [594, 841],
    'A0': [841, 1189],
    'Letter': [215.9, 279.4],   // 8.5 x 11 inches
    'Legal': [215.9, 355.6],    // 8.5 x 14 inches
    'Tabloid': [279.4, 431.8]   // 11 x 17 inches
  };
  
  if (!paperSizes[paperSize]) {
    throw new Error(`Unsupported paper size: ${paperSize}`);
  }
  
  let [width, height] = paperSizes[paperSize];
  
  // Swap dimensions for landscape orientation
  if (landscape) {
    [width, height] = [height, width];
  }
  
  // Convert to requested unit
  return [
    convertUnits(width, 'mm', unit),
    convertUnits(height, 'mm', unit)
  ];
} 