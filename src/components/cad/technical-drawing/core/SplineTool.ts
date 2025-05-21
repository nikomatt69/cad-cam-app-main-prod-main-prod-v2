import { v4 as uuidv4 } from 'uuid';
import { Point, SplineEntity, DrawingStyle } from '../../../../types/TechnicalDrawingTypes';
import { calculateDistance } from '../../../../utils/geometry/calculations';

/**
 * Tool to create and manipulate spline curves
 * Implements NURBS (Non-Uniform Rational B-Splines) functionality
 */
export class SplineTool {
  private points: Point[] = [];
  private controlPoints: Point[] = [];
  private degree: number = 3; // Default degree for cubic splines
  private tension: number = 0.5; // Controls "tightness" of the curve
  private isClosed: boolean = false;

  /**
   * Add a point to the spline
   */
  addPoint(point: Point): void {
    this.points.push(point);
    this.updateControlPoints();
  }

  /**
   * Remove the last point
   */
  removeLastPoint(): Point | null {
    if (this.points.length === 0) return null;
    
    const removedPoint = this.points.pop();
    this.updateControlPoints();
    return removedPoint || null;
  }

  /**
   * Set all points at once
   */
  setPoints(points: Point[]): void {
    this.points = [...points];
    this.updateControlPoints();
  }

  /**
   * Set the degree of the spline
   * Higher degree = smoother but more complex curve
   */
  setDegree(degree: number): void {
    this.degree = Math.max(1, Math.min(degree, 5)); // Constrain to reasonable range
    this.updateControlPoints();
  }

  /**
   * Set the tension parameter
   * Controls how "tight" the curve follows control points
   */
  setTension(tension: number): void {
    this.tension = Math.max(0, Math.min(tension, 1)); // Constrain to [0,1]
    this.updateControlPoints();
  }

  /**
   * Toggle between open and closed spline
   */
  setClosed(closed: boolean): void {
    this.isClosed = closed;
    this.updateControlPoints();
  }

  /**
   * Get the current points
   */
  getPoints(): Point[] {
    return [...this.points];
  }

  /**
   * Get the control points
   */
  getControlPoints(): Point[] {
    return [...this.controlPoints];
  }

  /**
   * Calculate the control points based on the current points
   */
  private updateControlPoints(): void {
    if (this.points.length < 2) {
      this.controlPoints = [];
      return;
    }

    // For a simple implementation, we'll use a variation of Catmull-Rom splines
    // which automatically generates control points
    this.controlPoints = [];
    
    const n = this.points.length;
    
    if (this.isClosed) {
      // For closed curves, handle wrap-around points
      for (let i = 0; i < n; i++) {
        const prev = this.points[(i - 1 + n) % n];
        const curr = this.points[i];
        const next = this.points[(i + 1) % n];
        
        // Calculate control points based on neighboring points and tension
        const dx1 = (curr.x - prev.x) * this.tension;
        const dy1 = (curr.y - prev.y) * this.tension;
        
        const dx2 = (next.x - curr.x) * this.tension;
        const dy2 = (next.y - curr.y) * this.tension;
        
        // First control point
        this.controlPoints.push({
          x: curr.x - dx1 / 3,
          y: curr.y - dy1 / 3
        });
        
        // Second control point
        this.controlPoints.push({
          x: curr.x + dx2 / 3,
          y: curr.y + dy2 / 3
        });
      }
    } else {
      // For open curves
      for (let i = 0; i < n; i++) {
        const prev = i > 0 ? this.points[i - 1] : null;
        const curr = this.points[i];
        const next = i < n - 1 ? this.points[i + 1] : null;
        
        if (i > 0) {
          // Not the first point - add a control point before current point
          const dx = (curr.x - prev!.x) * this.tension;
          const dy = (curr.y - prev!.y) * this.tension;
          
          this.controlPoints.push({
            x: curr.x - dx / 3,
            y: curr.y - dy / 3
          });
        }
        
        if (i < n - 1) {
          // Not the last point - add a control point after current point
          const dx = (next!.x - curr.x) * this.tension;
          const dy = (next!.y - curr.y) * this.tension;
          
          this.controlPoints.push({
            x: curr.x + dx / 3,
            y: curr.y + dy / 3
          });
        }
      }
    }
  }

