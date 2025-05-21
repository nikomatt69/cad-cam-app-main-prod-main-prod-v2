// src/store/technicalDrawingStore.ts

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { 
  DrawingEntity, 
  Dimension, 
  Annotation, 
  DrawingViewport, 
  DrawingSheet,
  DrawingStandard,
  DrawingLayer,
  BaseDrawingEntity,
  Point,
  DrawingStyle,
  Command,
  AnyEntity,
  isDrawingEntity,
  isDimension,
  isAnnotation,
  createEntity,
  EntityType,
  DrawingEntityType,
  DimensionType,
  AnnotationType,
  EntityWithoutId,
  LineEntity,
  CircleEntity,
  RectangleEntity,
  PolylineEntity,
  LinearDimension,
  TextAnnotation
} from '../types/TechnicalDrawingTypes';
import { getStandardConfig } from '../types/DrawingStandardTypes';
import { generateBoundsFromEntities as getBounds } from '../utils/drawing/boundingBoxUtils';

// Utility function to create default style based on entity type and standards
function createDefaultStyle(
  entityType: string, 
  standard: DrawingStandard,
  layerColor?: string
): DrawingStyle {
  const config = getStandardConfig(standard);
  const color = layerColor || '#000000';
  
  switch (entityType) {
    case 'line':
    case 'rectangle':
    case 'circle':
    case 'arc':
    case 'ellipse':
    case 'polyline':
    case 'spline':
    case 'polygon':
    case 'path':
      return {
        strokeColor: color,
        strokeWidth: config.lineTypes.visible.width,
        strokeStyle: 'solid'
      };
    case 'hatch':
      return {
        strokeColor: color,
        strokeWidth: config.lineTypes.visible.width,
        strokeStyle: 'solid',
        fillColor: color,
        fillOpacity: 0.3
      };
    case DimensionType.LINEAR:
    case DimensionType.ALIGNED:
    case DimensionType.ANGULAR:
    case DimensionType.RADIAL:
    case DimensionType.DIAMETRAL:
      return {
        strokeColor: color,
        strokeWidth: config.lineTypes.dimension.width,
        strokeStyle: 'solid',
        fontFamily: config.text.standardFont,
        fontSize: config.dimensions.textHeight
      };
    case AnnotationType.TEXT:
    case AnnotationType.SYMBOL:
    case AnnotationType.TOLERANCE:
      return {
        strokeColor: color,
        strokeWidth: config.lineTypes.leader.width,
        strokeStyle: 'solid',
        fontFamily: config.text.standardFont,
        fontSize: config.text.normalHeight
      };
    default:
      return {
        strokeColor: color,
        strokeWidth: 0.5,
        strokeStyle: 'solid'
      };
  }
}

// Default layers to initialize the drawing with
const defaultLayers: DrawingLayer[] = [
  {
    id: uuidv4(),
    name: 'default',
    color: '#000000',
    visible: true,
    locked: false,
    order: 0,
    description: 'Default layer'
  },
  {
    id: uuidv4(),
    name: 'dimensions',
    color: '#0000FF',
    visible: true,
    locked: false,
    order: 1,
    description: 'Dimensions layer'
  },
  {
    id: uuidv4(),
    name: 'annotations',
    color: '#FF0000',
    visible: true,
    locked: false,
    order: 2,
    description: 'Annotations layer'
  },
  {
    id: uuidv4(),
    name: 'construction',
    color: '#888888',
    visible: true,
    locked: false,
    order: 3,
    description: 'Construction layer'
  }
];

interface EntityState {
  entities: Record<string, DrawingEntity>;
  dimensions: Record<string, Dimension>;
  annotations: Record<string, Annotation>;
}

interface ViewportState {
  viewports: Record<string, DrawingViewport>;
  activeViewportId: string | null;
}

interface LayerState {
  drawingLayers: DrawingLayer[];
  activeLayer: string;
}

interface SheetState {
  sheet: DrawingSheet;
  drawingStandard: DrawingStandard;
  gridSize: number;
  showRulers: boolean;
  showGuidelines: boolean;
}

interface SelectionState {
  selectedEntityIds: string[];
  hoveredEntityId: string | null;
}

interface ToolState {
  activeTool: string;
  toolSettings: Record<string, any>;
}

interface ViewControlsState {
  zoom: number;
  pan: Point;
}

interface CommandHistoryState {
  commandHistory: Command[];
  currentCommandIndex: number;
}

interface DrawingToolSettingsState {
    snappingEnabled: boolean;
    gridEnabled: boolean;
    orthoMode: boolean;
    polarTracking: boolean;
    polarAngle: number;
    objectSnap: Record<string, boolean>;
    dimensionStyles?: any[];
}

interface EntityActions {
  addEntity: (entity: { type: EntityType } & Partial<Omit<AnyEntity, 'id' | 'type'>>) => string;
  updateEntity: (id: string, updates: Partial<AnyEntity>) => void;
  deleteEntity: (id: string) => void;
  copyEntity: (id: string, offset?: Point) => string;
}

interface DimensionActions {
  addDimension: <T extends BaseDrawingEntity & { type: DimensionType }>(
    dimension: EntityWithoutId<T>
  ) => string;
  updateDimension: (id: string, updates: Partial<Dimension>) => void;
  deleteDimension: (id: string) => void;
}

interface AnnotationActions {
  addAnnotation: <T extends BaseDrawingEntity & { type: AnnotationType }>(
    annotation: EntityWithoutId<T>
  ) => string;
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  deleteAnnotation: (id: string) => void;
}

