import { useTechnicalDrawingStore } from '../../../../store/technicalDrawingStore';


type CommandCallback = () => void;
type CommandShortcut = {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
};

interface Command {
  id: string;
  name: string;
  shortcut?: CommandShortcut;
  callback: CommandCallback;
  isEnabled?: () => boolean;
  category: 'file' | 'edit' | 'view' | 'draw' | 'modify' | 'dimension' | 'tools';
}

/**
 * Class representing a keyboard command system
 */
export class CommandSystem {
  private commands: Map<string, Command> = new Map();
  private history: string[] = [];
  private commandLine: string = '';
  private commandAliases: Map<string, string> = new Map();

  /**
   * Constructor
   */
  constructor() {
    this.initializeDefaultCommands();
    this.initializeDefaultAliases();
  }

  /**
   * Initialize default command aliases
   */
  private initializeDefaultAliases(): void {
    // Drawing tools
    this.commandAliases.set('l', 'line');
    this.commandAliases.set('c', 'circle');
    this.commandAliases.set('a', 'arc');
    this.commandAliases.set('r', 'rect');
    this.commandAliases.set('p', 'polyline');
    this.commandAliases.set('t', 'text');
    
    // Modification commands
    this.commandAliases.set('m', 'move');
    this.commandAliases.set('ro', 'rotate');
    this.commandAliases.set('co', 'copy');
    this.commandAliases.set('tr', 'trim');
    this.commandAliases.set('ex', 'extend');
    this.commandAliases.set('o', 'offset');
    this.commandAliases.set('f', 'fillet');
    this.commandAliases.set('ch', 'chamfer');
    
    // Dimension commands
    this.commandAliases.set('dl', 'dimlinear');
    this.commandAliases.set('da', 'dimangular');
    this.commandAliases.set('dr', 'dimradius');
    this.commandAliases.set('dd', 'dimdiameter');
    
    // View commands
    this.commandAliases.set('z', 'zoom');
    this.commandAliases.set('za', 'zoomall');
    this.commandAliases.set('ze', 'zoomextents');
    this.commandAliases.set('zw', 'zoomwindow');
    
    // Edit commands
    this.commandAliases.set('u', 'undo');
    this.commandAliases.set('re', 'redo');
  }

  /**
   * Initialize default commands
   */
  private initializeDefaultCommands(): void {
    // File commands
    this.registerCommand({
      id: 'new',
      name: 'New Drawing',
      shortcut: { key: 'n', ctrlKey: true },
      callback: () => {
        // Implementation will depend on the store
        console.log('New drawing command');
      },
      category: 'file'
    });

    this.registerCommand({
      id: 'save',
      name: 'Save Drawing',
      shortcut: { key: 's', ctrlKey: true },
      callback: () => {
        console.log('Save drawing command');
      },
      category: 'file'
    });

    this.registerCommand({
      id: 'export',
      name: 'Export Drawing',
      shortcut: { key: 'e', ctrlKey: true, shiftKey: true },
      callback: () => {
        console.log('Export drawing command');
      },
      category: 'file'
    });

    // Edit commands
    this.registerCommand({
      id: 'undo',
      name: 'Undo',
      shortcut: { key: 'z', ctrlKey: true },
      callback: () => {
        const { undoCommand } = useTechnicalDrawingStore.getState();
        if (undoCommand) undoCommand();
      },
      category: 'edit'
    });

    this.registerCommand({
      id: 'redo',
      name: 'Redo',
      shortcut: { key: 'y', ctrlKey: true },
      callback: () => {
        const { redoCommand } = useTechnicalDrawingStore.getState();
        if (redoCommand) redoCommand();
      },
      category: 'edit'
    });

    // View commands
    this.registerCommand({
      id: 'zoomextents',
      name: 'Zoom Extents',
      shortcut: { key: 'e', ctrlKey: false, altKey: true },
      callback: () => {
        const { zoomToFit } = useTechnicalDrawingStore.getState();
        if (zoomToFit) zoomToFit();
      },
      category: 'view'
    });

    this.registerCommand({
      id: 'zoomselection',
      name: 'Zoom to Selection',
      shortcut: { key: 's', ctrlKey: false, altKey: true },
      callback: () => {
        const { zoomToSelection } = useTechnicalDrawingStore.getState();
        if (zoomToSelection) zoomToSelection();
      },
      category: 'view'
    });

    this.registerCommand({
      id: 'togglegrid',
      name: 'Toggle Grid',
      shortcut: { key: 'g', ctrlKey: false, altKey: true },
      callback: () => {
        const { toggleGrid } = useTechnicalDrawingStore.getState();
        if (toggleGrid) toggleGrid();
      },
      category: 'view'
    });

    this.registerCommand({
      id: 'togglesnap',
      name: 'Toggle Snap',
      shortcut: { key: 'f9', ctrlKey: false },
      callback: () => {
        const { toggleSnapping } = useTechnicalDrawingStore.getState();
        if (toggleSnapping) toggleSnapping();
      },
      category: 'tools'
    });

    this.registerCommand({
      id: 'toggleortho',
      name: 'Toggle Ortho Mode',
      shortcut: { key: 'f8', ctrlKey: false },
      callback: () => {
        const { toggleOrthoMode } = useTechnicalDrawingStore.getState();
        if (toggleOrthoMode) toggleOrthoMode();
      },
      category: 'tools'
    });

    // Drawing tool commands
    this.registerToolCommand('select');
    this.registerToolCommand('line');
    this.registerToolCommand('circle');
    this.registerToolCommand('arc');
    this.registerToolCommand('rectangle');
    this.registerToolCommand('polyline');
    this.registerToolCommand('text');
    this.registerToolCommand('dimension-linear');
    this.registerToolCommand('dimension-angular');
    this.registerToolCommand('dimension-radius');
    this.registerToolCommand('dimension-diameter');
  }

