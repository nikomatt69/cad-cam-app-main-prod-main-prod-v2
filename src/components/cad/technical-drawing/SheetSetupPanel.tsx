// src/components/technical-drawing/SheetSetupPanel.tsx

import React, { useState } from 'react';
import { useTechnicalDrawingStore } from 'src/store/technicalDrawingStore';
import { DrawingSheet, DrawingStandard } from 'src/types/TechnicalDrawingTypes';
import { getStandardConfig } from 'src/types/DrawingStandardTypes';

export const SheetSetupPanel: React.FC = () => {
  const { sheet, updateSheet, drawingStandard, setDrawingStandard } = useTechnicalDrawingStore();
  
  // Local state for form
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<DrawingSheet>>({});
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Handle special cases
    if (name === 'size') {
      // Update width and height based on standard sheet sizes
      const standardConfig = getStandardConfig(drawingStandard as any);
      const paperSize = standardConfig.paperSizes.find(size => size.name === value);
      
      if (paperSize) {
        setFormData({
          ...formData,
          size: value as any,
          width: paperSize.width,
          height: paperSize.height
        });
      } else {
        setFormData({
          ...formData,
          size: value as any
        });
      }
    } else if (name === 'orientation') {
      // Swap width and height for landscape orientation
      const orientation = value as 'portrait' | 'landscape';
      
      if (orientation !== formData.orientation) {
        setFormData({
          ...formData,
          orientation,
          width: formData.height || sheet.height,
          height: formData.width || sheet.width
        });
      }
    } else if (name.startsWith('titleBlock.fields.')) {
      // Update title block field
      const fieldName = name.replace('titleBlock.fields.', '');
      
      setFormData({
        ...formData,
        titleBlock: {
          ...formData.titleBlock,
          position: formData.titleBlock?.position || { x: 297, y: 287 },
          width: formData.titleBlock?.width || 120,
          height: formData.titleBlock?.height || 30,
          fields: {
            ...(formData.titleBlock?.fields || {
              title: '',
              drawingNumber: '',
              revision: '',
              date: new Date().toISOString().split('T')[0],
              author: '',
              approver: '',
              company: '',
              scale: '1:1',
              sheet: '1/1'
            }),
            [fieldName]: value
          }
        }
      });
    } else if (name.startsWith('margin.')) {
      // Update margin
      const marginSide = name.replace('margin.', '');
      
      setFormData({
        ...formData,
        margin: {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          ...(formData.margin || {}),
          [marginSide]: parseFloat(value)
        }
      });
    } else {
      // Handle regular input
      setFormData({
        ...formData,
        [name]: name === 'width' || name === 'height' || name === 'scale' 
          ? parseFloat(value) 
          : value
      });
    }
  };
  
  // Save changes
  const handleSave = () => {
    updateSheet(formData);
    setIsEditing(false);
    setFormData({});
  };
  
  // Cancel editing
  const handleCancel = () => {
    setIsEditing(false);
    setFormData({});
  };
  
  // Start editing
  const handleEdit = () => {
    setIsEditing(true);
    setFormData({
      ...sheet
    });
  };
  
  return (
    <div className="bg-white dark:bg-gray-900 shadow-md rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Sheet Setup</h2>
        {!isEditing ? (
          <button
            onClick={handleEdit}
            className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm"
          >
            Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white rounded-md text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm"
            >
              Save
            </button>
          </div>
        )}
      </div>
      
      {!isEditing ? (
        // View mode
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Size</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{sheet.size}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Orientation</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{sheet.orientation}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Width</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{sheet.width} {sheet.units}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Height</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{sheet.height} {sheet.units}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Scale</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">1:{sheet.scale}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Units</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{sheet.units}</p>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title Block</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Title: </span>
                <span className="text-gray-800 dark:text-gray-200">{sheet.titleBlock?.fields.title}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Drawing Number: </span>
                <span className="text-gray-800 dark:text-gray-200">{sheet.titleBlock?.fields.drawingNumber}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Revision: </span>
                <span className="text-gray-800 dark:text-gray-200">{sheet.titleBlock?.fields.revision}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Date: </span>
                <span className="text-gray-800 dark:text-gray-200">{sheet.titleBlock?.fields.date}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Author: </span>
                <span className="text-gray-800 dark:text-gray-200">{sheet.titleBlock?.fields.author}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Scale: </span>
                <span className="text-gray-800 dark:text-gray-200">{sheet.titleBlock?.fields.scale}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Drawing Standard</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{drawingStandard}</p>
          </div>
        </div>
      ) : (
        // Edit mode
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Size
              </label>
              <select
                name="size"
                value={formData.size || sheet.size}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
              >
                {drawingStandard === 'ANSI' ? (
                  <>
                    <option value="A">A (8.5&quot; × 11&quot;)</option>
                    <option value="B">B (11&quot; × 17&quot;)</option>
                    <option value="C">C (17&quot; × 22&quot;)</option>
                    <option value="D">D (22&quot; × 34&quot;)</option>
                    <option value="E">E (34&quot; × 44&quot;)</option>
                  </>
                ) : (
                  <>
                    <option value="A4">A4 (210mm × 297mm)</option>
                    <option value="A3">A3 (297mm × 420mm)</option>
                    <option value="A2">A2 (420mm × 594mm)</option>
                    <option value="A1">A1 (594mm × 841mm)</option>
                    <option value="A0">A0 (841mm × 1189mm)</option>
                  </>
                )}
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Orientation
              </label>
              <select
                name="orientation"
                value={formData.orientation || sheet.orientation}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Width ({formData.units || sheet.units})
              </label>
              <input
                type="number"
                name="width"
                value={formData.width !== undefined ? formData.width : sheet.width}
                onChange={handleInputChange}
                disabled={formData.size !== 'custom'}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white disabled:bg-gray-100 disabled:dark:bg-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Height ({formData.units || sheet.units})
              </label>
              <input
                type="number"
                name="height"
                value={formData.height !== undefined ? formData.height : sheet.height}
                onChange={handleInputChange}
                disabled={formData.size !== 'custom'}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white disabled:bg-gray-100 disabled:dark:bg-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Scale (1:X)
              </label>
              <input
                type="number"
                name="scale"
                value={formData.scale !== undefined ? formData.scale : sheet.scale}
                onChange={handleInputChange}
                min="0.1"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Units
              </label>
              <select
                name="units"
                value={formData.units || sheet.units}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
              >
                <option value="mm">Millimeters (mm)</option>
                <option value="cm">Centimeters (cm)</option>
                <option value="inch">Inches (in)</option>
              </select>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title Block</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  name="titleBlock.fields.title"
                  value={formData.titleBlock?.fields?.title || sheet.titleBlock?.fields.title || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Drawing Number
                </label>
                <input
                  type="text"
                  name="titleBlock.fields.drawingNumber"
                  value={formData.titleBlock?.fields?.drawingNumber || sheet.titleBlock?.fields.drawingNumber || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Revision
                </label>
                <input
                  type="text"
                  name="titleBlock.fields.revision"
                  value={formData.titleBlock?.fields?.revision || sheet.titleBlock?.fields.revision || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  name="titleBlock.fields.date"
                  value={formData.titleBlock?.fields?.date || sheet.titleBlock?.fields.date || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Author
                </label>
                <input
                  type="text"
                  name="titleBlock.fields.author"
                  value={formData.titleBlock?.fields?.author || sheet.titleBlock?.fields.author || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Drawing Standard
            </label>
            <select
              value={drawingStandard}
              onChange={(e) => setDrawingStandard(e.target.value as DrawingStandard)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            >
              <option value="ISO">ISO (International)</option>
              <option value="ANSI">ANSI (American)</option>
              <option value="DIN">DIN (German)</option>
              <option value="JIS">JIS (Japanese)</option>
              <option value="GB">GB (Chinese)</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </form>
      )}
    </div>
  );
};