import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, BarChart2, Activity, Settings, MessageCircle, RefreshCw } from 'react-feather';
import { useAI } from './AIContextProvider';
import { useDocumentAnalyzer } from '@/src/hooks/useDocumentAnalyzer';
import { useEnhancedContext } from '@/src/hooks/useEnhancedContext';

export const AIDashboard: React.FC = () => {
  const { state } = useAI();
  const { documentInsights, isAnalyzing, refreshAnalysis } = useDocumentAnalyzer();
  const { contextSummary } = useEnhancedContext();
  const [activeTab, setActiveTab] = useState<'context' | 'stats' | 'insights'>('context');
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center">
          <Cpu className="mr-2 text-blue-500" size={20} />
          AI Assistant Dashboard
        </h2>
        
        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('context')}
            className={`px-3 py-1 text-sm rounded ${
              activeTab === 'context' 
                ? 'bg-blue-500 text-white' 
                : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            Context
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-3 py-1 text-sm rounded ${
              activeTab === 'stats' 
                ? 'bg-blue-500 text-white' 
                : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            Stats
          </button>
          <button
            onClick={() => setActiveTab('insights')}
            className={`px-3 py-1 text-sm rounded ${
              activeTab === 'insights' 
                ? 'bg-blue-500 text-white' 
                : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            Insights
          </button>
        </div>
      </div>
      
      {/* Tab content */}
      <AnimatePresence mode="wait">
        {activeTab === 'context' && (
          <motion.div
            key="context"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                  Elements
                </h3>
                <div className="space-y-1">
                  <p className="text-sm">{contextSummary?.elements.count || 0} elements</p>
                  {contextSummary && Object.entries(contextSummary.elements.types).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(contextSummary.elements.types)
                        .map(([type, count]) => (
                          <span 
                            key={type}
                            className="px-2 py-0.5 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs rounded-full"
                          >
                            {count} {type}
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <h3 className="text-sm font-medium text-purple-800 dark:text-purple-200 mb-2">
                  Context Files
                </h3>
                <p className="text-sm">
                  {contextSummary?.documents.count || 0} active documents
                </p>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Environment
              </h3>
              <div className="grid grid-cols-3 gap-2 text-xs text-gray-600 dark:text-gray-400">
                <div>
                  <span className="font-medium">Browser:</span> {contextSummary?.environment.browser || 'Unknown'}
                </div>
                <div>
                  <span className="font-medium">Screen:</span> {contextSummary?.environment.screen || 'Unknown'}
                </div>
                <div>
                  <span className="font-medium">OS:</span> {contextSummary?.environment.os || 'Unknown'}
                </div>
              </div>
            </div>
          </motion.div>
        )}
        
        {activeTab === 'stats' && (
          <motion.div
            key="stats"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <h3 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2 flex items-center">
                  <Activity size={14} className="mr-1" />
                  Performance
                </h3>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {Math.round(state.performance.averageResponseTime || 0)} ms
                </div>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  Average response time
                </p>
              </div>
              
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2 flex items-center">
                  <BarChart2 size={14} className="mr-1" />
                  Success Rate
                </h3>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {Math.round(state.performance.successRate || 0)}%
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  Request success rate
                </p>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                <MessageCircle size={14} className="mr-1" />
                History
              </h3>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {state.history.slice(0, 5).map((item) => (
                  <div 
                    key={item.id}
                    className="text-xs p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex justify-between">
                      <span className="font-medium">
                        {item.type === 'user_message' ? 'User' : 'AI'}
                      </span>
                      <span className="text-gray-500">
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="mt-1 truncate">
                      {item.type === 'user_message'
                        ? item.prompt
                        : (typeof item.result === 'string'
                            ? item.result
                            : 'Complex result')
                      }
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
        
        {activeTab === 'insights' && (
          <motion.div
            key="insights"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Document Insights
              </h3>
              <button
                onClick={() => refreshAnalysis()}
                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded"
              >
                <RefreshCw size={14} className={isAnalyzing ? 'animate-spin' : ''} />
              </button>
            </div>
            
            {documentInsights.length > 0 ? (
              <div className="space-y-2">
                {documentInsights.map((insight, index) => (
                  <div
                    key={index}
                    className="p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium capitalize">
                        {insight.key}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {Math.round(insight.confidence * 100)}% confidence
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                      {insight.value}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isAnalyzing 
                    ? 'Analyzing documents...' 
                    : 'No insights found. Add context files to get insights.'}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};