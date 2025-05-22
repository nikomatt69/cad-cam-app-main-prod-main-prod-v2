// src/components/cad/technical-drawing/ui/context/TooltipSystem.tsx

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Point } from '../../TechnicalDrawingTypes';

interface TooltipData {
  id: string;
  content: React.ReactNode;
  position: Point;
  delay?: number;
  duration?: number;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  offset?: number;
  interactive?: boolean;
  maxWidth?: number;
}

interface TooltipContextType {
  showTooltip: (tooltip: Omit<TooltipData, 'id'>) => string;
  hideTooltip: (id: string) => void;
  updateTooltip: (id: string, updates: Partial<TooltipData>) => void;
  clearAllTooltips: () => void;
}

const TooltipContext = React.createContext<TooltipContextType | null>(null);

export const useTooltip = () => {
  const context = React.useContext(TooltipContext);
  if (!context) {
    throw new Error('useTooltip must be used within TooltipProvider');
  }
  return context;
};

interface TooltipProviderProps {
  children: React.ReactNode;
}

export const TooltipProvider: React.FC<TooltipProviderProps> = ({ children }) => {
  const [tooltips, setTooltips] = useState<Map<string, TooltipData>>(new Map());
  const nextIdRef = useRef(1);
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const showTooltip = (tooltip: Omit<TooltipData, 'id'>): string => {
    const id = `tooltip_${nextIdRef.current++}`;
    const delay = tooltip.delay ?? 500; // Default 500ms delay
    
    // Clear any existing timeout for this position (if similar)
    timeoutsRef.current.forEach((timeout, timeoutId) => {
      clearTimeout(timeout);
    });
    
    if (delay > 0) {
      const timeout = setTimeout(() => {
        setTooltips(prev => new Map(prev.set(id, { ...tooltip, id })));
        timeoutsRef.current.delete(id);
      }, delay);
      
      timeoutsRef.current.set(id, timeout);
    } else {
      setTooltips(prev => new Map(prev.set(id, { ...tooltip, id })));
    }
    
    // Auto-hide after duration
    if (tooltip.duration !== undefined && tooltip.duration > 0) {
      setTimeout(() => {
        hideTooltip(id);
      }, delay + tooltip.duration);
    }
    
    return id;
  };

  const hideTooltip = (id: string) => {
    // Clear any pending timeout
    const timeout = timeoutsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutsRef.current.delete(id);
    }
    
    setTooltips(prev => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  };

  const updateTooltip = (id: string, updates: Partial<TooltipData>) => {
    setTooltips(prev => {
      const tooltip = prev.get(id);
      if (!tooltip) return prev;
      
      const next = new Map(prev);
      next.set(id, { ...tooltip, ...updates });
      return next;
    });
  };

  const clearAllTooltips = () => {
    // Clear all timeouts
    timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    timeoutsRef.current.clear();
    
    setTooltips(new Map());
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  const contextValue: TooltipContextType = {
    showTooltip,
    hideTooltip,
    updateTooltip,
    clearAllTooltips
  };

  return (
    <TooltipContext.Provider value={contextValue}>
      {children}
      <TooltipRenderer tooltips={tooltips} />
    </TooltipContext.Provider>
  );
};

interface TooltipRendererProps {
  tooltips: Map<string, TooltipData>;
}

const TooltipRenderer: React.FC<TooltipRendererProps> = ({ tooltips }) => {
  const calculatePosition = (tooltip: TooltipData, element: HTMLDivElement) => {
    const { position, placement = 'auto', offset = 8 } = tooltip;
    const rect = element.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let finalPlacement = placement;
    
    // Auto placement logic
    if (placement === 'auto') {
      const spaceTop = position.y;
      const spaceBottom = viewportHeight - position.y;
      const spaceLeft = position.x;
      const spaceRight = viewportWidth - position.x;
      
      if (spaceBottom >= rect.height + offset) {
        finalPlacement = 'bottom';
      } else if (spaceTop >= rect.height + offset) {
        finalPlacement = 'top';
      } else if (spaceRight >= rect.width + offset) {
        finalPlacement = 'right';
      } else {
        finalPlacement = 'left';
      }
    }
    
    let x = position.x;
    let y = position.y;
    
    switch (finalPlacement) {
      case 'top':
        x = position.x - rect.width / 2;
        y = position.y - rect.height - offset;
        break;
      case 'bottom':
        x = position.x - rect.width / 2;
        y = position.y + offset;
        break;
      case 'left':
        x = position.x - rect.width - offset;
        y = position.y - rect.height / 2;
        break;
      case 'right':
        x = position.x + offset;
        y = position.y - rect.height / 2;
        break;
    }
    
    // Keep tooltip within viewport
    x = Math.max(8, Math.min(x, viewportWidth - rect.width - 8));
    y = Math.max(8, Math.min(y, viewportHeight - rect.height - 8));
    
    return { x, y, placement: finalPlacement };
  };

  return (
    <div className="tooltip-container fixed inset-0 pointer-events-none z-50">
      <AnimatePresence>
        {Array.from(tooltips.values()).map(tooltip => (
          <TooltipItem key={tooltip.id} tooltip={tooltip} calculatePosition={calculatePosition} />
        ))}
      </AnimatePresence>
    </div>
  );
};

interface TooltipItemProps {
  tooltip: TooltipData;
  calculatePosition: (tooltip: TooltipData, element: HTMLDivElement) => { x: number; y: number; placement: string };
}

const TooltipItem: React.FC<TooltipItemProps> = ({ tooltip, calculatePosition }) => {
  const [position, setPosition] = useState({ x: tooltip.position.x, y: tooltip.position.y });
  const [placement, setPlacement] = useState(tooltip.placement || 'auto');
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (elementRef.current) {
      const { x, y, placement: finalPlacement } = calculatePosition(tooltip, elementRef.current);
      setPosition({ x, y });
      setPlacement(finalPlacement);
    }
  }, [tooltip.position, tooltip.placement]);

  return (
    <motion.div
      ref={elementRef}
      className={`
        tooltip-item absolute bg-gray-900 text-white px-3 py-2 rounded-lg text-sm
        ${tooltip.interactive ? 'pointer-events-auto' : 'pointer-events-none'}
        shadow-lg border border-gray-700
      `}
      style={{
        left: position.x,
        top: position.y,
        maxWidth: tooltip.maxWidth || 300,
        zIndex: 1000
      }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.15 }}
    >
      {/* Arrow */}
      <div
        className={`
          absolute w-2 h-2 bg-gray-900 transform rotate-45 border
          ${placement === 'top' ? 'bottom-[-5px] left-1/2 -translate-x-1/2 border-t-0 border-l-0' : ''}
          ${placement === 'bottom' ? 'top-[-5px] left-1/2 -translate-x-1/2 border-b-0 border-r-0' : ''}
          ${placement === 'left' ? 'right-[-5px] top-1/2 -translate-y-1/2 border-l-0 border-b-0' : ''}
          ${placement === 'right' ? 'left-[-5px] top-1/2 -translate-y-1/2 border-r-0 border-t-0' : ''}
        `}
      />
      
      {/* Content */}
      <div className="relative z-10">
        {tooltip.content}
      </div>
    </motion.div>
  );
};

