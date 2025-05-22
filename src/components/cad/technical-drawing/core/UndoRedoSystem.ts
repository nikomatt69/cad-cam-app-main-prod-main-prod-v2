import { v4 as uuidv4 } from 'uuid';
import { DrawingEntity, Dimension, Annotation, Point } from '../TechnicalDrawingTypes';

// Tipi per il sistema di Undo/Redo
export interface DrawingAction {
  id: string;
  type: 'add' | 'delete' | 'modify' | 'move' | 'rotate' | 'scale' | 'group' | 'ungroup';
  timestamp: number;
  entityType: 'entity' | 'dimension' | 'annotation';
  data: {
    entityId?: string;
    entityIds?: string[];
    beforeState?: any;
    afterState?: any;
    groupId?: string;
    transform?: {
      translation?: Point;
      rotation?: number;
      scale?: { x: number; y: number };
      center?: Point;
    };
  };
}

export interface DrawingSnapshot {
  id: string;
  timestamp: number;
  entities: Record<string, DrawingEntity>;
  dimensions: Record<string, Dimension>;
  annotations: Record<string, Annotation>;
  description: string;
}

export class UndoRedoSystem {
  private actions: DrawingAction[] = [];
  private currentActionIndex: number = -1;
  private snapshots: DrawingSnapshot[] = [];
  private maxActions: number = 100;
  private maxSnapshots: number = 10;
  private snapshotInterval: number = 10; // Crea snapshot ogni 10 azioni

  constructor(maxActions = 100, maxSnapshots = 10) {
    this.maxActions = maxActions;
    this.maxSnapshots = maxSnapshots;
  }

  /**
   * Aggiunge una nuova azione al sistema
   */
  addAction(action: Omit<DrawingAction, 'id' | 'timestamp'>): void {
    const newAction: DrawingAction = {
      ...action,
      id: uuidv4(),
      timestamp: Date.now()
    };

    // Rimuovi tutte le azioni dopo l'indice corrente (se stiamo in mezzo alla cronologia)
    if (this.currentActionIndex < this.actions.length - 1) {
      this.actions = this.actions.slice(0, this.currentActionIndex + 1);
    }

    // Aggiungi la nuova azione
    this.actions.push(newAction);
    this.currentActionIndex++;

    // Mantieni il limite di azioni
    if (this.actions.length > this.maxActions) {
      this.actions.shift();
      this.currentActionIndex--;
    }

    // Crea snapshot periodicamente
    if (this.actions.length % this.snapshotInterval === 0) {
      this.createSnapshot();
    }
  }

  /**
   * Annulla l'ultima azione
   */
  undo(): DrawingAction | null {
    if (!this.canUndo()) return null;

    const action = this.actions[this.currentActionIndex];
    this.currentActionIndex--;
    
    return action;
  }

  /**
   * Ripristina l'azione successiva
   */
  redo(): DrawingAction | null {
    if (!this.canRedo()) return null;

    this.currentActionIndex++;
    const action = this.actions[this.currentActionIndex];
    
    return action;
  }

  /**
   * Verifica se è possibile fare undo
   */
  canUndo(): boolean {
    return this.currentActionIndex >= 0;
  }

  /**
   * Verifica se è possibile fare redo
   */
  canRedo(): boolean {
    return this.currentActionIndex < this.actions.length - 1;
  }

  /**
   * Ottiene l'azione corrente
   */
  getCurrentAction(): DrawingAction | null {
    if (this.currentActionIndex >= 0 && this.currentActionIndex < this.actions.length) {
      return this.actions[this.currentActionIndex];
    }
    return null;
  }

  /**
   * Ottiene la cronologia delle azioni
   */
  getActionHistory(): DrawingAction[] {
    return [...this.actions];
  }

  /**
   * Ottiene l'indice dell'azione corrente
   */
  getCurrentActionIndex(): number {
    return this.currentActionIndex;
  }

