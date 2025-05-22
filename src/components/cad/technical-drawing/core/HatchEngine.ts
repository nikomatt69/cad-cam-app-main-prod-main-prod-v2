import { Point, DrawingStyle } from '../TechnicalDrawingTypes';

// Tipi per i pattern hatch
export interface HatchPattern {
  id: string;
  name: string;
  description?: string;
  type: 'predefined' | 'user' | 'solid' | 'gradient';
  lines: HatchLine[];
  angle?: number;
  scale?: number;
  spacing?: number;
}

export interface HatchLine {
  angle: number;
  basePoint: Point;
  offset: Point;
  dashLengths: number[];
}

export interface HatchBoundary {
  type: 'polyline' | 'circle' | 'rectangle' | 'spline';
  points?: Point[];
  center?: Point;
  radius?: number;
  width?: number;
  height?: number;
  closed: boolean;
}

export interface HatchDefinition {
  id: string;
  boundaries: HatchBoundary[];
  pattern: HatchPattern;
  style: DrawingStyle;
  associative: boolean; // Se true, si aggiorna quando cambiano i boundary
  scale: number;
  angle: number;
  origin: Point;
}

// Pattern predefiniti standard
export const PREDEFINED_PATTERNS: Record<string, HatchPattern> = {
  ANSI31: {
    id: 'ANSI31',
    name: 'ANSI31',
    description: 'Iron, Brick, Stone masonry',
    type: 'predefined',
    lines: [
      {
        angle: 45,
        basePoint: { x: 0, y: 0 },
        offset: { x: 0, y: 0.125 },
        dashLengths: []
      }
    ]
  },
  ANSI32: {
    id: 'ANSI32',
    name: 'ANSI32', 
    description: 'Steel',
    type: 'predefined',
    lines: [
      {
        angle: 45,
        basePoint: { x: 0, y: 0 },
        offset: { x: 0, y: 0.125 },
        dashLengths: []
      },
      {
        angle: 135,
        basePoint: { x: 0, y: 0 },
        offset: { x: 0, y: 0.125 },
        dashLengths: []
      }
    ]
  },
  ANSI33: {
    id: 'ANSI33',
    name: 'ANSI33',
    description: 'Bronze, Brass, Copper',
    type: 'predefined',
    lines: [
      {
        angle: 45,
        basePoint: { x: 0, y: 0 },
        offset: { x: 0, y: 0.125 },
        dashLengths: []
      },
      {
        angle: 135,
        basePoint: { x: 0, y: 0.0625 },
        offset: { x: 0, y: 0.125 },
        dashLengths: []
      }
    ]
  },
  ANSI34: {
    id: 'ANSI34',
    name: 'ANSI34',
    description: 'Plastic, Rubber',
    type: 'predefined',
    lines: [
      {
        angle: 45,
        basePoint: { x: 0, y: 0 },
        offset: { x: 0, y: 0.125 },
        dashLengths: []
      },
      {
        angle: 135,
        basePoint: { x: 0, y: 0 },
        offset: { x: 0, y: 0.125 },
        dashLengths: []
      },
      {
        angle: 0,
        basePoint: { x: 0, y: 0 },
        offset: { x: 0, y: 0.25 },
        dashLengths: []
      }
    ]
  },
  ANSI35: {
    id: 'ANSI35',
    name: 'ANSI35',
    description: 'Fire brick, Refractory material',
    type: 'predefined',
    lines: [
      {
        angle: 45,
        basePoint: { x: 0, y: 0 },
        offset: { x: 0, y: 0.125 },
        dashLengths: []
      },
      {
        angle: 135,
        basePoint: { x: 0, y: 0.0625 },
        offset: { x: 0, y: 0.25 },
        dashLengths: []
      }
    ]
  },
  ANSI36: {
    id: 'ANSI36',
    name: 'ANSI36',
    description: 'Marble, Slate, Glass',
    type: 'predefined',
    lines: [
      {
        angle: 45,
        basePoint: { x: 0, y: 0 },
        offset: { x: 0, y: 0.125 },
        dashLengths: [0.125, 0.0625]
      }
    ]
  },
  ANSI37: {
    id: 'ANSI37',
    name: 'ANSI37',
    description: 'Lead, Zinc, Magnesium',
    type: 'predefined',
    lines: [
      {
        angle: 45,
        basePoint: { x: 0, y: 0 },
        offset: { x: 0, y: 0.125 },
        dashLengths: []
      },
      {
        angle: 135,
        basePoint: { x: 0, y: 0 },
        offset: { x: 0, y: 0.125 },
        dashLengths: []
      },
      {
        angle: 0,
        basePoint: { x: 0, y: 0.125 },
        offset: { x: 0, y: 0.25 },
        dashLengths: []
      }
    ]
  },
  ANSI38: {
    id: 'ANSI38',
    name: 'ANSI38',
    description: 'Aluminum',
    type: 'predefined',
    lines: [
      {
        angle: 45,
        basePoint: { x: 0, y: 0 },
        offset: { x: 0, y: 0.125 },
        dashLengths: []
      },
      {
        angle: 135,
        basePoint: { x: 0, y: 0 },
        offset: { x: 0, y: 0.375 },
        dashLengths: []
      }
    ]
  },
  BRICK: {
    id: 'BRICK',
    name: 'BRICK',
    description: 'Brick pattern',
    type: 'predefined',
    lines: [
      {
        angle: 0,
        basePoint: { x: 0, y: 0 },
        offset: { x: 0, y: 0.25 },
        dashLengths: []
      },
      {
        angle: 0,
        basePoint: { x: 0.125, y: 0.125 },
        offset: { x: 0, y: 0.25 },
        dashLengths: []
      },
      {
        angle: 90,
        basePoint: { x: 0, y: 0 },
        offset: { x: 0.25, y: 0 },
        dashLengths: [0.125, 0.125]
      }
    ]
  },
  DOTS: {
    id: 'DOTS',
    name: 'DOTS',
    description: 'Dots pattern',
    type: 'predefined',
    lines: [
      {
        angle: 0,
        basePoint: { x: 0, y: 0 },
        offset: { x: 0.125, y: 0.125 },
        dashLengths: [0, 0.125]
      }
    ]
  }
};

