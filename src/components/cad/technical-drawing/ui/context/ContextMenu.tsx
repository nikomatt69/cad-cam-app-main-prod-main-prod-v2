// src/components/cad/technical-drawing/ui/context/ContextMenu.tsx

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTechnicalDrawingStore } from '../../technicalDrawingStore';
import { Point } from '../../TechnicalDrawingTypes';
import { 
  Copy, 
  Trash2, 
  Move, 
  RotateCw, 
  Scale, 
  Flip, 
  Layers, 
  Edit3, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock,
  Group,
  Ungroup,
  SendToBack,
  BringToFront,
  Settings
} from 'lucide-react';

interface ContextMenuProps {
  position: Point;
  onClose: () => void;
  entityId?: string;
  entityIds?: string[];
}

interface ContextMenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  action: () => void;
  disabled?: boolean;
  separator?: boolean;
  submenu?: ContextMenuItem[];
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  position,
  onClose,
  entityId,
  entityIds = []
}) => {
  const {
    selectedEntityIds,
    entities,
    dimensions,
    annotations,
    deleteEntity,
    copyEntity,
    updateEntity,
    groupEntities,
    ungroupEntities,
    moveEntities,
    rotateEntities,
    scaleEntities,
    mirrorEntities,
    clearSelection,
    selectEntity,
    drawingLayers,
    setActiveTool
  } = useTechnicalDrawingStore();

  const [submenuOpen, setSubmenuOpen] = useState<string | null>(null);
  const targetEntityIds = entityIds.length > 0 ? entityIds : 
                          entityId ? [entityId] : selectedEntityIds;

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      if (!target.closest('.context-menu')) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const getEntity = (id: string) => {
    return entities[id] || dimensions[id] || annotations[id];
  };

  const getEntityInfo = () => {
    if (targetEntityIds.length === 1) {
      const entity = getEntity(targetEntityIds[0]);
      return entity ? `${entity.type} (${entity.layer})` : 'Sconosciuto';
    } else if (targetEntityIds.length > 1) {
      return `${targetEntityIds.length} elementi selezionati`;
    }
    return 'Nessuna selezione';
  };

  const isGrouped = () => {
    if (targetEntityIds.length === 0) return false;
    const firstEntity = getEntity(targetEntityIds[0]);
    return firstEntity?.groupId !== undefined;
  };

  const canGroup = () => {
    return targetEntityIds.length > 1;
  };

  const createLayerSubmenu = (): ContextMenuItem[] => {
    return drawingLayers.map(layer => ({
      id: `layer_${layer.id}`,
      label: layer.name,
      icon: Layers,
      action: () => {
        targetEntityIds.forEach(id => {
          updateEntity(id, { layer: layer.name });
        });
        onClose();
      }
    }));
  };

  const menuItems: ContextMenuItem[] = [
    // Selection info
    {
      id: 'info',
      label: getEntityInfo(),
      icon: Edit3,
      action: () => {},
      disabled: true,
      separator: true
    },

    // Basic edit actions
    {
      id: 'copy',
      label: 'Copia',
      icon: Copy,
      action: () => {
        targetEntityIds.forEach(id => {
          copyEntity(id, { x: 10, y: 10 });
        });
        onClose();
      },
      disabled: targetEntityIds.length === 0
    },
    {
      id: 'delete',
      label: 'Elimina',
      icon: Trash2,
      action: () => {
        targetEntityIds.forEach(id => {
          deleteEntity(id);
        });
        clearSelection();
        onClose();
      },
      disabled: targetEntityIds.length === 0
    },

    // Transform actions
    {
      id: 'move',
      label: 'Sposta',
      icon: Move,
      action: () => {
        setActiveTool('move');
        onClose();
      },
      disabled: targetEntityIds.length === 0,
      separator: true
    },
    {
      id: 'rotate',
      label: 'Ruota',
      icon: RotateCw,
      action: () => {
        // Quick rotate 90 degrees
        if (targetEntityIds.length > 0) {
          const centerX = 0; // Could calculate actual center
          const centerY = 0;
          rotateEntities(targetEntityIds, { x: centerX, y: centerY }, 90);
        }
        onClose();
      },
      disabled: targetEntityIds.length === 0
    },
    {
      id: 'scale',
      label: 'Scala',
      icon: Scale,
      action: () => {
        setActiveTool('scale');
        onClose();
      },
      disabled: targetEntityIds.length === 0
    },
    {
      id: 'mirror',
      label: 'Specchia',
      icon: Flip,
      action: () => {
        setActiveTool('mirror');
        onClose();
      },
      disabled: targetEntityIds.length === 0
    },

    // Grouping actions
    {
      id: 'group',
      label: isGrouped() ? 'Separa Gruppo' : 'Raggruppa',
      icon: isGrouped() ? Ungroup : Group,
      action: () => {
        if (isGrouped()) {
          const firstEntity = getEntity(targetEntityIds[0]);
          if (firstEntity?.groupId) {
            ungroupEntities(firstEntity.groupId);
          }
        } else if (canGroup()) {
          groupEntities(targetEntityIds);
        }
        onClose();
      },
      disabled: !canGroup() && !isGrouped(),
      separator: true
    },

    // Layer actions
    {
      id: 'move_to_layer',
      label: 'Sposta su Livello',
      icon: Layers,
      action: () => {},
      disabled: targetEntityIds.length === 0,
      submenu: createLayerSubmenu()
    },

    // Visibility actions
    {
      id: 'toggle_visibility',
      label: 'Nascondi/Mostra',
      icon: Eye,
      action: () => {
        targetEntityIds.forEach(id => {
          const entity = getEntity(id);
          if (entity) {
            updateEntity(id, { visible: !entity.visible });
          }
        });
        onClose();
      },
      disabled: targetEntityIds.length === 0
    },
    {
      id: 'toggle_lock',
      label: 'Blocca/Sblocca',
      icon: Lock,
      action: () => {
        targetEntityIds.forEach(id => {
          const entity = getEntity(id);
          if (entity) {
            updateEntity(id, { locked: !entity.locked });
          }
        });
        onClose();
      },
      disabled: targetEntityIds.length === 0
    },

    // Order actions
    {
      id: 'bring_to_front',
      label: 'Porta in Primo Piano',
      icon: BringToFront,
      action: () => {
        // Implementation for bring to front
        onClose();
      },
      disabled: targetEntityIds.length === 0,
      separator: true
    },
    {
      id: 'send_to_back',
      label: 'Manda in Secondo Piano',
      icon: SendToBack,
      action: () => {
        // Implementation for send to back
        onClose();
      },
      disabled: targetEntityIds.length === 0
    },

    // Properties
    {
      id: 'properties',
      label: 'Proprietà',
      icon: Settings,
      action: () => {
        // Open properties panel or dialog
        onClose();
      },
      disabled: targetEntityIds.length === 0,
      separator: true
    }
  ];

  const renderMenuItem = (item: ContextMenuItem, level: number = 0) => {
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const isSubmenuOpen = submenuOpen === item.id;

    return (
      <React.Fragment key={item.id}>
        <motion.div
          className={`
            context-menu-item px-3 py-2 flex items-center justify-between cursor-pointer
            ${item.disabled ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-blue-50'}
            ${level > 0 ? 'pl-6' : ''}
          `}
          onClick={(e) => {
            e.stopPropagation();
            if (item.disabled) return;
            
            if (hasSubmenu) {
              setSubmenuOpen(isSubmenuOpen ? null : item.id);
            } else {
              item.action();
            }
          }}
          onMouseEnter={() => {
            if (hasSubmenu && !item.disabled) {
              setSubmenuOpen(item.id);
            }
          }}
          whileHover={item.disabled ? undefined : { backgroundColor: '#dbeafe' }}
        >
          <div className="flex items-center space-x-2">
            <item.icon size={16} className={item.disabled ? 'text-gray-400' : 'text-gray-600'} />
            <span className="text-sm">{item.label}</span>
          </div>
          
          {hasSubmenu && (
            <div className="text-gray-400">
              ▶
            </div>
          )}
        </motion.div>

        {/* Submenu */}
        <AnimatePresence>
          {hasSubmenu && isSubmenuOpen && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="submenu pl-4 border-l-2 border-blue-100"
            >
              {item.submenu!.map(subItem => renderMenuItem(subItem, level + 1))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Separator */}
        {item.separator && (
          <div className="border-t border-gray-200 my-1" />
        )}
      </React.Fragment>
    );
  };

  return (
    <motion.div
      className="context-menu fixed bg-white border border-gray-300 rounded-lg shadow-lg py-1 z-50 min-w-48"
      style={{
        left: position.x,
        top: position.y,
        maxHeight: '80vh',
        overflowY: 'auto'
      }}
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ duration: 0.15 }}
      onMouseLeave={() => setSubmenuOpen(null)}
    >
      {menuItems
        .filter(item => !item.separator || menuItems.indexOf(item) > 0) // Don't show separator as first item
        .map(item => renderMenuItem(item))}
    </motion.div>
  );
};

export default ContextMenu;
