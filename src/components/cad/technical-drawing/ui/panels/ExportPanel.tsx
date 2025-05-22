// src/components/cad/technical-drawing/ui/panels/ExportPanel.tsx
// Advanced export panel with preview and options

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDrawingExport, ExportOptions } from '../../useDrawingExport';
import { 
  Download, 
  FileImage, 
  FileText, 
  File, 
  Settings, 
  Eye, 
  Layers,
  Grid,
  Ruler,
  X,
  Check,
  AlertCircle
} from 'lucide-react';

interface ExportPanelProps {
  isOpen: boolean;
  onClose: () => void;
  canvas?: HTMLCanvasElement;
}

const ExportPanel: React.FC<ExportPanelProps> = ({
  isOpen,
  onClose,
  canvas
}) => {
  const { exportDrawing, getDrawingStats } = useDrawingExport();
  
  // State for export options
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'svg',
    filename: 'drawing',
    scale: 1,
    includeGrid: false,
    includeRulers: false,
    quality: 0.9,
    paperSize: 'A4'
  });
  
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Get drawing statistics
  const stats = getDrawingStats();
  
  // Format options
  const formatOptions = [
    {
      value: 'svg',
      label: 'SVG Vector',
      icon: FileText,
      description: 'Scalable vector graphics - best for editing',
      extension: '.svg'
    },
    {
      value: 'png',
      label: 'PNG Image',
      icon: FileImage,
      description: 'High-quality raster image',
      extension: '.png'
    },
    {
      value: 'pdf',
      label: 'PDF Document',
      icon: File,
      description: 'Portable document format',
      extension: '.pdf'
    },
    {
      value: 'dxf',
      label: 'DXF CAD',
      icon: Settings,
      description: 'AutoCAD exchange format',
      extension: '.dxf'
    }
  ];
  
  const paperSizes = [
    { value: 'A4', label: 'A4 (210×297mm)' },
    { value: 'A3', label: 'A3 (297×420mm)' },
    { value: 'A2', label: 'A2 (420×594mm)' },
    { value: 'A1', label: 'A1 (594×841mm)' },
    { value: 'A0', label: 'A0 (841×1189mm)' },
    { value: 'custom', label: 'Custom Size' }
  ];
  
  // Handle export
  const handleExport = async () => {
    setIsExporting(true);
    setExportStatus({ type: null, message: '' });
    
    try {
      await exportDrawing(exportOptions, canvas);
      setExportStatus({
        type: 'success',
        message: `Successfully exported as ${exportOptions.format.toUpperCase()}`
      });
    } catch (error: any) {
      setExportStatus({
        type: 'error',
        message: `Export failed: ${error.message}`
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  // Handle format change
  const handleFormatChange = (format: string) => {
    const formatOption = formatOptions.find(opt => opt.value === format);
    if (formatOption) {
      setExportOptions(prev => ({
        ...prev,
        format: format as any,
        filename: prev.filename.replace(/\.[^.]+$/, formatOption.extension)
      }));
    }
  };
  
  // Handle option change
  const updateOption = (key: keyof ExportOptions, value: any) => {
    setExportOptions(prev => ({ ...prev, [key]: value }));
  };
  
  if (!isOpen) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <Download className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Export Drawing</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="p-6 space-y-6 overflow-y-auto">
            {/* Drawing Statistics */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                <Eye className="w-4 h-4 mr-2" />
                Drawing Information
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total Entities:</span>
                  <span className="ml-2 font-medium">{stats.totalEntities}</span>
                </div>
                <div>
                  <span className="text-gray-600">Visible Entities:</span>
                  <span className="ml-2 font-medium">{stats.visibleEntities}</span>
                </div>
                <div>
                  <span className="text-gray-600">Layers:</span>
                  <span className="ml-2 font-medium">{stats.totalLayers}</span>
                </div>
                <div>
                  <span className="text-gray-600">Active Layers:</span>
                  <span className="ml-2 font-medium">
                    {stats.layerStats.filter(l => l.visible).length}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Format Selection */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Export Format</h3>
              <div className="grid grid-cols-2 gap-3">
                {formatOptions.map((format) => {
                  const Icon = format.icon;
                  const isSelected = exportOptions.format === format.value;
                  
                  return (
                    <button
                      key={format.value}
                      onClick={() => handleFormatChange(format.value)}
                      className={`p-4 rounded-lg border-2 transition-colors text-left ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        <Icon className={`w-5 h-5 ${
                          isSelected ? 'text-blue-600' : 'text-gray-400'
                        }`} />
                        <span className={`font-medium ${
                          isSelected ? 'text-blue-900' : 'text-gray-900'
                        }`}>
                          {format.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">{format.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Filename */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Filename
              </label>
              <input
                type="text"
                value={exportOptions.filename}
                onChange={(e) => updateOption('filename', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter filename"
              />
            </div>
            
            {/* Export Options */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Export Options</h3>
              <div className="space-y-4">
                {/* Scale */}
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Scale Factor: {exportOptions.scale}x
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="5"
                    step="0.1"
                    value={exportOptions.scale}
                    onChange={(e) => updateOption('scale', parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0.1x</span>
                    <span>5x</span>
                  </div>
                </div>
                
                {/* Quality for raster formats */}
                {(exportOptions.format === 'png') && (
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Quality: {Math.round(exportOptions.quality! * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.1"
                      value={exportOptions.quality}
                      onChange={(e) => updateOption('quality', parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                )}
                
                {/* Paper Size for PDF */}
                {exportOptions.format === 'pdf' && (
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Paper Size
                    </label>
                    <select
                      value={exportOptions.paperSize}
                      onChange={(e) => updateOption('paperSize', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {paperSizes.map(size => (
                        <option key={size.value} value={size.value}>
                          {size.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                {/* Include Options */}
                <div className="space-y-2">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeGrid}
                      onChange={(e) => updateOption('includeGrid', e.target.checked)}
                      className="form-checkbox h-4 w-4 text-blue-600"
                    />
                    <Grid className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">Include Grid</span>
                  </label>
                  
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeRulers}
                      onChange={(e) => updateOption('includeRulers', e.target.checked)}
                      className="form-checkbox h-4 w-4 text-blue-600"
                    />
                    <Ruler className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">Include Rulers</span>
                  </label>
                </div>
              </div>
            </div>
            
            {/* Layer Information */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                <Layers className="w-4 h-4 mr-2" />
                Layer Information
              </h3>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {stats.layerStats.map((layer, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-1 px-2 bg-gray-50 rounded"
                  >
                    <span className="text-sm text-gray-700">{layer.name}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">{layer.count} entities</span>
                      <div className={`w-2 h-2 rounded-full ${
                        layer.visible ? 'bg-green-400' : 'bg-gray-300'
                      }`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Export Status */}
            {exportStatus.type && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-md flex items-center space-x-2 ${
                  exportStatus.type === 'success'
                    ? 'bg-green-50 text-green-800'
                    : 'bg-red-50 text-red-800'
                }`}
              >
                {exportStatus.type === 'success' ? (
                  <Check className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                <span className="text-sm">{exportStatus.message}</span>
              </motion.div>
            )}
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            
            <button
              onClick={handleExport}
              disabled={isExporting || !exportOptions.filename.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ExportPanel;