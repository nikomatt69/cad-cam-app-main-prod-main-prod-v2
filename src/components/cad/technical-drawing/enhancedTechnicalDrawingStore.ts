// src/components/cad/technical-drawing/technicalDrawingStore.ts
// ENHANCED STORE con tutti i sistemi Industry Leader integrati

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
} from './TechnicalDrawingTypes';
import { getStandardConfig } from './DrawingStandardTypes';
import { generateBoundsFromEntities as getBounds } from './utils/drawing/boundingBoxUtils';

// Import new systems
import ConstraintManager from './core/constraints/ConstraintManager';
import { Constraint, ConstraintType, ConstraintCreationParams } from './core/constraints/ConstraintTypes';
import AssociativeDimensionsManager, { DimensionUpdateEvent } from './core/dimensions/AssociativeDimensions';
import BlockLibraryManager, { BlockDefinition, BlockInstance } from './core/blocks/BlockLibrary';

// Enhanced state interfaces
interface ConstraintState {
  constraints: Record<string, Constraint>;
  constraintManager: ConstraintManager;
  autoSolveConstraints: boolean;
}

interface AssociativeDimensionState {
  associativeDimensionsManager: AssociativeDimensionsManager;
  dimensionRelationships: Record<string, any>;
  autoUpdateDimensions: boolean;
}

interface BlockLibraryState {
  blockLibraryManager: BlockLibraryManager;
  blockDefinitions: Record<string, BlockDefinition>;
  blockInstances: Record<string, BlockInstance>;
  activeBlockCategory: string | null;
}

interface ProfessionalFeatureState {
  parametricMode: boolean;
  associativeMode: boolean;
  designMode: 'drafting' | 'parametric' | 'collaborative';
  featureFlags: {
    constraintsEnabled: boolean;
    associativeDimensionsEnabled: boolean;
    blockLibraryEnabled: boolean;
    advancedSnapEnabled: boolean;
    realTimeCollaboration: boolean;
  };
}

// Existing interfaces (keeping all existing functionality)
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

// Enhanced Actions - All existing actions plus new ones
interface EntityActions {
  addEntity: (entity: { type: EntityType } & Partial<Omit<AnyEntity, 'id' | 'type'>>) => string;
  updateEntity: (id: string, updates: Partial<AnyEntity>) => void;
  deleteEntity: (id: string) => void;
  copyEntity: (id: string, offset?: Point) => string;
  setEntities: (entities: Record<string, DrawingEntity>) => void;
}

interface DimensionActions {
  addDimension: <T extends BaseDrawingEntity & { type: DimensionType }>(
    dimension: EntityWithoutId<T>
  ) => string;
  updateDimension: (id: string, updates: Partial<Dimension>) => void;
  deleteDimension: (id: string) => void;
  setDimensions: (dimensions: Record<string, Dimension>) => void;
}

interface AnnotationActions {
  addAnnotation: <T extends BaseDrawingEntity & { type: AnnotationType }>(
    annotation: EntityWithoutId<T>
  ) => string;
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  deleteAnnotation: (id: string) => void;
  setAnnotations: (annotations: Record<string, Annotation>) => void;
}

// NEW INDUSTRY LEADER ACTIONS
interface ConstraintActions {
  createConstraint: (params: ConstraintCreationParams) => string | null;
  removeConstraint: (constraintId: string) => boolean;
  toggleConstraint: (constraintId: string, active?: boolean) => boolean;
  solveConstraints: () => Promise<any[]>;
  getConstraintsForEntity: (entityId: string) => Constraint[];
  createAutoConstraints: (entityIds: string[]) => string[];
  setAutoSolveConstraints: (enabled: boolean) => void;
}

interface AssociativeDimensionActions {
  createAssociativeRelationship: (dimensionId: string, entityIds: string[]) => string;
  updateAssociativeDimension: (dimensionId: string, newValue: number) => Promise<DimensionUpdateEvent[]>;
  setAutoUpdateDimensions: (enabled: boolean) => void;
  getAllDimensionRelationships: () => any[];
}

