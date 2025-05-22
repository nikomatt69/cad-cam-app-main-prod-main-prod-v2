import { Point, DrawingStyle, BaseDrawingEntity } from '../TechnicalDrawingTypes';

// Tipi per le annotazioni intelligenti
export interface SmartAnnotation extends BaseDrawingEntity {
  type: 'smart-text' | 'smart-leader' | 'smart-callout' | 'smart-balloon';
  content: string;
  position: Point;
  textStyle: TextStyle;
  leaderStyle?: LeaderStyle;
  autoPosition: boolean;
  attachedToEntityId?: string;
  attachmentPoint?: Point;
  priority: number; // Per gestire sovrapposizioni
}

export interface TextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textAlign: 'left' | 'center' | 'right';
  textBaseline: 'top' | 'middle' | 'bottom';
  color: string;
  backgroundColor?: string;
  padding: number;
  borderRadius: number;
  border?: {
    width: number;
    color: string;
    style: 'solid' | 'dashed' | 'dotted';
  };
}

export interface LeaderStyle {
  type: 'straight' | 'spline' | 'arc';
  arrowType: 'arrow' | 'dot' | 'slash' | 'none';
  arrowSize: number;
  lineStyle: {
    color: string;
    width: number;
    dashPattern?: number[];
  };
  points: Point[];
  autoBreakout: boolean; // Evita automaticamente sovrapposizioni
}

export interface AnnotationConstraint {
  type: 'min-distance' | 'max-distance' | 'avoid-entity' | 'prefer-side' | 'align-with';
  entityId?: string;
  distance?: number;
  side?: 'top' | 'bottom' | 'left' | 'right';
  priority: number;
}

export interface SmartCallout extends SmartAnnotation {
  type: 'smart-callout';
  calloutShape: 'rectangle' | 'circle' | 'cloud' | 'polygon';
  calloutSize: { width: number; height: number };
  pointerPosition: 'auto' | 'top' | 'bottom' | 'left' | 'right';
}

export interface SmartBalloon extends SmartAnnotation {
  type: 'smart-balloon';
  shape: 'circle' | 'triangle' | 'square' | 'diamond' | 'hexagon';
  size: number;
  itemNumber: string | number;
  showLeader: boolean;
}

export class SmartAnnotationSystem {
  private annotations: Map<string, SmartAnnotation> = new Map();
  private entityBounds: Map<string, { minX: number; minY: number; maxX: number; maxY: number }> = new Map();
  private constraints: Map<string, AnnotationConstraint[]> = new Map();
  private canvasSize: { width: number; height: number } = { width: 1000, height: 1000 };

  /**
   * Aggiunge una nuova annotazione intelligente
   */
  addAnnotation(annotation: SmartAnnotation): void {
    this.annotations.set(annotation.id, annotation);
    
    if (annotation.autoPosition) {
      this.calculateOptimalPosition(annotation);
    }
    
    this.resolveOverlaps();
  }

  /**
   * Rimuove un'annotazione
   */
  removeAnnotation(id: string): void {
    this.annotations.delete(id);
    this.constraints.delete(id);
    this.resolveOverlaps();
  }

  /**
   * Aggiorna i bounds delle entità per il posizionamento automatico
   */
  updateEntityBounds(bounds: Map<string, { minX: number; minY: number; maxX: number; maxY: number }>): void {
    this.entityBounds = bounds;
    
    // Ricalcola le posizioni per le annotazioni con autoPosition
    this.annotations.forEach(annotation => {
      if (annotation.autoPosition) {
        this.calculateOptimalPosition(annotation);
      }
    });
    
    this.resolveOverlaps();
  }

  /**
   * Imposta la dimensione del canvas
   */
  setCanvasSize(width: number, height: number): void {
    this.canvasSize = { width, height };
  }

  /**
   * Calcola la posizione ottimale per un'annotazione
   */
  private calculateOptimalPosition(annotation: SmartAnnotation): void {
    if (!annotation.attachedToEntityId) return;
    
    const entityBounds = this.entityBounds.get(annotation.attachedToEntityId);
    if (!entityBounds) return;

    // Calcola le possibili posizioni intorno all'entità
    const candidates = this.generatePositionCandidates(entityBounds, annotation);
    
    // Valuta ogni candidato e scegli il migliore
    const bestPosition = this.evaluatePositionCandidates(candidates, annotation);
    
    if (bestPosition) {
      annotation.position = bestPosition.position;
      
      // Aggiorna il leader se presente
      if (annotation.leaderStyle) {
        annotation.leaderStyle.points = bestPosition.leaderPoints || [];
      }
    }
  }

