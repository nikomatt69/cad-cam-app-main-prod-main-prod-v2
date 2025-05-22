// src/utils/drawing/hitTestUtils.ts

import {
  DrawingEntity,
  Dimension,
  Annotation,
  Point,
  LineEntity,
  CircleEntity,
  RectangleEntity,
  ArcEntity,
  EllipseEntity,
  PolylineEntity,
  TextAnnotation,
  LeaderAnnotation,
  LinearDimension
} from 'src/types/TechnicalDrawingTypes';

// Main hit testing function for any entity type
export function hitTestEntity(
  entity: DrawingEntity | Dimension | Annotation,
  point: Point,
  zoom: number
): boolean {
  // Calculate hit threshold based on zoom level and line width
  // This makes hit testing more accurate at different zoom levels
  const threshold = Math.max(5 / zoom, entity.style.strokeWidth / zoom);
  
  switch (entity.type) {
    case 'line':
      return hitTestLine(entity as LineEntity, point, threshold);
      
    case 'circle':
      return hitTestCircle(entity as CircleEntity, point, threshold);
      
    case 'rectangle':
      return hitTestRectangle(entity as RectangleEntity, point, threshold);
      
    case 'arc':
      return hitTestArc(entity as ArcEntity, point, threshold);
      
    case 'ellipse':
      return hitTestEllipse(entity as EllipseEntity, point, threshold);
      
    case 'polyline':
      return hitTestPolyline(entity as PolylineEntity, point, threshold);
      
    case 'text-annotation':
      return hitTestTextAnnotation(entity as TextAnnotation, point, threshold);
      
    case 'leader-annotation':
      return hitTestLeaderAnnotation(entity as LeaderAnnotation, point, threshold);
      
    case 'linear-dimension':
      return hitTestLinearDimension(entity as LinearDimension, point, threshold);
      
    default:
      return false;
  }
}

// Helper function: Distance from point to a line segment
function distancePointToLineSegment(
  point: Point,
  lineStart: Point,
  lineEnd: Point
): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  
  if (length === 0) return Math.sqrt((point.x - lineStart.x) ** 2 + (point.y - lineStart.y) ** 2);
  
  // Calculate projection of point onto line
  const t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (length * length);
  
  // If projection falls outside line segment, return distance to nearest endpoint
  if (t < 0) return Math.sqrt((point.x - lineStart.x) ** 2 + (point.y - lineStart.y) ** 2);
  if (t > 1) return Math.sqrt((point.x - lineEnd.x) ** 2 + (point.y - lineEnd.y) ** 2);
  
  // Otherwise, return perpendicular distance to line
  const projectionX = lineStart.x + t * dx;
  const projectionY = lineStart.y + t * dy;
  return Math.sqrt((point.x - projectionX) ** 2 + (point.y - projectionY) ** 2);
}

// Hit testing for a line entity
function hitTestLine(
  line: LineEntity,
  point: Point,
  threshold: number
): boolean {
  return distancePointToLineSegment(point, line.startPoint, line.endPoint) <= threshold;
}

// Hit testing for a circle entity
function hitTestCircle(
  circle: CircleEntity,
  point: Point,
  threshold: number
): boolean {
  // Calculate distance from point to circle center
  const distance = Math.sqrt(
    (point.x - circle.center.x) ** 2 + 
    (point.y - circle.center.y) ** 2
  );
  
  // Check if point is near the circle perimeter
  return Math.abs(distance - circle.radius) <= threshold;
}

