// src/components/cad/technical-drawing/core/blocks/BlockManager.ts
// Gestore completo per sistema di blocchi/simboli CAD

import { v4 as uuidv4 } from 'uuid';
import { 
  BlockDefinition, 
  BlockInstance, 
  BlockLibrary, 
  BlockCategory,
  BlockAttribute,
  BlockEntity,
  BlockSearchCriteria,
  BlockTemplate,
  STANDARD_BLOCK_TEMPLATES,
  DEFAULT_BLOCK_CATEGORIES,
  StandardBlockCategory
} from './BlockTypes';
import { Point, DrawingEntity } from '../../TechnicalDrawingTypes';

/**
 * 📦 Block Manager
 * 
 * Gestore completo per blocchi e simboli CAD:
 * - Librerie di blocchi organizzate per categorie
 * - Creazione e modifica blocchi
 * - Inserimento con attributi modificabili
 * - Import/Export in vari formati
 * - Sistema di template standard
 */
export class BlockManager {
  private libraries: Map<string, BlockLibrary> = new Map();
  private definitions: Map<string, BlockDefinition> = new Map();
  private instances: Map<string, BlockInstance> = new Map();
  private categories: Map<string, BlockCategory> = new Map();
  private searchIndex: Map<string, string[]> = new Map();
  private changeListeners: ((event: BlockChangeEvent) => void)[] = [];

  constructor() {
    this.initializeDefaultLibrary();
    console.log('📦 Block Manager initialized with default library');
  }

  /**
   * Inizializza libreria predefinita
   */
  private initializeDefaultLibrary() {
    // Crea libreria predefinita
    const defaultLibrary: BlockLibrary = {
      id: 'default',
      name: 'Standard Library',
      description: 'Standard CAD blocks and symbols',
      categories: DEFAULT_BLOCK_CATEGORIES,
      blocks: [],
      created: Date.now(),
      modified: Date.now(),
      version: '1.0.0',
      isDefault: true,
      readOnly: false,
      shared: false,
      author: 'System'
    };

    this.libraries.set('default', defaultLibrary);

    // Aggiungi categorie predefinite
    DEFAULT_BLOCK_CATEGORIES.forEach(category => {
      this.categories.set(category.id, category);
    });

    // Crea blocchi dai template standard
    STANDARD_BLOCK_TEMPLATES.forEach(template => {
      const blockDef = this.createBlockFromTemplate(template);
      this.addBlockDefinition(blockDef, 'default');
    });
  }

  /**
   * Crea definizione blocco da template
   */
  private createBlockFromTemplate(template: BlockTemplate): BlockDefinition {
    const entities: BlockEntity[] = template.entities.map(entityData => ({
      id: uuidv4(),
      type: entityData.type || 'unknown',
      geometry: entityData,
      style: entityData.style || {
        strokeColor: '#000000',
        strokeWidth: 1,
        strokeStyle: 'solid'
      },
      layer: 'default',
      locked: false,
      visible: true
    }));

    const attributes: BlockAttribute[] = template.attributes.map(attrData => ({
      id: uuidv4(),
      ...attrData,
      validation: {
        required: false,
        ...attrData.validation
      }
    }));

    // Calcola bounding box
    const boundingBox = this.calculateBoundingBox(entities);

    const blockDef: BlockDefinition = {
      id: template.id,
      name: template.name,
      description: template.description,
      category: template.category as any,
      entities,
      insertionPoint: { x: 0, y: 0 },
      boundingBox,
      attributes,
      tags: template.tags,
      created: Date.now(),
      modified: Date.now(),
      version: '1.0.0',
      author: 'System'
    };

    return blockDef;
  }

  /**
   * Aggiunge definizione blocco a libreria
   */
  addBlockDefinition(definition: BlockDefinition, libraryId: string = 'default'): void {
    const library = this.libraries.get(libraryId);
    if (!library) {
      throw new Error(`Library ${libraryId} not found`);
    }

    if (library.readOnly) {
      throw new Error(`Library ${libraryId} is read-only`);
    }

    // Aggiungi alla libreria
    library.blocks.push(definition);
    library.modified = Date.now();

    // Aggiungi al registro globale
    this.definitions.set(definition.id, definition);

    // Aggiorna indice di ricerca
    this.updateSearchIndex(definition);

    // Notifica cambiamento
    this.notifyChange({
      type: 'block-added',
      blockId: definition.id,
      libraryId
    });

    console.log(`✅ Added block definition: ${definition.name} (${definition.id})`);
  }