  /**
   * Genera candidati di posizione intorno a un'entità
   */
  private generatePositionCandidates(
    entityBounds: { minX: number; minY: number; maxX: number; maxY: number },
    annotation: SmartAnnotation
  ): PositionCandidate[] {
    const candidates: PositionCandidate[] = [];
    const margin = 20; // Margine minimo dall'entità
    const textBounds = this.calculateTextBounds(annotation);
    
    // Posizioni standard intorno all'entità
    const positions = [
      // Sopra
      {
        x: (entityBounds.minX + entityBounds.maxX) / 2,
        y: entityBounds.minY - margin - textBounds.height / 2,
        side: 'top' as const
      },
      // Sotto
      {
        x: (entityBounds.minX + entityBounds.maxX) / 2,
        y: entityBounds.maxY + margin + textBounds.height / 2,
        side: 'bottom' as const
      },
      // Sinistra
      {
        x: entityBounds.minX - margin - textBounds.width / 2,
        y: (entityBounds.minY + entityBounds.maxY) / 2,
        side: 'left' as const
      },
      // Destra
      {
        x: entityBounds.maxX + margin + textBounds.width / 2,
        y: (entityBounds.minY + entityBounds.maxY) / 2,
        side: 'right' as const
      },
      // Diagonali (per evitare sovrapposizioni)
      {
        x: entityBounds.maxX + margin,
        y: entityBounds.minY - margin,
        side: 'top-right' as const
      },
      {
        x: entityBounds.maxX + margin,
        y: entityBounds.maxY + margin,
        side: 'bottom-right' as const
      },
      {
        x: entityBounds.minX - margin,
        y: entityBounds.minY - margin,
        side: 'top-left' as const
      },
      {
        x: entityBounds.minX - margin,
        y: entityBounds.maxY + margin,
        side: 'bottom-left' as const
      }
    ];

    positions.forEach(pos => {
      // Verifica che la posizione sia dentro il canvas
      if (pos.x >= textBounds.width / 2 && 
          pos.x <= this.canvasSize.width - textBounds.width / 2 &&
          pos.y >= textBounds.height / 2 && 
          pos.y <= this.canvasSize.height - textBounds.height / 2) {
        
        candidates.push({
          position: { x: pos.x, y: pos.y },
          side: pos.side,
          leaderPoints: this.calculateLeaderPoints(
            { x: pos.x, y: pos.y },
            annotation.attachmentPoint || {
              x: (entityBounds.minX + entityBounds.maxX) / 2,
              y: (entityBounds.minY + entityBounds.maxY) / 2
            },
            annotation.leaderStyle
          ),
          score: 0 // Sarà calcolato dopo
        });
      }
    });

    return candidates;
  }

  /**
   * Valuta i candidati di posizione e restituisce il migliore
   */
  private evaluatePositionCandidates(
    candidates: PositionCandidate[],
    annotation: SmartAnnotation
  ): PositionCandidate | null {
    if (candidates.length === 0) return null;

    candidates.forEach(candidate => {
      candidate.score = this.scorePosition(candidate, annotation);
    });

    // Ordina per score decrescente
    candidates.sort((a, b) => b.score - a.score);
    
    return candidates[0];
  }

