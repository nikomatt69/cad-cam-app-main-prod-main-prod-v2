// src/components/cad/tools/ExtendTool.tsx
// Strumento per estendere entità fino all'intersezione con altre entità
// Tool for extending entities to intersect with other entities

import React, { useEffect, useRef, useState } from 'react';
import { useTechnicalDrawingStore } from '../../../store/technicalDrawingStore';
import { BaseTool } from '../technical-drawing/core/ToolsManager';
import { Point, DrawingEntityType } from '../../../types/TechnicalDrawingTypes';
import { calculateIntersection, calculateDistancePointToLine } from '../technical-drawing/utils/geometryUtils';

/**
 * ExtendTool - Strumento per estendere entità fino alle intersezioni
 * ExtendTool - Tool for extending entities to intersections
 * 
 * Permette di selezionare un'entità da estendere e la estende fino alla prima intersezione
 * Allows selecting an entity to extend and extends it to the first intersection
 */
export class ExtendTool extends BaseTool {
  private selectedEntityId: string | null = null;
  private boundaryEntityIds: string[] = [];
  private intersectionPoints: Point[] = [];
  private selectionMode: 'boundary' | 'entity' = 'boundary';
  
  constructor() {
    super(
      'extend',          // Tool ID
      'Estendi',         // Tool name in Italian
      'open_in_full',    // Material icon name
      'crosshair',       // Cursor type
      undefined,         // No specific style needed
      0                  // No fixed number of points required
    );
  }
  