interface BlockLibraryActions {
  createBlock: (name: string, entityIds: string[], category?: string) => string;
  insertBlock: (blockId: string, position: Point, rotation?: number, scale?: number) => string;
  explodeBlock: (instanceId: string) => DrawingEntity[];
  updateBlockAttributes: (instanceId: string, attributes: Record<string, string>) => boolean;
  searchBlocks: (query: string, category?: string) => BlockDefinition[];
  exportBlockLibrary: () => string;
  importBlockLibrary: (data: string, merge?: boolean) => void;
  setActiveBlockCategory: (categoryId: string | null) => void;
}

interface ProfessionalFeatureActions {
  setParametricMode: (enabled: boolean) => void;
  setAssociativeMode: (enabled: boolean) => void;
  setDesignMode: (mode: 'drafting' | 'parametric' | 'collaborative') => void;
  toggleFeatureFlag: (flag: keyof ProfessionalFeatureState['featureFlags']) => void;
  enableProfessionalFeatures: () => void;
  getSystemCapabilities: () => any;
}

// Keep all existing actions
interface LayerActions {
  addLayer: (layer: Omit<DrawingLayer, 'id'>) => string;
  updateLayer: (id: string, updates: Partial<DrawingLayer>) => void;
  deleteLayer: (id: string) => void;
  setActiveLayer: (layerName: string) => void;
  setDrawingLayers: (layers: DrawingLayer[]) => void;
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
  undo: () => void;
  redo: () => void;
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

// COMPLETE ENHANCED STATE TYPE
export type EnhancedTechnicalDrawingState = EntityState &
  ViewportState &
  LayerState &
  SheetState &
  SelectionState &
  ToolState &
  ViewControlsState &
  CommandHistoryState &
  DrawingToolSettingsState &
  ConstraintState &
  AssociativeDimensionState &
  BlockLibraryState &
  ProfessionalFeatureState &
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
  GroupTransformActions &
  ConstraintActions &
  AssociativeDimensionActions &
  BlockLibraryActions &
  ProfessionalFeatureActions;

// Default layers
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
  },
  {
    id: uuidv4(),
    name: 'constraints',
    color: '#9254de',
    visible: true,
    locked: false,
    order: 4,
    description: 'Constraints visualization'
  }
];

// Create manager instances
const constraintManager = new ConstraintManager();
const associativeDimensionsManager = new AssociativeDimensionsManager();
const blockLibraryManager = new BlockLibraryManager();

const initialStateBase: Omit<EnhancedTechnicalDrawingState, keyof (
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
  GroupTransformActions &
  ConstraintActions &
  AssociativeDimensionActions &
  BlockLibraryActions &
  ProfessionalFeatureActions
)> = {
  // Existing state
  entities: {},
  dimensions: {},
  annotations: {},
  drawingLayers: defaultLayers,
  activeLayer: 'default',
  viewports: {},
  activeViewportId: null,
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
  selectedEntityIds: [],
  hoveredEntityId: null,
  activeTool: 'select',
  toolSettings: {},
  zoom: 1,
  pan: { x: 0, y: 0 },
  commandHistory: [],
  currentCommandIndex: -1,
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

  // NEW INDUSTRY LEADER STATE
  constraints: {},
  constraintManager,
  autoSolveConstraints: true,
  
  associativeDimensionsManager,
  dimensionRelationships: {},
  autoUpdateDimensions: true,
  
  blockLibraryManager,
  blockDefinitions: {},
  blockInstances: {},
  activeBlockCategory: null,
  
  parametricMode: true,
  associativeMode: true,
  designMode: 'parametric',
  featureFlags: {
    constraintsEnabled: true,
    associativeDimensionsEnabled: true,
    blockLibraryEnabled: true,
    advancedSnapEnabled: true,
    realTimeCollaboration: false
  }
};

// Utility functions (keeping all existing ones)
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
    case DimensionType.DIAMETRICAL:
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

// [Keep all existing utility functions and type guards...]

