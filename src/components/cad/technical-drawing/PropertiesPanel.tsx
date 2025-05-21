// src/components/cad/technical-drawing/PropertiesPanel.tsx

import React, { useState, useEffect } from 'react';
import { useTechnicalDrawingStore } from '../../../store/technicalDrawingStore';
import { 
  X, 
  ChevronDown, 
  ChevronRight, 
  Info, 
  Tool,
  Sliders,
  Layers,
  Edit3,
  Grid,
  List,
  Lock,
  Eye,
  Settings,
  Users,
  Move,
  Copy
} from 'react-feather';
import { 
  DrawingEntity, 
  LineEntity, 
  CircleEntity, 
  RectangleEntity, 
  ArcEntity,
  PolylineEntity,
  EllipseEntity,
  TextAnnotation,
  LinearDimension,
  DrawingStandard,
  DrawingStyle,
  Dimension,
  Annotation
} from 'src/types/TechnicalDrawingTypes';

interface PropertiesPanelProps {
  entityIds: string[];
  onClose: () => void;
}

interface ExpandedSections {
  general: boolean;
  geometry: boolean;
  style: boolean;
  [key: string]: boolean;
}

interface SelectedEntityState {
  type: 'entity' | 'dimension' | 'annotation';
  id: string;
  visible?: boolean;
  locked?: boolean;
  layer?: {
    id: string;
    name: string;
    color: string;
    locked: boolean;
  };
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ 
  entityIds, 
  onClose 
}) => {
  const { 
    entities,
    dimensions,
    annotations,
    drawingLayers,
    activeLayer,
    setActiveLayer,
    updateEntity,
    updateDimension,
    updateAnnotation,
    dimensionStyles
  } = useTechnicalDrawingStore();

  const [expandedSections, setExpandedSections] = useState<ExpandedSections>({
    general: true,
    geometry: true,
    style: true,
    layer: true
  });

  const [selectedEntity, setSelectedEntity] = useState<SelectedEntityState | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showLineTypePicker, setShowLineTypePicker] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [selectedLineType, setSelectedLineType] = useState<DrawingStyle['strokeStyle']>('solid');
  const [selectedLineWeight, setSelectedLineWeight] = useState(0.5);

  useEffect(() => {
    if (entityIds.length === 1) {
      const entity = entities[entityIds[0]] || dimensions[entityIds[0]] || annotations[entityIds[0]];
      if (entity) {
        setSelectedEntity({
          type: entities[entityIds[0]] ? 'entity' : dimensions[entityIds[0]] ? 'dimension' : 'annotation',
          id: entityIds[0]
        });
        setSelectedColor(entity.style.strokeColor);
        setSelectedLineType(entity.style.strokeStyle);
        setSelectedLineWeight(entity.style.strokeWidth);
      }
    } else {
      setSelectedEntity(null);
    }
  }, [entityIds, entities, dimensions, annotations]);

  // Toggle section expanded state
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Update entity property
  const updateEntityProperty = (id: string, property: string, value: any) => {
    const entity = entities[id] || dimensions[id] || annotations[id];
    if (!entity) return;

    // Style properties
    if (property === 'color' || property === 'lineType' || property === 'lineWidth') {
      const styleUpdate: Partial<DrawingStyle> = {
        strokeColor: property === 'color' ? value : entity.style.strokeColor,
        strokeStyle: property === 'lineType' ? value : entity.style.strokeStyle,
        strokeWidth: property === 'lineWidth' ? value : entity.style.strokeWidth
      };

      if (entities[id]) {
        updateEntity(id, {
          ...entity,
          style: { 
            ...entity.style,
            ...styleUpdate
          }
        } as unknown as DrawingEntity);
      } else if (dimensions[id]) {
        updateDimension(id, {
          ...entity,
          style: { 
            ...entity.style,
            ...styleUpdate
          }
        } as unknown as Dimension);
      } else if (annotations[id]) {
        updateAnnotation(id, {
          ...entity,
          style: { 
            ...entity.style,
            ...styleUpdate
          }
        } as unknown as Annotation);
      }
      return;
    }

    // Other properties
    const updates: any = {};
    
    if (isLineEntity(entity)) {
      switch (property) {
        case 'startX':
        case 'startY':
          updates.startPoint = {
            ...entity.startPoint,
            [property === 'startX' ? 'x' : 'y']: value
          };
          break;
        case 'endX':
        case 'endY':
          updates.endPoint = {
            ...entity.endPoint,
            [property === 'endX' ? 'x' : 'y']: value
          };
          break;
      }
    } else if (isCircleEntity(entity) || isArcEntity(entity)) {
      switch (property) {
        case 'centerX':
        case 'centerY':
          updates.center = {
            ...entity.center,
            [property === 'centerX' ? 'x' : 'y']: value
          };
          break;
      }
    } else if (isRectangleEntity(entity) || isTextAnnotation(entity)) {
      switch (property) {
        case 'positionX':
        case 'positionY':
          updates.position = {
            ...entity.position,
            [property === 'positionX' ? 'x' : 'y']: value
          };
          break;
      }
    }

    if (Object.keys(updates).length === 0) {
      updates[property] = value;
    }

    if (entities[id]) {
      updateEntity(id, { ...entity, ...updates } as DrawingEntity);
    } else if (dimensions[id]) {
      updateDimension(id, { ...entity, ...updates } as Dimension);
    } else if (annotations[id]) {
      updateAnnotation(id, { ...entity, ...updates } as Annotation);
    }
  };
  
  // Pre-defined colors for the color picker
  const predefinedColors = [
    '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff',
    '#ffffff', '#000000', '#808080', '#c0c0c0', '#800000', '#808000',
    '#008000', '#800080', '#008080', '#000080'
  ];
  
  // Line types
  const lineTypes = [
    { id: 'solid', name: 'Solid', pattern: null },
    { id: 'dashed', name: 'Dashed', pattern: [8, 4] },
    { id: 'dotted', name: 'Dotted', pattern: [2, 2] },
    { id: 'dashdot', name: 'Dash Dot', pattern: [8, 4, 2, 4] },
    { id: 'center', name: 'Center', pattern: [16, 4, 4, 4] },
    { id: 'phantom', name: 'Phantom', pattern: [16, 4, 4, 4, 4, 4] },
    { id: 'hidden', name: 'Hidden', pattern: [4, 4] }
  ];
  
  // Line weights
  const lineWeights = [0.13, 0.18, 0.25, 0.35, 0.5, 0.7, 1, 1.4, 2];
  
  // Render section header
  const renderSectionHeader = (title: string, section: string) => (
    <button
      onClick={() => toggleSection(section)}
      className="flex items-center justify-between w-full py-2 px-3 bg-gray-850 border-b border-gray-700"
    >
      <div className="flex items-center">
        {expandedSections[section] ? <ChevronDown size={14} className="mr-2" /> : <ChevronRight size={14} className="mr-2" />}
        <span className="text-sm font-medium text-gray-300">{title}</span>
      </div>
    </button>
  );
  
  // Render properties for line entity
  const renderLineProperties = (line: LineEntity & { id: string }) => {
    const dx = line.endPoint.x - line.startPoint.x;
    const dy = line.endPoint.y - line.startPoint.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Start X</label>
            <input 
              type="number" 
              value={line.startPoint.x}
              onChange={(e) => updateEntityProperty(entityIds[0], 'startX', parseFloat(e.target.value))}
              className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Start Y</label>
            <input 
              type="number" 
              value={line.startPoint.y}
              onChange={(e) => updateEntityProperty(entityIds[0], 'startY', parseFloat(e.target.value))}
              className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded text-white"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">End X</label>
            <input 
              type="number" 
              value={line.endPoint.x}
              onChange={(e) => updateEntityProperty(entityIds[0], 'endX', parseFloat(e.target.value))}
              className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">End Y</label>
            <input 
              type="number" 
              value={line.endPoint.y}
              onChange={(e) => updateEntityProperty(entityIds[0], 'endY', parseFloat(e.target.value))}
              className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded text-white"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Length</label>
            <div className="px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded text-gray-300">
              {length.toFixed(3)}
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Angle</label>
            <div className="px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded text-gray-300">
              {angle.toFixed(2)}°
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Render properties for circle entity
  const renderCircleProperties = (circle: CircleEntity & { id: string }) => (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Center X</label>
          <input 
            type="number" 
            value={circle.center.x}
            onChange={(e) => updateEntityProperty(entityIds[0], 'centerX', parseFloat(e.target.value))}
            className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded text-white"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Center Y</label>
          <input 
            type="number" 
            value={circle.center.y}
            onChange={(e) => updateEntityProperty(entityIds[0], 'centerY', parseFloat(e.target.value))}
            className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded text-white"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Radius</label>
        <input 
          type="number" 
          value={circle.radius}
          onChange={(e) => updateEntityProperty(entityIds[0], 'radius', parseFloat(e.target.value))}
          className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded text-white"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Diameter</label>
          <div className="px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded text-gray-300">
            {(circle.radius * 2).toFixed(3)}
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Area</label>
          <div className="px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded text-gray-300">
            {(Math.PI * circle.radius * circle.radius).toFixed(3)}
          </div>
        </div>
      </div>
    </div>
  );
  
  // Render properties for rectangle entity
  const renderRectangleProperties = (rect: RectangleEntity & { id: string }) => (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Position X</label>
          <input 
            type="number" 
            value={rect.position.x}
            onChange={(e) => updateEntityProperty(entityIds[0], 'x', parseFloat(e.target.value))}
            className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded text-white"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Position Y</label>
          <input 
            type="number" 
            value={rect.position.y}
            onChange={(e) => updateEntityProperty(entityIds[0], 'y', parseFloat(e.target.value))}
            className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded text-white"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Width</label>
          <input 
            type="number" 
            value={rect.width}
            onChange={(e) => updateEntityProperty(entityIds[0], 'width', parseFloat(e.target.value))}
            className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded text-white"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Height</label>
          <input 
            type="number" 
            value={rect.height}
            onChange={(e) => updateEntityProperty(entityIds[0], 'height', parseFloat(e.target.value))}
            className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded text-white"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Area</label>
          <div className="px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded text-gray-300">
            {(rect.width * rect.height).toFixed(3)}
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Perimeter</label>
          <div className="px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded text-gray-300">
            {(2 * (rect.width + rect.height)).toFixed(3)}
          </div>
        </div>
      </div>
    </div>
  );
  
  // Render properties for arc entity
  const renderArcProperties = (arc: ArcEntity & { id: string }) => (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Center X</label>
          <input 
            type="number" 
            value={arc.center.x}
            onChange={(e) => updateEntityProperty(entityIds[0], 'centerX', parseFloat(e.target.value))}
            className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded text-white"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Center Y</label>
          <input 
            type="number" 
            value={arc.center.y}
            onChange={(e) => updateEntityProperty(entityIds[0], 'centerY', parseFloat(e.target.value))}
            className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded text-white"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Radius</label>
        <input 
          type="number" 
          value={arc.radius}
          onChange={(e) => updateEntityProperty(entityIds[0], 'radius', parseFloat(e.target.value))}
          className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded text-white"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Start Angle</label>
          <input 
            type="number" 
            value={(arc.startAngle * 180 / Math.PI).toFixed(0)}
            onChange={(e) => updateEntityProperty(entityIds[0], 'startAngle', parseFloat(e.target.value) * Math.PI / 180)}
            className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded text-white"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">End Angle</label>
          <input 
            type="number" 
            value={(arc.endAngle * 180 / Math.PI).toFixed(0)}
            onChange={(e) => updateEntityProperty(entityIds[0], 'endAngle', parseFloat(e.target.value) * Math.PI / 180)}
            className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded text-white"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Angle Span</label>
        <div className="px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded text-gray-300">
          {Math.abs((arc.endAngle - arc.startAngle) * 180 / Math.PI).toFixed(2)}°
        </div>
      </div>
    </div>
  );
  
  // Render properties for dimension
  const renderDimensionProperties = (dimension: LinearDimension & { id: string }) => (
    <div className="space-y-2">
      <div>
        <label className="block text-xs text-gray-500 mb-1">Text</label>
        <input 
          type="text" 
          value={dimension.text}
          onChange={(e) => updateEntityProperty(entityIds[0], 'text', e.target.value)}
          className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded text-white"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Offset Distance</label>
        <input 
          type="number" 
          value={dimension.offsetDistance}
          onChange={(e) => updateEntityProperty(entityIds[0], 'offsetDistance', parseFloat(e.target.value))}
          className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded text-white"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Dimension Style</label>
        <select
          className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded text-white"
          value={dimension.style?.fontFamily || 'Arial'}
          onChange={(e) => updateEntityProperty(entityIds[0], 'dimensionStyle', e.target.value)}
        >
          {dimensionStyles?.map(style => (
            <option key={style.name} value={style.name}>{style.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
  
  // Render properties for text annotation
  const renderTextAnnotationProperties = (annotation: TextAnnotation & { id: string }) => (
    <div className="space-y-2">
      <div>
        <label className="block text-xs text-gray-500 mb-1">Text</label>
        <textarea 
          value={annotation.text}
          onChange={(e) => updateEntityProperty(entityIds[0], 'text', e.target.value)}
          className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded text-white"
          rows={3}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Position X</label>
          <input 
            type="number" 
            value={annotation.position.x}
            onChange={(e) => updateEntityProperty(entityIds[0], 'positionX', parseFloat(e.target.value))}
            className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded text-white"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Position Y</label>
          <input 
            type="number" 
            value={annotation.position.y}
            onChange={(e) => updateEntityProperty(entityIds[0], 'positionY', parseFloat(e.target.value))}
            className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded text-white"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Text Style</label>
        <select
          className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded text-white"
          value={annotation.style?.fontFamily || 'Arial'}
          onChange={(e) => updateEntityProperty(entityIds[0], 'textStyle', e.target.value)}
        >
          {['Standard', 'Title', 'Note', 'Label'].map(style => (
            <option key={style} value={style}>{style}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Text Height</label>
        <input 
          type="number" 
          value={annotation.style?.fontSize || 3.5}
          onChange={(e) => updateEntityProperty(entityIds[0], 'fontSize', parseFloat(e.target.value))}
          className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded text-white"
          step="0.5"
        />
      </div>
    </div>
  );
  
  // Type guards
  const isLineEntity = (entity: DrawingEntity | Dimension | Annotation): entity is LineEntity => {
    return entity.type === 'line';
  };

  const isCircleEntity = (entity: DrawingEntity | Dimension | Annotation): entity is CircleEntity => {
    return entity.type === 'circle';
  };

  const isRectangleEntity = (entity: DrawingEntity | Dimension | Annotation): entity is RectangleEntity => {
    return entity.type === 'rectangle';
  };

  const isArcEntity = (entity: DrawingEntity | Dimension | Annotation): entity is ArcEntity => {
    return entity.type === 'arc';
  };

  const isTextAnnotation = (entity: DrawingEntity | Dimension | Annotation): entity is TextAnnotation => {
    return entity.type === 'text-annotation';
  };

  const isLinearDimension = (entity: DrawingEntity | Dimension | Annotation): entity is LinearDimension => {
    return entity.type === 'linear-dimension';
  };

  const renderGeometryProperties = () => {
    if (entityIds.length === 1) {
      const entityId = entityIds[0];
      const selectedEntity = entities[entityId] || dimensions[entityId] || annotations[entityId];

      if (!selectedEntity) return null;

      if (isLineEntity(selectedEntity)) {
        return renderLineProperties(selectedEntity as LineEntity);
      } else if (isCircleEntity(selectedEntity)) {
        return renderCircleProperties(selectedEntity as CircleEntity);
      } else if (isRectangleEntity(selectedEntity)) {
        return renderRectangleProperties(selectedEntity as RectangleEntity);
      } else if (isArcEntity(selectedEntity)) {
        return renderArcProperties(selectedEntity as ArcEntity);
      } else if (isTextAnnotation(selectedEntity)) {
        return renderTextAnnotationProperties(selectedEntity as TextAnnotation);
      } else if (isLinearDimension(selectedEntity)) {
        return renderDimensionProperties(selectedEntity as LinearDimension);
      }

      return <div className="text-gray-400 italic text-sm p-2">Properties not available for this type.</div>;
    }
    return null;
  };
  
  // Color picker component
  const renderColorPicker = () => (
    <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-700 rounded shadow-lg z-10 p-2">
      <div className="grid grid-cols-4 gap-1">
        {predefinedColors.map(color => (
          <div
            key={color}
            className="w-6 h-6 rounded cursor-pointer"
            style={{ backgroundColor: color }}
            onClick={() => {
              setSelectedColor(color);
              updateEntityProperty(entityIds[0], 'color', color);
              setShowColorPicker(false);
            }}
          ></div>
        ))}
      </div>
      <div className="mt-2 pt-2 border-t border-gray-700">
        <label className="block text-xs text-gray-500 mb-1">Custom Color</label>
        <input
          type="color"
          value={selectedColor}
          onChange={(e) => {
            setSelectedColor(e.target.value);
            updateEntityProperty(entityIds[0], 'color', e.target.value);
          }}
          className="w-full h-8 bg-transparent cursor-pointer border-0 p-0"
        />
      </div>
    </div>
  );
  
  // Line type picker component
  const renderLineTypePicker = () => (
    <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-700 rounded shadow-lg z-10 p-2 w-48">
      {lineTypes.map(lineType => (
        <div
          key={lineType.id}
          className="flex items-center px-2 py-1 cursor-pointer hover:bg-gray-700"
          onClick={() => {
            setSelectedLineType(lineType.id as DrawingStyle['strokeStyle']);
            updateEntityProperty(entityIds[0], 'lineType', lineType.id);
            setShowLineTypePicker(false);
          }}
        >
          <div className="w-12 h-px bg-white mr-2" style={{
            borderTop: lineType.pattern 
              ? `1px ${lineType.id} white` 
              : '1px solid white'
          }}></div>
          <span className="text-gray-300 text-sm">{lineType.name}</span>
        </div>
      ))}
    </div>
  );
  
  const handlePropertyChange = (property: string, value: any) => {
    if (entityIds.length === 0) return;
    updateEntityProperty(entityIds[0], property, value);
  };
  
  return (
    <div className="h-full flex flex-col bg-gray-900 text-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <h2 className="text-lg font-semibold">Properties</h2>
        <button 
          onClick={onClose}
          className="p-1 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white"
        >
          <X size={16} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {selectedEntity ? (
          <div>
            {/* General Section */}
            {renderSectionHeader('General', 'general')}
            {expandedSections.general && (
              <div className="p-3 border-b border-gray-700 space-y-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Entity Type</label>
                  <div className="px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded text-gray-300 capitalize">
                    {selectedEntity.type.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">ID</label>
                  <div className="px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded text-gray-300 font-mono">
                    {selectedEntity.id.substring(0, 8)}...
                  </div>
                </div>
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Visible</label>
                    <button
                      onClick={() => handlePropertyChange('visible', !selectedEntity.visible)}
                      className={`flex items-center justify-center w-full px-2 py-1 text-sm ${
                        selectedEntity.visible 
                          ? 'bg-blue-900 text-blue-300 border border-blue-700' 
                          : 'bg-gray-800 text-gray-300 border border-gray-700'
                      } rounded`}
                    >
                      <Eye size={14} className="mr-1" />
                      {selectedEntity.visible ? 'Visible' : 'Hidden'}
                    </button>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Locked</label>
                    <button
                      onClick={() => handlePropertyChange('locked', !selectedEntity.locked)}
                      className={`flex items-center justify-center w-full px-2 py-1 text-sm ${
                        selectedEntity.locked 
                          ? 'bg-blue-900 text-blue-300 border border-blue-700' 
                          : 'bg-gray-800 text-gray-300 border border-gray-700'
                      } rounded`}
                    >
                      <Lock size={14} className="mr-1" />
                      {selectedEntity.locked ? 'Locked' : 'Unlocked'}
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Layer Section */}
            {renderSectionHeader('Layer', 'layer')}
            {expandedSections.layer && (
              <div className="p-3 border-b border-gray-700 space-y-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Layer</label>
                  <select
                    value={selectedEntity.layer?.name}
                    onChange={(e) => handlePropertyChange('layer', { name: e.target.value })}
                    className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded text-white"
                  >
                    {drawingLayers.map(layer => (
                      <option key={layer.name} value={layer.name}>{layer.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {drawingLayers.slice(0, 6).map(layer => (
                    <button
                      key={layer.name}
                      onClick={() => handlePropertyChange('layer', layer)}
                      className={`flex items-center text-left px-2 py-1 rounded text-xs ${
                        selectedEntity.layer?.name === layer.name 
                          ? 'bg-blue-900/50 text-blue-300' 
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      <div 
                        className="w-2 h-2 rounded-full mr-1"
                        style={{ backgroundColor: layer.color || '#ffffff' }}
                      ></div>
                      <span className="truncate">{layer.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Style Section */}
            {renderSectionHeader('Style', 'style')}
            {expandedSections.style && (
              <div className="p-3 border-b border-gray-700 space-y-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Color</label>
                  <div className="relative">
                    <button
                      onClick={() => setShowColorPicker(!showColorPicker)}
                      className="flex items-center w-full px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded text-white"
                    >
                      <div 
                        className="w-4 h-4 mr-2 rounded"
                        style={{ backgroundColor: selectedColor }}
                      ></div>
                      <span>{selectedColor}</span>
                    </button>
                    
                    {showColorPicker && renderColorPicker()}
                  </div>
                </div>
                
                {/* Only show line type and weight for entities */}
                {selectedEntity.type === 'entity' && (
                  <>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Line Type</label>
                      <div className="relative">
                        <button
                          onClick={() => setShowLineTypePicker(!showLineTypePicker)}
                          className="flex items-center w-full px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded text-white"
                        >
                          <div 
                            className="w-8 h-px bg-white mr-2"
                            style={{
                              borderTop: selectedLineType === 'solid' 
                                ? '1px solid white' 
                                : `1px ${selectedLineType} white`
                            }}
                          ></div>
                          <span className="capitalize">{selectedLineType}</span>
                        </button>
                        
                        {showLineTypePicker && renderLineTypePicker()}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Line Weight</label>
                      <select
                        value={selectedLineWeight}
                        onChange={(e) => {
                          setSelectedLineWeight(parseFloat(e.target.value));
                          handlePropertyChange('lineWeight', parseFloat(e.target.value));
                        }}
                        className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded text-white"
                      >
                        {lineWeights.map(weight => (
                          <option key={weight} value={weight}>{weight} mm</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>
            )}
            
            {/* Geometry Section */}
            {renderSectionHeader('Geometry', 'geometry')}
            {expandedSections.geometry && (
              <div className="p-3 border-b border-gray-700">
                {renderGeometryProperties()}
              </div>
            )}
          </div>
        ) : entityIds.length > 1 ? (
          // Multiple selection
          <div className="p-4">
            <div className="flex items-center justify-center mb-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-800 text-gray-400">
                <Users size={18} />
              </div>
            </div>
            <h3 className="text-center text-lg font-medium text-gray-300 mb-2">Multiple Selection</h3>
            <p className="text-center text-gray-400 text-sm mb-4">
              {entityIds.length} entities selected
            </p>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">Bulk Actions</h4>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      // Implement bulk delete
                    }}
                    className="w-full px-3 py-2 text-sm bg-red-900 hover:bg-red-800 border border-red-700 rounded text-white font-medium"
                  >
                    Delete Selected
                  </button>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        // Implement move
                      }}
                      className="flex items-center justify-center px-3 py-2 text-sm bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded text-white"
                    >
                      <Move size={14} className="mr-1" />
                      Move
                    </button>
                    
                    <button
                      onClick={() => {
                        // Implement copy
                      }}
                      className="flex items-center justify-center px-3 py-2 text-sm bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded text-white"
                    >
                      <Copy size={14} className="mr-1" />
                      Copy
                    </button>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">Modify Properties</h4>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Layer</label>
                    <select
                      className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded text-white"
                      onChange={(e) => {
                        // Implementation of bulk layer change
                        const newLayer = e.target.value;
                        entityIds.forEach(id => {
                          if (entities[id]) {
                            updateEntity(id, { layer: newLayer });
                          } else if (dimensions[id]) {
                            updateDimension(id, { layer: newLayer });
                          } else if (annotations[id]) {
                            updateAnnotation(id, { layer: newLayer });
                          }
                        });
                      }}
                    >
                      <option value="">-- Select Layer --</option>
                      {drawingLayers.map(layer => (
                        <option key={layer.name} value={layer.name}>{layer.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        // Implementation of bulk show
                        entityIds.forEach(id => {
                          if (entities[id]) {
                            updateEntity(id, { visible: true });
                          } else if (dimensions[id]) {
                            updateDimension(id, { visible: true });
                          } else if (annotations[id]) {
                            updateAnnotation(id, { visible: true });
                          }
                        });
                      }}
                      className="flex items-center justify-center px-3 py-2 text-sm bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded text-white"
                    >
                      <Eye size={14} className="mr-1" />
                      Show All
                    </button>
                    
                    <button
                      onClick={() => {
                        // Implementation of bulk hide
                        entityIds.forEach(id => {
                          if (entities[id]) {
                            updateEntity(id, { visible: false });
                          } else if (dimensions[id]) {
                            updateDimension(id, { visible: false });
                          } else if (annotations[id]) {
                            updateAnnotation(id, { visible: false });
                          }
                        });
                      }}
                      className="flex items-center justify-center px-3 py-2 text-sm bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded text-white"
                    >
                      <Eye size={14} className="mr-1" />
                      Hide All
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // No selection
          <div className="flex flex-col items-center justify-center h-full p-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-800 text-gray-500 mb-4">
              <Info size={24} />
            </div>
            <h3 className="text-xl font-medium text-gray-400 mb-2">No Selection</h3>
            <p className="text-center text-gray-500 text-sm">
              Select an entity to view and edit its properties.
            </p>
          </div>
        )}
      </div>
      
      {/* Panel Footer */}
      <div className="border-t border-gray-700 p-3 flex justify-between items-center">
        <div className="flex items-center text-gray-400 text-xs">
          {selectedEntity ? (
            <span>{entityIds.length} selected</span>
          ) : (
            <span>No selection</span>
          )}
        </div>
        
        <div className="flex space-x-2">
          <button 
            onClick={onClose}
            className="px-3 py-1.5 text-xs bg-gray-800 text-gray-300 hover:bg-gray-700 rounded border border-gray-700"
          >
            Close
          </button>
          
          <button 
            className="px-3 py-1.5 text-xs bg-gray-800 text-gray-300 hover:bg-gray-700 rounded border border-gray-700"
            title="Reset Properties"
          >
            <Settings size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};