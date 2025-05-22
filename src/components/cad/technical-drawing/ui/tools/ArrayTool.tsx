// src/components/cad/technical-drawing/ui/tools/ArrayTool.tsx

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTechnicalDrawingStore } from '../../technicalDrawingStore';
import { Point } from '../../TechnicalDrawingTypes';

interface ArrayToolProps {
  onComplete?: () => void;
}

type ArrayType = 'rectangular' | 'polar' | 'path';

export const ArrayTool: React.FC<ArrayToolProps> = ({ onComplete }) => {
  const {
    selectedEntityIds,
    copyEntity,
    moveEntities,
    rotateEntities,
    entities,
    dimensions,
    annotations
  } = useTechnicalDrawingStore();

  const [arrayType, setArrayType] = useState<ArrayType>('rectangular');
  const [rectangularSettings, setRectangularSettings] = useState({
    rows: 3,
    columns: 3,
    rowSpacing: 50,
    columnSpacing: 50,
    rowAngle: 0,
    columnAngle: 90
  });

  const [polarSettings, setPolarSettings] = useState({
    totalItems: 6,
    angleToFill: 360,
    rotateItems: true,
    centerPoint: { x: 0, y: 0 },
    radius: 100
  });

  const executeArray = () => {
    if (selectedEntityIds.length === 0) {
      alert('Seleziona almeno un\'entità per creare l\'array');
      return;
    }

    switch (arrayType) {
      case 'rectangular':
        executeRectangularArray();
        break;
      case 'polar':
        executePolarArray();
        break;
      case 'path':
        executePathArray();
        break;
    }

    onComplete?.();
  };

  const executeRectangularArray = () => {
    const { rows, columns, rowSpacing, columnSpacing, rowAngle, columnAngle } = rectangularSettings;
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        if (row === 0 && col === 0) continue; // Skip original position
        
        // Calculate offset based on row and column
        const rowOffset = row * rowSpacing;
        const colOffset = col * columnSpacing;
        
        // Convert angles to radians
        const rowRadians = (rowAngle * Math.PI) / 180;
        const colRadians = (columnAngle * Math.PI) / 180;
        
        // Calculate final position
        const offsetX = colOffset * Math.cos(colRadians) + rowOffset * Math.cos(rowRadians);
        const offsetY = colOffset * Math.sin(colRadians) + rowOffset * Math.sin(rowRadians);
        
        // Copy and move entities
        selectedEntityIds.forEach(id => {
          copyEntity(id, { x: offsetX, y: offsetY });
        });
      }
    }
  };

  const executePolarArray = () => {
    const { totalItems, angleToFill, rotateItems, centerPoint, radius } = polarSettings;
    const angleStep = (angleToFill * Math.PI / 180) / (totalItems - 1);
    
    for (let i = 1; i < totalItems; i++) {
      const angle = angleStep * i;
      
      // Calculate position around center
      const offsetX = radius * Math.cos(angle);
      const offsetY = radius * Math.sin(angle);
      
      // Copy entities
      const newIds: string[] = [];
      selectedEntityIds.forEach(id => {
        const newId = copyEntity(id, { x: offsetX, y: offsetY });
        if (newId) newIds.push(newId);
      });
      
      // Rotate items if enabled
      if (rotateItems && newIds.length > 0) {
        rotateEntities(newIds, centerPoint, angle * 180 / Math.PI);
      }
    }
  };

  const executePathArray = () => {
    // Path array would need a path to be defined
    // This is a more complex implementation
    alert('Path array non ancora implementato');
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

  const getTotalItemsPreview = () => {
    if (arrayType === 'rectangular') {
      return rectangularSettings.rows * rectangularSettings.columns;
    } else if (arrayType === 'polar') {
      return polarSettings.totalItems;
    }
    return 0;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="array-tool-panel p-4 bg-white border rounded-lg shadow-lg max-w-sm"
    >
      <h3 className="text-lg font-semibold mb-4">Strumento Array</h3>
      
      {/* Selected entities info */}
      <div className="mb-4 p-3 bg-blue-50 rounded">
        <h4 className="text-sm font-medium mb-1">Entità selezionate:</h4>
        <p className="text-sm text-blue-700">{getSelectedEntitiesInfo()}</p>
        {selectedEntityIds.length > 0 && (
          <p className="text-xs text-blue-600 mt-1">
            Totale elementi: {getTotalItemsPreview()}
          </p>
        )}
      </div>

      {/* Array type selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Tipo di Array:</label>
        <select
          value={arrayType}
          onChange={(e) => setArrayType(e.target.value as ArrayType)}
          className="w-full p-2 border rounded"
        >
          <option value="rectangular">Rettangolare</option>
          <option value="polar">Polare</option>
          <option value="path">Lungo Percorso</option>
        </select>
      </div>

      {/* Rectangular array settings */}
      {arrayType === 'rectangular' && (
        <div className="mb-4 space-y-3">
          <h4 className="text-sm font-medium">Impostazioni Rettangolari:</h4>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-600">Righe:</label>
              <input
                type="number"
                min="1"
                max="20"
                value={rectangularSettings.rows}
                onChange={(e) => setRectangularSettings(prev => ({ 
                  ...prev, 
                  rows: parseInt(e.target.value) || 1 
                }))}
                className="w-full p-1 border rounded text-sm"
              />
            </div>
            
            <div>
              <label className="block text-xs text-gray-600">Colonne:</label>
              <input
                type="number"
                min="1"
                max="20"
                value={rectangularSettings.columns}
                onChange={(e) => setRectangularSettings(prev => ({ 
                  ...prev, 
                  columns: parseInt(e.target.value) || 1 
                }))}
                className="w-full p-1 border rounded text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-600">Spaziatura Righe:</label>
              <input
                type="number"
                value={rectangularSettings.rowSpacing}
                onChange={(e) => setRectangularSettings(prev => ({ 
                  ...prev, 
                  rowSpacing: parseFloat(e.target.value) || 0 
                }))}
                className="w-full p-1 border rounded text-sm"
              />
            </div>
            
            <div>
              <label className="block text-xs text-gray-600">Spaziatura Colonne:</label>
              <input
                type="number"
                value={rectangularSettings.columnSpacing}
                onChange={(e) => setRectangularSettings(prev => ({ 
                  ...prev, 
                  columnSpacing: parseFloat(e.target.value) || 0 
                }))}
                className="w-full p-1 border rounded text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-600">Angolo Righe (°):</label>
              <input
                type="number"
                min="-180"
                max="180"
                value={rectangularSettings.rowAngle}
                onChange={(e) => setRectangularSettings(prev => ({ 
                  ...prev, 
                  rowAngle: parseFloat(e.target.value) || 0 
                }))}
                className="w-full p-1 border rounded text-sm"
              />
            </div>
            
            <div>
              <label className="block text-xs text-gray-600">Angolo Colonne (°):</label>
              <input
                type="number"
                min="-180"
                max="180"
                value={rectangularSettings.columnAngle}
                onChange={(e) => setRectangularSettings(prev => ({ 
                  ...prev, 
                  columnAngle: parseFloat(e.target.value) || 0 
                }))}
                className="w-full p-1 border rounded text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Polar array settings */}
      {arrayType === 'polar' && (
        <div className="mb-4 space-y-3">
          <h4 className="text-sm font-medium">Impostazioni Polari:</h4>
          
          <div>
            <label className="block text-xs text-gray-600">Numero Elementi:</label>
            <input
              type="number"
              min="2"
              max="50"
              value={polarSettings.totalItems}
              onChange={(e) => setPolarSettings(prev => ({ 
                ...prev, 
                totalItems: parseInt(e.target.value) || 2 
              }))}
              className="w-full p-1 border rounded text-sm"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-600">Angolo da Riempire (°):</label>
            <input
              type="number"
              min="1"
              max="360"
              value={polarSettings.angleToFill}
              onChange={(e) => setPolarSettings(prev => ({ 
                ...prev, 
                angleToFill: parseFloat(e.target.value) || 360 
              }))}
              className="w-full p-1 border rounded text-sm"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-600">Raggio:</label>
            <input
              type="number"
              min="1"
              value={polarSettings.radius}
              onChange={(e) => setPolarSettings(prev => ({ 
                ...prev, 
                radius: parseFloat(e.target.value) || 100 
              }))}
              className="w-full p-1 border rounded text-sm"
            />
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={polarSettings.rotateItems}
                onChange={(e) => setPolarSettings(prev => ({ 
                  ...prev, 
                  rotateItems: e.target.checked 
                }))}
                className="rounded"
              />
              <span className="text-xs">Ruota gli elementi</span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-600">Centro X:</label>
              <input
                type="number"
                value={polarSettings.centerPoint.x}
                onChange={(e) => setPolarSettings(prev => ({ 
                  ...prev, 
                  centerPoint: { ...prev.centerPoint, x: parseFloat(e.target.value) || 0 }
                }))}
                className="w-full p-1 border rounded text-sm"
              />
            </div>
            
            <div>
              <label className="block text-xs text-gray-600">Centro Y:</label>
              <input
                type="number"
                value={polarSettings.centerPoint.y}
                onChange={(e) => setPolarSettings(prev => ({ 
                  ...prev, 
                  centerPoint: { ...prev.centerPoint, y: parseFloat(e.target.value) || 0 }
                }))}
                className="w-full p-1 border rounded text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Path array message */}
      {arrayType === 'path' && (
        <div className="mb-4 p-3 bg-yellow-50 rounded">
          <p className="text-sm text-yellow-700">
            Array lungo percorso non ancora implementato. 
            Seleziona un percorso esistente e configura il numero di elementi.
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={executeArray}
          disabled={selectedEntityIds.length === 0}
          className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Crea Array
        </motion.button>
      </div>

      {/* Preview info */}
      {selectedEntityIds.length > 0 && (
        <div className="mt-4 p-2 bg-gray-50 rounded">
          <p className="text-xs text-gray-600">
            Verranno create {getTotalItemsPreview() - selectedEntityIds.length} nuove copie
          </p>
        </div>
      )}

      {/* Shortcut hints */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <h4 className="text-sm font-medium mb-1">Scorciatoie:</h4>
        <div className="text-xs text-gray-500 space-y-1">
          <div><kbd className="px-1 bg-gray-100 rounded">Esc</kbd> - Annulla operazione</div>
          <div><kbd className="px-1 bg-gray-100 rounded">Enter</kbd> - Conferma array</div>
        </div>
      </div>
    </motion.div>
  );
};

export default ArrayTool;
