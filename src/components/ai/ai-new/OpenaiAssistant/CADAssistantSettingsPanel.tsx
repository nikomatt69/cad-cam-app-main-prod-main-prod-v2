import React from 'react';
import { Sliders, Cpu, Zap, DollarSign, Save, AlertTriangle, Settings } from 'react-feather';
import { AIModelType } from '@/src/types/AITypes'; // Assuming AIModelType includes OpenAI models too
import { motion } from 'framer-motion';

// Define a type for the constraint presets you highlighted
// Adjust this based on the actual structure of your CONSTRAINT_PRESETS
interface ConstraintPreset {
  id: string;
  name: string;
  description: string;
  constraints: Record<string, any>;
}

interface CADAssistantSettingsPanelProps {
  // Current Settings Values
  selectedModel: AIModelType;
  maxTokens: number;
  complexity: number; // Assuming complexity is a number (e.g., 1-5 or 0-1)
  selectedPresetId: string;
  customMaxWidth: number;
  customMaxHeight: number;
  customMaxDepth: number;
  customPreferredTypes: string[]; // Array of type names
  
  // Available Options
  availableModels: AIModelType[]; // e.g., ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo']
  constraintPresets: ConstraintPreset[];
  availableElementTypes: string[]; // All possible element types for multi-select

  // Handlers
  onModelChange: (model: AIModelType) => void;
  onMaxTokensChange: (tokens: number) => void;
  onComplexityChange: (complexity: number) => void;
  onPresetChange: (presetId: string) => void;
  onCustomMaxWidthChange: (width: number) => void;
  onCustomMaxHeightChange: (height: number) => void;
  onCustomMaxDepthChange: (depth: number) => void;
  onCustomPreferredTypesChange: (types: string[]) => void;
}

export const CADAssistantSettingsPanel: React.FC<CADAssistantSettingsPanelProps> = ({
  selectedModel,
  maxTokens,
  complexity,
  selectedPresetId,
  customMaxWidth,
  customMaxHeight,
  customMaxDepth,
  customPreferredTypes,
  availableModels,
  constraintPresets,
  availableElementTypes,
  onModelChange,
  onMaxTokensChange,
  onComplexityChange,
  onPresetChange,
  onCustomMaxWidthChange,
  onCustomMaxHeightChange,
  onCustomMaxDepthChange,
  onCustomPreferredTypesChange,
}) => {

  // Handler for preset change - might need logic to update custom fields if needed
  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const presetId = e.target.value;
    onPresetChange(presetId);
    // Optional: Find the preset and update custom fields, or disable them
    // const selectedPreset = constraintPresets.find(p => p.id === presetId);
    // if (selectedPreset) { ... update custom fields ... }
  };

  // Handler for preferred types multi-select (example using simple select for now)
  // A proper multi-select component would be better here
  const handlePreferredTypesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    onCustomPreferredTypesChange(selectedOptions);
  };

  return (
    <motion.div 
      key="cad-settings-panel"
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="border-b border-gray-200 bg-gray-50 dark:bg-gray-800"
    >
      <div className="overflow-y-auto max-h-96">
        <div className="p-4 space-y-4">
          <h3 className="text-md font-semibold flex items-center text-gray-700 dark:text-gray-200">
            <Settings size={18} className="mr-2" /> CAD Assistant Settings
          </h3>

          {/* AI Model Selection */}
          <div>
            <label htmlFor="cad-ai-model" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              AI Model
            </label>
            <select
              id="cad-ai-model"
              value={selectedModel}
              onChange={(e) => onModelChange(e.target.value as AIModelType)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 text-sm"
            >
              {availableModels.map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
            {/* Add model description/cost if needed */}
          </div>

          {/* Max Tokens */}
          <div>
            <label htmlFor="cad-max-tokens" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Max Tokens: {maxTokens}
            </label>
            <input
              id="cad-max-tokens"
              type="range"
              min="500"
              max="8000" // Adjust max based on models
              step="100"
              value={maxTokens}
              onChange={(e) => onMaxTokensChange(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Complexity */}
          <div>
            <label htmlFor="cad-complexity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Complexity: {complexity.toFixed(1)} {/* Assuming 0-1 range */}
            </label>
            <input
              id="cad-complexity"
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={complexity}
              onChange={(e) => onComplexityChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
             <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>Simple</span>
              <span>Moderate</span>
              <span>Complex</span>
            </div>
          </div>

          {/* Constraint Preset Selection */}
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <label htmlFor="cad-constraint-preset" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Constraint Preset
            </label>
            <select
              id="cad-constraint-preset"
              value={selectedPresetId}
              onChange={handlePresetChange}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 text-sm"
            >
              <option value="custom">Custom</option> {/* Option for custom settings */}
              {constraintPresets.map(preset => (
                <option key={preset.id} value={preset.id}>{preset.name}</option>
              ))}
            </select>
            {constraintPresets.find(p => p.id === selectedPresetId) && (
               <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                 {constraintPresets.find(p => p.id === selectedPresetId)?.description}
               </p>
            )}
          </div>

          {/* Custom Constraints (shown when preset is 'custom' or maybe always?) */}
          {(selectedPresetId === 'custom') && (
            <div className="space-y-3 pl-2 border-l-2 border-blue-200 dark:border-blue-800">
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Custom Constraints</h4>
              {/* Max Dimensions */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label htmlFor="custom-max-width" className="block text-xs font-medium text-gray-600 dark:text-gray-400">Max W</label>
                  <input type="number" id="custom-max-width" value={customMaxWidth} onChange={(e) => onCustomMaxWidthChange(parseInt(e.target.value))} className="w-full p-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700" />
                </div>
                <div>
                  <label htmlFor="custom-max-height" className="block text-xs font-medium text-gray-600 dark:text-gray-400">Max H</label>
                  <input type="number" id="custom-max-height" value={customMaxHeight} onChange={(e) => onCustomMaxHeightChange(parseInt(e.target.value))} className="w-full p-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700" />
                </div>
                <div>
                  <label htmlFor="custom-max-depth" className="block text-xs font-medium text-gray-600 dark:text-gray-400">Max D</label>
                  <input type="number" id="custom-max-depth" value={customMaxDepth} onChange={(e) => onCustomMaxDepthChange(parseInt(e.target.value))} className="w-full p-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700" />
                </div>
              </div>
              {/* Preferred Types (Needs a better multi-select component) */}
              <div>
                <label htmlFor="custom-preferred-types" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Preferred Element Types
                </label>
                <select
                  multiple // This requires ctrl/cmd click for multiple selections, not ideal UX
                  id="custom-preferred-types"
                  value={customPreferredTypes}
                  onChange={handlePreferredTypesChange} // Use specific handler
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 text-sm h-24"
                >
                  {availableElementTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Select one or more preferred types (Ctrl/Cmd + Click).</p>
              </div>
            </div>
          )}

        </div>
      </div>
    </motion.div>
  );
};

// Need to import motion from framer-motion if not already available globally
// import { motion } from 'framer-motion';
