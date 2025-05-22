// src/components/cad/technical-drawing/utils/export/SvgExporter.ts
// SVG export functionality for technical drawings

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
  DrawingSheet
} from '../../TechnicalDrawingTypes';

export interface SvgExportOptions {
  includeGrid?: boolean;
  includeRulers?: boolean;
  scale?: number;
  units?: string;
  precision?: number;
}

export class SvgExporter {
  private entities: Record<string, AnyEntity> = {};
  private layers: DrawingLayer[] = [];
  private sheet: DrawingSheet | null = null;
  private options: SvgExportOptions;

  constructor(options: SvgExportOptions = {}) {
    this.options = {
      includeGrid: false,
      includeRulers: false,
      scale: 1,
      units: 'mm',
      precision: 2,
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
  }

  /**
   * Export to SVG string
   */
  export(): string {
    // Calculate drawing bounds
    const bounds = this.calculateBounds();
    
    // Create SVG document
    let svg = this.createSvgHeader(bounds);
    
    // Add style definitions
    svg += this.createStyleDefinitions();
    
    // Add grid if requested
    if (this.options.includeGrid && this.sheet) {
      svg += this.createGrid(bounds);
    }
    
    // Export entities by layers
    const sortedLayers = this.layers
      .filter(layer => layer.visible)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    
    for (const layer of sortedLayers) {
      svg += this.createLayerGroup(layer);
    }
    
    // Close SVG
    svg += '</svg>';
    
    return svg;
  }

  /**
   * Calculate the bounds of all visible entities
   */
  private calculateBounds(): { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number } {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    Object.values(this.entities).forEach(entity => {
      if (!entity.visible) return;
      
      const entityBounds = this.getEntityBounds(entity);
      if (entityBounds) {
        minX = Math.min(minX, entityBounds.minX);
        minY = Math.min(minY, entityBounds.minY);
        maxX = Math.max(maxX, entityBounds.maxX);
        maxY = Math.max(maxY, entityBounds.maxY);
      }
    });

    // If no entities, use sheet bounds or default
    if (minX === Infinity) {
      minX = 0;
      minY = 0;
      maxX = this.sheet?.width || 210;
      maxY = this.sheet?.height || 297;
    }

    // Add padding
    const padding = 10;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;

    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  /**
   * Get bounds for a specific entity
   */
  private getEntityBounds(entity: AnyEntity): { minX: number; minY: number; maxX: number; maxY: number } | null {
    switch (entity.type) {
      case 'line': {
        const line = entity as LineEntity;
        return {
          minX: Math.min(line.startPoint.x, line.endPoint.x),
          minY: Math.min(line.startPoint.y, line.endPoint.y),
          maxX: Math.max(line.startPoint.x, line.endPoint.x),
          maxY: Math.max(line.startPoint.y, line.endPoint.y)
        };
      }
      
      case 'circle': {
        const circle = entity as CircleEntity;
        return {
          minX: circle.center.x - circle.radius,
          minY: circle.center.y - circle.radius,
          maxX: circle.center.x + circle.radius,
          maxY: circle.center.y + circle.radius
        };
      }
      
      case 'rectangle': {
        const rect = entity as RectangleEntity;
        return {
          minX: rect.position.x,
          minY: rect.position.y,
          maxX: rect.position.x + rect.width,
          maxY: rect.position.y + rect.height
        };
      }
      
      case 'polyline': {
        const polyline = entity as PolylineEntity;
        if (polyline.points.length === 0) return null;
        
        let minX = polyline.points[0].x;
        let minY = polyline.points[0].y;
        let maxX = polyline.points[0].x;
        let maxY = polyline.points[0].y;
        
        polyline.points.forEach(point => {
          minX = Math.min(minX, point.x);
          minY = Math.min(minY, point.y);
          maxX = Math.max(maxX, point.x);
          maxY = Math.max(maxY, point.y);
        });
        
        return { minX, minY, maxX, maxY };
      }
      
      default:
        return null;
    }
  }

  /**
   * Create SVG header
   */
  private createSvgHeader(bounds: any): string {
    const { width, height, minX, minY } = bounds;
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}${this.options.units}" height="${height}${this.options.units}" 
     viewBox="${minX} ${minY} ${width} ${height}"
     xmlns="http://www.w3.org/2000/svg"
     xmlns:xlink="http://www.w3.org/1999/xlink">
  <title>Technical Drawing Export</title>
  <desc>Exported from CAD Application</desc>
`;
  }

  /**
   * Create style definitions
   */
  private createStyleDefinitions(): string {
    return `
  <defs>
    <style type="text/css">
      <![CDATA[
        .drawing-entity { vector-effect: non-scaling-stroke; }
        .layer-construction { stroke-dasharray: 5,5; }
        .layer-hidden { stroke-dasharray: 2,2; }
        .dimension-line { stroke: #0066cc; fill: none; }
        .dimension-text { font-family: Arial, sans-serif; font-size: 3px; text-anchor: middle; }
        .annotation-text { font-family: Arial, sans-serif; }
      ]]>
    </style>
  </defs>
`;
  }

  /**
   * Create grid
   */
  private createGrid(bounds: any): string {
    if (!this.sheet) return '';
    
    const gridSize = 10; // Default grid size
    let grid = '  <g id="grid" class="grid" stroke="#e0e0e0" stroke-width="0.1" fill="none">\n';
    
    // Vertical lines
    for (let x = Math.floor(bounds.minX / gridSize) * gridSize; x <= bounds.maxX; x += gridSize) {
      grid += `    <line x1="${x}" y1="${bounds.minY}" x2="${x}" y2="${bounds.maxY}"/>\n`;
    }
    
    // Horizontal lines
    for (let y = Math.floor(bounds.minY / gridSize) * gridSize; y <= bounds.maxY; y += gridSize) {
      grid += `    <line x1="${bounds.minX}" y1="${y}" x2="${bounds.maxX}" y2="${y}"/>\n`;
    }
    
    grid += '  </g>\n';
    return grid;
  }

  /**
   * Create layer group
   */
  private createLayerGroup(layer: DrawingLayer): string {
    const layerEntities = Object.values(this.entities).filter(
      entity => entity.layer === layer.name && entity.visible
    );

    if (layerEntities.length === 0) return '';

    let layerSvg = `  <g id="layer-${layer.name}" class="layer" stroke="${layer.color}" fill="none">\n`;
    layerSvg += `    <title>${layer.name}</title>\n`;

    layerEntities.forEach(entity => {
      layerSvg += this.entityToSvg(entity);
    });

    layerSvg += '  </g>\n';
    return layerSvg;
  }

  /**
   * Convert entity to SVG
   */
  private entityToSvg(entity: AnyEntity): string {
    const style = this.getEntityStyle(entity);
    
    switch (entity.type) {
      case 'line':
        return this.lineToSvg(entity as LineEntity, style);
      case 'circle':
        return this.circleToSvg(entity as CircleEntity, style);
      case 'rectangle':
        return this.rectangleToSvg(entity as RectangleEntity, style);
      case 'polyline':
        return this.polylineToSvg(entity as PolylineEntity, style);
      case 'ellipse':
        return this.ellipseToSvg(entity as EllipseEntity, style);
      case 'arc':
        return this.arcToSvg(entity as ArcEntity, style);
      case 'text-annotation':
        return this.textToSvg(entity as TextAnnotation, style);
      default:
        return '';
    }
  }

  /**
   * Get SVG style string for entity
   */
  private getEntityStyle(entity: AnyEntity): string {
    const style = entity.style;
    let svgStyle = `stroke="${style.strokeColor || '#000000'}" `;
    svgStyle += `stroke-width="${style.strokeWidth || 1}" `;
    
    if (style.fillColor && style.fillColor !== 'none') {
      svgStyle += `fill="${style.fillColor}" `;
      if (style.fillOpacity !== undefined) {
        svgStyle += `fill-opacity="${style.fillOpacity}" `;
      }
    } else {
      svgStyle += `fill="none" `;
    }
    
    // Handle line styles
    switch (style.strokeStyle) {
      case 'dashed':
        svgStyle += 'stroke-dasharray="10,5" ';
        break;
      case 'dotted':
        svgStyle += 'stroke-dasharray="2,2" ';
        break;
      case 'dash-dot':
        svgStyle += 'stroke-dasharray="10,5,2,5" ';
        break;
    }
    
    return svgStyle;
  }

  /**
   * Convert line to SVG
   */
  private lineToSvg(line: LineEntity, style: string): string {
    return `    <line x1="${this.formatNumber(line.startPoint.x)}" y1="${this.formatNumber(line.startPoint.y)}" ` +
           `x2="${this.formatNumber(line.endPoint.x)}" y2="${this.formatNumber(line.endPoint.y)}" ${style}/>\n`;
  }

  /**
   * Convert circle to SVG
   */
  private circleToSvg(circle: CircleEntity, style: string): string {
    return `    <circle cx="${this.formatNumber(circle.center.x)}" cy="${this.formatNumber(circle.center.y)}" ` +
           `r="${this.formatNumber(circle.radius)}" ${style}/>\n`;
  }

  /**
   * Convert rectangle to SVG
   */
  private rectangleToSvg(rect: RectangleEntity, style: string): string {
    let transform = '';
    if (rect.rotation) {
      const centerX = rect.position.x + rect.width / 2;
      const centerY = rect.position.y + rect.height / 2;
      transform = ` transform="rotate(${rect.rotation} ${centerX} ${centerY})"`;
    }
    
    return `    <rect x="${this.formatNumber(rect.position.x)}" y="${this.formatNumber(rect.position.y)}" ` +
           `width="${this.formatNumber(rect.width)}" height="${this.formatNumber(rect.height)}" ` +
           `${style}${transform}/>\n`;
  }

  /**
   * Convert polyline to SVG
   */
  private polylineToSvg(polyline: PolylineEntity, style: string): string {
    if (polyline.points.length < 2) return '';
    
    const points = polyline.points
      .map(p => `${this.formatNumber(p.x)},${this.formatNumber(p.y)}`)
      .join(' ');
    
    const element = polyline.closed ? 'polygon' : 'polyline';
    return `    <${element} points="${points}" ${style}/>\n`;
  }

  /**
   * Convert ellipse to SVG
   */
  private ellipseToSvg(ellipse: EllipseEntity, style: string): string {
    let transform = '';
    if (ellipse.rotation) {
      transform = ` transform="rotate(${ellipse.rotation} ${ellipse.center.x} ${ellipse.center.y})"`;
    }
    
    return `    <ellipse cx="${this.formatNumber(ellipse.center.x)}" cy="${this.formatNumber(ellipse.center.y)}" ` +
           `rx="${this.formatNumber(ellipse.radiusX)}" ry="${this.formatNumber(ellipse.radiusY)}" ` +
           `${style}${transform}/>\n`;
  }

  /**
   * Convert arc to SVG
   */
  private arcToSvg(arc: ArcEntity, style: string): string {
    const startX = arc.center.x + arc.radius * Math.cos(arc.startAngle);
    const startY = arc.center.y + arc.radius * Math.sin(arc.startAngle);
    const endX = arc.center.x + arc.radius * Math.cos(arc.endAngle);
    const endY = arc.center.y + arc.radius * Math.sin(arc.endAngle);
    
    let angleDiff = arc.endAngle - arc.startAngle;
    if (arc.counterclockwise) {
      angleDiff = -angleDiff;
    }
    
    // Normalize angle difference
    while (angleDiff < 0) angleDiff += 2 * Math.PI;
    while (angleDiff > 2 * Math.PI) angleDiff -= 2 * Math.PI;
    
    const largeArcFlag = angleDiff > Math.PI ? 1 : 0;
    const sweepFlag = arc.counterclockwise ? 0 : 1;
    
    return `    <path d="M ${this.formatNumber(startX)} ${this.formatNumber(startY)} ` +
           `A ${this.formatNumber(arc.radius)} ${this.formatNumber(arc.radius)} 0 ${largeArcFlag} ${sweepFlag} ` +
           `${this.formatNumber(endX)} ${this.formatNumber(endY)}" ${style}/>\n`;
  }

  /**
   * Convert text to SVG
   */
  private textToSvg(text: TextAnnotation, style: string): string {
    let transform = '';
    if (text.rotation) {
      transform = ` transform="rotate(${text.rotation} ${text.position.x} ${text.position.y})"`;
    }
    
    const fontSize = text.style.fontSize || 12;
    const fontFamily = text.style.fontFamily || 'Arial';
    const textAnchor = text.style.textAlign === 'center' ? 'middle' : 
                     text.style.textAlign === 'right' ? 'end' : 'start';
    
    return `    <text x="${this.formatNumber(text.position.x)}" y="${this.formatNumber(text.position.y)}" ` +
           `font-family="${fontFamily}" font-size="${fontSize}" text-anchor="${textAnchor}" ` +
           `${style}${transform}>${this.escapeXml(text.text)}</text>\n`;
  }

  /**
   * Format number with specified precision
   */
  private formatNumber(num: number): string {
    return num.toFixed(this.options.precision || 2);
  }

  /**
   * Escape XML special characters
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}

export default SvgExporter;
