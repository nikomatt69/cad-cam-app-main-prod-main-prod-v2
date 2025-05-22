import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ConstraintType, 
  Constraint, 
  ConstraintCreationParams 
} from '../../core/constraints/ConstraintTypes';
import ConstraintManager from '../../core/constraints/ConstraintManager';
import { useTechnicalDrawingStore } from '../../technicalDrawingStore';
import {
  Link,
  Unlink,
  Lock,
  Unlock,
  Move,
  RotateCw,
  Ruler,
  Circle,
  Square,
  Triangle,
  Minus,
  Plus,
  Eye,
  EyeOff,
  Settings,
  Zap,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Play,
  Pause
} from 'lucide-react';

interface ConstraintsPanel {
  constraintManager: ConstraintManager;
  onConstraintChange?: (constraints: Constraint[]) => void;
}

/**
 * 🔗 Constraints Panel - Pannello Vincoli Parametrici
 * 
 * Interfaccia utente professionale per gestire tutti i vincoli parametrici:
 * - Creazione vincoli geometrici (parallel, perpendicular, tangent, etc.)
 * - Creazione vincoli dimensionali (distance, angle, radius, etc.)
 * - Visualizzazione stato vincoli
 * - Controllo solver automatico
 * - Gestione priorità vincoli
 */
