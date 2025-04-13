// src/components/ai/AIArtifactRenderer.tsx
import React, { useState } from 'react';
import { AIArtifact } from '../../../../types/AITypes';

interface AIArtifactRendererProps {
  artifact: AIArtifact;
}

export const AIArtifactRenderer: React.FC<AIArtifactRendererProps> = ({ artifact }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Handle copying artifact content
  const handleCopy = () => {
    navigator.clipboard.writeText(artifact.content);
  };
  
  const renderArtifactContent = () => {
    if (!isExpanded) return null;
    
    switch (artifact.type) {
      case 'code':
        return (
          <pre className="p-3 bg-gray-800 text-gray-200 rounded overflow-x-auto">
            <code>{artifact.content}</code>
          </pre>
        );
        
      case 'json':
        try {
          const formattedJson = JSON.stringify(JSON.parse(artifact.content), null, 2);
          return (
            <pre className="p-3 bg-gray-800 text-gray-200 rounded overflow-x-auto">
              <code>{formattedJson}</code>
            </pre>
          );
        } catch (e) {
          return (
            <pre className="p-3 bg-gray-800 text-gray-200 rounded overflow-x-auto">
              <code>{artifact.content}</code>
            </pre>
          );
        }
        
      case 'cad':
        // For CAD components, we could add a 3D preview here
        try {
          const cadData = JSON.parse(artifact.content);
          return (
            <div className="border border-gray-300 rounded p-3">
              <div className="mb-2 text-sm font-medium">CAD Component: {cadData.type || 'Unknown'}</div>
              <pre className="p-3 bg-gray-800 text-gray-200 rounded overflow-x-auto text-xs">
                <code>{JSON.stringify(cadData, null, 2)}</code>
              </pre>
              {/* Here you could add a 3D preview component */}
            </div>
          );
        } catch (e) {
          return (
            <pre className="p-3 bg-gray-800 text-gray-200 rounded overflow-x-auto">
              <code>{artifact.content}</code>
            </pre>
          );
        }
        
      case 'markdown':
        // Here you could add a markdown renderer
        return (
          <div className="p-3 border border-gray-200 rounded bg-white">
            {artifact.content}
          </div>
        );
        
      default:
        return (
          <pre className="p-3 bg-gray-100 rounded overflow-x-auto">
            {artifact.content}
          </pre>
        );
    }
  };
  
  return (
    <div className="border border-gray-200 rounded-md overflow-hidden bg-white">
      <div className="flex justify-between items-center px-3 py-2 bg-gray-100 border-b">
        <div className="font-medium text-sm">{artifact.title || 'Artifact'}</div>
        <div className="flex space-x-2">
          <button 
            onClick={handleCopy}
            className="text-xs px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 transition-colors"
          >
            Copy
          </button>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 transition-colors"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>
      {renderArtifactContent()}
    </div>
  );
};