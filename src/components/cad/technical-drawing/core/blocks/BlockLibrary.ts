// src/components/cad/technical-drawing/core/blocks/BlockLibrary.ts

import { v4 as uuidv4 } from 'uuid';
import { DrawingEntity, Point } from '../../TechnicalDrawingTypes';

export interface BlockDefinition {
  id: string;
  name: string;
  description?: string;
  category: string;
  entities: DrawingEntity[];
  insertionPoint: Point;
  boundingBox: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
  attributes: BlockAttribute[];
  metadata: {
    created: number;
    modified: number;
    author?: string;
    version?: string;
  };
}

export interface BlockInstance {
  id: string;
  blockDefinitionId: string;
  position: Point;
  rotation: number;
  scaleX: number;
  scaleY: number;
  layer: string;
  attributes: Record<string, string>;
  metadata: {
    created: number;
    modified: number;
  };
}

export interface BlockAttribute {
  name: string;
  prompt: string;
  defaultValue: string;
  type: 'text' | 'number' | 'boolean' | 'choice';
  choices?: string[];
  position: Point;
  height: number;
  visible: boolean;
}

export interface BlockCategory {
  id: string;
  name: string;
  description?: string;
  parent?: string;
  icon?: string;
}

export default class BlockLibraryManager {
  private blockDefinitions: Map<string, BlockDefinition> = new Map();
  private blockInstances: Map<string, BlockInstance> = new Map();
  private categories: Map<string, BlockCategory> = new Map();

  constructor() {
    console.log('🧩 BlockLibraryManager initialized');
    this.initializeDefaultCategories();
  }

  private initializeDefaultCategories(): void {
    const defaultCategories = [
      { id: 'general', name: 'General', description: 'General purpose blocks' },
      { id: 'mechanical', name: 'Mechanical', description: 'Mechanical components' },
      { id: 'electrical', name: 'Electrical', description: 'Electrical symbols' },
      { id: 'architectural', name: 'Architectural', description: 'Architectural elements' },
      { id: 'symbols', name: 'Symbols', description: 'Various symbols and annotations' },
      { id: 'custom', name: 'Custom', description: 'User-defined blocks' }
    ];

    defaultCategories.forEach(category => {
      this.categories.set(category.id, category);
    });
  }

  createBlockDefinition(
    name: string,
    entities: DrawingEntity[],
    insertionPoint: Point,
    category: string = 'general',
    attributes: BlockAttribute[] = []
  ): string {
    const id = uuidv4();
    const boundingBox = this.calculateBoundingBox(entities);
    
    const blockDefinition: BlockDefinition = {
      id,
      name,
      category,
      entities: [...entities], // Deep copy would be better
      insertionPoint,
      boundingBox,
      attributes,
      metadata: {
        created: Date.now(),
        modified: Date.now()
      }
    };

    this.blockDefinitions.set(id, blockDefinition);
    console.log(`✅ Block definition created: ${name} (${id})`);
    return id;
  }

  updateBlockDefinition(blockId: string, updates: Partial<BlockDefinition>): boolean {
    const block = this.blockDefinitions.get(blockId);
    if (!block) return false;

    Object.assign(block, updates);
    block.metadata.modified = Date.now();
    
    console.log(`🔄 Block definition updated: ${block.name} (${blockId})`);
    return true;
  }

  deleteBlockDefinition(blockId: string): boolean {
    const success = this.blockDefinitions.delete(blockId);
    
    if (success) {
      // Also remove all instances of this block
      const instancesToRemove = Array.from(this.blockInstances.entries())
        .filter(([, instance]) => instance.blockDefinitionId === blockId)
        .map(([instanceId]) => instanceId);
      
      instancesToRemove.forEach(instanceId => {
        this.blockInstances.delete(instanceId);
      });
      
      console.log(`🗑️ Block definition deleted: ${blockId} (${instancesToRemove.length} instances removed)`);
    }
    
    return success;
  }