  /**
   * Calcola il punteggio per una posizione candidata
   */
  private scorePosition(candidate: PositionCandidate, annotation: SmartAnnotation): number {
    let score = 100; // Punteggio base
    
    const textBounds = this.calculateTextBounds(annotation);
    const annotationRect = {
      minX: candidate.position.x - textBounds.width / 2,
      maxX: candidate.position.x + textBounds.width / 2,
      minY: candidate.position.y - textBounds.height / 2,
      maxY: candidate.position.y + textBounds.height / 2
    };

    // Penalizza le sovrapposizioni con altre annotazioni
    this.annotations.forEach(otherAnnotation => {
      if (otherAnnotation.id === annotation.id) return;
      
      const otherBounds = this.calculateTextBounds(otherAnnotation);
      const otherRect = {
        minX: otherAnnotation.position.x - otherBounds.width / 2,
        maxX: otherAnnotation.position.x + otherBounds.width / 2,
        minY: otherAnnotation.position.y - otherBounds.height / 2,
        maxY: otherAnnotation.position.y + otherBounds.height / 2
      };

      const overlap = this.calculateRectOverlap(annotationRect, otherRect);
      if (overlap > 0) {
        score -= overlap * 10; // Penalità forte per sovrapposizioni
      }
    });

    // Penalizza le sovrapposizioni con le entità
    this.entityBounds.forEach(entityBounds => {
      const overlap = this.calculateRectOverlap(annotationRect, entityBounds);
      if (overlap > 0) {
        score -= overlap * 5; // Penalità media per sovrapposizioni con entità
      }
    });

    // Premia le posizioni che rispettano i vincoli
    const annotationConstraints = this.constraints.get(annotation.id) || [];
    annotationConstraints.forEach(constraint => {
      if (constraint.type === 'prefer-side' && constraint.side === candidate.side) {
        score += constraint.priority;
      }
    });

    // Premia le posizioni centrali (evita gli angoli)
    const centerX = this.canvasSize.width / 2;
    const centerY = this.canvasSize.height / 2;
    const distanceFromCenter = Math.sqrt(
      Math.pow(candidate.position.x - centerX, 2) + 
      Math.pow(candidate.position.y - centerY, 2)
    );
    const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
    score += (1 - distanceFromCenter / maxDistance) * 10;

    // Premia le posizioni con leader più corti
    if (candidate.leaderPoints && candidate.leaderPoints.length >= 2) {
      const leaderLength = this.calculateLeaderLength(candidate.leaderPoints);
      score -= leaderLength * 0.01; // Penalità piccola per leader lunghi
    }

    return score;
  }

  /**
   * Calcola i punti del leader line
   */
  private calculateLeaderPoints(
    startPoint: Point,
    endPoint: Point,
    leaderStyle?: LeaderStyle
  ): Point[] {
    if (!leaderStyle) return [startPoint, endPoint];

    switch (leaderStyle.type) {
      case 'straight':
        return [startPoint, endPoint];
        
      case 'spline':
        // Per ora, una curva semplice a 3 punti
        const midPoint = {
          x: (startPoint.x + endPoint.x) / 2,
          y: (startPoint.y + endPoint.y) / 2 - 20 // Offset per curvatura
        };
        return [startPoint, midPoint, endPoint];
        
      case 'arc':
        // Implementazione semplificata di un arco
        return this.generateArcPoints(startPoint, endPoint);
        
      default:
        return [startPoint, endPoint];
    }
  }

  /**
   * Genera punti per un arco
   */
  private generateArcPoints(start: Point, end: Point): Point[] {
    const points: Point[] = [start];
    const steps = 10;
    
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const x = start.x + (end.x - start.x) * t;
      const y = start.y + (end.y - start.y) * t - Math.sin(t * Math.PI) * 20;
      points.push({ x, y });
    }
    
