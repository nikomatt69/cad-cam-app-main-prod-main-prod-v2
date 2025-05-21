import { 
  DrawingEntity, 
  Point, 
  SnapMode,
  LineEntity,
  CircleEntity,
  ArcEntity,
  RectangleEntity,
  PolylineEntity,
  EllipseEntity,
  // SplineEntity, // Add if specific spline snap points are needed beyond 'node'
  // PolygonEntity, // Add if specific polygon snap points are needed beyond 'center'/'node'
  // PathEntity, // Path snapping is complex, usually 'node' or 'nearest'
  TextAnnotation,
  LinearDimension,
  AngularDimension,
  RadialDimension,
  DiameterDimension,
  SymbolAnnotation, // For 'centermark', 'centerline' if they are symbols
  BaseDrawingEntity, // Fallback for basic properties
  Dimension,
  Annotation
} from '../../../../types/TechnicalDrawingTypes';

/**
 * Class responsible for handling snapping functionality
 */
export class SnapManager {
  private snapModes: SnapMode[] = ['endpoint', 'midpoint', 'center', 'quadrant', 'intersection', 'grid', 'nearest', 'node', 'tangent', 'perpendicular'];
  private enabled: boolean = true;
  private gridSize: number = 10;
  private snapDistance: number = 10; // Distance in pixels to snap
  private polarSnapEnabled: boolean = false;
  private polarSnapAngles: number[] = [15, 30, 45, 60, 90]; // Angles in degrees
  private lastSnapResult: { snapPoint: Point, snapMode: SnapMode } | null = null; // Added to store last snap result
  
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
    entities: (DrawingEntity | Dimension | Annotation)[], 
    viewportScale: number, 
    basePoint?: Point, 
    gridEnabled: boolean = true
  ): { snapPoint: Point, snapMode: SnapMode } | null {
    if (!this.enabled) {
      return null;
    }
    
    const adjustedSnapDistance = this.snapDistance / viewportScale;
    const snapCandidates: { point: Point, distance: number, mode: SnapMode }[] = [];
    
    if (gridEnabled && this.snapModes.includes('grid') && !basePoint) {
      const gridPoint = {
        x: Math.round(point.x / this.gridSize) * this.gridSize,
        y: Math.round(point.y / this.gridSize) * this.gridSize
      };
      const gridDistance = this.getDistance(point, gridPoint);
      if (gridDistance <= adjustedSnapDistance) {
        snapCandidates.push({ point: gridPoint, distance: gridDistance, mode: 'grid' });
      }
    }
    
    if (basePoint && this.polarSnapEnabled && this.snapModes.includes('polar')) {
      const polarPoint = this.getPolarSnapPoint(basePoint, point);
      if (polarPoint) {
        const polarDistance = this.getDistance(point, polarPoint);
        if (polarDistance <= adjustedSnapDistance) {
          snapCandidates.push({ point: polarPoint, distance: polarDistance, mode: 'polar' });
        }
      }
    }
    
    for (const entity of entities) {
      if (!entity.visible) continue;
      
      this.getEntitySnapPoints(entity).forEach(snapInfo => {
        if (this.snapModes.includes(snapInfo.mode)) {
          const distance = this.getDistance(point, snapInfo.point);
          if (distance <= adjustedSnapDistance) {
            snapCandidates.push({ point: snapInfo.point, distance: distance, mode: snapInfo.mode });
          }
        }
      });
      
      if (this.snapModes.includes('intersection')) {
        const intersections = this.findIntersections(entity, entities, point, adjustedSnapDistance);
        snapCandidates.push(...intersections);
      }
    }
    
    if (snapCandidates.length > 0) {
      snapCandidates.sort((a, b) => a.distance - b.distance);
      this.lastSnapResult = { snapPoint: snapCandidates[0].point, snapMode: snapCandidates[0].mode }; // Store result
      return this.lastSnapResult;
    }
    
    this.lastSnapResult = null; // Clear if no snap found
    return null;
  }
  
  /**
   * Get the last successful snap result
   */
  public getLastSnapResult(): { snapPoint: Point, snapMode: SnapMode } | null {
    return this.lastSnapResult;
  }
  
  /**
   * Get all potential snap points for an entity
   */
  private getEntitySnapPoints(entity: DrawingEntity | Dimension | Annotation): { point: Point, mode: SnapMode }[] {
    const snapPoints: { point: Point, mode: SnapMode }[] = [];
    
    switch (entity.type) {
      case 'line':
        const line = entity as LineEntity;
        snapPoints.push({ point: line.startPoint, mode: 'endpoint' });
        snapPoints.push({ point: line.endPoint, mode: 'endpoint' });
        snapPoints.push({ point: { x: (line.startPoint.x + line.endPoint.x) / 2, y: (line.startPoint.y + line.endPoint.y) / 2 }, mode: 'midpoint' });
        break;
        
      case 'circle':
        const circle = entity as CircleEntity;
        snapPoints.push({ point: circle.center, mode: 'center' });
        snapPoints.push({ point: { x: circle.center.x, y: circle.center.y - circle.radius }, mode: 'quadrant' });
        snapPoints.push({ point: { x: circle.center.x + circle.radius, y: circle.center.y }, mode: 'quadrant' });
        snapPoints.push({ point: { x: circle.center.x, y: circle.center.y + circle.radius }, mode: 'quadrant' });
        snapPoints.push({ point: { x: circle.center.x - circle.radius, y: circle.center.y }, mode: 'quadrant' });
        break;
        
      case 'arc':
        const arc = entity as ArcEntity;
        snapPoints.push({ point: arc.center, mode: 'center' });
        const startPoint = { x: arc.center.x + arc.radius * Math.cos(arc.startAngle), y: arc.center.y + arc.radius * Math.sin(arc.startAngle) };
        const endPoint = { x: arc.center.x + arc.radius * Math.cos(arc.endAngle), y: arc.center.y + arc.radius * Math.sin(arc.endAngle) };
        snapPoints.push({ point: startPoint, mode: 'endpoint' });
        snapPoints.push({ point: endPoint, mode: 'endpoint' });
        
        let midAngle = (arc.startAngle + arc.endAngle) / 2;
        // Adjust midAngle if arc crosses 0 radians and endAngle < startAngle
        if (arc.endAngle < arc.startAngle && !arc.counterclockwise) { // Clockwise arc crossing 0
            midAngle = (arc.startAngle + (arc.endAngle + 2 * Math.PI)) / 2;
        } else if (arc.endAngle > arc.startAngle && arc.counterclockwise === false) { // Normal clockwise arc
             // Standard midAngle is fine
        } else if (arc.endAngle < arc.startAngle && arc.counterclockwise === true) { // Counter-clockwise arc
            // Standard midAngle calculation should be fine if angles are consistently CCW from X-axis
        } else if (arc.endAngle > arc.startAngle && arc.counterclockwise === true && (arc.endAngle - arc.startAngle > Math.PI) ) {
            // Large CCW arc, midpoint might be on the shorter path if not careful
        }


        // Ensure midAngle is correctly on the arc path if it spans across 0
        const directMidAngle = (arc.startAngle + arc.endAngle) / 2;
        const span = Math.abs(arc.endAngle - arc.startAngle);
        if (span > Math.PI) { // If the shorter angle span is not direct
            if (arc.counterclockwise === false) { // Clockwise
                 midAngle = (arc.startAngle + arc.endAngle + 2*Math.PI) / 2;
                 if (midAngle > Math.PI *2) midAngle -= Math.PI*2;
            } else { // Counter-clockwise, this case is tricky for large arcs
                // Using directMidAngle might be okay if angles are consistently defined
            }
        }
         // Normalize angles for midpoint calculation if needed, this depends on how angles are stored (e.g. always positive, specific range)
        const effectiveStartAngle = arc.startAngle;
        let effectiveEndAngle = arc.endAngle;
        if (arc.counterclockwise === false && effectiveEndAngle > effectiveStartAngle) { // Clockwise defined with end > start
             effectiveEndAngle -= 2 * Math.PI;
        } else if (arc.counterclockwise !== false && effectiveEndAngle < effectiveStartAngle) { // Counter-clockwise defined with end < start
             effectiveEndAngle += 2 * Math.PI;
        }
        const finalMidAngle = (effectiveStartAngle + effectiveEndAngle) / 2;

        snapPoints.push({ point: { x: arc.center.x + arc.radius * Math.cos(finalMidAngle), y: arc.center.y + arc.radius * Math.sin(finalMidAngle) }, mode: 'midpoint' });
        break;
        
      case 'rectangle':
        const rect = entity as RectangleEntity;
        const { x: rx, y: ry } = rect.position;
        const { width: rw, height: rh, rotation: rr = 0 } = rect;
        const corners = [
          { x: rx, y: ry },
          { x: rx + rw, y: ry },
          { x: rx + rw, y: ry + rh },
          { x: rx, y: ry + rh }
        ];
        const centerRect = { x: rx + rw / 2, y: ry + rh / 2 };
        const rotatedCorners = rr !== 0 ? corners.map(p => this.rotatePoint(p, centerRect, rr)) : corners;

        rotatedCorners.forEach(c => snapPoints.push({ point: c, mode: 'endpoint' }));
        // Midpoints of sides
        for (let i = 0; i < rotatedCorners.length; i++) {
          const p1 = rotatedCorners[i];
          const p2 = rotatedCorners[(i + 1) % rotatedCorners.length];
          snapPoints.push({ point: { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 }, mode: 'midpoint' });
        }
        snapPoints.push({ point: centerRect, mode: 'center' }); // Center of the unrotated AABB
        if(rr !== 0) snapPoints.push({point: this.rotatePoint(centerRect, centerRect, rr), mode: 'center'}); // Geometric center if rotated

        break;
        
      case 'polyline':
        const polyline = entity as PolylineEntity;
        polyline.points.forEach(p => snapPoints.push({ point: p, mode: 'node' })); // 'node' for polyline vertices
        polyline.points.forEach(p => snapPoints.push({ point: p, mode: 'endpoint' })); // also treat as endpoints
        for (let i = 0; i < polyline.points.length - 1; i++) {
          snapPoints.push({ point: { x: (polyline.points[i].x + polyline.points[i+1].x) / 2, y: (polyline.points[i].y + polyline.points[i+1].y) / 2 }, mode: 'midpoint' });
        }
        if (polyline.closed && polyline.points.length > 1) {
            const lastPoint = polyline.points[polyline.points.length-1];
            const firstPoint = polyline.points[0];
             snapPoints.push({ point: { x: (lastPoint.x + firstPoint.x) / 2, y: (lastPoint.y + firstPoint.y) / 2 }, mode: 'midpoint' });
        }
        break;
        
      case 'ellipse':
        const ellipse = entity as EllipseEntity;
        snapPoints.push({point: ellipse.center, mode: 'center'});
        // Quadrant points for ellipse (more complex if rotated, for now axis-aligned)
        const rot = ellipse.rotation || 0; // assuming rotation in radians
        const cosR = Math.cos(rot);
        const sinR = Math.sin(rot);
        const {radiusX, radiusY, center: ec} = ellipse;
        // Points on the ellipse axes
        snapPoints.push({point: {x: ec.x + radiusX * cosR, y: ec.y + radiusX * sinR}, mode: 'quadrant'}); // Major axis
        snapPoints.push({point: {x: ec.x - radiusX * cosR, y: ec.y - radiusX * sinR}, mode: 'quadrant'}); // Major axis
        snapPoints.push({point: {x: ec.x - radiusY * sinR, y: ec.y + radiusY * cosR}, mode: 'quadrant'}); // Minor axis
        snapPoints.push({point: {x: ec.x + radiusY * sinR, y: ec.y - radiusY * cosR}, mode: 'quadrant'}); // Minor axis
        break;

      case 'text-annotation':
        const text = entity as TextAnnotation;
        snapPoints.push({ point: text.position, mode: 'endpoint' }); // Treat text anchor as an endpoint
        // Could add corners of bounding box if width/height are known and rotation is handled
        break;
        
      case 'linear-dimension':
        const linearDim = entity as LinearDimension;
        if (linearDim.startPoint) snapPoints.push({point: linearDim.startPoint, mode: 'endpoint'});
        if (linearDim.endPoint) snapPoints.push({point: linearDim.endPoint, mode: 'endpoint'});
        if (linearDim.textPosition) snapPoints.push({point: linearDim.textPosition, mode: 'node'}); // Snap to text anchor
        break;
      case 'angular-dimension':
        const angularDim = entity as AngularDimension;
        if (angularDim.vertex) snapPoints.push({point: angularDim.vertex, mode: 'endpoint'});
        if (angularDim.startPoint) snapPoints.push({point: angularDim.startPoint, mode: 'node'});
        if (angularDim.endPoint) snapPoints.push({point: angularDim.endPoint, mode: 'node'});
        break;
      case 'radial-dimension':
      case 'diameter-dimension':
        const radialOrDiaDim = entity as RadialDimension | DiameterDimension;
        if (radialOrDiaDim.center) snapPoints.push({point: radialOrDiaDim.center, mode: 'center'});
        if (radialOrDiaDim.pointOnCircle) snapPoints.push({point: radialOrDiaDim.pointOnCircle, mode: 'node'});
        break;
        
      case 'symbol-annotation':
        const symbol = entity as SymbolAnnotation;
        if(symbol.position) snapPoints.push({point: symbol.position, mode: 'center'}); // Treat symbol position as its center
        // Could add more based on symbolType if specific geometry is known
        break;
        
      // Default for other types or if specific snap points aren't defined above
      default:
        const baseEntity = entity as BaseDrawingEntity; // Fallback to base
        if ('center' in baseEntity && (baseEntity as any).center) {
            snapPoints.push({point: (baseEntity as any).center, mode: 'center'});
        } else if ('position' in baseEntity && (baseEntity as any).position) {
            snapPoints.push({point: (baseEntity as any).position, mode: 'node'});
        } else if ('points' in baseEntity && Array.isArray((baseEntity as any).points) && (baseEntity as any).points.length > 0) {
            (baseEntity as any).points.forEach((p: Point) => snapPoints.push({point: p, mode: 'node'}));
        }
        break;
    }
    return snapPoints;
  }
  
  /**
   * Find intersection points between an entity and all other entities
   */
  private findIntersections(
    entity: DrawingEntity | Dimension | Annotation, 
    allEntities: (DrawingEntity | Dimension | Annotation)[], 
    point: Point, // The cursor point, to filter intersections near it
    maxDistance: number // Max distance from cursor point to consider an intersection
  ): { point: Point, distance: number, mode: SnapMode }[] {
    const intersectionSnaps: { point: Point, distance: number, mode: SnapMode }[] = [];
    if (!this.snapModes.includes('intersection')) return intersectionSnaps;
    
    for (const otherEntity of allEntities) {
      if (entity.id === otherEntity.id || !otherEntity.visible) continue;
      
      const intersectionPoints = this.getIntersectionPoints(entity, otherEntity);
      for (const intPoint of intersectionPoints) {
        const distance = this.getDistance(point, intPoint);
        if (distance <= maxDistance) {
          intersectionSnaps.push({ point: intPoint, distance, mode: 'intersection' });
        }
      }
    }
    return intersectionSnaps;
  }
  
  /**
   * Get intersection points between two entities
   */
  private getIntersectionPoints(entity1: DrawingEntity | Dimension | Annotation, entity2: DrawingEntity | Dimension | Annotation): Point[] {
    const points: Point[] = [];
    
    // Line-Line
    if (entity1.type === 'line' && entity2.type === 'line') {
      const line1 = entity1 as LineEntity;
      const line2 = entity2 as LineEntity;
      const p = this.lineLineIntersection(line1.startPoint, line1.endPoint, line2.startPoint, line2.endPoint);
      if (p) points.push(p);
    }
    // Line-Circle / Circle-Line
    else if (entity1.type === 'line' && entity2.type === 'circle') {
      const line = entity1 as LineEntity;
      const circle = entity2 as CircleEntity;
      points.push(...this.lineCircleIntersection(line.startPoint, line.endPoint, circle.center, circle.radius));
    } else if (entity1.type === 'circle' && entity2.type === 'line') {
      const circle = entity1 as CircleEntity;
      const line = entity2 as LineEntity;
      points.push(...this.lineCircleIntersection(line.startPoint, line.endPoint, circle.center, circle.radius));
    }
    // Circle-Circle
    else if (entity1.type === 'circle' && entity2.type === 'circle') {
      const c1 = entity1 as CircleEntity;
      const c2 = entity2 as CircleEntity;
      points.push(...this.circleCircleIntersection(c1.center, c1.radius, c2.center, c2.radius));
    }
    // Line-Arc / Arc-Line (Approximation: treat arc as part of a circle for intersection)
    else if (entity1.type === 'line' && entity2.type === 'arc') {
        const line = entity1 as LineEntity;
        const arc = entity2 as ArcEntity;
        const intersections = this.lineCircleIntersection(line.startPoint, line.endPoint, arc.center, arc.radius);
        intersections.forEach(p => { if (this.isPointOnArc(p, arc)) points.push(p); });
    } else if (entity1.type === 'arc' && entity2.type === 'line') {
        const arc = entity1 as ArcEntity;
        const line = entity2 as LineEntity;
        const intersections = this.lineCircleIntersection(line.startPoint, line.endPoint, arc.center, arc.radius);
        intersections.forEach(p => { if (this.isPointOnArc(p, arc)) points.push(p); });
    }
    // Arc-Arc (Approximation: treat arcs as circles)
    else if (entity1.type === 'arc' && entity2.type === 'arc') {
        const arc1 = entity1 as ArcEntity;
        const arc2 = entity2 as ArcEntity;
        const intersections = this.circleCircleIntersection(arc1.center, arc1.radius, arc2.center, arc2.radius);
        intersections.forEach(p => { if (this.isPointOnArc(p, arc1) && this.isPointOnArc(p, arc2)) points.push(p); });
    }
    // Circle-Arc / Arc-Circle
    else if (entity1.type === 'circle' && entity2.type === 'arc') {
        const circle = entity1 as CircleEntity;
        const arc = entity2 as ArcEntity;
        const intersections = this.circleCircleIntersection(circle.center, circle.radius, arc.center, arc.radius);
        intersections.forEach(p => { if (this.isPointOnArc(p, arc)) points.push(p); });
    } else if (entity1.type === 'arc' && entity2.type === 'circle') {
        const arc = entity1 as ArcEntity;
        const circle = entity2 as CircleEntity;
        const intersections = this.circleCircleIntersection(arc.center, arc.radius, circle.center, circle.radius);
        intersections.forEach(p => { if (this.isPointOnArc(p, arc)) points.push(p); });
    }
    // TODO: Add more intersection types as needed (e.g., polyline intersections, rectangle intersections)

    return points;
  }
  
  /**
   * Calculate intersection of two line segments
   * Returns null if no intersection or segments are parallel
   */
  private lineLineIntersection(p1: Point, p2: Point, p3: Point, p4: Point): Point | null {
    const den = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
    if (den === 0) return null; // Parallel or coincident

    const t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / den;
    const u = -((p1.x - p2.x) * (p1.y - p3.y) - (p1.y - p2.y) * (p1.x - p3.x)) / den;
    
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
      return {
        x: p1.x + t * (p2.x - p1.x),
        y: p1.y + t * (p2.y - p1.y)
      };
    }
    return null; // Intersection point is outside the segments
  }
  
  /**
   * Calculate intersection points of a line segment and a circle
   */
  private lineCircleIntersection(p1: Point, p2: Point, center: Point, radius: number): Point[] {
    const points: Point[] = [];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const a = dx * dx + dy * dy;
    const b = 2 * (dx * (p1.x - center.x) + dy * (p1.y - center.y));
    const c = (p1.x - center.x) * (p1.x - center.x) + (p1.y - center.y) * (p1.y - center.y) - radius * radius;

    const det = b * b - 4 * a * c;
    if (a <= 0.0000001 || det < 0) { // No real solutions or not a line
      return points;
    } else if (det === 0) { // One solution (tangent)
      const t = -b / (2 * a);
      if (t >= 0 && t <= 1) {
        points.push({ x: p1.x + t * dx, y: p1.y + t * dy });
      }
    } else { // Two solutions
      const t1 = (-b + Math.sqrt(det)) / (2 * a);
      const t2 = (-b - Math.sqrt(det)) / (2 * a);
      if (t1 >= 0 && t1 <= 1) {
        points.push({ x: p1.x + t1 * dx, y: p1.y + t1 * dy });
      }
      if (t2 >= 0 && t2 <= 1) {
        points.push({ x: p1.x + t2 * dx, y: p1.y + t2 * dy });
      }
    }
    return points;
  }

  /**
   * Calculate intersection points of two circles
   */
  private circleCircleIntersection(c1: Point, r1: number, c2: Point, r2: number): Point[] {
    const points: Point[] = [];
    const d = Math.sqrt(Math.pow(c2.x - c1.x, 2) + Math.pow(c2.y - c1.y, 2));

    // Check for solvability
    if (d > r1 + r2 || d < Math.abs(r1 - r2) || d === 0 && r1 === r2) { // No solution or circles are identical/concentric with no intersection
        return points;
    }

    const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
    const h = Math.sqrt(Math.max(0, r1 * r1 - a * a)); // Ensure h is not NaN from negative sqrt
    const x2 = c1.x + a * (c2.x - c1.x) / d;
    const y2 = c1.y + a * (c2.y - c1.y) / d;

    points.push({
        x: x2 + h * (c2.y - c1.y) / d,
        y: y2 - h * (c2.x - c1.x) / d
    });

    if (d !== 0 && h !== 0) { // Second point if not tangent or same center
        points.push({
            x: x2 - h * (c2.y - c1.y) / d,
            y: y2 + h * (c2.x - c1.x) / d
        });
    }
    return points;
  }
  
  /**
   * Check if a point lies on an arc segment
   */
  private isPointOnArc(point: Point, arc: ArcEntity): boolean {
    const dx = point.x - arc.center.x;
    const dy = point.y - arc.center.y;
    const distSq = dx * dx + dy * dy;
    
    // Check if point is on the circle of the arc (within a small tolerance)
    if (Math.abs(distSq - arc.radius * arc.radius) > 0.001) { // Tolerance for float precision
        return false;
    }

    let angle = Math.atan2(dy, dx);
    if (angle < 0) angle += 2 * Math.PI; // Normalize to 0-2PI

    let startAngle = arc.startAngle;
    let endAngle = arc.endAngle;

    // Normalize angles to be in 0-2PI range for comparison
    while(startAngle < 0) startAngle += 2 * Math.PI;
    while(startAngle >= 2 * Math.PI) startAngle -= 2 * Math.PI;
    while(endAngle < 0) endAngle += 2 * Math.PI;
    while(endAngle >= 2 * Math.PI) endAngle -= 2 * Math.PI;
    
    if (arc.counterclockwise === false) { // Clockwise arc
        if (startAngle >= endAngle) { // Arc crosses 0 radians
            return (angle >= startAngle && angle <= 2 * Math.PI) || (angle >= 0 && angle <= endAngle);
        } else {
            return angle >= endAngle && angle <= startAngle; // Reversed check for clockwise
        }
    } else { // Counter-clockwise arc (default)
        if (startAngle <= endAngle) {
            return angle >= startAngle && angle <= endAngle;
        } else { // Arc crosses 0 radians
            return (angle >= startAngle && angle <= 2 * Math.PI) || (angle >= 0 && angle <= endAngle);
        }
    }
  }

  /**
   * Check if a point lies on a line segment
   */
  private isPointOnLineSegment(p: Point, a: Point, b: Point, tolerance: number = 0.001): boolean {
    const dAP = this.getDistance(a, p);
    const dPB = this.getDistance(p, b);
    const dAB = this.getDistance(a, b);
    return Math.abs(dAP + dPB - dAB) < tolerance;
  }
  
  /**
   * Get a snap point along polar tracking lines
   */
  private getPolarSnapPoint(base: Point, current: Point): Point | null {
    if (!this.polarSnapEnabled || this.polarSnapAngles.length === 0) return null;

    const dx = current.x - base.x;
    const dy = current.y - base.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return null;

    let angleRad = Math.atan2(dy, dx);
    let angleDeg = angleRad * 180 / Math.PI;
    if (angleDeg < 0) angleDeg += 360;

    let bestSnapAngleDeg: number | null = null;
    let minAngleDiff = Infinity;

    for (const polarAngle of this.polarSnapAngles) {
      const angleDiff = Math.abs(angleDeg - polarAngle) % 360; // Handle wrap around 360
      const diff = Math.min(angleDiff, 360 - angleDiff); // Find shorter way around circle

      if (diff < minAngleDiff && diff < 5) { // Snap within 5 degrees
        minAngleDiff = diff;
        bestSnapAngleDeg = polarAngle;
      }
    }
    
    // Also check for extension along the direct line (0 degree difference)
    const directAngleDiff = Math.abs(angleDeg - (Math.atan2(dy,dx) * 180 / Math.PI + 360)%360 )  % 360;
    const directDiff = Math.min(directAngleDiff, 360 - directAngleDiff);
     if (directDiff < minAngleDiff && directDiff < 1) { // Higher precision for direct line
        minAngleDiff = directDiff;
        bestSnapAngleDeg = (Math.atan2(dy,dx) * 180 / Math.PI + 360)%360;
    }


    if (bestSnapAngleDeg !== null) {
      const snapRad = bestSnapAngleDeg * Math.PI / 180;
      return {
        x: base.x + dist * Math.cos(snapRad),
        y: base.y + dist * Math.sin(snapRad)
      };
    }
    return null;
  }
  
  /**
   * Calculate distance between two points
   */
  private getDistance(p1: Point, p2: Point): number {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  }

  /**
   * Helper to rotate a point around a center (degrees)
   */
  private rotatePoint(point: Point, center: Point, angleDegrees: number): Point {
    const radians = angleDegrees * (Math.PI / 180);
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    const x = point.x - center.x;
    const y = point.y - center.y;
    return {
      x: x * cos - y * sin + center.x,
      y: x * sin + y * cos + center.y
    };
  }
}

// Create and export a singleton instance
export const snapManager = new SnapManager(); 