// src/components/cad/technical-drawing/core/shortcuts/KeyboardShortcutManager.ts

import { useTechnicalDrawingStore } from '../../technicalDrawingStore';

export interface ShortcutAction {
  id: string;
  name: string;
  description: string;
  category: 'tool' | 'edit' | 'view' | 'file' | 'utility';
  defaultKey: string;
  modifiers?: ('ctrl' | 'alt' | 'shift' | 'meta')[];
  action: (store: ReturnType<typeof useTechnicalDrawingStore>) => void;
  condition?: (store: ReturnType<typeof useTechnicalDrawingStore>) => boolean;
}

export interface ShortcutMapping {
  key: string;
  modifiers: string[];
  actionId: string;
}

export class KeyboardShortcutManager {
  private actions: Map<string, ShortcutAction> = new Map();
  private mappings: Map<string, ShortcutMapping> = new Map();
  private store: ReturnType<typeof useTechnicalDrawingStore>;
  private pressedKeys: Set<string> = new Set();
  private isActive: boolean = true;

  constructor(store: ReturnType<typeof useTechnicalDrawingStore>) {
    this.store = store;
    this.registerDefaultShortcuts();
    this.attachEventListeners();
  }

  /**
   * Register a new shortcut action
   */
  registerAction(action: ShortcutAction): void {
    this.actions.set(action.id, action);
    
    // Create default mapping
    const keyCombo = this.createKeyCombo(action.defaultKey, action.modifiers || []);
    this.mappings.set(keyCombo, {
      key: action.defaultKey,
      modifiers: action.modifiers || [],
      actionId: action.id
    });
  }

  /**
   * Update shortcut mapping for an action
   */
  updateMapping(actionId: string, key: string, modifiers: string[] = []): boolean {
    const action = this.actions.get(actionId);
    if (!action) return false;

    // Remove old mapping
    const oldKeyCombo = this.findKeyComboForAction(actionId);
    if (oldKeyCombo) {
      this.mappings.delete(oldKeyCombo);
    }

    // Add new mapping
    const newKeyCombo = this.createKeyCombo(key, modifiers);
    this.mappings.set(newKeyCombo, {
      key,
      modifiers,
      actionId
    });

    return true;
  }

  /**
   * Get all registered actions
   */
  getAllActions(): ShortcutAction[] {
    return Array.from(this.actions.values());
  }

  /**
   * Get actions by category
   */
  getActionsByCategory(category: string): ShortcutAction[] {
    return Array.from(this.actions.values()).filter(action => action.category === category);
  }

  /**
   * Get current mapping for an action
   */
  getMapping(actionId: string): ShortcutMapping | null {
    const keyCombo = this.findKeyComboForAction(actionId);
    return keyCombo ? this.mappings.get(keyCombo) || null : null;
  }

  /**
   * Check if a key combination is available
   */
  isKeyComboAvailable(key: string, modifiers: string[] = []): boolean {
    const keyCombo = this.createKeyCombo(key, modifiers);
    return !this.mappings.has(keyCombo);
  }

  /**
   * Enable or disable shortcut processing
   */
  setActive(active: boolean): void {
    this.isActive = active;
  }

  /**
   * Export shortcuts configuration
   */
  exportConfig(): Record<string, { key: string; modifiers: string[] }> {
    const config: Record<string, { key: string; modifiers: string[] }> = {};
    
    for (const [keyCombo, mapping] of this.mappings) {
      config[mapping.actionId] = {
        key: mapping.key,
        modifiers: mapping.modifiers
      };
    }
    
    return config;
  }

  /**
   * Import shortcuts configuration
   */
  importConfig(config: Record<string, { key: string; modifiers: string[] }>): void {
    // Clear current mappings
    this.mappings.clear();
    
    // Apply new mappings
    for (const [actionId, shortcut] of Object.entries(config)) {
      if (this.actions.has(actionId)) {
        this.updateMapping(actionId, shortcut.key, shortcut.modifiers);
      }
    }
  }

  /**
   * Reset to default shortcuts
   */
  resetToDefaults(): void {
    this.mappings.clear();
    
    for (const action of this.actions.values()) {
      const keyCombo = this.createKeyCombo(action.defaultKey, action.modifiers || []);
      this.mappings.set(keyCombo, {
        key: action.defaultKey,
        modifiers: action.modifiers || [],
        actionId: action.id
      });
    }
  }

  /**
   * Cleanup event listeners
   */
  destroy(): void {
    this.detachEventListeners();
  }

