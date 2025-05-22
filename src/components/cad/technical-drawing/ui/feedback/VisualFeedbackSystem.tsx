// src/components/cad/technical-drawing/ui/feedback/VisualFeedbackSystem.tsx

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTechnicalDrawingStore } from '../../technicalDrawingStore';
import { 
  Undo2, 
  Redo2, 
  Save, 
  Trash2, 
  Copy, 
  Move, 
  RotateCw, 
  Scale,
  CheckCircle,
  XCircle,
  Info,
  AlertTriangle,
  Zap
} from 'lucide-react';

interface FeedbackMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'undo' | 'redo';
  title: string;
  description?: string;
  action?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  duration?: number;
  timestamp: number;
}

interface OperationFeedback {
  id: string;
  operation: string;
  status: 'pending' | 'success' | 'error';
  progress?: number;
  timestamp: number;
}

export const VisualFeedbackSystem: React.FC = () => {
  const {
    commandHistory,
    currentCommandIndex,
    undoCommand,
    redoCommand
  } = useTechnicalDrawingStore();

  const [feedbackMessages, setFeedbackMessages] = useState<FeedbackMessage[]>([]);
  const [operations, setOperations] = useState<OperationFeedback[]>([]);
  const [showUndoRedoHistory, setShowUndoRedoHistory] = useState(false);

  // Add feedback message
  const addFeedback = (message: Omit<FeedbackMessage, 'id' | 'timestamp'>) => {
    const id = `feedback_${Date.now()}_${Math.random()}`;
    const newMessage: FeedbackMessage = {
      ...message,
      id,
      timestamp: Date.now(),
      duration: message.duration || 3000
    };

    setFeedbackMessages(prev => [newMessage, ...prev]);

    // Auto-remove after duration
    if (newMessage.duration > 0) {
      setTimeout(() => {
        removeFeedback(id);
      }, newMessage.duration);
    }
  };

  // Remove feedback message
  const removeFeedback = (id: string) => {
    setFeedbackMessages(prev => prev.filter(msg => msg.id !== id));
  };

  // Add operation feedback
  const addOperation = (operation: string) => {
    const id = `op_${Date.now()}_${Math.random()}`;
    const newOperation: OperationFeedback = {
      id,
      operation,
      status: 'pending',
      progress: 0,
      timestamp: Date.now()
    };

    setOperations(prev => [newOperation, ...prev]);
    return id;
  };

  // Update operation progress
  const updateOperation = (id: string, updates: Partial<OperationFeedback>) => {
    setOperations(prev => prev.map(op => 
      op.id === id ? { ...op, ...updates } : op
    ));

    // Auto-remove completed operations
    if (updates.status === 'success' || updates.status === 'error') {
      setTimeout(() => {
        setOperations(prev => prev.filter(op => op.id !== id));
      }, 2000);
    }
  };

  // Listen for store changes and show appropriate feedback
  useEffect(() => {
    // This would typically be implemented with a proper event system
    // For now, we'll simulate some common feedback scenarios
    
    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        if (currentCommandIndex >= 0) {
          addFeedback({
            type: 'undo',
            title: 'Annullato',
            description: commandHistory[currentCommandIndex]?.description || 'Ultima operazione',
            icon: Undo2,
            duration: 2000
          });
        } else {
          addFeedback({
            type: 'warning',
            title: 'Niente da annullare',
            icon: AlertTriangle,
            duration: 1500
          });
        }
      }

      if ((e.ctrlKey && e.shiftKey && e.key === 'Z') || (e.ctrlKey && e.key === 'y')) {
        if (currentCommandIndex < commandHistory.length - 1) {
          addFeedback({
            type: 'redo',
            title: 'Ripristinato',
            description: commandHistory[currentCommandIndex + 1]?.description || 'Operazione',
            icon: Redo2,
            duration: 2000
          });
        } else {
          addFeedback({
            type: 'warning',
            title: 'Niente da ripristinare',
            icon: AlertTriangle,
            duration: 1500
          });
        }
      }

      if (e.ctrlKey && e.key === 's') {
        const opId = addOperation('Salvataggio in corso...');
        
        // Simulate save operation
        setTimeout(() => {
          updateOperation(opId, { 
            status: 'success', 
            progress: 100 
          });
          
          addFeedback({
            type: 'success',
            title: 'Disegno salvato',
            description: 'Il file è stato salvato correttamente',
            icon: Save,
            duration: 2000
          });
        }, 1000);
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    
    // Listen for custom CAD events
    const handleCadSave = () => {
      addFeedback({
        type: 'success',
        title: 'Disegno salvato',
        icon: Save
      });
    };

    const handleCadExport = () => {
      addFeedback({
        type: 'info',
        title: 'Esportazione completata',
        icon: Zap
      });
    };

    window.addEventListener('cad_save', handleCadSave);
    window.addEventListener('cad_export', handleCadExport);

    return () => {
      window.removeEventListener('keydown', handleKeyboard);
      window.removeEventListener('cad_save', handleCadSave);
      window.removeEventListener('cad_export', handleCadExport);
    };
  }, [currentCommandIndex, commandHistory]);

  const getOperationIcon = (operation: string) => {
    const operationIcons: Record<string, React.ComponentType<any>> = {
      'copy': Copy,
      'delete': Trash2,
      'move': Move,
      'rotate': RotateCw,
      'scale': Scale,
      'save': Save,
      'export': Zap
    };

    const key = Object.keys(operationIcons).find(k => 
      operation.toLowerCase().includes(k)
    );

    return key ? operationIcons[key] : Info;
  };

  const getFeedbackIcon = (message: FeedbackMessage) => {
    if (message.icon) return message.icon;

    const typeIcons = {
      success: CheckCircle,
      error: XCircle,
      warning: AlertTriangle,
      info: Info,
      undo: Undo2,
      redo: Redo2
    };

    return typeIcons[message.type];
  };

  const getFeedbackColor = (type: string) => {
    const colors = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      warning: 'bg-yellow-500',
      info: 'bg-blue-500',
      undo: 'bg-orange-500',
      redo: 'bg-purple-500'
    };

    return colors[type as keyof typeof colors] || 'bg-gray-500';
  };

  return (
    <>
      {/* Feedback Messages */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
        <AnimatePresence>
          {feedbackMessages.map(message => {
            const Icon = getFeedbackIcon(message);
            
            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, x: 300, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 300, scale: 0.9 }}
                className={`
                  ${getFeedbackColor(message.type)} text-white p-4 rounded-lg shadow-lg
                  flex items-start space-x-3 cursor-pointer
                `}
                onClick={() => removeFeedback(message.id)}
                whileHover={{ scale: 1.02 }}
                layout
              >
                <Icon size={20} className="flex-shrink-0 mt-0.5" />
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm">{message.title}</h4>
                  {message.description && (
                    <p className="text-xs opacity-90 mt-1">{message.description}</p>
                  )}
                  {message.action && (
                    <p className="text-xs font-medium mt-2 border-t border-white/20 pt-2">
                      {message.action}
                    </p>
                  )}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFeedback(message.id);
                  }}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  ×
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Operation Progress */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
        <AnimatePresence>
          {operations.map(operation => {
            const Icon = getOperationIcon(operation.operation);
            
            return (
              <motion.div
                key={operation.id}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.9 }}
                className="bg-white border border-gray-200 p-4 rounded-lg shadow-lg"
                layout
              >
                <div className="flex items-center space-x-3">
                  <div className={`
                    p-2 rounded-full
                    ${operation.status === 'pending' ? 'bg-blue-100 text-blue-600' : ''}
                    ${operation.status === 'success' ? 'bg-green-100 text-green-600' : ''}
                    ${operation.status === 'error' ? 'bg-red-100 text-red-600' : ''}
                  `}>
                    <Icon size={16} />
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-medium text-sm text-gray-900">
                      {operation.operation}
                    </h4>
                    
                    {operation.status === 'pending' && operation.progress !== undefined && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <motion.div
                            className="bg-blue-500 h-2 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${operation.progress}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {operation.progress}%
                        </p>
                      </div>
                    )}
                    
                    {operation.status === 'success' && (
                      <p className="text-xs text-green-600 mt-1">Completato</p>
                    )}
                    
                    {operation.status === 'error' && (
                      <p className="text-xs text-red-600 mt-1">Errore</p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Undo/Redo History Panel */}
      <AnimatePresence>
        {showUndoRedoHistory && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 left-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 max-w-xs"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-sm">Cronologia Comandi</h3>
              <button
                onClick={() => setShowUndoRedoHistory(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1">
              {commandHistory.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">
                  Nessun comando nella cronologia
                </p>
              ) : (
                commandHistory.map((command, index) => (
                  <div
                    key={command.id}
                    className={`
                      text-xs p-2 rounded cursor-pointer transition-colors
                      ${index === currentCommandIndex 
                        ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                        : index < currentCommandIndex 
                        ? 'bg-gray-50 text-gray-600' 
                        : 'bg-gray-100 text-gray-400'
                      }
                    `}
                    onClick={() => {
                      // Navigate to specific command in history
                      while (currentCommandIndex > index) {
                        undoCommand();
                      }
                      while (currentCommandIndex < index) {
                        redoCommand();
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span>{command.description}</span>
                      <span className="text-xs opacity-60">
                        {new Date(command.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-3 pt-3 border-t border-gray-200 flex gap-2">
              <button
                onClick={undoCommand}
                disabled={currentCommandIndex < 0}
                className="flex-1 px-2 py-1 text-xs bg-orange-100 text-orange-600 rounded hover:bg-orange-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Undo2 size={12} className="inline mr-1" />
                Annulla
              </button>
              <button
                onClick={redoCommand}
                disabled={currentCommandIndex >= commandHistory.length - 1}
                className="flex-1 px-2 py-1 text-xs bg-purple-100 text-purple-600 rounded hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Redo2 size={12} className="inline mr-1" />
                Ripeti
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button for History */}
      <motion.button
        className="fixed bottom-4 left-4 bg-gray-800 text-white p-3 rounded-full shadow-lg z-40"
        onClick={() => setShowUndoRedoHistory(!showUndoRedoHistory)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Undo2 size={20} />
        
        {/* Badge with command count */}
        {commandHistory.length > 0 && (
          <motion.div
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.7 }}
          >
            {commandHistory.length}
          </motion.div>
        )}
      </motion.button>
    </>
  );
};

// Custom hook for easy feedback usage
export const useFeedback = () => {
  const addFeedback = (message: Omit<FeedbackMessage, 'id' | 'timestamp'>) => {
    // This would typically dispatch to the feedback system
    // For now, we'll use a custom event
    const event = new CustomEvent('cad_feedback', { detail: message });
    window.dispatchEvent(event);
  };

  const showSuccess = (title: string, description?: string, action?: string) => {
    addFeedback({ type: 'success', title, description, action });
  };

  const showError = (title: string, description?: string, action?: string) => {
    addFeedback({ type: 'error', title, description, action });
  };

  const showWarning = (title: string, description?: string, action?: string) => {
    addFeedback({ type: 'warning', title, description, action });
  };

  const showInfo = (title: string, description?: string, action?: string) => {
    addFeedback({ type: 'info', title, description, action });
  };

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};

export default VisualFeedbackSystem;
