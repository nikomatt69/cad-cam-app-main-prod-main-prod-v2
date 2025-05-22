import { v4 as uuidv4 } from 'uuid';
import { 
  Point, 
  LineEntity, 
  PolylineEntity, 
  CircleEntity,
  ArcEntity, 
  DrawingEntity,
  DrawingStyle
} from '../../types/TechnicalDrawingTypes';
import { 
  calculateDistance, 
  findLineIntersection, 
  offsetLine, 
  offsetPolyline 
} from './calculations';

/**
 * Offset a line by a specified distance
 */
export function offsetLineEntity(
  lineEntity: LineEntity, 
  distance: number,
  layer: string,
  style?: DrawingStyle
): LineEntity {
  const { startPoint, endPoint } = lineEntity;
  const offset = offsetLine(startPoint, endPoint, distance);
  
  return {
    id: uuidv4(),
    type: 'line',
    layer: layer,
    visible: true,
    locked: false,
    style: style || lineEntity.style,
    startPoint: offset.p1,
    endPoint: offset.p2
  };
}

/**
 * Offset a polyline by a specified distance
 */
export function offsetPolylineEntity(
  polylineEntity: PolylineEntity,
  distance: number,
  layer: string,
  style?: DrawingStyle
): PolylineEntity {
  const { points, closed } = polylineEntity;
  
  if (!points || points.length < 2) {
    throw new Error('Polyline must have at least 2 points to offset');
  }
  
  const offsetPoints = offsetPolyline(points, distance, closed);
  
  return {
    id: uuidv4(),
    type: 'polyline',
    layer: layer,
    visible: true,
    locked: false,
    style: style || polylineEntity.style,
    points: offsetPoints,
    closed: closed
  };
}

/**
 * Offset a circle by a specified distance
 * Positive distance expands the circle, negative contracts it
 */
export function offsetCircleEntity(
  circleEntity: CircleEntity,
  distance: number,
  layer: string,
  style?: DrawingStyle
): CircleEntity | null {
  const { center, radius } = circleEntity;
  
  // Calculate new radius
  const newRadius = radius + distance;
  
  // Check if the new radius is valid
  if (newRadius <= 0) {
    return null;
  }
  
  return {
    id: uuidv4(),
    type: 'circle',
    layer: layer,
    visible: true,
    locked: false,
    style: style || circleEntity.style,
    center: { ...center },
    radius: newRadius
  };
}

/**
 * Offset an arc by a specified distance
 */
export function offsetArcEntity(
  arcEntity: ArcEntity,
  distance: number,
  layer: string,
  style?: DrawingStyle
): ArcEntity | null {
  const { center, radius, startAngle, endAngle, counterclockwise } = arcEntity;
  
  // Calculate new radius
  const newRadius = radius + distance;
  
  // Check if the new radius is valid
  if (newRadius <= 0) {
    return null;
  }
  
  return {
    id: uuidv4(),
    type: 'arc',
    layer: layer,
    visible: true,
    locked: false,
    style: style || arcEntity.style,
    center: { ...center },
    radius: newRadius,
    startAngle,
    endAngle,
    counterclockwise
  };
}

/**
 * Create an offset entity based on the entity type
 * Returns null if the offset cannot be created (e.g., for invalid geometry)
 */
export function offsetEntity(
  entity: DrawingEntity,
  distance: number,
  layer: string,
  style?: DrawingStyle
): DrawingEntity | null {
  switch (entity.type) {
    case 'line':
      return offsetLineEntity(entity as LineEntity, distance, layer, style);
    
    case 'polyline':
      return offsetPolylineEntity(entity as PolylineEntity, distance, layer, style);
    
    case 'circle':
      return offsetCircleEntity(entity as CircleEntity, distance, layer, style);
    
    case 'arc':
      return offsetArcEntity(entity as ArcEntity, distance, layer, style);
    
    default:
      console.warn(`Offset not supported for entity type: ${entity.type}`);
      return null;
  }
}

/**
 * Create parallel copies of an entity at specified distances
 */
export function createParallelCopies(
  entity: DrawingEntity,
  distances: number[],
  layer: string,
  style?: DrawingStyle
): DrawingEntity[] {
  const results: DrawingEntity[] = [];
  
  for (const distance of distances) {
    const offset = offsetEntity(entity, distance, layer, style);
    if (offset) {
      results.push(offset);
    }
  }
  
  return results;
}

/**
 * Create multiple offset copies (useful for contours)
 */
export function createOffsetCopies(
  entity: DrawingEntity,
  numberOfCopies: number,
  distanceBetweenCopies: number,
  layer: string,
  style?: DrawingStyle
): DrawingEntity[] {
  const distances = Array.from(
    { length: numberOfCopies }, 
    (_, i) => (i + 1) * distanceBetweenCopies
  );
  
  return createParallelCopies(entity, distances, layer, style);
}

/**
 * Create a bidirectional offset (both sides of the original entity)
 */
export function createBidirectionalOffset(
  entity: DrawingEntity,
  distance: number,
  layer: string,
  style?: DrawingStyle
): DrawingEntity[] {
  return createParallelCopies(entity, [-distance, distance], layer, style);
} 