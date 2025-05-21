import { DrawingEntity, Point, RectangleEntity, CircleEntity, LineEntity, PolylineEntity } from '../../../../types/TechnicalDrawingTypes';

export interface Viewport {
  id: string;
  name: string;
  position: Point;
  width: number;
  height: number;
  rotation: number;
  scale: number;
  pan: Point;
  entityIds: string[];
}

/**
 * Class responsible for managing multiple viewports in a technical drawing
 */
export class ViewportManager {
  private viewports: Map<string, Viewport> = new Map();
  private activeViewportId: string | null = null;
  
  /**
   * Create a new viewport manager
   */
  constructor() {}
  
  /**
   * Get all viewports
   */
  getViewports(): Viewport[] {
    return Array.from(this.viewports.values());
  }
  
  /**
   * Get a viewport by ID
   */
  getViewport(id: string): Viewport | undefined {
    return this.viewports.get(id);
  }
  
  /**
   * Get the active viewport
   */
  getActiveViewport(): Viewport | null {
    if (!this.activeViewportId) return null;
    return this.viewports.get(this.activeViewportId) || null;
  }
  
  /**
   * Set the active viewport
   */
  setActiveViewport(id: string | null): boolean {
    if (id === null) {
      this.activeViewportId = null;
      return true;
    }
    
    if (this.viewports.has(id)) {
      this.activeViewportId = id;
      return true;
    }
    
    return false;
  }
  
  /**
   * Create a new viewport
   */
  createViewport(viewport: Omit<Viewport, 'id' | 'entityIds'>): Viewport {
    const id = `viewport-${Date.now()}`;
    const newViewport: Viewport = {
      ...viewport,
      id,
      entityIds: []
    };
    
    this.viewports.set(id, newViewport);
    
    // Set as active if it's the first viewport
    if (this.viewports.size === 1) {
      this.activeViewportId = id;
    }
    
    return newViewport;
  }
  
  /**
   * Update an existing viewport
   */
  updateViewport(id: string, updates: Partial<Viewport>): boolean {
    const viewport = this.viewports.get(id);
    if (!viewport) return false;
    
    this.viewports.set(id, { ...viewport, ...updates });
    return true;
  }
  
  /**
   * Remove a viewport
   */
  removeViewport(id: string): boolean {
    // If removing active viewport, clear active
    if (id === this.activeViewportId) {
      this.activeViewportId = null;
    }
    
    return this.viewports.delete(id);
  }
  
  /**
   * Add entities to a viewport
   */
  addEntitiesToViewport(viewportId: string, entityIds: string[]): boolean {
    const viewport = this.viewports.get(viewportId);
    if (!viewport) return false;
    
    // Add unique entity IDs
    const uniqueEntityIds = new Set([...viewport.entityIds, ...entityIds]);
    
    this.viewports.set(viewportId, {
      ...viewport,
      entityIds: Array.from(uniqueEntityIds)
    });
    
    return true;
  }
  
  /**
   * Remove entities from a viewport
   */
  removeEntitiesFromViewport(viewportId: string, entityIds: string[]): boolean {
    const viewport = this.viewports.get(viewportId);
    if (!viewport) return false;
    
    const idsToRemove = new Set(entityIds);
    const filteredIds = viewport.entityIds.filter(id => !idsToRemove.has(id));
    
    this.viewports.set(viewportId, {
      ...viewport,
      entityIds: filteredIds
    });
    
    return true;
  }
  
  /**
   * Check if an entity is in a viewport
   */
  isEntityInViewport(entityId: string, viewportId: string): boolean {
    const viewport = this.viewports.get(viewportId);
    if (!viewport) return false;
    
    return viewport.entityIds.includes(entityId);
  }
  
  /**
   * Get all entities in a viewport
   */
  getViewportEntities(viewportId: string, allEntities: Record<string, DrawingEntity>): DrawingEntity[] {
    const viewport = this.viewports.get(viewportId);
    if (!viewport) return [];
    
    return viewport.entityIds
      .map(id => allEntities[id])
      .filter(Boolean);
  }
  
