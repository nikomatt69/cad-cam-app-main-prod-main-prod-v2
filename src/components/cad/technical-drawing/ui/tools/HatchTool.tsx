// src/components/cad/technical-drawing/ui/tools/HatchTool.tsx

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTechnicalDrawingStore } from '../../technicalDrawingStore';
import { Point, HatchEntity, DrawingEntityType } from '../../TechnicalDrawingTypes';

interface HatchToolProps {
  onComplete?: () => void;
}

export const HatchTool: React.FC<HatchToolProps> = ({ onComplete }) => {
  const {
    addEntity,
    activeLayer,
    entities
  } = useTechnicalDrawingStore();

  const [points, setPoints] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [pattern, setPattern] = useState<'solid' | 'lines' | 'dots' | 'cross' | 'diagonal'>('lines');
  const [patternScale, setPatternScale] = useState(5);
  const [patternAngle, setPatternAngle] = useState(45);

  const handleCanvasClick = (point: Point) => {
    if (!isDrawing) {
      // Start drawing
      setIsDrawing(true);
      setPoints([point]);
    } else {
      // Add point to boundary
      setPoints(prev => [...prev, point]);
    }
  };

  const completeHatch = () => {
    if (points.length >= 3) {
      const hatchEntity: Omit<HatchEntity, 'id'> = {
        type: DrawingEntityType.HATCH,
        layer: activeLayer,
        visible: true,
        locked: false,
        boundary: [...points],
        pattern,
        patternScale,
        patternAngle,
        style: {
          strokeColor: '#000000',
          strokeWidth: 1,
          strokeStyle: 'solid',
          fillColor: '#cccccc',
          fillOpacity: 0.3
        }
      };

      addEntity(hatchEntity);
      
      // Reset tool
      setPoints([]);
      setIsDrawing(false);
      onComplete?.();
    }
  };

  const cancelHatch = () => {
    setPoints([]);
    setIsDrawing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="hatch-tool-panel p-4 bg-white border rounded-lg shadow-lg"
    >
      <h3 className="text-lg font-semibold mb-4">Strumento Hatch</h3>
      
      {/* Pattern Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Pattern:</label>
        <select
          value={pattern}
          onChange={(e) => setPattern(e.target.value as any)}
          className="w-full p-2 border rounded"
        >
          <option value="solid">Solido</option>
          <option value="lines">Linee</option>
          <option value="dots">Punti</option>
          <option value="cross">Reticolo</option>
          <option value="diagonal">Diagonale</option>
        </select>
      </div>

      {/* Pattern Scale */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Scala Pattern: {patternScale}
        </label>
        <input
          type="range"
          min="1"
          max="20"
          value={patternScale}
          onChange={(e) => setPatternScale(Number(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Pattern Angle */}
      {(pattern === 'lines' || pattern === 'diagonal') && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Angolo: {patternAngle}°
          </label>
          <input
            type="range"
            min="0"
            max="180"
            step="15"
            value={patternAngle}
            onChange={(e) => setPatternAngle(Number(e.target.value))}
            className="w-full"
          />
        </div>
      )}

      {/* Status and Instructions */}
      <div className="mb-4 p-3 bg-blue-50 rounded">
        {!isDrawing ? (
          <p className="text-sm text-blue-700">
            Clicca per iniziare a definire il contorno del riempimento
          </p>
        ) : (
          <p className="text-sm text-blue-700">
            Continua a cliccare per aggiungere punti. Punti attuali: {points.length}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        {isDrawing && points.length >= 3 && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={completeHatch}
            className="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Completa Hatch
          </motion.button>
        )}
        
        {isDrawing && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={cancelHatch}
            className="flex-1 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Annulla
          </motion.button>
        )}
      </div>

      {/* Preview */}
      {isDrawing && points.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded">
          <h4 className="text-sm font-medium mb-2">Anteprima Contorno:</h4>
          <div className="text-xs text-gray-600">
            {points.map((point, index) => (
              <div key={index}>
                Punto {index + 1}: ({point.x.toFixed(1)}, {point.y.toFixed(1)})
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default HatchTool;
