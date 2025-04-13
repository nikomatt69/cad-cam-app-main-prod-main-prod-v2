// src/components/ai/AIArtifactRenderer.tsx
import React, { useState } from 'react';
import { AIArtifact, AIAction } from '../../../../types/AITypes';
import { CADElementPreview } from './CADElementPreview';

interface AIArtifactRendererProps {
  artifact: AIArtifact;
  onAddToCanvas?: (cadData: any) => void;
}

export const AIArtifactRenderer: React.FC<AIArtifactRendererProps> = ({ artifact, onAddToCanvas }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Handle copying artifact content
  const handleCopy = () => {
    navigator.clipboard.writeText(artifact.content);
  };
  
  // Handle adding to canvas
  const handleAddToCanvas = () => {
    if (artifact.type === 'cad' && onAddToCanvas) {
      try {
        const cadData = JSON.parse(artifact.content);
        onAddToCanvas(cadData);
      } catch (error) {
        console.error("Failed to parse CAD artifact content:", error);
        // Optionally, provide user feedback about the error
      }
    }
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
        // For CAD components, render using CADElementPreview
        try {
          const cadAction = JSON.parse(artifact.content) as AIAction;
          if (cadAction.type === 'generateCADElement' && cadAction.payload?.elements) {
            return (
              <div className="p-3">
                <div className="mb-2 text-sm font-medium text-gray-700">
                  {artifact.title || 'CAD Preview'}
                </div>
                <CADElementPreview action={cadAction} />
              </div>
            );
          } else {
            return (
              <pre className="p-3 bg-gray-800 text-gray-200 rounded overflow-x-auto text-xs">
                <code>{JSON.stringify(cadAction, null, 2)}</code>
              </pre>
            );
          }
        } catch (e) {
          console.error("Failed to parse or render CAD artifact:", e);
          return (
            <pre className="p-3 bg-gray-800 text-red-400 rounded overflow-x-auto">
              <code>Error rendering CAD preview. Raw content: {artifact.content}</code>
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
          {artifact.type === 'cad' && onAddToCanvas && (
            <button
              onClick={handleAddToCanvas}
              className="text-xs px-2 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors"
            >
              Add to Canvas
            </button>
          )}
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