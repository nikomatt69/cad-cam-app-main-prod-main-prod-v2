// src/components/cad/technical-drawing/core/performance/RenderOptimizer.ts

import { AnyEntity, Point, Bounds } from '../../TechnicalDrawingTypes';

export interface ViewportInfo {
  bounds: Bounds;
  zoom: number;
  pan: Point;
  width: number;
  height: number;
}

export interface RenderChunk {
  id: string;
  bounds: Bounds;
  entities: AnyEntity[];
  level: number;
  lastRendered: number;
  renderCount: number;
  dirty: boolean;
}

export interface PerformanceMetrics {
  entityCount: number;
  visibleEntityCount: number;
  renderTime: number;
  frameRate: number;
  memoryUsage: number;
  chunkCount: number;
  culledEntityCount: number;
}

export class RenderOptimizer {
  private chunks: Map<string, RenderChunk> = new Map();
  private entityToChunk: Map<string, string> = new Map();
  private chunkSize: number = 1000; // Units in drawing space
  private maxEntitiesPerChunk: number = 500;
  private renderCache: Map<string, ImageData> = new Map();
  private performanceMetrics: PerformanceMetrics = {
    entityCount: 0,
    visibleEntityCount: 0,
    renderTime: 0,
    frameRate: 60,
    memoryUsage: 0,
    chunkCount: 0,
    culledEntityCount: 0
  };
  private frameBuffer: HTMLCanvasElement | null = null;
  private offscreenCanvases: Map<string, HTMLCanvasElement> = new Map();

  constructor(chunkSize: number = 1000, maxEntitiesPerChunk: number = 500) {
    this.chunkSize = chunkSize;
    this.maxEntitiesPerChunk = maxEntitiesPerChunk;
    this.initializeFrameBuffer();
  }

  /**
   * Initialize frame buffer for off-screen rendering
   */
  private initializeFrameBuffer(): void {
    this.frameBuffer = document.createElement('canvas');
    this.frameBuffer.width = 2048;
    this.frameBuffer.height = 2048;
  }

  /**
   * Update entities and rebuild spatial index
   */
  updateEntities(entities: Record<string, AnyEntity>): void {
    const startTime = performance.now();
    
    // Clear existing chunks and mappings
    this.chunks.clear();
    this.entityToChunk.clear();
    
    // Create chunks based on spatial distribution
    const entitiesArray = Object.values(entities);
    this.performanceMetrics.entityCount = entitiesArray.length;
    
    // Group entities by spatial location
    for (const entity of entitiesArray) {
      if (!entity.visible) continue;
      
      const entityBounds = this.getEntityBounds(entity);
      const chunkIds = this.getChunkIdsForBounds(entityBounds);
      
      for (const chunkId of chunkIds) {
        this.addEntityToChunk(entity, chunkId);
      }
    }
    
    // Update performance metrics
    this.performanceMetrics.chunkCount = this.chunks.size;
    this.performanceMetrics.renderTime = performance.now() - startTime;
  }

  /**
   * Get entities visible in viewport with frustum culling
   */
  getVisibleEntities(viewport: ViewportInfo): AnyEntity[] {
    const startTime = performance.now();
    
    // Expand viewport bounds slightly to account for entities partially visible
    const padding = 50 / viewport.zoom; // Pixels to world units
    const expandedBounds: Bounds = {
      minX: viewport.bounds.minX - padding,
      minY: viewport.bounds.minY - padding,
      maxX: viewport.bounds.maxX + padding,
      maxY: viewport.bounds.maxY + padding
    };
    
    const visibleEntities: AnyEntity[] = [];
    const chunkIds = this.getChunkIdsForBounds(expandedBounds);
    
    for (const chunkId of chunkIds) {
      const chunk = this.chunks.get(chunkId);
      if (!chunk) continue;
      
      // Check if chunk bounds intersect with viewport
      if (this.boundsIntersect(chunk.bounds, expandedBounds)) {
        for (const entity of chunk.entities) {
          const entityBounds = this.getEntityBounds(entity);
          
          // Detailed intersection test for entity
          if (this.boundsIntersect(entityBounds, expandedBounds)) {
            visibleEntities.push(entity);
          }
        }
      }
    }
    
    // Update metrics
    this.performanceMetrics.visibleEntityCount = visibleEntities.length;
    this.performanceMetrics.culledEntityCount = this.performanceMetrics.entityCount - visibleEntities.length;
    this.performanceMetrics.renderTime = performance.now() - startTime;
    
    return visibleEntities;
  }

