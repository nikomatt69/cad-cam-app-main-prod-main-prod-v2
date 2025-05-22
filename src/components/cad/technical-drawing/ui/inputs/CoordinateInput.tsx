import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Point } from '../../TechnicalDrawingTypes';

interface CoordinateInputProps {
  onSubmit: (x: number, y: number) => void;
  initialValue?: Point;
  placeholder?: string;
}

const CoordinateInput: React.FC<CoordinateInputProps> = ({
  onSubmit,
  initialValue = { x: 0, y: 0 },
  placeholder = "Inserisci coordinate (es. 100,50)"
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isValid, setIsValid] = useState(true);
  const [hasFocus, setHasFocus] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Aggiorna il valore iniziale quando cambia
  useEffect(() => {
    if (initialValue && !hasFocus) {
      setInputValue(`${initialValue.x.toFixed(2)},${initialValue.y.toFixed(2)}`);
    }
  }, [initialValue, hasFocus]);
  
  // Funzione per analizzare le coordinate
  const parseCoordinates = (input: string): { x: number, y: number } | null => {
    // Supporta formati come "100,50" or "100 50" or "@100<45" (polare)
    
    // Formato cartesiano standard
    const cartesianRegex = /^(-?\d*\.?\d+)[,\s]+(-?\d*\.?\d+)$/;
    const cartesianMatch = input.match(cartesianRegex);
    
    if (cartesianMatch) {
      return {
        x: parseFloat(cartesianMatch[1]),
        y: parseFloat(cartesianMatch[2])
      };
    }
    
    // Formato polare: @distanza<angolo
    const polarRegex = /^@(-?\d*\.?\d+)[<\s]+(-?\d*\.?\d+)$/;
    const polarMatch = input.match(polarRegex);
    
    if (polarMatch) {
      const distance = parseFloat(polarMatch[1]);
      const angle = parseFloat(polarMatch[2]) * Math.PI / 180; // converti da gradi a radianti
      
      return {
        x: distance * Math.cos(angle),
        y: distance * Math.sin(angle)
      };
    }
    
    // Formato relativo: offset da punto corrente
    const relativeRegex = /^@(-?\d*\.?\d+)[,\s]+(-?\d*\.?\d+)$/;
    const relativeMatch = input.match(relativeRegex);
    
    if (relativeMatch) {
      return {
        x: initialValue.x + parseFloat(relativeMatch[1]),
        y: initialValue.y + parseFloat(relativeMatch[2])
      };
    }
    
    return null;
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    // Valida l'input durante la digitazione
    if (value === '' || parseCoordinates(value)) {
      setIsValid(true);
    } else {
      setIsValid(false);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const coordinates = parseCoordinates(inputValue);
    if (coordinates) {
      onSubmit(coordinates.x, coordinates.y);
      setIsValid(true);
      inputRef.current?.blur();
    } else {
      setIsValid(false);
    }
  };
  
  const handleFocus = () => {
    setHasFocus(true);
    setInputValue('');
  };
  
  const handleBlur = () => {
    setHasFocus(false);
    if (initialValue) {
      setInputValue(`${initialValue.x.toFixed(2)},${initialValue.y.toFixed(2)}`);
    }
  };
  
  return (
    <motion.form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        alignItems: 'center'
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        style={{
          border: `1px solid ${isValid ? '#d9d9d9' : '#ff4d4f'}`,
          borderRadius: '4px',
          padding: '4px 8px',
          width: '200px',
          outline: 'none',
          fontSize: '12px',
          transition: 'all 0.3s'
        }}
        whileFocus={{ 
          boxShadow: '0 0 0 2px rgba(24, 144, 255, 0.2)',
          borderColor: '#40a9ff'
        }}
      />
      
      <motion.button
        type="submit"
        style={{
          background: '#1890ff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          padding: '4px 8px',
          marginLeft: '8px',
          cursor: 'pointer',
          fontSize: '12px'
        }}
        whileHover={{ backgroundColor: '#40a9ff' }}
        whileTap={{ scale: 0.95 }}
        disabled={!isValid}
      >
        Vai
      </motion.button>
      
      {!isValid && (
        <motion.div
          style={{
            color: '#ff4d4f',
            fontSize: '12px',
            marginLeft: '8px'
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Formato non valido
        </motion.div>
      )}
    </motion.form>
  );
};

export default CoordinateInput;