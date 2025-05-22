// src/components/cad/technical-drawing/core/blocks/StandardBlockFactory.ts
// Factory per creare blocchi standard professionali

import { v4 as uuidv4 } from 'uuid';
import { BlockDefinition, BlockCategory } from './BlockTypes';
import { DrawingEntity, Point } from '../../TechnicalDrawingTypes';

/**
 * 🏭 Standard Block Factory
 * 
 * Crea definizioni di blocchi standard per tutte le categorie professionali:
 * - Componenti meccanici (bulloni, cuscinetti, ingranaggi)
 * - Simboli elettrici (resistori, condensatori, transistor)
 * - Elementi architettonici (porte, finestre, scale)
 * - Annotazioni (frecce, bolle, simboli)
 */
export class StandardBlockFactory {
  
  /**
   * Crea blocchi meccanici standard
   */
  createStandardMechanicalBlocks(): BlockDefinition[] {
    const blocks: BlockDefinition[] = [];

    // Bullone esagonale M6
    blocks.push(this.createHexBolt('M6', 6, 10, 4));
    blocks.push(this.createHexBolt('M8', 8, 13, 5));
    blocks.push(this.createHexBolt('M10', 10, 16, 6));
    blocks.push(this.createHexBolt('M12', 12, 18, 8));

    // Dadi esagonali
    blocks.push(this.createHexNut('M6', 6, 10, 5));
    blocks.push(this.createHexNut('M8', 8, 13, 6.5));
    blocks.push(this.createHexNut('M10', 10, 16, 8));

    // Cuscinetti a sfere
    blocks.push(this.createBallBearing('6000', 10, 26, 8));
    blocks.push(this.createBallBearing('6200', 10, 30, 9));
    blocks.push(this.createBallBearing('6300', 10, 35, 11));

    // Ingranaggi
    blocks.push(this.createSpurGear(20, 40, 2)); // 20 denti, diametro 40mm, modulo 2
    blocks.push(this.createSpurGear(30, 60, 2)); // 30 denti, diametro 60mm, modulo 2

    // Molle
    blocks.push(this.createCompressionSpring(20, 50, 8)); // diametro 20, lunghezza 50, 8 spire

    return blocks;
  }

  /**
   * Crea blocchi elettrici/elettronici standard
   */
  createStandardElectricalBlocks(): BlockDefinition[] {
    const blocks: BlockDefinition[] = [];

    // Componenti passivi
    blocks.push(this.createResistor());
    blocks.push(this.createCapacitor());
    blocks.push(this.createInductor());

    // Semiconduttori
    blocks.push(this.createTransistorNPN());
    blocks.push(this.createTransistorPNP());
    blocks.push(this.createDiode());
    blocks.push(this.createLED());

    // Connessioni e alimentazione
    blocks.push(this.createGround());
    blocks.push(this.createVCC());
    blocks.push(this.createWireJunction());

    // Circuiti integrati
    blocks.push(this.createOpAmp());
    blocks.push(this.createMicrocontroller());

    return blocks;
  }

  /**
   * Crea blocchi architettonici standard
   */
  createStandardArchitecturalBlocks(): BlockDefinition[] {
    const blocks: BlockDefinition[] = [];

    // Porte
    blocks.push(this.createSingleDoor(800, 'left')); // 80cm, apertura sinistra
    blocks.push(this.createSingleDoor(800, 'right')); // 80cm, apertura destra
    blocks.push(this.createDoubleDoor(1600)); // 160cm totali

    // Finestre
    blocks.push(this.createWindow(1200, 1000, 'single')); // 120x100cm
    blocks.push(this.createWindow(1500, 1200, 'double')); // 150x120cm
    blocks.push(this.createWindow(2000, 1000, 'sliding')); // 200x100cm scorrevole

    // Scale
    blocks.push(this.createStraightStairs(15, 3000, 180)); // 15 gradini, 3m, 18cm alzata
    blocks.push(this.createLShapedStairs());

    // Sanitari
    blocks.push(this.createToilet());
    blocks.push(this.createSink());
    blocks.push(this.createBathtub());

    // Mobili
    blocks.push(this.createTable(1200, 800)); // tavolo 120x80cm
    blocks.push(this.createChair());
    blocks.push(this.createBed(2000, 1600)); // letto 200x160cm

    return blocks;
  }

  /**
   * Crea blocchi di annotazione standard
   */
  createStandardAnnotationBlocks(): BlockDefinition[] {
    const blocks: BlockDefinition[] = [];

    // Frecce e indicatori
    blocks.push(this.createNorthArrow());
    blocks.push(this.createScaleBar());
    blocks.push(this.createDetailArrow());
    blocks.push(this.createSectionArrow());

    // Bolle e riferimenti
    blocks.push(this.createDetailBubble());
    blocks.push(this.createSectionBubble());
    blocks.push(this.createElevationMarker());

    // Nuvole e revisioni
    blocks.push(this.createRevisionCloud());
    blocks.push(this.createRevisionTriangle());

    // Title blocks
    blocks.push(this.createTitleBlockA4());
    blocks.push(this.createTitleBlockA3());

    return blocks;
  }

  // Mechanical block creators

