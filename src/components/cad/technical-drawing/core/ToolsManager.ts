import { v4 as uuidv4 } from 'uuid';
import { DrawingEntity, Point, DrawingTool } from '../../../../types/TechnicalDrawingTypes';
import { useTechnicalDrawingStore } from '../../../../store/technicalDrawingStore';

/**
 * Class representing a drawing tool manager
 */
export class ToolsManager {
  private currentTool: DrawingTool = 'select';
  private toolState: any = {};
  private lastPoint: Point | null = null;
  private isDrawing: boolean = false;
  private startPoint: Point | null = null;
  private tempEntity: DrawingEntity | null = null;
  private snapEnabled: boolean = true;
  private orthoMode: boolean = false;
  
  /**
   * Constructor
   */
  constructor() {
    this.resetToolState();
  }
  
  /**
   * Set the current drawing tool
   */
  setTool(tool: DrawingTool): void {
    this.currentTool = tool;
    this.resetToolState();
  }
  
  /**
   * Get the current drawing tool
   */
  getCurrentTool(): DrawingTool {
    return this.currentTool;
  }
  
  /**
   * Reset the tool state
   */
  resetToolState(): void {
    this.toolState = {};
    this.lastPoint = null;
    this.isDrawing = false;
    this.startPoint = null;
    this.tempEntity = null;
  }
  
  /**
   * Enable or disable snap
   */
  setSnapEnabled(enabled: boolean): void {
    this.snapEnabled = enabled;
  }
  
  /**
   * Enable or disable ortho mode
   */
  setOrthoMode(enabled: boolean): void {
    this.orthoMode = enabled;
  }
  
