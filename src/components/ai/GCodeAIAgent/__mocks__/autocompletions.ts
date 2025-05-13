// src/components/ai/GCodeAIAgent/__mocks__/autocompletions.ts
import { GCodeCompletion } from '@/src/hooks/useGCodeAI';

export const mockGCodeCompletions: Record<string, GCodeCompletion[]> = {
  // G commands
  'G': [
    { text: 'G0', description: 'Rapid positioning' },
    { text: 'G1', description: 'Linear interpolation' },
    { text: 'G2', description: 'CW circular interpolation' },
    { text: 'G3', description: 'CCW circular interpolation' },
    { text: 'G4', description: 'Dwell' }
  ],
  'G0': [
    { text: 'G0 X0 Y0', description: 'Rapid move to origin' },
    { text: 'G0 Z10', description: 'Rapid move up' },
    { text: 'G0 X', description: 'Rapid move in X' },
    { text: 'G0 Y', description: 'Rapid move in Y' },
    { text: 'G0 F1000', description: 'Set feed rate' }
  ],
  'G1': [
    { text: 'G1 X10 Y10 F100', description: 'Linear move with feed rate' },
    { text: 'G1 Z-1 F50', description: 'Linear move down slowly' },
    { text: 'G1 X', description: 'Linear move in X' },
    { text: 'G1 Y', description: 'Linear move in Y' },
    { text: 'G1 F', description: 'Set feed rate' }
  ],
  'G2': [
    { text: 'G2 X10 Y10 I5 J0 F100', description: 'CW arc with center offset' },
    { text: 'G2 X10 Y10 R5 F100', description: 'CW arc with radius' },
    { text: 'G2 I', description: 'X-offset for arc center' },
    { text: 'G2 J', description: 'Y-offset for arc center' },
    { text: 'G2 R', description: 'Arc radius' }
  ],
  
  // M commands
  'M': [
    { text: 'M0', description: 'Program pause' },
    { text: 'M1', description: 'Optional program pause' },
    { text: 'M2', description: 'Program end' },
    { text: 'M3', description: 'Spindle on CW' },
    { text: 'M4', description: 'Spindle on CCW' }
  ],
  'M3': [
    { text: 'M3 S1000', description: 'Spindle on CW at 1000 RPM' },
    { text: 'M3 S', description: 'Spindle on CW at specified RPM' }
  ],
  
  // Coordinate inputs
  'X': [
    { text: 'X0', description: 'X coordinate - origin' },
    { text: 'X0.5', description: 'X coordinate - half unit' },
    { text: 'X-10', description: 'X coordinate - negative' }
  ],
  'Y': [
    { text: 'Y0', description: 'Y coordinate - origin' },
    { text: 'Y0.5', description: 'Y coordinate - half unit' },
    { text: 'Y-10', description: 'Y coordinate - negative' }
  ],
  'Z': [
    { text: 'Z0', description: 'Z coordinate - origin' },
    { text: 'Z10', description: 'Z coordinate - safe height' },
    { text: 'Z-1', description: 'Z coordinate - cutting depth' }
  ],
  
  // Feed rates
  'F': [
    { text: 'F100', description: 'Feed rate - slow' },
    { text: 'F1000', description: 'Feed rate - normal' },
    { text: 'F3000', description: 'Feed rate - rapid' }
  ],
  
  // Spindle speeds
  'S': [
    { text: 'S1000', description: 'Spindle speed - 1000 RPM' },
    { text: 'S10000', description: 'Spindle speed - 10000 RPM' },
    { text: 'S24000', description: 'Spindle speed - 24000 RPM' }
  ]
};

// Function to get mock completions based on context
export const getMockCompletions = (context: string): GCodeCompletion[] => {
  // Extract the last token
  const lastToken = context.match(/([GM]\d+|[XYZFS][-]?\d*\.?\d*)$/)?.[0] || '';
  
  // Find the base token (G, G0, M, M3, X, Y, Z, F, S)
  let baseToken = '';
  
  if (lastToken.startsWith('G') || lastToken.startsWith('M')) {
    baseToken = lastToken.match(/[GM]\d+/)?.[0] || lastToken[0];
  } else if (['X', 'Y', 'Z', 'F', 'S'].includes(lastToken[0])) {
    baseToken = lastToken[0];
  }
  
  // Return matching completions or empty array
  return mockGCodeCompletions[baseToken] || [];
};

export default getMockCompletions;