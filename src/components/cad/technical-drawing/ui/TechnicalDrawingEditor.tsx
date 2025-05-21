import React, { useState, useRef, useEffect } from 'react';
import LayersPanel from './panels/LayersPanel';
import PropertiesPanel from './panels/PropertiesPanel';
import ToolsPanel from './panels/ToolsPanel';
import CommandLine, { Command } from './CommandLine';
import CoordinateInput from './inputs/CoordinateInput';
import { Point, DrawingEntity } from '../../../../types/TechnicalDrawingTypes';
import { DrawingTool } from './panels/ToolsPanel';

interface TechnicalDrawingEditorProps {
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  onToolChange?: (tool: DrawingTool) => void;
  onCommandExecute?: (command: string, params: any[]) => void;
  initialEntities?: DrawingEntity[];
}

const TechnicalDrawingEditor: React.FC<TechnicalDrawingEditorProps> = ({
  width = '100%',
  height = '100%',
  className = '',
  style = {},
  onToolChange,
  onCommandExecute,
  initialEntities = [],
}) => {
  // Canvas refs for drawing
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // State
  const [activeTool, setActiveTool] = useState<DrawingTool>('select');
  const [entities, setEntities] = useState<DrawingEntity[]>(initialEntities);
  const [selectedEntities, setSelectedEntities] = useState<DrawingEntity[]>([]);
  const [layers, setLayers] = useState([
    { id: 'default', name: 'Default', visible: true, locked: false, color: '#000000' },
    { id: 'geometry', name: 'Geometry', visible: true, locked: false, color: '#ff0000' },
    { id: 'dimensions', name: 'Dimensions', visible: true, locked: false, color: '#0000ff' },
    { id: 'annotations', name: 'Annotations', visible: true, locked: false, color: '#00aa00' },
  ]);
  const [activeLayerId, setActiveLayerId] = useState('default');
  const [cursorPosition, setCursorPosition] = useState<Point>({ x: 0, y: 0 });
  const [viewportTransform, setViewportTransform] = useState({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  });
  const [showCommandLine, setShowCommandLine] = useState(true);
  const [showCoordinateInput, setShowCoordinateInput] = useState(true);
  
  // Available commands for the command line
  const commands: Command[] = [
    {
      name: 'line',
      aliases: ['l'],
      description: 'Draw a line between two points',
      parameters: [
        { name: 'startPoint', type: 'point', description: 'Starting point of the line', required: true },
        { name: 'endPoint', type: 'point', description: 'Ending point of the line', required: true },
      ],
      action: (params) => {
        console.log('Line command executed with params:', params);
        // Implementation would go here
      },
    },
    {
      name: 'circle',
      aliases: ['c'],
      description: 'Draw a circle',
      parameters: [
        { name: 'center', type: 'point', description: 'Center point of the circle', required: true },
        { name: 'radius', type: 'number', description: 'Radius of the circle', required: true },
      ],
      action: (params) => {
        console.log('Circle command executed with params:', params);
        // Implementation would go here
      },
    },
    {
      name: 'rectangle',
      aliases: ['rect', 'r'],
      description: 'Draw a rectangle',
      parameters: [
        { name: 'firstCorner', type: 'point', description: 'First corner point', required: true },
        { name: 'secondCorner', type: 'point', description: 'Opposite corner point', required: true },
      ],
      action: (params) => {
        console.log('Rectangle command executed with params:', params);
        // Implementation would go here
      },
    },
    {
      name: 'arc',
      aliases: ['a'],
      description: 'Draw an arc',
      parameters: [
        { name: 'center', type: 'point', description: 'Center point of the arc', required: true },
        { name: 'radius', type: 'number', description: 'Radius of the arc', required: true },
        { name: 'startAngle', type: 'number', description: 'Start angle in degrees', required: true },
        { name: 'endAngle', type: 'number', description: 'End angle in degrees', required: true },
      ],
      action: (params) => {
        console.log('Arc command executed with params:', params);
        // Implementation would go here
      },
    },
    {
      name: 'polygon',
      aliases: ['poly', 'p'],
      description: 'Draw a regular polygon',
      parameters: [
        { name: 'center', type: 'point', description: 'Center point of the polygon', required: true },
        { name: 'radius', type: 'number', description: 'Radius (distance to vertices)', required: true },
        { name: 'sides', type: 'number', description: 'Number of sides', required: true },
        { name: 'rotation', type: 'number', description: 'Rotation angle in degrees', required: false, default: 0 },
      ],
      action: (params) => {
        console.log('Polygon command executed with params:', params);
        // Implementation would go here
      },
    },
    {
      name: 'grid',
      description: 'Toggle grid visibility or set grid size',
      parameters: [
        { name: 'visible', type: 'boolean', description: 'Show or hide grid', required: false },
        { name: 'size', type: 'number', description: 'Grid spacing', required: false },
      ],
      action: (params) => {
        console.log('Grid command executed with params:', params);
        // Implementation would go here
      },
    },
    {
      name: 'snap',
      description: 'Toggle snap to grid or set snap options',
      parameters: [
        { name: 'enabled', type: 'boolean', description: 'Enable or disable snap', required: false },
        { name: 'type', type: 'string', description: 'Snap type (grid, endpoint, intersection)', required: false },
      ],
      action: (params) => {
        console.log('Snap command executed with params:', params);
        // Implementation would go here
      },
    },
    {
      name: 'zoom',
      aliases: ['z'],
      description: 'Zoom to a specific scale or area',
      parameters: [
        { name: 'scale', type: 'number', description: 'Zoom scale factor', required: false },
        { name: 'center', type: 'point', description: 'Center point to zoom to', required: false },
      ],
      action: (params) => {
        console.log('Zoom command executed with params:', params);
        // Implementation would go here
      },
    },
    {
      name: 'pan',
      description: 'Pan the view to a specific point',
      parameters: [
        { name: 'point', type: 'point', description: 'Point to pan to', required: true },
      ],
      action: (params) => {
        console.log('Pan command executed with params:', params);
        // Implementation would go here
      },
    },
    {
      name: 'select',
      aliases: ['sel'],
      description: 'Select entities by type, layer, or property',
      parameters: [
        { name: 'type', type: 'string', description: 'Entity type to select', required: false },
        { name: 'layer', type: 'string', description: 'Layer name', required: false },
      ],
      action: (params) => {
        console.log('Select command executed with params:', params);
        // Implementation would go here
      },
    },
    {
      name: 'delete',
      aliases: ['del', 'erase'],
      description: 'Delete selected entities',
      action: (params) => {
        console.log('Delete command executed');
        // Implementation would go here
      },
    },
    {
      name: 'undo',
      description: 'Undo last action',
      action: (params) => {
        console.log('Undo command executed');
        // Implementation would go here
      },
    },
    {
      name: 'redo',
      description: 'Redo last undone action',
      action: (params) => {
        console.log('Redo command executed');
        // Implementation would go here
      },
    },
    {
      name: 'layer',
      description: 'Create or modify layers',
      parameters: [
        { name: 'action', type: 'string', description: 'Action (create, delete, set)', required: true },
        { name: 'name', type: 'string', description: 'Layer name', required: true },
        { name: 'property', type: 'string', description: 'Property to set (color, visible, locked)', required: false },
        { name: 'value', type: 'string', description: 'Value to set', required: false },
      ],
      action: (params) => {
        console.log('Layer command executed with params:', params);
        // Implementation would go here
      },
    },
    {
      name: 'help',
      aliases: ['?'],
      description: 'Show available commands or get help for a specific command',
      parameters: [
        { name: 'command', type: 'string', description: 'Command name to get help for', required: false },
      ],
      action: (params) => {
        console.log('Help command executed with params:', params);
        // Implementation would go here
      },
    },
  ];

  // Handle tool selection from Tools panel
  const handleToolSelect = (tool: DrawingTool) => {
    setActiveTool(tool);
    if (onToolChange) {
      onToolChange(tool);
    }
  };

  // Handle command execution from CommandLine
  const handleCommandExecute = (command: string, params: any[]) => {
    console.log(`Command executed: ${command}`, params);
    if (onCommandExecute) {
      onCommandExecute(command, params);
    }
  };

  // Handle command errors from CommandLine
  const handleCommandError = (error: string) => {
    console.error(`Command error: ${error}`);
    // Implementation would show an error message to the user
  };

  // Handle layer selection 
  const handleLayerSelect = (layerId: string) => {
    setActiveLayerId(layerId);
  };

  // Handle coordinate changes
  const handleCoordinateChange = (point: Point) => {
    console.log('Coordinate changed:', point);
    // Implementation would use this point based on the active tool
  };

  // Handle coordinate submission
  const handleCoordinateSubmit = (point: Point) => {
    console.log('Coordinate submitted:', point);
    // Implementation would use this point based on the active tool
  };

  // Handle entity property updates
  const handleEntityUpdate = (entityId: string, updates: Partial<DrawingEntity>) => {
    setEntities(prev => 
      prev.map(entity => 
        entity.id === entityId 
          ? { ...entity, ...updates } as DrawingEntity
          : entity
      )
    );
  };

  // Handle canvas mouse events
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / viewportTransform.scale - viewportTransform.offsetX;
    const y = (e.clientY - rect.top) / viewportTransform.scale - viewportTransform.offsetY;
    
    setCursorPosition({ x, y });
  };

  // Canvas setup
  useEffect(() => {
    const canvas = canvasRef.current;
    const overlay = overlayCanvasRef.current;
    
    if (!canvas || !overlay) return;
    
    // Setup canvas context
    const ctx = canvas.getContext('2d');
    const overlayCtx = overlay.getContext('2d');
    
    if (!ctx || !overlayCtx) return;
    
    // Implement canvas drawing here...
    
    // Example: Draw a grid
    const drawGrid = () => {
      if (!ctx) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const gridSize = 20;
      const offsetX = viewportTransform.offsetX % gridSize;
      const offsetY = viewportTransform.offsetY % gridSize;
      
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      
      // Draw vertical grid lines
      for (let x = offsetX; x < canvas.width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
      }
      
      // Draw horizontal grid lines
      for (let y = offsetY; y < canvas.height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
      }
      
      ctx.stroke();
    };
    
    // Draw the grid and entities
    drawGrid();
    
    // Example: Draw entities (implementation would be more complex)
    const drawEntities = () => {
      if (!ctx) return;
      
      entities.forEach(entity => {
        // Check if the entity's layer is visible
        const layer = layers.find(l => l.id === entity.layer);
        if (!layer || !layer.visible) return;
        
        // Set styles
        ctx.strokeStyle = entity.style.strokeColor || '#000000';
        ctx.lineWidth = entity.style.strokeWidth || 1;
        
        // Draw based on entity type
        switch (entity.type) {
          case 'line':
            ctx.beginPath();
            ctx.moveTo(entity.startPoint.x, entity.startPoint.y);
            ctx.lineTo(entity.endPoint.x, entity.endPoint.y);
            ctx.stroke();
            break;
          case 'circle':
            ctx.beginPath();
            ctx.arc(entity.center.x, entity.center.y, entity.radius, 0, Math.PI * 2);
            ctx.stroke();
            break;
          // Other entity types would be implemented here
        }
      });
    };
    
    // Draw entities (implementation would be more complex)
    drawEntities();
    
    // Example: Draw overlay (selection highlights, snap indicators, etc.)
    const drawOverlay = () => {
      if (!overlayCtx) return;
      
      overlayCtx.clearRect(0, 0, overlay.width, overlay.height);
      
      // Draw selection highlights
      selectedEntities.forEach(entity => {
        overlayCtx.strokeStyle = '#0078d7';
        overlayCtx.lineWidth = 2;
        
        // Draw highlight based on entity type
        switch (entity.type) {
          case 'line':
            overlayCtx.beginPath();
            overlayCtx.moveTo(entity.startPoint.x, entity.startPoint.y);
            overlayCtx.lineTo(entity.endPoint.x, entity.endPoint.y);
            overlayCtx.stroke();
            
            // Draw control points
            overlayCtx.fillStyle = '#0078d7';
            overlayCtx.beginPath();
            overlayCtx.arc(entity.startPoint.x, entity.startPoint.y, 4, 0, Math.PI * 2);
            overlayCtx.fill();
            overlayCtx.beginPath();
            overlayCtx.arc(entity.endPoint.x, entity.endPoint.y, 4, 0, Math.PI * 2);
            overlayCtx.fill();
            break;
          case 'circle':
            overlayCtx.beginPath();
            overlayCtx.arc(entity.center.x, entity.center.y, entity.radius, 0, Math.PI * 2);
            overlayCtx.stroke();
            
            // Draw control points
            overlayCtx.fillStyle = '#0078d7';
            overlayCtx.beginPath();
            overlayCtx.arc(entity.center.x, entity.center.y, 4, 0, Math.PI * 2);
            overlayCtx.fill();
            overlayCtx.beginPath();
            overlayCtx.arc(entity.center.x + entity.radius, entity.center.y, 4, 0, Math.PI * 2);
            overlayCtx.fill();
            break;
          // Other entity types would be implemented here
        }
      });
      
      // Draw cursor position indicator
      overlayCtx.strokeStyle = '#0078d7';
      overlayCtx.lineWidth = 1;
      overlayCtx.beginPath();
      overlayCtx.moveTo(cursorPosition.x - 10, cursorPosition.y);
      overlayCtx.lineTo(cursorPosition.x + 10, cursorPosition.y);
      overlayCtx.moveTo(cursorPosition.x, cursorPosition.y - 10);
      overlayCtx.lineTo(cursorPosition.x, cursorPosition.y + 10);
      overlayCtx.stroke();
    };
    
    // Draw the overlay
    drawOverlay();
    
  }, [entities, selectedEntities, layers, cursorPosition, viewportTransform]);

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current || !overlayCanvasRef.current) return;
      
      const container = canvasRef.current.parentElement;
      if (!container) return;
      
      const { width, height } = container.getBoundingClientRect();
      
      canvasRef.current.width = width;
      canvasRef.current.height = height;
      overlayCanvasRef.current.width = width;
      overlayCanvasRef.current.height = height;
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div 
      className={`technical-drawing-editor ${className}`}
      style={{ 
        position: 'relative',
        width,
        height,
        display: 'flex',
        flexDirection: 'column',
        ...style
      }}
    >
      {/* Main toolbar */}
      <div 
        className="technical-drawing-toolbar"
        style={{
          display: 'flex',
          padding: '8px',
          borderBottom: '1px solid #ddd',
          backgroundColor: '#f5f5f5',
        }}
      >
        {/* Tool indicators and controls would go here */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ marginRight: '12px', fontWeight: 'bold' }}>
            Active Tool: {activeTool.charAt(0).toUpperCase() + activeTool.slice(1)}
          </span>
          <span>
            Layer: {layers.find(l => l.id === activeLayerId)?.name || 'None'}
          </span>
        </div>
        
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setShowCommandLine(!showCommandLine)}
            style={{
              padding: '4px 8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              background: showCommandLine ? '#e6f7ff' : '#f5f5f5',
            }}
          >
            {showCommandLine ? 'Hide Command Line' : 'Show Command Line'}
          </button>
          
          <button
            type="button"
            onClick={() => setShowCoordinateInput(!showCoordinateInput)}
            style={{
              padding: '4px 8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              background: showCoordinateInput ? '#e6f7ff' : '#f5f5f5',
            }}
          >
            {showCoordinateInput ? 'Hide Coordinate Input' : 'Show Coordinate Input'}
          </button>
        </div>
      </div>
      
      {/* Main content area */}
      <div 
        className="technical-drawing-content"
        style={{
          flex: 1,
          display: 'flex',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Drawing canvas container */}
        <div 
          className="canvas-container"
          style={{
            position: 'relative',
            flex: 1,
          }}
        >
          <canvas
            ref={canvasRef}
            className="drawing-canvas"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
            }}
            onMouseMove={handleCanvasMouseMove}
          />
          <canvas
            ref={overlayCanvasRef}
            className="overlay-canvas"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
            }}
          />
        </div>
        
        {/* Dock panels */}
        <ToolsPanel 
          activeTool={activeTool}
          onToolSelect={handleToolSelect}
          defaultPosition="left"
        />
        
        <LayersPanel
          layers={layers}
          activeLayerId={activeLayerId}
          onLayerSelect={handleLayerSelect}
          defaultPosition="right"
        />
        
        <PropertiesPanel
          selectedEntities={selectedEntities}
          onUpdateEntity={handleEntityUpdate}
          defaultPosition="right"
        />
      </div>
      
      {/* Status bar */}
      <div 
        className="technical-drawing-statusbar"
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px',
          borderTop: '1px solid #ddd',
          backgroundColor: '#f5f5f5',
          fontSize: '12px',
        }}
      >
        <div style={{ marginRight: '16px' }}>
          Coordinates: x={cursorPosition.x.toFixed(2)}, y={cursorPosition.y.toFixed(2)}
        </div>
        
        <div style={{ marginRight: '16px' }}>
          Zoom: {(viewportTransform.scale * 100).toFixed(0)}%
        </div>
        
        <div style={{ marginRight: '16px' }}>
          Entities: {entities.length}
        </div>
        
        <div style={{ marginRight: '16px' }}>
          Selected: {selectedEntities.length}
        </div>
        
        {showCoordinateInput && (
          <div style={{ marginLeft: 'auto', width: '200px' }}>
            <CoordinateInput
              onChange={handleCoordinateChange}
              onSubmit={handleCoordinateSubmit}
              placeholder="Enter coordinates..."
              allowFormatToggle={true}
            />
          </div>
        )}
      </div>
      
      {/* Command line (at the bottom) */}
      {showCommandLine && (
        <div 
          className="technical-drawing-commandline"
          style={{
            padding: '8px',
            borderTop: '1px solid #ddd',
            backgroundColor: '#f5f5f5',
          }}
        >
          <CommandLine
            commands={commands}
            onExecute={handleCommandExecute}
            onError={handleCommandError}
            placeholder="Enter command or type 'help'..."
          />
        </div>
      )}
    </div>
  );
};

export default TechnicalDrawingEditor;