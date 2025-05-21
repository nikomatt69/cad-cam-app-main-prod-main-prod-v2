// src/components/cad/technical-drawing/TechnicalDrawingToolbar.tsx

import React, { useState } from 'react';
import { useTechnicalDrawingStore } from 'src/store/technicalDrawingStore';
import { 
  Move, Grid, Maximize, 
  ZoomIn, ZoomOut, Type, 
  Square, Circle, Slash, 
  ChevronRight, MousePointer, 
  Target, Compass, Tool, Box, 
  Edit3, PenTool, ArrowRight, 
  Octagon, Disc, RefreshCw,
  Copy, RotateCw, Scissors, Layers,
  X, Settings, ChevronsUp, Download,
  ArrowUpRight, CornerDownRight, List,
  Plus, Hash, Crosshair, Sliders,
  AlignLeft, CornerUpRight, Eye, Lock,
  Command, Gitlab, ToggleRight, Filter
} from 'react-feather';

// Tool type definitions
interface BaseTool {
  id: string;
  icon: React.ReactNode;
  label: string;
  shortcut: string;
  group: string;
}

interface ActionTool extends BaseTool {
  action?: () => void;
  isActive?: boolean;
  hasSubmenu?: never;
  submenuId?: never;
  subTools?: never;
}

interface SubmenuTool extends BaseTool {
  hasSubmenu: boolean;
  submenuId: string;
  subTools: BaseTool[];
  action?: never;
  isActive?: never;
}

type Tool = ActionTool | SubmenuTool;

interface ToolGroup {
  id: string;
  label: string;
  icon: React.ReactNode;
  tools: (ActionTool | SubmenuTool)[];
}

interface TechnicalDrawingToolbarProps {
  position?: 'left' | 'top';
  variant?: 'dark' | 'light';
}

