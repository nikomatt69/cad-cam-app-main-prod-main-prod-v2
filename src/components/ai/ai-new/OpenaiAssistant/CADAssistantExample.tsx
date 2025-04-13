import React from 'react';
import { ChevronRight } from 'react-feather';

interface CADAssistantExamplesProps {
  onSelectExample: (example: string) => void;
}

export const CADAssistantExamples: React.FC<CADAssistantExamplesProps> = ({
  onSelectExample
}) => {
  const examples = [
    "Create a simple chair with four legs, a seat, and a backrest",
    "Make a table with a rectangular top and four cylindrical legs",
    "Design a simple car with a body, four wheels, and windows",
    "Create a basic phone model with a screen and buttons",
    "Design a computer monitor with a stand",
    "Make a coffee mug with a handle"
  ];
  
  return (
    <div className="p-3 border-t border-gray-200">
      <h3 className="text-xs font-medium text-gray-700 mb-2">Examples you can try:</h3>
      <div className="space-y-1">
        {examples.map((example, index) => (
          <button
            key={index}
            onClick={() => onSelectExample(example)}
            className="w-full text-left text-xs p-1.5 rounded-md hover:bg-blue-50 text-blue-700 flex items-center transition-colors"
          >
            <ChevronRight size={12} className="mr-1 flex-shrink-0" />
            <span className="line-clamp-1">{example}</span>
          </button>
        ))}
      </div>
    </div>
  );
};