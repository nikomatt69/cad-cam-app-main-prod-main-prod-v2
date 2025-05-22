// src/components/cad/technical-drawing/core/blocks/BlockManager.ts
// Sistema di gestione blocchi e librerie

import { v4 as uuidv4 } from 'uuid';
import { 
  BlockDefinition, 
  BlockInstance, 
  BlockLibrary, 
  BlockCategory,
  BlockInsertionOptions,
  BlockSearchCriteria,
  BlockValidationResult,
  BlockParameter,
  STANDARD_CATEGORIES
} from './BlockTypes';
import { DrawingEntity, Dimension, Annotation, Point } from '../../TechnicalDrawingTypes';

/**
 * 📚 Block Manager
 * 
 * Gestisce librerie di blocchi, simboli e componenti riutilizzabili.
 * Implementa funzionalità di ricerca, inserimento, e personalizzazione.
 */
export class BlockManager {
  private libraries: Map<string, BlockLibrary> = new Map();
  private blocks: Map<string, BlockDefinition> = new Map();
  private instances: Map<string, BlockInstance> = new Map();
  private categories: Map<string, BlockCategory> = new Map();
  
  private changeListeners: ((event: BlockManagerEvent) => void)[] = [];

  constructor() {
    this.initializeStandardLibraries();
    console.log('📚 Block Manager initialized');
  }

  /**
   * Inizializza librerie standard
   */
  private initializeStandardLibraries() {
    // Crea libreria di sistema con simboli standard
    const systemLibrary = this.createSystemLibrary();
    this.libraries.set(systemLibrary.id, systemLibrary);
    
    // Crea categorie standard
    this.initializeStandardCategories();
    
    // Carica blocchi predefiniti
    this.loadPredefinedBlocks();
  }

  /**
   * Crea libreria di sistema
   */
  private createSystemLibrary(): BlockLibrary {
    return {
      id: 'system-library',
      name: 'System Library',
      description: 'Built-in blocks and symbols',
      version: '1.0.0',
      categories: [],
      blocks: [],
      author: 'System',
      createdDate: new Date(),
      modifiedDate: new Date(),
      isSystem: true,
      readOnly: true
    };
  }

  /**
   * Inizializza categorie standard
   */
  private initializeStandardCategories() {
    Object.values(STANDARD_CATEGORIES).forEach((category, index) => {
      const categoryDef: BlockCategory = {
        id: category.id,
        name: category.name,
        description: `Standard ${category.name.toLowerCase()} components`,
        order: index,
        color: this.getCategoryColor(category.id)
      };
      
      this.categories.set(category.id, categoryDef);
      
      // Crea sottocategorie
      category.subcategories.forEach((subcat, subIndex) => {
        const subcategoryDef: BlockCategory = {
          id: `${category.id}-${subcat}`,
          name: subcat.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          description: `${subcat} components`,
          parentId: category.id,
          order: subIndex
        };
        
        this.categories.set(subcategoryDef.id, subcategoryDef);
      });
    });
  }

  /**
   * Carica blocchi predefiniti
   */
  private loadPredefinedBlocks() {
    // Simboli meccanici di base
    this.createBasicMechanicalBlocks();
    
    // Simboli elettrici
    this.createBasicElectricalBlocks();
    
    // Simboli architettonici
    this.createBasicArchitecturalBlocks();
    
    // Blocchi di annotazione
    this.createBasicAnnotationBlocks();
  }

  /**
   * Crea blocchi meccanici di base
   */
  private createBasicMechanicalBlocks() {
    // Vite standard
    const screwBlock = this.createStandardScrewBlock();
    this.addBlockToLibrary('system-library', screwBlock);
    
    // Cuscinetto
    const bearingBlock = this.createStandardBearingBlock();
    this.addBlockToLibrary('system-library', bearingBlock);
    
    // Simbolo saldatura
    const weldingBlock = this.createWeldingSymbolBlock();
    this.addBlockToLibrary('system-library', weldingBlock);
  }

  /**
   * Crea blocchi elettrici di base
   */
  private createBasicElectricalBlocks() {
    // Resistore
    const resistorBlock = this.createResistorBlock();
    this.addBlockToLibrary('system-library', resistorBlock);
    
    // Condensatore
    const capacitorBlock = this.createCapacitorBlock();
    this.addBlockToLibrary('system-library', capacitorBlock);
  }