  insertBlock(
    blockId: string,
    position: Point,
    rotation: number = 0,
    scaleX: number = 1,
    scaleY: number = 1,
    layer: string = 'default'
  ): string {
    const blockDefinition = this.blockDefinitions.get(blockId);
    if (!blockDefinition) {
      throw new Error(`Block definition not found: ${blockId}`);
    }

    const instanceId = uuidv4();
    const instance: BlockInstance = {
      id: instanceId,
      blockDefinitionId: blockId,
      position,
      rotation,
      scaleX,
      scaleY,
      layer,
      attributes: {},
      metadata: {
        created: Date.now(),
        modified: Date.now()
      }
    };

    // Initialize attributes with default values
    blockDefinition.attributes.forEach(attr => {
      instance.attributes[attr.name] = attr.defaultValue;
    });

    this.blockInstances.set(instanceId, instance);
    console.log(`📍 Block instance created: ${blockDefinition.name} (${instanceId})`);
    return instanceId;
  }

  updateBlockInstance(instanceId: string, updates: Partial<BlockInstance>): boolean {
    const instance = this.blockInstances.get(instanceId);
    if (!instance) return false;

    Object.assign(instance, updates);
    instance.metadata.modified = Date.now();
    
    console.log(`🔄 Block instance updated: ${instanceId}`);
    return true;
  }

  deleteBlockInstance(instanceId: string): boolean {
    const success = this.blockInstances.delete(instanceId);
    if (success) {
      console.log(`🗑️ Block instance deleted: ${instanceId}`);
    }
    return success;
  }

  explodeBlock(instanceId: string): DrawingEntity[] {
    const instance = this.blockInstances.get(instanceId);
    if (!instance) return [];

    const blockDefinition = this.blockDefinitions.get(instance.blockDefinitionId);
    if (!blockDefinition) return [];

    // Transform entities based on instance properties
    const transformedEntities = blockDefinition.entities.map(entity => {
      return this.transformEntity(entity, instance);
    });

    // Remove the block instance
    this.blockInstances.delete(instanceId);
    
    console.log(`💥 Block exploded: ${instanceId} (${transformedEntities.length} entities)`);
    return transformedEntities;
  }

  generateBlockEntities(instanceId: string): DrawingEntity[] {
    const instance = this.blockInstances.get(instanceId);
    if (!instance) return [];

    const blockDefinition = this.blockDefinitions.get(instance.blockDefinitionId);
    if (!blockDefinition) return [];

    // Generate entities for rendering without removing the block instance
    return blockDefinition.entities.map(entity => {
      return this.transformEntity(entity, instance);
    });
  }

  private transformEntity(entity: DrawingEntity, instance: BlockInstance): DrawingEntity {
    const transformed = { ...entity };
    
    // Apply transformations based on instance properties
    const cos = Math.cos(instance.rotation * Math.PI / 180);
    const sin = Math.sin(instance.rotation * Math.PI / 180);

    const transformPoint = (point: Point): Point => {
      // Scale
      let x = point.x * instance.scaleX;
      let y = point.y * instance.scaleY;
      
      // Rotate
      const rotatedX = x * cos - y * sin;
      const rotatedY = x * sin + y * cos;
      
      // Translate
      return {
        x: rotatedX + instance.position.x,
        y: rotatedY + instance.position.y
      };
    };

    // Transform entity points based on type
    switch (entity.type) {
      case 'line': {
        const line = transformed as any;
        line.startPoint = transformPoint(line.startPoint);
        line.endPoint = transformPoint(line.endPoint);
        break;
      }
      
      case 'circle': {
        const circle = transformed as any;
        circle.center = transformPoint(circle.center);
        circle.radius *= Math.max(instance.scaleX, instance.scaleY);
        break;
      }
      
      case 'rectangle': {
        const rect = transformed as any;
        rect.position = transformPoint(rect.position);
        rect.width *= instance.scaleX;
        rect.height *= instance.scaleY;
        rect.rotation = (rect.rotation || 0) + instance.rotation;
        break;
      }
      
      case 'polyline': {
        const polyline = transformed as any;
        polyline.points = polyline.points.map(transformPoint);
        break;
      }
    }

    // Update layer
    transformed.layer = instance.layer;
    
    // Generate new ID for the transformed entity
    transformed.id = uuidv4();

    return transformed;
  }

