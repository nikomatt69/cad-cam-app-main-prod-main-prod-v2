// src/components/cad/technical-drawing/core/HitTestManager.ts
// Hit testing manager for selecting entities in the drawing

import { Point, AnyEntity } from '../TechnicalDrawingTypes';
import { hitTestEntity } from '../utils/drawing/hitTestUtils';

export interface HitTestResult {
  entityId: string;
  entity: AnyEntity;
  distance: number;
  point: Point;
}

export class HitTestManager {
  private entities: Map<string, AnyEntity>;
  private zoom: number;

  constructor() {
    this.entities = new Map();
    this.zoom = 1;
  }

  /**
   * Update the entities collection
   */
  updateEntities(entities: Record<string, AnyEntity>): void {
    this.entities.clear();
    Object.entries(entities).forEach(([id, entity]) => {
      this.entities.set(id, entity);
    });
  }

  /**
   * Update the zoom level for hit testing
   */
  updateZoom(zoom: number): void {
    this.zoom = zoom;
  }

  /**
   * Perform hit testing at a specific point
   */
  hitTestAtPoint(point: Point, tolerance?: number): HitTestResult | null {
    const hits: HitTestResult[] = [];

    this.entities.forEach((entity, id) => {
      // Skip invisible or locked entities
      if (!entity.visible || entity.locked) return;

      // Perform hit test
      if (hitTestEntity(entity, point, this.zoom)) {
        // Calculate distance for prioritizing hits
        const distance = this.calculateEntityDistance(entity, point);
        
        hits.push({
          entityId: id,
          entity,
          distance,
          point
        });
      }
    });

    // Sort by distance and return the closest hit
    if (hits.length > 0) {
      hits.sort((a, b) => a.distance - b.distance);
      return hits[0];
    }

    return null;
  }

  /**
   * Perform hit testing in a rectangular area
   */
  hitTestInRect(
    topLeft: Point, 
    bottomRight: Point
  ): HitTestResult[] {
    const hits: HitTestResult[] = [];

    this.entities.forEach((entity, id) => {
      // Skip invisible or locked entities
      if (!entity.visible || entity.locked) return;

      // Check if entity intersects with the rectangle
      if (this.entityIntersectsRect(entity, topLeft, bottomRight)) {
        const centerPoint = {
          x: (topLeft.x + bottomRight.x) / 2,
          y: (topLeft.y + bottomRight.y) / 2
        };

        hits.push({
          entityId: id,
          entity,
          distance: this.calculateEntityDistance(entity, centerPoint),
          point: centerPoint
        });
      }
    });

    return hits;
  }

  /**
   * Get all entities at a point (useful for context menus)
   */
  getAllHitsAtPoint(point: Point): HitTestResult[] {
    const hits: HitTestResult[] = [];

    this.entities.forEach((entity, id) => {
      if (!entity.visible || entity.locked) return;

      if (hitTestEntity(entity, point, this.zoom)) {
        hits.push({
          entityId: id,
          entity,
          distance: this.calculateEntityDistance(entity, point),
          point
        });
      }
    });

    // Sort by distance
    return hits.sort((a, b) => a.distance - b.distance);
  }

  /**
   * Calculate approximate distance from point to entity center
   */
  private calculateEntityDistance(entity: AnyEntity, point: Point): number {
    switch (entity.type) {
      case 'line': {
        const line = entity as any;
        const midX = (line.startPoint.x + line.endPoint.x) / 2;
        const midY = (line.startPoint.y + line.endPoint.y) / 2;
        return Math.sqrt((point.x - midX) ** 2 + (point.y - midY) ** 2);
      }
      
      case 'circle':
      case 'arc':
      case 'ellipse': {
        const centered = entity as any;
        return Math.sqrt(
          (point.x - centered.center.x) ** 2 + 
          (point.y - centered.center.y) ** 2
        );
      }
      
      case 'rectangle': {
        const rect = entity as any;
        const centerX = rect.position.x + rect.width / 2;
        const centerY = rect.position.y + rect.height / 2;
        return Math.sqrt((point.x - centerX) ** 2 + (point.y - centerY) ** 2);
      }
      
      case 'polyline': {
        const polyline = entity as any;
        if (polyline.points.length === 0) return Infinity;
        
        // Use first point as reference
        return Math.sqrt(
          (point.x - polyline.points[0].x) ** 2 + 
          (point.y - polyline.points[0].y) ** 2
        );
      }
      
      case 'text-annotation': {
        const text = entity as any;
        return Math.sqrt(
          (point.x - text.position.x) ** 2 + 
          (point.y - text.position.y) ** 2
        );
      }
      
      default:
        return 0;
    }
  }

  /**
   * Check if entity intersects with a rectangle
   */
  private entityIntersectsRect(
    entity: AnyEntity, 
    topLeft: Point, 
    bottomRight: Point
  ): boolean {
    const bounds = this.getEntityBounds(entity);
    if (!bounds) return false;

    return !(
      bounds.maxX < topLeft.x ||
      bounds.minX > bottomRight.x ||
      bounds.maxY < topLeft.y ||
      bounds.minY > bottomRight.y
    );
  }