  /**
   * Crea blocchi architettonici di base
   */
  private createBasicArchitecturalBlocks() {
    // Porta standard
    const doorBlock = this.createStandardDoorBlock();
    this.addBlockToLibrary('system-library', doorBlock);
    
    // Finestra standard
    const windowBlock = this.createStandardWindowBlock();
    this.addBlockToLibrary('system-library', windowBlock);
  }

  /**
   * Crea blocchi di annotazione
   */
  private createBasicAnnotationBlocks() {
    // Cartiglio base
    const titleBlock = this.createBasicTitleBlock();
    this.addBlockToLibrary('system-library', titleBlock);
    
    // Nuvola di revisione
    const revisionCloud = this.createRevisionCloudBlock();
    this.addBlockToLibrary('system-library', revisionCloud);
  }

  // Factory methods per blocchi specifici

  private createStandardScrewBlock(): BlockDefinition {
    const entities: DrawingEntity[] = [
      {
        id: uuidv4(),
        type: 'circle',
        center: { x: 0, y: 0 },
        radius: 5,
        layer: 'default',
        visible: true,
        locked: false,
        style: {
          strokeColor: '#000000',
          strokeWidth: 1,
          strokeStyle: 'solid'
        }
      } as any,
      {
        id: uuidv4(),
        type: 'line',
        startPoint: { x: -3, y: 0 },
        endPoint: { x: 3, y: 0 },
        layer: 'default',
        visible: true,
        locked: false,
        style: {
          strokeColor: '#000000',
          strokeWidth: 1,
          strokeStyle: 'solid'
        }
      } as any
    ];

    return {
      id: uuidv4(),
      name: 'Standard Screw M6',
      description: 'Standard M6 screw symbol',
      category: 'mechanical-fasteners',
      tags: ['screw', 'fastener', 'hardware', 'M6'],
      entities,
      dimensions: [],
      annotations: [],
      basePoint: { x: 0, y: 0 },
      bounds: { minX: -5, minY: -5, maxX: 5, maxY: 5 },
      thumbnail: this.generateScrewThumbnail(),
      author: 'System',
      version: '1.0.0',
      createdDate: new Date(),
      modifiedDate: new Date(),
      usage: 0,
      scalable: true,
      rotatable: true,
      mirrorable: false,
      parametric: true,
      parameters: [
        {
          id: 'diameter',
          name: 'Diameter',
          type: 'number',
          defaultValue: 6,
          minValue: 3,
          maxValue: 20,
          description: 'Screw diameter in mm'
        }
      ]
    };
  }

  private createStandardBearingBlock(): BlockDefinition {
    const entities: DrawingEntity[] = [
      {
        id: uuidv4(),
        type: 'circle',
        center: { x: 0, y: 0 },
        radius: 15,
        layer: 'default',
        visible: true,
        locked: false,
        style: {
          strokeColor: '#000000',
          strokeWidth: 2,
          strokeStyle: 'solid'
        }
      } as any,
      {
        id: uuidv4(),
        type: 'circle',
        center: { x: 0, y: 0 },
        radius: 8,
        layer: 'default',
        visible: true,
        locked: false,
        style: {
          strokeColor: '#000000',
          strokeWidth: 1,
          strokeStyle: 'solid'
        }
      } as any
    ];

    return {
      id: uuidv4(),
      name: 'Ball Bearing 6203',
      description: 'Standard ball bearing symbol',
      category: 'mechanical-bearings',
      tags: ['bearing', 'ball-bearing', '6203'],
      entities,
      dimensions: [],
      annotations: [],
      basePoint: { x: 0, y: 0 },
      bounds: { minX: -15, minY: -15, maxX: 15, maxY: 15 },
      thumbnail: this.generateBearingThumbnail(),
      author: 'System',
      version: '1.0.0',
      createdDate: new Date(),
      modifiedDate: new Date(),
      usage: 0,
      scalable: true,
      rotatable: false,
      mirrorable: false,
      parametric: true,
      parameters: [
        {
          id: 'outerDiameter',
          name: 'Outer Diameter',
          type: 'number',
          defaultValue: 40,
          minValue: 10,
          maxValue: 200,
          description: 'Bearing outer diameter'
        },
        {
          id: 'innerDiameter',
          name: 'Inner Diameter',
          type: 'number',
          defaultValue: 17,
          minValue: 5,
          maxValue: 100,
          description: 'Bearing inner diameter'
        }
      ]
    };
  }

