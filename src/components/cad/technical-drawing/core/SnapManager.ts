import { DrawingEntity, Point, SnapMode } from '../../../../types/TechnicalDrawingTypes';

/**
 * Class responsible for handling snapping functionality
 */
export class SnapManager {
  private snapModes: SnapMode[] = ['endpoint', 'midpoint', 'center', 'quadrant', 'intersection', 'grid', 'nearest'];
  private enabled: boolean = true;
  private gridSize: number = 10;
  private snapDistance: number = 10; // Distance in pixels to snap
  private polarSnapEnabled: boolean = false;
  private polarSnapAngles: number[] = [15, 30, 45, 60, 90]; // Angles in degrees
  
  /**
   * Constructor
   */
  constructor() {}
  
  /**
   * Enable or disable snapping
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
  
  /**
   * Check if snapping is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
  
  /**
   * Enable or disable polar snapping
   */
  setPolarSnapEnabled(enabled: boolean): void {
    this.polarSnapEnabled = enabled;
  }
  
  /**
   * Check if polar snapping is enabled
   */
  isPolarSnapEnabled(): boolean {
    return this.polarSnapEnabled;
  }
  
  /**
   * Set the grid size for grid snapping
   */
  setGridSize(size: number): void {
    this.gridSize = size;
  }
  
  /**
   * Set the snap distance threshold
   */
  setSnapDistance(distance: number): void {
    this.snapDistance = distance;
  }
  
  /**
   * Set the active snap modes
   */
  setSnapModes(modes: SnapMode[]): void {
    this.snapModes = modes;
  }
  
  /**
   * Get the active snap modes
   */
  getSnapModes(): SnapMode[] {
    return this.snapModes;
  }
  
  /**
   * Set custom polar angles
   */
  setPolarSnapAngles(angles: number[]): void {
    this.polarSnapAngles = angles;
  }
  
  /**
   * Get the polar snap angles
   */
  getPolarSnapAngles(): number[] {
    return this.polarSnapAngles;
  }
  
  /**
   * Find the closest snap point to the given point
   */
  findSnapPoint(
    point: Point, 
    entities: DrawingEntity[], 
    viewportScale: number, 
    basePoint?: Point, 
    gridEnabled: boolean = true
  ): { snapPoint: Point, snapMode: SnapMode } | null {
    if (!this.enabled) {
      return null;
    }
    
    // Adjust snap distance based on viewport scale
    const adjustedSnapDistance = this.snapDistance / viewportScale;
    
    // Calculate potential snap points based on active modes
    const snapCandidates: { point: Point, distance: number, mode: SnapMode }[] = [];
    
    // Process grid snapping (only if no basePoint is provided for polar snapping)
    if (gridEnabled && this.snapModes.includes('grid') && !basePoint) {
      const gridPoint = {
        x: Math.round(point.x / this.gridSize) * this.gridSize,
        y: Math.round(point.y / this.gridSize) * this.gridSize
      };
      
      const gridDistance = this.getDistance(point, gridPoint);
      
      if (gridDistance <= adjustedSnapDistance) {
        snapCandidates.push({
          point: gridPoint,
          distance: gridDistance,
          mode: 'grid'
        });
      }
    }
    
    // Process polar snapping if a base point is provided
    if (basePoint && this.polarSnapEnabled) {
      const polarPoint = this.getPolarSnapPoint(basePoint, point);
      
      if (polarPoint) {
        const polarDistance = this.getDistance(point, polarPoint);
        
        if (polarDistance <= adjustedSnapDistance) {
          snapCandidates.push({
            point: polarPoint,
            distance: polarDistance,
            mode: 'polar'
          });
        }
      }
    }
    
    // Process entity snap points
    for (const entity of entities) {
      if (!entity.visible) continue;
      
      // Get points based on entity type and active snap modes
      this.getEntitySnapPoints(entity).forEach(snapInfo => {
        if (this.snapModes.includes(snapInfo.mode)) {
          const distance = this.getDistance(point, snapInfo.point);
          
          if (distance <= adjustedSnapDistance) {
            snapCandidates.push({
              point: snapInfo.point,
              distance: distance,
              mode: snapInfo.mode
            });
          }
        }
      });
      
      // Process intersection points if enabled
      if (this.snapModes.includes('intersection')) {
        const intersections = this.findIntersections(entity, entities, point, adjustedSnapDistance);
        snapCandidates.push(...intersections);
      }
    }
    
    // Find the closest snap point
    if (snapCandidates.length > 0) {
      snapCandidates.sort((a, b) => a.distance - b.distance);
      return {
        snapPoint: snapCandidates[0].point,
        snapMode: snapCandidates[0].mode
      };
    }
    
    return null;
  }
  
