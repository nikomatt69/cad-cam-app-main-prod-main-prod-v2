// MCP settings page// src/pages/settings/mcp.tsx
import { useState } from 'react';
import { useMCP } from '@/src/contexts/MCPContext';
// Use MCPServerConfig from the client definitions, which is the discriminated union
import { MCPServerConfig, MCPSseConfig, MCPStdioServerConfig } from '@/src/lib/mcp/client'; 
import Layout from '@/src/components/layout/Layout';
import Link from 'next/link';
// MCPApiClient might still be needed if it serves other purposes, otherwise, it could be removed if only used for MCPServerConfig
// import { MCPApiClient } from '@/src/lib/mcp/api-client';

export default function MCPSettingsPage() {
  const { servers, isLoading, error, refreshServers, addServer, updateServer, deleteServer } = useMCP();
  const [isAddingServer, setIsAddingServer] = useState(false);
  const [editingServerId, setEditingServerId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    enabled: true,
  });
  
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };
  
  const handleAddServer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await addServer({
        name: formData.name,
        type: 'sse',
        
        enabled: formData.enabled,
      });
      
      // Reset form
      setFormData({
        name: '',
        url: '',
        enabled: true,
      });
      setIsAddingServer(false);
    } catch (err) {
      // Error is handled by the context
    }
  };
  
  const handleUpdateServer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingServerId) return;
    
    try {
      await updateServer(editingServerId, {
        name: formData.name,
        url: formData.url,
        enabled: formData.enabled,
      });
      
      // Reset form
      setFormData({
        name: '',
        url: '',
        enabled: true,
      });
      setEditingServerId(null);
    } catch (err) {
      // Error is handled by the context
    }
  };
  
  const handleEditServer = (server: MCPServerConfig) => {
    if (server.type === 'sse') {
      setFormData({
        name: server.name,
        url: server.url || '', // server is MCPSseConfig here
        enabled: server.enabled,
        // Ensure other formData fields expected by the form are defaulted if not applicable to SSE
        // command: '', args: '', workingDirectory: '' // Assuming formData includes these for stdio
      });
    } else if (server.type === 'stdio') {
      // The main form in this file (index.tsx) seems geared towards SSE (name, url, enabled)
      // If you intend to edit Stdio specific fields like 'command', 'args' here too,
      // formData state and the form itself would need those fields.
      // For now, setting URL to empty for stdio as the form has a URL field.
      setFormData({
        name: server.name,
        url: '', // Stdio doesn't have URL, form has URL field
        enabled: server.enabled,
        // command: server.command || '', args: server.args?.join(' ') || '', workingDirectory: server.workingDirectory || ''
      });
    } else {
      // Should not happen if server is correctly typed from context
      console.error("Editing server with unknown type:", server);
      const unknownServer = server as any;
      setFormData({
        name: unknownServer.name || '',
        url: unknownServer.url || '', // Attempt to get URL if it exists
        enabled: unknownServer.enabled ?? true,
      });
    }
    setEditingServerId(server.id);
    setIsAddingServer(false);
  };
  
  const handleDeleteServer = async (id: string) => {
    if (!confirm('Are you sure you want to delete this server?')) {
      return;
    }
    
    try {
      await deleteServer(id);
    } catch (err) {
      // Error is handled by the context
    }
  };
  
  return (
    <Layout>
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">MCP Server Settings</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="mb-4 space-x-3 flex items-center">
        <button
          onClick={() => {
            setIsAddingServer(true);
            setEditingServerId(null);
            setFormData({
              name: '',
              url: '',
              enabled: true,
            });
          }}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Add Server
        </button>
        <Link href="/settings/mcp/config-editor">
            <button className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded`}>
              Editor MCP.json
            </button>
          </Link> 
      </div>
      
      {isAddingServer && (
        <div className="bg-gray-100 p-4 rounded mb-4">
          <h2 className="text-xl font-semibold mb-2">Add MCP Server</h2>
          <form onSubmit={handleAddServer} className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-1">Server Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-1">Server URL</label>
              <input
                type="text"
                name="url"
                value={formData.url}
                onChange={handleFormChange}
                className="w-full p-2 border rounded"
                placeholder="e.g., https://example.com/mcp/sse"
                required
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                name="enabled"
                checked={formData.enabled}
                onChange={handleFormChange}
                className="mr-2"
              />
              <label>Enabled</label>
            </div>
            
            <div className="flex space-x-2">
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Add Server
              </button>
              <button
                type="button"
                onClick={() => setIsAddingServer(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
      
      {editingServerId && (
        <div className="bg-gray-100 p-4 rounded mb-4">
          <h2 className="text-xl font-semibold mb-2">Edit MCP Server</h2>
          <form onSubmit={handleUpdateServer} className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-1">Server Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-1">Server URL</label>
              <input
                type="text"
                name="url"
                value={formData.url}
                onChange={handleFormChange}
                className="w-full p-2 border rounded"
                placeholder="e.g., https://example.com/mcp/sse"
                required
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                name="enabled"
                checked={formData.enabled}
                onChange={handleFormChange}
                className="mr-2"
              />
              <label>Enabled</label>
            </div>
            
            <div className="flex space-x-2">
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Update Server
              </button>
              <button
                type="button"
                onClick={() => setEditingServerId(null)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
      
      {isLoading ? (
        <div className="text-center p-4">Loading servers...</div>
      ) : servers.length === 0 ? (
        <div className="bg-gray-100 p-4 rounded">
          No MCP servers configured. Click &quot;Add Server&quot; to add one.
        </div>
      ) : (
        <div className="grid gap-4">
          {servers.map((server) => (
            <div key={server.id} className="border p-4 rounded">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold">{server.name}</h2>
                  {server.type === 'sse' && <p className="text-gray-600">{server.url}</p>}
                  {server.type === 'stdio' && <p className="text-gray-600">Type: Standard I/O (No URL)</p>}
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={server.enabled}
                      onChange={() => updateServer(server.id, { enabled: !server.enabled })}
                      className="mr-2"
                    />
                    <span>Enabled</span>
                  </div>
                  
                  <button
                    onClick={() => handleEditServer(server)}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-1 px-3 rounded"
                  >
                    Edit
                  </button>
                  
                  <button
                    onClick={() => handleDeleteServer(server.id)}
                    className="bg-red-500 hover:bg-red-700 text-white py-1 px-3 rounded"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </Layout>
  );
}