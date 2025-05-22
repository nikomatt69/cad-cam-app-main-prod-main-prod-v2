// src/components/cad/technical-drawing/rendering/entity-renderers.ts
// Modulo di rendering migliorato per entità di disegno tecnico

import { 
  AnyEntity,
  Point,
  LineEntity,
  CircleEntity,
  ArcEntity,
  RectangleEntity,
  PolylineEntity,
  EllipseEntity,
  SplineEntity,
  PolygonEntity,
  PathEntity,
  HatchEntity,
  TextAnnotation,
  LinearDimension,
  AngularDimension,
  RadialDimension,
  DiameterDimension,
  DrawingEntityType,
  DimensionType,
  AnnotationType,
  DrawingStyle,
  DimensionBase
} from '../TechnicalDrawingTypes';

/**
 * Imposta gli stili di disegno sul contesto canvas
 */
export function applyStyle(ctx: CanvasRenderingContext2D, style: DrawingStyle, isSelected: boolean = false): string {
  // Impostazioni di base
  ctx.strokeStyle = style.strokeColor || '#000000';
  ctx.lineWidth = style.strokeWidth || 1;
  ctx.fillStyle = style.fillColor || 'transparent';
  
  // Imposta opacità solo se definita
  if (style.fillOpacity !== undefined) {
    ctx.globalAlpha = style.fillOpacity;
  } else {
    ctx.globalAlpha = 1;
  }
  
  // Impostazioni testo
  if (style.fontFamily) {
    const fontSize = style.fontSize || 12;
    const fontWeight = style.fontWeight || 'normal';
    ctx.font = `${fontWeight} ${fontSize}px ${style.fontFamily}`;
    ctx.textAlign = (style.textAlign as CanvasTextAlign) || 'left';
  } else {
    // Font predefinito
    ctx.font = 'normal 12px Arial';
    ctx.textAlign = 'left';
  }
  
  // Stile linea
  switch(style.strokeStyle) {
    case 'dashed':
      ctx.setLineDash([10, 5]);
      break;
    case 'dotted':
      ctx.setLineDash([2, 2]);
      break;
    case 'dash-dot':
      ctx.setLineDash([10, 5, 2, 5]);
      break;
    case 'center':
      ctx.setLineDash([15, 5, 3, 5]);
      break;
    case 'phantom':
      ctx.setLineDash([10, 5, 10, 5, 2, 5, 2, 5]);
      break;
    case 'hidden':
      ctx.setLineDash([5, 5]);
      break;
    case 'solid':
    default:
      ctx.setLineDash([]);
  }
  
  // Evidenziazione per entità selezionate
  if (isSelected) {
    // Salva lo stile originale per la strofa
    const originalStrokeStyle = ctx.strokeStyle;
    
    // Disegna un alone attorno all'entità
    ctx.shadowColor = '#1890ff';
    ctx.shadowBlur = 5;
    
    // Aumenta leggermente lo spessore della linea per le entità selezionate
    ctx.lineWidth += 0.5;
    
    // Cambia colore della linea per una migliore visibilità
    ctx.strokeStyle = '#1890ff';
    
    return originalStrokeStyle as string;
  } else {
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    return ctx.strokeStyle as string;
  }
}

/**
 * Renderizza una linea sul canvas
 */
