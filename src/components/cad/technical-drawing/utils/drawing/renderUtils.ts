// src/utils/drawing/renderUtils.ts

import {
  DrawingEntity,
  Dimension,
  Annotation,
  LineEntity,
  CircleEntity,
  RectangleEntity,
  ArcEntity,
  EllipseEntity,
  PolylineEntity,
  SplineEntity,
  LinearDimension,
  AngularDimension,
  RadialDimension,
  DiameterDimension,
  TextAnnotation,
  LeaderAnnotation,
  Point
} from 'src/types/TechnicalDrawingTypes';

interface RenderOptions {
  isSelected?: boolean;
  isHovered?: boolean;
  zoom: number;
}

// Function to draw any entity
export function drawEntity(
  ctx: CanvasRenderingContext2D, 
  entity: DrawingEntity, 
  options: RenderOptions
) {
  const { isSelected = false, isHovered = false, zoom } = options;
  
  // Set styling based on selection state
  if (isSelected) {
    ctx.strokeStyle = '#1e88e5'; // Blue for selected
    ctx.lineWidth = (entity.style.strokeWidth * 1.5) / zoom;
  } else if (isHovered) {
    ctx.strokeStyle = '#42a5f5'; // Light blue for hover
    ctx.lineWidth = (entity.style.strokeWidth * 1.2) / zoom;
  } else {
    ctx.strokeStyle = entity.style.strokeColor;
    ctx.lineWidth = entity.style.strokeWidth / zoom;
  }
  
  // Set dash pattern if not solid
  if (entity.style.strokeStyle === 'solid') {
    ctx.setLineDash([]);
  } else {
    // Set different dash patterns based on style
    switch (entity.style.strokeStyle) {
      case 'dashed':
        ctx.setLineDash([5 / zoom, 2 / zoom]);
        break;
      case 'dotted':
        ctx.setLineDash([1 / zoom, 2 / zoom]);
        break;
      case 'dash-dot':
        ctx.setLineDash([5 / zoom, 2 / zoom, 1 / zoom, 2 / zoom]);
        break;
      case 'center':
        ctx.setLineDash([10 / zoom, 2 / zoom, 2 / zoom, 2 / zoom]);
        break;
      case 'phantom':
        ctx.setLineDash([10 / zoom, 2 / zoom, 2 / zoom, 2 / zoom, 2 / zoom, 2 / zoom]);
        break;
      case 'hidden':
        ctx.setLineDash([5 / zoom, 5 / zoom]);
        break;
    }
  }
  
  // Draw entity based on type
  ctx.beginPath();
  
  switch (entity.type) {
    case 'line':
      drawLine(ctx, entity as LineEntity);
      break;
      
    case 'circle':
      drawCircle(ctx, entity as CircleEntity);
      break;
      
    case 'arc':
      drawArc(ctx, entity as ArcEntity);
      break;
      
    case 'rectangle':
      drawRectangle(ctx, entity as RectangleEntity);
      break;
      
    case 'polyline':
      drawPolyline(ctx, entity as PolylineEntity);
      break;
      
    case 'ellipse':
      drawEllipse(ctx, entity as EllipseEntity);
      break;
      
    case 'spline':
      drawSpline(ctx, entity as SplineEntity);
      break;
    
    default:
      console.warn(`Unsupported entity type: ${entity.type}`);
  }
  
  // Stroke the entity
  ctx.stroke();
  
  // Fill if applicable
  if (entity.style.fillColor && entity.style.fillOpacity) {
    ctx.fillStyle = entity.style.fillColor;
    ctx.globalAlpha = entity.style.fillOpacity;
    ctx.fill();
    ctx.globalAlpha = 1.0; // Reset alpha
  }
  
  // Draw selection handles if selected
  if (isSelected) {
    drawSelectionHandles(ctx, entity, zoom);
  }
}

// Draw a line entity
function drawLine(ctx: CanvasRenderingContext2D, line: LineEntity) {
  ctx.moveTo(line.startPoint.x, line.startPoint.y);
  ctx.lineTo(line.endPoint.x, line.endPoint.y);
}

// Draw a circle entity
function drawCircle(ctx: CanvasRenderingContext2D, circle: CircleEntity) {
  ctx.arc(circle.center.x, circle.center.y, circle.radius, 0, Math.PI * 2);
}

