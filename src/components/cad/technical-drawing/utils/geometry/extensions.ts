import { v4 as uuidv4 } from 'uuid';
import { 
  Point, 
  LineEntity,
  CircleEntity,
  ArcEntity,
  DrawingEntity,
  DrawingStyle
} from '../../types/TechnicalDrawingTypes';

import { calculateDistance, findLineIntersection } from './calculations';

/**
 * Extend a line to a target length
 * Mode can be 'start' (extend from start), 'end' (extend from end), or 'both' (extend in both directions)
 */
export function extendLineByLength(
  line: LineEntity,
  length: number,
  mode: 'start' | 'end' | 'both' = 'end',
  layer?: string
): LineEntity {
  const { startPoint, endPoint } = line;
  
  // Calculate current line length
  const dx = endPoint.x - startPoint.x;
  const dy = endPoint.y - startPoint.y;
  const currentLength = Math.sqrt(dx * dx + dy * dy);
  
  // Calculate unit direction vector
  const dirX = dx / currentLength;
  const dirY = dy / currentLength;
  
  let newStartPoint = { ...startPoint };
  let newEndPoint = { ...endPoint };
  
  if (mode === 'start' || mode === 'both') {
    // Extend from start point (in the opposite direction)
    newStartPoint = {
      x: startPoint.x - dirX * (mode === 'both' ? length / 2 : length),
      y: startPoint.y - dirY * (mode === 'both' ? length / 2 : length)
    };
  }
  
  if (mode === 'end' || mode === 'both') {
    // Extend from end point
    newEndPoint = {
      x: endPoint.x + dirX * (mode === 'both' ? length / 2 : length),
      y: endPoint.y + dirY * (mode === 'both' ? length / 2 : length)
    };
  }
  
  // Create a new line with the extended points
  return {
    id: uuidv4(),
    type: 'line',
    layer: layer || line.layer,
    visible: line.visible,
    locked: line.locked,
    style: line.style,
    startPoint: newStartPoint,
    endPoint: newEndPoint
  };
}

/**
 * Extend a line to meet another entity
 * Direction can be 'forward' (extend end point), 'backward' (extend start point), or 'both'
 */
export function extendLineToEntity(
  line: LineEntity,
  targetEntity: DrawingEntity,
  direction: 'forward' | 'backward' | 'both' = 'forward',
  layer?: string
): LineEntity | null {
  // First, create a very long extension of the line in the specified direction
  const veryLongLine = extendLineByLength(
    line, 
    10000, // Very long extension
    direction === 'forward' ? 'end' : 
    direction === 'backward' ? 'start' : 'both'
  );
  
  // Then find the intersection with the target entity
  const intersection = findEntityIntersection(veryLongLine, targetEntity);
  
  if (!intersection || intersection.length === 0) {
    return null; // No intersection found
  }
  
  // Find the closest intersection point to the relevant endpoint of the original line
  let closestPoint: Point;
  let minDistance = Infinity;
  
  // Reference point depends on the direction
  const referencePoint = 
    direction === 'forward' ? line.endPoint : 
    direction === 'backward' ? line.startPoint :
    // For 'both', find any intersection
    null;
    
  if (referencePoint) {
    // Find closest intersection to the reference point
    for (const point of intersection) {
      const distance = calculateDistance(referencePoint, point);
      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = point;
      }
    }
  } else {
    // For 'both' direction, take any intersection
    closestPoint = intersection[0];
  }
  
  // Create the new extended line
  let newStartPoint = { ...line.startPoint };
  let newEndPoint = { ...line.endPoint };
  
  if (direction === 'forward' || direction === 'both') {
    newEndPoint = closestPoint!;
  }
  
  if (direction === 'backward' || direction === 'both') {
    newStartPoint = closestPoint!;
  }
  
  return {
    id: uuidv4(),
    type: 'line',
    layer: layer || line.layer,
    visible: line.visible,
    locked: line.locked,
    style: line.style,
    startPoint: newStartPoint,
    endPoint: newEndPoint
  };
}

/**
 * Find all intersection points between a line and another entity
 */