  private createWeldingSymbolBlock(): BlockDefinition {
    const entities: DrawingEntity[] = [
      {
        id: uuidv4(),
        type: 'line',
        startPoint: { x: -10, y: 0 },
        endPoint: { x: 10, y: 0 },
        layer: 'default',
        visible: true,
        locked: false,
        style: {
          strokeColor: '#000000',
          strokeWidth: 2,
          strokeStyle: 'solid'
        }
      } as any,
      {
        id: uuidv4(),
        type: 'polyline',
        points: [
          { x: -5, y: -5 },
          { x: 0, y: 0 },
          { x: 5, y: -5 }
        ],
        closed: false,
        layer: 'default',
        visible: true,
        locked: false,
        style: {
          strokeColor: '#000000',
          strokeWidth: 2,
          strokeStyle: 'solid'
        }
      } as any
    ];

    return {
      id: uuidv4(),
      name: 'Fillet Weld Symbol',
      description: 'Standard fillet weld symbol',
      category: 'symbols-welding',
      tags: ['weld', 'fillet', 'symbol', 'welding'],
      entities,
      dimensions: [],
      annotations: [],
      basePoint: { x: 0, y: 0 },
      bounds: { minX: -10, minY: -5, maxX: 10, maxY: 0 },
      thumbnail: this.generateWeldingThumbnail(),
      author: 'System',
      version: '1.0.0',
      createdDate: new Date(),
      modifiedDate: new Date(),
      usage: 0,
      scalable: true,
      rotatable: true,
      mirrorable: true,
      parametric: false
    };
  }

  private createResistorBlock(): BlockDefinition {
    const entities: DrawingEntity[] = [
      {
        id: uuidv4(),
        type: 'rectangle',
        position: { x: -10, y: -3 },
        width: 20,
        height: 6,
        layer: 'default',
        visible: true,
        locked: false,
        style: {
          strokeColor: '#000000',
          strokeWidth: 1,
          strokeStyle: 'solid',
          fillColor: 'none'
        }
      } as any,
      {
        id: uuidv4(),
        type: 'line',
        startPoint: { x: -15, y: 0 },
        endPoint: { x: -10, y: 0 },
        layer: 'default',
        visible: true,
        locked: false,
        style: {
          strokeColor: '#000000',
          strokeWidth: 1,
          strokeStyle: 'solid'
        }
      } as any,
      {
        id: uuidv4(),
        type: 'line',
        startPoint: { x: 10, y: 0 },
        endPoint: { x: 15, y: 0 },
        layer: 'default',
        visible: true,
        locked: false,
        style: {
          strokeColor: '#000000',
          strokeWidth: 1,
          strokeStyle: 'solid'
        }
      } as any
    ];

    return {
      id: uuidv4(),
      name: 'Resistor',
      description: 'Standard resistor symbol',
      category: 'electrical-symbols',
      tags: ['resistor', 'electrical', 'symbol', 'component'],
      entities,
      dimensions: [],
      annotations: [],
      basePoint: { x: 0, y: 0 },
      bounds: { minX: -15, minY: -3, maxX: 15, maxY: 3 },
      thumbnail: this.generateResistorThumbnail(),
      author: 'System',
      version: '1.0.0',
      createdDate: new Date(),
      modifiedDate: new Date(),
      usage: 0,
      scalable: true,
      rotatable: true,
      mirrorable: false,
      parametric: true,
      parameters: [
        {
          id: 'value',
          name: 'Resistance Value',
          type: 'string',
          defaultValue: '1kΩ',
          description: 'Resistance value with unit'
        }
      ]
    };
  }

