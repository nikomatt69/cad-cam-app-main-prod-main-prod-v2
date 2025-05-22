// src/components/cad/technical-drawing/rendering/viewport-manager.ts
// Viewport management system for technical drawing

import { 
  DrawingViewport,
  Point,
  Bounds,
  AnyEntity
} from '../../../../types/TechnicalDrawingTypes';
import { generateBoundsFromEntities } from '../../../../utils/drawing/boundingBoxUtils';

/**
 * Calculate the visible bounds for a viewport
 * @param viewport - The viewport to calculate bounds for
 * @param canvasWidth - Canvas width in pixels
 * @param canvasHeight - Canvas height in pixels
 */
export function calculateVisibleBounds(
  viewport: DrawingViewport,
  canvasWidth: number,
  canvasHeight: number
): Bounds {
  // Calculate based on viewport position, size, pan and zoom
  const { position, width, height, pan, scale } = viewport;
  
  const minX = (position.x - pan.x) / scale;
  const minY = (position.y - pan.y) / scale;
  const maxX = minX + (width / scale);
  const maxY = minY + (height / scale);
  
  return { minX, minY, maxX, maxY };
}

/**
 * Check if an entity is visible within the viewport bounds
 * @param entity - The entity to check
 * @param bounds - The viewport bounds
 * @param padding - Optional padding to include entities slightly outside bounds
 */
export function isEntityVisibleInViewport(
  entity: AnyEntity,
  bounds: Bounds,
  padding: number = 10
): boolean {
  // Get entity bounds
  const entityBounds = generateBoundsFromEntities([entity]);
  if (!entityBounds) return false;
  
  // Add padding to viewport bounds
  const viewportBounds = {
    minX: bounds.minX - padding,
    minY: bounds.minY - padding,
    maxX: bounds.maxX + padding,
    maxY: bounds.maxY + padding
  };
  
  // Check if entity bounds intersect with viewport bounds
  return !(
    entityBounds.maxX < viewportBounds.minX ||
    entityBounds.minX > viewportBounds.maxX ||
    entityBounds.maxY < viewportBounds.minY ||
    entityBounds.minY > viewportBounds.maxY
  );
}

/**
 * Filter entities that are visible in the viewport
 * @param entities - List of entities to filter
 * @param viewport - The viewport to check visibility against
 * @param canvasWidth - Canvas width in pixels
 * @param canvasHeight - Canvas height in pixels
 */
export function filterEntitiesForViewport(
  entities: AnyEntity[],
  viewport: DrawingViewport,
  canvasWidth: number,
  canvasHeight: number
): AnyEntity[] {
  // Calculate viewport bounds
  const bounds = calculateVisibleBounds(viewport, canvasWidth, canvasHeight);
  
  // Filter entities that are visible in the viewport
  return entities.filter(entity => isEntityVisibleInViewport(entity, bounds));
}

/**
 * Calculate the zoom level needed to fit all entities in the viewport
 * @param entities - Entities to fit in the viewport
 * @param viewport - The viewport to adjust
 * @param padding - Padding around entities (percentage of viewport size)
 */
export function calculateZoomToFit(
  entities: AnyEntity[],
  viewport: DrawingViewport,
  padding: number = 0.1
): number {
  if (entities.length === 0) return 1;
  
  // Get bounds of all entities
  const entityBounds = generateBoundsFromEntities(entities);
  if (!entityBounds) return 1;
  
  // Calculate width and height of entity content
  const contentWidth = entityBounds.maxX - entityBounds.minX;
  const contentHeight = entityBounds.maxY - entityBounds.minY;
  
  // Apply padding
  const paddedWidth = contentWidth * (1 + 2 * padding);
  const paddedHeight = contentHeight * (1 + 2 * padding);
  
  // Calculate zoom level
  const zoomX = viewport.width / paddedWidth;
  const zoomY = viewport.height / paddedHeight;
  
  // Return the smaller zoom to ensure all content fits
  return Math.min(zoomX, zoomY);
}

/**
 * Calculate the center point of a set of entities
 * @param entities - Entities to calculate center for
 */
export function calculateEntitiesCenter(entities: AnyEntity[]): Point | null {
  if (entities.length === 0) return null;
  
  // Get bounds of all entities
  const bounds = generateBoundsFromEntities(entities);
  if (!bounds) return null;
  
  // Calculate center
  return {
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2
  };
}

/**
 * Adjust viewport to fit all entities
 * @param viewport - Viewport to adjust
 * @param entities - Entities to fit
 * @param padding - Padding around entities (percentage of viewport size)
 */
export function fitAllEntitiesInViewport(
  viewport: DrawingViewport,
  entities: AnyEntity[],
  padding: number = 0.1
): DrawingViewport {
  if (entities.length === 0) return viewport;
  
  // Calculate optimal zoom
  const newScale = calculateZoomToFit(entities, viewport, padding);
  
  // Calculate center of entities
  const center = calculateEntitiesCenter(entities);
  if (!center) return viewport;
  
  // Calculate new pan to center the entities
  const newPan = {
    x: viewport.position.x + (viewport.width / 2) - (center.x * newScale),
    y: viewport.position.y + (viewport.height / 2) - (center.y * newScale)
  };
  
  // Return updated viewport
  return {
    ...viewport,
    pan: newPan,
    scale: newScale
  };
}

/**
 * Convert screen coordinates to world coordinates
 * @param viewport - The viewport for the conversion
 * @param screenPoint - Point in screen coordinates
 */
export function screenToWorldCoordinates(
  viewport: DrawingViewport,
  screenPoint: Point
): Point {
  return {
    x: (screenPoint.x - viewport.position.x - viewport.pan.x) / viewport.scale,
    y: (screenPoint.y - viewport.position.y - viewport.pan.y) / viewport.scale
  };
}

/**
 * Convert world coordinates to screen coordinates
 * @param viewport - The viewport for the conversion
 * @param worldPoint - Point in world coordinates
 */
export function worldToScreenCoordinates(
  viewport: DrawingViewport,
  worldPoint: Point
): Point {
  return {
    x: worldPoint.x * viewport.scale + viewport.pan.x + viewport.position.x,
    y: worldPoint.y * viewport.scale + viewport.pan.y + viewport.position.y
  };
}

/**
 * Create a new viewport with default settings
 * @param name - Viewport name
 * @param type - Viewport type (front, top, side, etc.)
 * @param position - Position on the canvas
 * @param width - Width in pixels
 * @param height - Height in pixels
 */
export function createViewport(
  name: string,
  type: string,
  position: Point,
  width: number,
  height: number
): DrawingViewport {
  return {
    name,
    type,
    position,
    width,
    height,
    pan: { x: 0, y: 0 },
    scale: 1,
    entities: []
  };
}