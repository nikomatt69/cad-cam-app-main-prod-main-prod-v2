import React, { useState, useEffect, useRef } from 'react';
import { Point } from '../../../../../types/TechnicalDrawingTypes';

export type CoordinateFormat = 'cartesian' | 'polar';

interface CoordinateInputProps {
  value?: Point;
  onChange?: (point: Point) => void;
  onSubmit?: (point: Point) => void;
  relativeMode?: boolean;
  basePoint?: Point;
  allowFormatToggle?: boolean;
  defaultFormat?: CoordinateFormat;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * A component for entering precise coordinates in either Cartesian (x,y) or Polar (r<θ) format
 * Supports both absolute and relative coordinate input
 */
const CoordinateInput: React.FC<CoordinateInputProps> = ({
  value,
  onChange,
  onSubmit,
  relativeMode = false,
  basePoint = { x: 0, y: 0 },
  allowFormatToggle = true,
  defaultFormat = 'cartesian',
  placeholder = 'Enter coordinates...',
  className = '',
  style = {},
}) => {
  const [inputValue, setInputValue] = useState('');
  const [format, setFormat] = useState<CoordinateFormat>(defaultFormat);
  const [isValid, setIsValid] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Update input value when external value changes
  useEffect(() => {
    if (value) {
      if (format === 'cartesian') {
        if (relativeMode) {
          const relX = value.x - basePoint.x;
          const relY = value.y - basePoint.y;
          setInputValue(`${relX.toFixed(2)},${relY.toFixed(2)}`);
        } else {
          setInputValue(`${value.x.toFixed(2)},${value.y.toFixed(2)}`);
        }
      } else {
        // Convert to polar coordinates
        let x = value.x;
        let y = value.y;
        
        if (relativeMode) {
          x = value.x - basePoint.x;
          y = value.y - basePoint.y;
        }
        
        const r = Math.sqrt(x * x + y * y);
        const theta = Math.atan2(y, x) * (180 / Math.PI);
        setInputValue(`${r.toFixed(2)}<${theta.toFixed(2)}`);
      }
    } else {
      setInputValue('');
    }
  }, [value, format, relativeMode, basePoint]);

  // Parse input and convert to a Point
  const parseInput = (input: string): Point | null => {
    try {
      if (format === 'cartesian') {
        // Parse cartesian format (x,y)
        const parts = input.split(',');
        if (parts.length !== 2) return null;
        
        const x = parseFloat(parts[0].trim());
        const y = parseFloat(parts[1].trim());
        
        if (isNaN(x) || isNaN(y)) return null;
        
        if (relativeMode) {
          return {
            x: basePoint.x + x,
            y: basePoint.y + y,
          };
        } else {
          return { x, y };
        }
      } else {
        // Parse polar format (r<θ)
        const parts = input.split('<');
        if (parts.length !== 2) return null;
        
        const r = parseFloat(parts[0].trim());
        const theta = parseFloat(parts[1].trim()) * (Math.PI / 180); // Convert to radians
        
        if (isNaN(r) || isNaN(theta)) return null;
        
        const x = r * Math.cos(theta);
        const y = r * Math.sin(theta);
        
        if (relativeMode) {
          return {
            x: basePoint.x + x,
            y: basePoint.y + y,
          };
        } else {
          return { x, y };
        }
      }
    } catch (error) {
      return null;
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    if (newValue.trim() === '') {
      setIsValid(true);
      setErrorMessage('');
      return;
    }
    
    const point = parseInput(newValue);
    if (point) {
      setIsValid(true);
      setErrorMessage('');
      
      if (onChange) {
        onChange(point);
      }
    } else {
      setIsValid(false);
      setErrorMessage(
        format === 'cartesian' 
          ? 'Invalid format. Use x,y (e.g. 10.5,20)'
          : 'Invalid format. Use r<θ (e.g. 15<45)'
      );
    }
  };

  // Handle input submission (Enter key press)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const point = parseInput(inputValue);
      if (point && onSubmit) {
        onSubmit(point);
        
        // Focus the input again to continue entering coordinates
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.select();
          }
        }, 0);
      }
    }
  };

  // Toggle between Cartesian and Polar formats
  const toggleFormat = () => {
    if (!allowFormatToggle) return;
    
    const newFormat = format === 'cartesian' ? 'polar' : 'cartesian';
    setFormat(newFormat);
    
    // Try to convert the current input to the new format
    if (inputValue.trim() !== '') {
      const point = parseInput(inputValue);
      if (point) {
        // The input is valid, so update it to the new format
        if (newFormat === 'cartesian') {
          if (relativeMode) {
            const relX = point.x - basePoint.x;
            const relY = point.y - basePoint.y;
            setInputValue(`${relX.toFixed(2)},${relY.toFixed(2)}`);
          } else {
            setInputValue(`${point.x.toFixed(2)},${point.y.toFixed(2)}`);
          }
        } else {
          // Convert to polar
          let x = point.x;
          let y = point.y;
          
          if (relativeMode) {
            x = point.x - basePoint.x;
            y = point.y - basePoint.y;
          }
          
          const r = Math.sqrt(x * x + y * y);
          const theta = Math.atan2(y, x) * (180 / Math.PI);
          setInputValue(`${r.toFixed(2)}<${theta.toFixed(2)}`);
        }
      } else {
        // The input isn't valid, so clear it
        setInputValue('');
      }
    }
  };

  return (
    <div className={`coordinate-input-container ${className}`} style={{ 
      position: 'relative',
      display: 'flex',
      ...style
    }}>
      <input
        ref={inputRef}
        type="text"
        className={`coordinate-input ${isValid ? '' : 'invalid'}`}
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        style={{
          flex: 1,
          padding: '8px 12px',
          borderRadius: allowFormatToggle ? '4px 0 0 4px' : '4px',
          border: isValid ? '1px solid #ddd' : '1px solid #ff4d4f',
          outline: 'none',
        }}
      />
      
      {allowFormatToggle && (
        <button
          type="button"
          onClick={toggleFormat}
          title={`Switch to ${format === 'cartesian' ? 'Polar' : 'Cartesian'} format`}
          style={{
            padding: '8px 12px',
            backgroundColor: '#f5f5f5',
            border: '1px solid #ddd',
            borderLeft: 'none',
            borderRadius: '0 4px 4px 0',
            cursor: 'pointer'
          }}
        >
          {format === 'cartesian' ? 'x,y' : 'r<θ'}
        </button>
      )}
      
      {!isValid && errorMessage && (
        <div className="error-message" style={{
          position: 'absolute',
          bottom: '-22px',
          left: 0,
          color: '#ff4d4f',
          fontSize: '12px',
        }}>
          {errorMessage}
        </div>
      )}
    </div>
  );
};

export default CoordinateInput; 