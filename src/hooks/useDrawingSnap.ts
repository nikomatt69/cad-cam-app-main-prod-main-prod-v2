// src/hooks/useDrawingSnap.ts

import { useCallback } from 'react';
import { useTechnicalDrawingStore } from '../store/technicalDrawingStore';
import { Point, DrawingEntity, LineEntity, CircleEntity, ArcEntity } from '../types/TechnicalDrawingTypes';

export interface SnapPoint {
  x: number;
  y: number;
  type: 'endpoint' | 'midpoint' | 'center' | 'quadrant' | 'intersection' | 'grid' | 'perpendicular' | 'tangent';
  distance: number;
  entityId?: string;
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
    ];
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
      if (entity.type === 'line') {
        const line = entity as LineEntity;
        
        // Check start point
        const startDistance = Math.sqrt(
          Math.pow(point.x - line.startPoint.x, 2) + 
          Math.pow(point.y - line.startPoint.y, 2)
        );
        
        if (startDistance < minDistance) {
          minDistance = startDistance;
          closestPoint = {
            x: line.startPoint.x,
            y: line.startPoint.y,
            type: 'endpoint',
            distance: startDistance,
            entityId: entity.id
          };
        }
        
        // Check end point
        const endDistance = Math.sqrt(
          Math.pow(point.x - line.endPoint.x, 2) + 
          Math.pow(point.y - line.endPoint.y, 2)
        );
        
        if (endDistance < minDistance) {
          minDistance = endDistance;
          closestPoint = {
            x: line.endPoint.x,
            y: line.endPoint.y,
            type: 'endpoint',
            distance: endDistance,
            entityId: entity.id
          };
        }
      }
      // Add logic for other entity types
    });
    
    return closestPoint;
  }, [snappingEnabled, snapThreshold, allEntities]);
  
  // Find the nearest midpoint
  const snapToMidpoint = useCallback((point: Point): SnapPoint | null => {
    if (!snappingEnabled) return null;
    
    let closestPoint: SnapPoint | null = null;
    let minDistance = snapThreshold;
    
    allEntities().forEach(entity => {
      if (entity.type === 'line') {
        const line = entity as LineEntity;
        
        // Calculate midpoint
        const midX = (line.startPoint.x + line.endPoint.x) / 2;
        const midY = (line.startPoint.y + line.endPoint.y) / 2;
        
        const distance = Math.sqrt(
          Math.pow(point.x - midX, 2) + 
          Math.pow(point.y - midY, 2)
        );
        
        if (distance < minDistance) {
          minDistance = distance;
          closestPoint = {
            x: midX,
            y: midY,
            type: 'midpoint',
            distance,
            entityId: entity.id
          };
        }
      }
      // Add logic for other entity types
    });
    
    return closestPoint;
  }, [snappingEnabled, snapThreshold, allEntities]);
  
  // Find the nearest center point
  const snapToCenter = useCallback((point: Point): SnapPoint | null => {
    if (!snappingEnabled) return null;
    
    let closestPoint: SnapPoint | null = null;
    let minDistance = snapThreshold;
    
    allEntities().forEach(entity => {
      if (entity.type === 'circle' || entity.type === 'arc' || entity.type === 'ellipse') {
        const centerEntity = entity as CircleEntity | ArcEntity;
        
        const distance = Math.sqrt(
          Math.pow(point.x - centerEntity.center.x, 2) + 
          Math.pow(point.y - centerEntity.center.y, 2)
        );
        
        if (distance < minDistance) {
          minDistance = distance;
          closestPoint = {
            x: centerEntity.center.x,
            y: centerEntity.center.y,
            type: 'center',
            distance,
            entityId: entity.id
          };
        }
      }
      // Add logic for other entity types with centers
    });
    
    return closestPoint;
  }, [snappingEnabled, snapThreshold, allEntities]);
  
  // Find the nearest quadrant point
  const snapToQuadrant = useCallback((point: Point): SnapPoint | null => {
    if (!snappingEnabled) return null;
    
    let closestPoint: SnapPoint | null = null;
    let minDistance = snapThreshold;
    
    allEntities().forEach(entity => {
      if (entity.type === 'circle') {
        const circle = entity as CircleEntity;
        
        // Calculate quadrant points
        const quadrants = [
          { x: circle.center.x + circle.radius, y: circle.center.y },
          { x: circle.center.x, y: circle.center.y + circle.radius },
          { x: circle.center.x - circle.radius, y: circle.center.y },
          { x: circle.center.x, y: circle.center.y - circle.radius }
        ];
        
        quadrants.forEach(quadrant => {
          const distance = Math.sqrt(
            Math.pow(point.x - quadrant.x, 2) + 
            Math.pow(point.y - quadrant.y, 2)
          );
          
          if (distance < minDistance) {
            minDistance = distance;
            closestPoint = {
              x: quadrant.x,
              y: quadrant.y,
              type: 'quadrant',
              distance,
              entityId: entity.id
            };
          }
        });
      }
      // Add logic for other circular entity types
    });
    
    return closestPoint;
  }, [snappingEnabled, snapThreshold, allEntities]);
  
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
    
    const lineEntities = allEntities().filter(entity => entity.type === 'line') as LineEntity[];
    
    // Check all possible line-line intersections
    for (let i = 0; i < lineEntities.length; i++) {
      for (let j = i + 1; j < lineEntities.length; j++) {
        const intersection = findLineIntersection(lineEntities[i], lineEntities[j]);
        
        if (intersection) {
          const distance = Math.sqrt(
            Math.pow(point.x - intersection.x, 2) + 
            Math.pow(point.y - intersection.y, 2)
          );
          
          if (distance < minDistance) {
            minDistance = distance;
            closestPoint = {
              x: intersection.x,
              y: intersection.y,
              type: 'intersection',
              distance,
              entityId: `${lineEntities[i].id},${lineEntities[j].id}`
            };
          }
        }
      }
    }
    
    // TODO: Add logic for other intersection types (line-circle, circle-circle, etc.)
    
    return closestPoint;
  }, [snappingEnabled, snapThreshold, allEntities]);
  
  // Find the best snap point
  const findBestSnapPoint = useCallback((point: Point): SnapPoint | null => {
    if (!snappingEnabled && !gridEnabled) return null;
    
    // Gather all snap candidates
    const candidates: (SnapPoint | null)[] = [
      snapToEndpoint(point),
      snapToMidpoint(point),
      snapToCenter(point),
      snapToQuadrant(point),
      snapToIntersection(point),
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
    snapToGrid
  ]);
  
  return {
    snapToGrid,
    snapToEndpoint,
    snapToMidpoint,
    snapToCenter,
    snapToQuadrant,
    snapToIntersection,
    findBestSnapPoint
  };
}