  private createCapacitorBlock(): BlockDefinition {
    const entities: DrawingEntity[] = [
      {
        id: uuidv4(),
        type: 'line',
        startPoint: { x: -2, y: -8 },
        endPoint: { x: -2, y: 8 },
        layer: 'default',
        visible: true,
        locked: false,
        style: {
          strokeColor: '#000000',
          strokeWidth: 2,
          strokeStyle: 'solid'
        }
      } as any,
      {
        id: uuidv4(),
        type: 'line',
        startPoint: { x: 2, y: -8 },
        endPoint: { x: 2, y: 8 },
        layer: 'default',
        visible: true,
        locked: false,
        style: {
          strokeColor: '#000000',
          strokeWidth: 2,
          strokeStyle: 'solid'
        }
      } as any,
      {
        id: uuidv4(),
        type: 'line',
        startPoint: { x: -15, y: 0 },
        endPoint: { x: -2, y: 0 },
        layer: 'default',
        visible: true,
        locked: false,
        style: {
          strokeColor: '#000000',
          strokeWidth: 1,
          strokeStyle: 'solid'
        }
      } as any,
      {
        id: uuidv4(),
        type: 'line',
        startPoint: { x: 2, y: 0 },
        endPoint: { x: 15, y: 0 },
        layer: 'default',
        visible: true,
        locked: false,
        style: {
          strokeColor: '#000000',
          strokeWidth: 1,
          strokeStyle: 'solid'
        }
      } as any
    ];

    return {
      id: uuidv4(),
      name: 'Capacitor',
      description: 'Standard capacitor symbol',
      category: 'electrical-symbols',
      tags: ['capacitor', 'electrical', 'symbol', 'component'],
      entities,
      dimensions: [],
      annotations: [],
      basePoint: { x: 0, y: 0 },
      bounds: { minX: -15, minY: -8, maxX: 15, maxY: 8 },
      thumbnail: this.generateCapacitorThumbnail(),
      author: 'System',
      version: '1.0.0',
      createdDate: new Date(),
      modifiedDate: new Date(),
      usage: 0,
      scalable: true,
      rotatable: true,
      mirrorable: false,
      parametric: true,
      parameters: [
        {
          id: 'value',
          name: 'Capacitance Value',
          type: 'string',
          defaultValue: '100μF',
          description: 'Capacitance value with unit'
        }
      ]
    };
  }

  private createStandardDoorBlock(): BlockDefinition {
    const entities: DrawingEntity[] = [
      {
        id: uuidv4(),
        type: 'rectangle',
        position: { x: 0, y: 0 },
        width: 90,
        height: 10,
        layer: 'default',
        visible: true,
        locked: false,
        style: {
          strokeColor: '#000000',
          strokeWidth: 2,
          strokeStyle: 'solid',
          fillColor: 'none'
        }
      } as any,
      {
        id: uuidv4(),
        type: 'arc',
        center: { x: 10, y: 5 },
        radius: 80,
        startAngle: 0,
        endAngle: Math.PI / 2,
        layer: 'default',
        visible: true,
        locked: false,
        style: {
          strokeColor: '#000000',
          strokeWidth: 1,
          strokeStyle: 'dashed'
        }
      } as any
    ];

    return {
      id: uuidv4(),
      name: 'Standard Door 90cm',
      description: 'Standard hinged door with swing arc',
      category: 'architectural-doors',
      tags: ['door', 'architectural', 'standard', '90cm'],
      entities,
      dimensions: [],
      annotations: [],
      basePoint: { x: 0, y: 5 },
      bounds: { minX: 0, minY: 0, maxX: 90, maxY: 85 },
      thumbnail: this.generateDoorThumbnail(),
      author: 'System',
      version: '1.0.0',
      createdDate: new Date(),
      modifiedDate: new Date(),
      usage: 0,
      scalable: true,
      rotatable: true,
      mirrorable: true,
      parametric: true,
      parameters: [
        {
          id: 'width',
          name: 'Door Width',
          type: 'number',
          defaultValue: 90,
          minValue: 60,
          maxValue: 120,
          description: 'Door width in cm'
        },
        {
          id: 'thickness',
          name: 'Wall Thickness',
          type: 'number',
          defaultValue: 10,
          minValue: 5,
          maxValue: 30,
          description: 'Wall thickness in cm'
        }
      ]
    };
  }

