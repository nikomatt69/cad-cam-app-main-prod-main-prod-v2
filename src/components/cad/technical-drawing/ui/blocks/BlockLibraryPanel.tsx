// src/components/cad/technical-drawing/ui/blocks/BlockLibraryPanel.tsx
// Stub per BlockLibraryPanel

import React from 'react';

interface BlockLibraryPanelProps {
  readOnly: boolean;
  showCategories: boolean;
}

const BlockLibraryPanel: React.FC<BlockLibraryPanelProps> = ({
  readOnly,
  showCategories
}) => {
  return (
    <div className="p-4">
      <h3 className="font-semibold mb-4">Block Library</h3>
      <div className="space-y-2">
        {showCategories && (
          <div className="text-sm text-gray-600 mb-2">
            Categories available
          </div>
        )}
        <p className="text-sm text-gray-600">
          Professional block management system
        </p>
        {!readOnly && (
          <div>
            <button className="px-3 py-1 bg-purple-500 text-white rounded text-sm mr-2">
              Insert Block
            </button>
            <button className="px-3 py-1 bg-gray-500 text-white rounded text-sm">
              Create Block
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlockLibraryPanel;