const ConstraintsPanel: React.FC<ConstraintsPanel> = ({
  constraintManager,
  onConstraintChange
}) => {
  const [constraints, setConstraints] = useState<Constraint[]>([]);
  const [selectedConstraintId, setSelectedConstraintId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'geometric' | 'dimensional' | 'management'>('geometric');
  const [autoSolve, setAutoSolve] = useState(true);
  const [solverRunning, setSolverRunning] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createConstraintType, setCreateConstraintType] = useState<ConstraintType>(ConstraintType.PARALLEL);
  
  const store = useTechnicalDrawingStore();
  const solverTimeoutRef = useRef<NodeJS.Timeout>();

  // Constraint type definitions
  const GEOMETRIC_CONSTRAINTS = [
    { type: ConstraintType.PARALLEL, name: 'Parallel', icon: <Link size={16} />, description: 'Make lines parallel' },
    { type: ConstraintType.PERPENDICULAR, name: 'Perpendicular', icon: <Plus size={16} />, description: 'Make lines perpendicular' },
    { type: ConstraintType.HORIZONTAL, name: 'Horizontal', icon: <Minus size={16} />, description: 'Make line horizontal' },
    { type: ConstraintType.VERTICAL, name: 'Vertical', icon: <Square size={16} />, description: 'Make line vertical' },
    { type: ConstraintType.TANGENT, name: 'Tangent', icon: <Circle size={16} />, description: 'Make line tangent to circle' },
    { type: ConstraintType.CONCENTRIC, name: 'Concentric', icon: <Circle size={16} />, description: 'Make circles concentric' },
    { type: ConstraintType.COINCIDENT, name: 'Coincident', icon: <Move size={16} />, description: 'Make points coincident' },
    { type: ConstraintType.COLLINEAR, name: 'Collinear', icon: <Link size={16} />, description: 'Make lines collinear' },
    { type: ConstraintType.EQUAL_LENGTH, name: 'Equal Length', icon: <Ruler size={16} />, description: 'Make lines equal length' },
    { type: ConstraintType.EQUAL_RADIUS, name: 'Equal Radius', icon: <Circle size={16} />, description: 'Make circles equal radius' },
    { type: ConstraintType.SYMMETRIC, name: 'Symmetric', icon: <RotateCw size={16} />, description: 'Make entities symmetric' },
    { type: ConstraintType.MIDPOINT, name: 'Midpoint', icon: <Move size={16} />, description: 'Point at line midpoint' }
  ];

  const DIMENSIONAL_CONSTRAINTS = [
    { type: ConstraintType.DISTANCE, name: 'Distance', icon: <Ruler size={16} />, description: 'Set distance between entities', needsValue: true },
    { type: ConstraintType.ANGLE, name: 'Angle', icon: <Triangle size={16} />, description: 'Set angle between lines', needsValue: true },
    { type: ConstraintType.RADIUS, name: 'Radius', icon: <Circle size={16} />, description: 'Set circle radius', needsValue: true },
    { type: ConstraintType.DIAMETER, name: 'Diameter', icon: <Circle size={16} />, description: 'Set circle diameter', needsValue: true },
    { type: ConstraintType.LENGTH, name: 'Length', icon: <Ruler size={16} />, description: 'Set line length', needsValue: true }
  ];

  // Initialize constraint manager listener
  useEffect(() => {
    const handleConstraintChange = (updatedConstraints: Constraint[]) => {
      setConstraints(updatedConstraints);
      if (onConstraintChange) {
        onConstraintChange(updatedConstraints);
      }
    };

    constraintManager.addChangeListener(handleConstraintChange);
    
    // Initial load
    setConstraints(constraintManager.getAllConstraints());

    return () => {
      constraintManager.removeChangeListener(handleConstraintChange);
    };
  }, [constraintManager, onConstraintChange]);

  // Update entities in constraint manager when store changes
  useEffect(() => {
    const allEntities = {
      ...store.entities,
      ...store.dimensions,
      ...store.annotations
    };
    constraintManager.updateEntities(allEntities as any);
  }, [store.entities, store.dimensions, store.annotations, constraintManager]);

  // Auto-solve when constraints change
  useEffect(() => {
    if (autoSolve && constraints.length > 0) {
      // Debounce solver execution
      if (solverTimeoutRef.current) {
        clearTimeout(solverTimeoutRef.current);
      }
      
      solverTimeoutRef.current = setTimeout(() => {
        runSolver();
      }, 500);
    }
  }, [constraints, autoSolve]);

  const runSolver = async () => {
    if (solverRunning) return;
    
    setSolverRunning(true);
    try {
      const solutions = await constraintManager.solveConstraints();
      
      // Apply solutions to store
      solutions.forEach(solution => {
        if (solution.satisfied) {
          Object.entries(solution.entityUpdates).forEach(([entityId, updates]) => {
            if (store.entities[entityId]) {
              store.updateEntity(entityId, updates);
            } else if (store.dimensions[entityId]) {
              store.updateDimension(entityId, updates);
            } else if (store.annotations[entityId]) {
              store.updateAnnotation(entityId, updates);
            }
          });
        }
      });
      
      console.log(`✅ Solver completed: ${solutions.filter(s => s.satisfied).length}/${solutions.length} satisfied`);
    } catch (error) {
      console.error('Solver error:', error);
    } finally {
      setSolverRunning(false);
    }
  };

  const handleCreateConstraint = (type: ConstraintType, needsValue: boolean = false) => {
    const selectedEntities = store.selectedEntityIds;
    
    if (selectedEntities.length === 0) {
      alert('Please select entities first');
      return;
    }

    if (needsValue) {
      const value = prompt(`Enter value for ${type} constraint:`);
      if (!value || isNaN(Number(value))) {
        return;
      }

      const params: ConstraintCreationParams = {
        type,
        entityIds: selectedEntities,
        value: Number(value),
        description: `${type} constraint`
      };

      constraintManager.createConstraint(params);
    } else {
      const params: ConstraintCreationParams = {
        type,
        entityIds: selectedEntities,
        description: `${type} constraint`
      };

      constraintManager.createConstraint(params);
    }
    
    // Deselect entities after creating constraint
    store.clearSelection();
  };

  const handleToggleConstraint = (constraintId: string) => {
    constraintManager.toggleConstraint(constraintId);
  };

  const handleDeleteConstraint = (constraintId: string) => {
    constraintManager.removeConstraint(constraintId);
  };

  const handleCreateAutoConstraints = () => {
    const selectedEntities = store.selectedEntityIds;
    if (selectedEntities.length < 2) {
      alert('Please select at least 2 entities for auto-constraints');
      return;
    }

    const createdIds = constraintManager.createAutoConstraints(selectedEntities);
    console.log(`Created ${createdIds.length} auto-constraints`);
  };

  const getConstraintStatus = (constraint: Constraint) => {
    if (!constraint.active) {
      return { icon: <Pause size={14} />, color: '#d9d9d9', text: 'Inactive' };
    } else if (constraint.satisfied) {
      return { icon: <CheckCircle size={14} />, color: '#52c41a', text: 'Satisfied' };
    } else {
      return { icon: <XCircle size={14} />, color: '#ff4d4f', text: 'Unsatisfied' };
    }
  };

  const getConstraintDescription = (constraint: Constraint) => {
    const entityNames = constraint.entityIds.map(id => {
      const entity = store.entities[id] || store.dimensions[id] || store.annotations[id];
      return entity ? `${entity.type}(${id.substring(0, 8)})` : 'Unknown';
    }).join(', ');

    return `${constraint.type} | ${entityNames}`;
  };

  return (
    <motion.div
      className="constraints-panel"
      style={{
        width: '300px',
        height: '100%',
        backgroundColor: '#f8f9fa',
        borderRight: '1px solid #e0e0e0',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #e0e0e0',
        backgroundColor: 'white'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Link size={20} color="#1890ff" />
          <h3 style={{ margin: 0, fontSize: '16px', color: '#333' }}>
            Parametric Constraints
          </h3>
        </div>
        
        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <motion.button
            style={{
              padding: '6px 12px',
              backgroundColor: autoSolve ? '#52c41a' : '#d9d9d9',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            onClick={() => setAutoSolve(!autoSolve)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {autoSolve ? <Zap size={12} /> : <Pause size={12} />}
            Auto-solve
          </motion.button>
          
          <motion.button
            style={{
              padding: '6px 12px',
              backgroundColor: solverRunning ? '#faad14' : '#1890ff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            onClick={runSolver}
            disabled={solverRunning}
            whileHover={{ scale: solverRunning ? 1 : 1.05 }}
            whileTap={{ scale: solverRunning ? 1 : 0.95 }}
          >
            {solverRunning ? <Settings size={12} className="animate-spin" /> : <Play size={12} />}
            Solve
          </motion.button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        backgroundColor: 'white',
        borderBottom: '1px solid #e0e0e0'
      }}>
        {[
          { id: 'geometric', label: 'Geometric', icon: <Link size={14} /> },
          { id: 'dimensional', label: 'Dimensional', icon: <Ruler size={14} /> },
          { id: 'management', label: 'Manage', icon: <Settings size={14} /> }
        ].map(tab => (
          <button
            key={tab.id}
            style={{
              flex: 1,
              padding: '8px 4px',
              border: 'none',
              backgroundColor: activeTab === tab.id ? '#e6f7ff' : 'transparent',
              color: activeTab === tab.id ? '#1890ff' : '#666',
              cursor: 'pointer',
              fontSize: '12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px'
            }}
            onClick={() => setActiveTab(tab.id as any)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
        {activeTab === 'geometric' && (
          <div>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#333' }}>
              Geometric Constraints
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
              {GEOMETRIC_CONSTRAINTS.map(constraint => (
                <motion.button
                  key={constraint.type}
                  style={{
                    padding: '8px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    fontSize: '11px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    textAlign: 'center'
                  }}
                  onClick={() => handleCreateConstraint(constraint.type)}
                  whileHover={{ scale: 1.05, backgroundColor: '#f0f8ff' }}
                  whileTap={{ scale: 0.95 }}
                  title={constraint.description}
                >
                  {constraint.icon}
                  {constraint.name}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'dimensional' && (
          <div>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#333' }}>
              Dimensional Constraints
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px' }}>
              {DIMENSIONAL_CONSTRAINTS.map(constraint => (
                <motion.button
                  key={constraint.type}
                  style={{
                    padding: '12px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    textAlign: 'left'
                  }}
                  onClick={() => handleCreateConstraint(constraint.type, constraint.needsValue)}
                  whileHover={{ scale: 1.02, backgroundColor: '#f0f8ff' }}
                  whileTap={{ scale: 0.98 }}
                  title={constraint.description}
                >
                  {constraint.icon}
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{constraint.name}</div>
                    <div style={{ fontSize: '10px', color: '#666' }}>{constraint.description}</div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'management' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h4 style={{ margin: 0, fontSize: '14px', color: '#333' }}>
                Active Constraints ({constraints.length})
              </h4>
              <motion.button
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#52c41a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '11px'
                }}
                onClick={handleCreateAutoConstraints}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Auto
              </motion.button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {constraints.map(constraint => {
                const status = getConstraintStatus(constraint);
                const isSelected = selectedConstraintId === constraint.id;
                
                return (
                  <motion.div
                    key={constraint.id}
                    style={{
                      padding: '8px',
                      border: `1px solid ${isSelected ? '#1890ff' : '#e0e0e0'}`,
                      borderRadius: '4px',
                      backgroundColor: isSelected ? '#e6f7ff' : 'white',
                      cursor: 'pointer',
                      fontSize: '11px'
                    }}
                    onClick={() => setSelectedConstraintId(isSelected ? null : constraint.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <div style={{ color: status.color }}>
                        {status.icon}
                      </div>
                      <span style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
                        {constraint.type.replace('_', ' ')}
                      </span>
                      <div style={{ marginLeft: 'auto', display: 'flex', gap: '2px' }}>
                        <button
                          style={{
                            padding: '2px',
                            border: 'none',
                            backgroundColor: 'transparent',
                            cursor: 'pointer',
                            color: constraint.active ? '#52c41a' : '#d9d9d9'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleConstraint(constraint.id);
                          }}
                          title={constraint.active ? 'Disable' : 'Enable'}
                        >
                          {constraint.active ? <Eye size={12} /> : <EyeOff size={12} />}
                        </button>
                        <button
                          style={{
                            padding: '2px',
                            border: 'none',
                            backgroundColor: 'transparent',
                            cursor: 'pointer',
                            color: '#ff4d4f'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteConstraint(constraint.id);
                          }}
                          title="Delete"
                        >
                          <XCircle size={12} />
                        </button>
                      </div>
                    </div>
                    
                    <div style={{ color: '#666', fontSize: '10px' }}>
                      {getConstraintDescription(constraint)}
                    </div>
                    
                    {constraint.description && (
                      <div style={{ color: '#999', fontSize: '10px', marginTop: '2px' }}>
                        {constraint.description}
                      </div>
                    )}
                  </motion.div>
                );
              })}
              
              {constraints.length === 0 && (
                <div style={{
                  padding: '24px',
                  textAlign: 'center',
                  color: '#999',
                  fontSize: '12px'
                }}>
                  <AlertTriangle size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                  <div>No constraints defined</div>
                  <div>Select entities and add constraints</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Statistics */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid #e0e0e0',
        backgroundColor: 'white',
        fontSize: '11px',
        color: '#666'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Active: {constraints.filter(c => c.active).length}</span>
          <span>Satisfied: {constraints.filter(c => c.satisfied).length}</span>
          <span>Selected: {store.selectedEntityIds.length}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default ConstraintsPanel;