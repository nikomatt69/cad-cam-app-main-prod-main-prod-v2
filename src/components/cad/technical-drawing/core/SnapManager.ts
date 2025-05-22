// src/components/cad/technical-drawing/core/SnapManager.ts
// Gestore avanzato del sistema di snap per disegno tecnico

import { 
  Point, 
  SnapType,
  LineEntity,
  CircleEntity,
  ArcEntity,
  RectangleEntity,
  PolylineEntity,
  EllipseEntity,
  SplineEntity,
  PolygonEntity,
  AnyEntity
} from '../../TechnicalDrawingTypes';

export interface SnapPoint {
  x: number;
  y: number;
  type: SnapType;
  distance: number;
  entityId?: string;
  priority: number; // Priorità più alta = snap preferito in caso di punti multipli vicini
}

export interface SnapOptions {
  endpoint: boolean;
  midpoint: boolean;
  center: boolean;
  quadrant: boolean;
  intersection: boolean;
  grid: boolean;
  nearest: boolean;
  perpendicular: boolean;
  tangent: boolean;
  extension: boolean;
  parallel: boolean;
  polar: boolean;
}

export interface SnapManagerParams {
  entities: Record<string, AnyEntity>;
  dimensions: Record<string, AnyEntity>;
  annotations: Record<string, AnyEntity>;
  gridSize: number;
  snapRadius: number; // Raggio in pixel per lo snap
  snapOptions: SnapOptions;
  polarAngles?: number[]; // Angoli per lo snap polare (es. [0, 45, 90, 135, ...])
  polarRadius?: number; // Raggio massimo per linee di tracking polare
  referencePoints?: Point[]; // Punti di riferimento per estensioni e tracking
}

export class SnapManager {
  private entities: Record<string, AnyEntity>;
  private dimensions: Record<string, AnyEntity>;
  private annotations: Record<string, AnyEntity>;
  private gridSize: number;
  private snapRadius: number;
  private snapOptions: SnapOptions;
  private polarAngles: number[];
  private polarRadius: number;
  private referencePoints: Point[];
  
  constructor(params: SnapManagerParams) {
    this.entities = params.entities;
    this.dimensions = params.dimensions;
    this.annotations = params.annotations;
    this.gridSize = params.gridSize;
    this.snapRadius = params.snapRadius;
    this.snapOptions = params.snapOptions;
    this.polarAngles = params.polarAngles || [0, 45, 90, 135, 180, 225, 270, 315];
    this.polarRadius = params.polarRadius || 1000;
    this.referencePoints = params.referencePoints || [];
  }
  
  // Aggiorna i parametri
  updateParams(params: Partial<SnapManagerParams>): void {
    if (params.entities !== undefined) this.entities = params.entities;
    if (params.dimensions !== undefined) this.dimensions = params.dimensions;
    if (params.annotations !== undefined) this.annotations = params.annotations;
    if (params.gridSize !== undefined) this.gridSize = params.gridSize;
    if (params.snapRadius !== undefined) this.snapRadius = params.snapRadius;
    if (params.snapOptions !== undefined) this.snapOptions = params.snapOptions;
    if (params.polarAngles !== undefined) this.polarAngles = params.polarAngles;
    if (params.polarRadius !== undefined) this.polarRadius = params.polarRadius;
    if (params.referencePoints !== undefined) this.referencePoints = params.referencePoints;
  }
  
  // Ottieni tutti gli oggetti dal disegno
  private getAllEntities(): AnyEntity[] {
    return [
      ...Object.values(this.entities),
      ...Object.values(this.dimensions),
      ...Object.values(this.annotations)
    ].filter(entity => entity.visible !== false);
  }
  
