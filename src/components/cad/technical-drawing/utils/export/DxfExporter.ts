// src/components/cad/technical-drawing/utils/export/DxfExporter.ts

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
  DrawingSheet,
  LinearDimension,
  AngularDimension,
  RadialDimension
} from '../../TechnicalDrawingTypes';

export interface DxfExportOptions {
  units?: 'mm' | 'inches' | 'feet' | 'meters';
  precision?: number;
  includeLayer0?: boolean;
  version?: 'R12' | 'R14' | 'R2000' | 'R2004' | 'R2007' | 'R2010';
}

export class DxfExporter {
  private entities: Record<string, AnyEntity> = {};
  private layers: DrawingLayer[] = [];
  private sheet: DrawingSheet | null = null;
  private options: DxfExportOptions;
  private handleCounter: number = 1;

  constructor(options: DxfExportOptions = {}) {
    this.options = {
      units: 'mm',
      precision: 6,
      includeLayer0: true,
      version: 'R2000',
      ...options
    };
  }

  /**
   * Set the data to export
   */
  setData(
    entities: Record<string, AnyEntity>,
    layers: DrawingLayer[],
    sheet?: DrawingSheet
  ): void {
    this.entities = entities;
    this.layers = layers;
    this.sheet = sheet || null;
    this.handleCounter = 1;
  }

  /**
   * Export to DXF string
   */
  export(): string {
    let dxf = '';
    
    // Header Section
    dxf += this.createHeader();
    
    // Tables Section (Layers, Linetypes, Text Styles, etc.)
    dxf += this.createTables();
    
    // Blocks Section
    dxf += this.createBlocks();
    
    // Entities Section
    dxf += this.createEntities();
    
    // End of File
    dxf += '0\nEOF\n';
    
    return dxf;
  }

  /**
   * Create DXF header section
   */
  private createHeader(): string {
    const units = this.getUnitsCode();
    
    return `0
SECTION
2
HEADER
9
$ACADVER
1
AC1015
9
$DWGCODEPAGE
3
ANSI_1252
9
$INSBASE
10
0.0
20
0.0
30
0.0
9
$EXTMIN
10
0.0
20
0.0
30
0.0
9
$EXTMAX
10
${this.sheet?.width || 210.0}
20
${this.sheet?.height || 297.0}
30
0.0
9
$LUNITS
70
${units}
9
$LUPREC
70
${this.options.precision}
9
$AUNITS
70
0
9
$AUPREC
70
2
0
ENDSEC
`;
  }

  /**
   * Create DXF tables section
   */
  private createTables(): string {
    let tables = `0
SECTION
2
TABLES
`;

    // Line Types Table
    tables += this.createLineTypesTable();
    
    // Layers Table
    tables += this.createLayersTable();
    
    // Text Styles Table
    tables += this.createTextStylesTable();
    
    tables += `0
ENDSEC
`;

    return tables;
  }

  /**
   * Create line types table
   */
  private createLineTypesTable(): string {
    return `0
TABLE
2
LTYPE
5
5
330
0
100
AcDbSymbolTable
70
4
0
LTYPE
5
14
330
5
100
AcDbSymbolTableRecord
100
AcDbLinetypeTableRecord
2
BYBLOCK
70
0
3

72
65
73
0
40
0.0
0
LTYPE
5
15
330
5
100
AcDbSymbolTableRecord
100
AcDbLinetypeTableRecord
2
BYLAYER
70
0
3

72
65
73
0
40
0.0
0
LTYPE
5
16
330
5
100
AcDbSymbolTableRecord
100
AcDbLinetypeTableRecord
2
CONTINUOUS
70
0
3
Solid line
72
65
73
0
40
0.0
0
LTYPE
5
17
330
5
100
AcDbSymbolTableRecord
100
AcDbLinetypeTableRecord
2
DASHED
70
0
3
Dashed line
72
65
73
2
40
12.7
49
6.35
74
0
49
-6.35
74
0
0
ENDTAB
`;
  }

