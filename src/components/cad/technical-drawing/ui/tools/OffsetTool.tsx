// src/components/cad/tools/OffsetTool.tsx
// Strumento per creare offset (copie parallele) di entità
// Tool for creating offsets (parallel copies) of entities

import React, { useEffect, useRef, useState } from 'react';
import { useTechnicalDrawingStore } from '../../../store/technicalDrawingStore';
import { BaseTool } from '../technical-drawing/core/ToolsManager';
import { Point, DrawingEntityType } from '../../../types/TechnicalDrawingTypes';

/**
 * OffsetTool - Strumento per creare copie parallele di entità
 * OffsetTool - Tool for creating parallel copies of entities
 * 
 * Permette di selezionare un'entità e creare una copia parallela a distanza specificata
 * Allows selecting an entity and creating a parallel copy at a specified distance
 */
export class OffsetTool extends BaseTool {
  private selectedEntityId: string | null = null;
  private offsetDistance: number = 10;
  private offsetEntities: any[] = [];
  private offsetDirection: 'left' | 'right' | null = null;
  private showOffsetDialog: boolean = false;
  private setOffsetCallback: ((distance: number) => void) | null = null;
  private previewPoint: Point | null = null;
  
  constructor() {
    super(
      'offset',          // Tool ID
      'Offset',          // Tool name in Italian
      'call_split',      // Material icon name
      'crosshair',       // Cursor type
      undefined,         // No specific style needed
      0                  // No fixed number of points required
    );
  }
  
  onActivate(): void {
    super.onActivate();
    this.reset();
    
    // Show instructions in the command line
    const store = useTechnicalDrawingStore.getState();
    if (store.setCommandPrompt) {
      store.setCommandPrompt('Seleziona un\'entità per l\'offset e poi indica la direzione');
    }
  }
  
  onDeactivate(): void {
    super.onDeactivate();
    this.reset();
    
    // Clear command line
    const store = useTechnicalDrawingStore.getState();
    if (store.setCommandPrompt) {
      store.setCommandPrompt('');
    }
  }
  
  /**
   * Imposta la distanza di offset
   * Set the offset distance
   */
  setOffsetDistance(distance: number): void {
    this.offsetDistance = Math.max(0.1, distance); // Enforce minimum distance
    
    // Update the preview if we have an entity selected
    if (this.selectedEntityId && this.previewPoint) {
      this.updateOffsetPreview(this.previewPoint);
    }
  }
  
  /**
   * Imposta il callback per la modifica della distanza
   * Set callback for distance editing
   */
  setOffsetEditCallback(callback: ((distance: number) => void) | null): void {
    this.setOffsetCallback = callback;
  }
  
  onMouseDown(point: Point, event: React.MouseEvent): void {
    const store = useTechnicalDrawingStore.getState();
    
    if (!this.selectedEntityId) {
      // Selecting an entity
      const entityId = this.findEntityAtPoint(point);
      
      if (entityId) {
        this.selectedEntityId = entityId;
        
        // Highlight the selected entity
        store.selectEntities([this.selectedEntityId]);
        
        // Update command prompt
        if (store.setCommandPrompt) {
          store.setCommandPrompt('Indica la direzione dell\'offset. SHIFT per specificare la distanza');
        }
        
        // If SHIFT key is pressed, show dialog to set distance
        if (event.shiftKey) {
          this.showOffsetDialog = true;
          
          // Call the offset edit callback if available
          if (this.setOffsetCallback) {
            this.setOffsetCallback(this.offsetDistance);
          }
        }
      }
    } else {
      // Entity is selected, determine offset direction and create offset
      if (this.offsetDirection === null) {
        // Calculate the offset direction based on which side of the entity the point is
        this.calculateOffsetDirection(point);
        
        // Create the offset entity
        this.createOffset();
        
        // Reset for the next offset operation
        this.reset();
      }
    }
  }
  
  onMouseMove(point: Point, event: React.MouseEvent): void {
    // Only update preview if we have a selected entity
    if (this.selectedEntityId) {
      this.previewPoint = { ...point };
      this.updateOffsetPreview(point);
    }
  }
  