  /**
   * Handle mouse down event
   */
  handleMouseDown(
    e: React.MouseEvent<HTMLCanvasElement>,
    worldPoint: Point,
    ctxInfo: { ctx: CanvasRenderingContext2D, pan: Point, zoom: number }
  ): void {
    // Get the technical drawing store actions
    const { addEntity, updateTempEntity, setTempEntity, addSnapPoint, updateEntity, selectEntity, clearSelection, addToSelection } = useTechnicalDrawingStore.getState();
    
    // Get snapped point if snap is enabled
    const point = this.snapEnabled ? this.getSnapPoint(worldPoint) : worldPoint;
    
    // Handle mouse down based on current tool
    switch (this.currentTool) {
      case 'select':
        // Check if clicked on an entity and select it
        const entityId = this.getEntityAtPoint(point);
        if (entityId) {
          if (e.ctrlKey || e.metaKey) {
            // Add to selection if Ctrl/Cmd is pressed
            addToSelection(entityId);
          } else {
            // Select only this entity
            clearSelection();
            selectEntity(entityId);
          }
          
          // Store the entity for potential movement
          this.toolState.selectedEntityId = entityId;
          this.toolState.moveStartPoint = { ...point };
        } else {
          // Clicked empty space, start selection rectangle
          clearSelection();
          this.toolState.selectionStart = { ...point };
          this.toolState.selecting = true;
        }
        break;
        
      case 'line':
        if (!this.isDrawing) {
          // Start drawing a line
          this.isDrawing = true;
          this.startPoint = { ...point };
          
          // Create a temporary line entity
          const tempLine: DrawingEntity = {
            id: 'temp',
            type: 'line',
            layer: 'default',
            visible: true,
            locked: false,
            style: {
              strokeColor: '#000000',
              strokeWidth: 0.5,
              strokeStyle: 'solid'
            },
            startPoint: { ...point },
            endPoint: { ...point }
          };
          
          setTempEntity(tempLine);
          addSnapPoint(point);
        } else {
          // Finish the line
          this.isDrawing = false;
          
          if (this.startPoint) {
            // Create a permanent line entity
            const line: DrawingEntity = {
              id: uuidv4(),
              type: 'line',
              layer: 'default',
              visible: true,
              locked: false,
              style: {
                strokeColor: '#000000',
                strokeWidth: 0.5,
                strokeStyle: 'solid'
              },
              startPoint: { ...this.startPoint },
              endPoint: { ...point }
            };
            
            addEntity(line);
            setTempEntity(null);
            
            // Start a new line from this point
            this.isDrawing = true;
            this.startPoint = { ...point };
            
            const newTempLine: DrawingEntity = {
              id: 'temp',
              type: 'line',
              layer: 'default',
              visible: true,
              locked: false,
              style: {
                strokeColor: '#000000',
                strokeWidth: 0.5,
                strokeStyle: 'solid'
              },
              startPoint: { ...point },
              endPoint: { ...point }
            };
            
            setTempEntity(newTempLine);
          }
        }
        break;
        
      case 'circle':
        if (!this.isDrawing) {
          // Start drawing a circle
          this.isDrawing = true;
          this.startPoint = { ...point };
          
          // Create a temporary circle entity
          const tempCircle: DrawingEntity = {
            id: 'temp',
            type: 'circle',
            layer: 'default',
            visible: true,
            locked: false,
            style: {
              strokeColor: '#000000',
              strokeWidth: 0.5,
              strokeStyle: 'solid'
            },
            center: { ...point },
            radius: 0
          };
          
          setTempEntity(tempCircle);
          addSnapPoint(point);
        } else {
          // Finish the circle
          this.isDrawing = false;
          
          if (this.startPoint) {
            // Calculate radius
            const dx = point.x - this.startPoint.x;
            const dy = point.y - this.startPoint.y;
            const radius = Math.sqrt(dx * dx + dy * dy);
            
            // Create a permanent circle entity
            const circle: DrawingEntity = {
              id: uuidv4(),
              type: 'circle',
              layer: 'default',
              visible: true,
              locked: false,
              style: {
                strokeColor: '#000000',
                strokeWidth: 0.5,
                strokeStyle: 'solid'
              },
              center: { ...this.startPoint },
              radius
            };
            
            addEntity(circle);
            setTempEntity(null);
          }
        }
        break;
        
      case 'rectangle':
        if (!this.isDrawing) {
          // Start drawing a rectangle
          this.isDrawing = true;
          this.startPoint = { ...point };
          
          // Create a temporary rectangle entity
          const tempRect: DrawingEntity = {
            id: 'temp',
            type: 'rectangle',
            layer: 'default',
            visible: true,
            locked: false,
            style: {
              strokeColor: '#000000',
              strokeWidth: 0.5,
              strokeStyle: 'solid'
            },
            x: point.x,
            y: point.y,
            width: 0,
            height: 0
          };
          
          setTempEntity(tempRect);
          addSnapPoint(point);
        } else {
          // Finish the rectangle
          this.isDrawing = false;
          
          if (this.startPoint) {
            // Calculate width and height
            const width = point.x - this.startPoint.x;
            const height = point.y - this.startPoint.y;
            
            // Determine top-left corner
            const x = width >= 0 ? this.startPoint.x : point.x;
            const y = height >= 0 ? this.startPoint.y : point.y;
            
            // Create a permanent rectangle entity
            const rect: DrawingEntity = {
              id: uuidv4(),
              type: 'rectangle',
              layer: 'default',
              visible: true,
              locked: false,
              style: {
                strokeColor: '#000000',
                strokeWidth: 0.5,
                strokeStyle: 'solid'
              },
              x,
              y,
              width: Math.abs(width),
              height: Math.abs(height)
            };
            
            addEntity(rect);
            setTempEntity(null);
          }
        }
        break;
      
      case 'arc':
        if (!this.toolState.arcStep) {
          // First point - center
          this.toolState.arcStep = 1;
          this.toolState.arcCenter = { ...point };
          
          // Create temporary arc entity
          const tempArc: DrawingEntity = {
            id: 'temp',
            type: 'arc',
            layer: 'default',
            visible: true,
            locked: false,
            style: {
              strokeColor: '#000000',
              strokeWidth: 0.5,
              strokeStyle: 'solid'
            },
            center: { ...point },
            radius: 0,
            startAngle: 0,
            endAngle: Math.PI * 2
          };
          
          setTempEntity(tempArc);
          addSnapPoint(point);
        } else if (this.toolState.arcStep === 1) {
          // Second point - radius and start angle
          this.toolState.arcStep = 2;
          
          // Calculate radius and start angle
          const dx = point.x - this.toolState.arcCenter.x;
          const dy = point.y - this.toolState.arcCenter.y;
          const radius = Math.sqrt(dx * dx + dy * dy);
          const startAngle = Math.atan2(dy, dx);
          
          this.toolState.arcRadius = radius;
          this.toolState.arcStartAngle = startAngle;
          
          // Update temporary arc
          updateTempEntity({
            radius,
            startAngle,
            endAngle: startAngle
          });
          
          addSnapPoint(point);
        } else {
          // Third point - end angle and finish
          // Calculate end angle
          const dx = point.x - this.toolState.arcCenter.x;
          const dy = point.y - this.toolState.arcCenter.y;
          let endAngle = Math.atan2(dy, dx);
          
          // Create permanent arc entity
          const arc: DrawingEntity = {
            id: uuidv4(),
            type: 'arc',
            layer: 'default',
            visible: true,
            locked: false,
            style: {
              strokeColor: '#000000',
              strokeWidth: 0.5,
              strokeStyle: 'solid'
            },
            center: { ...this.toolState.arcCenter },
            radius: this.toolState.arcRadius,
            startAngle: this.toolState.arcStartAngle,
            endAngle: endAngle,
            startPoint: {
              x: this.toolState.arcCenter.x + Math.cos(this.toolState.arcStartAngle) * this.toolState.arcRadius,
              y: this.toolState.arcCenter.y + Math.sin(this.toolState.arcStartAngle) * this.toolState.arcRadius
            },
            endPoint: {
              x: this.toolState.arcCenter.x + Math.cos(endAngle) * this.toolState.arcRadius,
              y: this.toolState.arcCenter.y + Math.sin(endAngle) * this.toolState.arcRadius
            }
          };
          
          addEntity(arc);
          setTempEntity(null);
          
          // Reset arc drawing state
          this.toolState.arcStep = 0;
          this.toolState.arcCenter = null;
          this.toolState.arcRadius = 0;
          this.toolState.arcStartAngle = 0;
        }
        break;
        
      case 'polyline':
        if (!this.toolState.polylinePoints) {
          // Start a new polyline
          this.toolState.polylinePoints = [{ ...point }];
          
          // Create a temporary polyline entity
          const tempPolyline: DrawingEntity = {
            id: 'temp',
            type: 'polyline',
            layer: 'default',
            visible: true,
            locked: false,
            style: {
              strokeColor: '#000000',
              strokeWidth: 0.5,
              strokeStyle: 'solid'
            },
            points: [...this.toolState.polylinePoints],
            closed: false
          };
          
          setTempEntity(tempPolyline);
          addSnapPoint(point);
        } else {
          // Check if this point is close to the first point to close the polyline
          const firstPoint = this.toolState.polylinePoints[0];
          const dx = point.x - firstPoint.x;
          const dy = point.y - firstPoint.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (this.toolState.polylinePoints.length > 2 && dist < 10 / ctxInfo.zoom) {
            // Close the polyline
            this.toolState.polylinePoints.push({ ...firstPoint });
            
            // Create a permanent polyline entity
            const polyline: DrawingEntity = {
              id: uuidv4(),
              type: 'polyline',
              layer: 'default',
              visible: true,
              locked: false,
              style: {
                strokeColor: '#000000',
                strokeWidth: 0.5,
                strokeStyle: 'solid'
              },
              points: [...this.toolState.polylinePoints],
              closed: true
            };
            
            addEntity(polyline);
            setTempEntity(null);
            
            // Reset polyline drawing state
            this.toolState.polylinePoints = null;
          } else {
            // Add point to polyline
            this.toolState.polylinePoints.push({ ...point });
            
            // Update temporary polyline
            updateTempEntity({
              points: [...this.toolState.polylinePoints]
            });
            
            addSnapPoint(point);
          }
        }
        break;
        
      case 'move':
        // Start moving selected entities
        const selectedIds = useTechnicalDrawingStore.getState().selectedEntityIds;
        if (selectedIds.length > 0) {
          this.toolState.moveStartPoint = { ...point };
          this.toolState.moving = true;
          this.toolState.selectedEntities = selectedIds.map(id => ({
            id,
            entity: { ...useTechnicalDrawingStore.getState().entities[id] }
          }));
        }
        break;
        
      // Add more tools as needed
      
      default:
        console.warn(`Unhandled tool in mouse down: ${this.currentTool}`);
    }
    
    this.lastPoint = { ...point };
  }
  
