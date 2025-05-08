// src/components/JsonEditor.tsx
import { useState, useEffect } from 'react';

type JsonEditorProps = {
  value: string;
  onChange: (value: string) => void;
  height?: string;
  readOnly?: boolean;
};

export default function JsonEditor({ value, onChange, height = '400px', readOnly = false }: JsonEditorProps) {
  const [error, setError] = useState<string | null>(null);
  
  // Verifica la validità del JSON quando cambia
  useEffect(() => {
    try {
      JSON.parse(value);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
  }, [value]);
  
  // Funzione per evidenziare la sintassi (versione semplice)
  const highlightSyntax = (text: string): string => {
    // Questa è una versione molto semplice, può essere migliorata
    return text
      .replace(/"([^"]+)":/g, '<span class="text-purple-600">"$1"</span>:')
      .replace(/"([^"]+)"/g, '<span class="text-green-600">"$1"</span>')
      .replace(/\b(true|false|null)\b/g, '<span class="text-blue-600">$1</span>')
      .replace(/\b(\d+)\b/g, '<span class="text-orange-600">$1</span>');
  };
  
  return (
    <div className="w-full relative">
      {error && (
        <div className="absolute bottom-0 left-0 right-0 bg-red-100 text-red-700 px-3 py-1 text-xs">
          Errore di sintassi: {error}
        </div>
      )}
      
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full p-4 font-mono text-sm focus:outline-none border ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
        style={{ height, resize: 'vertical' }}
        spellCheck="false"
        readOnly={readOnly}
      />
    </div>
  );
}