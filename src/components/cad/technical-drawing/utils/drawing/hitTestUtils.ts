// src/components/cad/technical-drawing/utils/drawing/hitTestUtils.ts
// Stub per hitTestUtils

import { Point, AnyEntity } from '../../TechnicalDrawingTypes';

export interface SnapPoint {
  point: Point;
  type: string;
}

export const getSnapPoints = (entities: AnyEntity[], objectSnap: Record<string, boolean>): SnapPoint[] => {
  const snapPoints: SnapPoint[] = [];
  
  entities.forEach(entity => {
    // Add snap points based on entity type and object snap settings
    if (objectSnap.endpoint && entity.type === 'line') {
      const line = entity as any;
      if (line.startPoint) {
        snapPoints.push({ point: line.startPoint, type: 'endpoint' });
      }
      if (line.endPoint) {
        snapPoints.push({ point: line.endPoint, type: 'endpoint' });
      }
    }
    
    if (objectSnap.center && entity.type === 'circle') {
      const circle = entity as any;
      if (circle.center) {
        snapPoints.push({ point: circle.center, type: 'center' });
      }
    }
    
    if (objectSnap.midpoint && entity.type === 'line') {
      const line = entity as any;
      if (line.startPoint && line.endPoint) {
        const midpoint = {
          x: (line.startPoint.x + line.endPoint.x) / 2,
          y: (line.startPoint.y + line.endPoint.y) / 2
        };
        snapPoints.push({ point: midpoint, type: 'midpoint' });
      }
    }
  });
  
  return snapPoints;
};

export const snapToGrid = (point: Point, gridSize: number): Point => {
  return {
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize
  };
};

export const snapToPoints = (point: Point, snapPoints: SnapPoint[], tolerance: number): SnapPoint | null => {
  for (const snap of snapPoints) {
    const distance = Math.sqrt(
      Math.pow(point.x - snap.point.x, 2) + 
      Math.pow(point.y - snap.point.y, 2)
    );
    
    if (distance < tolerance) {
      return snap;
    }
  }
  
  return null;
};
