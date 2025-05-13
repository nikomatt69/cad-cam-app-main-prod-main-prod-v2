// src/pages/cam.tsx
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';

import GCodeViewer from 'src/components/cam/GCodeViewer';
import GCodeEditor from 'src/components/cam/GCodeEditor';
import MachineControl from 'src/components/cam/MachineControl';
import StatusBar from 'src/components/cad/StatusBar';
import MachineCycles from 'src/components/cam/MachineCycles';
import LocalCamLibraryView from 'src/components/library/LocalCamLibraryView';
import UnifiedLibraryModal from '../components/library/UnifiedLibraryModal';
import { MaterialLibraryItem, ToolLibraryItem } from '@/src/hooks/useUnifiedLibrary';
import ProductionCostsManager from '@/src/components/production-costs/ProductionCostsManager';
import ToolpathCostPanel from '@/src/components/production-costs/ToolpathCostPanel';

import { 
  Save, 
  Upload, 
  Menu, 
  ArrowLeft, 
  ArrowRight, 
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Eye,
  Code,
  Tool,
  Settings,
  Box,
  Folder,
  X,
  DollarSign
} from 'react-feather';
import { PanelRightIcon, PanelRightInactiveIcon } from 'lucide-react';
import EnhancedSidebarCam from '../components/cam/EnanchedSidebarCam';

import AIToolpathOptimizer from '../components/ai/AIToolpathOptimizer';
import Loading from '../components/ui/Loading';

import MetaTags from '../components/layout/Metatags';
import OriginControls from '../components/cad/OriginControls';

import Link from 'next/link';

import GenericPostProcessor from '../components/cam/postprocessor/GenericPostProcessor';
import { isMobile } from 'react-device-detect';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import FixedCyclesUIRenderer from '../components/cam/FixedCyclesUIRenderer';
import EnhancedToolpathVisualizer from '../components/cam/EnhancedToolpathVisualizer';
import ToolpathVisualizer from 'src/components/cam/ToolpathVisualizer2';
import { AIAssistantOpenai } from '../components/ai/ai-new/OpenaiAssistant/AIAssistantOpenai';
import OptimizedToolpathVisualizer from '../components/cam/OptimizedToolpathVisualizer';
import FanucCncControl from '../components/cam/FanucCncControl';
import FanucMachineControl from '../components/cam/FanucMachineController';
import CNCControlPage from '../components/cam/FanucCncControl';
import ToolpathGenerator3DPrintIntegration from '../components/cam/ToolpathGenerator3DPrintIntegration';
import render3DPrinterSection from '../components/cam/render3DPrinterSection';
import { useCAMStore } from '@/src/store/camStore';
import ChatPanel from '../components/layout/ChatPanel';
import ChatPanelCam from '../components/layout/ChatPanelCam';
import ToolpathAnalysisPanel from '../components/ai/CAMAssistant/ToolpathAnalysisPanel';
import GCodeAIAgent from '../components/ai/GCodeAIAgent/GCodeAIAgent';
// Tipi di post-processor supportati
type PostProcessorType = 'fanuc' | 'heidenhain' | 'siemens' | 'haas' | 'mazak' | 'okuma' | 'generic';
export const DynamicToolpathGenerator = dynamic(() => import('src/components/cam/ToolpathGenerator'), {
  ssr: false, // Heavy Three.js component
  loading: () => <div className="w-full h-full bg-gray-100 dark:bg-gray-800 animate-pulse" />

});
export const DynamicToolpathVisualizer = dynamic(() => import('src/components/cam/ToolpathVisualizer2'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-100 dark:bg-gray-800 animate-pulse" />
});

export const DynamicPostProcessors = {
  Fanuc: dynamic(() => import('src/components/cam/postprocessor/FanucPostProcessor'), { ssr: true }),
  Heidenhain: dynamic(() => import('src/components/cam/postprocessor/HeidenhainPostProcessor'), { ssr: true })
};

