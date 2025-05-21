// src/components/cad/technical-drawing/GeometricTolerancePanel.tsx

import React, { useState } from 'react';
import { useTechnicalDrawingStore } from '../../../store/technicalDrawingStore';
import { 
  Settings, 
  Square, 
  Circle, 
  Box, 
  Hash, 
  Slash, 
  X, 
  ChevronDown, 
  ChevronRight,
  Copy,
  Save,
  RefreshCw
} from 'react-feather';

interface GeometricTolerancePanelProps {
  onClose?: () => void;
}

export const GeometricTolerancePanel: React.FC<GeometricTolerancePanelProps> = ({ 
  onClose 
}) => {
  const { setActiveTool, activeTool } = useTechnicalDrawingStore();
  
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [toleranceValue, setToleranceValue] = useState('0.1');
  const [primaryDatum, setPrimaryDatum] = useState('');
  const [secondaryDatum, setSecondaryDatum] = useState('');
  const [tertiaryDatum, setTertiaryDatum] = useState('');
  const [materialCondition, setMaterialCondition] = useState('none');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    symbols: true,
    datums: true,
    modifiers: false,
    presets: false
  });
  
  // GD&T Symbols
  const gdtSymbols = [
    { id: 'straightness', symbol: '—', name: 'Straightness' },
    { id: 'flatness', symbol: '⬜', name: 'Flatness' },
    { id: 'circularity', symbol: '○', name: 'Circularity' },
    { id: 'cylindricity', symbol: '⌭', name: 'Cylindricity' },
    { id: 'profile-line', symbol: '⌓', name: 'Profile of a Line' },
    { id: 'profile-surface', symbol: '⌓⌓', name: 'Profile of a Surface' },
    { id: 'perpendicularity', symbol: '⊥', name: 'Perpendicularity' },
    { id: 'angularity', symbol: '∠', name: 'Angularity' },
    { id: 'parallelism', symbol: '∥', name: 'Parallelism' },
    { id: 'position', symbol: '⌖', name: 'Position' },
    { id: 'concentricity', symbol: '◎', name: 'Concentricity' },
    { id: 'symmetry', symbol: '⌯', name: 'Symmetry' },
    { id: 'runout-circular', symbol: '↗', name: 'Circular Runout' },
    { id: 'runout-total', symbol: '↗↗', name: 'Total Runout' }
  ];
  
  // Material conditions
  const materialConditions = [
    { id: 'none', symbol: '', name: 'None' },
    { id: 'mmb', symbol: 'M', name: 'Maximum Material Boundary' },
    { id: 'lmb', symbol: 'L', name: 'Least Material Boundary' },
    { id: 'rfs', symbol: 'S', name: 'Regardless of Feature Size' }
  ];
  
  // Common tolerance presets
  const tolerancePresets = [
    { name: 'Precision Hole', symbol: 'position', value: '0.05', primary: 'A', secondary: 'B', tertiary: '', condition: 'mmb' },
    { name: 'Perpendicular Surface', symbol: 'perpendicularity', value: '0.1', primary: 'A', secondary: '', tertiary: '', condition: 'none' },
    { name: 'Flat Surface', symbol: 'flatness', value: '0.2', primary: '', secondary: '', tertiary: '', condition: 'none' },
    { name: 'Parallel Faces', symbol: 'parallelism', value: '0.1', primary: 'A', secondary: '', tertiary: '', condition: 'none' },
    { name: 'Symmetrical Features', symbol: 'symmetry', value: '0.5', primary: 'A', secondary: 'B', tertiary: '', condition: 'none' }
  ];
  
  // Toggle section expanded state
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  // Render section header
  const renderSectionHeader = (title: string, section: string) => (
    <button
      onClick={() => toggleSection(section)}
      className="flex items-center justify-between w-full py-2 px-3 bg-gray-800 border-b border-gray-700"
    >
      <div className="flex items-center">
        {expandedSections[section] ? <ChevronDown size={14} className="mr-2" /> : <ChevronRight size={14} className="mr-2" />}
        <span className="text-sm font-medium text-gray-300">{title}</span>
      </div>
    </button>
  );
  
  // Apply a tolerance preset
  const applyPreset = (preset: typeof tolerancePresets[0]) => {
    setSelectedSymbol(preset.symbol);
    setToleranceValue(preset.value);
    setPrimaryDatum(preset.primary);
    setSecondaryDatum(preset.secondary);
    setTertiaryDatum(preset.tertiary);
    setMaterialCondition(preset.condition);
  };
  
  // Create GD&T feature control frame
  const createFeatureControlFrame = () => {
    if (!selectedSymbol) {
      alert('Please select a geometric characteristic symbol first.');
      return;
    }
    
    // Format would depend on your implementation
    const featureControlFrame = {
      symbol: selectedSymbol,
      tolerance: toleranceValue,
      primaryDatum: primaryDatum,
      secondaryDatum: secondaryDatum,
      tertiaryDatum: tertiaryDatum,
      materialCondition: materialCondition
    };
    
    console.log('Creating feature control frame:', featureControlFrame);
    setActiveTool('feature-control-frame');
    
    // In a real implementation, you would pass this to your drawing tool
  };
  
  // Generate preview of the feature control frame
  const getFeatureControlFramePreview = () => {
    const symbol = gdtSymbols.find(s => s.id === selectedSymbol)?.symbol || '';
    const condition = materialConditions.find(c => c.id === materialCondition)?.symbol || '';
    
    let preview = `⎡ ${symbol} ${toleranceValue} ${condition} ⎤`;
    if (primaryDatum) {
      preview += ` -${primaryDatum}`;
      if (secondaryDatum) {
        preview += ` -${secondaryDatum}`;
        if (tertiaryDatum) {
          preview += ` -${tertiaryDatum}`;
        }
      }
    }
    
    return preview;
  };
  
  return (
    <div className="h-full flex flex-col bg-gray-900 text-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <h2 className="text-lg font-semibold">Geometric Tolerance</h2>
        {onClose && (
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white"
          >
            <X size={16} />
          </button>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {/* Geometric Characteristic Symbols */}
        {renderSectionHeader('Geometric Characteristics', 'symbols')}
        {expandedSections.symbols && (
          <div className="p-3 border-b border-gray-700">
            <div className="grid grid-cols-4 gap-2">
              {gdtSymbols.map(symbol => (
                <button
                  key={symbol.id}
                  onClick={() => setSelectedSymbol(symbol.id)}
                  className={`flex flex-col items-center p-2 rounded ${
                    selectedSymbol === symbol.id 
                      ? 'bg-blue-900 text-blue-300' 
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                  title={symbol.name}
                >
                  <div className="h-6 flex items-center justify-center mb-1 text-lg font-bold">
                    {symbol.symbol}
                  </div>
                  <span className="text-xs text-center truncate w-full">{symbol.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Datum References */}
        {renderSectionHeader('Datum References', 'datums')}
        {expandedSections.datums && (
          <div className="p-3 border-b border-gray-700">
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Primary</label>
                <input
                  type="text"
                  value={primaryDatum}
                  onChange={(e) => setPrimaryDatum(e.target.value.toUpperCase())}
                  placeholder="A"
                  maxLength={1}
                  className="w-full px-2 py-1.5 text-sm border border-gray-700 rounded bg-gray-800 text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Secondary</label>
                <input
                  type="text"
                  value={secondaryDatum}
                  onChange={(e) => setSecondaryDatum(e.target.value.toUpperCase())}
                  placeholder="B"
                  maxLength={1}
                  disabled={!primaryDatum}
                  className={`w-full px-2 py-1.5 text-sm border border-gray-700 rounded ${
                    primaryDatum 
                      ? 'bg-gray-800 text-white' 
                      : 'bg-gray-900 text-gray-600 cursor-not-allowed'
                  }`}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Tertiary</label>
                <input
                  type="text"
                  value={tertiaryDatum}
                  onChange={(e) => setTertiaryDatum(e.target.value.toUpperCase())}
                  placeholder="C"
                  maxLength={1}
                  disabled={!secondaryDatum}
                  className={`w-full px-2 py-1.5 text-sm border border-gray-700 rounded ${
                    secondaryDatum 
                      ? 'bg-gray-800 text-white' 
                      : 'bg-gray-900 text-gray-600 cursor-not-allowed'
                  }`}
                />
              </div>
            </div>
            
            <div className="mb-3">
              <label className="block text-xs text-gray-500 mb-1">Tolerance Value</label>
              <input
                type="text"
                value={toleranceValue}
                onChange={(e) => setToleranceValue(e.target.value)}
                placeholder="0.1"
                className="w-full px-2 py-1.5 text-sm border border-gray-700 rounded bg-gray-800 text-white"
              />
            </div>
            
            <div>
              <label className="block text-xs text-gray-500 mb-1">Material Condition</label>
              <div className="grid grid-cols-4 gap-1">
                {materialConditions.map(condition => (
                  <button
                    key={condition.id}
                    onClick={() => setMaterialCondition(condition.id)}
                    className={`py-1.5 rounded ${
                      materialCondition === condition.id 
                        ? 'bg-blue-900 text-blue-300' 
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <div className="text-center">{condition.symbol || 'None'}</div>
                    <div className="text-xs mt-1">{condition.name === 'None' ? '' : condition.name}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Modifiers */}
        {renderSectionHeader('Additional Modifiers', 'modifiers')}
        {expandedSections.modifiers && (
          <div className="p-3 border-b border-gray-700">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="projectedTolerance"
                  className="mr-2"
                />
                <label htmlFor="projectedTolerance" className="text-xs text-gray-300">
                  Projected Tolerance Zone
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="freeState"
                  className="mr-2"
                />
                <label htmlFor="freeState" className="text-xs text-gray-300">
                  Free State
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="tangentPlane"
                  className="mr-2"
                />
                <label htmlFor="tangentPlane" className="text-xs text-gray-300">
                  Tangent Plane
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="statistical"
                  className="mr-2"
                />
                <label htmlFor="statistical" className="text-xs text-gray-300">
                  Statistical Tolerance
                </label>
              </div>
            </div>
            
            <div className="mt-3">
              <label className="block text-xs text-gray-500 mb-1">Additional Notes</label>
              <input
                type="text"
                placeholder="Enter any additional notes"
                className="w-full px-2 py-1.5 text-sm border border-gray-700 rounded bg-gray-800 text-white"
              />
            </div>
          </div>
        )}
        
        {/* Common Presets */}
        {renderSectionHeader('Common Presets', 'presets')}
        {expandedSections.presets && (
          <div className="p-3 border-b border-gray-700">
            <div className="space-y-1">
              {tolerancePresets.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => applyPreset(preset)}
                  className="flex justify-between items-center w-full px-3 py-2 text-left rounded bg-gray-800 hover:bg-gray-700"
                >
                  <span className="text-sm text-gray-300">{preset.name}</span>
                  <span className="text-xs text-gray-400">
                    {gdtSymbols.find(s => s.id === preset.symbol)?.symbol} {preset.value}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Preview */}
        <div className="p-3 border-b border-gray-700">
          <label className="block text-xs text-gray-500 mb-1">Preview</label>
          <div className="h-12 flex items-center justify-center bg-gray-800 border border-gray-700 rounded">
            <div className="font-mono text-lg text-white">
              {selectedSymbol ? getFeatureControlFramePreview() : 'Select a symbol to preview'}
            </div>
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="border-t border-gray-700 p-3 flex justify-between">
        <button
          onClick={createFeatureControlFrame}
          disabled={!selectedSymbol}
          className={`px-3 py-1.5 text-sm rounded ${
            selectedSymbol 
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          Create Feature Control Frame
        </button>
        
        <div className="flex space-x-2">
          <button
            onClick={() => {
              setSelectedSymbol(null);
              setToleranceValue('0.1');
              setPrimaryDatum('');
              setSecondaryDatum('');
              setTertiaryDatum('');
              setMaterialCondition('none');
            }}
            className="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded border border-gray-700"
            title="Reset"
          >
            <RefreshCw size={14} />
          </button>
          
          <button
            className="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded border border-gray-700"
            title="Save as Preset"
          >
            <Save size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};