  /**
   * Handle mouse move event
   */
  handleMouseMove(
    e: React.MouseEvent<HTMLCanvasElement>,
    worldPoint: Point,
    ctxInfo: { ctx: CanvasRenderingContext2D, pan: Point, zoom: number }
  ): void {
    // Get the technical drawing store actions
    const { updateTempEntity, clearSnapPoints, addSnapPoint, moveSelectedEntities } = useTechnicalDrawingStore.getState();
    
    // Get snapped point if snap is enabled
    const point = this.snapEnabled ? this.getSnapPoint(worldPoint) : worldPoint;
    
    // Handle mouse move based on current tool
    switch (this.currentTool) {
      case 'select':
        if (this.toolState.selecting) {
          // Update selection rectangle
          const selectionRect = {
            x: Math.min(this.toolState.selectionStart.x, point.x),
            y: Math.min(this.toolState.selectionStart.y, point.y),
            width: Math.abs(point.x - this.toolState.selectionStart.x),
            height: Math.abs(point.y - this.toolState.selectionStart.y)
          };
          
          updateTempEntity({
            id: 'temp',
            type: 'selection-rect',
            layer: 'ui',
            visible: true,
            locked: false,
            style: {
              strokeColor: '#0088FF',
              strokeWidth: 1,
              strokeStyle: 'dashed',
              fillColor: 'rgba(0, 136, 255, 0.1)'
            },
            ...selectionRect
          });
        } else if (this.toolState.selectedEntityId && this.toolState.moveStartPoint) {
          // Move the selected entity
          const dx = point.x - this.toolState.moveStartPoint.x;
          const dy = point.y - this.toolState.moveStartPoint.y;
          
          if (dx !== 0 || dy !== 0) {
            moveSelectedEntities(dx, dy);
            this.toolState.moveStartPoint = { ...point };
          }
        }
        break;
        
      case 'line':
        if (this.isDrawing && this.startPoint) {
          // Update the temporary line
          let endPoint = { ...point };
          
          // Apply ortho mode if enabled
          if (this.orthoMode) {
            endPoint = this.getOrthoPoint(this.startPoint, point);
          }
          
          updateTempEntity({
            endPoint
          });
        }
        break;
        
      case 'circle':
        if (this.isDrawing && this.startPoint) {
          // Calculate radius
          const dx = point.x - this.startPoint.x;
          const dy = point.y - this.startPoint.y;
          const radius = Math.sqrt(dx * dx + dy * dy);
          
          // Update the temporary circle
          updateTempEntity({
            radius
          });
        }
        break;
        
      case 'rectangle':
        if (this.isDrawing && this.startPoint) {
          // Calculate width and height
          let width = point.x - this.startPoint.x;
          let height = point.y - this.startPoint.y;
          
          // Apply ortho mode if enabled
          if (this.orthoMode) {
            // Make the rectangle a square
            const size = Math.max(Math.abs(width), Math.abs(height));
            width = width >= 0 ? size : -size;
            height = height >= 0 ? size : -size;
          }
          
          // Update the temporary rectangle
          updateTempEntity({
            width,
            height
          });
        }
        break;
        
      case 'arc':
        if (this.toolState.arcStep === 1) {
          // Update arc radius and start angle
          const dx = point.x - this.toolState.arcCenter.x;
          const dy = point.y - this.toolState.arcCenter.y;
          const radius = Math.sqrt(dx * dx + dy * dy);
          const startAngle = Math.atan2(dy, dx);
          
          updateTempEntity({
            radius,
            startAngle,
            endAngle: startAngle
          });
        } else if (this.toolState.arcStep === 2) {
          // Update arc end angle
          const dx = point.x - this.toolState.arcCenter.x;
          const dy = point.y - this.toolState.arcCenter.y;
          const endAngle = Math.atan2(dy, dx);
          
          updateTempEntity({
            endAngle
          });
        }
        break;
        
      case 'polyline':
        if (this.toolState.polylinePoints && this.toolState.polylinePoints.length > 0) {
          // Get the last fixed point
          const lastPoint = this.toolState.polylinePoints[this.toolState.polylinePoints.length - 1];
          
          // Apply ortho mode if enabled
          let currentPoint = { ...point };
          if (this.orthoMode) {
            currentPoint = this.getOrthoPoint(lastPoint, point);
          }
          
          // Create a new array of points with the last one updated
          const points = [...this.toolState.polylinePoints, currentPoint];
          
          // Update the temporary polyline
          updateTempEntity({
            points
          });
        }
        break;
        
      case 'move':
        if (this.toolState.moving && this.toolState.moveStartPoint) {
          // Move the selected entities
          const dx = point.x - this.toolState.moveStartPoint.x;
          const dy = point.y - this.toolState.moveStartPoint.y;
          
          if (dx !== 0 || dy !== 0) {
            moveSelectedEntities(dx, dy);
            this.toolState.moveStartPoint = { ...point };
          }
        }
        break;
        
      // Add more tools as needed
      
      default:
        // No action for other tools
    }
    
    this.lastPoint = { ...point };
  }
  