export const TechnicalDrawingToolbar: React.FC<TechnicalDrawingToolbarProps> = ({ 
  position = 'left',
  variant = 'dark'
}) => {
  const { 
    activeTool, 
    setActiveTool,
    zoom,
    setZoom,
    zoomToFit,
    zoomToSelection,
    snappingEnabled,
    toggleSnapping,
    gridEnabled,
    toggleGrid,
    orthoMode,
    toggleOrthoMode,
    activeLayer,
    setActiveLayer,
    drawingLayers
  } = useTechnicalDrawingStore();
  
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);
  const [activeGroup, setActiveGroup] = useState<string | null>('view');
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  
  // Color classes based on variant
  const bgColor = variant === 'dark' ? 'bg-gray-900' : 'bg-white';
  const textColor = variant === 'dark' ? 'text-gray-200' : 'text-gray-800';
  const hoverBgColor = variant === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100';
  const borderColor = variant === 'dark' ? 'border-gray-700' : 'border-gray-200';
  const activeBgColor = variant === 'dark' ? 'bg-blue-900/50' : 'bg-blue-100';
  const activeTextColor = variant === 'dark' ? 'text-blue-300' : 'text-blue-700';
  const groupBgColor = variant === 'dark' ? 'bg-gray-800' : 'bg-gray-50';
  const groupHeaderColor = variant === 'dark' ? 'bg-gray-800/80' : 'bg-gray-100/90';
  const groupHeaderText = variant === 'dark' ? 'text-gray-300' : 'text-gray-600';

  // Toggle sub-menu expanded state
  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuId]: !prev[menuId]
    }));
  };

  // Tool button component
  const ToolButton = ({ 
    id, 
    icon, 
    label, 
    shortcut = null, 
    onClick, 
    isActive = false,
    hasSubmenu = false,
    submenuId = null
  }: { 
    id: string;
    icon: React.ReactNode;
    label: string;
    shortcut?: string | null;
    onClick: () => void;
    isActive?: boolean;
    hasSubmenu?: boolean;
    submenuId?: string | null;
  }) => {
    const handleClick = () => {
      if (hasSubmenu && submenuId) {
        toggleMenu(submenuId);
      } else {
        onClick();
      }
    };
    
    return (
      <button
        onClick={handleClick}
        className={`group flex items-center w-full px-3 py-2 rounded-md transition-colors ${
          isActive 
            ? `${activeBgColor} ${activeTextColor}` 
            : `${textColor} ${hoverBgColor}`
        }`}
        title={`${label}${shortcut ? ` (${shortcut})` : ''}`}
      >
        <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
          {icon}
        </div>
        <span className="ml-2 text-sm font-medium">{label}</span>
        {shortcut && (
          <span className={`ml-auto text-xs ${variant === 'dark' ? 'text-gray-500' : 'text-gray-400'} bg-opacity-50 px-1.5 py-0.5 rounded ${variant === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`}>
            {shortcut}
          </span>
        )}
        {hasSubmenu && (
          <ChevronRight size={16} className={`ml-auto ${expandedMenus[submenuId || ''] ? 'transform rotate-90' : ''}`} />
        )}
      </button>
    );
  };

  // Icon-only button for the main toolbar
  const IconButton = ({ 
    id, 
    icon, 
    label, 
    shortcut = null, 
    onClick, 
    isActive = false,
    isGroupButton = false,
    groupId = null,
    hasSubmenu = false
  }: { 
    id: string;
    icon: React.ReactNode;
    label: string;
    shortcut?: string | null;
    onClick: () => void;
    isActive?: boolean;
    isGroupButton?: boolean;
    groupId?: string | null;
    hasSubmenu?: boolean;
  }) => {
    // Handle mouse events for group buttons
    const handleMouseEnter = () => {
      if (isGroupButton && groupId) {
        setHoveredGroup(groupId);
      }
    };
    
    const handleMouseLeave = () => {
      if (isGroupButton) {
        setHoveredGroup(null);
      }
    };
    
    const handleClick = () => {
      if (isGroupButton && groupId) {
        setActiveGroup(activeGroup === groupId ? null : groupId);
      } else {
        onClick();
      }
    };
    
    return (
      <button
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`group relative flex items-center justify-center p-1 rounded-md transition-colors ${
          (isActive || (isGroupButton && activeGroup === groupId)) 
            ? `${activeBgColor} ${activeTextColor}` 
            : `${textColor} ${hoverBgColor}`
        } ${isGroupButton ? 'w-full' : ''}`}
        title={`${label}${shortcut ? ` (${shortcut})` : ''}`}
      >
        <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
          {icon}
        </div>
        {hasSubmenu && (
          <div className="absolute bottom-0 right-0 w-2 h-2 bg-blue-500 rounded-full"></div>
        )}
      </button>
    );
  };

  // Tool groups - extended with mechanical features
  const toolGroups = [
    {
      id: 'view',
      label: 'View',
      icon: <MousePointer size={18} />,
      tools: [
        { id: 'select', icon: <MousePointer size={16} />, label: 'Select', shortcut: 'S' },
        { id: 'pan', icon: <Move size={16} />, label: 'Pan View', shortcut: 'P' },
        { id: 'zoom-in', icon: <ZoomIn size={16} />, label: 'Zoom In', shortcut: '+', action: () => setZoom(zoom * 1.2) },
        { id: 'zoom-out', icon: <ZoomOut size={16} />, label: 'Zoom Out', shortcut: '-', action: () => setZoom(zoom * 0.8) },
        { id: 'zoom-fit', icon: <Maximize size={16} />, label: 'Zoom to Fit', shortcut: 'F2', action: zoomToFit },
        { id: 'zoom-selection', icon: <Maximize size={16} />, label: 'Zoom to Selection', shortcut: 'F3', action: zoomToSelection },
        { id: 'toggle-grid', icon: <Grid size={16} />, label: 'Toggle Grid', shortcut: 'F7', isActive: gridEnabled, action: toggleGrid },
        { id: 'toggle-snap', icon: <Target size={16} />, label: 'Toggle Snap', shortcut: 'F9', isActive: snappingEnabled, action: toggleSnapping },
        { id: 'toggle-ortho', icon: <ChevronRight size={16} />, label: 'Toggle Orthogonal Mode', shortcut: 'F8', isActive: orthoMode, action: toggleOrthoMode }
      ]
    },
    {
      id: 'draw',
      label: 'Draw',
      icon: <Edit3 size={18} />,
      tools: [
        { 
          id: 'line-submenu', 
          icon: <Slash size={16} />, 
          label: 'Line', 
          shortcut: 'L',
          hasSubmenu: true,
          submenuId: 'line-submenu',
          subTools: [
            { id: 'line', icon: <Slash size={16} />, label: 'Line', shortcut: 'L' },
            { id: 'polyline', icon: <Edit3 size={16} />, label: 'Polyline', shortcut: 'PL' },
            { id: 'construction-line', icon: <Slash size={16} className="opacity-50" />, label: 'Construction Line', shortcut: 'XL' },
            { id: 'centerline', icon: <ArrowUpRight size={16} />, label: 'Centerline', shortcut: 'CL' }
          ]
        },
        { 
          id: 'circle-submenu', 
          icon: <Circle size={16} />, 
          label: 'Circle', 
          shortcut: 'C',
          hasSubmenu: true,
          submenuId: 'circle-submenu',
          subTools: [
            { id: 'circle', icon: <Circle size={16} />, label: 'Circle (Center, Radius)', shortcut: 'C' },
            { id: 'circle-2p', icon: <Circle size={16} />, label: 'Circle (2 Points)', shortcut: 'C2P' },
            { id: 'circle-3p', icon: <Circle size={16} />, label: 'Circle (3 Points)', shortcut: 'C3P' },
            { id: 'circle-ttr', icon: <Circle size={16} />, label: 'Circle (Tangent, Tangent, Radius)', shortcut: 'TTR' }
          ]
        },
        { 
          id: 'arc-submenu', 
          icon: <Disc size={16} />, 
          label: 'Arc', 
          shortcut: 'A',
          hasSubmenu: true,
          submenuId: 'arc-submenu',
          subTools: [
            { id: 'arc', icon: <Disc size={16} />, label: 'Arc (3 Points)', shortcut: 'A' },
            { id: 'arc-center', icon: <Disc size={16} />, label: 'Arc (Center, Start, End)', shortcut: 'CSE' },
            { id: 'arc-start', icon: <Disc size={16} />, label: 'Arc (Start, Center, End)', shortcut: 'SCE' },
            { id: 'arc-continue', icon: <Disc size={16} />, label: 'Arc (Continue)', shortcut: 'ARCCON' }
          ]
        },
        { id: 'rectangle', icon: <Square size={16} />, label: 'Rectangle', shortcut: 'R' },
        { id: 'ellipse', icon: <Circle size={16} />, label: 'Ellipse', shortcut: 'EL' },
        { id: 'polygon', icon: <Octagon size={16} />, label: 'Polygon', shortcut: 'POL' },
        { id: 'spline', icon: <PenTool size={16} />, label: 'Spline', shortcut: 'SP' },
        { id: 'point', icon: <Plus size={16} />, label: 'Point', shortcut: 'PO' },
        { id: 'hatch', icon: <Gitlab size={16} />, label: 'Hatch', shortcut: 'H' }
      ]
    },
    {
      id: 'annotate',
      label: 'Annotate',
      icon: <Type size={18} />,
      tools: [
        { 
          id: 'dimension-submenu', 
          icon: <ArrowRight size={16} />, 
          label: 'Dimension', 
          shortcut: 'DIM',
          hasSubmenu: true,
          submenuId: 'dimension-submenu',
          subTools: [
            { id: 'dimension-linear', icon: <ArrowRight size={16} />, label: 'Linear Dimension', shortcut: 'DIMLIN' },
            { id: 'dimension-aligned', icon: <ArrowUpRight size={16} />, label: 'Aligned Dimension', shortcut: 'DIMALIGNED' },
            { id: 'dimension-angular', icon: <Compass size={16} />, label: 'Angular Dimension', shortcut: 'DIMANG' },
            { id: 'dimension-radius', icon: <Circle size={16} />, label: 'Radius Dimension', shortcut: 'DIMRAD' },
            { id: 'dimension-diameter', icon: <Circle size={16} className="font-bold" />, label: 'Diameter Dimension', shortcut: 'DIMDIA' },
            { id: 'dimension-ordinate', icon: <ArrowRight size={16} />, label: 'Ordinate Dimension', shortcut: 'DIMORD' },
            { id: 'dimension-baseline', icon: <AlignLeft size={16} />, label: 'Baseline Dimension', shortcut: 'DIMBASE' },
            { id: 'dimension-continue', icon: <AlignLeft size={16} />, label: 'Continue Dimension', shortcut: 'DIMCONT' }
          ]
        },
        { id: 'text', icon: <Type size={16} />, label: 'Text', shortcut: 'T' },
        { id: 'mtext', icon: <Type size={16} />, label: 'Multiline Text', shortcut: 'MT' },
        { id: 'leader', icon: <CornerDownRight size={16} />, label: 'Leader', shortcut: 'LE' },
        { id: 'tolerance', icon: <Hash size={16} />, label: 'Tolerance', shortcut: 'TOL' },
        { id: 'table', icon: <Grid size={16} />, label: 'Table', shortcut: 'TB' }
      ]
    },
    {
      id: 'mechanical',
      label: 'Mechanical',
      icon: <Sliders size={18} />,
      tools: [
        { id: 'centermark', icon: <Plus size={16} />, label: 'Center Mark', shortcut: 'CM' },
        { id: 'centerline', icon: <Slash size={16} />, label: 'Centerline', shortcut: 'CL' },
        { id: 'section-line', icon: <Slash size={16} />, label: 'Section Line', shortcut: 'SL' },
        { id: 'feature-control-frame', icon: <Square size={16} />, label: 'Feature Control Frame', shortcut: 'FCF' },
        { id: 'surface-finish', icon: <Hash size={16} />, label: 'Surface Finish', shortcut: 'SF' },
        { id: 'weldsymbol', icon: <Hash size={16} />, label: 'Weld Symbol', shortcut: 'WELD' },
        { id: 'datum', icon: <Crosshair size={16} />, label: 'Datum', shortcut: 'DATUM' },
        { id: 'balloontext', icon: <Circle size={16} />, label: 'Balloon Text', shortcut: 'BT' },
        { id: 'partslist', icon: <List size={16} />, label: 'Parts List', shortcut: 'PL' },
        { id: 'bom-table', icon: <Grid size={16} />, label: 'BOM Table', shortcut: 'BOM' },
        { id: 'thread', icon: <Command size={16} />, label: 'Thread Symbol', shortcut: 'TS' }
      ]
    },
    {
      id: 'modify',
      label: 'Modify',
      icon: <Tool size={18} />,
      tools: [
        { id: 'move', icon: <Move size={16} />, label: 'Move', shortcut: 'M' },
        { id: 'copy', icon: <Copy size={16} />, label: 'Copy', shortcut: 'CO' },
        { id: 'rotate', icon: <RotateCw size={16} />, label: 'Rotate', shortcut: 'RO' },
        { id: 'scale', icon: <ChevronsUp size={16} />, label: 'Scale', shortcut: 'SC' },
        { id: 'trim', icon: <Scissors size={16} />, label: 'Trim', shortcut: 'TR' },
        { id: 'extend', icon: <ArrowRight size={16} />, label: 'Extend', shortcut: 'EX' },
        { id: 'offset', icon: <Box size={16} />, label: 'Offset', shortcut: 'O' },
        { id: 'mirror', icon: <Slash size={16} className="transform -rotate-90" />, label: 'Mirror', shortcut: 'MI' },
        { id: 'fillet', icon: <CornerUpRight size={16} />, label: 'Fillet', shortcut: 'F' },
        { id: 'chamfer', icon: <CornerUpRight size={16} className="transform scale-75" />, label: 'Chamfer', shortcut: 'CHA' },
        { 
          id: 'array-submenu', 
          icon: <Grid size={16} />, 
          label: 'Array', 
          shortcut: 'AR',
          hasSubmenu: true,
          submenuId: 'array-submenu',
          subTools: [
            { id: 'array-rectangular', icon: <Grid size={16} />, label: 'Rectangular Array', shortcut: 'ARRAYRECT' },
            { id: 'array-polar', icon: <Circle size={16} />, label: 'Polar Array', shortcut: 'ARRAYPOLAR' },
            { id: 'array-path', icon: <PenTool size={16} />, label: 'Path Array', shortcut: 'ARRAYPATH' }
          ]
        },
        { id: 'delete', icon: <X size={16} />, label: 'Delete', shortcut: 'DEL' }
      ]
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings size={18} />,
      tools: [
        { id: 'layers', icon: <Layers size={16} />, label: 'Layers', shortcut: 'LA' },
        { id: 'properties', icon: <List size={16} />, label: 'Properties', shortcut: 'PR' },
        { id: 'styles', icon: <PenTool size={16} />, label: 'Styles', shortcut: 'ST' },
        { id: 'drawing-settings', icon: <Settings size={16} />, label: 'Drawing Settings', shortcut: 'DS' },
        { id: 'units', icon: <Hash size={16} />, label: 'Units', shortcut: 'UN' },
        { id: 'grid-settings', icon: <Grid size={16} />, label: 'Grid Settings', shortcut: 'GS' },
        { id: 'snap-settings', icon: <Crosshair size={16} />, label: 'Snap Settings', shortcut: 'SS' },
        { id: 'layer-states', icon: <Layers size={16} />, label: 'Layer States', shortcut: 'LS' },
        { id: 'export', icon: <Download size={16} />, label: 'Export Drawing', shortcut: 'Ctrl+E' }
      ]
    }
  ];

  // Common tools that should always be visible in the main toolbar
  const quickAccessTools: ActionTool[] = [
    { id: 'select', icon: <MousePointer size={16} />, label: 'Select', shortcut: 'S', group: 'view' },
    { id: 'line', icon: <Slash size={16} />, label: 'Line', shortcut: 'L', group: 'draw' },
    { id: 'rectangle', icon: <Square size={16} />, label: 'Rectangle', shortcut: 'R', group: 'draw' },
    { id: 'circle', icon: <Circle size={16} />, label: 'Circle', shortcut: 'C', group: 'draw' },
    { id: 'arc', icon: <Disc size={16} />, label: 'Arc', shortcut: 'A', group: 'draw' },
    { id: 'dimension-linear', icon: <ArrowRight size={16} />, label: 'Linear Dimension', shortcut: 'DL', group: 'annotate' },
    { id: 'text', icon: <Type size={16} />, label: 'Text', shortcut: 'T', group: 'annotate' },
    { id: 'move', icon: <Move size={16} />, label: 'Move', shortcut: 'M', group: 'modify' },
    { id: 'trim', icon: <Scissors size={16} />, label: 'Trim', shortcut: 'TR', group: 'modify' }
  ];

  // Additional mechanical tools
  const mechanicalTools: ActionTool[] = [
    { id: 'centermark', icon: <Plus size={16} />, label: 'Center Mark', shortcut: 'CM', group: 'mechanical' },
    { id: 'centerline', icon: <Slash size={16} className="opacity-70" />, label: 'Centerline', shortcut: 'CL', group: 'mechanical' },
    { id: 'surface-finish', icon: <Hash size={16} />, label: 'Surface Finish', shortcut: 'SF', group: 'mechanical' },
    { id: 'feature-control-frame', icon: <Square size={16} />, label: 'GD&T', shortcut: 'FCF', group: 'mechanical' }
  ];

  // Handle tool click
  const handleToolClick = (toolId: string, action?: () => void) => {
    if (action) {
      action();
    } else {
      setActiveTool(toolId);
    }
  };

  // Get active tool info
  const getToolInfo = (toolId: string): ActionTool | null => {
    for (const group of toolGroups) {
      const tool = group.tools.find(t => t.id === toolId);
      if (tool) {
        if ('subTools' in tool) {
          // If it's a submenu tool, return null since it can't have an action
          return null;
        }
        return { ...tool, group: group.id } as ActionTool;
      }
      
      // Check in submenus
      for (const parentTool of group.tools) {
        if ('subTools' in parentTool) {
          const subTool = parentTool.subTools?.find(st => st.id === toolId);
          if (subTool) {
            return { ...subTool, group: group.id } as ActionTool;
          }
        }
      }
    }
    return null;
  };

  // Render expanded submenu
  const renderSubmenu = (parentId: string) => {
    for (const group of toolGroups) {
      const parentTool = group.tools.find(t => t.id === parentId);
      if (parentTool && 'subTools' in parentTool && parentTool.subTools) {
        return (
          <div className="pl-6 space-y-0.5 mt-0.5 mb-1 border-l border-gray-700">
            {parentTool.subTools.map(subTool => {
              const isActive = subTool.id === activeTool;
              return (
                <ToolButton
                  key={subTool.id}
                  id={subTool.id}
                  icon={subTool.icon}
                  label={subTool.label}
                  shortcut={subTool.shortcut}
                  isActive={isActive}
                  onClick={() => handleToolClick(subTool.id, (subTool as any).action)}
                />
              );
            })}
          </div>
        );
      }
    }
    return null;
  };

  // Render vertical sidebar
  if (position === 'left') {
    return (
      <div className={`h-full flex ${bgColor} border-r ${borderColor}`}>
        {/* Main toolbar with groups and quick access tools */}
        <div className={`w-10 py-1 flex flex-col items-center ${bgColor} border-r ${borderColor} overflow-y-auto`}>
          {/* Group buttons */}
          <div className="mb-4 w-full px-1 space-y-1 pt-1">
            {toolGroups.map(group => (
              <IconButton
                key={group.id}
                id={group.id}
                icon={group.icon}
                label={group.label}
                isActive={activeGroup === group.id}
                isGroupButton={true}
                groupId={group.id}
                onClick={() => {}}
              />
            ))}
          </div>

          {/* Divider */}
          <div className={`w-10 h-px ${borderColor} my-1`}></div>

          {/* Quick access tools */}
          <div className="w-full px-1 space-y-1 pt-1">
            {quickAccessTools.map(tool => {
              const toolInfo = getToolInfo(tool.id);
              const isActive = tool.id === activeTool || (toolInfo?.isActive);
              return (
                <IconButton
                  key={tool.id}
                  id={tool.id}
                  icon={tool.icon}
                  label={tool.label}
                  shortcut={tool.shortcut}
                  isActive={isActive}
                  onClick={() => handleToolClick(tool.id, toolInfo?.action)}
                />
              );
            })}
          </div>
          
          {/* Divider */}
          <div className={`w-10 h-px ${borderColor} my-1`}></div>
          
          {/* Mechanical tools */}
          <div className="w-full px-1 space-y-1 pt-1">
            {mechanicalTools.map(tool => {
              const toolInfo = getToolInfo(tool.id);
              const isActive = tool.id === activeTool || (toolInfo?.isActive);
              return (
                <IconButton
                  key={tool.id}
                  id={tool.id}
                  icon={tool.icon}
                  label={tool.label}
                  shortcut={tool.shortcut}
                  isActive={isActive}
                  onClick={() => handleToolClick(tool.id, toolInfo?.action)}
                />
              );
            })}
          </div>
        </div>

        {/* Expanded tools panel for active group */}
        {activeGroup && (
          <div className={`w-56 overflow-y-auto ${bgColor}`}>
            <div className={`sticky top-0 px-3 py-2 ${groupHeaderColor} border-b ${borderColor} z-10`}>
              <h3 className={`text-sm font-semibold ${groupHeaderText}`}>
                {toolGroups.find(g => g.id === activeGroup)?.label}
              </h3>
            </div>
            <div className="p-2 space-y-0.5">
              {toolGroups
                .find(g => g.id === activeGroup)
                ?.tools.map(tool => {
                  const isActive = tool.id === activeTool || (tool as any).isActive;
                  
                  return (
                    <React.Fragment key={tool.id}>
                      <ToolButton
                        id={tool.id}
                        icon={tool.icon}
                        label={tool.label}
                        shortcut={tool.shortcut}
                        isActive={isActive}
                        onClick={() => handleToolClick(tool.id, (tool as any).action)}
                        hasSubmenu={'hasSubmenu' in tool && tool.hasSubmenu}
                        submenuId={'submenuId' in tool ? tool.submenuId : null}
                      />
                      
                      {/* Render submenu if expanded */}
                      {'submenuId' in tool && tool.submenuId && expandedMenus[tool.submenuId] && 
                        renderSubmenu(tool.id)
                      }
                    </React.Fragment>
                  );
                })}
            </div>
            
            {/* Layer selector at the bottom for easy access */}
            {activeGroup === 'settings' && (
              <div className="border-t border-gray-700 p-2 mt-2">
                <div className="text-xs text-gray-400 mb-1 px-2">Active Layer:</div>
                <select 
                  value={activeLayer}
                  onChange={(e) => setActiveLayer(e.target.value)}
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded px-2 py-1 text-sm"
                >
                  {drawingLayers.map(layer => (
                    <option key={layer.name} value={layer.name}>{layer.name}</option>
                  ))}
                </select>
                
                <div className="grid grid-cols-2 gap-1 mt-2">
                  {drawingLayers.slice(0, 6).map(layer => (
                    <button
                      key={layer.name}
                      onClick={() => setActiveLayer(layer.name)}
                      className={`flex items-center text-left px-2 py-1 rounded text-xs ${
                        activeLayer === layer.name 
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
          </div>
        )}
      </div>
    );
  }

  // Render horizontal toolbar (default)
  return (
    <div className={`w-full flex flex-col ${bgColor} border-b ${borderColor}`}>
      {/* Main toolbar */}
      <div className={`h-14 px-2 flex items-center ${bgColor} border-b ${borderColor}`}>
        {/* Group tabs */}
        <div className="flex h-full">
          {toolGroups.map(group => (
            <button
              key={group.id}
              onClick={() => setActiveGroup(activeGroup === group.id ? null : group.id)}
              className={`relative h-full px-4 flex items-center border-b-2 transition-colors ${
                activeGroup === group.id 
                  ? `border-blue-500 ${activeTextColor}` 
                  : `border-transparent ${textColor} ${hoverBgColor}`
              }`}
              onMouseEnter={() => setHoveredGroup(group.id)}
              onMouseLeave={() => setHoveredGroup(null)}
            >
              <div className="flex items-center">
                <span className="mr-2">{group.icon}</span>
                <span className="text-sm font-medium">{group.label}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Quick access tools */}
        <div className="ml-6 flex items-center space-x-1 h-10">
          {quickAccessTools.map(tool => {
            const toolInfo = getToolInfo(tool.id);
            const isActive = tool.id === activeTool || (toolInfo?.isActive);
            return (
              <button
                key={tool.id}
                onClick={() => handleToolClick(tool.id, toolInfo?.action)}
                className={`h-full px-2 rounded-md transition-colors ${
                  isActive 
                    ? `${activeBgColor} ${activeTextColor}` 
                    : `${textColor} ${hoverBgColor}`
                }`}
                title={`${tool.label}${tool.shortcut ? ` (${tool.shortcut})` : ''}`}
              >
                <div className="flex items-center">
                  <span>{tool.icon}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Expanded tools panel for active group */}
      {activeGroup && (
        <div className={`h-12 px-2 flex items-center space-x-1 ${groupBgColor} border-b ${borderColor}`}>
          {toolGroups
            .find(g => g.id === activeGroup)
            ?.tools.map(tool => {
              const isActive = tool.id === activeTool || (tool as any).isActive;
              return (
                <button
                  key={tool.id}
                  onClick={() => handleToolClick(tool.id, (tool as any).action)}
                  className={`h-8 px-2 rounded-md transition-colors ${
                    isActive 
                      ? `${activeBgColor} ${activeTextColor}` 
                      : `${textColor} ${hoverBgColor}`
                  }`}
                  title={`${tool.label}${tool.shortcut ? ` (${tool.shortcut})` : ''}`}
                >
                  <div className="flex items-center">
                    <span>{tool.icon}</span>
                    <span className="ml-1 text-xs font-medium">{tool.label}</span>
                  </div>
                </button>
              );
            })}
        </div>
      )}
    </div>
  );
};
