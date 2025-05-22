// src/components/cad/technical-drawing/ui/CommandLine.tsx

import React, { useState, useRef, useEffect } from 'react';
import { useTechnicalDrawingStore } from '../enhancedTechnicalDrawingStore';

interface CommandLineProps {
  height: number;
  onSave?: () => Promise<void>;
  onExport?: (format: string) => Promise<void>;
}

interface Command {
  name: string;
  description: string;
  execute: (args: string[]) => void;
  autocomplete?: string[];
}

const CommandLine: React.FC<CommandLineProps> = ({ height, onSave, onExport }) => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    setActiveTool,
    addEntity,
    zoomToFit,
    clearSelection,
    deleteEntity,
    selectedEntityIds,
    undo,
    redo,
    entities,
    dimensions,
    annotations
  } = useTechnicalDrawingStore();

  // Define available commands
  const commands: Record<string, Command> = {
    line: {
      name: 'line',
      description: 'Draw a line',
      execute: () => setActiveTool('line')
    },
    circle: {
      name: 'circle', 
      description: 'Draw a circle',
      execute: () => setActiveTool('circle')
    },
    rectangle: {
      name: 'rectangle',
      description: 'Draw a rectangle', 
      execute: () => setActiveTool('rectangle')
    },
    rect: {
      name: 'rect',
      description: 'Draw a rectangle (alias)',
      execute: () => setActiveTool('rectangle')
    },
    polyline: {
      name: 'polyline',
      description: 'Draw a polyline',
      execute: () => setActiveTool('polyline')
    },
    pline: {
      name: 'pline',
      description: 'Draw a polyline (alias)',
      execute: () => setActiveTool('polyline')
    },
    select: {
      name: 'select',
      description: 'Selection tool',
      execute: () => setActiveTool('select')
    },
    text: {
      name: 'text',
      description: 'Add text annotation',
      execute: () => setActiveTool('text')
    },
    dimension: {
      name: 'dimension',
      description: 'Add dimension',
      execute: () => setActiveTool('dimension')
    },
    dim: {
      name: 'dim',
      description: 'Add dimension (alias)',
      execute: () => setActiveTool('dimension')
    },
    zoom: {
      name: 'zoom',
      description: 'Zoom operations',
      execute: (args) => {
        if (args.length === 0 || args[0] === 'all' || args[0] === 'extents') {
          zoomToFit();
        }
      },
      autocomplete: ['all', 'extents', 'window', 'previous']
    },
    z: {
      name: 'z',
      description: 'Zoom (alias)',
      execute: (args) => commands.zoom.execute(args),
      autocomplete: ['all', 'extents', 'window', 'previous']
    },
    erase: {
      name: 'erase',
      description: 'Delete selected entities',
      execute: () => {
        selectedEntityIds.forEach(id => deleteEntity(id));
        clearSelection();
      }
    },
    delete: {
      name: 'delete',
      description: 'Delete selected entities',
      execute: () => commands.erase.execute([])
    },
    del: {
      name: 'del', 
      description: 'Delete selected entities (alias)',
      execute: () => commands.erase.execute([])
    },
    undo: {
      name: 'undo',
      description: 'Undo last action',
      execute: () => undo()
    },
    u: {
      name: 'u',
      description: 'Undo (alias)',
      execute: () => undo()
    },
    redo: {
      name: 'redo',
      description: 'Redo last undone action', 
      execute: () => redo()
    },
    save: {
      name: 'save',
      description: 'Save drawing',
      execute: async () => {
        if (onSave) {
          await onSave();
          addToHistory('Drawing saved');
        }
      }
    },
    export: {
      name: 'export',
      description: 'Export drawing',
      execute: async (args) => {
        const format = args[0] || 'svg';
        if (onExport) {
          await onExport(format);
          addToHistory(`Drawing exported as ${format.toUpperCase()}`);
        }
      },
      autocomplete: ['svg', 'pdf', 'dxf', 'png']
    },
    help: {
      name: 'help',
      description: 'Show available commands',
      execute: () => {
        const helpText = Object.values(commands)
          .map(cmd => `${cmd.name}: ${cmd.description}`)
          .join('\n');
        addToHistory('Available commands:\n' + helpText);
      }
    },
    clear: {
      name: 'clear',
      description: 'Clear command history',
      execute: () => setHistory([])
    },
    list: {
      name: 'list',
      description: 'List entities',
      execute: () => {
        const entityCount = Object.keys(entities).length;
        const dimensionCount = Object.keys(dimensions).length;
        const annotationCount = Object.keys(annotations).length;
        const total = entityCount + dimensionCount + annotationCount;
        
        addToHistory(
          `Entities: ${entityCount}, Dimensions: ${dimensionCount}, Annotations: ${annotationCount}, Total: ${total}`
        );
      }
    }
  };

  const addToHistory = (message: string) => {
    setHistory(prev => [...prev, message]);
  };

  const executeCommand = (commandText: string) => {
    const parts = commandText.trim().toLowerCase().split(' ');
    const commandName = parts[0];
    const args = parts.slice(1);

    if (commandName === '') return;

    addToHistory(`> ${commandText}`);

    const command = commands[commandName];
    if (command) {
      try {
        command.execute(args);
        if (command.name !== 'help' && command.name !== 'clear' && command.name !== 'list') {
          // Don't show success message for info commands
          if (!command.name.includes('save') && !command.name.includes('export')) {
            addToHistory(`Command executed: ${command.name}`);
          }
        }
      } catch (error) {
        addToHistory(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      addToHistory(`Unknown command: ${commandName}. Type 'help' for available commands.`);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case 'Enter':
        event.preventDefault();
        if (input.trim()) {
          executeCommand(input);
          setInput('');
          setHistoryIndex(-1);
          setShowSuggestions(false);
        }
        break;

      case 'ArrowUp':
        event.preventDefault();
        if (history.length > 0) {
          const newIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
          setHistoryIndex(newIndex);
          const historyCommand = history[newIndex];
          if (historyCommand.startsWith('> ')) {
            setInput(historyCommand.substring(2));
          }
        }
        break;

      case 'ArrowDown':
        event.preventDefault();
        if (historyIndex !== -1) {
          const newIndex = Math.min(history.length - 1, historyIndex + 1);
          if (newIndex === history.length - 1) {
            setHistoryIndex(-1);
            setInput('');
          } else {
            setHistoryIndex(newIndex);
            const historyCommand = history[newIndex];
            if (historyCommand.startsWith('> ')) {
              setInput(historyCommand.substring(2));
            }
          }
        }
        break;

      case 'Tab':
        event.preventDefault();
        if (suggestions.length > 0) {
          setInput(suggestions[0]);
          setShowSuggestions(false);
        }
        break;

      case 'Escape':
        setInput('');
        setShowSuggestions(false);
        setHistoryIndex(-1);
        break;
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setInput(value);

    // Generate suggestions
    if (value.trim()) {
      const parts = value.trim().toLowerCase().split(' ');
      const commandName = parts[0];
      
      if (parts.length === 1) {
        // Suggest commands
        const matchingCommands = Object.keys(commands)
          .filter(cmd => cmd.startsWith(commandName))
          .slice(0, 5);
        setSuggestions(matchingCommands);
        setShowSuggestions(matchingCommands.length > 0);
      } else {
        // Suggest command arguments
        const command = commands[commandName];
        if (command && command.autocomplete) {
          const currentArg = parts[parts.length - 1];
          const matchingArgs = command.autocomplete
            .filter(arg => arg.startsWith(currentArg))
            .map(arg => parts.slice(0, -1).concat(arg).join(' '))
            .slice(0, 5);
          setSuggestions(matchingArgs);
          setShowSuggestions(matchingArgs.length > 0);
        } else {
          setShowSuggestions(false);
        }
      }
    } else {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (suggestion: string) => {
    setInput(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Auto-scroll history
  const historyRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [history]);

  return (
    <div 
      className="bg-black text-green-400 font-mono text-sm flex flex-col relative"
      style={{ height: `${height}px` }}
    >
      {/* Command History */}
      {history.length > 0 && (
        <div 
          ref={historyRef}
          className="flex-1 overflow-y-auto p-2 text-xs max-h-32 bg-gray-900 border-b border-gray-700"
        >
          {history.slice(-10).map((line, index) => (
            <div 
              key={index} 
              className={line.startsWith('>') ? 'text-white' : 'text-green-300'}
            >
              {line}
            </div>
          ))}
        </div>
      )}

      {/* Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 bg-gray-800 border border-gray-600 rounded-t max-h-32 overflow-y-auto z-10">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="px-3 py-1 hover:bg-gray-700 cursor-pointer text-xs"
              onClick={() => selectSuggestion(suggestion)}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}

      {/* Input Line */}  
      <div className="flex items-center px-2 py-1 bg-black">
        <span className="text-yellow-400 mr-2">Command:</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent text-green-400 outline-none"
          placeholder="Enter command (type 'help' for commands)"
          autoComplete="off"
          spellCheck={false}
        />
      </div>
    </div>
  );
};

export default CommandLine;