// Convenience hook for common tooltip patterns
export const useEntityTooltip = () => {
  const { showTooltip, hideTooltip } = useTooltip();

  const showEntityTooltip = (entityType: string, entityId: string, position: Point, additionalInfo?: Record<string, any>) => {
    const content = (
      <div className="space-y-1">
        <div className="font-medium">{entityType.charAt(0).toUpperCase() + entityType.slice(1)}</div>
        <div className="text-xs text-gray-300">ID: {entityId}</div>
        {additionalInfo && Object.entries(additionalInfo).map(([key, value]) => (
          <div key={key} className="text-xs text-gray-300">
            {key}: {String(value)}
          </div>
        ))}
      </div>
    );

    return showTooltip({
      content,
      position,
      delay: 800,
      duration: 5000,
      placement: 'auto'
    });
  };

  const showToolTooltip = (toolName: string, shortcut: string, position: Point) => {
    const content = (
      <div className="space-y-1">
        <div className="font-medium">{toolName}</div>
        <div className="text-xs text-gray-300">Shortcut: {shortcut}</div>
      </div>
    );

    return showTooltip({
      content,
      position,
      delay: 500,
      duration: 3000,
      placement: 'bottom'
    });
  };

  const showCoordinateTooltip = (x: number, y: number, position: Point) => {
    const content = (
      <div className="text-center">
        <div className="text-xs">X: {x.toFixed(2)}</div>
        <div className="text-xs">Y: {y.toFixed(2)}</div>
      </div>
    );

    return showTooltip({
      content,
      position,
      delay: 200,
      duration: 2000,
      placement: 'auto'
    });
  };

  const showMeasurementTooltip = (measurement: string, position: Point) => {
    const content = (
      <div className="font-mono text-center">
        {measurement}
      </div>
    );

    return showTooltip({
      content,
      position,
      delay: 0,
      placement: 'auto'
    });
  };

  return {
    showEntityTooltip,
    showToolTooltip,
    showCoordinateTooltip,
    showMeasurementTooltip,
    hideTooltip
  };
};

// Tooltip component for wrapping elements
interface TooltipWrapperProps {
  content: React.ReactNode;
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  interactive?: boolean;
  disabled?: boolean;
}

export const TooltipWrapper: React.FC<TooltipWrapperProps> = ({
  content,
  children,
  delay = 500,
  duration,
  placement = 'auto',
  interactive = false,
  disabled = false
}) => {
  const { showTooltip, hideTooltip } = useTooltip();
  const [tooltipId, setTooltipId] = useState<string | null>(null);
  const elementRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (disabled || !elementRef.current) return;
    
    const rect = elementRef.current.getBoundingClientRect();
    const position = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };

    const id = showTooltip({
      content,
      position,
      delay,
      duration,
      placement,
      interactive
    });
    
    setTooltipId(id);
  };

  const handleMouseLeave = () => {
    if (tooltipId) {
      hideTooltip(tooltipId);
      setTooltipId(null);
    }
  };

  return (
    <div
      ref={elementRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="inline-block"
    >
      {children}
    </div>
  );
};

export default TooltipProvider;