interface LayerActions {
  addLayer: (layer: Omit<DrawingLayer, 'id'>) => string;
  updateLayer: (id: string, updates: Partial<DrawingLayer>) => void;
  deleteLayer: (id: string) => void;
  setActiveLayer: (layerName: string) => void;
}

interface ViewportActions {
  addViewport: (viewport: Omit<DrawingViewport, 'id' | 'visible' | 'locked'>) => string;
  updateViewport: (id: string, updates: Partial<DrawingViewport>) => void;
  deleteViewport: (id: string) => void;
  setActiveViewport: (id: string | null) => void;
}

interface SheetActions {
  updateSheet: (updates: Partial<DrawingSheet>) => void;
  setDrawingStandard: (standard: DrawingStandard) => void;
}

interface SelectionActions {
  selectEntity: (id: string, addToSelection?: boolean) => void;
  deselectEntity: (id: string) => void;
  clearSelection: () => void;
  setHoveredEntity: (id: string | null) => void;
}

interface ViewActions {
  setZoom: (zoom: number) => void;
  setPan: (pan: Point) => void;
  zoomToFit: (padding?: number) => void;
  zoomToSelection: (padding?: number) => void;
}

interface CommandHistoryActions {
  addCommand: (command: Omit<Command, 'id' | 'timestamp'>) => void;
  undoCommand: () => void;
  redoCommand: () => void;
}

interface DrawingToolActions {
  setActiveTool: (tool: string) => void;
  toggleSnapping: () => void;
  toggleGrid: () => void;
  setGridSize: (gridSize: number) => void;
  toggleOrthoMode: () => void;
  togglePolarTracking: () => void;
  setPolarAngle: (angle: number) => void;
  setObjectSnap: (options: Record<string, boolean>) => void;
}

interface GroupTransformActions {
    groupEntities: (ids: string[], groupName?: string) => string;
    ungroupEntities: (groupId: string) => void;
    moveEntities: (ids: string[], offset: Point) => void;
    rotateEntities: (ids: string[], center: Point, angle: number) => void;
    scaleEntities: (ids: string[], center: Point, scaleX: number, scaleY: number) => void;
    mirrorEntities: (ids: string[], lineStart: Point, lineEnd: Point) => void;
    offsetEntity: (id: string, distance: number) => string;
}

export type TechnicalDrawingState = EntityState &
  ViewportState &
  LayerState &
  SheetState &
  SelectionState &
  ToolState &
  ViewControlsState &
  CommandHistoryState &
  DrawingToolSettingsState &
  EntityActions &
  DimensionActions &
  AnnotationActions &
  LayerActions &
  ViewportActions &
  SheetActions &
  SelectionActions &
  ViewActions &
  CommandHistoryActions &
  DrawingToolActions &
  GroupTransformActions;

// Type guards for specific entity types
function hasPosition(entity: AnyEntity): entity is RectangleEntity | TextAnnotation {
  return 'position' in entity && entity.position !== undefined;
}

function hasCenter(entity: AnyEntity): entity is CircleEntity {
  return 'center' in entity && entity.center !== undefined;
}

function hasPoints(entity: AnyEntity): entity is PolylineEntity {
  return 'points' in entity && Array.isArray(entity.points);
}

function hasStartEndPoints(entity: AnyEntity): entity is LineEntity | LinearDimension {
  return 'startPoint' in entity && 'endPoint' in entity &&
    entity.startPoint !== undefined && entity.endPoint !== undefined;
}

function offsetEntityGeometry(entity: AnyEntity, offset: Point): Partial<AnyEntity> {
  const updates: Partial<AnyEntity> = {};

  if (hasPosition(entity)) {
    (updates as Partial<RectangleEntity | TextAnnotation>).position = {
      x: entity.position.x + offset.x,
      y: entity.position.y + offset.y
    };
  }

  if (hasCenter(entity)) {
    (updates as Partial<CircleEntity>).center = {
      x: entity.center.x + offset.x,
      y: entity.center.y + offset.y
    };
  }

  if (hasPoints(entity)) {
    (updates as Partial<PolylineEntity>).points = entity.points.map((point: Point) => ({
      x: point.x + offset.x,
      y: point.y + offset.y
    }));
  }

  if (hasStartEndPoints(entity)) {
    const updatedEntity = updates as Partial<LineEntity | LinearDimension>;
    updatedEntity.startPoint = {
      x: entity.startPoint.x + offset.x,
      y: entity.startPoint.y + offset.y
    };
    updatedEntity.endPoint = {
      x: entity.endPoint.x + offset.x,
      y: entity.endPoint.y + offset.y
    };
  }

  return updates;
}

function createEntityWithDefaults(
  type: EntityType,
  partialEntity: Partial<EntityWithoutId<AnyEntity>>,
  layerColor: string
): EntityWithoutId<AnyEntity> {
  return createEntity(type, {
    ...partialEntity,
    style: {
      strokeColor: layerColor,
      strokeWidth: 1,
      strokeStyle: 'solid',
      fillColor: 'none',
      ...(partialEntity.style || {})
    } as DrawingStyle
  });
}

// Add these type definitions at the top
interface TransformableEntity {
  startPoint?: Point;
  endPoint?: Point;
  center?: Point;
  radius?: number;
  radiusX?: number;
  radiusY?: number;
  rotation?: number;
  position?: Point;
  width?: number;
  height?: number;
  points?: Point[];
  startAngle?: number;
  endAngle?: number;
  counterclockwise?: boolean;
  closed?: boolean;
}

