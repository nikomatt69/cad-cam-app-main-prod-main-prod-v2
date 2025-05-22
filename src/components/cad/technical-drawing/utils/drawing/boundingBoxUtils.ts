// src/utils/drawing/boundingBoxUtils.ts

import {
  DrawingEntity,
  Dimension,
  Annotation,
  Bounds,
  Point,
  LineEntity,
  CircleEntity,
  RectangleEntity,
  ArcEntity,
  EllipseEntity,
  PolylineEntity,
  TextAnnotation,
  LeaderAnnotation
} from '../../TechnicalDrawingTypes';

// Generate bounding box for a collection of entities
export function generateBoundsFromEntities(
  entities: (DrawingEntity | Dimension | Annotation)[]
): Bounds {
  if (entities.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }
  
  // Initialize bounds with extreme values
  let bounds: Bounds = {
    minX: Number.MAX_VALUE,
    minY: Number.MAX_VALUE,
    maxX: -Number.MAX_VALUE,
    maxY: -Number.MAX_VALUE
  };
  
  // Merge bounds of all entities
  entities.forEach(entity => {
    const entityBounds = generateBoundsForEntity(entity);
    bounds = mergeBounds(bounds, entityBounds);
  });
  
  return bounds;
}

// Merge two bounds objects
export function mergeBounds(a: Bounds, b: Bounds): Bounds {
  return {
    minX: Math.min(a.minX, b.minX),
    minY: Math.min(a.minY, b.minY),
    maxX: Math.max(a.maxX, b.maxX),
    maxY: Math.max(a.maxY, b.maxY)
  };
}

// Generate bounds for a single entity
export function generateBoundsForEntity(
  entity: DrawingEntity | Dimension | Annotation
): Bounds {
  switch (entity.type) {
    case 'line':
      return generateLineEntityBounds(entity as LineEntity);
    
    case 'circle':
      return generateCircleEntityBounds(entity as CircleEntity);
    
    case 'rectangle':
      return generateRectangleEntityBounds(entity as RectangleEntity);
    
    case 'arc':
      return generateArcEntityBounds(entity as ArcEntity);
    
    case 'ellipse':
      return generateEllipseEntityBounds(entity as EllipseEntity);
    
    case 'polyline':
      return generatePolylineEntityBounds(entity as PolylineEntity);
    
    case 'text-annotation':
      return generateTextAnnotationBounds(entity as TextAnnotation);
    
    case 'leader-annotation':
      return generateLeaderAnnotationBounds(entity as LeaderAnnotation);
    
    case 'linear-dimension':
    case 'angular-dimension':
    case 'radial-dimension':
    case 'diameter-dimension':
      return generateDimensionBounds(entity as Dimension);
    
    default:
      return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }
}

// Line entity bounds
function generateLineEntityBounds(line: LineEntity): Bounds {
  return {
    minX: Math.min(line.startPoint.x, line.endPoint.x),
    minY: Math.min(line.startPoint.y, line.endPoint.y),
    maxX: Math.max(line.startPoint.x, line.endPoint.x),
    maxY: Math.max(line.startPoint.y, line.endPoint.y)
  };
}

// Circle entity bounds
function generateCircleEntityBounds(circle: CircleEntity): Bounds {
  return {
    minX: circle.center.x - circle.radius,
    minY: circle.center.y - circle.radius,
    maxX: circle.center.x + circle.radius,
    maxY: circle.center.y + circle.radius
  };
}

