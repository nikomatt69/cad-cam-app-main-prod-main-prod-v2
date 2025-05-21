// src/components/technical-drawing/ViewportsPanel.tsx

import React, { useState } from 'react';
import { useTechnicalDrawingStore } from 'src/store/technicalDrawingStore';
import { Plus, Edit2, Trash2 } from 'react-feather';

export const ViewportsPanel: React.FC = () => {
  const { 
    viewports, 
    activeViewportId, 
    setActiveViewport, 
    addViewport, 
    updateViewport, 
    deleteViewport 
  } = useTechnicalDrawingStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editViewportId, setEditViewportId] = useState<string | null>(null);
  const [viewportForm, setViewportForm] = useState<{
    name: string;
    type: 'front' | 'top' | 'side' | 'isometric' | 'section' | 'detail' | 'custom';
    scale: number;
  }>({
    name: '',
    type: 'front',
    scale: 1
  });
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setViewportForm({
      ...viewportForm,
      [name]: name === 'scale' ? parseFloat(value) : value
    });
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editViewportId) {
      // Update existing viewport
      updateViewport(editViewportId, viewportForm);
    } else {
      // Add new viewport
      addViewport({
        name: viewportForm.name,
        type: viewportForm.type as any,
        position: { x: 50, y: 50 },
        width: 150,
        height: 100,
        scale: viewportForm.scale,
        entities: []
      });
    }
    
    // Reset form
    setIsEditing(false);
    setEditViewportId(null);
    setViewportForm({
      name: '',
      type: 'front',
      scale: 1
    });
  };
  
  // Start editing a viewport
  const handleEdit = (viewportId: string) => {
    const viewport = viewports[viewportId];
    if (!viewport) return;
    
    setEditViewportId(viewportId);
    setViewportForm({
      name: viewport.name,
      type: viewport.type,
      scale: viewport.scale
    });
    setIsEditing(true);
  };
  
  // Delete a viewport
  const handleDelete = (viewportId: string) => {
    if (Object.keys(viewports).length <= 1) {
      alert('Cannot delete the last viewport');
      return;
    }
    
    if (confirm('Are you sure you want to delete this viewport?')) {
      deleteViewport(viewportId);
    }
  };
  
  // Start adding a new viewport
  const handleAddNew = () => {
    setEditViewportId(null);
    setViewportForm({
      name: 'New Viewport',
      type: 'front',
      scale: 1
    });
    setIsEditing(true);
  };
  
  return (
    <div className="bg-white dark:bg-gray-900 shadow-md rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Viewports</h2>
        <button
          onClick={handleAddNew}
          className="p-1 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300"
        >
          <Plus size={16} />
        </button>
      </div>
      
      {isEditing ? (
        <form onSubmit={handleSubmit} className="mb-4">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name
              </label>
              <input
                type="text"
                name="name"
                value={viewportForm.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type
              </label>
              <select
                name="type"
                value={viewportForm.type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
              >
                <option value="front">Front View</option>
                <option value="top">Top View</option>
                <option value="side">Side View</option>
                <option value="isometric">Isometric View</option>
                <option value="section">Section View</option>
                <option value="detail">Detail View</option>
                <option value="custom">Custom View</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Scale
              </label>
              <input
                type="number"
                name="scale"
                value={viewportForm.scale}
                onChange={handleInputChange}
                min="0.1"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setEditViewportId(null);
                }}
                className="px-3 py-1 border border-gray-300 dark:border-gray-700 rounded-md text-gray-700 dark:text-gray-300 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm"
              >
                {editViewportId ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="space-y-2">
          {Object.entries(viewports).map(([id, viewport]) => (
            <div
              key={id}
              className={`flex items-center justify-between p-2 rounded-md cursor-pointer ${
                activeViewportId === id 
                  ? 'bg-blue-100 dark:bg-blue-900' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              onClick={() => setActiveViewport(id)}
            >
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {viewport.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {viewport.type.charAt(0).toUpperCase() + viewport.type.slice(1)} • Scale {viewport.scale}:1
                </div>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(id);
                  }}
                  className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(id);
                  }}
                  className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};