export function findEntityIntersection(line: LineEntity, entity: DrawingEntity): Point[] {
  const { startPoint, endPoint } = line;
  const intersections: Point[] = [];
  
  switch (entity.type) {
    case 'line': {
      const intersection = findLineIntersection(
        startPoint, 
        endPoint, 
        entity.startPoint, 
        entity.endPoint
      );
      
      if (intersection) {
        intersections.push(intersection);
      }
      break;
    }
    
    case 'circle': {
      const circleEntity = entity as CircleEntity;
      const { center, radius } = circleEntity;
      
      // Calculate line parameters: ax + by + c = 0
      const a = endPoint.y - startPoint.y;
      const b = startPoint.x - endPoint.x;
      const c = endPoint.x * startPoint.y - startPoint.x * endPoint.y;
      
      // Distance from center to line
      const dist = Math.abs(a * center.x + b * center.y + c) / Math.sqrt(a * a + b * b);
      
      // If distance is greater than radius, no intersection
      if (dist > radius) {
        break;
      }
      
      // Calculate intersection points
      if (Math.abs(dist - radius) < 0.0001) {
        // Line is tangent to circle, one intersection point
        const t = -(a * center.x + b * center.y + c) / (a * a + b * b);
        intersections.push({
          x: center.x + a * t,
          y: center.y + b * t
        });
      } else {
        // Line intersects circle at two points
        // Calculate the points where the line and circle intersect
        const dx = endPoint.x - startPoint.x;
        const dy = endPoint.y - startPoint.y;
        const A = dx * dx + dy * dy;
        const B = 2 * (dx * (startPoint.x - center.x) + dy * (startPoint.y - center.y));
        const C = (startPoint.x - center.x) * (startPoint.x - center.x) + 
                  (startPoint.y - center.y) * (startPoint.y - center.y) - 
                  radius * radius;
        
        const discriminant = B * B - 4 * A * C;
        
        if (discriminant >= 0) {
          const t1 = (-B + Math.sqrt(discriminant)) / (2 * A);
          const t2 = (-B - Math.sqrt(discriminant)) / (2 * A);
          
          // Check if intersection points are on the line segment
          if (t1 >= 0 && t1 <= 1) {
            intersections.push({
              x: startPoint.x + t1 * dx,
              y: startPoint.y + t1 * dy
            });
          }
          
          if (t2 >= 0 && t2 <= 1) {
            intersections.push({
              x: startPoint.x + t2 * dx,
              y: startPoint.y + t2 * dy
            });
          }
        }
      }
      break;
    }
    
    case 'arc': {
      const arcEntity = entity as ArcEntity;
      const { center, radius, startAngle, endAngle } = arcEntity;
      
      // First find intersections with the full circle
      const circleEntity: CircleEntity = {
        id: '', // Temporary ID
        type: 'circle',
        layer: '',
        visible: true,
        locked: false,
        style: {
          strokeColor: '#000000',
          strokeWidth: 1,
          strokeStyle: 'solid'
        },
        center,
        radius
      };
      
      const circleIntersections = findEntityIntersection(line, circleEntity);
      
      // Now check if the intersection points are within the arc angles
      for (const point of circleIntersections) {
        const angle = Math.atan2(point.y - center.y, point.x - center.x);
        
        // Convert angle to [0, 2π] range
        let normalizedAngle = angle;
        if (normalizedAngle < 0) {
          normalizedAngle += 2 * Math.PI;
        }
        
        // Convert start and end angles to [0, 2π] range
        let normalizedStartAngle = startAngle || 0;
        if (normalizedStartAngle < 0) {
          normalizedStartAngle += 2 * Math.PI;
        }
        
        let normalizedEndAngle = endAngle || 0;
        if (normalizedEndAngle < 0) {
          normalizedEndAngle += 2 * Math.PI;
        }
        
        // Check if angle is within the arc
        let isInArc = false;
        
        if (normalizedStartAngle <= normalizedEndAngle) {
          isInArc = normalizedAngle >= normalizedStartAngle && 
                    normalizedAngle <= normalizedEndAngle;
        } else {
          // Arc crosses the 0/2π boundary
          isInArc = normalizedAngle >= normalizedStartAngle || 
                    normalizedAngle <= normalizedEndAngle;
        }
        
        if (isInArc) {
          intersections.push(point);
        }
      }
      break;
    }
    
    case 'polyline': {
      const polyline = entity;
      if (!polyline.points || polyline.points.length < 2) break;
      
      // Check each segment of the polyline
      for (let i = 0; i < polyline.points.length - 1; i++) {
        const p1 = polyline.points[i];
        const p2 = polyline.points[i + 1];
        
        const intersection = findLineIntersection(startPoint, endPoint, p1, p2);
        if (intersection) {
          intersections.push(intersection);
        }
      }
      
      // If polyline is closed, check the last segment
      if (polyline.closed && polyline.points.length > 2) {
        const p1 = polyline.points[polyline.points.length - 1];
        const p2 = polyline.points[0];
        
        const intersection = findLineIntersection(startPoint, endPoint, p1, p2);
        if (intersection) {
          intersections.push(intersection);
        }
      }
      break;
    }
    
    default:
      // Other entity types not supported
      break;
  }
  
  return intersections;
}