  /**
   * Get all potential snap points for an entity
   */
  private getEntitySnapPoints(entity: DrawingEntity): { point: Point, mode: SnapMode }[] {
    const snapPoints: { point: Point, mode: SnapMode }[] = [];
    
    switch (entity.type) {
      case 'line':
        // Endpoints
        snapPoints.push({ point: entity.startPoint, mode: 'endpoint' });
        snapPoints.push({ point: entity.endPoint, mode: 'endpoint' });
        
        // Midpoint
        snapPoints.push({
          point: {
            x: (entity.startPoint.x + entity.endPoint.x) / 2,
            y: (entity.startPoint.y + entity.endPoint.y) / 2
          },
          mode: 'midpoint'
        });
        
        // Perpendicular - handled during intersection testing
        // Nearest - handled during nearest point calculation
        break;
        
      case 'circle':
        // Center
        snapPoints.push({ point: entity.center, mode: 'center' });
        
        // Quadrant points (top, right, bottom, left)
        snapPoints.push({ 
          point: { x: entity.center.x, y: entity.center.y - entity.radius }, 
          mode: 'quadrant' 
        });
        snapPoints.push({ 
          point: { x: entity.center.x + entity.radius, y: entity.center.y }, 
          mode: 'quadrant' 
        });
        snapPoints.push({ 
          point: { x: entity.center.x, y: entity.center.y + entity.radius }, 
          mode: 'quadrant' 
        });
        snapPoints.push({ 
          point: { x: entity.center.x - entity.radius, y: entity.center.y }, 
          mode: 'quadrant' 
        });
        break;
        
      case 'arc':
        // Center
        snapPoints.push({ point: entity.center, mode: 'center' });
        
        // Endpoints
        if (entity.startPoint) snapPoints.push({ point: entity.startPoint, mode: 'endpoint' });
        if (entity.endPoint) snapPoints.push({ point: entity.endPoint, mode: 'endpoint' });
        
        // Midpoint - approximated for arcs
        if (entity.startPoint && entity.endPoint) {
          const startAngle = entity.startAngle || 0;
          const endAngle = entity.endAngle || Math.PI * 2;
          const midAngle = (startAngle + endAngle) / 2;
          
          snapPoints.push({
            point: {
              x: entity.center.x + Math.cos(midAngle) * entity.radius,
              y: entity.center.y + Math.sin(midAngle) * entity.radius
            },
            mode: 'midpoint'
          });
        }
        
        // Quadrant points - only if they fall within the arc's range
        // This is a simplified approach
        const angles = [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2]; // 0, 90, 180, 270 degrees
        angles.forEach(angle => {
          let isInArc = false;
          if (entity.startAngle !== undefined && entity.endAngle !== undefined) {
            let startAngle = entity.startAngle;
            let endAngle = entity.endAngle;
            
            // Normalize angles to 0-2π range
            while (startAngle < 0) startAngle += Math.PI * 2;
            while (endAngle < 0) endAngle += Math.PI * 2;
            
            // Ensure endAngle > startAngle
            if (endAngle < startAngle) endAngle += Math.PI * 2;
            
            // Normalize test angle
            let testAngle = angle;
            while (testAngle < startAngle) testAngle += Math.PI * 2;
            
            isInArc = testAngle >= startAngle && testAngle <= endAngle;
          } else {
            // If no angles defined, assume it's a full circle
            isInArc = true;
          }
          
          if (isInArc) {
            snapPoints.push({
              point: {
                x: entity.center.x + Math.cos(angle) * entity.radius,
                y: entity.center.y + Math.sin(angle) * entity.radius
              },
              mode: 'quadrant'
            });
          }
        });
        break;
        
      case 'rectangle':
        // Corners
        snapPoints.push({ point: { x: entity.x, y: entity.y }, mode: 'endpoint' });
        snapPoints.push({ point: { x: entity.x + entity.width, y: entity.y }, mode: 'endpoint' });
        snapPoints.push({ point: { x: entity.x + entity.width, y: entity.y + entity.height }, mode: 'endpoint' });
        snapPoints.push({ point: { x: entity.x, y: entity.y + entity.height }, mode: 'endpoint' });
        
        // Midpoints of each edge
        snapPoints.push({ 
          point: { x: entity.x + entity.width / 2, y: entity.y }, 
          mode: 'midpoint' 
        });
        snapPoints.push({ 
          point: { x: entity.x + entity.width, y: entity.y + entity.height / 2 }, 
          mode: 'midpoint' 
        });
        snapPoints.push({ 
          point: { x: entity.x + entity.width / 2, y: entity.y + entity.height }, 
          mode: 'midpoint' 
        });
        snapPoints.push({ 
          point: { x: entity.x, y: entity.y + entity.height / 2 }, 
          mode: 'midpoint' 
        });
        
        // Center of rectangle
        snapPoints.push({ 
          point: { x: entity.x + entity.width / 2, y: entity.y + entity.height / 2 }, 
          mode: 'center' 
        });
        break;
        
      case 'polyline':
        if (entity.points && entity.points.length > 0) {
          // Endpoints
          entity.points.forEach(point => {
            snapPoints.push({ point, mode: 'endpoint' });
          });
          
          // Midpoints of each segment
          for (let i = 0; i < entity.points.length - 1; i++) {
            snapPoints.push({
              point: {
                x: (entity.points[i].x + entity.points[i + 1].x) / 2,
                y: (entity.points[i].y + entity.points[i + 1].y) / 2
              },
              mode: 'midpoint'
            });
          }
          
          // If closed, add midpoint for the closing segment
          if (entity.closed && entity.points.length > 2) {
            snapPoints.push({
              point: {
                x: (entity.points[0].x + entity.points[entity.points.length - 1].x) / 2,
                y: (entity.points[0].y + entity.points[entity.points.length - 1].y) / 2
              },
              mode: 'midpoint'
            });
          }
        }
        break;
        
      case 'text':
        // Position (top-left)
        snapPoints.push({ point: entity.position, mode: 'endpoint' });
        
        // Corners if width and height are defined
        if (entity.width && entity.height) {
          snapPoints.push({ 
            point: { x: entity.position.x + entity.width, y: entity.position.y }, 
            mode: 'endpoint' 
          });
          snapPoints.push({ 
            point: { x: entity.position.x + entity.width, y: entity.position.y + entity.height }, 
            mode: 'endpoint' 
          });
          snapPoints.push({ 
            point: { x: entity.position.x, y: entity.position.y + entity.height }, 
            mode: 'endpoint' 
          });
          
          // Center
          snapPoints.push({
            point: { 
              x: entity.position.x + entity.width / 2, 
              y: entity.position.y + entity.height / 2 
            },
            mode: 'center'
          });
        }
        break;
        
      case 'dimension-linear':
      case 'dimension-angular':
      case 'dimension-radius':
      case 'dimension-diameter':
        // Add all defined points
        if (entity.startPoint) snapPoints.push({ point: entity.startPoint, mode: 'endpoint' });
        if (entity.endPoint) snapPoints.push({ point: entity.endPoint, mode: 'endpoint' });
        if (entity.center) snapPoints.push({ point: entity.center, mode: 'center' });
        if (entity.pointOnCircle) snapPoints.push({ point: entity.pointOnCircle, mode: 'endpoint' });
        break;
        
      case 'centermark':
        if (entity.center) snapPoints.push({ point: entity.center, mode: 'center' });
        break;
        
      case 'centerline':
        if (entity.startPoint) snapPoints.push({ point: entity.startPoint, mode: 'endpoint' });
        if (entity.endPoint) snapPoints.push({ point: entity.endPoint, mode: 'endpoint' });
        
        // Midpoint
        if (entity.startPoint && entity.endPoint) {
          snapPoints.push({
            point: {
              x: (entity.startPoint.x + entity.endPoint.x) / 2,
              y: (entity.startPoint.y + entity.endPoint.y) / 2
            },
            mode: 'midpoint'
          });
        }
        break;
    }
    
    return snapPoints;
  }
  