  /**
   * Handle mouse up event
   */
  handleMouseUp(
    e: React.MouseEvent<HTMLCanvasElement>,
    worldPoint: Point,
    ctxInfo: { ctx: CanvasRenderingContext2D, pan: Point, zoom: number }
  ): void {
    // Get the technical drawing store actions
    const { setTempEntity, addEntity, selectEntitiesInRect, clearSnapPoints } = useTechnicalDrawingStore.getState();
    
    // Get snapped point if snap is enabled
    const point = this.snapEnabled ? this.getSnapPoint(worldPoint) : worldPoint;
    
    // Handle mouse up based on current tool
    switch (this.currentTool) {
      case 'select':
        if (this.toolState.selecting) {
          // Finish selection rectangle
          const selectionRect = {
            x: Math.min(this.toolState.selectionStart.x, point.x),
            y: Math.min(this.toolState.selectionStart.y, point.y),
            width: Math.abs(point.x - this.toolState.selectionStart.x),
            height: Math.abs(point.y - this.toolState.selectionStart.y)
          };
          
          // Select entities within the rectangle
          selectEntitiesInRect(selectionRect);
          
          // Clear temporary selection rectangle
          setTempEntity(null);
          this.toolState.selecting = false;
        } else if (this.toolState.moving) {
          // Finish moving selected entities
          this.toolState.moving = false;
          this.toolState.selectedEntities = null;
          this.toolState.moveStartPoint = null;
        }
        break;
        
      case 'move':
        if (this.toolState.moving) {
          // Finish moving selected entities
          this.toolState.moving = false;
          this.toolState.selectedEntities = null;
          this.toolState.moveStartPoint = null;
        }
        break;
        
      // Most other tools are handled in mouseDown
      // Add more tools as needed
      
      default:
        // No action for other tools
    }
    
    clearSnapPoints();
  }
  