export class HatchEngine {
  private patterns: Map<string, HatchPattern> = new Map();

  constructor() {
    // Carica i pattern predefiniti
    Object.values(PREDEFINED_PATTERNS).forEach(pattern => {
      this.patterns.set(pattern.id, pattern);
    });
  }

  /**
   * Aggiunge un pattern personalizzato
   */
  addPattern(pattern: HatchPattern): void {
    this.patterns.set(pattern.id, pattern);
  }

  /**
   * Ottiene un pattern per ID
   */
  getPattern(id: string): HatchPattern | undefined {
    return this.patterns.get(id);
  }

  /**
   * Ottiene tutti i pattern disponibili
   */
  getAllPatterns(): HatchPattern[] {
    return Array.from(this.patterns.values());
  }

  /**
   * Genera le linee di hatch per un boundary dato
   */
  generateHatchLines(
    boundaries: HatchBoundary[],
    pattern: HatchPattern,
    scale: number = 1,
    angle: number = 0,
    origin: Point = { x: 0, y: 0 }
  ): Point[][] {
    const allLines: Point[][] = [];

    // Calcola il bounding box di tutti i boundaries
    const boundingBox = this.calculateBoundingBox(boundaries);
    if (!boundingBox) return allLines;

    // Espande il bounding box per assicurarsi di coprire tutto
    const expandedBox = {
      minX: boundingBox.minX - scale * 2,
      minY: boundingBox.minY - scale * 2,
      maxX: boundingBox.maxX + scale * 2,
      maxY: boundingBox.maxY + scale * 2
    };

    // Per ogni linea del pattern
    pattern.lines.forEach(patternLine => {
      const adjustedAngle = patternLine.angle + angle;
      const lines = this.generatePatternLines(
        patternLine,
        expandedBox,
        scale,
        adjustedAngle,
        origin
      );

      // Taglia le linee sui boundaries
      lines.forEach(line => {
        const clippedSegments = this.clipLineToboundaries(line, boundaries);
        allLines.push(...clippedSegments);
      });
    });

    return allLines;
  }

