// src/components/cad/technical-drawing/core/blocks/BlockTypes.ts
// Sistema di blocchi e simboli per CAD professionale

import { DrawingEntity, Dimension, Annotation, Point } from '../../TechnicalDrawingTypes';

export interface BlockDefinition {
  id: string;
  name: string;
  description?: string;
  category: string;
  tags: string[];
  
  // Geometric data
  entities: DrawingEntity[];
  dimensions: Dimension[];
  annotations: Annotation[];
  
  // Block properties
  basePoint: Point; // Insertion point
  bounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
  
  // Visual properties
  thumbnail?: string; // Base64 encoded SVG or image
  previewPath?: string; // SVG path for quick preview
  
  // Metadata
  author?: string;
  version: string;
  createdDate: Date;
  modifiedDate: Date;
  usage: number; // How many times it's been used
  
  // Technical properties
  scalable: boolean;
  rotatable: boolean;
  mirrorable: boolean;
  parametric: boolean;
  
  // Custom properties for parametric blocks
  parameters?: BlockParameter[];
}

export interface BlockParameter {
  id: string;
  name: string;
  type: 'number' | 'string' | 'boolean' | 'point' | 'angle';
  defaultValue: any;
  minValue?: number;
  maxValue?: number;
  description?: string;
  formula?: string; // For calculated parameters
}

export interface BlockInstance {
  id: string;
  blockDefinitionId: string;
  name?: string;
  
  // Transformation
  position: Point;
  rotation: number; // in radians
  scaleX: number;
  scaleY: number;
  mirrored: boolean;
  
  // Layer and style
  layer: string;
  visible: boolean;
  locked: boolean;
  
  // Parameter values (for parametric blocks)
  parameterValues?: Record<string, any>;
  
  // Metadata
  insertedDate: Date;
  lastModified: Date;
}

export interface BlockLibrary {
  id: string;
  name: string;
  description?: string;
  version: string;
  
  // Categories organization
  categories: BlockCategory[];
  blocks: BlockDefinition[];
  
  // Library metadata
  author?: string;
  createdDate: Date;
  modifiedDate: Date;
  isSystem: boolean; // Built-in vs user library
  
  // Settings
  readOnly: boolean;
  iconPath?: string;
}

export interface BlockCategory {
  id: string;
  name: string;
  description?: string;
  parentId?: string; // For nested categories
  iconPath?: string;
  color?: string;
  order: number;
}

export interface BlockInsertionOptions {
  position: Point;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  mirrored?: boolean;
  layer?: string;
  parameterValues?: Record<string, any>;
  explode?: boolean; // Insert as individual entities
}

export interface BlockSearchCriteria {
  query?: string;
  category?: string;
  tags?: string[];
  author?: string;
  scalable?: boolean;
  parametric?: boolean;
  sortBy?: 'name' | 'usage' | 'date' | 'category';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
}

export interface BlockValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

// Standard block categories
export const STANDARD_CATEGORIES = {
  MECHANICAL: {
    id: 'mechanical',
    name: 'Mechanical',
    subcategories: [
      'fasteners', 'bearings', 'gears', 'springs', 'valves', 'pipes', 'fittings'
    ]
  },
  ELECTRICAL: {
    id: 'electrical',
    name: 'Electrical',
    subcategories: [
      'symbols', 'connectors', 'switches', 'motors', 'transformers', 'circuits'
    ]
  },
  ARCHITECTURAL: {
    id: 'architectural',
    name: 'Architectural',
    subcategories: [
      'doors', 'windows', 'furniture', 'fixtures', 'stairs', 'elevations'
    ]
  },
  STRUCTURAL: {
    id: 'structural',
    name: 'Structural',
    subcategories: [
      'beams', 'columns', 'connections', 'foundations', 'reinforcement'
    ]
  },
  SYMBOLS: {
    id: 'symbols',
    name: 'Symbols',
    subcategories: [
      'welding', 'surface-finish', 'geometric-tolerance', 'general', 'standards'
    ]
  },
  ANNOTATIONS: {
    id: 'annotations',
    name: 'Annotations',
    subcategories: [
      'title-blocks', 'revision-clouds', 'leaders', 'callouts', 'notes'
    ]
  }
};

// Common block templates
export const BLOCK_TEMPLATES = {
  SIMPLE_SYMBOL: {
    name: 'Simple Symbol',
    description: 'Basic symbol with single geometry',
    scalable: true,
    rotatable: true,
    mirrorable: true,
    parametric: false
  },
  PARAMETRIC_PART: {
    name: 'Parametric Part',
    description: 'Configurable part with parameters',
    scalable: false,
    rotatable: true,
    mirrorable: false,
    parametric: true
  },
  TITLE_BLOCK: {
    name: 'Title Block',
    description: 'Drawing title block with text fields',
    scalable: false,
    rotatable: false,
    mirrorable: false,
    parametric: true
  },
  STANDARD_PART: {
    name: 'Standard Part',
    description: 'Fixed size standard component',
    scalable: false,
    rotatable: true,
    mirrorable: true,
    parametric: false
  }
};

export default {
  BlockDefinition,
  BlockParameter,
  BlockInstance,
  BlockLibrary,
  BlockCategory,
  BlockInsertionOptions,
  BlockSearchCriteria,
  BlockValidationResult,
  STANDARD_CATEGORIES,
  BLOCK_TEMPLATES
};