  // Punto di snap alla griglia
  snapToGrid(point: Point): SnapPoint | null {
    if (!this.snapOptions.grid) return null;
    
    const snappedX = Math.round(point.x / this.gridSize) * this.gridSize;
    const snappedY = Math.round(point.y / this.gridSize) * this.gridSize;
    
    const distance = Math.sqrt(Math.pow(point.x - snappedX, 2) + Math.pow(point.y - snappedY, 2));
    
    if (distance <= this.snapRadius) {
      return {
        x: snappedX,
        y: snappedY,
        type: SnapType.GRID,
        distance,
        priority: 10 // Priorità bassa per preferire altri tipi di snap
      };
    }
    
    return null;
  }
  
  // Punti di snap per una linea
  private getLineSnapPoints(entity: LineEntity): SnapPoint[] {
    const snapPoints: SnapPoint[] = [];
    
    // Endpoint
    if (this.snapOptions.endpoint) {
      // Punto iniziale
      snapPoints.push({
        x: entity.startPoint.x,
        y: entity.startPoint.y,
        type: SnapType.ENDPOINT,
        distance: 0, // Sarà calcolata più tardi
        entityId: entity.id,
        priority: 90
      });
      
      // Punto finale
      snapPoints.push({
        x: entity.endPoint.x,
        y: entity.endPoint.y,
        type: SnapType.ENDPOINT,
        distance: 0, // Sarà calcolata più tardi
        entityId: entity.id,
        priority: 90
      });
    }
    
    // Midpoint
    if (this.snapOptions.midpoint) {
      const midX = (entity.startPoint.x + entity.endPoint.x) / 2;
      const midY = (entity.startPoint.y + entity.endPoint.y) / 2;
      
      snapPoints.push({
        x: midX,
        y: midY,
        type: SnapType.MIDPOINT,
        distance: 0, // Sarà calcolata più tardi
        entityId: entity.id,
        priority: 80
      });
    }
    
    return snapPoints;
  }
  
  // Punti di snap per un cerchio
  private getCircleSnapPoints(entity: CircleEntity): SnapPoint[] {
    const snapPoints: SnapPoint[] = [];
    
    // Centro
    if (this.snapOptions.center) {
      snapPoints.push({
        x: entity.center.x,
        y: entity.center.y,
        type: SnapType.CENTER,
        distance: 0, // Sarà calcolata più tardi
        entityId: entity.id,
        priority: 85
      });
    }
    
    // Quadranti
    if (this.snapOptions.quadrant) {
      // Nord
      snapPoints.push({
        x: entity.center.x,
        y: entity.center.y - entity.radius,
        type: SnapType.QUADRANT,
        distance: 0, // Sarà calcolata più tardi
        entityId: entity.id,
        priority: 75
      });
      
      // Est
      snapPoints.push({
        x: entity.center.x + entity.radius,
        y: entity.center.y,
        type: SnapType.QUADRANT,
        distance: 0, // Sarà calcolata più tardi
        entityId: entity.id,
        priority: 75
      });
      
      // Sud
      snapPoints.push({
        x: entity.center.x,
        y: entity.center.y + entity.radius,
        type: SnapType.QUADRANT,
        distance: 0, // Sarà calcolata più tardi
        entityId: entity.id,
        priority: 75
      });
      
      // Ovest
      snapPoints.push({
        x: entity.center.x - entity.radius,
        y: entity.center.y,
        type: SnapType.QUADRANT,
        distance: 0, // Sarà calcolata più tardi
        entityId: entity.id,
        priority: 75
      });
    }
    
    return snapPoints;
  }
  
