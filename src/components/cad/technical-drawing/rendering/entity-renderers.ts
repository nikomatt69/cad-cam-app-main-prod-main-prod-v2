import { DrawingEntity, Point, SplineEntity } from '../../../../types/TechnicalDrawingTypes';

/**
 * Main function to render any entity based on its type
 */
export function renderEntity(
  ctx: CanvasRenderingContext2D,
  entity: DrawingEntity,
  isSelected: boolean = false
): void {
  if (!entity.visible) return;
  
  // Configure common styles
  setupEntityStyle(ctx, entity, isSelected);
  
  // Render based on entity type
  switch (entity.type) {
    case 'line':
      renderLine(ctx, entity);
      break;
    case 'circle':
      renderCircle(ctx, entity);
      break;
    case 'arc':
      renderArc(ctx, entity);
      break;
    case 'ellipse':
      renderEllipse(ctx, entity);
      break;
    case 'rectangle':
      renderRectangle(ctx, entity);
      break;
    case 'polyline':
      renderPolyline(ctx, entity);
      break;
    case 'spline':
      renderSpline(ctx, entity);
      break;
    case 'text':
      renderText(ctx, entity);
      break;
    case 'dimension-linear':
      renderLinearDimension(ctx, entity);
      break;
    case 'dimension-angular':
      renderAngularDimension(ctx, entity);
      break;
    case 'dimension-radius':
      renderRadiusDimension(ctx, entity);
      break;
    case 'dimension-diameter':
      renderDiameterDimension(ctx, entity);
      break;
    case 'leader':
      renderLeader(ctx, entity);
      break;
    case 'centermark':
      renderCentermark(ctx, entity);
      break;
    case 'centerline':
      renderCenterline(ctx, entity);
      break;
    case 'hatch':
      renderHatch(ctx, entity);
      break;
    default:
      console.warn(`Unknown entity type: ${entity.type}`);
  }
  
  // Draw selection indicators if selected
  if (isSelected) {
    drawSelectionIndicators(ctx, entity);
  }
}

/**
 * Setup entity styling based on its properties
 */
function setupEntityStyle(
  ctx: CanvasRenderingContext2D,
  entity: DrawingEntity,
  isSelected: boolean
): void {
  // Apply entity style
  if (entity.style) {
    ctx.strokeStyle = entity.style.strokeColor || '#000000';
    ctx.lineWidth = entity.style.strokeWidth || 1;
    ctx.fillStyle = entity.style.fillColor || 'transparent';
    
    // Apply different line styles
    if (entity.style.strokeStyle === 'dashed') {
      ctx.setLineDash([5, 5]);
    } else if (entity.style.strokeStyle === 'dotted') {
      ctx.setLineDash([2, 2]);
    } else if (entity.style.strokeStyle === 'center') {
      ctx.setLineDash([10, 5, 2, 5]);
    } else {
      ctx.setLineDash([]);
    }
  } else {
    // Default styles
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.fillStyle = 'transparent';
    ctx.setLineDash([]);
  }
  
  // Override with selection style if selected
  if (isSelected) {
    // Save original stroke style for later use
    const originalStroke = ctx.strokeStyle;
    ctx.strokeStyle = '#0088FF';
    ctx.lineWidth = entity.style?.strokeWidth ? entity.style.strokeWidth + 0.5 : 1.5;
    
    // Restore the original stroke style after we're done with the selection styling
    setTimeout(() => {
      if (ctx) ctx.strokeStyle = originalStroke;
    }, 0);
  }
}

/**
 * Draw selection indicators for an entity
 */
function drawSelectionIndicators(
  ctx: CanvasRenderingContext2D,
  entity: DrawingEntity
): void {
  const handleSize = 4;
  ctx.fillStyle = '#0088FF';
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1;
  
  // Get handle points based on entity type
  const handlePoints = getEntityHandlePoints(entity);
  
  // Draw handles
  handlePoints.forEach(point => {
    ctx.beginPath();
    ctx.rect(point.x - handleSize / 2, point.y - handleSize / 2, handleSize, handleSize);
    ctx.fill();
    ctx.stroke();
  });
}