// Hit testing for a rectangle entity
function hitTestRectangle(
  rect: RectangleEntity,
  point: Point,
  threshold: number
): boolean {
  // If rectangle is not rotated, use simple bounding box check
  if (!rect.rotation) {
    // Check if point is near any of the edges
    const left = rect.position.x;
    const right = rect.position.x + rect.width;
    const top = rect.position.y;
    const bottom = rect.position.y + rect.height;
    
    // Check top edge
    if (Math.abs(point.y - top) <= threshold && point.x >= left - threshold && point.x <= right + threshold) {
      return true;
    }
    
    // Check bottom edge
    if (Math.abs(point.y - bottom) <= threshold && point.x >= left - threshold && point.x <= right + threshold) {
      return true;
    }
    
    // Check left edge
    if (Math.abs(point.x - left) <= threshold && point.y >= top - threshold && point.y <= bottom + threshold) {
      return true;
    }
    
    // Check right edge
    if (Math.abs(point.x - right) <= threshold && point.y >= top - threshold && point.y <= bottom + threshold) {
      return true;
    }
    
    return false;
  } else {
    // For rotated rectangles, need to transform point and check
    const centerX = rect.position.x + rect.width / 2;
    const centerY = rect.position.y + rect.height / 2;
    
    // Translate point relative to rectangle center
    const translatedX = point.x - centerX;
    const translatedY = point.y - centerY;
    
    // Rotate point in the opposite direction of rectangle rotation
    const rotationRad = -rect.rotation * Math.PI / 180;
    const rotatedX = translatedX * Math.cos(rotationRad) - translatedY * Math.sin(rotationRad);
    const rotatedY = translatedX * Math.sin(rotationRad) + translatedY * Math.cos(rotationRad);
    
    // Check if rotated point is near the non-rotated rectangle edges
    const halfWidth = rect.width / 2;
    const halfHeight = rect.height / 2;
    
    // Check top edge
    if (Math.abs(rotatedY - (-halfHeight)) <= threshold && rotatedX >= -halfWidth - threshold && rotatedX <= halfWidth + threshold) {
      return true;
    }
    
    // Check bottom edge
    if (Math.abs(rotatedY - halfHeight) <= threshold && rotatedX >= -halfWidth - threshold && rotatedX <= halfWidth + threshold) {
      return true;
    }
    
    // Check left edge
    if (Math.abs(rotatedX - (-halfWidth)) <= threshold && rotatedY >= -halfHeight - threshold && rotatedY <= halfHeight + threshold) {
      return true;
    }
    
    // Check right edge
    if (Math.abs(rotatedX - halfWidth) <= threshold && rotatedY >= -halfHeight - threshold && rotatedY <= halfHeight + threshold) {
      return true;
    }
    
    return false;
  }
}

// Hit testing for an arc entity
function hitTestArc(
  arc: ArcEntity,
  point: Point,
  threshold: number
): boolean {
  // Calculate distance from point to arc center
  const distance = Math.sqrt(
    (point.x - arc.center.x) ** 2 + 
    (point.y - arc.center.y) ** 2
  );
  
  // Check if point is near the arc perimeter
  if (Math.abs(distance - arc.radius) > threshold) {
    return false;
  }
  
  // Calculate angle of the point relative to center
  let angle = Math.atan2(point.y - arc.center.y, point.x - arc.center.x);
  if (angle < 0) angle += Math.PI * 2;
  
  // Normalize start and end angles to [0, 2π]
  let startAngle = arc.startAngle;
  let endAngle = arc.endAngle;
  
  while (startAngle < 0) startAngle += Math.PI * 2;
  while (endAngle < 0) endAngle += Math.PI * 2;
  while (startAngle >= Math.PI * 2) startAngle -= Math.PI * 2;
  while (endAngle >= Math.PI * 2) endAngle -= Math.PI * 2;
  
  // Check if angle is within arc's range
  if (arc.counterclockwise) {
    if (startAngle > endAngle) {
      return angle <= startAngle && angle >= endAngle;
    } else {
      return angle <= startAngle || angle >= endAngle;
    }
  } else {
    if (startAngle < endAngle) {
      return angle >= startAngle && angle <= endAngle;
    } else {
      return angle >= startAngle || angle <= endAngle;
    }
  }
}

// Hit testing for an ellipse entity
function hitTestEllipse(
  ellipse: EllipseEntity,
  point: Point,
  threshold: number
): boolean {
  // For rotated ellipses, we need to transform the point
  let transformedX = point.x - ellipse.center.x;
  let transformedY = point.y - ellipse.center.y;
  
  // Apply rotation if needed
  if (ellipse.rotation) {
    const angle = -ellipse.rotation * Math.PI / 180; // Negative for inverse rotation
    const rotatedX = transformedX * Math.cos(angle) - transformedY * Math.sin(angle);
    const rotatedY = transformedX * Math.sin(angle) + transformedY * Math.cos(angle);
    transformedX = rotatedX;
    transformedY = rotatedY;
  }
  
  // Calculate normalized distance (x²/a² + y²/b² = 1 for ellipse)
  const normalized = (transformedX * transformedX) / (ellipse.radiusX * ellipse.radiusX) + 
                     (transformedY * transformedY) / (ellipse.radiusY * ellipse.radiusY);
  
  // Point is on the ellipse if normalized distance is close to 1
  return Math.abs(normalized - 1) <= threshold / Math.min(ellipse.radiusX, ellipse.radiusY);
}

// Hit testing for a polyline entity
function hitTestPolyline(
  polyline: PolylineEntity,
  point: Point,
  threshold: number
): boolean {
  if (polyline.points.length < 2) return false;
  
  // Check each segment of the polyline
  for (let i = 0; i < polyline.points.length - 1; i++) {
    if (distancePointToLineSegment(point, polyline.points[i], polyline.points[i + 1]) <= threshold) {
      return true;
    }
  }
  
  // If closed, check the closing segment too
  if (polyline.closed && polyline.points.length > 2) {
    return distancePointToLineSegment(
      point, 
      polyline.points[polyline.points.length - 1], 
      polyline.points[0]
    ) <= threshold;
  }
  
  return false;
}