  /**
   * Render entities with level of detail optimization
   */
  renderOptimized(
    ctx: CanvasRenderingContext2D,
    entities: AnyEntity[],
    viewport: ViewportInfo,
    renderEntity: (ctx: CanvasRenderingContext2D, entity: AnyEntity, lod: number) => void
  ): void {
    const startTime = performance.now();
    
    // Sort entities by importance (size, type, etc.)
    const sortedEntities = this.sortEntitiesByImportance(entities, viewport);
    
    // Determine level of detail based on zoom
    const lod = this.calculateLevelOfDetail(viewport.zoom);
    
    // Batch render similar entities for performance
    const entityBatches = this.groupEntitiesForBatching(sortedEntities);
    
    for (const batch of entityBatches) {
      this.renderEntityBatch(ctx, batch, lod, renderEntity);
    }
    
    this.performanceMetrics.renderTime = performance.now() - startTime;
    this.updateFrameRate();
  }

  /**
   * Get cached render data for a chunk
   */
  getCachedChunkRender(chunkId: string, viewport: ViewportInfo): ImageData | null {
    const chunk = this.chunks.get(chunkId);
    if (!chunk || chunk.dirty) return null;
    
    // Check if cached render is still valid for current viewport
    const cacheKey = `${chunkId}_${Math.round(viewport.zoom * 100)}`;
    return this.renderCache.get(cacheKey) || null;
  }

  /**
   * Cache rendered chunk
   */
  cacheChunkRender(chunkId: string, viewport: ViewportInfo, imageData: ImageData): void {
    const cacheKey = `${chunkId}_${Math.round(viewport.zoom * 100)}`;
    this.renderCache.set(cacheKey, imageData);
    
    // Limit cache size
    if (this.renderCache.size > 100) {
      const oldestKey = this.renderCache.keys().next().value;
      this.renderCache.delete(oldestKey);
    }
    
    // Mark chunk as clean
    const chunk = this.chunks.get(chunkId);
    if (chunk) {
      chunk.dirty = false;
      chunk.lastRendered = Date.now();
      chunk.renderCount++;
    }
  }

  /**
   * Mark entity as dirty (needs re-render)
   */
  markEntityDirty(entityId: string): void {
    const chunkId = this.entityToChunk.get(entityId);
    if (chunkId) {
      const chunk = this.chunks.get(chunkId);
      if (chunk) {
        chunk.dirty = true;
        
        // Invalidate related cache entries
        for (const [key, _] of this.renderCache) {
          if (key.startsWith(chunkId)) {
            this.renderCache.delete(key);
          }
        }
      }
    }
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Clean up memory and caches
   */
  cleanup(): void {
    this.renderCache.clear();
    this.offscreenCanvases.clear();
    this.chunks.clear();
    this.entityToChunk.clear();
  }

  /**
   * Enable/disable performance optimizations
   */
  setOptimizationLevel(level: 'low' | 'medium' | 'high'): void {
    switch (level) {
      case 'low':
        this.chunkSize = 2000;
        this.maxEntitiesPerChunk = 1000;
        break;
      case 'medium':
        this.chunkSize = 1000;
        this.maxEntitiesPerChunk = 500;
        break;
      case 'high':
        this.chunkSize = 500;
        this.maxEntitiesPerChunk = 200;
        break;
    }
  }

  // Private helper methods

  private getEntityBounds(entity: AnyEntity): Bounds {
    // Calculate bounds based on entity type
    switch (entity.type) {
      case 'line': {
        const line = entity as any;
        return {
          minX: Math.min(line.startPoint.x, line.endPoint.x),
          minY: Math.min(line.startPoint.y, line.endPoint.y),
          maxX: Math.max(line.startPoint.x, line.endPoint.x),
          maxY: Math.max(line.startPoint.y, line.endPoint.y)
        };
      }
      case 'circle': {
        const circle = entity as any;
        return {
          minX: circle.center.x - circle.radius,
          minY: circle.center.y - circle.radius,
          maxX: circle.center.x + circle.radius,
          maxY: circle.center.y + circle.radius
        };
      }
      case 'rectangle': {
        const rect = entity as any;
        return {
          minX: rect.position.x,
          minY: rect.position.y,
          maxX: rect.position.x + rect.width,
          maxY: rect.position.y + rect.height
        };
      }
      default: {
        // Default bounds for unknown entities
        return {
          minX: 0,
          minY: 0,
          maxX: 10,
          maxY: 10
        };
      }
    }
  }

  private getChunkIdsForBounds(bounds: Bounds): string[] {
    const chunkIds: string[] = [];
    
    const startChunkX = Math.floor(bounds.minX / this.chunkSize);
    const startChunkY = Math.floor(bounds.minY / this.chunkSize);
    const endChunkX = Math.floor(bounds.maxX / this.chunkSize);
    const endChunkY = Math.floor(bounds.maxY / this.chunkSize);
    
    for (let x = startChunkX; x <= endChunkX; x++) {
      for (let y = startChunkY; y <= endChunkY; y++) {
        chunkIds.push(`chunk_${x}_${y}`);
      }
    }
    
    return chunkIds;
  }

  private addEntityToChunk(entity: AnyEntity, chunkId: string): void {
    let chunk = this.chunks.get(chunkId);
    
    if (!chunk) {
      const [, x, y] = chunkId.split('_').map(Number);
      chunk = {
        id: chunkId,
        bounds: {
          minX: x * this.chunkSize,
          minY: y * this.chunkSize,
          maxX: (x + 1) * this.chunkSize,
          maxY: (y + 1) * this.chunkSize
        },
        entities: [],
        level: 0,
        lastRendered: 0,
        renderCount: 0,
        dirty: true
      };
      this.chunks.set(chunkId, chunk);
    }
    
    // Avoid duplicates
    if (!chunk.entities.find(e => e.id === entity.id)) {
      chunk.entities.push(entity);
      this.entityToChunk.set(entity.id, chunkId);
    }
    
    chunk.dirty = true;
  }

  private boundsIntersect(bounds1: Bounds, bounds2: Bounds): boolean {
    return !(
      bounds1.maxX < bounds2.minX ||
      bounds1.minX > bounds2.maxX ||
      bounds1.maxY < bounds2.minY ||
      bounds1.minY > bounds2.maxY
    );
  }

  private sortEntitiesByImportance(entities: AnyEntity[], viewport: ViewportInfo): AnyEntity[] {
    return entities.sort((a, b) => {
      // Sort by entity type importance (lines first, then circles, etc.)
      const typeOrder = { line: 1, circle: 2, rectangle: 3, text: 4 };
      const aOrder = (typeOrder as any)[a.type] || 999;
      const bOrder = (typeOrder as any)[b.type] || 999;
      
      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }
      
      // Sort by distance from viewport center
      const viewportCenter = {
        x: (viewport.bounds.minX + viewport.bounds.maxX) / 2,
        y: (viewport.bounds.minY + viewport.bounds.maxY) / 2
      };
      
      const aBounds = this.getEntityBounds(a);
      const bBounds = this.getEntityBounds(b);
      
      const aCenter = {
        x: (aBounds.minX + aBounds.maxX) / 2,
        y: (aBounds.minY + aBounds.maxY) / 2
      };
      
      const bCenter = {
        x: (bBounds.minX + bBounds.maxX) / 2,
        y: (bBounds.minY + bBounds.maxY) / 2
      };
      
      const aDistance = Math.sqrt(
        Math.pow(aCenter.x - viewportCenter.x, 2) + 
        Math.pow(aCenter.y - viewportCenter.y, 2)
      );
      
      const bDistance = Math.sqrt(
        Math.pow(bCenter.x - viewportCenter.x, 2) + 
        Math.pow(bCenter.y - viewportCenter.y, 2)
      );
      
      return aDistance - bDistance;
    });
  }

