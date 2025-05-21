import { v4 as uuidv4 } from 'uuid';
import {
  DrawingEntity,
  Point,
  DrawingStyle,
  LineEntity,
  CircleEntity,
  ArcEntity,
  RectangleEntity,
  PolylineEntity,
  EllipseEntity,
  SplineEntity,
  PolygonEntity,
  PathEntity,
  HatchEntity,
  TextAnnotation,
  LinearDimension,
  AngularDimension,
  RadialDimension,
  DiameterDimension,
  LeaderAnnotation,
  SymbolAnnotation,
  // Assuming Centermark and Centerline might be part of SymbolAnnotation or custom types
  // For now, handle them as BaseDrawingEntity if specific types aren't found,
  // or they might need their own definitions if they have unique properties for transformation.
  BaseDrawingEntity 
} from '../../../../types/TechnicalDrawingTypes';

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
      ...(entityData as any) // Spread as any to avoid type conflicts before final cast
    } as DrawingEntity; // Final cast to DrawingEntity
  }

  /**
   * Move an entity by a delta
   */
  moveEntity(entity: DrawingEntity | LinearDimension | AngularDimension | RadialDimension | DiameterDimension | LeaderAnnotation | SymbolAnnotation | TextAnnotation, dx: number, dy: number): DrawingEntity | LinearDimension | AngularDimension | RadialDimension | DiameterDimension | LeaderAnnotation | SymbolAnnotation | TextAnnotation {
    const newEntity = { ...entity } as any;
    // No type restriction on entity.type for the switch itself
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
      case 'text-annotation':
      case 'linear-dimension':
      case 'angular-dimension':
      case 'radial-dimension':
      case 'diameter-dimension':
      case 'leader-annotation':
      case 'symbol-annotation':
        this.moveEntityProperties(newEntity, entity, dx, dy);
        break;
      default:
        // Attempt to move common point properties for any other type
        this.moveEntityProperties(newEntity, entity, dx, dy);
    }
    return newEntity as DrawingEntity | LinearDimension | AngularDimension | RadialDimension | DiameterDimension | LeaderAnnotation | SymbolAnnotation | TextAnnotation;
  }
  
  /**
   * Helper method to move entity properties
   */
  private moveEntityProperties(newEntity: any, entity: any, dx: number, dy: number): void {
    if (entity.startPoint) newEntity.startPoint = this.translatePoint(entity.startPoint, dx, dy);
    if (entity.endPoint) newEntity.endPoint = this.translatePoint(entity.endPoint, dx, dy);
    if (entity.center) newEntity.center = this.translatePoint(entity.center, dx, dy);
    if (entity.position) newEntity.position = this.translatePoint(entity.position, dx, dy);
    if (entity.points && Array.isArray(entity.points)) {
      newEntity.points = entity.points.map((p: Point) => this.translatePoint(p, dx, dy));
    }
    if (entity.boundary && Array.isArray(entity.boundary)) {
      newEntity.boundary = entity.boundary.map((p: Point) => this.translatePoint(p, dx, dy));
    }
    if (entity.pointOnCircle) newEntity.pointOnCircle = this.translatePoint(entity.pointOnCircle, dx, dy);
    if (entity.vertex) newEntity.vertex = this.translatePoint(entity.vertex, dx, dy);
  }

  /**
   * Rotate an entity around a center point
   */
  rotateEntity(entity: DrawingEntity | LinearDimension | AngularDimension | RadialDimension | DiameterDimension | LeaderAnnotation | SymbolAnnotation | TextAnnotation, center: Point, angle: number): DrawingEntity | LinearDimension | AngularDimension | RadialDimension | DiameterDimension | LeaderAnnotation | SymbolAnnotation | TextAnnotation {
    let newEntity = { ...entity } as any;
    
    switch (entity.type) {
      case 'line':
        const lineEntity = entity as LineEntity;
        const newLineEntity = newEntity as LineEntity;
        newLineEntity.startPoint = this.rotatePoint(lineEntity.startPoint, center, angle);
        newLineEntity.endPoint = this.rotatePoint(lineEntity.endPoint, center, angle);
        break;
        
      case 'circle':
        const circleEntity = entity as CircleEntity;
        const newCircleEntity = newEntity as CircleEntity;
        newCircleEntity.center = this.rotatePoint(circleEntity.center, center, angle);
        break;
        
      case 'arc':
        const arcEntity = entity as ArcEntity;
        const newArcEntity = newEntity as ArcEntity;
        newArcEntity.center = this.rotatePoint(arcEntity.center, center, angle);
        newArcEntity.startAngle = (arcEntity.startAngle || 0) + angle; // Angles are in radians, rotation typically in degrees
        newArcEntity.endAngle = (arcEntity.endAngle || 0) + angle;   // Ensure angle units are consistent or convert
        break;
        
      case 'rectangle':
        const rectEntity = entity as RectangleEntity;
        let newRectEntityTransformed: PolylineEntity | RectangleEntity;

        if (rectEntity.rotation === undefined || rectEntity.rotation === 0) {
            // If not rotated, or rotation is 0, we can attempt to keep it a RectangleEntity
            // by rotating its center and keeping width/height, then updating rotation.
            // However, for simplicity and to always correctly represent arbitrary rotation, converting to polyline is safer.
            // For now, we will attempt to rotate its center and update its rotation property.
            const currentRectEntity = newEntity as RectangleEntity;
            const rectCenter = { x: rectEntity.position.x + rectEntity.width / 2, y: rectEntity.position.y + rectEntity.height / 2 };
            const rotatedRectCenter = this.rotatePoint(rectCenter, center, angle);
            currentRectEntity.position = { 
                x: rotatedRectCenter.x - rectEntity.width / 2, 
                y: rotatedRectCenter.y - rectEntity.height / 2 
            };
            currentRectEntity.rotation = (rectEntity.rotation || 0) + angle;
            newRectEntityTransformed = currentRectEntity;
        } else {
            // If already rotated, or to handle all cases uniformly by converting to polyline:
            const corners = [
              rectEntity.position,
              { x: rectEntity.position.x + rectEntity.width, y: rectEntity.position.y },
              { x: rectEntity.position.x + rectEntity.width, y: rectEntity.position.y + rectEntity.height },
              { x: rectEntity.position.x, y: rectEntity.position.y + rectEntity.height }
            ];
            // The center of rotation for the rectangle's own current rotation
            const selfRotationCenter = { x: rectEntity.position.x + rectEntity.width / 2, y: rectEntity.position.y + rectEntity.height / 2 };
            const currentRotatedCorners = corners.map(p => this.rotatePoint(p, selfRotationCenter, rectEntity.rotation || 0));
            // Then rotate these corners around the specified `center` for the operation
            const finalCorners = currentRotatedCorners.map(p => this.rotatePoint(p, center, angle));
            
            newRectEntityTransformed = {
                ...(newEntity as BaseDrawingEntity),
                type: 'polyline',
                points: finalCorners,
                closed: true,
                layer: rectEntity.layer,
                style: rectEntity.style,
            } as PolylineEntity;
            return newRectEntityTransformed; // Return early as type changed
        }
        newEntity = newRectEntityTransformed; // Assign back if not returned early
        break;
        
      case 'polyline':
        const polylineEntity = entity as PolylineEntity;
        const newPolylineEntity = newEntity as PolylineEntity;
        if (polylineEntity.points) {
          newPolylineEntity.points = polylineEntity.points.map((p: Point) => this.rotatePoint(p, center, angle));
        }
        break;
      
      case 'ellipse':
        const ellipseEntity = entity as EllipseEntity;
        const newEllipseEntity = newEntity as EllipseEntity;
        newEllipseEntity.center = this.rotatePoint(ellipseEntity.center, center, angle);
        newEllipseEntity.rotation = ((ellipseEntity.rotation || 0) * 180 / Math.PI + angle) * Math.PI / 180; // Assuming ellipse rotation is in radians
        break;

      case 'spline':
        const splineEntity = entity as SplineEntity;
        const newSplineEntity = newEntity as SplineEntity;
        if (splineEntity.points) {
          newSplineEntity.points = splineEntity.points.map((p: Point) => this.rotatePoint(p, center, angle));
        }
        if (splineEntity.controlPoints) {
          newSplineEntity.controlPoints = splineEntity.controlPoints.map((p: Point) => this.rotatePoint(p, center, angle));
        }
        break;
      
      case 'polygon':
        const polygonEntity = entity as PolygonEntity;
        const newPolygonEntity = newEntity as PolygonEntity;
        newPolygonEntity.center = this.rotatePoint(polygonEntity.center, center, angle);
        newPolygonEntity.rotation = ((polygonEntity.rotation || 0) * 180 / Math.PI + angle) * Math.PI / 180; // Assuming polygon rotation is in radians
        break;
      
      case 'path': 
        const pathEntity = entity as PathEntity;
        const newPathEntity = newEntity as PathEntity;
        if (pathEntity.startPoint) {
            newPathEntity.startPoint = this.rotatePoint(pathEntity.startPoint, center, angle);
        }
        break;

      case 'text-annotation':
        const textAnnotationEntity = entity as TextAnnotation;
        const newTextAnnotationEntity = newEntity as TextAnnotation;
        newTextAnnotationEntity.position = this.rotatePoint(textAnnotationEntity.position, center, angle);
        newTextAnnotationEntity.rotation = (textAnnotationEntity.rotation || 0) + angle; // Assuming text rotation is in degrees
        break;
        
      case 'linear-dimension':
        const linearDimEntity = entity as LinearDimension;
        const newLinearDimEntity = newEntity as LinearDimension;
        if (linearDimEntity.startPoint) newLinearDimEntity.startPoint = this.rotatePoint(linearDimEntity.startPoint, center, angle);
        if (linearDimEntity.endPoint) newLinearDimEntity.endPoint = this.rotatePoint(linearDimEntity.endPoint, center, angle);
        if (linearDimEntity.textPosition) newLinearDimEntity.textPosition = this.rotatePoint(linearDimEntity.textPosition, center, angle);
        newLinearDimEntity.angle = (linearDimEntity.angle || 0) + angle; // Assuming dimension angle is in degrees
        break;
      case 'angular-dimension':
        const angularDimEntity = entity as AngularDimension;
        const newAngularDimEntity = newEntity as AngularDimension;
        if (angularDimEntity.vertex) newAngularDimEntity.vertex = this.rotatePoint(angularDimEntity.vertex, center, angle);
        if (angularDimEntity.startPoint) newAngularDimEntity.startPoint = this.rotatePoint(angularDimEntity.startPoint, center, angle);
        if (angularDimEntity.endPoint) newAngularDimEntity.endPoint = this.rotatePoint(angularDimEntity.endPoint, center, angle);
        break;
      case 'radial-dimension':
        const radialDimEntity = entity as RadialDimension;
        const newRadialDimEntity = newEntity as RadialDimension;
        if (radialDimEntity.center) newRadialDimEntity.center = this.rotatePoint(radialDimEntity.center, center, angle);
        if (radialDimEntity.pointOnCircle) newRadialDimEntity.pointOnCircle = this.rotatePoint(radialDimEntity.pointOnCircle, center, angle);
        break;
      case 'diameter-dimension':
        const diameterDimEntity = entity as DiameterDimension;
        const newDiameterDimEntity = newEntity as DiameterDimension;
        if (diameterDimEntity.center) newDiameterDimEntity.center = this.rotatePoint(diameterDimEntity.center, center, angle);
        if (diameterDimEntity.pointOnCircle) newDiameterDimEntity.pointOnCircle = this.rotatePoint(diameterDimEntity.pointOnCircle, center, angle);
        break;
        
      case 'leader-annotation':
        const leaderAnnotationEntity = entity as LeaderAnnotation;
        const newLeaderAnnotationEntity = newEntity as LeaderAnnotation;
        if (leaderAnnotationEntity.points) newLeaderAnnotationEntity.points = leaderAnnotationEntity.points.map((p:Point) => this.rotatePoint(p, center, angle));
        if (leaderAnnotationEntity.startPoint) newLeaderAnnotationEntity.startPoint = this.rotatePoint(leaderAnnotationEntity.startPoint, center, angle);
        if (leaderAnnotationEntity.textPosition) newLeaderAnnotationEntity.textPosition = this.rotatePoint(leaderAnnotationEntity.textPosition, center, angle);
        break;
        
      case 'symbol-annotation': 
        const symbolEntity = entity as SymbolAnnotation;
        const newSymbolEntity = newEntity as SymbolAnnotation;
        if (symbolEntity.position) newSymbolEntity.position = this.rotatePoint(symbolEntity.position, center, angle);
        newSymbolEntity.rotation = (symbolEntity.rotation || 0) + angle; // Assuming symbol rotation is in degrees
        break;
        
      case 'hatch':
        const hatchEntity = entity as HatchEntity;
        const newHatchEntity = newEntity as HatchEntity;
        if (hatchEntity.boundary) newHatchEntity.boundary = hatchEntity.boundary.map((p: Point) => this.rotatePoint(p, center, angle));
        newHatchEntity.patternAngle = (hatchEntity.patternAngle || 0) + angle; // Assuming hatch angle is in degrees
        break;
    }
    return newEntity as DrawingEntity | LinearDimension | AngularDimension | RadialDimension | DiameterDimension | LeaderAnnotation | SymbolAnnotation | TextAnnotation;
  }

  /**
   * Scale an entity from a center point
   */
  scaleEntity(entity: DrawingEntity | LinearDimension | AngularDimension | RadialDimension | DiameterDimension | LeaderAnnotation | SymbolAnnotation | TextAnnotation, center: Point, scaleX: number, scaleY: number): DrawingEntity | LinearDimension | AngularDimension | RadialDimension | DiameterDimension | LeaderAnnotation | SymbolAnnotation | TextAnnotation {
    let newEntity = { ...entity } as any;
    
    switch (entity.type) {
      case 'line':
        const lineEntity = entity as LineEntity;
        const newLineEntity = newEntity as LineEntity;
        newLineEntity.startPoint = this.scalePoint(lineEntity.startPoint, center, scaleX, scaleY);
        newLineEntity.endPoint = this.scalePoint(lineEntity.endPoint, center, scaleX, scaleY);
        break;
        
      case 'circle':
        const circleEntity = entity as CircleEntity;
        const newCircleEntity = newEntity as CircleEntity;
        newCircleEntity.center = this.scalePoint(circleEntity.center, center, scaleX, scaleY);
        const avgScale = (scaleX + scaleY) / 2;
        newCircleEntity.radius = circleEntity.radius * avgScale;
        break;
        
      case 'arc':
        const arcEntity = entity as ArcEntity;
        const newArcEntity = newEntity as ArcEntity;
        newArcEntity.center = this.scalePoint(arcEntity.center, center, scaleX, scaleY);
        newArcEntity.radius = arcEntity.radius * ((scaleX + scaleY) / 2);
        break;
        
      case 'rectangle':
        const rectEntity = entity as RectangleEntity;
        let newRectEntityScaled: PolylineEntity | RectangleEntity;

        if (scaleX !== scaleY && rectEntity.rotation) {
          const corners = [
            rectEntity.position,
            { x: rectEntity.position.x + rectEntity.width, y: rectEntity.position.y },
            { x: rectEntity.position.x + rectEntity.width, y: rectEntity.position.y + rectEntity.height },
            { x: rectEntity.position.x, y: rectEntity.position.y + rectEntity.height }
          ];
          
          const rectRotCenter = { x: rectEntity.position.x + rectEntity.width/2, y: rectEntity.position.y + rectEntity.height/2 };
          const rotatedCorners = corners.map((p: Point) => this.rotatePoint(p, rectRotCenter, rectEntity.rotation || 0));
          const scaledCorners = rotatedCorners.map((p: Point) => this.scalePoint(p, center, scaleX, scaleY));
          
          newRectEntityScaled = {
            ...(newEntity as BaseDrawingEntity),
            type: 'polyline',
            points: scaledCorners,
            closed: true,
            layer: rectEntity.layer,
            style: rectEntity.style,
          } as PolylineEntity;
          return newRectEntityScaled; // Return early as type changed
        }
        
        const currentRectEntity = newEntity as RectangleEntity;
        const topLeft = this.scalePoint(rectEntity.position, center, scaleX, scaleY);
        const bottomRight = this.scalePoint(
          { x: rectEntity.position.x + rectEntity.width, y: rectEntity.position.y + rectEntity.height }, 
          center, 
          scaleX, 
          scaleY
        );
        currentRectEntity.position = topLeft;
        currentRectEntity.width = bottomRight.x - topLeft.x;
        currentRectEntity.height = bottomRight.y - topLeft.y;
        newEntity = currentRectEntity;
        break;
        
      case 'polyline':
        const polylineEntity = entity as PolylineEntity;
        const newPolylineEntity = newEntity as PolylineEntity;
        if (polylineEntity.points) {
          newPolylineEntity.points = polylineEntity.points.map((p: Point) => this.scalePoint(p, center, scaleX, scaleY));
        }
        break;

      case 'ellipse':
        const ellipseEntity = entity as EllipseEntity;
        const newEllipseEntity = newEntity as EllipseEntity;
        newEllipseEntity.center = this.scalePoint(ellipseEntity.center, center, scaleX, scaleY);
        newEllipseEntity.radiusX = ellipseEntity.radiusX * scaleX;
        newEllipseEntity.radiusY = ellipseEntity.radiusY * scaleY;
        break;

      case 'spline':
        const splineEntity = entity as SplineEntity;
        const newSplineEntity = newEntity as SplineEntity;
        if (splineEntity.points) newSplineEntity.points = splineEntity.points.map((p: Point) => this.scalePoint(p, center, scaleX, scaleY));
        if (splineEntity.controlPoints) newSplineEntity.controlPoints = splineEntity.controlPoints.map((p: Point) => this.scalePoint(p, center, scaleX, scaleY));
        break;
      
      case 'polygon':
        const polygonEntity = entity as PolygonEntity;
        const newPolygonEntity = newEntity as PolygonEntity;
        newPolygonEntity.center = this.scalePoint(polygonEntity.center, center, scaleX, scaleY);
        newPolygonEntity.radius = polygonEntity.radius * ((scaleX + scaleY) / 2);
        break;

      case 'path':
        const pathEntity = entity as PathEntity;
        const newPathEntity = newEntity as PathEntity;
        if (pathEntity.startPoint) newPathEntity.startPoint = this.scalePoint(pathEntity.startPoint, center, scaleX, scaleY);
        break;

      case 'text-annotation':
        const textAnnotationEntity = entity as TextAnnotation;
        const newTextAnnotationEntity = newEntity as TextAnnotation;
        newTextAnnotationEntity.position = this.scalePoint(textAnnotationEntity.position, center, scaleX, scaleY);
        if (textAnnotationEntity.width) newTextAnnotationEntity.width = textAnnotationEntity.width * scaleX;
        if (textAnnotationEntity.height) newTextAnnotationEntity.height = textAnnotationEntity.height * scaleY;
        if (textAnnotationEntity.style?.fontSize && newTextAnnotationEntity.style) {
             newTextAnnotationEntity.style.fontSize = textAnnotationEntity.style.fontSize * ((scaleX + scaleY) / 2);
        }
        break;
        
      case 'linear-dimension':
        const linearDimEntity = entity as LinearDimension;
        const newLinearDimEntity = newEntity as LinearDimension;
        if (linearDimEntity.startPoint) newLinearDimEntity.startPoint = this.scalePoint(linearDimEntity.startPoint, center, scaleX, scaleY);
        if (linearDimEntity.endPoint) newLinearDimEntity.endPoint = this.scalePoint(linearDimEntity.endPoint, center, scaleX, scaleY);
        if (linearDimEntity.textPosition) newLinearDimEntity.textPosition = this.scalePoint(linearDimEntity.textPosition, center, scaleX, scaleY);
        newLinearDimEntity.offsetDistance = linearDimEntity.offsetDistance * ((scaleY + scaleX) / 2); // scale offset uniformly
        break;
      case 'angular-dimension':
        const angularDimEntity = entity as AngularDimension;
        const newAngularDimEntity = newEntity as AngularDimension;
        if (angularDimEntity.vertex) newAngularDimEntity.vertex = this.scalePoint(angularDimEntity.vertex, center, scaleX, scaleY);
        if (angularDimEntity.startPoint) newAngularDimEntity.startPoint = this.scalePoint(angularDimEntity.startPoint, center, scaleX, scaleY);
        if (angularDimEntity.endPoint) newAngularDimEntity.endPoint = this.scalePoint(angularDimEntity.endPoint, center, scaleX, scaleY);
        if (angularDimEntity.radius) newAngularDimEntity.radius = angularDimEntity.radius * ((scaleX + scaleY) / 2);
        break;
      case 'radial-dimension':
        const radialDimEntity = entity as RadialDimension;
        const newRadialDimEntity = newEntity as RadialDimension;
        if (radialDimEntity.center) newRadialDimEntity.center = this.scalePoint(radialDimEntity.center, center, scaleX, scaleY);
        if (radialDimEntity.pointOnCircle) newRadialDimEntity.pointOnCircle = this.scalePoint(radialDimEntity.pointOnCircle, center, scaleX, scaleY);
        break;
      case 'diameter-dimension':
        const diameterDimEntity = entity as DiameterDimension;
        const newDiameterDimEntity = newEntity as DiameterDimension;
        if (diameterDimEntity.center) newDiameterDimEntity.center = this.scalePoint(diameterDimEntity.center, center, scaleX, scaleY);
        if (diameterDimEntity.pointOnCircle) newDiameterDimEntity.pointOnCircle = this.scalePoint(diameterDimEntity.pointOnCircle, center, scaleX, scaleY);
        break;
        
      case 'leader-annotation':
        const leaderAnnotationEntity = entity as LeaderAnnotation;
        const newLeaderAnnotationEntity = newEntity as LeaderAnnotation;
        if (leaderAnnotationEntity.points) newLeaderAnnotationEntity.points = leaderAnnotationEntity.points.map((p: Point) => this.scalePoint(p, center, scaleX, scaleY));
        if (leaderAnnotationEntity.startPoint) newLeaderAnnotationEntity.startPoint = this.scalePoint(leaderAnnotationEntity.startPoint, center, scaleX, scaleY);
        if (leaderAnnotationEntity.textPosition) newLeaderAnnotationEntity.textPosition = this.scalePoint(leaderAnnotationEntity.textPosition, center, scaleX, scaleY);
        break;
        
      case 'symbol-annotation':
        const symbolEntity = entity as SymbolAnnotation;
        const newSymbolEntity = newEntity as SymbolAnnotation;
        if (symbolEntity.position) newSymbolEntity.position = this.scalePoint(symbolEntity.position, center, scaleX, scaleY);
        if (symbolEntity.scale) newSymbolEntity.scale = symbolEntity.scale * ((scaleX + scaleY) / 2) ;
        break;
        
      case 'hatch':
        const hatchEntity = entity as HatchEntity;
        const newHatchEntity = newEntity as HatchEntity;
        if (hatchEntity.boundary) newHatchEntity.boundary = hatchEntity.boundary.map((p: Point) => this.scalePoint(p, center, scaleX, scaleY));
        if (hatchEntity.patternSpacing) newHatchEntity.patternSpacing = hatchEntity.patternSpacing * ((scaleX + scaleY) / 2);
        if (hatchEntity.patternScale) newHatchEntity.patternScale = hatchEntity.patternScale * ((scaleX + scaleY) / 2);
        break;
    }
    return newEntity as DrawingEntity | LinearDimension | AngularDimension | RadialDimension | DiameterDimension | LeaderAnnotation | SymbolAnnotation | TextAnnotation;
  }

  /**
   * Get the bounds of an entity
   */
  getEntityBounds(entity: DrawingEntity | LinearDimension | AngularDimension | RadialDimension | DiameterDimension | TextAnnotation | LeaderAnnotation | SymbolAnnotation ): { x: number, y: number, width: number, height: number } {
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
        const lineEntity = entity as LineEntity;
        updateBounds(lineEntity.startPoint);
        updateBounds(lineEntity.endPoint);
        break;
        
      case 'circle':
        const circleEntity = entity as CircleEntity;
        updateBounds({ x: circleEntity.center.x - circleEntity.radius, y: circleEntity.center.y - circleEntity.radius });
        updateBounds({ x: circleEntity.center.x + circleEntity.radius, y: circleEntity.center.y + circleEntity.radius });
        break;
        
      case 'arc':
        const arcEntity = entity as ArcEntity;
        const r = arcEntity.radius;
        const c = arcEntity.center;
        // Calculate points on the arc: start, end, and potentially mid-points or quadrant points
        const startRad = arcEntity.startAngle;
        const endRad = arcEntity.endAngle;
        updateBounds({ x: c.x + r * Math.cos(startRad), y: c.y + r * Math.sin(startRad) });
        updateBounds({ x: c.x + r * Math.cos(endRad), y: c.y + r * Math.sin(endRad) });

        // Check points at 0, 90, 180, 270 degrees if they fall within the arc span
        const anglesToCheck = [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2];
        let currentStart = startRad;
        let currentEnd = endRad;
        // Normalize angles to handle arcs that cross the 0-radian line
        if (currentEnd < currentStart) currentEnd += 2 * Math.PI;

        for (const angle of anglesToCheck) {
            let checkAngle = angle;
            // Ensure checkAngle is within a comparable range to currentStart/currentEnd
            while (checkAngle < currentStart) checkAngle += 2 * Math.PI;
            if (checkAngle >= currentStart && checkAngle <= currentEnd) {
                updateBounds({ x: c.x + r * Math.cos(angle), y: c.y + r * Math.sin(angle) });
            }
        }
        // If the arc is very small and doesn't cross a quadrant, the above might miss the extremities.
        // A robust solution involves checking derivatives or a set of sampled points along the arc.
        // For now, ensure the center is included if radius is 0 for a point-like arc.
        if (r === 0) updateBounds(c);
        break;
        
      case 'rectangle':
        const rectEntity = entity as RectangleEntity;
        if (rectEntity.rotation) {
            const corners = [
                rectEntity.position,
                { x: rectEntity.position.x + rectEntity.width, y: rectEntity.position.y },
                { x: rectEntity.position.x + rectEntity.width, y: rectEntity.position.y + rectEntity.height },
                { x: rectEntity.position.x, y: rectEntity.position.y + rectEntity.height }
            ];
            const rectCenter = { x: rectEntity.position.x + rectEntity.width / 2, y: rectEntity.position.y + rectEntity.height / 2 };
            corners.map((p: Point) => this.rotatePoint(p, rectCenter, rectEntity.rotation as number)).forEach(updateBounds);
        } else {
            updateBounds(rectEntity.position);
            updateBounds({ x: rectEntity.position.x + rectEntity.width, y: rectEntity.position.y + rectEntity.height });
        }
        break;
        
      case 'polyline':
        const polylineEntity = entity as PolylineEntity;
        if (polylineEntity.points && polylineEntity.points.length > 0) {
          polylineEntity.points.forEach(updateBounds);
        }
        break;
      
      case 'ellipse':
        const ellipseEntity = entity as EllipseEntity;
        const angleRad = ellipseEntity.rotation || 0;
        const cosA = Math.cos(angleRad);
        const sinA = Math.sin(angleRad);
        const {radiusX, radiusY, center} = ellipseEntity;
        // Parametric equations for ellipse bounds are complex when rotated.
        // Simplified bounding box based on rotated major/minor axes extent.
        const extX = Math.sqrt(Math.pow(radiusX * cosA, 2) + Math.pow(radiusY * sinA, 2));
        const extY = Math.sqrt(Math.pow(radiusX * sinA, 2) + Math.pow(radiusY * cosA, 2));
        updateBounds({ x: center.x - extX, y: center.y - extY });
        updateBounds({ x: center.x + extX, y: center.y + extY });
        break;

      case 'spline': 
        const splineEntity = entity as SplineEntity;
        if (splineEntity.points && splineEntity.points.length > 0) {
            splineEntity.points.forEach(updateBounds);
        }
        if (splineEntity.controlPoints && splineEntity.controlPoints.length > 0) {
            splineEntity.controlPoints.forEach(updateBounds); // Control points can define the hull
        }
        break;
      case 'polygon':
        const polygonEntity = entity as PolygonEntity;
        const angleStep = (2 * Math.PI) / polygonEntity.sides;
        const initialRotation = polygonEntity.rotation || 0;
        for (let i = 0; i < polygonEntity.sides; i++) {
            const angle = initialRotation + i * angleStep;
            updateBounds({
                x: polygonEntity.center.x + polygonEntity.radius * Math.cos(angle),
                y: polygonEntity.center.y + polygonEntity.radius * Math.sin(angle)
            });
        }
        break;
      case 'path': 
        const pathEntity = entity as PathEntity;
        if (pathEntity.startPoint) updateBounds(pathEntity.startPoint); 
        // True path bounds require parsing SVG path data, which is complex.
        // Fallback to a small area around startPoint if only that is available.
        if (pathEntity.startPoint && (minX === Number.MAX_VALUE)) {
            updateBounds({x: pathEntity.startPoint.x + 1, y: pathEntity.startPoint.y + 1});
        }
        break;

      case 'text-annotation':
        const textAnnotationEntity = entity as TextAnnotation;
        const textPos = textAnnotationEntity.position;
        const textRotation = textAnnotationEntity.rotation || 0;
        const approxWidth = textAnnotationEntity.width || (textAnnotationEntity.text.length * (textAnnotationEntity.style?.fontSize || 12) * 0.6);
        const approxHeight = textAnnotationEntity.height || (textAnnotationEntity.style?.fontSize || 12);
        const corners = [
            textPos,
            { x: textPos.x + approxWidth, y: textPos.y },
            { x: textPos.x + approxWidth, y: textPos.y + approxHeight },
            { x: textPos.x, y: textPos.y + approxHeight }
        ];
        const textCenter = { x: textPos.x + approxWidth / 2, y: textPos.y + approxHeight / 2 };
        corners.map((p: Point) => this.rotatePoint(p, textCenter, textRotation)).forEach(updateBounds);
        break;
      
      case 'hatch':
        const hatchEntity = entity as HatchEntity;
        if (hatchEntity.boundary && hatchEntity.boundary.length > 0) {
            hatchEntity.boundary.forEach(updateBounds);
        }
        break;
        
      default:
        const currentEntity = entity as any; 
        if (currentEntity.position) updateBounds(currentEntity.position);
        else if (currentEntity.center) updateBounds(currentEntity.center);
        else if (currentEntity.startPoint) updateBounds(currentEntity.startPoint);
        
        if (currentEntity.points && Array.isArray(currentEntity.points)) currentEntity.points.forEach((p: Point) => updateBounds(p));
        if (currentEntity.boundary && Array.isArray(currentEntity.boundary)) currentEntity.boundary.forEach((p: Point) => updateBounds(p));
        if (currentEntity.vertex) updateBounds(currentEntity.vertex);
        if (currentEntity.pointOnCircle) updateBounds(currentEntity.pointOnCircle);
    }
    
    if (minX === Number.MAX_VALUE || minY === Number.MAX_VALUE || maxX === Number.MIN_VALUE || maxY === Number.MIN_VALUE) {
      const posEntity = entity as ({ position?: Point, center?: Point, startPoint?: Point } & BaseDrawingEntity);
      let fallbackPoint: Point | undefined = posEntity.position || posEntity.center || posEntity.startPoint;

      if (fallbackPoint) {
          updateBounds(fallbackPoint);
          updateBounds({x: fallbackPoint.x +1, y: fallbackPoint.y +1}); 
      } else {
          return { x: 0, y: 0, width: 1, height: 1 }; 
      }
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