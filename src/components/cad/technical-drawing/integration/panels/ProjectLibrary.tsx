import React, { useState } from 'react';
import { Search, FolderOpen, FileText, Plus, Grid, List, Filter } from 'lucide-react';

/**
 * Libreria di progetti e componenti riutilizzabili
 * Library of projects and reusable components
 */
const ProjectLibrary: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Categorie disponibili per il filtraggio
  // Available categories for filtering
  const categories = [
    { id: 'all', name: 'Tutto' },
    { id: 'mechanical', name: 'Meccanici' },
    { id: 'electrical', name: 'Elettrici' },
    { id: 'architectural', name: 'Architettonici' },
    { id: 'symbols', name: 'Simboli' },
  ];
  
  // Dati di esempio per i componenti della libreria
  // Example data for library components
  const libraryItems = [
    { 
      id: 1, 
      name: 'Cuscinetto 608ZZ', 
      category: 'mechanical',
      thumbnail: 'bearing.png',
      lastModified: new Date(2025, 4, 15) 
    },
    { 
      id: 2, 
      name: 'Motore DC 12V', 
      category: 'electrical',
      thumbnail: 'motor.png',
      lastModified: new Date(2025, 4, 10) 
    },
    { 
      id: 3, 
      name: 'Resistenza 10kΩ', 
      category: 'electrical',
      thumbnail: 'resistor.png',
      lastModified: new Date(2025, 4, 8) 
    },
    { 
      id: 4, 
      name: 'Porta standard', 
      category: 'architectural',
      thumbnail: 'door.png',
      lastModified: new Date(2025, 4, 5) 
    },
    { 
      id: 5, 
      name: 'Finestra doppia', 
      category: 'architectural',
      thumbnail: 'window.png',
      lastModified: new Date(2025, 4, 3) 
    },
    { 
      id: 6, 
      name: 'Simbolo saldatura', 
      category: 'symbols',
      thumbnail: 'welding.png',
      lastModified: new Date(2025, 4, 1) 
    },
    { 
      id: 7, 
      name: 'Simbolo tolleranza', 
      category: 'symbols',
      thumbnail: 'tolerance.png',
      lastModified: new Date(2025, 3, 28) 
    },
    { 
      id: 8, 
      name: 'Vite M8', 
      category: 'mechanical',
      thumbnail: 'screw.png',
      lastModified: new Date(2025, 3, 25) 
    },
  ];
  
  // Filtra gli elementi della libreria in base alla ricerca e alla categoria
  // Filter library items based on search and category
  const filteredItems = libraryItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  
  // Funzione per aggiungere un componente al disegno
  // Function to add a component to the drawing
  const addComponentToDrawing = (itemId: number) => {
    console.log(`Aggiungi componente ${itemId} al disegno`);
    // In un'implementazione reale, questa funzione aggiungerebbe il componente al disegno attuale
    // In a real implementation, this function would add the component to the current drawing
  };
  
  return (
    <div className="p-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg">Libreria di componenti</h3>
        <button className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50 flex items-center gap-1">
          <Plus size={16} />
          <span className="text-sm">Nuovo</span>
        </button>
      </div>
      
      {/* Barra di ricerca */}
      {/* Search bar */}
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={16} className="text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Cerca componenti..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      {/* Filtri di categoria e controlli di visualizzazione */}
      {/* Category filters and view controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-500" />
          <select
            className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map(category => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center border rounded-md overflow-hidden">
          <button
            className={`p-1.5 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'bg-white text-gray-500'}`}
            onClick={() => setViewMode('grid')}
          >
            <Grid size={16} />
          </button>
          <button
            className={`p-1.5 ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'bg-white text-gray-500'}`}
            onClick={() => setViewMode('list')}
          >
            <List size={16} />
          </button>
        </div>
      </div>
      
      {/* Visualizzazione libreria - Griglia o Lista */}
      {/* Library view - Grid or List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filteredItems.map(item => (
            <div 
              key={item.id}
              className="border rounded-md p-2 hover:border-blue-300 hover:shadow-sm cursor-pointer"
              onClick={() => addComponentToDrawing(item.id)}
            >
              <div className="aspect-square bg-gray-100 rounded-md mb-2 flex items-center justify-center">
                {/* In un'implementazione reale, qui sarebbe mostrata un'anteprima del componente */}
                {/* In a real implementation, a component preview would be shown here */}
                <FileText size={24} className="text-gray-400" />
              </div>
              <div className="text-sm font-medium truncate">{item.name}</div>
              <div className="text-xs text-gray-500">{item.category}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border rounded-md divide-y">
          {filteredItems.map(item => (
            <div 
              key={item.id}
              className="p-2 flex items-center gap-3 hover:bg-gray-50 cursor-pointer"
              onClick={() => addComponentToDrawing(item.id)}
            >
              <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center flex-shrink-0">
                <FileText size={16} className="text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{item.name}</div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{item.category}</span>
                  <span>•</span>
                  <span>{item.lastModified.toLocaleDateString()}</span>
                </div>
              </div>
              <button className="p-1.5 rounded-full text-blue-500 hover:bg-blue-50">
                <Plus size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
      
      {filteredItems.length === 0 && (
        <div className="text-center py-8">
          <FolderOpen size={36} className="mx-auto text-gray-300 mb-2" />
          <p className="text-gray-500">Nessun componente trovato</p>
          <p className="text-sm text-gray-400">Prova a modificare i filtri di ricerca</p>
        </div>
      )}
    </div>
  );
};

export default ProjectLibrary;