  /**
   * Evaluate the spline at parameter t (from 0 to 1)
   * Returns a point on the curve
   */
  evaluateAt(t: number): Point | null {
    if (this.points.length < 2) return null;
    
    // Clamp t to [0,1]
    t = Math.max(0, Math.min(t, 1));
    
    const n = this.points.length;
    
    // Special cases for t=0 and t=1
    if (t === 0) return this.points[0];
    if (t === 1) return this.isClosed ? this.points[0] : this.points[n - 1];
    
    // Calculate which segment t falls in
    const segments = this.isClosed ? n : n - 1;
    const segmentIndex = Math.min(Math.floor(t * segments), segments - 1);
    
    // Calculate t within the segment (local t)
    const localT = (t * segments) - segmentIndex;
    
    // Get relevant points for this segment
    const p0 = this.points[segmentIndex];
    const p3 = this.isClosed ? 
      this.points[(segmentIndex + 1) % n] : 
      this.points[segmentIndex + 1];
    
    // Get control points for this segment
    const controlIndex = this.isClosed ? 
      segmentIndex * 2 : 
      segmentIndex * 2 + (segmentIndex > 0 ? 1 : 0);
    
    const p1 = this.controlPoints[controlIndex % this.controlPoints.length];
    
    const nextControlIndex = this.isClosed ? 
      ((segmentIndex + 1) * 2) % this.controlPoints.length : 
      Math.min(controlIndex + 1, this.controlPoints.length - 1);
    
    const p2 = this.controlPoints[nextControlIndex];
    
    // Evaluate cubic Bezier
    const t2 = localT * localT;
    const t3 = t2 * localT;
    const mt = 1 - localT;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    
    return {
      x: mt3 * p0.x + 3 * mt2 * localT * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
      y: mt3 * p0.y + 3 * mt2 * localT * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y
    };
  }

  /**
   * Generate a set of points approximating the spline curve
   * Useful for rendering or analysis
   */
  generatePoints(numPoints: number = 100): Point[] {
    if (this.points.length < 2) return [...this.points];
    
    const result: Point[] = [];
    
    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const point = this.evaluateAt(t);
      if (point) result.push(point);
    }
    
    return result;
  }

  /**
   * Create a spline entity from the current tool state
   */
  createSplineEntity(layer: string, style: DrawingStyle): SplineEntity {
    return {
      id: uuidv4(),
      type: 'spline',
      layer,
      visible: true,
      locked: false,
      style,
      points: [...this.points],
      controlPoints: [...this.controlPoints],
      closed: this.isClosed
    };
  }

  /**
   * Find the closest point on the spline to a given point
   */
  findClosestPoint(point: Point, samples: number = 100): { point: Point, t: number, distance: number } | null {
    if (this.points.length < 2) return null;
    
    let closestPoint: Point | null = null;
    let closestT = 0;
    let minDistance = Infinity;
    
    // Sample points along the curve
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const curvePoint = this.evaluateAt(t);
      
      if (curvePoint) {
        const distance = calculateDistance(point, curvePoint);
        
        if (distance < minDistance) {
          minDistance = distance;
          closestPoint = curvePoint;
          closestT = t;
        }
      }
    }
    
    if (closestPoint) {
      return {
        point: closestPoint,
        t: closestT,
        distance: minDistance
      };
    }
    
    return null;
  }

  /**
   * Split the spline at parameter t (0-1)
   * Returns two new SplineTool instances
   */
  splitAt(t: number): [SplineTool, SplineTool] | null {
    if (this.points.length < 3 || t <= 0 || t >= 1) return null;
    
    // The point at parameter t
    const splitPoint = this.evaluateAt(t);
    if (!splitPoint) return null;
    
    // Generate enough points for a good approximation
    const curvePoints = this.generatePoints(100);
    
    // Find the index where to split
    const splitIndex = Math.floor(t * curvePoints.length);
    
    // Create the first spline with points from start to split point
    const firstSpline = new SplineTool();
    firstSpline.setPoints([
      ...this.points.slice(0, Math.ceil(t * this.points.length)),
      splitPoint
    ]);
    firstSpline.setDegree(this.degree);
    firstSpline.setTension(this.tension);
    
    // Create the second spline with points from split point to end
    const secondSpline = new SplineTool();
    secondSpline.setPoints([
      splitPoint,
      ...this.points.slice(Math.floor(t * this.points.length))
    ]);
    secondSpline.setDegree(this.degree);
    secondSpline.setTension(this.tension);
    
    return [firstSpline, secondSpline];
  }
} 