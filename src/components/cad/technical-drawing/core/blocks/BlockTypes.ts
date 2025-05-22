// src/components/cad/technical-drawing/core/blocks/BlockTypes.ts
// Sistema di blocchi/simboli riutilizzabili per CAD professionale

import { Point, DrawingEntity, DrawingStyle } from '../../TechnicalDrawingTypes';

export interface BlockDefinition {
  id: string;
  name: string;
  description?: string;
  category: BlockCategory;
  entities: BlockEntity[];
  insertionPoint: Point;
  boundingBox: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
  attributes: BlockAttribute[];
  tags: string[];
  created: number;
  modified: number;
  version: string;
  author?: string;
  thumbnail?: string; // Base64 encoded image
  metadata?: Record<string, any>;
}

export interface BlockEntity {
  id: string;
  type: string;
  geometry: any; // Specific geometry based on entity type
  style: DrawingStyle;
  layer: string;
  locked: boolean;
  visible: boolean;
  metadata?: Record<string, any>;
}

export interface BlockAttribute {
  id: string;
  name: string;
  tag: string;
  value: string;
  position: Point;
  visible: boolean;
  editable: boolean;
  prompt?: string;
  defaultValue?: string;
  validation?: {
    required: boolean;
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
}

export interface BlockInstance {
  id: string;
  blockDefinitionId: string;
  insertionPoint: Point;
  scale: {
    x: number;
    y: number;
  };
  rotation: number; // in radians
  attributes: Record<string, string>; // attribute tag -> value
  layer: string;
  visible: boolean;
  locked: boolean;
  exploded: boolean; // if true, entities are independent
  metadata?: Record<string, any>;
}

export interface BlockLibrary {
  id: string;
  name: string;
  description?: string;
  categories: BlockCategory[];
  blocks: BlockDefinition[];
  created: number;
  modified: number;
  version: string;
  isDefault: boolean;
  readOnly: boolean;
  shared: boolean;
  author?: string;
  metadata?: Record<string, any>;
}

export interface BlockCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  parentId?: string;
  order: number;
  visible: boolean;
}

export interface BlockTemplate {
  id: string;
  name: string;
  description?: string;
  entities: Partial<DrawingEntity>[];
  attributes: Omit<BlockAttribute, 'id'>[];
  category: string;
  tags: string[];
}

export enum StandardBlockCategory {
  MECHANICAL = 'mechanical',
  ELECTRICAL = 'electrical',
  ARCHITECTURAL = 'architectural',
  CIVIL = 'civil',
  SYMBOLS = 'symbols',
  ANNOTATIONS = 'annotations',
  FASTENERS = 'fasteners',
  FIXTURES = 'fixtures',
  CUSTOM = 'custom'
}

export interface BlockSearchCriteria {
  query?: string;
  category?: string;
  tags?: string[];
  author?: string;
  dateRange?: {
    start: number;
    end: number;
  };
  hasAttributes?: boolean;
}

export interface BlockImportOptions {
  mergeCategories: boolean;
  overwriteExisting: boolean;
  importAttributes: boolean;
  preserveIds: boolean;
}

export interface BlockExportOptions {
  includeCategories: boolean;
  includeMetadata: boolean;
  format: 'json' | 'dxf' | 'dwg';
  compression: boolean;
}

