// src/components/cad/technical-drawing/core/CommandSystem.ts

import { useTechnicalDrawingStore } from '../../technicalDrawingStore';
import { Point } from '../../TechnicalDrawingTypes';
import { v4 as uuidv4 } from 'uuid';

// Interfacce per il sistema di comandi
export interface CommandParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'point' | 'entity' | 'layer' | 'color' | 'option';
  required: boolean;
  default?: any;
  description: string;
  options?: string[]; // Per parametri di tipo 'option'
}

export interface Command {
  name: string;
  aliases?: string[];
  description: string;
  usage: string;
  category: 'drawing' | 'edit' | 'view' | 'dimension' | 'settings' | 'utility';
  parameters: CommandParameter[];
  execute: (params: any[], state: CommandState) => Promise<CommandResult>;
}

export interface CommandState {
  store: ReturnType<typeof useTechnicalDrawingStore>;
  history: CommandHistoryItem[];
  currentPosition: Point;
  selectedEntityIds: string[];
  mode: 'default' | 'waitPoint' | 'waitEntity' | 'waitInput';
  waitingCommand?: {
    name: string;
    params: any[];
    resolveCallback: (value: any) => void;
  };
}

export interface CommandHistoryItem {
  command: string;
  params: any[];
  timestamp: number;
}

export interface CommandResult {
  success: boolean;
  message: string;
  data?: any;
  needsInput?: boolean;
  inputType?: 'point' | 'entity' | 'text';
  inputPrompt?: string;
}

// Sistema di comandi principale
export class CommandSystem {
  private commands: Record<string, Command> = {};
  private aliases: Record<string, string> = {};
  private state: CommandState;
  
  constructor(store: ReturnType<typeof useTechnicalDrawingStore>) {
    this.state = {
      store,
      history: [],
      currentPosition: { x: 0, y: 0 },
      selectedEntityIds: [],
      mode: 'default'
    };
    
    // Inizializza i comandi di base
    this.registerInternalCommands();
  }
  
  // Registra un nuovo comando
  registerCommand(command: Command): void {
    const commandName = command.name.toLowerCase();
    
    // Verifica che il comando non esista già
    if (this.commands[commandName]) {
      console.warn(`Command '${commandName}' is already registered. Overriding.`);
    }
    
    // Registra il comando
    this.commands[commandName] = command;
    
    // Registra anche gli alias
    if (command.aliases && command.aliases.length > 0) {
      command.aliases.forEach(alias => {
        const aliasLower = alias.toLowerCase();
        
        if (this.commands[aliasLower] || this.aliases[aliasLower]) {
          console.warn(`Alias '${aliasLower}' is already registered. Skipping.`);
          return;
        }
        
        this.aliases[aliasLower] = commandName;
      });
    }
  }
  
  // Ottieni un comando dal nome o alias
  getCommand(name: string): Command | null {
    const commandName = name.toLowerCase();
    
    // Cerca direttamente nel registro dei comandi
    if (this.commands[commandName]) {
      return this.commands[commandName];
    }
    
    // Cerca negli alias
    if (this.aliases[commandName]) {
      return this.commands[this.aliases[commandName]];
    }
    
    // Comando non trovato
    return null;
  }
  
