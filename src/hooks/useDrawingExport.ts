// src/hooks/useDrawingExport.ts

import { useCallback } from 'react';
import { useTechnicalDrawingStore } from '../store/technicalDrawingStore';
import FileSaver from 'file-saver';

export function useDrawingExport() {
  const { 
    entities, 
    dimensions, 
    annotations, 
    viewports, 
    sheet, 
    drawingStandard 
  } = useTechnicalDrawingStore();
  
  // Export to DXF format
  const exportToDXF = useCallback(() => {
    // This would require a full DXF generation library or implementation
    // Here's just a skeletal implementation
    const dxfContent = `0
SECTION
2
HEADER
9
$ACADVER
1
AC1021
0
ENDSEC
0
SECTION
2
ENTITIES
`;
    
    // Add DXF content for each entity
    Object.values(entities).forEach(entity => {
      // Convert our entities to DXF format
      // This would be different for each entity type
    });
    
    // Close the DXF file
    const dxfFooter = `0
ENDSEC
0
EOF`;
    
    const dxfBlob = new Blob([dxfContent + dxfFooter], {type: 'application/dxf'});
    FileSaver.saveAs(dxfBlob, 'technical_drawing.dxf');
  }, [entities]);
  
  // Export to SVG format
  const exportToSVG = useCallback(() => {
    // Create SVG content
    const svgWidth = sheet.width;
    const svgHeight = sheet.height;
    
    let svgContent = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="${svgWidth}mm" height="${svgHeight}mm" viewBox="0 0 ${svgWidth} ${svgHeight}" 
  xmlns="http://www.w3.org/2000/svg" version="1.1">
`;
    
    // Draw sheet border
    svgContent += `<rect x="0" y="0" width="${svgWidth}" height="${svgHeight}" fill="white" stroke="black" stroke-width="0.5"/>`;
    
    // Add title block if exists
    if (sheet.titleBlock) {
      const tb = sheet.titleBlock;
      svgContent += `<rect x="${tb.position.x}" y="${tb.position.y}" width="${tb.width}" height="${tb.height}" fill="none" stroke="black" stroke-width="0.5"/>`;
      
      // Add title and other fields
      svgContent += `<text x="${tb.position.x + 5}" y="${tb.position.y + 10}" font-family="Arial" font-size="7">${tb.fields.title}</text>`;
      // Add more fields...
    }
    
    // Add entities
    Object.values(entities).forEach(entity => {
      switch (entity.type) {
        case 'line':
          svgContent += `<line x1="${entity.startPoint.x}" y1="${entity.startPoint.y}" 
            x2="${entity.endPoint.x}" y2="${entity.endPoint.y}" 
            stroke="${entity.style.strokeColor}" stroke-width="${entity.style.strokeWidth}"`;
          
          // Add dash pattern if not solid
          if (entity.style.strokeStyle !== 'solid') {
            let dashPattern = '';
            switch (entity.style.strokeStyle) {
              case 'dashed':
                dashPattern = '5,2';
                break;
              case 'dotted':
                dashPattern = '1,2';
                break;
              case 'dash-dot':
                dashPattern = '5,2,1,2';
                break;
              // Add other patterns...
            }
            svgContent += ` stroke-dasharray="${dashPattern}"`;
          }
          
          svgContent += `/>`;
          break;
          
        case 'circle':
          svgContent += `<circle cx="${entity.center.x}" cy="${entity.center.y}" r="${entity.radius}" 
            fill="${entity.style.fillColor || 'none'}" 
            stroke="${entity.style.strokeColor}" stroke-width="${entity.style.strokeWidth}"`;
          
          // Add dash pattern if not solid
          if (entity.style.strokeStyle !== 'solid') {
            let dashPattern = '';
            switch (entity.style.strokeStyle) {
              case 'dashed':
                dashPattern = '5,2';
                break;
              // Add other patterns...
            }
            svgContent += ` stroke-dasharray="${dashPattern}"`;
          }
          
          svgContent += `/>`;
          break;
          
        // Add other entity types...
      }
    });
    
    // Add dimensions
    Object.values(dimensions).forEach(dimension => {
      // This would be complex for each dimension type
      // Just a placeholder implementation
      switch (dimension.type) {
        case 'linear-dimension':
          // Draw dimension line
          svgContent += `<line x1="${dimension.startPoint.x}" y1="${dimension.startPoint.y + dimension.offsetDistance}" 
            x2="${dimension.endPoint.x}" y2="${dimension.endPoint.y + dimension.offsetDistance}" 
            stroke="${dimension.style.strokeColor}" stroke-width="${dimension.style.strokeWidth}"/>`;
          
          // Draw extension lines
          svgContent += `<line x1="${dimension.startPoint.x}" y1="${dimension.startPoint.y}" 
            x2="${dimension.startPoint.x}" y2="${dimension.startPoint.y + dimension.offsetDistance}" 
            stroke="${dimension.style.strokeColor}" stroke-width="${dimension.style.strokeWidth}"/>`;
          
          svgContent += `<line x1="${dimension.endPoint.x}" y1="${dimension.endPoint.y}" 
            x2="${dimension.endPoint.x}" y2="${dimension.endPoint.y + dimension.offsetDistance}" 
            stroke="${dimension.style.strokeColor}" stroke-width="${dimension.style.strokeWidth}"/>`;
          
          // Add dimension text
          const textX = (dimension.startPoint.x + dimension.endPoint.x) / 2;
          const textY = dimension.startPoint.y + dimension.offsetDistance - 2;
          svgContent += `<text x="${textX}" y="${textY}" font-family="${dimension.style.fontFamily || 'Arial'}" 
            font-size="${dimension.style.fontSize || 3.5}" text-anchor="middle">${dimension.text || ''}</text>`;
          break;
          
        // Add other dimension types...
      }
    });
    
    // Add annotations
    Object.values(annotations).forEach(annotation => {
      switch (annotation.type) {
        case 'text-annotation':
          svgContent += `<text x="${annotation.position.x}" y="${annotation.position.y}" 
            font-family="${annotation.style.fontFamily || 'Arial'}" 
            font-size="${annotation.style.fontSize || 3.5}"`;
          
          if (annotation.rotation) {
            svgContent += ` transform="rotate(${annotation.rotation} ${annotation.position.x} ${annotation.position.y})"`;
          }
          
          svgContent += `>${annotation.text}</text>`;
          break;
          
        // Add other annotation types...
      }
    });
    
    // Close SVG tag
    svgContent += '</svg>';
    
    // Save the SVG file
    const svgBlob = new Blob([svgContent], {type: 'image/svg+xml'});
    FileSaver.saveAs(svgBlob, 'technical_drawing.svg');
  }, [entities, dimensions, annotations, sheet]);
  
  // Export to PDF format
  const exportToPDF = useCallback(() => {
    // This would typically use a PDF generation library like jsPDF
    // or convert the SVG to PDF
    console.log('Export to PDF not yet implemented');
  }, []);
  
  // Export to PNG format
  const exportToPNG = useCallback((canvasElement: HTMLCanvasElement, dpi = 300) => {
    // This would render the drawing to a canvas and then export as PNG
    if (!canvasElement) {
      console.error('Canvas element is required for PNG export');
      return;
    }
    
    try {
      // Convert to data URL and download
      const imgData = canvasElement.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = imgData;
      a.download = 'technical_drawing.png';
      a.click();
    } catch (error) {
      console.error('Error exporting to PNG:', error);
    }
  }, []);
  
  return {
    exportToDXF,
    exportToSVG,
    exportToPDF,
    exportToPNG
  };
}