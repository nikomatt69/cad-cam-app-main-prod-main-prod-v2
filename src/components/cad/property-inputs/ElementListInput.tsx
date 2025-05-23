// src/components/cad/property-inputs/ElementListInput.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Minus, Edit2, X, Search, CheckCircle } from 'react-feather';
import { motion, AnimatePresence } from 'framer-motion';
import { useElementsStore } from 'src/store/elementsStore';

interface ElementListInputProps {
  label: string;
  value: string[]; // Array di ID elementi
  onChange: (elementIds: string[]) => void;
  disabled?: boolean;
  listType: 'element' | 'edge' | 'face' | 'opening';
}

/**
 * Componente per selezionare e gestire liste di elementi, bordi, facce o aperture
 * Fornisce un'interfaccia per cercare, filtrare e selezionare elementi
 * 
 * @example
 * <ElementListInput
 *   label="Operand Elements"
 *   value={['id1', 'id2']}
 *   onChange={(ids) => updateOperands(ids)}
 *   listType="element"
 * />
 */
export const ElementListInput: React.FC<ElementListInputProps> = ({
  label,
  value = [],
  onChange,
  disabled = false,
  listType
}) => {
  const { elements } = useElementsStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState<any[]>([]);

  // Inizializza gli elementi disponibili in base al tipo di lista
  useEffect(() => {
    // Di base gestisce gli elementi generici, ma potrebbe essere esteso
    // per gestire bordi, facce o aperture specifiche di un elemento
    const itemsToShow = elements.filter(el => {
      if (searchTerm) {
        return (
          el.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          el.type.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      return true;
    });

    setFilteredItems(itemsToShow);
  }, [elements, searchTerm, listType]);

  const openDialog = () => {
    setSelectedIds([...value]);
    setSearchTerm('');
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
  };

  const saveSelection = () => {
    onChange(selectedIds);
    closeDialog();
  };

  const toggleItem = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(itemId => itemId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Ottiene informazioni sull'elemento per visualizzazione
  const getElementInfo = (id: string) => {
    const element = elements.find(el => el.id === id);
    if (!element) return { name: `Sconosciuto (${id.slice(0, 8)}...)`, color: '#cccccc' };
    
    return {
      name: `${element.type} (${id.slice(0, 8)}...)`,
      color: element.color || '#cccccc'
    };
  };

  // Ottiene il titolo del dialogo in base al tipo di lista
  const getDialogTitle = () => {
    switch (listType) {
      case 'element': return 'Seleziona Elementi';
      case 'edge': return 'Seleziona Bordi';
      case 'face': return 'Seleziona Facce';
      case 'opening': return 'Configura Aperture';
      default: return 'Seleziona Items';
    }
  };

  // Continua dalla Parte 1
  
  return (
    <div className="mb-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-blue-400 mb-1">
        {label} ({value.length} selected)
      </label>
      <button
        type="button"
        onClick={openDialog}
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                 bg-[#F8FBFF] dark:bg-gray-700 dark:hover:bg-gray-600 hover:bg-gray-50 flex justify-between items-center
                 text-gray-700 dark:text-blue-400"
      >
        <span>
          {value.length === 0 
            ? `Select ${listType === 'element' ? 'Elements' : 
                listType === 'edge' ? 'Edges' : 
                listType === 'face' ? 'Faces' : 'Openings'}`
            : `${value.length} ${value.length === 1 ? 'item' : 'items'} selected`}
        </span>
        <Edit2 size={16} />
      </button>

      {/* Selection Dialog */}
      <AnimatePresence>
        {isDialogOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={(e) => e.target === e.currentTarget && closeDialog()}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-blue-400">
                  {getDialogTitle() === 'Seleziona Elementi' ? 'Select Elements' :
                   getDialogTitle() === 'Seleziona Bordi' ? 'Select Edges' :
                   getDialogTitle() === 'Seleziona Facce' ? 'Select Faces' :
                   getDialogTitle() === 'Configura Aperture' ? 'Configure Openings' :
                   'Select Items'}
                </h3>
                <button
                  type="button"
                  onClick={closeDialog}
                  className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-300"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Search */}
              <div className="relative mb-4">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-blue-400 dark:placeholder-gray-400"
                />
              </div>

              {/* Element Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto mb-4 border dark:border-gray-600 rounded-md p-2">
                {filteredItems.map(item => (
                  <div
                    key={item.id}
                    className={`p-2 border dark:border-gray-600 rounded flex items-center justify-between cursor-pointer transition-colors ${
                      selectedIds.includes(item.id)
                       ? 'bg-blue-50 dark:bg-blue-900/50 border-blue-300 dark:border-blue-700' 
                       : 'hover:bg-gray-50 dark:hover:bg-blue-900/30'
                    }`}
                    onClick={() => toggleItem(item.id)}
                  >
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: item.color || '#ccc' }} 
                      />
                      <span className="text-sm truncate max-w-[180px] dark:text-blue-400">{item.type} - {item.id.slice(0, 8)}...</span>
                    </div>
                    {selectedIds.includes(item.id) && (
                      <div className="text-blue-500 dark:text-blue-400">
                        <CheckCircle size={16} />
                      </div>
                    )}
                  </div>
                ))}

                {filteredItems.length === 0 && (
                  <div className="col-span-2 text-center text-gray-500 dark:text-gray-400 py-4">
                    {searchTerm 
                      ? `No items found for "${searchTerm}". Try another search.`
                      : 'No items available.'
                    }
                  </div>
                )}
              </div>

              {/* Selected elements summary */}
              <div className="mt-4 mb-4">
                <h4 className="text-sm font-medium mb-2 dark:text-blue-400">Selected items:</h4>
                <div className="flex flex-wrap gap-2 border dark:border-gray-600 rounded-md p-2 min-h-[60px]">
                  {selectedIds.map(id => {
                    const info = getElementInfo(id);
                    return (
                      <div 
                        key={id}
                        className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 text-xs px-2 py-1 rounded-full flex items-center"
                      >
                        <div 
                          className="w-2 h-2 rounded-full mr-1" 
                          style={{ backgroundColor: info.color }}
                        />
                        <span>{info.name === `Sconosciuto (${id.slice(0, 8)}...)` ? `Unknown (${id.slice(0, 8)}...)` : info.name}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleItem(id);
                          }}
                          className="ml-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    );
                  })}
                  
                  {selectedIds.length === 0 && (
                    <div className="text-gray-500 dark:text-gray-400 text-sm py-2 px-3">
                      No items selected
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-4">
                <button
                  type="button"
                  onClick={closeDialog}
                  className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveSelection}
                  className="px-3 py-1.5 bg-blue-600 rounded text-sm text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Save Selection
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};