import { v4 as uuidv4 } from 'uuid';
import { 
  Point, 
  PolygonEntity,
  PolylineEntity,
  DrawingStyle
} from '../../types/TechnicalDrawingTypes';

// Point-in-polygon test using ray casting algorithm
function isPointInPolygon(point: Point, polygon: Point[]): boolean {
  if (polygon.length < 3) return false;
  
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;
    
    const intersect = ((yi > point.y) !== (yj > point.y)) &&
      (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
      
    if (intersect) inside = !inside;
  }
  
  return inside;
}

// Find the intersection point of two line segments
function findIntersection(
  p1: Point, p2: Point, 
  p3: Point, p4: Point
): Point | null {
  // Line segment 1 represented as p1 + t(p2 - p1)
  // Line segment 2 represented as p3 + s(p4 - p3)
  
  const dx1 = p2.x - p1.x;
  const dy1 = p2.y - p1.y;
  const dx2 = p4.x - p3.x;
  const dy2 = p4.y - p3.y;
  
  // Check if lines are parallel
  const denominator = dx1 * dy2 - dy1 * dx2;
  if (Math.abs(denominator) < 0.0001) return null;
  
  // Calculate parameters t and s
  const dx3 = p1.x - p3.x;
  const dy3 = p1.y - p3.y;
  
  const t = (dx2 * dy3 - dy2 * dx3) / denominator;
  const s = (dx1 * dy3 - dy1 * dx3) / denominator;
  
  // Check if intersection is within both segments
  if (t < 0 || t > 1 || s < 0 || s > 1) return null;
  
  // Calculate intersection point
  return {
    x: p1.x + t * dx1,
    y: p1.y + t * dy1
  };
}

// Find all intersection points between two polygons
function findIntersectionPoints(polygon1: Point[], polygon2: Point[]): Point[] {
  const intersections: Point[] = [];
  
  // Check each edge of polygon1 against each edge of polygon2
  for (let i = 0; i < polygon1.length; i++) {
    const p1 = polygon1[i];
    const p2 = polygon1[(i + 1) % polygon1.length];
    
    for (let j = 0; j < polygon2.length; j++) {
      const p3 = polygon2[j];
      const p4 = polygon2[(j + 1) % polygon2.length];
      
      const intersection = findIntersection(p1, p2, p3, p4);
      if (intersection) {
        // Check if this intersection is already in our list (within tolerance)
        const isDuplicate = intersections.some(p => 
          Math.abs(p.x - intersection.x) < 0.0001 && 
          Math.abs(p.y - intersection.y) < 0.0001
        );
        
        if (!isDuplicate) {
          intersections.push(intersection);
        }
      }
    }
  }
  
  return intersections;
}

/**
 * Perform a union operation between two polygon entities
 * Returns a new polygon/polyline entity representing the union
 */
export function polygonUnion(
  polygon1: PolygonEntity | PolylineEntity,
  polygon2: PolygonEntity | PolylineEntity,
  layer: string,
  style?: DrawingStyle
): PolylineEntity | null {
  // Extract points from the polygons
  const points1 = polygon1.type === 'polygon' 
    ? getPolygonPoints(polygon1) 
    : polygon1.points || [];
    
  const points2 = polygon2.type === 'polygon'
    ? getPolygonPoints(polygon2)
    : polygon2.points || [];
  
  if (points1.length < 3 || points2.length < 3) {
    return null;
  }
  
  // Find intersection points
  const intersections = findIntersectionPoints(points1, points2);
  
  // If there are no intersections, check if one polygon is inside the other
  if (intersections.length === 0) {
    if (isPointInPolygon(points1[0], points2)) {
      // Polygon 1 is inside Polygon 2, return Polygon 2
      return createPolylineFromPoints(points2, layer, style || polygon2.style, true);
    }
    
    if (isPointInPolygon(points2[0], points1)) {
      // Polygon 2 is inside Polygon 1, return Polygon 1
      return createPolylineFromPoints(points1, layer, style || polygon1.style, true);
    }
    
    // Polygons are disjoint, we can't create a single union polygon
    return null;
  }
  
  // Union algorithm implementation
  // For simplicity, we'll implement a basic approach here
  // A complete implementation would use a clipping algorithm like Greiner-Hormann
  
  // Combine all points from both polygons and intersections
  let allPoints = [...points1, ...points2, ...intersections];
  
  // Remove duplicate points
  allPoints = removeDuplicatePoints(allPoints);
  
  // Calculate the centroid of all points
  const centroid = calculateCentroid(allPoints);
  
  // Sort points by angle from centroid
  allPoints.sort((a, b) => {
    const angleA = Math.atan2(a.y - centroid.y, a.x - centroid.x);
    const angleB = Math.atan2(b.y - centroid.y, b.x - centroid.x);
    return angleA - angleB;
  });
  
  // Filter points to include only those that are on the union boundary
  const unionPoints: Point[] = [];
  
  for (const point of allPoints) {
    // Check if this point is on the boundary of either polygon
    const onBoundary1 = isPointOnBoundary(point, points1);
    const onBoundary2 = isPointOnBoundary(point, points2);
    
    if (onBoundary1 || onBoundary2) {
      // Include points that are on the boundary of one polygon
      // and outside or on the boundary of the other
      if ((onBoundary1 && !isPointInPolygon(point, points2)) ||
          (onBoundary2 && !isPointInPolygon(point, points1)) ||
          (onBoundary1 && onBoundary2)) {
        unionPoints.push(point);
      }
    }
  }
  
  // Create a new polyline from the union points
  return createPolylineFromPoints(unionPoints, layer, style || polygon1.style, true);
}