// Hit testing for a text annotation
function hitTestTextAnnotation(
  text: TextAnnotation,
  point: Point,
  threshold: number
): boolean {
  // This is a simplified hit test for text - a more accurate one would calculate text bounds
  // based on font metrics, but that's complex in canvas
  const textSize = text.style.fontSize || 3.5;
  const textWidth = text.text.length * textSize * 0.6; // Rough estimate of text width
  const textHeight = textSize * 1.2; // Rough estimate of text height
  
  let textLeft = text.position.x;
  let textTop = text.position.y;
  
  // Adjust based on text alignment
  if (text.style.textAlign === 'center') {
    textLeft -= textWidth / 2;
  } else if (text.style.textAlign === 'right') {
    textLeft -= textWidth;
  }
  
  // If text is rotated, we need a more complex hit test
  if (text.rotation) {
    // Convert rotation to radians
    const angle = text.rotation * Math.PI / 180;
    
    // Translate point relative to text position
    const translatedX = point.x - text.position.x;
    const translatedY = point.y - text.position.y;
    
    // Rotate point in the opposite direction
    const rotatedX = translatedX * Math.cos(-angle) - translatedY * Math.sin(-angle);
    const rotatedY = translatedX * Math.sin(-angle) + translatedY * Math.cos(-angle);
    
    // Check if rotated point is within text bounds (adjusted for alignment)
    let checkLeft = 0;
    if (text.style.textAlign === 'center') {
      checkLeft = -textWidth / 2;
    } else if (text.style.textAlign === 'right') {
      checkLeft = -textWidth;
    }
    
    return rotatedX >= checkLeft - threshold && 
           rotatedX <= checkLeft + textWidth + threshold &&
           rotatedY >= -threshold &&
           rotatedY <= textHeight + threshold;
  } else {
    // Simple rectangle check
    return point.x >= textLeft - threshold &&
           point.x <= textLeft + textWidth + threshold &&
           point.y >= textTop - threshold &&
           point.y <= textTop + textHeight + threshold;
  }
}

// Hit testing for a leader annotation
function hitTestLeaderAnnotation(
  leader: LeaderAnnotation,
  point: Point,
  threshold: number
): boolean {
  // Check if point is near any segment of the leader line
  if (leader.points.length > 0) {
    // Check first segment from start point
    if (distancePointToLineSegment(point, leader.startPoint, leader.points[0]) <= threshold) {
      return true;
    }
    
    // Check remaining segments between points
    for (let i = 0; i < leader.points.length - 1; i++) {
      if (distancePointToLineSegment(point, leader.points[i], leader.points[i + 1]) <= threshold) {
        return true;
      }
    }
    
    // Check if near the text
    if (leader.textPosition) {
      // Simple rectangle check for text
      const textSize = leader.style.fontSize || 3.5;
      const textWidth = leader.text.length * textSize * 0.6;
      const textHeight = textSize * 1.2;
      
      return point.x >= leader.textPosition.x - threshold &&
             point.x <= leader.textPosition.x + textWidth + threshold &&
             point.y >= leader.textPosition.y - textHeight - threshold &&
             point.y <= leader.textPosition.y + threshold;
    }
  }
  
  return false;
}

// Hit testing for a linear dimension
function hitTestLinearDimension(
  dimension: LinearDimension,
  point: Point,
  threshold: number
): boolean {
  // Check if point is near extension lines
  if (distancePointToLineSegment(point, 
      dimension.startPoint, 
      { x: dimension.startPoint.x, y: dimension.startPoint.y + dimension.offsetDistance }
  ) <= threshold) {
    return true;
  }
  
  if (distancePointToLineSegment(point, 
      dimension.endPoint, 
      { x: dimension.endPoint.x, y: dimension.endPoint.y + dimension.offsetDistance }
  ) <= threshold) {
    return true;
  }
  
  // Check if point is near dimension line
  if (distancePointToLineSegment(point, 
      { x: dimension.startPoint.x, y: dimension.startPoint.y + dimension.offsetDistance },
      { x: dimension.endPoint.x, y: dimension.endPoint.y + dimension.offsetDistance }
  ) <= threshold) {
    return true;
  }
  
  // Check if near the text
  const textX = (dimension.startPoint.x + dimension.endPoint.x) / 2;
  const textY = dimension.startPoint.y + dimension.offsetDistance - 2;
  
  const textSize = dimension.style.fontSize || 3.5;
  const textWidth = (dimension.text?.length || 0) * textSize * 0.6;
  const textHeight = textSize * 1.2;
  
  return point.x >= textX - textWidth / 2 - threshold &&
         point.x <= textX + textWidth / 2 + threshold &&
         point.y >= textY - textHeight - threshold &&
         point.y <= textY + threshold;
}