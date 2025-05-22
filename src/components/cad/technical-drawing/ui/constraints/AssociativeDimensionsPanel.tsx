import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AssociativeDimensionsManager, AssociativeRelationship, DimensionDependency, DimensionUpdateEvent } from '../../core/dimensions/AssociativeDimensions';
import { useTechnicalDrawingStore } from '../../technicalDrawingStore';
import {
  Link2,
  Unlink,
  Ruler,
  RotateCw,
  Circle,
  Triangle,
  ArrowRight,
  Eye,
  EyeOff,
  Settings,
  Zap,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Play,
  Pause,
  RefreshCw,
  Calculator,
  Target,
  GitBranch
} from 'lucide-react';

interface AssociativeDimensionsPanelProps {
  dimensionsManager: AssociativeDimensionsManager;
  onDimensionUpdate?: (event: DimensionUpdateEvent) => void;
}

/**
 * 📏 Associative Dimensions Panel
 * 
 * Pannello professionale per gestire dimensioni associative:
 * - Creazione relazioni automatiche tra dimensioni e geometria
 * - Gestione dipendenze tra dimensioni
 * - Monitoraggio aggiornamenti in tempo reale
 * - Controllo propagazione modifiche
 */
const AssociativeDimensionsPanel: React.FC<AssociativeDimensionsPanelProps> = ({
  dimensionsManager,
  onDimensionUpdate
}) => {
  const [relationships, setRelationships] = useState<AssociativeRelationship[]>([]);
  const [dependencies, setDependencies] = useState<DimensionDependency[]>([]);
  const [activeTab, setActiveTab] = useState<'relationships' | 'dependencies' | 'monitor'>('relationships');
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [updateEvents, setUpdateEvents] = useState<DimensionUpdateEvent[]>([]);
  const [selectedRelationshipId, setSelectedRelationshipId] = useState<string | null>(null);
  const [isCreatingRelation, setIsCreatingRelation] = useState(false);
  
  const store = useTechnicalDrawingStore();
  const updateEventsRef = useRef<DimensionUpdateEvent[]>([]);

  // Initialize manager listener
  useEffect(() => {
    const handleDimensionUpdate = (event: DimensionUpdateEvent) => {
      // Add to events list (keep last 50)
      updateEventsRef.current = [event, ...updateEventsRef.current].slice(0, 50);
      setUpdateEvents([...updateEventsRef.current]);
      
      if (onDimensionUpdate) {
        onDimensionUpdate(event);
      }
    };

    dimensionsManager.addUpdateListener(handleDimensionUpdate);
    
    // Load initial data
    setRelationships(dimensionsManager.getAllRelationships());
    setDependencies(dimensionsManager.getAllDependencies());

    return () => {
      dimensionsManager.removeUpdateListener(handleDimensionUpdate);
    };
  }, [dimensionsManager, onDimensionUpdate]);

  // Update manager data when store changes
  useEffect(() => {
    const allEntities = {
      ...store.entities,
      ...store.dimensions,
      ...store.annotations
    };
    dimensionsManager.updateData(store.entities as any, store.dimensions as any);
    
    // Refresh relationships and dependencies
    setRelationships(dimensionsManager.getAllRelationships());
    setDependencies(dimensionsManager.getAllDependencies());
  }, [store.entities, store.dimensions, store.annotations, dimensionsManager]);

  const handleCreateAssociativeRelation = async () => {
    const selectedDimensions = store.selectedEntityIds.filter(id => 
      store.dimensions[id] !== undefined
    );
    const selectedEntities = store.selectedEntityIds.filter(id => 
      store.entities[id] !== undefined
    );

    if (selectedDimensions.length !== 1) {
      alert('Please select exactly one dimension');
      return;
    }

    if (selectedEntities.length === 0) {
      alert('Please select at least one entity to associate with the dimension');
      return;
    }

    const dimensionId = selectedDimensions[0];
    const dimension = store.dimensions[dimensionId];
    
    let relationshipType: 'linear' | 'angular' | 'radial' | 'diametral' = 'linear';
    
    // Determine relationship type based on dimension type
    switch (dimension.type) {
      case 'linear-dimension':
      case 'aligned-dimension':
        relationshipType = 'linear';
        break;
      case 'angular-dimension':
        relationshipType = 'angular';
        break;
      case 'radial-dimension':
        relationshipType = 'radial';
        break;
      case 'diameter-dimension':
        relationshipType = 'diametral';
        break;
      default:
        relationshipType = 'linear';
    }

    try {
      const relationshipId = dimensionsManager.createAssociativeRelationship(
        dimensionId,
        selectedEntities,
        relationshipType
      );
      
      console.log(`✅ Created associative relationship: ${relationshipId}`);
      setRelationships(dimensionsManager.getAllRelationships());
      store.clearSelection();
      
    } catch (error) {
      alert(`Error creating relationship: ${error.message}`);
    }
  };

  const handleCreateDependency = () => {
    const selectedDimensions = store.selectedEntityIds.filter(id => 
      store.dimensions[id] !== undefined
    );

    if (selectedDimensions.length < 2) {
      alert('Please select at least 2 dimensions to create dependency');
      return;
    }

    const parentId = selectedDimensions[0];
    const childIds = selectedDimensions.slice(1);

    try {
      const dependencyId = dimensionsManager.createDimensionDependency(
        parentId,
        childIds,
        'calculated'
      );
      
      console.log(`✅ Created dimension dependency: ${dependencyId}`);
      setDependencies(dimensionsManager.getAllDependencies());
      store.clearSelection();
      
    } catch (error) {
      alert(`Error creating dependency: ${error.message}`);
    }
  };

  const handleToggleAutoUpdate = (relationshipId: string) => {
    const relationship = relationships.find(r => r.id === relationshipId);
    if (relationship) {
      dimensionsManager.setAutoUpdate(relationshipId, !relationship.autoUpdate);
      setRelationships(dimensionsManager.getAllRelationships());
    }
  };

  const handleRemoveRelationship = (relationshipId: string) => {
    if (confirm('Remove this associative relationship?')) {
      dimensionsManager.removeRelationship(relationshipId);
      setRelationships(dimensionsManager.getAllRelationships());
    }
  };

  const handleRemoveDependency = (dependencyId: string) => {
    if (confirm('Remove this dimension dependency?')) {
      dimensionsManager.removeDependency(dependencyId);
      setDependencies(dimensionsManager.getAllDependencies());
    }
  };

  const getEntityName = (entityId: string) => {
    const entity = store.entities[entityId] || store.dimensions[entityId] || store.annotations[entityId];
    return entity ? `${entity.type}(${entityId.substring(0, 6)})` : 'Unknown';
  };

  const getRelationshipStatus = (relationship: AssociativeRelationship) => {
    if (!relationship.autoUpdate) {
      return { icon: <Pause size={14} />, color: '#d9d9d9', text: 'Manual' };
    } else {
      return { icon: <CheckCircle size={14} />, color: '#52c41a', text: 'Auto' };
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <motion.div
      className="associative-dimensions-panel"
      style={{
        width: '320px',
        height: '100%',
        backgroundColor: '#f8f9fa',
        borderLeft: '1px solid #e0e0e0',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
      initial={{ x: 320, opacity: 0 }}
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
          <Link2 size={20} color="#1890ff" />
          <h3 style={{ margin: 0, fontSize: '16px', color: '#333' }}>
            Associative Dimensions
          </h3>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <motion.button
            style={{
              flex: 1,
              padding: '6px 8px',
              backgroundColor: '#52c41a',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}
            onClick={handleCreateAssociativeRelation}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Create associative relationship between selected dimension and entities"
          >
            <Link2 size={12} />
            Relate
          </motion.button>
          
          <motion.button
            style={{
              flex: 1,
              padding: '6px 8px',
              backgroundColor: '#1890ff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}
            onClick={handleCreateDependency}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Create dependency between selected dimensions"
          >
            <GitBranch size={12} />
            Depend
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
          { id: 'relationships', label: 'Relations', icon: <Link2 size={14} /> },
          { id: 'dependencies', label: 'Dependencies', icon: <GitBranch size={14} /> },
          { id: 'monitor', label: 'Monitor', icon: <Target size={14} /> }
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
              fontSize: '11px',
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
        {activeTab === 'relationships' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h4 style={{ margin: 0, fontSize: '14px', color: '#333' }}>
                Relationships ({relationships.length})
              </h4>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {relationships.map(relationship => {
                const status = getRelationshipStatus(relationship);
                const dimension = store.dimensions[relationship.dimensionId];
                const isSelected = selectedRelationshipId === relationship.id;
                
                return (
                  <motion.div
                    key={relationship.id}
                    style={{
                      padding: '10px',
                      border: `1px solid ${isSelected ? '#1890ff' : '#e0e0e0'}`,
                      borderRadius: '6px',
                      backgroundColor: isSelected ? '#e6f7ff' : 'white',
                      cursor: 'pointer',
                      fontSize: '11px'
                    }}
                    onClick={() => setSelectedRelationshipId(isSelected ? null : relationship.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <div style={{ color: status.color }}>
                        {status.icon}
                      </div>
                      <span style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
                        {relationship.relationshipType}
                      </span>
                      <div style={{ marginLeft: 'auto', display: 'flex', gap: '2px' }}>
                        <button
                          style={{
                            padding: '2px',
                            border: 'none',
                            backgroundColor: 'transparent',
                            cursor: 'pointer',
                            color: relationship.autoUpdate ? '#52c41a' : '#d9d9d9'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleAutoUpdate(relationship.id);
                          }}
                          title={relationship.autoUpdate ? 'Disable auto-update' : 'Enable auto-update'}
                        >
                          {relationship.autoUpdate ? <Eye size={12} /> : <EyeOff size={12} />}
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
                            handleRemoveRelationship(relationship.id);
                          }}
                          title="Remove relationship"
                        >
                          <XCircle size={12} />
                        </button>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                      <Ruler size={12} color="#1890ff" />
                      <span style={{ color: '#666' }}>
                        {dimension ? dimension.type : 'Unknown'} ({relationship.dimensionId.substring(0, 6)})
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                      <ArrowRight size={12} color="#52c41a" />
                      <span style={{ color: '#666' }}>
                        {relationship.entityIds.length} entities
                      </span>
                    </div>
                    
                    <div style={{ fontSize: '10px', color: '#999' }}>
                      Value: {relationship.lastValue.toFixed(3)} | Tolerance: {relationship.tolerance}
                    </div>
                    
                    {isSelected && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #f0f0f0' }}
                      >
                        <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px' }}>
                          Connected Entities:
                        </div>
                        {relationship.entityIds.map(entityId => (
                          <div key={entityId} style={{ fontSize: '10px', color: '#999', marginLeft: '8px' }}>
                            • {getEntityName(entityId)}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
              
              {relationships.length === 0 && (
                <div style={{
                  padding: '24px',
                  textAlign: 'center',
                  color: '#999',
                  fontSize: '12px'
                }}>
                  <Link2 size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                  <div>No associative relationships</div>
                  <div>Select dimension + entities and click "Relate"</div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'dependencies' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h4 style={{ margin: 0, fontSize: '14px', color: '#333' }}>
                Dependencies ({dependencies.length})
              </h4>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {dependencies.map(dependency => (
                <motion.div
                  key={dependency.id}
                  style={{
                    padding: '10px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    fontSize: '11px'
                  }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <GitBranch size={14} color="#722ed1" />
                    <span style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
                      {dependency.dependencyType}
                    </span>
                    <div style={{ marginLeft: 'auto' }}>
                      <button
                        style={{
                          padding: '2px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          cursor: 'pointer',
                          color: '#ff4d4f'
                        }}
                        onClick={() => handleRemoveDependency(dependency.id)}
                        title="Remove dependency"
                      >
                        <XCircle size={12} />
                      </button>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                    <span style={{ color: '#666', fontSize: '10px' }}>Parent:</span>
                    <span style={{ color: '#1890ff', fontSize: '10px' }}>
                      {getEntityName(dependency.parentDimensionId)}
                    </span>
                  </div>
                  
                  <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px' }}>
                    Children: ({dependency.childDimensionIds.length})
                  </div>
                  {dependency.childDimensionIds.map(childId => (
                    <div key={childId} style={{ fontSize: '10px', color: '#999', marginLeft: '8px' }}>
                      • {getEntityName(childId)}
                    </div>
                  ))}
                </motion.div>
              ))}
              
              {dependencies.length === 0 && (
                <div style={{
                  padding: '24px',
                  textAlign: 'center',
                  color: '#999',
                  fontSize: '12px'
                }}>
                  <GitBranch size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                  <div>No dimension dependencies</div>
                  <div>Select multiple dimensions and click "Depend"</div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'monitor' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h4 style={{ margin: 0, fontSize: '14px', color: '#333' }}>
                Update Events ({updateEvents.length})
              </h4>
              <motion.button
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#ff4d4f',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '11px'
                }}
                onClick={() => {
                  updateEventsRef.current = [];
                  setUpdateEvents([]);
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Clear
              </motion.button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '400px', overflowY: 'auto' }}>
              {updateEvents.map((event, index) => (
                <motion.div
                  key={`${event.dimensionId}-${event.timestamp}`}
                  style={{
                    padding: '8px',
                    border: '1px solid #f0f0f0',
                    borderRadius: '4px',
                    backgroundColor: 'white',
                    fontSize: '10px'
                  }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <div style={{ 
                      width: '6px', 
                      height: '6px', 
                      borderRadius: '50%', 
                      backgroundColor: event.source === 'user' ? '#1890ff' : event.source === 'constraint' ? '#52c41a' : '#722ed1' 
                    }} />
                    <span style={{ fontWeight: 'bold' }}>
                      {getEntityName(event.dimensionId)}
                    </span>
                    <span style={{ marginLeft: 'auto', color: '#999' }}>
                      {formatTimestamp(event.timestamp)}
                    </span>
                  </div>
                  
                  <div style={{ color: '#666', marginBottom: '2px' }}>
                    {event.oldValue.toFixed(3)} → {event.newValue.toFixed(3)}
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ 
                      padding: '1px 4px', 
                      backgroundColor: event.source === 'user' ? '#e6f7ff' : event.source === 'constraint' ? '#f6ffed' : '#f9f0ff',
                      color: event.source === 'user' ? '#1890ff' : event.source === 'constraint' ? '#52c41a' : '#722ed1',
                      borderRadius: '2px',
                      fontSize: '9px'
                    }}>
                      {event.source}
                    </span>
                    {event.affectedEntities.length > 0 && (
                      <span style={{ color: '#999' }}>
                        {event.affectedEntities.length} affected
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
              
              {updateEvents.length === 0 && (
                <div style={{
                  padding: '24px',
                  textAlign: 'center',
                  color: '#999',
                  fontSize: '12px'
                }}>
                  <Target size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                  <div>No update events</div>
                  <div>Dimension changes will appear here</div>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span>Relations: {relationships.length}</span>
          <span>Dependencies: {dependencies.length}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Auto-update: {relationships.filter(r => r.autoUpdate).length}</span>
          <span>Selected: {store.selectedEntityIds.length}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default AssociativeDimensionsPanel;