  /**
   * Crea istanza di blocco
   */
  createBlockInstance(
    blockDefinitionId: string,
    insertionPoint: Point,
    options: {
      scale?: { x: number; y: number };
      rotation?: number;
      attributes?: Record<string, string>;
      layer?: string;
    } = {}
  ): string {
    const definition = this.definitions.get(blockDefinitionId);
    if (!definition) {
      throw new Error(`Block definition ${blockDefinitionId} not found`);
    }

    const instance: BlockInstance = {
      id: uuidv4(),
      blockDefinitionId,
      insertionPoint: { ...insertionPoint },
      scale: options.scale || { x: 1, y: 1 },
      rotation: options.rotation || 0,
      attributes: { ...options.attributes } || {},
      layer: options.layer || 'default',
      visible: true,
      locked: false,
      exploded: false
    };

    // Inizializza attributi con valori predefiniti se non specificati
    definition.attributes.forEach(attr => {
      if (!(attr.tag in instance.attributes)) {
        instance.attributes[attr.tag] = attr.defaultValue || attr.value;
      }
    });

    this.instances.set(instance.id, instance);

    // Notifica cambiamento
    this.notifyChange({
      type: 'instance-created',
      instanceId: instance.id,
      blockId: blockDefinitionId
    });

    console.log(`✅ Created block instance: ${definition.name} at (${insertionPoint.x}, ${insertionPoint.y})`);
    return instance.id;
  }

  /**
   * Aggiorna istanza di blocco
   */
  updateBlockInstance(
    instanceId: string,
    updates: Partial<Pick<BlockInstance, 'insertionPoint' | 'scale' | 'rotation' | 'attributes' | 'visible' | 'locked'>>
  ): void {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error(`Block instance ${instanceId} not found`);
    }

    // Applica aggiornamenti
    Object.assign(instance, updates);

    // Notifica cambiamento
    this.notifyChange({
      type: 'instance-updated',
      instanceId,
      blockId: instance.blockDefinitionId
    });