// Standard block templates
export const STANDARD_BLOCK_TEMPLATES: BlockTemplate[] = [
  // Mechanical symbols
  {
    id: 'bearing-ball',
    name: 'Ball Bearing',
    description: 'Standard ball bearing symbol',
    category: StandardBlockCategory.MECHANICAL,
    tags: ['bearing', 'mechanical', 'rotation'],
    entities: [
      {
        type: 'circle',
        center: { x: 0, y: 0 },
        radius: 20,
        style: {
          strokeColor: '#000000',
          strokeWidth: 1,
          strokeStyle: 'solid',
          fillColor: 'none'
        }
      },
      {
        type: 'circle',
        center: { x: 0, y: 0 },
        radius: 12,
        style: {
          strokeColor: '#000000',
          strokeWidth: 1,
          strokeStyle: 'solid',
          fillColor: 'none'
        }
      }
    ],
    attributes: [
      {
        name: 'Size',
        tag: 'SIZE',
        value: '20mm',
        position: { x: 0, y: -30 },
        visible: true,
        editable: true,
        prompt: 'Enter bearing size'
      }
    ]
  },

  // Electrical symbols
  {
    id: 'resistor',
    name: 'Resistor',
    description: 'Standard resistor symbol (IEEE)',
    category: StandardBlockCategory.ELECTRICAL,
    tags: ['resistor', 'electrical', 'component'],
    entities: [
      {
        type: 'rectangle',
        position: { x: -15, y: -5 },
        width: 30,
        height: 10,
        style: {
          strokeColor: '#000000',
          strokeWidth: 1,
          strokeStyle: 'solid',
          fillColor: 'none'
        }
      },
      {
        type: 'line',
        startPoint: { x: -25, y: 0 },
        endPoint: { x: -15, y: 0 },
        style: {
          strokeColor: '#000000',
          strokeWidth: 1,
          strokeStyle: 'solid'
        }
      },
      {
        type: 'line',
        startPoint: { x: 15, y: 0 },
        endPoint: { x: 25, y: 0 },
        style: {
          strokeColor: '#000000',
          strokeWidth: 1,
          strokeStyle: 'solid'
        }
      }
    ],
    attributes: [
      {
        name: 'Value',
        tag: 'VALUE',
        value: '1kΩ',
        position: { x: 0, y: 15 },
        visible: true,
        editable: true,
        prompt: 'Enter resistance value'
      },
      {
        name: 'Reference',
        tag: 'REF',
        value: 'R1',
        position: { x: 0, y: -15 },
        visible: true,
        editable: true,
        prompt: 'Enter reference designator'
      }
    ]
  },

  // Architectural symbols
  {
    id: 'door-single',
    name: 'Single Door',
    description: 'Standard single door symbol',
    category: StandardBlockCategory.ARCHITECTURAL,
    tags: ['door', 'architectural', 'opening'],
    entities: [
      {
        type: 'line',
        startPoint: { x: 0, y: 0 },
        endPoint: { x: 30, y: 0 },
        style: {
          strokeColor: '#000000',
          strokeWidth: 2,
          strokeStyle: 'solid'
        }
      },
      {
        type: 'arc',
        center: { x: 0, y: 0 },
        radius: 30,
        startAngle: 0,
        endAngle: Math.PI / 2,
        style: {
          strokeColor: '#000000',
          strokeWidth: 1,
          strokeStyle: 'dashed'
        }
      }
    ],
    attributes: [
      {
        name: 'Width',
        tag: 'WIDTH',
        value: '800mm',
        position: { x: 15, y: -10 },
        visible: true,
        editable: true,
        prompt: 'Enter door width'
      }
    ]
  },

  // Annotation symbols
  {
    id: 'section-marker',
    name: 'Section Marker',
    description: 'Standard section view marker',
    category: StandardBlockCategory.ANNOTATIONS,
    tags: ['section', 'annotation', 'view'],
    entities: [
      {
        type: 'circle',
        center: { x: 0, y: 0 },
        radius: 15,
        style: {
          strokeColor: '#000000',
          strokeWidth: 2,
          strokeStyle: 'solid',
          fillColor: 'none'
        }
      },
      {
        type: 'line',
        startPoint: { x: -10, y: 0 },
        endPoint: { x: 10, y: 0 },
        style: {
          strokeColor: '#000000',
          strokeWidth: 1,
          strokeStyle: 'solid'
        }
      }
    ],
    attributes: [
      {
        name: 'Section',
        tag: 'SECTION',
        value: 'A',
        position: { x: 0, y: 5 },
        visible: true,
        editable: true,
        prompt: 'Enter section identifier'
      },
      {
        name: 'Sheet',
        tag: 'SHEET',
        value: '1',
        position: { x: 0, y: -5 },
        visible: true,
        editable: true,
        prompt: 'Enter sheet number'
      }
    ]
  },

  // Fastener symbols
  {
    id: 'bolt-hex',
    name: 'Hex Bolt',
    description: 'Standard hexagonal bolt',
    category: StandardBlockCategory.FASTENERS,
    tags: ['bolt', 'fastener', 'hex'],
    entities: [
      {
        type: 'circle',
        center: { x: 0, y: 0 },
        radius: 8,
        style: {
          strokeColor: '#000000',
          strokeWidth: 1,
          strokeStyle: 'solid',
          fillColor: 'none'
        }
      },
      {
        type: 'polygon',
        center: { x: 0, y: 0 },
        radius: 6,
        sides: 6,
        style: {
          strokeColor: '#000000',
          strokeWidth: 1,
          strokeStyle: 'solid',
          fillColor: 'none'
        }
      }
    ],
    attributes: [
      {
        name: 'Size',
        tag: 'SIZE',
        value: 'M8',
        position: { x: 12, y: 0 },
        visible: true,
        editable: true,
        prompt: 'Enter bolt size'
      }
    ]
  }
];

// Default categories
export const DEFAULT_BLOCK_CATEGORIES: BlockCategory[] = [
  {
    id: 'mechanical',
    name: 'Mechanical',
    description: 'Mechanical components and symbols',
    icon: '⚙️',
    color: '#1890ff',
    order: 1,
    visible: true
  },
  {
    id: 'electrical',
    name: 'Electrical',
    description: 'Electrical components and symbols',
    icon: '⚡',
    color: '#faad14',
    order: 2,
    visible: true
  },
  {
    id: 'architectural',
    name: 'Architectural',
    description: 'Architectural elements and symbols',
    icon: '🏠',
    color: '#52c41a',
    order: 3,
    visible: true
  },
  {
    id: 'civil',
    name: 'Civil',
    description: 'Civil engineering symbols',
    icon: '🏗️',
    color: '#722ed1',
    order: 4,
    visible: true
  },
  {
    id: 'symbols',
    name: 'Symbols',
    description: 'General symbols and markers',
    icon: '🔣',
    color: '#eb2f96',
    order: 5,
    visible: true
  },
  {
    id: 'annotations',
    name: 'Annotations',
    description: 'Annotation and markup symbols',
    icon: '📝',
    color: '#13c2c2',
    order: 6,
    visible: true
  },
  {
    id: 'fasteners',
    name: 'Fasteners',
    description: 'Bolts, screws, and fasteners',
    icon: '🔩',
    color: '#f759ab',
    order: 7,
    visible: true
  },
  {
    id: 'fixtures',
    name: 'Fixtures',
    description: 'Fixtures and fittings',
    icon: '🔧',
    color: '#36cfc9',
    order: 8,
    visible: true
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'User-defined blocks',
    icon: '✨',
    color: '#ff7a45',
    order: 9,
    visible: true
  }
];

export default {
  BlockDefinition,
  BlockEntity,
  BlockAttribute,
  BlockInstance,
  BlockLibrary,
  BlockCategory,
  BlockTemplate,
  StandardBlockCategory,
  BlockSearchCriteria,
  BlockImportOptions,
  BlockExportOptions,
  STANDARD_BLOCK_TEMPLATES,
  DEFAULT_BLOCK_CATEGORIES
};