  /**
   * Create layers table
   */
  private createLayersTable(): string {
    let layersTable = `0
TABLE
2
LAYER
5
2
330
0
100
AcDbSymbolTable
70
${this.layers.length + (this.options.includeLayer0 ? 1 : 0)}
`;

    // Default Layer 0
    if (this.options.includeLayer0) {
      layersTable += `0
LAYER
5
10
330
2
100
AcDbSymbolTableRecord
100
AcDbLayerTableRecord
2
0
70
0
62
7
6
CONTINUOUS
370
0
390
F
`;
    }

    // Custom layers
    this.layers.forEach((layer, index) => {
      const handle = (20 + index).toString(16).toUpperCase();
      const colorNumber = this.convertColorToAci(layer.color);
      
      layersTable += `0
LAYER
5
${handle}
330
2
100
AcDbSymbolTableRecord
100
AcDbLayerTableRecord
2
${layer.name}
70
${layer.locked ? 4 : 0}
62
${layer.visible ? colorNumber : -colorNumber}
6
CONTINUOUS
370
0
390
F
`;
    });

    layersTable += `0
ENDTAB
`;

    return layersTable;
  }

  /**
   * Create text styles table
   */
  private createTextStylesTable(): string {
    return `0
TABLE
2
STYLE
5
3
330
0
100
AcDbSymbolTable
70
2
0
STYLE
5
11
330
3
100
AcDbSymbolTableRecord
100
AcDbTextStyleTableRecord
2
STANDARD
70
0
40
0.0
41
1.0
50
0.0
71
0
42
2.5
3
txt
4

0
STYLE
5
12
330
3
100
AcDbSymbolTableRecord
100
AcDbTextStyleTableRecord
2
ANNOTATIVE
70
0
40
0.0
41
1.0
50
0.0
71
0
42
2.5
3
arial.ttf
4

0
ENDTAB
`;
  }

  /**
   * Create blocks section
   */
  private createBlocks(): string {
    return `0
SECTION
2
BLOCKS
0
ENDSEC
`;
  }

  /**
   * Create entities section
   */
  private createEntities(): string {
    let entitiesSection = `0
SECTION
2
ENTITIES
`;

    // Sort entities by layer order
    const sortedLayers = this.layers
      .filter(layer => layer.visible)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    for (const layer of sortedLayers) {
      const layerEntities = Object.values(this.entities).filter(
        entity => entity.layer === layer.name && entity.visible
      );

      layerEntities.forEach(entity => {
        entitiesSection += this.entityToDxf(entity);
      });
    }

    entitiesSection += `0
ENDSEC
`;

    return entitiesSection;
  }

  /**
   * Convert entity to DXF format
   */
  private entityToDxf(entity: AnyEntity): string {
    switch (entity.type) {
      case 'line':
        return this.lineToDxf(entity as LineEntity);
      case 'circle':
        return this.circleToDxf(entity as CircleEntity);
      case 'rectangle':
        return this.rectangleToDxf(entity as RectangleEntity);
      case 'polyline':
        return this.polylineToDxf(entity as PolylineEntity);
      case 'ellipse':
        return this.ellipseToDxf(entity as EllipseEntity);
      case 'arc':
        return this.arcToDxf(entity as ArcEntity);
      case 'text-annotation':
        return this.textToDxf(entity as TextAnnotation);
      case 'linear-dimension':
        return this.linearDimensionToDxf(entity as LinearDimension);
      case 'angular-dimension':
        return this.angularDimensionToDxf(entity as AngularDimension);
      case 'radial-dimension':
        return this.radialDimensionToDxf(entity as RadialDimension);
      default:
        return '';
    }
  }

  /**
   * Convert line to DXF
   */
  private lineToDxf(line: LineEntity): string {
    const handle = (this.handleCounter++).toString(16).toUpperCase();
    const colorNumber = this.convertColorToAci(line.style.strokeColor || '#000000');
    
    return `0
LINE
5
${handle}
330
1F
100
AcDbEntity
8
${line.layer}
62
${colorNumber}
100
AcDbLine
10
${this.formatNumber(line.startPoint.x)}
20
${this.formatNumber(line.startPoint.y)}
30
0.0
11
${this.formatNumber(line.endPoint.x)}
21
${this.formatNumber(line.endPoint.y)}
31
0.0
`;
  }