  onKeyDown(event: React.KeyboardEvent): void {
    super.onKeyDown(event);
    
    // Increase/decrease offset distance with + and - keys
    if (event.key === '+' || event.key === '=') {
      this.offsetDistance += 1;
      
      // Update command prompt
      const store = useTechnicalDrawingStore.getState();
      if (store.setCommandPrompt) {
        store.setCommandPrompt(`Distanza offset: ${this.offsetDistance.toFixed(2)}`);
      }
      
      // Update preview if we have an entity selected
      if (this.selectedEntityId && this.previewPoint) {
        this.updateOffsetPreview(this.previewPoint);
      }
    } else if (event.key === '-' || event.key === '_') {
      this.offsetDistance = Math.max(0.1, this.offsetDistance - 1);
      
      // Update command prompt
      const store = useTechnicalDrawingStore.getState();
      if (store.setCommandPrompt) {
        store.setCommandPrompt(`Distanza offset: ${this.offsetDistance.toFixed(2)}`);
      }
      
      // Update preview if we have an entity selected
      if (this.selectedEntityId && this.previewPoint) {
        this.updateOffsetPreview(this.previewPoint);
      }
    }
    
    // Enter key to confirm offset
    if (event.key === 'Enter' && this.selectedEntityId) {
      // Create the offset entity
      this.createOffset();
      
      // Reset for the next offset operation
      this.reset();
    }
    
    // Escape to reset or exit
    if (event.key === 'Escape') {
      if (this.selectedEntityId) {
        // Clear selected entity
        this.reset();
        
        // Update command prompt
        const store = useTechnicalDrawingStore.getState();
        if (store.setCommandPrompt) {
          store.setCommandPrompt('Seleziona un\'entità per l\'offset e poi indica la direzione');
        }
      } else {
        // Exit the tool
        const toolsMgr = this.getToolsManager();
        if (toolsMgr) {
          toolsMgr.setActiveTool('selection');
        }
      }
    }
  }
  
  findEntityAtPoint(point: Point): string | null {
    const store = useTechnicalDrawingStore.getState();
    const entities = store.entities;
    
    // Find entities near the point
    for (const [id, entity] of Object.entries(entities)) {
      // Skip locked or invisible entities
      if (entity.locked || !entity.visible) continue;
      
      // Check different entity types
      switch (entity.type) {
        case DrawingEntityType.LINE:
          if (this.isPointNearLine(point, entity.startPoint, entity.endPoint, 5)) {
            return id;
          }
          break;
          
        case DrawingEntityType.CIRCLE:
          if (this.isPointNearCircle(point, entity.center, entity.radius, 5)) {
            return id;
          }
          break;
          
        case DrawingEntityType.ARC:
          if (this.isPointNearArc(point, entity.center, entity.radius, 
                                  entity.startAngle, entity.endAngle, 5)) {
            return id;
          }
          break;
          
        case DrawingEntityType.POLYLINE:
          if (this.isPointNearPolyline(point, entity.points, 5)) {
            return id;
          }
          break;
          
        // Add more entity types as needed
      }
    }
    
    return null;
  }
  
  isPointNearLine(point: Point, lineStart: Point, lineEnd: Point, tolerance: number): boolean {
    // Calculate distance from point to line segment
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    
    if (lenSq !== 0) param = dot / lenSq;
    
    let xx, yy;
    
    if (param < 0) {
      xx = lineStart.x;
      yy = lineStart.y;
    } else if (param > 1) {
      xx = lineEnd.x;
      yy = lineEnd.y;
    } else {
      xx = lineStart.x + param * C;
      yy = lineStart.y + param * D;
    }
    
    const dx = point.x - xx;
    const dy = point.y - yy;
    
    return Math.sqrt(dx * dx + dy * dy) < tolerance;
  }
  
  isPointNearCircle(point: Point, center: Point, radius: number, tolerance: number): boolean {
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    return Math.abs(distance - radius) < tolerance;
  }
  
