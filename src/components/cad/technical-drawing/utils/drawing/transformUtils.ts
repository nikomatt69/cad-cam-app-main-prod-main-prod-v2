import { Point, DrawingEntity, Dimension, Annotation } from 'src/types/TechnicalDrawingTypes';

export function rotateEntity(entity: DrawingEntity | Dimension | Annotation, center: Point, angle: number): Omit<DrawingEntity | Dimension | Annotation, 'id'> {
  const radians = (angle * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  // Helper function to rotate a point around a center
  const rotatePoint = (point: Point): Point => {
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    return {
      x: center.x + dx * cos - dy * sin,
      y: center.y + dx * sin + dy * cos
    };
  };

  const rotatedEntity = { ...entity };

  switch (entity.type) {
    case 'line':
      rotatedEntity.startPoint = rotatePoint(entity.startPoint);
      rotatedEntity.endPoint = rotatePoint(entity.endPoint);
      break;

    case 'circle':
      rotatedEntity.center = rotatePoint(entity.center);
      break;

    case 'arc':
      rotatedEntity.center = rotatePoint(entity.center);
      rotatedEntity.startAngle = entity.startAngle + radians;
      rotatedEntity.endAngle = entity.endAngle + radians;
      break;

    case 'rectangle':
      rotatedEntity.position = rotatePoint(entity.position);
      rotatedEntity.rotation = (entity.rotation || 0) + angle;
      break;

    case 'polyline':
      rotatedEntity.points = entity.points.map(rotatePoint);
      break;

    case 'ellipse':
      rotatedEntity.center = rotatePoint(entity.center);
      rotatedEntity.rotation = (entity.rotation || 0) + angle;
      break;

    case 'text-annotation':
      rotatedEntity.position = rotatePoint(entity.position);
      rotatedEntity.rotation = (entity.rotation || 0) + angle;
      break;

    case 'linear-dimension':
      rotatedEntity.startPoint = rotatePoint(entity.startPoint);
      rotatedEntity.endPoint = rotatePoint(entity.endPoint);
      break;
  }

  return rotatedEntity;
}

export function mirrorEntity(entity: DrawingEntity | Dimension | Annotation, lineStart: Point, lineEnd: Point): Omit<DrawingEntity | Dimension | Annotation, 'id'> {
  // Calculate vector of the mirror line
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const len = Math.sqrt(dx * dx + dy * dy);

  if (len === 0) return entity;

  // Normalize the vector
  const nx = dx / len;
  const ny = dy / len;

  // Helper function to mirror a point
  const mirrorPoint = (point: Point): Point => {
    // Calculate vector from line start to point
    const vx = point.x - lineStart.x;
    const vy = point.y - lineStart.y;

    // Calculate projection onto mirror line
    const projection = vx * nx + vy * ny;

    // Calculate closest point on line
    const closestX = lineStart.x + projection * nx;
    const closestY = lineStart.y + projection * ny;

    // Mirror point (twice the distance in opposite direction)
    return {
      x: 2 * closestX - point.x,
      y: 2 * closestY - point.y
    };
  };

  const mirroredEntity = { ...entity };

  switch (entity.type) {
    case 'line':
      mirroredEntity.startPoint = mirrorPoint(entity.startPoint);
      mirroredEntity.endPoint = mirrorPoint(entity.endPoint);
      break;

    case 'circle':
      mirroredEntity.center = mirrorPoint(entity.center);
      break;

    case 'arc':
      mirroredEntity.center = mirrorPoint(entity.center);
      mirroredEntity.startAngle = -entity.startAngle;
      mirroredEntity.endAngle = -entity.endAngle;
      mirroredEntity.counterclockwise = !entity.counterclockwise;
      break;

    case 'rectangle':
      mirroredEntity.position = mirrorPoint(entity.position);
      mirroredEntity.rotation = entity.rotation ? -entity.rotation : 0;
      break;

    case 'polyline':
      mirroredEntity.points = entity.points.map(mirrorPoint);
      break;

    case 'ellipse':
      mirroredEntity.center = mirrorPoint(entity.center);
      mirroredEntity.rotation = entity.rotation ? -entity.rotation : 0;
      break;

    case 'text-annotation':
      mirroredEntity.position = mirrorPoint(entity.position);
      mirroredEntity.rotation = entity.rotation ? -entity.rotation : 0;
      break;

    case 'linear-dimension':
      mirroredEntity.startPoint = mirrorPoint(entity.startPoint);
      mirroredEntity.endPoint = mirrorPoint(entity.endPoint);
      break;
  }

  return mirroredEntity;
} 