    points.push(end);
    return points;
  }

  /**
   * Calcola le dimensioni del testo per un'annotazione
   */
  private calculateTextBounds(annotation: SmartAnnotation): { width: number; height: number } {
    // Stima approssimativa - in un'implementazione reale useresti un canvas per misurare
    const charWidth = annotation.textStyle.fontSize * 0.6;
    const lineHeight = annotation.textStyle.fontSize * 1.2;
    const lines = annotation.content.split('\n');
    const maxLineLength = Math.max(...lines.map(line => line.length));
    
    return {
      width: maxLineLength * charWidth + annotation.textStyle.padding * 2,
      height: lines.length * lineHeight + annotation.textStyle.padding * 2
    };
  }

  /**
   * Calcola l'overlap tra due rettangoli
   */
  private calculateRectOverlap(
    rect1: { minX: number; maxX: number; minY: number; maxY: number },
    rect2: { minX: number; maxX: number; minY: number; maxY: number }
  ): number {
    const overlapX = Math.max(0, Math.min(rect1.maxX, rect2.maxX) - Math.max(rect1.minX, rect2.minX));
    const overlapY = Math.max(0, Math.min(rect1.maxY, rect2.maxY) - Math.max(rect1.minY, rect2.minY));
    return overlapX * overlapY;
  }

  /**
   * Calcola la lunghezza totale di un leader
   */
  private calculateLeaderLength(points: Point[]): number {
    let length = 0;
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i-1].x;
      const dy = points[i].y - points[i-1].y;
      length += Math.sqrt(dx * dx + dy * dy);
    }
    return length;
  }

  /**
   * Risolve le sovrapposizioni tra annotazioni
   */
  private resolveOverlaps(): void {
    const annotations = Array.from(this.annotations.values());
    const moved = new Set<string>();

    // Ordina per priorità
    annotations.sort((a, b) => b.priority - a.priority);

    for (let i = 0; i < annotations.length; i++) {
      const annotation = annotations[i];
      if (moved.has(annotation.id) || !annotation.autoPosition) continue;

      const textBounds = this.calculateTextBounds(annotation);
      const annotationRect = {
        minX: annotation.position.x - textBounds.width / 2,
        maxX: annotation.position.x + textBounds.width / 2,
        minY: annotation.position.y - textBounds.height / 2,
        maxY: annotation.position.y + textBounds.height / 2
      };

      // Cerca sovrapposizioni con annotazioni di priorità più alta
      for (let j = 0; j < i; j++) {
        const otherAnnotation = annotations[j];
        const otherBounds = this.calculateTextBounds(otherAnnotation);
        const otherRect = {
          minX: otherAnnotation.position.x - otherBounds.width / 2,
          maxX: otherAnnotation.position.x + otherBounds.width / 2,
          minY: otherAnnotation.position.y - otherBounds.height / 2,
          maxY: otherAnnotation.position.y + otherBounds.height / 2
        };

        const overlap = this.calculateRectOverlap(annotationRect, otherRect);
        if (overlap > 0) {
          // Sposta l'annotazione corrente
          this.moveAnnotationAwayFrom(annotation, otherAnnotation);
          moved.add(annotation.id);
          break;
        }
      }
    }
  }

  /**
   * Sposta un'annotazione lontano da un'altra
   */
  private moveAnnotationAwayFrom(annotation: SmartAnnotation, otherAnnotation: SmartAnnotation): void {
    const dx = annotation.position.x - otherAnnotation.position.x;
    const dy = annotation.position.y - otherAnnotation.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance === 0) {
      // Se sono nella stessa posizione, sposta casualmente
      annotation.position.x += (Math.random() - 0.5) * 100;
      annotation.position.y += (Math.random() - 0.5) * 100;
      return;
    }

    const textBounds = this.calculateTextBounds(annotation);
    const otherBounds = this.calculateTextBounds(otherAnnotation);
    const minDistance = Math.max(textBounds.width, textBounds.height, otherBounds.width, otherBounds.height) / 2 + 10;

    const unitX = dx / distance;
    const unitY = dy / distance;

    annotation.position.x = otherAnnotation.position.x + unitX * minDistance;
    annotation.position.y = otherAnnotation.position.y + unitY * minDistance;

    // Assicurati che rimanga nel canvas
    const halfWidth = textBounds.width / 2;
    const halfHeight = textBounds.height / 2;
    
    annotation.position.x = Math.max(halfWidth, Math.min(this.canvasSize.width - halfWidth, annotation.position.x));
    annotation.position.y = Math.max(halfHeight, Math.min(this.canvasSize.height - halfHeight, annotation.position.y));
  }

  /**
   * Aggiunge un vincolo per un'annotazione
   */
  addConstraint(annotationId: string, constraint: AnnotationConstraint): void {
    if (!this.constraints.has(annotationId)) {
      this.constraints.set(annotationId, []);
    }
    this.constraints.get(annotationId)!.push(constraint);
  }

  /**
   * Rimuove tutti i vincoli per un'annotazione
   */
  clearConstraints(annotationId: string): void {
    this.constraints.delete(annotationId);
  }

  /**
   * Ottiene tutte le annotazioni
   */
  getAllAnnotations(): SmartAnnotation[] {
    return Array.from(this.annotations.values());
  }

  /**
   * Ottiene un'annotazione per ID
   */
  getAnnotation(id: string): SmartAnnotation | undefined {
    return this.annotations.get(id);
  }

  /**
   * Renderizza tutte le annotazioni su un canvas
   */
  renderAnnotations(ctx: CanvasRenderingContext2D): void {
    this.annotations.forEach(annotation => {
      this.renderAnnotation(ctx, annotation);
    });
  }

  /**
   * Renderizza una singola annotazione
   */
  private renderAnnotation(ctx: CanvasRenderingContext2D, annotation: SmartAnnotation): void {
    ctx.save();

    // Disegna il leader se presente
    if (annotation.leaderStyle && annotation.leaderStyle.points.length >= 2) {
      this.renderLeader(ctx, annotation.leaderStyle);
    }

    // Disegna l'annotazione in base al tipo
    switch (annotation.type) {
      case 'smart-text':
        this.renderSmartText(ctx, annotation);
        break;
      case 'smart-callout':
        this.renderSmartCallout(ctx, annotation as SmartCallout);
        break;
      case 'smart-balloon':
        this.renderSmartBalloon(ctx, annotation as SmartBalloon);
        break;
    }

    ctx.restore();
  }

  /**
   * Renderizza un leader line
   */
  private renderLeader(ctx: CanvasRenderingContext2D, leaderStyle: LeaderStyle): void {
    const { points, lineStyle, arrowType, arrowSize } = leaderStyle;
    if (points.length < 2) return;

    // Disegna la linea
    ctx.strokeStyle = lineStyle.color;
    ctx.lineWidth = lineStyle.width;
    
    if (lineStyle.dashPattern) {
      ctx.setLineDash(lineStyle.dashPattern);
    }

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    
    ctx.stroke();
    ctx.setLineDash([]);

    // Disegna la freccia
    if (arrowType !== 'none' && points.length >= 2) {
      this.renderArrow(ctx, points[points.length - 2], points[points.length - 1], arrowType, arrowSize, lineStyle.color);
    }
  }

  /**
   * Renderizza una freccia
   */
  private renderArrow(
    ctx: CanvasRenderingContext2D,
    start: Point,
    end: Point,
    arrowType: string,
    arrowSize: number,
    color: string
  ): void {
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    
    ctx.fillStyle = color;
    ctx.strokeStyle = color;

    switch (arrowType) {
      case 'arrow':
        ctx.beginPath();
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(
          end.x - arrowSize * Math.cos(angle - Math.PI / 6),
          end.y - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          end.x - arrowSize * Math.cos(angle + Math.PI / 6),
          end.y - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
        break;
        
      case 'dot':
        ctx.beginPath();
        ctx.arc(end.x, end.y, arrowSize / 2, 0, Math.PI * 2);
        ctx.fill();
        break;
        
      case 'slash':
        ctx.beginPath();
        ctx.moveTo(
          end.x - arrowSize / 2 * Math.cos(angle + Math.PI / 2),
          end.y - arrowSize / 2 * Math.sin(angle + Math.PI / 2)
        );
        ctx.lineTo(
          end.x + arrowSize / 2 * Math.cos(angle + Math.PI / 2),
          end.y + arrowSize / 2 * Math.sin(angle + Math.PI / 2)
        );
        ctx.stroke();
        break;
    }
  }

  /**
   * Renderizza testo intelligente
   */
  private renderSmartText(ctx: CanvasRenderingContext2D, annotation: SmartAnnotation): void {
    const { position, content, textStyle } = annotation;

    // Imposta il font
    ctx.font = `${textStyle.fontWeight} ${textStyle.fontStyle} ${textStyle.fontSize}px ${textStyle.fontFamily}`;
    ctx.textAlign = textStyle.textAlign;
    ctx.textBaseline = textStyle.textBaseline;
    ctx.fillStyle = textStyle.color;

    // Disegna il background se presente
    if (textStyle.backgroundColor) {
      const textBounds = this.calculateTextBounds(annotation);
      ctx.fillStyle = textStyle.backgroundColor;
      
      const x = position.x - textBounds.width / 2;
      const y = position.y - textBounds.height / 2;
      
      if (textStyle.borderRadius > 0) {
        this.roundRect(ctx, x, y, textBounds.width, textBounds.height, textStyle.borderRadius);
      } else {
        ctx.fillRect(x, y, textBounds.width, textBounds.height);
      }
      
      // Disegna il bordo se presente
      if (textStyle.border) {
        ctx.strokeStyle = textStyle.border.color;
        ctx.lineWidth = textStyle.border.width;
        ctx.setLineDash(textStyle.border.style === 'dashed' ? [5, 5] : []);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Disegna il testo
    ctx.fillStyle = textStyle.color;
    const lines = content.split('\n');
    const lineHeight = textStyle.fontSize * 1.2;
    
    lines.forEach((line, index) => {
      const y = position.y + (index - (lines.length - 1) / 2) * lineHeight;
      ctx.fillText(line, position.x, y);
    });
  }

  /**
   * Renderizza un callout intelligente
   */
  private renderSmartCallout(ctx: CanvasRenderingContext2D, callout: SmartCallout): void {
    // Prima renderizza la forma del callout
    const { position, calloutShape, calloutSize } = callout;
    
    ctx.fillStyle = callout.textStyle.backgroundColor || '#ffffff';
    ctx.strokeStyle = callout.textStyle.border?.color || '#000000';
    ctx.lineWidth = callout.textStyle.border?.width || 1;

    const halfWidth = calloutSize.width / 2;
    const halfHeight = calloutSize.height / 2;

    switch (calloutShape) {
      case 'rectangle':
        if (callout.textStyle.borderRadius > 0) {
          this.roundRect(ctx, position.x - halfWidth, position.y - halfHeight, calloutSize.width, calloutSize.height, callout.textStyle.borderRadius);
        } else {
          ctx.fillRect(position.x - halfWidth, position.y - halfHeight, calloutSize.width, calloutSize.height);
          ctx.strokeRect(position.x - halfWidth, position.y - halfHeight, calloutSize.width, calloutSize.height);
        }
        break;
        
      case 'circle':
        ctx.beginPath();
        ctx.arc(position.x, position.y, Math.min(halfWidth, halfHeight), 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        break;
        
      case 'cloud':
        this.drawCloud(ctx, position, calloutSize);
        break;
    }
    
    // Poi renderizza il testo sopra
    this.renderSmartText(ctx, callout);
  }

  /**
   * Renderizza un balloon intelligente
   */
  private renderSmartBalloon(ctx: CanvasRenderingContext2D, balloon: SmartBalloon): void {
    const { position, shape, size, itemNumber } = balloon;
    
    ctx.fillStyle = balloon.textStyle.backgroundColor || '#ffffff';
    ctx.strokeStyle = balloon.textStyle.border?.color || '#000000';
    ctx.lineWidth = balloon.textStyle.border?.width || 1;

    const radius = size / 2;

    switch (shape) {
      case 'circle':
        ctx.beginPath();
        ctx.arc(position.x, position.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        break;
        
      case 'triangle':
        this.drawPolygon(ctx, position, radius, 3);
        break;
        
      case 'square':
        ctx.fillRect(position.x - radius, position.y - radius, size, size);
        ctx.strokeRect(position.x - radius, position.y - radius, size, size);
        break;
        
      case 'diamond':
        this.drawPolygon(ctx, position, radius, 4, Math.PI / 4);
        break;
        
      case 'hexagon':
        this.drawPolygon(ctx, position, radius, 6);
        break;
    }

    // Disegna il numero/testo del balloon
    ctx.fillStyle = balloon.textStyle.color;
    ctx.font = `${balloon.textStyle.fontWeight} ${balloon.textStyle.fontSize}px ${balloon.textStyle.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(itemNumber.toString(), position.x, position.y);
  }

  // Utility functions
  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  private drawPolygon(ctx: CanvasRenderingContext2D, center: Point, radius: number, sides: number, rotation: number = 0): void {
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const angle = (i * 2 * Math.PI / sides) + rotation;
      const x = center.x + radius * Math.cos(angle);
      const y = center.y + radius * Math.sin(angle);
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  private drawCloud(ctx: CanvasRenderingContext2D, center: Point, size: { width: number; height: number }): void {
    // Implementazione semplificata di una nuvola
    const numCircles = 6;
    const baseRadius = Math.min(size.width, size.height) / 6;
    
    ctx.beginPath();
    for (let i = 0; i < numCircles; i++) {
      const angle = (i * 2 * Math.PI / numCircles);
      const x = center.x + (size.width / 3) * Math.cos(angle);
      const y = center.y + (size.height / 3) * Math.sin(angle);
      const radius = baseRadius * (0.8 + Math.random() * 0.4);
      
      ctx.arc(x, y, radius, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.stroke();
  }
}

// Interfaccia per i candidati di posizione
interface PositionCandidate {
  position: Point;
  side: string;
  leaderPoints?: Point[];
  score: number;
}

export default SmartAnnotationSystem;