  private createStandardWindowBlock(): BlockDefinition {
    const entities: DrawingEntity[] = [
      {
        id: uuidv4(),
        type: 'rectangle',
        position: { x: 0, y: 0 },
        width: 120,
        height: 15,
        layer: 'default',
        visible: true,
        locked: false,
        style: {
          strokeColor: '#000000',
          strokeWidth: 2,
          strokeStyle: 'solid',
          fillColor: 'none'
        }
      } as any,
      {
        id: uuidv4(),
        type: 'line',
        startPoint: { x: 60, y: 0 },
        endPoint: { x: 60, y: 15 },
        layer: 'default',
        visible: true,
        locked: false,
        style: {
          strokeColor: '#000000',
          strokeWidth: 1,
          strokeStyle: 'solid'
        }
      } as any
    ];

    return {
      id: uuidv4(),
      name: 'Standard Window 120cm',
      description: 'Standard double window with center mullion',
      category: 'architectural-windows',
      tags: ['window', 'architectural', 'standard', '120cm'],
      entities,
      dimensions: [],
      annotations: [],
      basePoint: { x: 60, y: 7.5 },
      bounds: { minX: 0, minY: 0, maxX: 120, maxY: 15 },
      thumbnail: this.generateWindowThumbnail(),
      author: 'System',
      version: '1.0.0',
      createdDate: new Date(),
      modifiedDate: new Date(),
      usage: 0,
      scalable: true,
      rotatable: true,
      mirrorable: false,
      parametric: true,
      parameters: [
        {
          id: 'width',
          name: 'Window Width',
          type: 'number',
          defaultValue: 120,
          minValue: 60,
          maxValue: 300,
          description: 'Window width in cm'
        },
        {
          id: 'wallThickness',
          name: 'Wall Thickness',
          type: 'number',
          defaultValue: 15,
          minValue: 10,
          maxValue: 30,
          description: 'Wall thickness in cm'
        }
      ]
    };
  }

  private createBasicTitleBlock(): BlockDefinition {
    const entities: DrawingEntity[] = [
      {
        id: uuidv4(),
        type: 'rectangle',
        position: { x: 0, y: 0 },
        width: 180,
        height: 60,
        layer: 'default',
        visible: true,
        locked: false,
        style: {
          strokeColor: '#000000',
          strokeWidth: 1,
          strokeStyle: 'solid',
          fillColor: 'none'
        }
      } as any,
      // Divisori interni
      {
        id: uuidv4(),
        type: 'line',
        startPoint: { x: 0, y: 40 },
        endPoint: { x: 180, y: 40 },
        layer: 'default',
        visible: true,
        locked: false,
        style: {
          strokeColor: '#000000',
          strokeWidth: 1,
          strokeStyle: 'solid'
        }
      } as any,
      {
        id: uuidv4(),
        type: 'line',
        startPoint: { x: 120, y: 0 },
        endPoint: { x: 120, y: 40 },
        layer: 'default',
        visible: true,
        locked: false,
        style: {
          strokeColor: '#000000',
          strokeWidth: 1,
          strokeStyle: 'solid'
        }
      } as any
    ];

    const annotations: Annotation[] = [
      {
        id: uuidv4(),
        type: 'text-annotation',
        position: { x: 90, y: 50 },
        text: 'DRAWING TITLE',
        layer: 'annotations',
        visible: true,
        locked: false,
        style: {
          strokeColor: '#000000',
          strokeWidth: 1,
          strokeStyle: 'solid',
          fontFamily: 'Arial',
          fontSize: 12,
          fontWeight: 'bold',
          textAlign: 'center'
        }
      } as any,
      {
        id: uuidv4(),
        type: 'text-annotation',
        position: { x: 60, y: 20 },
        text: 'Scale: 1:1',
        layer: 'annotations',
        visible: true,
        locked: false,
        style: {
          strokeColor: '#000000',
          strokeWidth: 1,
          strokeStyle: 'solid',
          fontFamily: 'Arial',
          fontSize: 10,
          textAlign: 'center'
        }
      } as any,
      {
        id: uuidv4(),
        type: 'text-annotation',
        position: { x: 150, y: 20 },
        text: 'Date: --/--/----',
        layer: 'annotations',
        visible: true,
        locked: false,
        style: {
          strokeColor: '#000000',
          strokeWidth: 1,
          strokeStyle: 'solid',
          fontFamily: 'Arial',
          fontSize: 10,
          textAlign: 'center'
        }
      } as any
    ];

    return {
      id: uuidv4(),
      name: 'Basic Title Block',
      description: 'Standard title block for technical drawings',
      category: 'annotations-title-blocks',
      tags: ['title-block', 'annotation', 'standard'],
      entities,
      dimensions: [],
      annotations,
      basePoint: { x: 0, y: 0 },
      bounds: { minX: 0, minY: 0, maxX: 180, maxY: 60 },
      thumbnail: this.generateTitleBlockThumbnail(),
      author: 'System',
      version: '1.0.0',
      createdDate: new Date(),
      modifiedDate: new Date(),
      usage: 0,
      scalable: false,
      rotatable: false,
      mirrorable: false,
      parametric: true,
      parameters: [
        {
          id: 'title',
          name: 'Drawing Title',
          type: 'string',
          defaultValue: 'DRAWING TITLE',
          description: 'Main drawing title'
        },
        {
          id: 'scale',
          name: 'Drawing Scale',
          type: 'string',
          defaultValue: '1:1',
          description: 'Drawing scale'
        },
        {
          id: 'date',
          name: 'Drawing Date',
          type: 'string',
          defaultValue: '--/--/----',
          description: 'Drawing creation date'
        },
        {
          id: 'author',
          name: 'Author',
          type: 'string',
          defaultValue: '',
          description: 'Drawing author'
        }
      ]
    };
  }

