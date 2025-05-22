import { v4 as uuidv4 } from 'uuid';
import { 
  Point, 
  LineEntity, 
  PolylineEntity,
  ArcEntity,
  DrawingEntity,
  DrawingStyle
} from 'src/types/TechnicalDrawingTypes';

import { 
  createFilletBetweenLines,
  createChamferBetweenLines,
  filletPolyline,
  chamferPolyline
} from './modifications';

/**
 * Apply fillet to multiple line intersections at once
 * Returns the new fillets and the trimmed original lines
 */
export function batchFillet(
  lines: LineEntity[],
  radius: number,
  layer: string,
  style?: DrawingStyle,
  trimLines: boolean = true
): { fillets: ArcEntity[], trimmedLines: LineEntity[] } {
  const fillets: ArcEntity[] = [];
  const processedLines = new Set<string>();
  const trimmedLines: LineEntity[] = [...lines];
  
  // Process each pair of lines
  for (let i = 0; i < lines.length; i++) {
    const line1 = lines[i];
    
    // Skip already processed lines
    if (processedLines.has(line1.id)) continue;
    
    for (let j = i + 1; j < lines.length; j++) {
      const line2 = lines[j];
      
      // Skip already processed lines
      if (processedLines.has(line2.id)) continue;
      
      // Try to create a fillet between these lines
      const filletResult = createFilletBetweenLines(
        line1,
        line2,
        radius,
        layer,
        style,
        trimLines
      );
      
      if (filletResult) {
        fillets.push(filletResult.fillet);
        
        if (trimLines) {
          // Replace the original lines with trimmed versions
          if (filletResult.trimmedLine1) {
            const index = trimmedLines.findIndex(l => l.id === line1.id);
            if (index >= 0) {
              trimmedLines[index] = filletResult.trimmedLine1;
              processedLines.add(line1.id);
            }
          }
          
          if (filletResult.trimmedLine2) {
            const index = trimmedLines.findIndex(l => l.id === line2.id);
            if (index >= 0) {
              trimmedLines[index] = filletResult.trimmedLine2;
              processedLines.add(line2.id);
            }
          }
        }
      }
    }
  }
  
  return { fillets, trimmedLines };
}

/**
 * Apply chamfer to multiple line intersections at once
 * Returns the new chamfers and the trimmed original lines
 */
export function batchChamfer(
  lines: LineEntity[],
  distance1: number,
  distance2: number = distance1,
  layer: string,
  style?: DrawingStyle,
  trimLines: boolean = true
): { chamfers: LineEntity[], trimmedLines: LineEntity[] } {
  const chamfers: LineEntity[] = [];
  const processedLines = new Set<string>();
  const trimmedLines: LineEntity[] = [...lines];
  
  // Process each pair of lines
  for (let i = 0; i < lines.length; i++) {
    const line1 = lines[i];
    
    // Skip already processed lines
    if (processedLines.has(line1.id)) continue;
    
    for (let j = i + 1; j < lines.length; j++) {
      const line2 = lines[j];
      
      // Skip already processed lines
      if (processedLines.has(line2.id)) continue;
      
      // Try to create a chamfer between these lines
      const chamferResult = createChamferBetweenLines(
        line1,
        line2,
        distance1,
        distance2,
        layer,
        style,
        trimLines
      );
      
      if (chamferResult) {
        chamfers.push(chamferResult.chamfer);
        
        if (trimLines) {
          // Replace the original lines with trimmed versions
          if (chamferResult.trimmedLine1) {
            const index = trimmedLines.findIndex(l => l.id === line1.id);
            if (index >= 0) {
              trimmedLines[index] = chamferResult.trimmedLine1;
              processedLines.add(line1.id);
            }
          }
          
          if (chamferResult.trimmedLine2) {
            const index = trimmedLines.findIndex(l => l.id === line2.id);
            if (index >= 0) {
              trimmedLines[index] = chamferResult.trimmedLine2;
              processedLines.add(line2.id);
            }
          }
        }
      }
    }
  }
  
  return { chamfers, trimmedLines };
}

/**
 * Convert a polyline entity to line entities
 * Useful for applying operations that work on lines
 */
export function polylineToLines(
  polyline: PolylineEntity,
  layer: string
): LineEntity[] {
  const { points, closed } = polyline;
  const lines: LineEntity[] = [];
  
  if (!points || points.length < 2) {
    return lines;
  }
  
  // Create lines between consecutive points
  for (let i = 0; i < points.length - 1; i++) {
    lines.push({
      id: uuidv4(),
      type: 'line',
      layer,
      visible: true,
      locked: false,
      style: polyline.style,
      startPoint: points[i],
      endPoint: points[i + 1]
    });
  }
  
  // If the polyline is closed, add a line from the last point to the first
  if (closed && points.length > 2) {
    lines.push({
      id: uuidv4(),
      type: 'line',
      layer,
      visible: true,
      locked: false,
      style: polyline.style,
      startPoint: points[points.length - 1],
      endPoint: points[0]
    });
  }
  
  return lines;
}