// ENHANCED ZUSTAND STORE WITH INDUSTRY LEADER FEATURES
export const useTechnicalDrawingStore = create<EnhancedTechnicalDrawingState>((set, get) => ({
  ...(initialStateBase as EnhancedTechnicalDrawingState),

  // [Keep all existing actions - they remain unchanged]
  
  // Entity actions (existing)
  addEntity: (entity) => {
    const id = uuidv4();
    const activeLayerName = get().activeLayer;
    const layer = get().drawingLayers.find(l => l.name === (entity.layer || activeLayerName));
    const layerColor = layer ? layer.color : '#000000';

    const newEntityWithDefaults = createEntity(
      entity.type,
      {
        ...entity,
        layer: entity.layer || activeLayerName,
        style: {
          strokeColor: layerColor,
          strokeWidth: 1,
          strokeStyle: 'solid',
          fillColor: 'none',
          ...(entity.style || {})
        } as DrawingStyle
      } as Partial<EntityWithoutId<AnyEntity>>
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

      // Update constraint manager with new entities
      const allEntities = {
        ...updatedState.entities,
        ...updatedState.dimensions,
        ...updatedState.annotations
      };
      state.constraintManager.updateEntities(allEntities as any);
      
      // Update associative dimensions manager
      state.associativeDimensionsManager.updateData(updatedState.entities, updatedState.dimensions);

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

      // Update managers with new data
      const allEntities = {
        ...updatedState.entities,
        ...updatedState.dimensions,
        ...updatedState.annotations
      };
      state.constraintManager.updateEntities(allEntities as any);
      state.associativeDimensionsManager.updateData(updatedState.entities, updatedState.dimensions);

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

      // Remove associated constraints
      const entityConstraints = state.constraintManager.getConstraintsForEntity(id);
      entityConstraints.forEach(constraint => {
        state.constraintManager.removeConstraint(constraint.id);
      });

      // Update managers
      const allEntities = {
        ...updatedState.entities,
        ...updatedState.dimensions,
        ...updatedState.annotations
      };
      state.constraintManager.updateEntities(allEntities as any);
      state.associativeDimensionsManager.updateData(updatedState.entities, updatedState.dimensions);

      return updatedState;
    });
  },

  // [Keep all other existing actions unchanged...]
  copyEntity: (id: string, offset: Point = { x: 10, y: 10 }) => {
    const entity = get().entities[id] || get().dimensions[id] || get().annotations[id];
    if (!entity) return '';

    const { id: _, ...entityData } = entity;
    const copiedEntityData = {
      ...entityData,
      layer: entity.layer || get().activeLayer,
    };

    return get().addEntity(copiedEntityData as { type: EntityType } & Partial<Omit<AnyEntity, 'id' | 'type'>>);
  },

  setEntities: (entities: Record<string, DrawingEntity>) => {
    set(state => {
      if (JSON.stringify(entities) === JSON.stringify(state.entities)) {
        return state;
      }
      
      const updatedState = {
        ...state,
        entities
      };

      // Update managers
      const allEntities = {
        ...entities,
        ...state.dimensions,
        ...state.annotations
      };
      state.constraintManager.updateEntities(allEntities as any);
      state.associativeDimensionsManager.updateData(entities, state.dimensions);

      return updatedState;
    });
  },

  // [Keep ALL other existing actions - dimensions, annotations, layers, etc.]
  // I'll keep the existing implementation for brevity but they all remain the same

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

    // Update associative dimensions manager
    const allDimensions = { ...get().dimensions, [id]: dimensionObj };
    get().associativeDimensionsManager.updateData(get().entities, allDimensions);

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

    // Update associative dimensions manager
    const allDimensions = get().dimensions;
    get().associativeDimensionsManager.updateData(get().entities, allDimensions);
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

    // Update associative dimensions manager
    const allDimensions = get().dimensions;
    get().associativeDimensionsManager.updateData(get().entities, allDimensions);
  },

  setDimensions: (dimensions: Record<string, Dimension>) => {
    set(state => {
      if (JSON.stringify(dimensions) === JSON.stringify(state.dimensions)) {
        return state;
      }
      
      return {
        ...state,
        dimensions
      };
    });

    // Update associative dimensions manager
    get().associativeDimensionsManager.updateData(get().entities, dimensions);
  },

  // [Continue with all other existing actions...]
  // For brevity, I'll implement the key new actions:

  // === NEW INDUSTRY LEADER ACTIONS ===

  // Constraint Actions
  createConstraint: (params: ConstraintCreationParams) => {
    const constraintId = get().constraintManager.createConstraint(params);
    
    if (constraintId && get().autoSolveConstraints) {
      // Auto-solve constraints after creation
      setTimeout(() => {
        get().solveConstraints();
      }, 100);
    }
    
    return constraintId;
  },

  removeConstraint: (constraintId: string) => {
    return get().constraintManager.removeConstraint(constraintId);
  },

  toggleConstraint: (constraintId: string, active?: boolean) => {
    const result = get().constraintManager.toggleConstraint(constraintId, active);
    
    if (result && get().autoSolveConstraints) {
      setTimeout(() => {
        get().solveConstraints();
      }, 100);
    }
    
    return result;
  },

  solveConstraints: async () => {
    const solutions = await get().constraintManager.solveConstraints();
    
    // Apply constraint solutions to entities
    solutions.forEach(solution => {
      if (solution.satisfied) {
        Object.entries(solution.entityUpdates).forEach(([entityId, updates]) => {
          if (get().entities[entityId]) {
            get().updateEntity(entityId, updates);
          } else if (get().dimensions[entityId]) {
            get().updateDimension(entityId, updates);
          } else if (get().annotations[entityId]) {
            get().updateAnnotation(entityId, updates);
          }
        });
      }
    });

    return solutions;
  },

  getConstraintsForEntity: (entityId: string) => {
    return get().constraintManager.getConstraintsForEntity(entityId);
  },

  createAutoConstraints: (entityIds: string[]) => {
    return get().constraintManager.createAutoConstraints(entityIds);
  },

  setAutoSolveConstraints: (enabled: boolean) => {
    set(state => ({ autoSolveConstraints: enabled }));
  },

  // Associative Dimension Actions
  createAssociativeRelationship: (dimensionId: string, entityIds: string[]) => {
    return get().associativeDimensionsManager.createAssociativeRelationship(
      dimensionId,
      entityIds,
      'linear' // Default type
    );
  },

  updateAssociativeDimension: async (dimensionId: string, newValue: number) => {
    const events = await get().associativeDimensionsManager.updateDimension(dimensionId, newValue, 'user');
    
    // Apply dimension updates to store
    events.forEach(event => {
      if (get().dimensions[event.dimensionId]) {
        get().updateDimension(event.dimensionId, { 
          text: `${event.newValue.toFixed(2)}`
        } as any);
      }
    });

    return events;
  },

  setAutoUpdateDimensions: (enabled: boolean) => {
    set(state => ({ autoUpdateDimensions: enabled }));
  },

  getAllDimensionRelationships: () => {
    return get().associativeDimensionsManager.getAllRelationships();
  },

  // Block Library Actions
  createBlock: (name: string, entityIds: string[], category: string = 'general') => {
    const selectedEntities = entityIds.map(id => 
      get().entities[id] || get().dimensions[id] || get().annotations[id]
    ).filter(Boolean);

    if (selectedEntities.length === 0) {
      throw new Error('No valid entities selected for block creation');
    }

    const blockId = get().blockLibraryManager.createBlockDefinition(
      name,
      selectedEntities as any,
      { x: 0, y: 0 },
      category
    );

    // Update block definitions in store
    const allBlocks = get().blockLibraryManager.getAllBlockDefinitions();
    const blockDefinitions: Record<string, BlockDefinition> = {};
    allBlocks.forEach(block => {
      blockDefinitions[block.id] = block;
    });
    
    set(state => ({ blockDefinitions }));

    return blockId;
  },

  insertBlock: (blockId: string, position: Point, rotation: number = 0, scale: number = 1) => {
    const instanceId = get().blockLibraryManager.insertBlock(
      blockId,
      position,
      rotation,
      scale,
      scale,
      get().activeLayer
    );

    // Generate entities for the block and add to store
    const blockEntities = get().blockLibraryManager.generateBlockEntities(instanceId);
    blockEntities.forEach(entity => {
      get().addEntity(entity);
    });

    // Update block instances in store
    const allInstances = get().blockLibraryManager.getAllBlockInstances();
    const blockInstances: Record<string, BlockInstance> = {};
    allInstances.forEach(instance => {
      blockInstances[instance.id] = instance;
    });
    
    set(state => ({ blockInstances }));

    return instanceId;
  },

  explodeBlock: (instanceId: string) => {
    const explodedEntities = get().blockLibraryManager.explodeBlock(instanceId);
    
    // Add exploded entities to store
    explodedEntities.forEach(entity => {
      get().addEntity(entity);
    });

    // Update block instances in store
    const allInstances = get().blockLibraryManager.getAllBlockInstances();
    const blockInstances: Record<string, BlockInstance> = {};
    allInstances.forEach(instance => {
      blockInstances[instance.id] = instance;
    });
    
    set(state => ({ blockInstances }));

    return explodedEntities;
  },

  updateBlockAttributes: (instanceId: string, attributes: Record<string, string>) => {
    return get().blockLibraryManager.updateBlockAttributes(instanceId, attributes);
  },

  searchBlocks: (query: string, category?: string) => {
    return get().blockLibraryManager.searchBlocks(query, category);
  },

  exportBlockLibrary: () => {
    return get().blockLibraryManager.exportLibrary();
  },

  importBlockLibrary: (data: string, merge: boolean = false) => {
    get().blockLibraryManager.importLibrary(data, merge);
    
    // Update store with imported data
    const allBlocks = get().blockLibraryManager.getAllBlockDefinitions();
    const blockDefinitions: Record<string, BlockDefinition> = {};
    allBlocks.forEach(block => {
      blockDefinitions[block.id] = block;
    });
    
    set(state => ({ blockDefinitions }));
  },

  setActiveBlockCategory: (categoryId: string | null) => {
    set(state => ({ activeBlockCategory: categoryId }));
  },

  // Professional Feature Actions
  setParametricMode: (enabled: boolean) => {
    set(state => ({ parametricMode: enabled }));
    
    // Enable/disable related features
    if (enabled) {
      set(state => ({
        featureFlags: {
          ...state.featureFlags,
          constraintsEnabled: true,
          associativeDimensionsEnabled: true
        }
      }));
    }
  },

  setAssociativeMode: (enabled: boolean) => {
    set(state => ({ associativeMode: enabled }));
    
    // Enable/disable related features
    if (enabled) {
      set(state => ({
        featureFlags: {
          ...state.featureFlags,
          associativeDimensionsEnabled: true
        }
      }));
    }
  },

  setDesignMode: (mode: 'drafting' | 'parametric' | 'collaborative') => {
    set(state => ({ designMode: mode }));
    
    // Auto-configure features based on mode
    switch (mode) {
      case 'parametric':
        set(state => ({
          parametricMode: true,
          associativeMode: true,
          featureFlags: {
            ...state.featureFlags,
            constraintsEnabled: true,
            associativeDimensionsEnabled: true,
            blockLibraryEnabled: true
          }
        }));
        break;
      case 'collaborative':
        set(state => ({
          featureFlags: {
            ...state.featureFlags,
            realTimeCollaboration: true
          }
        }));
        break;
      case 'drafting':
      default:
        // Basic drafting mode
        break;
    }
  },

  toggleFeatureFlag: (flag: keyof ProfessionalFeatureState['featureFlags']) => {
    set(state => ({
      featureFlags: {
        ...state.featureFlags,
        [flag]: !state.featureFlags[flag]
      }
    }));
  },

  enableProfessionalFeatures: () => {
    set(state => ({
      parametricMode: true,
      associativeMode: true,
      designMode: 'parametric',
      featureFlags: {
        constraintsEnabled: true,
        associativeDimensionsEnabled: true,
        blockLibraryEnabled: true,
        advancedSnapEnabled: true,
        realTimeCollaboration: true
      }
    }));
    
    console.log('🚀 All Professional Features Enabled - Industry Leader Mode!');
  },

  getSystemCapabilities: () => {
    const state = get();
    return {
      constraintsCount: state.constraintManager.getAllConstraints().length,
      blockDefinitionsCount: Object.keys(state.blockDefinitions).length,
      blockInstancesCount: Object.keys(state.blockInstances).length,
      associativeRelationshipsCount: state.associativeDimensionsManager.getAllRelationships().length,
      entitiesCount: Object.keys(state.entities).length,
      dimensionsCount: Object.keys(state.dimensions).length,
      annotationsCount: Object.keys(state.annotations).length,
      layersCount: state.drawingLayers.length,
      professionalFeaturesEnabled: state.parametricMode && state.associativeMode,
      activeFeatures: Object.entries(state.featureFlags).filter(([_, enabled]) => enabled).map(([flag, _]) => flag)
    };
  },

  // [Keep ALL existing actions - just adding the new ones above]
  // Keeping all layer, viewport, sheet, selection, view, command history, drawing tool, and group transform actions exactly as they were

  // Layer actions (unchanged)
  addLayer: (layer: Omit<DrawingLayer, 'id'>) => {
    const id = uuidv4();
    const newLayer: DrawingLayer = { ...layer, id };
    set(state => ({
      drawingLayers: [...state.drawingLayers, newLayer]
    }));
    return id;
  },

  setDrawingLayers: (layers: DrawingLayer[]) => {
    set(state => {
      if (JSON.stringify(layers) === JSON.stringify(state.drawingLayers)) {
        return state;
      }
      return {
        ...state,
        drawingLayers: layers
      };
    });
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

  // [Continue with ALL other existing actions - viewport, sheet, selection, view, command history, drawing tool, group transform actions]
  // For brevity, I'll indicate they all remain exactly the same as before

  // Viewport actions (unchanged)
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

  // Sheet actions (unchanged)
  updateSheet: (updates: Partial<DrawingSheet>) => {
    set(state => ({
      sheet: { ...state.sheet, ...updates }
    }));
  },

  setDrawingStandard: (standard: DrawingStandard) => {
    set({ drawingStandard: standard });
  },

  // Selection actions (unchanged)
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

  // View actions (unchanged)
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

  // Command history actions (unchanged)
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

  undo: () => get().undoCommand(),
  redo: () => get().redoCommand(),

  // Drawing tool actions (unchanged)
  setActiveTool: (tool: string) => {
    set({ activeTool: tool });
    console.log(`\ud83d\udd27 Tool changed to: ${tool}`);
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

  // Group operations (unchanged)
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

  // Transformation operations (unchanged - but they'll work with constraints!)
  moveEntities: (ids: string[], offset: Point) => {
    ids.forEach(id => {
      const entity = get().entities[id] || get().dimensions[id] || get().annotations[id];
      if (entity) {
        // Apply geometric transformation
        let updates: any = {};
        
        if ('center' in entity) {
          const centerEntity = entity as any;
          updates.center = {
            x: centerEntity.center.x + offset.x,
            y: centerEntity.center.y + offset.y
          };
        } else if ('startPoint' in entity && 'endPoint' in entity) {
          const lineEntity = entity as any;
          updates.startPoint = {
            x: lineEntity.startPoint.x + offset.x,
            y: lineEntity.startPoint.y + offset.y
          };
          updates.endPoint = {
            x: lineEntity.endPoint.x + offset.x,
            y: lineEntity.endPoint.y + offset.y
          };
        } else if ('position' in entity) {
          const posEntity = entity as any;
          updates.position = {
            x: posEntity.position.x + offset.x,
            y: posEntity.position.y + offset.y
          };
        }

        if (Object.keys(updates).length > 0) {
          if (get().entities[id]) get().updateEntity(id, updates);
          else if (get().dimensions[id]) get().updateDimension(id, updates as Partial<Dimension>);
          else if (get().annotations[id]) get().updateAnnotation(id, updates as Partial<Annotation>);
        }
      }
    });

    // Auto-solve constraints after move if enabled
    if (get().autoSolveConstraints) {
      setTimeout(() => {
        get().solveConstraints();
      }, 100);
    }
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

      let updates: any = {};

      if ('startPoint' in entity && 'endPoint' in entity) {
        const lineEntity = entity as any;
        updates.startPoint = rotatePoint(lineEntity.startPoint);
        updates.endPoint = rotatePoint(lineEntity.endPoint);
      } else if ('center' in entity) {
        const centerEntity = entity as any;
        updates.center = rotatePoint(centerEntity.center);
        if ('radiusX' in centerEntity) {
          updates.rotation = (centerEntity.rotation || 0) + angle;
        } else if ('startAngle' in centerEntity) {
          updates.startAngle = (centerEntity.startAngle || 0) + radians;
          updates.endAngle = (centerEntity.endAngle || 0) + radians;
        }
      } else if ('position' in entity) {
        const posEntity = entity as any;
        updates.position = rotatePoint(posEntity.position);
        updates.rotation = (posEntity.rotation || 0) + angle;
      } else if ('points' in entity) {
        const pointsEntity = entity as any;
        updates.points = pointsEntity.points.map(rotatePoint);
      }

      if (Object.keys(updates).length > 0) {
        if (id in get().entities) {
          get().updateEntity(id, updates);
        } else if (id in get().dimensions) {
          get().updateDimension(id, updates);
        } else if (id in get().annotations) {
          get().updateAnnotation(id, updates);
        }
      }
    });

    // Auto-solve constraints after rotation if enabled
    if (get().autoSolveConstraints) {
      setTimeout(() => {
        get().solveConstraints();
      }, 100);
    }
  },

  scaleEntities: (ids: string[], center: Point, scaleX: number, scaleY: number) => {
    const scalePoint = (p: Point): Point => ({
      x: center.x + (p.x - center.x) * scaleX,
      y: center.y + (p.y - center.y) * scaleY
    });

    ids.forEach(id => {
      const entity = get().entities[id] || get().dimensions[id] || get().annotations[id];
      if (!entity) return;
      
      let updates: any = {};

      if ('startPoint' in entity && 'endPoint' in entity && entity.type === 'line') {
        const lineEntity = entity as any;
        updates.startPoint = scalePoint(lineEntity.startPoint);
        updates.endPoint = scalePoint(lineEntity.endPoint);
      } else if ('center' in entity && 'radius' in entity && entity.type === 'circle') {
        const circleEntity = entity as any;
        updates.center = scalePoint(circleEntity.center);
        updates.radius = circleEntity.radius * Math.max(Math.abs(scaleX), Math.abs(scaleY));
      } else if ('center' in entity && 'radiusX' in entity && entity.type === 'ellipse') {
        const ellipseEntity = entity as any;
        updates.center = scalePoint(ellipseEntity.center);
        updates.radiusX = ellipseEntity.radiusX * scaleX;
        updates.radiusY = ellipseEntity.radiusY * scaleY;
      } else if ('center' in entity && 'radius' in entity && entity.type === 'arc') {
        const arcEntity = entity as any;
        updates.center = scalePoint(arcEntity.center);
        updates.radius = arcEntity.radius * Math.max(Math.abs(scaleX), Math.abs(scaleY));
      } else if ('position' in entity && 'width' in entity && entity.type === 'rectangle') {
        const rectEntity = entity as any;
        const oldPos = rectEntity.position;
        const newPos = scalePoint(oldPos);
        updates.position = newPos;
        updates.width = rectEntity.width * scaleX;
        updates.height = rectEntity.height * scaleY;
      } else if ('points' in entity && entity.type === 'polyline') {
        const polylineEntity = entity as any;
        updates.points = polylineEntity.points.map(scalePoint);
      }

      if (Object.keys(updates).length > 0) {
        if (id in get().entities) {
          get().updateEntity(id, updates);
        } else if (id in get().dimensions) {
          get().updateDimension(id, updates);
        } else if (id in get().annotations) {
          get().updateAnnotation(id, updates);
        }
      }
    });

    // Auto-solve constraints after scaling if enabled
    if (get().autoSolveConstraints) {
      setTimeout(() => {
        get().solveConstraints();
      }, 100);
    }
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
      
      let updates: any = {};

      if ('startPoint' in entity && 'endPoint' in entity) {
        const lineEntity = entity as any;
        updates.startPoint = mirrorPoint(lineEntity.startPoint);
        updates.endPoint = mirrorPoint(lineEntity.endPoint);
      } else if ('center' in entity) {
        const centerEntity = entity as any;
        updates.center = mirrorPoint(centerEntity.center);
        if ('rotation' in centerEntity) {
          updates.rotation = centerEntity.rotation ? -centerEntity.rotation : 0;
        }
        if ('startAngle' in centerEntity) {
          const sa = centerEntity.startAngle;
          const ea = centerEntity.endAngle;
          updates.startAngle = -ea; 
          updates.endAngle = -sa;
          updates.counterclockwise = !centerEntity.counterclockwise;
        }
      } else if ('position' in entity) {
        const posEntity = entity as any;
        updates.position = mirrorPoint(posEntity.position);
        updates.rotation = posEntity.rotation ? -posEntity.rotation : 0;
      } else if ('points' in entity) {
        const pointsEntity = entity as any;
        updates.points = pointsEntity.points.map(mirrorPoint);
      }
      
      get().addEntity(updates as { type: EntityType } & Partial<Omit<AnyEntity, 'id' | 'type'>>);
    });
  },

  offsetEntity: (id: string, distance: number) => {
    const entity = get().entities[id];
    if (!entity) return '';
    let newEntityId = '';

    let updates: any = {};

    if ('startPoint' in entity && 'endPoint' in entity) {
      const lineEntity = entity as any;
      const dx = lineEntity.endPoint.x - lineEntity.startPoint.x;
      const dy = lineEntity.endPoint.y - lineEntity.startPoint.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len === 0) return '';
      const nx = -dy / len;
      const ny = dx / len;
      updates.startPoint = { x: lineEntity.startPoint.x + nx * distance, y: lineEntity.startPoint.y + ny * distance };
      updates.endPoint = { x: lineEntity.endPoint.x + nx * distance, y: lineEntity.endPoint.y + ny * distance };
      newEntityId = get().addEntity(updates as any); 
    } else if ('center' in entity && 'radius' in entity) {
      const circleEntity = entity as any;
      const newRadius = circleEntity.radius + distance;
      if (newRadius <= 0) return '';
      updates.radius = newRadius;
      newEntityId = get().addEntity(updates as any);
    } else if ('points' in entity) {
      const polylineEntity = entity as any;
      if (!polylineEntity.closed || polylineEntity.points.length < 3) return ''; 
      const clonedPoints = polylineEntity.points.map((p: Point) => ({ x: p.x + distance, y: p.y + distance }));
      updates.points = clonedPoints;
      newEntityId = get().addEntity(updates as any);
    } else if ('position' in entity && 'width' in entity) {
      const rectEntity = entity as any;
      updates.position = { x: rectEntity.position.x - distance, y: rectEntity.position.y - distance };
      updates.width = rectEntity.width + 2 * distance; 
      updates.height = rectEntity.height + 2 * distance;
      if (updates.width <= 0 || updates.height <= 0) return '';
      newEntityId = get().addEntity(updates as any);
    }
    return newEntityId;
  },

  // KEEP all annotation actions unchanged
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
  
  setAnnotations: (annotations: Record<string, Annotation>) => {
    set(state => {
      if (JSON.stringify(annotations) === JSON.stringify(state.annotations)) {
        return state;
      }
      
      return {
        ...state,
        annotations
      };
    });
  }
}));

// Initialize the enhanced store with industry leader features
export function initializeEnhancedTechnicalDrawingStore() {
  const store = useTechnicalDrawingStore.getState();
  
  // Enable all professional features
  store.enableProfessionalFeatures();
  
  // Log system capabilities
  const capabilities = store.getSystemCapabilities();
  console.log('🚀 Enhanced CAD System Initialized - Industry Leader Mode!');
  console.log('📊 System Capabilities:', capabilities);
  
  // Initialize viewport if needed
  if (Object.keys(store.viewports).length === 0) {
    const frontViewId = store.addViewport({
      name: 'Front View',
      type: 'front',
      position: { x: 50, y: 50 },
      width: 150,
      height: 100,
      scale: 1,
      entities: []
    });
    store.setActiveViewport(frontViewId);
  }

  return store;
}

export default useTechnicalDrawingStore;