  /**
   * Handle key down event
   */
  handleKeyDown(e: React.KeyboardEvent<HTMLCanvasElement>): void {
    // Get the technical drawing store actions
    const { setTempEntity, deleteSelectedEntities } = useTechnicalDrawingStore.getState();
    
    // Handle keyboard shortcuts
    switch (e.key) {
      case 'Escape':
        // Cancel current operation
        if (this.isDrawing || this.toolState.polylinePoints || this.toolState.arcStep) {
          this.isDrawing = false;
          this.startPoint = null;
          this.toolState = {};
          setTempEntity(null);
        }
        break;
        
      case 'Delete':
      case 'Backspace':
        // Delete selected entities
        deleteSelectedEntities();
        break;
        
      case 'Enter':
        // Complete current operation
        if (this.currentTool === 'polyline' && this.toolState.polylinePoints && this.toolState.polylinePoints.length > 2) {
          // Complete the polyline
          const polyline: DrawingEntity = {
            id: uuidv4(),
            type: 'polyline',
            layer: 'default',
            visible: true,
            locked: false,
            style: {
              strokeColor: '#000000',
              strokeWidth: 0.5,
              strokeStyle: 'solid'
            },
            points: [...this.toolState.polylinePoints],
            closed: false
          };
          
          useTechnicalDrawingStore.getState().addEntity(polyline);
          setTempEntity(null);
          
          // Reset polyline drawing state
          this.toolState.polylinePoints = null;
        }
        break;
        
      default:
        // Handle other keys
    }
  }
  
