// src/components/cam/GCodeEditor.tsx
import React from 'react';
import EnhancedGCodeEditor from './EnhancedGCodeEditor';
import { useCAMStore } from '@/src/store/camStore';

interface GCodeEditorProps {
  height?: string;
  value: string;
  onChange: (code: string) => void;
}

/**
 * GCodeEditor serves as the main editor component for G-code in the CAM application.
 * This is a wrapper component that uses the new EnhancedGCodeEditor with AI capabilities.
 */
const GCodeEditor: React.FC<GCodeEditorProps> = ({ 
  height = "100%",
  value, 
  onChange 
}) => {
  // Assicurati che camStore sia sincronizzato con il valore passato al componente
  const storeGcode = useCAMStore(state => state.gcode);
  const setStoreGcode = useCAMStore(state => state.setGcode);
  
  // Se il valore passato è diverso da quello nello store, aggiorna lo store
  React.useEffect(() => {
    if (value !== storeGcode) {
      setStoreGcode(value);
    }
  }, [value, storeGcode, setStoreGcode]);
  
  // Callback per quando l'editor cambia il contenuto
  const handleChange = (newCode: string) => {
    onChange(newCode);
    setStoreGcode(newCode);
  };

  return (
    <div style={{ height, width: "100%" }}>
      <EnhancedGCodeEditor 
        initialCode={value}
        onChange={handleChange}
      />
    </div>
  );
};

export default GCodeEditor;