import { Point } from '../../TechnicalDrawingTypes';

/**
 * Geometry calculations utility
 * Contains functions for calculating intersections, tangents, distances, etc.
 */

/**
 * Calculate distance between two points
 */
export function calculateDistance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate angle between two points in radians
 */
export function calculateAngle(p1: Point, p2: Point): number {
  return Math.atan2(p2.y - p1.y, p2.x - p1.x);
}

/**
 * Calculate angle between two points in degrees
 */
export function calculateAngleDegrees(p1: Point, p2: Point): number {
  return calculateAngle(p1, p2) * 180 / Math.PI;
}

/**
 * Calculate angle between three points (angle at p2)
 */
export function calculateAngleBetween(p1: Point, p2: Point, p3: Point): number {
  const angle1 = calculateAngle(p2, p1);
  const angle2 = calculateAngle(p2, p3);
  let angle = angle2 - angle1;
  
  // Normalize to range [0, 2π]
  if (angle < 0) {
    angle += 2 * Math.PI;
  }
  
  return angle;
}

/**
 * Calculate angle between three points in degrees
 */
export function calculateAngleBetweenDegrees(p1: Point, p2: Point, p3: Point): number {
  return calculateAngleBetween(p1, p2, p3) * 180 / Math.PI;
}

/**
 * Check if a point is on a line segment
 */
export function isPointOnLineSegment(point: Point, lineStart: Point, lineEnd: Point, tolerance: number = 0.1): boolean {
  const d1 = calculateDistance(point, lineStart);
  const d2 = calculateDistance(point, lineEnd);
  const lineLength = calculateDistance(lineStart, lineEnd);
  
  // Check if point is on the line using distance comparison
  return Math.abs(d1 + d2 - lineLength) <= tolerance;
}

/**
 * Calculate the perpendicular distance from a point to a line
 */
export function distancePointToLine(point: Point, lineStart: Point, lineEnd: Point): number {
  const lineLength = calculateDistance(lineStart, lineEnd);
  
  if (lineLength === 0) return calculateDistance(point, lineStart);
  
  // Calculate the area of the triangle formed by the three points
  const area = Math.abs(
    (lineEnd.y - lineStart.y) * point.x -
    (lineEnd.x - lineStart.x) * point.y +
    lineEnd.x * lineStart.y -
    lineEnd.y * lineStart.x
  );
  
  // Distance = Area / Base
  return area / lineLength;
}

/**
 * Calculate the closest point on a line segment to a point
 */
export function closestPointOnLineSegment(point: Point, lineStart: Point, lineEnd: Point): Point {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const len2 = dx * dx + dy * dy;
  
  if (len2 === 0) return lineStart; // Line segment is just a point
  
  // Calculate projection ratio
  const t = Math.max(0, Math.min(1, 
    ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / len2
  ));
  
  return {
    x: lineStart.x + t * dx,
    y: lineStart.y + t * dy
  };
}

/**
 * Check if two line segments intersect
 */
export function doLinesIntersect(
  a1: Point, 
  a2: Point, 
  b1: Point, 
  b2: Point
): boolean {
  // Calculate line directions
  const ua_t = (b2.x - b1.x) * (a1.y - b1.y) - (b2.y - b1.y) * (a1.x - b1.x);
  const ub_t = (a2.x - a1.x) * (a1.y - b1.y) - (a2.y - a1.y) * (a1.x - b1.x);
  const u_b = (b2.y - b1.y) * (a2.x - a1.x) - (b2.x - b1.x) * (a2.y - a1.y);
  
  if (u_b !== 0) {
    const ua = ua_t / u_b;
    const ub = ub_t / u_b;
    
    if (0 <= ua && ua <= 1 && 0 <= ub && ub <= 1) {
      return true;
    }
  }
  
  return false;
}

/**
 * Find the intersection point of two lines
 */
export function findLineIntersection(
  a1: Point, 
  a2: Point, 
  b1: Point, 
  b2: Point
): Point | null {
  // Calculate line directions
  const ua_t = (b2.x - b1.x) * (a1.y - b1.y) - (b2.y - b1.y) * (a1.x - b1.x);
  const ub_t = (a2.x - a1.x) * (a1.y - b1.y) - (a2.y - a1.y) * (a1.x - b1.x);
  const u_b = (b2.y - b1.y) * (a2.x - a1.x) - (b2.x - b1.x) * (a2.y - a1.y);
  
  if (u_b !== 0) {
    const ua = ua_t / u_b;
    const ub = ub_t / u_b;
    
    if (0 <= ua && ua <= 1 && 0 <= ub && ub <= 1) {
      return {
        x: a1.x + ua * (a2.x - a1.x),
        y: a1.y + ua * (a2.y - a1.y)
      };
    }
  }
  
  return null; // Lines don't intersect
}

