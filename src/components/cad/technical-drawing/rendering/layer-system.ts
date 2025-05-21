import { DrawingEntity, DrawingStyle } from '../../../../types/TechnicalDrawingTypes';

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  color: string;
  lineType: 'solid' | 'dashed' | 'dotted' | 'dash-dot' | 'center';
  lineWeight: number;
  order: number;
  description?: string;
}

/**
 * Layer management system for technical drawings
 * Handles creation, modification and rendering of layers
 */
export class LayerSystem {
  private layers: Map<string, Layer> = new Map();
  private activeLayerId: string | null = null;
  
  /**
   * Create a new layer system with default layers
   */
  constructor() {
    this.initializeDefaultLayers();
  }
  
  /**
   * Initialize default layers
   */
  private initializeDefaultLayers(): void {
    // Create default layer
    const defaultLayer: Layer = {
      id: 'default',
      name: 'Default',
      visible: true,
      locked: false,
      color: '#000000',
      lineType: 'solid',
      lineWeight: 0.5,
      order: 0
    };
    
    // Add some standard technical drawing layers
    const constructionLayer: Layer = {
      id: 'construction',
      name: 'Construction',
      visible: true,
      locked: false,
      color: '#0088FF',
      lineType: 'dashed',
      lineWeight: 0.25,
      order: 1,
      description: 'Layer for construction lines and temporary geometry'
    };
    
    const dimensionLayer: Layer = {
      id: 'dimension',
      name: 'Dimensions',
      visible: true,
      locked: false,
      color: '#FF4400',
      lineType: 'solid',
      lineWeight: 0.35,
      order: 2,
      description: 'Layer for dimension lines and text'
    };
    
    const centerlineLayer: Layer = {
      id: 'centerline',
      name: 'Centerlines',
      visible: true,
      locked: false,
      color: '#FF00FF',
      lineType: 'center',
      lineWeight: 0.25,
      order: 3,
      description: 'Layer for centerlines'
    };
    
    const annotationLayer: Layer = {
      id: 'annotation',
      name: 'Annotations',
      visible: true,
      locked: false,
      color: '#009933',
      lineType: 'solid',
      lineWeight: 0.35,
      order: 4,
      description: 'Layer for text annotations'
    };
    
    // Add layers to the map
    this.layers.set(defaultLayer.id, defaultLayer);
    this.layers.set(constructionLayer.id, constructionLayer);
    this.layers.set(dimensionLayer.id, dimensionLayer);
    this.layers.set(centerlineLayer.id, centerlineLayer);
    this.layers.set(annotationLayer.id, annotationLayer);
    
    // Set active layer
    this.activeLayerId = defaultLayer.id;
  }
  
  /**
   * Get all layers
   */
  getLayers(): Layer[] {
    return Array.from(this.layers.values()).sort((a, b) => a.order - b.order);
  }
  
  /**
   * Get a layer by ID
   */
  getLayer(id: string): Layer | undefined {
    return this.layers.get(id);
  }
  
  /**
   * Get the active layer
   */
  getActiveLayer(): Layer | null {
    if (!this.activeLayerId) return null;
    return this.layers.get(this.activeLayerId) || null;
  }
  
  /**
   * Set the active layer
   */
  setActiveLayer(id: string): boolean {
    if (this.layers.has(id)) {
      this.activeLayerId = id;
      return true;
    }
    return false;
  }
  
  /**
   * Create a new layer
   */
  createLayer(layer: Omit<Layer, 'id'>): Layer {
    const id = `layer-${Date.now()}`;
    const newLayer: Layer = {
      ...layer,
      id
    };
    
    this.layers.set(id, newLayer);
    return newLayer;
  }
  
  /**
   * Update an existing layer
   */
  updateLayer(id: string, updates: Partial<Layer>): boolean {
    const layer = this.layers.get(id);
    if (!layer) return false;
    
    this.layers.set(id, { ...layer, ...updates });
    return true;
  }
  
  /**
   * Remove a layer (if it's not the default layer)
   */
  removeLayer(id: string): boolean {
    if (id === 'default') return false;
    
    // If removing active layer, set active to default
    if (id === this.activeLayerId) {
      this.activeLayerId = 'default';
    }
    
    return this.layers.delete(id);
  }
  
  /**
   * Set layer visibility
   */
  setLayerVisibility(id: string, visible: boolean): boolean {
    const layer = this.layers.get(id);
    if (!layer) return false;
    
    layer.visible = visible;
    this.layers.set(id, layer);
    return true;
  }
  
  /**
   * Set layer locked state
   */
  setLayerLocked(id: string, locked: boolean): boolean {
    const layer = this.layers.get(id);
    if (!layer) return false;
    
    layer.locked = locked;
    this.layers.set(id, layer);
    return true;
  }
  
  /**
   * Get the style for a specific layer
   */
  getLayerStyle(id: string): DrawingStyle | null {
    const layer = this.layers.get(id);
    if (!layer) return null;
    
    return {
      strokeColor: layer.color,
      strokeWidth: layer.lineWeight,
      strokeStyle: layer.lineType
    };
  }
  
  /**
   * Apply layer style to an entity
   */
  applyLayerStyle(entity: DrawingEntity): DrawingEntity {
    const layer = this.layers.get(entity.layer);
    if (!layer) return entity;
    
    // Only apply layer style if entity doesn't have its own style
    if (!entity.style) {
      return {
        ...entity,
        style: this.getLayerStyle(entity.layer) as DrawingStyle 
      };
    }
    
    return entity;
  }
  
  /**
   * Check if an entity is on a visible layer
   */
  isEntityVisible(entity: DrawingEntity): boolean {
    const layer = this.layers.get(entity.layer);
    return layer ? layer.visible : true;
  }
  
  /**
   * Check if an entity is on a locked layer
   */
  isEntityLocked(entity: DrawingEntity): boolean {
    const layer = this.layers.get(entity.layer);
    return layer ? layer.locked : false;
  }
  
  /**
   * Filter entities based on visible layers
   */
  getVisibleEntities(entities: DrawingEntity[]): DrawingEntity[] {
    return entities.filter(entity => this.isEntityVisible(entity));
  }
  
  /**
   * Move entities to a different layer
   */
  moveEntitiesToLayer(entities: DrawingEntity[], targetLayerId: string): DrawingEntity[] {
    if (!this.layers.has(targetLayerId)) return entities;
    
    return entities.map(entity => ({
      ...entity,
      layer: targetLayerId
    }));
  }
  
  /**
   * Get the drawing line type based on layer line type
   */
  getLineDash(lineType: Layer['lineType']): number[] {
    switch (lineType) {
      case 'dashed':
        return [5, 5];
      case 'dotted':
        return [2, 2];
      case 'dash-dot':
        return [10, 5, 2, 5];
      case 'center':
        return [15, 5, 5, 5];
      case 'solid':
      default:
        return [];
    }
  }
  
  /**
   * Configure canvas context based on layer style
   */
  applyLayerStyleToContext(ctx: CanvasRenderingContext2D, layerId: string): void {
    const layer = this.layers.get(layerId);
    if (!layer) return;
    
    ctx.strokeStyle = layer.color;
    ctx.lineWidth = layer.lineWeight;
    ctx.setLineDash(this.getLineDash(layer.lineType));
  }
} 