  private createHexBolt(size: string, diameter: number, hexWidth: number, headHeight: number): BlockDefinition {
    const entities: DrawingEntity[] = [];
    const basePoint = { x: 0, y: 0 };

    // Corpo del bullone (cerchio)
    entities.push({
      id: uuidv4(),
      type: 'circle',
      center: basePoint,
      radius: diameter / 2,
      layer: 'default',
      visible: true,
      locked: false,
      style: { strokeColor: '#000000', strokeWidth: 1, strokeStyle: 'solid' }
    } as any);

    // Testa esagonale
    const hexPoints: Point[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      hexPoints.push({
        x: basePoint.x + (hexWidth / 2) * Math.cos(angle),
        y: basePoint.y + (hexWidth / 2) * Math.sin(angle)
      });
    }

    entities.push({
      id: uuidv4(),
      type: 'polyline',
      points: hexPoints,
      closed: true,
      layer: 'default',
      visible: true,
      locked: false,
      style: { strokeColor: '#000000', strokeWidth: 1, strokeStyle: 'solid' }
    } as any);

    return {
      id: uuidv4(),
      name: `Hex Bolt ${size}`,
      description: `Hexagonal bolt ${size} thread`,
      category: BlockCategory.FASTENERS,
      tags: ['bolt', 'fastener', 'hex', size.toLowerCase()],
      basePoint,
      entities,
      boundingBox: {
        minX: -hexWidth / 2,
        minY: -hexWidth / 2,
        maxX: hexWidth / 2,
        maxY: hexWidth / 2
      },
      attributes: [],
      version: '1.0.0',
      createdDate: new Date(),
      modifiedDate: new Date(),
      isSystemBlock: true,
      isParametric: false
    };
  }

  private createHexNut(size: string, diameter: number, hexWidth: number, thickness: number): BlockDefinition {
    const entities: DrawingEntity[] = [];
    const basePoint = { x: 0, y: 0 };

    // Foro interno
    entities.push({
      id: uuidv4(),
      type: 'circle',
      center: basePoint,
      radius: diameter / 2,
      layer: 'default',
      visible: true,
      locked: false,
      style: { strokeColor: '#000000', strokeWidth: 1, strokeStyle: 'solid' }
    } as any);

    // Forma esagonale esterna
    const hexPoints: Point[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      hexPoints.push({
        x: basePoint.x + (hexWidth / 2) * Math.cos(angle),
        y: basePoint.y + (hexWidth / 2) * Math.sin(angle)
      });
    }

    entities.push({
      id: uuidv4(),
      type: 'polyline',
      points: hexPoints,
      closed: true,
      layer: 'default',
      visible: true,
      locked: false,
      style: { strokeColor: '#000000', strokeWidth: 2, strokeStyle: 'solid' }
    } as any);

    return {
      id: uuidv4(),
      name: `Hex Nut ${size}`,
      description: `Hexagonal nut ${size} thread`,
      category: BlockCategory.FASTENERS,
      tags: ['nut', 'fastener', 'hex', size.toLowerCase()],
      basePoint,
      entities,
      boundingBox: {
        minX: -hexWidth / 2,
        minY: -hexWidth / 2,
        maxX: hexWidth / 2,
        maxY: hexWidth / 2
      },
      attributes: [],
      version: '1.0.0',
      createdDate: new Date(),
      modifiedDate: new Date(),
      isSystemBlock: true,
      isParametric: false
    };
  }

  private createBallBearing(series: string, innerDia: number, outerDia: number, width: number): BlockDefinition {
    const entities: DrawingEntity[] = [];
    const basePoint = { x: 0, y: 0 };

    // Anello esterno
    entities.push({
      id: uuidv4(),
      type: 'circle',
      center: basePoint,
      radius: outerDia / 2,
      layer: 'default',
      visible: true,
      locked: false,
      style: { strokeColor: '#000000', strokeWidth: 2, strokeStyle: 'solid' }
    } as any);

    // Anello interno
    entities.push({
      id: uuidv4(),
      type: 'circle',
      center: basePoint,
      radius: innerDia / 2,
      layer: 'default',
      visible: true,
      locked: false,
      style: { strokeColor: '#000000', strokeWidth: 1, strokeStyle: 'solid' }
    } as any);

    // Linee tratteggiate per rappresentare le sfere
    const ballRadius = (outerDia - innerDia) / 4;
    const ballCircleRadius = (outerDia + innerDia) / 4;
    
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const center = {
        x: basePoint.x + ballCircleRadius * Math.cos(angle),
        y: basePoint.y + ballCircleRadius * Math.sin(angle)
      };
      
      entities.push({
        id: uuidv4(),
        type: 'circle',
        center,
        radius: ballRadius,
        layer: 'default',
        visible: true,
        locked: false,
        style: { strokeColor: '#000000', strokeWidth: 0.5, strokeStyle: 'dashed' }
      } as any);
    }