  /**
   * Register default shortcuts
   */
  private registerDefaultShortcuts(): void {
    // Tool shortcuts
    this.registerAction({
      id: 'tool_select',
      name: 'Select Tool',
      description: 'Activate selection tool',
      category: 'tool',
      defaultKey: 'Escape',
      action: (store) => store.setActiveTool('select')
    });

    this.registerAction({
      id: 'tool_line',
      name: 'Line Tool',
      description: 'Activate line drawing tool',
      category: 'tool',
      defaultKey: 'l',
      action: (store) => store.setActiveTool('line')
    });

    this.registerAction({
      id: 'tool_circle',
      name: 'Circle Tool',
      description: 'Activate circle drawing tool',
      category: 'tool',
      defaultKey: 'c',
      action: (store) => store.setActiveTool('circle')
    });

    this.registerAction({
      id: 'tool_rectangle',
      name: 'Rectangle Tool',
      description: 'Activate rectangle drawing tool',
      category: 'tool',
      defaultKey: 'r',
      action: (store) => store.setActiveTool('rectangle')
    });

    this.registerAction({
      id: 'tool_arc',
      name: 'Arc Tool',
      description: 'Activate arc drawing tool',
      category: 'tool',
      defaultKey: 'a',
      action: (store) => store.setActiveTool('arc')
    });

    this.registerAction({
      id: 'tool_polyline',
      name: 'Polyline Tool',
      description: 'Activate polyline drawing tool',
      category: 'tool',
      defaultKey: 'p',
      action: (store) => store.setActiveTool('polyline')
    });

    this.registerAction({
      id: 'tool_text',
      name: 'Text Tool',
      description: 'Activate text tool',
      category: 'tool',
      defaultKey: 't',
      action: (store) => store.setActiveTool('text')
    });

    this.registerAction({
      id: 'tool_dimension',
      name: 'Dimension Tool',
      description: 'Activate dimension tool',
      category: 'tool',
      defaultKey: 'd',
      action: (store) => store.setActiveTool('dimension')
    });

    // Edit shortcuts
    this.registerAction({
      id: 'edit_delete',
      name: 'Delete',
      description: 'Delete selected entities',
      category: 'edit',
      defaultKey: 'Delete',
      action: (store) => {
        store.selectedEntityIds.forEach(id => store.deleteEntity(id));
      },
      condition: (store) => store.selectedEntityIds.length > 0
    });

    this.registerAction({
      id: 'edit_copy',
      name: 'Copy',
      description: 'Copy selected entities',
      category: 'edit',
      defaultKey: 'c',
      modifiers: ['ctrl'],
      action: (store) => {
        // Store copied entities in clipboard
        const copiedData = store.selectedEntityIds.map(id => ({
          id,
          entity: store.entities[id] || store.dimensions[id] || store.annotations[id]
        }));
        
        // Store in localStorage or session storage
        if (copiedData.length > 0) {
          localStorage.setItem('cad_clipboard', JSON.stringify(copiedData));
        }
      },
      condition: (store) => store.selectedEntityIds.length > 0
    });

    this.registerAction({
      id: 'edit_paste',
      name: 'Paste',
      description: 'Paste copied entities',
      category: 'edit',
      defaultKey: 'v',
      modifiers: ['ctrl'],
      action: (store) => {
        const clipboardData = localStorage.getItem('cad_clipboard');
        if (clipboardData) {
          try {
            const copiedEntities = JSON.parse(clipboardData);
            copiedEntities.forEach((item: any) => {
              if (item.entity) {
                store.copyEntity(item.id, { x: 10, y: 10 });
              }
            });
          } catch (error) {
            console.error('Error pasting entities:', error);
          }
        }
      }
    });

    this.registerAction({
      id: 'edit_select_all',
      name: 'Select All',
      description: 'Select all visible entities',
      category: 'edit',
      defaultKey: 'a',
      modifiers: ['ctrl'],
      action: (store) => {
        store.clearSelection();
        const allIds = [
          ...Object.keys(store.entities),
          ...Object.keys(store.dimensions),
          ...Object.keys(store.annotations)
        ];
        allIds.forEach(id => store.selectEntity(id, true));
      }
    });

    this.registerAction({
      id: 'edit_deselect_all',
      name: 'Deselect All',
      description: 'Clear selection',
      category: 'edit',
      defaultKey: 'Escape',
      action: (store) => store.clearSelection()
    });

    // View shortcuts
    this.registerAction({
      id: 'view_zoom_in',
      name: 'Zoom In',
      description: 'Zoom in the view',
      category: 'view',
      defaultKey: '=',
      modifiers: ['ctrl'],
      action: (store) => store.setZoom(store.zoom * 1.2)
    });

    this.registerAction({
      id: 'view_zoom_out',
      name: 'Zoom Out',
      description: 'Zoom out the view',
      category: 'view',
      defaultKey: '-',
      modifiers: ['ctrl'],
      action: (store) => store.setZoom(store.zoom / 1.2)
    });

    this.registerAction({
      id: 'view_zoom_fit',
      name: 'Zoom to Fit',
      description: 'Fit all entities in view',
      category: 'view',
      defaultKey: 'f',
      action: (store) => store.zoomToFit()
    });

    this.registerAction({
      id: 'view_zoom_selection',
      name: 'Zoom to Selection',
      description: 'Zoom to selected entities',
      category: 'view',
      defaultKey: 's',
      modifiers: ['shift'],
      action: (store) => store.zoomToSelection(),
      condition: (store) => store.selectedEntityIds.length > 0
    });

    // Toggle shortcuts
    this.registerAction({
      id: 'toggle_grid',
      name: 'Toggle Grid',
      description: 'Show/hide grid',
      category: 'view',
      defaultKey: 'g',
      action: (store) => store.toggleGrid()
    });

    this.registerAction({
      id: 'toggle_snap',
      name: 'Toggle Snap',
      description: 'Enable/disable snapping',
      category: 'view',
      defaultKey: 'F9',
      action: (store) => store.toggleSnapping()
    });

    this.registerAction({
      id: 'toggle_ortho',
      name: 'Toggle Ortho',
      description: 'Enable/disable orthogonal mode',
      category: 'view',
      defaultKey: 'F8',
      action: (store) => store.toggleOrthoMode()
    });

    this.registerAction({
      id: 'toggle_polar',
      name: 'Toggle Polar Tracking',
      description: 'Enable/disable polar tracking',
      category: 'view',
      defaultKey: 'F10',
      action: (store) => store.togglePolarTracking()
    });

    // File shortcuts
    this.registerAction({
      id: 'file_save',
      name: 'Save',
      description: 'Save current drawing',
      category: 'file',
      defaultKey: 's',
      modifiers: ['ctrl'],
      action: (store) => {
        // Trigger save event
        const event = new CustomEvent('cad_save', { detail: { store } });
        window.dispatchEvent(event);
      }
    });

    this.registerAction({
      id: 'file_export',
      name: 'Export',
      description: 'Export drawing',
      category: 'file',
      defaultKey: 'e',
      modifiers: ['ctrl'],
      action: (store) => {
        // Trigger export event
        const event = new CustomEvent('cad_export', { detail: { store } });
        window.dispatchEvent(event);
      }
    });

    // Utility shortcuts
    this.registerAction({
      id: 'utility_command_line',
      name: 'Command Line',
      description: 'Focus command line',
      category: 'utility',
      defaultKey: ':',
      action: (store) => {
        // Focus command line input
        const commandInput = document.querySelector('input[placeholder*="command"]') as HTMLInputElement;
        if (commandInput) {
          commandInput.focus();
        }
      }
    });

    this.registerAction({
      id: 'utility_undo',
      name: 'Undo',
      description: 'Undo last action',
      category: 'utility',
      defaultKey: 'z',
      modifiers: ['ctrl'],
      action: (store) => store.undoCommand()
    });

    this.registerAction({
      id: 'utility_redo',
      name: 'Redo',
      description: 'Redo last undone action',
      category: 'utility',
      defaultKey: 'y',
      modifiers: ['ctrl'],
      action: (store) => store.redoCommand()
    });

    // Movement shortcuts
    this.registerAction({
      id: 'move_up',
      name: 'Move Up',
      description: 'Move selection up',
      category: 'edit',
      defaultKey: 'ArrowUp',
      action: (store) => {
        if (store.selectedEntityIds.length > 0) {
          store.moveEntities(store.selectedEntityIds, { x: 0, y: -1 });
        }
      },
      condition: (store) => store.selectedEntityIds.length > 0
    });

    this.registerAction({
      id: 'move_down',
      name: 'Move Down',
      description: 'Move selection down',
      category: 'edit',
      defaultKey: 'ArrowDown',
      action: (store) => {
        if (store.selectedEntityIds.length > 0) {
          store.moveEntities(store.selectedEntityIds, { x: 0, y: 1 });
        }
      },
      condition: (store) => store.selectedEntityIds.length > 0
    });

    this.registerAction({
      id: 'move_left',
      name: 'Move Left',
      description: 'Move selection left',
      category: 'edit',
      defaultKey: 'ArrowLeft',
      action: (store) => {
        if (store.selectedEntityIds.length > 0) {
          store.moveEntities(store.selectedEntityIds, { x: -1, y: 0 });
        }
      },
      condition: (store) => store.selectedEntityIds.length > 0
    });

    this.registerAction({
      id: 'move_right',
      name: 'Move Right',
      description: 'Move selection right',
      category: 'edit',
      defaultKey: 'ArrowRight',
      action: (store) => {
        if (store.selectedEntityIds.length > 0) {
          store.moveEntities(store.selectedEntityIds, { x: 1, y: 0 });
        }
      },
      condition: (store) => store.selectedEntityIds.length > 0
    });

    // Quick precision movement
    this.registerAction({
      id: 'move_up_precise',
      name: 'Move Up (Grid)',
      description: 'Move selection up by grid size',
      category: 'edit',
      defaultKey: 'ArrowUp',
      modifiers: ['shift'],
      action: (store) => {
        if (store.selectedEntityIds.length > 0) {
          store.moveEntities(store.selectedEntityIds, { x: 0, y: -store.gridSize });
        }
      },
      condition: (store) => store.selectedEntityIds.length > 0
    });

    this.registerAction({
      id: 'move_down_precise',
      name: 'Move Down (Grid)',
      description: 'Move selection down by grid size',
      category: 'edit',
      defaultKey: 'ArrowDown',
      modifiers: ['shift'],
      action: (store) => {
        if (store.selectedEntityIds.length > 0) {
          store.moveEntities(store.selectedEntityIds, { x: 0, y: store.gridSize });
        }
      },
      condition: (store) => store.selectedEntityIds.length > 0
    });

    this.registerAction({
      id: 'move_left_precise',
      name: 'Move Left (Grid)',
      description: 'Move selection left by grid size',
      category: 'edit',
      defaultKey: 'ArrowLeft',
      modifiers: ['shift'],
      action: (store) => {
        if (store.selectedEntityIds.length > 0) {
          store.moveEntities(store.selectedEntityIds, { x: -store.gridSize, y: 0 });
        }
      },
      condition: (store) => store.selectedEntityIds.length > 0
    });

    this.registerAction({
      id: 'move_right_precise',
      name: 'Move Right (Grid)',
      description: 'Move selection right by grid size',
      category: 'edit',
      defaultKey: 'ArrowRight',
      modifiers: ['shift'],
      action: (store) => {
        if (store.selectedEntityIds.length > 0) {
          store.moveEntities(store.selectedEntityIds, { x: store.gridSize, y: 0 });
        }
      },
      condition: (store) => store.selectedEntityIds.length > 0
    });
  }