  onActivate(): void {
    super.onActivate();
    this.reset();
    this.selectionMode = 'boundary';
    
    // Show instructions in the command line
    const store = useTechnicalDrawingStore.getState();
    if (store.setCommandPrompt) {
      store.setCommandPrompt('Seleziona gli oggetti limite e premi Invio, o Invio per usare tutti gli oggetti');
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
  
  onMouseDown(point: Point, event: React.MouseEvent): void {
    const store = useTechnicalDrawingStore.getState();
    
    // First select boundary entities, then the entity to extend
    if (this.selectionMode === 'boundary') {
      // Find entity under the mouse
      const entityId = this.findEntityAtPoint(point);
      
      if (entityId) {
        // Toggle boundary entity selection
        if (this.boundaryEntityIds.includes(entityId)) {
          this.boundaryEntityIds = this.boundaryEntityIds.filter(id => id !== entityId);
        } else {
          this.boundaryEntityIds.push(entityId);
        }
        
        // Update UI feedback
        store.selectEntities(this.boundaryEntityIds);
      }
    } else {
      // Entity selection mode - select the entity to extend
      const entityId = this.findEntityAtPoint(point);
      
      if (entityId) {
        this.selectedEntityId = entityId;
        
        // Find all potential intersection points if this entity is extended
        this.findExtensionIntersections(point);
        
        // If we have intersection points, extend the entity
        if (this.intersectionPoints.length > 0) {
          // Find closest intersection to extend to
          const closestIntersection = this.findClosestIntersection(point);
          
          if (closestIntersection) {
            this.extendEntityToIntersection(closestIntersection);
          }
        }
        
        // Reset for the next extension operation but stay in entity selection mode
        this.selectedEntityId = null;
        this.intersectionPoints = [];
      }
    }
  }
  
  onKeyDown(event: React.KeyboardEvent): void {
    super.onKeyDown(event);
    
    // Switch modes when Enter is pressed
    if (event.key === 'Enter') {
      if (this.selectionMode === 'boundary') {
        this.selectionMode = 'entity';
        
        // If no boundaries selected, use all entities as boundaries
        if (this.boundaryEntityIds.length === 0) {
          const store = useTechnicalDrawingStore.getState();
          this.boundaryEntityIds = Object.keys(store.entities);
        }
        
        // Clear selection highlights but keep boundary IDs
        const store = useTechnicalDrawingStore.getState();
        store.clearSelection();
        
        // Update command prompt
        if (store.setCommandPrompt) {
          store.setCommandPrompt('Seleziona un\'entità da estendere');
        }
      }
    }
    
    // Escape to reset or exit
    if (event.key === 'Escape') {
      if (this.selectionMode === 'entity') {
        // Go back to boundary selection
        this.selectionMode = 'boundary';
        this.boundaryEntityIds = [];
        const store = useTechnicalDrawingStore.getState();
        store.clearSelection();
        
        if (store.setCommandPrompt) {
          store.setCommandPrompt('Seleziona gli oggetti limite e premi Invio, o Invio per usare tutti gli oggetti');
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
    
    // Implementation depends on your entity hit-testing logic
    // This is a simplified example
    for (const [id, entity] of Object.entries(entities)) {
      // Skip locked or invisible entities
      if (entity.locked || !entity.visible) continue;
      
      // Check if point is on entity
      const isOnEntity = this.isPointOnEntity(point, entity);
      if (isOnEntity) {
        return id;
      }
    }
    
    return null;
  }
  
  isPointOnEntity(point: Point, entity: any): boolean {
    // Simplified hit testing implementation
    // In a real application, you would use more accurate hit testing
    
    // For lines
    if (entity.type === DrawingEntityType.LINE) {
      return this.isPointNearLine(
        point, 
        entity.startPoint, 
        entity.endPoint, 
        5 // tolerance in pixels
      );
    }
    
    // For circles
    if (entity.type === DrawingEntityType.CIRCLE) {
      const dx = point.x - entity.center.x;
      const dy = point.y - entity.center.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return Math.abs(distance - entity.radius) < 5; // tolerance in pixels
    }
    
    // TODO: Add hit testing for other entity types
    
    return false;
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
  
  findExtensionIntersections(clickPoint: Point): void {
    if (!this.selectedEntityId) return;
    
    const store = useTechnicalDrawingStore.getState();
    const selectedEntity = store.entities[this.selectedEntityId];
    
    if (!selectedEntity) return;
    
    this.intersectionPoints = [];
    
    // Only support lines for now
    if (selectedEntity.type !== DrawingEntityType.LINE) return;
    
    // Determine which end of the line to extend based on which end is closer to the click point
    const startPoint = selectedEntity.startPoint;
    const endPoint = selectedEntity.endPoint;
    
    const distToStart = this.getDistanceSquared(clickPoint, startPoint);
    const distToEnd = this.getDistanceSquared(clickPoint, endPoint);
    
    let linePointToExtend: Point;
    let fixedPoint: Point;
    
    if (distToStart < distToEnd) {
      // Extend from start point
      linePointToExtend = startPoint;
      fixedPoint = endPoint;
    } else {
      // Extend from end point
      linePointToExtend = endPoint;
      fixedPoint = startPoint;
    }
    
    // Calculate the direction vector of the line
    const dirX = fixedPoint.x - linePointToExtend.x;
    const dirY = fixedPoint.y - linePointToExtend.y;
    
    // Normalize the direction vector
    const length = Math.sqrt(dirX * dirX + dirY * dirY);
    const normalizedDirX = dirX / length;
    const normalizedDirY = dirY / length;
    
    // Extend the line in the opposite direction (by a large amount)
    const extensionLength = 10000; // A very large value to ensure we find all intersections
    const extendedPoint = {
      x: linePointToExtend.x - normalizedDirX * extensionLength,
      y: linePointToExtend.y - normalizedDirY * extensionLength
    };
    
    // Check for intersections with all boundary entities
    for (const boundaryId of this.boundaryEntityIds) {
      if (boundaryId === this.selectedEntityId) continue;
      
      const boundaryEntity = store.entities[boundaryId];
      if (!boundaryEntity) continue;
      
      // Currently only supporting line-line intersections
      if (boundaryEntity.type === DrawingEntityType.LINE) {
        const intersection = calculateIntersection(
          linePointToExtend, extendedPoint,
          boundaryEntity.startPoint, boundaryEntity.endPoint
        );
        
        if (intersection) {
          // Ensure the intersection is in the direction of the extension
          const toIntersectionX = intersection.x - linePointToExtend.x;
          const toIntersectionY = intersection.y - linePointToExtend.y;
          
          // Check if the vectors point in opposite directions (dot product < 0)
          const dotProduct = normalizedDirX * toIntersectionX + normalizedDirY * toIntersectionY;
          
          if (dotProduct < 0) {
            // This is a valid extension point
            this.intersectionPoints.push(intersection);
          }
        }
      }
      
      // TODO: Add support for other entity types (circles, arcs, etc.)
    }
  }
  
  findClosestIntersection(clickPoint: Point): Point | null {
    if (this.intersectionPoints.length === 0) return null;
    
    const store = useTechnicalDrawingStore.getState();
    const entity = store.entities[this.selectedEntityId!];
    
    // For lines, find the closest intersection to the line end that's being extended
    if (entity.type === DrawingEntityType.LINE) {
      const startPoint = entity.startPoint;
      const endPoint = entity.endPoint;
      
      // Determine which end to extend
      const distToStart = this.getDistanceSquared(clickPoint, startPoint);
      const distToEnd = this.getDistanceSquared(clickPoint, endPoint);
      
      const linePointToExtend = distToStart < distToEnd ? startPoint : endPoint;
      
      // Find closest intersection to the point being extended
      let closestPoint = this.intersectionPoints[0];
      let minDistance = this.getDistanceSquared(linePointToExtend, closestPoint);
      
      for (let i = 1; i < this.intersectionPoints.length; i++) {
        const distance = this.getDistanceSquared(linePointToExtend, this.intersectionPoints[i]);
        if (distance < minDistance) {
          minDistance = distance;
          closestPoint = this.intersectionPoints[i];
        }
      }
      
      return closestPoint;
    }
    
    return null;
  }
  
  extendEntityToIntersection(intersectionPoint: Point): void {
    if (!this.selectedEntityId) return;
    
    const store = useTechnicalDrawingStore.getState();
    const entity = store.entities[this.selectedEntityId];
    
    if (!entity) return;
    
    // Implementation depends on entity type
    if (entity.type === DrawingEntityType.LINE) {
      this.extendLine(entity, intersectionPoint);
    }
    
    // TODO: Add extension for other entity types
  }
  
  extendLine(lineEntity: any, intersectionPoint: Point): void {
    const store = useTechnicalDrawingStore.getState();
    
    // Create a copy of the line
    const newLine = { ...lineEntity };
    
    // Determine which end to extend based on distance
    const distToStart = this.getDistanceSquared(intersectionPoint, lineEntity.startPoint);
    const distToEnd = this.getDistanceSquared(intersectionPoint, lineEntity.endPoint);
    
    if (distToStart < distToEnd) {
      // Extend the start point
      newLine.startPoint = { ...intersectionPoint };
    } else {
      // Extend the end point
      newLine.endPoint = { ...intersectionPoint };
    }
    
    // Update the entity in the store
    store.updateEntity(this.selectedEntityId, newLine);
  }
  
  getDistanceSquared(p1: Point, p2: Point): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return dx * dx + dy * dy;
  }
  
  reset(): void {
    super.reset();
    this.selectedEntityId = null;
    this.boundaryEntityIds = [];
    this.intersectionPoints = [];
    
    // Clear any selection in the store
    const store = useTechnicalDrawingStore.getState();
    store.clearSelection();
  }
  
  renderPreview(ctx: CanvasRenderingContext2D): void {
    // Highlight boundary entities
    if (this.boundaryEntityIds.length > 0 && this.selectionMode === 'boundary') {
      const store = useTechnicalDrawingStore.getState();
      
      ctx.save();
      ctx.strokeStyle = '#0066FF';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      
      for (const id of this.boundaryEntityIds) {
        const entity = store.entities[id];
        if (entity) {
          // Render highlight based on entity type
          if (entity.type === DrawingEntityType.LINE) {
            ctx.beginPath();
            ctx.moveTo(entity.startPoint.x, entity.startPoint.y);
            ctx.lineTo(entity.endPoint.x, entity.endPoint.y);
            ctx.stroke();
          }
          // Add highlights for other entity types
        }
      }
      
      ctx.restore();
    }
    
    // Show potential intersection points for extension
    if (this.selectedEntityId && this.intersectionPoints.length > 0) {
      ctx.save();
      ctx.fillStyle = '#00CC00';  // Green for extension points
      
      for (const point of this.intersectionPoints) {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // If we have a selected entity and intersection points, show extension preview
      const store = useTechnicalDrawingStore.getState();
      const entity = store.entities[this.selectedEntityId];
      
      if (entity && entity.type === DrawingEntityType.LINE) {
        const startPoint = entity.startPoint;
        const endPoint = entity.endPoint;
        
        // Show dashed line for extension preview to the closest intersection
        const closestIntersection = this.findClosestIntersection({ x: 0, y: 0 }); // Dummy point, actual calculation uses entity geometry
        
        if (closestIntersection) {
          ctx.strokeStyle = '#00CC00';
          ctx.lineWidth = 1;
          ctx.setLineDash([5, 5]);
          
          // Determine which end to extend
          const distFromStartToInt = this.getDistanceSquared(startPoint, closestIntersection);
          const distFromEndToInt = this.getDistanceSquared(endPoint, closestIntersection);
          
          ctx.beginPath();
          if (distFromStartToInt < distFromEndToInt) {
            // Extend from start point
            ctx.moveTo(startPoint.x, startPoint.y);
            ctx.lineTo(closestIntersection.x, closestIntersection.y);
          } else {
            // Extend from end point
            ctx.moveTo(endPoint.x, endPoint.y);
            ctx.lineTo(closestIntersection.x, closestIntersection.y);
          }
          ctx.stroke();
        }
      }
      
      ctx.restore();
    }
  }
}

/**
 * Componente di integrazione React per ExtendTool
 * React integration component for ExtendTool
 */
const ExtendToolComponent: React.FC = () => {
  const toolInstance = useRef<ExtendTool | null>(null);
  
  useEffect(() => {
    // Crea l'istanza dello strumento
    // Create the tool instance
    if (!toolInstance.current) {
      toolInstance.current = new ExtendTool();
    }
    
    // Cleanup quando il componente viene smontato
    // Cleanup when component is unmounted
    return () => {
      // Eventuale pulizia
      // Potential cleanup
    };
  }, []);
  
  return null; // Questo componente non renderizza UI propria
};

export default ExtendToolComponent;