    return {
      id: uuidv4(),
      name: `Ball Bearing ${series}`,
      description: `Ball bearing series ${series} - ${innerDia}x${outerDia}x${width}mm`,
      category: BlockCategory.MECHANICAL,
      tags: ['bearing', 'ball', 'mechanical', series.toLowerCase()],
      basePoint,
      entities,
      boundingBox: {
        minX: -outerDia / 2,
        minY: -outerDia / 2,
        maxX: outerDia / 2,
        maxY: outerDia / 2
      },
      attributes: [],
      version: '1.0.0',
      createdDate: new Date(),
      modifiedDate: new Date(),
      isSystemBlock: true,
      isParametric: false
    };
  }

  private createSpurGear(teeth: number, diameter: number, module: number): BlockDefinition {
    const entities: DrawingEntity[] = [];
    const basePoint = { x: 0, y: 0 };

    // Cerchio primitivo
    entities.push({
      id: uuidv4(),
      type: 'circle',
      center: basePoint,
      radius: diameter / 2,
      layer: 'default',
      visible: true,
      locked: false,
      style: { strokeColor: '#000000', strokeWidth: 1, strokeStyle: 'dashed' }
    } as any);

    // Cerchio di base
    const baseRadius = diameter / 2 * Math.cos(20 * Math.PI / 180); // 20° pressure angle
    entities.push({
      id: uuidv4(),
      type: 'circle',
      center: basePoint,
      radius: baseRadius,
      layer: 'default',
      visible: true,
      locked: false,
      style: { strokeColor: '#000000', strokeWidth: 0.5, strokeStyle: 'dotted' }
    } as any);

    // Cerchio di testa
    const addendum = module;
    const outerRadius = diameter / 2 + addendum;
    entities.push({
      id: uuidv4(),
      type: 'circle',
      center: basePoint,
      radius: outerRadius,
      layer: 'default',
      visible: true,
      locked: false,
      style: { strokeColor: '#000000', strokeWidth: 2, strokeStyle: 'solid' }
    } as any);

    // Foro centrale (standard 1/5 del diametro)
    const holeRadius = diameter / 10;
    entities.push({
      id: uuidv4(),
      type: 'circle',
      center: basePoint,
      radius: holeRadius,
      layer: 'default',
      visible: true,
      locked: false,
      style: { strokeColor: '#000000', strokeWidth: 1, strokeStyle: 'solid' }
    } as any);

    return {
      id: uuidv4(),
      name: `Spur Gear ${teeth}T`,
      description: `Spur gear with ${teeth} teeth, module ${module}, diameter ${diameter}mm`,
      category: BlockCategory.MECHANICAL,
      tags: ['gear', 'spur', 'mechanical', `${teeth}t`, `m${module}`],
      basePoint,
      entities,
      boundingBox: {
        minX: -outerRadius,
        minY: -outerRadius,
        maxX: outerRadius,
        maxY: outerRadius
      },
      attributes: [],
      version: '1.0.0',
      createdDate: new Date(),
      modifiedDate: new Date(),
      isSystemBlock: true,
      isParametric: true
    };
  }

  private createCompressionSpring(diameter: number, length: number, coils: number): BlockDefinition {
    const entities: DrawingEntity[] = [];
    const basePoint = { x: 0, y: -length / 2 };

    // Rappresentazione semplificata della molla con linee diagonali
    const coilHeight = length / coils;
    
    for (let i = 0; i < coils; i++) {
      const y1 = basePoint.y + i * coilHeight;
      const y2 = basePoint.y + (i + 1) * coilHeight;
      
      // Linea diagonale sinistra
      entities.push({
        id: uuidv4(),
        type: 'line',
        startPoint: { x: -diameter / 2, y: y1 },
        endPoint: { x: diameter / 2, y: y1 + coilHeight / 2 },
        layer: 'default',
        visible: true,
        locked: false,
        style: { strokeColor: '#000000', strokeWidth: 1, strokeStyle: 'solid' }
      } as any);
      
      // Linea diagonale destra
      entities.push({
        id: uuidv4(),
        type: 'line',
        startPoint: { x: diameter / 2, y: y1 + coilHeight / 2 },
        endPoint: { x: -diameter / 2, y: y2 },
        layer: 'default',
        visible: true,
        locked: false,
        style: { strokeColor: '#000000', strokeWidth: 1, strokeStyle: 'solid' }
      } as any);
    }

    // Linee di base e top
    entities.push({
      id: uuidv4(),
      type: 'line',
      startPoint: { x: -diameter / 2, y: basePoint.y },
      endPoint: { x: diameter / 2, y: basePoint.y },
      layer: 'default',
      visible: true,
      locked: false,
      style: { strokeColor: '#000000', strokeWidth: 2, strokeStyle: 'solid' }
    } as any);

    entities.push({
      id: uuidv4(),
      type: 'line',
      startPoint: { x: -diameter / 2, y: basePoint.y + length },
      endPoint: { x: diameter / 2, y: basePoint.y + length },
      layer: 'default',
      visible: true,
      locked: false,
      style: { strokeColor: '#000000', strokeWidth: 2, strokeStyle: 'solid' }
    } as any);

    return {
      id: uuidv4(),
      name: `Compression Spring`,
      description: `Compression spring - ${diameter}mm diameter, ${length}mm length, ${coils} coils`,
      category: BlockCategory.MECHANICAL,
      tags: ['spring', 'compression', 'mechanical'],
      basePoint,
      entities,
      boundingBox: {
        minX: -diameter / 2,
        minY: basePoint.y,
        maxX: diameter / 2,
        maxY: basePoint.y + length
      },
      attributes: [],
      version: '1.0.0',
      createdDate: new Date(),
      modifiedDate: new Date(),
      isSystemBlock: true,
      isParametric: true
    };
  }

  // Electrical block creators

  private createResistor(): BlockDefinition {
    const entities: DrawingEntity[] = [];
    const basePoint = { x: 0, y: 0 };
    const width = 40;
    const height = 12;

    // Corpo del resistore (rettangolo)
    entities.push({
      id: uuidv4(),
      type: 'rectangle',
      position: { x: -width / 2, y: -height / 2 },
      width,
      height,
      layer: 'default',
      visible: true,
      locked: false,
      style: { strokeColor: '#000000', strokeWidth: 2, strokeStyle: 'solid', fillColor: 'none' }
    } as any);

    // Terminali
    entities.push({
      id: uuidv4(),
      type: 'line',
      startPoint: { x: -width / 2 - 10, y: 0 },
      endPoint: { x: -width / 2, y: 0 },
      layer: 'default',
      visible: true,
      locked: false,
      style: { strokeColor: '#000000', strokeWidth: 2, strokeStyle: 'solid' }
    } as any);

    entities.push({
      id: uuidv4(),
      type: 'line',
      startPoint: { x: width / 2, y: 0 },
      endPoint: { x: width / 2 + 10, y: 0 },
      layer: 'default',
      visible: true,
      locked: false,
      style: { strokeColor: '#000000', strokeWidth: 2, strokeStyle: 'solid' }
    } as any);

    return {
      id: uuidv4(),
      name: 'Resistor',
      description: 'Standard electrical resistor symbol',
      category: BlockCategory.ELECTRICAL,
      tags: ['resistor', 'electrical', 'passive', 'component'],
      basePoint,
      entities,
      boundingBox: {
        minX: -width / 2 - 10,
        minY: -height / 2,
        maxX: width / 2 + 10,
        maxY: height / 2
      },
      attributes: [
        {
          id: uuidv4(),
          name: 'Value',
          tag: 'VALUE',
          value: '1kΩ',
          position: { x: 0, y: height / 2 + 8 },
          style: { strokeColor: '#000000', strokeWidth: 1, strokeStyle: 'solid', fontSize: 10, fontFamily: 'Arial' },
          visible: true,
          editable: true,
          prompt: 'Enter resistance value:',
          defaultValue: '1kΩ'
        }
      ],
      version: '1.0.0',
      createdDate: new Date(),
      modifiedDate: new Date(),
      isSystemBlock: true,
      isParametric: false
    };
  }

  private createCapacitor(): BlockDefinition {
    const entities: DrawingEntity[] = [];
    const basePoint = { x: 0, y: 0 };
    const height = 30;
    const spacing = 6;

    // Piastra sinistra
    entities.push({
      id: uuidv4(),
      type: 'line',
      startPoint: { x: -spacing / 2, y: -height / 2 },
      endPoint: { x: -spacing / 2, y: height / 2 },
      layer: 'default',
      visible: true,
      locked: false,
      style: { strokeColor: '#000000', strokeWidth: 3, strokeStyle: 'solid' }
    } as any);

    // Piastra destra
    entities.push({
      id: uuidv4(),
      type: 'line',
      startPoint: { x: spacing / 2, y: -height / 2 },
      endPoint: { x: spacing / 2, y: height / 2 },
      layer: 'default',
      visible: true,
      locked: false,
      style: { strokeColor: '#000000', strokeWidth: 3, strokeStyle: 'solid' }
    } as any);

    // Terminali
    entities.push({
      id: uuidv4(),
      type: 'line',
      startPoint: { x: -spacing / 2 - 15, y: 0 },
      endPoint: { x: -spacing / 2, y: 0 },
      layer: 'default',
      visible: true,
      locked: false,
      style: { strokeColor: '#000000', strokeWidth: 2, strokeStyle: 'solid' }
    } as any);

    entities.push({
      id: uuidv4(),
      type: 'line',
      startPoint: { x: spacing / 2, y: 0 },
      endPoint: { x: spacing / 2 + 15, y: 0 },
      layer: 'default',
      visible: true,
      locked: false,
      style: { strokeColor: '#000000', strokeWidth: 2, strokeStyle: 'solid' }
    } as any);

    return {
      id: uuidv4(),
      name: 'Capacitor',
      description: 'Standard electrical capacitor symbol',
      category: BlockCategory.ELECTRICAL,
      tags: ['capacitor', 'electrical', 'passive', 'component'],
      basePoint,
      entities,
      boundingBox: {
        minX: -spacing / 2 - 15,
        minY: -height / 2,
        maxX: spacing / 2 + 15,
        maxY: height / 2
      },
      attributes: [
        {
          id: uuidv4(),
          name: 'Value',
          tag: 'VALUE',
          value: '100μF',
          position: { x: 0, y: height / 2 + 8 },
          style: { strokeColor: '#000000', strokeWidth: 1, strokeStyle: 'solid', fontSize: 10, fontFamily: 'Arial' },
          visible: true,
          editable: true,
          prompt: 'Enter capacitance value:',
          defaultValue: '100μF'
        }
      ],
      version: '1.0.0',
      createdDate: new Date(),
      modifiedDate: new Date(),
      isSystemBlock: true,
      isParametric: false
    };
  }

  private createTransistorNPN(): BlockDefinition {
    const entities: DrawingEntity[] = [];
    const basePoint = { x: 0, y: 0 };
    const size = 20;

    // Corpo del transistor (cerchio)
    entities.push({
      id: uuidv4(),
      type: 'circle',
      center: basePoint,
      radius: size / 2,
      layer: 'default',
      visible: true,
      locked: false,
      style: { strokeColor: '#000000', strokeWidth: 2, strokeStyle: 'solid', fillColor: 'none' }
    } as any);

    // Base line (verticale)
    entities.push({
      id: uuidv4(),
      type: 'line',
      startPoint: { x: -size / 4, y: -size / 3 },
      endPoint: { x: -size / 4, y: size / 3 },
      layer: 'default',
      visible: true,
      locked: false,
      style: { strokeColor: '#000000', strokeWidth: 3, strokeStyle: 'solid' }
    } as any);

    // Collector line
    entities.push({
      id: uuidv4(),
      type: 'line',
      startPoint: { x: -size / 4, y: -size / 6 },
      endPoint: { x: size / 3, y: -size / 2.5 },
      layer: 'default',
      visible: true,
      locked: false,
      style: { strokeColor: '#000000', strokeWidth: 2, strokeStyle: 'solid' }
    } as any);

    // Emitter line
    entities.push({
      id: uuidv4(),
      type: 'line',
      startPoint: { x: -size / 4, y: size / 6 },
      endPoint: { x: size / 3, y: size / 2.5 },
      layer: 'default',
      visible: true,
      locked: false,
      style: { strokeColor: '#000000', strokeWidth: 2, strokeStyle: 'solid' }
    } as any);

    // Freccia sull'emitter (NPN)
    const arrowTip = { x: size / 3, y: size / 2.5 };
    const arrowBase = { x: size / 6, y: size / 4 };
    
    entities.push({
      id: uuidv4(),
      type: 'line',
      startPoint: arrowTip,
      endPoint: { x: arrowBase.x - 3, y: arrowBase.y - 2 },
      layer: 'default',
      visible: true,
      locked: false,
      style: { strokeColor: '#000000', strokeWidth: 2, strokeStyle: 'solid' }
    } as any);

    entities.push({
      id: uuidv4(),
      type: 'line',
      startPoint: arrowTip,
      endPoint: { x: arrowBase.x + 2, y: arrowBase.y + 3 },
      layer: 'default',
      visible: true,
      locked: false,
      style: { strokeColor: '#000000', strokeWidth: 2, strokeStyle: 'solid' }
    } as any);

    // Terminali esterni
    entities.push({
      id: uuidv4(),
      type: 'line',
      startPoint: { x: -size / 2 - 10, y: 0 },
      endPoint: { x: -size / 4, y: 0 },
      layer: 'default',
      visible: true,
      locked: false,
      style: { strokeColor: '#000000', strokeWidth: 2, strokeStyle: 'solid' }
    } as any);

    entities.push({
      id: uuidv4(),
      type: 'line',
      startPoint: { x: size / 3, y: -size / 2.5 },
      endPoint: { x: size / 3, y: -size / 2 - 10 },
      layer: 'default',
      visible: true,
      locked: false,
      style: { strokeColor: '#000000', strokeWidth: 2, strokeStyle: 'solid' }
    } as any);

    entities.push({
      id: uuidv4(),
      type: 'line',
      startPoint: { x: size / 3, y: size / 2.5 },
      endPoint: { x: size / 3, y: size / 2 + 10 },
      layer: 'default',
      visible: true,
      locked: false,
      style: { strokeColor: '#000000', strokeWidth: 2, strokeStyle: 'solid' }
    } as any);

    return {
      id: uuidv4(),
      name: 'NPN Transistor',
      description: 'NPN bipolar junction transistor symbol',
      category: BlockCategory.ELECTRONICS,
      tags: ['transistor', 'npn', 'bjt', 'semiconductor', 'electronics'],
      basePoint,
      entities,
      boundingBox: {
        minX: -size / 2 - 10,
        minY: -size / 2 - 10,
        maxX: size / 2,
        maxY: size / 2 + 10
      },
      attributes: [
        {
          id: uuidv4(),
          name: 'Type',
          tag: 'TYPE',
          value: '2N3904',
          position: { x: size / 2 + 5, y: 0 },
          style: { strokeColor: '#000000', strokeWidth: 1, strokeStyle: 'solid', fontSize: 8, fontFamily: 'Arial' },
          visible: true,
          editable: true,
          prompt: 'Enter transistor type:',
          defaultValue: '2N3904'
        }
      ],
      version: '1.0.0',
      createdDate: new Date(),
      modifiedDate: new Date(),
      isSystemBlock: true,
      isParametric: false
    };
  }

  private createGround(): BlockDefinition {
    const entities: DrawingEntity[] = [];
    const basePoint = { x: 0, y: 0 };

    // Linea verticale
    entities.push({
      id: uuidv4(),
      type: 'line',
      startPoint: { x: 0, y: 0 },
      endPoint: { x: 0, y: -15 },
      layer: 'default',
      visible: true,
      locked: false,
      style: { strokeColor: '#000000', strokeWidth: 2, strokeStyle: 'solid' }
    } as any);

    // Linee orizzontali (simbolo di terra)
    const lineWidths = [20, 12, 6];
    for (let i = 0; i < 3; i++) {
      const y = -15 - (i * 3);
      const width = lineWidths[i];
      
      entities.push({
        id: uuidv4(),
        type: 'line',
        startPoint: { x: -width / 2, y },
        endPoint: { x: width / 2, y },
        layer: 'default',
        visible: true,
        locked: false,
        style: { strokeColor: '#000000', strokeWidth: 2, strokeStyle: 'solid' }
      } as any);
    }

    return {
      id: uuidv4(),
      name: 'Ground',
      description: 'Electrical ground connection symbol',
      category: BlockCategory.ELECTRICAL,
      tags: ['ground', 'gnd', 'electrical', 'connection'],
      basePoint,
      entities,
      boundingBox: {
        minX: -10,
        minY: -24,
        maxX: 10,
        maxY: 0
      },
      attributes: [],
      version: '1.0.0',
      createdDate: new Date(),
      modifiedDate: new Date(),
      isSystemBlock: true,
      isParametric: false
    };
  }

  // Architectural block creators

  private createSingleDoor(width: number, swing: 'left' | 'right'): BlockDefinition {
    const entities: DrawingEntity[] = [];
    const basePoint = { x: 0, y: 0 };
    const wallThickness = 100; // 10cm wall

    // Door frame (opening in wall)
    entities.push({
      id: uuidv4(),
      type: 'line',
      startPoint: { x: 0, y: 0 },
      endPoint: { x: width, y: 0 },
      layer: 'default',
      visible: true,
      locked: false,
      style: { strokeColor: '#000000', strokeWidth: 3, strokeStyle: 'solid' }
    } as any);

    entities.push({
      id: uuidv4(),
      type: 'line',
      startPoint: { x: 0, y: wallThickness },
      endPoint: { x: width, y: wallThickness },
      layer: 'default',
      visible: true,
      locked: false,
      style: { strokeColor: '#000000', strokeWidth: 3, strokeStyle: 'solid' }
    } as any);

    // Door leaf
    const doorThickness = 50; // 5cm door
    entities.push({
      id: uuidv4(),
      type: 'line',
      startPoint: { x: swing === 'left' ? 0 : width, y: 25 },
      endPoint: { x: swing === 'left' ? width : 0, y: 25 },
      layer: 'default',
      visible: true,
      locked: false,
      style: { strokeColor: '#000000', strokeWidth: 2, strokeStyle: 'solid' }
    } as any);

    // Swing arc
    const arcRadius = width * 0.9;
    const arcCenter = swing === 'left' ? { x: 0, y: 25 } : { x: width, y: 25 };
    const startAngle = swing === 'left' ? 0 : Math.PI;
    const endAngle = swing === 'left' ? Math.PI / 2 : Math.PI * 1.5;

    entities.push({
      id: uuidv4(),
      type: 'arc',
      center: arcCenter,
      radius: arcRadius,
      startAngle,
      endAngle,
      counterclockwise: false,
      layer: 'default',
      visible: true,
      locked: false,
      style: { strokeColor: '#000000', strokeWidth: 1, strokeStyle: 'dashed' }
    } as any);

    return {
      id: uuidv4(),
      name: `Single Door ${width}mm ${swing}`,
      description: `Single door ${width}mm width, ${swing} swing`,
      category: BlockCategory.ARCHITECTURAL,
      tags: ['door', 'single', 'architectural', swing, `${width}mm`],
      basePoint,
      entities,
      boundingBox: {
        minX: swing === 'left' ? 0 : -arcRadius,
        minY: 0,
        maxX: swing === 'left' ? Math.max(width, arcRadius) : width,
        maxY: wallThickness
      },
      attributes: [],
      version: '1.0.0',
      createdDate: new Date(),
      modifiedDate: new Date(),
      isSystemBlock: true,
      isParametric: true
    };
  }

  private createWindow(width: number, height: number, type: 'single' | 'double' | 'sliding'): BlockDefinition {
    const entities: DrawingEntity[] = [];
    const basePoint = { x: 0, y: 0 };
    const wallThickness = 200; // 20cm wall
    const sillHeight = 900; // 90cm sill height

    // Window frame outline
    entities.push({
      id: uuidv4(),
      type: 'rectangle',
      position: { x: 0, y: sillHeight },
      width,
      height,
      layer: 'default',
      visible: true,
      locked: false,
      style: { strokeColor: '#000000', strokeWidth: 3, strokeStyle: 'solid', fillColor: 'none' }
    } as any);

    // Window sill
    entities.push({
      id: uuidv4(),
      type: 'line',
      startPoint: { x: -50, y: sillHeight },
      endPoint: { x: width + 50, y: sillHeight },
      layer: 'default',
      visible: true,
      locked: false,
      style: { strokeColor: '#000000', strokeWidth: 2, strokeStyle: 'solid' }
    } as any);

    // Window divisions based on type
    switch (type) {
      case 'double':
        // Vertical mullion
        entities.push({
          id: uuidv4(),
          type: 'line',
          startPoint: { x: width / 2, y: sillHeight },
          endPoint: { x: width / 2, y: sillHeight + height },
          layer: 'default',
          visible: true,
          locked: false,
          style: { strokeColor: '#000000', strokeWidth: 2, strokeStyle: 'solid' }
        } as any);
        break;
        
      case 'sliding':
        // Sliding track indicators
        entities.push({
          id: uuidv4(),
          type: 'line',
          startPoint: { x: width / 4, y: sillHeight + height - 10 },
          endPoint: { x: 3 * width / 4, y: sillHeight + height - 10 },
          layer: 'default',
          visible: true,
          locked: false,
          style: { strokeColor: '#000000', strokeWidth: 1, strokeStyle: 'dashed' }
        } as any);
        break;
    }

    // Glass indication (diagonal lines)
    entities.push({
      id: uuidv4(),
      type: 'line',
      startPoint: { x: 10, y: sillHeight + 10 },
      endPoint: { x: width - 10, y: sillHeight + height - 10 },
      layer: 'default',
      visible: true,
      locked: false,
      style: { strokeColor: '#000000', strokeWidth: 0.5, strokeStyle: 'solid' }
    } as any);

    entities.push({
      id: uuidv4(),
      type: 'line',
      startPoint: { x: width - 10, y: sillHeight + 10 },
      endPoint: { x: 10, y: sillHeight + height - 10 },
      layer: 'default',
      visible: true,
      locked: false,
      style: { strokeColor: '#000000', strokeWidth: 0.5, strokeStyle: 'solid' }
    } as any);

    return {
      id: uuidv4(),
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} Window`,
      description: `${type} window ${width}x${height}mm`,
      category: BlockCategory.ARCHITECTURAL,
      tags: ['window', type, 'architectural', `${width}x${height}`],
      basePoint,
      entities,
      boundingBox: {
        minX: -50,
        minY: sillHeight,
        maxX: width + 50,
        maxY: sillHeight + height
      },
      attributes: [],
      version: '1.0.0',
      createdDate: new Date(),
      modifiedDate: new Date(),
      isSystemBlock: true,
      isParametric: true
    };
  }

  // Annotation block creators

  private createNorthArrow(): BlockDefinition {
    const entities: DrawingEntity[] = [];
    const basePoint = { x: 0, y: 0 };
    const size = 50;

    // Arrow shaft
    entities.push({
      id: uuidv4(),
      type: 'line',
      startPoint: { x: 0, y: -size / 2 },
      endPoint: { x: 0, y: size / 2 },
      layer: 'default',
      visible: true,
      locked: false,
      style: { strokeColor: '#000000', strokeWidth: 3, strokeStyle: 'solid' }
    } as any);

    // Arrow head
    const arrowPoints: Point[] = [
      { x: 0, y: size / 2 },
      { x: -8, y: size / 2 - 15 },
      { x: 8, y: size / 2 - 15 }
    ];

    entities.push({
      id: uuidv4(),
      type: 'polyline',
      points: arrowPoints,
      closed: true,
      layer: 'default',
      visible: true,
      locked: false,
      style: { strokeColor: '#000000', strokeWidth: 2, strokeStyle: 'solid', fillColor: '#000000' }
    } as any);

    // 'N' letter
    entities.push({
      id: uuidv4(),
      type: 'text-annotation',
      position: { x: 0, y: -size / 2 - 15 },
      text: 'N',
      layer: 'default',
      visible: true,
      locked: false,
      style: { 
        strokeColor: '#000000', 
        strokeWidth: 1, 
        strokeStyle: 'solid',
        fontSize: 16,
        fontFamily: 'Arial',
        fontWeight: 'bold',
        textAlign: 'center'
      }
    } as any);

    return {
      id: uuidv4(),
      name: 'North Arrow',
      description: 'Standard north direction indicator arrow',
      category: BlockCategory.SYMBOLS,
      tags: ['north', 'arrow', 'direction', 'symbol', 'annotation'],
      basePoint,
      entities,
      boundingBox: {
        minX: -8,
        minY: -size / 2 - 20,
        maxX: 8,
        maxY: size / 2
      },
      attributes: [],
      version: '1.0.0',
      createdDate: new Date(),
      modifiedDate: new Date(),
      isSystemBlock: true,
      isParametric: false
    };
  }

  private createDetailBubble(): BlockDefinition {
    const entities: DrawingEntity[] = [];
    const basePoint = { x: 0, y: 0 };
    const radius = 15;

    // Circle
    entities.push({
      id: uuidv4(),
      type: 'circle',
      center: basePoint,
      radius,
      layer: 'default',
      visible: true,
      locked: false,
      style: { strokeColor: '#000000', strokeWidth: 2, strokeStyle: 'solid', fillColor: 'none' }
    } as any);

    // Horizontal divider line
    entities.push({
      id: uuidv4(),
      type: 'line',
      startPoint: { x: -radius, y: 0 },
      endPoint: { x: radius, y: 0 },
      layer: 'default',
      visible: true,
      locked: false,
      style: { strokeColor: '#000000', strokeWidth: 1, strokeStyle: 'solid' }
    } as any);

    return {
      id: uuidv4(),
      name: 'Detail Bubble',
      description: 'Detail reference bubble for drawing annotations',
      category: BlockCategory.ANNOTATIONS,
      tags: ['detail', 'bubble', 'reference', 'annotation'],
      basePoint,
      entities,
      boundingBox: {
        minX: -radius,
        minY: -radius,
        maxX: radius,
        maxY: radius
      },
      attributes: [
        {
          id: uuidv4(),
          name: 'Detail Number',
          tag: 'DETAIL_NUM',
          value: '1',
          position: { x: 0, y: 5 },
          style: { 
            strokeColor: '#000000', 
            strokeWidth: 1, 
            strokeStyle: 'solid',
            fontSize: 12,
            fontFamily: 'Arial',
            fontWeight: 'bold',
            textAlign: 'center'
          },
          visible: true,
          editable: true,
          prompt: 'Enter detail number:',
          defaultValue: '1'
        },
        {
          id: uuidv4(),
          name: 'Sheet Number',
          tag: 'SHEET_NUM',
          value: 'A-1',
          position: { x: 0, y: -5 },
          style: { 
            strokeColor: '#000000', 
            strokeWidth: 1, 
            strokeStyle: 'solid',
            fontSize: 8,
            fontFamily: 'Arial',
            textAlign: 'center'
          },
          visible: true,
          editable: true,
          prompt: 'Enter sheet number:',
          defaultValue: 'A-1'
        }
      ],
      version: '1.0.0',
      createdDate: new Date(),
      modifiedDate: new Date(),
      isSystemBlock: true,
      isParametric: false
    };
  }

  // Add more creators for other block types...
  
  private createInductor(): BlockDefinition {
    // Simplified implementation - would include inductor coil symbol
    return this.createGenericBlock('Inductor', BlockCategory.ELECTRICAL, ['inductor', 'coil']);
  }

  private createTransistorPNP(): BlockDefinition {
    // Similar to NPN but with arrow pointing inward
    return this.createGenericBlock('PNP Transistor', BlockCategory.ELECTRONICS, ['transistor', 'pnp']);
  }

  private createDiode(): BlockDefinition {
    // Triangle with line symbol
    return this.createGenericBlock('Diode', BlockCategory.ELECTRONICS, ['diode', 'semiconductor']);
  }

  private createLED(): BlockDefinition {
    // Diode with arrows pointing outward
    return this.createGenericBlock('LED', BlockCategory.ELECTRONICS, ['led', 'diode', 'light']);
  }

  private createVCC(): BlockDefinition {
    // Power supply symbol
    return this.createGenericBlock('VCC', BlockCategory.ELECTRICAL, ['vcc', 'power', 'supply']);
  }

  private createWireJunction(): BlockDefinition {
    // Dot symbol for wire connections
    return this.createGenericBlock('Wire Junction', BlockCategory.ELECTRICAL, ['junction', 'connection']);
  }

  private createOpAmp(): BlockDefinition {
    // Operational amplifier triangle symbol
    return this.createGenericBlock('Op-Amp', BlockCategory.ELECTRONICS, ['opamp', 'amplifier']);
  }

  private createMicrocontroller(): BlockDefinition {
    // Rectangle with pins
    return this.createGenericBlock('Microcontroller', BlockCategory.ELECTRONICS, ['mcu', 'microcontroller']);
  }

  private createDoubleDoor(width: number): BlockDefinition {
    return this.createGenericBlock(`Double Door ${width}mm`, BlockCategory.ARCHITECTURAL, ['door', 'double']);
  }

  private createStraightStairs(steps: number, rise: number, run: number): BlockDefinition {
    return this.createGenericBlock(`Straight Stairs ${steps} steps`, BlockCategory.ARCHITECTURAL, ['stairs', 'straight']);
  }

  private createLShapedStairs(): BlockDefinition {
    return this.createGenericBlock('L-Shaped Stairs', BlockCategory.ARCHITECTURAL, ['stairs', 'l-shaped']);
  }

  private createToilet(): BlockDefinition {
    return this.createGenericBlock('Toilet', BlockCategory.ARCHITECTURAL, ['toilet', 'sanitary']);
  }

  private createSink(): BlockDefinition {
    return this.createGenericBlock('Sink', BlockCategory.ARCHITECTURAL, ['sink', 'sanitary']);
  }

  private createBathtub(): BlockDefinition {
    return this.createGenericBlock('Bathtub', BlockCategory.ARCHITECTURAL, ['bathtub', 'sanitary']);
  }

  private createTable(width: number, depth: number): BlockDefinition {
    return this.createGenericBlock(`Table ${width}x${depth}mm`, BlockCategory.FURNITURE, ['table', 'furniture']);
  }

  private createChair(): BlockDefinition {
    return this.createGenericBlock('Chair', BlockCategory.FURNITURE, ['chair', 'furniture']);
  }

  private createBed(width: number, length: number): BlockDefinition {
    return this.createGenericBlock(`Bed ${width}x${length}mm`, BlockCategory.FURNITURE, ['bed', 'furniture']);
  }

  private createScaleBar(): BlockDefinition {
    return this.createGenericBlock('Scale Bar', BlockCategory.SYMBOLS, ['scale', 'bar', 'measurement']);
  }

  private createDetailArrow(): BlockDefinition {
    return this.createGenericBlock('Detail Arrow', BlockCategory.ANNOTATIONS, ['detail', 'arrow']);
  }

  private createSectionArrow(): BlockDefinition {
    return this.createGenericBlock('Section Arrow', BlockCategory.ANNOTATIONS, ['section', 'arrow']);
  }

  private createSectionBubble(): BlockDefinition {
    return this.createGenericBlock('Section Bubble', BlockCategory.ANNOTATIONS, ['section', 'bubble']);
  }

  private createElevationMarker(): BlockDefinition {
    return this.createGenericBlock('Elevation Marker', BlockCategory.ANNOTATIONS, ['elevation', 'marker']);
  }

  private createRevisionCloud(): BlockDefinition {
    return this.createGenericBlock('Revision Cloud', BlockCategory.ANNOTATIONS, ['revision', 'cloud']);
  }

  private createRevisionTriangle(): BlockDefinition {
    return this.createGenericBlock('Revision Triangle', BlockCategory.ANNOTATIONS, ['revision', 'triangle']);
  }

  private createTitleBlockA4(): BlockDefinition {
    return this.createGenericBlock('Title Block A4', BlockCategory.ANNOTATIONS, ['title', 'block', 'a4']);
  }

  private createTitleBlockA3(): BlockDefinition {
    return this.createGenericBlock('Title Block A3', BlockCategory.ANNOTATIONS, ['title', 'block', 'a3']);
  }

  // Generic block creator for simplified implementations
  private createGenericBlock(name: string, category: BlockCategory, tags: string[]): BlockDefinition {
    const entities: DrawingEntity[] = [];
    const basePoint = { x: 0, y: 0 };

    // Create a simple placeholder rectangle
    entities.push({
      id: uuidv4(),
      type: 'rectangle',
      position: { x: -20, y: -10 },
      width: 40,
      height: 20,
      layer: 'default',
      visible: true,
      locked: false,
      style: { strokeColor: '#000000', strokeWidth: 1, strokeStyle: 'dashed', fillColor: 'none' }
    } as any);

    // Add name as text
    entities.push({
      id: uuidv4(),
      type: 'text-annotation',
      position: { x: 0, y: 0 },
      text: name,
      layer: 'default',
      visible: true,
      locked: false,
      style: { 
        strokeColor: '#000000', 
        strokeWidth: 1, 
        strokeStyle: 'solid',
        fontSize: 8,
        fontFamily: 'Arial',
        textAlign: 'center'
      }
    } as any);

    return {
      id: uuidv4(),
      name,
      description: `Standard ${name.toLowerCase()} symbol`,
      category,
      tags,
      basePoint,
      entities,
      boundingBox: {
        minX: -20,
        minY: -10,
        maxX: 20,
        maxY: 10
      },
      attributes: [],
      version: '1.0.0',
      createdDate: new Date(),
      modifiedDate: new Date(),
      isSystemBlock: true,
      isParametric: false
    };
  }
}

export default StandardBlockFactory;