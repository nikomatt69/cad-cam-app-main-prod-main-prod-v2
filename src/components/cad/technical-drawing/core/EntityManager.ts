import { v4 as uuidv4 } from 'uuid';
import { DrawingEntity, Point, DrawingStyle } from '../../../../types/TechnicalDrawingTypes';

/**
 * Class responsible for managing drawing entities
 */
export class EntityManager {
  /**
   * Create a new entity with a unique ID
   */
  createEntity(entityData: Partial<DrawingEntity>, entityType: string): DrawingEntity {
    return {
      id: uuidv4(),
      type: entityType,
      layer: entityData.layer || 'default',
      visible: entityData.visible !== undefined ? entityData.visible : true,
      locked: entityData.locked !== undefined ? entityData.locked : false,
      style: entityData.style || {
        strokeColor: '#000000',
        strokeWidth: 0.5,
        strokeStyle: 'solid'
      },
      ...entityData
    } as unknown as DrawingEntity; // Cast to DrawingEntity after combining properties
  }

  /**
   * Move an entity by a delta
   */
  moveEntity(entity: DrawingEntity, dx: number, dy: number): DrawingEntity {
    // Create a shallow copy to avoid modifying the original
    const newEntity = { ...entity } as any;
    
    // Use type assertions for property access since TypeScript can't narrow union types properly in this scenario
    switch (entity.type) {
      case 'line':
      case 'circle':
      case 'arc':
      case 'rectangle':
      case 'polyline':
      case 'ellipse':
      case 'spline':
      case 'polygon':
      case 'path':
      case 'hatch':
        // Handle standard drawing entities
        this.moveEntityProperties(newEntity, entity, dx, dy);
        break;
        
      default:
        // Handle other entity types (dimensions, annotations, etc.)
        this.moveEntityProperties(newEntity, entity, dx, dy);
    }
    
    return newEntity as DrawingEntity;
  }
  
  /**
   * Helper method to move entity properties
   */
  private moveEntityProperties(newEntity: any, entity: any, dx: number, dy: number): void {
    // Handle common properties that entities might have
    if (entity.startPoint) {
      newEntity.startPoint = this.translatePoint(entity.startPoint, dx, dy);
    }
    
    if (entity.endPoint) {
      newEntity.endPoint = this.translatePoint(entity.endPoint, dx, dy);
    }
    
    if (entity.center) {
      newEntity.center = this.translatePoint(entity.center, dx, dy);
    }
    
    if (entity.position) {
      newEntity.position = this.translatePoint(entity.position, dx, dy);
    }
    
    if (entity.points) {
      newEntity.points = entity.points.map((p: Point) => this.translatePoint(p, dx, dy));
    }
    
    if (entity.boundary) {
      newEntity.boundary = entity.boundary.map((p: Point) => this.translatePoint(p, dx, dy));
    }
    
    if (entity.pointOnCircle) {
      newEntity.pointOnCircle = this.translatePoint(entity.pointOnCircle, dx, dy);
    }
    
    // Handle rectangle-specific properties
    if (entity.x !== undefined && entity.y !== undefined) {
      newEntity.x = entity.x + dx;
      newEntity.y = entity.y + dy;
    }
  }

  /**
   * Rotate an entity around a center point
   */
  rotateEntity(entity: DrawingEntity, center: Point, angle: number): DrawingEntity {
    const newEntity = { ...entity };
    
    switch (entity.type) {
      case 'line':
        newEntity.startPoint = this.rotatePoint(entity.startPoint, center, angle);
        newEntity.endPoint = this.rotatePoint(entity.endPoint, center, angle);
        break;
        
      case 'circle':
        newEntity.center = this.rotatePoint(entity.center, center, angle);
        break;
        
      case 'arc':
        newEntity.center = this.rotatePoint(entity.center, center, angle);
        // Adjust arc angles
        newEntity.startAngle = (entity.startAngle || 0) + angle;
        newEntity.endAngle = (entity.endAngle || 0) + angle;
        // Update start and end points if they exist
        if (entity.startPoint) {
          newEntity.startPoint = this.rotatePoint(entity.startPoint, center, angle);
        }
        if (entity.endPoint) {
          newEntity.endPoint = this.rotatePoint(entity.endPoint, center, angle);
        }
        break;
        
      case 'rectangle':
        // Get the four corners and rotate them
        const corners = [
          { x: entity.x, y: entity.y },
          { x: entity.x + entity.width, y: entity.y },
          { x: entity.x + entity.width, y: entity.y + entity.height },
          { x: entity.x, y: entity.y + entity.height }
        ].map(p => this.rotatePoint(p, center, angle));
        
        // If the rectangle has no rotation property yet, convert it to a polyline
        if (entity.rotation === undefined) {
          return {
            ...newEntity,
            type: 'polyline',
            points: corners,
            closed: true
          };
        }
        
        // If it already has rotation, just update it
        newEntity.rotation = (entity.rotation || 0) + angle;
        break;
        
      case 'polyline':
        if (entity.points) {
          newEntity.points = entity.points.map(p => this.rotatePoint(p, center, angle));
        }
        break;
        
      case 'text':
        newEntity.position = this.rotatePoint(entity.position, center, angle);
        newEntity.rotation = (entity.rotation || 0) + angle;
        break;
        
      case 'dimension-linear':
      case 'dimension-angular':
      case 'dimension-radius':
      case 'dimension-diameter':
        if (entity.startPoint) {
          newEntity.startPoint = this.rotatePoint(entity.startPoint, center, angle);
        }
        if (entity.endPoint) {
          newEntity.endPoint = this.rotatePoint(entity.endPoint, center, angle);
        }
        if (entity.center) {
          newEntity.center = this.rotatePoint(entity.center, center, angle);
        }
        if (entity.pointOnCircle) {
          newEntity.pointOnCircle = this.rotatePoint(entity.pointOnCircle, center, angle);
        }
        break;
        
      case 'leader':
        if (entity.points) {
          newEntity.points = entity.points.map(p => this.rotatePoint(p, center, angle));
        }
        break;
        
      case 'centermark':
        if (entity.center) {
          newEntity.center = this.rotatePoint(entity.center, center, angle);
        }
        break;
        
      case 'centerline':
        if (entity.startPoint) {
          newEntity.startPoint = this.rotatePoint(entity.startPoint, center, angle);
        }
        if (entity.endPoint) {
          newEntity.endPoint = this.rotatePoint(entity.endPoint, center, angle);
        }
        break;
        
      case 'hatch':
        if (entity.boundary) {
          newEntity.boundary = entity.boundary.map(p => this.rotatePoint(p, center, angle));
        }
        break;
    }
    
    return newEntity;
  }