/**
 * Get handle points for an entity based on its type
 */
function getEntityHandlePoints(entity: DrawingEntity): Point[] {
  switch (entity.type) {
    case 'line':
      return [entity.startPoint, entity.endPoint];
    
    case 'circle':
      return [
        entity.center,
        { x: entity.center.x + entity.radius, y: entity.center.y },
        { x: entity.center.x, y: entity.center.y + entity.radius },
        { x: entity.center.x - entity.radius, y: entity.center.y },
        { x: entity.center.x, y: entity.center.y - entity.radius }
      ];
    
    case 'arc':
      // Start, end and center points for an arc
      return [
        entity.center,
        entity.startPoint,
        entity.endPoint
      ];
    
    case 'ellipse':
      return [
        entity.center,
        { x: entity.center.x + entity.radiusX, y: entity.center.y },
        { x: entity.center.x, y: entity.center.y + entity.radiusY },
        { x: entity.center.x - entity.radiusX, y: entity.center.y },
        { x: entity.center.x, y: entity.center.y - entity.radiusY }
      ];
    
    case 'rectangle':
      const { x, y, width, height } = entity;
      return [
        { x, y },
        { x: x + width, y },
        { x: x + width, y: y + height },
        { x, y: y + height },
        { x: x + width / 2, y },
        { x: x + width, y: y + height / 2 },
        { x: x + width / 2, y: y + height },
        { x, y: y + height / 2 }
      ];
    
    case 'polyline':
      return entity.points || [];
    
    case 'spline':
      // Return all control points and main points as handles
      const splineEntity = entity as SplineEntity;
      return [
        ...(splineEntity.points || []),
        ...(splineEntity.controlPoints || [])
      ];
    
    case 'text':
      return [
        entity.position,
        { x: entity.position.x + (entity.width || 50), y: entity.position.y },
        { x: entity.position.x + (entity.width || 50), y: entity.position.y + (entity.height || 20) },
        { x: entity.position.x, y: entity.position.y + (entity.height || 20) }
      ];
    
    default:
      return [];
  }
}

/**
 * Render a line entity
 */
function renderLine(ctx: CanvasRenderingContext2D, entity: DrawingEntity): void {
  if (entity.type !== 'line') return;
  
  ctx.beginPath();
  ctx.moveTo(entity.startPoint.x, entity.startPoint.y);
  ctx.lineTo(entity.endPoint.x, entity.endPoint.y);
  ctx.stroke();
}

/**
 * Render a circle entity
 */
function renderCircle(ctx: CanvasRenderingContext2D, entity: DrawingEntity): void {
  if (entity.type !== 'circle') return;
  
  ctx.beginPath();
  ctx.arc(entity.center.x, entity.center.y, entity.radius, 0, Math.PI * 2);
  ctx.stroke();
  
  if (entity.style?.fillColor && entity.style?.fillColor !== 'transparent') {
    ctx.fill();
  }
}

/**
 * Render an arc entity
 */
function renderArc(ctx: CanvasRenderingContext2D, entity: DrawingEntity): void {
  if (entity.type !== 'arc') return;
  
  const startAngle = entity.startAngle || 0;
  const endAngle = entity.endAngle || Math.PI;
  
  ctx.beginPath();
  ctx.arc(entity.center.x, entity.center.y, entity.radius, startAngle, endAngle);
  ctx.stroke();
}

/**
 * Render an ellipse entity
 */