  /**
   * Genera le linee per un singolo pattern
   */
  private generatePatternLines(
    patternLine: HatchLine,
    boundingBox: { minX: number; minY: number; maxX: number; maxY: number },
    scale: number,
    angle: number,
    origin: Point
  ): Point[][] {
    const lines: Point[][] = [];
    
    const cos = Math.cos(angle * Math.PI / 180);
    const sin = Math.sin(angle * Math.PI / 180);
    
    // Calcola la direzione e l'offset
    const direction = { x: cos, y: sin };
    const perpendicular = { x: -sin, y: cos };
    
    const scaledOffset = {
      x: patternLine.offset.x * scale,
      y: patternLine.offset.y * scale
    };
    
    // Calcola quante linee servono
    const maxDimension = Math.max(
      boundingBox.maxX - boundingBox.minX,
      boundingBox.maxY - boundingBox.minY
    );
    
    const offsetLength = Math.sqrt(scaledOffset.x * scaledOffset.x + scaledOffset.y * scaledOffset.y);
    const numLines = Math.ceil(maxDimension * 2 / offsetLength) + 10;
    
    // Genera le linee
    for (let i = -numLines; i <= numLines; i++) {
      const lineStart = {
        x: origin.x + patternLine.basePoint.x * scale + scaledOffset.x * i,
        y: origin.y + patternLine.basePoint.y * scale + scaledOffset.y * i
      };
      
      // Trasforma in base all'angolo
      const transformedStart = {
        x: lineStart.x * cos - lineStart.y * sin + origin.x,
        y: lineStart.x * sin + lineStart.y * cos + origin.y
      };
      
      // Crea una linea molto lunga che attraversa tutto il bounding box
      const lineLength = maxDimension * 3;
      const lineEnd = {
        x: transformedStart.x + direction.x * lineLength,
        y: transformedStart.y + direction.y * lineLength
      };
      
      const lineStartExtended = {
        x: transformedStart.x - direction.x * lineLength,
        y: transformedStart.y - direction.y * lineLength
      };
      
      // Se il pattern ha dash lengths, crea linee tratteggiate
      if (patternLine.dashLengths.length > 0) {
        const dashedLines = this.createDashedLine(
          lineStartExtended,
          lineEnd,
          patternLine.dashLengths.map(d => d * scale)
        );
        lines.push(...dashedLines);
      } else {
        lines.push([lineStartExtended, lineEnd]);
      }
    }
    
    return lines;
  }

  /**
   * Crea linee tratteggiate
   */
  private createDashedLine(start: Point, end: Point, dashLengths: number[]): Point[][] {
    const lines: Point[][] = [];
    
    const totalLength = Math.sqrt(
      Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
    );
    
    const direction = {
      x: (end.x - start.x) / totalLength,
      y: (end.y - start.y) / totalLength
    };
    
    let currentDistance = 0;
    let dashIndex = 0;
    let isDrawing = true;
    
    while (currentDistance < totalLength) {
      const dashLength = dashLengths[dashIndex % dashLengths.length];
      const segmentStart = {
        x: start.x + direction.x * currentDistance,
        y: start.y + direction.y * currentDistance
      };
      
      const nextDistance = Math.min(currentDistance + dashLength, totalLength);
      const segmentEnd = {
        x: start.x + direction.x * nextDistance,
        y: start.y + direction.y * nextDistance
      };
      
      if (isDrawing && dashLength > 0) {
        lines.push([segmentStart, segmentEnd]);
      }
      
      currentDistance = nextDistance;
      dashIndex++;
      isDrawing = !isDrawing;
    }
    
    return lines;
  }

  /**
   * Calcola il bounding box dei boundaries
   */
  private calculateBoundingBox(boundaries: HatchBoundary[]): 
    { minX: number; minY: number; maxX: number; maxY: number } | null {
    
    if (boundaries.length === 0) return null;
    
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    
    boundaries.forEach(boundary => {
      if (boundary.type === 'polyline' && boundary.points) {
        boundary.points.forEach(point => {
          minX = Math.min(minX, point.x);
          minY = Math.min(minY, point.y);
          maxX = Math.max(maxX, point.x);
          maxY = Math.max(maxY, point.y);
        });
      } else if (boundary.type === 'circle' && boundary.center && boundary.radius) {
        minX = Math.min(minX, boundary.center.x - boundary.radius);
        minY = Math.min(minY, boundary.center.y - boundary.radius);
        maxX = Math.max(maxX, boundary.center.x + boundary.radius);
        maxY = Math.max(maxY, boundary.center.y + boundary.radius);
      } else if (boundary.type === 'rectangle' && boundary.center && boundary.width && boundary.height) {
        const halfWidth = boundary.width / 2;
        const halfHeight = boundary.height / 2;
        minX = Math.min(minX, boundary.center.x - halfWidth);
        minY = Math.min(minY, boundary.center.y - halfHeight);
        maxX = Math.max(maxX, boundary.center.x + halfWidth);
        maxY = Math.max(maxY, boundary.center.y + halfHeight);
      }
    });
    
    return { minX, minY, maxX, maxY };
  }