export function renderLine(ctx: CanvasRenderingContext2D, entity: LineEntity, isSelected: boolean = false): void {
  const { startPoint, endPoint, style } = entity;
  
  const originalStrokeStyle = applyStyle(ctx, style, isSelected);
  
  ctx.beginPath();
  ctx.moveTo(startPoint.x, startPoint.y);
  ctx.lineTo(endPoint.x, endPoint.y);
  ctx.stroke();
  
  // Se selezionato, disegna maniglie di controllo
  if (isSelected) {
    // Ripristina lo stile originale
    ctx.strokeStyle = originalStrokeStyle;
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.lineWidth -= 0.5;
    
    // Maniglie di controllo
    ctx.fillStyle = '#1890ff';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    
    ctx.beginPath();
    ctx.arc(startPoint.x, startPoint.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(endPoint.x, endPoint.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}

/**
 * Renderizza un cerchio sul canvas
 */
export function renderCircle(ctx: CanvasRenderingContext2D, entity: CircleEntity, isSelected: boolean = false): void {
  const { center, radius, style } = entity;
  
  const originalStrokeStyle = applyStyle(ctx, style, isSelected);
  
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
  
  if (style.fillColor && style.fillColor !== 'none') {
    ctx.fill();
  }
  
  ctx.stroke();
  
  // Se selezionato, disegna maniglie di controllo
  if (isSelected) {
    // Ripristina lo stile originale
    ctx.strokeStyle = originalStrokeStyle;
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.lineWidth -= 0.5;
    
    // Maniglie di controllo
    ctx.fillStyle = '#1890ff';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    
    // Centro
    ctx.beginPath();
    ctx.arc(center.x, center.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Punto sul raggio (per ridimensionamento)
    ctx.beginPath();
    ctx.arc(center.x + radius, center.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Mostra la linea radiale come guida
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(center.x, center.y);
    ctx.lineTo(center.x + radius, center.y);
    ctx.strokeStyle = '#1890ff';
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

/**
 * Renderizza un arco sul canvas
 */
export function renderArc(ctx: CanvasRenderingContext2D, entity: ArcEntity, isSelected: boolean = false): void {
  const { center, radius, startAngle, endAngle, counterclockwise, style } = entity;
  
  const originalStrokeStyle = applyStyle(ctx, style, isSelected);
  
  ctx.beginPath();
  ctx.arc(
    center.x, 
    center.y, 
    radius, 
    startAngle, 
    endAngle, 
    counterclockwise || false
  );
  
  ctx.stroke();
  
  // Se selezionato, disegna maniglie di controllo
  if (isSelected) {
    // Ripristina lo stile originale
    ctx.strokeStyle = originalStrokeStyle;
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.lineWidth -= 0.5;
    
    // Maniglie di controllo
    ctx.fillStyle = '#1890ff';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    
    // Centro
    ctx.beginPath();
    ctx.arc(center.x, center.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Punto iniziale
    const startX = center.x + radius * Math.cos(startAngle);
    const startY = center.y + radius * Math.sin(startAngle);
    
    ctx.beginPath();
    ctx.arc(startX, startY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Punto finale
    const endX = center.x + radius * Math.cos(endAngle);
    const endY = center.y + radius * Math.sin(endAngle);
    
    ctx.beginPath();
    ctx.arc(endX, endY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Mostra le linee radiali come guida
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(center.x, center.y);
    ctx.lineTo(startX, startY);
    ctx.strokeStyle = '#1890ff';
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(center.x, center.y);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

/**
 * Renderizza un rettangolo sul canvas
 */
export function renderRectangle(ctx: CanvasRenderingContext2D, entity: RectangleEntity, isSelected: boolean = false): void {
  const { position, width, height, rotation, cornerRadius, style } = entity;
  
  const originalStrokeStyle = applyStyle(ctx, style, isSelected);
  
  ctx.save();
  
  // Applica rotazione se specificata
  if (rotation) {
    ctx.translate(position.x + width / 2, position.y + height / 2);
    ctx.rotate(rotation * Math.PI / 180);
    ctx.translate(-(position.x + width / 2), -(position.y + height / 2));
  }
  
  // Disegna rettangolo con o senza angoli arrotondati
  if (cornerRadius && cornerRadius > 0) {
    // Rettangolo con angoli arrotondati
    const r = cornerRadius;
    ctx.beginPath();
    ctx.moveTo(position.x + r, position.y);
    ctx.lineTo(position.x + width - r, position.y);
    ctx.arcTo(position.x + width, position.y, position.x + width, position.y + r, r);
    ctx.lineTo(position.x + width, position.y + height - r);
    ctx.arcTo(position.x + width, position.y + height, position.x + width - r, position.y + height, r);
    ctx.lineTo(position.x + r, position.y + height);
    ctx.arcTo(position.x, position.y + height, position.x, position.y + height - r, r);
    ctx.lineTo(position.x, position.y + r);
    ctx.arcTo(position.x, position.y, position.x + r, position.y, r);
    ctx.closePath();
  } else {
    // Rettangolo normale
    ctx.beginPath();
    ctx.rect(position.x, position.y, width, height);
  }
  
  if (style.fillColor && style.fillColor !== 'none') {
    ctx.fill();
  }
  
  ctx.stroke();
  
  // Se selezionato, disegna maniglie di controllo
  if (isSelected) {
    // Ripristina lo stile originale
    ctx.strokeStyle = originalStrokeStyle;
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.lineWidth -= 0.5;
    
    // Maniglie di controllo
    ctx.fillStyle = '#1890ff';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    
    // Angoli
    const corners = [
      { x: position.x, y: position.y },                       // Top-left
      { x: position.x + width, y: position.y },               // Top-right
      { x: position.x + width, y: position.y + height },      // Bottom-right
      { x: position.x, y: position.y + height }               // Bottom-left
    ];
    
    corners.forEach(corner => {
      ctx.beginPath();
      ctx.arc(corner.x, corner.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
    
    // Punti medi dei lati (per ridimensionamento)
    const midpoints = [
      { x: position.x + width / 2, y: position.y },               // Top
      { x: position.x + width, y: position.y + height / 2 },      // Right
      { x: position.x + width / 2, y: position.y + height },      // Bottom
      { x: position.x, y: position.y + height / 2 }               // Left
    ];
    
    midpoints.forEach(point => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
    
    // Centro di rotazione
    ctx.beginPath();
    ctx.arc(position.x + width / 2, position.y + height / 2, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#ff4d4f';  // Punto di rotazione in rosso
    ctx.fill();
    ctx.stroke();
  }
  
  ctx.restore();
}

/**
 * Renderizza una polilinea sul canvas
 */
export function renderPolyline(ctx: CanvasRenderingContext2D, entity: PolylineEntity, isSelected: boolean = false): void {
  const { points, closed, style } = entity;
  
  if (!points || points.length < 2) return;
  
  const originalStrokeStyle = applyStyle(ctx, style, isSelected);
  
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  
  if (closed) {
    ctx.closePath();
    
    if (style.fillColor && style.fillColor !== 'none') {
      ctx.fill();
    }
  }
  
  ctx.stroke();
  
  // Se selezionato, disegna maniglie di controllo
  if (isSelected) {
    // Ripristina lo stile originale
    ctx.strokeStyle = originalStrokeStyle;
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.lineWidth -= 0.5;
    
    // Maniglie di controllo
    ctx.fillStyle = '#1890ff';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    
    // Disegna punti di controllo per ogni vertice
    points.forEach(point => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
    
    // Disegna punti intermedi per l'inserimento di nuovi vertici
    if (points.length > 1) {
      ctx.fillStyle = '#52c41a';  // Verde per punti di inserimento
      
      for (let i = 0; i < points.length - 1; i++) {
        const midX = (points[i].x + points[i + 1].x) / 2;
        const midY = (points[i].y + points[i + 1].y) / 2;
        
        ctx.beginPath();
        ctx.arc(midX, midY, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      
      // Punto tra l'ultimo e il primo se chiuso
      if (closed && points.length > 2) {
        const midX = (points[0].x + points[points.length - 1].x) / 2;
        const midY = (points[0].y + points[points.length - 1].y) / 2;
        
        ctx.beginPath();
        ctx.arc(midX, midY, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }
  }
}

/**
 * Renderizza un'ellisse sul canvas
 */
export function renderEllipse(ctx: CanvasRenderingContext2D, entity: EllipseEntity, isSelected: boolean = false): void {
  const { center, radiusX, radiusY, rotation, style } = entity;
  
  const originalStrokeStyle = applyStyle(ctx, style, isSelected);
  
  ctx.save();
  
  // Applica rotazione se specificata
  if (rotation) {
    ctx.translate(center.x, center.y);
    ctx.rotate(rotation * Math.PI / 180);
    ctx.translate(-center.x, -center.y);
  }
  
  // Disegna ellisse
  ctx.beginPath();
  ctx.ellipse(
    center.x, 
    center.y, 
    radiusX, 
    radiusY, 
    0, 
    0, 
    Math.PI * 2
  );
  
  if (style.fillColor && style.fillColor !== 'none') {
    ctx.fill();
  }
  
  ctx.stroke();
  
  // Se selezionato, disegna maniglie di controllo
  if (isSelected) {
    // Ripristina lo stile originale
    ctx.strokeStyle = originalStrokeStyle;
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.lineWidth -= 0.5;
    
    // Maniglie di controllo
    ctx.fillStyle = '#1890ff';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    
    // Centro
    ctx.beginPath();
    ctx.arc(center.x, center.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Punti estremi degli assi
    const controlPoints = [
      { x: center.x + radiusX, y: center.y },  // Punto Est
      { x: center.x, y: center.y + radiusY },  // Punto Sud
      { x: center.x - radiusX, y: center.y },  // Punto Ovest
      { x: center.x, y: center.y - radiusY }   // Punto Nord
    ];
    
    controlPoints.forEach(point => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
    
    // Guide per gli assi
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(center.x - radiusX, center.y);
    ctx.lineTo(center.x + radiusX, center.y);
    ctx.strokeStyle = '#1890ff';
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(center.x, center.y - radiusY);
    ctx.lineTo(center.x, center.y + radiusY);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  
  ctx.restore();
}

/**
 * Renderizza una spline sul canvas
 */
export function renderSpline(ctx: CanvasRenderingContext2D, entity: SplineEntity, isSelected: boolean = false): void {
  const { points, controlPoints, closed, style } = entity;
  
  if (!points || points.length < 2) return;
  
  const originalStrokeStyle = applyStyle(ctx, style, isSelected);
  
  ctx.beginPath();
  
  // Se abbiamo punti di controllo, usiamo curve bezier cubiche
  if (controlPoints && controlPoints.length >= 2) {
    ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 0; i < points.length - 1; i++) {
      const cp1Index = i * 2;
      const cp2Index = i * 2 + 1;
      
      if (cp1Index < controlPoints.length && cp2Index < controlPoints.length) {
        ctx.bezierCurveTo(
          controlPoints[cp1Index].x, controlPoints[cp1Index].y,
          controlPoints[cp2Index].x, controlPoints[cp2Index].y,
          points[i + 1].x, points[i + 1].y
        );
      } else {
        // Fallback se mancano i punti di controllo
        ctx.lineTo(points[i + 1].x, points[i + 1].y);
      }
    }
  } else {
    // Fallback: usiamo curve quadratiche automatiche
    ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      
      ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }
    
    // Ultimo segmento
    if (points.length > 1) {
      const lastPoint = points[points.length - 1];
      ctx.lineTo(lastPoint.x, lastPoint.y);
    }
  }
  
  if (closed) {
    ctx.closePath();
    
    if (style.fillColor && style.fillColor !== 'none') {
      ctx.fill();
    }
  }
  
  ctx.stroke();
  
  // Se selezionato, disegna maniglie di controllo
  if (isSelected) {
    // Ripristina lo stile originale
    ctx.strokeStyle = originalStrokeStyle;
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.lineWidth -= 0.5;
    
    // Maniglie di controllo per i punti principali
    ctx.fillStyle = '#1890ff';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    
    points.forEach(point => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
    
    // Punti di controllo e loro connessioni ai punti principali
    if (controlPoints && controlPoints.length > 0) {
      ctx.fillStyle = '#ff4d4f';  // Rosso per i punti di controllo
      
      for (let i = 0; i < points.length - 1; i++) {
        const cp1Index = i * 2;
        const cp2Index = i * 2 + 1;
        
        if (cp1Index < controlPoints.length) {
          // Punto di controllo 1
          ctx.beginPath();
          ctx.arc(controlPoints[cp1Index].x, controlPoints[cp1Index].y, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          
          // Linea dal punto al suo controllo
          ctx.setLineDash([2, 2]);
          ctx.beginPath();
          ctx.moveTo(points[i].x, points[i].y);
          ctx.lineTo(controlPoints[cp1Index].x, controlPoints[cp1Index].y);
          ctx.strokeStyle = '#ff4d4f';
          ctx.stroke();
        }
        
        if (cp2Index < controlPoints.length) {
          // Punto di controllo 2
          ctx.beginPath();
          ctx.arc(controlPoints[cp2Index].x, controlPoints[cp2Index].y, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          
          // Linea dal punto al suo controllo
          ctx.setLineDash([2, 2]);
          ctx.beginPath();
          ctx.moveTo(points[i + 1].x, points[i + 1].y);
          ctx.lineTo(controlPoints[cp2Index].x, controlPoints[cp2Index].y);
          ctx.stroke();
        }
      }
      
      ctx.setLineDash([]);
    }
  }
}

/**
 * Renderizza un poligono regolare sul canvas
 */
export function renderPolygon(ctx: CanvasRenderingContext2D, entity: PolygonEntity, isSelected: boolean = false): void {
  const { center, radius, sides, rotation, style } = entity;
  
  if (sides < 3) return;  // Un poligono deve avere almeno 3 lati
  
  const originalStrokeStyle = applyStyle(ctx, style, isSelected);
  
  ctx.beginPath();
  
  // Calcola i punti del poligono
  const angleStep = (Math.PI * 2) / sides;
  const startAngle = (rotation || 0) * Math.PI / 180;
  
  for (let i = 0; i < sides; i++) {
    const angle = startAngle + i * angleStep;
    const x = center.x + radius * Math.cos(angle);
    const y = center.y + radius * Math.sin(angle);
    
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  
  ctx.closePath();
  
  if (style.fillColor && style.fillColor !== 'none') {
    ctx.fill();
  }
  
  ctx.stroke();
  
  // Se selezionato, disegna maniglie di controllo
  if (isSelected) {
    // Ripristina lo stile originale
    ctx.strokeStyle = originalStrokeStyle;
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.lineWidth -= 0.5;
    
    // Maniglie di controllo
    ctx.fillStyle = '#1890ff';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    
    // Centro
    ctx.beginPath();
    ctx.arc(center.x, center.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Vertici
    for (let i = 0; i < sides; i++) {
      const angle = startAngle + i * angleStep;
      const x = center.x + radius * Math.cos(angle);
      const y = center.y + radius * Math.sin(angle);
      
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    
    // Punto di controllo per rotazione
    const rotationPointAngle = startAngle;
    const rotX = center.x + (radius + 20) * Math.cos(rotationPointAngle);
    const rotY = center.y + (radius + 20) * Math.sin(rotationPointAngle);
    
    ctx.fillStyle = '#ff4d4f';  // Rosso per il punto di rotazione
    ctx.beginPath();
    ctx.arc(rotX, rotY, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Linea guida per rotazione
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(center.x, center.y);
    ctx.lineTo(rotX, rotY);
    ctx.strokeStyle = '#ff4d4f';
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

/**
 * Renderizza un path SVG sul canvas
 */
export function renderPath(ctx: CanvasRenderingContext2D, entity: PathEntity, isSelected: boolean = false): void {
  const { commands, startPoint, style } = entity;
  
  if (!commands) return;
  
  const originalStrokeStyle = applyStyle(ctx, style, isSelected);
  
  // Create a Path2D object
  const path = new Path2D(commands);
  
  if (style.fillColor && style.fillColor !== 'none') {
    ctx.fill(path);
  }
  
  ctx.stroke(path);
  
  // Se selezionato, disegna un riquadro attorno al path
  if (isSelected) {
    // Ripristina lo stile originale
    ctx.strokeStyle = originalStrokeStyle;
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.lineWidth -= 0.5;
    
    // Disegna un riquadro di selezione
    // Nota: calcolare i bounds esatti di un path è complesso,
    // Qui assumiamo che l'entità fornisca bounds o punti di controllo in un'implementazione reale
    
    // Per ora, disegniamo solo il punto iniziale
    if (startPoint) {
      ctx.fillStyle = '#1890ff';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      
      ctx.beginPath();
      ctx.arc(startPoint.x, startPoint.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }
}

/**
 * Renderizza un riempimento (hatch) sul canvas
 */
export function renderHatch(ctx: CanvasRenderingContext2D, entity: HatchEntity, isSelected: boolean = false): void {
  const { boundary, pattern, patternScale, patternAngle, style } = entity;
  
  if (!boundary || boundary.length < 3) return;
  
  const originalStrokeStyle = applyStyle(ctx, style, isSelected);
  
  // Disegna il contorno
  ctx.beginPath();
  ctx.moveTo(boundary[0].x, boundary[0].y);
  
  for (let i = 1; i < boundary.length; i++) {
    ctx.lineTo(boundary[i].x, boundary[i].y);
  }
  
  ctx.closePath();
  
  // Applica il pattern di riempimento
  let patternFill;
  
  switch (pattern) {
    case 'solid':
      ctx.fill();
      break;
      
    case 'lines':
      // Create a pattern with lines
      patternFill = createLinesPattern(ctx, patternScale || 5, patternAngle || 0);
      ctx.fillStyle = patternFill;
      ctx.fill();
      break;
      
    case 'dots':
      // Create a pattern with dots
      patternFill = createDotsPattern(ctx, patternScale || 5);
      ctx.fillStyle = patternFill;
      ctx.fill();
      break;
      
    case 'cross':
      // Create a pattern with crossing lines
      patternFill = createCrossPattern(ctx, patternScale || 5, patternAngle || 0);
      ctx.fillStyle = patternFill;
      ctx.fill();
      break;
      
    case 'diagonal':
      // Create a pattern with diagonal lines
      patternFill = createLinesPattern(ctx, patternScale || 5, (patternAngle || 0) + 45);
      ctx.fillStyle = patternFill;
      ctx.fill();
      break;
      
    default:
      // Solid fill as fallback
      ctx.fill();
  }
  
  // Disegna il contorno
  ctx.stroke();
  
  // Se selezionato, disegna maniglie di controllo
  if (isSelected) {
    // Ripristina lo stile originale
    ctx.strokeStyle = originalStrokeStyle;
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.lineWidth -= 0.5;
    
    // Maniglie di controllo
    ctx.fillStyle = '#1890ff';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    
    // Disegna punti per ogni vertice del contorno
    boundary.forEach(point => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
  }
}

// Funzioni helper per patterns di riempimento
function createLinesPattern(ctx: CanvasRenderingContext2D, scale: number, angle: number): CanvasPattern {
  const patternCanvas = document.createElement('canvas');
  const size = scale * 10;
  patternCanvas.width = size;
  patternCanvas.height = size;
  
  const patternCtx = patternCanvas.getContext('2d');
  if (!patternCtx) throw new Error('Cannot create pattern context');
  
  patternCtx.clearRect(0, 0, size, size);
  patternCtx.strokeStyle = ctx.fillStyle;
  patternCtx.lineWidth = 1;
  
  patternCtx.save();
  patternCtx.translate(size / 2, size / 2);
  patternCtx.rotate(angle * Math.PI / 180);
  patternCtx.translate(-size / 2, -size / 2);
  
  patternCtx.beginPath();
  for (let i = 0; i < size; i += scale) {
    patternCtx.moveTo(0, i);
    patternCtx.lineTo(size, i);
  }
  patternCtx.stroke();
  patternCtx.restore();
  
  return ctx.createPattern(patternCanvas, 'repeat') || ctx.fillStyle as CanvasPattern;
}

function createDotsPattern(ctx: CanvasRenderingContext2D, scale: number): CanvasPattern {
  const patternCanvas = document.createElement('canvas');
  const size = scale * 10;
  patternCanvas.width = size;
  patternCanvas.height = size;
  
  const patternCtx = patternCanvas.getContext('2d');
  if (!patternCtx) throw new Error('Cannot create pattern context');
  
  patternCtx.clearRect(0, 0, size, size);
  patternCtx.fillStyle = ctx.fillStyle;
  
  for (let x = 0; x < size; x += scale) {
    for (let y = 0; y < size; y += scale) {
      patternCtx.beginPath();
      patternCtx.arc(x, y, scale / 4, 0, Math.PI * 2);
      patternCtx.fill();
    }
  }
  
  return ctx.createPattern(patternCanvas, 'repeat') || ctx.fillStyle as CanvasPattern;
}

function createCrossPattern(ctx: CanvasRenderingContext2D, scale: number, angle: number): CanvasPattern {
  const patternCanvas = document.createElement('canvas');
  const size = scale * 10;
  patternCanvas.width = size;
  patternCanvas.height = size;
  
  const patternCtx = patternCanvas.getContext('2d');
  if (!patternCtx) throw new Error('Cannot create pattern context');
  
  patternCtx.clearRect(0, 0, size, size);
  patternCtx.strokeStyle = ctx.fillStyle;
  patternCtx.lineWidth = 1;
  
  patternCtx.save();
  patternCtx.translate(size / 2, size / 2);
  patternCtx.rotate(angle * Math.PI / 180);
  patternCtx.translate(-size / 2, -size / 2);
  
  // Horizontal lines
  patternCtx.beginPath();
  for (let i = 0; i < size; i += scale) {
    patternCtx.moveTo(0, i);
    patternCtx.lineTo(size, i);
  }
  patternCtx.stroke();
  
  // Vertical lines
  patternCtx.beginPath();
  for (let i = 0; i < size; i += scale) {
    patternCtx.moveTo(i, 0);
    patternCtx.lineTo(i, size);
  }
  patternCtx.stroke();
  
  patternCtx.restore();
  
  return (ctx.createPattern(patternCanvas, 'repeat') || ctx.fillStyle) as CanvasPattern;
}

/**
 * Renderizza un'annotazione testuale sul canvas
 */
export function renderTextAnnotation(ctx: CanvasRenderingContext2D, entity: TextAnnotation, isSelected: boolean = false): void {
  const { position, text, rotation, width, height, style } = entity;
  
  if (!text) return;
  
  const originalStrokeStyle = applyStyle(ctx, style, isSelected);
  
  ctx.save();
  
  // Applica rotazione se specificata
  if (rotation) {
    ctx.translate(position.x, position.y);
    ctx.rotate(rotation * Math.PI / 180);
    ctx.translate(-position.x, -position.y);
  }
  
  // Se è definita una larghezza, gestisci il text wrapping
  if (width && text) {
    const fontSize = style.fontSize || 12;
    const lineHeight = fontSize * 1.2;
    const words = text.split(' ');
    let line = '';
    let y = position.y;
    
    // Disegna prima lo sfondo
    if (isSelected) {
      // Calcola l'altezza approssimativa del testo
      const textHeight = Math.max(
        height || 0,
        Math.ceil(text.length / 20) * lineHeight // Stima approssimativa
      );
      
      ctx.fillStyle = 'rgba(24, 144, 255, 0.1)';
      ctx.fillRect(position.x - 2, position.y - fontSize, width + 4, textHeight + 4);
      ctx.strokeStyle = '#1890ff';
      ctx.strokeRect(position.x - 2, position.y - fontSize, width + 4, textHeight + 4);
    }
    
    // Ripristina colore di riempimento per il testo
    if (style.fillColor && style.fillColor !== 'none') {
      ctx.fillStyle = style.fillColor;
    } else {
      ctx.fillStyle = '#000000';
    }
    
    // Disegna il testo con wrapping
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > width && i > 0) {
        ctx.fillText(line, position.x, y);
        line = words[i] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    
    ctx.fillText(line, position.x, y);
  } else {
    // Testo semplice senza wrapping
    if (style.fillColor && style.fillColor !== 'none') {
      ctx.fillText(text, position.x, position.y);
    } else {
      ctx.strokeText(text, position.x, position.y);
    }
  }
  
  // Se è selezionato, disegna un bordo attorno al testo
  if (isSelected) {
    // Già disegnato sopra se c'è width
    if (!width) {
      const metrics = ctx.measureText(text);
      const fontSize = style.fontSize || 12;
      
      ctx.strokeStyle = '#1890ff';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      
      ctx.beginPath();
      ctx.rect(
        position.x - 2, 
        position.y - fontSize + 2, 
        metrics.width + 4, 
        fontSize + 4
      );
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Punto di controllo per la posizione
      ctx.fillStyle = '#1890ff';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      
      ctx.beginPath();
      ctx.arc(position.x, position.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }
  
  ctx.restore();
}

/**
 * Renderizza una quota lineare sul canvas
 */
export function renderLinearDimension(ctx: CanvasRenderingContext2D, entity: LinearDimension, isSelected: boolean = false): void {
  const { startPoint, endPoint, offsetDistance, text, textPosition, style } = entity;
  
  const originalStrokeStyle = applyStyle(ctx, style, isSelected);
  
  // Calcola direzione e punti per la quota
  const dx = endPoint?.x - startPoint?.x;
  const dy = endPoint?.y - startPoint?.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  
  // Normalizza il vettore di direzione
  const nx = dx / length;
  const ny = dy / length;
  
  // Vettore perpendicolare
  const px = -ny;
  const py = nx;
  
  // Punti di estensione
  const ext1: Point = {
    x: startPoint?.x + px * offsetDistance,
    y: startPoint?.y + py * offsetDistance
  };
  
  const ext2: Point = {
    x: endPoint?.x + px * offsetDistance,
    y: endPoint?.y + py * offsetDistance
  };
  
  // Linee di estensione
  ctx.beginPath();
  ctx.moveTo(startPoint?.x, startPoint?.y);
  ctx.lineTo(ext1.x, ext1.y);
  ctx.moveTo(endPoint?.x, endPoint?.y);
  ctx.lineTo(ext2.x, ext2.y);
  ctx.stroke();
  
  // Linea di quota
  ctx.beginPath();
  ctx.moveTo(ext1.x, ext1.y);
  ctx.lineTo(ext2.x, ext2.y);
  ctx.stroke();
  
  // Frecce
  const arrowSize = 5; // Dimensione freccia
  
  // Freccia 1
  ctx.beginPath();
  ctx.moveTo(ext1.x, ext1.y);
  ctx.lineTo(ext1.x + nx * arrowSize + px * arrowSize/2, ext1.y + ny * arrowSize + py * arrowSize/2);
  ctx.lineTo(ext1.x + nx * arrowSize - px * arrowSize/2, ext1.y + ny * arrowSize - py * arrowSize/2);
  ctx.closePath();
  ctx.fill();
  
  // Freccia 2
  ctx.beginPath();
  ctx.moveTo(ext2.x, ext2.y);
  ctx.lineTo(ext2.x - nx * arrowSize + px * arrowSize/2, ext2.y - ny * arrowSize + py * arrowSize/2);
  ctx.lineTo(ext2.x - nx * arrowSize - px * arrowSize/2, ext2.y - ny * arrowSize - py * arrowSize/2);
  ctx.closePath();
  ctx.fill();
  
  // Testo della quota
  // Usa la posizione del testo se fornita, altrimenti calcola la posizione centrale
  const tp = textPosition || {
    x: (ext1.x + ext2.x) / 2,
    y: (ext1.y + ext2.y) / 2 - 5
  };
  
  // Valore da visualizzare (testo fornito o lunghezza calcolata)
  const displayText = text || length.toFixed(2);
  
  // Sfondo testo per leggibilità
  const textMetrics = ctx.measureText(displayText);
  ctx.fillStyle = 'white';
  ctx.fillRect(
    tp.x - textMetrics.width/2 - 2,
    tp.y - (style.fontSize || 12) + 2,
    textMetrics.width + 4,
    (style.fontSize || 12) + 4
  );
  
  // Ripristina stile
  if (style.fillColor && style.fillColor !== 'none') {
    ctx.fillStyle = style.fillColor;
  } else {
    ctx.fillStyle = style.strokeColor || '#000000';
  }
  
  // Disegna testo
  ctx.textAlign = 'center';
  ctx.fillText(displayText, tp.x, tp.y);
  
  // Se selezionato, disegna maniglie di controllo
  if (isSelected) {
    // Ripristina lo stile originale
    ctx.strokeStyle = originalStrokeStyle;
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.lineWidth -= 0.5;
    
    // Maniglie di controllo
    ctx.fillStyle = '#1890ff';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    
    // Punti di controllo
    const controlPoints = [
      startPoint,
      endPoint,
      ext1,
      ext2,
      tp
    ];
    
    controlPoints.forEach((point, index) => {
      ctx.beginPath();
      
      // Usa dimensioni diverse per i diversi tipi di punti
      if (index < 2) {
        // Punti principali
        ctx.arc(point?.x, point?.y, 4, 0, Math.PI * 2);
      } else if (index === 4) {
        // Posizione testo
        ctx.arc(point?.x, point?.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ff4d4f';  // Colore diverso per il testo
      } else {
        // Altri punti
        ctx.arc(point?.x, point?.y, 3, 0, Math.PI * 2);
      }
      
      ctx.fill();
      ctx.stroke();
      
      // Ripristina colore per i punti successivi
      ctx.fillStyle = '#1890ff';
    });
  }
}

/**
 * Renderizza una quota angolare sul canvas
 */
export function renderAngularDimension(ctx: CanvasRenderingContext2D, entity: AngularDimension, isSelected: boolean = false): void {
  const { vertex, startPoint, endPoint, radius, text, style } = entity;
  
  const originalStrokeStyle = applyStyle(ctx, style, isSelected);
  
  // Calcola gli angoli
  const startAngle = Math.atan2(startPoint?.y - vertex?.y, startPoint?.x - vertex?.x);
  const endAngle = Math.atan2(endPoint?.y - vertex?.y, endPoint?.x - vertex?.x);
  
  // Calcola il raggio o usa quello fornito
  const r = radius || Math.min(
    Math.sqrt(Math.pow(startPoint?.x - vertex?.x, 2) + Math.pow(startPoint?.y - vertex?.y, 2)),
    Math.sqrt(Math.pow(endPoint?.x - vertex?.x, 2) + Math.pow(endPoint?.y - vertex?.y, 2))
  ) * 0.7;
  
  // Disegna l'arco
  ctx.beginPath();
  ctx.arc(vertex?.x, vertex?.y, r, startAngle, endAngle, false);
  ctx.stroke();
  
  // Linee dai punti al vertice
  ctx.beginPath();
  ctx.moveTo(vertex?.x, vertex?.y);
  ctx.lineTo(startPoint?.x, startPoint?.y);
  ctx.moveTo(vertex?.x, vertex?.y);
  ctx.lineTo(endPoint?.x, endPoint?.y);
  ctx.stroke();
  
  // Frecce
  const arrowSize = 5;
  
  // Calcola i punti per le frecce sull'arco
  const drawArrow = (angle: number, reverse: boolean) => {
    const arrowX = vertex?.x + r * Math.cos(angle);
    const arrowY = vertex?.y + r * Math.sin(angle);
    
    const tangentX = -Math.sin(angle);
    const tangentY = Math.cos(angle);
    
    ctx.beginPath();
    ctx.moveTo(arrowX, arrowY);
    
    if (reverse) {
      ctx.lineTo(
        arrowX + arrowSize * tangentX + arrowSize * 0.5 * Math.cos(angle),
        arrowY + arrowSize * tangentY + arrowSize * 0.5 * Math.sin(angle)
      );
      ctx.lineTo(
        arrowX + arrowSize * tangentX - arrowSize * 0.5 * Math.cos(angle),
        arrowY + arrowSize * tangentY - arrowSize * 0.5 * Math.sin(angle)
      );
    } else {
      ctx.lineTo(
        arrowX - arrowSize * tangentX + arrowSize * 0.5 * Math.cos(angle),
        arrowY - arrowSize * tangentY + arrowSize * 0.5 * Math.sin(angle)
      );
      ctx.lineTo(
        arrowX - arrowSize * tangentX - arrowSize * 0.5 * Math.cos(angle),
        arrowY - arrowSize * tangentY - arrowSize * 0.5 * Math.sin(angle)
      );
    }
    
    ctx.closePath();
    ctx.fill();
  };
  
  drawArrow(startAngle, true);
  drawArrow(endAngle, false);
  
  // Testo per l'angolo
  const angleDiff = ((endAngle - startAngle) + 2 * Math.PI) % (2 * Math.PI);
  const angleDegrees = Math.round(angleDiff * 180 / Math.PI);
  
  const midAngle = startAngle + angleDiff / 2;
  const textX = vertex?.x + (r + 10) * Math.cos(midAngle);
  const textY = vertex?.y + (r + 10) * Math.sin(midAngle);
  
  const displayText = text || `${angleDegrees}°`;
  
  // Sfondo testo per leggibilità
  const textMetrics = ctx.measureText(displayText);
  ctx.fillStyle = 'white';
  ctx.fillRect(
    textX - textMetrics.width/2 - 2,
    textY - (style.fontSize || 12) / 2,
    textMetrics.width + 4,
    (style.fontSize || 12) + 4
  );
  
  // Ripristina stile
  if (style.fillColor && style.fillColor !== 'none') {
    ctx.fillStyle = style.fillColor;
  } else {
    ctx.fillStyle = style.strokeColor || '#000000';
  }
  
  // Disegna testo
  ctx.textAlign = 'center';
  ctx.fillText(displayText, textX, textY);
  
  // Se selezionato, disegna maniglie di controllo
  if (isSelected) {
    // Ripristina lo stile originale
    ctx.strokeStyle = originalStrokeStyle;
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.lineWidth -= 0.5;
    
    // Maniglie di controllo
    ctx.fillStyle = '#1890ff';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    
    // Vertice
    ctx.beginPath();
    ctx.arc(vertex?.x, vertex?.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Punti di inizio e fine
    ctx.beginPath();
    ctx.arc(startPoint?.x, startPoint?.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(endPoint?.x, endPoint?.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Punto per il raggio
    const radiusPoint = {
      x: vertex?.x + r * Math.cos(midAngle),
      y: vertex?.y + r * Math.sin(midAngle)
    };
    
    ctx.beginPath();
    ctx.arc(radiusPoint?.x, radiusPoint?.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#52c41a';  // Verde per punto del raggio
    ctx.fill();
    ctx.stroke();
    
    // Punto per il testo
    ctx.beginPath();
    ctx.arc(textX, textY, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#ff4d4f';  // Rosso per punto del testo
    ctx.fill();
    ctx.stroke();
  }
}

/**
 * Renderizza una quota radiale sul canvas
 */
export function renderRadialDimension(ctx: CanvasRenderingContext2D, entity: RadialDimension, isSelected: boolean = false): void {
  const { center, pointOnCircle, text, leader, style } = entity;
  
  const originalStrokeStyle = applyStyle(ctx, style, isSelected);
  
  // Calcola il raggio
  const dx = pointOnCircle?.x - center?.x;
  const dy = pointOnCircle?.y - center?.y;
  const radius = Math.sqrt(dx * dx + dy * dy);
  
  // Calcola l'angolo per il testo
  const angle = Math.atan2(dy, dx);
  
  // Disegna la linea di leader se richiesto
  if (leader) {
    const leaderLength = radius * 0.3;
    const leaderEndX = center?.x + (radius + leaderLength) * Math.cos(angle);
    const leaderEndY = center?.y + (radius + leaderLength) * Math.sin(angle);
    
    ctx.beginPath();
    ctx.moveTo(center?.x, center?.y);
    ctx.lineTo(pointOnCircle?.x, pointOnCircle?.y);
    ctx.lineTo(leaderEndX, leaderEndY);
    ctx.stroke();
    
    // Testo alla fine del leader
    const displayText = text || `R${radius.toFixed(1)}`;
    
    // Allineamento del testo in base al quadrante
    if (angle >= -Math.PI/4 && angle < Math.PI/4) {
      // Destra
      ctx.textAlign = 'left';
      ctx.fillText(displayText, leaderEndX + 5, leaderEndY);
    } else if (angle >= Math.PI/4 && angle < 3*Math.PI/4) {
      // Sotto
      ctx.textAlign = 'center';
      ctx.fillText(displayText, leaderEndX, leaderEndY + 15);
    } else if ((angle >= 3*Math.PI/4 && angle <= Math.PI) || (angle >= -Math.PI && angle < -3*Math.PI/4)) {
      // Sinistra
      ctx.textAlign = 'right';
      ctx.fillText(displayText, leaderEndX - 5, leaderEndY);
    } else {
      // Sopra
      ctx.textAlign = 'center';
      ctx.fillText(displayText, leaderEndX, leaderEndY - 5);
    }
  } else {
    // Disegna solo la linea radiale
    ctx.beginPath();
    ctx.moveTo(center?.x, center?.y);
    ctx.lineTo(pointOnCircle?.x, pointOnCircle?.y);
    ctx.stroke();
    
    // Testo vicino al punto sulla circonferenza
    const displayText = text || `R${radius.toFixed(1)}`;
    
    const textOffset = 10;
    const textX = center?.x + (radius + textOffset) * Math.cos(angle);
    const textY = center?.y + (radius + textOffset) * Math.sin(angle);
    
    // Sfondo testo per leggibilità
    const textMetrics = ctx.measureText(displayText);
    ctx.fillStyle = 'white';
    ctx.fillRect(
      textX - textMetrics.width/2 - 2,
      textY - (style.fontSize || 12) / 2,
      textMetrics.width + 4,
      (style.fontSize || 12) + 4
    );
    
    // Ripristina stile
    if (style.fillColor && style.fillColor !== 'none') {
      ctx.fillStyle = style.fillColor;
    } else {
      ctx.fillStyle = style.strokeColor || '#000000';
    }
    
    ctx.textAlign = 'center';
    ctx.fillText(displayText, textX, textY);
  }
  
  // Se selezionato, disegna maniglie di controllo
  if (isSelected) {
    // Ripristina lo stile originale
    ctx.strokeStyle = originalStrokeStyle;
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.lineWidth -= 0.5;
    
    // Maniglie di controllo
    ctx.fillStyle = '#1890ff';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    
    // Centro
    ctx.beginPath();
    ctx.arc(center?.x, center?.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Punto sulla circonferenza
    ctx.beginPath();
    ctx.arc(pointOnCircle?.x, pointOnCircle?.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    if (leader) {
      // Punto leader
      const leaderLength = radius * 0.3;
      const leaderEndX = center?.x + (radius + leaderLength) * Math.cos(angle);
      const leaderEndY = center?.y + (radius + leaderLength) * Math.sin(angle);
      
      ctx.beginPath();
      ctx.arc(leaderEndX, leaderEndY, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#ff4d4f';  // Rosso per punto del testo
      ctx.fill();
      ctx.stroke();
    }
  }
}

/**
 * Renderizza una quota diametrale sul canvas
 */
export function renderDiameterDimension(ctx: CanvasRenderingContext2D, entity: DiameterDimension, isSelected: boolean = false): void {
  const { center, pointOnCircle, text, leader, style } = entity;
  
  const originalStrokeStyle = applyStyle(ctx, style, isSelected);
  
  // Calcola il diametro
  const dx = pointOnCircle?.x - center?.x;
  const dy = pointOnCircle?.y - center?.y;
  const radius = Math.sqrt(dx * dx + dy * dy);
  const diameter = radius * 2;
  
  // Calcola l'angolo e il punto opposto
  const angle = Math.atan2(dy, dx);
  const oppositeX = center?.x - radius * Math.cos(angle);
  const oppositeY = center?.y - radius * Math.sin(angle);
  
  // Disegna la linea diametrale
  ctx.beginPath();
  
  if (leader) {
    // Con leader, disegna una linea che esce dalla circonferenza
    const leaderLength = radius * 0.3;
    const leaderEndX = center?.x + (radius + leaderLength) * Math.cos(angle);
    const leaderEndY = center?.y + (radius + leaderLength) * Math.sin(angle);
    
    ctx.moveTo(oppositeX, oppositeY);
    ctx.lineTo(pointOnCircle?.x, pointOnCircle?.y);
    ctx.lineTo(leaderEndX, leaderEndY);
  } else {
    // Senza leader, disegna semplicemente la linea attraverso il cerchio
    ctx.moveTo(oppositeX, oppositeY);
    ctx.lineTo(pointOnCircle?.x, pointOnCircle?.y);
  }
  
  ctx.stroke();
  
  // Simbolo diametro e testo
  const displayText = text || `Ø${diameter.toFixed(1)}`;
  
  if (leader) {
    // Testo alla fine del leader
    const leaderLength = radius * 0.3;
    const leaderEndX = center?.x + (radius + leaderLength) * Math.cos(angle);
    const leaderEndY = center?.y + (radius + leaderLength) * Math.sin(angle);
    
    // Allineamento del testo in base al quadrante
    if (angle >= -Math.PI/4 && angle < Math.PI/4) {
      // Destra
      ctx.textAlign = 'left';
      ctx.fillText(displayText, leaderEndX + 5, leaderEndY);
    } else if (angle >= Math.PI/4 && angle < 3*Math.PI/4) {
      // Sotto
      ctx.textAlign = 'center';
      ctx.fillText(displayText, leaderEndX, leaderEndY + 15);
    } else if ((angle >= 3*Math.PI/4 && angle <= Math.PI) || (angle >= -Math.PI && angle < -3*Math.PI/4)) {
      // Sinistra
      ctx.textAlign = 'right';
      ctx.fillText(displayText, leaderEndX - 5, leaderEndY);
    } else {
      // Sopra
      ctx.textAlign = 'center';
      ctx.fillText(displayText, leaderEndX, leaderEndY - 5);
    }
  } else {
    // Testo centrato sulla linea diametrale
    const textX = center?.x;
    const textY = center?.y - 5;  // Leggermente sopra il centro
    
    // Sfondo testo per leggibilità
    const textMetrics = ctx.measureText(displayText);
    ctx.fillStyle = 'white';
    ctx.fillRect(
      textX - textMetrics.width/2 - 2,
      textY - (style.fontSize || 12) / 2,
      textMetrics.width + 4,
      (style.fontSize || 12) + 4
    );
    
    // Ripristina stile
    if (style.fillColor && style.fillColor !== 'none') {
      ctx.fillStyle = style.fillColor;
    } else {
      ctx.fillStyle = style.strokeColor || '#000000';
    }
    
    ctx.textAlign = 'center';
    ctx.fillText(displayText, textX, textY);
  }
  
  // Se selezionato, disegna maniglie di controllo
  if (isSelected) {
    // Ripristina lo stile originale
    ctx.strokeStyle = originalStrokeStyle;
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.lineWidth -= 0.5;
    
    // Maniglie di controllo
    ctx.fillStyle = '#1890ff';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    
    // Centro
    ctx.beginPath();
    ctx.arc(center?.x, center?.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Punto sulla circonferenza
    ctx.beginPath();
    ctx.arc(pointOnCircle?.x, pointOnCircle?.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Punto opposto
    ctx.beginPath();
    ctx.arc(oppositeX, oppositeY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    if (leader) { 
      // Punto leader
      const leaderLength = radius * 0.3;
      const leaderEndX = center?.x + (radius + leaderLength) * Math.cos(angle);
      const leaderEndY = center?.y + (radius + leaderLength) * Math.sin(angle);
      
      ctx.beginPath();
      ctx.arc(leaderEndX, leaderEndY, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#ff4d4f';  // Rosso per punto del testo
      ctx.fill();
      ctx.stroke();
    }
  }
}

/**
 * Funzione principale di rendering per qualsiasi tipo di entità
 */
export function renderEntity(ctx: CanvasRenderingContext2D, entity: AnyEntity, isSelected: boolean = false): void {
  // Controllo di sicurezza per entità non valide
  if (!entity) return;

  // Renderizza in base al tipo di entità
  switch(entity.type) {
    // Entità di disegno
    case DrawingEntityType.LINE:
      renderLine(ctx, entity as LineEntity, isSelected);
      break;
    case DrawingEntityType.CIRCLE:
      renderCircle(ctx, entity as CircleEntity, isSelected);
      break;
    case DrawingEntityType.ARC:
      renderArc(ctx, entity as ArcEntity, isSelected);
      break;
    case DrawingEntityType.RECTANGLE:
      renderRectangle(ctx, entity as RectangleEntity, isSelected);
      break;
    case DrawingEntityType.POLYLINE:
      renderPolyline(ctx, entity as PolylineEntity, isSelected);
      break;
    case DrawingEntityType.ELLIPSE:
      renderEllipse(ctx, entity as EllipseEntity, isSelected);
      break;
    case DrawingEntityType.SPLINE:
      renderSpline(ctx, entity as SplineEntity, isSelected);
      break;
    case DrawingEntityType.POLYGON:
      renderPolygon(ctx, entity as PolygonEntity, isSelected);
      break;
    case DrawingEntityType.PATH:
      renderPath(ctx, entity as PathEntity, isSelected);
      break;
    case DrawingEntityType.HATCH:
      renderHatch(ctx, entity as HatchEntity, isSelected);
      break;
      
    // Quote
    case DimensionType.LINEAR:
      renderLinearDimension(ctx, entity as LinearDimension, isSelected);
      break;
    case DimensionType.ANGULAR:
      renderAngularDimension(ctx, entity as AngularDimension, isSelected);
      break;
    case DimensionType.RADIAL:
      renderRadialDimension(ctx, entity as RadialDimension, isSelected);
      break;
    case DimensionType.DIAMETRICAL:
      renderDiameterDimension(ctx, entity as unknown as DiameterDimension, isSelected);
      break;
      
    // Annotazioni
    case AnnotationType.TEXT:
      renderTextAnnotation(ctx, entity as TextAnnotation, isSelected);
      break;
      
    default:
      console.warn(`Tipo di entità non supportato: ${entity.type}`);
      break;
  }
}