function renderEllipse(ctx: CanvasRenderingContext2D, entity: DrawingEntity): void {
  if (entity.type !== 'ellipse') return;
  
  ctx.beginPath();
  
  // Save context to restore after rotation
  ctx.save();
  
  // Translate to the center of the ellipse
  ctx.translate(entity.center.x, entity.center.y);
  
  // Rotate if needed
  if (entity.rotation) {
    ctx.rotate(entity.rotation);
  }
  
  // Draw the ellipse
  ctx.ellipse(0, 0, entity.radiusX, entity.radiusY, 0, 0, Math.PI * 2);
  
  // Restore context
  ctx.restore();
  
  ctx.stroke();
  
  if (entity.style?.fillColor && entity.style?.fillColor !== 'transparent') {
    ctx.fill();
  }
}

/**
 * Render a rectangle entity
 */
function renderRectangle(ctx: CanvasRenderingContext2D, entity: DrawingEntity): void {
  if (entity.type !== 'rectangle') return;
  
  ctx.beginPath();
  
  if (entity.rotation) {
    // For rotated rectangles
    const { x, y, width, height, rotation } = entity;
    
    ctx.save();
    ctx.translate(x + width / 2, y + height / 2);
    ctx.rotate(rotation);
    ctx.rect(-width / 2, -height / 2, width, height);
    ctx.restore();
  } else {
    // For standard rectangles
    ctx.rect(entity.x, entity.y, entity.width, entity.height);
  }
  
  ctx.stroke();
  
  if (entity.style?.fillColor && entity.style?.fillColor !== 'transparent') {
    ctx.fill();
  }
}

/**
 * Render a polyline entity
 */
function renderPolyline(ctx: CanvasRenderingContext2D, entity: DrawingEntity): void {
  if (entity.type !== 'polyline' || !entity.points || entity.points.length < 2) return;
  
  ctx.beginPath();
  ctx.moveTo(entity.points[0].x, entity.points[0].y);
  
  for (let i = 1; i < entity.points.length; i++) {
    ctx.lineTo(entity.points[i].x, entity.points[i].y);
  }
  
  // Close the path if it's a closed polyline
  if (entity.closed) {
    ctx.closePath();
  }
  
  ctx.stroke();
  
  if (entity.style?.fillColor && entity.style?.fillColor !== 'transparent' && entity.closed) {
    ctx.fill();
  }
}

/**
 * Render a spline curve
 */