  // Punti di snap per un arco
  private getArcSnapPoints(entity: ArcEntity): SnapPoint[] {
    const snapPoints: SnapPoint[] = [];
    
    // Centro
    if (this.snapOptions.center) {
      snapPoints.push({
        x: entity.center.x,
        y: entity.center.y,
        type: SnapType.CENTER,
        distance: 0, // Sarà calcolata più tardi
        entityId: entity.id,
        priority: 85
      });
    }
    
    // Endpoint (inizio e fine dell'arco)
    if (this.snapOptions.endpoint) {
      // Punto iniziale
      const startX = entity.center.x + entity.radius * Math.cos(entity.startAngle);
      const startY = entity.center.y + entity.radius * Math.sin(entity.startAngle);
      
      snapPoints.push({
        x: startX,
        y: startY,
        type: SnapType.ENDPOINT,
        distance: 0, // Sarà calcolata più tardi
        entityId: entity.id,
        priority: 90
      });
      
      // Punto finale
      const endX = entity.center.x + entity.radius * Math.cos(entity.endAngle);
      const endY = entity.center.y + entity.radius * Math.sin(entity.endAngle);
      
      snapPoints.push({
        x: endX,
        y: endY,
        type: SnapType.ENDPOINT,
        distance: 0, // Sarà calcolata più tardi
        entityId: entity.id,
        priority: 90
      });
    }
    
    // Midpoint
    if (this.snapOptions.midpoint) {
      // Calcola l'angolo medio
      let midAngle = (entity.startAngle + entity.endAngle) / 2;
      
      // Gestisci il caso in cui l'arco attraversa 0/360 gradi
      if (entity.startAngle > entity.endAngle) {
        midAngle += Math.PI;
      }
      
      const midX = entity.center.x + entity.radius * Math.cos(midAngle);
      const midY = entity.center.y + entity.radius * Math.sin(midAngle);
      
      snapPoints.push({
        x: midX,
        y: midY,
        type: SnapType.MIDPOINT,
        distance: 0, // Sarà calcolata più tardi
        entityId: entity.id,
        priority: 80
      });
    }
    
    return snapPoints;
  }
  
  // Punti di snap per un rettangolo
  private getRectangleSnapPoints(entity: RectangleEntity): SnapPoint[] {
    const snapPoints: SnapPoint[] = [];
    
    // Calcola la rotazione se presente
    const rotation = entity.rotation || 0;
    const rad = rotation * Math.PI / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    
    // Funzione per ruotare un punto attorno all'origine
    const rotatePoint = (x: number, y: number, originX: number, originY: number): Point => {
      const xRot = originX + (x - originX) * cos - (y - originY) * sin;
      const yRot = originY + (x - originX) * sin + (y - originY) * cos;
      return { x: xRot, y: yRot };
    };
    
    // Angoli (endpoints)
    if (this.snapOptions.endpoint) {
      // Top-left (l'origine)
      const topLeft = rotatePoint(
        entity.position.x, 
        entity.position.y,
        entity.position.x + entity.width / 2,
        entity.position.y + entity.height / 2
      );
      
      snapPoints.push({
        x: topLeft.x,
        y: topLeft.y,
        type: SnapType.ENDPOINT,
        distance: 0, // Sarà calcolata più tardi
        entityId: entity.id,
        priority: 90
      });
      
      // Top-right
      const topRight = rotatePoint(
        entity.position.x + entity.width, 
        entity.position.y,
        entity.position.x + entity.width / 2,
        entity.position.y + entity.height / 2
      );
      
      snapPoints.push({
        x: topRight.x,
        y: topRight.y,
        type: SnapType.ENDPOINT,
        distance: 0, // Sarà calcolata più tardi
        entityId: entity.id,
        priority: 90
      });
      
      // Bottom-right
      const bottomRight = rotatePoint(
        entity.position.x + entity.width, 
        entity.position.y + entity.height,
        entity.position.x + entity.width / 2,
        entity.position.y + entity.height / 2
      );
      
      snapPoints.push({
        x: bottomRight.x,
        y: bottomRight.y,
        type: SnapType.ENDPOINT,
        distance: 0, // Sarà calcolata più tardi
        entityId: entity.id,
        priority: 90
      });
      
      // Bottom-left
      const bottomLeft = rotatePoint(
        entity.position.x, 
        entity.position.y + entity.height,
        entity.position.x + entity.width / 2,
        entity.position.y + entity.height / 2
      );
      
      snapPoints.push({
        x: bottomLeft.x,
        y: bottomLeft.y,
        type: SnapType.ENDPOINT,
        distance: 0, // Sarà calcolata più tardi
        entityId: entity.id,
        priority: 90
      });
    }
    
    // Midpoints dei lati
    if (this.snapOptions.midpoint) {
      // Mid-top
      const midTop = rotatePoint(
        entity.position.x + entity.width / 2, 
        entity.position.y,
        entity.position.x + entity.width / 2,
        entity.position.y + entity.height / 2
      );
      
      snapPoints.push({
        x: midTop.x,
        y: midTop.y,
        type: SnapType.MIDPOINT,
        distance: 0, // Sarà calcolata più tardi
        entityId: entity.id,
        priority: 80
      });
      
      // Mid-right
      const midRight = rotatePoint(
        entity.position.x + entity.width, 
        entity.position.y + entity.height / 2,
        entity.position.x + entity.width / 2,
        entity.position.y + entity.height / 2
      );
      
      snapPoints.push({
        x: midRight.x,
        y: midRight.y,
        type: SnapType.MIDPOINT,
        distance: 0, // Sarà calcolata più tardi
        entityId: entity.id,
        priority: 80
      });
      
      // Mid-bottom
      const midBottom = rotatePoint(
        entity.position.x + entity.width / 2, 
        entity.position.y + entity.height,
        entity.position.x + entity.width / 2,
        entity.position.y + entity.height / 2
      );
      
      snapPoints.push({
        x: midBottom.x,
        y: midBottom.y,
        type: SnapType.MIDPOINT,
        distance: 0, // Sarà calcolata più tardi
        entityId: entity.id,
        priority: 80
      });
      
      // Mid-left
      const midLeft = rotatePoint(
        entity.position.x, 
        entity.position.y + entity.height / 2,
        entity.position.x + entity.width / 2,
        entity.position.y + entity.height / 2
      );
      
      snapPoints.push({
        x: midLeft.x,
        y: midLeft.y,
        type: SnapType.MIDPOINT,
        distance: 0, // Sarà calcolata più tardi
        entityId: entity.id,
        priority: 80
      });
    }
    
    // Centro
    if (this.snapOptions.center) {
      const center = {
        x: entity.position.x + entity.width / 2,
        y: entity.position.y + entity.height / 2
      };
      
      snapPoints.push({
        x: center.x,
        y: center.y,
        type: SnapType.CENTER,
        distance: 0, // Sarà calcolata più tardi
        entityId: entity.id,
        priority: 85
      });
    }
    
    return snapPoints;
  }
  
