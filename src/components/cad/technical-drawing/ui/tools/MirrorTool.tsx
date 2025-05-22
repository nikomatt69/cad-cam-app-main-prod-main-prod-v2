// src/components/cad/technical-drawing/ui/tools/MirrorTool.tsx

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTechnicalDrawingStore } from '../../technicalDrawingStore';
import { Point } from '../../TechnicalDrawingTypes';

interface MirrorToolProps {
  onComplete?: () => void;
}

export const MirrorTool: React.FC<MirrorToolProps> = ({ onComplete }) => {
  const {
    selectedEntityIds,
    mirrorEntities,
    entities,
    dimensions,
    annotations
  } = useTechnicalDrawingStore();

  const [mirrorLine, setMirrorLine] = useState<[Point, Point] | null>(null);
  const [isDefiningLine, setIsDefiningLine] = useState(false);
  const [keepOriginal, setKeepOriginal] = useState(false);

  const handleCanvasClick = (point: Point) => {
    if (!isDefiningLine) {
      // Start defining mirror line
      setIsDefiningLine(true);
      setMirrorLine([point, point]);
    } else if (mirrorLine) {
      // Complete mirror line definition
      const newMirrorLine: [Point, Point] = [mirrorLine[0], point];
      setMirrorLine(newMirrorLine);
      executeMirror(newMirrorLine);
    }
  };

  const executeMirror = (line: [Point, Point]) => {
    if (selectedEntityIds.length === 0) {
      alert('Seleziona almeno un\'entità da specchiare');
      return;
    }

    // Create mirrored entities
    mirrorEntities(selectedEntityIds, line[0], line[1]);
    
    // If not keeping original, delete the original entities
    if (!keepOriginal) {
      selectedEntityIds.forEach(id => {
        // Delete original entities logic would go here
        // Note: We need to implement deleteEntity in the store
      });
    }

    // Reset tool
    reset();
    onComplete?.();
  };

  const reset = () => {
    setMirrorLine(null);
    setIsDefiningLine(false);
  };

  const getSelectedEntitiesInfo = () => {
    const count = selectedEntityIds.length;
    if (count === 0) return 'Nessuna entità selezionata';
    
    const types = selectedEntityIds.map(id => {
      const entity = entities[id] || dimensions[id] || annotations[id];
      return entity?.type || 'unknown';
    });
    
    const typeCounts = types.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(typeCounts)
      .map(([type, count]) => `${count} ${type}${count > 1 ? 's' : ''}`)
      .join(', ');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mirror-tool-panel p-4 bg-white border rounded-lg shadow-lg"
    >
      <h3 className="text-lg font-semibold mb-4">Strumento Specchia</h3>
      
      {/* Selected entities info */}
      <div className="mb-4 p-3 bg-blue-50 rounded">
        <h4 className="text-sm font-medium mb-1">Entità selezionate:</h4>
        <p className="text-sm text-blue-700">{getSelectedEntitiesInfo()}</p>
      </div>

      {/* Keep original option */}
      <div className="mb-4">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={keepOriginal}
            onChange={(e) => setKeepOriginal(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">Mantieni originale</span>
        </label>
      </div>

      {/* Instructions */}
      <div className="mb-4 p-3 bg-gray-50 rounded">
        {selectedEntityIds.length === 0 ? (
          <p className="text-sm text-gray-600">
            1. Seleziona le entità da specchiare
          </p>
        ) : !isDefiningLine ? (
          <p className="text-sm text-gray-600">
            2. Clicca per definire il primo punto della linea di specchiatura
          </p>
        ) : (
          <p className="text-sm text-gray-600">
            3. Clicca per definire il secondo punto della linea di specchiatura
          </p>
        )}
      </div>

      {/* Mirror line preview */}
      {mirrorLine && (
        <div className="mb-4 p-3 bg-green-50 rounded">
          <h4 className="text-sm font-medium mb-2">Linea di specchiatura:</h4>
          <div className="text-xs text-green-700">
            <div>Punto 1: ({mirrorLine[0].x.toFixed(1)}, {mirrorLine[0].y.toFixed(1)})</div>
            <div>Punto 2: ({mirrorLine[1].x.toFixed(1)}, {mirrorLine[1].y.toFixed(1)})</div>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        {selectedEntityIds.length > 0 && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={reset}
            className="flex-1 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Reset
          </motion.button>
        )}
      </div>

      {/* Shortcut hints */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <h4 className="text-sm font-medium mb-1">Scorciatoie:</h4>
        <div className="text-xs text-gray-500 space-y-1">
          <div><kbd className="px-1 bg-gray-100 rounded">Esc</kbd> - Annulla operazione</div>
          <div><kbd className="px-1 bg-gray-100 rounded">Ctrl+Z</kbd> - Annulla ultimo comando</div>
        </div>
      </div>
    </motion.div>
  );
};

export default MirrorTool;
