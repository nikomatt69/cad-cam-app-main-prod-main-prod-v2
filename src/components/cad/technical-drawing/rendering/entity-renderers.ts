// src/components/cad/technical-drawing/rendering/entity-renderers.ts
// Stub per entity-renderers

import { AnyEntity } from '../TechnicalDrawingTypes';

export const renderEntity = (ctx: CanvasRenderingContext2D, entity: AnyEntity, isSelected: boolean): void => {
  // Set common styles
  ctx.save();
  
  if (isSelected) {
    ctx.shadowColor = '#007AFF';
    ctx.shadowBlur = 4;
  }
  
  // Basic rendering based on entity type
  switch (entity.type) {
    case 'line':
      renderLine(ctx, entity as any);
      break;
    case 'circle':
      renderCircle(ctx, entity as any);
      break;
    case 'rectangle':
      renderRectangle(ctx, entity as any);
      break;
    case 'text':
      renderText(ctx, entity as any);
      break;
    default:
      // Fallback rendering
      renderGeneric(ctx, entity);
      break;
  }
  
  ctx.restore();
};

const renderLine = (ctx: CanvasRenderingContext2D, line: any): void => {
  if (!line.startPoint || !line.endPoint) return;
  
  ctx.strokeStyle = line.style?.strokeColor || '#000000';
  ctx.lineWidth = line.style?.strokeWidth || 1;
  
  ctx.beginPath();
  ctx.moveTo(line.startPoint.x, line.startPoint.y);
  ctx.lineTo(line.endPoint.x, line.endPoint.y);
  ctx.stroke();
};

const renderCircle = (ctx: CanvasRenderingContext2D, circle: any): void => {
  if (!circle.center || !circle.radius) return;
  
  ctx.strokeStyle = circle.style?.strokeColor || '#000000';
  ctx.lineWidth = circle.style?.strokeWidth || 1;
  
  ctx.beginPath();
  ctx.arc(circle.center.x, circle.center.y, circle.radius, 0, 2 * Math.PI);
  ctx.stroke();
  
  if (circle.style?.fillColor && circle.style.fillColor !== 'none') {
    ctx.fillStyle = circle.style.fillColor;
    ctx.fill();
  }
};

const renderRectangle = (ctx: CanvasRenderingContext2D, rect: any): void => {
  if (!rect.position || !rect.width || !rect.height) return;
  
  ctx.strokeStyle = rect.style?.strokeColor || '#000000';
  ctx.lineWidth = rect.style?.strokeWidth || 1;
  
  ctx.beginPath();
  ctx.rect(rect.position.x, rect.position.y, rect.width, rect.height);
  ctx.stroke();
  
  if (rect.style?.fillColor && rect.style.fillColor !== 'none') {
    ctx.fillStyle = rect.style.fillColor;
    ctx.fill();
  }
};

const renderText = (ctx: CanvasRenderingContext2D, text: any): void => {
  if (!text.position || !text.text) return;
  
  ctx.fillStyle = text.style?.strokeColor || '#000000';
  ctx.font = `${text.style?.fontSize || 12}px ${text.style?.fontFamily || 'Arial'}`;
  
  ctx.fillText(text.text, text.position.x, text.position.y);
};

const renderGeneric = (ctx: CanvasRenderingContext2D, entity: AnyEntity): void => {
  // Generic fallback rendering - just draw a small indicator
  ctx.fillStyle = '#ff0000';
  ctx.fillRect(-2, -2, 4, 4);
  
  console.warn(`No specific renderer for entity type: ${entity.type}`);
};