  // Punti di snap per una polilinea
  private getPolylineSnapPoints(entity: PolylineEntity): SnapPoint[] {
    const snapPoints: SnapPoint[] = [];
    
    if (!entity.points || entity.points.length < 2) return snapPoints;
    
    // Endpoint
    if (this.snapOptions.endpoint) {
      // Primo punto
      snapPoints.push({
        x: entity.points[0].x,
        y: entity.points[0].y,
        type: SnapType.ENDPOINT,
        distance: 0, // Sarà calcolata più tardi
        entityId: entity.id,
        priority: 90
      });
      
      // Ultimo punto
      const lastIndex = entity.points.length - 1;
      snapPoints.push({
        x: entity.points[lastIndex].x,
        y: entity.points[lastIndex].y,
        type: SnapType.ENDPOINT,
        distance: 0, // Sarà calcolata più tardi
        entityId: entity.id,
        priority: 90
      });
      
      // Vertici intermedi
      for (let i = 1; i < entity.points.length - 1; i++) {
        snapPoints.push({
          x: entity.points[i].x,
          y: entity.points[i].y,
          type: SnapType.NODE,
          distance: 0, // Sarà calcolata più tardi
          entityId: entity.id,
          priority: 85
        });
      }
    }
    
    // Midpoint dei segmenti
    if (this.snapOptions.midpoint) {
      for (let i = 0; i < entity.points.length - 1; i++) {
        const midX = (entity.points[i].x + entity.points[i + 1].x) / 2;
        const midY = (entity.points[i].y + entity.points[i + 1].y) / 2;
        
        snapPoints.push({
          x: midX,
          y: midY,
          type: SnapType.MIDPOINT,
          distance: 0, // Sarà calcolata più tardi
          entityId: entity.id,
          priority: 80
        });
      }
      
      // Per polilinee chiuse, aggiungi anche il midpoint tra l'ultimo e il primo punto
      if (entity.closed && entity.points.length > 2) {
        const lastIndex = entity.points.length - 1;
        const midX = (entity.points[lastIndex].x + entity.points[0].x) / 2;
        const midY = (entity.points[lastIndex].y + entity.points[0].y) / 2;
        
        snapPoints.push({
          x: midX,
          y: midY,
          type: SnapType.MIDPOINT,
          distance: 0, // Sarà calcolata più tardi
          entityId: entity.id,
          priority: 80
        });
      }
    }
    
    return snapPoints;
  }
  
