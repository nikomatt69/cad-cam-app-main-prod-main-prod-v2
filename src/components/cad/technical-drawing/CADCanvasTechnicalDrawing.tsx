// src/components/cad/technical-drawing/CADCanvasTechnicalDrawing.tsx

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useTechnicalDrawingStore } from 'src/store/technicalDrawingStore';
import { useDrawingSnap, SnapPoint } from 'src/hooks/useDrawingSnap';
import { 
  Point, 
  DrawingEntity, 
  Dimension, 
  Annotation, 
  LinearDimension, 
  TextAnnotation, 
  LineEntity, 
  CircleEntity, 
  RectangleEntity,
  PolylineEntity,
  ArcEntity,
  EllipseEntity,
  SplineEntity,
  LeaderAnnotation,
  BaseDrawingEntity,
  EntityWithoutId,
  EntityType,
  AnnotationType,
  DimensionType
} from 'src/types/TechnicalDrawingTypes';
import { TechnicalDrawingToolbar } from './TechnicalDrawingToolbar';
import { LayerPanel } from './LayerPanel';
import { PropertiesPanel } from './PropertiesPanel';
import { StatusBar } from './StatusBar';
import { drawEntity, drawDimension, drawAnnotation, drawTempEntity } from 'src/utils/drawing/renderUtils';
import { hitTestEntity } from 'src/utils/drawing/hitTestUtils';
import { generateBoundsFromEntities } from 'src/utils/drawing/boundingBoxUtils';
import { CommandLine } from './CommandLine';
import { NumericInput } from './NumericInput';
import { useCommandHistory } from 'src/hooks/useCommandHistory';
import { calculateDistance, calculateAngle } from 'src/utils/math/geometryUtils';
import { 
  Layers, 
  Settings, 
  ZoomIn, 
  ZoomOut, 
  Grid,
  Info,
  Maximize2,
  Slash,
  Square,
  Circle,
  Type,
  ArrowRight,
  PenTool,
  Copy,
  Move,
  CornerDownRight,
  Scissors,
  Sun,
  X,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  
} from 'react-feather';
import { copyEntity } from '../../../utils/drawing/entityUtils';
import { rotateEntity, mirrorEntity } from '../../../utils/drawing/transformUtils';
import { SheetSetupPanel } from './SheetSetupPanel';
import { BlocksPanel } from './BlocksPanel';
import { MechanicalSymbolsPanel } from './MechanicalSymbols';
import { DimensioningPanel } from './DimensioningPanel';
import { ViewportsPanel } from './ViewportsPanel';
import { GeometricTolerancePanel } from './GeometricTolerancePanel';
import { Ruler } from 'lucide-react';

interface CADCanvasTechnicalDrawingProps {
  width?: string | number;
  height?: string | number;
  mode?: '2D' | '3D-to-2D';
  showToolbar?: boolean;
  showStatusBar?: boolean;
  initialTool?: string;
  onEntityCreated?: (entity: string) => void;
  onEntitySelected?: (entity: string | string[]) => void;
  onEntityUpdated?: (entity: string) => void;
  onEntityDeleted?: (entity: string) => void;
}

// Add tool-specific types
interface ToolState {
  type: string;
  step: number;
  points: Point[];
  tempPoints: Point[];
  params: Record<string, any>;
}

// Tool context menu options
interface ToolOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  action: () => void;
}

// CAD modes enumeration
enum CADMode {
  DRAW = 'draw',
  EDIT = 'edit',
  ANNOTATE = 'annotate',
  VIEW = 'view',
  MEASURE = 'measure'
}