  /**
   * Get the ID of an entity at the given point
   */
  private getEntityAtPoint(point: Point): string | null {
    const entities = useTechnicalDrawingStore.getState().entities;
    const selectedEntityIds = Object.keys(entities).filter(id => {
      const entity = entities[id];
      return this.isPointOnEntity(point, entity);
    });
    
    return selectedEntityIds.length > 0 ? selectedEntityIds[0] : null;
  }
  
  /**
   * Check if a point is on an entity
   */
  private isPointOnEntity(point: Point, entity: DrawingEntity): boolean {
    const tolerance = 5; // Tolerance in world units
    
    switch (entity.type) {
      case 'line':
        return this.isPointOnLine(point, entity.startPoint, entity.endPoint, tolerance);
        
      case 'circle':
        const dx = point.x - entity.center.x;
        const dy = point.y - entity.center.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return Math.abs(distance - entity.radius) < tolerance;
        
      case 'rectangle':
        // Check if point is on the border
        const isOnTop = Math.abs(point.y - entity.y) < tolerance && 
                       point.x >= entity.x && point.x <= entity.x + entity.width;
        const isOnBottom = Math.abs(point.y - (entity.y + entity.height)) < tolerance && 
                          point.x >= entity.x && point.x <= entity.x + entity.width;
        const isOnLeft = Math.abs(point.x - entity.x) < tolerance && 
                        point.y >= entity.y && point.y <= entity.y + entity.height;
        const isOnRight = Math.abs(point.x - (entity.x + entity.width)) < tolerance && 
                         point.y >= entity.y && point.y <= entity.y + entity.height;
        
        return isOnTop || isOnBottom || isOnLeft || isOnRight;
        
      case 'arc':
        // Check if point is on the arc
        const dx2 = point.x - entity.center.x;
        const dy2 = point.y - entity.center.y;
        const distance2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
        const angle = Math.atan2(dy2, dx2);
        
        // Normalize angles for comparison
        let startAngle = entity.startAngle;
        let endAngle = entity.endAngle;
        while (endAngle < startAngle) endAngle += Math.PI * 2;
        let pointAngle = angle;
        while (pointAngle < startAngle) pointAngle += Math.PI * 2;
        
        return Math.abs(distance2 - entity.radius) < tolerance && 
               pointAngle >= startAngle && pointAngle <= endAngle;
        
      case 'polyline':
        if (!entity.points || entity.points.length < 2) return false;
        
        // Check if point is on any segment of the polyline
        for (let i = 0; i < entity.points.length - 1; i++) {
          if (this.isPointOnLine(point, entity.points[i], entity.points[i + 1], tolerance)) {
            return true;
          }
        }
        
        // Check closing segment if polyline is closed
        if (entity.closed && entity.points.length > 2) {
          return this.isPointOnLine(
            point, 
            entity.points[entity.points.length - 1], 
            entity.points[0], 
            tolerance
          );
        }
        
        return false;
        
      case 'text':
        // Simple bounding box check
        const padding = 5;
        return point.x >= entity.position.x - padding && 
               point.x <= entity.position.x + (entity.width || 50) + padding && 
               point.y >= entity.position.y - padding && 
               point.y <= entity.position.y + (entity.height || 20) + padding;
        
      // Add more entity types as needed
      
      default:
        return false;
    }
  }
  
  /**
   * Check if a point is on a line segment
   */
  private isPointOnLine(point: Point, start: Point, end: Point, tolerance: number): boolean {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length === 0) return false;
    
    // Calculate the distance from the point to the line
    const crossProduct = Math.abs((point.y - start.y) * dx - (point.x - start.x) * dy);
    const distance = crossProduct / length;
    