function renderSpline(ctx: CanvasRenderingContext2D, entity: DrawingEntity): void {
  const splineEntity = entity as SplineEntity;
  const { points, controlPoints, closed } = splineEntity;
  
  if (!points || points.length < 2) return;
  
  // Approximate the spline with a series of Bezier curves
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  
  if (controlPoints && controlPoints.length >= 2) {
    // We have explicit control points, use them for cubic Bezier curves
    let controlPointIndex = 0;
    
    for (let i = 0; i < (closed ? points.length : points.length - 1); i++) {
      const startPoint = points[i];
      const endPoint = points[(i + 1) % points.length];
      
      // Get control points for this segment
      const cp1 = controlPoints[controlPointIndex % controlPoints.length];
      controlPointIndex++;
      const cp2 = controlPoints[controlPointIndex % controlPoints.length];
      controlPointIndex++;
      
      // Draw cubic bezier curve
      ctx.bezierCurveTo(
        cp1.x, cp1.y,
        cp2.x, cp2.y,
        endPoint.x, endPoint.y
      );
    }
  } else {
    // No control points, use cardinal spline approximation
    // (this is a simpler approximation that doesn't require control points)
    const tension = 0.5; // Controls "tightness" of the curve
    
    for (let i = 0; i < (closed ? points.length : points.length - 1); i++) {
      const p0 = points[(i - 1 + points.length) % points.length];
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];
      const p3 = points[(i + 2) % points.length];
      
      // Calculate cardinal spline control points
      const cp1x = p1.x + (p2.x - p0.x) * tension / 3;
      const cp1y = p1.y + (p2.y - p0.y) * tension / 3;
      const cp2x = p2.x - (p3.x - p1.x) * tension / 3;
      const cp2y = p2.y - (p3.y - p1.y) * tension / 3;
      
      // Draw cubic bezier curve
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
    }
  }
  
  if (closed) {
    ctx.closePath();
  }
  
  ctx.stroke();
  
  // Draw the points for editing if selected
  if (entity.style?.showPoints) {
    const pointSize = 3;
    ctx.fillStyle = entity.style.strokeColor || '#000000';
    
    // Draw main points
    points.forEach(point => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, pointSize, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // Draw control points with different style
    if (controlPoints && controlPoints.length > 0) {
      ctx.fillStyle = '#FF4400';
      ctx.setLineDash([2, 2]);
      
      controlPoints.forEach((cp, i) => {
        // Draw control point
        ctx.beginPath();
        ctx.arc(cp.x, cp.y, pointSize - 1, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw line from control point to corresponding main point
        if (i % 2 === 0 && i / 2 < points.length) {
          const pointIndex = Math.floor(i / 2);
          ctx.beginPath();
          ctx.moveTo(points[pointIndex].x, points[pointIndex].y);
          ctx.lineTo(cp.x, cp.y);
          ctx.stroke();
        } else if (i % 2 === 1 && (i - 1) / 2 < points.length) {
          const pointIndex = Math.floor((i + 1) / 2) % points.length;
          ctx.beginPath();
          ctx.moveTo(cp.x, cp.y);
          ctx.lineTo(points[pointIndex].x, points[pointIndex].y);
          ctx.stroke();
        }
      });
      
      // Reset line dash
      ctx.setLineDash([]);
    }
  }
}

/**
 * Render a text entity
 */
function renderText(ctx: CanvasRenderingContext2D, entity: DrawingEntity): void {
  if (entity.type !== 'text') return;
  
  // Set text styles
  const fontSize = entity.fontSize || 12;
  const fontFamily = entity.fontFamily || 'Arial';
  const fontWeight = entity.fontWeight || 'normal';
  const fontStyle = entity.fontStyle || 'normal';
  
  ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = entity.style?.textColor || entity.style?.strokeColor || '#000000';
  ctx.textAlign = entity.textAlign || 'left';
  ctx.textBaseline = entity.textBaseline || 'top';
  
  // Handle rotation
  if (entity.rotation) {
    ctx.save();
    ctx.translate(entity.position.x, entity.position.y);
    ctx.rotate(entity.rotation);
    ctx.fillText(entity.content || '', 0, 0);
    ctx.restore();
  } else {
    ctx.fillText(entity.content || '', entity.position.x, entity.position.y);
  }
}

/**
 * Render a linear dimension entity
 */
function renderLinearDimension(ctx: CanvasRenderingContext2D, entity: DrawingEntity): void {
  if (entity.type !== 'dimension-linear') return;
  
  const { startPoint, endPoint, offset, text } = entity;
  
  // Calculate dimension line points
  const angle = Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x);
  const perpAngle = angle + Math.PI / 2;
  
  const startDimX = startPoint.x + Math.cos(perpAngle) * offset;
  const startDimY = startPoint.y + Math.sin(perpAngle) * offset;
  
  const endDimX = endPoint.x + Math.cos(perpAngle) * offset;
  const endDimY = endPoint.y + Math.sin(perpAngle) * offset;
  
  // Draw extension lines
  ctx.beginPath();
  ctx.moveTo(startPoint.x, startPoint.y);
  ctx.lineTo(startDimX, startDimY);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(endPoint.x, endPoint.y);
  ctx.lineTo(endDimX, endDimY);
  ctx.stroke();
  
  // Draw dimension line
  ctx.beginPath();
  ctx.moveTo(startDimX, startDimY);
  ctx.lineTo(endDimX, endDimY);
  ctx.stroke();
  
  // Draw arrowheads
  drawArrowhead(ctx, { x: startDimX, y: startDimY }, { x: endDimX, y: endDimY });
  drawArrowhead(ctx, { x: endDimX, y: endDimY }, { x: startDimX, y: startDimY });
  
  // Draw dimension text
  const midX = (startDimX + endDimX) / 2;
  const midY = (startDimY + endDimY) / 2;
  
  // Set text styles
  const fontSize = entity.fontSize || 10;
  ctx.font = `${fontSize}px Arial`;
  ctx.fillStyle = entity.style?.textColor || entity.style?.strokeColor || '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Rotate text to match dimension line
  ctx.save();
  ctx.translate(midX, midY);
  
  // Keep text upright
  if (angle > Math.PI / 2 || angle < -Math.PI / 2) {
    ctx.rotate(angle + Math.PI);
  } else {
    ctx.rotate(angle);
  }
  
  // Draw text with background
  const padding = 2;
  const textWidth = ctx.measureText(text || '').width;
  
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(-textWidth / 2 - padding, -fontSize / 2 - padding, textWidth + padding * 2, fontSize + padding * 2);
  
  ctx.fillStyle = entity.style?.textColor || entity.style?.strokeColor || '#000000';
  ctx.fillText(text || '', 0, 0);
  
  ctx.restore();
}