  /**
   * Convert a point from world coordinates to viewport coordinates
   */
  worldToViewport(point: Point, viewportId: string): Point | null {
    const viewport = this.viewports.get(viewportId);
    if (!viewport) return null;
    
    // Apply viewport transformations (reverse order: scale, rotate, translate)
    
    // 1. Translate to viewport origin
    const translatedX = point.x - viewport.position.x;
    const translatedY = point.y - viewport.position.y;
    
    // 2. Rotate around viewport origin (if needed)
    let rotatedX = translatedX;
    let rotatedY = translatedY;
    
    if (viewport.rotation !== 0) {
      const cos = Math.cos(-viewport.rotation);
      const sin = Math.sin(-viewport.rotation);
      
      rotatedX = translatedX * cos - translatedY * sin;
      rotatedY = translatedX * sin + translatedY * cos;
    }
    
    // 3. Apply scale and pan
    const scaledX = rotatedX * viewport.scale + viewport.pan.x;
    const scaledY = rotatedY * viewport.scale + viewport.pan.y;
    
    return { x: scaledX, y: scaledY };
  }
  
  /**
   * Convert a point from viewport coordinates to world coordinates
   */
  viewportToWorld(point: Point, viewportId: string): Point | null {
    const viewport = this.viewports.get(viewportId);
    if (!viewport) return null;
    
    // Apply viewport transformations (reverse order of worldToViewport)
    
    // 1. Remove scale and pan
    const unscaledX = (point.x - viewport.pan.x) / viewport.scale;
    const unscaledY = (point.y - viewport.pan.y) / viewport.scale;
    
    // 2. Rotate back (if needed)
    let unrotatedX = unscaledX;
    let unrotatedY = unscaledY;
    
    if (viewport.rotation !== 0) {
      const cos = Math.cos(viewport.rotation);
      const sin = Math.sin(viewport.rotation);
      
      unrotatedX = unscaledX * cos - unscaledY * sin;
      unrotatedY = unscaledX * sin + unscaledY * cos;
    }
    
    // 3. Translate back to world coordinates
    const worldX = unrotatedX + viewport.position.x;
    const worldY = unrotatedY + viewport.position.y;
    
    return { x: worldX, y: worldY };
  }
  
  /**
   * Check if a point is inside a viewport
   */
  isPointInViewport(point: Point, viewportId: string): boolean {
    const viewport = this.viewports.get(viewportId);
    if (!viewport) return false;
    
    // Check if point is within viewport bounds
    return (
      point.x >= viewport.position.x &&
      point.x <= viewport.position.x + viewport.width &&
      point.y >= viewport.position.y &&
      point.y <= viewport.position.y + viewport.height
    );
  }
  
  /**
   * Check if an entity is visible in a viewport
   */
  isEntityVisibleInViewport(entity: DrawingEntity, viewportId: string): boolean {
    // Entity must be in the viewport's entity list
    if (!this.isEntityInViewport(entity.id, viewportId)) return false;
    
    // Entity must be visible
    if (!entity.visible) return false;
    
    return true;
  }
  
  /**
   * Create a standard 4-viewport layout
   */
  createStandardViewports(
    sheetWidth: number,
    sheetHeight: number,
    margin: number = 10
  ): void {
    // Clear existing viewports
    this.viewports.clear();
    this.activeViewportId = null;
    
    // Calculate viewport dimensions
    const availableWidth = sheetWidth - margin * 3;
    const availableHeight = sheetHeight - margin * 3;
    const vpWidth = availableWidth / 2;
    const vpHeight = availableHeight / 2;
    
    // Create top-left viewport (top view)
    const topViewport = this.createViewport({
      name: 'Top View',
      position: { x: margin, y: margin },
      width: vpWidth,
      height: vpHeight,
      rotation: 0,
      scale: 1,
      pan: { x: 0, y: 0 }
    });
    
    // Create top-right viewport (front view)
    const frontViewport = this.createViewport({
      name: 'Front View',
      position: { x: margin * 2 + vpWidth, y: margin },
      width: vpWidth,
      height: vpHeight,
      rotation: 0,
      scale: 1,
      pan: { x: 0, y: 0 }
    });
    
    // Create bottom-left viewport (side view)
    const sideViewport = this.createViewport({
      name: 'Side View',
      position: { x: margin, y: margin * 2 + vpHeight },
      width: vpWidth,
      height: vpHeight,
      rotation: 0,
      scale: 1,
      pan: { x: 0, y: 0 }
    });
    
    // Create bottom-right viewport (isometric view)
    const isoViewport = this.createViewport({
      name: 'Isometric View',
      position: { x: margin * 2 + vpWidth, y: margin * 2 + vpHeight },
      width: vpWidth,
      height: vpHeight,
      rotation: 0,
      scale: 1,
      pan: { x: 0, y: 0 }
    });
    
    // Set top viewport as active
    this.activeViewportId = topViewport.id;
  }
  