export const CADCanvasTechnicalDrawing: React.FC<CADCanvasTechnicalDrawingProps> = ({
  width = '100%',
  height = '100%',
  mode = '2D',
  showToolbar = true,
  showStatusBar = true,
  initialTool = 'select',
  onEntityCreated,
  onEntitySelected,
  onEntityUpdated,
  onEntityDeleted
}) => {
  // Canvas references
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Get technical drawing state and actions from store
  const {
    entities,
    dimensions,
    annotations,
    viewports,
    activeViewportId,
    sheet,
    drawingStandard,
    selectedEntityIds,
    hoveredEntityId,
    zoom,
    pan,
    activeTool,
    snappingEnabled,
    gridEnabled,
    gridSize,
    orthoMode,
    polarTracking,
    polarAngle,
    
    // Actions
    setZoom,
    setPan,
    clearSelection,
    setHoveredEntity,
    selectEntity,
    deselectEntity,
    addEntity,
    updateEntity,
    deleteEntity,
    addDimension,
    updateDimension,
    deleteDimension,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    zoomToFit,
    zoomToSelection,
    setActiveTool,
    toggleSnapping,
    toggleGrid,
    setGridSize,
    toggleOrthoMode,
    togglePolarTracking,
    setPolarAngle,
    setActiveLayer,
    drawingLayers,
    activeLayer,
  } = useTechnicalDrawingStore();
  
  // Command history
  const { commands, addCommand, undoCommand, redoCommand } = useCommandHistory();
  
  // Get snapping utilities
  const { findBestSnapPoint } = useDrawingSnap();
  
  // Local state for UI and interactions
  const [cadMode, setCadMode] = useState<CADMode>(CADMode.DRAW);
  const [isDragging, setIsDragging] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [selectionBox, setSelectionBox] = useState<{start: Point; end: Point} | null>(null);
  const [currentMousePosition, setCurrentMousePosition] = useState<Point | null>(null);
  const [currentSnapPoint, setCurrentSnapPoint] = useState<SnapPoint | null>(null);
  const [drawingStart, setDrawingStart] = useState<Point | null>(null);
  const [tempDrawingEntity, setTempDrawingEntity] = useState<any | null>(null);
  const [showCommandLine, setShowCommandLine] = useState(false);
  const [showNumericInput, setShowNumericInput] = useState(false);
  const [numericInputType, setNumericInputType] = useState<'length' | 'angle' | 'coords'>('length');
  const [numericInputLabel, setNumericInputLabel] = useState('');
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [rightPanelContent, setRightPanelContent] = useState<
    'layers' | 'properties' | 'settings' | 'blocks' | 'mechanical' | 'dimensions' | 'viewports' | 'tolerance'
  >('properties');
  const [directDistanceEntry, setDirectDistanceEntry] = useState<string | null>(null);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState<Point>({ x: 0, y: 0 });
  const [contextMenuOptions, setContextMenuOptions] = useState<ToolOption[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showRulers, setShowRulers] = useState(true);
  const [showCoordinates, setShowCoordinates] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  
  // Tool state for complex operations
  const [toolState, setToolState] = useState<ToolState | null>(null);
  
  // Keyboard state
  const [shiftKey, setShiftKey] = useState(false);
  const [ctrlKey, setCtrlKey] = useState(false);
  const [altKey, setAltKey] = useState(false);
  const [spaceKey, setSpaceKey] = useState(false);
  
  // Measurement state
  const [measurementMode, setMeasurementMode] = useState<'distance' | 'angle' | 'area' | null>(null);
  const [measurementResult, setMeasurementResult] = useState<string | null>(null);
  
  // Transformation state
  const [copyBasePoint, setCopyBasePoint] = useState<Point | null>(null);
  const [copyEntities, setCopyEntities] = useState<string[]>([]);
  const [mirrorLine, setMirrorLine] = useState<[Point, Point] | null>(null);
  const [rotationCenter, setRotationCenter] = useState<Point | null>(null);
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [scaleCenter, setScaleCenter] = useState<Point | null>(null);
  const [scaleFactors, setScaleFactors] = useState<{ x: number; y: number }>({ x: 1, y: 1 });
  
  // Array creation state
  const [arrayType, setArrayType] = useState<'rectangular' | 'polar' | null>(null);
  const [arrayParams, setArrayParams] = useState<{
    rows?: number;
    columns?: number;
    rowSpacing?: number;
    columnSpacing?: number;
    angle?: number;
    copies?: number;
  }>({});
  
  // Canvas size tracking
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  
  // Initialize with default tool
  useEffect(() => {
    if (initialTool && initialTool !== activeTool) {
      setActiveTool(initialTool);
    }
  }, [initialTool, activeTool, setActiveTool]);
  
  // Utility function to convert screen coordinates to world coordinates
  const screenToWorld = useCallback((x: number, y: number): Point => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    
    const rect = canvasRef.current.getBoundingClientRect();
    
    // Convert screen coordinates to normalized coordinates
    const normalizedX = (x - rect.left) / rect.width;
    const normalizedY = (y - rect.top) / rect.height;
    
    // Convert normalized coordinates to world coordinates considering pan and zoom
    const worldX = pan.x + (normalizedX - 0.5) * (rect.width / zoom);
    const worldY = pan.y + (normalizedY - 0.5) * (rect.height / zoom);
    
    return { x: worldX, y: worldY };
  }, [pan, zoom]);
  
  // Utility function to convert world coordinates to screen coordinates
  const worldToScreen = useCallback((x: number, y: number): Point => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    
    const rect = canvasRef.current.getBoundingClientRect();
    
    // Convert world coordinates to normalized coordinates considering pan and zoom
    const normalizedX = 0.5 + (x - pan.x) * (zoom / rect.width);
    const normalizedY = 0.5 + (y - pan.y) * (zoom / rect.height);
    
    // Convert normalized coordinates to screen coordinates
    const screenX = rect.left + normalizedX * rect.width;
    const screenY = rect.top + normalizedY * rect.height;
    
    return { x: screenX, y: screenY };
  }, [pan, zoom]);
  
  // Adjust point for ortho or polar tracking
  const adjustPointForConstraints = useCallback((start: Point, end: Point): Point => {
    if (!start) return end;
    
    // Calculate differences and distance
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    
    // Adjust for ortho mode (0, 90, 180, 270 degrees)
    if (orthoMode) {
      // Determine the closest ortho direction
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      
      if (absX > absY) {
        // Horizontal constraint
        return { x: end.x, y: start.y };
      } else {
        // Vertical constraint
        return { x: start.x, y: end.y };
      }
    }
    
    // Adjust for polar tracking
    if (polarTracking) {
      // Calculate closest polar angle
      const angleStep = polarAngle;
      const snappedAngle = Math.round(angle / angleStep) * angleStep;
      
      // Adjust the point based on the snapped angle
      const radians = snappedAngle * Math.PI / 180;
      return {
        x: start.x + distance * Math.cos(radians),
        y: start.y + distance * Math.sin(radians)
      };
    }
    
    return end;
  }, [orthoMode, polarTracking, polarAngle]);
  
  // Find entity under cursor
  const findEntityUnderCursor = useCallback((point: Point): string | null => {
    // Check if we clicked on an entity using hit detection
    let clickedEntityId: string | null = null;
    
    // First check dimensions and annotations as they are usually on top
    Object.entries(dimensions).forEach(([id, dimension]) => {
      if (clickedEntityId) return; // Already found something
      
      if (hitTestEntity(dimension, point, zoom)) {
        clickedEntityId = id;
      }
    });
    
    Object.entries(annotations).forEach(([id, annotation]) => {
      if (clickedEntityId) return; // Already found something
      
      if (hitTestEntity(annotation, point, zoom)) {
        clickedEntityId = id;
      }
    });
    
    // Then check regular entities
    Object.entries(entities).forEach(([id, entity]) => {
      if (clickedEntityId) return; // Already found something
      
      if (hitTestEntity(entity, point, zoom)) {
        clickedEntityId = id;
      }
    });
    
    return clickedEntityId;
  }, [entities, dimensions, annotations, zoom]);
  
  // Find all entities in a rectangle
  const findEntitiesInRect = useCallback((rect: {start: Point; end: Point}): string[] => {
    const foundEntityIds: string[] = [];
    
    // Normalize rectangle (in case of negative width/height)
    const minX = Math.min(rect.start.x, rect.end.x);
    const maxX = Math.max(rect.start.x, rect.end.x);
    const minY = Math.min(rect.start.y, rect.end.y);
    const maxY = Math.max(rect.start.y, rect.end.y);
    
    // Check each entity
    Object.entries(entities).forEach(([id, entity]) => {
      // Get entity bounds
      const bounds = generateBoundsFromEntities([entity]);
      
      // Check if entity is inside or intersects the selection rectangle
      if (bounds.minX <= maxX && bounds.maxX >= minX && 
          bounds.minY <= maxY && bounds.maxY >= minY) {
        foundEntityIds.push(id);
      }
    });
    
    // Check dimensions and annotations too
    Object.entries(dimensions).forEach(([id, dimension]) => {
      // Get dimension bounds
      const bounds = generateBoundsFromEntities([dimension as any]);
      
      if (bounds.minX <= maxX && bounds.maxX >= minX && 
          bounds.minY <= maxY && bounds.maxY >= minY) {
        foundEntityIds.push(id);
      }
    });
    
    Object.entries(annotations).forEach(([id, annotation]) => {
      // Get annotation bounds
      const bounds = generateBoundsFromEntities([annotation as any]);
      
      if (bounds.minX <= maxX && bounds.maxX >= minX && 
          bounds.minY <= maxY && bounds.maxY >= minY) {
        foundEntityIds.push(id);
      }
    });
    
    return foundEntityIds;
  }, [entities, dimensions, annotations]);
  
  // Generate context menu options based on current state
  const generateContextMenuOptions = useCallback((): ToolOption[] => {
    const options: ToolOption[] = [];
    
    if (selectedEntityIds.length > 0) {
      // Selected entity context options
      options.push(
        { 
          id: 'move', 
          label: 'Move', 
          icon: <Move size={14} />, 
          shortcut: 'M',
          action: () => setActiveTool('move') 
        },
        { 
          id: 'copy', 
          label: 'Copy', 
          icon: <Copy size={14} />, 
          shortcut: 'CO',
          action: () => setActiveTool('copy') 
        },
        { 
          id: 'delete', 
          label: 'Delete', 
          icon: <X size={14} />, 
          shortcut: 'DEL',
          action: () => {
            // Track entities to be deleted for undo
            const deletedEntities: {id: string, type: string, data: any}[] = [];
            
            selectedEntityIds.forEach(id => {
              if (entities[id]) {
                deletedEntities.push({id, type: 'entity', data: entities[id]});
                deleteEntity(id);
              } else if (dimensions[id]) {
                deletedEntities.push({id, type: 'dimension', data: dimensions[id]});
                deleteDimension(id);
              } else if (annotations[id]) {
                deletedEntities.push({id, type: 'annotation', data: annotations[id]});
                deleteAnnotation(id);
              }
            });
            
            // Add to command history for undo/redo
            addCommand({
              type: 'delete',
              entities: deletedEntities,
              undo: () => {
                deletedEntities.forEach(item => {
                  if (item.type === 'entity') {
                    addEntity(item.data);
                  } else if (item.type === 'dimension') {
                    addDimension(item.data as any);
                  } else if (item.type === 'annotation') {
                    addAnnotation(item.data as any);
                  }
                });
              },
              redo: () => {
                deletedEntities.forEach(item => {
                  if (item.type === 'entity') {
                    deleteEntity(item.id);
                  } else if (item.type === 'dimension') {
                    deleteDimension(item.id);
                  } else if (item.type === 'annotation') {
                    deleteAnnotation(item.id);
                  }
                });
              }
            });
            
            clearSelection();
          } 
        }
      );
      
      if (selectedEntityIds.length === 1) {
        // Options for single selection
        options.push(
          { 
            id: 'properties', 
            label: 'Properties', 
            icon: <Info size={14} />, 
            shortcut: 'PR',
            action: () => {
              setRightPanelContent('properties');
              setShowRightPanel(true);
            } 
          }
        );
      }
    } else {
      // Empty area context options
      options.push(
        { 
          id: 'line', 
          label: 'Line', 
          icon: <Slash size={14} />, 
          shortcut: 'L',
          action: () => setActiveTool('line') 
        },
        { 
          id: 'circle', 
          label: 'Circle', 
          icon: <Circle size={14} />, 
          shortcut: 'C',
          action: () => setActiveTool('circle') 
        },
        { 
          id: 'rectangle', 
          label: 'Rectangle', 
          icon: <Square size={14} />, 
          shortcut: 'RECT',
          action: () => setActiveTool('rectangle') 
        },
        { 
          id: 'text', 
          label: 'Text', 
          icon: <Type size={14} />, 
          shortcut: 'T',
          action: () => setActiveTool('text') 
        }
      );
    }
    
    // Common options for both states
    options.push(
      { 
        id: 'paste', 
        label: 'Paste', 
        icon: <Copy size={14} />, 
        shortcut: 'CTRL+V',
        action: () => {
          // Implement paste functionality
          console.log('Paste functionality');
        } 
      },
      { 
        id: 'zoomExtents', 
        label: 'Zoom Extents', 
        icon: <Maximize2 size={14} />, 
        shortcut: 'Z E',
        action: () => zoomToFit() 
      },
      { 
        id: 'grid', 
        label: gridEnabled ? 'Hide Grid' : 'Show Grid', 
        icon: <Grid size={14} />, 
        shortcut: 'F7',
        action: () => toggleGrid() 
      }
    );
    
    return options;
  }, [
    selectedEntityIds, 
    entities, 
    dimensions, 
    annotations, 
    gridEnabled, 
    toggleGrid, 
    zoomToFit, 
    setActiveTool,
    deleteEntity,
    deleteDimension,
    deleteAnnotation,
    addEntity,
    addDimension,
    addAnnotation,
    clearSelection,
    addCommand
  ]);
  
  // Handle keyboard events
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Update key state
    if (e.key === 'Shift') setShiftKey(true);
    if (e.key === 'Control') setCtrlKey(true);
    if (e.key === 'Alt') setAltKey(true);
    if (e.key === ' ') setSpaceKey(true);
    
    // Toggle ortho mode with F8 key
    if (e.key === 'F8') {
      toggleOrthoMode();
      e.preventDefault();
    }
    
    // Toggle snap with F9 key
    if (e.key === 'F9') {
      toggleSnapping();
      e.preventDefault();
    }
    
    // Toggle grid with F7 key
    if (e.key === 'F7') {
      toggleGrid();
      e.preventDefault();
    }
    
    // Toggle polar tracking with F10 key
    if (e.key === 'F10') {
      togglePolarTracking();
      e.preventDefault();
    }
    
    // Zoom to fit with F2 key
    if (e.key === 'F2') {
      zoomToFit();
      e.preventDefault();
    }
    
    // Zoom to selection with F3 key
    if (e.key === 'F3' && selectedEntityIds.length > 0) {
      zoomToSelection();
      e.preventDefault();
    }
    
    // Temporary activate pan tool with spacebar
    if (e.key === ' ' && !isPanning) {
      setIsPanning(true);
      e.preventDefault();
    }
    
    // Undo with Ctrl+Z
    if (e.ctrlKey && e.key === 'z') {
      undoCommand();
      e.preventDefault();
    }
    
    // Redo with Ctrl+Y or Ctrl+Shift+Z
    if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
      redoCommand();
      e.preventDefault();
    }
    
    // Delete selected entities with Delete key
    if (e.key === 'Delete' && selectedEntityIds.length > 0) {
      // Track entities to be deleted for undo
      const deletedEntities: {id: string, type: string, data: any}[] = [];
      
      selectedEntityIds.forEach(id => {
        if (entities[id]) {
          deletedEntities.push({id, type: 'entity', data: entities[id]});
          deleteEntity(id);
        } else if (dimensions[id]) {
          deletedEntities.push({id, type: 'dimension', data: dimensions[id]});
          deleteDimension(id);
        } else if (annotations[id]) {
          deletedEntities.push({id, type: 'annotation', data: annotations[id]});
          deleteAnnotation(id);
        }
      });
      
      // Add to command history for undo/redo
      addCommand({
        type: 'delete',
        entities: deletedEntities,
        undo: () => {
          deletedEntities.forEach(item => {
            if (item.type === 'entity') {
              addEntity(item.data);
            } else if (item.type === 'dimension') {
              addDimension(item.data as unknown as EntityWithoutId<BaseDrawingEntity & { type: DimensionType }>);
            } else if (item.type === 'annotation') {
              addAnnotation(item.data as unknown as EntityWithoutId<BaseDrawingEntity & { type: AnnotationType }>);
            }
          });
        },
        redo: () => {
          deletedEntities.forEach(item => {
            if (item.type === 'entity') {
              deleteEntity(item.id);
            } else if (item.type === 'dimension') {
              deleteDimension(item.id);
            } else if (item.type === 'annotation') {
              deleteAnnotation(item.id);
            }
          });
        }
      });
      
      clearSelection();
      
      // Notify parent if callback exists
      if (onEntityDeleted) {
        selectedEntityIds.forEach(id => onEntityDeleted(id));
      }
      
      e.preventDefault();
    }
    
    // Escape key to cancel current operation or clear selection
    if (e.key === 'Escape') {
      if (tempDrawingEntity) {
        setTempDrawingEntity(null);
        setDrawingStart(null);
      } else if (selectedEntityIds.length > 0) {
        clearSelection();
      } else if (activeTool !== 'select') {
        setActiveTool('select');
      }
      // Also close any open UI elements
      setShowContextMenu(false);
      setShowCommandLine(false);
      setShowNumericInput(false);
      
      e.preventDefault();
    }
    
    // Tool selection shortcuts
    if (e.key === 'l') setActiveTool('line');
    if (e.key === 'c') setActiveTool('circle');
    if (e.key === 'r') setActiveTool('rectangle');
    if (e.key === 'a') setActiveTool('arc');
    if (e.key === 'p') setActiveTool('polyline');
    if (e.key === 't') setActiveTool('text');
    if (e.key === 'd') setActiveTool('dimension-linear');
    if (e.key === 's') setActiveTool('select');
    if (e.key === 'm') setActiveTool('move');
    
    // Show command line with colon or semicolon
    if (e.key === ':' || e.key === ';') {
      setShowCommandLine(true);
      e.preventDefault();
    }
    
  }, [
    isPanning, 
    toggleSnapping, 
    toggleGrid, 
    zoomToFit, 
    zoomToSelection, 
    selectedEntityIds, 
    undoCommand, 
    redoCommand, 
    deleteEntity, 
    deleteDimension, 
    deleteAnnotation, 
    entities, 
    dimensions, 
    annotations, 
    clearSelection, 
    tempDrawingEntity, 
    activeTool, 
    setActiveTool,
    addCommand,
    addEntity,
    addDimension,
    addAnnotation,
    toggleOrthoMode,
    togglePolarTracking,
    onEntityDeleted
  ]);
  
  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    // Update key state
    if (e.key === 'Shift') setShiftKey(false);
    if (e.key === 'Control') setCtrlKey(false);
    if (e.key === 'Alt') setAltKey(false);
    if (e.key === ' ') {
      setSpaceKey(false);
      setIsPanning(false);
    }
  }, []);
  
  // Set up keyboard event listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);
  
  // Handle numeric input submission
  const handleNumericInputSubmit = useCallback((value: number) => {
    if (!drawingStart || !currentMousePosition) return;
    
    if (numericInputType === 'length') {
      // Calculate the angle of the current line being drawn
      const angle = Math.atan2(
        currentMousePosition.y - drawingStart.y,
        currentMousePosition.x - drawingStart.x
      );
      
      // Calculate new endpoint based on angle and length
      const endPoint = {
        x: drawingStart.x + value * Math.cos(angle),
        y: drawingStart.y + value * Math.sin(angle)
      };
      
      // Update temp entity
      if (tempDrawingEntity && tempDrawingEntity.type === 'line') {
        setTempDrawingEntity({
          ...tempDrawingEntity,
          endPoint
        });
      }
    } else if (numericInputType === 'angle') {
      // Calculate current distance
      const distance = Math.sqrt(
        Math.pow(currentMousePosition.x - drawingStart.x, 2) +
        Math.pow(currentMousePosition.y - drawingStart.y, 2)
      );
      
      // Calculate new endpoint based on angle and current distance
      const angleRad = value * Math.PI / 180;
      const endPoint = {
        x: drawingStart.x + distance * Math.cos(angleRad),
        y: drawingStart.y + distance * Math.sin(angleRad)
      };
      
      // Update temp entity
      if (tempDrawingEntity && tempDrawingEntity.type === 'line') {
        setTempDrawingEntity({
          ...tempDrawingEntity,
          endPoint
        });
      }
    } else if (numericInputType === 'coords') {
      // Direct coordinate input
      const endPoint = {
        x: drawingStart.x + value,
        y: drawingStart.y + value
      };
      
      // Update temp entity
      if (tempDrawingEntity && tempDrawingEntity.type === 'line') {
        setTempDrawingEntity({
          ...tempDrawingEntity,
          endPoint
        });
      }
    }
    
    setShowNumericInput(false);
  }, [drawingStart, currentMousePosition, numericInputType, tempDrawingEntity]);
  
  // Handle command line submission
  const handleCommandSubmit = useCallback((command: string) => {
    setShowCommandLine(false);
    
    // Process command
    const parts = command.trim().toLowerCase().split(' ');
    if (parts.length === 0) return;
    
    const mainCommand = parts[0];
    
    // Tool selection commands
    if (mainCommand === 'line' || mainCommand === 'l') setActiveTool('line');
    if (mainCommand === 'circle' || mainCommand === 'c') setActiveTool('circle');
    if (mainCommand === 'rectangle' || mainCommand === 'rect' || mainCommand === 'r') setActiveTool('rectangle');
    if (mainCommand === 'arc' || mainCommand === 'a') setActiveTool('arc');
    if (mainCommand === 'polyline' || mainCommand === 'pl') setActiveTool('polyline');
    if (mainCommand === 'text' || mainCommand === 't') setActiveTool('text');
    if (mainCommand === 'dimension' || mainCommand === 'dim') setActiveTool('dimension-linear');
    if (mainCommand === 'select' || mainCommand === 's') setActiveTool('select');
    if (mainCommand === 'move' || mainCommand === 'm') setActiveTool('move');
    
    // View commands
    if (mainCommand === 'zoom') {
      if (parts[1] === 'all' || parts[1] === 'fit') {
        zoomToFit();
      } else if (parts[1] === 'in') {
        setZoom(zoom * 1.5);
      } else if (parts[1] === 'out') {
        setZoom(zoom * 0.75);
      } else {
        try {
          const factor = parseFloat(parts[1]);
          if (!isNaN(factor)) {
            setZoom(factor);
          }
        } catch (e) {
          console.error('Invalid zoom factor');
        }
      }
    }
    
    // Toggle commands
    if (mainCommand === 'grid') toggleGrid();
    if (mainCommand === 'snap') toggleSnapping();
    if (mainCommand === 'ortho') toggleOrthoMode();
    if (mainCommand === 'polar') togglePolarTracking();
    
    // Grid size command
    if (mainCommand === 'gridsize' && parts.length > 1) {
      try {
        const size = parseFloat(parts[1]);
        if (!isNaN(size) && size > 0) {
          setGridSize(size);
        }
      } catch (e) {
        console.error('Invalid grid size');
      }
    }
    
    // Layer commands
    if (mainCommand === 'layer') {
      if (parts.length === 1) {
        setRightPanelContent('layers');
        setShowRightPanel(true);
      } else if (parts.length > 1) {
        const layerName = parts[1];
        if (drawingLayers.some(layer => layer.name === layerName)) {
          setActiveLayer(layerName);
        }
      }
    }
    
    // Properties command
    if (mainCommand === 'properties' || mainCommand === 'props') {
      setRightPanelContent('properties');
      setShowRightPanel(true);
    }
    
    // Undo/redo commands
    if (mainCommand === 'undo' || mainCommand === 'u') undoCommand();
    if (mainCommand === 'redo' || mainCommand === 'r') redoCommand();
    
  }, [
    setActiveTool, 
    zoomToFit, 
    zoom, 
    setZoom, 
    toggleGrid, 
    toggleSnapping, 
    setGridSize, 
    drawingLayers, 
    setActiveLayer,
    undoCommand,
    redoCommand,
    toggleOrthoMode,
    togglePolarTracking
  ]);
  
  // Measurement tools
  const startMeasurement = useCallback((mode: 'distance' | 'angle' | 'area') => {
    setMeasurementMode(mode);
    setMeasurementResult(null);
    setToolState({
      type: 'measure',
      step: 0,
      points: [],
      tempPoints: [],
      params: { mode }
    });
    
    // Set the active tool temporarily to 'measure'
    setActiveTool('measure');
  }, [setActiveTool]);
  
  const completeMeasurement = useCallback(() => {
    if (!toolState || toolState.type !== 'measure') return;
    
    const { points, params } = toolState;
    if (params.mode === 'distance' && points.length === 2) {
      const distance = calculateDistance(points[0], points[1]);
      setMeasurementResult(`Distance: ${distance.toFixed(2)}`);
    } else if (params.mode === 'angle' && points.length === 3) {
      const angle1 = calculateAngle(points[1], points[0]);
      const angle2 = calculateAngle(points[1], points[2]);
      let angle = Math.abs(angle1 - angle2);
      if (angle > 180) {
        angle = 360 - angle;
      }
      setMeasurementResult(`Angle: ${angle.toFixed(2)}°`);
    } else if (params.mode === 'area' && points.length >= 3) {
      // Calculate polygon area using shoelace formula
      let area = 0;
      for (let i = 0; i < points.length; i++) {
        const j = (i + 1) % points.length;
        area += points[i].x * points[j].y;
        area -= points[j].x * points[i].y;
      }
      area = Math.abs(area) / 2;
      setMeasurementResult(`Area: ${area.toFixed(2)} sq units`);
    }
    
    setToolState(null);
    setMeasurementMode(null);
    setActiveTool('select');
  }, [toolState, setActiveTool]);
  
  // Handle context menu
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    
    const worldPoint = screenToWorld(e.clientX, e.clientY);
    
    // Generate options based on current state
    const options = generateContextMenuOptions();
    
    // Set context menu state
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setContextMenuOptions(options);
    setShowContextMenu(true);
  }, [screenToWorld, generateContextMenuOptions]);
  
  // Close context menu when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showContextMenu) {
        setShowContextMenu(false);
      }
    };
    
    window.addEventListener('click', handleClickOutside);
    return () => {
      window.removeEventListener('click', handleClickOutside);
    };
  }, [showContextMenu]);
  
  // Array creation function
  const createArray = useCallback((type: 'rectangular' | 'polar', params: any) => {
    if (!selectedEntityIds.length) return;
    
    const sourceEntities = selectedEntityIds.map(id => ({
      id,
      data: entities[id] || dimensions[id] || annotations[id]
    })).filter(({ data }) => data !== undefined);
    
    if (type === 'rectangular') {
      const { rows = 2, columns = 2, rowSpacing = 50, columnSpacing = 50 } = params;
      
      // Track created entities for undo
      const createdEntities: {id: string, data: any}[] = [];
      
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
          if (row === 0 && col === 0) continue; // Skip original
          
          sourceEntities.forEach(({ data }) => {
            const offset = {
              x: col * columnSpacing,
              y: row * rowSpacing
            };
            const copiedEntity = copyEntity(data, offset);
            const newId = addEntity(copiedEntity as any);
            createdEntities.push({ id: newId, data: copiedEntity });
            
            // Notify parent if callback exists
            if (onEntityCreated) {
              onEntityCreated(newId);
            }
          });
        }
      }
      
      // Add to command history
      addCommand({
        type: 'array',
        description: `Created ${createdEntities.length} entities in rectangular array`,
        undo: () => {
          createdEntities.forEach(({ id }) => {
            deleteEntity(id);
            if (onEntityDeleted) onEntityDeleted(id);
          });
        },
        redo: () => {
          createdEntities.forEach(({ data }) => {
            const newId = addEntity(data as any);
            if (onEntityCreated) onEntityCreated(newId);
          });
        }
      });
      
    } else if (type === 'polar') {
      const { center, copies = 6, angle = 360 } = params;
      const angleStep = angle / copies;
      
      // Track created entities for undo
      const createdEntities: {id: string, data: any}[] = [];
      
      for (let i = 1; i < copies; i++) {
        const currentAngle = i * angleStep;
        sourceEntities.forEach(({ data }) => {
          const rotatedEntity = rotateEntity(data, center, currentAngle);
          const newId = addEntity(rotatedEntity as any);
          createdEntities.push({ id: newId, data: rotatedEntity });
          
          // Notify parent if callback exists
          if (onEntityCreated) {
            onEntityCreated(newId);
          }
        });
      }
      
      // Add to command history
      addCommand({
        type: 'array',
        description: `Created ${createdEntities.length} entities in polar array`,
        undo: () => {
          createdEntities.forEach(({ id }) => {
            deleteEntity(id);
            if (onEntityDeleted) onEntityDeleted(id);
          });
        },
        redo: () => {
          createdEntities.forEach(({ data }) => {
            const newId = addEntity(data as any);
            if (onEntityCreated) onEntityCreated(newId);
          });
        }
      });
    }
  }, [
    selectedEntityIds, 
    entities, 
    dimensions, 
    annotations, 
    addEntity, 
    deleteEntity, 
    addCommand,
    onEntityCreated,
    onEntityDeleted
  ]);
  
  // Handle mouse down
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    
    // Right click for context menu
    if (e.button === 2) {
      handleContextMenu(e);
      return;
    }
    
    // Get world coordinates of mouse click
    const mouseWorld = screenToWorld(e.clientX, e.clientY);
    
    // Check snapping
    const snapPoint = snappingEnabled ? findBestSnapPoint(mouseWorld) : null;
    const targetPoint = snapPoint || mouseWorld;
    
    // Handle based on active tool or space key (temporary pan)
    if (isPanning || spaceKey || activeTool === 'pan') {
      setIsDragging(true);
      setDragStart(mouseWorld);
      return;
    }
    
    if (activeTool === 'select') {
      // Find if we clicked on an entity
      const clickedEntityId = findEntityUnderCursor(targetPoint);
      
      if (clickedEntityId) {
        // Select entity (with shift for multi-select)
        if (e.shiftKey) {
          if (selectedEntityIds.includes(clickedEntityId)) {
            deselectEntity(clickedEntityId);
          } else {
            selectEntity(clickedEntityId, true);
          }
        } else {
          selectEntity(clickedEntityId);
        }
        
        // Notify parent if callback exists
        if (onEntitySelected) {
          onEntitySelected(clickedEntityId);
        }
      } else {
        // Click on empty space, clear selection unless shift is held
        if (!e.shiftKey) {
          clearSelection();
        }
        
        // Start a selection box
        setIsDragging(true);
        setIsSelecting(true);
        setDragStart(targetPoint);
        setSelectionBox({ start: targetPoint, end: targetPoint });
      }
    } else if (activeTool === 'line') {
      // Start drawing a line
      if (!drawingStart) {
        setDrawingStart(targetPoint);
        setTempDrawingEntity({
          type: 'line',
          startPoint: targetPoint,
          endPoint: targetPoint
        });
      } else {
        // Finish the line
        if (drawingStart.x !== targetPoint.x || drawingStart.y !== targetPoint.y) {
          const newEntity: Omit<LineEntity, 'id' | 'style'> = {
            type: 'line',
            layer: activeLayer,
            visible: true,
            locked: false,
            startPoint: drawingStart,
            endPoint: targetPoint
          };
          
          const newEntityId = addEntity(newEntity as any);
          
          // Add to command history
          addCommand({
            type: 'add-entity',
            entityId: newEntityId,
            undo: () => {
              deleteEntity(newEntityId);
              if (onEntityDeleted) onEntityDeleted(newEntityId);
            },
            redo: () => {
              addEntity(newEntity as any);
              if (onEntityCreated) onEntityCreated(newEntityId);
            }
          });
          
          // Notify parent if callback exists
          if (onEntityCreated) {
            onEntityCreated(newEntityId);
          }
          
          // Continue drawing from the end point if shift is pressed
          if (e.shiftKey) {
            setDrawingStart(targetPoint);
            setTempDrawingEntity({
              type: 'line',
              startPoint: targetPoint,
              endPoint: targetPoint
            });
          } else {
            setDrawingStart(null);
            setTempDrawingEntity(null);
          }
        }
      }
    } else if (activeTool === 'circle') {
      // Start drawing a circle
      if (!drawingStart) {
        setDrawingStart(targetPoint);
        setTempDrawingEntity({
          type: 'circle',
          center: targetPoint,
          radius: 0
        });
      } else {
        // Finish the circle - don't add zero-radius circles
        const radius = Math.sqrt(
          Math.pow(targetPoint.x - drawingStart.x, 2) + 
          Math.pow(targetPoint.y - drawingStart.y, 2)
        );
        
        if (radius > 0) {
          const newEntity: Omit<CircleEntity, 'id' | 'style'> = {
            type: 'circle',
            layer: activeLayer,
            visible: true,
            locked: false,
            center: drawingStart,
            radius
          };
          
          const newEntityId = addEntity(newEntity as any);
          
          // Add to command history
          addCommand({
            type: 'add-entity',
            entityId: newEntityId,
            undo: () => {
              deleteEntity(newEntityId);
              if (onEntityDeleted) onEntityDeleted(newEntityId);
            },
            redo: () => {
              addEntity(newEntity as any);
              if (onEntityCreated) onEntityCreated(newEntityId);
            }
          });
          
          // Notify parent if callback exists
          if (onEntityCreated) {
            onEntityCreated(newEntityId);
          }
        }
        
        setDrawingStart(null);
        setTempDrawingEntity(null);
      }
    } else if (activeTool === 'rectangle') {
      // Start drawing a rectangle
      if (!drawingStart) {
        setDrawingStart(targetPoint);
        setTempDrawingEntity({
          type: 'rectangle',
          position: targetPoint,
          width: 0,
          height: 0
        });
      } else {
        // Finish the rectangle - don't add zero-area rectangles
        if (targetPoint.x !== drawingStart.x && targetPoint.y !== drawingStart.y) {
          // Normalize rectangle coordinates
          const x = Math.min(drawingStart.x, targetPoint.x);
          const y = Math.min(drawingStart.y, targetPoint.y);
          const width = Math.abs(targetPoint.x - drawingStart.x);
          const height = Math.abs(targetPoint.y - drawingStart.y);
          
          const newEntity: Omit<RectangleEntity, 'id' | 'style'> = {
            type: 'rectangle',
            layer: activeLayer,
            visible: true,
            locked: false,
            position: { x, y },
            width,
            height
          };
          
          const newEntityId = addEntity(newEntity as any);
          
          // Add to command history
          addCommand({
            type: 'add-entity',
            entityId: newEntityId,
            undo: () => {
              deleteEntity(newEntityId);
              if (onEntityDeleted) onEntityDeleted(newEntityId);
            },
            redo: () => {
              addEntity(newEntity as any);
              if (onEntityCreated) onEntityCreated(newEntityId);
            }
          });
          
          // Notify parent if callback exists
          if (onEntityCreated) {
            onEntityCreated(newEntityId);
          }
        }
        
        setDrawingStart(null);
        setTempDrawingEntity(null);
      }
    } else if (activeTool === 'arc') {
      // Multi-step arc creation
      if (!drawingStart) {
        // First click - start point
        setDrawingStart(targetPoint);
        setTempDrawingEntity({
          type: 'arc',
          center: targetPoint,
          radius: 0,
          startAngle: 0,
          endAngle: 0
        });
      } else if (tempDrawingEntity && tempDrawingEntity.type === 'arc' && tempDrawingEntity.step === undefined) {
        // Second click - define radius and start angle
        const radius = Math.sqrt(
          Math.pow(targetPoint.x - drawingStart.x, 2) + 
          Math.pow(targetPoint.y - drawingStart.y, 2)
        );
        
        const startAngle = Math.atan2(
          targetPoint.y - drawingStart.y,
          targetPoint.x - drawingStart.x
        );
        
        setTempDrawingEntity({
          ...tempDrawingEntity,
          radius,
          startAngle,
          endAngle: startAngle,
          step: 1
        });
      } else if (tempDrawingEntity && tempDrawingEntity.type === 'arc' && tempDrawingEntity.step === 1) {
        // Third click - define end angle and create arc
        const endAngle = Math.atan2(
          targetPoint.y - drawingStart.y,
          targetPoint.x - drawingStart.x
        );
        
        if (tempDrawingEntity.radius > 0 && endAngle !== tempDrawingEntity.startAngle) {
          const newEntity: Omit<ArcEntity, 'id' | 'style'> = {
            type: 'arc',
            layer: activeLayer,
            visible: true,
            locked: false,
            center: drawingStart,
            radius: tempDrawingEntity.radius,
            startAngle: tempDrawingEntity.startAngle,
            endAngle: endAngle,
            counterclockwise: endAngle < tempDrawingEntity.startAngle
          };
          
          const newEntityId = addEntity(newEntity as any);
          
          // Add to command history
          addCommand({
            type: 'add-entity',
            entityId: newEntityId,
            undo: () => {
              deleteEntity(newEntityId);
              if (onEntityDeleted) onEntityDeleted(newEntityId);
            },
            redo: () => {
              addEntity(newEntity as any);
              if (onEntityCreated) onEntityCreated(newEntityId);
            }
          });
          
          // Notify parent if callback exists
          if (onEntityCreated) {
            onEntityCreated(newEntityId);
          }
        }
        
        setDrawingStart(null);
        setTempDrawingEntity(null);
      }
    } else if (activeTool === 'polyline') {
      // Multi-point polyline creation
      if (!drawingStart) {
        // First click - start point
        setDrawingStart(targetPoint);
        setTempDrawingEntity({
          type: 'polyline',
          points: [targetPoint]
        });
      } else {
        // Additional click - add point to polyline
        const updatedPoints = [...tempDrawingEntity.points, targetPoint];
        
        // If double-click, finish the polyline
        if (e.detail === 2) {
          if (updatedPoints.length >= 2) {
            const newEntity: Omit<PolylineEntity, 'id' | 'style'> = {
              type: 'polyline',
              layer: activeLayer,
              visible: true,
              locked: false,
              points: updatedPoints,
              closed: e.altKey // Alt key to close the polyline
            };
            
            const newEntityId = addEntity(newEntity as any);
            
            // Add to command history
            addCommand({
              type: 'add-entity',
              entityId: newEntityId,
              undo: () => {
                deleteEntity(newEntityId);
                if (onEntityDeleted) onEntityDeleted(newEntityId);
              },
              redo: () => {
                addEntity(newEntity as any);
                if (onEntityCreated) onEntityCreated(newEntityId);
              }
            });
            
            // Notify parent if callback exists
            if (onEntityCreated) {
              onEntityCreated(newEntityId);
            }
          }
          
          setDrawingStart(null);
          setTempDrawingEntity(null);
        } else {
          // Continue adding points
          setTempDrawingEntity({
            ...tempDrawingEntity,
            points: updatedPoints
          });
          
          // Update the start point for the next segment
          setDrawingStart(targetPoint);
        }
      }
    } else if (activeTool === 'dimension-linear') {
      // Multi-step dimension creation
      if (!drawingStart) {
        // First click - first point
        setDrawingStart(targetPoint);
        setTempDrawingEntity({
          type: 'linear-dimension',
          startPoint: targetPoint,
          endPoint: targetPoint,
          offsetDistance: 10
        });
      } else if (tempDrawingEntity && tempDrawingEntity.type === 'linear-dimension' && !tempDrawingEntity.offsetPoint) {
        // Second click - second point
        setTempDrawingEntity({
          ...tempDrawingEntity,
          endPoint: targetPoint,
          offsetPoint: { x: targetPoint.x, y: targetPoint.y + 10 } // Default offset position
        });
      } else if (tempDrawingEntity && tempDrawingEntity.type === 'linear-dimension' && tempDrawingEntity.offsetPoint) {
        // Third click - offset position and create dimension
        const dx = Math.abs(tempDrawingEntity.endPoint.x - drawingStart.x);
        const dy = Math.abs(tempDrawingEntity.endPoint.y - drawingStart.y);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const newDimension: Omit<LinearDimension, 'id' | 'style'> = {
          type: 'linear-dimension',
          layer: 'dimensions',
          visible: true,
          locked: false,
          startPoint: drawingStart,
          endPoint: tempDrawingEntity.endPoint,
          offsetDistance: Math.abs(targetPoint.y - drawingStart.y),
          text: `${Math.round(distance * 100) / 100}`
        };
        
        const newDimensionId = addDimension(newDimension as unknown as EntityWithoutId<BaseDrawingEntity & { type: DimensionType }>);
        
        // Add to command history
        addCommand({
          type: 'add-dimension',
          dimensionId: newDimensionId,
          undo: () => {
            deleteDimension(newDimensionId);
            if (onEntityDeleted) onEntityDeleted(newDimensionId);
          },
          redo: () => {
            addDimension(newDimension as unknown as EntityWithoutId<BaseDrawingEntity & { type: DimensionType }>);
            if (onEntityCreated) onEntityCreated(newDimensionId);
          }
        });
        
        // Notify parent if callback exists
        if (onEntityCreated) {
          onEntityCreated(newDimensionId);
        }
        
        setDrawingStart(null);
        setTempDrawingEntity(null);
      }
    } else if (activeTool === 'text') {
      // Add a text annotation
      const text = prompt('Enter text:');
      if (text) {
        const newAnnotation: Omit<TextAnnotation, 'id' | 'style'> = {
          type: 'text-annotation',
          layer: 'annotations',
          visible: true,
          locked: false,
          position: targetPoint,
          text
        };
        
        const newAnnotationId = addAnnotation(newAnnotation as unknown as EntityWithoutId<BaseDrawingEntity & { type: AnnotationType }>);
        
        // Add to command history
        addCommand({
          type: 'add-annotation',
          annotationId: newAnnotationId,
          undo: () => {
            deleteAnnotation(newAnnotationId);
            if (onEntityDeleted) onEntityDeleted(newAnnotationId);
          },
          redo: () => {
            addAnnotation(newAnnotation as unknown as EntityWithoutId<BaseDrawingEntity & { type: AnnotationType }>);
            if (onEntityCreated) onEntityCreated(newAnnotationId);
          }
        });
        
        // Notify parent if callback exists
        if (onEntityCreated) {
          onEntityCreated(newAnnotationId);
        }
      }
    } else if (activeTool === 'measure') {
      if (toolState && toolState.type === 'measure') {
        const updatedPoints = [...toolState.points, targetPoint];
        setToolState({
          ...toolState,
          points: updatedPoints
        });
        
        // Check if measurement is complete
        if ((toolState.params.mode === 'distance' && updatedPoints.length === 2) ||
            (toolState.params.mode === 'angle' && updatedPoints.length === 3) ||
            (toolState.params.mode === 'area' && e.detail === 2 && updatedPoints.length >= 3)) {
          completeMeasurement();
        }
      }
    }
  }, [
    screenToWorld, 
    activeTool, 
    snappingEnabled, 
    findBestSnapPoint, 
    drawingStart, 
    findEntityUnderCursor, 
    selectEntity, 
    deselectEntity, 
    clearSelection, 
    selectedEntityIds,
    activeLayer,
    addEntity,
    addDimension, 
    addAnnotation,
    deleteEntity,
    deleteDimension,
    deleteAnnotation,
    addCommand,
    spaceKey,
    isPanning,
    tempDrawingEntity,
    toolState,
    completeMeasurement,
    onEntityCreated,
    onEntitySelected,
    onEntityDeleted,
    handleContextMenu
  ]);
  
  // Handle mouse move
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    
    // Get world coordinates of mouse
    const mouseWorld = screenToWorld(e.clientX, e.clientY);
    setCurrentMousePosition(mouseWorld);
    
    // Check snapping
    const snapPoint = snappingEnabled ? findBestSnapPoint(mouseWorld) : null;
    setCurrentSnapPoint(snapPoint);
    
    const targetPoint = snapPoint || mouseWorld;
    
    // Handling dragging (pan or selection box)
    if (isDragging) {
      if ((activeTool === 'pan' || isPanning || spaceKey) && dragStart) {
        // Pan the view
        const dx = mouseWorld.x - dragStart.x;
        const dy = mouseWorld.y - dragStart.y;
        setPan({ x: pan.x - dx, y: pan.y - dy });
      } else if (isSelecting && dragStart) {
        // Update selection box
        setSelectionBox({ 
          start: dragStart, 
          end: targetPoint 
        });
      }
    }
    
    // Update temporary drawing entity
    if (tempDrawingEntity) {
      if (tempDrawingEntity.type === 'line') {
        // Apply constraints if needed
        let endpoint = targetPoint;
        
        if (orthoMode || polarTracking) {
          endpoint = adjustPointForConstraints(drawingStart as Point, targetPoint);
        }
        
        setTempDrawingEntity({
          ...tempDrawingEntity,
          endPoint: endpoint
        });
      } else if (tempDrawingEntity.type === 'circle' && drawingStart) {
        const radius = Math.sqrt(
          Math.pow(targetPoint.x - drawingStart.x, 2) +
          Math.pow(targetPoint.y - drawingStart.y, 2)
        );
        
        setTempDrawingEntity({
          ...tempDrawingEntity,
          radius
        });
      } else if (tempDrawingEntity.type === 'rectangle' && drawingStart) {
        // Apply ortho constraints if needed for consistent rectangle
        let endpoint = targetPoint;
        
        if (orthoMode) {
          // For rectangles in ortho mode, keep aspect ratio if shift is pressed
          if (shiftKey) {
            const dx = Math.abs(targetPoint.x - drawingStart.x);
            const dy = Math.abs(targetPoint.y - drawingStart.y);
            const size = Math.max(dx, dy);
            
            endpoint = {
              x: drawingStart.x + (targetPoint.x > drawingStart.x ? size : -size),
              y: drawingStart.y + (targetPoint.y > drawingStart.y ? size : -size)
            };
          }
        }
        
        setTempDrawingEntity({
          ...tempDrawingEntity,
          width: endpoint.x - drawingStart.x,
          height: endpoint.y - drawingStart.y
        });
      } else if (tempDrawingEntity.type === 'arc' && drawingStart) {
        if (tempDrawingEntity.step === undefined) {
          // Updating radius and start angle
          const radius = Math.sqrt(
            Math.pow(targetPoint.x - drawingStart.x, 2) +
            Math.pow(targetPoint.y - drawingStart.y, 2)
          );
          
          const startAngle = Math.atan2(
            targetPoint.y - drawingStart.y,
            targetPoint.x - drawingStart.x
          );
          
          setTempDrawingEntity({
            ...tempDrawingEntity,
            radius,
            startAngle,
            endAngle: startAngle
          });
        } else if (tempDrawingEntity.step === 1) {
          // Updating end angle
          const endAngle = Math.atan2(
            targetPoint.y - drawingStart.y,
            targetPoint.x - drawingStart.x
          );
          
          setTempDrawingEntity({
            ...tempDrawingEntity,
            endAngle
          });
        }
      } else if (tempDrawingEntity.type === 'polyline') {
        // For polylines, show the next potential segment
        if (tempDrawingEntity.points.length > 0) {
          const lastPoint = tempDrawingEntity.points[tempDrawingEntity.points.length - 1];
          
          // Apply constraints if needed
          let endpoint = targetPoint;
          
          if (orthoMode || polarTracking) {
            endpoint = adjustPointForConstraints(lastPoint, targetPoint);
          }
          
          setTempDrawingEntity({
            ...tempDrawingEntity,
            currentPoint: endpoint
          });
        }
      } else if (tempDrawingEntity.type === 'linear-dimension') {
        if (!tempDrawingEntity.offsetPoint) {
          // Updating second point
          setTempDrawingEntity({
            ...tempDrawingEntity,
            endPoint: targetPoint
          });
        } else {
          // Updating offset distance
          setTempDrawingEntity({
            ...tempDrawingEntity,
            offsetPoint: targetPoint
          });
        }
      }
    }
    
    // Update measurement tool preview
    if (toolState && toolState.type === 'measure') {
      // Show temp point for measurement preview
      const updatedTempPoints = [...toolState.points, targetPoint];
      setToolState({
        ...toolState,
        tempPoints: updatedTempPoints
      });
    }
    
    // Hover detection
    if (!isDragging && !tempDrawingEntity && activeTool === 'select') {
      const hoveredId = findEntityUnderCursor(targetPoint);
      setHoveredEntity(hoveredId);
    }
    
  }, [
    screenToWorld, 
    isDragging, 
    isPanning, 
    spaceKey, 
    activeTool, 
    dragStart, 
    isSelecting, 
    pan, 
    setPan, 
    tempDrawingEntity, 
    drawingStart, 
    snappingEnabled, 
    findBestSnapPoint, 
    orthoMode, 
    polarTracking, 
    shiftKey, 
    findEntityUnderCursor, 
    setHoveredEntity, 
    adjustPointForConstraints,
    toolState
  ]);
  
  // Handle mouse up
  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    // Handle selection box completion
    if (isDragging && isSelecting && selectionBox) {
      // Find all entities in the selection box
      const entitiesInBox = findEntitiesInRect(selectionBox);
      
      // Select these entities (with shift for adding to selection)
      if (entitiesInBox.length > 0) {
        if (e.shiftKey) {
          // Add to current selection
          entitiesInBox.forEach(id => {
            if (!selectedEntityIds.includes(id)) {
              selectEntity(id, true);
            }
          });
        } else {
          // Replace current selection
          clearSelection();
          entitiesInBox.forEach(id => {
            selectEntity(id, true);
          });
        }
        
        // Notify parent if callback exists
        if (onEntitySelected) {
          onEntitySelected(entitiesInBox);
        }
      }
    }
    
    // Reset dragging state
    if (isDragging) {
      setIsDragging(false);
      setIsSelecting(false);
      setDragStart(null);
      setSelectionBox(null);
    }
  }, [
    isDragging, 
    isSelecting, 
    selectionBox, 
    findEntitiesInRect, 
    selectedEntityIds, 
    selectEntity, 
    clearSelection,
    onEntitySelected
  ]);
  
  // Handle mouse wheel for zooming
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    
    // Get world coordinates of mouse
    const mouseWorld = screenToWorld(e.clientX, e.clientY);
    
    // Calculate new zoom level
    const zoomFactor = e.deltaY * -0.001;
    const newZoom = zoom * (1 + zoomFactor);
    
    // Limit zoom range
    const limitedZoom = Math.max(0.1, Math.min(100, newZoom));
    
    // Calculate new pan to zoom toward mouse position
    const scale = limitedZoom / zoom;
    const newPan = {
      x: mouseWorld.x - (mouseWorld.x - pan.x) * scale,
      y: mouseWorld.y - (mouseWorld.y - pan.y) * scale
    };
    
    setZoom(limitedZoom);
    setPan(newPan);
  }, [zoom, pan, screenToWorld, setZoom, setPan]);
  
  // Resize canvas on container resize
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;
    
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        if (entry.target === containerRef.current) {
          const { width, height } = entry.contentRect;
          
          // Set canvas size
          if (canvasRef.current) {
            canvasRef.current.width = width;
            canvasRef.current.height = height;
            
            // Update state for calculations
            setCanvasSize({ width, height });
          }
        }
      }
    });
    
    resizeObserver.observe(containerRef.current);
    
    return () => {
      resizeObserver.disconnect();
    };
  }, []);
  
  // Render CAD drawing function
  const renderDrawing = useCallback(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Get canvas size
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // Set up transform for pan and zoom
    ctx.save();
    
    // Translate to center of canvas
    ctx.translate(width / 2, height / 2);
    
    // Apply zoom
    ctx.scale(zoom, zoom);
    
    // Apply pan
    ctx.translate(-pan.x, -pan.y);
    
    // Draw grid if enabled
    if (gridEnabled) {
      ctx.beginPath();
      
      // Draw minor grid
      ctx.strokeStyle = '#f0f0f0';
      ctx.lineWidth = 0.25 / zoom;
      
      // Calculate grid bounds
      const startX = Math.floor((pan.x - width / (2 * zoom)) / gridSize) * gridSize;
      const endX = Math.ceil((pan.x + width / (2 * zoom)) / gridSize) * gridSize;
      const startY = Math.floor((pan.y - height / (2 * zoom)) / gridSize) * gridSize;
      const endY = Math.ceil((pan.y + height / (2 * zoom)) / gridSize) * gridSize;
      
      // Draw vertical grid lines
      for (let x = startX; x <= endX; x += gridSize) {
        ctx.moveTo(x, startY);
        ctx.lineTo(x, endY);
      }
      
      // Draw horizontal grid lines
      for (let y = startY; y <= endY; y += gridSize) {
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
      }
      
      ctx.stroke();
      
      // Draw major grid (every 5 minor grid lines)
      ctx.beginPath();
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 0.5 / zoom;
      
      // Draw major vertical grid lines
      for (let x = startX; x <= endX; x += gridSize * 5) {
        ctx.moveTo(x, startY);
        ctx.lineTo(x, endY);
      }
      
      // Draw major horizontal grid lines
      for (let y = startY; y <= endY; y += gridSize * 5) {
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
      }
      
      ctx.stroke();
    }
    
    // Draw axes
    ctx.beginPath();
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 1 / zoom;
    
    // Calculate grid bounds
    const startX = Math.floor((pan.x - width / (2 * zoom)) / gridSize) * gridSize;
    const endX = Math.ceil((pan.x + width / (2 * zoom)) / gridSize) * gridSize;
    const startY = Math.floor((pan.y - height / (2 * zoom)) / gridSize) * gridSize;
    const endY = Math.ceil((pan.y + height / (2 * zoom)) / gridSize) * gridSize;
    
    // X axis
    ctx.moveTo(startX, 0);
    ctx.lineTo(endX, 0);
    
    // Y axis
    ctx.moveTo(0, startY);
    ctx.lineTo(0, endY);
    
    ctx.stroke();
    
    // Draw all entities
    Object.entries(entities).forEach(([id, entity]) => {
      drawEntity(ctx, entity, {
        isSelected: selectedEntityIds.includes(id),
        isHovered: id === hoveredEntityId,
        zoom
      });
    });
    
    // Draw all dimensions
    Object.entries(dimensions).forEach(([id, dimension]) => {
      drawDimension(ctx, dimension, {
        isSelected: selectedEntityIds.includes(id),
        isHovered: id === hoveredEntityId,
        zoom
      });
    });
    
    // Draw all annotations
    Object.entries(annotations).forEach(([id, annotation]) => {
      drawAnnotation(ctx, annotation, {
        isSelected: selectedEntityIds.includes(id),
        isHovered: id === hoveredEntityId,
        zoom
      });
    });
    
    // Draw temporary entity while drawing
    if (tempDrawingEntity) {
      drawTempEntity(ctx, tempDrawingEntity, drawingStart, zoom);
    }
      
    // Draw selection box
    if (selectionBox) {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(30, 136, 229, 0.8)';
      ctx.fillStyle = 'rgba(30, 136, 229, 0.1)';
      ctx.lineWidth = 1 / zoom;
      ctx.setLineDash([5 / zoom, 5 / zoom]);
      
      const x = Math.min(selectionBox.start.x, selectionBox.end.x);
      const y = Math.min(selectionBox.start.y, selectionBox.end.y);
      const width = Math.abs(selectionBox.end.x - selectionBox.start.x);
      const height = Math.abs(selectionBox.end.y - selectionBox.start.y);
          
      ctx.rect(x, y, width, height);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
    }
    
    // Draw snap indicator
    if (currentSnapPoint) {
      ctx.strokeStyle = '#2e7d32'; // Green for snap
      ctx.fillStyle = '#2e7d32';
      ctx.lineWidth = 1.5 / zoom;
      ctx.setLineDash([]);
      
      // Draw snap point as a small cross
      ctx.beginPath();
      ctx.arc(currentSnapPoint.x, currentSnapPoint.y, 3 / zoom, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw crosshair
      ctx.beginPath();
      ctx.moveTo(currentSnapPoint.x - 5 / zoom, currentSnapPoint.y);
      ctx.lineTo(currentSnapPoint.x + 5 / zoom, currentSnapPoint.y);
      ctx.moveTo(currentSnapPoint.x, currentSnapPoint.y - 5 / zoom);
      ctx.lineTo(currentSnapPoint.x, currentSnapPoint.y + 5 / zoom);
      ctx.stroke();

      // Draw snap type indicator
      const snapTypeText = currentSnapPoint.type.charAt(0).toUpperCase() + currentSnapPoint.type.slice(1);
      ctx.font = `${10 / zoom}px Arial`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(snapTypeText, currentSnapPoint.x + 8 / zoom, currentSnapPoint.y + 8 / zoom);
    }
    
    // Draw measurement tool preview
    if (toolState && toolState.type === 'measure') {
      ctx.strokeStyle = '#2196f3';
      ctx.lineWidth = 1.5 / zoom;
      ctx.setLineDash([5 / zoom, 3 / zoom]);
      
      const points = [...toolState.points, ...(toolState.tempPoints.slice(toolState.points.length))];
      
      if (points.length > 0) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }
        
        if (toolState.params.mode === 'area' && points.length >= 3) {
          // Close the polygon for area measurement
          ctx.lineTo(points[0].x, points[0].y);
        }
        
        ctx.stroke();
      }
      
      // Draw measurement result if available
      if (measurementResult && points.length > 0) {
        const lastPoint = points[points.length - 1];
        ctx.font = `${12 / zoom}px Arial`;
        ctx.fillStyle = '#2196f3';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText(measurementResult, lastPoint.x + 5 / zoom, lastPoint.y - 5 / zoom);
      }
    }
    
    // Restore transform for screen-space drawing
    ctx.restore();
    
    // Draw rulers if enabled
    if (showRulers) {
      const rulerSize = 20;
      
      // Draw ruler backgrounds
      ctx.fillStyle = '#f5f5f5';
      ctx.fillRect(0, 0, width, rulerSize);
      ctx.fillRect(0, 0, rulerSize, height);
      
      // Draw ruler frames
      ctx.strokeStyle = '#cccccc';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, rulerSize);
      ctx.lineTo(width, rulerSize);
      ctx.moveTo(rulerSize, 0);
      ctx.lineTo(rulerSize, height);
      ctx.stroke();
      
      // Draw ruler corner
      ctx.fillStyle = '#e0e0e0';
      ctx.fillRect(0, 0, rulerSize, rulerSize);
      
      // Draw ruler ticks and labels
      ctx.fillStyle = '#555555';
      ctx.font = '9px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      
      // Calculate visible world bounds
      const leftWorld = pan.x - (width / 2) / zoom;
      const rightWorld = pan.x + (width / 2) / zoom;
      const topWorld = pan.y - (height / 2) / zoom;
      const bottomWorld = pan.y + (height / 2) / zoom;
      
      // Horizontal ruler (X axis)
      const tickSpacing = calculateTickSpacing(zoom);
      const startX = Math.floor(leftWorld / tickSpacing) * tickSpacing;
      const endX = Math.ceil(rightWorld / tickSpacing) * tickSpacing;
      
      for (let x = startX; x <= endX; x += tickSpacing) {
        const screenX = worldToScreen(x, 0).x;
        
        // Skip if outside ruler area
        if (screenX < rulerSize || screenX > width) continue;
        
        ctx.beginPath();
        ctx.moveTo(screenX, rulerSize);
        ctx.lineTo(screenX, x % (tickSpacing * 5) === 0 ? rulerSize - 10 : rulerSize - 5);
        ctx.stroke();
        
        if (x % (tickSpacing * 5) === 0) {
          ctx.fillText(x.toString(), screenX, 2);
        }
      }
      
      // Vertical ruler (Y axis)
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      
      const startY = Math.floor(topWorld / tickSpacing) * tickSpacing;
      const endY = Math.ceil(bottomWorld / tickSpacing) * tickSpacing;
      
      for (let y = startY; y <= endY; y += tickSpacing) {
        const screenY = worldToScreen(0, y).y;
        
        // Skip if outside ruler area
        if (screenY < rulerSize || screenY > height) continue;
        
        ctx.beginPath();
        ctx.moveTo(rulerSize, screenY);
        ctx.lineTo(y % (tickSpacing * 5) === 0 ? rulerSize - 10 : rulerSize - 5, screenY);
        ctx.stroke();
        
        if (y % (tickSpacing * 5) === 0) {
          ctx.fillText(y.toString(), rulerSize - 2, screenY);
        }
      }
    }
    
    // Draw cursor coordinates in screen space
    if (currentMousePosition && showCoordinates) {
      const coordsText = `X: ${Math.round(currentMousePosition.x * 100) / 100}, Y: ${Math.round(currentMousePosition.y * 100) / 100}`;
      
      ctx.font = '12px Arial';
      ctx.fillStyle = '#333';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(coordsText, 10, height - 25);
      
      // Draw zoom level
      const zoomText = `Zoom: ${Math.round(zoom * 100) / 100}x`;
      ctx.fillText(zoomText, 10, height - 45);
      
      // Draw active tool
      if (activeTool) {
        const toolText = `Tool: ${activeTool}`;
        ctx.fillText(toolText, 10, height - 65);
      }
      
      // Draw active layer
      const layerText = `Layer: ${activeLayer}`;
      ctx.fillText(layerText, 200, height - 25);
      
      // Draw mode indicators
      let modeText = '';
      if (orthoMode) modeText += 'ORTHO ';
      if (polarTracking) modeText += 'POLAR ';
      if (snappingEnabled) modeText += 'SNAP ';
      if (gridEnabled) modeText += 'GRID ';
      
      if (modeText) {
        ctx.fillText(modeText, 200, height - 45);
      }
    }
  }, [
    entities, 
    dimensions, 
    annotations, 
    selectedEntityIds, 
    hoveredEntityId, 
    zoom, 
    pan, 
    tempDrawingEntity, 
    drawingStart,
    currentSnapPoint, 
    currentMousePosition, 
    activeTool,
    gridEnabled,
    gridSize,
    selectionBox,
    orthoMode,
    polarTracking,
    snappingEnabled,
    activeLayer,
    toolState,
    measurementResult,
    worldToScreen,
    showRulers,
    showCoordinates
  ]);
  
  // Helper function to calculate ruler tick spacing based on zoom
  const calculateTickSpacing = useCallback((zoom: number): number => {
    // Base spacing at zoom = 1
    const baseSpacing = 50;
    
    // Adjust based on zoom level
    if (zoom <= 0.1) return baseSpacing * 100;
    if (zoom <= 0.2) return baseSpacing * 50;
    if (zoom <= 0.5) return baseSpacing * 20;
    if (zoom <= 1) return baseSpacing * 10;
    if (zoom <= 2) return baseSpacing * 5;
    if (zoom <= 5) return baseSpacing * 2;
    if (zoom <= 10) return baseSpacing;
    if (zoom <= 20) return baseSpacing / 2;
    if (zoom <= 50) return baseSpacing / 5;
    return baseSpacing / 10;
  }, []);
  
  // Run rendering on each frame
  useEffect(() => {
    if (canvasRef.current) {
      renderDrawing();
    }
  }, [renderDrawing]);
  
  // Set up fullscreen handling
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(err => {
        console.error(`Error attempting to exit fullscreen: ${err.message}`);
      });
    }
  }, []);
  
  // Render the component
  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-full overflow-hidden bg-white flex flex-col"
      style={{ width, height }}
    >
      {/* Top Toolbar - conditional rendering */}
      {showToolbar && (
        <div className="bg-gray-900 border-b border-gray-700 px-2 py-1 flex items-center justify-between">
          <div className="flex items-center space-x-1">
            {/* Drawing tools */}
            <button 
              onClick={() => setActiveTool('select')}
              className={`p-1.5 rounded ${activeTool === 'select' ? 'bg-blue-700' : 'hover:bg-gray-700'}`}
              title="Select (S)"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" 
                   strokeWidth="2" fill="none" className="text-gray-300">
                <path d="M3 3l7 7m0 0v-6m0 6h-6"></path>
              </svg>
            </button>
            <button 
              onClick={() => setActiveTool('line')}
              className={`p-1.5 rounded ${activeTool === 'line' ? 'bg-blue-700' : 'hover:bg-gray-700'}`}
              title="Line (L)"
            >
              <Slash size={18} className="text-gray-300" />
            </button>
            <button 
              onClick={() => setActiveTool('circle')}
              className={`p-1.5 rounded ${activeTool === 'circle' ? 'bg-blue-700' : 'hover:bg-gray-700'}`}
              title="Circle (C)"
            >
              <Circle size={18} className="text-gray-300" />
            </button>
            <button 
              onClick={() => setActiveTool('rectangle')}
              className={`p-1.5 rounded ${activeTool === 'rectangle' ? 'bg-blue-700' : 'hover:bg-gray-700'}`}
              title="Rectangle (R)"
            >
              <Square size={18} className="text-gray-300" />
            </button>
            <button 
              onClick={() => setActiveTool('arc')}
              className={`p-1.5 rounded ${activeTool === 'arc' ? 'bg-blue-700' : 'hover:bg-gray-700'}`}
              title="Arc (A)"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" 
                   strokeWidth="2" fill="none" className="text-gray-300">
                <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-9-9"></path>
              </svg>
            </button>
            <button 
              onClick={() => setActiveTool('polyline')}
              className={`p-1.5 rounded ${activeTool === 'polyline' ? 'bg-blue-700' : 'hover:bg-gray-700'}`}
              title="Polyline (PL)"
            >
              <PenTool size={18} className="text-gray-300" />
            </button>
            
            {/* Separator */}
            <div className="w-px h-6 bg-gray-700 mx-1"></div>
            
            {/* Annotation tools */}
            <button 
              onClick={() => setActiveTool('text')}
              className={`p-1.5 rounded ${activeTool === 'text' ? 'bg-blue-700' : 'hover:bg-gray-700'}`}
              title="Text (T)"
            >
              <Type size={18} className="text-gray-300" />
            </button>
            <button 
              onClick={() => setActiveTool('dimension-linear')}
              className={`p-1.5 rounded ${activeTool === 'dimension-linear' ? 'bg-blue-700' : 'hover:bg-gray-700'}`}
              title="Linear Dimension (D)"
            >
              <ArrowRight size={18} className="text-gray-300" />
            </button>
          </div>
          
          <div className="flex items-center space-x-1">
            {/* View controls */}
            <button 
              onClick={() => zoomToFit}
              className="p-1.5 rounded hover:bg-gray-700"
              title="Zoom Extents"
            >
              <Maximize2 size={18} className="text-gray-300" />
            </button>
            <button 
              onClick={() => toggleGrid()}
              className={`p-1.5 rounded ${gridEnabled ? 'bg-blue-700' : 'hover:bg-gray-700'}`}
              title="Toggle Grid (F7)"
            >
              <Grid size={18} className="text-gray-300" />
            </button>
            <button 
              onClick={() => setShowRulers(!showRulers)}
              className={`p-1.5 rounded ${showRulers ? 'bg-blue-700' : 'hover:bg-gray-700'}`}
              title="Toggle Rulers"
            >
              <Ruler size={18} className="text-gray-300" />
            </button>
            <button 
              onClick={toggleFullscreen}
              className="p-1.5 rounded hover:bg-gray-700"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" 
                   strokeWidth="2" fill="none" className="text-gray-300">
                {isFullscreen ? 
                  <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path> :
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
                }
              </svg>
            </button>
          </div>
        </div>
      )}
      
      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Drawing Canvas */}
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          onContextMenu={handleContextMenu}
          className="absolute inset-0"
          style={{ cursor: `${activeTool === 'pan' || isPanning ? 'grab' : 'crosshair'}` }}
        ></canvas>
        
        {/* Context Menu */}
        {showContextMenu && (
          <div 
            className="absolute z-50 bg-gray-800 border border-gray-700 rounded shadow-lg py-1 overflow-hidden"
            style={{ 
              left: contextMenuPosition.x, 
              top: contextMenuPosition.y,
              minWidth: '180px'
            }}
          >
            {contextMenuOptions.map((option) => (
              <button
                key={option.id}
                onClick={(e) => {
                  e.stopPropagation();
                  option.action();
                  setShowContextMenu(false);
                }}
                className="w-full flex items-center px-3 py-2 text-sm text-gray-300 hover:bg-gray-700"
              >
                {option.icon && <span className="mr-2">{option.icon}</span>}
                <span>{option.label}</span>
                {option.shortcut && (
                  <span className="ml-auto text-xs text-gray-500">{option.shortcut}</span>
                )}
              </button>
            ))}
          </div>
        )}
        
        {/* Measurement Results */}
        {measurementResult && (
          <div className="absolute top-4 left-4 bg-gray-800 text-white px-3 py-2 rounded-md shadow-lg">
            {measurementResult}
            <button 
              className="ml-2 text-gray-400 hover:text-white"
              onClick={() => setMeasurementResult(null)}
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>
      
      {/* Right Side Panel */}
      {showRightPanel && (
        <div className="absolute top-0 right-0 h-full w-64 bg-gray-800 border-l border-gray-700 overflow-auto z-10">
          <div className="flex justify-between items-center px-4 py-2 border-b border-gray-700">
            <h3 className="text-white font-medium">
              {rightPanelContent === 'properties' && 'Properties'}
              {rightPanelContent === 'layers' && 'Layers'}
              {rightPanelContent === 'settings' && 'Settings'}
              {rightPanelContent === 'blocks' && 'Blocks'}
              {rightPanelContent === 'mechanical' && 'Mechanical Symbols'}
              {rightPanelContent === 'dimensions' && 'Dimensions'}
              {rightPanelContent === 'viewports' && 'Viewports'}
              {rightPanelContent === 'tolerance' && 'Tolerances'}
            </h3>
            <button 
              onClick={() => setShowRightPanel(false)}
              className="text-gray-400 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
          
          <div className="p-3">
            {rightPanelContent === 'properties' && selectedEntityIds.length > 0 && (
              <PropertiesPanel entityIds={selectedEntityIds} onClose={() => setShowRightPanel(false)} />
            )}
            
            {rightPanelContent === 'layers' && (
              <LayerPanel onClose={() => setShowRightPanel(false)} />
            )}
            
            {rightPanelContent === 'settings' && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-white text-sm font-medium mb-2">Grid Settings</h4>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-gray-300 text-sm">Grid Enabled</label>
                    <button
                      onClick={() => toggleGrid()}
                      className={`w-10 h-5 rounded-full relative ${gridEnabled ? 'bg-blue-600' : 'bg-gray-600'}`}
                    >
                      <span 
                        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform bg-white ${gridEnabled ? 'transform translate-x-5' : ''}`}
                      ></span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-gray-300 text-sm">Grid Size</label>
                    <input 
                      type="number"
                      value={gridSize}
                      onChange={(e) => setGridSize(Math.max(1, parseInt(e.target.value) || 10))}
                      className="bg-gray-700 text-white border border-gray-600 rounded w-20 px-2 py-1"
                    />
                  </div>
                </div>
                
                <div>
                  <h4 className="text-white text-sm font-medium mb-2">Snap Settings</h4>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-gray-300 text-sm">Snap Enabled</label>
                    <button
                      onClick={() => toggleSnapping()}
                      className={`w-10 h-5 rounded-full relative ${snappingEnabled ? 'bg-blue-600' : 'bg-gray-600'}`}
                    >
                      <span 
                        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform bg-white ${snappingEnabled ? 'transform translate-x-5' : ''}`}
                      ></span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-gray-300 text-sm">Ortho Mode</label>
                    <button
                      onClick={() => toggleOrthoMode()}
                      className={`w-10 h-5 rounded-full relative ${orthoMode ? 'bg-blue-600' : 'bg-gray-600'}`}
                    >
                      <span 
                        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform bg-white ${orthoMode ? 'transform translate-x-5' : ''}`}
                      ></span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-gray-300 text-sm">Polar Tracking</label>
                    <button
                      onClick={() => togglePolarTracking()}
                      className={`w-10 h-5 rounded-full relative ${polarTracking ? 'bg-blue-600' : 'bg-gray-600'}`}
                    >
                      <span 
                        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform bg-white ${polarTracking ? 'transform translate-x-5' : ''}`}
                      ></span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-gray-300 text-sm">Polar Angle</label>
                    <input 
                      type="number"
                      value={polarAngle}
                      onChange={(e) => setPolarAngle(Math.max(1, parseInt(e.target.value) || 45))}
                      className="bg-gray-700 text-white border border-gray-600 rounded w-20 px-2 py-1"
                    />
                  </div>
                </div>
                
                <div>
                  <h4 className="text-white text-sm font-medium mb-2">Display Settings</h4>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-gray-300 text-sm">Show Rulers</label>
                    <button
                      onClick={() => setShowRulers(!showRulers)}
                      className={`w-10 h-5 rounded-full relative ${showRulers ? 'bg-blue-600' : 'bg-gray-600'}`}
                    >
                      <span 
                        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform bg-white ${showRulers ? 'transform translate-x-5' : ''}`}
                      ></span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-gray-300 text-sm">Show Coordinates</label>
                    <button
                      onClick={() => setShowCoordinates(!showCoordinates)}
                      className={`w-10 h-5 rounded-full relative ${showCoordinates ? 'bg-blue-600' : 'bg-gray-600'}`}
                    >
                      <span 
                        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform bg-white ${showCoordinates ? 'transform translate-x-5' : ''}`}
                      ></span>
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {rightPanelContent === 'dimensions' && (
              <DimensioningPanel />
            )}
            
            {rightPanelContent === 'viewports' && (
              <ViewportsPanel />
            )}
            
            {rightPanelContent === 'tolerance' && (
              <GeometricTolerancePanel />
            )}
            
            {rightPanelContent === 'blocks' && (
              <BlocksPanel />
            )}
            
            {rightPanelContent === 'mechanical' && (
              <MechanicalSymbolsPanel
               onClose={() => setShowRightPanel(false)} 

              />
            )}
          </div>
        </div>
      )}
      
      {/* Bottom Status Bar */}
      {showStatusBar && (
        <div className="bg-gray-800 border-t border-gray-700 px-3 py-1 flex justify-between items-center text-sm text-gray-400">
          <div className="flex items-center space-x-4">
            <div>
              {currentMousePosition && 
                `X: ${Math.round(currentMousePosition.x * 100) / 100}, Y: ${Math.round(currentMousePosition.y * 100) / 100}`
              }
            </div>
            <div>
              Layer: <span className="text-white">{activeLayer}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => toggleOrthoMode()}
              className={`px-2 py-0.5 rounded text-xs ${orthoMode ? 'bg-blue-700 text-blue-100' : 'text-gray-400'}`}
              title="Toggle Ortho Mode (F8)"
            >
              ORTHO
            </button>
            <button 
              onClick={() => toggleSnapping()}
              className={`px-2 py-0.5 rounded text-xs ${snappingEnabled ? 'bg-blue-700 text-blue-100' : 'text-gray-400'}`}
              title="Toggle Snap (F9)"
            >
              SNAP
            </button>
            <button 
              onClick={() => toggleGrid()}
              className={`px-2 py-0.5 rounded text-xs ${gridEnabled ? 'bg-blue-700 text-blue-100' : 'text-gray-400'}`}
              title="Toggle Grid (F7)"
            >
              GRID
            </button>
            <button 
              onClick={() => togglePolarTracking()}
              className={`px-2 py-0.5 rounded text-xs ${polarTracking ? 'bg-blue-700 text-blue-100' : 'text-gray-400'}`}
              title="Toggle Polar (F10)"
            >
              POLAR
            </button>
          </div>
        </div>
      )}
      
      {/* Command Line */}
      {showCommandLine && (
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-gray-800 border-t border-gray-700 p-2">
          <CommandLine 
            onSubmit={handleCommandSubmit} 
            onCancel={() => setShowCommandLine(false)} 
          />
        </div>
      )}
      
      {/* Numeric Input */}
      {showNumericInput && (
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-gray-800 border-t border-gray-700 p-2">
          <NumericInput 
            label={numericInputLabel} 
            onSubmit={handleNumericInputSubmit} 
            onCancel={() => setShowNumericInput(false)}
          />
        </div>
      )}
    </div>
  );
};