  /**
   * Crea uno snapshot dello stato corrente
   */
  createSnapshot(
    entities: Record<string, DrawingEntity> = {},
    dimensions: Record<string, Dimension> = {},
    annotations: Record<string, Annotation> = {},
    description: string = 'Auto snapshot'
  ): void {
    const snapshot: DrawingSnapshot = {
      id: uuidv4(),
      timestamp: Date.now(),
      entities: JSON.parse(JSON.stringify(entities)),
      dimensions: JSON.parse(JSON.stringify(dimensions)),
      annotations: JSON.parse(JSON.stringify(annotations)),
      description
    };

    this.snapshots.push(snapshot);

    // Mantieni il limite di snapshot
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }
  }

  /**
   * Ottiene tutti gli snapshot
   */
  getSnapshots(): DrawingSnapshot[] {
    return [...this.snapshots];
  }

  /**
   * Ripristina uno snapshot specifico
   */
  restoreSnapshot(snapshotId: string): DrawingSnapshot | null {
    const snapshot = this.snapshots.find(s => s.id === snapshotId);
    if (!snapshot) return null;

    return JSON.parse(JSON.stringify(snapshot));
  }

  /**
   * Pulisce la cronologia
   */
  clear(): void {
    this.actions = [];
    this.currentActionIndex = -1;
    this.snapshots = [];
  }

  /**
   * Ottiene statistiche del sistema
   */
  getStats(): {
    totalActions: number;
    currentIndex: number;
    canUndo: boolean;
    canRedo: boolean;
    snapshots: number;
    memoryUsage: number;
  } {
    return {
      totalActions: this.actions.length,
      currentIndex: this.currentActionIndex,
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      snapshots: this.snapshots.length,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  /**
   * Stima l'utilizzo di memoria
   */
  private estimateMemoryUsage(): number {
    const actionsSize = JSON.stringify(this.actions).length;
    const snapshotsSize = JSON.stringify(this.snapshots).length;
    return actionsSize + snapshotsSize;
  }

  /**
   * Compatta la cronologia rimuovendo azioni ridondanti
   */
  compact(): void {
    // Raggruppa azioni consecutive dello stesso tipo sulla stessa entità
    const compactedActions: DrawingAction[] = [];
    
    for (let i = 0; i < this.actions.length; i++) {
      const currentAction = this.actions[i];
      const nextAction = i < this.actions.length - 1 ? this.actions[i + 1] : null;
      
      // Se la prossima azione è dello stesso tipo sulla stessa entità, raggruppa
      if (nextAction && 
          currentAction.type === 'modify' && 
          nextAction.type === 'modify' &&
          currentAction.data.entityId === nextAction.data.entityId &&
          nextAction.timestamp - currentAction.timestamp < 1000) {
        // Salta l'azione corrente, la prossima sarà quella finale
        continue;
      }
      
      compactedActions.push(currentAction);
    }
    
    this.actions = compactedActions;
    
    // Aggiusta l'indice se necessario
    if (this.currentActionIndex >= this.actions.length) {
      this.currentActionIndex = this.actions.length - 1;
    }
  }

  /**
   * Esporta la cronologia in formato JSON
   */
  export(): string {
    return JSON.stringify({
      actions: this.actions,
      currentActionIndex: this.currentActionIndex,
      snapshots: this.snapshots,
      timestamp: Date.now()
    }, null, 2);
  }

  /**
   * Importa una cronologia da JSON
   */
  import(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.actions && Array.isArray(data.actions)) {
        this.actions = data.actions;
        this.currentActionIndex = data.currentActionIndex || -1;
        this.snapshots = data.snapshots || [];
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error importing undo/redo history:', error);
      return false;
    }
  }
}

// Factory per creare azioni specifiche
export class DrawingActionFactory {
  
  static createAddAction(
    entityType: 'entity' | 'dimension' | 'annotation',
    entityId: string,
    entityData: any
  ): Omit<DrawingAction, 'id' | 'timestamp'> {
    return {
      type: 'add',
      entityType,
      data: {
        entityId,
        afterState: entityData
      }
    };
  }

  static createDeleteAction(
    entityType: 'entity' | 'dimension' | 'annotation',
    entityId: string,
    entityData: any
  ): Omit<DrawingAction, 'id' | 'timestamp'> {
    return {
      type: 'delete',
      entityType,
      data: {
        entityId,
        beforeState: entityData
      }
    };
  }

  static createModifyAction(
    entityType: 'entity' | 'dimension' | 'annotation',
    entityId: string,
    beforeState: any,
    afterState: any
  ): Omit<DrawingAction, 'id' | 'timestamp'> {
    return {
      type: 'modify',
      entityType,
      data: {
        entityId,
        beforeState,
        afterState
      }
    };
  }

  static createMoveAction(
    entityIds: string[],
    translation: Point
  ): Omit<DrawingAction, 'id' | 'timestamp'> {
    return {
      type: 'move',
      entityType: 'entity',
      data: {
        entityIds,
        transform: {
          translation
        }
      }
    };
  }

  static createRotateAction(
    entityIds: string[],
    rotation: number,
    center: Point
  ): Omit<DrawingAction, 'id' | 'timestamp'> {
    return {
      type: 'rotate',
      entityType: 'entity',
      data: {
        entityIds,
        transform: {
          rotation,
          center
        }
      }
    };
  }

  static createScaleAction(
    entityIds: string[],
    scale: { x: number; y: number },
    center: Point
  ): Omit<DrawingAction, 'id' | 'timestamp'> {
    return {
      type: 'scale',
      entityType: 'entity',
      data: {
        entityIds,
        transform: {
          scale,
          center
        }
      }
    };
  }

  static createGroupAction(
    entityIds: string[],
    groupId: string
  ): Omit<DrawingAction, 'id' | 'timestamp'> {
    return {
      type: 'group',
      entityType: 'entity',
      data: {
        entityIds,
        groupId
      }
    };
  }

  static createUngroupAction(
    entityIds: string[],
    groupId: string
  ): Omit<DrawingAction, 'id' | 'timestamp'> {
    return {
      type: 'ungroup',
      entityType: 'entity',
      data: {
        entityIds,
        groupId
      }
    };
  }
}

export default UndoRedoSystem;