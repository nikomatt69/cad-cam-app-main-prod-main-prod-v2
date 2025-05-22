// src/components/cad/technical-drawing/ui/panels/DockPanel.tsx

import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { ChevronDown, ChevronRight, X, Maximize2, Minimize2 } from 'lucide-react';

interface DockPanelProps {
  title: string;
  children: ReactNode;
  defaultCollapsed?: boolean;
  collapsible?: boolean;
  closable?: boolean;
  resizable?: boolean;
  onClose?: () => void;
  minHeight?: number;
  maxHeight?: number;
  className?: string;
}

const DockPanel: React.FC<DockPanelProps> = ({
  title,
  children,
  defaultCollapsed = false,
  collapsible = true,
  closable = false,
  resizable = false,
  onClose,
  minHeight = 100,
  maxHeight = 600,
  className = ''
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [height, setHeight] = useState(300);
  const [isResizing, setIsResizing] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startHeight, setStartHeight] = useState(0);
  
  const panelRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!resizable) return;
    
    setIsResizing(true);
    setStartY(e.clientY);
    setStartHeight(height);
    
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!resizable || !isResizing) return;
    
    const deltaY = e.clientY - startY;
    const newHeight = Math.max(
      minHeight,
      Math.min(maxHeight, startHeight + deltaY)
    );
    
    setHeight(newHeight);
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, startY, startHeight]);

  return (
    <div 
      ref={panelRef}
      className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm ${className}`}
      style={{ 
        height: isCollapsed ? 'auto' : `${height}px`,
        minHeight: isCollapsed ? 'auto' : `${minHeight}px`
      }}
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 rounded-t-lg">
        <div className="flex items-center space-x-2">
          {collapsible && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
            >
              {isCollapsed ? (
                <ChevronRight size={14} />
              ) : (
                <ChevronDown size={14} />
              )}
            </button>
          )}
          
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
            {title}
          </h4>
        </div>

        <div className="flex items-center space-x-1">
          {!isCollapsed && (
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
              title="Minimize"
            >
              <Minimize2 size={14} />
            </button>
          )}
          
          {isCollapsed && (
            <button
              onClick={() => setIsCollapsed(false)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
              title="Maximize"
            >
              <Maximize2 size={14} />
            </button>
          )}
          
          {closable && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-red-100 dark:hover:bg-red-900 hover:text-red-600 rounded"
              title="Close"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Panel Content */}
      {!isCollapsed && (
        <div className="flex-1 overflow-auto p-3">
          {children}
        </div>
      )}

      {/* Resize Handle */}
      {resizable && !isCollapsed && (
        <div
          className="h-2 bg-gray-100 dark:bg-gray-700 cursor-row-resize hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          onMouseDown={handleMouseDown}
        >
          <div className="flex justify-center items-center h-full">
            <div className="w-8 h-1 bg-gray-400 dark:bg-gray-500 rounded"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DockPanel;