// Rectangle entity bounds
function generateRectangleEntityBounds(rect: RectangleEntity): Bounds {
  // For non-rotated rectangles, bounds are simple
  if (!rect.rotation) {
    return {
      minX: rect.position.x,
      minY: rect.position.y,
      maxX: rect.position.x + rect.width,
      maxY: rect.position.y + rect.height
    };
  }
  
  // For rotated rectangles, we need to calculate corner positions
  const cx = rect.position.x + rect.width / 2;
  const cy = rect.position.y + rect.height / 2;
  const halfWidth = rect.width / 2;
  const halfHeight = rect.height / 2;
  const angle = rect.rotation * Math.PI / 180;
  
  // Calculate corner positions after rotation
  const corners = [
    rotatePoint({ x: cx - halfWidth, y: cy - halfHeight }, cx, cy, angle),
    rotatePoint({ x: cx + halfWidth, y: cy - halfHeight }, cx, cy, angle),
    rotatePoint({ x: cx - halfWidth, y: cy + halfHeight }, cx, cy, angle),
    rotatePoint({ x: cx + halfWidth, y: cy + halfHeight }, cx, cy, angle)
  ];
  
  // Find min/max coordinates
  let minX = corners[0].x;
  let minY = corners[0].y;
  let maxX = corners[0].x;
  let maxY = corners[0].y;
  
  for (let i = 1; i < corners.length; i++) {
    minX = Math.min(minX, corners[i].x);
    minY = Math.min(minY, corners[i].y);
    maxX = Math.max(maxX, corners[i].x);
    maxY = Math.max(maxY, corners[i].y);
  }
  
  return { minX, minY, maxX, maxY };
}

// Helper function to rotate a point around a center
function rotatePoint(point: Point, centerX: number, centerY: number, angle: number): Point {
  const s = Math.sin(angle);
  const c = Math.cos(angle);
  
  // Translate point to origin
  const x = point.x - centerX;
  const y = point.y - centerY;
  
  // Rotate point and translate back
  return {
    x: centerX + x * c - y * s,
    y: centerY + x * s + y * c
  };
}