/**
 * Render an angular dimension entity
 */
function renderAngularDimension(ctx: CanvasRenderingContext2D, entity: DrawingEntity): void {
  if (entity.type !== 'dimension-angular') return;
  
  const { center, startPoint, endPoint, text } = entity;
  
  // Calculate angles
  const startAngle = Math.atan2(startPoint.y - center.y, startPoint.x - center.x);
  const endAngle = Math.atan2(endPoint.y - center.y, endPoint.x - center.x);
  
  // Calculate radius
  const radius = Math.hypot(startPoint.x - center.x, startPoint.y - center.y);
  
  // Draw angle arc
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, startAngle, endAngle);
  ctx.stroke();
  
  // Draw extension lines
  ctx.beginPath();
  ctx.moveTo(center.x, center.y);
  ctx.lineTo(startPoint.x, startPoint.y);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(center.x, center.y);
  ctx.lineTo(endPoint.x, endPoint.y);
  ctx.stroke();
  
  // Draw text
  const midAngle = (startAngle + endAngle) / 2;
  const textRadius = radius * 0.8;
  const textX = center.x + Math.cos(midAngle) * textRadius;
  const textY = center.y + Math.sin(midAngle) * textRadius;
  
  // Set text styles
  const fontSize = entity.fontSize || 10;
  ctx.font = `${fontSize}px Arial`;
  ctx.fillStyle = entity.style?.textColor || entity.style?.strokeColor || '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Draw text with background
  const padding = 2;
  const textWidth = ctx.measureText(text || '').width;
  
  ctx.save();
  ctx.translate(textX, textY);
  ctx.rotate(midAngle + Math.PI / 2);
  
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(-textWidth / 2 - padding, -fontSize / 2 - padding, textWidth + padding * 2, fontSize + padding * 2);
  
  ctx.fillStyle = entity.style?.textColor || entity.style?.strokeColor || '#000000';
  ctx.fillText(text || '', 0, 0);
  
  ctx.restore();
}

/**
 * Render a radius dimension entity
 */