/**
 * Convert line entities to a polyline entity
 */
export function linesToPolyline(
  lines: LineEntity[],
  layer: string,
  closed: boolean = false
): PolylineEntity | null {
  if (!lines || lines.length === 0) {
    return null;
  }
  
  // Sort the lines to form a continuous path
  const sortedLines = sortLinesForPath(lines);
  if (!sortedLines) {
    return null;
  }
  
  // Extract points from the sorted lines
  const points: Point[] = [sortedLines[0].startPoint];
  
  for (const line of sortedLines) {
    points.push(line.endPoint);
  }
  
  // If it's closed and the last point doesn't match the first, remove it
  if (closed && points.length > 1) {
    const lastPoint = points[points.length - 1];
    const firstPoint = points[0];
    
    if (Math.abs(lastPoint.x - firstPoint.x) < 0.001 && 
        Math.abs(lastPoint.y - firstPoint.y) < 0.001) {
      points.pop();
    }
  }
  
  return {
    id: uuidv4(),
    type: 'polyline',
    layer,
    visible: true,
    locked: false,
    style: lines[0].style,
    points,
    closed
  };
}

/**
 * Sort lines to form a continuous path
 * Returns null if the lines cannot form a continuous path
 */
function sortLinesForPath(lines: LineEntity[]): LineEntity[] | null {
  if (lines.length === 0) return [];
  if (lines.length === 1) return [...lines];
  
  const result: LineEntity[] = [lines[0]];
  const remaining = new Set(lines.slice(1));
  
  let current = lines[0];
  let success = true;
  
  // Build path by finding connecting lines
  while (remaining.size > 0 && success) {
    success = false;
    
    let closestLine: LineEntity | undefined;
    let closestDistance = Infinity;
    let reverseClosest = false;
    
    // Find the closest line that connects to the current one
    for (const line of Array.from(remaining)) {
      // Check distance from current end to line start
      const d1 = calculateDistance(current.endPoint, line.startPoint);
      const d2 = calculateDistance(current.endPoint, line.endPoint);
      
      if (d1 < closestDistance) {
        closestDistance = d1;
        closestLine = line;
        reverseClosest = false;
        success = true;
      }
      
      if (d2 < closestDistance) {
        closestDistance = d2;
        closestLine = line;
        reverseClosest = true;
        success = true;
      }
    }
    
    // If we found a connecting line, add it to the result
    if (closestLine && success) {
      remaining.delete(closestLine);
      
      // If we need to reverse the line, create a new reversed version
      if (reverseClosest) {
        current = {
          ...closestLine,
          startPoint: closestLine.endPoint,
          endPoint: closestLine.startPoint
        };
      } else {
        current = closestLine;
      }
      
      result.push(current);
    }
  }
  
  // If we couldn't use all the lines, the path is discontinuous
  if (remaining.size > 0) {
    return null;
  }
  
  return result;
}

/**
 * Helper function to calculate distance between two points
 */
function calculateDistance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Apply fillets to a polyline entity
 */
export function filletPolylineEntity(
  polyline: PolylineEntity,
  radius: number,
  layer: string,
  style?: DrawingStyle
): { fillets: ArcEntity[], resultPolyline: PolylineEntity } {
  // Convert polyline to lines
  const lines = polylineToLines(polyline, layer);
  
  // Apply fillets to the lines
  const { fillets, trimmedLines } = filletPolyline(lines, radius, layer, style);
  
  // Convert the trimmed lines back to a polyline
  const resultPolyline = linesToPolyline(trimmedLines, layer, polyline.closed) || polyline;
  
  return { fillets, resultPolyline };
}

/**
 * Apply chamfers to a polyline entity
 */
export function chamferPolylineEntity(
  polyline: PolylineEntity,
  distance1: number,
  distance2: number = distance1,
  layer: string,
  style?: DrawingStyle
): { chamfers: LineEntity[], resultPolyline: PolylineEntity } {
  // Convert polyline to lines
  const lines = polylineToLines(polyline, layer);
  
  // Apply chamfers to the lines
  const { chamfers, trimmedLines } = chamferPolyline(lines, distance1, distance2, layer, style);
  
  // Convert the trimmed lines back to a polyline
  const resultPolyline = linesToPolyline(trimmedLines, layer, polyline.closed) || polyline;
  
  return { chamfers, resultPolyline };
} 