    console.log(`✅ Updated block instance: ${instanceId}`);
  }

  /**
   * Elimina istanza di blocco
   */
  deleteBlockInstance(instanceId: string): void {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      return;
    }

    this.instances.delete(instanceId);

    // Notifica cambiamento
    this.notifyChange({
      type: 'instance-deleted',
      instanceId,
      blockId: instance.blockDefinitionId
    });

    console.log(`🗑️ Deleted block instance: ${instanceId}`);
  }

  /**
   * Esplode istanza di blocco in entità individuali
   */
  explodeBlockInstance(instanceId: string): DrawingEntity[] {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error(`Block instance ${instanceId} not found`);
    }

    const definition = this.definitions.get(instance.blockDefinitionId);
    if (!definition) {
      throw new Error(`Block definition ${instance.blockDefinitionId} not found`);
    }

    const entities: DrawingEntity[] = [];

    // Trasforma ogni entità del blocco
    definition.entities.forEach(blockEntity => {
      const transformedEntity = this.transformBlockEntity(
        blockEntity,
        instance.insertionPoint,
        instance.scale,
        instance.rotation
      );

      entities.push(transformedEntity);
    });

    // Marca istanza come esplosa
    instance.exploded = true;

    console.log(`💥 Exploded block instance: ${instanceId} (${entities.length} entities)`);
    return entities;
  }

  /**
   * Cerca blocchi per criteri
   */
  searchBlocks(criteria: BlockSearchCriteria): BlockDefinition[] {
    let results = Array.from(this.definitions.values());

    // Filtro per query testuale
    if (criteria.query) {
      const query = criteria.query.toLowerCase();
      results = results.filter(block => 
        block.name.toLowerCase().includes(query) ||
        block.description?.toLowerCase().includes(query) ||
        block.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Filtro per categoria
    if (criteria.category) {
      results = results.filter(block => block.category === criteria.category);
    }

    // Filtro per tag
    if (criteria.tags && criteria.tags.length > 0) {
      results = results.filter(block => 
        criteria.tags!.some(tag => block.tags.includes(tag))
      );
    }

    // Filtro per autore
    if (criteria.author) {
      results = results.filter(block => block.author === criteria.author);
    }

    // Filtro per range di date
    if (criteria.dateRange) {
      results = results.filter(block => 
        block.created >= criteria.dateRange!.start &&
        block.created <= criteria.dateRange!.end
      );
    }

    // Filtro per presenza attributi
    if (criteria.hasAttributes !== undefined) {
      if (criteria.hasAttributes) {
        results = results.filter(block => block.attributes.length > 0);
      } else {
        results = results.filter(block => block.attributes.length === 0);
      }
    }

    return results;
  }

  /**
   * Ottiene tutte le definizioni di blocco
   */
  getAllBlockDefinitions(): BlockDefinition[] {
    return Array.from(this.definitions.values());
  }

  /**
   * Ottiene definizione blocco per ID
   */
  getBlockDefinition(blockId: string): BlockDefinition | undefined {
    return this.definitions.get(blockId);
  }

  /**
   * Ottiene tutte le istanze di blocco
   */
  getAllBlockInstances(): BlockInstance[] {
    return Array.from(this.instances.values());
  }

  /**
   * Ottiene istanza blocco per ID
   */
  getBlockInstance(instanceId: string): BlockInstance | undefined {
    return this.instances.get(instanceId);
  }

  /**
   * Ottiene tutte le categorie
   */
  getAllCategories(): BlockCategory[] {
    return Array.from(this.categories.values()).sort((a, b) => a.order - b.order);
  }

  /**
   * Ottiene blocchi per categoria
   */
  getBlocksByCategory(categoryId: string): BlockDefinition[] {
    return Array.from(this.definitions.values()).filter(
      block => block.category === categoryId
    );
  }

  /**
   * Crea nuova categoria
   */
  createCategory(category: Omit<BlockCategory, 'id'>): string {
    const id = uuidv4();
    const newCategory: BlockCategory = {
      id,
      ...category
    };

    this.categories.set(id, newCategory);

    // Notifica cambiamento
    this.notifyChange({
      type: 'category-added',
      categoryId: id
    });

    return id;
  }

  /**
   * Crea blocco personalizzato da entità selezionate
   */
  createCustomBlock(
    entities: DrawingEntity[],
    name: string,
    insertionPoint: Point,
    options: {
      description?: string;
      category?: string;
      attributes?: Omit<BlockAttribute, 'id'>[];
      tags?: string[];
    } = {}
  ): string {
    const blockId = uuidv4();
    
    // Converte entità in BlockEntity
    const blockEntities: BlockEntity[] = entities.map(entity => ({
      id: uuidv4(),
      type: entity.type,
      geometry: entity,
      style: entity.style,
      layer: entity.layer,
      locked: entity.locked || false,
      visible: entity.visible
    }));

    // Crea attributi
    const attributes: BlockAttribute[] = (options.attributes || []).map(attr => ({
      id: uuidv4(),
      ...attr,
      validation: {
        required: false,
        ...attr.validation
      }
    }));

    // Calcola bounding box
    const boundingBox = this.calculateBoundingBox(blockEntities);

    const blockDef: BlockDefinition = {
      id: blockId,
      name,
      description: options.description,
      category: options.category as any || StandardBlockCategory.CUSTOM,
      entities: blockEntities,
      insertionPoint: { ...insertionPoint },
      boundingBox,
      attributes,
      tags: options.tags || [],
      created: Date.now(),
      modified: Date.now(),
      version: '1.0.0',
      author: 'User'
    };

    this.addBlockDefinition(blockDef);
    return blockId;
  }

  // Private utility methods

  private calculateBoundingBox(entities: BlockEntity[]): BlockDefinition['boundingBox'] {
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    entities.forEach(entity => {
      const bounds = this.getEntityBounds(entity);
      minX = Math.min(minX, bounds.minX);
      minY = Math.min(minY, bounds.minY);
      maxX = Math.max(maxX, bounds.maxX);
      maxY = Math.max(maxY, bounds.maxY);
    });

    return {
      minX: minX === Infinity ? 0 : minX,
      minY: minY === Infinity ? 0 : minY,
      maxX: maxX === -Infinity ? 0 : maxX,
      maxY: maxY === -Infinity ? 0 : maxY
    };
  }

  private getEntityBounds(entity: BlockEntity): { minX: number; minY: number; maxX: number; maxY: number } {
    const geom = entity.geometry;
    
    switch (entity.type) {
      case 'circle':
        return {
          minX: geom.center.x - geom.radius,
          minY: geom.center.y - geom.radius,
          maxX: geom.center.x + geom.radius,
          maxY: geom.center.y + geom.radius
        };
      
      case 'line':
        return {
          minX: Math.min(geom.startPoint.x, geom.endPoint.x),
          minY: Math.min(geom.startPoint.y, geom.endPoint.y),
          maxX: Math.max(geom.startPoint.x, geom.endPoint.x),
          maxY: Math.max(geom.startPoint.y, geom.endPoint.y)
        };
        
      case 'rectangle':
        return {
          minX: geom.position.x,
          minY: geom.position.y,
          maxX: geom.position.x + geom.width,
          maxY: geom.position.y + geom.height
        };
        
      default:
        return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    }
  }

  private transformBlockEntity(
    blockEntity: BlockEntity,
    insertionPoint: Point,
    scale: { x: number; y: number },
    rotation: number
  ): DrawingEntity {
    const geometry = { ...blockEntity.geometry };
    
    // Applica trasformazioni in base al tipo di entità
    switch (blockEntity.type) {
      case 'circle':
        geometry.center = this.transformPoint(geometry.center, insertionPoint, scale, rotation);
        geometry.radius *= Math.abs(scale.x); // Usa scala X per il raggio
        break;
        
      case 'line':
        geometry.startPoint = this.transformPoint(geometry.startPoint, insertionPoint, scale, rotation);
        geometry.endPoint = this.transformPoint(geometry.endPoint, insertionPoint, scale, rotation);
        break;
        
      case 'rectangle':
        geometry.position = this.transformPoint(geometry.position, insertionPoint, scale, rotation);
        geometry.width *= scale.x;
        geometry.height *= scale.y;
        geometry.rotation = (geometry.rotation || 0) + rotation;
        break;
    }

    return {
      id: uuidv4(),
      ...geometry,
      style: blockEntity.style,
      layer: blockEntity.layer,
      visible: blockEntity.visible,
      locked: blockEntity.locked
    } as DrawingEntity;
  }

  private transformPoint(
    point: Point,
    insertionPoint: Point,
    scale: { x: number; y: number },
    rotation: number
  ): Point {
    // Applica scala
    let x = point.x * scale.x;
    let y = point.y * scale.y;

    // Applica rotazione
    if (rotation !== 0) {
      const cos = Math.cos(rotation);
      const sin = Math.sin(rotation);
      const newX = x * cos - y * sin;
      const newY = x * sin + y * cos;
      x = newX;
      y = newY;
    }

    // Applica traslazione
    x += insertionPoint.x;
    y += insertionPoint.y;

    return { x, y };
  }

  private updateSearchIndex(definition: BlockDefinition) {
    const searchTerms = [
      definition.name.toLowerCase(),
      ...(definition.description ? [definition.description.toLowerCase()] : []),
      ...definition.tags.map(tag => tag.toLowerCase())
    ];

    this.searchIndex.set(definition.id, searchTerms);
  }

  private notifyChange(event: BlockChangeEvent) {
    this.changeListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in block change listener:', error);
      }
    });
  }

  /**
   * Aggiunge listener per cambiamenti
   */
  addChangeListener(listener: (event: BlockChangeEvent) => void) {
    this.changeListeners.push(listener);
  }

  /**
   * Rimuove listener
   */
  removeChangeListener(listener: (event: BlockChangeEvent) => void) {
    const index = this.changeListeners.indexOf(listener);
    if (index > -1) {
      this.changeListeners.splice(index, 1);
    }
  }
}

// Event types
interface BlockChangeEvent {
  type: 'block-added' | 'block-updated' | 'block-deleted' | 
        'instance-created' | 'instance-updated' | 'instance-deleted' |
        'category-added' | 'category-updated' | 'category-deleted';
  blockId?: string;
  instanceId?: string;
  categoryId?: string;
  libraryId?: string;
}

export default BlockManager;