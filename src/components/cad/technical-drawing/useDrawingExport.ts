// src/components/cad/technical-drawing/useDrawingExport.ts
// Hook for exporting drawings in various formats

import { useCallback } from 'react';
import { useTechnicalDrawingStore } from './technicalDrawingStore';
import SvgExporter, { SvgExportOptions } from './utils/export/SvgExporter';

export interface ExportOptions {
  format: 'svg' | 'png' | 'pdf' | 'dxf';
  filename?: string;
  scale?: number;
  includeGrid?: boolean;
  includeRulers?: boolean;
  quality?: number; // For raster formats
  paperSize?: 'A4' | 'A3' | 'A2' | 'A1' | 'A0' | 'custom';
}

export function useDrawingExport() {
  const {
    entities,
    dimensions,
    annotations,
    drawingLayers,
    sheet,
    zoom,
    pan
  } = useTechnicalDrawingStore();

  /**
   * Export drawing to SVG format
   */
  const exportToSvg = useCallback(async (options: SvgExportOptions = {}): Promise<string> => {
    const exporter = new SvgExporter(options);
    
    // Combine all entities
    const allEntities = {
      ...entities,
      ...dimensions,
      ...annotations
    };
    
    exporter.setData(allEntities, drawingLayers, sheet);
    return exporter.export();
  }, [entities, dimensions, annotations, drawingLayers, sheet]);

  /**
   * Export drawing to PNG format
   */
  const exportToPng = useCallback(async (
    canvas: HTMLCanvasElement,
    options: { quality?: number; scale?: number } = {}
  ): Promise<string> => {
    const { quality = 0.9, scale = 1 } = options;
    
    // Create a temporary canvas for export
    const exportCanvas = document.createElement('canvas');
    const exportCtx = exportCanvas.getContext('2d');
    
    if (!exportCtx) {
      throw new Error('Failed to get canvas context for export');
    }
    
    // Set export canvas size
    exportCanvas.width = canvas.width * scale;
    exportCanvas.height = canvas.height * scale;
    
    // Scale the context
    exportCtx.scale(scale, scale);
    
    // Fill with white background
    exportCtx.fillStyle = '#FFFFFF';
    exportCtx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw the original canvas content
    exportCtx.drawImage(canvas, 0, 0);
    
    // Convert to data URL
    return exportCanvas.toDataURL('image/png', quality);
  }, []);

  /**
   * Export drawing to PDF format (basic implementation)
   */
  const exportToPdf = useCallback(async (
    options: { paperSize?: string; orientation?: 'portrait' | 'landscape' } = {}
  ): Promise<Blob> => {
    // This is a basic implementation using SVG
    // For a full PDF implementation, you'd want to use a library like jsPDF
    const svgString = await exportToSvg();
    
    // Convert SVG to PDF (simplified - in reality you'd use jsPDF or similar)
    const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Contents 4 0 R >>
endobj
4 0 obj
<< /Length ${svgString.length} >>
stream
${svgString}
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000056 00000 n 
0000000111 00000 n 
0000000174 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
${274 + svgString.length}
%%EOF`;
    
    return new Blob([pdfContent], { type: 'application/pdf' });
  }, [exportToSvg]);

  /**
   * Export drawing to DXF format (basic structure)
   */
  const exportToDxf = useCallback(async (): Promise<string> => {
    // Basic DXF export implementation
    // This is a simplified version - a full implementation would be much more complex
    
    let dxf = '';
    
    // DXF Header
    dxf += '0\nSECTION\n2\nHEADER\n';
    dxf += '9\n$ACADVER\n1\nAC1015\n'; // AutoCAD 2000 format
    dxf += '0\nENDSEC\n';
    
    // Tables section
    dxf += '0\nSECTION\n2\nTABLES\n';
    
    // Layer table
    dxf += '0\nTABLE\n2\nLAYER\n70\n1\n';
    drawingLayers.forEach(layer => {
      dxf += '0\nLAYER\n2\n' + layer.name + '\n70\n0\n62\n1\n6\nCONTINUOUS\n';
    });
    dxf += '0\nENDTAB\n';
    
    dxf += '0\nENDSEC\n';
    
    // Entities section
    dxf += '0\nSECTION\n2\nENTITIES\n';
    
    // Export entities
    Object.values(entities).forEach(entity => {
      if (!entity.visible) return;
      
      switch (entity.type) {
        case 'line': {
          const line = entity as any;
          dxf += '0\nLINE\n';
          dxf += '8\n' + entity.layer + '\n';
          dxf += '10\n' + line.startPoint.x + '\n';
          dxf += '20\n' + line.startPoint.y + '\n';
          dxf += '11\n' + line.endPoint.x + '\n';
          dxf += '21\n' + line.endPoint.y + '\n';
          break;
        }
        
        case 'circle': {
          const circle = entity as any;
          dxf += '0\nCIRCLE\n';
          dxf += '8\n' + entity.layer + '\n';
          dxf += '10\n' + circle.center.x + '\n';
          dxf += '20\n' + circle.center.y + '\n';
          dxf += '40\n' + circle.radius + '\n';
          break;
        }
        
        // Add more entity types as needed
      }
    });
    
    dxf += '0\nENDSEC\n';
    dxf += '0\nEOF\n';
    
    return dxf;
  }, [entities, drawingLayers]);

  /**
   * Download file with given content
   */
  const downloadFile = useCallback((content: string | Blob, filename: string, mimeType: string) => {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);
  }, []);

  /**
   * Main export function
   */
  const exportDrawing = useCallback(async (
    options: ExportOptions,
    canvas?: HTMLCanvasElement
  ): Promise<void> => {
    const {
      format,
      filename = `drawing.${format}`,
      scale = 1,
      includeGrid = false,
      includeRulers = false,
      quality = 0.9
    } = options;
    
    try {
      switch (format) {
        case 'svg': {
          const svgContent = await exportToSvg({ 
            scale, 
            includeGrid, 
            includeRulers 
          });
          downloadFile(svgContent, filename, 'image/svg+xml');
          break;
        }
        
        case 'png': {
          if (!canvas) {
            throw new Error('Canvas is required for PNG export');
          }
          const pngDataUrl = await exportToPng(canvas, { quality, scale });
          
          // Convert data URL to blob and download
          const response = await fetch(pngDataUrl);
          const blob = await response.blob();
          downloadFile(blob, filename, 'image/png');
          break;
        }
        
        case 'pdf': {
          const pdfBlob = await exportToPdf();
          downloadFile(pdfBlob, filename, 'application/pdf');
          break;
        }
        
        case 'dxf': {
          const dxfContent = await exportToDxf();
          downloadFile(dxfContent, filename, 'application/dxf');
          break;
        }
        
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  }, [exportToSvg, exportToPng, exportToPdf, exportToDxf, downloadFile]);

  /**
   * Get drawing statistics for export info
   */
  const getDrawingStats = useCallback(() => {
    const totalEntities = Object.keys(entities).length + 
                         Object.keys(dimensions).length + 
                         Object.keys(annotations).length;
    
    const visibleEntities = Object.values({ ...entities, ...dimensions, ...annotations })
      .filter(entity => entity.visible).length;
    
    const layerStats = drawingLayers.map(layer => {
      const layerEntities = Object.values({ ...entities, ...dimensions, ...annotations })
        .filter(entity => entity.layer === layer.name);
      
      return {
        name: layer.name,
        count: layerEntities.length,
        visible: layer.visible
      };
    });
    
    return {
      totalEntities,
      visibleEntities,
      totalLayers: drawingLayers.length,
      layerStats
    };
  }, [entities, dimensions, annotations, drawingLayers]);

  return {
    exportDrawing,
    exportToSvg,
    exportToPng,
    exportToPdf,
    exportToDxf,
    downloadFile,
    getDrawingStats
  };
}
