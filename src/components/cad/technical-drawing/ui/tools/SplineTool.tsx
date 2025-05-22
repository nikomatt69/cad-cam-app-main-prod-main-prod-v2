// src/components/cad/technical-drawing/ui/tools/SplineTool.tsx

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTechnicalDrawingStore } from '../../technicalDrawingStore';
import { Point, SplineEntity, DrawingEntityType } from '../../TechnicalDrawingTypes';

interface SplineToolProps {
  onComplete?: () => void;
}

export const SplineTool: React.FC<SplineToolProps> = ({ onComplete }) => {
  const {
    addEntity,
    activeLayer
  } = useTechnicalDrawingStore();

  const [points, setPoints] = useState<Point[]>([]);
  const [controlPoints, setControlPoints] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [closed, setClosed] = useState(false);
  const [splineType, setSplineType] = useState<'bezier' | 'catmull' | 'bspline'>('bezier');
  const [tension, setTension] = useState(0.5);

  const handleCanvasClick = (point: Point) => {
    if (!isDrawing) {
      // Start drawing
      setIsDrawing(true);
      setPoints([point]);
    } else {
      // Add point to spline
      setPoints(prev => [...prev, point]);
      
      // Auto-generate control points for Bezier curves
      if (splineType === 'bezier') {
        generateControlPoints([...points, point]);
      }
    }
  };

  const generateControlPoints = (splinePoints: Point[]) => {
    if (splinePoints.length < 2) return;

    const newControlPoints: Point[] = [];
    
    for (let i = 0; i < splinePoints.length - 1; i++) {
      const p1 = splinePoints[i];
      const p2 = splinePoints[i + 1];
      
      // Control point 1 (for p1)
      const cp1: Point = {
        x: p1.x + (p2.x - p1.x) * tension,
        y: p1.y + (p2.y - p1.y) * tension
      };
      
      // Control point 2 (for p2)
      const cp2: Point = {
        x: p2.x - (p2.x - p1.x) * tension,
        y: p2.y - (p2.y - p1.y) * tension
      };
      
      newControlPoints.push(cp1, cp2);
    }
    
    setControlPoints(newControlPoints);
  };

  const completeSpline = () => {
    if (points.length >= 2) {
      const splineEntity: Omit<SplineEntity, 'id'> = {
        type: DrawingEntityType.SPLINE,
        layer: activeLayer,
        visible: true,
        locked: false,
        points: [...points],
        controlPoints: splineType === 'bezier' ? [...controlPoints] : undefined,
        closed,
        style: {
          strokeColor: '#000000',
          strokeWidth: 2,
          strokeStyle: 'solid',
          fillColor: closed ? 'rgba(0,0,0,0.1)' : 'none'
        }
      };

      addEntity(splineEntity);
      
      // Reset tool
      setPoints([]);
      setControlPoints([]);
      setIsDrawing(false);
      onComplete?.();
    }
  };

  const cancelSpline = () => {
    setPoints([]);
    setControlPoints([]);
    setIsDrawing(false);
  };

  const toggleClosed = () => {
    setClosed(!closed);
    if (splineType === 'bezier' && points.length >= 2) {
      generateControlPoints(points);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="spline-tool-panel p-4 bg-white border rounded-lg shadow-lg"
    >
      <h3 className="text-lg font-semibold mb-4">Strumento Spline</h3>
      
      {/* Spline Type Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Tipo Spline:</label>
        <select
          value={splineType}
          onChange={(e) => {
            setSplineType(e.target.value as any);
            if (e.target.value === 'bezier' && points.length >= 2) {
              generateControlPoints(points);
            }
          }}
          className="w-full p-2 border rounded"
        >
          <option value="bezier">Bézier Cubica</option>
          <option value="catmull">Catmull-Rom</option>
          <option value="bspline">B-Spline</option>
        </select>
      </div>

      {/* Tension Control */}
      {splineType === 'bezier' && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Tensione: {tension.toFixed(2)}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={tension}
            onChange={(e) => {
              setTension(Number(e.target.value));
              if (points.length >= 2) {
                generateControlPoints(points);
              }
            }}
            className="w-full"
          />
        </div>
      )}

      {/* Closed Toggle */}
      <div className="mb-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={closed}
            onChange={toggleClosed}
            className="mr-2"
          />
          <span className="text-sm">Spline chiusa</span>
        </label>
      </div>

      {/* Status and Instructions */}
      <div className="mb-4 p-3 bg-blue-50 rounded">
        {!isDrawing ? (
          <p className="text-sm text-blue-700">
            Clicca per iniziare a disegnare la spline
          </p>
        ) : (
          <div className="text-sm text-blue-700">
            <p>Continua a cliccare per aggiungere punti</p>
            <p>Punti attuali: {points.length}</p>
            {splineType === 'bezier' && (
              <p>Punti di controllo: {controlPoints.length}</p>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        {isDrawing && points.length >= 2 && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={completeSpline}
            className="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Completa Spline
          </motion.button>
        )}
        
        {isDrawing && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={cancelSpline}
            className="flex-1 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Annulla
          </motion.button>
        )}
      </div>

      {/* Points Preview */}
      {isDrawing && points.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded">
          <h4 className="text-sm font-medium mb-2">Punti Spline:</h4>
          <div className="max-h-32 overflow-y-auto text-xs text-gray-600">
            {points.map((point, index) => (
              <div key={index} className="flex justify-between">
                <span>P{index + 1}:</span>
                <span>({point.x.toFixed(1)}, {point.y.toFixed(1)})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Control Points Preview (for Bezier) */}
      {isDrawing && splineType === 'bezier' && controlPoints.length > 0 && (
        <div className="mt-2 p-3 bg-yellow-50 rounded">
          <h4 className="text-sm font-medium mb-2">Punti di Controllo:</h4>
          <div className="max-h-24 overflow-y-auto text-xs text-gray-600">
            {controlPoints.map((point, index) => (
              <div key={index} className="flex justify-between">
                <span>C{index + 1}:</span>
                <span>({point.x.toFixed(1)}, {point.y.toFixed(1)})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Spline Properties Info */}
      <div className="mt-4 p-3 bg-green-50 rounded">
        <h4 className="text-sm font-medium mb-2">Proprietà Spline:</h4>
        <div className="text-xs text-gray-600 space-y-1">
          <div>Tipo: {splineType}</div>
          <div>Stato: {closed ? 'Chiusa' : 'Aperta'}</div>
          {splineType === 'bezier' && (
            <div>Tensione: {tension.toFixed(2)}</div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default SplineTool;