  /**
   * Attach keyboard event listeners
   */
  private attachEventListeners(): void {
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('keyup', this.handleKeyUp.bind(this));
    
    // Prevent default browser shortcuts
    document.addEventListener('keydown', (e) => {
      if (this.isActive && this.shouldPreventDefault(e)) {
        e.preventDefault();
      }
    });
  }

  /**
   * Detach keyboard event listeners
   */
  private detachEventListeners(): void {
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
    document.removeEventListener('keyup', this.handleKeyUp.bind(this));
  }

  /**
   * Handle keydown events
   */
  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.isActive) return;
    
    // Ignore if typing in input fields
    if (this.isTypingInInput(event.target as Element)) return;
    
    this.pressedKeys.add(event.key);
    
    const modifiers = this.getActiveModifiers(event);
    const keyCombo = this.createKeyCombo(event.key, modifiers);
    
    const mapping = this.mappings.get(keyCombo);
    if (mapping) {
      const action = this.actions.get(mapping.actionId);
      if (action) {
        // Check condition if exists
        if (!action.condition || action.condition(this.store)) {
          event.preventDefault();
          action.action(this.store);
        }
      }
    }
  }

  /**
   * Handle keyup events
   */
  private handleKeyUp(event: KeyboardEvent): void {
    this.pressedKeys.delete(event.key);
  }

  /**
   * Check if currently typing in an input field
   */
  private isTypingInInput(target: Element): boolean {
    if (!target) return false;
    
    const tagName = target.tagName.toLowerCase();
    return tagName === 'input' || 
           tagName === 'textarea' || 
           target.getAttribute('contenteditable') === 'true';
  }

  /**
   * Get active modifier keys
   */
  private getActiveModifiers(event: KeyboardEvent): string[] {
    const modifiers: string[] = [];
    
    if (event.ctrlKey) modifiers.push('ctrl');
    if (event.altKey) modifiers.push('alt');
    if (event.shiftKey) modifiers.push('shift');
    if (event.metaKey) modifiers.push('meta');
    
    return modifiers;
  }

  /**
   * Create key combination string
   */
  private createKeyCombo(key: string, modifiers: string[]): string {
    const sortedModifiers = modifiers.sort();
    return [...sortedModifiers, key].join('+').toLowerCase();
  }

  /**
   * Find key combination for action
   */
  private findKeyComboForAction(actionId: string): string | null {
    for (const [keyCombo, mapping] of this.mappings) {
      if (mapping.actionId === actionId) {
        return keyCombo;
      }
    }
    return null;
  }

  /**
   * Check if default should be prevented for this event
   */
  private shouldPreventDefault(event: KeyboardEvent): boolean {
    // Prevent default for known shortcuts
    const modifiers = this.getActiveModifiers(event);
    const keyCombo = this.createKeyCombo(event.key, modifiers);
    
    return this.mappings.has(keyCombo);
  }
}

export default KeyboardShortcutManager;
