// src/components/cad/technical-drawing/utils/import/DxfImporter.ts

import { 
  AnyEntity, 
  Point, 
  LineEntity, 
  CircleEntity, 
  RectangleEntity, 
  PolylineEntity,
  EllipseEntity,
  ArcEntity,
  TextAnnotation,
  DrawingLayer,
  LinearDimension,
  AngularDimension,
  RadialDimension,
  DrawingEntityType,
  DimensionType,
  AnnotationType,
  DrawingStyle
} from '../../TechnicalDrawingTypes';

export interface DxfImportOptions {
  scaleX?: number;
  scaleY?: number;
  offsetX?: number;
  offsetY?: number;
  mergeWithExisting?: boolean;
  createMissingLayers?: boolean;
  importInvisibleLayers?: boolean;
  importLockedLayers?: boolean;
  defaultLayerName?: string;
  units?: 'mm' | 'inches' | 'feet' | 'meters';
}

export interface DxfImportResult {
  success: boolean;
  entities: Record<string, AnyEntity>;
  layers: DrawingLayer[];
  errors: string[];
  warnings: string[];
  importedCount: number;
  skippedCount: number;
  processingTime: number;
}

interface DxfGroup {
  code: number;
  value: string | number;
}

interface DxfEntity {
  type: string;
  layer: string;
  color: number;
  lineType: string;
  data: Record<string, any>;
}

export class DxfImporter {
  private options: Required<DxfImportOptions>;
  private groups: DxfGroup[] = [];
  private entities: DxfEntity[] = [];
  private layers: Map<string, DrawingLayer> = new Map();
  private lineTypes: Map<string, string> = new Map();
  private textStyles: Map<string, any> = new Map();
  private errors: string[] = [];
  private warnings: string[] = [];

  constructor(options: DxfImportOptions = {}) {
    this.options = {
      scaleX: 1,
      scaleY: 1,
      offsetX: 0,
      offsetY: 0,
      mergeWithExisting: false,
      createMissingLayers: true,
      importInvisibleLayers: true,
      importLockedLayers: true,
      defaultLayerName: 'default',
      units: 'mm',
      ...options
    };

    // Initialize default layers and line types
    this.initializeDefaults();
  }

  /**
   * Import DXF content from string
   */
  async importFromString(dxfContent: string): Promise<DxfImportResult> {
    const startTime = Date.now();
    
    try {
      // Reset state
      this.reset();
      
      // Parse DXF content into groups
      this.parseGroups(dxfContent);
      
      // Process different sections
      this.processSections();
      
      // Convert DXF entities to our format
      const convertedEntities = this.convertEntities();
      
      const processingTime = Date.now() - startTime;
      
      return {
        success: this.errors.length === 0,
        entities: convertedEntities,
        layers: Array.from(this.layers.values()),
        errors: this.errors,
        warnings: this.warnings,
        importedCount: Object.keys(convertedEntities).length,
        skippedCount: this.entities.length - Object.keys(convertedEntities).length,
        processingTime
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.errors.push(`Critical import error: ${(error as Error).message}`);
      
      return {
        success: false,
        entities: {},
        layers: [],
        errors: this.errors,
        warnings: this.warnings,
        importedCount: 0,
        skippedCount: 0,
        processingTime
      };
    }
  }

  /**
   * Import DXF from file
   */
  async importFromFile(file: File): Promise<DxfImportResult> {
    try {
      const content = await this.readFileAsText(file);
      return this.importFromString(content);
    } catch (error) {
      this.errors.push(`File reading error: ${(error as Error).message}`);
      return {
        success: false,
        entities: {},
        layers: [],
        errors: this.errors,
        warnings: this.warnings,
        importedCount: 0,
        skippedCount: 0,
        processingTime: 0
      };
    }
  }

  /**
   * Reset internal state
   */
  private reset(): void {
    this.groups = [];
    this.entities = [];
    this.layers.clear();
    this.lineTypes.clear();
    this.textStyles.clear();
    this.errors = [];
    this.warnings = [];
    this.initializeDefaults();
  }

  /**
   * Initialize default layers and line types
   */
  private initializeDefaults(): void {
    // Default layer
    this.layers.set('0', {
      id: '0',
      name: '0',
      color: '#FFFFFF',
      visible: true,
      locked: false,
      order: 0,
      description: 'Default layer'
    });

    // Default line types
    this.lineTypes.set('CONTINUOUS', 'solid');
    this.lineTypes.set('DASHED', 'dashed');
    this.lineTypes.set('DOTTED', 'dotted');
    this.lineTypes.set('DASHDOT', 'dash-dot');
  }

  /**
   * Read file as text
   */
  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  /**
   * Parse DXF content into groups
   */
  private parseGroups(content: string): void {
    const lines = content.split(/\r?\n/).map(line => line.trim()).filter(line => line);
    
    for (let i = 0; i < lines.length - 1; i += 2) {
      const code = parseInt(lines[i]);
      const value = lines[i + 1];
      
      if (isNaN(code)) {
        this.warnings.push(`Invalid group code at line ${i + 1}: ${lines[i]}`);
        continue;
      }
      
      // Convert numeric values
      let parsedValue: string | number = value;
      if (code >= 10 && code <= 59) {
        // Floating point values
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
          parsedValue = numValue;
        }
      } else if (code >= 60 && code <= 79 || code >= 170 && code <= 179) {
        // Integer values
        const intValue = parseInt(value);
        if (!isNaN(intValue)) {
          parsedValue = intValue;
        }
      }
      
      this.groups.push({
        code,
        value: parsedValue
      });
    }
  }