function renderRadiusDimension(ctx: CanvasRenderingContext2D, entity: DrawingEntity): void {
  if (entity.type !== 'dimension-radius') return;
  
  const { center, pointOnCircle, text } = entity;
  
  // Draw leader line from center to point on circle
  ctx.beginPath();
  ctx.moveTo(center.x, center.y);
  ctx.lineTo(pointOnCircle.x, pointOnCircle.y);
  ctx.stroke();
  
  // Calculate text position
  const angle = Math.atan2(pointOnCircle.y - center.y, pointOnCircle.x - center.x);
  const textDistance = Math.hypot(pointOnCircle.x - center.x, pointOnCircle.y - center.y) * 1.2;
  const textX = center.x + Math.cos(angle) * textDistance;
  const textY = center.y + Math.sin(angle) * textDistance;
  
  // Draw arrowhead
  drawArrowhead(ctx, { x: pointOnCircle.x, y: pointOnCircle.y }, { x: center.x, y: center.y });
  
  // Extend leader line to text
  ctx.beginPath();
  ctx.moveTo(pointOnCircle.x, pointOnCircle.y);
  ctx.lineTo(textX, textY);
  ctx.stroke();
  
  // Set text styles
  const fontSize = entity.fontSize || 10;
  ctx.font = `${fontSize}px Arial`;
  ctx.fillStyle = entity.style?.textColor || entity.style?.strokeColor || '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Prepare text
  const displayText = `R${text || ''}`;
  
  // Draw text with background
  const padding = 2;
  const textWidth = ctx.measureText(displayText).width;
  
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(textX - textWidth / 2 - padding, textY - fontSize / 2 - padding, textWidth + padding * 2, fontSize + padding * 2);
  
  ctx.fillStyle = entity.style?.textColor || entity.style?.strokeColor || '#000000';
  ctx.fillText(displayText, textX, textY);
}

/**
 * Render a diameter dimension entity
 */
function renderDiameterDimension(ctx: CanvasRenderingContext2D, entity: DrawingEntity): void {
  if (entity.type !== 'dimension-diameter') return;
  
  const { center, pointOnCircle, text } = entity;
  
  // Calculate opposite point
  const dx = pointOnCircle.x - center.x;
  const dy = pointOnCircle.y - center.y;
  const oppositeX = center.x - dx;
  const oppositeY = center.y - dy;
  
  // Draw leader line through circle
  ctx.beginPath();
  ctx.moveTo(oppositeX, oppositeY);
  ctx.lineTo(pointOnCircle.x, pointOnCircle.y);
  ctx.stroke();
  
  // Calculate text position - offset from circle edge
  const angle = Math.atan2(dy, dx);
  const radius = Math.hypot(dx, dy);
  const textDistance = radius * 1.2;
  const textX = center.x + Math.cos(angle) * textDistance;
  const textY = center.y + Math.sin(angle) * textDistance;
  
  // Extend leader line to text
  ctx.beginPath();
  ctx.moveTo(pointOnCircle.x, pointOnCircle.y);
  ctx.lineTo(textX, textY);
  ctx.stroke();
  
  // Set text styles
  const fontSize = entity.fontSize || 10;
  ctx.font = `${fontSize}px Arial`;
  ctx.fillStyle = entity.style?.textColor || entity.style?.strokeColor || '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Prepare text with diameter symbol
  const displayText = `Ø${text || ''}`;
  
  // Draw text with background
  const padding = 2;
  const textWidth = ctx.measureText(displayText).width;
  
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(textX - textWidth / 2 - padding, textY - fontSize / 2 - padding, textWidth + padding * 2, fontSize + padding * 2);
  
  ctx.fillStyle = entity.style?.textColor || entity.style?.strokeColor || '#000000';
  ctx.fillText(displayText, textX, textY);
}

/**
 * Render a leader entity
 */
function renderLeader(ctx: CanvasRenderingContext2D, entity: DrawingEntity): void {
  if (entity.type !== 'leader') return;
  
  const { points, text } = entity;
  
  if (!points || points.length < 2) return;
  
  // Draw leader line
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  
  ctx.stroke();
  
  // Draw arrowhead at the first point
  drawArrowhead(ctx, points[0], points[1]);
  
  // Draw text at the last point
  if (text) {
    const lastPoint = points[points.length - 1];
    
    // Set text styles
    const fontSize = entity.fontSize || 10;
    ctx.font = `${fontSize}px Arial`;
    ctx.fillStyle = entity.style?.textColor || entity.style?.strokeColor || '#000000';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    
    // Draw text
    ctx.fillText(text, lastPoint.x + 5, lastPoint.y);
  }
}

/**
 * Render a centermark entity
 */