  /**
   * Convert circle to DXF
   */
  private circleToDxf(circle: CircleEntity): string {
    const handle = (this.handleCounter++).toString(16).toUpperCase();
    const colorNumber = this.convertColorToAci(circle.style.strokeColor || '#000000');
    
    return `0
CIRCLE
5
${handle}
330
1F
100
AcDbEntity
8
${circle.layer}
62
${colorNumber}
100
AcDbCircle
10
${this.formatNumber(circle.center.x)}
20
${this.formatNumber(circle.center.y)}
30
0.0
40
${this.formatNumber(circle.radius)}
`;
  }

  /**
   * Convert rectangle to DXF (as LWPOLYLINE)
   */
  private rectangleToDxf(rect: RectangleEntity): string {
    const handle = (this.handleCounter++).toString(16).toUpperCase();
    const colorNumber = this.convertColorToAci(rect.style.strokeColor || '#000000');
    
    // Rectangle vertices
    const vertices = [
      { x: rect.position.x, y: rect.position.y },
      { x: rect.position.x + rect.width, y: rect.position.y },
      { x: rect.position.x + rect.width, y: rect.position.y + rect.height },
      { x: rect.position.x, y: rect.position.y + rect.height }
    ];

    let dxf = `0
LWPOLYLINE
5
${handle}
330
1F
100
AcDbEntity
8
${rect.layer}
62
${colorNumber}
100
AcDbPolyline
90
4
70
1
`;

    vertices.forEach(vertex => {
      dxf += `10
${this.formatNumber(vertex.x)}
20
${this.formatNumber(vertex.y)}
`;
    });

    return dxf;
  }

  /**
   * Convert polyline to DXF
   */
  private polylineToDxf(polyline: PolylineEntity): string {
    const handle = (this.handleCounter++).toString(16).toUpperCase();
    const colorNumber = this.convertColorToAci(polyline.style.strokeColor || '#000000');
    
    let dxf = `0
LWPOLYLINE
5
${handle}
330
1F
100
AcDbEntity
8
${polyline.layer}
62
${colorNumber}
100
AcDbPolyline
90
${polyline.points.length}
70
${polyline.closed ? 1 : 0}
`;

    polyline.points.forEach(point => {
      dxf += `10
${this.formatNumber(point.x)}
20
${this.formatNumber(point.y)}
`;
    });

    return dxf;
  }

  /**
   * Convert ellipse to DXF
   */
  private ellipseToDxf(ellipse: EllipseEntity): string {
    const handle = (this.handleCounter++).toString(16).toUpperCase();
    const colorNumber = this.convertColorToAci(ellipse.style.strokeColor || '#000000');
    
    // Calculate major axis endpoint
    const rotation = (ellipse.rotation || 0) * Math.PI / 180;
    const majorAxisEndX = ellipse.radiusX * Math.cos(rotation);
    const majorAxisEndY = ellipse.radiusX * Math.sin(rotation);
    const ratio = ellipse.radiusY / ellipse.radiusX;
    
    return `0
ELLIPSE
5
${handle}
330
1F
100
AcDbEntity
8
${ellipse.layer}
62
${colorNumber}
100
AcDbEllipse
10
${this.formatNumber(ellipse.center.x)}
20
${this.formatNumber(ellipse.center.y)}
30
0.0
11
${this.formatNumber(majorAxisEndX)}
21
${this.formatNumber(majorAxisEndY)}
31
0.0
210
0.0
220
0.0
230
1.0
40
${this.formatNumber(ratio)}
41
0.0
42
${this.formatNumber(2 * Math.PI)}
`;
  }