  /**
   * Process different DXF sections
   */
  private processSections(): void {
    let currentSection = '';
    let currentEntity: DxfEntity | null = null;
    
    for (let i = 0; i < this.groups.length; i++) {
      const group = this.groups[i];
      
      if (group.code === 0) {
        const value = group.value as string;
        
        if (value === 'SECTION') {
          // Start of a new section
          const nextGroup = this.groups[i + 1];
          if (nextGroup && nextGroup.code === 2) {
            currentSection = nextGroup.value as string;
            i++; // Skip the section name group
          }
        } else if (value === 'ENDSEC') {
          // End of section
          currentSection = '';
        } else if (currentSection === 'ENTITIES' || currentSection === 'BLOCKS') {
          // Save previous entity if exists
          if (currentEntity) {
            this.entities.push(currentEntity);
          }
          
          // Start new entity
          currentEntity = {
            type: value,
            layer: '0',
            color: 7, // Default white
            lineType: 'CONTINUOUS',
            data: {}
          };
        } else if (currentSection === 'TABLES') {
          this.processTable(i);
        }
      } else if (currentEntity) {
        // Process entity data
        this.processEntityGroup(currentEntity, group);
      }
    }
    
    // Don't forget the last entity
    if (currentEntity) {
      this.entities.push(currentEntity);
    }
  }

  /**
   * Process table entries (layers, line types, etc.)
   */
  private processTable(startIndex: number): void {
    const tableType = this.groups[startIndex + 1]?.value as string;
    
    if (tableType === 'LAYER') {
      this.processLayerTable(startIndex);
    } else if (tableType === 'LTYPE') {
      this.processLineTypeTable(startIndex);
    } else if (tableType === 'STYLE') {
      this.processTextStyleTable(startIndex);
    }
  }

  /**
   * Process layer table
   */
  private processLayerTable(startIndex: number): void {
    // Find all layer entries
    for (let i = startIndex; i < this.groups.length; i++) {
      const group = this.groups[i];
      
      if (group.code === 0 && group.value === 'LAYER') {
        const layer = this.parseLayerEntry(i);
        if (layer) {
          this.layers.set(layer.name, layer);
        }
      } else if (group.code === 0 && group.value === 'ENDTAB') {
        break;
      }
    }
  }