/**
 * Trim a line at an intersection with another entity
 * Mode can be 'start' (trim from start to intersection), 'end' (trim from intersection to end),
 * or 'closest' (trim the part closest to the reference point)
 */
export function trimLineAtEntity(
  line: LineEntity,
  entity: DrawingEntity,
  referencePoint: Point,
  mode: 'start' | 'end' | 'closest' = 'closest',
  layer?: string
): LineEntity | null {
  // Find intersections
  const intersections = findEntityIntersection(line, entity);
  
  if (!intersections || intersections.length === 0) {
    return null; // No intersections found
  }
  
  // Find the closest intersection to the reference point
  let closestIntersection: Point | null = null;
  let minDistance = Infinity;
  
  for (const point of intersections) {
    const distance = calculateDistance(referencePoint, point);
    if (distance < minDistance) {
      minDistance = distance;
      closestIntersection = point;
    }
  }
  
  if (!closestIntersection) {
    return null;
  }
  
  // Determine which part to keep based on the mode
  let newStartPoint = { ...line.startPoint };
  let newEndPoint = { ...line.endPoint };
  
  if (mode === 'start') {
    // Keep the part from start to intersection
    newEndPoint = closestIntersection;
  } else if (mode === 'end') {
    // Keep the part from intersection to end
    newStartPoint = closestIntersection;
  } else { // 'closest'
    // Determine which endpoint is closer to the reference point
    const distToStart = calculateDistance(referencePoint, line.startPoint);
    const distToEnd = calculateDistance(referencePoint, line.endPoint);
    
    if (distToStart < distToEnd) {
      // Reference point is closer to start, keep the start side
      newEndPoint = closestIntersection;
    } else {
      // Reference point is closer to end, keep the end side
      newStartPoint = closestIntersection;
    }
  }
  
  // Create the trimmed line
  return {
    id: uuidv4(),
    type: 'line',
    layer: layer || line.layer,
    visible: line.visible,
    locked: line.locked,
    style: line.style,
    startPoint: newStartPoint,
    endPoint: newEndPoint
  };
}

/**
 * Split a line at an intersection with another entity
 * Returns two new lines representing the split line
 */
export function splitLineAtEntity(
  line: LineEntity,
  entity: DrawingEntity,
  layer?: string
): [LineEntity, LineEntity] | null {
  // Find intersections
  const intersections = findEntityIntersection(line, entity);
  
  if (!intersections || intersections.length === 0) {
    return null; // No intersections found
  }
  
  // Use the first intersection (for simplicity)
  const intersection = intersections[0];
  
  // Create two new lines
  const line1: LineEntity = {
    id: uuidv4(),
    type: 'line',
    layer: layer || line.layer,
    visible: line.visible,
    locked: line.locked,
    style: line.style,
    startPoint: { ...line.startPoint },
    endPoint: intersection
  };
  
  const line2: LineEntity = {
    id: uuidv4(),
    type: 'line',
    layer: layer || line.layer,
    visible: line.visible,
    locked: line.locked,
    style: line.style,
    startPoint: intersection,
    endPoint: { ...line.endPoint }
  };
  
  return [line1, line2];
} 