  isPointNearArc(point: Point, center: Point, radius: number, 
                startAngle: number, endAngle: number, tolerance: number): boolean {
    // First check if point is near the circle
    if (!this.isPointNearCircle(point, center, radius, tolerance)) {
      return false;
    }
    
    // Check if point is within the arc's angle range
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    const angle = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;
    
    // Convert start and end angles to 0-360 range
    const start = (startAngle + 360) % 360;
    const end = (endAngle + 360) % 360;
    
    // Check if angle is between start and end
    if (start <= end) {
      return angle >= start && angle <= end;
    } else {
      // Arc crosses the 0/360 boundary
      return angle >= start || angle <= end;
    }
  }
  
  isPointNearPolyline(point: Point, points: Point[], tolerance: number): boolean {
    // Check each segment of the polyline
    for (let i = 0; i < points.length - 1; i++) {
      if (this.isPointNearLine(point, points[i], points[i + 1], tolerance)) {
        return true;
      }
    }
    
    // If polyline is closed, check the last segment
    if (points.length > 2 && points[0].x === points[points.length - 1].x && 
        points[0].y === points[points.length - 1].y) {
      return this.isPointNearLine(point, points[points.length - 1], points[0], tolerance);
    }
    
    return false;
  }
  
  calculateOffsetDirection(point: Point): void {
    if (!this.selectedEntityId) return;
    
    const store = useTechnicalDrawingStore.getState();
    const entity = store.entities[this.selectedEntityId];
    
    if (!entity) return;
    
    switch (entity.type) {
      case DrawingEntityType.LINE:
        this.calculateLineOffsetDirection(point, entity);
        break;
        
      case DrawingEntityType.CIRCLE:
        // For circles, inside/outside rather than left/right
        this.calculateCircleOffsetDirection(point, entity);
        break;
        
      case DrawingEntityType.ARC:
        this.calculateArcOffsetDirection(point, entity);
        break;
        
      case DrawingEntityType.POLYLINE:
        this.calculatePolylineOffsetDirection(point, entity);
        break;
        
      // Add more entity types as needed
    }
  }
  
  calculateLineOffsetDirection(point: Point, line: any): void {
    // Calculate which side of the line the point is on
    const x1 = line.startPoint.x;
    const y1 = line.startPoint.y;
    const x2 = line.endPoint.x;
    const y2 = line.endPoint.y;
    
    // Formula for side of line: sign of (x-x1)(y2-y1) - (y-y1)(x2-x1)
    const side = (point.x - x1) * (y2 - y1) - (point.y - y1) * (x2 - x1);
    
    this.offsetDirection = side > 0 ? 'left' : 'right';
  }
  
  calculateCircleOffsetDirection(point: Point, circle: any): void {
    // For circles, determine if offset should be inward or outward
    const dx = point.x - circle.center.x;
    const dy = point.y - circle.center.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // If point is inside the circle, offset outward, otherwise inward
    this.offsetDirection = distance < circle.radius ? 'right' : 'left';
  }
  
  calculateArcOffsetDirection(point: Point, arc: any): void {
    // Similar to circle, but need to check if point is within arc angle range
    const dx = point.x - arc.center.x;
    const dy = point.y - arc.center.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    this.offsetDirection = distance < arc.radius ? 'right' : 'left';
  }
  
  calculatePolylineOffsetDirection(point: Point, polyline: any): void {
    // For a polyline, we need to determine the side for each segment
    // and then combine the results
    // This is a simplified approach - just use the first segment
    if (polyline.points.length < 2) return;
    
    const x1 = polyline.points[0].x;
    const y1 = polyline.points[0].y;
    const x2 = polyline.points[1].x;
    const y2 = polyline.points[1].y;
    
    const side = (point.x - x1) * (y2 - y1) - (point.y - y1) * (x2 - x1);
    
    this.offsetDirection = side > 0 ? 'left' : 'right';
  }
  