  private createRevisionCloudBlock(): BlockDefinition {
    // Crea una semplice nuvola di revisione con archi
    const entities: DrawingEntity[] = [];
    
    // Genera archi per formare una nuvola
    const numArcs = 12;
    const radius = 20;
    const arcRadius = 3;
    
    for (let i = 0; i < numArcs; i++) {
      const angle = (i / numArcs) * Math.PI * 2;
      const centerX = Math.cos(angle) * radius;
      const centerY = Math.sin(angle) * radius;
      
      entities.push({
        id: uuidv4(),
        type: 'arc',
        center: { x: centerX, y: centerY },
        radius: arcRadius,
        startAngle: angle - Math.PI / 6,
        endAngle: angle + Math.PI / 6,
        layer: 'default',
        visible: true,
        locked: false,
        style: {
          strokeColor: '#ff0000',
          strokeWidth: 2,
          strokeStyle: 'solid'
        }
      } as any);
    }

    return {
      id: uuidv4(),
      name: 'Revision Cloud',
      description: 'Revision cloud for marking changes',
      category: 'annotations-revision-clouds',
      tags: ['revision', 'cloud', 'markup', 'annotation'],
      entities,
      dimensions: [],
      annotations: [],
      basePoint: { x: 0, y: 0 },
      bounds: { minX: -25, minY: -25, maxX: 25, maxY: 25 },
      thumbnail: this.generateRevisionCloudThumbnail(),
      author: 'System',
      version: '1.0.0',
      createdDate: new Date(),
      modifiedDate: new Date(),
      usage: 0,
      scalable: true,
      rotatable: false,
      mirrorable: false,
      parametric: false
    };
  }

  // Thumbnail generation methods (simplified)
  private generateScrewThumbnail(): string {
    return 'data:image/svg+xml;base64,' + btoa(`
      <svg width="32" height="32" viewBox="-8 -8 16 16" xmlns="http://www.w3.org/2000/svg">
        <circle cx="0" cy="0" r="5" fill="none" stroke="black" stroke-width="1"/>
        <line x1="-3" y1="0" x2="3" y2="0" stroke="black" stroke-width="1"/>
      </svg>
    `);
  }

  private generateBearingThumbnail(): string {
    return 'data:image/svg+xml;base64,' + btoa(`
      <svg width="32" height="32" viewBox="-16 -16 32 32" xmlns="http://www.w3.org/2000/svg">
        <circle cx="0" cy="0" r="15" fill="none" stroke="black" stroke-width="2"/>
        <circle cx="0" cy="0" r="8" fill="none" stroke="black" stroke-width="1"/>
      </svg>
    `);
  }

  private generateWeldingThumbnail(): string {
    return 'data:image/svg+xml;base64,' + btoa(`
      <svg width="32" height="32" viewBox="-12 -8 24 16" xmlns="http://www.w3.org/2000/svg">
        <line x1="-10" y1="0" x2="10" y2="0" stroke="black" stroke-width="2"/>
        <polyline points="-5,-5 0,0 5,-5" fill="none" stroke="black" stroke-width="2"/>
      </svg>
    `);
  }