interface EntityUpdates extends Partial<TransformableEntity> {
  type: EntityType;
}

function transformEntity(entity: AnyEntity): TransformableEntity {
  return entity as unknown as TransformableEntity;
}

function createEntityUpdates(entity: AnyEntity): EntityUpdates {
  return {
    type: entity.type,
    ...transformEntity(entity)
  };
}

const initialStateBase: Omit<TechnicalDrawingState, keyof (
  EntityActions & 
  DimensionActions & 
  AnnotationActions & 
  LayerActions & 
  ViewportActions &
  SheetActions &
  SelectionActions &
  ViewActions &
  CommandHistoryActions &
  DrawingToolActions &
  GroupTransformActions
)> = {
  // Entity state
  entities: {},
  dimensions: {},
  annotations: {},

  // Layer state
  drawingLayers: defaultLayers,
  activeLayer: 'default',

  // Viewport state
  viewports: {},
  activeViewportId: null,

  // Sheet state
  sheet: {
    id: uuidv4(),
    size: 'A4',
    width: 297,
    height: 210,
    margin: { top: 10, right: 10, bottom: 10, left: 10 },
    orientation: 'landscape',
    scale: 1,
    units: 'mm'
  },
  drawingStandard: 'ISO',
  gridSize: 10,
  showRulers: true,
  showGuidelines: true,

  // Selection state
  selectedEntityIds: [],
  hoveredEntityId: null,

  // Tool state
  activeTool: 'select',
  toolSettings: {},

  // ViewControlsState
  zoom: 1,
  pan: { x: 0, y: 0 },

  // CommandHistoryState
  commandHistory: [],
  currentCommandIndex: -1,

  // DrawingToolSettingsState
  snappingEnabled: true,
  gridEnabled: true,
  orthoMode: false,
  polarTracking: false,
  polarAngle: 45,
  objectSnap: {
    endpoint: true,
    midpoint: true,
    center: true,
    intersection: true,
    nearest: false,
  },
  dimensionStyles: [],
};

