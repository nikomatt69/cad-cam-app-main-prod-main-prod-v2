// src/components/cad/technical-drawing/ui/tools/BooleanOperationsTool.tsx

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTechnicalDrawingStore } from '../../technicalDrawingStore';
import { Point, AnyEntity } from '../../TechnicalDrawingTypes';
import { 
  Plus, 
  Minus, 
  Intersect, 
  Split,
  Merge,
  Zap
} from 'lucide-react';

interface BooleanOperationsToolProps {
  onComplete?: () => void;
}

type BooleanOperation = 'union' | 'intersection' | 'difference' | 'exclusion' | 'divide' | 'trim';

export const BooleanOperationsTool: React.FC<BooleanOperationsToolProps> = ({ onComplete }) => {
  const {
    selectedEntityIds,
    entities,
    addEntity,
    deleteEntity,
    clearSelection,
    activeLayer
  } = useTechnicalDrawingStore();

  const [operation, setOperation] = useState<BooleanOperation>('union');
  const [previewMode, setPreviewMode] = useState(false);

  const operations = [
    {
      id: 'union' as BooleanOperation,
      name: 'Unione',
      description: 'Combina le forme selezionate',
      icon: Plus,
      color: 'bg-blue-500',
      minEntities: 2
    },
    {
      id: 'intersection' as BooleanOperation,
      name: 'Intersezione',
      description: 'Mantiene solo l\'area comune',
      icon: Intersect,
      color: 'bg-green-500',
      minEntities: 2
    },
    {
      id: 'difference' as BooleanOperation,
      name: 'Sottrazione',
      description: 'Sottrae la seconda forma dalla prima',
      icon: Minus,
      color: 'bg-red-500',
      minEntities: 2
    },
    {
      id: 'exclusion' as BooleanOperation,
      name: 'Esclusione',
      description: 'Rimuove l\'area comune',
      icon: Split,
      color: 'bg-yellow-500',
      minEntities: 2
    },
    {
      id: 'divide' as BooleanOperation,
      name: 'Dividi',
      description: 'Divide le forme alle intersezioni',
      icon: Zap,
      color: 'bg-purple-500',
      minEntities: 2
    },
    {
      id: 'trim' as BooleanOperation,
      name: 'Taglia',
      description: 'Taglia parti delle forme',
      icon: Merge,
      color: 'bg-orange-500',
      minEntities: 2
    }
  ];

  const getSelectedEntities = (): AnyEntity[] => {
    return selectedEntityIds.map(id => entities[id]).filter(Boolean);
  };

  const canPerformOperation = (): boolean => {
    const selectedEntities = getSelectedEntities();
    const selectedOp = operations.find(op => op.id === operation);
    
    if (!selectedOp) return false;
    
    return selectedEntities.length >= selectedOp.minEntities &&
           selectedEntities.every(entity => 
             entity.type === 'circle' || 
             entity.type === 'rectangle' || 
             entity.type === 'polygon' ||
             entity.type === 'polyline'
           );
  };

  const performBooleanOperation = async () => {
    if (!canPerformOperation()) return;

    const selectedEntities = getSelectedEntities();
    
    try {
      const result = await executeBooleanOperation(operation, selectedEntities);
      
      if (result) {
        // Delete original entities
        selectedEntityIds.forEach(id => deleteEntity(id));
        
        // Add result entity/entities
        if (Array.isArray(result)) {
          result.forEach(entity => addEntity(entity));
        } else {
          addEntity(result);
        }
        
        clearSelection();
        onComplete?.();
      }
    } catch (error) {
      console.error('Boolean operation failed:', error);
      alert('Operazione booleana fallita. Verifica che le forme si intersechino correttamente.');
    }
  };

  const executeBooleanOperation = async (
    op: BooleanOperation, 
    entities: AnyEntity[]
  ): Promise<AnyEntity | AnyEntity[] | null> => {
    // This is a simplified implementation
    // In a real CAD system, you'd use a robust geometry library like JSClipper or Martinez
    
    if (entities.length < 2) return null;
    
    const [entityA, entityB] = entities;
    
    switch (op) {
      case 'union':
        return performUnion(entityA, entityB);
      case 'intersection':
        return performIntersection(entityA, entityB);
      case 'difference':
        return performDifference(entityA, entityB);
      case 'exclusion':
        return performExclusion(entityA, entityB);
      case 'divide':
        return performDivide(entityA, entityB);
      case 'trim':
        return performTrim(entityA, entityB);
      default:
        return null;
    }
  };

  // Simplified boolean operation implementations
  // Note: These are basic implementations for demonstration
  // Production code would use robust computational geometry libraries

  const performUnion = (entityA: AnyEntity, entityB: AnyEntity): AnyEntity | null => {
    // Simple union for rectangles
    if (entityA.type === 'rectangle' && entityB.type === 'rectangle') {
      const rectA = entityA as any;
      const rectB = entityB as any;
      
      const minX = Math.min(rectA.position.x, rectB.position.x);
      const minY = Math.min(rectA.position.y, rectB.position.y);
      const maxX = Math.max(
        rectA.position.x + rectA.width, 
        rectB.position.x + rectB.width
      );
      const maxY = Math.max(
        rectA.position.y + rectA.height, 
        rectB.position.y + rectB.height
      );
      
      return {
        type: 'rectangle',
        layer: activeLayer,
        visible: true,
        locked: false,
        style: entityA.style,
        position: { x: minX, y: minY },
        width: maxX - minX,
        height: maxY - minY
      };
    }
    
    // Simple union for circles
    if (entityA.type === 'circle' && entityB.type === 'circle') {
      const circleA = entityA as any;
      const circleB = entityB as any;
      
      // Calculate distance between centers
      const dx = circleB.center.x - circleA.center.x;
      const dy = circleB.center.y - circleA.center.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // If circles don't overlap, return both as a group
      if (distance > circleA.radius + circleB.radius) {
        return null; // Can't union non-overlapping circles simply
      }
      
      // Create a circle that encompasses both
      const newRadius = Math.max(
        circleA.radius + distance/2,
        circleB.radius + distance/2,
        distance/2 + Math.max(circleA.radius, circleB.radius)
      );
      
      const newCenter = {
        x: (circleA.center.x + circleB.center.x) / 2,
        y: (circleA.center.y + circleB.center.y) / 2
      };
      
      return {
        type: 'circle',
        layer: activeLayer,
        visible: true,
        locked: false,
        style: entityA.style,
        center: newCenter,
        radius: newRadius
      };
    }
    
    return null;
  };

  const performIntersection = (entityA: AnyEntity, entityB: AnyEntity): AnyEntity | null => {
    // Simple intersection for rectangles
    if (entityA.type === 'rectangle' && entityB.type === 'rectangle') {
      const rectA = entityA as any;
      const rectB = entityB as any;
      
      const minX = Math.max(rectA.position.x, rectB.position.x);
      const minY = Math.max(rectA.position.y, rectB.position.y);
      const maxX = Math.min(
        rectA.position.x + rectA.width, 
        rectB.position.x + rectB.width
      );
      const maxY = Math.min(
        rectA.position.y + rectA.height, 
        rectB.position.y + rectB.height
      );
      
      // Check if there's actually an intersection
      if (maxX <= minX || maxY <= minY) {
        return null; // No intersection
      }
      
      return {
        type: 'rectangle',
        layer: activeLayer,
        visible: true,
        locked: false,
        style: entityA.style,
        position: { x: minX, y: minY },
        width: maxX - minX,
        height: maxY - minY
      };
    }
    
    return null;
  };

  const performDifference = (entityA: AnyEntity, entityB: AnyEntity): AnyEntity | null => {
    // This is a complex operation that would typically result in multiple polygons
    // For simplicity, we'll just modify the first entity
    
    if (entityA.type === 'rectangle' && entityB.type === 'rectangle') {
      const rectA = entityA as any;
      const rectB = entityB as any;
      
      // Check if B is completely inside A
      const bMinX = rectB.position.x;
      const bMinY = rectB.position.y;
      const bMaxX = rectB.position.x + rectB.width;
      const bMaxY = rectB.position.y + rectB.height;
      
      const aMinX = rectA.position.x;
      const aMinY = rectA.position.y;
      const aMaxX = rectA.position.x + rectA.width;
      const aMaxY = rectA.position.y + rectA.height;
      
      // Simple case: if B doesn't intersect A, return A unchanged
      if (bMaxX <= aMinX || bMinX >= aMaxX || bMaxY <= aMinY || bMinY >= aMaxY) {
        return { ...entityA };
      }
      
      // For a complete implementation, this would create multiple polygons
      // Here we'll just return a modified rectangle
      return {
        type: 'rectangle',
        layer: activeLayer,
        visible: true,
        locked: false,
        style: entityA.style,
        position: rectA.position,
        width: Math.max(0, bMinX - aMinX),
        height: rectA.height
      };
    }
    
    return null;
  };

  const performExclusion = (entityA: AnyEntity, entityB: AnyEntity): AnyEntity[] | null => {
    // Exclusion = (A ∪ B) - (A ∩ B)
    const union = performUnion(entityA, entityB);
    const intersection = performIntersection(entityA, entityB);
    
    if (!union || !intersection) return null;
    
    // This is a simplified implementation
    // Real exclusion would subtract the intersection from the union
    return [{ ...entityA }, { ...entityB }];
  };

  const performDivide = (entityA: AnyEntity, entityB: AnyEntity): AnyEntity[] | null => {
    // Divide entities at intersection points
    // This is a complex operation that would create multiple entities
    return [{ ...entityA }, { ...entityB }];
  };

  const performTrim = (entityA: AnyEntity, entityB: AnyEntity): AnyEntity | null => {
    // Trim entityA using entityB as cutting edge
    return { ...entityA };
  };

  const getPreviewDescription = (): string => {
    const selectedEntities = getSelectedEntities();
    const selectedOp = operations.find(op => op.id === operation);
    
    if (!selectedOp || selectedEntities.length < selectedOp.minEntities) {
      return `Seleziona almeno ${selectedOp?.minEntities || 2} forme compatibili`;
    }
    
    return `${selectedOp.description} applicata a ${selectedEntities.length} forme`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="boolean-operations-tool p-4 bg-white border rounded-lg shadow-lg max-w-md"
    >
      <h3 className="text-lg font-semibold mb-4">Operazioni Booleane</h3>
      
      {/* Selected entities info */}
      <div className="mb-4 p-3 bg-blue-50 rounded">
        <h4 className="text-sm font-medium mb-1">Forme selezionate:</h4>
        <p className="text-sm text-blue-700">
          {selectedEntityIds.length} entità ({getSelectedEntities().map(e => e.type).join(', ')})
        </p>
      </div>

      {/* Operation selection */}
      <div className="mb-4">
        <h4 className="text-sm font-medium mb-2">Operazione:</h4>
        <div className="grid grid-cols-2 gap-2">
          {operations.map(op => (
            <motion.button
              key={op.id}
              className={`
                p-3 rounded-lg border-2 transition-all text-left
                ${operation === op.id 
                  ? `${op.color} text-white border-transparent` 
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }
              `}
              onClick={() => setOperation(op.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center space-x-2">
                <op.icon size={16} />
                <div>
                  <div className="text-sm font-medium">{op.name}</div>
                  <div className="text-xs opacity-80">{op.description}</div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Preview mode toggle */}
      <div className="mb-4">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={previewMode}
            onChange={(e) => setPreviewMode(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">Modalità anteprima</span>
        </label>
      </div>

      {/* Preview description */}
      <div className="mb-4 p-3 bg-gray-50 rounded">
        <p className="text-sm text-gray-600">{getPreviewDescription()}</p>
      </div>

      {/* Compatibility info */}
      <div className="mb-4 p-3 bg-yellow-50 rounded">
        <h4 className="text-sm font-medium text-yellow-800 mb-1">Forme supportate:</h4>
        <p className="text-xs text-yellow-700">
          Cerchi, rettangoli, poligoni e polilinee chiuse
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={performBooleanOperation}
          disabled={!canPerformOperation()}
          className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Applica Operazione
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => clearSelection()}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Reset
        </motion.button>
      </div>

      {/* Help section */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <h4 className="text-sm font-medium mb-2">Suggerimenti:</h4>
        <div className="text-xs text-gray-500 space-y-1">
          <div>• Seleziona 2 o più forme compatibili</div>
          <div>• Le forme devono sovrapporsi per la maggior parte delle operazioni</div>
          <div>• Usa l'anteprima per vedere il risultato prima di applicare</div>
          <div>• <kbd className="px-1 bg-gray-100 rounded">Ctrl+Z</kbd> per annullare</div>
        </div>
      </div>
    </motion.div>
  );
};

export default BooleanOperationsTool;