/**
 * Find the intersection points of a line and circle
 */
export function findLineCircleIntersection(
  lineStart: Point, 
  lineEnd: Point, 
  circleCenter: Point, 
  radius: number
): Point[] {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  
  // Translate circle center to origin
  const shiftedStart = {
    x: lineStart.x - circleCenter.x,
    y: lineStart.y - circleCenter.y
  };
  
  // Quadratic coefficients
  const a = dx * dx + dy * dy;
  const b = 2 * (shiftedStart.x * dx + shiftedStart.y * dy);
  const c = shiftedStart.x * shiftedStart.x + shiftedStart.y * shiftedStart.y - radius * radius;
  
  const discriminant = b * b - 4 * a * c;
  
  if (discriminant < 0) {
    return []; // No intersection
  }
  
  // Find intersection points
  const intersections: Point[] = [];
  const t1 = (-b + Math.sqrt(discriminant)) / (2 * a);
  const t2 = (-b - Math.sqrt(discriminant)) / (2 * a);
  
  // Check if intersections are on the line segment
  if (0 <= t1 && t1 <= 1) {
    intersections.push({
      x: lineStart.x + t1 * dx,
      y: lineStart.y + t1 * dy
    });
  }
  
  if (0 <= t2 && t2 <= 1) {
    intersections.push({
      x: lineStart.x + t2 * dx,
      y: lineStart.y + t2 * dy
    });
  }
  
  return intersections;
}

/**
 * Find the intersection points of two circles
 */
export function findCircleCircleIntersection(
  c1: Point, 
  r1: number, 
  c2: Point, 
  r2: number
): Point[] {
  const dx = c2.x - c1.x;
  const dy = c2.y - c1.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Circles are too far apart or one is contained within the other
  if (distance > r1 + r2 || distance < Math.abs(r1 - r2)) {
    return [];
  }
  
  // Circles are coincident
  if (distance === 0 && r1 === r2) {
    return []; // Infinite intersection points
  }
  
  // Calculate intersection points
  const a = (r1 * r1 - r2 * r2 + distance * distance) / (2 * distance);
  const h = Math.sqrt(r1 * r1 - a * a);
  
  const p2 = {
    x: c1.x + a * (c2.x - c1.x) / distance,
    y: c1.y + a * (c2.y - c1.y) / distance
  };
  
  // First intersection point
  const p3_1 = {
    x: p2.x + h * (c2.y - c1.y) / distance,
    y: p2.y - h * (c2.x - c1.x) / distance
  };
  
  // Second intersection point
  const p3_2 = {
    x: p2.x - h * (c2.y - c1.y) / distance,
    y: p2.y + h * (c2.x - c1.x) / distance
  };
  
  // If circles touch at exactly one point
  if (distance === r1 + r2 || distance === Math.abs(r1 - r2)) {
    return [p2];
  }
  
  return [p3_1, p3_2];
}

/**
 * Calculate the centroid of a set of points
 */
export function calculateCentroid(points: Point[]): Point {
  if (points.length === 0) return { x: 0, y: 0 };
  
  let sumX = 0;
  let sumY = 0;
  
  for (const point of points) {
    sumX += point.x;
    sumY += point.y;
  }
  
  return {
    x: sumX / points.length,
    y: sumY / points.length
  };
}

/**
 * Calculate the area of a polygon defined by an array of points
 */
export function calculatePolygonArea(points: Point[]): number {
  let area = 0;
  const numPoints = points.length;
  
  if (numPoints < 3) return 0;
  
  for (let i = 0; i < numPoints; i++) {
    const j = (i + 1) % numPoints;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  
  return Math.abs(area / 2);
}

/**
 * Check if a point is inside a polygon
 */
export function isPointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false;
  const x = point.x;
  const y = point.y;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;
    
    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      
    if (intersect) inside = !inside;
  }
  
  return inside;
}

/**
 * Calculate the tangent points from a point to a circle
 */