  private generateResistorThumbnail(): string {
    return 'data:image/svg+xml;base64,' + btoa(`
      <svg width="32" height="32" viewBox="-16 -4 32 8" xmlns="http://www.w3.org/2000/svg">
        <rect x="-10" y="-3" width="20" height="6" fill="none" stroke="black" stroke-width="1"/>
        <line x1="-15" y1="0" x2="-10" y2="0" stroke="black" stroke-width="1"/>
        <line x1="10" y1="0" x2="15" y2="0" stroke="black" stroke-width="1"/>
      </svg>
    `);
  }

  private generateCapacitorThumbnail(): string {
    return 'data:image/svg+xml;base64,' + btoa(`
      <svg width="32" height="32" viewBox="-16 -10 32 20" xmlns="http://www.w3.org/2000/svg">
        <line x1="-2" y1="-8" x2="-2" y2="8" stroke="black" stroke-width="2"/>
        <line x1="2" y1="-8" x2="2" y2="8" stroke="black" stroke-width="2"/>
        <line x1="-15" y1="0" x2="-2" y2="0" stroke="black" stroke-width="1"/>
        <line x1="2" y1="0" x2="15" y2="0" stroke="black" stroke-width="1"/>
      </svg>
    `);
  }

  private generateDoorThumbnail(): string {
    return 'data:image/svg+xml;base64,' + btoa(`
      <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="14" width="28" height="4" fill="none" stroke="black" stroke-width="1"/>
        <path d="M 4 16 A 24 24 0 0 1 28 16" fill="none" stroke="black" stroke-width="1" stroke-dasharray="2,2"/>
      </svg>
    `);
  }

  private generateWindowThumbnail(): string {
    return 'data:image/svg+xml;base64,' + btoa(`
      <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="12" width="28" height="8" fill="none" stroke="black" stroke-width="1"/>
        <line x1="16" y1="12" x2="16" y2="20" stroke="black" stroke-width="1"/>
      </svg>
    `);
  }

  private generateTitleBlockThumbnail(): string {
    return 'data:image/svg+xml;base64,' + btoa(`
      <svg width="32" height="32" viewBox="0 0 32 24" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="30" height="22" fill="none" stroke="black" stroke-width="1"/>
        <line x1="1" y1="16" x2="31" y2="16" stroke="black" stroke-width="1"/>
        <line x1="20" y1="1" x2="20" y2="16" stroke="black" stroke-width="1"/>
        <text x="16" y="20" text-anchor="middle" font-size="6" font-family="Arial">TITLE</text>
      </svg>
    `);
  }

  private generateRevisionCloudThumbnail(): string {
    return 'data:image/svg+xml;base64,' + btoa(`
      <svg width="32" height="32" viewBox="-16 -16 32 32" xmlns="http://www.w3.org/2000/svg">
        <circle cx="0" cy="0" r="12" fill="none" stroke="red" stroke-width="2" stroke-dasharray="3,2"/>
      </svg>
    `);
  }

  private getCategoryColor(categoryId: string): string {
    const colors: Record<string, string> = {
      'mechanical': '#1890ff',
      'electrical': '#faad14',
      'architectural': '#52c41a',
      'structural': '#722ed1',
      'symbols': '#eb2f96',
      'annotations': '#13c2c2'
    };
    return colors[categoryId] || '#666666';
  }

  // Public API methods

  /**
   * Crea nuova libreria
   */
  createLibrary(name: string, description?: string): string {
    const library: BlockLibrary = {
      id: uuidv4(),
      name,
      description,
      version: '1.0.0',
      categories: [],
      blocks: [],
      createdDate: new Date(),
      modifiedDate: new Date(),
      isSystem: false,
      readOnly: false
    };

    this.libraries.set(library.id, library);
    this.notifyChange('library-created', { library });
    
    return library.id;
  }

