import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export interface CommandParam {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'point';
  description: string;
  required: boolean;
  default?: any;
}

export interface Command {
  name: string;
  aliases?: string[];
  description: string;
  parameters?: CommandParam[];
  action: (params: any[]) => void;
}

interface CommandLineProps {
  commands?: Command[];
  placeholder?: string;
  onExecute?: (command: string, params: any[]) => void;
  onError?: (error: string) => void;
}

const CommandLine: React.FC<CommandLineProps> = ({
  commands = [],
  placeholder = "Inserisci comando (es. line 0,0 100,100)",
  onExecute,
  onError
}) => {
  const [inputValue, setInputValue] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Funzione per ottenere suggerimenti basati sull'input corrente
  const getSuggestions = (input: string): string[] => {
    if (!input) return [];
    
    const parts = input.trim().split(' ');
    const commandName = parts[0].toLowerCase();
    
    // Se stiamo ancora digitando il comando, suggerisci comandi che iniziano con quello che è stato digitato
    if (parts.length === 1) {
      return commands
        .filter(cmd => 
          cmd.name.toLowerCase().startsWith(commandName) || 
          (cmd.aliases && cmd.aliases.some(alias => alias.toLowerCase().startsWith(commandName)))
        )
        .map(cmd => cmd.name);
    }
    
    // Altrimenti, se il comando è valido, suggerisci parametri
    const command = commands.find(cmd => 
      cmd.name.toLowerCase() === commandName ||
      (cmd.aliases && cmd.aliases.some(alias => alias.toLowerCase() === commandName))
    );
    
    if (command && command.parameters) {
      const paramIndex = parts.length - 2; // -2 perché il primo è il comando
      if (paramIndex < command.parameters.length) {
        const param = command.parameters[paramIndex];
        return [`<${param.name}: ${param.type}>${param.required ? '*' : ''}`];
      }
    }
    
    return [];
  };
  
  // Aggiorna i suggerimenti quando cambia l'input
  useEffect(() => {
    const newSuggestions = getSuggestions(inputValue);
    setSuggestions(newSuggestions);
    setSelectedSuggestion(0);
    setShowSuggestions(newSuggestions.length > 0);
  }, [inputValue]);
  
  // Parsing input e esecuzione comando
  const parseAndExecute = (input: string) => {
    if (!input.trim()) return;
    
    // Aggiungi alla cronologia
    setHistory(prev => [input, ...prev.slice(0, 19)]); // Mantieni gli ultimi 20 comandi
    setHistoryIndex(-1);
    
    const parts = input.trim().split(' ');
    const commandName = parts[0].toLowerCase();
    const params = parts.slice(1);
    
    // Trova il comando
    const command = commands.find(cmd => 
      cmd.name.toLowerCase() === commandName ||
      (cmd.aliases && cmd.aliases.some(alias => alias.toLowerCase() === commandName))
    );
    
    if (!command) {
      if (onError) onError(`Comando sconosciuto: ${commandName}`);
      return;
    }
    
    // Valida e converti i parametri
    const parsedParams: any[] = [];
    let hasError = false;
    
    if (command.parameters) {
      for (let i = 0; i < command.parameters.length; i++) {
        const param = command.parameters[i];
        const value = params[i];
        
        // Se il parametro è richiesto ma mancante
        if (param.required && (value === undefined || value === '')) {
          if (onError) onError(`Parametro richiesto mancante: ${param.name}`);
          hasError = true;
          break;
        }
        
        // Se il parametro è fornito, convertilo al tipo corretto
        if (value !== undefined && value !== '') {
          try {
            switch (param.type) {
              case 'number':
                parsedParams.push(parseFloat(value));
                break;
              case 'boolean':
                parsedParams.push(value.toLowerCase() === 'true');
                break;
              case 'point':
                // Formato punto: x,y
                const pointMatch = value.match(/^(-?\d*\.?\d+)[,\s]+(-?\d*\.?\d+)$/);
                if (pointMatch) {
                  parsedParams.push({
                    x: parseFloat(pointMatch[1]),
                    y: parseFloat(pointMatch[2])
                  });
                } else {
                  throw new Error(`Formato punto non valido: ${value}`);
                }
                break;
              default:
                parsedParams.push(value);
            }
          } catch (error) {
            if (onError) onError(`Errore nel parametro ${param.name}: ${(error as Error).message}`);
            hasError = true;
            break;
          }
        } else if (param.default !== undefined) {
          // Usa il valore predefinito
          parsedParams.push(param.default);
        } else {
          // Parametro opzionale mancante
          parsedParams.push(null);
        }
      }
    }
    
    if (hasError) return;
    
    // Esegui il comando
    try {
      command.action(parsedParams);
      if (onExecute) onExecute(command.name, parsedParams);
    } catch (error) {
      if (onError) onError(`Errore nell'esecuzione del comando: ${(error as Error).message}`);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    parseAndExecute(inputValue);
    setInputValue('');
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Naviga nella cronologia
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (showSuggestions) {
        setSelectedSuggestion(prev => Math.max(0, prev - 1));
      } else if (history.length > 0) {
        const newIndex = Math.min(historyIndex + 1, history.length - 1);
        setHistoryIndex(newIndex);
        setInputValue(history[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (showSuggestions) {
        setSelectedSuggestion(prev => Math.min(suggestions.length - 1, prev + 1));
      } else if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInputValue(history[newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInputValue('');
      }
    } else if (e.key === 'Tab' && showSuggestions) {
      e.preventDefault();
      
      // Applica il suggerimento selezionato
      const suggestion = suggestions[selectedSuggestion];
      
      // Se è un parametro (inizia con <), inserisci il valore di esempio
      if (suggestion.startsWith('<')) {
        const parts = inputValue.split(' ');
        
        // Estrai il tipo di parametro
        const typeMatch = suggestion.match(/<(.+):\s*(.+)>/);
        if (typeMatch) {
          const paramName = typeMatch[1];
          const paramType = typeMatch[2];
          
          // Inserisci un valore di esempio in base al tipo
          let exampleValue = '';
          switch (paramType) {
            case 'number':
              exampleValue = '0';
              break;
            case 'boolean':
              exampleValue = 'true';
              break;
            case 'point':
              exampleValue = '0,0';
              break;
            default:
              exampleValue = 'value';
          }
          
          const newInput = parts.slice(0, -1).concat(exampleValue).join(' ');
          setInputValue(newInput);
        }
      } else {
        // Altrimenti applica il comando
        setInputValue(suggestion + ' ');
      }
      
      // Chiudi i suggerimenti
      setShowSuggestions(false);
      
      // Focus sull'input
      inputRef.current?.focus();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };
  
  return (
    <motion.div
      style={{
        position: 'relative',
        padding: '10px',
        borderTop: '1px solid #e0e0e0',
        backgroundColor: '#f8f9fa'
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Etichetta */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        marginBottom: '5px'
      }}>
        <span style={{ 
          fontWeight: 'bold', 
          fontSize: '12px',
          color: '#666'
        }}>
          Command Line
        </span>
        {inputValue && (
          <span style={{
            marginLeft: '10px',
            fontSize: '12px',
            color: '#888'
          }}>
            Premi Tab per autocompletare, ↑↓ per navigare
          </span>
        )}
      </div>
      
      <form 
        onSubmit={handleSubmit}
        style={{ display: 'flex' }}
      >
        <motion.span
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '0 8px',
            backgroundColor: '#e6f7ff',
            color: '#1890ff',
            borderTopLeftRadius: '4px',
            borderBottomLeftRadius: '4px',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          &gt;
        </motion.span>
        
        <motion.input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          style={{
            flex: 1,
            border: '1px solid #d9d9d9',
            borderLeft: 'none',
            borderTopRightRadius: '4px',
            borderBottomRightRadius: '4px',
            padding: '8px',
            fontSize: '14px',
            outline: 'none'
          }}
          whileFocus={{ 
            boxShadow: '0 0 0 2px rgba(24, 144, 255, 0.2)',
            borderColor: '#40a9ff'
          }}
        />
        
        <motion.button
          type="submit"
          style={{
            background: '#1890ff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '8px 16px',
            marginLeft: '8px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
          whileHover={{ backgroundColor: '#40a9ff' }}
          whileTap={{ scale: 0.95 }}
        >
          Esegui
        </motion.button>
      </form>
      
      {/* Suggerimenti */}
      {showSuggestions && (
        <motion.div
          style={{
            position: 'absolute',
            top: '-5px',
            left: '20px',
            transform: 'translateY(-100%)',
            background: 'white',
            border: '1px solid #d9d9d9',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            zIndex: 1000,
            width: '300px',
            maxHeight: '300px',
            overflowY: 'auto'
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
        >
          <ul style={{ 
            listStyle: 'none', 
            padding: 0, 
            margin: 0 
          }}>
            {suggestions.map((suggestion, index) => (
              <li 
                key={index}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  backgroundColor: index === selectedSuggestion ? '#e6f7ff' : 'transparent',
                  borderBottom: '1px solid #f0f0f0'
                }}
                onClick={() => {
                  if (suggestion.startsWith('<')) {
                    // È un parametro, non fare nulla al click
                  } else {
                    setInputValue(suggestion + ' ');
                    setShowSuggestions(false);
                    inputRef.current?.focus();
                  }
                }}
              >
                {suggestion}
              </li>
            ))}
          </ul>
        </motion.div>
      )}
      
      {/* Help per comando corrente */}
      {inputValue && !showSuggestions && (() => {
        const parts = inputValue.trim().split(' ');
        const commandName = parts[0].toLowerCase();
        
        const command = commands.find(cmd => 
          cmd.name.toLowerCase() === commandName ||
          (cmd.aliases && cmd.aliases.some(alias => alias.toLowerCase() === commandName))
        );
        
        if (command) {
          return (
            <motion.div
              style={{
                marginTop: '8px',
                padding: '8px',
                backgroundColor: '#f0f7ff',
                borderRadius: '4px',
                fontSize: '12px',
                color: '#666'
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div style={{ fontWeight: 'bold' }}>
                {command.name}
                {command.aliases && command.aliases.length > 0 && 
                  ` (${command.aliases.join(', ')})`
                }
              </div>
              <div style={{ marginTop: '4px' }}>{command.description}</div>
              
              {command.parameters && command.parameters.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ fontWeight: 'bold' }}>Parametri:</div>
                  <ul style={{ marginTop: '4px', paddingLeft: '20px' }}>
                    {command.parameters.map((param, index) => (
                      <li key={index}>
                        <span style={{ fontWeight: 'bold' }}>{param.name}</span>
                        {param.required && <span style={{ color: 'red' }}>*</span>}
                        {param.type && <span> ({param.type})</span>}
                        {param.description && <span>: {param.description}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          );
        }
        
        return null;
      })()}
    </motion.div>
  );
};

export default CommandLine;