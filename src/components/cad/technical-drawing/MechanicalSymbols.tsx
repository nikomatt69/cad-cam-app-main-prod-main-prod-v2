// src/components/cad/technical-drawing/MechanicalSymbols.tsx

import React, { useState } from 'react';
import { useTechnicalDrawingStore } from 'src/store/technicalDrawingStore';
import { ChevronDown, ChevronRight, Settings, X, Users, Plus, Slash, Hash, Circle, Square, Grid } from 'react-feather';

interface MechanicalSymbolsPanelProps {
  onClose: () => void;
}

export const MechanicalSymbolsPanel: React.FC<MechanicalSymbolsPanelProps> = ({ 
  onClose 
}) => {
  const { setActiveTool, activeTool } = useTechnicalDrawingStore();
  const [activeTab, setActiveTab] = useState<'centermarks' | 'gdt' | 'welding' | 'surface'>('centermarks');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    centermarks: true,
    datums: true,
    gdt: true,
    welding: false,
    surface: false
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
      className="flex items-center justify-between w-full py-2 px-3 bg-gray-850 border-b border-gray-700"
    >
      <div className="flex items-center">
        {expandedSections[section] ? <ChevronDown size={14} className="mr-2" /> : <ChevronRight size={14} className="mr-2" />}
        <span className="text-sm font-medium text-gray-300">{title}</span>
      </div>
    </button>
  );
  
  return (
    <div className="h-full flex flex-col bg-gray-900 text-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <h2 className="text-lg font-semibold">Mechanical Symbols</h2>
        <button 
          onClick={onClose}
          className="p-1 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white"
        >
          <X size={16} />
        </button>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        <button
          onClick={() => setActiveTab('centermarks')}
          className={`flex-1 py-2 text-sm font-medium ${
            activeTab === 'centermarks' 
              ? 'border-b-2 border-blue-500 text-blue-400' 
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Centermarks
        </button>
        <button
          onClick={() => setActiveTab('gdt')}
          className={`flex-1 py-2 text-sm font-medium ${
            activeTab === 'gdt' 
              ? 'border-b-2 border-blue-500 text-blue-400' 
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          GD&T
        </button>
        <button
          onClick={() => setActiveTab('welding')}
          className={`flex-1 py-2 text-sm font-medium ${
            activeTab === 'welding' 
              ? 'border-b-2 border-blue-500 text-blue-400' 
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Welding
        </button>
        <button
          onClick={() => setActiveTab('surface')}
          className={`flex-1 py-2 text-sm font-medium ${
            activeTab === 'surface' 
              ? 'border-b-2 border-blue-500 text-blue-400' 
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Surface
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {/* Centermarks & Centerlines Tab */}
        {activeTab === 'centermarks' && (
          <div>
            {renderSectionHeader('Center Marks', 'centermarks')}
            {expandedSections.centermarks && (
              <div className="p-3 border-b border-gray-700">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setActiveTool('centermark')}
                    className={`flex flex-col items-center p-3 rounded ${
                      activeTool === 'centermark' ? 'bg-blue-900/50 text-blue-300' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <Plus size={20} className="mb-2" />
                    <span className="text-xs">Center Mark</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveTool('centerline')}
                    className={`flex flex-col items-center p-3 rounded ${
                      activeTool === 'centerline' ? 'bg-blue-900/50 text-blue-300' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <Slash size={20} className="mb-2 opacity-70" />
                    <span className="text-xs">Centerline</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveTool('construction-line')}
                    className={`flex flex-col items-center p-3 rounded ${
                      activeTool === 'construction-line' ? 'bg-blue-900/50 text-blue-300' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <Slash size={20} className="mb-2 opacity-50" />
                    <span className="text-xs">Construction Line</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveTool('section-line')}
                    className={`flex flex-col items-center p-3 rounded ${
                      activeTool === 'section-line' ? 'bg-blue-900/50 text-blue-300' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <Slash size={20} className="mb-2 transform -rotate-45" />
                    <span className="text-xs">Section Line</span>
                  </button>
                </div>
                
                <div className="mt-3">
                  <h4 className="text-xs font-medium text-gray-400 mb-2">Options</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Center Mark Size</label>
                      <input 
                        type="number"
                        className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded text-white"
                        defaultValue={5}
                        min={1}
                        step={0.5}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Centerline Pattern</label>
                      <select 
                        className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded text-white"
                        defaultValue="center"
                      >
                        <option value="center">Center (Long-Short)</option>
                        <option value="dashed">Dashed</option>
                        <option value="phantom">Phantom</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {renderSectionHeader('Datums', 'datums')}
            {expandedSections.datums && (
              <div className="p-3 border-b border-gray-700">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setActiveTool('datum')}
                    className={`flex flex-col items-center p-3 rounded ${
                      activeTool === 'datum' ? 'bg-blue-900/50 text-blue-300' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <Square size={20} className="mb-2" />
                    <span className="text-xs">Datum Symbol</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveTool('datum-target')}
                    className={`flex flex-col items-center p-3 rounded ${
                      activeTool === 'datum-target' ? 'bg-blue-900/50 text-blue-300' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <Circle size={20} className="mb-2" />
                    <span className="text-xs">Datum Target</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* GD&T Tab */}
        {activeTab === 'gdt' && (
          <div>
            {renderSectionHeader('GD&T Symbols', 'gdt')}
            {expandedSections.gdt && (
              <div className="p-3 border-b border-gray-700">
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setActiveTool('feature-control-frame')}
                    className={`flex flex-col items-center p-3 rounded ${
                      activeTool === 'feature-control-frame' ? 'bg-blue-900/50 text-blue-300' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <Square size={18} className="mb-2" />
                    <span className="text-xs text-center">Feature Control Frame</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveTool('geometric-tolerance')}
                    className={`flex flex-col items-center p-3 rounded ${
                      activeTool === 'geometric-tolerance' ? 'bg-blue-900/50 text-blue-300' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <div className="mb-2 text-lg font-bold">⌀</div>
                    <span className="text-xs text-center">Geometric Tolerance</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveTool('tolerance')}
                    className={`flex flex-col items-center p-3 rounded ${
                      activeTool === 'tolerance' ? 'bg-blue-900/50 text-blue-300' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <div className="mb-2 text-lg font-bold">±</div>
                    <span className="text-xs text-center">Tolerance</span>
                  </button>
                </div>
                
                <div className="mt-3">
                  <h4 className="text-xs font-medium text-gray-400 mb-2">Common Symbols</h4>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <button className="p-2 rounded bg-gray-800 hover:bg-gray-700 text-gray-300">
                      <div className="text-sm font-bold mb-1">⌀</div>
                      <div className="text-xs">Diameter</div>
                    </button>
                    <button className="p-2 rounded bg-gray-800 hover:bg-gray-700 text-gray-300">
                      <div className="text-sm font-bold mb-1">⊥</div>
                      <div className="text-xs">Perpendicular</div>
                    </button>
                    <button className="p-2 rounded bg-gray-800 hover:bg-gray-700 text-gray-300">
                      <div className="text-sm font-bold mb-1">∥</div>
                      <div className="text-xs">Parallel</div>
                    </button>
                    <button className="p-2 rounded bg-gray-800 hover:bg-gray-700 text-gray-300">
                      <div className="text-sm font-bold mb-1">○</div>
                      <div className="text-xs">Roundness</div>
                    </button>
                    <button className="p-2 rounded bg-gray-800 hover:bg-gray-700 text-gray-300">
                      <div className="text-sm font-bold mb-1">∟</div>
                      <div className="text-xs">Angularity</div>
                    </button>
                    <button className="p-2 rounded bg-gray-800 hover:bg-gray-700 text-gray-300">
                      <div className="text-sm font-bold mb-1">∥</div>
                      <div className="text-xs">Parallelism</div>
                    </button>
                    <button className="p-2 rounded bg-gray-800 hover:bg-gray-700 text-gray-300">
                      <div className="text-sm font-bold mb-1">⊥</div>
                      <div className="text-xs">Perpendicularity</div>
                    </button>
                    <button className="p-2 rounded bg-gray-800 hover:bg-gray-700 text-gray-300">
                      <div className="text-sm font-bold mb-1">⌯</div>
                      <div className="text-xs">Position</div>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Welding Tab */}
        {activeTab === 'welding' && (
          <div>
            {renderSectionHeader('Welding Symbols', 'welding')}
            {expandedSections.welding && (
              <div className="p-3 border-b border-gray-700">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setActiveTool('weldsymbol')}
                    className={`flex flex-col items-center p-3 rounded ${
                      activeTool === 'weldsymbol' ? 'bg-blue-900/50 text-blue-300' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <Hash size={20} className="mb-2" />
                    <span className="text-xs">Weld Symbol</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveTool('welding-leader')}
                    className={`flex flex-col items-center p-3 rounded ${
                      activeTool === 'welding-leader' ? 'bg-blue-900/50 text-blue-300' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <Slash size={20} className="mb-2 transform rotate-45" />
                    <span className="text-xs">Welding Leader</span>
                  </button>
                </div>
                
                <div className="mt-3">
                  <h4 className="text-xs font-medium text-gray-400 mb-2">Common Weld Types</h4>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <button className="p-2 rounded bg-gray-800 hover:bg-gray-700 text-gray-300">
                      <div className="mb-1">
                        <svg width="24" height="16" viewBox="0 0 24 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto">
                          <path d="M0 8H24" stroke="currentColor" strokeWidth="1.5" />
                          <path d="M12 0V16" stroke="currentColor" strokeWidth="1.5" />
                        </svg>
                      </div>
                      <div className="text-xs">Fillet</div>
                    </button>
                    <button className="p-2 rounded bg-gray-800 hover:bg-gray-700 text-gray-300">
                      <div className="mb-1">
                        <svg width="24" height="16" viewBox="0 0 24 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto">
                          <path d="M0 8H24" stroke="currentColor" strokeWidth="1.5" />
                          <path d="M4 4L20 12" stroke="currentColor" strokeWidth="1.5" />
                        </svg>
                      </div>
                      <div className="text-xs">Groove</div>
                    </button>
                    <button className="p-2 rounded bg-gray-800 hover:bg-gray-700 text-gray-300">
                      <div className="mb-1">
                        <svg width="24" height="16" viewBox="0 0 24 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto">
                          <path d="M0 8H24" stroke="currentColor" strokeWidth="1.5" />
                          <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
                        </svg>
                      </div>
                      <div className="text-xs">Spot</div>
                    </button>
                    <button className="p-2 rounded bg-gray-800 hover:bg-gray-700 text-gray-300">
                      <div className="mb-1">
                        <svg width="24" height="16" viewBox="0 0 24 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto">
                          <path d="M0 8H24" stroke="currentColor" strokeWidth="1.5" />
                          <path d="M12 4L12 12" stroke="currentColor" strokeWidth="1.5" />
                          <path d="M8 4L8 12" stroke="currentColor" strokeWidth="1.5" />
                          <path d="M16 4L16 12" stroke="currentColor" strokeWidth="1.5" />
                        </svg>
                      </div>
                      <div className="text-xs">Seam</div>
                    </button>
                    <button className="p-2 rounded bg-gray-800 hover:bg-gray-700 text-gray-300">
                      <div className="mb-1">
                        <svg width="24" height="16" viewBox="0 0 24 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto">
                          <path d="M0 8H24" stroke="currentColor" strokeWidth="1.5" />
                          <path d="M6 4L12 12L18 4" stroke="currentColor" strokeWidth="1.5" />
                        </svg>
                      </div>
                      <div className="text-xs">V-Groove</div>
                    </button>
                    <button className="p-2 rounded bg-gray-800 hover:bg-gray-700 text-gray-300">
                      <div className="mb-1">
                        <svg width="24" height="16" viewBox="0 0 24 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto">
                          <path d="M0 8H24" stroke="currentColor" strokeWidth="1.5" />
                          <path d="M8 8L16 8" stroke="currentColor" strokeWidth="4" />
                        </svg>
                      </div>
                      <div className="text-xs">Plug</div>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Surface Finish Tab */}
        {activeTab === 'surface' && (
          <div>
            {renderSectionHeader('Surface Finish', 'surface')}
            {expandedSections.surface && (
              <div className="p-3 border-b border-gray-700">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setActiveTool('surface-finish')}
                    className={`flex flex-col items-center p-3 rounded ${
                      activeTool === 'surface-finish' ? 'bg-blue-900/50 text-blue-300' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <div className="mb-2">
                      <svg width="24" height="16" viewBox="0 0 24 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 16L4 0M4 0L1 4M4 0L7 4" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M12 16V6M16 16V10M20 16V8" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                    </div>
                    <span className="text-xs">Surface Finish</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveTool('roughness')}
                    className={`flex flex-col items-center p-3 rounded ${
                      activeTool === 'roughness' ? 'bg-blue-900/50 text-blue-300' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <div className="mb-2">
                      <svg width="24" height="16" viewBox="0 0 24 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2 14L6 6L10 10L14 2L18 6L22 10" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                    </div>
                    <span className="text-xs">Roughness</span>
                  </button>
                </div>
                
                <div className="mt-3">
                  <h4 className="text-xs font-medium text-gray-400 mb-2">Common Surface Finishes</h4>
                  <div className="space-y-2">
                    <button className="flex justify-between items-center w-full p-2 rounded bg-gray-800 hover:bg-gray-700 text-gray-300">
                      <span className="text-xs">N6 - Fine</span>
                      <span className="text-xs">Ra 0.8</span>
                    </button>
                    <button className="flex justify-between items-center w-full p-2 rounded bg-gray-800 hover:bg-gray-700 text-gray-300">
                      <span className="text-xs">N7 - Semi-Fine</span>
                      <span className="text-xs">Ra 1.6</span>
                    </button>
                    <button className="flex justify-between items-center w-full p-2 rounded bg-gray-800 hover:bg-gray-700 text-gray-300">
                      <span className="text-xs">N8 - Medium</span>
                      <span className="text-xs">Ra 3.2</span>
                    </button>
                    <button className="flex justify-between items-center w-full p-2 rounded bg-gray-800 hover:bg-gray-700 text-gray-300">
                      <span className="text-xs">N9 - Semi-Rough</span>
                      <span className="text-xs">Ra 6.3</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Panel Footer */}
      <div className="border-t border-gray-700 p-3 flex justify-between items-center">
        <div className="flex items-center text-gray-400 text-xs">
          <span>ISO Standard</span>
        </div>
        
        <div className="flex space-x-2">
          <button 
            onClick={onClose}
            className="px-3 py-1.5 text-xs bg-gray-800 text-gray-300 hover:bg-gray-700 rounded border border-gray-700"
          >
            Close
          </button>
          
          <button 
            className="px-3 py-1.5 text-xs bg-gray-800 text-gray-300 hover:bg-gray-700 rounded border border-gray-700"
            title="Settings"
          >
            <Settings size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};