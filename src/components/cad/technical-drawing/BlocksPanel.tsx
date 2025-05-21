// src/components/cad/technical-drawing/BlocksPanel.tsx

import React, { useState } from 'react';
import { useTechnicalDrawingStore } from '../../../store/technicalDrawingStore';
import { 
  Grid, 
  Copy, 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  X,
  ChevronDown,
  ChevronRight, 
  Folder, 
  FolderPlus,
  Save,
  Upload,
  Download,
  RefreshCw
} from 'react-feather';

interface BlocksPanelProps {
  onClose?: () => void;
}

export const BlocksPanel: React.FC<BlocksPanelProps> = ({ 
  onClose 
}) => {
  const { activeTool, setActiveTool } = useTechnicalDrawingStore();
  
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [isCreatingBlock, setIsCreatingBlock] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    mechanical: true,
    electrical: false,
    architectural: false,
    custom: true
  });
  
  // Mock data for blocks - in a real application this would come from your store
  const blockCategories = [
    { id: 'all', name: 'All Blocks' },
    { id: 'mechanical', name: 'Mechanical' },
    { id: 'electrical', name: 'Electrical' },
    { id: 'architectural', name: 'Architectural' },
    { id: 'custom', name: 'Custom Blocks' }
  ];
  
  const blocks = [
    // Mechanical blocks
    { id: 'bolt-m4', name: 'Bolt M4', category: 'mechanical', preview: '⚙️' },
    { id: 'bolt-m5', name: 'Bolt M5', category: 'mechanical', preview: '⚙️' },
    { id: 'bolt-m6', name: 'Bolt M6', category: 'mechanical', preview: '⚙️' },
    { id: 'nut-m4', name: 'Nut M4', category: 'mechanical', preview: '⚙️' },
    { id: 'nut-m5', name: 'Nut M5', category: 'mechanical', preview: '⚙️' },
    { id: 'nut-m6', name: 'Nut M6', category: 'mechanical', preview: '⚙️' },
    { id: 'washer-m4', name: 'Washer M4', category: 'mechanical', preview: '⚙️' },
    { id: 'washer-m5', name: 'Washer M5', category: 'mechanical', preview: '⚙️' },
    { id: 'washer-m6', name: 'Washer M6', category: 'mechanical', preview: '⚙️' },
    { id: 'bearing', name: 'Bearing', category: 'mechanical', preview: '⚙️' },
    { id: 'gear', name: 'Gear', category: 'mechanical', preview: '⚙️' },
    { id: 'spring', name: 'Spring', category: 'mechanical', preview: '⚙️' },
    
    // Electrical blocks
    { id: 'resistor', name: 'Resistor', category: 'electrical', preview: '⚡' },
    { id: 'capacitor', name: 'Capacitor', category: 'electrical', preview: '⚡' },
    { id: 'inductor', name: 'Inductor', category: 'electrical', preview: '⚡' },
    { id: 'diode', name: 'Diode', category: 'electrical', preview: '⚡' },
    { id: 'transistor', name: 'Transistor', category: 'electrical', preview: '⚡' },
    { id: 'switch', name: 'Switch', category: 'electrical', preview: '⚡' },
    
    // Architectural blocks
    { id: 'door', name: 'Door', category: 'architectural', preview: '🚪' },
    { id: 'window', name: 'Window', category: 'architectural', preview: '🪟' },
    { id: 'stairs', name: 'Stairs', category: 'architectural', preview: '🪜' },
    { id: 'toilet', name: 'Toilet', category: 'architectural', preview: '🚽' },
    { id: 'sink', name: 'Sink', category: 'architectural', preview: '🚰' },
    { id: 'bathtub', name: 'Bathtub', category: 'architectural', preview: '🛁' },
    
    // Custom blocks
    { id: 'custom-1', name: 'My Block 1', category: 'custom', preview: '📦' },
    { id: 'custom-2', name: 'My Block 2', category: 'custom', preview: '📦' }
  ];
  
  // Filter blocks based on search and category
  const filteredBlocks = blocks.filter(block => {
    const matchesSearch = searchText === '' || 
      block.name.toLowerCase().includes(searchText.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || block.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  
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
  
  // Insert the selected block into the drawing
  const insertBlock = (blockId: string) => {
    console.log('Inserting block:', blockId);
    setActiveTool('insert-block');
    
    // In a real implementation, you would set up the tool with the selected block
  };
  
  // Create a new block from selected elements
  const createBlock = () => {
    setIsCreatingBlock(true);
  };
  
  // Complete block creation
  const completeBlockCreation = () => {
    // In a real implementation, you would collect the name and other details
    console.log('Creating new block');
    setIsCreatingBlock(false);
  };
  
  // Delete a block
  const deleteBlock = (blockId: string) => {
    if (confirm('Are you sure you want to delete this block? This action cannot be undone.')) {
      console.log('Deleting block:', blockId);
    }
  };
  
  // Import a block
  const importBlock = () => {
    setIsImporting(true);
  };
  
  // Export a block
  const exportBlock = (blockId: string) => {
    console.log('Exporting block:', blockId);
  };
  
  // Render the block creation form
  const renderBlockCreationForm = () => (
    <div className="p-4 border-b border-gray-700">
      <h3 className="text-sm font-semibold text-gray-300 mb-3">Create New Block</h3>
      
      <div className="mb-3">
        <label className="block text-xs text-gray-500 mb-1">Block Name</label>
        <input
          type="text"
          placeholder="Enter block name"
          className="w-full px-2 py-1.5 text-sm border border-gray-700 rounded bg-gray-800 text-white"
        />
      </div>
      
      <div className="mb-3">
        <label className="block text-xs text-gray-500 mb-1">Category</label>
        <select
          className="w-full px-2 py-1.5 text-sm border border-gray-700 rounded bg-gray-800 text-white"
        >
          <option value="mechanical">Mechanical</option>
          <option value="electrical">Electrical</option>
          <option value="architectural">Architectural</option>
          <option value="custom">Custom</option>
        </select>
      </div>
      
      <div className="mb-3">
        <label className="block text-xs text-gray-500 mb-1">Description</label>
        <input
          type="text"
          placeholder="Optional description"
          className="w-full px-2 py-1.5 text-sm border border-gray-700 rounded bg-gray-800 text-white"
        />
      </div>
      
      <div className="mb-3">
        <label className="block text-xs text-gray-500 mb-1">Base Point</label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <input
              type="number"
              placeholder="X"
              className="w-full px-2 py-1.5 text-sm border border-gray-700 rounded bg-gray-800 text-white"
            />
          </div>
          <div>
            <input
              type="number"
              placeholder="Y"
              className="w-full px-2 py-1.5 text-sm border border-gray-700 rounded bg-gray-800 text-white"
            />
          </div>
        </div>
      </div>
      
      <div className="flex justify-end space-x-2">
        <button
          onClick={() => setIsCreatingBlock(false)}
          className="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded border border-gray-700"
        >
          Cancel
        </button>
        <button
          onClick={completeBlockCreation}
          className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded"
        >
          Create Block
        </button>
      </div>
    </div>
  );
  
  // Render the import form
  const renderImportForm = () => (
    <div className="p-4 border-b border-gray-700">
      <h3 className="text-sm font-semibold text-gray-300 mb-3">Import Block</h3>
      
      <div className="mb-3">
        <label className="block text-xs text-gray-500 mb-1">Import From</label>
        <select
          className="w-full px-2 py-1.5 text-sm border border-gray-700 rounded bg-gray-800 text-white"
        >
          <option value="file">File</option>
          <option value="library">Block Library</option>
          <option value="drawing">Another Drawing</option>
        </select>
      </div>
      
      <div className="mb-3">
        <label className="block text-xs text-gray-500 mb-1">File</label>
        <div className="flex items-center">
          <input
            type="text"
            placeholder="Select file or enter URL"
            className="flex-1 px-2 py-1.5 text-sm border border-gray-700 rounded bg-gray-800 text-white"
          />
          <button className="ml-2 p-1.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700">
            <Upload size={14} />
          </button>
        </div>
      </div>
      
      <div className="flex justify-end space-x-2">
        <button
          onClick={() => setIsImporting(false)}
          className="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded border border-gray-700"
        >
          Cancel
        </button>
        <button
          onClick={() => setIsImporting(false)}
          className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded"
        >
          Import
        </button>
      </div>
    </div>
  );
  
  return (
    <div className="h-full flex flex-col bg-gray-900 text-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <h2 className="text-lg font-semibold">Blocks & Symbols</h2>
        {onClose && (
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white"
          >
            <X size={16} />
          </button>
        )}
      </div>
      
      {/* Search and Category Filter */}
      <div className="p-3 border-b border-gray-700">
        <div className="relative flex items-center mb-3">
          <input
            type="text"
            placeholder="Search blocks..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-700 rounded bg-gray-800 text-white"
          />
          <Search size={14} className="absolute left-2.5 top-2 text-gray-500" />
          {searchText && (
            <button
              onClick={() => setSearchText('')}
              className="absolute right-2.5 top-2 text-gray-500 hover:text-gray-300"
            >
              <X size={14} />
            </button>
          )}
        </div>
        
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-thin">
          {blockCategories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-3 py-1 text-xs whitespace-nowrap rounded-full ${
                selectedCategory === category.id 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>
      
      {/* Block Creation/Import Forms */}
      {isCreatingBlock && renderBlockCreationForm()}
      {isImporting && renderImportForm()}
      
      {/* Block Library */}
      <div className="flex-1 overflow-y-auto">
        {selectedCategory === 'all' ? (
          <>
            {expandedSections.mechanical && (
              <div className="mb-2">
                {renderSectionHeader('Mechanical Blocks', 'mechanical')}
                <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {filteredBlocks.filter(block => block.category === 'mechanical').map(block => (
                    <button
                      key={block.id}
                      onClick={() => setSelectedBlock(block.id)}
                      className={`flex flex-col items-center p-2 rounded ${
                        selectedBlock === block.id 
                          ? 'bg-blue-900 text-blue-300' 
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      <div className="text-2xl mb-1">{block.preview}</div>
                      <span className="text-xs truncate w-full text-center">{block.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {expandedSections.electrical && (
              <div className="mb-2">
                {renderSectionHeader('Electrical Blocks', 'electrical')}
                <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {filteredBlocks.filter(block => block.category === 'electrical').map(block => (
                    <button
                      key={block.id}
                      onClick={() => setSelectedBlock(block.id)}
                      className={`flex flex-col items-center p-2 rounded ${
                        selectedBlock === block.id 
                          ? 'bg-blue-900 text-blue-300' 
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      <div className="text-2xl mb-1">{block.preview}</div>
                      <span className="text-xs truncate w-full text-center">{block.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {expandedSections.architectural && (
              <div className="mb-2">
                {renderSectionHeader('Architectural Blocks', 'architectural')}
                <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {filteredBlocks.filter(block => block.category === 'architectural').map(block => (
                    <button
                      key={block.id}
                      onClick={() => setSelectedBlock(block.id)}
                      className={`flex flex-col items-center p-2 rounded ${
                        selectedBlock === block.id 
                          ? 'bg-blue-900 text-blue-300' 
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      <div className="text-2xl mb-1">{block.preview}</div>
                      <span className="text-xs truncate w-full text-center">{block.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {expandedSections.custom && (
              <div className="mb-2">
                {renderSectionHeader('Custom Blocks', 'custom')}
                <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {filteredBlocks.filter(block => block.category === 'custom').map(block => (
                    <button
                      key={block.id}
                      onClick={() => setSelectedBlock(block.id)}
                      className={`flex flex-col items-center p-2 rounded ${
                        selectedBlock === block.id 
                          ? 'bg-blue-900 text-blue-300' 
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      <div className="text-2xl mb-1">{block.preview}</div>
                      <span className="text-xs truncate w-full text-center">{block.name}</span>
                    </button>
                  ))}
                  
                  {/* Add new block button */}
                  <button
                    onClick={createBlock}
                    className="flex flex-col items-center p-2 rounded bg-gray-800 text-gray-300 hover:bg-gray-700 border border-dashed border-gray-600"
                  >
                    <Plus size={24} className="mb-1" />
                    <span className="text-xs">Add New</span>
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {filteredBlocks.map(block => (
              <button
                key={block.id}
                onClick={() => setSelectedBlock(block.id)}
                className={`flex flex-col items-center p-2 rounded ${
                  selectedBlock === block.id 
                    ? 'bg-blue-900 text-blue-300' 
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <div className="text-2xl mb-1">{block.preview}</div>
                <span className="text-xs truncate w-full text-center">{block.name}</span>
              </button>
            ))}
            
            {selectedCategory === 'custom' && (
              <button
                onClick={createBlock}
                className="flex flex-col items-center p-2 rounded bg-gray-800 text-gray-300 hover:bg-gray-700 border border-dashed border-gray-600"
              >
                <Plus size={24} className="mb-1" />
                <span className="text-xs">Add New</span>
              </button>
            )}
          </div>
        )}
        
        {filteredBlocks.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            {searchText ? (
              <>
                <div className="mb-2">No blocks found matching "{searchText}"</div>
                <button
                  onClick={() => setSearchText('')}
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  Clear search
                </button>
              </>
            ) : (
              <div>
                <div className="mb-2">No blocks found in this category</div>
                {selectedCategory !== 'custom' && (
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className="text-sm text-blue-400 hover:text-blue-300"
                  >
                    View all blocks
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Block Details - shown when a block is selected */}
      {selectedBlock && (
        <div className="border-t border-gray-700 p-3">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-sm font-semibold text-gray-300">
              {blocks.find(b => b.id === selectedBlock)?.name}
            </h3>
            <button
              onClick={() => setSelectedBlock(null)}
              className="p-1 text-gray-500 hover:text-gray-300"
            >
              <X size={14} />
            </button>
          </div>
          
          <div className="flex justify-between space-x-2 mb-2">
            <button
              onClick={() => insertBlock(selectedBlock)}
              className="flex-1 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center justify-center"
            >
              <Plus size={14} className="mr-1" />
              <span>Insert</span>
            </button>
            
            <div className="flex space-x-1">
              <button
                onClick={() => exportBlock(selectedBlock)}
                className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded border border-gray-700"
                title="Export Block"
              >
                <Download size={14} />
              </button>
              
              {blocks.find(b => b.id === selectedBlock)?.category === 'custom' && (
                <>
                  <button
                    onClick={() => console.log('Edit block:', selectedBlock)}
                    className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded border border-gray-700"
                    title="Edit Block"
                  >
                    <Edit2 size={14} />
                  </button>
                  
                  <button
                    onClick={() => deleteBlock(selectedBlock)}
                    className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded border border-gray-700"
                    title="Delete Block"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Actions Footer */}
      {!selectedBlock && (
        <div className="border-t border-gray-700 p-3 flex justify-between">
          <button
            onClick={createBlock}
            className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center"
          >
            <Plus size={14} className="mr-1" />
            <span>Create Block</span>
          </button>
          
          <div className="flex space-x-2">
            <button
              onClick={importBlock}
              className="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded border border-gray-700 flex items-center"
            >
              <Upload size={14} className="mr-1" />
              <span>Import</span>
            </button>
            
            <button
              onClick={() => console.log('Manage block library')}
              className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded border border-gray-700"
              title="Manage Block Library"
            >
              <Folder size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};