// Draw an arc entity
function drawArc(ctx: CanvasRenderingContext2D, arc: ArcEntity) {
  ctx.arc(
    arc.center.x, 
    arc.center.y, 
    arc.radius, 
    arc.startAngle, 
    arc.endAngle, 
    arc.counterclockwise
  );
}

// Draw a rectangle entity
function drawRectangle(ctx: CanvasRenderingContext2D, rect: RectangleEntity) {
  if (rect.rotation) {
    // Draw rotated rectangle
    ctx.save();
    ctx.translate(rect.position.x + rect.width / 2, rect.position.y + rect.height / 2);
    ctx.rotate(rect.rotation * Math.PI / 180);
    ctx.rect(-rect.width / 2, -rect.height / 2, rect.width, rect.height);
    ctx.restore();
  } else {
    // Draw normal rectangle
    ctx.rect(
      rect.position.x, 
      rect.position.y, 
      rect.width, 
      rect.height
    );
  }
}

// Draw a polyline entity
function drawPolyline(ctx: CanvasRenderingContext2D, polyline: PolylineEntity) {
  if (polyline.points.length > 0) {
    ctx.moveTo(polyline.points[0].x, polyline.points[0].y);
    for (let i = 1; i < polyline.points.length; i++) {
      ctx.lineTo(polyline.points[i].x, polyline.points[i].y);
    }
    if (polyline.closed) {
      ctx.closePath();
    }
  }
}

// Draw an ellipse entity
function drawEllipse(ctx: CanvasRenderingContext2D, ellipse: EllipseEntity) {
  if (ellipse.rotation) {
    // Draw rotated ellipse
    ctx.save();
    ctx.translate(ellipse.center.x, ellipse.center.y);
    ctx.rotate(ellipse.rotation * Math.PI / 180);
    ctx.ellipse(
      0,
      0,
      ellipse.radiusX,
      ellipse.radiusY,
      0,
      0,
      Math.PI * 2
    );
    ctx.restore();
  } else {
    // Draw normal ellipse
    ctx.ellipse(
      ellipse.center.x,
      ellipse.center.y,
      ellipse.radiusX,
      ellipse.radiusY,
      0,
      0,
      Math.PI * 2
    );
  }
}

// Draw a spline entity - simplified as a series of lines
function drawSpline(ctx: CanvasRenderingContext2D, spline: SplineEntity) {
  if (spline.points.length < 2) return;
  
  // Simple implementation - just connect the points
  ctx.moveTo(spline.points[0].x, spline.points[0].y);
  
  // If control points are provided, use them for a proper Bezier curve
  if (spline.controlPoints && spline.controlPoints.length >= 2) {
    for (let i = 1; i < spline.points.length; i++) {
      const cp1Index = (i - 1) * 2;
      const cp2Index = cp1Index + 1;
      
      if (spline.controlPoints[cp1Index] && spline.controlPoints[cp2Index]) {
        ctx.bezierCurveTo(
          spline.controlPoints[cp1Index].x,
          spline.controlPoints[cp1Index].y,
          spline.controlPoints[cp2Index].x,
          spline.controlPoints[cp2Index].y,
          spline.points[i].x,
          spline.points[i].y
        );
      } else {
        // Fallback to line if control points are missing
        ctx.lineTo(spline.points[i].x, spline.points[i].y);
      }
    }
  } else {
    // Approximate curve using cardinal spline
    const tension = 0.5;
    for (let i = 1; i < spline.points.length; i++) {
      // Calculate control points
      let p0 = spline.points[i - 1];
      let p1 = spline.points[i];
      let p2 = spline.points[i + 1] || p1;
      let p3 = spline.points[i + 2] || p2;
      
      // Catmull-Rom to Bezier conversion
      let cp1x = p0.x + (p2.x - p0.x) * tension;
      let cp1y = p0.y + (p2.y - p0.y) * tension;
      let cp2x = p1.x - (p3.x - p1.x) * tension;
      let cp2y = p1.y - (p3.y - p1.y) * tension;
      
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p1.x, p1.y);
    }
  }
  
  if (spline.closed) {
    ctx.closePath();
  }
}