  /**
   * Parse a single layer entry
   */
  private parseLayerEntry(startIndex: number): DrawingLayer | null {
    let name = '';
    let color = '#FFFFFF';
    let visible = true;
    let locked = false;
    
    for (let i = startIndex; i < this.groups.length; i++) {
      const group = this.groups[i];
      
      if (group.code === 0 && i > startIndex) {
        break; // Next entity
      }
      
      switch (group.code) {
        case 2:
          name = group.value as string;
          break;
        case 62:
          const colorNum = group.value as number;
          color = this.aciToHex(Math.abs(colorNum));
          visible = colorNum > 0; // Negative values indicate invisible layers
          break;
        case 70:
          const flags = group.value as number;
          locked = (flags & 4) !== 0; // Bit 2 = locked
          break;
      }
    }
    
    if (!name) return null;
    
    return {
      id: name,
      name,
      color,
      visible,
      locked,
      order: this.layers.size,
      description: `Imported layer: ${name}`
    };
  }

  /**
   * Process line type table
   */
  private processLineTypeTable(startIndex: number): void {
    // Similar to layer processing
    for (let i = startIndex; i < this.groups.length; i++) {
      const group = this.groups[i];
      
      if (group.code === 0 && group.value === 'LTYPE') {
        const lineType = this.parseLineTypeEntry(i);
        if (lineType) {
          this.lineTypes.set(lineType.name, lineType.pattern);
        }
      } else if (group.code === 0 && group.value === 'ENDTAB') {
        break;
      }
    }
  }

  /**
   * Parse line type entry
   */
  private parseLineTypeEntry(startIndex: number): { name: string; pattern: string } | null {
    let name = '';
    let pattern = 'solid';
    
    for (let i = startIndex; i < this.groups.length; i++) {
      const group = this.groups[i];
      
      if (group.code === 0 && i > startIndex) {
        break;
      }
      
      if (group.code === 2) {
        name = group.value as string;
        // Map common line type names to our patterns
        switch (name.toUpperCase()) {
          case 'DASHED':
          case 'DASH':
            pattern = 'dashed';
            break;
          case 'DOTTED':
          case 'DOT':
            pattern = 'dotted';
            break;
          case 'DASHDOT':
          case 'DASH-DOT':
            pattern = 'dash-dot';
            break;
          case 'CENTER':
            pattern = 'center';
            break;
          case 'HIDDEN':
            pattern = 'hidden';
            break;
          default:
            pattern = 'solid';
        }
      }
    }
    
    return name ? { name, pattern } : null;
  }

  /**
   * Process text style table
   */
  private processTextStyleTable(startIndex: number): void {
    // Implementation for text styles if needed
  }

  /**
   * Process entity group data
   */
  private processEntityGroup(entity: DxfEntity, group: DxfGroup): void {
    switch (group.code) {
      case 8:
        entity.layer = group.value as string;
        break;
      case 62:
        entity.color = group.value as number;
        break;
      case 6:
        entity.lineType = group.value as string;
        break;
      default:
        // Store coordinate and other data
        entity.data[group.code] = group.value;
        break;
    }
  }

  /**
   * Convert DXF entities to our format
   */
  private convertEntities(): Record<string, AnyEntity> {
    const convertedEntities: Record<string, AnyEntity> = {};
    let entityId = 1;
    
    for (const dxfEntity of this.entities) {
      try {
        const converted = this.convertEntity(dxfEntity);
        if (converted) {
          const id = `imported_${entityId++}`;
          convertedEntities[id] = { ...converted, id };
        }
      } catch (error) {
        this.errors.push(`Error converting entity ${dxfEntity.type}: ${(error as Error).message}`);
      }
    }
    
    return convertedEntities;
  }

