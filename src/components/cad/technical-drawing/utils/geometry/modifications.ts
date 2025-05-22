import { v4 as uuidv4 } from 'uuid';
import { 
  Point, 
  LineEntity, 
  ArcEntity,
  DrawingEntity,
  DrawingStyle
} from '../../types/TechnicalDrawingTypes';

import { calculateDistance, createFillet, createChamfer } from './calculations';

/**
 * Create a fillet (rounded corner) between two lines
 * Returns null if the lines are parallel or don't intersect
 */
export function createFilletBetweenLines(
  line1: LineEntity,
  line2: LineEntity,
  radius: number,
  layer: string,
  style?: DrawingStyle,
  trimLines: boolean = true
): { fillet: ArcEntity, trimmedLine1?: LineEntity, trimmedLine2?: LineEntity } | null {
  // Get the points of the lines
  const p1 = line1.startPoint;
  const p2 = line1.endPoint;
  const p3 = line2.startPoint;
  const p4 = line2.endPoint;
  
  // Determine which endpoints are closest to form the intersection
  // We need to find the corner point (where the lines would intersect)
  let cornerPoints: [Point, Point, Point] | null = null;
  
  // Check each combination of endpoints
  const d1 = calculateDistance(p2, p3);
  const d2 = calculateDistance(p2, p4);
  const d3 = calculateDistance(p1, p3);
  const d4 = calculateDistance(p1, p4);
  
  // Find the minimum distance to determine which endpoints are closest
  const minDistance = Math.min(d1, d2, d3, d4);
  
  if (minDistance === d1) {
    cornerPoints = [p1, p2, p3];
  } else if (minDistance === d2) {
    cornerPoints = [p1, p2, p4];
  } else if (minDistance === d3) {
    cornerPoints = [p2, p1, p3];
  } else if (minDistance === d4) {
    cornerPoints = [p2, p1, p4];
  }
  
  if (!cornerPoints) return null;
  
  // Now get the fillet geometry
  const filletGeometry = createFillet(cornerPoints[0], cornerPoints[1], cornerPoints[2], radius);
  
  if (!filletGeometry) return null;
  
  // Create the fillet arc entity
  const fillet: ArcEntity = {
    id: uuidv4(),
    type: 'arc',
    layer,
    visible: true,
    locked: false,
    style: style || line1.style,
    center: filletGeometry.arcCenter,
    radius,
    startAngle: filletGeometry.startAngle,
    endAngle: filletGeometry.endAngle
  };
  
  // If we're not trimming the lines, just return the fillet
  if (!trimLines) {
    return { fillet };
  }
  
  // Create trimmed lines
  let trimmedLine1: LineEntity | undefined;
  let trimmedLine2: LineEntity | undefined;
  
  // Determine which endpoint to keep and which to replace with the tangent point
  if (cornerPoints[1] === p2) {
    // First line ends at corner point
    trimmedLine1 = {
      ...line1,
      id: uuidv4(),
      endPoint: filletGeometry.startPoint
    };
  } else {
    // First line starts at corner point
    trimmedLine1 = {
      ...line1,
      id: uuidv4(),
      startPoint: filletGeometry.startPoint
    };
  }
  
  if (cornerPoints[2] === p3) {
    // Second line starts at corner point
    trimmedLine2 = {
      ...line2,
      id: uuidv4(),
      startPoint: filletGeometry.endPoint
    };
  } else {
    // Second line ends at corner point
    trimmedLine2 = {
      ...line2,
      id: uuidv4(),
      endPoint: filletGeometry.endPoint
    };
  }
  
  return { fillet, trimmedLine1, trimmedLine2 };
}

/**
 * Create a chamfer (beveled corner) between two lines
 * Returns null if the lines are parallel or don't intersect
 */
