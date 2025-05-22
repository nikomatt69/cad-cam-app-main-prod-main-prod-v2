import { Point, DrawingEntity, Dimension, Annotation } from 'src/types/TechnicalDrawingTypes';
import { v4 as uuidv4 } from 'uuid';

type EntityWithStartEndPoints = Extract<DrawingEntity | Dimension | Annotation, { startPoint: Point; endPoint: Point }>;
type EntityWithCenter = Extract<DrawingEntity | Dimension | Annotation, { center: Point }>;
type EntityWithPosition = Extract<DrawingEntity | Dimension | Annotation, { position: Point }>;
type EntityWithPoints = Extract<DrawingEntity | Dimension | Annotation, { points: Point[] }>;

function hasStartEndPoints(entity: DrawingEntity | Dimension | Annotation): entity is EntityWithStartEndPoints {
  return 'startPoint' in entity && 'endPoint' in entity;
}

function hasCenter(entity: DrawingEntity | Dimension | Annotation): entity is EntityWithCenter {
  return 'center' in entity;
}

function hasPosition(entity: DrawingEntity | Dimension | Annotation): entity is EntityWithPosition {
  return 'position' in entity;
}

function hasPoints(entity: DrawingEntity | Dimension | Annotation): entity is EntityWithPoints {
  return 'points' in entity;
}

export function copyEntity(entity: DrawingEntity | Dimension | Annotation, offset: Point): Omit<DrawingEntity | Dimension | Annotation, 'id'> {
  const copiedEntity = { ...entity } as any;

  if (hasStartEndPoints(entity)) {
    const typedEntity = entity as EntityWithStartEndPoints;
    copiedEntity.startPoint = {
      x: typedEntity.startPoint.x + offset.x,
      y: typedEntity.startPoint.y + offset.y
    };
    copiedEntity.endPoint = {
      x: typedEntity.endPoint.x + offset.x,
      y: typedEntity.endPoint.y + offset.y
    };
  }

  if (hasCenter(entity)) {
    const typedEntity = entity as EntityWithCenter;
    copiedEntity.center = {
      x: typedEntity.center.x + offset.x,
      y: typedEntity.center.y + offset.y
    };
  }

  if (hasPosition(entity)) {
    const typedEntity = entity as EntityWithPosition;
    copiedEntity.position = {
      x: typedEntity.position.x + offset.x,
      y: typedEntity.position.y + offset.y
    };
  }

  if (hasPoints(entity)) {
    const typedEntity = entity as EntityWithPoints;
    copiedEntity.points = typedEntity.points.map(point => ({
      x: point.x + offset.x,
      y: point.y + offset.y
    }));
  }

  return copiedEntity;
}

export function calculateDistance(point1: Point, point2: Point): number {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function calculateAngle(point1: Point, point2: Point, point3: Point): number {
  const vector1 = {
    x: point1.x - point2.x,
    y: point1.y - point2.y
  };
  const vector2 = {
    x: point3.x - point2.x,
    y: point3.y - point2.y
  };

  const dot = vector1.x * vector2.x + vector1.y * vector2.y;
  const mag1 = Math.sqrt(vector1.x * vector1.x + vector1.y * vector1.y);
  const mag2 = Math.sqrt(vector2.x * vector2.x + vector2.y * vector2.y);

  const angle = Math.acos(dot / (mag1 * mag2));
  return (angle * 180) / Math.PI;
} 