    if (distance > tolerance) return false;
    
    // Check if the point is within the line segment
    const dotProduct = ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy);
    return dotProduct >= 0 && dotProduct <= 1;
  }
  
  /**
   * Get the snap point for the current position
   */
  private getSnapPoint(point: Point): Point {
    // Get the technical drawing store
    const { entities, snapPoints, gridEnabled } = useTechnicalDrawingStore.getState();
    
    // Check if there are any snap points nearby
    const snapTolerance = 10; // Pixels
    for (const snapPoint of snapPoints) {
      const dx = point.x - snapPoint.x;
      const dy = point.y - snapPoint.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < snapTolerance) {
        return { ...snapPoint };
      }
    }
    
    // Check for entity snap points (endpoints, centers, etc.)
    const entitySnapPoints: Point[] = [];
    
    Object.values(entities).forEach(entity => {
      switch (entity.type) {
        case 'line':
          entitySnapPoints.push(entity.startPoint, entity.endPoint);
          // Add midpoint
          entitySnapPoints.push({
            x: (entity.startPoint.x + entity.endPoint.x) / 2,
            y: (entity.startPoint.y + entity.endPoint.y) / 2
          });
          break;
          
        case 'circle':
          entitySnapPoints.push(entity.center);
          // Add quadrant points
          entitySnapPoints.push(
            { x: entity.center.x + entity.radius, y: entity.center.y },
            { x: entity.center.x, y: entity.center.y + entity.radius },
            { x: entity.center.x - entity.radius, y: entity.center.y },
            { x: entity.center.x, y: entity.center.y - entity.radius }
          );
          break;
          
        case 'arc':
          entitySnapPoints.push(entity.center, entity.startPoint, entity.endPoint);
          break;
          
        case 'rectangle':
          // Add corners
          entitySnapPoints.push(
            { x: entity.x, y: entity.y },
            { x: entity.x + entity.width, y: entity.y },
            { x: entity.x + entity.width, y: entity.y + entity.height },
            { x: entity.x, y: entity.y + entity.height }
          );
          // Add midpoints
          entitySnapPoints.push(
            { x: entity.x + entity.width / 2, y: entity.y },
            { x: entity.x + entity.width, y: entity.y + entity.height / 2 },
            { x: entity.x + entity.width / 2, y: entity.y + entity.height },
            { x: entity.x, y: entity.y + entity.height / 2 }
          );
          break;
          
        case 'polyline':
          if (entity.points) {
            // Add all points
            entitySnapPoints.push(...entity.points);
            
            // Add midpoints for all segments
            for (let i = 0; i < entity.points.length - 1; i++) {
              entitySnapPoints.push({
                x: (entity.points[i].x + entity.points[i + 1].x) / 2,
                y: (entity.points[i].y + entity.points[i + 1].y) / 2
              });
            }
            
            // Add midpoint for closing segment if closed
            if (entity.closed && entity.points.length > 2) {
              entitySnapPoints.push({
                x: (entity.points[0].x + entity.points[entity.points.length - 1].x) / 2,
                y: (entity.points[0].y + entity.points[entity.points.length - 1].y) / 2
              });
            }
          }
          break;
          
        // Add more entity types as needed
      }
    });
    
    // Check for snapping to entity points
    for (const snapPoint of entitySnapPoints) {
      const dx = point.x - snapPoint.x;
      const dy = point.y - snapPoint.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < snapTolerance) {
        return { ...snapPoint };
      }
    }
    
    // Check for grid snapping
    if (gridEnabled) {
      const gridSize = 10; // Grid size in world units
      return {
        x: Math.round(point.x / gridSize) * gridSize,
        y: Math.round(point.y / gridSize) * gridSize
      };
    }
    
    // No snap point found, return the original point
    return { ...point };
  }
  
  /**
   * Get the ortho point for the current position
   */
  private getOrthoPoint(start: Point, end: Point): Point {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal line
      return { x: end.x, y: start.y };
    } else {
      // Vertical line
      return { x: start.x, y: end.y };
    }
  }
}

// Create and export a singleton instance
export const toolsManager = new ToolsManager(); 