function renderCentermark(ctx: CanvasRenderingContext2D, entity: DrawingEntity): void {
  if (entity.type !== 'centermark') return;
  
  const { center, size } = entity;
  const markSize = size || 10;
  
  // Draw center cross
  ctx.beginPath();
  ctx.moveTo(center.x - markSize, center.y);
  ctx.lineTo(center.x + markSize, center.y);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(center.x, center.y - markSize);
  ctx.lineTo(center.x, center.y + markSize);
  ctx.stroke();
}

/**
 * Render a centerline entity
 */
function renderCenterline(ctx: CanvasRenderingContext2D, entity: DrawingEntity): void {
  if (entity.type !== 'centerline') return;
  
  const { startPoint, endPoint } = entity;
  
  // Save current line dash
  const originalDash = ctx.getLineDash();
  
  // Set centerline dash pattern
  ctx.setLineDash([10, 5, 2, 5]);
  
  // Draw centerline
  ctx.beginPath();
  ctx.moveTo(startPoint.x, startPoint.y);
  ctx.lineTo(endPoint.x, endPoint.y);
  ctx.stroke();
  
  // Restore original dash pattern
  ctx.setLineDash(originalDash);
}

/**
 * Render a hatch entity
 */
function renderHatch(ctx: CanvasRenderingContext2D, entity: DrawingEntity): void {
  if (entity.type !== 'hatch') return;
  
  const { boundary, pattern, angle, spacing } = entity;
  
  // Draw boundary
  if (boundary && boundary.length > 2) {
    ctx.beginPath();
    ctx.moveTo(boundary[0].x, boundary[0].y);
    
    for (let i = 1; i < boundary.length; i++) {
      ctx.lineTo(boundary[i].x, boundary[i].y);
    }
    
    ctx.closePath();
    ctx.stroke();
    
    // Fill with pattern if specified
    if (pattern === 'solid') {
      ctx.fill();
    } else {
      // Draw hatch lines
      fillWithHatchPattern(ctx, boundary, pattern || 'lines', angle || 45, spacing || 5);
    }
  }
}

/**
 * Fill an area with a hatch pattern
 */
