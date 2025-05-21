import React, { useState, useEffect } from 'react';
import DockPanel from './DockPanel';
import { DrawingEntity, DrawingStyle, Point } from '../../../../../types/TechnicalDrawingTypes';

interface PropertyGroupProps {
  title: string;
  children: React.ReactNode;
  isOpen?: boolean;
}

const PropertyGroup: React.FC<PropertyGroupProps> = ({ title, children, isOpen = true }) => {
  const [expanded, setExpanded] = useState(isOpen);

  return (
    <div className="property-group" style={{ marginBottom: '12px' }}>
      <div 
        className="property-group-header" 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          fontWeight: 'bold',
          cursor: 'pointer',
          padding: '6px 0',
          borderBottom: '1px solid #eee'
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <span style={{ marginRight: '6px' }}>{expanded ? '▼' : '►'}</span>
        {title}
      </div>
      {expanded && (
        <div className="property-group-content" style={{ marginTop: '8px' }}>
          {children}
        </div>
      )}
    </div>
  );
};

interface PropertyRowProps {
  label: string;
  children: React.ReactNode;
}

const PropertyRow: React.FC<PropertyRowProps> = ({ label, children }) => {
  return (
    <div className="property-row" style={{ display: 'flex', marginBottom: '8px' }}>
      <div className="property-label" style={{ width: '40%', fontSize: '13px', paddingTop: '4px' }}>
        {label}
      </div>
      <div className="property-input" style={{ width: '60%' }}>
        {children}
      </div>
    </div>
  );
};