  // Esegui un comando
  async executeCommand(commandLine: string): Promise<CommandResult> {
    // Split della riga di comando in nome e parametri
    const parts = this.parseCommandLine(commandLine);
    
    if (parts.length === 0) {
      return {
        success: false,
        message: 'Nessun comando specificato.'
      };
    }
    
    const commandName = parts[0];
    const params = parts.slice(1);
    
    // Cerca il comando
    const command = this.getCommand(commandName);
    
    if (!command) {
      return {
        success: false,
        message: `Comando '${commandName}' non trovato.`
      };
    }
    
    // Aggiorna lo stato dei comandi
    this.state.history.push({
      command: commandName,
      params,
      timestamp: Date.now()
    });
    
    try {
      // Esegui il comando
      const result = await command.execute(params, this.state);
      
      // Registra nel comando store se il comando è stato eseguito con successo
      if (result.success) {
        this.state.store.addCommand({
          description: `${commandName} ${params.join(' ')}`,
          undo: () => {
            // L'implementazione del rollback è specifica del comando
            console.log(`Undo ${commandName}`);
          },
          redo: () => {
            // Riesecuzione del comando
            console.log(`Redo ${commandName}`);
          }
        });
      }
      
      return result;
    } catch (error) {
      console.error(`Error executing command '${commandName}':`, error);
      
      return {
        success: false,
        message: `Errore nell'esecuzione del comando: ${(error as Error).message}`
      };
    }
  }
  
  // Aggiorna lo stato del sistema di comandi
  updateState(updates: Partial<CommandState>): void {
    this.state = { ...this.state, ...updates };
  }
  
  // Imposta la posizione corrente
  setCurrentPosition(position: Point): void {
    this.state.currentPosition = position;
  }
  
  // Imposta le entità selezionate
  setSelectedEntityIds(entityIds: string[]): void {
    this.state.selectedEntityIds = entityIds;
  }
  
  // Ottieni un elenco di tutti i comandi registrati
  getAllCommands(): Command[] {
    return Object.values(this.commands);
  }
  
  // Ottieni i comandi per categoria
  getCommandsByCategory(category: string): Command[] {
    return Object.values(this.commands).filter(cmd => cmd.category === category);
  }
  
  // Ottieni suggerimenti di completamento automatico basati sull'input corrente
  getCompletionSuggestions(input: string): string[] {
    // Se non c'è input, restituisci tutti i comandi
    if (!input) {
      return Object.keys(this.commands).concat(Object.keys(this.aliases));
    }
    
    // Estrai il nome del comando e la parte corrente che stiamo cercando di completare
    const parts = this.parseCommandLine(input);
    const commandName = parts[0]?.toLowerCase();
    
    // Se stiamo ancora digitando il nome del comando, cerca tutti i comandi che iniziano con l'input
    if (parts.length <= 1) {
      const commandNames = Object.keys(this.commands);
      const aliasNames = Object.keys(this.aliases);
      
      return [...commandNames, ...aliasNames].filter(name => 
        name.toLowerCase().startsWith(commandName || '')
      );
    }
    
    // Se stiamo digitando i parametri, trova il comando e suggerisci parametri
    const command = this.getCommand(commandName);
    
    if (!command) return [];
    
    // Determina quale parametro stiamo attualmente completando
    const currentParamIndex = parts.length - 2; // -2 perché il primo elemento è il nome del comando
    
    if (currentParamIndex >= command.parameters.length) {
      // Non ci sono più parametri da suggerire
      return [];
    }
    
    const param = command.parameters[currentParamIndex];
    
    // Suggerimenti specifici in base al tipo di parametro
    if (param.type === 'option' && param.options) {
      const currentInput = parts[parts.length - 1].toLowerCase();
      return param.options.filter(option => 
        option.toLowerCase().startsWith(currentInput)
      );
    } else if (param.type === 'layer') {
      // Suggerisci nomi dei livelli disponibili
      const layers = this.state.store.drawingLayers;
      const currentInput = parts[parts.length - 1].toLowerCase();
      
      return layers.map(layer => layer.name).filter(name => 
        name.toLowerCase().startsWith(currentInput)
      );
    }
    
    // Per altri tipi di parametri, mostra il tipo e se è obbligatorio
    return [`<${param.name}: ${param.type}>${param.required ? '*' : ''}`];
  }
  
  // Parse riga di comando, gestendo correttamente le virgolette
  private parseCommandLine(commandLine: string): string[] {
    const parts: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < commandLine.length; i++) {
      const char = commandLine[i];
      
      if (char === '"' || char === "'") {
        // Toggle stato virgolette
        inQuotes = !inQuotes;
      } else if (char === ' ' && !inQuotes) {
        // Spazio fuori dalle virgolette: fine parte corrente
        if (current) {
          parts.push(current);
          current = '';
        }
      } else {
        current += char;
      }
    }
    
