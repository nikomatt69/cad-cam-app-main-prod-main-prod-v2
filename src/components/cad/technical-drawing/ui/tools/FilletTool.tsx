// src/components/cad/tools/FilletTool.tsx
// Strumento per creare raccordi tra due linee
// Tool for creating fillets between two lines

import React, { useEffect, useRef, useState } from 'react';
import { useTechnicalDrawingStore } from '../../../store/technicalDrawingStore';
import { BaseTool } from '../technical-drawing/core/ToolsManager';
import { Point, DrawingEntityType } from '../../../types/TechnicalDrawingTypes';
import { calculateIntersection, calculateAngleBetweenLines } from '../technical-drawing/utils/geometryUtils';

/**
 * FilletTool - Strumento per creare raccordi (archi) tra due linee
 * FilletTool - Tool for creating fillets (arcs) between two lines
 * 
 * Permette di selezionare due linee e creare un arco di raccordo con raggio specificato
 * Allows selecting two lines and creating a fillet arc with specified radius
 */
export class FilletTool extends BaseTool {
  private firstLineId: string | null = null;
  private secondLineId: string | null = null;
  private radius: number = 10;
  private showRadiusDialog: boolean = false;
  private setRadiusCallback: ((radius: number) => void) | null = null;
  
  constructor() {
    super(
      'fillet',          // Tool ID
      'Raccordo',        // Tool name in Italian
      'rounded_corner',  // Material icon name
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
      store.setCommandPrompt('Seleziona la prima linea per il raccordo');
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
   * Imposta il raggio del raccordo
   * Set the fillet radius
   */
  setRadius(radius: number): void {
    this.radius = Math.max(0.1, radius); // Enforce minimum radius
    
    if (this.firstLineId && this.secondLineId) {
      // If we already have two lines selected, create the fillet immediately
      this.createFillet();
    }
  }
  
  /**
   * Imposta il callback per la modifica del raggio
   * Set callback for radius editing
   */
  setRadiusEditCallback(callback: ((radius: number) => void) | null): void {
    this.setRadiusCallback = callback;
  }
  
  onMouseDown(point: Point, event: React.MouseEvent): void {
    const store = useTechnicalDrawingStore.getState();
    
    if (!this.firstLineId) {
      // Selecting first line
      const entityId = this.findLineAtPoint(point);
      
      if (entityId) {
        this.firstLineId = entityId;
        
        // Highlight the selected line
        store.selectEntities([this.firstLineId]);
        
        // Update command prompt
        if (store.setCommandPrompt) {
          store.setCommandPrompt('Seleziona la seconda linea per il raccordo');
        }
      }
    } else if (!this.secondLineId) {
      // Selecting second line
      const entityId = this.findLineAtPoint(point);
      
      if (entityId && entityId !== this.firstLineId) {
        this.secondLineId = entityId;
        
        // Highlight both selected lines
        store.selectEntities([this.firstLineId, this.secondLineId]);
        
        // If SHIFT key is pressed, show dialog to set radius
        if (event.shiftKey) {
          this.showRadiusDialog = true;
          
          // Call the radius edit callback if available
          if (this.setRadiusCallback) {
            this.setRadiusCallback(this.radius);
          } else {
            // If no callback, use the current radius and create the fillet
            this.createFillet();
          }
        } else {
          // Use the current radius and create the fillet
          this.createFillet();
        }
      }
    }
  }
  
  onKeyDown(event: React.KeyboardEvent): void {
    super.onKeyDown(event);
    
    // Increase/decrease radius with + and - keys
    if (event.key === '+' || event.key === '=') {
      this.radius += 1;
      
      // Update command prompt
      const store = useTechnicalDrawingStore.getState();
      if (store.setCommandPrompt) {
        store.setCommandPrompt(`Raggio raccordo: ${this.radius.toFixed(2)}`);
      }
    } else if (event.key === '-' || event.key === '_') {
      this.radius = Math.max(0.1, this.radius - 1);
      
      // Update command prompt
      const store = useTechnicalDrawingStore.getState();
      if (store.setCommandPrompt) {
        store.setCommandPrompt(`Raggio raccordo: ${this.radius.toFixed(2)}`);
      }
    }
    
    // Enter key to confirm radius
    if (event.key === 'Enter' && this.showRadiusDialog) {
      this.showRadiusDialog = false;
      
      if (this.firstLineId && this.secondLineId) {
        this.createFillet();
      }
    }
    
    // Escape to reset or exit
    if (event.key === 'Escape') {
      if (this.secondLineId) {
        // Clear second line
        this.secondLineId = null;
        
        // Update selection
        const store = useTechnicalDrawingStore.getState();
        if (this.firstLineId) {
          store.selectEntities([this.firstLineId]);
        } else {
          store.clearSelection();
        }
        
        // Update command prompt
        if (store.setCommandPrompt) {
          store.setCommandPrompt('Seleziona la seconda linea per il raccordo');
        }
      } else if (this.firstLineId) {
        // Clear first line
        this.firstLineId = null;
        
        // Clear selection
        const store = useTechnicalDrawingStore.getState();
        store.clearSelection();
        
        // Update command prompt
        if (store.setCommandPrompt) {
          store.setCommandPrompt('Seleziona la prima linea per il raccordo');
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
  
  findLineAtPoint(point: Point): string | null {
    const store = useTechnicalDrawingStore.getState();
    const entities = store.entities;
    
    // Find lines near the point
    for (const [id, entity] of Object.entries(entities)) {
      // Skip locked or invisible entities, or non-line entities
      if (entity.locked || !entity.visible || entity.type !== DrawingEntityType.LINE) continue;
      
      // Check if point is on line
      if (this.isPointNearLine(point, entity.startPoint, entity.endPoint, 5)) {
        return id;
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
  
  createFillet(): void {
    if (!this.firstLineId || !this.secondLineId) return;
    
    const store = useTechnicalDrawingStore.getState();
    const line1 = store.entities[this.firstLineId];
    const line2 = store.entities[this.secondLineId];
    
    if (!line1 || !line2 || line1.type !== DrawingEntityType.LINE || line2.type !== DrawingEntityType.LINE) {
      this.reset();
      return;
    }
    
    // Calculate intersection of the two lines
    const intersection = calculateIntersection(
      line1.startPoint, line1.endPoint,
      line2.startPoint, line2.endPoint
    );
    
    if (!intersection) {
      // Lines are parallel or don't intersect
      this.reset();
      
      // Update command prompt
      if (store.setCommandPrompt) {
        store.setCommandPrompt('Le linee non si intersecano. Seleziona la prima linea per il raccordo');
      }
      return;
    }
    
    // Calculate the angle between the lines
    const angle = calculateAngleBetweenLines(
      line1.startPoint, line1.endPoint,
      line2.startPoint, line2.endPoint
    );
    
    // Ensure angle is positive and in radians
    const angleRad = Math.abs(angle) * Math.PI / 180;
    
    // Calculate tangent points on both lines
    // For a fillet with radius r between two lines at angle θ,
    // the tangent points are at distance r/tan(θ/2) from the intersection point
    const tanDistance = this.radius / Math.tan(angleRad / 2);
    
    // Calculate unit vectors along each line
    const vector1 = this.calculateUnitVector(line1.startPoint, line1.endPoint);
    const vector2 = this.calculateUnitVector(line2.startPoint, line2.endPoint);
    
    // Calculate tangent points
    const tangentPoint1 = {
      x: intersection.x + vector1.x * tanDistance,
      y: intersection.y + vector1.y * tanDistance
    };
    
    const tangentPoint2 = {
      x: intersection.x + vector2.x * tanDistance,
      y: intersection.y + vector2.y * tanDistance
    };
    
    // Check if tangent points are within the line segments
    const isTP1OnLine1 = this.isPointOnLineSegment(tangentPoint1, line1.startPoint, line1.endPoint);
    const isTP2OnLine2 = this.isPointOnLineSegment(tangentPoint2, line2.startPoint, line2.endPoint);
    
    if (!isTP1OnLine1 || !isTP2OnLine2) {
      // Tangent points are outside the line segments
      this.reset();
      
      // Update command prompt
      if (store.setCommandPrompt) {
        store.setCommandPrompt('Il raggio è troppo grande per queste linee. Seleziona la prima linea per il raccordo');
      }
      return;
    }
    
    // Calculate the center of the fillet arc
    // The center is at the intersection of the perpendicular lines from the tangent points
    const perpVector1 = { x: -vector1.y, y: vector1.x }; // Rotate 90 degrees
    const perpVector2 = { x: -vector2.y, y: vector2.x };
    
    // Calculate the center of the arc (where the perpendicular lines meet)
    // For simplicity, we can use the fact that the center is equidistant from both tangent points
    // and at distance r from each tangent point along the perpendicular vector
    const center = {
      x: intersection.x + (perpVector1.x + perpVector2.x) * this.radius / 2,
      y: intersection.y + (perpVector1.y + perpVector2.y) * this.radius / 2
    };
    
    // Calculate start and end angles for the arc
    const startAngle = Math.atan2(tangentPoint1.y - center.y, tangentPoint1.x - center.x);
    const endAngle = Math.atan2(tangentPoint2.y - center.y, tangentPoint2.x - center.x);
    
    // Create the arc entity
    const arcEntity = {
      type: DrawingEntityType.ARC,
      center: center,
      radius: this.radius,
      startAngle: startAngle * 180 / Math.PI, // Convert to degrees
      endAngle: endAngle * 180 / Math.PI,
      counterclockwise: this.isCounterClockwise(startAngle, endAngle),
      layer: line1.layer, // Use the layer of the first line
      visible: true,
      locked: false,
      style: { ...line1.style } // Copy style from first line
    };
    
    // Add the arc entity
    store.addEntity(arcEntity);
    
    // Trim the original lines
    const newLine1 = { ...line1 };
    const newLine2 = { ...line2 };
    
    // Find which endpoints of line1 are closer to the tangent point
    const dist1Start = this.getDistanceSquared(line1.startPoint, tangentPoint1);
    const dist1End = this.getDistanceSquared(line1.endPoint, tangentPoint1);
    
    if (dist1Start < dist1End) {
      newLine1.startPoint = tangentPoint1; // Trim from start point
    } else {
      newLine1.endPoint = tangentPoint1; // Trim from end point
    }
    
    // Find which endpoints of line2 are closer to the tangent point
    const dist2Start = this.getDistanceSquared(line2.startPoint, tangentPoint2);
    const dist2End = this.getDistanceSquared(line2.endPoint, tangentPoint2);
    
    if (dist2Start < dist2End) {
      newLine2.startPoint = tangentPoint2; // Trim from start point
    } else {
      newLine2.endPoint = tangentPoint2; // Trim from end point
    }
    
    // Update the lines
    store.updateEntity(this.firstLineId, newLine1);
    store.updateEntity(this.secondLineId, newLine2);
    
    // Reset to allow creating another fillet
    this.reset();
    
    // Update command prompt
    if (store.setCommandPrompt) {
      store.setCommandPrompt('Raccordo creato. Seleziona la prima linea per un nuovo raccordo');
    }
  }
  
  calculateUnitVector(from: Point, to: Point): { x: number, y: number } {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length === 0) return { x: 0, y: 0 };
    
    return {
      x: dx / length,
      y: dy / length
    };
  }
  
  isPointOnLineSegment(point: Point, lineStart: Point, lineEnd: Point): boolean {
    // Check if point is on the line segment
    const dxl = lineEnd.x - lineStart.x;
    const dyl = lineEnd.y - lineStart.y;
    const dxp = point.x - lineStart.x;
    const dyp = point.y - lineStart.y;
    
    const cross = dxl * dyp - dyl * dxp;
    
    // If cross product is not close to zero, point is not on the line
    if (Math.abs(cross) > 0.001) return false;
    
    // Check if point is between the endpoints
    if (Math.abs(dxl) >= Math.abs(dyl)) {
      return dxl > 0 ?
        lineStart.x <= point.x && point.x <= lineEnd.x :
        lineEnd.x <= point.x && point.x <= lineStart.x;
    } else {
      return dyl > 0 ?
        lineStart.y <= point.y && point.y <= lineEnd.y :
        lineEnd.y <= point.y && point.y <= lineStart.y;
    }
  }
  
  isCounterClockwise(startAngle: number, endAngle: number): boolean {
    // Ensure angles are in the range [0, 2π]
    while (startAngle < 0) startAngle += 2 * Math.PI;
    while (endAngle < 0) endAngle += 2 * Math.PI;
    
    while (startAngle >= 2 * Math.PI) startAngle -= 2 * Math.PI;
    while (endAngle >= 2 * Math.PI) endAngle -= 2 * Math.PI;
    
    // Determine if the arc goes counterclockwise from start to end
    if (startAngle > endAngle) {
      return true; // We need to go counterclockwise to get from start to end
    } else {
      const diff = endAngle - startAngle;
      return diff > Math.PI; // If the difference is > 180°, shorter path is counterclockwise
    }
  }
  
  getDistanceSquared(p1: Point, p2: Point): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return dx * dx + dy * dy;
  }
  
  reset(): void {
    super.reset();
    this.firstLineId = null;
    this.secondLineId = null;
    this.showRadiusDialog = false;
    
    // Clear any selection in the store
    const store = useTechnicalDrawingStore.getState();
    store.clearSelection();
  }
  
  renderPreview(ctx: CanvasRenderingContext2D): void {
    if (!this.firstLineId && !this.secondLineId) return;
    
    const store = useTechnicalDrawingStore.getState();
    
    ctx.save();
    
    // Highlight the first selected line
    if (this.firstLineId) {
      const line1 = store.entities[this.firstLineId];
      if (line1 && line1.type === DrawingEntityType.LINE) {
        ctx.strokeStyle = '#0066FF';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        
        ctx.beginPath();
        ctx.moveTo(line1.startPoint.x, line1.startPoint.y);
        ctx.lineTo(line1.endPoint.x, line1.endPoint.y);
        ctx.stroke();
      }
    }
    
    // Highlight the second selected line
    if (this.secondLineId) {
      const line2 = store.entities[this.secondLineId];
      if (line2 && line2.type === DrawingEntityType.LINE) {
        ctx.strokeStyle = '#0066FF';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        
        ctx.beginPath();
        ctx.moveTo(line2.startPoint.x, line2.startPoint.y);
        ctx.lineTo(line2.endPoint.x, line2.endPoint.y);
        ctx.stroke();
        
        // If both lines are selected, show fillet preview
        if (this.firstLineId) {
          const line1 = store.entities[this.firstLineId];
          if (line1 && line1.type === DrawingEntityType.LINE) {
            const intersection = calculateIntersection(
              line1.startPoint, line1.endPoint,
              line2.startPoint, line2.endPoint
            );
            
            if (intersection) {
              // Draw intersection point
              ctx.fillStyle = '#FF0000';
              ctx.beginPath();
              ctx.arc(intersection.x, intersection.y, 3, 0, Math.PI * 2);
              ctx.fill();
              
              // Show radius value
              ctx.fillStyle = '#000000';
              ctx.font = '12px Arial';
              ctx.fillText(`Raggio: ${this.radius.toFixed(2)}`, intersection.x + 10, intersection.y - 10);
            }
          }
        }
      }
    }
    
    ctx.restore();
  }
}

/**
 * Componente di integrazione React per FilletTool
 * React integration component for FilletTool
 */
const FilletToolComponent: React.FC = () => {
  const toolInstance = useRef<FilletTool | null>(null);
  const [showRadiusDialog, setShowRadiusDialog] = useState<boolean>(false);
  const [radius, setRadius] = useState<number>(10);
  
  useEffect(() => {
    // Crea l'istanza dello strumento
    // Create the tool instance
    if (!toolInstance.current) {
      toolInstance.current = new FilletTool();
      
      // Set the callback for radius editing
      toolInstance.current.setRadiusEditCallback((initialRadius) => {
        setRadius(initialRadius);
        setShowRadiusDialog(true);
      });
    }
    
    // Cleanup quando il componente viene smontato
    // Cleanup when component is unmounted
    return () => {
      if (toolInstance.current) {
        toolInstance.current.setRadiusEditCallback(null);
      }
    };
  }, []);
  
  // Handle radius confirmation
  const handleRadiusConfirm = () => {
    if (toolInstance.current) {
      toolInstance.current.setRadius(radius);
      setShowRadiusDialog(false);
    }
  };
  
  // If dialog is not shown, don't render anything
  if (!showRadiusDialog) return null;
  
  // Show dialog for radius input
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
      <h3>Raggio del Raccordo</h3>
      <div style={{ marginBottom: '12px' }}>
        <input
          type="number"
          value={radius}
          onChange={(e) => setRadius(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
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
          onClick={() => setShowRadiusDialog(false)}
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
          onClick={handleRadiusConfirm}
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

export default FilletToolComponent;