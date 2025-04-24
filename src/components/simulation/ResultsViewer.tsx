import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { SimulationResults } from '../../lib/simulation/FEAEngine';
import { StressAnalysisResults } from '../../lib/simulation/StressAnalysis';
import { ThermalAnalysisResults } from '../../lib/simulation/ThermalAnalysis';

interface ResultsViewerProps {
  meshId: string;
  results: SimulationResults | StressAnalysisResults | ThermalAnalysisResults;
  simulationType: 'stress' | 'thermal' | 'coupled';
  deformedMesh?: THREE.Mesh;
  onClose: () => void;
}

const ResultsViewer: React.FC<ResultsViewerProps> = ({
  meshId,
  results,
  simulationType,
  deformedMesh,
  onClose
}) => {
  const [colorMapType, setColorMapType] = useState<'displacement' | 'stress' | 'temperature' | 'safety'>('displacement');
  const [deformationScale, setDeformationScale] = useState<number>(1);
  const [showOriginalMesh, setShowOriginalMesh] = useState<boolean>(false);
  const [timeStep, setTimeStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [sliderValue, setSliderValue] = useState<number>(0);
  
  const animationTimerRef = useRef<number | null>(null);
  
  // Determine if results have time-based data
  const hasTimeData = 'temperatureDistribution' in results && 
    results.temperatureDistribution && 
    results.temperatureDistribution.length > 1;
  
  const timeSteps = hasTimeData ? (results as ThermalAnalysisResults).temperatureDistribution.length : 0;
  
  useEffect(() => {
    if (isPlaying && hasTimeData) {
      animationTimerRef.current = window.setInterval(() => {
        setTimeStep(prev => {
          const next = (prev + 1) % timeSteps;
          setSliderValue(next);
          return next;
        });
      }, 200);
    } else if (animationTimerRef.current) {
      window.clearInterval(animationTimerRef.current);
      animationTimerRef.current = null;
    }
    
    return () => {
      if (animationTimerRef.current) {
        window.clearInterval(animationTimerRef.current);
      }
    };
  }, [isPlaying, hasTimeData, timeSteps]);
  
  // Calculate min/max values for the legend
  const getLegendValues = () => {
    if (colorMapType === 'displacement') {
      return {
        min: 0,
        max: results.maxDisplacement,
        unit: 'mm',
        label: 'Displacement'
      };
    } else if (colorMapType === 'stress') {
      return {
        min: 0,
        max: results.maxStress,
        unit: 'MPa',
        label: 'von Mises Stress'
      };
    } else if (colorMapType === 'temperature' && 'maxTemperature' in results) {
      const thermalResults = results as ThermalAnalysisResults;
      return {
        min: thermalResults.minTemperature - 273.15, // Convert to Celsius
        max: thermalResults.maxTemperature - 273.15,
        unit: '°C',
        label: 'Temperature'
      };
    } else if (colorMapType === 'safety') {
      const minSafety = Math.min(...results.safetyFactor);
      return {
        min: minSafety < 10 ? minSafety : 0,
        max: 10,
        unit: '',
        label: 'Safety Factor'
      };
    }
    
    return { min: 0, max: 1, unit: '', label: '' };
  };
  
  const legendValues = getLegendValues();
  
  // Helper to format a value according to the current display type
  const formatValue = (value: number) => {
    if (colorMapType === 'temperature') {
      return `${value.toFixed(1)}${legendValues.unit}`;
    } else if (colorMapType === 'safety') {
      return value >= 10 ? '≥10' : value.toFixed(2);
    } else {
      return `${value.toFixed(3)}${legendValues.unit}`;
    }
  };
  
  // Generate colors for the legend
  const generateColorStops = () => {
    const colorStops = [];
    const count = 10;
    
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      let color: string;
      
      if (colorMapType === 'safety') {
        // Red (dangerous) to green (safe) color scale for safety factor
        color = t < 0.5 
          ? `rgb(${255}, ${Math.floor(t * 2 * 255)}, 0)` 
          : `rgb(${Math.floor((1 - t) * 2 * 255)}, 255, 0)`;
      } else {
        // Blue to red color scale for other metrics
        color = t < 0.5 
          ? `rgb(0, ${Math.floor(t * 2 * 255)}, ${255 - Math.floor(t * 2 * 255)})` 
          : `rgb(${Math.floor((t - 0.5) * 2 * 255)}, ${255 - Math.floor((t - 0.5) * 2 * 255)}, 0)`;
      }
      
      const value = legendValues.min + t * (legendValues.max - legendValues.min);
      
      colorStops.push({ color, value });
    }
    
    return colorStops;
  };
  
  const colorStops = generateColorStops();
  
  // Get text summary of results
  const getResultsSummary = () => {
    const summaryPoints = [];
    
    if (simulationType === 'stress' || simulationType === 'coupled') {
      const stressResults = results as StressAnalysisResults;
      summaryPoints.push(`Maximum Displacement: ${formatValue(results.maxDisplacement)}`);
      summaryPoints.push(`Maximum von Mises Stress: ${formatValue(results.maxStress)}`);
      
      if ('failurePoints' in stressResults && stressResults.failurePoints) {
        const minSafetyFactor = Math.min(...stressResults.failurePoints.map(p => p.safetyFactor));
        summaryPoints.push(`Minimum Safety Factor: ${minSafetyFactor.toFixed(2)}`);
      }
    }
    
    if (simulationType === 'thermal' || simulationType === 'coupled') {
      const thermalResults = results as ThermalAnalysisResults;
      if ('maxTemperature' in thermalResults) {
        const maxTemp = thermalResults.maxTemperature - 273.15; // Convert to Celsius
        const minTemp = thermalResults.minTemperature - 273.15;
        summaryPoints.push(`Temperature Range: ${minTemp.toFixed(1)}°C to ${maxTemp.toFixed(1)}°C`);
        
        const deltaT = maxTemp - minTemp;
        summaryPoints.push(`Temperature Differential: ${deltaT.toFixed(1)}°C`);
      }
    }
    
    return summaryPoints;
  };
  
  const summaryPoints = getResultsSummary();
  
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col h-full">
      <div className="p-4 bg-gray-50 border-b">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            {simulationType === 'stress' ? 'Stress Analysis' : 
             simulationType === 'thermal' ? 'Thermal Analysis' : 
             'Coupled Thermo-Mechanical Analysis'} Results
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            Close
          </button>
        </div>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Results visualization area */}
        <div className="w-3/4 h-full relative">
          <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            <OrbitControls />
            
            {deformedMesh && (
              <mesh
                geometry={deformedMesh.geometry}
                scale={[1, 1, 1]}
                visible={true}
              >
                <meshStandardMaterial 
                  color="#1E88E5" 
                  wireframe={true} 
                />
              </mesh>
            )}
            
            {/* Add visualization of the model with appropriate color mapping */}
          </Canvas>
          
          {/* Legend */}
          <div className="absolute right-4 top-4 bg-white bg-opacity-90 p-2 rounded shadow-md">
            <div className="text-sm font-medium mb-1">{legendValues.label}</div>
            <div className="h-40 w-8 relative flex">
              <div className="absolute inset-0">
                {colorStops.map((stop, index) => (
                  <div 
                    key={index} 
                    style={{ 
                      backgroundColor: stop.color,
                      height: `${100 / colorStops.length}%`,
                      width: '100%',
                      position: 'absolute',
                      bottom: `${(index / colorStops.length) * 100}%`
                    }}
                  />
                ))}
              </div>
              <div className="absolute inset-0 flex flex-col justify-between text-xs">
                {colorStops.filter((_, i) => i % 2 === 0 || i === colorStops.length - 1).map((stop, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-end mr-2" 
                    style={{ height: '20px' }}
                  >
                    <div className="absolute right-full mr-1 whitespace-nowrap">
                      {formatValue(stop.value)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {hasTimeData && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white bg-opacity-90 p-2 rounded shadow-md flex items-center space-x-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-1 rounded bg-blue-500 text-white w-8 h-8 flex items-center justify-center"
              >
                {isPlaying ? '⏸' : '▶'}
              </button>
              <input
                type="range"
                min={0}
                max={timeSteps - 1}
                value={sliderValue}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setSliderValue(val);
                  setTimeStep(val);
                }}
                className="w-64"
              />
              <div className="text-sm">
                Time: {(timeStep / (timeSteps - 1) * 100).toFixed(0)}%
              </div>
            </div>
          )}
        </div>
        
        {/* Controls and info panel */}
        <div className="w-1/4 border-l p-4 overflow-y-auto">
          <div className="mb-4">
            <h3 className="font-medium mb-2">Display Options</h3>
            <div className="space-y-2">
              <div>
                <label className="block text-sm mb-1">Color Map</label>
                <select
                  value={colorMapType}
                  onChange={(e) => setColorMapType(e.target.value as any)}
                  className="form-select w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                >
                  <option value="displacement">Displacement</option>
                  <option value="stress">Stress</option>
                  {(simulationType === 'thermal' || simulationType === 'coupled') && (
                    <option value="temperature">Temperature</option>
                  )}
                  <option value="safety">Safety Factor</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm mb-1">
                  Deformation Scale: {deformationScale.toFixed(1)}x
                </label>
                <input
                  type="range"
                  min={0.1}
                  max={10}
                  step={0.1}
                  value={deformationScale}
                  onChange={(e) => setDeformationScale(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={showOriginalMesh}
                  onChange={(e) => setShowOriginalMesh(e.target.checked)}
                  className="form-checkbox h-4 w-4 text-blue-600"
                />
                <span className="ml-2 text-sm">Show Original Mesh</span>
              </label>
            </div>
          </div>
          
          <div className="mb-4">
            <h3 className="font-medium mb-2">Results Summary</h3>
            <div className="space-y-1 text-sm">
              {summaryPoints.map((point, index) => (
                <div key={index} className="py-1 border-b last:border-b-0">
                  {point}
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Export Options</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                className="px-3 py-2 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              >
                Export CSV
              </button>
              <button
                className="px-3 py-2 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              >
                Save Image
              </button>
              <button
                className="px-3 py-2 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              >
                Export Report
              </button>
              <button
                className="px-3 py-2 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              >
                Save FEA Model
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsViewer; 