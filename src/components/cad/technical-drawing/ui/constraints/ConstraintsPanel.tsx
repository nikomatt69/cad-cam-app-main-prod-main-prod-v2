// src/components/cad/technical-drawing/ui/constraints/ConstraintsPanel.tsx

import React, { useState } from 'react';
import { useTechnicalDrawingStore } from '../../enhancedTechnicalDrawingStore';
import { ConstraintType } from '../../core/constraints/ConstraintTypes';
import DockPanel from '../panels/DockPanel';
import { Link, Move, Square, Circle, Ruler, Lock, Eye, EyeOff, Trash2, Play, Pause } from 'lucide-react';

const ConstraintsPanel: React.FC = () => {
  const [selectedConstraintType, setSelectedConstraintType] = useState<ConstraintType>(ConstraintType.DISTANCE);
  const [constraintValue, setConstraintValue] = useState<string>('');

  const {
    selectedEntityIds,
    createConstraint,
    removeConstraint,
    toggleConstraint,
    getConstraintsForEntity,
    solveConstraints,
    createAutoConstraints,
    autoSolveConstraints,
    setAutoSolveConstraints
  } = useTechnicalDrawingStore();

  // Get all constraints for selected entities
  const relevantConstraints = selectedEntityIds.flatMap(id => 
    getConstraintsForEntity(id)
  ).filter((constraint, index, self) => 
    self.findIndex(c => c.id === constraint.id) === index
  );

  const constraintTypes = [
    { type: ConstraintType.DISTANCE, label: 'Distance', icon: <Ruler size={16} />, requiresValue: true },
    { type: ConstraintType.PARALLEL, label: 'Parallel', icon: <Move size={16} />, requiresValue: false },
    { type: ConstraintType.PERPENDICULAR, label: 'Perpendicular', icon: <Square size={16} />, requiresValue: false },
    { type: ConstraintType.HORIZONTAL, label: 'Horizontal', icon: <Move size={16} />, requiresValue: false },
    { type: ConstraintType.VERTICAL, label: 'Vertical', icon: <Move size={16} />, requiresValue: false },
    { type: ConstraintType.COINCIDENT, label: 'Coincident', icon: <Circle size={16} />, requiresValue: false },
    { type: ConstraintType.CONCENTRIC, label: 'Concentric', icon: <Circle size={16} />, requiresValue: false },
    { type: ConstraintType.TANGENT, label: 'Tangent', icon: <Circle size={16} />, requiresValue: false },
    { type: ConstraintType.FIX, label: 'Fix', icon: <Lock size={16} />, requiresValue: false }
  ];

  const currentConstraintType = constraintTypes.find(ct => ct.type === selectedConstraintType);

  const handleCreateConstraint = () => {
    if (selectedEntityIds.length === 0) return;

    const parameters: Record<string, any> = {};
    
    if (currentConstraintType?.requiresValue && constraintValue) {
      const numValue = parseFloat(constraintValue);
      if (!isNaN(numValue)) {
        if (selectedConstraintType === ConstraintType.DISTANCE) {
          parameters.distance = numValue;
        } else if (selectedConstraintType === ConstraintType.ANGLE) {
          parameters.angle = numValue;
        }
      }
    }

    const constraintId = createConstraint({
      type: selectedConstraintType,
      entityIds: selectedEntityIds,
      parameters
    });

    if (constraintId) {
      setConstraintValue('');
      console.log(`✅ Constraint created: ${selectedConstraintType}`);
    }
  };

  const handleRemoveConstraint = (constraintId: string) => {
    removeConstraint(constraintId);
  };

  const handleToggleConstraint = (constraintId: string, active: boolean) => {
    toggleConstraint(constraintId, active);
  };

  const handleSolveConstraints = async () => {
    try {
      const solutions = await solveConstraints();
      console.log(`🔧 Solved ${solutions.length} constraints`);
    } catch (error) {
      console.error('Failed to solve constraints:', error);
    }
  };

  const handleCreateAutoConstraints = () => {
    if (selectedEntityIds.length < 2) return;
    
    const createdConstraints = createAutoConstraints(selectedEntityIds);
    console.log(`🤖 Auto-created ${createdConstraints.length} constraints`);
  };

  const canCreateConstraint = () => {
    if (selectedEntityIds.length === 0) return false;
    
    switch (selectedConstraintType) {
      case ConstraintType.HORIZONTAL:
      case ConstraintType.VERTICAL:
      case ConstraintType.FIX:
        return selectedEntityIds.length === 1;
      case ConstraintType.DISTANCE:
      case ConstraintType.PARALLEL:
      case ConstraintType.PERPENDICULAR:
      case ConstraintType.TANGENT:
      case ConstraintType.CONCENTRIC:
        return selectedEntityIds.length === 2;
      case ConstraintType.COINCIDENT:
        return selectedEntityIds.length >= 2;
      default:
        return selectedEntityIds.length > 0;
    }
  };

  return (
    <DockPanel title="Parametric Constraints" collapsible={true} resizable={true}>
      <div className="space-y-4">
        {/* Auto-Solve Toggle */}
        <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
            Auto-Solve Constraints
          </span>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={autoSolveConstraints}
              onChange={(e) => setAutoSolveConstraints(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-blue-800 dark:text-blue-200">
              {autoSolveConstraints ? 'On' : 'Off'}
            </span>
          </label>
        </div>

        {/* Constraint Creation */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
            Create Constraint
          </h4>

          {/* Constraint Type Selection */}
          <div className="grid grid-cols-3 gap-2">
            {constraintTypes.map(ct => (
              <button
                key={ct.type}
                onClick={() => setSelectedConstraintType(ct.type)}
                className={`flex flex-col items-center p-2 rounded-lg border text-xs transition-all ${
                  selectedConstraintType === ct.type
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'
                }`}
                title={ct.label}
              >
                <div className="mb-1">{ct.icon}</div>
                <span>{ct.label}</span>
              </button>
            ))}
          </div>

          {/* Constraint Value Input */}
          {currentConstraintType?.requiresValue && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {selectedConstraintType === ConstraintType.DISTANCE ? 'Distance' : 'Value'}
              </label>
              <input
                type="number"
                value={constraintValue}
                onChange={(e) => setConstraintValue(e.target.value)}
                placeholder="Enter value"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          )}

          {/* Create Constraint Button */}
          <div className="flex space-x-2">
            <button
              onClick={handleCreateConstraint}
              disabled={!canCreateConstraint()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              Create Constraint
            </button>
            <button
              onClick={handleCreateAutoConstraints}
              disabled={selectedEntityIds.length < 2}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              title="Auto-create constraints"
            >
              Auto
            </button>
          </div>

          {/* Selection Info */}
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {selectedEntityIds.length === 0 && 'Select entities to create constraints'}
            {selectedEntityIds.length === 1 && 'Selected: 1 entity'}
            {selectedEntityIds.length > 1 && `Selected: ${selectedEntityIds.length} entities`}
          </div>
        </div>

        {/* Active Constraints */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
              Active Constraints
            </h4>
            <button
              onClick={handleSolveConstraints}
              className="px-3 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700"
            >
              Solve All
            </button>
          </div>

          {relevantConstraints.length === 0 ? (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
              No constraints for selected entities
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {relevantConstraints.map(constraint => (
                <div
                  key={constraint.id}
                  className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      constraint.active ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                    <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                      {constraint.type.replace('_', ' ')}
                    </span>
                    {constraint.parameters.distance && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ({constraint.parameters.distance})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleToggleConstraint(constraint.id, !constraint.active)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                      title={constraint.active ? 'Disable constraint' : 'Enable constraint'}
                    >
                      {constraint.active ? (
                        <Pause size={14} className="text-orange-600" />
                      ) : (
                        <Play size={14} className="text-green-600" />
                      )}
                    </button>
                    
                    <button
                      onClick={() => handleRemoveConstraint(constraint.id)}
                      className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                      title="Remove constraint"
                    >
                      <Trash2 size={14} className="text-red-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Help Text */}
        <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-2 rounded">
          <strong>Tip:</strong> Select entities first, then choose a constraint type. 
          Constraints will automatically solve when enabled.
        </div>
      </div>
    </DockPanel>
  );
};

export default ConstraintsPanel;
