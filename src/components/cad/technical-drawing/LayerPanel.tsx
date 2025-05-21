// src/components/cad/technical-drawing/LayerPanel.tsx

import React, { useState, useEffect } from 'react';
import { useTechnicalDrawingStore } from '../../../store/technicalDrawingStore';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Plus, 
  Trash2, 
  Edit2, 
  Copy, 
  ChevronDown, 
  ChevronRight,
  Settings,
  Save,
  List,
  Layers as LayersIcon,
  Filter,
  X
} from 'react-feather';

interface LayerPanelProps {
  onClose?: () => void;
}

export const LayerPanel: React.FC<LayerPanelProps> = ({ onClose }) => {
  const { 
    drawingLayers, 
    activeLayer, 
    setActiveLayer, 
    addLayer, 
    updateLayer, 
    deleteLayer,
    entities,
    dimensions,
    annotations
  } = useTechnicalDrawingStore();
  
  const [filterText, setFilterText] = useState('');
  const [isAddingLayer, setIsAddingLayer] = useState(false);
  const [isEditingLayer, setIsEditingLayer] = useState<string | null>(null);
  const [layerStates, setLayerStates] = useState<{id: string, name: string}[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState({
    name: '',
    color: '#ffffff',
    lineType: 'solid',
    lineWeight: 1,
    description: '',
    isVisible: true,
    isLocked: false
  });
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    filters: false,
    states: false
  });
  
  // Predefined colors for the color picker
  const predefinedColors = [
    '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff',
    '#ffffff', '#000000', '#808080', '#c0c0c0', '#800000', '#808000',
    '#008000', '#800080', '#008080', '#000080', '#ff8000', '#00ff80',
    '#80ff00', '#8000ff', '#ff0080', '#0080ff'
  ];
  
  // Line types
  const lineTypes = [
    { id: 'solid', name: 'Solid', pattern: null },
    { id: 'dashed', name: 'Dashed', pattern: [8, 4] },
    { id: 'dotted', name: 'Dotted', pattern: [2, 2] },
    { id: 'dashdot', name: 'Dash Dot', pattern: [8, 4, 2, 4] },
    { id: 'center', name: 'Center', pattern: [16, 4, 4, 4] },
    { id: 'phantom', name: 'Phantom', pattern: [16, 4, 4, 4, 4, 4] },
    { id: 'hidden', name: 'Hidden', pattern: [4, 4] }
  ];
  
  // Line weights
  const lineWeights = [0.13, 0.18, 0.25, 0.35, 0.5, 0.7, 1, 1.4, 2];
  
  // Get filtered layers
  const filteredLayers = drawingLayers
    .filter(layer => filterText === '' || layer.name.toLowerCase().includes(filterText.toLowerCase()));
  
  // Handle layer selection
  const handleLayerSelect = (layerId: string) => {
    setActiveLayer(layerId);
  };
  
  // Toggle layer visibility
  const handleToggleVisibility = (layerId: string, currentVisibility: boolean) => {
    updateLayer(layerId, { visible: !currentVisibility });
  };
  
  // Toggle layer lock state
  const handleToggleLock = (layerId: string, currentLock: boolean) => {
    updateLayer(layerId, { locked: !currentLock });
  };
  
  // Start adding a new layer
  const handleAddLayer = () => {
    setEditingValues({
      name: `Layer ${drawingLayers.length + 1}`,
      color: predefinedColors[drawingLayers.length % predefinedColors.length],
      lineType: 'solid',
      lineWeight: 1,
      description: '',
      isVisible: true,
      isLocked: false
    });
    setIsAddingLayer(true);
    setIsEditingLayer(null);
  };
  
  // Start editing an existing layer
  const handleEditLayer = (layerId: string) => {
    const layer = drawingLayers.find(l => l.id === layerId);
    if (layer) {
      setEditingValues({
        name: layer.name,
        color: layer.color || '#ffffff',
        lineType: layer.lineType || 'solid',
        lineWeight: layer.lineWeight || 1,
        description: layer.description || '',
        isVisible: layer.visible !== false,
        isLocked: layer.locked === true
      });
      setIsEditingLayer(layerId);
      setIsAddingLayer(false);
    }
  };
  
  // Cancel adding/editing a layer
  const handleCancelEdit = () => {
    setIsAddingLayer(false);
    setIsEditingLayer(null);
  };
  
  // Save a new layer
  const handleSaveNewLayer = () => {
    addLayer({
      name: editingValues.name,
      color: editingValues.color,
      lineType: editingValues.lineType,
      lineWeight: editingValues.lineWeight,
      description: editingValues.description,
      visible: editingValues.isVisible,
      locked: editingValues.isLocked
    });
    setIsAddingLayer(false);
  };
  
  // Save changes to an existing layer
  const handleSaveLayerChanges = () => {
    if (isEditingLayer) {
      updateLayer(isEditingLayer, {
        name: editingValues.name,
        color: editingValues.color,
        lineType: editingValues.lineType,
        lineWeight: editingValues.lineWeight,
        description: editingValues.description,
        visible: editingValues.isVisible,
        locked: editingValues.isLocked
      });
      setIsEditingLayer(null);
    }
  };
  
  // Confirm delete layer
  const handleConfirmDelete = (layerId: string) => {
    // Check if the layer is in use
    const layerInUse = Object.values(entities).some(entity => entity.layer === layerId) ||
                     Object.values(dimensions).some(dim => dim.layer === layerId) ||
                     Object.values(annotations).some(ann => ann.layer === layerId);
    
    if (layerInUse) {
      alert('Cannot delete a layer that has objects on it. Move or delete the objects first.');
      setConfirmDelete(null);
      return;
    }
    
    // Don't allow deleting the default layer
    if (layerId === '0' || layerId === 'default') {
      alert('Cannot delete the default layer.');
      setConfirmDelete(null);
      return;
    }
    
    deleteLayer(layerId);
    setConfirmDelete(null);
  };
  
  // Duplicate a layer
  const handleDuplicateLayer = (layerId: string) => {
    const layer = drawingLayers.find(l => l.id === layerId);
    if (layer) {
      addLayer({
        name: `${layer.name} Copy`,
        color: layer.color,
        lineType: layer.lineType,
        lineWeight: layer.lineWeight,
        description: layer.description,
        visible: layer.visible,
        locked: layer.locked
      });
    }
  };
  
  // Save current layer state
  const handleSaveLayerState = () => {
    const stateName = prompt('Enter a name for this layer state:');
    if (stateName) {
      // Create a snapshot of the current layer visibility and lock status
      const layerState = {
        id: `state_${Date.now()}`,
        name: stateName,
        layers: drawingLayers.map(layer => ({
          id: layer.id,
          visible: layer.visible,
          locked: layer.locked
        }))
      };
      
      setLayerStates(prev => [...prev, { id: layerState.id, name: stateName }]);
    }
  };
  
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
  
  // Count entities on each layer
  const getLayerCounts = (layerId: string) => {
    const entityCount = Object.values(entities).filter(entity => entity.layer === layerId).length;
    const dimensionCount = Object.values(dimensions).filter(dim => dim.layer === layerId).length;
    const annotationCount = Object.values(annotations).filter(ann => ann.layer === layerId).length;
    
    return entityCount + dimensionCount + annotationCount;
  };
  
  // Rendering the color picker
  const renderColorPicker = () => (
    <div className="absolute z-50 mt-1 p-2 bg-gray-800 border border-gray-700 rounded shadow-lg">
      <div className="grid grid-cols-6 gap-1 mb-2">
        {predefinedColors.map(color => (
          <button
            key={color}
            onClick={() => {
              setEditingValues(prev => ({ ...prev, color }));
              setShowColorPicker(null);
            }}
            className="w-5 h-5 rounded-sm border border-gray-600"
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>
      <div className="pt-2 border-t border-gray-700">
        <input
          type="color"
          value={editingValues.color}
          onChange={(e) => setEditingValues(prev => ({ ...prev, color: e.target.value }))}
          className="w-full h-8 bg-transparent cursor-pointer border-0 p-0"
        />
      </div>
    </div>
  );
  
  // Render the form for adding/editing a layer
  const renderLayerForm = () => (
    <div className="p-3 border-b border-gray-700">
      <div className="mb-3">
        <label className="block text-xs text-gray-500 mb-1">Layer Name</label>
        <input
          type="text"
          value={editingValues.name}
          onChange={(e) => setEditingValues(prev => ({ ...prev, name: e.target.value }))}
          className="w-full px-2 py-1.5 text-sm border border-gray-700 rounded bg-gray-800 text-white"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Color</label>
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(showColorPicker ? null : 'main')}
              className="flex items-center w-full px-2 py-1.5 text-sm border border-gray-700 rounded bg-gray-800 text-white"
            >
              <div
                className="w-4 h-4 rounded-sm border border-gray-600 mr-2"
                style={{ backgroundColor: editingValues.color }}
              />
              <span>{editingValues.color}</span>
            </button>
            
            {showColorPicker === 'main' && renderColorPicker()}
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Line Type</label>
          <select
            value={editingValues.lineType}
            onChange={(e) => setEditingValues(prev => ({ ...prev, lineType: e.target.value }))}
            className="w-full px-2 py-1.5 text-sm border border-gray-700 rounded bg-gray-800 text-white"
          >
            {lineTypes.map(type => (
              <option key={type.id} value={type.id}>{type.name}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="mb-3">
        <label className="block text-xs text-gray-500 mb-1">Line Weight</label>
        <select
          value={editingValues.lineWeight}
          onChange={(e) => setEditingValues(prev => ({ ...prev, lineWeight: parseFloat(e.target.value) }))}
          className="w-full px-2 py-1.5 text-sm border border-gray-700 rounded bg-gray-800 text-white"
        >
          {lineWeights.map(weight => (
            <option key={weight} value={weight}>{weight} mm</option>
          ))}
        </select>
      </div>
      
      <div className="mb-3">
        <label className="block text-xs text-gray-500 mb-1">Description</label>
        <input
          type="text"
          value={editingValues.description}
          onChange={(e) => setEditingValues(prev => ({ ...prev, description: e.target.value }))}
          className="w-full px-2 py-1.5 text-sm border border-gray-700 rounded bg-gray-800 text-white"
        />
      </div>
      
      <div className="flex space-x-4 mb-3">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="layerVisible"
            checked={editingValues.isVisible}
            onChange={(e) => setEditingValues(prev => ({ ...prev, isVisible: e.target.checked }))}
            className="mr-2"
          />
          <label htmlFor="layerVisible" className="text-xs text-gray-300">Visible</label>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="layerLocked"
            checked={editingValues.isLocked}
            onChange={(e) => setEditingValues(prev => ({ ...prev, isLocked: e.target.checked }))}
            className="mr-2"
          />
          <label htmlFor="layerLocked" className="text-xs text-gray-300">Locked</label>
        </div>
      </div>
      
      <div className="flex justify-end space-x-2">
        <button
          onClick={handleCancelEdit}
          className="px-3 py-1.5 text-sm bg-gray-800 text-gray-300 hover:bg-gray-700 rounded border border-gray-700"
        >
          Cancel
        </button>
        
        <button
          onClick={isAddingLayer ? handleSaveNewLayer : handleSaveLayerChanges}
          className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded"
        >
          {isAddingLayer ? 'Add Layer' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
  
  return (
    <div className="h-full flex flex-col bg-gray-900 text-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <h2 className="text-lg font-semibold">Layer Manager</h2>
        {onClose && (
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white"
          >
            <X size={16} />
          </button>
        )}
      </div>
      
      <div className="p-3 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search layers..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-700 rounded bg-gray-800 text-white"
            />
            <Filter size={14} className="absolute left-2.5 top-2 text-gray-500" />
          </div>
          
          <button
            onClick={handleAddLayer}
            className="p-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white"
            title="Add New Layer"
          >
            <Plus size={16} />
          </button>
          
          <button
            onClick={handleSaveLayerState}
            className="p-1.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700"
            title="Save Layer State"
          >
            <Save size={16} />
          </button>
        </div>
      </div>
      
      {/* Layer editing form */}
      {(isAddingLayer || isEditingLayer) && renderLayerForm()}
      
      {/* Filter & States Sections */}
      {renderSectionHeader('Filters & Groups', 'filters')}
      {expandedSections.filters && (
        <div className="p-3 border-b border-gray-700">
          <div className="space-y-2">
            <button
              onClick={() => drawingLayers.forEach(layer => updateLayer(layer.id, { visible: true }))}
              className="flex items-center w-full px-3 py-1.5 text-sm text-left bg-gray-800 hover:bg-gray-700 rounded"
            >
              <Eye size={14} className="mr-2 text-gray-400" />
              <span className="text-gray-300">Show All Layers</span>
            </button>
            
            <button
              onClick={() => drawingLayers.forEach(layer => updateLayer(layer.id, { visible: false }))}
              className="flex items-center w-full px-3 py-1.5 text-sm text-left bg-gray-800 hover:bg-gray-700 rounded"
            >
              <EyeOff size={14} className="mr-2 text-gray-400" />
              <span className="text-gray-300">Hide All Layers</span>
            </button>
            
            <button
              onClick={() => drawingLayers.forEach(layer => updateLayer(layer.id, { locked: false }))}
              className="flex items-center w-full px-3 py-1.5 text-sm text-left bg-gray-800 hover:bg-gray-700 rounded"
            >
              <Unlock size={14} className="mr-2 text-gray-400" />
              <span className="text-gray-300">Unlock All Layers</span>
            </button>
            
            <button
              onClick={() => {
                // Invert visibility
                drawingLayers.forEach(layer => 
                  updateLayer(layer.id, { visible: !layer.visible })
                );
              }}
              className="flex items-center w-full px-3 py-1.5 text-sm text-left bg-gray-800 hover:bg-gray-700 rounded"
            >
              <LayersIcon size={14} className="mr-2 text-gray-400" />
              <span className="text-gray-300">Invert Visibility</span>
            </button>
          </div>
        </div>
      )}
      
      {renderSectionHeader('Layer States', 'states')}
      {expandedSections.states && (
        <div className="p-3 border-b border-gray-700">
          {layerStates.length > 0 ? (
            <div className="space-y-1">
              {layerStates.map(state => (
                <button
                  key={state.id}
                  className="flex items-center w-full px-3 py-1.5 text-sm text-left bg-gray-800 hover:bg-gray-700 rounded"
                >
                  <LayersIcon size={14} className="mr-2 text-gray-400" />
                  <span className="text-gray-300">{state.name}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center p-3 text-gray-500 text-sm italic">
              No layer states saved. Use the save button to create a layer state.
            </div>
          )}
        </div>
      )}
      
      {/* Layer List */}
      <div className="flex-1 overflow-y-auto">
        {filteredLayers.length > 0 ? (
          <div>
            {/* Header */}
            <div className="sticky top-0 z-10 grid grid-cols-8 gap-1 px-3 py-2 text-xs font-medium text-gray-400 bg-gray-850 border-b border-gray-700">
              <div className="col-span-1">Status</div>
              <div className="col-span-3">Layer Name</div>
              <div className="col-span-1">Color</div>
              <div className="col-span-1">Type</div>
              <div className="col-span-1">Weight</div>
              <div className="col-span-1">Count</div>
            </div>
            
            {/* Layers */}
            {filteredLayers.map(layer => (
              <div 
                key={layer.id}
                className={`grid grid-cols-8 gap-1 px-2 py-1.5 text-sm border-b border-gray-800 ${
                  activeLayer === layer.id ? 'bg-blue-900/30' : 'hover:bg-gray-800'
                }`}
              >
                {/* Status Icons */}
                <div className="col-span-1 flex items-center space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleVisibility(layer.id, layer.visible !== false);
                    }}
                    className="p-1 rounded-sm hover:bg-gray-700"
                    title={layer.visible === false ? "Show Layer" : "Hide Layer"}
                  >
                    {layer.visible === false ? (
                      <EyeOff size={14} className="text-gray-500" />
                    ) : (
                      <Eye size={14} className="text-gray-300" />
                    )}
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleLock(layer.id, layer.locked === true);
                    }}
                    className="p-1 rounded-sm hover:bg-gray-700"
                    title={layer.locked ? "Unlock Layer" : "Lock Layer"}
                  >
                    {layer.locked ? (
                      <Lock size={14} className="text-gray-300" />
                    ) : (
                      <Unlock size={14} className="text-gray-500" />
                    )}
                  </button>
                </div>
                
                {/* Layer Name */}
                <div 
                  className={`col-span-3 flex items-center ${
                    activeLayer === layer.id ? 'text-blue-300 font-medium' : 'text-gray-300'
                  }`}
                  onClick={() => handleLayerSelect(layer.id)}
                >
                  <span className="truncate">{layer.name}</span>
                </div>
                
                {/* Color */}
                <div className="col-span-1 flex items-center">
                  <div 
                    className="w-4 h-4 rounded-sm"
                    style={{ backgroundColor: layer.color || '#ffffff' }}
                  ></div>
                </div>
                
                {/* Line Type */}
                <div className="col-span-1 flex items-center">
                  <div 
                    className="w-8 h-px bg-white"
                    style={{
                      borderTop: layer.lineType === 'solid' || !layer.lineType 
                        ? '1px solid white' 
                        : `1px ${layer.lineType} white`
                    }}
                  ></div>
                </div>
                
                {/* Line Weight */}
                <div className="col-span-1 text-gray-300 text-xs">
                  {layer.lineWeight || 1} mm
                </div>
                
                {/* Entity Count */}
                <div className="col-span-1 text-gray-300 text-xs">
                  {getLayerCounts(layer.id)}
                </div>
                
                {/* Context Menu (conditionally rendered) */}
                {activeLayer === layer.id && (
                  <div className="fixed mt-6 ml-24 bg-gray-800 border border-gray-700 rounded shadow-lg z-10 w-40">
                    <div className="py-1">
                      <button
                        onClick={() => handleEditLayer(layer.id)}
                        className="flex items-center w-full text-left px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-700"
                      >
                        <Edit2 size={14} className="mr-2 text-gray-400" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDuplicateLayer(layer.id)}
                        className="flex items-center w-full text-left px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-700"
                      >
                        <Copy size={14} className="mr-2 text-gray-400" />
                        <span>Duplicate</span>
                      </button>
                      <button
                        onClick={() => setConfirmDelete(layer.id)}
                        className="flex items-center w-full text-left px-3 py-1.5 text-sm text-red-400 hover:bg-gray-700"
                      >
                        <Trash2 size={14} className="mr-2" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-gray-500">
            {filterText ? 'No layers match your search.' : 'No layers found.'}
          </div>
        )}
      </div>
      
      {/* Layer Action Buttons */}
      <div className="border-t border-gray-700 p-3 flex justify-between">
        <button
          onClick={handleAddLayer}
          className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center"
        >
          <Plus size={14} className="mr-1" />
          <span>New Layer</span>
        </button>
        
        <div className="flex space-x-2">
          <button
            onClick={() => {/* Select all objects on the current layer */}}
            className="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded border border-gray-700"
          >
            Select All
          </button>
          
          <button
            className="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded border border-gray-700"
            title="Layer Settings"
          >
            <Settings size={14} />
          </button>
        </div>
      </div>
      
      {/* Confirmation Dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-4 w-80">
            <h3 className="text-lg font-medium text-white mb-2">Delete Layer</h3>
            <p className="text-gray-300 mb-4">
              Are you sure you want to delete this layer? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirmDelete(confirmDelete)}
                className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};