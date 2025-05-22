// src/components/cad/technical-drawing/ui/IndustryLeaderEditor.tsx

import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import IndustryLeaderCanvas from './IndustryLeaderCanvas';
import CommandLine from './CommandLine';
import StatusBar from './StatusBar';
import LayersPanel from './panels/LayersPanel';
import PropertiesPanel from './panels/PropertiesPanel';
import ToolsPanel from './panels/ToolsPanel';
import { useTechnicalDrawingStore } from '../enhancedTechnicalDrawingStore';

interface IndustryLeaderEditorProps {
  width: number;
  height: number;
  projectId?: string;
  onSave?: (data: any) => Promise<void>;
  onExport?: (format: string) => Promise<void>;
  readOnly?: boolean;
  theme?: 'light' | 'dark' | 'auto';
}

const IndustryLeaderEditor: React.FC<IndustryLeaderEditorProps> = ({
  width,
  height,
  projectId,
  onSave,
  onExport,
  readOnly = false,
  theme = 'auto'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showPanels, setShowPanels] = useState(true);
  const [activePanels, setActivePanels] = useState({
    layers: true,
    properties: true,
    tools: true
  });

  const {
    entities,
    dimensions,
    annotations,
    activeTool,
    zoom,
    pan,
    selectedEntityIds,
    getSystemCapabilities
  } = useTechnicalDrawingStore();

  useEffect(() => {
    console.log('🎨 IndustryLeaderEditor initialized');
    console.log('📊 System capabilities:', getSystemCapabilities());
  }, [getSystemCapabilities]);

  const handleSave = async () => {
    if (onSave) {
      const data = {
        entities,
        dimensions,
        annotations,
        metadata: {
          projectId,
          timestamp: Date.now(),
          zoom,
          pan,
          systemCapabilities: getSystemCapabilities()
        }
      };
      await onSave(data);
    }
  };

  const handleExport = async (format: string) => {
    if (onExport) {
      await onExport(format);
    }
  };

  const togglePanel = (panel: keyof typeof activePanels) => {
    setActivePanels(prev => ({
      ...prev,
      [panel]: !prev[panel]
    }));
  };

  const panelWidth = 280;
  const commandLineHeight = 40;
  const statusBarHeight = 30;
  const canvasWidth = showPanels ? width - panelWidth : width;
  const canvasHeight = height - commandLineHeight - statusBarHeight;

  return (
    <div 
      className={`flex flex-col w-full h-full bg-gray-100 dark:bg-gray-900 ${
        theme === 'dark' ? 'dark' : ''
      }`}
      style={{ width, height }}
    >
      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas Area */}
        <div className="flex-1 flex flex-col">
          {/* Canvas */}
          <div className="flex-1 relative overflow-hidden">
            <IndustryLeaderCanvas
              ref={canvasRef}
              width={canvasWidth}
              height={canvasHeight}
              readOnly={readOnly}
            />
            
            {/* Canvas Overlay - Constraint Visualizations */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Constraint visualization overlay would go here */}
            </div>
          </div>

          {/* Command Line */}
          <div className="flex-shrink-0">
            <CommandLine 
              height={commandLineHeight}
              onSave={handleSave}
              onExport={handleExport}
            />
          </div>
        </div>

        {/* Side Panels */}
        <AnimatePresence>
          {showPanels && (
            <motion.div
              initial={{ x: panelWidth, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: panelWidth, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex-shrink-0 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700"
              style={{ width: panelWidth }}
            >
              <div className="h-full flex flex-col">
                {/* Panel Tabs */}
                <div className="flex border-b border-gray-200 dark:border-gray-700">
                  <PanelTab
                    label="Tools"
                    active={activePanels.tools}
                    onClick={() => togglePanel('tools')}
                  />
                  <PanelTab
                    label="Layers"
                    active={activePanels.layers}
                    onClick={() => togglePanel('layers')}
                  />
                  <PanelTab
                    label="Properties"
                    active={activePanels.properties}
                    onClick={() => togglePanel('properties')}
                  />
                </div>

                {/* Panel Content */}
                <div className="flex-1 overflow-y-auto">
                  {activePanels.tools && (
                    <div className="p-4">
                      <ToolsPanel />
                    </div>
                  )}
                  
                  {activePanels.layers && (
                    <div className="p-4">
                      <LayersPanel />
                    </div>
                  )}
                  
                  {activePanels.properties && (
                    <div className="p-4">
                      <PropertiesPanel selectedEntityIds={selectedEntityIds} />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Panel Toggle Button */}
        <button
          onClick={() => setShowPanels(!showPanels)}
          className="absolute top-4 right-4 z-10 bg-white dark:bg-gray-800 rounded-lg p-2 shadow-lg hover:shadow-xl transition-shadow"
          title={showPanels ? 'Hide Panels' : 'Show Panels'}
        >
          <motion.div
            animate={{ rotate: showPanels ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" className="fill-current">
              <path d="M6 2L10 8L6 14V2Z" />
            </svg>
          </motion.div>
        </button>
      </div>

      {/* Status Bar */}
      <div className="flex-shrink-0">
        <StatusBar 
          height={statusBarHeight}
          activeTool={activeTool}
          zoom={zoom}
          entitiesCount={Object.keys(entities).length}
          selectedCount={selectedEntityIds.length}
        />
      </div>
    </div>
  );
};

// Helper component for panel tabs
interface PanelTabProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

const PanelTab: React.FC<PanelTabProps> = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
      active
        ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500 dark:bg-blue-900 dark:text-blue-300'
        : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
    }`}
  >
    {label}
  </button>
);

// AnimatePresence import fix
const AnimatePresence = motion.div;

export default IndustryLeaderEditor;