  /**
   * Convert a single DXF entity
   */
  private convertEntity(dxfEntity: DxfEntity): Omit<AnyEntity, 'id'> | null {
    // Check if layer should be imported
    const layer = this.layers.get(dxfEntity.layer);
    if (layer && !this.options.importInvisibleLayers && !layer.visible) {
      return null;
    }
    if (layer && !this.options.importLockedLayers && layer.locked) {
      return null;
    }

    const style = this.createStyle(dxfEntity);
    const layerName = this.layers.has(dxfEntity.layer) ? 
      dxfEntity.layer : this.options.defaultLayerName;

    switch (dxfEntity.type.toUpperCase()) {
      case 'LINE':
        return this.convertLine(dxfEntity, style, layerName);
      case 'CIRCLE':
        return this.convertCircle(dxfEntity, style, layerName);
      case 'ARC':
        return this.convertArc(dxfEntity, style, layerName);
      case 'LWPOLYLINE':
      case 'POLYLINE':
        return this.convertPolyline(dxfEntity, style, layerName);
      case 'ELLIPSE':
        return this.convertEllipse(dxfEntity, style, layerName);
      case 'TEXT':
      case 'MTEXT':
        return this.convertText(dxfEntity, style, layerName);
      case 'DIMENSION':
        return this.convertDimension(dxfEntity, style, layerName);
      default:
        this.warnings.push(`Unsupported entity type: ${dxfEntity.type}`);
        return null;
    }
  }

  /**
   * Convert LINE entity
   */
  private convertLine(dxfEntity: DxfEntity, style: DrawingStyle, layer: string): LineEntity {
    return {
      type: DrawingEntityType.LINE,
      layer,
      visible: true,
      locked: false,
      style,
      startPoint: this.transformPoint({
        x: (dxfEntity.data[10] as number) || 0,
        y: (dxfEntity.data[20] as number) || 0
      }),
      endPoint: this.transformPoint({
        x: (dxfEntity.data[11] as number) || 0,
        y: (dxfEntity.data[21] as number) || 0
      })
    };
  }

  /**
   * Convert CIRCLE entity
   */
  private convertCircle(dxfEntity: DxfEntity, style: DrawingStyle, layer: string): CircleEntity {
    return {
      type: DrawingEntityType.CIRCLE,
      layer,
      visible: true,
      locked: false,
      style,
      center: this.transformPoint({
        x: (dxfEntity.data[10] as number) || 0,
        y: (dxfEntity.data[20] as number) || 0
      }),
      radius: ((dxfEntity.data[40] as number) || 1) * this.options.scaleX
    };
  }

  /**
   * Convert ARC entity
   */
  private convertArc(dxfEntity: DxfEntity, style: DrawingStyle, layer: string): ArcEntity {
    const startAngle = ((dxfEntity.data[50] as number) || 0) * Math.PI / 180;
    const endAngle = ((dxfEntity.data[51] as number) || 0) * Math.PI / 180;
    
    return {
      type: DrawingEntityType.ARC,
      layer,
      visible: true,
      locked: false,
      style,
      center: this.transformPoint({
        x: (dxfEntity.data[10] as number) || 0,
        y: (dxfEntity.data[20] as number) || 0
      }),
      radius: ((dxfEntity.data[40] as number) || 1) * this.options.scaleX,
      startAngle,
      endAngle,
      counterclockwise: false
    };
  }

  /**
   * Convert POLYLINE entity
   */
  private convertPolyline(dxfEntity: DxfEntity, style: DrawingStyle, layer: string): PolylineEntity {
    const points: Point[] = [];
    const vertexCount = (dxfEntity.data[90] as number) || 0;
    
    for (let i = 0; i < vertexCount; i++) {
      const x = (dxfEntity.data[`${10 + i * 2}`] as number) || 0;
      const y = (dxfEntity.data[`${20 + i * 2}`] as number) || 0;
      points.push(this.transformPoint({ x, y }));
    }
    
    const closed = ((dxfEntity.data[70] as number) || 0) & 1;
    
    return {
      type: DrawingEntityType.POLYLINE,
      layer,
      visible: true,
      locked: false,
      style,
      points,
      closed: Boolean(closed)
    };
  }

