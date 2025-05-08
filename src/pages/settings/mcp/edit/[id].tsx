// Server edit page

// src/pages/settings/mcp/edit/[id].tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { MCPServerConfig, MCPStdioServerConfig, MCPSseConfig } from '../../../../lib/mcp/client';
import Layout from '@/src/components/layout/Layout';

export default function EditMCPServerPage() {
  const [formData, setFormData] = useState({
    name: '',
    type: 'stdio',
    command: '',
    args: '',
    workingDirectory: '',
    url: '',
    enabled: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { id } = router.query;
  
  useEffect(() => {
    async function fetchServer() {
      if (!id || typeof id !== 'string') return;
      
      try {
        const response = await fetch(`/api/mcp/servers/${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch server data');
        }
        
        const serverDataJSON = await response.json();
        
        let newFormDataState = {
          name: '',
          type: 'stdio' as 'stdio' | 'sse',
          command: '',
          args: '',
          workingDirectory: '',
          url: '',
          enabled: true,
        };

        // Check type first before casting and accessing specific properties
        if (serverDataJSON && typeof serverDataJSON.type === 'string') {
          if (serverDataJSON.type === 'stdio') {
            const stdioData = serverDataJSON as MCPStdioServerConfig;
            newFormDataState = {
              name: stdioData.name,
              type: stdioData.type,
              enabled: stdioData.enabled,
              command: stdioData.command || '',
              args: Array.isArray(stdioData.args) ? stdioData.args.join(' ') : '',
              workingDirectory: stdioData.workingDirectory || '',
              url: '', 
            };
          } else if (serverDataJSON.type === 'sse') {
            const sseData = serverDataJSON as MCPSseConfig;
            newFormDataState = {
              name: sseData.name,
              type: sseData.type,
              enabled: sseData.enabled,
              command: '',
              args: '',
              workingDirectory: '',
              url: sseData.url || '',
            };
          } else {
            console.error("Fetched unexpected server data type:", serverDataJSON.type, serverDataJSON);
            setError(`Failed to parse server data: unexpected type '${serverDataJSON.type}'.`);
            newFormDataState.name = serverDataJSON.name || '';
            newFormDataState.enabled = serverDataJSON.enabled ?? false;
          }
        } else {
          console.error("Fetched server data is missing type property or is invalid:", serverDataJSON);
          setError("Failed to parse server data: type property missing or invalid.");
          // Keep newFormDataState as its default (error) state
          if(serverDataJSON && typeof serverDataJSON.name === 'string') newFormDataState.name = serverDataJSON.name;
          if(serverDataJSON && typeof serverDataJSON.enabled === 'boolean') newFormDataState.enabled = serverDataJSON.enabled;
        }

        setFormData(newFormDataState);

      } catch (err: any) {
        setError(err.message || 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchServer();
  }, [id]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    
    try {
      // Validate form
      if (!formData.name) {
        throw new Error('Server name is required');
      }
      
      if (formData.type === 'stdio' && !formData.command) {
        throw new Error('Command is required for Standard IO servers');
      }
      
      if (formData.type === 'sse' && !formData.url) {
        throw new Error('URL is required for Server-Sent Events servers');
      }
      
      // Prepare data
      const serverData = {
        name: formData.name,
        type: formData.type,
        enabled: formData.enabled,
        ...(formData.type === 'stdio' && {
          command: formData.command,
          args: formData.args ? formData.args.split(' ') : [],
          workingDirectory: formData.workingDirectory || undefined,
        }),
        ...(formData.type === 'sse' && {
          url: formData.url,
        }),
      };
      
      // Submit data
      const response = await fetch(`/api/mcp/servers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(serverData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update server');
      }
      
      // Navigate back to settings page
      router.push('/settings/mcp');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }
  
  return (
    <Layout>
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Edit MCP Server</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700 mb-1">Server Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        
        <div>
          <label className="block text-gray-700 mb-1">Server Type</label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            disabled // Type cannot be changed after creation
          >
            <option value="stdio">Standard IO</option>
            <option value="sse">Server-Sent Events</option>
          </select>
        </div>
        
        {formData.type === 'stdio' && (
          <>
            <div>
              <label className="block text-gray-700 mb-1">Command</label>
              <input
                type="text"
                name="command"
                value={formData.command}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                placeholder="e.g., node, python"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-1">Arguments (space-separated)</label>
              <input
                type="text"
                name="args"
                value={formData.args}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                placeholder="e.g., server.js --port 8080"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-1">Working Directory (optional)</label>
              <input
                type="text"
                name="workingDirectory"
                value={formData.workingDirectory}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                placeholder="e.g., /path/to/working/dir"
              />
            </div>
          </>
        )}
        
        {formData.type === 'sse' && (
          <div>
            <label className="block text-gray-700 mb-1">URL</label>
            <input
              type="text"
              name="url"
              value={formData.url}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              placeholder="e.g., http://localhost:8080/sse"
              required
            />
          </div>
        )}
        
        <div className="flex items-center">
          <input
            type="checkbox"
            name="enabled"
            checked={formData.enabled}
            onChange={handleChange}
            className="mr-2"
          />
          <label>Enabled</label>
        </div>
        
        <div className="flex justify-between">
          <Link href="/settings/mcp">
            <button type="button" className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded">
              Cancel
            </button>
          </Link>
          
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
    </Layout>
  );
}