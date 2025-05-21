import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export type DockPosition = 'left' | 'right' | 'top' | 'bottom' | 'float';

export interface DockPanelProps {
  title: string;
  children: React.ReactNode;
  defaultPosition: DockPosition;
  defaultWidth?: number;
  defaultHeight?: number;
  minWidth?: number;
  minHeight?: number;
  resizable?: boolean;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  onPositionChange?: (position: DockPosition) => void;
  onResize?: (width: number, height: number) => void;
  className?: string;
  zIndex?: number;
}

export const DockPanel: React.FC<DockPanelProps> = ({
  title,
  children,
  defaultPosition = 'right',
  defaultWidth = 300,
  defaultHeight = 400,
  minWidth = 200,
  minHeight = 150,
  resizable = true,
  collapsible = true,
  defaultCollapsed = false,
  onPositionChange,
  onResize,
  className = '',
  zIndex = 10
}) => {
  const [position, setPosition] = useState<DockPosition>(defaultPosition);
  const [width, setWidth] = useState(defaultWidth);
  const [height, setHeight] = useState(defaultHeight);
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState<'width' | 'height' | 'both' | null>(null);
  
  // For floating mode
  const [x, setX] = useState(20);
  const [y, setY] = useState(20);
  
  const panelRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0, panelX: 0, panelY: 0 });
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 });
  
  // Position the panel based on its dock position
  const getPanelStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      zIndex,
      boxShadow: position === 'float' ? '0 0 10px rgba(0, 0, 0, 0.2)' : 'none',
      transition: dragging || resizing ? 'none' : 'all 0.3s ease',
      maxWidth: '100vw',
      maxHeight: '100vh',
    };
    
    if (collapsed && position !== 'float') {
      const collapsedWidth = 30;
      const collapsedHeight = 30;
      
      switch (position) {
        case 'left':
          return {
            ...baseStyle,
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            width: collapsedWidth,
            height: collapsedHeight,
          };
        case 'right':
          return {
            ...baseStyle,
            right: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            width: collapsedWidth,
            height: collapsedHeight,
          };
        case 'top':
          return {
            ...baseStyle,
            left: '50%',
            top: 0,
            transform: 'translateX(-50%)',
            width: collapsedHeight,
            height: collapsedWidth,
          };
        case 'bottom':
          return {
            ...baseStyle,
            left: '50%',
            bottom: 0,
            transform: 'translateX(-50%)',
            width: collapsedHeight,
            height: collapsedWidth,
          };
        default:
          return baseStyle;
      }
    }
    
    switch (position) {
      case 'left':
        return {
          ...baseStyle,
          left: 0,
          top: 0,
          bottom: 0,
          width,
          height: '100%',
        };
      case 'right':
        return {
          ...baseStyle,
          right: 0,
          top: 0,
          bottom: 0,
          width,
          height: '100%',
        };
      case 'top':
        return {
          ...baseStyle,
          left: 0,
          top: 0,
          right: 0,
          width: '100%',
          height,
        };
      case 'bottom':
        return {
          ...baseStyle,
          left: 0,
          bottom: 0,
          right: 0,
          width: '100%',
          height,
        };
      case 'float':
        return {
          ...baseStyle,
          left: x,
          top: y,
          width,
          height,
        };
      default:
        return baseStyle;
    }
  };
  
  // Handle panel dragging (for floating panels)
  const handleDragStart = (e: React.MouseEvent) => {
    if (position !== 'float') return;
    
    e.preventDefault();
    setDragging(true);
    
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panelX: x,
      panelY: y,
    };
    
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
  };
  
  const handleDragMove = (e: MouseEvent) => {
    if (!dragging) return;
    
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;
    
    setX(dragStartRef.current.panelX + deltaX);
    setY(dragStartRef.current.panelY + deltaY);
  };
  
  const handleDragEnd = () => {
    setDragging(false);
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
  };
  
  // Handle panel resizing
  const handleResizeStart = (e: React.MouseEvent, direction: 'width' | 'height' | 'both') => {
    if (!resizable) return;
    
    e.preventDefault();
    e.stopPropagation();
    setResizing(direction);
    
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      width,
      height,
    };
    
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
  };
  
  const handleResizeMove = (e: MouseEvent) => {
    if (!resizing) return;
    
    const deltaX = e.clientX - resizeStartRef.current.x;
    const deltaY = e.clientY - resizeStartRef.current.y;
    
    if (resizing === 'width' || resizing === 'both') {
      let newWidth = position === 'right' 
        ? resizeStartRef.current.width - deltaX 
        : resizeStartRef.current.width + deltaX;
      newWidth = Math.max(minWidth || 100, newWidth);
      setWidth(newWidth);
    }
    
    if (resizing === 'height' || resizing === 'both') {
      let newHeight = position === 'bottom' 
        ? resizeStartRef.current.height - deltaY 
        : resizeStartRef.current.height + deltaY;
      newHeight = Math.max(minHeight || 100, newHeight);
      setHeight(newHeight);
    }
    
    if (position === 'float' && resizing === 'both') {
      setWidth(Math.max(minWidth || 100, resizeStartRef.current.width + deltaX));
      setHeight(Math.max(minHeight || 100, resizeStartRef.current.height + deltaY));
    }
  };
  
  const handleResizeEnd = () => {
    setResizing(null);
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
    
    if (onResize) {
      onResize(width, height);
    }
  };
  
  // Handle position change
  const changePosition = (newPosition: DockPosition) => {
    setPosition(newPosition);
    setCollapsed(false);
    
    if (onPositionChange) {
      onPositionChange(newPosition);
    }
  };
  
  // Toggle collapsed state
  const toggleCollapsed = () => {
    if (collapsible) {
      setCollapsed(!collapsed);
    }
  };
  
  // Clean up event listeners
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
    };
  }, []);
  
  // Determine resize handles based on position
  const renderResizeHandles = () => {
    if (!resizable) return null;
    
    const handleStyle: React.CSSProperties = {
      position: 'absolute',
      background: 'transparent',
      zIndex: 1,
    };
    
    switch (position) {
      case 'left':
        return (
          <div
            className="resize-handle resize-handle-right"
            style={{
              ...handleStyle,
              cursor: 'ew-resize',
              width: '6px',
              top: 0,
              right: 0,
              bottom: 0,
            }}
            onMouseDown={(e) => handleResizeStart(e, 'width')}
          />
        );
      case 'right':
        return (
          <div
            className="resize-handle resize-handle-left"
            style={{
              ...handleStyle,
              cursor: 'ew-resize',
              width: '6px',
              top: 0,
              left: 0,
              bottom: 0,
            }}
            onMouseDown={(e) => handleResizeStart(e, 'width')}
          />
        );
      case 'top':
        return (
          <div
            className="resize-handle resize-handle-bottom"
            style={{
              ...handleStyle,
              cursor: 'ns-resize',
              height: '6px',
              left: 0,
              right: 0,
              bottom: 0,
            }}
            onMouseDown={(e) => handleResizeStart(e, 'height')}
          />
        );
      case 'bottom':
        return (
          <div
            className="resize-handle resize-handle-top"
            style={{
              ...handleStyle,
              cursor: 'ns-resize',
              height: '6px',
              left: 0,
              right: 0,
              top: 0,
            }}
            onMouseDown={(e) => handleResizeStart(e, 'height')}
          />
        );
      case 'float':
        return (
          <>
            <div
              className="resize-handle resize-handle-right"
              style={{
                ...handleStyle,
                cursor: 'ew-resize',
                width: '6px',
                top: 0,
                right: 0,
                bottom: 0,
              }}
              onMouseDown={(e) => handleResizeStart(e, 'width')}
            />
            <div
              className="resize-handle resize-handle-bottom"
              style={{
                ...handleStyle,
                cursor: 'ns-resize',
                height: '6px',
                left: 0,
                right: 0,
                bottom: 0,
              }}
              onMouseDown={(e) => handleResizeStart(e, 'height')}
            />
            <div
              className="resize-handle resize-handle-corner"
              style={{
                ...handleStyle,
                cursor: 'nwse-resize',
                width: '12px',
                height: '12px',
                right: 0,
                bottom: 0,
              }}
              onMouseDown={(e) => handleResizeStart(e, 'both')}
            />
          </>
        );
      default:
        return null;
    }
  };
  
  // Render position control buttons
  const renderPositionControls = () => {
    return (
      <div className="dock-position-controls" style={{ display: 'flex', gap: '4px' }}>
        <button
          type="button"
          onClick={() => changePosition('left')}
          className={`position-btn ${position === 'left' ? 'active' : ''}`}
          title="Dock to left"
          style={{ width: '20px', height: '20px', padding: 0 }}
        >
          <span style={{ fontSize: '14px' }}>◀</span>
        </button>
        <button
          type="button"
          onClick={() => changePosition('right')}
          className={`position-btn ${position === 'right' ? 'active' : ''}`}
          title="Dock to right"
          style={{ width: '20px', height: '20px', padding: 0 }}
        >
          <span style={{ fontSize: '14px' }}>▶</span>
        </button>
        <button
          type="button"
          onClick={() => changePosition('top')}
          className={`position-btn ${position === 'top' ? 'active' : ''}`}
          title="Dock to top"
          style={{ width: '20px', height: '20px', padding: 0 }}
        >
          <span style={{ fontSize: '14px' }}>▲</span>
        </button>
        <button
          type="button"
          onClick={() => changePosition('bottom')}
          className={`position-btn ${position === 'bottom' ? 'active' : ''}`}
          title="Dock to bottom"
          style={{ width: '20px', height: '20px', padding: 0 }}
        >
          <span style={{ fontSize: '14px' }}>▼</span>
        </button>
        <button
          type="button"
          onClick={() => changePosition('float')}
          className={`position-btn ${position === 'float' ? 'active' : ''}`}
          title="Float panel"
          style={{ width: '20px', height: '20px', padding: 0 }}
        >
          <span style={{ fontSize: '14px' }}>⬚</span>
        </button>
      </div>
    );
  };
  
  // Render panel header
  const renderHeader = () => {
    if (collapsed && position !== 'float') {
      return (
        <div
          className="dock-panel-collapsed-header"
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            height: '100%',
            cursor: 'pointer',
          }}
          onClick={toggleCollapsed}
          title={title}
        >
          <span style={{ 
            writingMode: position === 'left' || position === 'right' ? 'vertical-rl' : 'horizontal-tb',
            transform: position === 'left' ? 'rotate(180deg)' : 'none',
            fontWeight: 'bold',
            fontSize: '12px',
          }}>
            {title.charAt(0)}
          </span>
        </div>
      );
    }
    
    return (
      <div
        className="dock-panel-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px 12px',
          borderBottom: '1px solid #ddd',
          backgroundColor: '#f5f5f5',
          cursor: position === 'float' ? 'move' : 'default',
          userSelect: 'none',
        }}
        onMouseDown={handleDragStart}
      >
        <div className="dock-panel-title" style={{ fontWeight: 'bold', flexGrow: 1 }}>
          {title}
        </div>
        
        <div style={{ display: 'flex', gap: '4px' }}>
          {renderPositionControls()}
          
          {collapsible && position !== 'float' && (
            <button
              type="button"
              onClick={toggleCollapsed}
              className="collapse-btn"
              title={collapsed ? 'Expand' : 'Collapse'}
              style={{ width: '20px', height: '20px', padding: 0 }}
            >
              <span style={{ fontSize: '14px' }}>{collapsed ? '▢' : '_'}</span>
            </button>
          )}
        </div>
      </div>
    );
  };
  
  // Render panel content
  const renderContent = () => {
    if (collapsed && position !== 'float') {
      return null;
    }
    
    return (
      <div
        className="dock-panel-content"
        style={{
          padding: '12px',
          overflowY: 'auto',
          height: 'calc(100% - 43px)', // 43px is header height
        }}
      >
        {children}
      </div>
    );
  };
  
  return (
    <div
      ref={panelRef}
      className={`dock-panel ${className} dock-position-${position} ${collapsed ? 'collapsed' : ''}`}
      style={getPanelStyle()}
    >
      {renderHeader()}
      {renderContent()}
      {renderResizeHandles()}
    </div>
  );
};

export default DockPanel; 