  updateOffsetPreview(point: Point): void {
    if (!this.selectedEntityId) return;
    
    // Calculate the offset direction based on the current point
    this.calculateOffsetDirection(point);
    
    // Create preview offset entities
    this.generateOffsetEntities();
  }
  
  generateOffsetEntities(): void {
    if (!this.selectedEntityId || !this.offsetDirection) return;
    
    const store = useTechnicalDrawingStore.getState();
    const entity = store.entities[this.selectedEntityId];
    
    if (!entity) return;
    
    this.offsetEntities = [];
    
    switch (entity.type) {
      case DrawingEntityType.LINE:
        this.offsetEntities.push(this.generateLineOffset(entity));
        break;
        
      case DrawingEntityType.CIRCLE:
        this.offsetEntities.push(this.generateCircleOffset(entity));
        break;
        
      case DrawingEntityType.ARC:
        this.offsetEntities.push(this.generateArcOffset(entity));
        break;
        
      case DrawingEntityType.POLYLINE:
        this.offsetEntities.push(this.generatePolylineOffset(entity));
        break;
        
      // Add more entity types as needed
    }
  }
  
  generateLineOffset(line: any): any {
    // Create a parallel line at the offset distance
    const x1 = line.startPoint.x;
    const y1 = line.startPoint.y;
    const x2 = line.endPoint.x;
    const y2 = line.endPoint.y;
    
    // Calculate the line vector
    const dx = x2 - x1;
    const dy = y2 - y1;
    
    // Calculate the perpendicular vector (normalized)
    const length = Math.sqrt(dx * dx + dy * dy);
    const perpX = -dy / length;
    const perpY = dx / length;
    
    // Adjust direction based on left/right
    const directionSign = this.offsetDirection === 'left' ? 1 : -1;
    
    // Calculate offset points
    const offsetX = perpX * this.offsetDistance * directionSign;
    const offsetY = perpY * this.offsetDistance * directionSign;
    
    // Create the offset line
    const offsetLine = {
      type: DrawingEntityType.LINE,
      startPoint: {
        x: x1 + offsetX,
        y: y1 + offsetY
      },
      endPoint: {
        x: x2 + offsetX,
        y: y2 + offsetY
      }
    };
    
    return offsetLine;
  }
  
  generateCircleOffset(circle: any): any {
    // For a circle, offset is simply a concentric circle with larger/smaller radius
    const directionSign = this.offsetDirection === 'left' ? 1 : -1;
    
    // Calculate new radius
    const newRadius = circle.radius + (this.offsetDistance * directionSign);
    
    // Ensure radius is positive
    if (newRadius <= 0) {
      return null;
    }
    
    // Create the offset circle
    const offsetCircle = {
      type: DrawingEntityType.CIRCLE,
      center: { ...circle.center },
      radius: newRadius
    };
    
    return offsetCircle;
  }
  
  generateArcOffset(arc: any): any {
    // For an arc, offset is a concentric arc with larger/smaller radius
    const directionSign = this.offsetDirection === 'left' ? 1 : -1;
    
    // Calculate new radius
    const newRadius = arc.radius + (this.offsetDistance * directionSign);
    
    // Ensure radius is positive
    if (newRadius <= 0) {
      return null;
    }
    
    // Create the offset arc
    const offsetArc = {
      type: DrawingEntityType.ARC,
      center: { ...arc.center },
      radius: newRadius,
      startAngle: arc.startAngle,
      endAngle: arc.endAngle,
      counterclockwise: arc.counterclockwise
    };
    
    return offsetArc;
  }
  