  // Trova tutti i punti di snap
  getAllSnapPoints(point: Point): SnapPoint[] {
    const allSnapPoints: SnapPoint[] = [];
    
    // Grid snap
    const gridSnap = this.snapToGrid(point);
    if (gridSnap) allSnapPoints.push(gridSnap);
    
    // Entity snap points
    this.getAllEntities().forEach(entity => {
      let entitySnapPoints: SnapPoint[] = [];
      
      switch (entity.type) {
        case 'line':
          entitySnapPoints = this.getLineSnapPoints(entity as LineEntity);
          break;
        case 'circle':
          entitySnapPoints = this.getCircleSnapPoints(entity as CircleEntity);
          break;
        case 'arc':
          entitySnapPoints = this.getArcSnapPoints(entity as ArcEntity);
          break;
        case 'rectangle':
          entitySnapPoints = this.getRectangleSnapPoints(entity as RectangleEntity);
          break;
        case 'polyline':
          entitySnapPoints = this.getPolylineSnapPoints(entity as PolylineEntity);
          break;
        // Aggiungere altri tipi di entità come necessario
      }
      
      // Calcola la distanza per ogni punto di snap
      entitySnapPoints.forEach(snapPoint => {
        const dx = snapPoint.x - point.x;
        const dy = snapPoint.y - point.y;
        snapPoint.distance = Math.sqrt(dx * dx + dy * dy);
      });
      
      // Aggiungi i punti trovati all'array principale
      allSnapPoints.push(...entitySnapPoints);
    });
    
    // Filtra i punti in base al raggio di snap
    return allSnapPoints.filter(snapPoint => snapPoint.distance <= this.snapRadius);
  }
  
  // Trova il miglior punto di snap
  findBestSnapPoint(point: Point): SnapPoint | null {
    const snapPoints = this.getAllSnapPoints(point);
    
    if (snapPoints.length === 0) return null;
    
    // Ordina per priorità, poi per distanza
    snapPoints.sort((a, b) => {
      // Prima per priorità (decrescente)
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      // Poi per distanza (crescente)
      return a.distance - b.distance;
    });
    
    return snapPoints[0];
  }
  
  // Calcola le intersezioni tra le entità
  calculateIntersections() {
    // L'implementazione richiede un algoritmo più complesso per gestire
    // tutte le possibili combinazioni di tipi di entità
    // Lo implementeremo in una versione futura...
  }
  
  // Trova snap perpendicolari
  calculatePerpendiculars(point: Point, referencePoint: Point) {
    // Da implementare in seguito...
  }
  
  // Trova snap tangenti
  calculateTangents(point: Point, circle: CircleEntity) {
    // Da implementare in seguito...
  }
  
  // Genera linee di estensione
  calculateExtensions(point: Point) {
    // Da implementare in seguito...
  }
  
  // Genera tracking polare
  calculatePolarTracking(point: Point, referencePoint: Point) {
    // Da implementare in seguito...
  }
}

// Funzione per creare una nuova istanza di SnapManager
export function createSnapManager(params: SnapManagerParams): SnapManager {
  return new SnapManager(params);
}