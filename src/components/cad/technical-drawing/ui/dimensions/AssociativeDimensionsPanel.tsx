// src/components/cad/technical-drawing/ui/dimensions/AssociativeDimensionsPanel.tsx
// Stub per AssociativeDimensionsPanel

import React from 'react';

interface AssociativeDimensionsPanelProps {
  enabled: boolean;
  readOnly: boolean;
}

const AssociativeDimensionsPanel: React.FC<AssociativeDimensionsPanelProps> = ({
  enabled,
  readOnly
}) => {
  return (
    <div className="p-4">
      <h3 className="font-semibold mb-4">Associative Dimensions</h3>
      {enabled ? (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            Associative dimensions system active
          </p>
          {!readOnly && (
            <div>
              <button className="px-3 py-1 bg-green-500 text-white rounded text-sm">
                Create Relationship
              </button>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          Associative dimensions disabled
        </p>
      )}
    </div>
  );
};

export default AssociativeDimensionsPanel;