// Arc entity bounds
function generateArcEntityBounds(arc: ArcEntity): Bounds {
  // Start with the two endpoints of the arc
  const startX = arc.center.x + arc.radius * Math.cos(arc.startAngle);
  const startY = arc.center.y + arc.radius * Math.sin(arc.startAngle);
  const endX = arc.center.x + arc.radius * Math.cos(arc.endAngle);
  const endY = arc.center.y + arc.radius * Math.sin(arc.endAngle);
  
  let minX = Math.min(startX, endX);
  let minY = Math.min(startY, endY);
  let maxX = Math.max(startX, endX);
  let maxY = Math.max(startY, endY);
  
  // Check if arc crosses the x or y axis, which would extend the bounds
  // We need to determine which quadrants our arc passes through
  
  // Normalize angles to 0-2π range
  let startAngle = arc.startAngle;
  let endAngle = arc.endAngle;
  
  while (startAngle < 0) startAngle += 2 * Math.PI;
  while (endAngle < 0) endAngle += 2 * Math.PI;
  while (startAngle >= 2 * Math.PI) startAngle -= 2 * Math.PI;
  while (endAngle >= 2 * Math.PI) endAngle -= 2 * Math.PI;
  
  // Determine sweep direction and total angle
  let sweepAngle;
  if (arc.counterclockwise) {
    // Counter-clockwise
    sweepAngle = startAngle > endAngle ? startAngle - endAngle : startAngle + 2 * Math.PI - endAngle;
  } else {
    // Clockwise
    sweepAngle = endAngle > startAngle ? endAngle - startAngle : endAngle + 2 * Math.PI - startAngle;
  }
  
  // Check key angles (0, π/2, π, 3π/2) if they're in the arc's sweep
  const angles = [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2];
  
  angles.forEach(angle => {
    let normalizedAngle = angle;
    while (normalizedAngle < 0) normalizedAngle += 2 * Math.PI;
    while (normalizedAngle >= 2 * Math.PI) normalizedAngle -= 2 * Math.PI;
    
    let inSweep;
    if (arc.counterclockwise) {
      if (startAngle > endAngle) {
        inSweep = normalizedAngle <= startAngle && normalizedAngle >= endAngle;
      } else {
        inSweep = normalizedAngle <= startAngle || normalizedAngle >= endAngle;
      }
    } else {
      if (startAngle < endAngle) {
        inSweep = normalizedAngle >= startAngle && normalizedAngle <= endAngle;
      } else {
        inSweep = normalizedAngle >= startAngle || normalizedAngle <= endAngle;
      }
    }
    
    if (inSweep) {
      const x = arc.center.x + arc.radius * Math.cos(angle);
      const y = arc.center.y + arc.radius * Math.sin(angle);
      
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  });
  
  return { minX, minY, maxX, maxY };
}

// Ellipse entity bounds
function generateEllipseEntityBounds(ellipse: EllipseEntity): Bounds {
  // For non-rotated ellipses, bounds are simple
  if (!ellipse.rotation) {
    return {
      minX: ellipse.center.x - ellipse.radiusX,
      minY: ellipse.center.y - ellipse.radiusY,
      maxX: ellipse.center.x + ellipse.radiusX,
      maxY: ellipse.center.y + ellipse.radiusY
    };
  }
  
  // For rotated ellipses, it's more complex
  // We need to find the extreme points
  const angle = ellipse.rotation * Math.PI / 180;
  const cosAngle = Math.cos(angle);
  const sinAngle = Math.sin(angle);
  
  // Calculate major and minor axis endpoints after rotation
  const points = [
    // Positive X axis point
    {
      x: ellipse.center.x + ellipse.radiusX * cosAngle,
      y: ellipse.center.y + ellipse.radiusX * sinAngle
    },
    // Negative X axis point
    {
      x: ellipse.center.x - ellipse.radiusX * cosAngle,
      y: ellipse.center.y - ellipse.radiusX * sinAngle
    },
    // Positive Y axis point
    {
      x: ellipse.center.x - ellipse.radiusY * sinAngle,
      y: ellipse.center.y + ellipse.radiusY * cosAngle
    },
    // Negative Y axis point
    {
      x: ellipse.center.x + ellipse.radiusY * sinAngle,
      y: ellipse.center.y - ellipse.radiusY * cosAngle
    }
  ];
  
  // Find min/max coordinates
  let minX = points[0].x;
  let minY = points[0].y;
  let maxX = points[0].x;
  let maxY = points[0].y;
  
  for (let i = 1; i < points.length; i++) {
    minX = Math.min(minX, points[i].x);
    minY = Math.min(minY, points[i].y);
    maxX = Math.max(maxX, points[i].x);
    maxY = Math.max(maxY, points[i].y);
  }
  
  return { minX, minY, maxX, maxY };
}

// Polyline entity bounds
function generatePolylineEntityBounds(polyline: PolylineEntity): Bounds {
  if (polyline.points.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }
  
  let minX = polyline.points[0].x;
  let minY = polyline.points[0].y;
  let maxX = polyline.points[0].x;
  let maxY = polyline.points[0].y;
  
  for (let i = 1; i < polyline.points.length; i++) {
    minX = Math.min(minX, polyline.points[i].x);
    minY = Math.min(minY, polyline.points[i].y);
    maxX = Math.max(maxX, polyline.points[i].x);
    maxY = Math.max(maxY, polyline.points[i].y);
  }
  
  return { minX, minY, maxX, maxY };
}

// Text annotation bounds
function generateTextAnnotationBounds(text: TextAnnotation): Bounds {
  const fontSize = text.style.fontSize || 3.5;
  const textWidth = text.text.length * fontSize * 0.6; // Rough estimate
  const textHeight = fontSize * 1.2;
  
  // Default positions based on alignment
  let minX = text.position.x;
  let minY = text.position.y;
  let maxX = text.position.x + textWidth;
  let maxY = text.position.y + textHeight;
  
  // Adjust based on text alignment
  if (text.style.textAlign === 'center') {
    minX = text.position.x - textWidth / 2;
    maxX = text.position.x + textWidth / 2;
  } else if (text.style.textAlign === 'right') {
    minX = text.position.x - textWidth;
    maxX = text.position.x;
  }
  
  // If text is rotated, we need to calculate rotated bounds
  if (text.rotation) {
    // Define the four corners of text bounds
    const corners = [
      { x: minX, y: minY },
      { x: maxX, y: minY },
      { x: minX, y: maxY },
      { x: maxX, y: maxY }
    ];
    
    // Rotate all corners
    const rotatedCorners = corners.map(corner => 
      rotatePoint(corner, text.position.x, text.position.y, text.rotation! * Math.PI / 180)
    );
    
    // Find min/max of rotated corners
    minX = Math.min(...rotatedCorners.map(p => p.x));
    minY = Math.min(...rotatedCorners.map(p => p.y));
    maxX = Math.max(...rotatedCorners.map(p => p.x));
    maxY = Math.max(...rotatedCorners.map(p => p.y));
  }
  
  return { minX, minY, maxX, maxY };
}

// Leader annotation bounds
function generateLeaderAnnotationBounds(leader: LeaderAnnotation): Bounds {
  // Start with bounds of leader points
  let bounds: Bounds;
  
  if (leader.points.length === 0) {
    bounds = {
      minX: leader.startPoint.x,
      minY: leader.startPoint.y,
      maxX: leader.startPoint.x,
      maxY: leader.startPoint.y
    };
  } else {
    bounds = {
      minX: Math.min(leader.startPoint.x, leader.points[0].x),
      minY: Math.min(leader.startPoint.y, leader.points[0].y),
      maxX: Math.max(leader.startPoint.x, leader.points[0].x),
      maxY: Math.max(leader.startPoint.y, leader.points[0].y)
    };
    
    for (let i = 1; i < leader.points.length; i++) {
      bounds.minX = Math.min(bounds.minX, leader.points[i].x);
      bounds.minY = Math.min(bounds.minY, leader.points[i].y);
      bounds.maxX = Math.max(bounds.maxX, leader.points[i].x);
      bounds.maxY = Math.max(bounds.maxY, leader.points[i].y);
    }
  }
  
  // Include text position if available
  if (leader.textPosition) {
    const fontSize = leader.style.fontSize || 3.5;
    const textWidth = leader.text.length * fontSize * 0.6;
    const textHeight = fontSize * 1.2;
    
    bounds.minX = Math.min(bounds.minX, leader.textPosition.x);
    bounds.minY = Math.min(bounds.minY, leader.textPosition.y - textHeight);
    bounds.maxX = Math.max(bounds.maxX, leader.textPosition.x + textWidth);
    bounds.maxY = Math.max(bounds.maxY, leader.textPosition.y);
  }
  
  return bounds;
}

// Generic dimension bounds
function generateDimensionBounds(dimension: Dimension): Bounds {
  // This is a simplified approach since dimensions can be complex
  // Depending on the specific dimension type, gather all points
  const points: Point[] = [];
  
  // Common points
  if ('startPoint' in dimension) points.push(dimension.startPoint);
  if ('endPoint' in dimension) points.push(dimension.endPoint);
  if ('center' in dimension) points.push(dimension.center);
  if ('vertex' in dimension) points.push(dimension.vertex);
  if ('offsetPoint' in dimension) points.push(dimension.offsetPoint);
  if ('textPosition' in dimension) points.push(dimension.textPosition);
  
  // If points exist, calculate bounds
  if (points.length > 0) {
    let minX = points[0].x;
    let minY = points[0].y;
    let maxX = points[0].x;
    let maxY = points[0].y;
    
    for (let i = 1; i < points.length; i++) {
      if (points[i]) {
        minX = Math.min(minX, points[i].x);
        minY = Math.min(minY, points[i].y);
        maxX = Math.max(maxX, points[i].x);
        maxY = Math.max(maxY, points[i].y);
      }
    }
    
    // Add some padding for dimension lines and text
    const padding = dimension.style.fontSize || 5;
    return {
      minX: minX - padding,
      minY: minY - padding,
      maxX: maxX + padding,
      maxY: maxY + padding
    };
  }
  
  return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
}