  generatePolylineOffset(polyline: any): any {
    // Polyline offset is more complex - need to offset each segment and handle corners
    // This is a simplified version that only works for non-self-intersecting polylines
    if (polyline.points.length < 2) return null;
    
    const offsetPoints: Point[] = [];
    const directionSign = this.offsetDirection === 'left' ? 1 : -1;
    
    // Offset each segment
    for (let i = 0; i < polyline.points.length - 1; i++) {
      const p1 = polyline.points[i];
      const p2 = polyline.points[i + 1];
      
      // Calculate the segment vector
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      
      // Calculate the perpendicular vector (normalized)
      const length = Math.sqrt(dx * dx + dy * dy);
      const perpX = -dy / length;
      const perpY = dx / length;
      
      // Calculate offset points
      const offsetX = perpX * this.offsetDistance * directionSign;
      const offsetY = perpY * this.offsetDistance * directionSign;
      
      // Add offset point (only add first point for first segment)
      if (i === 0) {
        offsetPoints.push({
          x: p1.x + offsetX,
          y: p1.y + offsetY
        });
      }
      
      // Add second offset point
      offsetPoints.push({
        x: p2.x + offsetX,
        y: p2.y + offsetY
      });
    }
    
    // Create the offset polyline
    const offsetPolyline = {
      type: DrawingEntityType.POLYLINE,
      points: offsetPoints,
      closed: polyline.closed
    };
    
    return offsetPolyline;
  }
  
  createOffset(): void {
    if (!this.selectedEntityId || !this.offsetDirection) return;
    
    // Generate the offset entities if they don't exist
    if (this.offsetEntities.length === 0) {
      this.generateOffsetEntities();
    }
    
    // Add the offset entities to the store
    const store = useTechnicalDrawingStore.getState();
    
    for (const offsetEntity of this.offsetEntities) {
      if (!offsetEntity) continue;
      
      // Copy properties from original entity
      const originalEntity = store.entities[this.selectedEntityId];
      
      const entityWithProps = {
        ...offsetEntity,
        layer: originalEntity.layer,
        visible: true,
        locked: false,
        style: { ...originalEntity.style }
      };
      
      store.addEntity(entityWithProps);
    }
    
    // Update command prompt
    if (store.setCommandPrompt) {
      store.setCommandPrompt('Offset creato. Seleziona un\'altra entità per l\'offset');
    }
  }
  
  reset(): void {
    super.reset();
    this.selectedEntityId = null;
    this.offsetDirection = null;
    this.offsetEntities = [];
    this.showOffsetDialog = false;
    this.previewPoint = null;
    
    // Clear any selection in the store
    const store = useTechnicalDrawingStore.getState();
    store.clearSelection();
  }
  
  renderPreview(ctx: CanvasRenderingContext2D): void {
    if (!this.selectedEntityId) return;
    
    const store = useTechnicalDrawingStore.getState();
    
    ctx.save();
    
    // Highlight the selected entity
    const entity = store.entities[this.selectedEntityId];
    if (entity) {
      ctx.strokeStyle = '#0066FF';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      
      switch (entity.type) {
        case DrawingEntityType.LINE:
          ctx.beginPath();
          ctx.moveTo(entity.startPoint.x, entity.startPoint.y);
          ctx.lineTo(entity.endPoint.x, entity.endPoint.y);
          ctx.stroke();
          break;
          
        case DrawingEntityType.CIRCLE:
          ctx.beginPath();
          ctx.arc(entity.center.x, entity.center.y, entity.radius, 0, Math.PI * 2);
          ctx.stroke();
          break;
          
        case DrawingEntityType.ARC:
          ctx.beginPath();
          ctx.arc(
            entity.center.x, 
            entity.center.y, 
            entity.radius, 
            entity.startAngle * Math.PI / 180, 
            entity.endAngle * Math.PI / 180, 
            entity.counterclockwise
          );
          ctx.stroke();
          break;
          
        case DrawingEntityType.POLYLINE:
          if (entity.points.length > 1) {
            ctx.beginPath();
            ctx.moveTo(entity.points[0].x, entity.points[0].y);
            
            for (let i = 1; i < entity.points.length; i++) {
              ctx.lineTo(entity.points[i].x, entity.points[i].y);
            }
            
            if (entity.closed) {
              ctx.closePath();
            }
            
            ctx.stroke();
          }
          break;
      }
    }
    
    // Show offset preview
    ctx.strokeStyle = '#00CC00';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    
    for (const offsetEntity of this.offsetEntities) {
      if (!offsetEntity) continue;
      
      switch (offsetEntity.type) {
        case DrawingEntityType.LINE:
          ctx.beginPath();
          ctx.moveTo(offsetEntity.startPoint.x, offsetEntity.startPoint.y);
          ctx.lineTo(offsetEntity.endPoint.x, offsetEntity.endPoint.y);
          ctx.stroke();
          break;
          
        case DrawingEntityType.CIRCLE:
          ctx.beginPath();
          ctx.arc(offsetEntity.center.x, offsetEntity.center.y, offsetEntity.radius, 0, Math.PI * 2);
          ctx.stroke();
          break;
          
        case DrawingEntityType.ARC:
          ctx.beginPath();
          ctx.arc(
            offsetEntity.center.x, 
            offsetEntity.center.y, 
            offsetEntity.radius, 
            offsetEntity.startAngle * Math.PI / 180, 
            offsetEntity.endAngle * Math.PI / 180, 
            offsetEntity.counterclockwise
          );
          ctx.stroke();
          break;
          
        case DrawingEntityType.POLYLINE:
          if (offsetEntity.points.length > 1) {
            ctx.beginPath();
            ctx.moveTo(offsetEntity.points[0].x, offsetEntity.points[0].y);
            
            for (let i = 1; i < offsetEntity.points.length; i++) {
              ctx.lineTo(offsetEntity.points[i].x, offsetEntity.points[i].y);
            }
            
            if (offsetEntity.closed) {
              ctx.closePath();
            }
            
            ctx.stroke();
          }
          break;
      }
    }
    
    // Show offset distance if we have an offset direction
    if (this.offsetDirection && this.previewPoint) {
      ctx.fillStyle = '#000000';
      ctx.font = '12px Arial';
      ctx.fillText(`Offset: ${this.offsetDistance.toFixed(2)}`, 
                 this.previewPoint.x + 10, 
                 this.previewPoint.y - 10);
    }
    
    ctx.restore();
  }
}