// Function to draw any dimension
export function drawDimension(
  ctx: CanvasRenderingContext2D, 
  dimension: Dimension, 
  options: RenderOptions
) {
  const { isSelected = false, isHovered = false, zoom } = options;
  
  // Set styling based on selection state
  if (isSelected) {
    ctx.strokeStyle = '#1e88e5'; // Blue for selected
    ctx.lineWidth = (dimension.style.strokeWidth * 1.5) / zoom;
  } else if (isHovered) {
    ctx.strokeStyle = '#42a5f5'; // Light blue for hover
    ctx.lineWidth = (dimension.style.strokeWidth * 1.2) / zoom;
  } else {
    ctx.strokeStyle = dimension.style.strokeColor;
    ctx.lineWidth = dimension.style.strokeWidth / zoom;
  }
  
  ctx.setLineDash([]);
  
  // Draw dimension based on type
  switch (dimension.type) {
    case 'linear-dimension':
      drawLinearDimension(ctx, dimension as LinearDimension, options);
      break;
      
    case 'angular-dimension':
      drawAngularDimension(ctx, dimension as AngularDimension, options);
      break;
      
    case 'radial-dimension':
      drawRadialDimension(ctx, dimension as RadialDimension, options);
      break;
      
    case 'diameter-dimension':
      drawDiameterDimension(ctx, dimension as DiameterDimension, options);
      break;
      
    default:
      console.warn(`Unsupported dimension type: ${dimension.type}`);
  }
  
  // Draw selection handles if selected
  if (isSelected) {
    drawSelectionHandles(ctx, dimension, zoom);
  }
}