  /**
   * Register a tool command
   */
  private registerToolCommand(toolName: string): void {
    this.registerCommand({
      id: toolName,
      name: toolName.charAt(0).toUpperCase() + toolName.slice(1),
      callback: () => {
        const { setActiveTool } = useTechnicalDrawingStore.getState();
        if (setActiveTool) setActiveTool(toolName);
      },
      category: toolName.includes('dimension') ? 'dimension' : 'draw'
    });
  }

  /**
   * Register a command
   */
  registerCommand(command: Command): void {
    this.commands.set(command.id, command);
  }

  /**
   * Execute a command by ID
   */
  executeCommand(commandId: string): boolean {
    // Check for command alias
    if (this.commandAliases.has(commandId)) {
      commandId = this.commandAliases.get(commandId) || commandId;
    }

    const command = this.commands.get(commandId);
    if (command) {
      if (command.isEnabled === undefined || command.isEnabled()) {
        command.callback();
        this.history.push(commandId);
        return true;
      }
    }
    return false;
  }

  /**
   * Handle keyboard shortcut
   */
  handleKeyDown(e: KeyboardEvent): boolean {
    // Find matching command by shortcut
    for (const command of Array.from(this.commands.values())) {
      if (command.shortcut) {
        const { key, ctrlKey, shiftKey, altKey } = command.shortcut;
        const matchesKey = e.key.toLowerCase() === key.toLowerCase();
        const matchesCtrl = (ctrlKey === undefined) || (ctrlKey === e.ctrlKey || e.metaKey);
        const matchesShift = (shiftKey === undefined) || (shiftKey === e.shiftKey);
        const matchesAlt = (altKey === undefined) || (altKey === e.altKey);

        if (matchesKey && matchesCtrl && matchesShift && matchesAlt) {
          e.preventDefault();
          e.stopPropagation();
          return this.executeCommand(command.id);
        }
      }
    }
    return false;
  }

  /**
   * Process command line input
   */
  processCommandLine(input: string): boolean {
    this.commandLine = input.trim();
    const parts = this.commandLine.split(' ');
    const commandId = parts[0].toLowerCase();
    const args = parts.slice(1);

    // Store command history
    this.history.push(this.commandLine);

    // Process special commands
    if (commandId === 'help') {
      this.showHelp(args[0]);
      return true;
    }

    return this.executeCommand(commandId);
  }

  /**
   * Show help for commands
   */
  private showHelp(category?: string): void {
    console.log('Available commands:');
    
    for (const [id, command] of Array.from(this.commands.entries())) {
      if (!category || command.category === category) {
        let helpText = `${id}: ${command.name}`;
        if (command.shortcut) {
          const { key, ctrlKey, shiftKey, altKey } = command.shortcut;
          helpText += ' (';
          if (ctrlKey) helpText += 'Ctrl+';
          if (shiftKey) helpText += 'Shift+';
          if (altKey) helpText += 'Alt+';
          helpText += key.toUpperCase() + ')';
        }
        console.log(helpText);
      }
    }
  }

  /**
   * Get command history
   */
  getCommandHistory(): string[] {
    return [...this.history];
  }

  /**
   * Get all registered commands
   */
  getAllCommands(): Command[] {
    return Array.from(this.commands.values());
  }

  /**
   * Get commands by category
   */
  getCommandsByCategory(category: string): Command[] {
    return Array.from(this.commands.values())
      .filter(command => command.category === category);
  }

  /**
   * Register a custom command alias
   */
  registerAlias(alias: string, commandId: string): void {
    this.commandAliases.set(alias, commandId);
  }

  /**
   * Get all command aliases
   */
  getAliases(): Map<string, string> {
    return new Map(this.commandAliases);
  }
}

// Create singleton instance
export const commandSystem = new CommandSystem(); 