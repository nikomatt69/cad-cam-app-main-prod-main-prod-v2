// src/utils/math/geometryUtils.ts

import { Point } from 'src/types/TechnicalDrawingTypes';

// Calculate distance between two points
export function calculateDistance(p1: Point, p2: Point): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

// Calculate angle between two points in degrees
export function calculateAngle(p1: Point, p2: Point): number {
  return Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
}

// Calculate angle between two points in radians
export function calculateAngleRadians(p1: Point, p2: Point): number {
  return Math.atan2(p2.y - p1.y, p2.x - p1.x);
}

// Calculate the midpoint between two points
export function calculateMidpoint(p1: Point, p2: Point): Point {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2
  };
}

// Calculate a point at a specific distance and angle from a start point
export function calculatePointFromDistanceAndAngle(
  startPoint: Point,
  distance: number,
  angleDegrees: number
): Point {
  const angleRadians = angleDegrees * Math.PI / 180;
  return {
    x: startPoint.x + distance * Math.cos(angleRadians),
    y: startPoint.y + distance * Math.sin(angleRadians)
  };
}

// Check if a point is inside a polygon
export function isPointInPolygon(point: Point, polygon: Point[]): boolean {
  if (polygon.length < 3) return false;
  
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const intersect = ((polygon[i].y > point.y) !== (polygon[j].y > point.y)) &&
      (point.x < (polygon[j].x - polygon[i].x) * (point.y - polygon[i].y) / (polygon[j].y - polygon[i].y) + polygon[i].x);
    
    if (intersect) inside = !inside;
  }
  
  return inside;
}

// Calculate the distance from a point to a line segment
export function calculateDistancePointToLineSegment(
  point: Point,
  lineStart: Point,
  lineEnd: Point
): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  
  if (length === 0) return calculateDistance(point, lineStart);
  
  // Calculate projection of point onto line
  const t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (length * length);
  
  // If projection falls outside line segment, return distance to nearest endpoint
  if (t < 0) return calculateDistance(point, lineStart);
  if (t > 1) return calculateDistance(point, lineEnd);
  
  // Calculate closest point on line segment
  const closestPoint = {
    x: lineStart.x + t * dx,
    y: lineStart.y + t * dy
  };
  
  return calculateDistance(point, closestPoint);
}

// Calculate the intersection point of two lines
export function calculateLineIntersection(
  line1Start: Point,
  line1End: Point,
  line2Start: Point,
  line2End: Point
): Point | null {
  const dx1 = line1End.x - line1Start.x;
  const dy1 = line1End.y - line1Start.y;
  const dx2 = line2End.x - line2Start.x;
  const dy2 = line2End.y - line2Start.y;
  
  const determinant = dx1 * dy2 - dy1 * dx2;
  
  if (determinant === 0) {
    // Lines are parallel
    return null;
  }
  
  const t1 = ((line2Start.x - line1Start.x) * dy2 - (line2Start.y - line1Start.y) * dx2) / determinant;
  const t2 = ((line1Start.x - line2Start.x) * dy1 - (line1Start.y - line2Start.y) * dx1) / -determinant;
  
  if (t1 >= 0 && t1 <= 1 && t2 >= 0 && t2 <= 1) {
    // Lines intersect within the segments
    return {
      x: line1Start.x + t1 * dx1,
      y: line1Start.y + t1 * dy1
    };
  }
  
  // Lines don't intersect within the segments
  return null;
}

// Calculate the normal point on a line segment
export function calculatePerpendicularPoint(
  point: Point,
  lineStart: Point,
  lineEnd: Point
): Point {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  
  if (length === 0) return lineStart;
  
  // Calculate projection of point onto line
  const t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (length * length);
  
  // Calculate the perpendicular point
  return {
    x: lineStart.x + t * dx,
    y: lineStart.y + t * dy
  };
}

// Check if a point is on a line segment within a tolerance
export function isPointOnLineSegment(
  point: Point,
  lineStart: Point,
  lineEnd: Point,
  tolerance: number = 0.001
): boolean {
  const distance = calculateDistancePointToLineSegment(point, lineStart, lineEnd);
  return distance <= tolerance;
}