  /**
   * Find intersection points between entities
   */
  private findIntersections(
    entity: DrawingEntity, 
    allEntities: DrawingEntity[], 
    point: Point, 
    maxDistance: number
  ): { point: Point, distance: number, mode: SnapMode }[] {
    const intersections: { point: Point, distance: number, mode: SnapMode }[] = [];
    
    for (const otherEntity of allEntities) {
      if (entity === otherEntity || !otherEntity.visible) continue;
      
      // Find intersections based on entity types
      const intersectionPoints = this.getIntersectionPoints(entity, otherEntity);
      
      for (const intersectionPoint of intersectionPoints) {
        const distance = this.getDistance(point, intersectionPoint);
        
        if (distance <= maxDistance) {
          intersections.push({
            point: intersectionPoint,
            distance,
            mode: 'intersection'
          });
        }
      }
    }
    
    return intersections;
  }
  
  /**
   * Get intersection points between two entities
   */
  private getIntersectionPoints(entity1: DrawingEntity, entity2: DrawingEntity): Point[] {
    const intersections: Point[] = [];
    
    // Line - Line intersection
    if (entity1.type === 'line' && entity2.type === 'line') {
      const intersection = this.lineLineIntersection(
        entity1.startPoint, entity1.endPoint, 
        entity2.startPoint, entity2.endPoint
      );
      
      if (intersection) {
        intersections.push(intersection);
      }
    }
    
    // Line - Circle intersection
    else if (
      (entity1.type === 'line' && entity2.type === 'circle') || 
      (entity1.type === 'circle' && entity2.type === 'line')
    ) {
      const line = entity1.type === 'line' ? entity1 : entity2;
      const circle = entity1.type === 'circle' ? entity1 : entity2;
      
      const lineCircleIntersections = this.lineCircleIntersection(
        line.startPoint, line.endPoint, 
        circle.center, circle.radius
      );
      
      intersections.push(...lineCircleIntersections);
    }
    
    // Circle - Circle intersection
    else if (entity1.type === 'circle' && entity2.type === 'circle') {
      const circleCircleIntersections = this.circleCircleIntersection(
        entity1.center, entity1.radius,
        entity2.center, entity2.radius
      );
      
      intersections.push(...circleCircleIntersections);
    }
    
    // Add more intersection types as needed
    
    return intersections;
  }
  