  /**
   * Convert ELLIPSE entity
   */
  private convertEllipse(dxfEntity: DxfEntity, style: DrawingStyle, layer: string): EllipseEntity {
    const majorAxisEndX = (dxfEntity.data[11] as number) || 1;
    const majorAxisEndY = (dxfEntity.data[21] as number) || 0;
    const ratio = (dxfEntity.data[40] as number) || 1;
    
    const radiusX = Math.sqrt(majorAxisEndX * majorAxisEndX + majorAxisEndY * majorAxisEndY) * this.options.scaleX;
    const radiusY = radiusX * ratio * this.options.scaleY;
    const rotation = Math.atan2(majorAxisEndY, majorAxisEndX) * 180 / Math.PI;
    
    return {
      type: DrawingEntityType.ELLIPSE,
      layer,
      visible: true,
      locked: false,
      style,
      center: this.transformPoint({
        x: (dxfEntity.data[10] as number) || 0,
        y: (dxfEntity.data[20] as number) || 0
      }),
      radiusX,
      radiusY,
      rotation
    };
  }

  /**
   * Convert TEXT entity
   */
  private convertText(dxfEntity: DxfEntity, style: DrawingStyle, layer: string): TextAnnotation {
    const height = ((dxfEntity.data[40] as number) || 2.5) * this.options.scaleY;
    const rotation = ((dxfEntity.data[50] as number) || 0) * Math.PI / 180;
    const text = (dxfEntity.data[1] as string) || '';
    
    return {
      type: AnnotationType.TEXT,
      layer,
      visible: true,
      locked: false,
      style: {
        ...style,
        fontSize: height,
        fontFamily: 'Arial'
      },
      position: this.transformPoint({
        x: (dxfEntity.data[10] as number) || 0,
        y: (dxfEntity.data[20] as number) || 0
      }),
      text,
      rotation: rotation * 180 / Math.PI
    };
  }

  /**
   * Convert DIMENSION entity
   */
  private convertDimension(dxfEntity: DxfEntity, style: DrawingStyle, layer: string): LinearDimension {
    // This is a simplified conversion - real DXF dimensions are complex
    const start = this.transformPoint({
      x: (dxfEntity.data[13] as number) || 0,
      y: (dxfEntity.data[23] as number) || 0
    });
    const end = this.transformPoint({
      x: (dxfEntity.data[14] as number) || 0,
      y: (dxfEntity.data[24] as number) || 0
    });
    const text = (dxfEntity.data[1] as string) || '';
    
    return {
      type: DimensionType.LINEAR,
      layer,
      visible: true,
      locked: false,
      style,
      startPoint: start,
      endPoint: end,
      offsetDistance: 15,
      text,
      extensionDistance: 10
    };
  }

  /**
   * Create style from DXF entity
   */
  private createStyle(dxfEntity: DxfEntity): DrawingStyle {
    const color = this.aciToHex(Math.abs(dxfEntity.color));
    const lineType = this.lineTypes.get(dxfEntity.lineType) || 'solid';
    
    return {
      strokeColor: color,
      strokeWidth: 1,
      strokeStyle: lineType as any,
      fillColor: 'none'
    };
  }

  /**
   * Transform point coordinates
   */
  private transformPoint(point: Point): Point {
    return {
      x: point.x * this.options.scaleX + this.options.offsetX,
      y: point.y * this.options.scaleY + this.options.offsetY
    };
  }

  /**
   * Convert AutoCAD Color Index to hex color
   */
  private aciToHex(aci: number): string {
    const colorTable: Record<number, string> = {
      1: '#FF0000',   // Red
      2: '#FFFF00',   // Yellow
      3: '#00FF00',   // Green
      4: '#00FFFF',   // Cyan
      5: '#0000FF',   // Blue
      6: '#FF00FF',   // Magenta
      7: '#FFFFFF',   // White
      8: '#808080',   // Gray
      9: '#C0C0C0'    // Light Gray
    };

    return colorTable[aci] || '#000000';
  }
}

export default DxfImporter;
