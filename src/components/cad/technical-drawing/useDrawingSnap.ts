// src/hooks/useDrawingSnap.ts

import { useCallback } from 'react';
import { useTechnicalDrawingStore } from './technicalDrawingStore';
import { Point, AnyEntity, LineEntity, CircleEntity, ArcEntity, RectangleEntity, PolylineEntity, EllipseEntity } from './TechnicalDrawingTypes';
import { calculateDistance, findLineIntersection, calculateTangentPointsToCircle } from './utils/geometry/calculations';

export interface SnapPoint {
  x: number;
  y: number;
  type: 'endpoint' | 'midpoint' | 'center' | 'quadrant' | 'intersection' | 'grid' | 'perpendicular' | 'tangent' | 'nearest' | 'polar';
  distance: number;
  entityId?: string;
  angle?: number; // Per polar snap
  description?: string; // Descrizione per feedback visivo
}

export function useDrawingSnap() {
  const { 
    entities, 
    dimensions, 
    annotations, 
    snappingEnabled, 
    gridEnabled, 
    gridSize, 
    zoom 
  } = useTechnicalDrawingStore();
  
  // Calculate the snap threshold based on zoom level
  const snapThreshold = 10 / zoom; // pixels divided by zoom level
  
  // Convert objects to array for easier processing
  const allEntities = useCallback(() => {
    return [
      ...Object.values(entities),
      ...Object.values(dimensions),
      ...Object.values(annotations)
    ].filter(entity => entity.visible && !entity.locked);
  }, [entities, dimensions, annotations]);
  
  // Find the nearest grid point
  const snapToGrid = useCallback((point: Point): SnapPoint | null => {
    if (!gridEnabled) return null;
    
    const snapX = Math.round(point.x / gridSize) * gridSize;
    const snapY = Math.round(point.y / gridSize) * gridSize;
    
    const distance = Math.sqrt(Math.pow(point.x - snapX, 2) + Math.pow(point.y - snapY, 2));
    
    if (distance <= snapThreshold) {
      return {
        x: snapX,
        y: snapY,
        type: 'grid',
        distance
      };
    }
    
    return null;
  }, [gridEnabled, gridSize, snapThreshold]);
  
  // Find the nearest endpoint
  const snapToEndpoint = useCallback((point: Point): SnapPoint | null => {
    if (!snappingEnabled) return null;
    
    let closestPoint: SnapPoint | null = null;
    let minDistance = snapThreshold;
    
    allEntities().forEach(entity => {
      const endpoints = getEntityEndpoints(entity);
      
      endpoints.forEach(endpoint => {
        const distance = calculateDistance(point, endpoint);
        
        if (distance < minDistance) {
          minDistance = distance;
          closestPoint = {
            x: endpoint.x,
            y: endpoint.y,
            type: 'endpoint',
            distance,
            entityId: entity.id,
            description: 'Endpoint'
          };
        }
      });
    });
    
    return closestPoint;
  }, [snappingEnabled, snapThreshold, allEntities]);
  
  // Find the nearest midpoint
  const snapToMidpoint = useCallback((point: Point): SnapPoint | null => {
    if (!snappingEnabled) return null;
    
    let closestPoint: SnapPoint | null = null;
    let minDistance = snapThreshold;
    
    allEntities().forEach(entity => {
      const midpoints = getEntityMidpoints(entity);
      
      midpoints.forEach(midpoint => {
        const distance = calculateDistance(point, midpoint);
        
        if (distance < minDistance) {
          minDistance = distance;
          closestPoint = {
            x: midpoint.x,
            y: midpoint.y,
            type: 'midpoint',
            distance,
            entityId: entity.id,
            description: 'Midpoint'
          };
        }
      });
    });
    
    return closestPoint;
  }, [snappingEnabled, snapThreshold, allEntities]);
  
  // Find the nearest center point
  const snapToCenter = useCallback((point: Point): SnapPoint | null => {
    if (!snappingEnabled) return null;
    
    let closestPoint: SnapPoint | null = null;
    let minDistance = snapThreshold;
    
    allEntities().forEach(entity => {
      const center = getEntityCenter(entity);
      
      if (center) {
        const distance = calculateDistance(point, center);
        
        if (distance < minDistance) {
          minDistance = distance;
          closestPoint = {
            x: center.x,
            y: center.y,
            type: 'center',
            distance,
            entityId: entity.id,
            description: 'Center'
          };
        }
      }
    });
    
    return closestPoint;
  }, [snappingEnabled, snapThreshold, allEntities]);
  
  // Find the nearest quadrant point
  const snapToQuadrant = useCallback((point: Point): SnapPoint | null => {
    if (!snappingEnabled) return null;
    
    let closestPoint: SnapPoint | null = null;
    let minDistance = snapThreshold;
    
    allEntities().forEach(entity => {
      const quadrants = getEntityQuadrants(entity);
      
      quadrants.forEach(quadrant => {
        const distance = calculateDistance(point, quadrant);
        
        if (distance < minDistance) {
          minDistance = distance;
          closestPoint = {
            x: quadrant.x,
            y: quadrant.y,
            type: 'quadrant',
            distance,
            entityId: entity.id,
            description: 'Quadrant'
          };
        }
      });
    });
    
    return closestPoint;
  }, [snappingEnabled, snapThreshold, allEntities]);
  
  // Helper functions for getting entity points
  const getEntityEndpoints = (entity: AnyEntity): Point[] => {
    switch (entity.type) {
      case 'line': {
        const line = entity as LineEntity;
        return [line.startPoint, line.endPoint];
      }
      case 'polyline': {
        const polyline = entity as PolylineEntity;
        return polyline.points.length > 0 ? [polyline.points[0], polyline.points[polyline.points.length - 1]] : [];
      }
      case 'rectangle': {
        const rect = entity as RectangleEntity;
        return [
          rect.position,
          { x: rect.position.x + rect.width, y: rect.position.y },
          { x: rect.position.x + rect.width, y: rect.position.y + rect.height },
          { x: rect.position.x, y: rect.position.y + rect.height }
        ];
      }
      default:
        return [];
    }
  };
  
  const getEntityMidpoints = (entity: AnyEntity): Point[] => {
    switch (entity.type) {
      case 'line': {
        const line = entity as LineEntity;
        return [{
          x: (line.startPoint.x + line.endPoint.x) / 2,
          y: (line.startPoint.y + line.endPoint.y) / 2
        }];
      }
      case 'rectangle': {
        const rect = entity as RectangleEntity;
        const corners = getEntityEndpoints(entity);
        const midpoints = [];
        for (let i = 0; i < corners.length; i++) {
          const next = (i + 1) % corners.length;
          midpoints.push({
            x: (corners[i].x + corners[next].x) / 2,
            y: (corners[i].y + corners[next].y) / 2
          });
        }
        return midpoints;
      }
      case 'polyline': {
        const polyline = entity as PolylineEntity;
        const midpoints = [];
        for (let i = 0; i < polyline.points.length - 1; i++) {
          midpoints.push({
            x: (polyline.points[i].x + polyline.points[i + 1].x) / 2,
            y: (polyline.points[i].y + polyline.points[i + 1].y) / 2
          });
        }
        return midpoints;
      }
      default:
        return [];
    }
  };
  
  const getEntityCenter = (entity: AnyEntity): Point | null => {
    switch (entity.type) {
      case 'circle':
      case 'arc':
      case 'ellipse': {
        return (entity as any).center;
      }
      case 'rectangle': {
        const rect = entity as RectangleEntity;
        return {
          x: rect.position.x + rect.width / 2,
          y: rect.position.y + rect.height / 2
        };
      }
      default:
        return null;
    }
  };
  
  const getEntityQuadrants = (entity: AnyEntity): Point[] => {
    switch (entity.type) {
      case 'circle': {
        const circle = entity as CircleEntity;
        return [
          { x: circle.center.x + circle.radius, y: circle.center.y },
          { x: circle.center.x, y: circle.center.y + circle.radius },
          { x: circle.center.x - circle.radius, y: circle.center.y },
          { x: circle.center.x, y: circle.center.y - circle.radius }
        ];
      }
      case 'ellipse': {
        const ellipse = entity as EllipseEntity;
        const rotation = ellipse.rotation || 0;
        const cos = Math.cos(rotation * Math.PI / 180);
        const sin = Math.sin(rotation * Math.PI / 180);
        
        return [
          {
            x: ellipse.center.x + ellipse.radiusX * cos,
            y: ellipse.center.y + ellipse.radiusX * sin
          },
          {
            x: ellipse.center.x - ellipse.radiusY * sin,
            y: ellipse.center.y + ellipse.radiusY * cos
          },
          {
            x: ellipse.center.x - ellipse.radiusX * cos,
            y: ellipse.center.y - ellipse.radiusX * sin
          },
          {
            x: ellipse.center.x + ellipse.radiusY * sin,
            y: ellipse.center.y - ellipse.radiusY * cos
          }
        ];
      }
      default:
        return [];
    }
  };
  
  // Calculate line-line intersections
  const findLineIntersection = (line1: LineEntity, line2: LineEntity): Point | null => {
    // Line 1 represented as a1x + b1y = c1
    const a1 = line1.endPoint.y - line1.startPoint.y;
    const b1 = line1.startPoint.x - line1.endPoint.x;
    const c1 = a1 * line1.startPoint.x + b1 * line1.startPoint.y;
    
    // Line 2 represented as a2x + b2y = c2
    const a2 = line2.endPoint.y - line2.startPoint.y;
    const b2 = line2.startPoint.x - line2.endPoint.x;
    const c2 = a2 * line2.startPoint.x + b2 * line2.startPoint.y;
    
    const determinant = a1 * b2 - a2 * b1;
    
    if (determinant === 0) {
      // Lines are parallel
      return null;
    }
    
    const x = (b2 * c1 - b1 * c2) / determinant;
    const y = (a1 * c2 - a2 * c1) / determinant;
    
    // Check if the intersection is within the line segments
    const onLine1 = (
      Math.min(line1.startPoint.x, line1.endPoint.x) <= x &&
      x <= Math.max(line1.startPoint.x, line1.endPoint.x) &&
      Math.min(line1.startPoint.y, line1.endPoint.y) <= y &&
      y <= Math.max(line1.startPoint.y, line1.endPoint.y)
    );
    
    const onLine2 = (
      Math.min(line2.startPoint.x, line2.endPoint.x) <= x &&
      x <= Math.max(line2.startPoint.x, line2.endPoint.x) &&
      Math.min(line2.startPoint.y, line2.endPoint.y) <= y &&
      y <= Math.max(line2.startPoint.y, line2.endPoint.y)
    );
    
    if (onLine1 && onLine2) {
      return { x, y };
    }
    
    return null;
  };
  
  // Find the nearest intersection point
  const snapToIntersection = useCallback((point: Point): SnapPoint | null => {
    if (!snappingEnabled) return null;
    
    let closestPoint: SnapPoint | null = null;
    let minDistance = snapThreshold;
    
    const entities = allEntities();
    
    // Check all possible intersections between entities
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const intersections = findEntityIntersections(entities[i], entities[j]);
        
        intersections.forEach(intersection => {
          const distance = calculateDistance(point, intersection);
          
          if (distance < minDistance) {
            minDistance = distance;
            closestPoint = {
              x: intersection.x,
              y: intersection.y,
              type: 'intersection',
              distance,
              entityId: `${entities[i].id},${entities[j].id}`,
              description: 'Intersection'
            };
          }
        });
      }
    }
    
    return closestPoint;
  }, [snappingEnabled, snapThreshold, allEntities]);
  
  // Find entity intersections
  const findEntityIntersections = (entity1: AnyEntity, entity2: AnyEntity): Point[] => {
    // Line-Line intersections
    if (entity1.type === 'line' && entity2.type === 'line') {
      const line1 = entity1 as LineEntity;
      const line2 = entity2 as LineEntity;
      const intersection = findLineIntersection(line1.startPoint, line1.endPoint, line2.startPoint, line2.endPoint);
      return intersection ? [intersection] : [];
    }
    
    // Line-Circle intersections
    if ((entity1.type === 'line' && entity2.type === 'circle') || 
        (entity1.type === 'circle' && entity2.type === 'line')) {
      const line = entity1.type === 'line' ? entity1 as LineEntity : entity2 as LineEntity;
      const circle = entity1.type === 'circle' ? entity1 as CircleEntity : entity2 as CircleEntity;
      
      // Implement line-circle intersection
      return [];
    }
    
    // Circle-Circle intersections
    if (entity1.type === 'circle' && entity2.type === 'circle') {
      const circle1 = entity1 as CircleEntity;
      const circle2 = entity2 as CircleEntity;
      
      // Implement circle-circle intersection
      return [];
    }
    
    return [];
  };
  
  // Snap to tangent points
  const snapToTangent = useCallback((point: Point, fromPoint?: Point): SnapPoint | null => {
    if (!snappingEnabled || !fromPoint) return null;
    
    let closestPoint: SnapPoint | null = null;
    let minDistance = snapThreshold;
    
    allEntities().forEach(entity => {
      if (entity.type === 'circle') {
        const circle = entity as CircleEntity;
        const tangents = calculateTangentPointsToCircle(fromPoint, circle.center, circle.radius);
        
        tangents.forEach(tangent => {
          const distance = calculateDistance(point, tangent);
          
          if (distance < minDistance) {
            minDistance = distance;
            closestPoint = {
              x: tangent.x,
              y: tangent.y,
              type: 'tangent',
              distance,
              entityId: entity.id,
              description: 'Tangent'
            };
          }
        });
      }
    });
    
    return closestPoint;
  }, [snappingEnabled, snapThreshold, allEntities]);
  
  // Snap to perpendicular points
  const snapToPerpendicular = useCallback((point: Point, fromPoint?: Point): SnapPoint | null => {
    if (!snappingEnabled || !fromPoint) return null;
    
    let closestPoint: SnapPoint | null = null;
    let minDistance = snapThreshold;
    
    allEntities().forEach(entity => {
      if (entity.type === 'line') {
        const line = entity as LineEntity;
        
        // Calculate perpendicular point on line
        const dx = line.endPoint.x - line.startPoint.x;
        const dy = line.endPoint.y - line.startPoint.y;
        const len2 = dx * dx + dy * dy;
        
        if (len2 === 0) return; // Zero-length line
        
        const t = Math.max(0, Math.min(1, 
          ((fromPoint.x - line.startPoint.x) * dx + (fromPoint.y - line.startPoint.y) * dy) / len2
        ));
        
        const perpPoint = {
          x: line.startPoint.x + t * dx,
          y: line.startPoint.y + t * dy
        };
        
        const distance = calculateDistance(point, perpPoint);
        
        if (distance < minDistance) {
          minDistance = distance;
          closestPoint = {
            x: perpPoint.x,
            y: perpPoint.y,
            type: 'perpendicular',
            distance,
            entityId: entity.id,
            description: 'Perpendicular'
          };
        }
      }
    });
    
    return closestPoint;
  }, [snappingEnabled, snapThreshold, allEntities]);
  
  // Snap to nearest point on entity
  const snapToNearest = useCallback((point: Point): SnapPoint | null => {
    if (!snappingEnabled) return null;
    
    let closestPoint: SnapPoint | null = null;
    let minDistance = snapThreshold;
    
    allEntities().forEach(entity => {
      const nearestPoint = findNearestPointOnEntity(entity, point);
      
      if (nearestPoint) {
        const distance = calculateDistance(point, nearestPoint);
        
        if (distance < minDistance) {
          minDistance = distance;
          closestPoint = {
            x: nearestPoint.x,
            y: nearestPoint.y,
            type: 'nearest',
            distance,
            entityId: entity.id,
            description: 'Nearest'
          };
        }
      }
    });
    
    return closestPoint;
  }, [snappingEnabled, snapThreshold, allEntities]);
  
  // Find nearest point on entity
  const findNearestPointOnEntity = (entity: AnyEntity, point: Point): Point | null => {
    switch (entity.type) {
      case 'line': {
        const line = entity as LineEntity;
        const dx = line.endPoint.x - line.startPoint.x;
        const dy = line.endPoint.y - line.startPoint.y;
        const len2 = dx * dx + dy * dy;
        
        if (len2 === 0) return line.startPoint;
        
        const t = Math.max(0, Math.min(1, 
          ((point.x - line.startPoint.x) * dx + (point.y - line.startPoint.y) * dy) / len2
        ));
        
        return {
          x: line.startPoint.x + t * dx,
          y: line.startPoint.y + t * dy
        };
      }
      
      case 'circle': {
        const circle = entity as CircleEntity;
        const dx = point.x - circle.center.x;
        const dy = point.y - circle.center.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance === 0) return { x: circle.center.x + circle.radius, y: circle.center.y };
        
        return {
          x: circle.center.x + (dx / distance) * circle.radius,
          y: circle.center.y + (dy / distance) * circle.radius
        };
      }
      
      default:
        return null;
    }
  };
  
  // Find the best snap point
  const findBestSnapPoint = useCallback((point: Point, fromPoint?: Point): SnapPoint | null => {
    if (!snappingEnabled && !gridEnabled) return null;
    
    // Gather all snap candidates
    const candidates: (SnapPoint | null)[] = [
      snapToEndpoint(point),
      snapToMidpoint(point),
      snapToCenter(point),
      snapToQuadrant(point),
      snapToIntersection(point),
      snapToTangent(point, fromPoint),
      snapToPerpendicular(point, fromPoint),
      snapToNearest(point),
      snapToGrid(point)
    ];
    
    // Filter out null values and find the closest
    const validCandidates = candidates.filter(candidate => candidate !== null) as SnapPoint[];
    
    if (validCandidates.length === 0) return null;
    
    return validCandidates.reduce((closest, current) => 
      current.distance < closest.distance ? current : closest
    );
  }, [
    snappingEnabled, 
    gridEnabled, 
    snapToEndpoint, 
    snapToMidpoint, 
    snapToCenter, 
    snapToQuadrant, 
    snapToIntersection, 
    snapToTangent,
    snapToPerpendicular,
    snapToNearest,
    snapToGrid
  ]);
  
  return {
    snapToGrid,
    snapToEndpoint,
    snapToMidpoint,
    snapToCenter,
    snapToQuadrant,
    snapToIntersection,
    snapToTangent,
    snapToPerpendicular,
    snapToNearest,
    findBestSnapPoint,
    snapThreshold
  };
}