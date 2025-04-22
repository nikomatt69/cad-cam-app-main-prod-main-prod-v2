import React, { useState, useEffect } from 'react';
import { useCADStore } from '@/src/store/cadStore';
import { useCAMStore } from '@/src/store/camStore';
import { useElementsStore, Element } from '@/src/store/elementsStore';
import axios from 'axios';
import { Layers, Circle, Box } from 'react-feather';

interface MachineConfig {
  id: string;
  name: string;
  config: {
    workVolume?: {
      x: number;
      z: number;
      y: number;
    };
    type: string;
    maxSpindleSpeed?: number;
    maxFeedRate?: number;
  };
}

type WorkpieceType = 'rectangular' | 'cylindrical';

const CAMWorkpieceSetup: React.FC = () => {
  const { workpiece, setWorkpiece, selectedMachine, setSelectedMachine } = useCADStore();
  const { elements } = useElementsStore();
  const { 
    selectedWorkpieceElementId,
    setSelectedWorkpieceElementId
  } = useCAMStore();

  const [machineConfigs, setMachineConfigs] = useState<MachineConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [workpieceType, setWorkpieceType] = useState<WorkpieceType>('rectangular');
  
  // Form state for the raw piece
  const [formState, setFormState] = useState({
    width: workpiece.width,
    height: workpiece.height,
    depth: workpiece.depth,
    diameter: 50, // Default diameter for cylindrical workpiece
    length: 100, // Default length for cylindrical workpiece
    material: workpiece.material,
    units: workpiece.units,
    stockAllowance: 1.0 // Stock allowance for CAM
  });
  
  const workpieceExists = workpiece !== undefined;
  
  // Load machine configurations
  useEffect(() => {
    const fetchMachineConfigs = async () => {
      try {
        setIsLoading(true);
        // Specificare il tipo atteso nella risposta Axios
        const response = await axios.get<{ data: MachineConfig[] }>('/api/machine-configs');
        
        // Controllo robusto: verifica che 'data' esista e sia un array
        if (response.data && Array.isArray(response.data.data)) {
          setMachineConfigs(response.data.data);
        } else {
          console.warn('API /api/machine-configs non ha restituito un array in response.data.data');
          setMachineConfigs([]); // Imposta array vuoto se i dati non sono nel formato atteso
        }
      } catch (error) {
        console.error('Error loading machine configurations:', error);
        setMachineConfigs([]); // Imposta array vuoto in caso di errore
      } finally {
        setIsLoading(false);
      }
    };

    fetchMachineConfigs();
  }, []);
  
  // Update workpiece type when machine type changes
  useEffect(() => {
    if (selectedMachine?.config?.type?.toLowerCase().includes('lathe') || 
        selectedMachine?.config?.type?.toLowerCase().includes('tornio')) {
      setWorkpieceType('cylindrical');
    }
  }, [selectedMachine]);
  
  // Handle machine selection change
  const handleMachineChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const machineId = e.target.value;
    
    if (machineId) {
      const selectedConfig = machineConfigs.find(config => config.id === machineId);
      if (selectedConfig) {
        setSelectedMachine(selectedConfig);
        
        // Check if it's a lathe machine
        const isLathe = selectedConfig.config.type.toLowerCase().includes('lathe') || 
                        selectedConfig.config.type.toLowerCase().includes('tornio');
        
        // Update the workpiece type based on the machine type
        setWorkpieceType(isLathe ? 'cylindrical' : 'rectangular');
        
        // Update the form if the machine has work volume information
        if (selectedConfig.config?.workVolume) {
          const { x, y, z } = selectedConfig.config.workVolume;
          if (isLathe) {
            // For lathe, use x as diameter and z as length
            setFormState(prev => ({
              ...prev,
              diameter: x,
              length: z
            }));
          } else {
            setFormState(prev => ({
              ...prev,
              width: x,
              height: y,
              depth: z
            }));
          }
        }
      }
    } else {
      setSelectedMachine(null);
    }
  };

  // Handle workpiece type change
  const handleWorkpieceTypeChange = (type: WorkpieceType) => {
    setWorkpieceType(type);
  };

  // Handle any form field change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: name === 'material' || name === 'units' ? value : parseFloat(value)
    }));
  };

  // Apply changes to the workpiece
  const handleApplyWorkpiece = () => {
    if (workpieceType === 'rectangular') {
      setWorkpiece({
        width: formState.width,
        height: formState.height,
        depth: formState.depth,
        material: formState.material,
        units: formState.units as 'mm' | 'inch'
      });
    } else {
      setWorkpiece({
        width: formState.diameter,
        height: formState.diameter,
        depth: formState.length,
        material: formState.material,
        units: formState.units as 'mm' | 'inch'
      });
    }
  };

  return (
    <div className="bg-[#F8FBFF] dark:bg-gray-800 dark:text-white shadow-md rounded-lg p-4 space-y-4">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Workpiece Configuration for CAM</h3>
      
      {/* Machine selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Machine Configuration
        </label>
        <select
          name="machine"
          value={selectedMachine?.id || ''}
          onChange={handleMachineChange}
          className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-[#F8FBFF] dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        >
          <option value="">Select a machine</option>
          {machineConfigs.map((config) => (
            <option key={config.id} value={config.id}>
              {config.name} ({config.config.type})
            </option>
          ))}
        </select>
      </div>
      
      {/* Element Selection for Workpiece */}
      <div className="mt-4 border-t border-gray-200 dark:border-gray-600 pt-4">
        <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-2">Select Workpiece Element</h4>
        {elements && elements.length > 0 ? (
          <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700">
            {elements.map((element: Element) => (
              <button
                key={element.id}
                onClick={() => setSelectedWorkpieceElementId(element.id)}
                className={`w-full text-left p-2 rounded-md flex items-center justify-between ${
                  selectedWorkpieceElementId === element.id 
                    ? 'bg-blue-100 dark:bg-blue-900 ring-1 ring-blue-500' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-600'
                } ${
                  selectedWorkpieceElementId === element.id 
                    ? 'border-l-4 border-green-500 font-semibold'
                    : '' 
                }`}
              >
                <span className="flex items-center">
                  <Box size={16} className="mr-2 text-gray-500 dark:text-gray-400" /> 
                  {element.name || `Element ${element.id.substring(0, 6)}`}
                </span>
                {selectedWorkpieceElementId === element.id && (
                   <span className="text-xs font-semibold text-green-600 dark:text-green-400 ml-auto">(Workpiece)</span>
                )}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">No selectable elements found.</p>
        )}
        
        {selectedWorkpieceElementId && (
            <button
              type="button"
              onClick={() => setSelectedWorkpieceElementId(null)}
              className="mt-3 w-full inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-500 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Clear Workpiece Selection
            </button>
        )}
      </div>

      <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 pt-4 border-t border-gray-200 dark:border-gray-600">Define Raw Stock (Optional)</h4>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Define the raw material dimensions if different from the selected workpiece element, or if no element is selected.
      </p>
      
      {/* Workpiece type selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Stock Type
        </label>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => handleWorkpieceTypeChange('rectangular')}
            className={`flex-1 flex items-center justify-center px-2 py-1  border ${  
              workpieceType === 'rectangular' 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500' 
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            } rounded-md shadow-sm text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
          >
            <Layers size={16} className="mr-2" />
            Rectangular
          </button>
          <button
            type="button"
            onClick={() => handleWorkpieceTypeChange('cylindrical')}
            className={`flex-1 flex items-center justify-center px-2 py-1 border ${
              workpieceType === 'cylindrical' 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500' 
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            } rounded-md shadow-sm text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
          >
            <Circle size={16} className="mr-2" />
            Cylindrical
          </button>
        </div>
      </div>
      
      {/* Piece dimensions - conditional rendering based on workpiece type */}
      {workpieceType === 'rectangular' ? (
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label htmlFor="width" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Width (X)
            </label>
            <input
              type="number"
              name="width"
              id="width"
              value={formState.width}
              onChange={handleInputChange}
              step="0.1"
              className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-[#F8FBFF] dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="height" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Height (Y)
            </label>
            <input
              type="number"
              name="height"
              id="height"
              value={formState.height}
              onChange={handleInputChange}
              step="0.1"
              className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-[#F8FBFF] dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="depth" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Depth (Z)
            </label>
            <input
              type="number"
              name="depth"
              id="depth"
              value={formState.depth}
              onChange={handleInputChange}
              step="0.1"
              className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-[#F8FBFF] dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="diameter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Diameter (X)
            </label>
            <input
              type="number"
              name="diameter"
              id="diameter"
              value={formState.diameter}
              onChange={handleInputChange}
              step="0.1"
              className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-[#F8FBFF] dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="length" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Length (Z)
            </label>
            <input
              type="number"
              name="length"
              id="length"
              value={formState.length}
              onChange={handleInputChange}
              step="0.1"
              className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-[#F8FBFF] dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>
      )}
      
      {/* Material and Units */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="material" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Material
          </label>
          <select
            name="material"
            id="material"
            value={formState.material}
            onChange={handleInputChange}
            className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-[#F8FBFF] dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="Aluminum">Aluminum</option>
            <option value="Steel">Steel</option>
            <option value="Titanium">Titanium</option>
            <option value="Plastic">Plastic</option>
            {/* Add more materials as needed */}
          </select>
        </div>
        <div>
          <label htmlFor="units" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Units
          </label>
          <select
            name="units"
            id="units"
            value={formState.units}
            onChange={handleInputChange}
            className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-[#F8FBFF] dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="mm">Millimeters (mm)</option>
            <option value="inch">Inches (in)</option>
          </select>
        </div>
      </div>
      
      {/* Stock Allowance */}
      <div>
        <label htmlFor="stockAllowance" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Stock Allowance ({formState.units})
        </label>
        <input
          type="number"
          name="stockAllowance"
          id="stockAllowance"
          value={formState.stockAllowance}
          onChange={handleInputChange}
          step="0.1"
          min="0"
          className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-[#F8FBFF] dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="e.g., 1.0"
        />
         <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Amount of extra material around the workpiece for machining.</p>
      </div>
      
      {/* Apply button for stock definition */}
      <button
        type="button"
        onClick={handleApplyWorkpiece}
        disabled={selectedWorkpieceElementId !== null}
        className="mt-4 w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {workpieceExists && selectedWorkpieceElementId === null ? 'Update Defined Stock' : 'Define Raw Stock'}
      </button>
       {selectedWorkpieceElementId !== null && (
         <p className="mt-2 text-sm text-yellow-700 dark:text-yellow-400">
           Workpiece is set from a selected element. Clear selection above to define stock manually.
         </p>
       )}
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#F8FBFF]  dark:bg-gray-800 dark:text-white bg-opacity-75">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  );
};

export default CAMWorkpieceSetup;