// MCP examples page

// src/pages/examples/mcp.tsx
import { useState } from 'react';
import MCPResourceBrowser from '../../components/MCPResourceBrowser';
import MCPToolExplorer from '../../components/MCPToolExplorer';
import AIChatWithMCP from '@/src/components/AIChatWithMCP';
import Layout from '@/src/components/layout/Layout';
export default function MCPExamplesPage() {
  const [activeTab, setActiveTab] = useState('resources');
  
  return (  
    <Layout>
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">MCP Examples</h1>
      <AIChatWithMCP />
      <div className="mb-4">
        <div className="flex border-b">
          <button
            className={`py-2 px-4 ${
              activeTab === 'resources' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'
            }`}
            onClick={() => setActiveTab('resources')}
          >
            Resource Browser
          </button>
          <button
            className={`py-2 px-4 ${
              activeTab === 'tools' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'
            }`}
            onClick={() => setActiveTab('tools')}
          >
            Tool Explorer
          </button>
        </div>
      </div>
      
      {activeTab === 'resources' ? (
        <MCPResourceBrowser />
      ) : (
        <MCPToolExplorer />
      )}
    </div>
    </Layout>
  );
}