    // Aggiungi l'ultima parte se presente
    if (current) {
      parts.push(current);
    }
    
    return parts;
  }
  
  // Registra i comandi interni di base
  private registerInternalCommands(): void {
    // Comando: line
    this.registerCommand({
      name: 'line',
      aliases: ['l'],
      description: 'Disegna una linea tra due punti',
      usage: 'line <startX,startY> <endX,endY>',
      category: 'drawing',
      parameters: [
        { 
          name: 'startPoint', 
          type: 'point', 
          required: true, 
          description: 'Punto iniziale della linea (x,y)' 
        },
        { 
          name: 'endPoint', 
          type: 'point', 
          required: true, 
          description: 'Punto finale della linea (x,y)' 
        }
      ],
      execute: async (params, state) => {
        // Estrai i parametri
        let startPoint: Point | undefined;
        let endPoint: Point | undefined;
        
        // Parsing dei parametri come punti
        if (params.length > 0) {
          const startPointStr = params[0];
          // Verifica se è in formato "x,y"
          const startMatch = startPointStr.match(/^(-?\d*\.?\d+),(-?\d*\.?\d+)$/);
          
          if (startMatch) {
            startPoint = {
              x: parseFloat(startMatch[1]),
              y: parseFloat(startMatch[2])
            };
          }
        }
        
        if (params.length > 1) {
          const endPointStr = params[1];
          // Verifica se è in formato "x,y"
          const endMatch = endPointStr.match(/^(-?\d*\.?\d+),(-?\d*\.?\d+)$/);
          
          if (endMatch) {
            endPoint = {
              x: parseFloat(endMatch[1]),
              y: parseFloat(endMatch[2])
            };
          }
        }
        
        // Se i punti non sono stati forniti, richiedi input interattivo
        if (!startPoint) {
          return {
            success: false,
            message: 'Specificare il punto iniziale (x,y)',
            needsInput: true,
            inputType: 'point',
            inputPrompt: 'Specificare il punto iniziale:'
          };
        }
        
        if (!endPoint) {
          return {
            success: false,
            message: 'Specificare il punto finale (x,y)',
            needsInput: true,
            inputType: 'point',
            inputPrompt: 'Specificare il punto finale:'
          };
        }
        
        // Crea la linea
        const id = state.store.addEntity({
          type: 'line',
          layer: state.store.activeLayer,
          startPoint,
          endPoint,
          style: {
            strokeColor: '#000000',
            strokeWidth: 1,
            strokeStyle: 'solid'
          }
        });
        
        return {
          success: true,
          message: `Linea creata con ID: ${id}`,
          data: id
        };
      }
    });
    
    // Comando: circle
    this.registerCommand({
      name: 'circle',
      aliases: ['c'],
      description: 'Disegna un cerchio',
      usage: 'circle <centerX,centerY> <radius>',
      category: 'drawing',
      parameters: [
        { 
          name: 'center', 
          type: 'point', 
          required: true, 
          description: 'Centro del cerchio (x,y)' 
        },
        { 
          name: 'radius', 
          type: 'number', 
          required: true, 
          description: 'Raggio del cerchio' 
        }
      ],
      execute: async (params, state) => {
        // Estrai i parametri
        let center: Point | undefined;
        let radius: number | undefined;
        
        // Parsing dei parametri
        if (params.length > 0) {
          const centerStr = params[0];
          // Verifica se è in formato "x,y"
          const centerMatch = centerStr.match(/^(-?\d*\.?\d+),(-?\d*\.?\d+)$/);
          
          if (centerMatch) {
            center = {
              x: parseFloat(centerMatch[1]),
              y: parseFloat(centerMatch[2])
            };
          }
        }
        
        if (params.length > 1) {
          const radiusStr = params[1];
          // Verifica se è un numero
          if (!isNaN(parseFloat(radiusStr))) {
            radius = parseFloat(radiusStr);
          }
        }
        
        // Se i parametri non sono stati forniti, richiedi input interattivo
        if (!center) {
          return {
            success: false,
            message: 'Specificare il centro del cerchio (x,y)',
            needsInput: true,
            inputType: 'point',
            inputPrompt: 'Specificare il centro del cerchio:'
          };
        }
        
        if (radius === undefined) {
          return {
            success: false,
            message: 'Specificare il raggio del cerchio',
            needsInput: true,
            inputType: 'text',
            inputPrompt: 'Specificare il raggio del cerchio:'
          };
        }
        
        // Crea il cerchio
        const id = state.store.addEntity({
          type: 'circle',
          layer: state.store.activeLayer,
          center,
          radius,
          style: {
            strokeColor: '#000000',
            strokeWidth: 1,
            strokeStyle: 'solid',
            fillColor: 'none'
          }
        });
        
        return {
          success: true,
          message: `Cerchio creato con ID: ${id}`,
          data: id
        };
      }
    });
    
    // Comando: rectangle
    this.registerCommand({
      name: 'rectangle',
      aliases: ['rect', 'r'],
      description: 'Disegna un rettangolo',
      usage: 'rectangle <x1,y1> <x2,y2>',
      category: 'drawing',
      parameters: [
        { 
          name: 'corner1', 
          type: 'point', 
          required: true, 
          description: 'Primo angolo del rettangolo (x,y)' 
        },
        { 
          name: 'corner2', 
          type: 'point', 
          required: true, 
          description: 'Angolo opposto del rettangolo (x,y)' 
        }
      ],
      execute: async (params, state) => {
        // Estrai i parametri
        let corner1: Point | undefined;
        let corner2: Point | undefined;
        
        // Parsing dei parametri
        if (params.length > 0) {
          const corner1Str = params[0];
          // Verifica se è in formato "x,y"
          const corner1Match = corner1Str.match(/^(-?\d*\.?\d+),(-?\d*\.?\d+)$/);
          
          if (corner1Match) {
            corner1 = {
              x: parseFloat(corner1Match[1]),
              y: parseFloat(corner1Match[2])
            };
          }
        }
        
        if (params.length > 1) {
          const corner2Str = params[1];
          // Verifica se è in formato "x,y"
          const corner2Match = corner2Str.match(/^(-?\d*\.?\d+),(-?\d*\.?\d+)$/);
          
          if (corner2Match) {
            corner2 = {
              x: parseFloat(corner2Match[1]),
              y: parseFloat(corner2Match[2])
            };
          }
        }
        
        // Se i parametri non sono stati forniti, richiedi input interattivo
        if (!corner1) {
          return {
            success: false,
            message: 'Specificare il primo angolo del rettangolo (x,y)',
            needsInput: true,
            inputType: 'point',
            inputPrompt: 'Specificare il primo angolo del rettangolo:'
          };
        }
        
        if (!corner2) {
          return {
            success: false,
            message: 'Specificare l\'angolo opposto del rettangolo (x,y)',
            needsInput: true,
            inputType: 'point',
            inputPrompt: 'Specificare l\'angolo opposto del rettangolo:'
          };
        }
        
        // Calcola posizione, larghezza e altezza
        const position = {
          x: Math.min(corner1.x, corner2.x),
          y: Math.min(corner1.y, corner2.y)
        };
        
        const width = Math.abs(corner2.x - corner1.x);
        const height = Math.abs(corner2.y - corner1.y);
        
        // Crea il rettangolo
        const id = state.store.addEntity({
          type: 'rectangle',
          layer: state.store.activeLayer,
          position,
          width,
          height,
          style: {
            strokeColor: '#000000',
            strokeWidth: 1,
            strokeStyle: 'solid',
            fillColor: 'none'
          }
        });
        
        return {
          success: true,
          message: `Rettangolo creato con ID: ${id}`,
          data: id
        };
      }
    });
    
    // Comando: select
    this.registerCommand({
      name: 'select',
      aliases: ['sel'],
      description: 'Seleziona entità',
      usage: 'select <entityId> [entityId2] [entityId3]...',
      category: 'edit',
      parameters: [
        { 
          name: 'entityIds', 
          type: 'entity', 
          required: false, 
          description: 'ID dell\'entità da selezionare (o lista di ID separati da spazi)' 
        }
      ],
      execute: async (params, state) => {
        // Se non ci sono parametri, richiedi input interattivo
        if (params.length === 0) {
          return {
            success: false,
            message: 'Specificare gli ID delle entità da selezionare',
            needsInput: true,
            inputType: 'entity',
            inputPrompt: 'Seleziona entità:'
          };
        }
        
        // Pulisci la selezione precedente
        state.store.clearSelection();
        
        // Seleziona le entità specificate
        const entityIds = params;
        let validCount = 0;
        
        entityIds.forEach(id => {
          // Verifica che l'entità esista
          const entity = state.store.entities[id] || 
                        state.store.dimensions[id] || 
                        state.store.annotations[id];
          
          if (entity) {
            state.store.selectEntity(id);
            validCount++;
          }
        });
        
        if (validCount === 0) {
          return {
            success: false,
            message: 'Nessuna entità valida selezionata.'
          };
        }
        
        return {
          success: true,
          message: `${validCount} entità selezionate.`,
          data: state.store.selectedEntityIds
        };
      }
    });
    
    // Comando: delete
    this.registerCommand({
      name: 'delete',
      aliases: ['del', 'erase'],
      description: 'Elimina le entità selezionate',
      usage: 'delete [entityId1] [entityId2]...',
      category: 'edit',
      parameters: [
        { 
          name: 'entityIds', 
          type: 'entity', 
          required: false, 
          description: 'ID delle entità da eliminare (o lista di ID separati da spazi)' 
        }
      ],
      execute: async (params, state) => {
        // Determina quali entità eliminare
        let entitiesToDelete: string[] = [];
        
        if (params.length > 0) {
          // Usa i parametri specificati
          entitiesToDelete = params;
        } else {
          // Usa la selezione corrente
          entitiesToDelete = state.selectedEntityIds;
        }
        
        if (entitiesToDelete.length === 0) {
          return {
            success: false,
            message: 'Nessuna entità specificata da eliminare. Selezionare le entità prima o specificarle come parametri.'
          };
        }
        
        // Elimina le entità
        let deletedCount = 0;
        
        entitiesToDelete.forEach(id => {
          // Verifica che l'entità esista
          const entity = state.store.entities[id] || 
                        state.store.dimensions[id] || 
                        state.store.annotations[id];
          
          if (entity) {
            // Verifica se l'entità è bloccata
            if (entity.locked) {
              console.warn(`L'entità ${id} è bloccata e non può essere eliminata.`);
              return;
            }
            
            state.store.deleteEntity(id);
            deletedCount++;
          }
        });
        
        return {
          success: true,
          message: `${deletedCount} entità eliminate.`
        };
      }
    });
    
    // Comando: move
    this.registerCommand({
      name: 'move',
      aliases: ['m'],
      description: 'Sposta le entità selezionate',
      usage: 'move <dx,dy>',
      category: 'edit',
      parameters: [
        { 
          name: 'offset', 
          type: 'point', 
          required: true, 
          description: 'Spostamento X,Y da applicare' 
        }
      ],
      execute: async (params, state) => {
        // Estrai i parametri
        let offset: Point | undefined;
        
        // Parsing dei parametri
        if (params.length > 0) {
          const offsetStr = params[0];
          // Verifica se è in formato "x,y"
          const offsetMatch = offsetStr.match(/^(-?\d*\.?\d+),(-?\d*\.?\d+)$/);
          
          if (offsetMatch) {
            offset = {
              x: parseFloat(offsetMatch[1]),
              y: parseFloat(offsetMatch[2])
            };
          }
        }
        
        // Se lo spostamento non è stato fornito, richiedi input interattivo
        if (!offset) {
          return {
            success: false,
            message: 'Specificare lo spostamento (dx,dy)',
            needsInput: true,
            inputType: 'point',
            inputPrompt: 'Specificare lo spostamento (dx,dy):'
          };
        }
        
        // Determina quali entità spostare
        const entitiesToMove = state.selectedEntityIds;
        
        if (entitiesToMove.length === 0) {
          return {
            success: false,
            message: 'Nessuna entità selezionata da spostare. Selezionare le entità prima.'
          };
        }
        
        // Sposta le entità
        state.store.moveEntities(entitiesToMove, offset);
        
        return {
          success: true,
          message: `${entitiesToMove.length} entità spostate.`
        };
      }
    });
    
    // Altri comandi...
    // Comando: grid
    this.registerCommand({
      name: 'grid',
      aliases: ['g'],
      description: 'Configura la griglia',
      usage: 'grid [on|off] [size]',
      category: 'settings',
      parameters: [
        { 
          name: 'state', 
          type: 'option', 
          required: false, 
          description: 'Stato della griglia (on/off)', 
          options: ['on', 'off']
        },
        { 
          name: 'size', 
          type: 'number', 
          required: false, 
          description: 'Dimensione della griglia' 
        }
      ],
      execute: async (params, state) => {
        // Gestisci lo stato della griglia (on/off)
        if (params.length > 0) {
          const gridState = params[0].toLowerCase();
          
          if (gridState === 'on') {
            state.store.toggleGrid(true);
          } else if (gridState === 'off') {
            state.store.toggleGrid(false);
          }
        }
        
        // Gestisci la dimensione della griglia
        if (params.length > 1) {
          const sizeStr = params[1];
          
          if (!isNaN(parseFloat(sizeStr))) {
            const size = parseFloat(sizeStr);
            if (size > 0) {
              state.store.setGridSize(size);
            }
          }
        }
        
        // Restituisci lo stato corrente
        const currentGridEnabled = state.store.gridEnabled;
        const currentGridSize = state.store.gridSize;
        
        return {
          success: true,
          message: `Griglia: ${currentGridEnabled ? 'On' : 'Off'}, Dimensione: ${currentGridSize}`,
          data: {
            enabled: currentGridEnabled,
            size: currentGridSize
          }
        };
      }
    });
    
    // Comando: snap
    this.registerCommand({
      name: 'snap',
      aliases: ['s'],
      description: 'Configura lo snap',
      usage: 'snap [on|off] [type]',
      category: 'settings',
      parameters: [
        { 
          name: 'state', 
          type: 'option', 
          required: false, 
          description: 'Stato dello snap (on/off)', 
          options: ['on', 'off']
        },
        { 
          name: 'type', 
          type: 'option', 
          required: false, 
          description: 'Tipo di snap da configurare', 
          options: ['endpoint', 'midpoint', 'center', 'intersection', 'grid', 'all']
        },
        { 
          name: 'typeState', 
          type: 'option', 
          required: false, 
          description: 'Stato del tipo di snap specificato (on/off)', 
          options: ['on', 'off']
        }
      ],
      execute: async (params, state) => {
        // Gestisci lo stato generale dello snap (on/off)
        if (params.length > 0) {
          const snapState = params[0].toLowerCase();
          
          if (snapState === 'on') {
            state.store.toggleSnapping(true);
          } else if (snapState === 'off') {
            state.store.toggleSnapping(false);
          }
        }
        
        // Gestisci configurazione specifica
        if (params.length > 1) {
          const snapType = params[1].toLowerCase();
          const snapTypeState = params.length > 2 ? params[2].toLowerCase() : 'on';
          const isTypeEnabled = snapTypeState === 'on';
          
          if (snapType === 'all') {
            // Configura tutti i tipi di snap
            state.store.setObjectSnap({
              endpoint: isTypeEnabled,
              midpoint: isTypeEnabled,
              center: isTypeEnabled,
              intersection: isTypeEnabled,
              nearest: isTypeEnabled
            });
          } else {
            // Configura solo il tipo specificato
            const newSnapOptions: Record<string, boolean> = {};
            newSnapOptions[snapType] = isTypeEnabled;
            state.store.setObjectSnap(newSnapOptions);
          }
        }
        
        // Restituisci lo stato corrente
        const snapEnabled = state.store.snappingEnabled;
        const objectSnap = state.store.objectSnap;
        
        return {
          success: true,
          message: `Snap: ${snapEnabled ? 'On' : 'Off'}, Tipi attivi: ${
            Object.entries(objectSnap)
              .filter(([_, enabled]) => enabled)
              .map(([type, _]) => type)
              .join(', ')
          }`,
          data: {
            enabled: snapEnabled,
            types: objectSnap
          }
        };
      }
    });
    
    // Comando help
    this.registerCommand({
      name: 'help',
      aliases: ['?'],
      description: 'Mostra aiuto sui comandi',
      usage: 'help [command]',
      category: 'utility',
      parameters: [
        { 
          name: 'command', 
          type: 'string', 
          required: false, 
          description: 'Nome del comando per cui mostrare l\'aiuto' 
        }
      ],
      execute: async (params, state) => {
        // Se è fornito un comando specifico, mostra aiuto per quel comando
        if (params.length > 0) {
          const commandName = params[0].toLowerCase();
          const command = this.getCommand(commandName);
          
          if (!command) {
            return {
              success: false,
              message: `Comando '${commandName}' non trovato.`
            };
          }
          
          // Genera il messaggio di aiuto dettagliato
          let helpMessage = `Comando: ${command.name}\n`;
          helpMessage += `Descrizione: ${command.description}\n`;
          helpMessage += `Utilizzo: ${command.usage}\n`;
          
          if (command.aliases && command.aliases.length > 0) {
            helpMessage += `Alias: ${command.aliases.join(', ')}\n`;
          }
          
          if (command.parameters && command.parameters.length > 0) {
            helpMessage += '\nParametri:\n';
            command.parameters.forEach(param => {
              helpMessage += `  ${param.name}${param.required ? '*' : ''} (${param.type}): ${param.description}\n`;
            });
          }
          
          return {
            success: true,
            message: helpMessage
          };
        }
        
        // Altrimenti, mostra lista dei comandi per categoria
        const categories = [
          'drawing',
          'edit',
          'view',
          'dimension',
          'settings',
          'utility'
        ];
        
        let helpMessage = 'Comandi disponibili:\n';
        
        categories.forEach(category => {
          const categoryCommands = this.getCommandsByCategory(category);
          
          if (categoryCommands.length > 0) {
            helpMessage += `\n${category.charAt(0).toUpperCase() + category.slice(1)}:\n`;
            
            categoryCommands.forEach(cmd => {
              helpMessage += `  ${cmd.name}`;
              
              if (cmd.aliases && cmd.aliases.length > 0) {
                helpMessage += ` (${cmd.aliases.join(', ')})`;
              }
              
              helpMessage += `: ${cmd.description}\n`;
            });
          }
        });
        
        helpMessage += '\nDigita "help <comando>" per informazioni dettagliate su un comando specifico.';
        
        return {
          success: true,
          message: helpMessage
        };
      }
    });
  }
}

// Factory function per creare un'istanza del CommandSystem
export function createCommandSystem(store: ReturnType<typeof useTechnicalDrawingStore>): CommandSystem {
  return new CommandSystem(store);
}