export const useTechnicalDrawingStore = create<TechnicalDrawingState>((set, get) => ({
  ...(initialStateBase as TechnicalDrawingState),

  // Entity actions
  addEntity: (entity) => {
    const id = uuidv4();
    const activeLayerName = get().activeLayer;
    const layer = get().drawingLayers.find(l => l.name === (entity.layer || activeLayerName));
    const layerColor = layer ? layer.color : '#000000';

    const newEntityWithDefaults = createEntityWithDefaults(
      entity.type,
      {
        ...entity,
        layer: entity.layer || activeLayerName,
      } as Partial<EntityWithoutId<AnyEntity>>,
      layerColor
    );
    
    const finalEntity = { ...newEntityWithDefaults, id };

    set((state) => {
      const updatedState = { ...state };

      if (isDrawingEntity(finalEntity)) {
        updatedState.entities = {
          ...state.entities,
          [id]: finalEntity as DrawingEntity
        };
      } else if (isDimension(finalEntity)) {
        updatedState.dimensions = {
          ...state.dimensions,
          [id]: finalEntity as Dimension
        };
      } else if (isAnnotation(finalEntity)) {
        updatedState.annotations = {
          ...state.annotations,
          [id]: finalEntity as Annotation
        };
      }

      // Add to active viewport if one exists
      if (state.activeViewportId && state.viewports[state.activeViewportId]) {
        const viewport = state.viewports[state.activeViewportId];
        updatedState.viewports = {
          ...state.viewports,
          [viewport.id]: {
            ...viewport,
            entities: [...viewport.entities, id]
          }
        };
      }
      return updatedState;
    });
    return id;
  },

  updateEntity: (id: string, updates: Partial<AnyEntity>) => {
    set((state) => {
      const updatedState = { ...state };

      if (id in state.entities) {
        const entity = state.entities[id];
        updatedState.entities = {
          ...state.entities,
          [id]: { ...entity, ...updates } as DrawingEntity
        };
      } else if (id in state.dimensions) {
        const entity = state.dimensions[id];
        updatedState.dimensions = {
          ...state.dimensions,
          [id]: { ...entity, ...updates } as Dimension
        };
      } else if (id in state.annotations) {
        const entity = state.annotations[id];
        updatedState.annotations = {
          ...state.annotations,
          [id]: { ...entity, ...updates } as Annotation
        };
      }
      return updatedState;
    });
  },

  deleteEntity: (id: string) => {
    set((state) => {
      const updatedState = { ...state };

      if (id in state.entities) {
        const { [id]: _, ...remainingEntities } = state.entities;
        updatedState.entities = remainingEntities;
      } else if (id in state.dimensions) {
        const { [id]: _, ...remainingDimensions } = state.dimensions;
        updatedState.dimensions = remainingDimensions;
      } else if (id in state.annotations) {
        const { [id]: _, ...remainingAnnotations } = state.annotations;
        updatedState.annotations = remainingAnnotations;
      }

      // Remove from viewports
      Object.keys(state.viewports).forEach(viewportId => {
        const viewport = state.viewports[viewportId];
        if (viewport.entities.includes(id)) {
          updatedState.viewports = {
            ...updatedState.viewports,
            [viewportId]: {
              ...viewport,
              entities: viewport.entities.filter(entityId => entityId !== id)
            }
          };
        }
      });

      // Remove from selection
      if (state.selectedEntityIds.includes(id)) {
        updatedState.selectedEntityIds = state.selectedEntityIds.filter(entityId => entityId !== id);
      }

      // Clear hovered entity if it was deleted
      if (state.hoveredEntityId === id) {
        updatedState.hoveredEntityId = null;
      }
      return updatedState;
    });
  },

  copyEntity: (id: string, offset: Point = { x: 10, y: 10 }) => {
    const entity = get().entities[id] || get().dimensions[id] || get().annotations[id];
    if (!entity) return '';

    // Create a new object, omitting the id, and applying offset
    const { id: _, ...entityData } = entity;
    const copiedEntityData = {
      ...entityData,
      layer: entity.layer || get().activeLayer,
      ...offsetEntityGeometry(entity, offset)
    };

    // Type assertion for addEntity parameter
    return get().addEntity(copiedEntityData as { type: EntityType } & Partial<Omit<AnyEntity, 'id' | 'type'>>);
  },

  // Dimension actions
  addDimension: <T extends BaseDrawingEntity & { type: DimensionType }>(
    dimension: EntityWithoutId<T>
  ) => {
    const id = uuidv4();
    const activeLayerName = dimension.layer || 'dimensions';
    const layer = get().drawingLayers.find(l => l.name === activeLayerName);
    const layerColor = layer ? layer.color : '#0000FF';
    
    const style = {
      ...createDefaultStyle(dimension.type, get().drawingStandard, layerColor),
      ...(dimension.style || {})
    };
    
    const dimensionObj = {
      ...(dimension as unknown as Omit<T, 'id'>),
      id,
      layer: activeLayerName,
      visible: true,
      locked: false,
      style
    } as unknown as Dimension;
    
    set(state => ({
      dimensions: {
        ...state.dimensions,
        [id]: dimensionObj
      }
    }));
    
    if (get().activeViewportId && get().viewports[get().activeViewportId!]) {
      const viewport = get().viewports[get().activeViewportId!];
      set(state => ({
        viewports: {
          ...state.viewports,
          [viewport.id]: {
            ...viewport,
            entities: [...viewport.entities, id]
          }
        }
      }));
    }
    return id;
  },
  
  updateDimension: (id: string, updates: Partial<Dimension>) => {
    if (!get().dimensions[id]) return;
    set(state => ({
        dimensions: {
          ...state.dimensions,
        [id]: { ...state.dimensions[id], ...updates } as Dimension
          }
    }));
  },
  
  deleteDimension: (id: string) => {
    if (!get().dimensions[id]) return;
    set(state => {
      const { [id]: _, ...remainingDimensions } = state.dimensions;
      const updatedViewports = { ...state.viewports };
      Object.keys(updatedViewports).forEach(viewportId => {
        updatedViewports[viewportId] = {
          ...updatedViewports[viewportId],
          entities: updatedViewports[viewportId].entities.filter(entityId => entityId !== id)
        };
      });
      return {
        dimensions: remainingDimensions,
        viewports: updatedViewports,
        selectedEntityIds: state.selectedEntityIds.filter(selectedId => selectedId !== id),
        hoveredEntityId: state.hoveredEntityId === id ? null : state.hoveredEntityId
      };
    });
  },
  
  // Annotation actions
  addAnnotation: <T extends BaseDrawingEntity & { type: AnnotationType }>(
    annotation: EntityWithoutId<T>
  ) => {
    const id = uuidv4();
    const activeLayerName = annotation.layer || 'annotations';
    const layer = get().drawingLayers.find(l => l.name === activeLayerName);
    const layerColor = layer ? layer.color : '#FF0000';

    const style = {
      ...createDefaultStyle(annotation.type, get().drawingStandard, layerColor),
      ...(annotation.style || {})
    };
    
    const annotationObj = {
      ...(annotation as unknown as Omit<T, 'id'>),
      id,
      layer: activeLayerName,
      visible: true,
      locked: false,
      style
    } as unknown as Annotation;
    
    set(state => ({
      annotations: {
        ...state.annotations,
        [id]: annotationObj
      }
    }));

    if (get().activeViewportId && get().viewports[get().activeViewportId!]) {
      const viewport = get().viewports[get().activeViewportId!];
      set(state => ({
        viewports: {
          ...state.viewports,
          [viewport.id]: {
            ...viewport,
            entities: [...viewport.entities, id]
          }
        }
      }));
    }
    return id;
  },
  
  updateAnnotation: (id: string, updates: Partial<Annotation>) => {
    if (!get().annotations[id]) return;
    set(state => ({
        annotations: {
          ...state.annotations,
        [id]: { ...state.annotations[id], ...updates } as Annotation
          }
    }));
  },
  
  deleteAnnotation: (id: string) => {
    if (!get().annotations[id]) return;
    set(state => {
      const { [id]: _, ...remainingAnnotations } = state.annotations;
      const updatedViewports = { ...state.viewports };
      Object.keys(updatedViewports).forEach(viewportId => {
        updatedViewports[viewportId] = {
          ...updatedViewports[viewportId],
          entities: updatedViewports[viewportId].entities.filter(entityId => entityId !== id)
        };
      });
      return {
        annotations: remainingAnnotations,
        viewports: updatedViewports,
        selectedEntityIds: state.selectedEntityIds.filter(selectedId => selectedId !== id),
        hoveredEntityId: state.hoveredEntityId === id ? null : state.hoveredEntityId
      };
    });
  },
  
  // Layer actions
  addLayer: (layer: Omit<DrawingLayer, 'id'>) => {
    const id = uuidv4();
    const newLayer: DrawingLayer = { ...layer, id };
    set(state => ({
      drawingLayers: [...state.drawingLayers, newLayer]
    }));
    return id;
  },
  
  updateLayer: (id: string, updates: Partial<DrawingLayer>) => {
    set(state => ({
      drawingLayers: state.drawingLayers.map(layer => 
        layer.id === id ? { ...layer, ...updates } : layer
      )
    }));
    
    const updatedLayer = get().drawingLayers.find(l => l.id === id);
    if (!updatedLayer) return;

    const processEntities = (entityMap: Record<string, AnyEntity>, updateFn: (id: string, updates: Partial<AnyEntity>) => void) => {
      Object.entries(entityMap).forEach(([entityId, entity]) => {
        if (entity.layer === updatedLayer.name) {
          const entityUpdates: Partial<AnyEntity> = {};
          if (updates.color && entity.style) {
            entityUpdates.style = { ...entity.style, strokeColor: updates.color };
          }
          if (updates.visible !== undefined) {
            entityUpdates.visible = updates.visible;
          }
          if (updates.locked !== undefined) {
            entityUpdates.locked = updates.locked;
          }
          if (Object.keys(entityUpdates).length > 0) {
            updateFn(entityId, entityUpdates);
          }
        }
      });
    };

    processEntities(get().entities, get().updateEntity);
    processEntities(get().dimensions as Record<string, AnyEntity>, get().updateDimension as any);
    processEntities(get().annotations as Record<string, AnyEntity>, get().updateAnnotation as any);
  },
  
  deleteLayer: (id: string) => {
    const layerToDelete = get().drawingLayers.find(l => l.id === id);
    if (!layerToDelete || layerToDelete.name === 'default') return;
    
    set(state => ({
      drawingLayers: state.drawingLayers.filter(layer => layer.id !== id)
    }));
    
    if (get().activeLayer === layerToDelete.name) {
      get().setActiveLayer('default');
    }
    
    const moveEntitiesToDefault = (entityMap: Record<string, AnyEntity>, updateFn: (id: string, updates: Partial<AnyEntity>) => void) => {
        Object.entries(entityMap).forEach(([entityId, entity]) => {
            if (entity.layer === layerToDelete.name) {
                updateFn(entityId, { layer: 'default' });
            }
        });
    };

    moveEntitiesToDefault(get().entities, get().updateEntity);
    moveEntitiesToDefault(get().dimensions as Record<string, AnyEntity>, get().updateDimension as any);
    moveEntitiesToDefault(get().annotations as Record<string, AnyEntity>, get().updateAnnotation as any);
  },
  
  setActiveLayer: (layerName: string) => {
    set({ activeLayer: layerName });
  },
  
  // Viewport actions
  addViewport: (viewport: Omit<DrawingViewport, 'id' | 'visible' | 'locked'>) => {
    const id = uuidv4();
    const viewportObj: DrawingViewport = {
      ...viewport,
      id,
      visible: true,
      locked: false
    };
    set(state => ({
      viewports: { ...state.viewports, [id]: viewportObj },
      activeViewportId: state.activeViewportId || id
    }));
    return id;
  },
  
  updateViewport: (id: string, updates: Partial<DrawingViewport>) => {
    const viewport = get().viewports[id];
    if (!viewport) return;
    set(state => ({
        viewports: {
          ...state.viewports,
          [id]: { ...viewport, ...updates }
        }
    }));
  },
  
  deleteViewport: (id: string) => {
    const viewport = get().viewports[id];
    if (!viewport) return;
    set(state => {
      const { [id]: _, ...remainingViewports } = state.viewports;
      let newActiveViewportId = state.activeViewportId;
      if (newActiveViewportId === id) {
        const viewportIds = Object.keys(remainingViewports);
        newActiveViewportId = viewportIds.length > 0 ? viewportIds[0] : null;
      }
      return {
        viewports: remainingViewports,
        activeViewportId: newActiveViewportId
      };
    });
  },
  
  setActiveViewport: (id: string | null) => {
    if (id === null || get().viewports[id]) {
      set({ activeViewportId: id });
    }
  },
  
  // Sheet actions
  updateSheet: (updates: Partial<DrawingSheet>) => {
    set(state => ({
      sheet: { ...state.sheet, ...updates }
    }));
  },
  
  setDrawingStandard: (standard: DrawingStandard) => {
    set({ drawingStandard: standard });
  },
  
  // Selection actions
  selectEntity: (id: string, addToSelection: boolean = false) => {
    let entity: DrawingEntity | Dimension | Annotation | undefined = get().entities[id];
    if (!entity) entity = get().dimensions[id];
    if (!entity) entity = get().annotations[id];
    
    if (!entity || entity.locked) return;
    
    set(state => ({
      selectedEntityIds: addToSelection 
        ? Array.from(new Set([...state.selectedEntityIds, id]))
        : [id]
    }));
  },
  
  deselectEntity: (id: string) => {
    set(state => ({
      selectedEntityIds: state.selectedEntityIds.filter(selectedId => selectedId !== id)
    }));
  },
  
  clearSelection: () => {
    set({ selectedEntityIds: [] });
  },
  
  setHoveredEntity: (id: string | null) => {
    set({ hoveredEntityId: id });
  },
  
  // View actions
  setZoom: (newZoom: number) => {
    set({ zoom: Math.max(0.01, Math.min(1000, newZoom)) });
  },
  
  setPan: (newPan: Point) => {
    set({ pan: newPan });
  },
  
  zoomToFit: (padding: number = 20) => {
    const allEntityIds = Object.values(get().viewports).flatMap(vp => vp.entities)
        .concat(Object.keys(get().entities))
        .concat(Object.keys(get().dimensions))
        .concat(Object.keys(get().annotations));
    
    const uniqueEntityIds = Array.from(new Set(allEntityIds));

    const allEntitiesList: AnyEntity[] = uniqueEntityIds.map(id => 
      get().entities[id] || get().dimensions[id] || get().annotations[id]
    ).filter(Boolean) as AnyEntity[];
        
    if (allEntitiesList.length === 0) return;
    
    const bounds = getBounds(allEntitiesList as (DrawingEntity | Dimension | Annotation)[]);
    if (!bounds || bounds.maxX === -Infinity) return;

    const canvas = document.querySelector('canvas');
    const canvasWidth = canvas?.width || window.innerWidth;
    const canvasHeight = canvas?.height || window.innerHeight;
        
    const boundsWidth = bounds.maxX - bounds.minX + padding * 2;
    const boundsHeight = bounds.maxY - bounds.minY + padding * 2;

    if (boundsWidth <=0 || boundsHeight <=0) return;
    
    const zoomX = canvasWidth / boundsWidth;
    const zoomY = canvasHeight / boundsHeight;
    const newZoom = Math.min(zoomX, zoomY);
    
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    
    get().setZoom(newZoom);
    get().setPan({ x: centerX, y: centerY });
  },
  
  zoomToSelection: (padding: number = 20) => {
    const selectedIds = get().selectedEntityIds;
    if (selectedIds.length === 0) return;
    
    const selectedEntitiesList: AnyEntity[] = selectedIds.map(id => 
      get().entities[id] || get().dimensions[id] || get().annotations[id]
    ).filter(Boolean) as AnyEntity[];
    
    if (selectedEntitiesList.length === 0) return;
    
    const bounds = getBounds(selectedEntitiesList as (DrawingEntity | Dimension | Annotation)[]);
    if (!bounds || bounds.maxX === -Infinity) return;

    const canvas = document.querySelector('canvas');
    const canvasWidth = canvas?.width || window.innerWidth;
    const canvasHeight = canvas?.height || window.innerHeight;

    const boundsWidth = bounds.maxX - bounds.minX + padding * 2;
    const boundsHeight = bounds.maxY - bounds.minY + padding * 2;

    if (boundsWidth <=0 || boundsHeight <=0) return;
        
    const zoomX = canvasWidth / boundsWidth;
    const zoomY = canvasHeight / boundsHeight;
    const newZoom = Math.min(zoomX, zoomY);
    
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    
    get().setZoom(newZoom);
    get().setPan({ x: centerX, y: centerY });
  },
  
  // Command history actions
  addCommand: (command: Omit<Command, 'id' | 'timestamp'>) => {
    const id = uuidv4();
    const newCommand: Command = { ...command, id, timestamp: Date.now() };
    set(state => {
      const newHistory = state.commandHistory.slice(0, state.currentCommandIndex + 1);
      return {
        commandHistory: [...newHistory, newCommand],
        currentCommandIndex: newHistory.length
      };
    });
  },
  
  undoCommand: () => {
    const { commandHistory, currentCommandIndex } = get();
    if (currentCommandIndex >= 0 && commandHistory.length > 0 && currentCommandIndex < commandHistory.length) {
      const command = commandHistory[currentCommandIndex];
      if (command && command.undo) command.undo();
      set(state => ({ currentCommandIndex: state.currentCommandIndex - 1 }));
    }
  },
  
  redoCommand: () => {
    const { commandHistory, currentCommandIndex } = get();
    if (currentCommandIndex < commandHistory.length - 1) {
      const nextCommandIndex = currentCommandIndex + 1;
      const command = commandHistory[nextCommandIndex];
      if (command && command.redo) command.redo();
      set(state => ({ currentCommandIndex: nextCommandIndex }));
    }
  },
  
  // Drawing tool actions
  setActiveTool: (tool: string) => {
    set({ activeTool: tool });
  },
  
  toggleSnapping: () => {
    set(state => ({ snappingEnabled: !state.snappingEnabled }));
  },
  
  toggleGrid: () => {
    set(state => ({ gridEnabled: !state.gridEnabled }));
  },
  
  setGridSize: (newGridSize: number) => {
    set({ gridSize: newGridSize });
  },
  
  toggleOrthoMode: () => {
    set(state => ({ orthoMode: !state.orthoMode }));
  },
  
  togglePolarTracking: () => {
    set(state => ({ polarTracking: !state.polarTracking }));
  },
  
  setPolarAngle: (angle: number) => {
    set({ polarAngle: angle });
  },
  
  setObjectSnap: (options: Record<string,boolean>) => {
    set(state => ({
      objectSnap: { ...state.objectSnap, ...options }
    }));
  },
  
  // Group operations
  groupEntities: (ids: string[], groupName?: string) => {
    const groupId = uuidv4();
    ids.forEach(id => {
      if (get().entities[id]) get().updateEntity(id, { groupId });
      else if (get().dimensions[id]) get().updateDimension(id, { groupId } as Partial<Dimension>);
      else if (get().annotations[id]) get().updateAnnotation(id, { groupId } as Partial<Annotation>);
    });
    return groupId;
  },
  
  ungroupEntities: (groupId: string) => {
    const processMap = (map: Record<string, AnyEntity>, updateFn: (id: string, updates: Partial<AnyEntity>) => void) => {
        Object.entries(map).forEach(([id, entity]) => {
            if (entity.groupId === groupId) {
                updateFn(id, { groupId: undefined });
            }
        });
    };
    processMap(get().entities, get().updateEntity);
    processMap(get().dimensions as Record<string, AnyEntity>, get().updateDimension as any);
    processMap(get().annotations as Record<string, AnyEntity>, get().updateAnnotation as any);
  },
  
  // Transformation operations
  moveEntities: (ids: string[], offset: Point) => {
    ids.forEach(id => {
      const entity = get().entities[id] || get().dimensions[id] || get().annotations[id];
      if (entity) {
        const updates = offsetEntityGeometry(entity, offset);
        if (Object.keys(updates).length > 0) {
            if (get().entities[id]) get().updateEntity(id, updates);
            else if (get().dimensions[id]) get().updateDimension(id, updates as Partial<Dimension>);
            else if (get().annotations[id]) get().updateAnnotation(id, updates as Partial<Annotation>);
        }
      }
    });
  },
  
  rotateEntities: (ids: string[], center: Point, angle: number) => {
    const radians = angle * Math.PI / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    const rotatePoint = (p: Point): Point => ({
      x: center.x + (p.x - center.x) * cos - (p.y - center.y) * sin,
      y: center.y + (p.x - center.x) * sin + (p.y - center.y) * cos
    });

    ids.forEach(id => {
      const entity = get().entities[id] || get().dimensions[id] || get().annotations[id];
      if (!entity) return;

      const transformedEntity = transformEntity(entity);
      let updates = {} as TransformableEntity;

      if ('startPoint' in transformedEntity && 'endPoint' in transformedEntity) {
        updates.startPoint = rotatePoint(transformedEntity.startPoint!);
        updates.endPoint = rotatePoint(transformedEntity.endPoint!);
      } else if ('center' in transformedEntity) {
        updates.center = rotatePoint(transformedEntity.center!);
        if ('radiusX' in transformedEntity) {
          updates.rotation = (transformedEntity.rotation || 0) + angle;
        } else if ('startAngle' in transformedEntity) {
          updates.startAngle = (transformedEntity.startAngle || 0) + radians;
          updates.endAngle = (transformedEntity.endAngle || 0) + radians;
        }
      } else if ('position' in transformedEntity) {
        updates.position = rotatePoint(transformedEntity.position!);
        updates.rotation = (transformedEntity.rotation || 0) + angle;
      } else if ('points' in transformedEntity) {
        updates.points = transformedEntity.points!.map(rotatePoint);
      }

      if (Object.keys(updates).length > 0) {
        const finalUpdates = { ...updates, type: entity.type } as EntityUpdates;
        if (id in get().entities) {
          get().updateEntity(id, finalUpdates as Partial<DrawingEntity>);
        } else if (id in get().dimensions) {
          get().updateDimension(id, finalUpdates as Partial<Dimension>);
        } else if (id in get().annotations) {
          get().updateAnnotation(id, finalUpdates as Partial<Annotation>);
        }
      }
    });
  },
  
  scaleEntities: (ids: string[], center: Point, scaleX: number, scaleY: number) => {
    const scalePoint = (p: Point): Point => ({
      x: center.x + (p.x - center.x) * scaleX,
      y: center.y + (p.y - center.y) * scaleY
    });

    ids.forEach(id => {
      const entity = get().entities[id] || get().dimensions[id] || get().annotations[id];
      if (!entity) return;
      
      const transformedEntity = transformEntity(entity);
      let updates = {} as TransformableEntity;

      if ('startPoint' in transformedEntity && 'endPoint' in transformedEntity && entity.type === 'line') {
        updates.startPoint = scalePoint(transformedEntity.startPoint!);
        updates.endPoint = scalePoint(transformedEntity.endPoint!);
      } else if ('center' in transformedEntity && 'radius' in transformedEntity && entity.type === 'circle') {
        updates.center = scalePoint(transformedEntity.center!);
        updates.radius = (transformedEntity.radius || 0) * Math.max(Math.abs(scaleX), Math.abs(scaleY));
      } else if ('center' in transformedEntity && 'radiusX' in transformedEntity && entity.type === 'ellipse') {
        updates.center = scalePoint(transformedEntity.center!);
        updates.radiusX = (transformedEntity.radiusX || 0) * scaleX;
        updates.radiusY = (transformedEntity.radiusY || 0) * scaleY;
      } else if ('center' in transformedEntity && 'radius' in transformedEntity && entity.type === 'arc') {
        updates.center = scalePoint(transformedEntity.center!);
        updates.radius = (transformedEntity.radius || 0) * Math.max(Math.abs(scaleX), Math.abs(scaleY));
      } else if ('position' in transformedEntity && 'width' in transformedEntity && entity.type === 'rectangle') {
        const oldPos = transformedEntity.position!;
        const newPos = scalePoint(oldPos);
        updates.position = newPos;
        updates.width = (transformedEntity.width || 0) * scaleX;
        updates.height = (transformedEntity.height || 0) * scaleY;
      } else if ('points' in transformedEntity && entity.type === 'polyline') {
        updates.points = transformedEntity.points!.map(scalePoint);
      }

      if (Object.keys(updates).length > 0) {
        const finalUpdates = { ...updates, type: entity.type } as EntityUpdates;
        if (id in get().entities) {
          get().updateEntity(id, finalUpdates as Partial<DrawingEntity>);
        } else if (id in get().dimensions) {
          get().updateDimension(id, finalUpdates as Partial<Dimension>);
        } else if (id in get().annotations) {
          get().updateAnnotation(id, finalUpdates as Partial<Annotation>);
        }
      }
    });
  },
  
  mirrorEntities: (ids: string[], lineStart: Point, lineEnd: Point) => {
    const mirrorPoint = (p: Point): Point => {
      const dx = lineEnd.x - lineStart.x;
      const dy = lineEnd.y - lineStart.y;
      if (dx === 0 && dy === 0) return p;

      const a = (dx * dx - dy * dy) / (dx * dx + dy * dy);
      const b = (2 * dx * dy) / (dx * dx + dy * dy);
      const x = a * (p.x - lineStart.x) + b * (p.y - lineStart.y) + lineStart.x;
      const y = b * (p.x - lineStart.x) - a * (p.y - lineStart.y) + lineStart.y;
      return { x, y };
    };

    ids.forEach(id => {
      const entity = get().entities[id] || get().dimensions[id] || get().annotations[id];
      if (!entity) return;
      
      const transformedEntity = transformEntity(entity);
      let updates = {} as TransformableEntity;

      if ('startPoint' in transformedEntity && 'endPoint' in transformedEntity && transformedEntity.startPoint !== undefined && transformedEntity.endPoint !== undefined) {
        updates.startPoint = mirrorPoint(transformedEntity.startPoint!);
        updates.endPoint = mirrorPoint(transformedEntity.endPoint!);
      } else if ('center' in transformedEntity && transformedEntity.center !== undefined) {
        updates.center = mirrorPoint(transformedEntity.center!);
      } else if ('center' in transformedEntity && transformedEntity.center !== undefined) {
        updates.center = mirrorPoint(transformedEntity.center!);
        updates.rotation = transformedEntity.rotation ? -transformedEntity.rotation : 0;
      } else if ('center' in transformedEntity && transformedEntity.center !== undefined) {
        updates.center = mirrorPoint(transformedEntity.center!);
        const sa = transformedEntity.startAngle!;
        const ea = transformedEntity.endAngle!;
        updates.startAngle = -ea; 
        updates.endAngle = -sa;
        updates.counterclockwise = !transformedEntity.counterclockwise;
      } else if ('position' in transformedEntity && transformedEntity.position !== undefined) {
        updates.position = mirrorPoint(transformedEntity.position!);
        updates.rotation = transformedEntity.rotation ? -transformedEntity.rotation : 0;
      } else if ('points' in transformedEntity && transformedEntity.points !== undefined) {
        updates.points = transformedEntity.points!.map(mirrorPoint);
      }
      
      get().addEntity(updates as { type: EntityType } & Partial<Omit<AnyEntity, 'id' | 'type'>>);
    });
  },
  
  offsetEntity: (id: string, distance: number) => {
    const entity = get().entities[id];
    if (!entity) return '';
    let newEntityId = '';

    const transformedEntity = transformEntity(entity);
    let updates = {} as TransformableEntity;

    if ('startPoint' in transformedEntity && 'endPoint' in transformedEntity && transformedEntity.startPoint !== undefined && transformedEntity.endPoint !== undefined) {
      const dx = transformedEntity.endPoint!.x - transformedEntity.startPoint!.x;
      const dy = transformedEntity.endPoint!.y - transformedEntity.startPoint!.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len === 0) return '';
      const nx = -dy / len;
      const ny = dx / len;
      updates.startPoint = { x: transformedEntity.startPoint!.x + nx * distance, y: transformedEntity.startPoint!.y + ny * distance };
      updates.endPoint = { x: transformedEntity.endPoint!.x + nx * distance, y: transformedEntity.endPoint!.y + ny * distance };
      newEntityId = get().addEntity(updates as any); 
    } else if ('center' in transformedEntity && transformedEntity.center !== undefined) {
      const newRadius = (transformedEntity.radius || 0) + distance;
      if (newRadius <= 0) return '';
      updates.radius = newRadius;
      newEntityId = get().addEntity(updates as any);
    } else if ('points' in transformedEntity && transformedEntity.points !== undefined) {
      if (!transformedEntity.closed  || transformedEntity.points.length < 3) return ''; 
      const clonedPoints = transformedEntity.points.map(p => ({ x: p.x + distance, y: p.y + distance }));
      updates.points = clonedPoints;
      newEntityId = get().addEntity(updates as any);
    } else if ('position' in transformedEntity && transformedEntity.position !== undefined) {
      updates.position = { x: (transformedEntity.position!.x || 0) - distance, y: (transformedEntity.position!.y || 0) - distance };
      updates.width = (transformedEntity.width || 0) + 2 * distance; 
      updates.height = (transformedEntity.height || 0) + 2 * distance;
      if (updates.width <= 0 || updates.height <= 0) return '';
      newEntityId = get().addEntity(updates as any);
    }
    return newEntityId;
  }
}));

// Initialize the store with default data
export function initializeTechnicalDrawingStore() {
  const { 
    addViewport, 
    setActiveViewport 
  } = useTechnicalDrawingStore.getState();
  
  if (Object.keys(useTechnicalDrawingStore.getState().viewports).length === 0) {
    const frontViewId = addViewport({
      name: 'Front View',
      type: 'front',
      position: { x: 50, y: 50 },
      width: 150,
      height: 100,
      scale: 1,
      entities: []
    });
    setActiveViewport(frontViewId);
  }
}