  /**
   * Convert arc to DXF
   */
  private arcToDxf(arc: ArcEntity): string {
    const handle = (this.handleCounter++).toString(16).toUpperCase();
    const colorNumber = this.convertColorToAci(arc.style.strokeColor || '#000000');
    
    // Convert radians to degrees
    const startAngleDeg = arc.startAngle * 180 / Math.PI;
    const endAngleDeg = arc.endAngle * 180 / Math.PI;
    
    return `0
ARC
5
${handle}
330
1F
100
AcDbEntity
8
${arc.layer}
62
${colorNumber}
100
AcDbCircle
10
${this.formatNumber(arc.center.x)}
20
${this.formatNumber(arc.center.y)}
30
0.0
40
${this.formatNumber(arc.radius)}
100
AcDbArc
50
${this.formatNumber(startAngleDeg)}
51
${this.formatNumber(endAngleDeg)}
`;
  }

  /**
   * Convert text annotation to DXF
   */
  private textToDxf(text: TextAnnotation): string {
    const handle = (this.handleCounter++).toString(16).toUpperCase();
    const colorNumber = this.convertColorToAci(text.style.strokeColor || '#000000');
    const height = text.style.fontSize || 2.5;
    const rotation = (text.rotation || 0) * Math.PI / 180;
    
    return `0
TEXT
5
${handle}
330
1F
100
AcDbEntity
8
${text.layer}
62
${colorNumber}
100
AcDbText
10
${this.formatNumber(text.position.x)}
20
${this.formatNumber(text.position.y)}
30
0.0
40
${this.formatNumber(height)}
1
${text.text}
50
${this.formatNumber(rotation * 180 / Math.PI)}
71
0
72
${this.getTextAlignment(text.style.textAlign)}
11
${this.formatNumber(text.position.x)}
21
${this.formatNumber(text.position.y)}
31
0.0
100
AcDbText
`;
  }

  /**
   * Convert linear dimension to DXF
   */
  private linearDimensionToDxf(dim: LinearDimension): string {
    const handle = (this.handleCounter++).toString(16).toUpperCase();
    const colorNumber = this.convertColorToAci(dim.style.strokeColor || '#000000');
    
    // Calculate dimension line points
    const dx = dim.endPoint.x - dim.startPoint.x;
    const dy = dim.endPoint.y - dim.startPoint.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    
    // Perpendicular direction for offset
    const perpX = -Math.sin(angle);
    const perpY = Math.cos(angle);
    
    const dimLineStartX = dim.startPoint.x + perpX * dim.offsetDistance;
    const dimLineStartY = dim.startPoint.y + perpY * dim.offsetDistance;
    const dimLineEndX = dim.endPoint.x + perpX * dim.offsetDistance;
    const dimLineEndY = dim.endPoint.y + perpY * dim.offsetDistance;
    
    return `0
DIMENSION
5
${handle}
330
1F
100
AcDbEntity
8
${dim.layer}
62
${colorNumber}
100
AcDbDimension
2
*D${handle}
10
${this.formatNumber((dimLineStartX + dimLineEndX) / 2)}
20
${this.formatNumber((dimLineStartY + dimLineEndY) / 2)}
30
0.0
11
${this.formatNumber((dimLineStartX + dimLineEndX) / 2)}
21
${this.formatNumber((dimLineStartY + dimLineEndY) / 2)}
31
0.0
70
32
1
${dim.text || length.toFixed(this.options.precision || 2)}
71
1
72
1
3
STANDARD
100
AcDbAlignedDimension
13
${this.formatNumber(dim.startPoint.x)}
23
${this.formatNumber(dim.startPoint.y)}
33
0.0
14
${this.formatNumber(dim.endPoint.x)}
24
${this.formatNumber(dim.endPoint.y)}
34
0.0
`;
  }