  /**
   * Get approximate bounds of an entity
   */
  private getEntityBounds(entity: AnyEntity): {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  } | null {
    switch (entity.type) {
      case 'line': {
        const line = entity as any;
        return {
          minX: Math.min(line.startPoint.x, line.endPoint.x),
          minY: Math.min(line.startPoint.y, line.endPoint.y),
          maxX: Math.max(line.startPoint.x, line.endPoint.x),
          maxY: Math.max(line.startPoint.y, line.endPoint.y)
        };
      }
      
      case 'circle': {
        const circle = entity as any;
        return {
          minX: circle.center.x - circle.radius,
          minY: circle.center.y - circle.radius,
          maxX: circle.center.x + circle.radius,
          maxY: circle.center.y + circle.radius
        };
      }
      
      case 'rectangle': {
        const rect = entity as any;
        return {
          minX: rect.position.x,
          minY: rect.position.y,
          maxX: rect.position.x + rect.width,
          maxY: rect.position.y + rect.height
        };
      }
      
      case 'polyline': {
        const polyline = entity as any;
        if (polyline.points.length === 0) return null;
        
        let minX = polyline.points[0].x;
        let minY = polyline.points[0].y;
        let maxX = polyline.points[0].x;
        let maxY = polyline.points[0].y;
        
        for (const point of polyline.points) {
          minX = Math.min(minX, point.x);
          minY = Math.min(minY, point.y);
          maxX = Math.max(maxX, point.x);
          maxY = Math.max(maxY, point.y);
        }
        
        return { minX, minY, maxX, maxY };
      }
      
      case 'text-annotation': {
        const text = entity as any;
        const estimatedWidth = text.text.length * (text.style.fontSize || 12) * 0.6;
        const estimatedHeight = text.style.fontSize || 12;
        
        return {
          minX: text.position.x,
          minY: text.position.y - estimatedHeight,
          maxX: text.position.x + estimatedWidth,
          maxY: text.position.y
        };
      }
      
      default:
        return null;
    }
  }

  /**
   * Perform hit testing along a line (for fence selection)
   */
  hitTestAlongLine(startPoint: Point, endPoint: Point): HitTestResult[] {
    const hits: HitTestResult[] = [];
    
    this.entities.forEach((entity, id) => {
      if (!entity.visible || entity.locked) return;

      if (this.entityIntersectsLine(entity, startPoint, endPoint)) {
        hits.push({
          entityId: id,
          entity,
          distance: this.calculateEntityDistance(entity, startPoint),
          point: startPoint
        });
      }
    });

    return hits;
  }

  /**
   * Check if entity intersects with a line
   */
  private entityIntersectsLine(
    entity: AnyEntity, 
    lineStart: Point, 
    lineEnd: Point
  ): boolean {
    const bounds = this.getEntityBounds(entity);
    if (!bounds) return false;

    // Simple line-rectangle intersection test
    // This is a simplified version - a more accurate implementation would
    // test against the actual entity geometry
    
    return this.lineIntersectsRect(
      lineStart, 
      lineEnd, 
      { x: bounds.minX, y: bounds.minY },
      { x: bounds.maxX, y: bounds.maxY }
    );
  }

  /**
   * Test if a line intersects with a rectangle
   */
  private lineIntersectsRect(
    lineStart: Point,
    lineEnd: Point,
    rectTopLeft: Point,
    rectBottomRight: Point
  ): boolean {
    // Check if either endpoint is inside the rectangle
    if (this.pointInRect(lineStart, rectTopLeft, rectBottomRight) ||
        this.pointInRect(lineEnd, rectTopLeft, rectBottomRight)) {
      return true;
    }

    // Check if line intersects any of the rectangle edges
    const rectCorners = [
      rectTopLeft,
      { x: rectBottomRight.x, y: rectTopLeft.y },
      rectBottomRight,
      { x: rectTopLeft.x, y: rectBottomRight.y }
    ];

    for (let i = 0; i < 4; i++) {
      const edgeStart = rectCorners[i];
      const edgeEnd = rectCorners[(i + 1) % 4];
      
      if (this.linesIntersect(lineStart, lineEnd, edgeStart, edgeEnd)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if a point is inside a rectangle
   */
  private pointInRect(
    point: Point, 
    topLeft: Point, 
    bottomRight: Point
  ): boolean {
    return point.x >= topLeft.x && 
           point.x <= bottomRight.x && 
           point.y >= topLeft.y && 
           point.y <= bottomRight.y;
  }

  /**
   * Check if two line segments intersect
   */
  private linesIntersect(
    a1: Point, a2: Point, 
    b1: Point, b2: Point
  ): boolean {
    const ccw = (A: Point, B: Point, C: Point) => 
      (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);
    
    return ccw(a1, b1, b2) !== ccw(a2, b1, b2) && 
           ccw(a1, a2, b1) !== ccw(a1, a2, b2);
  }
}

export default HitTestManager;