/**
 * Perform an intersection operation between two polygon entities
 * Returns a new polygon/polyline entity representing the intersection
 */
export function polygonIntersection(
  polygon1: PolygonEntity | PolylineEntity,
  polygon2: PolygonEntity | PolylineEntity,
  layer: string,
  style?: DrawingStyle
): PolylineEntity | null {
  // Extract points from the polygons
  const points1 = polygon1.type === 'polygon' 
    ? getPolygonPoints(polygon1) 
    : polygon1.points || [];
    
  const points2 = polygon2.type === 'polygon'
    ? getPolygonPoints(polygon2)
    : polygon2.points || [];
  
  if (points1.length < 3 || points2.length < 3) {
    return null;
  }
  
  // Find intersection points
  const intersections = findIntersectionPoints(points1, points2);
  
  // If there are no intersections, check if one polygon is inside the other
  if (intersections.length === 0) {
    if (isPointInPolygon(points1[0], points2)) {
      // Polygon 1 is inside Polygon 2, return Polygon 1
      return createPolylineFromPoints(points1, layer, style || polygon1.style, true);
    }
    
    if (isPointInPolygon(points2[0], points1)) {
      // Polygon 2 is inside Polygon 1, return Polygon 2
      return createPolylineFromPoints(points2, layer, style || polygon2.style, true);
    }
    
    // Polygons are disjoint, there is no intersection
    return null;
  }
  
  // Get all points from both polygons that are inside the other polygon
  const pointsOfPoly1InsidePoly2 = points1.filter(p => isPointInPolygon(p, points2));
  const pointsOfPoly2InsidePoly1 = points2.filter(p => isPointInPolygon(p, points1));
  
  // Combine all intersection points and points inside the other polygon
  let allPoints = [...intersections, ...pointsOfPoly1InsidePoly2, ...pointsOfPoly2InsidePoly1];
  
  // Remove duplicate points
  allPoints = removeDuplicatePoints(allPoints);
  
  if (allPoints.length < 3) {
    return null; // Not enough points for a valid polygon
  }
  
  // Calculate the centroid of all points
  const centroid = calculateCentroid(allPoints);
  
  // Sort points by angle from centroid
  allPoints.sort((a, b) => {
    const angleA = Math.atan2(a.y - centroid.y, a.x - centroid.x);
    const angleB = Math.atan2(b.y - centroid.y, b.x - centroid.x);
    return angleA - angleB;
  });
  
  // Create a new polyline from the intersection points
  return createPolylineFromPoints(allPoints, layer, style || polygon1.style, true);
}

/**
 * Perform a difference operation between two polygon entities (polygon1 - polygon2)
 * Returns a new polygon/polyline entity representing the difference
 */