  /**
   * Scale an entity from a center point
   */
  scaleEntity(entity: DrawingEntity, center: Point, scaleX: number, scaleY: number): DrawingEntity {
    const newEntity = { ...entity };
    
    switch (entity.type) {
      case 'line':
        newEntity.startPoint = this.scalePoint(entity.startPoint, center, scaleX, scaleY);
        newEntity.endPoint = this.scalePoint(entity.endPoint, center, scaleX, scaleY);
        break;
        
      case 'circle':
        newEntity.center = this.scalePoint(entity.center, center, scaleX, scaleY);
        // For uniform scaling, use the average of scaleX and scaleY
        const avgScale = (scaleX + scaleY) / 2;
        newEntity.radius = entity.radius * avgScale;
        break;
        
      case 'arc':
        newEntity.center = this.scalePoint(entity.center, center, scaleX, scaleY);
        // Scale radius
        newEntity.radius = entity.radius * ((scaleX + scaleY) / 2);
        // Update start and end points if they exist
        if (entity.startPoint) {
          newEntity.startPoint = this.scalePoint(entity.startPoint, center, scaleX, scaleY);
        }
        if (entity.endPoint) {
          newEntity.endPoint = this.scalePoint(entity.endPoint, center, scaleX, scaleY);
        }
        break;
        
      case 'rectangle':
        // If non-uniform scaling and the rectangle is rotated, convert to polyline
        if (scaleX !== scaleY && entity.rotation) {
          const corners = [
            { x: entity.x, y: entity.y },
            { x: entity.x + entity.width, y: entity.y },
            { x: entity.x + entity.width, y: entity.y + entity.height },
            { x: entity.x, y: entity.y + entity.height }
          ];
          
          // First rotate corners to handle the rotation
          const rotatedCorners = corners.map(p => 
            this.rotatePoint(p, { x: entity.x + entity.width/2, y: entity.y + entity.height/2 }, entity.rotation || 0)
          );
          
          // Then scale the rotated corners
          const scaledCorners = rotatedCorners.map(p => this.scalePoint(p, center, scaleX, scaleY));
          
          return {
            ...newEntity,
            type: 'polyline',
            points: scaledCorners,
            closed: true
          };
        }
        
        // For simple rectangles with no rotation
        const topLeft = this.scalePoint({ x: entity.x, y: entity.y }, center, scaleX, scaleY);
        const bottomRight = this.scalePoint(
          { x: entity.x + entity.width, y: entity.y + entity.height }, 
          center, 
          scaleX, 
          scaleY
        );
        
        newEntity.x = topLeft.x;
        newEntity.y = topLeft.y;
        newEntity.width = bottomRight.x - topLeft.x;
        newEntity.height = bottomRight.y - topLeft.y;
        break;
        
      case 'polyline':
        if (entity.points) {
          newEntity.points = entity.points.map(p => this.scalePoint(p, center, scaleX, scaleY));
        }
        break;
        
      case 'text':
        newEntity.position = this.scalePoint(entity.position, center, scaleX, scaleY);
        // Scale width and height if they exist
        if (entity.width) newEntity.width = entity.width * scaleX;
        if (entity.height) newEntity.height = entity.height * scaleY;
        break;
        
      case 'dimension-linear':
      case 'dimension-angular':
      case 'dimension-radius':
      case 'dimension-diameter':
        if (entity.startPoint) {
          newEntity.startPoint = this.scalePoint(entity.startPoint, center, scaleX, scaleY);
        }
        if (entity.endPoint) {
          newEntity.endPoint = this.scalePoint(entity.endPoint, center, scaleX, scaleY);
        }
        if (entity.center) {
          newEntity.center = this.scalePoint(entity.center, center, scaleX, scaleY);
        }
        if (entity.pointOnCircle) {
          newEntity.pointOnCircle = this.scalePoint(entity.pointOnCircle, center, scaleX, scaleY);
        }
        if (entity.offset) {
          newEntity.offset = entity.offset * ((scaleX + scaleY) / 2);
        }
        break;
        
      case 'leader':
        if (entity.points) {
          newEntity.points = entity.points.map(p => this.scalePoint(p, center, scaleX, scaleY));
        }
        break;
        
      case 'centermark':
        if (entity.center) {
          newEntity.center = this.scalePoint(entity.center, center, scaleX, scaleY);
        }
        if (entity.size) {
          newEntity.size = entity.size * ((scaleX + scaleY) / 2);
        }
        break;
        
      case 'centerline':
        if (entity.startPoint) {
          newEntity.startPoint = this.scalePoint(entity.startPoint, center, scaleX, scaleY);
        }
        if (entity.endPoint) {
          newEntity.endPoint = this.scalePoint(entity.endPoint, center, scaleX, scaleY);
        }
        break;
        
      case 'hatch':
        if (entity.boundary) {
          newEntity.boundary = entity.boundary.map(p => this.scalePoint(p, center, scaleX, scaleY));
        }
        if (entity.spacing) {
          newEntity.spacing = entity.spacing * ((scaleX + scaleY) / 2);
        }
        break;
    }
    
    return newEntity;
  }

