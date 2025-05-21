// src/components/cad/technical-drawing/NumericInput.tsx

import React, { useState, useEffect, useRef } from 'react';

interface NumericInputProps {
  label: string;
  defaultValue?: number;
  onSubmit: (value: number) => void;
  onCancel: () => void;
}

export const NumericInput: React.FC<NumericInputProps> = ({
  label,
  defaultValue = 0,
  onSubmit,
  onCancel
}) => {
  const [value, setValue] = useState(defaultValue.toString());
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);
  
  const handleSubmit = () => {
    try {
      // Parse the value allowing for expressions
      // This is a simple version - could be expanded to support more complex expressions
      // eslint-disable-next-line no-eval
      const parsedValue = eval(value);
      if (typeof parsedValue === 'number' && !isNaN(parsedValue)) {
        onSubmit(parsedValue);
      }
    } catch (e) {
      console.error('Invalid numeric expression:', e);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };
  
  return (
    <div className="flex items-center h-full px-2 bg-gray-100 border-t border-gray-300">
      <span className="text-gray-600 mr-2">{label || 'Value:'}</span>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-1 bg-transparent border-none outline-none text-gray-800 h-full"
        placeholder="Enter value..."
      />
      <button
        onClick={handleSubmit}
        className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-xs"
      >
        OK
      </button>
      <button
        onClick={onCancel}
        className="ml-2 px-3 py-1 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-xs"
      >
        Cancel
      </button>
    </div>
  );
};