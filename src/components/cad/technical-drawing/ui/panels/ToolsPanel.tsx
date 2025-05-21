import React, { useState } from 'react';
import DockPanel from './DockPanel';

export type DrawingTool = 
  | 'select'
  | 'pan'
  | 'line'
  | 'rectangle'
  | 'circle'
  | 'arc'
  | 'ellipse'
  | 'polygon'
  | 'polyline'
  | 'spline'
  | 'text'
  | 'dimension'
  | 'fillet'
  | 'chamfer'
  | 'trim'
  | 'extend'
  | 'offset'
  | 'mirror'
  | 'rotate'
  | 'scale';

interface ToolOption {
  id: DrawingTool;
  name: string;
  icon: string;
  description: string;
  group: 'basic' | 'shapes' | 'curves' | 'modify' | 'transform' | 'annotate';
}

interface ToolsPanelProps {
  activeTool?: DrawingTool;
  onToolSelect?: (tool: DrawingTool) => void;
  defaultPosition?: 'left' | 'right' | 'top' | 'bottom' | 'float';
}

const ToolsPanel: React.FC<ToolsPanelProps> = ({
  activeTool = 'select',
  onToolSelect,
  defaultPosition = 'left',
}) => {
  const [expandedGroup, setExpandedGroup] = useState<string | null>('basic');
  const [searchTerm, setSearchTerm] = useState('');

  // Define all available tools
  const tools: ToolOption[] = [
    // Basic tools
    { id: 'select', name: 'Select', icon: '🔍', description: 'Select and manipulate entities', group: 'basic' },
    { id: 'pan', name: 'Pan', icon: '✋', description: 'Pan the drawing view', group: 'basic' },
    
    // Shape tools
    { id: 'line', name: 'Line', icon: '📏', description: 'Draw a straight line', group: 'shapes' },
    { id: 'rectangle', name: 'Rectangle', icon: '⬜', description: 'Draw a rectangle', group: 'shapes' },
    { id: 'circle', name: 'Circle', icon: '⭕', description: 'Draw a circle', group: 'shapes' },
    { id: 'polygon', name: 'Polygon', icon: '⬡', description: 'Draw a regular polygon', group: 'shapes' },
    
    // Curve tools
    { id: 'arc', name: 'Arc', icon: '🧲', description: 'Draw an arc', group: 'curves' },
    { id: 'ellipse', name: 'Ellipse', icon: '⭮', description: 'Draw an ellipse', group: 'curves' },
    { id: 'polyline', name: 'Polyline', icon: '➰', description: 'Draw a polyline', group: 'curves' },
    { id: 'spline', name: 'Spline', icon: '〰️', description: 'Draw a spline curve', group: 'curves' },
    
    // Modify tools
    { id: 'fillet', name: 'Fillet', icon: '⌢', description: 'Create a rounded corner between two lines', group: 'modify' },
    { id: 'chamfer', name: 'Chamfer', icon: '⧩', description: 'Create an angled corner between two lines', group: 'modify' },
    { id: 'trim', name: 'Trim', icon: '✂️', description: 'Trim entities at their intersections', group: 'modify' },
    { id: 'extend', name: 'Extend', icon: '📐', description: 'Extend entities to meet other entities', group: 'modify' },
    { id: 'offset', name: 'Offset', icon: '⫽', description: 'Create parallel copies of entities', group: 'modify' },
    
    // Transform tools
    { id: 'mirror', name: 'Mirror', icon: '⟷', description: 'Create a mirrored copy of entities', group: 'transform' },
    { id: 'rotate', name: 'Rotate', icon: '↻', description: 'Rotate entities around a point', group: 'transform' },
    { id: 'scale', name: 'Scale', icon: '⤢', description: 'Scale entities relative to a base point', group: 'transform' },
    
    // Annotation tools
    { id: 'text', name: 'Text', icon: 'T', description: 'Add text to the drawing', group: 'annotate' },
    { id: 'dimension', name: 'Dimension', icon: '⟺', description: 'Add linear, angular, or radial dimensions', group: 'annotate' },
  ];

  // Group tools by category
  const groupedTools: { [key: string]: ToolOption[] } = {
    'basic': tools.filter(tool => tool.group === 'basic'),
    'shapes': tools.filter(tool => tool.group === 'shapes'),
    'curves': tools.filter(tool => tool.group === 'curves'),
    'modify': tools.filter(tool => tool.group === 'modify'),
    'transform': tools.filter(tool => tool.group === 'transform'),
    'annotate': tools.filter(tool => tool.group === 'annotate'),
  };

  // Get user-friendly group name
  const getGroupName = (group: string): string => {
    switch (group) {
      case 'basic': return 'Basic Tools';
      case 'shapes': return 'Shapes';
      case 'curves': return 'Curves';
      case 'modify': return 'Modify';
      case 'transform': return 'Transform';
      case 'annotate': return 'Annotation';
      default: return group.charAt(0).toUpperCase() + group.slice(1);
    }
  };

  // Toggle a group's expanded state
  const toggleGroup = (group: string) => {
    setExpandedGroup(expandedGroup === group ? null : group);
  };

  // Handle tool selection
  const handleToolSelect = (tool: DrawingTool) => {
    if (onToolSelect) {
      onToolSelect(tool);
    }
  };

  // Filter tools based on search term
  const filteredTools = searchTerm.trim() === '' 
    ? tools 
    : tools.filter(tool => 
        tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchTerm.toLowerCase())
      );

  // Render a tool button
  const renderToolButton = (tool: ToolOption) => {
    const isActive = tool.id === activeTool;
    
    return (
      <button
        key={tool.id}
        type="button"
        className={`tool-button ${isActive ? 'active' : ''}`}
        onClick={() => handleToolSelect(tool.id)}
        title={`${tool.name}: ${tool.description}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px 12px',
          margin: '4px 0',
          width: '100%',
          border: isActive ? '1px solid #1890ff' : '1px solid transparent',
          borderRadius: '4px',
          backgroundColor: isActive ? '#e6f7ff' : 'transparent',
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'background-color 0.2s',
        }}
      >
        <span style={{ 
          display: 'inline-flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '24px',
          height: '24px',
          marginRight: '12px',
          fontSize: '18px'
        }}>
          {tool.icon}
        </span>
        <span style={{ flexGrow: 1 }}>{tool.name}</span>
      </button>
    );
  };

  // Render a group of tools
  const renderToolGroup = (group: string, tools: ToolOption[]) => {
    const isExpanded = expandedGroup === group;
    
    return (
      <div key={group} className="tool-group" style={{ marginBottom: '8px' }}>
        <div
          className="tool-group-header"
          onClick={() => toggleGroup(group)}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px 12px',
            cursor: 'pointer',
            backgroundColor: '#f5f5f5',
            borderRadius: '4px',
          }}
        >
          <span style={{ marginRight: '8px' }}>{isExpanded ? '▼' : '►'}</span>
          <span style={{ fontWeight: 'bold' }}>{getGroupName(group)}</span>
        </div>
        
        {isExpanded && (
          <div className="tool-group-content" style={{ marginTop: '4px', marginLeft: '12px' }}>
            {tools.map(renderToolButton)}
          </div>
        )}
      </div>
    );
  };

  // Render tools based on search results or grouped
  const renderTools = () => {
    if (searchTerm.trim() !== '') {
      // Render search results
      return (
        <div className="search-results">
          {filteredTools.length === 0 ? (
            <div style={{ padding: '12px', color: '#888', textAlign: 'center' }}>
              No tools match your search.
            </div>
          ) : (
            filteredTools.map(renderToolButton)
          )}
        </div>
      );
    } else {
      // Render grouped tools
      return Object.entries(groupedTools).map(([group, tools]) => 
        renderToolGroup(group, tools)
      );
    }
  };

  return (
    <DockPanel
      title="Drawing Tools"
      defaultPosition={defaultPosition}
      defaultWidth={250}
      minWidth={200}
    >
      <div className="tools-panel-content">
        {/* Search input */}
        <div className="tool-search" style={{ marginBottom: '16px' }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tools..."
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
          />
        </div>
        
        {/* Tools */}
        {renderTools()}
      </div>
    </DockPanel>
  );
};

export default ToolsPanel; 