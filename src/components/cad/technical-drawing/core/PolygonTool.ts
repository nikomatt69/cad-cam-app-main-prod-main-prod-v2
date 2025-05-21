import { v4 as uuidv4 } from 'uuid';
import { Point, PolygonEntity, DrawingStyle } from '../../../../types/TechnicalDrawingTypes';
import { rotatePoint } from '../../../../utils/geometry/transformations';

/**
 * Tool to create and manipulate regular polygons
 * Supports creating polygons with specified number of sides, radius and rotation
 */
export class PolygonTool {
  private center: Point = { x: 0, y: 0 };
  private radius: number = 50;
  private sides: number = 6;
  private rotation: number = 0;

  /**
   * Create a polygon tool with default values
   */
  constructor(center: Point = { x: 0, y: 0 }, radius: number = 50, sides: number = 6, rotation: number = 0) {
    this.center = center;
    this.radius = radius;
    this.sides = sides;
    this.rotation = rotation;
  }

  /**
   * Set the center point of the polygon
   */
  setCenter(center: Point): void {
    this.center = center;
  }

  /**
   * Set the radius of the polygon
   */
  setRadius(radius: number): void {
    this.radius = Math.max(0.1, radius);
  }

  /**
   * Set the number of sides for the polygon
   */
  setSides(sides: number): void {
    this.sides = Math.max(3, Math.floor(sides));
  }

  /**
   * Set the rotation angle of the polygon (in radians)
   */
  setRotation(rotation: number): void {
    this.rotation = rotation;
  }

  /**
   * Get the center point of the polygon
   */
  getCenter(): Point {
    return { ...this.center };
  }

  /**
   * Get the radius of the polygon
   */
  getRadius(): number {
    return this.radius;
  }

  /**
   * Get the number of sides of the polygon
   */
  getSides(): number {
    return this.sides;
  }

  /**
   * Get the rotation angle of the polygon
   */
  getRotation(): number {
    return this.rotation;
  }

  /**
   * Calculate the vertices of the polygon
   */
  calculateVertices(): Point[] {
    const vertices: Point[] = [];
    const angleStep = (2 * Math.PI) / this.sides;

    for (let i = 0; i < this.sides; i++) {
      const angle = i * angleStep + this.rotation;
      vertices.push({
        x: this.center.x + this.radius * Math.cos(angle),
        y: this.center.y + this.radius * Math.sin(angle)
      });
    }

    return vertices;
  }

  /**
   * Create a polygon entity from the current tool state
   */
  createPolygonEntity(layer: string, style: DrawingStyle): PolygonEntity {
    return {
      id: uuidv4(),
      type: 'polygon',
      layer,
      visible: true,
      locked: false,
      style,
      center: { ...this.center },
      radius: this.radius,
      sides: this.sides,
      rotation: this.rotation
    };
  }

  /**
   * Find the closest vertex to a given point
   */
  findClosestVertex(point: Point): { vertex: Point, index: number, distance: number } {
    const vertices = this.calculateVertices();
    let minDistance = Infinity;
    let closestVertex: Point = { x: 0, y: 0 };
    let closestIndex = -1;

    vertices.forEach((vertex, index) => {
      const dx = vertex.x - point.x;
      const dy = vertex.y - point.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < minDistance) {
        minDistance = distance;
        closestVertex = vertex;
        closestIndex = index;
      }
    });

    return {
      vertex: closestVertex,
      index: closestIndex,
      distance: minDistance
    };
  }

  /**
   * Calculate the area of the polygon
   */
  calculateArea(): number {
    const vertices = this.calculateVertices();
    // For a regular polygon: Area = (1/2) × n × r² × sin(2π/n)
    return 0.5 * this.sides * this.radius * this.radius * Math.sin(2 * Math.PI / this.sides);
  }

  /**
   * Calculate the perimeter of the polygon
   */
  calculatePerimeter(): number {
    // For a regular polygon: Perimeter = n × 2 × r × sin(π/n)
    return this.sides * 2 * this.radius * Math.sin(Math.PI / this.sides);
  }

  /**
   * Check if a point is inside the polygon
   */
  isPointInside(point: Point): boolean {
    const vertices = this.calculateVertices();
    let inside = false;
    
    // Ray casting algorithm
    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
      const xi = vertices[i].x;
      const yi = vertices[i].y;
      const xj = vertices[j].x;
      const yj = vertices[j].y;
      
      const intersect = ((yi > point.y) !== (yj > point.y)) &&
        (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
        
      if (intersect) inside = !inside;
    }
    
    return inside;
  }

  /**
   * Create an inscribed polygon (polygon inside a circle)
   */
  static createInscribed(center: Point, radius: number, sides: number, rotation: number = 0): PolygonTool {
    return new PolygonTool(center, radius, sides, rotation);
  }

  /**
   * Create a circumscribed polygon (polygon outside a circle)
   */
  static createCircumscribed(center: Point, radius: number, sides: number, rotation: number = 0): PolygonTool {
    // For a circumscribed polygon, we need to adjust the radius
    // The relation is: r_circumscribed = r_inscribed / cos(π/n)
    const adjustedRadius = radius / Math.cos(Math.PI / sides);
    return new PolygonTool(center, adjustedRadius, sides, rotation);
  }

  /**
   * Create a polygon that passes through a specific point at a specific index
   */
  static createThroughPoint(center: Point, throughPoint: Point, sides: number, vertexIndex: number = 0, rotation: number = 0): PolygonTool {
    // Calculate the radius from the center to the through point
    const dx = throughPoint.x - center.x;
    const dy = throughPoint.y - center.y;
    const radius = Math.sqrt(dx * dx + dy * dy);
    
    // Calculate the angle of the through point from the center
    const angleToPoint = Math.atan2(dy, dx);
    
    // Calculate the required rotation so that a vertex is at the through point
    const vertexAngle = (2 * Math.PI / sides) * vertexIndex;
    const requiredRotation = angleToPoint - vertexAngle;
    
    return new PolygonTool(center, radius, sides, requiredRotation);
  }
} 