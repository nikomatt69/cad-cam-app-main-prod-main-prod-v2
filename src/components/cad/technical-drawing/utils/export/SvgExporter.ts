// src/components/cad/technical-drawing/utils/export/SvgExporter.ts

import { DrawingEntity, Dimension, Annotation, DrawingLayer, DrawingSheet } from '../../TechnicalDrawingTypes';

export interface SvgExportOptions {
  scale?: number;
  includeGrid?: boolean;
  includeRulers?: boolean;
  backgroundColor?: string;
  strokeScale?: number;
}

export default class SvgExporter {
  private options: SvgExportOptions;
  private entities: Record<string, DrawingEntity | Dimension | Annotation> = {};
  private layers: DrawingLayer[] = [];
  private sheet: DrawingSheet | null = null;

  constructor(options: SvgExportOptions = {}) {
    this.options = {
      scale: 1,
      includeGrid: false,
      includeRulers: false,
      backgroundColor: '#ffffff',
      strokeScale: 1,
      ...options
    };
  }

  setData(
    entities: Record<string, DrawingEntity | Dimension | Annotation>,
    layers: DrawingLayer[],
    sheet: DrawingSheet
  ) {
    this.entities = entities;
    this.layers = layers;
    this.sheet = sheet;
  }

  export(): string {
    if (!this.sheet) {
      throw new Error('No sheet data available for export');
    }

    const width = this.sheet.width * (this.options.scale || 1);
    const height = this.sheet.height * (this.options.scale || 1);

    let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" 
     viewBox="0 0 ${width} ${height}"
     xmlns="http://www.w3.org/2000/svg">
`;

    // Background
    if (this.options.backgroundColor) {
      svg += `  <rect width="100%" height="100%" fill="${this.options.backgroundColor}"/>
`;
    }

    // Grid
    if (this.options.includeGrid) {
      svg += this.generateGrid();
    }

    // Entities
    svg += this.generateEntities();

    svg += '</svg>';

    return svg;
  }

  private generateGrid(): string {
    if (!this.sheet) return '';

    const gridSize = 10; // Default grid size
    const width = this.sheet.width * (this.options.scale || 1);
    const height = this.sheet.height * (this.options.scale || 1);

    let grid = '  <g id="grid" stroke="#e0e0e0" stroke-width="0.5" opacity="0.5">\n';

    // Vertical lines
    for (let x = 0; x <= width; x += gridSize) {
      grid += `    <line x1="${x}" y1="0" x2="${x}" y2="${height}"/>\n`;
    }

    // Horizontal lines
    for (let y = 0; y <= height; y += gridSize) {
      grid += `    <line x1="0" y1="${y}" x2="${width}" y2="${y}"/>\n`;
    }

    grid += '  </g>\n';

    return grid;
  }

  private generateEntities(): string {
    let entitiesStr = '  <g id="entities">\n';

    Object.values(this.entities).forEach(entity => {
      if (entity.visible) {
        entitiesStr += this.generateEntity(entity);
      }
    });

    entitiesStr += '  </g>\n';

    return entitiesStr;
  }

  private generateEntity(entity: DrawingEntity | Dimension | Annotation): string {
    const scale = this.options.scale || 1;
    const strokeWidth = (entity.style.strokeWidth || 1) * (this.options.strokeScale || 1);
    const stroke = entity.style.strokeColor || '#000000';
    const fill = entity.style.fillColor || 'none';

    switch (entity.type) {
      case 'line': {
        const line = entity as any;
        return `    <line x1="${line.startPoint.x * scale}" y1="${line.startPoint.y * scale}" 
                    x2="${line.endPoint.x * scale}" y2="${line.endPoint.y * scale}" 
                    stroke="${stroke}" stroke-width="${strokeWidth}" fill="none"/>\n`;
      }

      case 'circle': {
        const circle = entity as any;
        return `    <circle cx="${circle.center.x * scale}" cy="${circle.center.y * scale}" 
                      r="${circle.radius * scale}" 
                      stroke="${stroke}" stroke-width="${strokeWidth}" fill="${fill}"/>\n`;
      }

      case 'rectangle': {
        const rect = entity as any;
        return `    <rect x="${rect.position.x * scale}" y="${rect.position.y * scale}" 
                    width="${rect.width * scale}" height="${rect.height * scale}" 
                    stroke="${stroke}" stroke-width="${strokeWidth}" fill="${fill}"/>\n`;
      }

      case 'polyline': {
        const polyline = entity as any;
        const points = polyline.points
          .map((p: any) => `${p.x * scale},${p.y * scale}`)
          .join(' ');
        return `    <polyline points="${points}" 
                      stroke="${stroke}" stroke-width="${strokeWidth}" fill="none"/>\n`;
      }

      case 'text-annotation': {
        const text = entity as any;
        const fontSize = (text.style.fontSize || 12) * scale;
        return `    <text x="${text.position.x * scale}" y="${text.position.y * scale}" 
                    font-size="${fontSize}" font-family="${text.style.fontFamily || 'Arial'}" 
                    fill="${stroke}">${text.text}</text>\n`;
      }

      default:
        return `    <!-- Unsupported entity type: ${entity.type} -->\n`;
    }
  }
}