export function createChamferBetweenLines(
  line1: LineEntity,
  line2: LineEntity,
  distance1: number,
  distance2: number = distance1,
  layer: string,
  style?: DrawingStyle,
  trimLines: boolean = true
): { chamfer: LineEntity, trimmedLine1?: LineEntity, trimmedLine2?: LineEntity } | null {
  // Get the points of the lines
  const p1 = line1.startPoint;
  const p2 = line1.endPoint;
  const p3 = line2.startPoint;
  const p4 = line2.endPoint;
  
  // Determine which endpoints are closest to form the intersection
  let cornerPoints: [Point, Point, Point] | null = null;
  
  // Check each combination of endpoints
  const d1 = calculateDistance(p2, p3);
  const d2 = calculateDistance(p2, p4);
  const d3 = calculateDistance(p1, p3);
  const d4 = calculateDistance(p1, p4);
  
  // Find the minimum distance to determine which endpoints are closest
  const minDistance = Math.min(d1, d2, d3, d4);
  
  if (minDistance === d1) {
    cornerPoints = [p1, p2, p3];
  } else if (minDistance === d2) {
    cornerPoints = [p1, p2, p4];
  } else if (minDistance === d3) {
    cornerPoints = [p2, p1, p3];
  } else if (minDistance === d4) {
    cornerPoints = [p2, p1, p4];
  }
  
  if (!cornerPoints) return null;
  
  // Now get the chamfer geometry
  const chamferGeometry = createChamfer(cornerPoints[0], cornerPoints[1], cornerPoints[2], distance1, distance2);
  
  if (!chamferGeometry) return null;
  
  // Create the chamfer line entity
  const chamfer: LineEntity = {
    id: uuidv4(),
    type: 'line',
    layer,
    visible: true,
    locked: false,
    style: style || line1.style,
    startPoint: chamferGeometry.chamferStart,
    endPoint: chamferGeometry.chamferEnd
  };
  
  // If we're not trimming the lines, just return the chamfer
  if (!trimLines) {
    return { chamfer };
  }
  
  // Create trimmed lines
  let trimmedLine1: LineEntity | undefined;
  let trimmedLine2: LineEntity | undefined;
  
  // Determine which endpoint to keep and which to replace with the chamfer point
  if (cornerPoints[1] === p2) {
    // First line ends at corner point
    trimmedLine1 = {
      ...line1,
      id: uuidv4(),
      endPoint: chamferGeometry.chamferStart
    };
  } else {
    // First line starts at corner point
    trimmedLine1 = {
      ...line1,
      id: uuidv4(),
      startPoint: chamferGeometry.chamferStart
    };
  }
  
  if (cornerPoints[2] === p3) {
    // Second line starts at corner point
    trimmedLine2 = {
      ...line2,
      id: uuidv4(),
      startPoint: chamferGeometry.chamferEnd
    };
  } else {
    // Second line ends at corner point
    trimmedLine2 = {
      ...line2,
      id: uuidv4(),
      endPoint: chamferGeometry.chamferEnd
    };
  }
  
  return { chamfer, trimmedLine1, trimmedLine2 };
}

/**
 * Create fillets at all corners of a closed polyline
 */
export function filletPolyline(
  polylineEntities: LineEntity[],
  radius: number,
  layer: string,
  style?: DrawingStyle
): { fillets: ArcEntity[], trimmedLines: LineEntity[] } {
  const fillets: ArcEntity[] = [];
  const trimmedLines: LineEntity[] = [];
  
  // Ensure we have at least 2 lines
  if (!polylineEntities || polylineEntities.length < 2) {
    return { fillets, trimmedLines: [...polylineEntities] };
  }
  
  for (let i = 0; i < polylineEntities.length; i++) {
    const currentLine = polylineEntities[i];
    const nextLine = polylineEntities[(i + 1) % polylineEntities.length];
    
    const filletResult = createFilletBetweenLines(
      currentLine,
      nextLine,
      radius,
      layer,
      style,
      true
    );
    
    if (filletResult) {
      fillets.push(filletResult.fillet);
      
      if (filletResult.trimmedLine1) {
        trimmedLines.push(filletResult.trimmedLine1);
      }
      
      // Only add the second trimmed line if we're at the last line
      // Otherwise it will be handled in the next iteration
      if (i === polylineEntities.length - 1 && filletResult.trimmedLine2) {
        trimmedLines.push(filletResult.trimmedLine2);
      }
    } else {
      // If fillet failed, keep the original line
      trimmedLines.push(currentLine);
    }
  }
  
  return { fillets, trimmedLines };
}

/**
 * Create chamfers at all corners of a closed polyline
 */
export function chamferPolyline(
  polylineEntities: LineEntity[],
  distance1: number,
  distance2: number = distance1,
  layer: string,
  style?: DrawingStyle
): { chamfers: LineEntity[], trimmedLines: LineEntity[] } {
  const chamfers: LineEntity[] = [];
  const trimmedLines: LineEntity[] = [];
  
  // Ensure we have at least 2 lines
  if (!polylineEntities || polylineEntities.length < 2) {
    return { chamfers, trimmedLines: [...polylineEntities] };
  }
  
  for (let i = 0; i < polylineEntities.length; i++) {
    const currentLine = polylineEntities[i];
    const nextLine = polylineEntities[(i + 1) % polylineEntities.length];
    
    const chamferResult = createChamferBetweenLines(
      currentLine,
      nextLine,
      distance1,
      distance2,
      layer,
      style,
      true
    );
    
    if (chamferResult) {
      chamfers.push(chamferResult.chamfer);
      
      if (chamferResult.trimmedLine1) {
        trimmedLines.push(chamferResult.trimmedLine1);
      }
      
      // Only add the second trimmed line if we're at the last line
      // Otherwise it will be handled in the next iteration
      if (i === polylineEntities.length - 1 && chamferResult.trimmedLine2) {
        trimmedLines.push(chamferResult.trimmedLine2);
      }
    } else {
      // If chamfer failed, keep the original line
      trimmedLines.push(currentLine);
    }
  }
  
  return { chamfers, trimmedLines };
} 