// Draw a linear dimension
function drawLinearDimension(
  ctx: CanvasRenderingContext2D, 
  dimension: LinearDimension, 
  options: RenderOptions
) {
  const { zoom } = options;
  
  // Draw extension lines
  ctx.beginPath();
  ctx.moveTo(dimension.startPoint.x, dimension.startPoint.y);
  ctx.lineTo(dimension.startPoint.x, dimension.startPoint.y + dimension.offsetDistance);
  ctx.moveTo(dimension.endPoint.x, dimension.endPoint.y);
  ctx.lineTo(dimension.endPoint.x, dimension.endPoint.y + dimension.offsetDistance);
  ctx.stroke();
  
  // Draw dimension line
  ctx.beginPath();
  ctx.moveTo(dimension.startPoint.x, dimension.startPoint.y + dimension.offsetDistance);
  ctx.lineTo(dimension.endPoint.x, dimension.endPoint.y + dimension.offsetDistance);
  ctx.stroke();
  
  // Draw arrows
  const arrowSize = 3 / zoom;
  const angle = Math.atan2(0, dimension.endPoint.x - dimension.startPoint.x);
  
  // Start arrow
  ctx.beginPath();
  ctx.moveTo(dimension.startPoint.x, dimension.startPoint.y + dimension.offsetDistance);
  ctx.lineTo(
    dimension.startPoint.x + arrowSize * Math.cos(angle + Math.PI / 6),
    dimension.startPoint.y + dimension.offsetDistance + arrowSize * Math.sin(angle + Math.PI / 6)
  );
  ctx.lineTo(
    dimension.startPoint.x + arrowSize * Math.cos(angle - Math.PI / 6),
    dimension.startPoint.y + dimension.offsetDistance + arrowSize * Math.sin(angle - Math.PI / 6)
  );
  ctx.closePath();
  ctx.fillStyle = dimension.style.strokeColor;
  ctx.fill();
  
  // End arrow
  ctx.beginPath();
  ctx.moveTo(dimension.endPoint.x, dimension.endPoint.y + dimension.offsetDistance);
  ctx.lineTo(
    dimension.endPoint.x + arrowSize * Math.cos(angle + Math.PI - Math.PI / 6),
    dimension.endPoint.y + dimension.offsetDistance + arrowSize * Math.sin(angle + Math.PI - Math.PI / 6)
  );
  ctx.lineTo(
    dimension.endPoint.x + arrowSize * Math.cos(angle + Math.PI + Math.PI / 6),
    dimension.endPoint.y + dimension.offsetDistance + arrowSize * Math.sin(angle + Math.PI + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fillStyle = dimension.style.strokeColor;
  ctx.fill();
  
  // Draw text
  const textX = (dimension.startPoint.x + dimension.endPoint.x) / 2;
  const textY = dimension.startPoint.y + dimension.offsetDistance - 2 / zoom;
  
  ctx.font = `${(dimension.style.fontSize || 3.5) / zoom}px ${dimension.style.fontFamily || 'Arial'}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillStyle = dimension.style.strokeColor;
  ctx.fillText(dimension.text || '', textX, textY);
}

// Draw an angular dimension
function drawAngularDimension(
  ctx: CanvasRenderingContext2D, 
  dimension: AngularDimension, 
  options: RenderOptions
) {
  const { zoom } = options;
  
  // Calculate vectors from vertex to start and end points
  const v1x = dimension.startPoint.x - dimension.vertex.x;
  const v1y = dimension.startPoint.y - dimension.vertex.y;
  const v2x = dimension.endPoint.x - dimension.vertex.x;
  const v2y = dimension.endPoint.y - dimension.vertex.y;
  
  // Calculate angles
  const angle1 = Math.atan2(v1y, v1x);
  const angle2 = Math.atan2(v2y, v2x);
  
  // Calculate arc radius - use distance to first point or specified radius
  const radius = dimension.radius || Math.sqrt(v1x * v1x + v1y * v1y);
  
  // Draw extension lines
  ctx.beginPath();
  ctx.moveTo(dimension.vertex.x, dimension.vertex.y);
  ctx.lineTo(dimension.startPoint.x, dimension.startPoint.y);
  
  ctx.moveTo(dimension.vertex.x, dimension.vertex.y);
  ctx.lineTo(dimension.endPoint.x, dimension.endPoint.y);
  ctx.stroke();
  
  // Draw arc
  ctx.beginPath();
  ctx.arc(dimension.vertex.x, dimension.vertex.y, radius, angle1, angle2, false);
  ctx.stroke();
  
  // Draw arrows
  const arrowSize = 3 / zoom;
  
  // Start arrow
  const startArrowAngle = angle1 + Math.PI / 2;
  ctx.beginPath();
  ctx.moveTo(
    dimension.vertex.x + radius * Math.cos(angle1),
    dimension.vertex.y + radius * Math.sin(angle1)
  );
  ctx.lineTo(
    dimension.vertex.x + radius * Math.cos(angle1) + arrowSize * Math.cos(startArrowAngle + Math.PI / 6),
    dimension.vertex.y + radius * Math.sin(angle1) + arrowSize * Math.sin(startArrowAngle + Math.PI / 6)
  );
  ctx.lineTo(
    dimension.vertex.x + radius * Math.cos(angle1) + arrowSize * Math.cos(startArrowAngle - Math.PI / 6),
    dimension.vertex.y + radius * Math.sin(angle1) + arrowSize * Math.sin(startArrowAngle - Math.PI / 6)
  );
  ctx.closePath();
  ctx.fillStyle = dimension.style.strokeColor;
  ctx.fill();
  
  // End arrow
  const endArrowAngle = angle2 - Math.PI / 2;
  ctx.beginPath();
  ctx.moveTo(
    dimension.vertex.x + radius * Math.cos(angle2),
    dimension.vertex.y + radius * Math.sin(angle2)
  );
  ctx.lineTo(
    dimension.vertex.x + radius * Math.cos(angle2) + arrowSize * Math.cos(endArrowAngle + Math.PI / 6),
    dimension.vertex.y + radius * Math.sin(angle2) + arrowSize * Math.sin(endArrowAngle + Math.PI / 6)
  );
  ctx.lineTo(
    dimension.vertex.x + radius * Math.cos(angle2) + arrowSize * Math.cos(endArrowAngle - Math.PI / 6),
    dimension.vertex.y + radius * Math.sin(angle2) + arrowSize * Math.sin(endArrowAngle - Math.PI / 6)
  );
  ctx.closePath();
  ctx.fillStyle = dimension.style.strokeColor;
  ctx.fill();
  
  // Draw text
  const midAngle = (angle1 + angle2) / 2;
  const textRadius = radius * 1.1;
  const textX = dimension.vertex.x + textRadius * Math.cos(midAngle);
  const textY = dimension.vertex.y + textRadius * Math.sin(midAngle);
  
  ctx.font = `${(dimension.style.fontSize || 3.5) / zoom}px ${dimension.style.fontFamily || 'Arial'}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = dimension.style.strokeColor;
  ctx.fillText(dimension.text || '', textX, textY);
}

// Draw a radial dimension
function drawRadialDimension(
  ctx: CanvasRenderingContext2D, 
  dimension: RadialDimension, 
  options: RenderOptions
) {
  const { zoom } = options;
  
  // Calculate vector from center to point on circle
  const vx = dimension.pointOnCircle.x - dimension.center.x;
  const vy = dimension.pointOnCircle.y - dimension.center.y;
  
  // Calculate angle and distance
  const angle = Math.atan2(vy, vx);
  const distance = Math.sqrt(vx * vx + vy * vy);
  
  // Draw leader line
  ctx.beginPath();
  ctx.moveTo(dimension.center.x, dimension.center.y);
  ctx.lineTo(dimension.pointOnCircle.x, dimension.pointOnCircle.y);
  
  // If leader extends beyond circle
  if (dimension.leader) {
    const leaderLength = distance * 0.5; // Extend 50% beyond the circle
    const leaderEndX = dimension.center.x + (distance + leaderLength) * Math.cos(angle);
    const leaderEndY = dimension.center.y + (distance + leaderLength) * Math.sin(angle);
    
    ctx.lineTo(leaderEndX, leaderEndY);
  }
  
  ctx.stroke();
  
  // Draw text
  const textX = dimension.center.x + (distance * 1.2) * Math.cos(angle);
  const textY = dimension.center.y + (distance * 1.2) * Math.sin(angle);
  
  // Draw 'R' prefix
  ctx.font = `${(dimension.style.fontSize || 3.5) / zoom}px ${dimension.style.fontFamily || 'Arial'}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = dimension.style.strokeColor;
  ctx.fillText(`R${dimension.text || ''}`, textX, textY);
}

// Draw a diameter dimension
function drawDiameterDimension(
  ctx: CanvasRenderingContext2D, 
  dimension: DiameterDimension, 
  options: RenderOptions
) {
  const { zoom } = options;
  
  // Calculate vector from center to point on circle
  const vx = dimension.pointOnCircle.x - dimension.center.x;
  const vy = dimension.pointOnCircle.y - dimension.center.y;
  
  // Calculate angle and distance
  const angle = Math.atan2(vy, vx);
  const distance = Math.sqrt(vx * vx + vy * vy);
  
  // Calculate opposite point on the circle
  const oppositeX = dimension.center.x - distance * Math.cos(angle);
  const oppositeY = dimension.center.y - distance * Math.sin(angle);
  
  // Draw diameter line
  ctx.beginPath();
  
  if (dimension.leader) {
    // With leader extending outside
    const leaderLength = distance * 0.3; // Extend 30% beyond the circle
    const leaderEndX = dimension.center.x + (distance + leaderLength) * Math.cos(angle);
    const leaderEndY = dimension.center.y + (distance + leaderLength) * Math.sin(angle);
    
    ctx.moveTo(oppositeX, oppositeY);
    ctx.lineTo(dimension.pointOnCircle.x, dimension.pointOnCircle.y);
    ctx.lineTo(leaderEndX, leaderEndY);
  } else {
    // Simple diameter line
    ctx.moveTo(oppositeX, oppositeY);
    ctx.lineTo(dimension.pointOnCircle.x, dimension.pointOnCircle.y);
  }
  
  ctx.stroke();
  
  // Draw text
  const textX = dimension.leader 
    ? dimension.center.x + (distance * 1.2) * Math.cos(angle)
    : dimension.center.x;
  const textY = dimension.leader 
    ? dimension.center.y + (distance * 1.2) * Math.sin(angle)
    : dimension.center.y;
  
  // Draw 'Ø' prefix
  ctx.font = `${(dimension.style.fontSize || 3.5) / zoom}px ${dimension.style.fontFamily || 'Arial'}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = dimension.style.strokeColor;
  ctx.fillText(`Ø${dimension.text || ''}`, textX, textY);
}

// Function to draw any annotation
export function drawAnnotation(
  ctx: CanvasRenderingContext2D, 
  annotation: Annotation, 
  options: RenderOptions
) {
  const { isSelected = false, isHovered = false, zoom } = options;
  
  // Set styling based on selection state
  if (isSelected) {
    ctx.strokeStyle = '#1e88e5'; // Blue for selected
    ctx.fillStyle = '#1e88e5';
  } else if (isHovered) {
    ctx.strokeStyle = '#42a5f5'; // Light blue for hover
    ctx.fillStyle = '#42a5f5';
  } else {
    ctx.strokeStyle = annotation.style.strokeColor;
    ctx.fillStyle = annotation.style.strokeColor;
  }
  
  // Draw annotation based on type
  switch (annotation.type) {
    case 'text-annotation':
      drawTextAnnotation(ctx, annotation as TextAnnotation, options);
      break;
      
    case 'leader-annotation':
      drawLeaderAnnotation(ctx, annotation as LeaderAnnotation, options);
      break;
      
    default:
      console.warn(`Unsupported annotation type: ${annotation.type}`);
  }
  
  // Draw selection handles if selected
  if (isSelected) {
    drawSelectionHandles(ctx, annotation, zoom);
  }
}

// Draw a text annotation
function drawTextAnnotation(
  ctx: CanvasRenderingContext2D, 
  annotation: TextAnnotation, 
  options: RenderOptions
) {
  const { zoom } = options;
  
  // No stroke for text, just fill
  ctx.font = `${(annotation.style.fontWeight || 'normal')} ${(annotation.style.fontSize || 3.5) / zoom}px ${annotation.style.fontFamily || 'Arial'}`;
  ctx.textAlign = annotation.style.textAlign as CanvasTextAlign || 'left';
  ctx.textBaseline = 'top';
  
  if (annotation.rotation) {
    ctx.save();
    ctx.translate(annotation.position.x, annotation.position.y);
    ctx.rotate(annotation.rotation * Math.PI / 180);
    ctx.fillText(annotation.text, 0, 0);
    ctx.restore();
  } else {
    ctx.fillText(annotation.text, annotation.position.x, annotation.position.y);
  }
}

// Draw a leader annotation
function drawLeaderAnnotation(
  ctx: CanvasRenderingContext2D, 
  annotation: LeaderAnnotation, 
  options: RenderOptions
) {
  const { zoom } = options;
  
  // Draw leader line
  ctx.beginPath();
  ctx.moveTo(annotation.startPoint.x, annotation.startPoint.y);
  annotation.points.forEach(point => {
    ctx.lineTo(point.x, point.y);
  });
  ctx.stroke();
  
  // Draw text
  const textPosition = annotation.textPosition || annotation.points[annotation.points.length - 1];
  ctx.font = `${(annotation.style.fontSize || 3.5) / zoom}px ${annotation.style.fontFamily || 'Arial'}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillText(annotation.text, textPosition.x, textPosition.y);
}

// Draw temporary entity while drawing
export function drawTempEntity(
  ctx: CanvasRenderingContext2D, 
  tempEntity: any, 
  startPoint: Point | null,
  zoom: number
) {
  ctx.strokeStyle = '#1e88e5'; // Blue for temp entity
  ctx.lineWidth = 1.0 / zoom;
  ctx.setLineDash([5 / zoom, 5 / zoom]); // Dashed line for preview
  
  ctx.beginPath();
  
  switch (tempEntity.type) {
    case 'line':
      ctx.moveTo(tempEntity.startPoint.x, tempEntity.startPoint.y);
      ctx.lineTo(tempEntity.endPoint.x, tempEntity.endPoint.y);
      break;
      
    case 'circle':
      ctx.arc(tempEntity.center.x, tempEntity.center.y, tempEntity.radius, 0, Math.PI * 2);
      break;
      
    case 'rectangle':
      const x = tempEntity.width < 0 
        ? tempEntity.position.x + tempEntity.width 
        : tempEntity.position.x;
        
      const y = tempEntity.height < 0 
        ? tempEntity.position.y + tempEntity.height 
        : tempEntity.position.y;
        
      const width = Math.abs(tempEntity.width);
      const height = Math.abs(tempEntity.height);
      
      ctx.rect(x, y, width, height);
      break;
      
    case 'arc':
      if (tempEntity.radius > 0) {
        ctx.arc(
          tempEntity.center.x, 
          tempEntity.center.y, 
          tempEntity.radius, 
          tempEntity.startAngle, 
          tempEntity.endAngle || tempEntity.startAngle,
          false
        );
        
        // Draw radius lines for clarity
        ctx.moveTo(tempEntity.center.x, tempEntity.center.y);
        ctx.lineTo(
          tempEntity.center.x + tempEntity.radius * Math.cos(tempEntity.startAngle),
          tempEntity.center.y + tempEntity.radius * Math.sin(tempEntity.startAngle)
        );
        
        if (tempEntity.step === 1) {
          ctx.moveTo(tempEntity.center.x, tempEntity.center.y);
          ctx.lineTo(
            tempEntity.center.x + tempEntity.radius * Math.cos(tempEntity.endAngle),
            tempEntity.center.y + tempEntity.radius * Math.sin(tempEntity.endAngle)
          );
        }
      }
      break;
      
    case 'polyline':
      if (tempEntity.points.length > 0) {
        ctx.moveTo(tempEntity.points[0].x, tempEntity.points[0].y);
        
        // Draw all defined points
        for (let i = 1; i < tempEntity.points.length; i++) {
          ctx.lineTo(tempEntity.points[i].x, tempEntity.points[i].y);
        }
        
        // Draw line to current mouse position if available
        if (tempEntity.currentPoint) {
          ctx.lineTo(tempEntity.currentPoint.x, tempEntity.currentPoint.y);
        }
      }
      break;
      
    case 'linear-dimension':
      // Draw extension lines
      ctx.moveTo(tempEntity.startPoint.x, tempEntity.startPoint.y);
      ctx.lineTo(tempEntity.startPoint.x, tempEntity.startPoint.y + (tempEntity.offsetDistance || 10));
      ctx.moveTo(tempEntity.endPoint.x, tempEntity.endPoint.y);
      ctx.lineTo(tempEntity.endPoint.x, tempEntity.endPoint.y + (tempEntity.offsetDistance || 10));
      
      // Draw dimension line
      ctx.moveTo(tempEntity.startPoint.x, tempEntity.startPoint.y + (tempEntity.offsetDistance || 10));
      ctx.lineTo(tempEntity.endPoint.x, tempEntity.endPoint.y + (tempEntity.offsetDistance || 10));
      
      // If offset point is defined (in third step), show it
      if (tempEntity.offsetPoint) {
        ctx.moveTo(tempEntity.startPoint.x, tempEntity.offsetPoint.y);
        ctx.lineTo(tempEntity.endPoint.x, tempEntity.offsetPoint.y);
      }
      break;
      
    case 'leader-annotation':
      if (tempEntity.points.length > 0) {
        ctx.moveTo(tempEntity.startPoint.x, tempEntity.startPoint.y);
        
        // Draw all defined points
        for (let i = 0; i < tempEntity.points.length; i++) {
          ctx.lineTo(tempEntity.points[i].x, tempEntity.points[i].y);
        }
        
        // Draw line to current mouse position if available
        if (tempEntity.currentPoint) {
          ctx.lineTo(tempEntity.currentPoint.x, tempEntity.currentPoint.y);
        }
      }
      break;
  }
  
  ctx.stroke();
  ctx.setLineDash([]); // Reset dash pattern
}

// Draw selection handles for any entity
function drawSelectionHandles(
  ctx: CanvasRenderingContext2D, 
  entity: any, 
  zoom: number
) {
  const handleSize = 3 / zoom;
  ctx.fillStyle = '#1e88e5';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1 / zoom;
  
  // Draw handles based on entity type
  switch (entity.type) {
    case 'line':
      // Draw handles at endpoints
      drawSelectionHandle(ctx, entity.startPoint.x, entity.startPoint.y, handleSize);
      drawSelectionHandle(ctx, entity.endPoint.x, entity.endPoint.y, handleSize);
      break;
      
    case 'circle':
      // Draw center handle
      drawSelectionHandle(ctx, entity.center.x, entity.center.y, handleSize);
      
      // Draw quadrant handles
      drawSelectionHandle(ctx, entity.center.x + entity.radius, entity.center.y, handleSize);
      drawSelectionHandle(ctx, entity.center.x, entity.center.y + entity.radius, handleSize);
      drawSelectionHandle(ctx, entity.center.x - entity.radius, entity.center.y, handleSize);
      drawSelectionHandle(ctx, entity.center.x, entity.center.y - entity.radius, handleSize);
      break;
      
    case 'rectangle':
      // Draw corner handles
      drawSelectionHandle(ctx, entity.position.x, entity.position.y, handleSize);
      drawSelectionHandle(ctx, entity.position.x + entity.width, entity.position.y, handleSize);
      drawSelectionHandle(ctx, entity.position.x, entity.position.y + entity.height, handleSize);
      drawSelectionHandle(ctx, entity.position.x + entity.width, entity.position.y + entity.height, handleSize);
      
      // Draw midpoint handles
      drawSelectionHandle(ctx, entity.position.x + entity.width / 2, entity.position.y, handleSize);
      drawSelectionHandle(ctx, entity.position.x + entity.width, entity.position.y + entity.height / 2, handleSize);
      drawSelectionHandle(ctx, entity.position.x + entity.width / 2, entity.position.y + entity.height, handleSize);
      drawSelectionHandle(ctx, entity.position.x, entity.position.y + entity.height / 2, handleSize);
      break;
      
    case 'arc':
      // Draw center handle
      drawSelectionHandle(ctx, entity.center.x, entity.center.y, handleSize);
      
      // Draw endpoint handles
      const startX = entity.center.x + entity.radius * Math.cos(entity.startAngle);
      const startY = entity.center.y + entity.radius * Math.sin(entity.startAngle);
      const endX = entity.center.x + entity.radius * Math.cos(entity.endAngle);
      const endY = entity.center.y + entity.radius * Math.sin(entity.endAngle);
      
      drawSelectionHandle(ctx, startX, startY, handleSize);
      drawSelectionHandle(ctx, endX, endY, handleSize);
      break;
      
    case 'polyline':
      // Draw handles at each point
      entity.points.forEach((point: Point) => {
        drawSelectionHandle(ctx, point.x, point.y, handleSize);
      });
      break;
      
    case 'ellipse':
      // Draw center handle
      drawSelectionHandle(ctx, entity.center.x, entity.center.y, handleSize);
      
      // Draw axis endpoint handles
      const angleX = entity.rotation ? entity.rotation * Math.PI / 180 : 0;
      const angleY = angleX + Math.PI / 2;
      
      drawSelectionHandle(ctx, 
        entity.center.x + entity.radiusX * Math.cos(angleX), 
        entity.center.y + entity.radiusX * Math.sin(angleX), 
        handleSize
      );
      
      drawSelectionHandle(ctx, 
        entity.center.x - entity.radiusX * Math.cos(angleX), 
        entity.center.y - entity.radiusX * Math.sin(angleX), 
        handleSize
      );
      
      drawSelectionHandle(ctx, 
        entity.center.x + entity.radiusY * Math.cos(angleY), 
        entity.center.y + entity.radiusY * Math.sin(angleY), 
        handleSize
      );
      
      drawSelectionHandle(ctx, 
        entity.center.x - entity.radiusY * Math.cos(angleY), 
        entity.center.y - entity.radiusY * Math.sin(angleY), 
        handleSize
      );
      break;
      
    case 'text-annotation':
      // Draw position handle
      drawSelectionHandle(ctx, entity.position.x, entity.position.y, handleSize);
      break;
      
    case 'linear-dimension':
    case 'angular-dimension':
    case 'radial-dimension':
    case 'diameter-dimension':
      // Draw endpoint handles for the dimension
      if (entity.startPoint) {
        drawSelectionHandle(ctx, entity.startPoint.x, entity.startPoint.y, handleSize);
      }
      
      if (entity.endPoint) {
        drawSelectionHandle(ctx, entity.endPoint.x, entity.endPoint.y, handleSize);
      }
      
      if (entity.offsetPoint) {
        drawSelectionHandle(ctx, entity.offsetPoint.x, entity.offsetPoint.y, handleSize);
      }
      
      if (entity.textPosition) {
        drawSelectionHandle(ctx, entity.textPosition.x, entity.textPosition.y, handleSize);
      }
      break;
  }
}

// Draw a selection handle at the given point
function drawSelectionHandle(
  ctx: CanvasRenderingContext2D, 
  x: number, 
  y: number, 
  size: number
) {
  ctx.fillRect(x - size, y - size, size * 2, size * 2);
  ctx.strokeRect(x - size, y - size, size * 2, size * 2);
}