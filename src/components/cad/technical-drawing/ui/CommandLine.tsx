import React, { useState, useEffect, useRef, useCallback } from 'react';

export interface Command {
  name: string;
  aliases?: string[];
  description: string;
  parameters?: CommandParameter[];
  action: (params: any) => void;
}

export interface CommandParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'point';
  description: string;
  required?: boolean;
  default?: any;
}

interface CommandLineProps {
  commands: Command[];
  onExecute?: (command: string, params: any[]) => void;
  onError?: (error: string) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  historySize?: number;
}

const CommandLine: React.FC<CommandLineProps> = ({
  commands,
  onExecute,
  onError,
  placeholder = 'Enter command...',
  className = '',
  style = {},
  historySize = 50,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [currentParameter, setCurrentParameter] = useState<number>(-1);
  const [activeCommand, setActiveCommand] = useState<Command | null>(null);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const [parameterValues, setParameterValues] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Reset state when switching to a new command
  const resetCommandState = useCallback(() => {
    setActiveCommand(null);
    setCurrentParameter(-1);
    setParameterValues([]);
  }, []);

  // Find a command by name or alias
  const findCommand = useCallback((commandName: string): Command | null => {
    const lowerName = commandName.toLowerCase();
    return commands.find(cmd => 
      cmd.name.toLowerCase() === lowerName || 
      (cmd.aliases?.some(alias => alias.toLowerCase() === lowerName))
    ) || null;
  }, [commands]);

  // Generate suggestions based on current input
  const generateSuggestions = useCallback((input: string): string[] => {
    if (!input) return [];
    
    const lowerInput = input.toLowerCase();
    
    // If we're in the middle of entering parameters, don't suggest
    if (activeCommand && currentParameter >= 0) return [];
    
    return commands
      .filter(cmd => 
        cmd.name.toLowerCase().startsWith(lowerInput) || 
        (cmd.aliases?.some(alias => alias.toLowerCase().startsWith(lowerInput)))
      )
      .map(cmd => cmd.name);
  }, [commands, activeCommand, currentParameter]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    if (activeCommand && currentParameter >= 0) {
      // We're entering parameters for a command
      return;
    }
    
    // Check if the input could be a command
    const parts = newValue.trim().split(' ');
    if (parts.length === 1) {
      // This could be a command name
      const newSuggestions = generateSuggestions(parts[0]);
      setSuggestions(newSuggestions);
      setShowSuggestions(newSuggestions.length > 0);
      setSelectedSuggestion(0);
    } else {
      setShowSuggestions(false);
    }
  };

  // Handle key presses
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions) {
      // Handle navigation in suggestions dropdown
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestion(prev => (prev + 1) % suggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestion(prev => (prev - 1 + suggestions.length) % suggestions.length);
      } else if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        // Apply the selected suggestion
        if (suggestions.length > 0) {
          setInputValue(suggestions[selectedSuggestion]);
          setShowSuggestions(false);
          
          // If Enter is pressed, also try to execute the command
          if (e.key === 'Enter') {
            const command = findCommand(suggestions[selectedSuggestion]);
            if (command) {
              handleCommandSelected(command);
            }
          }
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowSuggestions(false);
      }
      return;
    }
    
    if (e.key === 'Tab') {
      e.preventDefault();
      // Tab completion
      const parts = inputValue.trim().split(' ');
      if (parts.length === 1) {
        const newSuggestions = generateSuggestions(parts[0]);
        if (newSuggestions.length === 1) {
          setInputValue(newSuggestions[0]);
          setShowSuggestions(false);
        } else if (newSuggestions.length > 1) {
          setSuggestions(newSuggestions);
          setShowSuggestions(true);
          setSelectedSuggestion(0);
        }
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      
      if (activeCommand && currentParameter >= 0) {
        // We're entering parameters
        const params = [...parameterValues];
        params[currentParameter] = inputValue.trim();
        
        if (activeCommand.parameters && currentParameter < activeCommand.parameters.length - 1) {
          // Move to the next parameter
          setParameterValues(params);
          setCurrentParameter(currentParameter + 1);
          setInputValue('');
        } else {
          // Execute the command with all parameters
          executeCommand(activeCommand, params);
          setInputValue('');
          resetCommandState();
        }
      } else {
        // Try to parse and execute a command
        parseAndExecuteCommand(inputValue);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      
      if (activeCommand) {
        // Cancel the current command
        resetCommandState();
        setInputValue('');
      }
    } else if (e.key === 'ArrowUp') {
      if (historyIndex < commandHistory.length - 1) {
        setHistoryIndex(historyIndex + 1);
        setInputValue(commandHistory[historyIndex + 1]);
      }
    } else if (e.key === 'ArrowDown') {
      if (historyIndex > 0) {
        setHistoryIndex(historyIndex - 1);
        setInputValue(commandHistory[historyIndex - 1]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInputValue('');
      }
    }
  };

  // Parse and execute a command from input text
  const parseAndExecuteCommand = (input: string) => {
    const parts = input.trim().split(' ');
    if (parts.length === 0 || parts[0] === '') return;
    
    const commandName = parts[0];
    const command = findCommand(commandName);
    
    if (!command) {
      if (onError) {
        onError(`Unknown command: ${commandName}`);
      }
      return;
    }
    
    // Add to command history
    addToHistory(input);
    
    // Check if we have parameters for this command
    if (command.parameters && command.parameters.length > 0) {
      if (parts.length > 1) {
        // Try to parse all parameters from the input
        const params = parts.slice(1);
        const parsedParams = parseParameters(command, params);
        
        if (parsedParams) {
          executeCommand(command, parsedParams);
        } else {
          // Start interactive parameter input
          handleCommandSelected(command);
        }
      } else {
        // Start interactive parameter input
        handleCommandSelected(command);
      }
    } else {
      // No parameters needed, execute immediately
      executeCommand(command, []);
    }
  };

  // Parse parameters for a command
  const parseParameters = (command: Command, params: string[]): any[] | null => {
    if (!command.parameters) return [];
    
    // If we don't have enough parameters and they're required, return null
    if (params.length < command.parameters.filter(p => p.required).length) {
      return null;
    }
    
    const parsedParams: any[] = [];
    
    for (let i = 0; i < command.parameters.length; i++) {
      const param = command.parameters[i];
      const value = i < params.length ? params[i] : null;
      
      if (value === null) {
        if (param.required) {
          return null;
        } else {
          parsedParams.push(param.default);
          continue;
        }
      }
      
      // Parse value based on parameter type
      if (param.type === 'number') {
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
          if (onError) {
            onError(`Invalid number for parameter ${param.name}: ${value}`);
          }
          return null;
        }
        parsedParams.push(numValue);
      } else if (param.type === 'boolean') {
        const boolValue = value.toLowerCase();
        if (boolValue === 'true' || boolValue === 'yes' || boolValue === 'y' || boolValue === '1') {
          parsedParams.push(true);
        } else if (boolValue === 'false' || boolValue === 'no' || boolValue === 'n' || boolValue === '0') {
          parsedParams.push(false);
        } else {
          if (onError) {
            onError(`Invalid boolean for parameter ${param.name}: ${value}`);
          }
          return null;
        }
      } else if (param.type === 'point') {
        // Try to parse as a point (x,y)
        try {
          const pointParts = value.split(',');
          if (pointParts.length !== 2) {
            if (onError) {
              onError(`Invalid point format for parameter ${param.name}: ${value}. Use x,y`);
            }
            return null;
          }
          
          const x = parseFloat(pointParts[0]);
          const y = parseFloat(pointParts[1]);
          
          if (isNaN(x) || isNaN(y)) {
            if (onError) {
              onError(`Invalid point values for parameter ${param.name}: ${value}`);
            }
            return null;
          }
          
          parsedParams.push({ x, y });
        } catch (e) {
          if (onError) {
            onError(`Invalid point format for parameter ${param.name}: ${value}`);
          }
          return null;
        }
      } else {
        // For strings, just use the value directly
        parsedParams.push(value);
      }
    }
    
    return parsedParams;
  };

  // Handle when a command is selected
  const handleCommandSelected = (command: Command) => {
    setActiveCommand(command);
    
    if (command.parameters && command.parameters.length > 0) {
      setCurrentParameter(0);
      setParameterValues(new Array(command.parameters.length).fill(null));
      setInputValue('');
    } else {
      // No parameters, execute immediately
      executeCommand(command, []);
      setInputValue('');
    }
  };

  // Execute a command with the given parameters
  const executeCommand = (command: Command, params: any[]) => {
    try {
      command.action(params);
      
      if (onExecute) {
        onExecute(command.name, params);
      }
    } catch (error) {
      if (onError) {
        onError(`Error executing command ${command.name}: ${error}`);
      }
    }
  };

  // Add a command to the history
  const addToHistory = (command: string) => {
    // Don't add duplicate consecutive commands
    if (commandHistory.length > 0 && commandHistory[0] === command) {
      return;
    }
    
    setCommandHistory(prev => {
      const newHistory = [command, ...prev.slice(0, historySize - 1)];
      return newHistory;
    });
    
    setHistoryIndex(-1);
  };

  // Get placeholder text based on current state
  const getPlaceholder = (): string => {
    if (activeCommand && currentParameter >= 0 && activeCommand.parameters) {
      const param = activeCommand.parameters[currentParameter];
      return `${param.name} (${param.type}): ${param.description}`;
    }
    
    return placeholder;
  };

  // Focus the input when the component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);
  
  // Update suggestions when commands change
  useEffect(() => {
    if (inputValue && !activeCommand) {
      const parts = inputValue.trim().split(' ');
      if (parts.length === 1) {
        const newSuggestions = generateSuggestions(parts[0]);
        setSuggestions(newSuggestions);
        setShowSuggestions(newSuggestions.length > 0);
        setSelectedSuggestion(0);
      }
    }
  }, [commands, inputValue, activeCommand, generateSuggestions]);

  return (
    <div 
      className={`command-line-container ${className}`}
      style={{ 
        position: 'relative',
        ...style 
      }}
    >
      {/* Status indicator showing active command and parameter */}
      {activeCommand && (
        <div 
          className="command-status"
          style={{
            fontSize: '12px',
            color: '#666',
            marginBottom: '4px',
          }}
        >
          <span style={{ fontWeight: 'bold' }}>{activeCommand.name}</span>
          {activeCommand.parameters && currentParameter >= 0 && (
            <>
              {': '}
              {activeCommand.parameters.map((param, idx) => (
                <span 
                  key={idx} 
                  style={{ 
                    marginRight: '4px', 
                    fontWeight: idx === currentParameter ? 'bold' : 'normal',
                    color: idx === currentParameter ? '#1890ff' : '#666',
                  }}
                >
                  {param.name}
                  {idx < activeCommand.parameters!.length - 1 && ', '}
                </span>
              ))}
            </>
          )}
        </div>
      )}

      {/* Command input */}
      <div 
        className="command-input-wrapper"
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <span 
          style={{ 
            paddingLeft: '8px',
            paddingRight: '4px',
            color: '#666',
          }}
        >
          &gt;
        </span>
        <input
          ref={inputRef}
          type="text"
          className="command-input"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={getPlaceholder()}
          style={{
            flex: 1,
            padding: '8px 8px 8px 0',
            border: 'none',
            borderBottom: '1px solid #ddd',
            outline: 'none',
            fontSize: '14px',
            backgroundColor: 'transparent',
          }}
        />
      </div>

      {/* Autocomplete suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div 
          className="command-suggestions"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            width: '100%',
            maxHeight: '200px',
            overflowY: 'auto',
            backgroundColor: '#fff',
            border: '1px solid #ddd',
            borderTop: 'none',
            zIndex: 10,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          }}
        >
          {suggestions.map((suggestion, idx) => {
            const cmd = findCommand(suggestion);
            
            return (
              <div
                key={suggestion}
                className={`suggestion-item ${idx === selectedSuggestion ? 'selected' : ''}`}
                onClick={() => {
                  setInputValue(suggestion);
                  setShowSuggestions(false);
                  const command = findCommand(suggestion);
                  if (command) {
                    handleCommandSelected(command);
                  }
                }}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  backgroundColor: idx === selectedSuggestion ? '#e6f7ff' : 'transparent',
                  borderLeft: idx === selectedSuggestion ? '2px solid #1890ff' : '2px solid transparent',
                }}
              >
                <div style={{ fontWeight: 'bold' }}>{suggestion}</div>
                {cmd && (
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {cmd.description}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CommandLine; 