interface PropertiesPanelProps {
  selectedEntities: DrawingEntity[];
  onUpdateEntity?: (entityId: string, updates: Partial<DrawingEntity>) => void;
  defaultPosition?: 'left' | 'right' | 'top' | 'bottom' | 'float';
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedEntities,
  onUpdateEntity,
  defaultPosition = 'right'
}) => {
  const [entity, setEntity] = useState<DrawingEntity | null>(null);

  // Update local entity when selection changes
  useEffect(() => {
    if (selectedEntities.length === 1) {
      setEntity(selectedEntities[0]);
    } else {
      setEntity(null);
    }
  }, [selectedEntities]);

  // Handle string property change
  const handleStringPropertyChange = (property: string, value: string) => {
    if (!entity || !onUpdateEntity) return;
    
    onUpdateEntity(entity.id, { [property]: value });
  };

  // Handle number property change
  const handleNumberPropertyChange = (property: string, value: string) => {
    if (!entity || !onUpdateEntity) return;
    
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      onUpdateEntity(entity.id, { [property]: numValue });
    }
  };

  // Handle boolean property change
  const handleBooleanPropertyChange = (property: string, value: boolean) => {
    if (!entity || !onUpdateEntity) return;
    
    onUpdateEntity(entity.id, { [property]: value });
  };

  // Handle style properties change
  const handleStylePropertyChange = (property: keyof DrawingStyle, value: string | number | boolean) => {
    if (!entity || !onUpdateEntity) return;
    
    const updatedStyle = { ...entity.style, [property]: value };
    onUpdateEntity(entity.id, { style: updatedStyle });
  };

  // Handle point property change
  const handlePointPropertyChange = (property: string, coordinate: 'x' | 'y', value: string) => {
    if (!entity || !onUpdateEntity) return;
    
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;
    
    const currentPoint = (entity as any)[property] as Point;
    if (!currentPoint) return;
    
    const updatedPoint = { ...currentPoint, [coordinate]: numValue };
    onUpdateEntity(entity.id, { [property]: updatedPoint });
  };

  // Render common properties
  const renderCommonProperties = () => {
    if (!entity) return null;

    return (
      <PropertyGroup title="Common">
        <PropertyRow label="ID">
          <input
            type="text"
            value={entity.id}
            disabled
            style={{
              width: '100%',
              padding: '4px',
              border: '1px solid #ddd',
              borderRadius: '2px',
              background: '#f5f5f5'
            }}
          />
        </PropertyRow>
        
        <PropertyRow label="Layer">
          <input
            type="text"
            value={entity.layer}
            onChange={(e) => handleStringPropertyChange('layer', e.target.value)}
            style={{
              width: '100%',
              padding: '4px',
              border: '1px solid #ddd',
              borderRadius: '2px'
            }}
          />
        </PropertyRow>
        
        <PropertyRow label="Visible">
          <input
            type="checkbox"
            checked={entity.visible}
            onChange={(e) => handleBooleanPropertyChange('visible', e.target.checked)}
          />
        </PropertyRow>
        
        <PropertyRow label="Locked">
          <input
            type="checkbox"
            checked={entity.locked}
            onChange={(e) => handleBooleanPropertyChange('locked', e.target.checked)}
          />
        </PropertyRow>
      </PropertyGroup>
    );
  };

  // Render style properties
  const renderStyleProperties = () => {
    if (!entity || !entity.style) return null;

    return (
      <PropertyGroup title="Style">
        <PropertyRow label="Stroke Color">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <input
              type="color"
              value={entity.style.strokeColor || '#000000'}
              onChange={(e) => handleStylePropertyChange('strokeColor', e.target.value)}
              style={{ marginRight: '8px' }}
            />
            <input
              type="text"
              value={entity.style.strokeColor || '#000000'}
              onChange={(e) => handleStylePropertyChange('strokeColor', e.target.value)}
              style={{
                flex: 1,
                padding: '4px',
                border: '1px solid #ddd',
                borderRadius: '2px'
              }}
            />
          </div>
        </PropertyRow>
        
        <PropertyRow label="Stroke Width">
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={entity.style.strokeWidth || 1}
            onChange={(e) => handleStylePropertyChange('strokeWidth', parseFloat(e.target.value))}
            style={{
              width: '100%',
              padding: '4px',
              border: '1px solid #ddd',
              borderRadius: '2px'
            }}
          />
        </PropertyRow>
        
        <PropertyRow label="Stroke Style">
          <select
            value={entity.style.strokeStyle || 'solid'}
            onChange={(e) => handleStylePropertyChange('strokeStyle', e.target.value)}
            style={{
              width: '100%',
              padding: '4px',
              border: '1px solid #ddd',
              borderRadius: '2px'
            }}
          >
            <option value="solid">Solid</option>
            <option value="dashed">Dashed</option>
            <option value="dotted">Dotted</option>
            <option value="center">Center</option>
          </select>
        </PropertyRow>
        
        {entity.style.fillColor !== undefined && (
          <PropertyRow label="Fill Color">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="color"
                value={entity.style.fillColor || 'transparent'}
                onChange={(e) => handleStylePropertyChange('fillColor', e.target.value)}
                style={{ marginRight: '8px' }}
              />
              <input
                type="text"
                value={entity.style.fillColor || 'transparent'}
                onChange={(e) => handleStylePropertyChange('fillColor', e.target.value)}
                style={{
                  flex: 1,
                  padding: '4px',
                  border: '1px solid #ddd',
                  borderRadius: '2px'
                }}
              />
            </div>
          </PropertyRow>
        )}
      </PropertyGroup>
    );
  };

  // Render specific properties based on entity type
  const renderEntitySpecificProperties = () => {
    if (!entity) return null;

    switch (entity.type) {
      case 'line':
        return (
          <PropertyGroup title="Line Properties">
            <PropertyRow label="Start X">
              <input
                type="number"
                value={entity.startPoint.x}
                onChange={(e) => handlePointPropertyChange('startPoint', 'x', e.target.value)}
                style={{
                  width: '100%',
                  padding: '4px',
                  border: '1px solid #ddd',
                  borderRadius: '2px'
                }}
              />
            </PropertyRow>
            
            <PropertyRow label="Start Y">
              <input
                type="number"
                value={entity.startPoint.y}
                onChange={(e) => handlePointPropertyChange('startPoint', 'y', e.target.value)}
                style={{
                  width: '100%',
                  padding: '4px',
                  border: '1px solid #ddd',
                  borderRadius: '2px'
                }}
              />
            </PropertyRow>
            
            <PropertyRow label="End X">
              <input
                type="number"
                value={entity.endPoint.x}
                onChange={(e) => handlePointPropertyChange('endPoint', 'x', e.target.value)}
                style={{
                  width: '100%',
                  padding: '4px',
                  border: '1px solid #ddd',
                  borderRadius: '2px'
                }}
              />
            </PropertyRow>
            
            <PropertyRow label="End Y">
              <input
                type="number"
                value={entity.endPoint.y}
                onChange={(e) => handlePointPropertyChange('endPoint', 'y', e.target.value)}
                style={{
                  width: '100%',
                  padding: '4px',
                  border: '1px solid #ddd',
                  borderRadius: '2px'
                }}
              />
            </PropertyRow>

            <PropertyRow label="Length">
              <input
                type="text"
                value={calculateLength(entity.startPoint, entity.endPoint).toFixed(2)}
                disabled
                style={{
                  width: '100%',
                  padding: '4px',
                  border: '1px solid #ddd',
                  borderRadius: '2px',
                  background: '#f5f5f5'
                }}
              />
            </PropertyRow>
            
            <PropertyRow label="Angle">
              <input
                type="text"
                value={calculateAngle(entity.startPoint, entity.endPoint).toFixed(2) + '°'}
                disabled
                style={{
                  width: '100%',
                  padding: '4px',
                  border: '1px solid #ddd',
                  borderRadius: '2px',
                  background: '#f5f5f5'
                }}
              />
            </PropertyRow>
          </PropertyGroup>
        );
        
      case 'circle':
        return (
          <PropertyGroup title="Circle Properties">
            <PropertyRow label="Center X">
              <input
                type="number"
                value={entity.center.x}
                onChange={(e) => handlePointPropertyChange('center', 'x', e.target.value)}
                style={{
                  width: '100%',
                  padding: '4px',
                  border: '1px solid #ddd',
                  borderRadius: '2px'
                }}
              />
            </PropertyRow>
            
            <PropertyRow label="Center Y">
              <input
                type="number"
                value={entity.center.y}
                onChange={(e) => handlePointPropertyChange('center', 'y', e.target.value)}
                style={{
                  width: '100%',
                  padding: '4px',
                  border: '1px solid #ddd',
                  borderRadius: '2px'
                }}
              />
            </PropertyRow>
            
            <PropertyRow label="Radius">
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={entity.radius}
                onChange={(e) => handleNumberPropertyChange('radius', e.target.value)}
                style={{
                  width: '100%',
                  padding: '4px',
                  border: '1px solid #ddd',
                  borderRadius: '2px'
                }}
              />
            </PropertyRow>
            
            <PropertyRow label="Diameter">
              <input
                type="text"
                value={(entity.radius * 2).toFixed(2)}
                disabled
                style={{
                  width: '100%',
                  padding: '4px',
                  border: '1px solid #ddd',
                  borderRadius: '2px',
                  background: '#f5f5f5'
                }}
              />
            </PropertyRow>
            
            <PropertyRow label="Area">
              <input
                type="text"
                value={(Math.PI * entity.radius * entity.radius).toFixed(2)}
                disabled
                style={{
                  width: '100%',
                  padding: '4px',
                  border: '1px solid #ddd',
                  borderRadius: '2px',
                  background: '#f5f5f5'
                }}
              />
            </PropertyRow>
          </PropertyGroup>
        );
      
      case 'arc':
        return (
          <PropertyGroup title="Arc Properties">
            <PropertyRow label="Center X">
              <input
                type="number"
                value={entity.center.x}
                onChange={(e) => handlePointPropertyChange('center', 'x', e.target.value)}
                style={{
                  width: '100%',
                  padding: '4px',
                  border: '1px solid #ddd',
                  borderRadius: '2px'
                }}
              />
            </PropertyRow>
            
            <PropertyRow label="Center Y">
              <input
                type="number"
                value={entity.center.y}
                onChange={(e) => handlePointPropertyChange('center', 'y', e.target.value)}
                style={{
                  width: '100%',
                  padding: '4px',
                  border: '1px solid #ddd',
                  borderRadius: '2px'
                }}
              />
            </PropertyRow>
            
            <PropertyRow label="Radius">
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={entity.radius}
                onChange={(e) => handleNumberPropertyChange('radius', e.target.value)}
                style={{
                  width: '100%',
                  padding: '4px',
                  border: '1px solid #ddd',
                  borderRadius: '2px'
                }}
              />
            </PropertyRow>
            
            <PropertyRow label="Start Angle">
              <input
                type="number"
                value={radiansToDegrees(entity.startAngle || 0)}
                onChange={(e) => {
                  const degrees = parseFloat(e.target.value);
                  if (!isNaN(degrees)) {
                    handleNumberPropertyChange('startAngle', degreesToRadians(degrees).toString());
                  }
                }}
                style={{
                  width: '100%',
                  padding: '4px',
                  border: '1px solid #ddd',
                  borderRadius: '2px'
                }}
              />
            </PropertyRow>
            
            <PropertyRow label="End Angle">
              <input
                type="number"
                value={radiansToDegrees(entity.endAngle || 0)}
                onChange={(e) => {
                  const degrees = parseFloat(e.target.value);
                  if (!isNaN(degrees)) {
                    handleNumberPropertyChange('endAngle', degreesToRadians(degrees).toString());
                  }
                }}
                style={{
                  width: '100%',
                  padding: '4px',
                  border: '1px solid #ddd',
                  borderRadius: '2px'
                }}
              />
            </PropertyRow>
            
            <PropertyRow label="Counterclockwise">
              <input
                type="checkbox"
                checked={entity.counterclockwise || false}
                onChange={(e) => handleBooleanPropertyChange('counterclockwise', e.target.checked)}
              />
            </PropertyRow>
          </PropertyGroup>
        );
      
      case 'rectangle':
        return (
          <PropertyGroup title="Rectangle Properties">
            <PropertyRow label="X">
              <input
                type="number"
                value={entity.position.x}
                onChange={(e) => handlePointPropertyChange('position', 'x', e.target.value)}
                style={{
                  width: '100%',
                  padding: '4px',
                  border: '1px solid #ddd',
                  borderRadius: '2px'
                }}
              />
            </PropertyRow>
            
            <PropertyRow label="Y">
              <input
                type="number"
                value={entity.position.y}
                onChange={(e) => handlePointPropertyChange('position', 'y', e.target.value)}
                style={{
                  width: '100%',
                  padding: '4px',
                  border: '1px solid #ddd',
                  borderRadius: '2px'
                }}
              />
            </PropertyRow>
            
            <PropertyRow label="Width">
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={entity.width}
                onChange={(e) => handleNumberPropertyChange('width', e.target.value)}
                style={{
                  width: '100%',
                  padding: '4px',
                  border: '1px solid #ddd',
                  borderRadius: '2px'
                }}
              />
            </PropertyRow>
            
            <PropertyRow label="Height">
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={entity.height}
                onChange={(e) => handleNumberPropertyChange('height', e.target.value)}
                style={{
                  width: '100%',
                  padding: '4px',
                  border: '1px solid #ddd',
                  borderRadius: '2px'
                }}
              />
            </PropertyRow>
            
            <PropertyRow label="Rotation (°)">
              <input
                type="number"
                step="0.1"
                value={radiansToDegrees(entity.rotation || 0)}
                onChange={(e) => {
                  const degrees = parseFloat(e.target.value);
                  if (!isNaN(degrees)) {
                    handleNumberPropertyChange('rotation', degreesToRadians(degrees).toString());
                  }
                }}
                style={{
                  width: '100%',
                  padding: '4px',
                  border: '1px solid #ddd',
                  borderRadius: '2px'
                }}
              />
            </PropertyRow>
            
            <PropertyRow label="Area">
              <input
                type="text"
                value={(entity.width * entity.height).toFixed(2)}
                disabled
                style={{
                  width: '100%',
                  padding: '4px',
                  border: '1px solid #ddd',
                  borderRadius: '2px',
                  background: '#f5f5f5'
                }}
              />
            </PropertyRow>
          </PropertyGroup>
        );
        
      case 'polygon':
        return (
          <PropertyGroup title="Polygon Properties">
            <PropertyRow label="Center X">
              <input
                type="number"
                value={entity.center.x}
                onChange={(e) => handlePointPropertyChange('center', 'x', e.target.value)}
                style={{
                  width: '100%',
                  padding: '4px',
                  border: '1px solid #ddd',
                  borderRadius: '2px'
                }}
              />
            </PropertyRow>
            
            <PropertyRow label="Center Y">
              <input
                type="number"
                value={entity.center.y}
                onChange={(e) => handlePointPropertyChange('center', 'y', e.target.value)}
                style={{
                  width: '100%',
                  padding: '4px',
                  border: '1px solid #ddd',
                  borderRadius: '2px'
                }}
              />
            </PropertyRow>
            
            <PropertyRow label="Radius">
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={entity.radius}
                onChange={(e) => handleNumberPropertyChange('radius', e.target.value)}
                style={{
                  width: '100%',
                  padding: '4px',
                  border: '1px solid #ddd',
                  borderRadius: '2px'
                }}
              />
            </PropertyRow>
            
            <PropertyRow label="Sides">
              <input
                type="number"
                min="3"
                step="1"
                value={entity.sides}
                onChange={(e) => handleNumberPropertyChange('sides', e.target.value)}
                style={{
                  width: '100%',
                  padding: '4px',
                  border: '1px solid #ddd',
                  borderRadius: '2px'
                }}
              />
            </PropertyRow>
            
            <PropertyRow label="Rotation (°)">
              <input
                type="number"
                step="0.1"
                value={radiansToDegrees(entity.rotation || 0)}
                onChange={(e) => {
                  const degrees = parseFloat(e.target.value);
                  if (!isNaN(degrees)) {
                    handleNumberPropertyChange('rotation', degreesToRadians(degrees).toString());
                  }
                }}
                style={{
                  width: '100%',
                  padding: '4px',
                  border: '1px solid #ddd',
                  borderRadius: '2px'
                }}
              />
            </PropertyRow>
          </PropertyGroup>
        );
        
      case 'spline':
        return (
          <PropertyGroup title="Spline Properties">
            <PropertyRow label="Points">
              <div style={{ fontSize: '12px', color: '#666' }}>
                {entity.points?.length || 0} points defined
              </div>
            </PropertyRow>
            
            <PropertyRow label="Control Points">
              <div style={{ fontSize: '12px', color: '#666' }}>
                {entity.controlPoints?.length || 0} control points
              </div>
            </PropertyRow>
            
            <PropertyRow label="Closed">
              <input
                type="checkbox"
                checked={entity.closed || false}
                onChange={(e) => handleBooleanPropertyChange('closed', e.target.checked)}
              />
            </PropertyRow>
          </PropertyGroup>
        );
        
      case 'polyline':
        return (
          <PropertyGroup title="Polyline Properties">
            <PropertyRow label="Points">
              <div style={{ fontSize: '12px', color: '#666' }}>
                {entity.points?.length || 0} points defined
              </div>
            </PropertyRow>
            
            <PropertyRow label="Closed">
              <input
                type="checkbox"
                checked={entity.closed || false}
                onChange={(e) => handleBooleanPropertyChange('closed', e.target.checked)}
              />
            </PropertyRow>
            
            {entity.points && entity.points.length > 0 && (
              <PropertyGroup title="Point Coordinates" isOpen={false}>
                {entity.points.map((point, index) => (
                  <div key={index} style={{ marginBottom: '8px' }}>
                    <div style={{ fontSize: '12px', marginBottom: '4px', fontWeight: 'bold' }}>
                      Point {index + 1}
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <input
                        type="number"
                        value={point.x}
                        onChange={(e) => {
                          if (!entity || !onUpdateEntity) return;
                          
                          const numValue = parseFloat(e.target.value);
                          if (isNaN(numValue)) return;
                          
                          const newPoints = [...entity.points];
                          newPoints[index] = { ...point, x: numValue };
                          
                          onUpdateEntity(entity.id, { points: newPoints });
                        }}
                        style={{
                          flex: 1,
                          padding: '4px',
                          border: '1px solid #ddd',
                          borderRadius: '2px'
                        }}
                        placeholder="X"
                      />
                      <input
                        type="number"
                        value={point.y}
                        onChange={(e) => {
                          if (!entity || !onUpdateEntity) return;
                          
                          const numValue = parseFloat(e.target.value);
                          if (isNaN(numValue)) return;
                          
                          const newPoints = [...entity.points];
                          newPoints[index] = { ...point, y: numValue };
                          
                          onUpdateEntity(entity.id, { points: newPoints });
                        }}
                        style={{
                          flex: 1,
                          padding: '4px',
                          border: '1px solid #ddd',
                          borderRadius: '2px'
                        }}
                        placeholder="Y"
                      />
                    </div>
                  </div>
                ))}
              </PropertyGroup>
            )}
          </PropertyGroup>
        );
        
      default:
        return (
          <div style={{ padding: '12px', color: '#666', fontStyle: 'italic' }}>
            No specific properties available for this entity type.
          </div>
        );
    }
  };

  // Helper function to calculate length between two points
  const calculateLength = (p1: Point, p2: Point): number => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Helper function to calculate angle in degrees
  const calculateAngle = (p1: Point, p2: Point): number => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return radiansToDegrees(Math.atan2(dy, dx));
  };

  // Convert radians to degrees
  const radiansToDegrees = (radians: number): number => {
    return (radians * 180) / Math.PI;
  };

  // Convert degrees to radians
  const degreesToRadians = (degrees: number): number => {
    return (degrees * Math.PI) / 180;
  };

  return (
    <DockPanel
      title="Properties"
      defaultPosition={defaultPosition}
      defaultWidth={300}
      minWidth={220}
    >
      <div className="properties-panel-content">
        {selectedEntities.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
            No entities selected. Select an entity to view and edit its properties.
          </div>
        )}
        
        {selectedEntities.length > 1 && (
          <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
            {selectedEntities.length} entities selected. Select a single entity to edit its properties.
          </div>
        )}
        
        {entity && (
          <>
            <div className="entity-type" style={{ fontWeight: 'bold', marginBottom: '12px', fontSize: '14px' }}>
              {entity.type.charAt(0).toUpperCase() + entity.type.slice(1)}
            </div>
            
            {renderCommonProperties()}
            {renderStyleProperties()}
            {renderEntitySpecificProperties()}
          </>
        )}
      </div>
    </DockPanel>
  );
};

export default PropertiesPanel; 