/**
 * Componente di integrazione React per OffsetTool
 * React integration component for OffsetTool
 */
const OffsetToolComponent: React.FC = () => {
  const toolInstance = useRef<OffsetTool | null>(null);
  const [showOffsetDialog, setShowOffsetDialog] = useState<boolean>(false);
  const [offsetDistance, setOffsetDistance] = useState<number>(10);
  
  useEffect(() => {
    // Crea l'istanza dello strumento
    // Create the tool instance
    if (!toolInstance.current) {
      toolInstance.current = new OffsetTool();
      
      // Set the callback for offset distance editing
      toolInstance.current.setOffsetEditCallback((initialDistance) => {
        setOffsetDistance(initialDistance);
        setShowOffsetDialog(true);
      });
    }
    
    // Cleanup quando il componente viene smontato
    // Cleanup when component is unmounted
    return () => {
      if (toolInstance.current) {
        toolInstance.current.setOffsetEditCallback(null);
      }
    };
  }, []);
  
  // Handle offset distance confirmation
  const handleOffsetConfirm = () => {
    if (toolInstance.current) {
      toolInstance.current.setOffsetDistance(offsetDistance);
      setShowOffsetDialog(false);
    }
  };
  
  // If dialog is not shown, don't render anything
  if (!showOffsetDialog) return null;
  
  // Show dialog for offset distance input
  return (
    <div 
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'white',
        border: '1px solid #ccc',
        borderRadius: '4px',
        padding: '16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        zIndex: 1000
      }}
    >
      <h3>Distanza Offset</h3>
      <div style={{ marginBottom: '12px' }}>
        <input
          type="number"
          value={offsetDistance}
          onChange={(e) => setOffsetDistance(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}
          min="0.1"
          step="1"
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
        <button
          onClick={() => setShowOffsetDialog(false)}
          style={{
            padding: '8px 16px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: '#f5f5f5'
          }}
        >
          Annulla
        </button>
        <button
          onClick={handleOffsetConfirm}
          style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: '#0066FF',
            color: 'white'
          }}
        >
          Conferma
        </button>
      </div>
    </div>
  );
};

export default OffsetToolComponent;