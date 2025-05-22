// src/components/cad/technical-drawing/ui/tools/MeasurementTool.tsx

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTechnicalDrawingStore } from '../../technicalDrawingStore';
import { Point, AnyEntity } from '../../TechnicalDrawingTypes';
import { 
  Ruler, 
  Calculator, 
  RotateCw, 
  Square, 
  Circle, 
  Triangle,
  Sigma,
  Info
} from 'lucide-react';

interface MeasurementToolProps {
  onComplete?: () => void;
}

type MeasurementType = 'distance' | 'angle' | 'area' | 'perimeter' | 'radius' | 'coordinates' | 'cumulative';

interface MeasurementResult {
  type: MeasurementType;
  value: number;
  unit: string;
  points: Point[];
  description: string;
  timestamp: number;
}

export const MeasurementTool: React.FC<MeasurementToolProps> = ({ onComplete }) => {
  const {
    entities,
    dimensions,
    annotations,
    selectedEntityIds,
    gridSize,
    sheet
  } = useTechnicalDrawingStore();

  const [measurementType, setMeasurementType] = useState<MeasurementType>('distance');
  const [points, setPoints] = useState<Point[]>([]);
  const [measurements, setMeasurements] = useState<MeasurementResult[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [precision, setPrecision] = useState(2);
  const [units, setUnits] = useState(sheet?.units || 'mm');

  const measurementTypes = [
    {
      id: 'distance' as MeasurementType,
      name: 'Distanza',
      description: 'Misura la distanza tra due punti',
      icon: Ruler,
      requiredPoints: 2,
      color: 'bg-blue-500'
    },
    {
      id: 'angle' as MeasurementType,
      name: 'Angolo',
      description: 'Misura l\'angolo tra tre punti',
      icon: RotateCw,
      requiredPoints: 3,
      color: 'bg-green-500'
    },
    {
      id: 'area' as MeasurementType,
      name: 'Area',
      description: 'Calcola l\'area di una forma',
      icon: Square,
      requiredPoints: 3,
      color: 'bg-purple-500'
    },
    {
      id: 'radius' as MeasurementType,
      name: 'Raggio',
      description: 'Misura il raggio di un cerchio',
      icon: Circle,
      requiredPoints: 2,
      color: 'bg-orange-500'
    },
    {
      id: 'perimeter' as MeasurementType,
      name: 'Perimetro',
      description: 'Calcola il perimetro di una forma',
      icon: Triangle,
      requiredPoints: 3,
      color: 'bg-red-500'
    },
    {
      id: 'coordinates' as MeasurementType,
      name: 'Coordinate',
      description: 'Mostra le coordinate di un punto',
      icon: Info,
      requiredPoints: 1,
      color: 'bg-gray-500'
    }
  ];

  const handleCanvasClick = (point: Point) => {
    const currentType = measurementTypes.find(t => t.id === measurementType);
    if (!currentType) return;

    const newPoints = [...points, point];
    setPoints(newPoints);

    if (newPoints.length >= currentType.requiredPoints) {
      const result = calculateMeasurement(measurementType, newPoints);
      if (result) {
        setMeasurements(prev => [result, ...prev]);
      }
      setPoints([]); // Reset for next measurement
    }
  };

  const calculateMeasurement = (type: MeasurementType, measurePoints: Point[]): MeasurementResult | null => {
    const timestamp = Date.now();

    switch (type) {
      case 'distance': {
        if (measurePoints.length < 2) return null;
        
        const [p1, p2] = measurePoints;
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return {
          type,
          value: distance,
          unit: units,
          points: measurePoints,
          description: `Distanza: ${distance.toFixed(precision)} ${units}`,
          timestamp
        };
      }

      case 'angle': {
        if (measurePoints.length < 3) return null;
        
        const [p1, vertex, p2] = measurePoints;
        
        // Calculate vectors from vertex to other points
        const v1 = { x: p1.x - vertex.x, y: p1.y - vertex.y };
        const v2 = { x: p2.x - vertex.x, y: p2.y - vertex.y };
        
        // Calculate angle using dot product
        const dot = v1.x * v2.x + v1.y * v2.y;
        const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
        const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
        
        const angleRad = Math.acos(dot / (mag1 * mag2));
        const angleDeg = angleRad * 180 / Math.PI;
        
        return {
          type,
          value: angleDeg,
          unit: '°',
          points: measurePoints,
          description: `Angolo: ${angleDeg.toFixed(precision)}°`,
          timestamp
        };
      }

      case 'area': {
        if (measurePoints.length < 3) return null;
        
        // Calculate area using shoelace formula
        let area = 0;
        const n = measurePoints.length;
        
        for (let i = 0; i < n; i++) {
          const j = (i + 1) % n;
          area += measurePoints[i].x * measurePoints[j].y;
          area -= measurePoints[j].x * measurePoints[i].y;
        }
        
        area = Math.abs(area) / 2;
        
        return {
          type,
          value: area,
          unit: units + '²',
          points: measurePoints,
          description: `Area: ${area.toFixed(precision)} ${units}²`,
          timestamp
        };
      }

      case 'radius': {
        if (measurePoints.length < 2) return null;
        
        const [center, point] = measurePoints;
        const dx = point.x - center.x;
        const dy = point.y - center.y;
        const radius = Math.sqrt(dx * dx + dy * dy);
        
        return {
          type,
          value: radius,
          unit: units,
          points: measurePoints,
          description: `Raggio: ${radius.toFixed(precision)} ${units}`,
          timestamp
        };
      }

      case 'perimeter': {
        if (measurePoints.length < 3) return null;
        
        let perimeter = 0;
        
        for (let i = 0; i < measurePoints.length; i++) {
          const current = measurePoints[i];
          const next = measurePoints[(i + 1) % measurePoints.length];
          
          const dx = next.x - current.x;
          const dy = next.y - current.y;
          perimeter += Math.sqrt(dx * dx + dy * dy);
        }
        
        return {
          type,
          value: perimeter,
          unit: units,
          points: measurePoints,
          description: `Perimetro: ${perimeter.toFixed(precision)} ${units}`,
          timestamp
        };
      }

      case 'coordinates': {
        if (measurePoints.length < 1) return null;
        
        const point = measurePoints[0];
        
        return {
          type,
          value: 0, // Not applicable for coordinates
          unit: units,
          points: measurePoints,
          description: `X: ${point.x.toFixed(precision)}, Y: ${point.y.toFixed(precision)}`,
          timestamp
        };
      }

      default:
        return null;
    }
  };

  const measureSelectedEntities = () => {
    const selectedEntities = selectedEntityIds.map(id => 
      entities[id] || dimensions[id] || annotations[id]
    ).filter(Boolean);

    const results: MeasurementResult[] = [];

    selectedEntities.forEach(entity => {
      const entityMeasurement = calculateEntityMeasurement(entity);
      if (entityMeasurement) {
        results.push(entityMeasurement);
      }
    });

    setMeasurements(prev => [...results, ...prev]);
  };

  const calculateEntityMeasurement = (entity: AnyEntity): MeasurementResult | null => {
    const timestamp = Date.now();

    switch (entity.type) {
      case 'line': {
        const line = entity as any;
        const dx = line.endPoint.x - line.startPoint.x;
        const dy = line.endPoint.y - line.startPoint.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        return {
          type: 'distance',
          value: length,
          unit: units,
          points: [line.startPoint, line.endPoint],
          description: `Lunghezza linea: ${length.toFixed(precision)} ${units}`,
          timestamp
        };
      }

      case 'circle': {
        const circle = entity as any;
        const area = Math.PI * circle.radius * circle.radius;
        const circumference = 2 * Math.PI * circle.radius;
        
        return {
          type: 'area',
          value: area,
          unit: units + '²',
          points: [circle.center],
          description: `Cerchio - Area: ${area.toFixed(precision)} ${units}², Circonferenza: ${circumference.toFixed(precision)} ${units}`,
          timestamp
        };
      }

      case 'rectangle': {
        const rect = entity as any;
        const area = rect.width * rect.height;
        const perimeter = 2 * (rect.width + rect.height);
        
        return {
          type: 'area',
          value: area,
          unit: units + '²',
          points: [rect.position],
          description: `Rettangolo - Area: ${area.toFixed(precision)} ${units}², Perimetro: ${perimeter.toFixed(precision)} ${units}`,
          timestamp
        };
      }

      default:
        return null;
    }
  };

  const clearMeasurements = () => {
    setMeasurements([]);
    setPoints([]);
  };

  const exportMeasurements = () => {
    const data = measurements.map(m => ({
      type: m.type,
      value: m.value,
      unit: m.unit,
      description: m.description,
      timestamp: new Date(m.timestamp).toISOString()
    }));

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'measurements.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getCurrentInstructions = (): string => {
    const currentType = measurementTypes.find(t => t.id === measurementType);
    if (!currentType) return '';

    const remaining = currentType.requiredPoints - points.length;
    
    if (remaining > 0) {
      return `Clicca ${remaining} punto${remaining > 1 ? 'i' : ''} ${remaining === 1 ? 'finale' : 'aggiuntiv' + (remaining > 1 ? 'i' : 'o')}`;
    }
    
    return 'Misura completata';
  };

  const getTotalCalculations = (): { total: number; byType: Record<string, number> } => {
    const byType: Record<string, number> = {};
    
    measurements.forEach(m => {
      byType[m.type] = (byType[m.type] || 0) + 1;
    });

    return {
      total: measurements.length,
      byType
    };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="measurement-tool p-4 bg-white border rounded-lg shadow-lg max-w-md"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Strumento Misura</h3>
        <div className="flex items-center space-x-2">
          <Calculator size={20} className="text-blue-500" />
          <span className="text-sm text-gray-500">{getTotalCalculations().total}</span>
        </div>
      </div>
      
      {/* Measurement type selection */}
      <div className="mb-4">
        <h4 className="text-sm font-medium mb-2">Tipo di misura:</h4>
        <div className="grid grid-cols-2 gap-2">
          {measurementTypes.map(type => (
            <motion.button
              key={type.id}
              className={`
                p-2 rounded-lg border-2 transition-all text-left
                ${measurementType === type.id 
                  ? `${type.color} text-white border-transparent` 
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }
              `}
              onClick={() => {
                setMeasurementType(type.id);
                setPoints([]);
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center space-x-2">
                <type.icon size={14} />
                <div>
                  <div className="text-sm font-medium">{type.name}</div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div className="mb-4 grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Precisione:</label>
          <select
            value={precision}
            onChange={(e) => setPrecision(parseInt(e.target.value))}
            className="w-full p-1 border rounded text-sm"
          >
            <option value={0}>0 decimali</option>
            <option value={1}>1 decimale</option>
            <option value={2}>2 decimali</option>
            <option value={3}>3 decimali</option>
            <option value={4}>4 decimali</option>
          </select>
        </div>
        
        <div>
          <label className="block text-xs text-gray-600 mb-1">Unità:</label>
          <select
            value={units}
            onChange={(e) => setUnits(e.target.value)}
            className="w-full p-1 border rounded text-sm"
          >
            <option value="mm">mm</option>
            <option value="cm">cm</option>
            <option value="m">m</option>
            <option value="in">pollici</option>
            <option value="ft">piedi</option>
          </select>
        </div>
      </div>

      {/* Current measurement progress */}
      <div className="mb-4 p-3 bg-blue-50 rounded">
        <h4 className="text-sm font-medium mb-1">Stato attuale:</h4>
        <p className="text-sm text-blue-700">{getCurrentInstructions()}</p>
        {points.length > 0 && (
          <div className="text-xs text-blue-600 mt-1">
            Punti selezionati: {points.length}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="mb-4 flex gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={measureSelectedEntities}
          disabled={selectedEntityIds.length === 0}
          className="flex-1 px-3 py-2 bg-green-500 text-white rounded text-sm hover:bg-green-600 disabled:bg-gray-300"
        >
          Misura Selezione
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowHistory(!showHistory)}
          className="px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
        >
          {showHistory ? 'Nascondi' : 'Cronologia'}
        </motion.button>
      </div>

      {/* Measurements history */}
      {showHistory && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-4"
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium">Cronologia misure:</h4>
            <div className="flex gap-1">
              <button
                onClick={exportMeasurements}
                disabled={measurements.length === 0}
                className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
              >
                Esporta
              </button>
              <button
                onClick={clearMeasurements}
                className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
              >
                Pulisci
              </button>
            </div>
          </div>
          
          <div className="max-h-40 overflow-y-auto space-y-2">
            {measurements.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-2">Nessuna misura effettuata</p>
            ) : (
              measurements.map((measurement, index) => (
                <div key={index} className="text-xs bg-gray-50 p-2 rounded">
                  <div className="font-medium">{measurement.description}</div>
                  <div className="text-gray-500">
                    {new Date(measurement.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}

      {/* Statistics */}
      {measurements.length > 0 && (
        <div className="mb-4 p-3 bg-gray-50 rounded">
          <h4 className="text-sm font-medium mb-2">Statistiche:</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <div>Totale misure: {getTotalCalculations().total}</div>
            {Object.entries(getTotalCalculations().byType).map(([type, count]) => (
              <div key={type}>
                {measurementTypes.find(t => t.id === type)?.name || type}: {count}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Control buttons */}
      <div className="flex gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setPoints([])}
          className="flex-1 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Reset Punti
        </motion.button>
      </div>

      {/* Help section */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <h4 className="text-sm font-medium mb-1">Suggerimenti:</h4>
        <div className="text-xs text-gray-500 space-y-1">
          <div>• Clicca sui punti nel disegno per effettuare misure</div>
          <div>• Usa "Misura Selezione" per misurare entità selezionate</div>
          <div>• Le misure sono salvate nella cronologia</div>
          <div>• <kbd className="px-1 bg-gray-100 rounded">Esc</kbd> per annullare misura corrente</div>
        </div>
      </div>
    </motion.div>
  );
};

export default MeasurementTool;