function fillWithHatchPattern(
  ctx: CanvasRenderingContext2D,
  boundary: Point[],
  pattern: string,
  angle: number,
  spacing: number
): void {
  // Find bounding box of the boundary
  let minX = boundary[0].x;
  let minY = boundary[0].y;
  let maxX = boundary[0].x;
  let maxY = boundary[0].y;
  
  for (const point of boundary) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }
  
  // Add margin to ensure lines cover the entire shape
  const margin = Math.max(maxX - minX, maxY - minY);
  minX -= margin;
  minY -= margin;
  maxX += margin;
  maxY += margin;
  
  // Convert angle to radians
  const rad = (angle * Math.PI) / 180;
  
  // Calculate perpendicular direction for lines
  const dirX = Math.cos(rad);
  const dirY = Math.sin(rad);
  
  // Save context
  ctx.save();
  
  // Clip to boundary
  ctx.beginPath();
  ctx.moveTo(boundary[0].x, boundary[0].y);
  
  for (let i = 1; i < boundary.length; i++) {
    ctx.lineTo(boundary[i].x, boundary[i].y);
  }
  
  ctx.closePath();
  ctx.clip();
  
  // Draw the pattern
  ctx.beginPath();
  
  // Calculate start and end points based on pattern
  if (pattern === 'lines' || pattern === 'crosshatch') {
    // Calculate the number of lines needed
    const distance = (maxX - minX) * Math.abs(dirY) + (maxY - minY) * Math.abs(dirX);
    const numLines = Math.ceil(distance / spacing);
    
    // Draw lines
    for (let i = 0; i <= numLines; i++) {
      const offset = i * spacing;
      const startX = minX + offset * dirY;
      const startY = minY - offset * dirX;
      
      let lineStartX, lineStartY, lineEndX, lineEndY;
      
      if (dirX >= 0 && dirY >= 0) {
        // Line going bottom-left to top-right
        lineStartX = startX < minX ? minX : startX > maxX ? maxX : startX;
        lineStartY = startX < minX ? minY + (minX - startX) / dirY * dirX : 
                    startX > maxX ? minY + (maxX - startX) / dirY * dirX : minY;
        
        lineEndX = startY < minY ? minX + (minY - startY) / dirX * dirY : 
                  startY > maxY ? minX + (maxY - startY) / dirX * dirY : minX;
        lineEndY = startY < minY ? minY : startY > maxY ? maxY : startY;
      } else {
        // Other directions - simplified approach
        if (Math.abs(dirX) > Math.abs(dirY)) {
          // More horizontal
          lineStartX = minX;
          lineStartY = startY + (minX - startX) * dirY / dirX;
          lineEndX = maxX;
          lineEndY = startY + (maxX - startX) * dirY / dirX;
        } else {
          // More vertical
          lineStartX = startX + (minY - startY) * dirX / dirY;
          lineStartY = minY;
          lineEndX = startX + (maxY - startY) * dirX / dirY;
          lineEndY = maxY;
        }
      }
      
      ctx.moveTo(lineStartX, lineStartY);
      ctx.lineTo(lineEndX, lineEndY);
    }
  }
  
  // Draw crosshatch if needed
  if (pattern === 'crosshatch') {
    // Save current line data
    const pathData = ctx.getLineDash();
    
    // Rotate 90 degrees and draw again
    ctx.rotate(Math.PI / 2);
    
    // Recalculate bounds after rotation
    const rotMinX = -maxY;
    const rotMinY = minX;
    const rotMaxX = -minY;
    const rotMaxY = maxX;
    
    // Calculate the number of lines needed
    const distance = (rotMaxX - rotMinX) * Math.abs(dirY) + (rotMaxY - rotMinY) * Math.abs(dirX);
    const numLines = Math.ceil(distance / spacing);
    
    // Draw perpendicular lines
    for (let i = 0; i <= numLines; i++) {
      const offset = i * spacing;
      const startX = rotMinX + offset * dirY;
      const startY = rotMinY - offset * dirX;
      
      // Similar calculations as above, but with rotated bounds
      let lineStartX, lineStartY, lineEndX, lineEndY;
      
      if (Math.abs(dirX) > Math.abs(dirY)) {
        // More horizontal
        lineStartX = rotMinX;
        lineStartY = startY + (rotMinX - startX) * dirY / dirX;
        lineEndX = rotMaxX;
        lineEndY = startY + (rotMaxX - startX) * dirY / dirX;
      } else {
        // More vertical
        lineStartX = startX + (rotMinY - startY) * dirX / dirY;
        lineStartY = rotMinY;
        lineEndX = startX + (rotMaxY - startY) * dirX / dirY;
        lineEndY = rotMaxY;
      }
      
      ctx.moveTo(lineStartX, lineStartY);
      ctx.lineTo(lineEndX, lineEndY);
    }
  }
  
  ctx.stroke();
  
  // Restore context
  ctx.restore();
}

/**
 * Draw an arrowhead at the end of a line
 */
function drawArrowhead(
  ctx: CanvasRenderingContext2D,
  from: Point,
  to: Point,
  size: number = 10
): void {
  // Calculate angle of the line
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  
  // Calculate arrowhead points
  const arrowX1 = from.x - size * Math.cos(angle - Math.PI / 6);
  const arrowY1 = from.y - size * Math.sin(angle - Math.PI / 6);
  
  const arrowX2 = from.x - size * Math.cos(angle + Math.PI / 6);
  const arrowY2 = from.y - size * Math.sin(angle + Math.PI / 6);
  
  // Draw arrowhead
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(arrowX1, arrowY1);
  ctx.lineTo(arrowX2, arrowY2);
  ctx.closePath();
  ctx.fill();
} 