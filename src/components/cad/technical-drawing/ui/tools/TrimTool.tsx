// src/components/cad/tools/TrimTool.tsx
// Strumento per tagliare entità in corrispondenza di altre entità
// Tool for trimming entities at intersections with other entities

import React, { useEffect, useRef, useState } from 'react';
import { useTechnicalDrawingStore } from '../../../store/technicalDrawingStore';
import { BaseTool } from '../technical-drawing/core/ToolsManager';
import { Point, DrawingEntityType } from '../../../types/TechnicalDrawingTypes';
import { calculateIntersection } from '../technical-drawing/utils/geometryUtils';

/**
 * TrimTool - Strumento per tagliare entità alle intersezioni
 * TrimTool - Tool for trimming entities at intersections
 * 
 * Permette di selezionare un'entità da tagliare e un punto che indica quale parte mantenere
 * Allows selecting an entity to trim and a point indicating which part to keep
 */
export class TrimTool extends BaseTool {
  private selectedEntityId: string | null = null;
  private boundaryEntityIds: string[] = [];
  private intersectionPoints: Point[] = [];
  private selectionMode: 'boundary' | 'entity' = 'boundary';
  
  constructor() {
    super(
      'trim',            // Tool ID
      'Taglia',          // Tool name in Italian
      'content_cut',     // Material icon name
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
      store.setCommandPrompt('Seleziona gli oggetti di taglio e premi Invio, o Invio per usare tutti gli oggetti');
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
    
    // First select boundary entities, then the entity to trim
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
      // Entity selection mode - select the entity to trim
      const entityId = this.findEntityAtPoint(point);
      
      if (entityId) {
        this.selectedEntityId = entityId;
        
        // Find all intersection points between this entity and the boundary entities
        this.findIntersections();
        
        // If we have intersection points, select the part to trim
        if (this.intersectionPoints.length > 0) {
          // Find closest intersection to the click point
          const closestPoint = this.findClosestPoint(point, this.intersectionPoints);
          
          // Determine which part to keep (before or after the intersection)
          this.trimEntityAtIntersection(closestPoint, point);
        }
        
        // Reset for the next trim operation but stay in entity selection mode
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
        store.clearSelection();
        
        // Update command prompt
        if (store.setCommandPrompt) {
          store.setCommandPrompt('Seleziona un\'entità da tagliare');
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
          store.setCommandPrompt('Seleziona gli oggetti di taglio e premi Invio, o Invio per usare tutti gli oggetti');
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
      
      // Check if point is on entity - this would use your existing hit testing
      const isOnEntity = this.isPointOnEntity(point, entity);
      if (isOnEntity) {
        return id;
      }
    }
    
    return null;
  }
  
  isPointOnEntity(point: Point, entity: any): boolean {
    // This is a simplified implementation
    // In a real application, you would use proper hit testing based on entity type
    
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
  
  findIntersections(): void {
    if (!this.selectedEntityId) return;
    
    const store = useTechnicalDrawingStore.getState();
    const selectedEntity = store.entities[this.selectedEntityId];
    
    if (!selectedEntity) return;
    
    this.intersectionPoints = [];
    
    // Find intersections with all boundary entities
    for (const boundaryId of this.boundaryEntityIds) {
      if (boundaryId === this.selectedEntityId) continue;
      
      const boundaryEntity = store.entities[boundaryId];
      if (!boundaryEntity) continue;
      
      // Calculate intersections based on entity types
      // This is a simplified example
      const intersections = this.calculateEntityIntersections(selectedEntity, boundaryEntity);
      this.intersectionPoints.push(...intersections);
    }
  }
  
  calculateEntityIntersections(entity1: any, entity2: any): Point[] {
    // This is a simplified implementation
    // In a real application, you'd handle all entity type combinations
    
    // Line-Line intersection
    if (entity1.type === DrawingEntityType.LINE && entity2.type === DrawingEntityType.LINE) {
      const intersection = calculateIntersection(
        entity1.startPoint, entity1.endPoint,
        entity2.startPoint, entity2.endPoint
      );
      
      return intersection ? [intersection] : [];
    }
    
    // TODO: Add other intersection calculations (line-circle, circle-circle, etc.)
    
    return [];
  }
  
  findClosestPoint(target: Point, points: Point[]): Point {
    if (points.length === 0) return { x: 0, y: 0 };
    
    let closestPoint = points[0];
    let minDistance = Number.MAX_VALUE;
    
    for (const point of points) {
      const dx = target.x - point.x;
      const dy = target.y - point.y;
      const distance = dx * dx + dy * dy; // Use squared distance for performance
      
      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = point;
      }
    }
    
    return closestPoint;
  }
  
  trimEntityAtIntersection(intersectionPoint: Point, clickPoint: Point): void {
    if (!this.selectedEntityId) return;
    
    const store = useTechnicalDrawingStore.getState();
    const entity = store.entities[this.selectedEntityId];
    
    if (!entity) return;
    
    // Implementation depends on entity type
    if (entity.type === DrawingEntityType.LINE) {
      this.trimLine(entity, intersectionPoint, clickPoint);
    }
    // TODO: Add trimming for other entity types
  }
  
  trimLine(lineEntity: any, intersectionPoint: Point, clickPoint: Point): void {
    const store = useTechnicalDrawingStore.getState();
    
    // Determine which side to keep based on which end is closer to the click point
    const distToStart = this.getDistanceSquared(clickPoint, lineEntity.startPoint);
    const distToEnd = this.getDistanceSquared(clickPoint, lineEntity.endPoint);
    
    // Create a new line with the part we want to keep
    const newLine = { ...lineEntity };
    
    if (distToStart < distToEnd) {
      // Keep the start side
      newLine.endPoint = { ...intersectionPoint };
    } else {
      // Keep the end side
      newLine.startPoint = { ...intersectionPoint };
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
          // This is a simplified example
          if (entity.type === DrawingEntityType.LINE) {
            ctx.beginPath();
            ctx.moveTo(entity.startPoint.x, entity.startPoint.y);
            ctx.lineTo(entity.endPoint.x, entity.endPoint.y);
            ctx.stroke();
          }
          // TODO: Add highlight rendering for other entity types
        }
      }
      
      ctx.restore();
    }
    
    // Show intersection points if we have an entity selected for trimming
    if (this.selectedEntityId && this.intersectionPoints.length > 0) {
      ctx.save();
      ctx.fillStyle = '#FF0000';
      
      for (const point of this.intersectionPoints) {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();
    }
  }
}

/**
 * Componente di integrazione React per TrimTool
 * React integration component for TrimTool
 */
const TrimToolComponent: React.FC = () => {
  const toolInstance = useRef<TrimTool | null>(null);
  
  useEffect(() => {
    // Crea l'istanza dello strumento
    // Create the tool instance
    if (!toolInstance.current) {
      toolInstance.current = new TrimTool();
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

export default TrimToolComponent;