export function calculateTangentPointsToCircle(point: Point, center: Point, radius: number): Point[] {
  const dx = center.x - point.x;
  const dy = center.y - point.y;
  const distanceSquared = dx * dx + dy * dy;
  
  // Point is inside the circle
  if (distanceSquared < radius * radius) {
    return [];
  }
  
  // Point is on the circle
  if (Math.abs(distanceSquared - radius * radius) < 1e-10) {
    return [point];
  }
  
  const distance = Math.sqrt(distanceSquared);
  const angle = Math.atan2(dy, dx);
  const halfAngle = Math.asin(radius / distance);
  
  // First tangent point
  const angle1 = angle + Math.PI / 2 - halfAngle;
  const tangent1 = {
    x: center.x + radius * Math.cos(angle1),
    y: center.y + radius * Math.sin(angle1)
  };
  
  // Second tangent point
  const angle2 = angle - Math.PI / 2 + halfAngle;
  const tangent2 = {
    x: center.x + radius * Math.cos(angle2),
    y: center.y + radius * Math.sin(angle2)
  };
  
  return [tangent1, tangent2];
}

/**
 * Create a rounded corner between two lines (fillet)
 */
export function createFillet(
  p1: Point, 
  p2: Point, 
  p3: Point, 
  radius: number
): { arcCenter: Point, startAngle: number, endAngle: number, startPoint: Point, endPoint: Point } | null {
  const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
  const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };
  
  // Normalize vectors
  const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
  const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
  
  if (len1 === 0 || len2 === 0) return null;
  
  const u1 = { x: v1.x / len1, y: v1.y / len1 };
  const u2 = { x: v2.x / len2, y: v2.y / len2 };
  
  // Calculate dot product and angle
  const dotProduct = u1.x * u2.x + u1.y * u2.y;
  const angle = Math.acos(Math.min(Math.max(dotProduct, -1), 1));
  
  // If lines are parallel or nearly parallel
  if (angle < 1e-10 || angle > Math.PI - 1e-10) {
    return null;
  }
  
  // Calculate tangent distance from p2
  const tangentDistance = radius / Math.tan(angle / 2);
  
  // Calculate start and end points of the arc
  const startPoint = {
    x: p2.x + u1.x * tangentDistance,
    y: p2.y + u1.y * tangentDistance
  };
  
  const endPoint = {
    x: p2.x + u2.x * tangentDistance,
    y: p2.y + u2.y * tangentDistance
  };
  
  // Calculate center of the arc
  const bisector = {
    x: (u1.x + u2.x) / 2,
    y: (u1.y + u2.y) / 2
  };
  
  // Normalize bisector
  const bisectorLength = Math.sqrt(bisector.x * bisector.x + bisector.y * bisector.y);
  
  if (bisectorLength < 1e-10) return null;
  
  const normalizedBisector = {
    x: bisector.x / bisectorLength,
    y: bisector.y / bisectorLength
  };
  
  // Calculate arc center by going radius distance along the bisector
  const radiusDistance = radius / Math.sin(angle / 2);
  const arcCenter = {
    x: p2.x + normalizedBisector.x * radiusDistance,
    y: p2.y + normalizedBisector.y * radiusDistance
  };
  
  // Calculate start and end angles for the arc
  const startAngle = Math.atan2(startPoint.y - arcCenter.y, startPoint.x - arcCenter.x);
  const endAngle = Math.atan2(endPoint.y - arcCenter.y, endPoint.x - arcCenter.x);
  
  return {
    arcCenter,
    startAngle,
    endAngle,
    startPoint,
    endPoint
  };
}

/**
 * Create a chamfer between two lines
 */
export function createChamfer(
  p1: Point, 
  p2: Point, 
  p3: Point, 
  distance1: number, 
  distance2: number = distance1
): { chamferStart: Point, chamferEnd: Point } | null {
  const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
  const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };
  
  // Normalize vectors
  const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
  const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
  
  if (len1 === 0 || len2 === 0) return null;
  
  const u1 = { x: v1.x / len1, y: v1.y / len1 };
  const u2 = { x: v2.x / len2, y: v2.y / len2 };
  
  // Calculate chamfer points
  const chamferStart = {
    x: p2.x + u1.x * distance1,
    y: p2.y + u1.y * distance1
  };
  
  const chamferEnd = {
    x: p2.x + u2.x * distance2,
    y: p2.y + u2.y * distance2
  };
  
  return { chamferStart, chamferEnd };
}

/**
 * Calculate the offset of a line segment
 */