  private calculateBoundingBox(entities: DrawingEntity[]): { minX: number; minY: number; maxX: number; maxY: number } {
    if (entities.length === 0) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    entities.forEach(entity => {
      const bounds = this.getEntityBounds(entity);
      minX = Math.min(minX, bounds.minX);
      minY = Math.min(minY, bounds.minY);
      maxX = Math.max(maxX, bounds.maxX);
      maxY = Math.max(maxY, bounds.maxY);
    });

    return { minX, minY, maxX, maxY };
  }

  private getEntityBounds(entity: DrawingEntity): { minX: number; minY: number; maxX: number; maxY: number } {
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
      
      default:
        return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    }
  }

  // Search and filter methods
  searchBlocks(query: string, category?: string): BlockDefinition[] {
    const blocks = Array.from(this.blockDefinitions.values());
    
    return blocks.filter(block => {
      const matchesQuery = !query || 
        block.name.toLowerCase().includes(query.toLowerCase()) ||
        (block.description && block.description.toLowerCase().includes(query.toLowerCase()));
      
      const matchesCategory = !category || block.category === category;
      
      return matchesQuery && matchesCategory;
    });
  }

  getBlocksByCategory(category: string): BlockDefinition[] {
    return Array.from(this.blockDefinitions.values())
      .filter(block => block.category === category);
  }

  getAllCategories(): BlockCategory[] {
    return Array.from(this.categories.values());
  }

  // Block attributes management
  updateBlockAttributes(instanceId: string, attributes: Record<string, string>): boolean {
    const instance = this.blockInstances.get(instanceId);
    if (!instance) return false;

    Object.assign(instance.attributes, attributes);
    instance.metadata.modified = Date.now();
    
    console.log(`📝 Block attributes updated: ${instanceId}`);
    return true;
  }

  // Library import/export
  exportLibrary(): string {
    const exportData = {
      version: '1.0',
      timestamp: Date.now(),
      categories: Array.from(this.categories.values()),
      blockDefinitions: Array.from(this.blockDefinitions.values())
    };

    return JSON.stringify(exportData, null, 2);
  }

  importLibrary(data: string, merge: boolean = false): void {
    try {
      const importData = JSON.parse(data);
      
      if (!merge) {
        this.blockDefinitions.clear();
        this.categories.clear();
        this.initializeDefaultCategories();
      }

      // Import categories
      if (importData.categories) {
        importData.categories.forEach((category: BlockCategory) => {
          this.categories.set(category.id, category);
        });
      }

      // Import block definitions
      if (importData.blockDefinitions) {
        importData.blockDefinitions.forEach((block: BlockDefinition) => {
          if (merge && this.blockDefinitions.has(block.id)) {
            // Generate new ID if merging and ID conflicts
            block.id = uuidv4();
          }
          this.blockDefinitions.set(block.id, block);
        });
      }

      console.log(`📦 Block library imported: ${importData.blockDefinitions?.length || 0} blocks`);
    } catch (error) {
      console.error('❌ Failed to import block library:', error);
      throw new Error('Invalid library data format');
    }
  }

  // Getters
  getAllBlockDefinitions(): BlockDefinition[] {
    return Array.from(this.blockDefinitions.values());
  }

  getAllBlockInstances(): BlockInstance[] {
    return Array.from(this.blockInstances.values());
  }

  getBlockDefinition(blockId: string): BlockDefinition | undefined {
    return this.blockDefinitions.get(blockId);
  }

  getBlockInstance(instanceId: string): BlockInstance | undefined {
    return this.blockInstances.get(instanceId);
  }

  getInstancesOfBlock(blockId: string): BlockInstance[] {
    return Array.from(this.blockInstances.values())
      .filter(instance => instance.blockDefinitionId === blockId);
  }

  // Statistics
  getLibraryStats(): {
    totalBlocks: number;
    totalInstances: number;
    categoryCounts: Record<string, number>;
  } {
    const categoryCounts: Record<string, number> = {};
    
    Array.from(this.blockDefinitions.values()).forEach(block => {
      categoryCounts[block.category] = (categoryCounts[block.category] || 0) + 1;
    });

    return {
      totalBlocks: this.blockDefinitions.size,
      totalInstances: this.blockInstances.size,
      categoryCounts
    };
  }
}
