// src/components/cad/technical-drawing/CommandLine.tsx

import React, { useState, useEffect, useRef, KeyboardEvent as ReactKeyboardEvent } from 'react';
import { ChevronUp, ChevronDown, X } from 'react-feather';

interface CommandLineProps {
  onSubmit: (command: string) => void;
  onCancel: () => void;
}

export const CommandLine: React.FC<CommandLineProps> = ({ 
  onSubmit, 
  onCancel 
}) => {
  const [command, setCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [commandLog, setCommandLog] = useState<string[]>([]);
  const [showLog, setShowLog] = useState(false);
  const [dynamicInput, setDynamicInput] = useState<{x: number, y: number} | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  // List of common AutoCAD-like commands
  const commonCommands = [
    'line', 'l', 'circle', 'c', 'arc', 'a', 'rectangle', 'rect', 'polyline', 'pl',
    'ellipse', 'el', 'text', 't', 'dimension', 'dim', 'linear', 'angular', 'radius',
    'diameter', 'ordinate', 'center', 'centerline', 'centermark', 'move', 'm',
    'copy', 'co', 'rotate', 'ro', 'scale', 'sc', 'mirror', 'mi', 'offset', 'o',
    'trim', 'tr', 'extend', 'ex', 'fillet', 'f', 'chamfer', 'cha', 'array', 'ar', 
    'arrayrect', 'arraypolar', 'zoom', 'pan', 'erase', 'undo', 'redo', 'save',
    'grid', 'snap', 'ortho', 'osnap', 'leader', 'le', 'hatch', 'h', 'block', 'insert',
    'point', 'po', 'spline', 'sp', 'delete', 'del', 'break', 'join', 'layer', 'la',
    'style', 'st', 'dimension style', 'dimstyle', 'units', 'properties', 'prop',
    'group', 'measure', 'dist', 'distance', 'area', 'list', 'qselect',
    'construction-line', 'xl', 'feature-control-frame', 'fcf', 'surface-finish', 'sf',
    'weldsymbol', 'weld', 'datum', 'balloontext', 'bt', 'partslist', 'pl', 'thread', 'ts'
  ];
  
  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);
  
  // Filter suggestions based on current input
  useEffect(() => {
    if (command.trim()) {
      const filteredSuggestions = commonCommands.filter(cmd => 
        cmd.startsWith(command.toLowerCase()) && cmd !== command.toLowerCase()
      ).slice(0, 5);
      
      setSuggestions(filteredSuggestions);
      setShowSuggestions(filteredSuggestions.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [command]);
  
  // Handle clicking outside suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    // Handle special keys
    switch(e.key) {
      case 'Enter':
        if (command.trim()) {
          // Add to history and log
          const newHistory = [...commandHistory];
          if (newHistory[0] !== command) {
            newHistory.unshift(command);
            setCommandHistory(newHistory.slice(0, 20)); // Keep last 20 commands
          }
          
          setCommandLog(prev => [...prev, `> ${command}`]);
          
          // Submit command
          onSubmit(command);
          setCommand('');
          setHistoryIndex(-1);
        }
        break;
        
      case 'Escape':
        onCancel();
        setShowSuggestions(false);
        break;
        
      case 'ArrowUp':
        // Navigate history
        e.preventDefault();
        if (showSuggestions && suggestions.length > 0) {
          // Navigate suggestions
          const index = Math.max(0, historyIndex - 1);
          setHistoryIndex(index);
          if (suggestions[index]) {
            setCommand(suggestions[index]);
          }
        } else if (commandHistory.length > 0) {
          // Navigate command history
          const histIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
          setHistoryIndex(histIndex);
          setCommand(commandHistory[histIndex]);
        }
        break;
        
      case 'ArrowDown':
        // Navigate history
        e.preventDefault();
        if (showSuggestions && suggestions.length > 0) {
          // Navigate suggestions
          const index = historyIndex >= suggestions.length - 1 ? -1 : historyIndex + 1;
          setHistoryIndex(index);
          if (index === -1) {
            setCommand('');
          } else if (suggestions[index]) {
            setCommand(suggestions[index]);
          }
        } else if (historyIndex > 0) {
          // Navigate command history
          const histIndex = historyIndex - 1;
          setHistoryIndex(histIndex);
          setCommand(commandHistory[histIndex]);
        } else if (historyIndex === 0) {
          // Back to empty command
          setHistoryIndex(-1);
          setCommand('');
        }
        break;
        
      case 'Tab':
        // Auto-complete
        e.preventDefault();
        if (showSuggestions && suggestions.length > 0) {
          setCommand(suggestions[0]);
          setShowSuggestions(false);
        }
        break;
        
      default:
        // Reset history navigation
        if (e.key.length === 1) {
          setHistoryIndex(-1);
        }
    }
  };
  
  // Toggle command log visibility
  const toggleCommandLog = () => {
    setShowLog(!showLog);
  };
  
  // Clear command log
  const clearCommandLog = () => {
    setCommandLog([]);
  };
  
  // Set dynamic input coordinates (for real-time drawing feedback)
  const setDynamicCoordinates = (x: number, y: number) => {
    setDynamicInput({ x, y });
  };
  
  return (
    <div className="relative w-full">
      {/* Command Log */}
      {showLog && (
        <div className="absolute bottom-full left-0 right-0 bg-gray-800 border-t border-gray-700 max-h-40 overflow-y-auto">
          <div className="flex justify-between items-center px-3 py-1 border-b border-gray-700 bg-gray-850">
            <h3 className="text-xs font-medium text-gray-300">Command History</h3>
            <button 
              onClick={clearCommandLog}
              className="text-xs text-gray-400 hover:text-gray-200"
            >
              Clear
            </button>
          </div>
          <div className="p-2">
            {commandLog.map((log, index) => (
              <div key={index} className="text-xs text-gray-300 font-mono">{log}</div>
            ))}
            {commandLog.length === 0 && (
              <div className="text-xs text-gray-500 italic">No command history</div>
            )}
          </div>
        </div>
      )}
      
      {/* Main Command Line */}
      <div className="flex items-center h-full bg-gray-900 border-t border-gray-700 px-2">
        <button
          onClick={toggleCommandLog}
          className="flex items-center justify-center w-6 h-6 text-gray-400 hover:text-gray-200"
          title="Command History"
        >
          {showLog ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
        
        <span className="text-gray-500 mr-2 ml-1">Command:</span>
        
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent border-none outline-none text-white h-8"
            placeholder="Type a command or press ESC to cancel..."
            autoComplete="off"
            spellCheck="false"
          />
          
          {/* Command Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div 
              ref={suggestionsRef}
              className="absolute bottom-full left-0 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-10 min-w-48 max-w-72 w-auto"
            >
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setCommand(suggestion);
                    setShowSuggestions(false);
                    if (inputRef.current) inputRef.current.focus();
                  }}
                  className={`block w-full text-left px-3 py-1.5 text-sm ${
                    index === historyIndex 
                      ? 'bg-blue-900 text-blue-100' 
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Dynamic Input (coordinates) */}
        {dynamicInput && (
          <div className="flex items-center ml-4 text-xs">
            <span className="text-green-400 font-mono">X: {dynamicInput.x.toFixed(2)}</span>
            <span className="text-gray-400 mx-1">|</span>
            <span className="text-green-400 font-mono">Y: {dynamicInput.y.toFixed(2)}</span>
          </div>
        )}
        
        {/* Indicator for current mode */}
        <div className="flex items-center ml-4 space-x-3 text-xs">
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-blue-500 mr-1"></div>
            <span className="text-gray-300">GRID</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
            <span className="text-gray-300">SNAP</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-yellow-500 mr-1"></div>
            <span className="text-gray-300">ORTHO</span>
          </div>
        </div>
      </div>
    </div>
  );
};