  /**
   * Convert angular dimension to DXF
   */
  private angularDimensionToDxf(dim: AngularDimension): string {
    const handle = (this.handleCounter++).toString(16).toUpperCase();
    const colorNumber = this.convertColorToAci(dim.style.strokeColor || '#000000');
    
    const angle1 = Math.atan2(dim.startPoint.y - dim.vertex.y, dim.startPoint.x - dim.vertex.x);
    const angle2 = Math.atan2(dim.endPoint.y - dim.vertex.y, dim.endPoint.x - dim.vertex.x);
    let angleDiff = angle2 - angle1;
    if (angleDiff < 0) angleDiff += 2 * Math.PI;
    
    const radius = dim.radius || 50;
    const midAngle = angle1 + angleDiff / 2;
    const textX = dim.vertex.x + radius * Math.cos(midAngle);
    const textY = dim.vertex.y + radius * Math.sin(midAngle);
    
    return `0
DIMENSION
5
${handle}
330
1F
100
AcDbEntity
8
${dim.layer}
62
${colorNumber}
100
AcDbDimension
2
*D${handle}
10
${this.formatNumber(textX)}
20
${this.formatNumber(textY)}
30
0.0
11
${this.formatNumber(textX)}
21
${this.formatNumber(textY)}
31
0.0
70
2
1
${dim.text || (angleDiff * 180 / Math.PI).toFixed(1) + '°'}
71
1
72
1
3
STANDARD
100
AcDb2LineAngularDimension
13
${this.formatNumber(dim.startPoint.x)}
23
${this.formatNumber(dim.startPoint.y)}
33
0.0
14
${this.formatNumber(dim.endPoint.x)}
24
${this.formatNumber(dim.endPoint.y)}
34
0.0
15
${this.formatNumber(dim.vertex.x)}
25
${this.formatNumber(dim.vertex.y)}
35
0.0
16
${this.formatNumber(dim.vertex.x)}
26
${this.formatNumber(dim.vertex.y)}
36
0.0
`;
  }

  /**
   * Convert radial dimension to DXF
   */
  private radialDimensionToDxf(dim: RadialDimension): string {
    const handle = (this.handleCounter++).toString(16).toUpperCase();
    const colorNumber = this.convertColorToAci(dim.style.strokeColor || '#000000');
    
    const dx = dim.pointOnCircle.x - dim.center.x;
    const dy = dim.pointOnCircle.y - dim.center.y;
    const radius = Math.sqrt(dx * dx + dy * dy);
    
    return `0
DIMENSION
5
${handle}
330
1F
100
AcDbEntity
8
${dim.layer}
62
${colorNumber}
100
AcDbDimension
2
*D${handle}
10
${this.formatNumber(dim.center.x)}
20
${this.formatNumber(dim.center.y)}
30
0.0
11
${this.formatNumber(dim.pointOnCircle.x)}
21
${this.formatNumber(dim.pointOnCircle.y)}
31
0.0
70
4
1
${dim.text || 'R' + radius.toFixed(this.options.precision || 2)}
71
1
72
1
3
STANDARD
100
AcDbRadialDimension
15
${this.formatNumber(dim.pointOnCircle.x)}
25
${this.formatNumber(dim.pointOnCircle.y)}
35
0.0
40
${this.formatNumber(radius)}
`;
  }

  /**
   * Get AutoCAD units code
   */
  private getUnitsCode(): number {
    switch (this.options.units) {
      case 'inches': return 1;
      case 'feet': return 2;
      case 'mm': return 4;
      case 'meters': return 6;
      default: return 4; // mm
    }
  }

  /**
   * Convert hex color to AutoCAD Color Index (ACI)
   */
  private convertColorToAci(hexColor: string): number {
    // Simple mapping - in a real implementation you'd want a more comprehensive color table
    const colorMap: Record<string, number> = {
      '#FF0000': 1,   // Red
      '#FFFF00': 2,   // Yellow
      '#00FF00': 3,   // Green
      '#00FFFF': 4,   // Cyan
      '#0000FF': 5,   // Blue
      '#FF00FF': 6,   // Magenta
      '#FFFFFF': 7,   // White
      '#000000': 7,   // Black (treated as white)
      '#808080': 8,   // Gray
      '#C0C0C0': 9    // Light Gray
    };

    return colorMap[hexColor.toUpperCase()] || 7; // Default to white
  }

  /**
   * Get text alignment code for DXF
   */
  private getTextAlignment(align?: string): number {
    switch (align) {
      case 'left': return 0;
      case 'center': return 1;
      case 'right': return 2;
      default: return 0;
    }
  }

  /**
   * Format number with specified precision
   */
  private formatNumber(num: number): string {
    return num.toFixed(this.options.precision || 6);
  }
}

export default DxfExporter;
