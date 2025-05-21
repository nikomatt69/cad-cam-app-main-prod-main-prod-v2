// src/components/cad/technical-drawing/DimensioningPanel.tsx

import React, { useState } from 'react';
import { useTechnicalDrawingStore } from '../../../store/technicalDrawingStore';
import { 
  Compass, 
  ArrowRight, 
  Circle as CircleIcon, 
  Disc, 
  CornerRightUp,
  ChevronDown,
  ChevronRight,
  Settings,
  X,
  AlignLeft,
  Type,
  ArrowUp
} from 'react-feather';

export const DimensioningPanel: React.FC = () => {
  const { setActiveTool, activeTool, dimensionStyles, setActiveDimensionStyle, activeDimensionStyle } = useTechnicalDrawingStore();
  const [dimensionPanel, setDimensionPanel] = useState<'basic' | 'advanced'>('basic');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    linearDimensions: true,
    angularDimensions: true,
    textOptions: false,
    arrowOptions: false,
    toleranceOptions: false,
    units: false
  });
  const [currentSettings, setCurrentSettings] = useState({
    // Text options
    textHeight: 3.5,
    textOffset: 1.0,
    textColor: '#ffffff',
    textFont: 'Arial',
    
    // Arrow options
    arrowSize: 3.0,
    arrowType: 'filled',
    extensionLineOffset: 1.5,
    extensionLineExtension: 1.0,
    
    // Unit options
    precision: 2,
    unitFormat: 'decimal',
    unitScale: 1.0,
    suppressLeadingZeros: false,
    suppressTrailingZeros: false,
    
    // Tolerance options
    toleranceDisplay: 'none',
    upperTolerance: 0.1,
    lowerTolerance: 0.1,
    tolerancePrecision: 2,
    
    // Standard
    standard: 'ISO'
  });
  
  // Default dimension styles
  const defaultStyles = [
    { id: 'standard', name: 'Standard', standard: 'ISO' },
    { id: 'mechanical', name: 'Mechanical', standard: 'ISO' },
    { id: 'architectural', name: 'Architectural', standard: 'ANSI' },
    { id: 'civil', name: 'Civil', standard: 'ANSI' },
    { id: 'metric', name: 'Metric', standard: 'ISO' }
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
  
  // Handle setting change
  const handleSettingChange = (setting: string, value: any) => {
    setCurrentSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };
  
  // Create a new dimension style
  const createNewStyle = () => {
    const styleName = prompt('Enter a name for the new dimension style:');
    if (styleName) {
      // Implementation would depend on your store structure
      console.log('Create new style:', styleName);
    }
  };
  
  // Linear dimension tools
  const linearDimensionTools = [
    { id: 'dimension-linear', icon: <ArrowRight size={18} />, title: 'Linear Dimension' },
    { id: 'dimension-aligned', icon: <ArrowUp size={18} className="transform -rotate-45" />, title: 'Aligned Dimension' },
    { id: 'dimension-baseline', icon: <div className="flex items-center space-x-1">
        <div className="h-3 w-px bg-current"></div>
        <div className="h-px w-6 bg-current"></div>
        <div className="h-px w-6 bg-current"></div>
        <div className="h-3 w-px bg-current"></div>
      </div>, title: 'Baseline Dimension' },
    { id: 'dimension-continue', icon: <div className="flex items-center space-x-1">
        <div className="h-3 w-px bg-current"></div>
        <div className="h-px w-4 bg-current"></div>
        <div className="h-3 w-px bg-current"></div>
        <div className="h-px w-4 bg-current"></div>
        <div className="h-3 w-px bg-current"></div>
      </div>, title: 'Continue Dimension' },
    { id: 'dimension-ordinate', icon: <AlignLeft size={18} />, title: 'Ordinate Dimension' }
  ];
  
  // Angular dimension tools
  const angularDimensionTools = [
    { id: 'dimension-angular', icon: <Compass size={18} />, title: 'Angular Dimension' },
    { id: 'dimension-radius', icon: <CircleIcon size={18} />, title: 'Radius Dimension' },
    { id: 'dimension-diameter', icon: <Disc size={18} />, title: 'Diameter Dimension' },
    { id: 'dimension-leader', icon: <CornerRightUp size={18} />, title: 'Leader' }
  ];
  
  // Arrow styles
  const arrowStyles = [
    { id: 'filled', name: 'Filled', preview: '▶' },
    { id: 'open', name: 'Open', preview: '▷' },
    { id: 'dot', name: 'Dot', preview: '●' },
    { id: 'architectural', name: 'Architectural', preview: '/' },
    { id: 'oblique', name: 'Oblique', preview: '/' },
    { id: 'none', name: 'None', preview: '-' }
  ];
  
  return (
    <div className="h-full flex flex-col bg-gray-900 text-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <h2 className="text-lg font-semibold">Dimensioning</h2>
        <div className="flex space-x-2">
          <button 
            onClick={() => setDimensionPanel('basic')}
            className={`px-3 py-1 text-sm rounded ${
              dimensionPanel === 'basic' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Basic
          </button>
          <button 
            onClick={() => setDimensionPanel('advanced')}
            className={`px-3 py-1 text-sm rounded ${
              dimensionPanel === 'advanced' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Advanced
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {dimensionPanel === 'basic' ? (
          <div className="p-4">
            {/* Dimension Styles Dropdown */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400 mb-1">Dimension Style</label>
              <div className="flex space-x-2">
                <select
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
                  value={activeDimensionStyle || 'standard'}
                  onChange={(e) => setActiveDimensionStyle(e.target.value)}
                >
                  {defaultStyles.map(style => (
                    <option key={style.id} value={style.id}>{style.name}</option>
                  ))}
                </select>
                <button
                  onClick={createNewStyle}
                  className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded border border-gray-700"
                  title="Create New Style"
                >
                  <Settings size={16} />
                </button>
              </div>
            </div>
            
            {/* Linear Dimensions */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Linear Dimensions</h3>
              <div className="grid grid-cols-3 gap-2">
                {linearDimensionTools.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => setActiveTool(tool.id)}
                    className={`flex flex-col items-center p-2 border rounded-md ${
                      activeTool === tool.id
                        ? 'bg-blue-900 text-blue-300 border-blue-700'
                        : 'border-gray-700 text-gray-400 hover:bg-gray-800'
                    }`}
                    title={tool.title}
                  >
                    <div className="h-6 flex items-center justify-center mb-1">
                      {tool.icon}
                    </div>
                    <span className="text-xs truncate">{tool.title}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Angular & Radius Dimensions */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Angular & Radius Dimensions</h3>
              <div className="grid grid-cols-3 gap-2">
                {angularDimensionTools.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => setActiveTool(tool.id)}
                    className={`flex flex-col items-center p-2 border rounded-md ${
                      activeTool === tool.id
                        ? 'bg-blue-900 text-blue-300 border-blue-700'
                        : 'border-gray-700 text-gray-400 hover:bg-gray-800'
                    }`}
                    title={tool.title}
                  >
                    <div className="h-6 flex items-center justify-center mb-1">
                      {tool.icon}
                    </div>
                    <span className="text-xs truncate">{tool.title}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Quick Settings */}
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">Quick Settings</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Arrow Size
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    max="10"
                    step="0.5"
                    value={currentSettings.arrowSize}
                    onChange={(e) => handleSettingChange('arrowSize', parseFloat(e.target.value))}
                    className="w-full px-2 py-1.5 text-sm border border-gray-700 rounded bg-gray-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Text Size
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    step="0.5"
                    value={currentSettings.textHeight}
                    onChange={(e) => handleSettingChange('textHeight', parseFloat(e.target.value))}
                    className="w-full px-2 py-1.5 text-sm border border-gray-700 rounded bg-gray-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Extension Offset
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    step="0.5"
                    value={currentSettings.extensionLineOffset}
                    onChange={(e) => handleSettingChange('extensionLineOffset', parseFloat(e.target.value))}
                    className="w-full px-2 py-1.5 text-sm border border-gray-700 rounded bg-gray-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Text Position
                  </label>
                  <select
                    className="w-full px-2 py-1.5 text-sm border border-gray-700 rounded bg-gray-800 text-white"
                  >
                    <option value="above">Above Line</option>
                    <option value="center">Center</option>
                    <option value="below">Below Line</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            {/* Advanced Options */}
            
            {/* Text Options Section */}
            {renderSectionHeader('Text Options', 'textOptions')}
            {expandedSections.textOptions && (
              <div className="p-3 border-b border-gray-700">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Text Height</label>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      value={currentSettings.textHeight}
                      onChange={(e) => handleSettingChange('textHeight', parseFloat(e.target.value))}
                      className="w-full px-2 py-1.5 text-sm border border-gray-700 rounded bg-gray-800 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Text Offset</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={currentSettings.textOffset}
                      onChange={(e) => handleSettingChange('textOffset', parseFloat(e.target.value))}
                      className="w-full px-2 py-1.5 text-sm border border-gray-700 rounded bg-gray-800 text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Text Color</label>
                    <div className="flex">
                      <input
                        type="color"
                        value={currentSettings.textColor}
                        onChange={(e) => handleSettingChange('textColor', e.target.value)}
                        className="w-8 h-8 border-0 p-0 bg-transparent"
                      />
                      <input
                        type="text"
                        value={currentSettings.textColor}
                        onChange={(e) => handleSettingChange('textColor', e.target.value)}
                        className="w-full ml-2 px-2 py-1.5 text-sm border border-gray-700 rounded bg-gray-800 text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Text Font</label>
                    <select
                      value={currentSettings.textFont}
                      onChange={(e) => handleSettingChange('textFont', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-700 rounded bg-gray-800 text-white"
                    >
                      <option value="Arial">Arial</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Courier New">Courier New</option>
                      <option value="Verdana">Verdana</option>
                    </select>
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-xs text-gray-500 mb-1">Text Alignment</label>
                  <div className="flex space-x-2">
                    <button className="flex-1 py-1.5 text-center text-sm bg-blue-900 text-blue-300 rounded">Centered</button>
                    <button className="flex-1 py-1.5 text-center text-sm bg-gray-800 text-gray-300 hover:bg-gray-700 rounded">Left</button>
                    <button className="flex-1 py-1.5 text-center text-sm bg-gray-800 text-gray-300 hover:bg-gray-700 rounded">Right</button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Arrow Options Section */}
            {renderSectionHeader('Arrow Options', 'arrowOptions')}
            {expandedSections.arrowOptions && (
              <div className="p-3 border-b border-gray-700">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Arrow Size</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={currentSettings.arrowSize}
                      onChange={(e) => handleSettingChange('arrowSize', parseFloat(e.target.value))}
                      className="w-full px-2 py-1.5 text-sm border border-gray-700 rounded bg-gray-800 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Arrow Type</label>
                    <select
                      value={currentSettings.arrowType}
                      onChange={(e) => handleSettingChange('arrowType', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-700 rounded bg-gray-800 text-white"
                    >
                      {arrowStyles.map(style => (
                        <option key={style.id} value={style.id}>{style.name} {style.preview}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Extension Line Offset</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={currentSettings.extensionLineOffset}
                      onChange={(e) => handleSettingChange('extensionLineOffset', parseFloat(e.target.value))}
                      className="w-full px-2 py-1.5 text-sm border border-gray-700 rounded bg-gray-800 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Extension Line Extension</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={currentSettings.extensionLineExtension}
                      onChange={(e) => handleSettingChange('extensionLineExtension', parseFloat(e.target.value))}
                      className="w-full px-2 py-1.5 text-sm border border-gray-700 rounded bg-gray-800 text-white"
                    />
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {arrowStyles.map(style => (
                    <button
                      key={style.id}
                      onClick={() => handleSettingChange('arrowType', style.id)}
                      className={`flex items-center justify-center p-2 rounded ${
                        currentSettings.arrowType === style.id 
                          ? 'bg-blue-900 text-blue-300' 
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      <span className="text-lg mr-1">{style.preview}</span>
                      <span className="text-xs">{style.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Tolerance Options Section */}
            {renderSectionHeader('Tolerance Options', 'toleranceOptions')}
            {expandedSections.toleranceOptions && (
              <div className="p-3 border-b border-gray-700">
                <div className="mb-3">
                  <label className="block text-xs text-gray-500 mb-1">Tolerance Display</label>
                  <select
                    value={currentSettings.toleranceDisplay}
                    onChange={(e) => handleSettingChange('toleranceDisplay', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-700 rounded bg-gray-800 text-white"
                  >
                    <option value="none">None</option>
                    <option value="symmetric">Symmetric (±)</option>
                    <option value="deviation">Deviation</option>
                    <option value="limits">Limits</option>
                    <option value="basic">Basic</option>
                  </select>
                </div>
                
                {currentSettings.toleranceDisplay !== 'none' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Upper Tolerance</label>
                      <input
                        type="number"
                        step="0.01"
                        value={currentSettings.upperTolerance}
                        onChange={(e) => handleSettingChange('upperTolerance', parseFloat(e.target.value))}
                        className="w-full px-2 py-1.5 text-sm border border-gray-700 rounded bg-gray-800 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Lower Tolerance</label>
                      <input
                        type="number"
                        step="0.01"
                        value={currentSettings.lowerTolerance}
                        onChange={(e) => handleSettingChange('lowerTolerance', parseFloat(e.target.value))}
                        className="w-full px-2 py-1.5 text-sm border border-gray-700 rounded bg-gray-800 text-white"
                      />
                    </div>
                  </div>
                )}
                
                <div className="mt-3">
                  <label className="block text-xs text-gray-500 mb-1">Tolerance Precision</label>
                  <select
                    value={currentSettings.tolerancePrecision}
                    onChange={(e) => handleSettingChange('tolerancePrecision', parseInt(e.target.value))}
                    className="w-full px-2 py-1.5 text-sm border border-gray-700 rounded bg-gray-800 text-white"
                  >
                    <option value="0">0</option>
                    <option value="1">0.0</option>
                    <option value="2">0.00</option>
                    <option value="3">0.000</option>
                    <option value="4">0.0000</option>
                  </select>
                </div>
                
                <div className="mt-3">
                  <label className="block text-xs text-gray-500 mb-1">Sample</label>
                  <div className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-center">
                    {currentSettings.toleranceDisplay === 'none' && (
                      <span>100.00</span>
                    )}
                    {currentSettings.toleranceDisplay === 'symmetric' && (
                      <span>100.00 ±{currentSettings.upperTolerance.toFixed(currentSettings.tolerancePrecision)}</span>
                    )}
                    {currentSettings.toleranceDisplay === 'deviation' && (
                      <div>
                        <span>100.00</span>
                        <div className="flex justify-center">
                          <span className="text-xs">+{currentSettings.upperTolerance.toFixed(currentSettings.tolerancePrecision)}</span>
                          <span className="text-xs mx-1">/</span>
                          <span className="text-xs">-{currentSettings.lowerTolerance.toFixed(currentSettings.tolerancePrecision)}</span>
                        </div>
                      </div>
                    )}
                    {currentSettings.toleranceDisplay === 'limits' && (
                      <div>
                        <div>{(100 + currentSettings.upperTolerance).toFixed(currentSettings.tolerancePrecision)}</div>
                        <div>{(100 - currentSettings.lowerTolerance).toFixed(currentSettings.tolerancePrecision)}</div>
                      </div>
                    )}
                    {currentSettings.toleranceDisplay === 'basic' && (
                      <span>⌀100.00</span>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Units Section */}
            {renderSectionHeader('Units', 'units')}
            {expandedSections.units && (
              <div className="p-3 border-b border-gray-700">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Unit Format</label>
                    <select
                      value={currentSettings.unitFormat}
                      onChange={(e) => handleSettingChange('unitFormat', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-700 rounded bg-gray-800 text-white"
                    >
                      <option value="decimal">Decimal</option>
                      <option value="engineering">Engineering</option>
                      <option value="architectural">Architectural</option>
                      <option value="fractional">Fractional</option>
                      <option value="scientific">Scientific</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Precision</label>
                    <select
                      value={currentSettings.precision}
                      onChange={(e) => handleSettingChange('precision', parseInt(e.target.value))}
                      className="w-full px-2 py-1.5 text-sm border border-gray-700 rounded bg-gray-800 text-white"
                    >
                      <option value="0">0</option>
                      <option value="1">0.0</option>
                      <option value="2">0.00</option>
                      <option value="3">0.000</option>
                      <option value="4">0.0000</option>
                    </select>
                  </div>
                </div>
                
                <div className="mb-3">
                  <label className="block text-xs text-gray-500 mb-1">Unit Scale</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={currentSettings.unitScale}
                    onChange={(e) => handleSettingChange('unitScale', parseFloat(e.target.value))}
                    className="w-full px-2 py-1.5 text-sm border border-gray-700 rounded bg-gray-800 text-white"
                  />
                </div>
                
                <div className="mb-3">
                  <label className="block text-xs text-gray-500 mb-1">Suffix</label>
                  <input
                    type="text"
                    placeholder="mm"
                    className="w-full px-2 py-1.5 text-sm border border-gray-700 rounded bg-gray-800 text-white"
                  />
                </div>
                
                <div className="flex space-x-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="suppressLeadingZeros"
                      checked={currentSettings.suppressLeadingZeros}
                      onChange={(e) => handleSettingChange('suppressLeadingZeros', e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor="suppressLeadingZeros" className="text-xs text-gray-300">
                      Suppress Leading Zeros
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="suppressTrailingZeros"
                      checked={currentSettings.suppressTrailingZeros}
                      onChange={(e) => handleSettingChange('suppressTrailingZeros', e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor="suppressTrailingZeros" className="text-xs text-gray-300">
                      Suppress Trailing Zeros
                    </label>
                  </div>
                </div>
              </div>
            )}
            
            {/* Standard Selection */}
            <div className="p-3">
              <label className="block text-sm font-medium text-gray-400 mb-2">Dimension Standard</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleSettingChange('standard', 'ISO')}
                  className={`p-2 rounded ${
                    currentSettings.standard === 'ISO' 
                      ? 'bg-blue-900 text-blue-300' 
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  ISO
                </button>
                <button
                  onClick={() => handleSettingChange('standard', 'ANSI')}
                  className={`p-2 rounded ${
                    currentSettings.standard === 'ANSI' 
                      ? 'bg-blue-900 text-blue-300' 
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  ANSI
                </button>
                <button
                  onClick={() => handleSettingChange('standard', 'JIS')}
                  className={`p-2 rounded ${
                    currentSettings.standard === 'JIS' 
                      ? 'bg-blue-900 text-blue-300' 
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  JIS
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Panel Footer */}
      <div className="border-t border-gray-700 p-3 flex justify-between">
        <button
          className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded"
          onClick={() => {
            // Apply current settings
            console.log('Apply dimension settings:', currentSettings);
          }}
        >
          Apply
        </button>
        
        <div className="flex space-x-2">
          <button
            className="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded border border-gray-700"
            onClick={() => {
              // Reset to default settings
              console.log('Reset to defaults');
            }}
          >
            Reset
          </button>
          
          <button
            className="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded border border-gray-700"
            onClick={() => {
              // Save current settings as a new style
              createNewStyle();
            }}
          >
            Save As...
          </button>
        </div>
      </div>
    </div>
  );
};