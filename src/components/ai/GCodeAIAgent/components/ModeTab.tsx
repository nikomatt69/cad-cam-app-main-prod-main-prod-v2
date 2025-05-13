// src/components/ai/GCodeAIAgent/components/ModeTab.tsx
import React from 'react';
import { AIAgentMode } from '../GCodeAIAgent';

export interface ModeTabProps {
  mode: AIAgentMode;
  activeMode: AIAgentMode;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const ModeTab: React.FC<ModeTabProps> = ({ mode, activeMode, onClick, icon, label }) => {
  return (
    <button
      className={`flex-1 py-2 px-1 flex flex-col items-center text-xs font-medium transition-colors duration-150 ease-in-out ${
        activeMode === mode
          ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-b-2 border-blue-500'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
      }`}
      onClick={onClick}
    >
      <div className="mb-1">{icon}</div>
      <span>{label}</span>
    </button>
  );
};

export default ModeTab;