  /**
   * Get the bounds of an entity
   */
  getEntityBounds(entity: DrawingEntity): { x: number, y: number, width: number, height: number } {
    let minX = Number.MAX_VALUE;
    let minY = Number.MAX_VALUE;
    let maxX = Number.MIN_VALUE;
    let maxY = Number.MIN_VALUE;
    
    const updateBounds = (point: Point) => {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    };
    
    switch (entity.type) {
      case 'line':
        updateBounds(entity.startPoint);
        updateBounds(entity.endPoint);
        break;
        
      case 'circle':
        updateBounds({ x: entity.center.x - entity.radius, y: entity.center.y - entity.radius });
        updateBounds({ x: entity.center.x + entity.radius, y: entity.center.y + entity.radius });
        break;
        
      case 'arc':
        // For simplicity, use the bounding rectangle of the full circle
        // A more accurate calculation would involve the actual arc angles
        updateBounds({ x: entity.center.x - entity.radius, y: entity.center.y - entity.radius });
        updateBounds({ x: entity.center.x + entity.radius, y: entity.center.y + entity.radius });
        break;
        
      case 'rectangle':
        updateBounds({ x: entity.x, y: entity.y });
        updateBounds({ x: entity.x + entity.width, y: entity.y + entity.height });
        break;
        
      case 'polyline':
        if (entity.points && entity.points.length > 0) {
          entity.points.forEach(updateBounds);
        }
        break;
        
      case 'text':
        updateBounds(entity.position);
        updateBounds({ 
          x: entity.position.x + (entity.width || 50), 
          y: entity.position.y + (entity.height || 20) 
        });
        break;
        
      // For other entity types, include their key points
      default:
        if (entity.center) updateBounds(entity.center);
        if (entity.startPoint) updateBounds(entity.startPoint);
        if (entity.endPoint) updateBounds(entity.endPoint);
        if (entity.points) entity.points.forEach(updateBounds);
        if (entity.boundary) entity.boundary.forEach(updateBounds);
    }
    
    // If no points were found, return a default tiny rect
    if (minX === Number.MAX_VALUE) {
      return { x: 0, y: 0, width: 1, height: 1 };
    }
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  /**
   * Helper function to translate a point
   */
  private translatePoint(point: Point, dx: number, dy: number): Point {
    return {
      x: point.x + dx,
      y: point.y + dy
    };
  }

  /**
   * Helper function to rotate a point around a center
   */
  private rotatePoint(point: Point, center: Point, angle: number): Point {
    const radians = angle * (Math.PI / 180);
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    
    // Translate point to origin
    const x = point.x - center.x;
    const y = point.y - center.y;
    
    // Rotate point and translate back
    return {
      x: x * cos - y * sin + center.x,
      y: x * sin + y * cos + center.y
    };
  }

  /**
   * Helper function to scale a point from a center
   */
  private scalePoint(point: Point, center: Point, scaleX: number, scaleY: number): Point {
    return {
      x: center.x + (point.x - center.x) * scaleX,
      y: center.y + (point.y - center.y) * scaleY
    };
  }
}

// Create and export a singleton instance
export const entityManager = new EntityManager(); 