export default function CAMPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toolpaths, syncWorkpieceFromCAD } = useCAMStore();
  
  // Sincronizza il workpiece dal CAD quando si carica la pagina CAM
  useEffect(() => {
    console.log('CAM Page mounted - sincronizzazione workpiece dal CAD');
    syncWorkpieceFromCAD();
  }, [syncWorkpieceFromCAD]);
  
  // Stati per il CAM editor
  const [activeTab, setActiveTab] = useState<'preview' | 'editor' | 'visualizer' | 'post-processor'>('preview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'machine' | 'layers' | 'settings'|'tools'>('machine');
  const [gcode, setGcode] = useState<string>('');
  const [processedGcode, setProcessedGcode] = useState<string>('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [selectedPostProcessor, setSelectedPostProcessor] = useState<PostProcessorType>('fanuc');
  const [activeRightPanel, setActiveRightPanel] = useState<'generator' | 'cycles' | 'control' | 'analysis'>('generator');
  const [selectedLibraryTool, setSelectedLibraryTool] = useState<string | null>(null);
  const [selectedToolpathId, setSelectedToolpathId] = useState<string | null>(null);
  const [showChatPanel, setShowChatPanel] = useState(true);
  // Nuovo stato per la libreria CAM
  const [showLibrary, setShowLibrary] = useState(false);
  // Add state for the unified library modal
  const [showUnifiedLibrary, setShowUnifiedLibrary] = useState(false);
  // Add state for production costs manager modal
  const [showCostsManager, setShowCostsManager] = useState(false);
  
  // Add useEffect to load toolpath from localStorage when URL contains loadToolpath parameter
  useEffect(() => {
    const loadToolpathFromStorage = async () => {
      // Only proceed if we have the loadToolpath query parameter
      if (!router.query.loadToolpath) return;
      
      const toolpathId = router.query.loadToolpath as string;
      console.log('Loading toolpath with ID:', toolpathId);
      
      try {
        // Get the stored toolpath data
        const storedToolpath = localStorage.getItem('toolpathToLoadInCAM');
        if (!storedToolpath) {
          console.error('No toolpath data found in localStorage');
          toast.error('Toolpath data not found');
          return;
        }
        
        console.log('Retrieved toolpath data from localStorage');
        const toolpathData = JSON.parse(storedToolpath);
        console.log('Parsed toolpath data:', toolpathData);
        
        // Validate the toolpath data
        if (!toolpathData || !toolpathData.id || toolpathData.id !== toolpathId) {
          console.error('Invalid toolpath data or ID mismatch');
          toast.error('Invalid toolpath data');
          return;
        }
        
        // Set the toolpath data in the CAM state
        if (toolpathData.gcode) {
          console.log('Setting G-code in CAM editor');
          setGcode(toolpathData.gcode);
          // Switch to the editor tab to show the loaded code first
          setActiveTab('editor');
          
          // Show a toast message suggesting to check the visualizer
          setTimeout(() => {
            toast.success('Switch to the "Percorso Utensile" tab to view the toolpath visualization', {
              duration: 5000
            });
          }, 1500);
        }
        
        // Set selected toolpath ID for cost panel
        setSelectedToolpathId(toolpathData.id);
        
        toast.success(`Toolpath '${toolpathData.name}' loaded successfully`);
        
        // Clear the localStorage data
        localStorage.removeItem('toolpathToLoadInCAM');
        
        // Remove the query parameter
        const { loadToolpath, ...otherParams } = router.query;
        router.replace({
          pathname: router.pathname,
          query: otherParams
        }, undefined, { shallow: true });
        
      } catch (error) {
        console.error('Error loading toolpath from localStorage:', error);
        toast.error('Failed to load toolpath data. See console for details.');
      }
    };
    
    loadToolpathFromStorage();
  }, [router.query.loadToolpath, router]);
  
  // Add useEffect to load tool from localStorage when URL contains loadTool parameter
  useEffect(() => {
    const loadToolFromStorage = async () => {
      // Only proceed if we have the loadTool query parameter
      if (!router.query.loadTool) return;
      
      const toolId = router.query.loadTool as string;
      console.log('Loading tool with ID:', toolId);
      
      try {
        // Get the stored tool data
        const storedTool = localStorage.getItem('toolToLoadInCAM');
        if (!storedTool) {
          console.error('No tool data found in localStorage');
          toast.error('Tool data not found');
          return;
        }
        
        console.log('Retrieved tool data from localStorage');
        const toolData = JSON.parse(storedTool);
        console.log('Parsed tool data:', toolData);
        
        // Validate the tool data
        if (!toolData || !toolData.id || toolData.id !== toolId) {
          console.error('Invalid tool data or ID mismatch');
          toast.error('Invalid tool data');
          return;
        }
        
        // Set the selected tool
        setSelectedLibraryTool(toolData.id);
        setActiveRightPanel('generator'); // Switch to generator panel where the tool will be used
        
        toast.success(`Tool '${toolData.name}' loaded successfully`);
        
        // Clear the localStorage data
        localStorage.removeItem('toolToLoadInCAM');
        
        // Remove the query parameter
        const { loadTool, ...otherParams } = router.query;
        router.replace({
          pathname: router.pathname,
          query: otherParams
        }, undefined, { shallow: true });
        
      } catch (error) {
        console.error('Error loading tool from localStorage:', error);
        toast.error('Failed to load tool data. See console for details.');
      }
    };
    
    loadToolFromStorage();
  }, [router.query.loadTool, router]);
  
  // Handler for tool selection from unified library
  const handleToolSelection = (tool: ToolLibraryItem) => {
    setSelectedLibraryTool(tool.id);
    setShowUnifiedLibrary(false);
  };

  // Handler for material selection from unified library
  const handleMaterialSelection = (material: MaterialLibraryItem) => {
    // Handle material selection if needed
    console.log("Selected material:", material);
    setShowUnifiedLibrary(false);
  };
  
  // Funzione che gestisce il caricamento di un file G-code
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        setGcode(content);
      } catch (err) {
        console.error('Failed to read the file', err);
      }
    };
    reader.readAsText(file);
  };
  
  // Funzione per salvare il G-code
  const handleSaveGcode = () => {
    // Se siamo nella tab post-processor e abbiamo codice processato, salviamo quello
    const codeToSave = activeTab === 'post-processor' && processedGcode ? processedGcode : gcode;
    
    if (!codeToSave) return;
    
    const fileExtension = selectedPostProcessor === 'heidenhain' ? '.h' : '.nc';
    
    const blob = new Blob([codeToSave], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'toolpath-' + new Date().toISOString().slice(0, 10) + fileExtension;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Funzione per avviare/arrestare la simulazione
  const toggleSimulation = () => {
    setIsSimulating(!isSimulating);
  };

  // Funzione per gestire il G-code processato dal post-processor
  const handleProcessedGcode = (processedCode: string, validationResults?: any) => {
    setProcessedGcode(processedCode);
    console.log('Validation results:', validationResults);
  };

  // Funzione per gestire il G-code generato dai cicli macchina
  const handleCycleCodeGenerated = (cycleCode: string) => {
    // Aggiunge il codice del ciclo al gcode esistente o lo sostituisce
    if (activeTab === 'editor') {
      // Se siamo nell'editor, appendiamo il ciclo al codice esistente
      setGcode((prevGcode) => {
        return prevGcode ? `${prevGcode}\n\n${cycleCode}` : cycleCode;
      });
    } else {
      // Altrimenti impostiamo direttamente il nuovo codice
      setGcode(cycleCode);
    }
    
    // Passa automaticamente alla tab editor per vedere il codice generato
    setActiveTab('editor');
  };
  
  // Funzione per gestire il caricamento di un progetto dalla libreria
  const handleLoadProjectFromLibrary = (projectId: string) => {
    // In una implementazione reale, caricheresti il progetto con l'ID specificato
    console.log('Loading project:', projectId);
    setShowLibrary(false);
    
    // Qui andrà implementata la logica per caricare il progetto
    // usando useLocalLibrary hook o simili
  };
  
  // Gestore per la selezione del toolpath per il pannello dei costi
  const handleToolpathSelect = (toolpathId: string) => {
    setSelectedToolpathId(toolpathId);
    // Passa automaticamente alla tab di costi
    setActiveRightPanel('analysis');
  };

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loading/>
      </div>
    );
  }
  

  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }
 


  return (
    <div className="h-screen w-screen flex bg-gradient-to-b from-[#2A2A2A] to-[#303030] flex-col rounded-xl overflow-hidden">
      <>
      <MetaTags
  ogImage="/og-image.png" 
        title="CAM FUN" 
      />
      </>
     
      <div className="flex flex-col rounded-xl h-full w-full">
        {/* Top toolbar */}
        <div className="bg-[#F8FBFF]  dark:bg-gray-800 dark:text-white border-b rounded-xl w-full px-4 py-1 flex items-center justify-between">
          <div className="flex rounded-xl w-max items-center">
            <button
              className="mr-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
            
            <div className="ml-6 flex items-center space-x-2">
              <button
                onClick={handleSaveGcode}
                className="btn btn-sm btn-outline dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 flex items-center cursor-pointer"
                title="Salva G-Code"
                disabled={!(activeTab === 'post-processor' ? processedGcode : gcode)}
              >
                <Save size={16} className="mr-1" />
                
              </button>
              <label className="btn btn-sm btn-outline flex items-center cursor-pointer" title="Importa G-Code">
                <Upload size={16} className="mr-1 dark:text-gray-300" />
                
                <input 
                  type="file" 
                  className="hidden" 
                  accept=".nc,.gcode,.cnc,.txt" 
                  onChange={handleFileUpload}
                />
              </label>
              <button
                onClick={toggleSimulation}
                className={`btn btn-sm ${isSimulating ? 'btn-danger dark:bg-red-600 dark:hover:bg-red-700' : 'btn-success dark:bg-green-600 dark:hover:bg-green-700'} flex items-center`}
                title={isSimulating ? "Arresta Simulazione" : "Avvia Simulazione"}
              >
                {isSimulating ? <Pause size={16} /> : <Play size={16} />}
                <span className="ml-1">{isSimulating ? "Stop" : "Play"}</span>
              </button>
              {/* Unified Library button */}
              <button
                onClick={() => setShowUnifiedLibrary(true)}
                className="btn btn-sm btn-outline dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 flex items-center"
                title="Unified Library"
              >
                <Folder size={16} className="mr-1" />
                Library
              </button>
              {/* Production Costs Manager button */}
              <button
                onClick={() => setShowCostsManager(true)}
                className="btn btn-sm btn-outline dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 flex items-center"
                title="Gestione Costi di Produzione"
              >
                <DollarSign size={16} className="mr-1" />
                Costi
              </button>
            </div>
          </div>
          
          {/* Tab buttons */}
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center px-3 py-1 rounded-md text-sm font-medium ${
                activeTab === 'preview' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <Eye size={16} className="mr-1" />
              Preview
            </button>
            <button
              onClick={() => setActiveTab('editor')}
              className={`flex items-center px-3 py-1 rounded-md text-sm font-medium ${
                activeTab === 'editor' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <Code size={16} className="mr-1" />
              Editor G-Code
            </button>
            <button
              onClick={() => setActiveTab('visualizer')}
              className={`flex items-center px-3 py-1 rounded-md text-sm font-medium ${
                activeTab === 'visualizer' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <Tool size={16} className="mr-1" />
              Toolpath
            </button>
            <button
              onClick={() => setActiveTab('post-processor')}
              className={`flex items-center px-3 py-1 rounded-md text-sm font-medium ${
                activeTab === 'post-processor' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <Settings size={16} className="mr-1" />
              Post-Processor
            </button>
            <button
              onClick={() => setShowChatPanel(!showChatPanel)}
              className="flex items-center px-1  text-sm font-medium bg-blue-400 hover:bg-blue-600 text-white  rounded-md shadow-lg z-50"
              aria-label={showChatPanel ? "Close Chat Panel" : "Open Chat Panel"}
            >
              {showChatPanel ? <PanelRightIcon size={16}/> : <PanelRightInactiveIcon size={16}/>}
            </button>
          </div>
        </div>

        <div className="flex flex-1 bg-gradient-to-b from-[#2A2A2A] to-[#303030] p-0.5 overflow-hidden w-full">
          {/* Enhanced left sidebar */}
          <EnhancedSidebarCam 
            isOpen={sidebarOpen} 
            setIsOpen={setSidebarOpen}
            activeSidebarTab={activeSidebarTab}
            setActiveSidebarTab={setActiveSidebarTab}
          />
          
          {/* Main content */}
          <div className="flex-1 relative">
            {activeTab === 'preview' && (
              <div className="h-full">
                <GCodeViewer 
                  width="100%" 
                  height="100%" 
                  gcode={gcode}
                  isSimulating={isSimulating}
                />
              </div>
            )}
            
            {activeTab === 'editor' && (
              <div className="h-full">
                <GCodeEditor 
                  height="100%" 
                  value={gcode}
                  onChange={setGcode}
                />
              </div>
            )}
            
            {activeTab === 'visualizer' && (
              <div className="h-full">
                <OptimizedToolpathVisualizer 
                  width="100%" 
                  height="100%" 
                  gcode={gcode}
                  isSimulating={isSimulating}
                  selectedTool={selectedLibraryTool}
                  showWorkpiece={true}
                  onSimulationComplete={() => {
                    // Handle simulation complete
                    setIsSimulating(false);
                  }}
                  onSimulationProgress={(progress) => {
                    // Update progress if needed
                    console.log(`Simulation progress: ${progress}%`);
                  }}
                />
              </div>
            )}
            
            {activeTab === 'post-processor' && (
              <div className="h-full rounded-xl overflow-y-auto">
                {/* Selettore del tipo di post-processor */}
                <div className="bg-[#F8FBFF]  dark:bg-gray-800 dark:text-white border-b p-4 flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Post-Processor</h2>
                  <div className="flex items-center space-x-2">
                    <label htmlFor="post-processor-type" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Controller Type:
                    </label>
                    <select
                      id="post-processor-type"
                      className="ml-2 block w-48 pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-500 dark:focus:border-blue-500 sm:text-sm rounded-md"
                      value={selectedPostProcessor}
                      onChange={(e) => setSelectedPostProcessor(e.target.value as PostProcessorType)}
                    >
                      <option value="fanuc">Fanuc</option>
                      <option value="heidenhain">Heidenhain</option>
                      <option value="siemens">Siemens</option>
                      <option value="haas">Haas</option>
                      <option value="mazak">Mazak</option>
                      <option value="okuma">Okuma</option>
                      <option value="generic">Generic</option>
                    </select>
                  </div>
                </div>
                
                {/* Componente post-processor in base alla selezione */}
                <div className="p-4 rounded-b-xl bg-gray-50 dark:bg-gray-900">
                  {selectedPostProcessor === 'fanuc' && (
                    <DynamicPostProcessors.Fanuc 
                      initialGcode={gcode}
                      onProcessedGcode={handleProcessedGcode}
                    />
                  )}
                  
                  {selectedPostProcessor === 'heidenhain' && (
                    <DynamicPostProcessors.Heidenhain 
                      initialGcode={gcode}
                      onProcessedGcode={handleProcessedGcode}
                    />
                  )}
                  
                  {['siemens', 'haas', 'mazak', 'okuma', 'generic'].includes(selectedPostProcessor) && (
                    <GenericPostProcessor
                      initialGcode={gcode}
                      controllerType={selectedPostProcessor}
                      onProcessedGcode={handleProcessedGcode}
                    />
                  )}
                </div>
              </div>
            )}
            </div>
            
          {/* Right sidebar for controls */}
          <div 
            className={`${
              rightSidebarOpen ? 'w-80' : 'w-0'
            } flex-shrink-0 bg-[#F8FBFF]  dark:bg-gray-800 dark:text-white rounded-xl border-2 border-l ml-0.5 transition-all duration-300 ease-in-out overflow-y-auto`}
          >
            {/* Tabs for right sidebar */}
            <div className="px-2 pt-1 pb-1 border-b">
              <div className="flex space-x-1">
                <button
                  onClick={() => setActiveRightPanel('generator')}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    activeRightPanel === 'generator'
                      ? 'bg-blue-100 text-blue-700 dark:bg-gray-700 dark:text-gray-100 border-b-2 border-blue-500'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                  }`}
                >
                  <Tool size={16} className="mr-1" />
                  Generator
                </button>
                <button
                  onClick={() => setActiveRightPanel('cycles')}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    activeRightPanel === 'cycles'
                      ? 'bg-blue-100 text-blue-700 dark:bg-gray-700 dark:text-gray-100 border-b-2 border-blue-500'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                  }`}
                >
                  <Box size={16} className="mr-1" />
                  Fixed Cycles
                </button>
                <button
                  onClick={() => setActiveRightPanel('analysis')}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    activeRightPanel === 'analysis'
                      ? 'bg-blue-100 text-blue-700 dark:bg-gray-700 dark:text-gray-100 border-b-2 border-blue-500'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                  }`}
                >
                  <DollarSign size={16} className="mr-1" />
                  Costs
                </button>
                
              </div>
            </div>

            <div className="p-4 space-y-6">
              {activeRightPanel === 'generator' && (
                <DynamicToolpathGenerator onGCodeGenerated={setGcode} />
              )}
              
              {activeRightPanel === 'cycles' && (
               <><MachineCycles 
               controllerType={selectedPostProcessor as 'fanuc' | 'heidenhain'}  
                  onCycleCodeGenerated={handleCycleCodeGenerated} 
                />
                <FixedCyclesUIRenderer gCodeLine={gcode} />
               
                
                </>
              )}
              
             
              {activeRightPanel === 'analysis' && (
               <ToolpathAnalysisPanel/>
              )}
            </div>
           
          </div>
         
          {/* Toggle right sidebar button */}
          <button
            className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-[#F8FBFF]  dark:bg-gray-800 dark:text-white p-2 rounded-l-md shadow-md"
            onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
          >
            {rightSidebarOpen ? <ChevronRight size={20} className="text-gray-600" /> : <ChevronLeft size={20} className="text-gray-600" />}
          </button>
          
        </div>
        
        {/* Status bar */}
        <StatusBar />
      </div>
      
      {/* Modal della libreria CAM */}
      {showLibrary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
          <div className="w-full max-w-6xl max-h-[90vh] flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-xl">
            <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold dark:text-white">Libreria CAM</h2>
              <button 
                onClick={() => setShowLibrary(false)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X size={20} className="dark:text-gray-300" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <LocalCamLibraryView 
                onSelectProject={handleLoadProjectFromLibrary}
                onClose={() => setShowLibrary(false)}
                showCloseButton={false}
              />
            </div>
          </div>
        </div>
      )}

      {/* Unified Library Modal */}
      <UnifiedLibraryModal
        isOpen={showUnifiedLibrary}
        onClose={() => setShowUnifiedLibrary(false)}
        onSelectTool={handleToolSelection}
        onSelectMaterial={handleMaterialSelection}
        onSelectComponent={(component) => { /* Placeholder if needed */ }}
        defaultTab="tools"
      />
      
      {/* Production Costs Manager Modal */}
      {showCostsManager && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
          <div className="w-full max-w-7xl max-h-[90vh] flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-xl">
            <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold dark:text-white">Gestione Costi di Produzione</h2>
              <button 
                onClick={() => setShowCostsManager(false)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X size={20} className="dark:text-gray-300" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ProductionCostsManager />
            </div>
          </div>
        </div>
      )}

      {/* Chat Panel Toggle Button */}
     

      {/* Chat Panel */}
     
    </div>
  );
}