export function offsetLine(
  p1: Point, 
  p2: Point, 
  distance: number
): { p1: Point, p2: Point } {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  
  if (length === 0) return { p1, p2 };
  
  // Calculate perpendicular vector
  const perpX = -dy / length;
  const perpY = dx / length;
  
  // Calculate offset points
  return {
    p1: {
      x: p1.x + perpX * distance,
      y: p1.y + perpY * distance
    },
    p2: {
      x: p2.x + perpX * distance,
      y: p2.y + perpY * distance
    }
  };
}

/**
 * Calculate the offset of a polyline
 */
export function offsetPolyline(
  points: Point[], 
  distance: number,
  closed: boolean = false
): Point[] {
  if (points.length < 2) return [...points];
  
  const result: Point[] = [];
  const segmentCount = closed ? points.length : points.length - 1;
  
  for (let i = 0; i < segmentCount; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    
    const offsetSegment = offsetLine(p1, p2, distance);
    
    if (i === 0 || !closed) {
      result.push(offsetSegment.p1);
    } else {
      // Find intersection with previous segment
      const prevP1 = points[(i - 1 + points.length) % points.length];
      const prevP2 = points[i];
      const prevOffset = offsetLine(prevP1, prevP2, distance);
      
      const intersection = findLineIntersection(
        prevOffset.p1, prevOffset.p2,
        offsetSegment.p1, offsetSegment.p2
      );
      
      if (intersection) {
        result.push(intersection);
      } else {
        result.push(offsetSegment.p1);
      }
    }
    
    // Add the last point of the last segment
    if (i === segmentCount - 1 && !closed) {
      result.push(offsetSegment.p2);
    }
  }
  
  if (closed && result.length > 0) {
    // Connect the last segment to the first
    const firstSegment = offsetLine(points[0], points[1], distance);
    const lastSegment = offsetLine(
      points[points.length - 1], 
      points[0], 
      distance
    );
    
    const intersection = findLineIntersection(
      lastSegment.p1, lastSegment.p2,
      firstSegment.p1, firstSegment.p2
    );
    
    if (intersection) {
      result[0] = intersection;
      result.push(intersection);
    }
  }
  
  return result;
}

/**
 * Interpolate between two points
 */
export function interpolate(p1: Point, p2: Point, t: number): Point {
  return {
    x: p1.x + (p2.x - p1.x) * t,
    y: p1.y + (p2.y - p1.y) * t
  };
}

/**
 * Extend a line by a given distance
 */
export function extendLine(p1: Point, p2: Point, distance: number): Point {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  
  if (length === 0) return { ...p2 };
  
  const t = distance / length;
  
  return {
    x: p2.x + dx * t,
    y: p2.y + dy * t
  };
}

/**
 * Calculate point at given distance along a polyline
 */
export function pointAtDistanceAlongPolyline(points: Point[], distance: number): Point | null {
  if (points.length < 2 || distance < 0) return null;
  
  let cumulativeDistance = 0;
  
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const segmentLength = calculateDistance(p1, p2);
    
    if (cumulativeDistance + segmentLength >= distance) {
      // Point is on this segment
      const t = (distance - cumulativeDistance) / segmentLength;
      return interpolate(p1, p2, t);
    }
    
    cumulativeDistance += segmentLength;
  }
  
  // Distance is beyond the polyline
  return null;
}

/**
 * Simplify a polyline using Douglas-Peucker algorithm
 */
export function simplifyPolyline(points: Point[], epsilon: number): Point[] {
  if (points.length <= 2) return [...points];
  
  // Find point with maximum distance from line segment
  let maxDistance = 0;
  let maxDistanceIndex = 0;
  
  const startPoint = points[0];
  const endPoint = points[points.length - 1];
  
  for (let i = 1; i < points.length - 1; i++) {
    const distance = distancePointToLine(points[i], startPoint, endPoint);
    
    if (distance > maxDistance) {
      maxDistance = distance;
      maxDistanceIndex = i;
    }
  }
  
  // If maximum distance is greater than epsilon, recursively simplify
  if (maxDistance > epsilon) {
    const firstSegment = simplifyPolyline(
      points.slice(0, maxDistanceIndex + 1), 
      epsilon
    );
    
    const secondSegment = simplifyPolyline(
      points.slice(maxDistanceIndex), 
      epsilon
    );
    
    // Concatenate the results, removing duplicate point
    return [...firstSegment.slice(0, -1), ...secondSegment];
  }
  
  // Distance is small enough, use just the endpoints
  return [startPoint, endPoint];
} 