  private calculateLevelOfDetail(zoom: number): number {
    if (zoom < 0.25) return 3; // Very low detail
    if (zoom < 0.5) return 2;  // Low detail
    if (zoom < 2) return 1;    // Medium detail
    return 0;                  // Full detail
  }

  private groupEntitiesForBatching(entities: AnyEntity[]): AnyEntity[][] {
    const batches = new Map<string, AnyEntity[]>();
    
    for (const entity of entities) {
      const batchKey = `${entity.type}_${entity.style.strokeColor}_${entity.style.strokeWidth}`;
      
      if (!batches.has(batchKey)) {
        batches.set(batchKey, []);
      }
      
      batches.get(batchKey)!.push(entity);
    }
    
    return Array.from(batches.values());
  }

  private renderEntityBatch(
    ctx: CanvasRenderingContext2D,
    entities: AnyEntity[],
    lod: number,
    renderEntity: (ctx: CanvasRenderingContext2D, entity: AnyEntity, lod: number) => void
  ): void {
    if (entities.length === 0) return;
    
    // Set common style properties for the batch
    const firstEntity = entities[0];
    ctx.strokeStyle = firstEntity.style.strokeColor || '#000000';
    ctx.lineWidth = firstEntity.style.strokeWidth || 1;
    
    // Apply line dash pattern
    switch (firstEntity.style.strokeStyle) {
      case 'dashed':
        ctx.setLineDash([5, 5]);
        break;
      case 'dotted':
        ctx.setLineDash([2, 2]);
        break;
      case 'dash-dot':
        ctx.setLineDash([5, 2, 2, 2]);
        break;
      default:
        ctx.setLineDash([]);
    }
    
    // Render all entities in the batch
    for (const entity of entities) {
      renderEntity(ctx, entity, lod);
    }
    
    // Reset line dash
    ctx.setLineDash([]);
  }

  private updateFrameRate(): void {
    const now = performance.now();
    if (this.performanceMetrics.renderTime > 0) {
      this.performanceMetrics.frameRate = Math.min(60, 1000 / this.performanceMetrics.renderTime);
    }
  }
}

export default RenderOptimizer;
