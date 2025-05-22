// src/components/cad/tools/TextTool.tsx
// Strumento per aggiungere testo e annotazioni
// Tool for adding text and annotations

import React, { useEffect, useRef, useState } from 'react';
import { useTechnicalDrawingStore } from '../../../store/technicalDrawingStore';
import { BaseTool } from '../technical-drawing/core/ToolsManager';
import { DrawingEntityType, Point, TextAlignment, TextStyle } from '../../../types/TechnicalDrawingTypes';

/**
 * TextTool - Strumento per creare entità di testo e annotazioni
 * TextTool - Tool for creating text and annotation entities
 * 
 * Permette di posizionare testo sul disegno con varie opzioni di stile
 * Allows placing text on the drawing with various style options
 */
export class TextTool extends BaseTool {
  private text: string = '';
  private fontSize: number = 12;
  private fontFamily: string = 'Arial';
  private bold: boolean = false;
  private italic: boolean = false;
  private alignment: TextAlignment = TextAlignment.LEFT;
  private rotation: number = 0;
  private editingTextCallback: ((text: string) => void) | null = null;
  
  constructor() {
    super(
      'text',            // Tool ID
      'Testo',           // Tool name in Italian
      'text_fields',     // Material icon name
      'text',            // Cursor type
      {                  // Default style
        strokeColor: '#000000',
        fillColor: '#000000',
        strokeWidth: 1,
        strokeStyle: 'solid'
      },
      1                  // Required points (text position)
    );
  }
  
  onMouseDown(point: Point, event: React.MouseEvent): void {
    // Se è il primo punto, aggiungerlo come posizione del testo
    // If it's the first point, add it as text position
    if (this.tempPoints.length === 0) {
      this.tempPoints.push({ ...point });
      
      // Richiedi testo all'utente tramite callback
      // Request text from user via callback
      if (this.editingTextCallback) {
        this.editingTextCallback('');
      } else {
        this.text = 'Testo'; // Testo predefinito / Default text
        this.complete();
      }
      return;
    }
  }
  
  onMouseMove(point: Point, event: React.MouseEvent): void {
    // Solo anteprima della posizione del testo
    // Only preview of text position
    if (this.tempPoints.length === 0) {
      this.tempPoints[0] = { ...point };
    }
  }
  
  onKeyDown(event: React.KeyboardEvent): void {
    super.onKeyDown(event);
    
    // Se Invio è premuto con il testo già impostato, completa
    // If Enter is pressed with text already set, complete
    if (event.key === 'Enter' && this.text && this.tempPoints.length > 0) {
      this.complete();
    }
  }
  
  /**
   * Imposta il testo da utilizzare
   * Set the text to use
   */
  setText(text: string): void {
    this.text = text;
    if (this.tempPoints.length > 0) {
      this.complete();
    }
  }
  
  /**
   * Imposta le opzioni di stile del testo
   * Set text style options
   */
  setTextStyle(
    options: {
      fontSize?: number;
      fontFamily?: string;
      bold?: boolean;
      italic?: boolean;
      alignment?: TextAlignment;
      rotation?: number;
    }
  ): void {
    if (options.fontSize !== undefined) this.fontSize = options.fontSize;
    if (options.fontFamily) this.fontFamily = options.fontFamily;
    if (options.bold !== undefined) this.bold = options.bold;
    if (options.italic !== undefined) this.italic = options.italic;
    if (options.alignment !== undefined) this.alignment = options.alignment;
    if (options.rotation !== undefined) this.rotation = options.rotation;
  }
  
  /**
   * Imposta una callback per modificare il testo
   * Set a callback for editing text
   */
  setEditingTextCallback(callback: ((text: string) => void) | null): void {
    this.editingTextCallback = callback;
  }
  
  complete(): void {
    if (this.tempPoints.length > 0 && this.text.trim()) {
      const store = useTechnicalDrawingStore.getState();
      
      // Imposta lo stile del testo
      // Set text style
      const textStyle: TextStyle = {
        fontSize: this.fontSize,
        fontFamily: this.fontFamily,
        bold: this.bold,
        italic: this.italic,
        alignment: this.alignment,
        color: this.defaultStyle?.fillColor || '#000000'
      };
      
      // Crea l'entità di testo
      // Create the text entity
      const textEntity = {
        type: DrawingEntityType.TEXT,
        position: { ...this.tempPoints[0] },
        text: this.text,
        style: textStyle,
        rotation: this.rotation,
        layer: store.activeLayer,
        visible: true,
        locked: false
      };
      
      // Aggiungi l'entità allo store
      // Add the entity to the store
      store.addEntity(textEntity);
      
      // Resetta lo strumento per aggiungere altro testo
      // Reset the tool to add more text
      this.reset();
    }
  }
  