  /**
   * Line - Line intersection
   */
  private lineLineIntersection(a1: Point, a2: Point, b1: Point, b2: Point): Point | null {
    const det = (a2.x - a1.x) * (b2.y - b1.y) - (a2.y - a1.y) * (b2.x - b1.x);
    
    if (det === 0) {
      // Lines are parallel
      return null;
    }
    
    const t = ((b1.x - a1.x) * (b2.y - b1.y) - (b1.y - a1.y) * (b2.x - b1.x)) / det;
    const u = ((b1.x - a1.x) * (a2.y - a1.y) - (b1.y - a1.y) * (a2.x - a1.x)) / det;
    
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
      // Intersection is within both line segments
      return {
        x: a1.x + t * (a2.x - a1.x),
        y: a1.y + t * (a2.y - a1.y)
      };
    }
    
    return null;
  }
  
  /**
   * Line - Circle intersection
   */
  private lineCircleIntersection(p1: Point, p2: Point, center: Point, radius: number): Point[] {
    const intersections: Point[] = [];
    
    // Convert the line to the form ax + by + c = 0
    const a = p2.y - p1.y;
    const b = p1.x - p2.x;
    const c = p2.x * p1.y - p1.x * p2.y;
    
    // Calculate the distance from the center of the circle to the line
    const lineLength = Math.sqrt(a * a + b * b);
    if (lineLength === 0) return [];
    
    const dist = Math.abs(a * center.x + b * center.y + c) / lineLength;
    
    // If the distance is greater than the radius, there are no intersections
    if (dist > radius) {
      return [];
    }
    
    // Calculate the point on the line that is closest to the center
    const t = -(a * center.x + b * center.y + c) / (a * a + b * b);
    const closestPoint = {
      x: center.x + a * t,
      y: center.y + b * t
    };
    
    // If the distance is equal to the radius, there is one intersection
    if (Math.abs(dist - radius) < 1e-10) {
      // Check if the intersection is on the line segment
      if (this.isPointOnLineSegment(closestPoint, p1, p2)) {
        intersections.push(closestPoint);
      }
      return intersections;
    }
    
    // Calculate the half-chord distance
    const halfChordDistance = Math.sqrt(radius * radius - dist * dist);
    
    // Calculate the two intersection points
    const intersection1 = {
      x: closestPoint.x + halfChordDistance * (p2.x - p1.x) / lineLength,
      y: closestPoint.y + halfChordDistance * (p2.y - p1.y) / lineLength
    };
    
    const intersection2 = {
      x: closestPoint.x - halfChordDistance * (p2.x - p1.x) / lineLength,
      y: closestPoint.y - halfChordDistance * (p2.y - p1.y) / lineLength
    };
    
    // Check if the intersections are on the line segment
    if (this.isPointOnLineSegment(intersection1, p1, p2)) {
      intersections.push(intersection1);
    }
    
    if (this.isPointOnLineSegment(intersection2, p1, p2)) {
      intersections.push(intersection2);
    }
    
    return intersections;
  }
  
  /**
   * Circle - Circle intersection
   */
  private circleCircleIntersection(c1: Point, r1: number, c2: Point, r2: number): Point[] {
    const intersections: Point[] = [];
    
    // Calculate the distance between the centers
    const dx = c2.x - c1.x;
    const dy = c2.y - c1.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    
    // Check if the circles are too far apart or one is inside the other
    if (d > r1 + r2 || d < Math.abs(r1 - r2) || d === 0) {
      return [];
    }
    
    // Calculate the intersection points
    const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
    const h = Math.sqrt(r1 * r1 - a * a);
    
    const p3 = {
      x: c1.x + a * dx / d,
      y: c1.y + a * dy / d
    };
    
    // If the circles are tangent, there is only one intersection
    if (Math.abs(d - (r1 + r2)) < 1e-10 || Math.abs(d - Math.abs(r1 - r2)) < 1e-10) {
      intersections.push(p3);
      return intersections;
    }
    
    // Calculate the two intersection points
    const intersection1 = {
      x: p3.x + h * dy / d,
      y: p3.y - h * dx / d
    };
    
    const intersection2 = {
      x: p3.x - h * dy / d,
      y: p3.y + h * dx / d
    };
    
    intersections.push(intersection1, intersection2);
    return intersections;
  }
  
  /**
   * Check if a point is on a line segment
   */
  private isPointOnLineSegment(p: Point, a: Point, b: Point): boolean {
    const distance = this.getDistance(a, b);
    const d1 = this.getDistance(p, a);
    const d2 = this.getDistance(p, b);
    
    // Allow for floating-point error
    return Math.abs(d1 + d2 - distance) < 1e-10;
  }
  
  /**
   * Get polar snap point
   */
  private getPolarSnapPoint(base: Point, point: Point): Point | null {
    if (!this.polarSnapEnabled) {
      return null;
    }
    
    // Calculate angle from base to point
    let angle = Math.atan2(point.y - base.y, point.x - base.x) * 180 / Math.PI;
    
    // Normalize angle to 0-360
    while (angle < 0) angle += 360;
    
    // Find the closest snap angle
    let closestAngle = 0;
    let minDiff = 360;
    
    for (const snapAngle of this.polarSnapAngles) {
      // Check all multiples of this angle within 0-360
      for (let mult = 0; mult <= 360 / snapAngle; mult++) {
        const currAngle = snapAngle * mult;
        const diff = Math.abs(currAngle - angle);
        
        if (diff < minDiff) {
          minDiff = diff;
          closestAngle = currAngle;
        }
      }
    }
    
    // If we're close enough to a snap angle, snap to it
    if (minDiff <= 5) { // 5 degrees tolerance
      const distance = this.getDistance(base, point);
      const radians = closestAngle * Math.PI / 180;
      
      return {
        x: base.x + Math.cos(radians) * distance,
        y: base.y + Math.sin(radians) * distance
      };
    }
    
    return null;
  }
  
  /**
   * Calculate distance between two points
   */
  private getDistance(p1: Point, p2: Point): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}

// Create and export a singleton instance
export const snapManager = new SnapManager(); 