  /**
   * Aggiunge blocco a libreria
   */
  addBlockToLibrary(libraryId: string, block: BlockDefinition): boolean {
    const library = this.libraries.get(libraryId);
    if (!library || library.readOnly) {
      return false;
    }

    this.blocks.set(block.id, block);
    library.blocks.push(block);
    library.modifiedDate = new Date();
    
    this.notifyChange('block-added', { libraryId, block });
    return true;
  }

  /**
   * Cerca blocchi
   */
  searchBlocks(criteria: BlockSearchCriteria): BlockDefinition[] {
    let results = Array.from(this.blocks.values());

    // Filtri
    if (criteria.query) {
      const query = criteria.query.toLowerCase();
      results = results.filter(block => 
        block.name.toLowerCase().includes(query) ||
        block.description?.toLowerCase().includes(query) ||
        block.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    if (criteria.category) {
      results = results.filter(block => 
        block.category === criteria.category ||
        block.category.startsWith(criteria.category + '-')
      );
    }

    if (criteria.tags && criteria.tags.length > 0) {
      results = results.filter(block =>
        criteria.tags!.some(tag => 
          block.tags.includes(tag.toLowerCase())
        )
      );
    }

    if (criteria.scalable !== undefined) {
      results = results.filter(block => block.scalable === criteria.scalable);
    }

    if (criteria.parametric !== undefined) {
      results = results.filter(block => block.parametric === criteria.parametric);
    }

    // Ordinamento
    const sortBy = criteria.sortBy || 'name';
    const sortOrder = criteria.sortOrder || 'asc';
    
    results.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'usage':
          comparison = a.usage - b.usage;
          break;
        case 'date':
          comparison = a.modifiedDate.getTime() - b.modifiedDate.getTime();
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    // Limite
    if (criteria.limit) {
      results = results.slice(0, criteria.limit);
    }

    return results;
  }

  /**
   * Inserisce blocco nel disegno
   */
  insertBlock(blockId: string, options: BlockInsertionOptions): BlockInstance | null {
    const blockDef = this.blocks.get(blockId);
    if (!blockDef) {
      return null;
    }

    const instance: BlockInstance = {
      id: uuidv4(),
      blockDefinitionId: blockId,
      name: options.layer ? `${blockDef.name}_${options.layer}` : blockDef.name,
      position: options.position,
      rotation: options.rotation || 0,
      scaleX: options.scaleX || 1,
      scaleY: options.scaleY || 1,
      mirrored: options.mirrored || false,
      layer: options.layer || 'default',
      visible: true,
      locked: false,
      parameterValues: options.parameterValues || {},
      insertedDate: new Date(),
      lastModified: new Date()
    };

    this.instances.set(instance.id, instance);
    
    // Incrementa contatore uso
    blockDef.usage++;
    
    this.notifyChange('block-inserted', { instance, blockDef });
    
    return instance;
  }

  /**
   * Ottiene tutte le librerie
   */
  getAllLibraries(): BlockLibrary[] {
    return Array.from(this.libraries.values());
  }

  /**
   * Ottiene libreria per ID
   */
  getLibrary(libraryId: string): BlockLibrary | null {
    return this.libraries.get(libraryId) || null;
  }

  /**
   * Ottiene blocco per ID
   */
  getBlock(blockId: string): BlockDefinition | null {
    return this.blocks.get(blockId) || null;
  }

  /**
   * Ottiene istanza per ID
   */
  getInstance(instanceId: string): BlockInstance | null {
    return this.instances.get(instanceId) || null;
  }

  /**
   * Ottiene tutte le categorie
   */
  getAllCategories(): BlockCategory[] {
    return Array.from(this.categories.values());
  }

  /**
   * Aggiunge listener per modifiche
   */
  addChangeListener(listener: (event: BlockManagerEvent) => void) {
    this.changeListeners.push(listener);
  }

  /**
   * Rimuove listener
   */
  removeChangeListener(listener: (event: BlockManagerEvent) => void) {
    const index = this.changeListeners.indexOf(listener);
    if (index > -1) {
      this.changeListeners.splice(index, 1);
    }
  }

  private notifyChange(type: string, data: any) {
    const event: BlockManagerEvent = {
      type,
      timestamp: new Date(),
      data
    };

    this.changeListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in block manager listener:', error);
      }
    });
  }
}

interface BlockManagerEvent {
  type: string;
  timestamp: Date;
  data: any;
}

export default BlockManager;