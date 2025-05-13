import React, { useEffect, useRef, useState } from 'react';
import { useGCodeEditor, GCodeEditorProvider } from '@/src/contexts/GCodeEditorContext';
import { Edit, Code, X } from 'react-feather';
import { QuickEditToolbar } from '@/src/components/ai/GCodeAIAgent/components/toolbar';
import GCodeAIAgent from '@/src/components/ai/GCodeAIAgent/GCodeAIAgent';
import { useCAMStore } from '@/src/store/camStore';
import { QuickEditDialog } from '../ai/GCodeAIAgent/components';

interface EnhancedGCodeEditorProps {
  initialCode?: string;
  filename?: string;
  onChange?: (newCode: string) => void;
  onSave?: (code: string) => void;
  readOnly?: boolean;
}

// Componente interno che usa il context
const EditorContent: React.FC = () => {
  const { 
    content, 
    setContent, 
    selectedText, 
    showQuickEdit, 
    setShowQuickEdit, 
    quickEditPosition, 
    editorRef,
    replaceSelection
  } = useGCodeEditor();
  
  // Accedi allo store CAM
  const storeGcode = useCAMStore(state => state.gcode);
  const setStoreGcode = useCAMStore(state => state.setGcode);
  
  // Sincronizza l'editor con il camStore quando cambia
  useEffect(() => {
    if (storeGcode !== content) {
      setContent(storeGcode);
    }
  }, [storeGcode, setContent, content]);
  
  // Funzione per gestire l'input nell'editor
  const handleContentChange = (e: React.FormEvent<HTMLPreElement>) => {
    const newContent = e.currentTarget.textContent || '';
    setContent(newContent);
    
    // Aggiorna anche il camStore quando l'utente modifica il contenuto
    setStoreGcode(newContent);
  };
  
  // Funzione per il QuickEdit
  const handleQuickEdit = (instruction: string) => {
    // Qui di solito chiameresti un'API per ottenere una modifica AI
    // Per ora simuliamo una risposta
    const simulateAIEdit = () => {
      if (instruction.toLowerCase().includes('comment')) {
        return selectedText + " ; Questo è un commento aggiunto";
      } else if (instruction.toLowerCase().includes('speed')) {
        return selectedText.replace(/F\d+/, 'F1000');
      } else {
        return selectedText + " ; Modifica: " + instruction;
      }
    };
    
    const editedText = simulateAIEdit();
    replaceSelection(editedText);
    setShowQuickEdit(false);
  };

  
  
  // Calcolo delle righe per la numerazione
  const lines = content.split('\n');
  
  return (
    <div className="flex h-full bg-gradient-to-b from-[#2A2A2A] to-[#303030] text-white">
      {/* Numerazione delle righe */}
      <div className="text-right pr-2 pl-3 py-1 select-none bg-gradient-to-b from-[#2A2A2A] to-[#303030] text-gray-500">
        {lines.map((_, index) => (
          <div key={index}>{index + 1}</div>
        ))}
      </div>
      
      {/* Area di editing */}
      <div className="flex-1 relative">
        <pre
          ref={editorRef}
          contentEditable={true}
          suppressContentEditableWarning={true}
          onInput={handleContentChange}
          className="outline-none p-1 min-h-full whitespace-pre font-mono"
          spellCheck={false}
        >
          {content}
        </pre>
        
        {/* QuickEdit popup */}
        {showQuickEdit && selectedText && quickEditPosition && (
          <div 
            className="absolute bg-gradient-to-b from-[#2A2A2A] to-[#303030] border border-gray-700 rounded-lg shadow-lg overflow-hidden z-10"
            style={{ 
              top: quickEditPosition.top, 
              left: quickEditPosition.left,
              maxWidth: '300px'
            }}
          >
            <div className="flex justify-between items-center p-2 border-b border-gray-700">
              <div className="flex items-center">
                <Edit className="w-4 h-4 mr-2 text-blue-400" />
                <h3 className="text-sm font-medium">Edit Your Selection</h3>
              </div>
              <button 
                className="p-1 text-gray-400 hover:text-gray-200"
                onClick={() => setShowQuickEdit(false)}
              >
                <X size={14} />
              </button>
            </div>
            <div className="p-2">
              <input 
                type="text" 
                placeholder="Describe your edit (e.g., 'Make this spindle speed faster')" 
                className="w-full p-2 bg-gradient-to-b from-[#2A2A2A] to-[#303030] border border-gray-700 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleQuickEdit(e.currentTarget.value);
                  }
                }}
                autoFocus
              />
              <div className="flex justify-end mt-2">
                <button 
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm text-white"
                  onClick={(e) => {
                    const input = e.currentTarget.parentElement?.previousSibling as HTMLInputElement;
                    handleQuickEdit(input.value);
                  }}
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Toolbar che appare quando viene selezionato del testo */}
      {selectedText && !showQuickEdit && (
        <QuickEditToolbar 
          onQuickEdit={() => setShowQuickEdit(true)}
          onExplain={() => console.log('Explain selection')}
          onOptimize={() => console.log('Optimize selection')}
        />
      )}
      
    </div>
  );
};

// Componente principale che avvolge il contenuto con il provider
const EnhancedGCodeEditor: React.FC<EnhancedGCodeEditorProps> = ({
  initialCode,
  filename = 'Nuovo File.gcode',
  onChange,
  onSave,
  readOnly = false
}) => {
  // Accedi al G-code dallo store CAM
  const storeGcode = useCAMStore(state => state.gcode);
  
  // Usa il G-code dallo store come contenuto iniziale
  const initialContent = storeGcode || initialCode || '; GCode: generato con GCode Copilot\n; [!]\n';
  
  // Callback per notificare i cambiamenti all'esterno
  const handleChange = (newCode: string) => {
    if (onChange) {
      onChange(newCode);
    }
  };
  
  return (
    <GCodeEditorProvider initialContent={initialContent}>
      <div className="flex flex-col h-full border border-gray-700 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-blue-100  border-b border-gray-700">
          <div className="flex items-center">
            <Code className="w-4 h-4 mr-2 text-green-400" />
            <span>{filename}</span>
          </div>
          <div className="flex space-x-2">
            {/* Header buttons qui */}
          </div>
        </div>
        
        {/* Main content with editor and AI agent */}
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-auto">
            <EditorContent />
          </div>
          <GCodeAIWrapper onChange={handleChange} />
        </div>
      </div>
    </GCodeEditorProvider>
  );
};

// Componente wrapper per l'agente AI che accede al context
const GCodeAIWrapper: React.FC<{ onChange?: (code: string) => void }> = ({ onChange }) => {
  const { content, selectedText, replaceSelection } = useGCodeEditor();
  const setStoreGcode = useCAMStore(state => state.setGcode);
  
  // Funzione per aggiornare il GCode dall'agente AI
  const handleUpdateGCode = (newGCode: string) => {
    // Aggiorna lo store CAM
    setStoreGcode(newGCode);
    
    // Aggiorna la selezione o il contenuto
    if (selectedText) {
      replaceSelection(newGCode);
    }
    
    // Notifica i cambiamenti all'esterno
    if (onChange) {
      onChange(newGCode);
    }
  };
  
  return (
    <GCodeAIAgent 
      gcode={content}
      selectedCode={selectedText}
      onUpdateGCode={handleUpdateGCode}
      isExpanded={true}
      fileName="Codice GCode"
    />
  );
};

export default EnhancedGCodeEditor;