// Calculate the tangent points to a circle from an external point
export function calculateTangentPointsToCircle(
  point: Point,
  circleCenter: Point,
  radius: number
): [Point, Point] | null {
  const dx = point.x - circleCenter.x;
  const dy = point.y - circleCenter.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  if (distance <= radius) {
    // Point is inside or on the circle, no tangent exists
    return null;
  }
  
  const angle = Math.atan2(dy, dx);
  const tangentAngle = Math.asin(radius / distance);
  
  const angle1 = angle + tangentAngle;
  const angle2 = angle - tangentAngle;
  
  const tangentPoint1: Point = {
    x: circleCenter.x + radius * Math.cos(angle1 + Math.PI / 2),
    y: circleCenter.y + radius * Math.sin(angle1 + Math.PI / 2)
  };
  
  const tangentPoint2: Point = {
    x: circleCenter.x + radius * Math.cos(angle2 - Math.PI / 2),
    y: circleCenter.y + radius * Math.sin(angle2 - Math.PI / 2)
  };
  
  return [tangentPoint1, tangentPoint2];
}

// Rotate a point around a center
export function rotatePoint(point: Point, center: Point, angleDegrees: number): Point {
  const angleRadians = angleDegrees * Math.PI / 180;
  const cos = Math.cos(angleRadians);
  const sin = Math.sin(angleRadians);
  
  // Translate point to origin
  const translatedX = point.x - center.x;
  const translatedY = point.y - center.y;
  
  // Rotate and translate back
  return {
    x: center.x + translatedX * cos - translatedY * sin,
    y: center.y + translatedX * sin + translatedY * cos
  };
}

// Calculate the angle bisector between three points
export function calculateAngleBisector(
  point1: Point,
  vertex: Point,
  point2: Point
): number {
  const angle1 = calculateAngleRadians(vertex, point1);
  const angle2 = calculateAngleRadians(vertex, point2);
  
  // Calculate bisector angle
  let bisector = (angle1 + angle2) / 2;
  
  // If the difference is more than PI, we need to adjust
  if (Math.abs(angle1 - angle2) > Math.PI) {
    bisector += Math.PI;
  }
  
  return bisector * 180 / Math.PI; // Return in degrees
}

// Calculate point of intersection between a line and a circle
export function calculateLineCircleIntersection(
  lineStart: Point,
  lineEnd: Point,
  circleCenter: Point,
  radius: number
): Point[] {
  // Convert the line to the form ax + by + c = 0
  const a = lineEnd.y - lineStart.y;
  const b = lineStart.x - lineEnd.x;
  const c = (lineEnd.x * lineStart.y) - (lineStart.x * lineEnd.y);
  
  // Calculate the distance from the center of the circle to the line
  const lineLength = Math.sqrt(a * a + b * b);
  const distance = Math.abs(a * circleCenter.x + b * circleCenter.y + c) / lineLength;
  
  if (distance > radius) {
    // No intersection
    return [];
  }
  
  if (Math.abs(distance - radius) < 0.0001) {
    // The line is tangent to the circle, one intersection point
    const t = -(a * circleCenter.x + b * circleCenter.y + c) / (a * a + b * b);
    
    return [{
      x: circleCenter.x + a * t,
      y: circleCenter.y + b * t
    }];
  }
  
  // Two intersection points
  // Calculate the coordinates of the closest point on the line to the circle center
  const t = -(a * circleCenter.x + b * circleCenter.y + c) / (a * a + b * b);
  const closestX = circleCenter.x + a * t;
  const closestY = circleCenter.y + b * t;
  
  // Calculate the distance from the closest point to the intersection points
  const dt = Math.sqrt(radius * radius - distance * distance) / lineLength;
  
  // Calculate the intersection points
  const intersection1: Point = {
    x: closestX + b * dt,
    y: closestY - a * dt
  };
  
  const intersection2: Point = {
    x: closestX - b * dt,
    y: closestY + a * dt
  };
  
  // Check if the intersections are on the line segment
  const intersections: Point[] = [];
  
  if (isPointOnLineSegment(intersection1, lineStart, lineEnd)) {
    intersections.push(intersection1);
  }
  
  if (isPointOnLineSegment(intersection2, lineStart, lineEnd)) {
    intersections.push(intersection2);
  }
  
  return intersections;
}