  /**
   * Render viewport borders and labels
   */
  renderViewportBorders(ctx: CanvasRenderingContext2D, activeOnly: boolean = false): void {
    const viewportsToRender = activeOnly && this.activeViewportId 
      ? [this.viewports.get(this.activeViewportId)].filter(Boolean) as Viewport[]
      : this.getViewports();
    
    for (const viewport of viewportsToRender) {
      // Draw viewport border
      ctx.strokeStyle = viewport.id === this.activeViewportId ? '#0088FF' : '#666666';
      ctx.lineWidth = viewport.id === this.activeViewportId ? 1.5 : 1;
      ctx.setLineDash([]);
      
      ctx.beginPath();
      ctx.rect(
        viewport.position.x,
        viewport.position.y,
        viewport.width,
        viewport.height
      );
      ctx.stroke();
      
      // Draw viewport name
      ctx.fillStyle = viewport.id === this.activeViewportId ? '#0088FF' : '#666666';
      ctx.font = '12px Arial';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(
        viewport.name,
        viewport.position.x + 5,
        viewport.position.y + 5
      );
    }
  }
  
  /**
   * Find the viewport that contains a point
   */
  findViewportAtPoint(point: Point): Viewport | null {
    for (const viewport of Array.from(this.viewports.values())) {
      if (this.isPointInViewport(point, viewport.id)) {
        return viewport;
      }
    }
    
    return null;
  }
  
  /**
   * Zoom a viewport to fit its contents
   */
  zoomToFit(viewportId: string, entities: DrawingEntity[]): boolean {
    const viewport = this.viewports.get(viewportId);
    if (!viewport) return false;
    
    // Filter entities that belong to this viewport
    const viewportEntities = entities.filter(entity => 
      viewport.entityIds.includes(entity.id)
    );
    
    if (viewportEntities.length === 0) return false;
    
    // Calculate bounding box of all entities
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    
    for (const entity of viewportEntities) {
      // Handle different entity types based on their structure
      if (entity.type === 'rectangle') {
        const rect = entity as RectangleEntity;
        minX = Math.min(minX, rect.position.x);
        minY = Math.min(minY, rect.position.y);
        maxX = Math.max(maxX, rect.position.x + rect.width);
        maxY = Math.max(maxY, rect.position.y + rect.height);
              } else if (entity.type === 'circle') {
          const circle = entity as CircleEntity;
          minX = Math.min(minX, circle.center.x - circle.radius);
                    minY = Math.min(minY, circle.center.y - circle.radius);
          maxX = Math.max(maxX, circle.center.x + circle.radius);
          maxY = Math.max(maxY, circle.center.y + circle.radius);
        } else if (entity.type === 'line') {
          const line = entity as LineEntity;
          minX = Math.min(minX, line.startPoint.x, line.endPoint.x);
          minY = Math.min(minY, line.startPoint.y, line.endPoint.y);
          maxX = Math.max(maxX, line.startPoint.x, line.endPoint.x);
          maxY = Math.max(maxY, line.startPoint.y, line.endPoint.y);
        } else if (entity.type === 'polyline') {
          const polyline = entity as PolylineEntity;
          for (const point of polyline.points) {
          minX = Math.min(minX, point.x);
          minY = Math.min(minY, point.y);
          maxX = Math.max(maxX, point.x);
          maxY = Math.max(maxY, point.y);
        }
      }
    }
    
    // Add padding
    const padding = 10;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;
    
    // Calculate scale to fit
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    
    if (contentWidth <= 0 || contentHeight <= 0) return false;
    
    const scaleX = viewport.width / contentWidth;
    const scaleY = viewport.height / contentHeight;
    const scale = Math.min(scaleX, scaleY);
    
    // Calculate center of content
    const contentCenterX = (minX + maxX) / 2;
    const contentCenterY = (minY + maxY) / 2;
    
    // Calculate viewport center
    const viewportCenterX = viewport.width / 2;
    const viewportCenterY = viewport.height / 2;
    
    // Calculate pan to center content
    const panX = viewportCenterX - contentCenterX * scale;
    const panY = viewportCenterY - contentCenterY * scale;
    
    // Update viewport
    this.updateViewport(viewportId, {
      scale,
      pan: { x: panX, y: panY }
    });
    
    return true;
  }
} 