  reset(): void {
    super.reset();
    // Mantieni le impostazioni di stile del testo ma resetta il testo
    // Keep text style settings but reset the text
    this.text = '';
  }
  
  renderPreview(ctx: CanvasRenderingContext2D): void {
    if (this.tempPoints.length === 0) return;
    
    ctx.save();
    
    const position = this.tempPoints[0];
    const previewText = this.text || 'Testo'; // Mostra 'Testo' se nessun testo è stato inserito
    
    // Imposta lo stile del testo
    // Set text style
    ctx.fillStyle = this.defaultStyle?.fillColor || '#000000';
    
    let fontStyle = '';
    if (this.bold) fontStyle += 'bold ';
    if (this.italic) fontStyle += 'italic ';
    fontStyle += `${this.fontSize}px ${this.fontFamily}`;
    
    ctx.font = fontStyle;
    
    // Disegna cornice di selezione tratteggiata
    // Draw dashed selection frame
    const textMetrics = ctx.measureText(previewText);
    const textHeight = this.fontSize;
    let textWidth = textMetrics.width;
    
    // Calcola la posizione in base all'allineamento
    // Calculate position based on alignment
    let x = position.x;
    if (this.alignment === TextAlignment.CENTER) {
      x -= textWidth / 2;
    } else if (this.alignment === TextAlignment.RIGHT) {
      x -= textWidth;
    }
    
    // Disegna rettangolo tratteggiato intorno al testo
    // Draw dashed rectangle around text
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = '#0066FF';
    ctx.lineWidth = 1;
    
    // Applica rotazione al contesto di disegno
    // Apply rotation to drawing context
    if (this.rotation !== 0) {
      ctx.translate(position.x, position.y);
      ctx.rotate(this.rotation * Math.PI / 180);
      ctx.translate(-position.x, -position.y);
    }
    
    ctx.strokeRect(
      x - 2, 
      position.y - textHeight + 2,  // Aggiusta per baseline del testo / Adjust for text baseline
      textWidth + 4, 
      textHeight + 4
    );
    
    // Disegna il testo
    // Draw the text
    if (this.alignment === TextAlignment.LEFT) {
      ctx.textAlign = 'left';
    } else if (this.alignment === TextAlignment.CENTER) {
      ctx.textAlign = 'center';
      x = position.x;
    } else {
      ctx.textAlign = 'right';
      x = position.x;
    }
    
    ctx.textBaseline = 'top';
    ctx.fillText(previewText, x, position.y - textHeight + 4);
    
    // Disegna punto di posizionamento
    // Draw positioning point
    ctx.beginPath();
    ctx.fillStyle = '#FF0000';
    ctx.arc(position.x, position.y, 3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
}

/**
 * Componente di integrazione React per TextTool
 * React integration component for TextTool
 */
const TextToolComponent: React.FC = () => {
  const toolInstance = useRef<TextTool | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editText, setEditText] = useState<string>('');
  
  useEffect(() => {
    // Crea l'istanza dello strumento
    // Create the tool instance
    if (!toolInstance.current) {
      toolInstance.current = new TextTool();
      
      // Imposta callback per la modifica del testo
      // Set callback for text editing
      toolInstance.current.setEditingTextCallback((initialText) => {
        setEditText(initialText);
        setIsEditing(true);
      });
    }
    
    // Cleanup quando il componente viene smontato
    // Cleanup when component is unmounted
    return () => {
      if (toolInstance.current) {
        toolInstance.current.setEditingTextCallback(null);
      }
    };
  }, []);
  
  // Gestisce la conferma dell'inserimento del testo
  // Handle text input confirmation
  const handleTextConfirm = () => {
    if (toolInstance.current) {
      toolInstance.current.setText(editText);
      setIsEditing(false);
      setEditText('');
    }
  };
  
  // Se non stiamo modificando il testo, non mostra nulla
  // If we're not editing text, show nothing
  if (!isEditing) return null;
  
  // Mostra un input per il testo quando necessario
  // Show a text input when needed
  return (
    <div 
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'white',
        border: '1px solid #ccc',
        borderRadius: '4px',
        padding: '16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        zIndex: 1000
      }}
    >
      <h3>Inserisci Testo</h3>
      <textarea
        value={editText}
        onChange={(e) => setEditText(e.target.value)}
        style={{
          width: '100%',
          minWidth: '300px',
          minHeight: '80px',
          padding: '8px',
          marginBottom: '12px',
          border: '1px solid #ddd',
          borderRadius: '4px'
        }}
        autoFocus
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
        <button
          onClick={() => setIsEditing(false)}
          style={{
            padding: '8px 16px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: '#f5f5f5'
          }}
        >
          Annulla
        </button>
        <button
          onClick={handleTextConfirm}
          style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: '#0066FF',
            color: 'white'
          }}
        >
          Conferma
        </button>
      </div>
    </div>
  );
};

export default TextToolComponent;