  /**
   * Taglia una linea sui boundaries (implementazione semplificata)
   */
  private clipLineToboundaries(line: Point[], boundaries: HatchBoundary[]): Point[][] {
    // Per questa implementazione di base, restituisce la linea originale
    // In una implementazione completa, si userebbe l'algoritmo di clipping
    // come Sutherland-Hodgman o Cohen-Sutherland
    
    const clippedSegments: Point[][] = [];
    
    // Controlla se la linea interseca i boundaries
    let isInside = false;
    let currentSegment: Point[] = [];
    
    // Implementazione semplificata - controlla solo il primo e ultimo punto
    const startPoint = line[0];
    const endPoint = line[line.length - 1];
    
    const startInside = this.isPointInsideBoundaries(startPoint, boundaries);
    const endInside = this.isPointInsideBoundaries(endPoint, boundaries);
    
    if (startInside && endInside) {
      // Entrambi i punti sono dentro, mantieni la linea intera
      clippedSegments.push([...line]);
    } else if (startInside || endInside) {
      // Solo un punto è dentro, trova l'intersezione
      // Per semplicità, mantieni la linea intera
      clippedSegments.push([...line]);
    }
    // Se entrambi sono fuori, non aggiungere nulla
    
    return clippedSegments;
  }

  /**
   * Verifica se un punto è dentro i boundaries
   */
  private isPointInsideBoundaries(point: Point, boundaries: HatchBoundary[]): boolean {
    for (const boundary of boundaries) {
      if (this.isPointInsideBoundary(point, boundary)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Verifica se un punto è dentro un singolo boundary
   */
  private isPointInsideBoundary(point: Point, boundary: HatchBoundary): boolean {
    switch (boundary.type) {
      case 'circle':
        if (boundary.center && boundary.radius) {
          const dx = point.x - boundary.center.x;
          const dy = point.y - boundary.center.y;
          return dx * dx + dy * dy <= boundary.radius * boundary.radius;
        }
        break;
        
      case 'rectangle':
        if (boundary.center && boundary.width && boundary.height) {
          const halfWidth = boundary.width / 2;
          const halfHeight = boundary.height / 2;
          return point.x >= boundary.center.x - halfWidth &&
                 point.x <= boundary.center.x + halfWidth &&
                 point.y >= boundary.center.y - halfHeight &&
                 point.y <= boundary.center.y + halfHeight;
        }
        break;
        
      case 'polyline':
        if (boundary.points && boundary.closed) {
          return this.isPointInPolygon(point, boundary.points);
        }
        break;
    }
    
    return false;
  }

  /**
   * Ray casting algorithm per verificare se un punto è dentro un poligono
   */
  private isPointInPolygon(point: Point, vertices: Point[]): boolean {
    let inside = false;
    
    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
      if (((vertices[i].y > point.y) !== (vertices[j].y > point.y)) &&
          (point.x < (vertices[j].x - vertices[i].x) * (point.y - vertices[i].y) / 
           (vertices[j].y - vertices[i].y) + vertices[i].x)) {
        inside = !inside;
      }
    }
    
    return inside;
  }

  /**
   * Crea un pattern personalizzato da parametri semplici
   */
  createSimplePattern(
    id: string,
    name: string,
    angle: number,
    spacing: number,
    description?: string
  ): HatchPattern {
    return {
      id,
      name,
      description,
      type: 'user',
      lines: [
        {
          angle,
          basePoint: { x: 0, y: 0 },
          offset: { x: 0, y: spacing },
          dashLengths: []
        }
      ]
    };
  }

  /**
   * Crea un pattern cross-hatch
   */
  createCrossHatchPattern(
    id: string,
    name: string,
    angle1: number,
    angle2: number,
    spacing: number,
    description?: string
  ): HatchPattern {
    return {
      id,
      name,
      description,
      type: 'user',
      lines: [
        {
          angle: angle1,
          basePoint: { x: 0, y: 0 },
          offset: { x: 0, y: spacing },
          dashLengths: []
        },
        {
          angle: angle2,
          basePoint: { x: 0, y: 0 },
          offset: { x: 0, y: spacing },
          dashLengths: []
        }
      ]
    };
  }

  /**
   * Renderizza un hatch su un canvas context
   */
  renderHatch(
    ctx: CanvasRenderingContext2D,
    hatchDefinition: HatchDefinition
  ): void {
    const lines = this.generateHatchLines(
      hatchDefinition.boundaries,
      hatchDefinition.pattern,
      hatchDefinition.scale,
      hatchDefinition.angle,
      hatchDefinition.origin
    );

    // Applica lo stile
    ctx.save();
    
    if (hatchDefinition.style.strokeColor) {
      ctx.strokeStyle = hatchDefinition.style.strokeColor;
    }
    if (hatchDefinition.style.strokeWidth) {
      ctx.lineWidth = hatchDefinition.style.strokeWidth;
    }
    
    // Disegna tutte le linee
    lines.forEach(line => {
      if (line.length >= 2) {
        ctx.beginPath();
        ctx.moveTo(line[0].x, line[0].y);
        for (let i = 1; i < line.length; i++) {
          ctx.lineTo(line[i].x, line[i].y);
        }
        ctx.stroke();
      }
    });
    
    ctx.restore();
  }
}

export default HatchEngine;