export function polygonDifference(
  polygon1: PolygonEntity | PolylineEntity,
  polygon2: PolygonEntity | PolylineEntity,
  layer: string,
  style?: DrawingStyle
): PolylineEntity | null {
  // Extract points from the polygons
  const points1 = polygon1.type === 'polygon' 
    ? getPolygonPoints(polygon1) 
    : polygon1.points || [];
    
  const points2 = polygon2.type === 'polygon'
    ? getPolygonPoints(polygon2)
    : polygon2.points || [];
  
  if (points1.length < 3) {
    return null;
  }
  
  // Check if polygon2 is empty or has too few points
  if (points2.length < 3) {
    // Return polygon1 as is
    return createPolylineFromPoints(points1, layer, style || polygon1.style, true);
  }
  
  // Find intersection points
  const intersections = findIntersectionPoints(points1, points2);
  
  // If there are no intersections, check if one polygon is inside the other
  if (intersections.length === 0) {
    if (isPointInPolygon(points1[0], points2)) {
      // Polygon 1 is inside Polygon 2, the difference is empty
      return null;
    }
    
    if (isPointInPolygon(points2[0], points1)) {
      // Polygon 2 is inside Polygon 1, we need to create a polygon with a hole
      // This is a complex case that would require a more sophisticated algorithm
      // For simplicity, we'll return polygon1 for now
      return createPolylineFromPoints(points1, layer, style || polygon1.style, true);
    }
    
    // Polygons are disjoint, return polygon1 as is
    return createPolylineFromPoints(points1, layer, style || polygon1.style, true);
  }
  
  // Get all points from polygon1 that are outside polygon2
  const pointsOfPoly1OutsidePoly2 = points1.filter(p => !isPointInPolygon(p, points2));
  
  // Combine all intersection points and points of polygon1 outside polygon2
  let allPoints = [...intersections, ...pointsOfPoly1OutsidePoly2];
  
  // Remove duplicate points
  allPoints = removeDuplicatePoints(allPoints);
  
  if (allPoints.length < 3) {
    return null; // Not enough points for a valid polygon
  }
  
  // Calculate the centroid of all points
  const centroid = calculateCentroid(allPoints);
  
  // Sort points by angle from centroid
  allPoints.sort((a, b) => {
    const angleA = Math.atan2(a.y - centroid.y, a.x - centroid.x);
    const angleB = Math.atan2(b.y - centroid.y, b.x - centroid.x);
    return angleA - angleB;
  });
  
  // Create a new polyline from the difference points
  return createPolylineFromPoints(allPoints, layer, style || polygon1.style, true);
}

// Helper function to get points from a polygon entity
function getPolygonPoints(polygon: PolygonEntity): Point[] {
  const { center, radius, sides, rotation } = polygon;
  const points: Point[] = [];
  const angleStep = (2 * Math.PI) / sides;
  
  for (let i = 0; i < sides; i++) {
    const angle = i * angleStep + (rotation || 0);
    points.push({
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle)
    });
  }
  
  return points;
}

// Helper function to create a polyline from points
function createPolylineFromPoints(
  points: Point[],
  layer: string,
  style: DrawingStyle,
  closed: boolean = true
): PolylineEntity {
  return {
    id: uuidv4(),
    type: 'polyline',
    layer,
    visible: true,
    locked: false,
    style,
    points,
    closed
  };
}

// Helper function to remove duplicate points
function removeDuplicatePoints(points: Point[]): Point[] {
  const result: Point[] = [];
  const seen = new Set<string>();
  
  for (const point of points) {
    // Use a string key for the set with limited precision
    const key = `${point.x.toFixed(4)},${point.y.toFixed(4)}`;
    
    if (!seen.has(key)) {
      seen.add(key);
      result.push(point);
    }
  }
  
  return result;
}

// Helper function to calculate centroid of points
function calculateCentroid(points: Point[]): Point {
  if (points.length === 0) {
    return { x: 0, y: 0 };
  }
  
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

// Helper function to check if a point is on the boundary of a polygon
function isPointOnBoundary(point: Point, polygon: Point[]): boolean {
  for (let i = 0; i < polygon.length; i++) {
    const p1 = polygon[i];
    const p2 = polygon[(i + 1) % polygon.length];
    
    // Check if point is on the line segment
    const distance = distancePointToSegment(point, p1, p2);
    if (distance < 0.0001) {
      return true;
    }
  }
  
  return false;
}

// Helper function to calculate distance from point to line segment
function distancePointToSegment(point: Point, p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len2 = dx * dx + dy * dy;
  
  if (len2 === 0) {
    // p1 and p2 are the same point
    return Math.sqrt(
      (point.x - p1.x) * (point.x - p1.x) + 
      (point.y - p1.y) * (point.y - p1.y)
    );
  }
  
  // Calculate projection of point onto line
  const t = ((point.x - p1.x) * dx + (point.y - p1.y) * dy) / len2;
  
  if (t < 0) {
    // Closest point is p1
    return Math.sqrt(
      (point.x - p1.x) * (point.x - p1.x) + 
      (point.y - p1.y) * (point.y - p1.y)
    );
  }
  
  if (t > 1) {
    // Closest point is p2
    return Math.sqrt(
      (point.x - p2.x) * (point.x - p2.x) + 
      (point.y - p2.y) * (point.y - p2.y)
    );
  }
  
  // Closest point is on the segment
  const projX = p1.x + t * dx;
  const projY = p1.y + t * dy;
  
  return Math.sqrt(
    (point.x - projX) * (point.x - projX) + 
    (point.y - projY) * (point.y - projY)
  );
} 