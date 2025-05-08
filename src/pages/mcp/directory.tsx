// MCP server directory// src/pages/mcp/directory.tsx
import { useState, useEffect } from 'react';
import { MCPApiClient, MCPServerConfig } from '../../lib/mcp/api-client';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '@/src/components/layout/Layout';

export default function MCPDirectoryPage() {
  const [servers, setServers] = useState<MCPServerConfig[]>([]);
  const [serverInfo, setServerInfo] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  // Load servers on mount
  useEffect(() => {
    const fetchServers = async () => {
      try {
        const serversList = await MCPApiClient.getServers();
        setServers(serversList);
        
        // Load server info for each enabled server
        const infoPromises = serversList
          .filter(server => server.enabled)
          .map(async (server) => {
            try {
              const info = await MCPApiClient.getServerInfo(server.id);
              return { id: server.id, info };
            } catch (err) {
              console.error(`Failed to fetch info for server ${server.id}:`, err);
              return { id: server.id, error: true };
            }
          });
        
        const infoResults = await Promise.all(infoPromises);
        const infoMap: Record<string, any> = {};
        
        infoResults.forEach((result) => {
          if ('info' in result) {
            infoMap[result.id] = result.info;
          }
        });
        
        setServerInfo(infoMap);
      } catch (err: any) {
        setError(err.message || 'Failed to load servers');
      } finally {
        setLoading(false);
      }
    };
    
    fetchServers();
  }, []);
  
  const handleViewServer = (serverId: string) => {
    router.push(`/mcp/servers/${serverId}`);
  };
  
  const handleToggleServer = async (serverId: string, enabled: boolean) => {
    try {
      await MCPApiClient.updateServer(serverId, { enabled });
      setServers(servers.map(server => 
        server.id === serverId ? { ...server, enabled } : server
      ));
    } catch (err: any) {
      setError(err.message || 'Failed to update server');
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">MCP Server Directory</h1>
        <div className="text-center p-8">Loading servers...</div>
      </div>
    );
  }
  
  return (
    <Layout>
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">MCP Server Directory</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="mb-4 flex justify-between items-center">
        <span className="text-gray-600">
          {servers.length} server{servers.length !== 1 ? 's' : ''} available
        </span>
        
        <Link href="/settings/mcp">
          <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            Manage Servers
          </button>
        </Link>
      </div>
      
      {servers.length === 0 ? (
        <div className="bg-gray-100 p-8 rounded text-center">
          <p className="mb-4">No MCP servers configured yet.</p>
          <Link href="/settings/mcp">
            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
              Add Server
            </button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {servers.map((server) => {
            const info = serverInfo[server.id];
            
            return (
              <div key={server.id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className={`p-4 ${server.enabled ? 'bg-green-50' : 'bg-gray-50'}`}>
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">{server.name}</h2>
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-2 ${
                        server.enabled ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                      <span className="text-sm text-gray-600">
                        {server.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mt-1 truncate">{server.url}</p>
                </div>
                
                <div className="p-4 border-t">
                  {info ? (
                    <div>
                      <div className="mb-2">
                        <span className="text-gray-600 text-sm">Server:</span>{' '}
                        <span className="font-medium">{info.name}</span>
                        {info.version && (
                          <span className="text-sm text-gray-500 ml-1">v{info.version}</span>
                        )}
                      </div>
                      
                      <div className="flex space-x-8 text-sm text-gray-600">
                        <div>
                          <span>{info.resources?.length || 0}</span>{' '}
                          <span>Resource{(info.resources?.length || 0) !== 1 ? 's' : ''}</span>
                        </div>
                        <div>
                          <span>{info.tools?.length || 0}</span>{' '}
                          <span>Tool{(info.tools?.length || 0) !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">
                      {server.enabled
                        ? 'Server info not available'
                        : 'Server is disabled'}
                    </div>
                  )}
                </div>
                
                <div className="p-3 bg-gray-50 border-t flex justify-between">
                  <button
                    onClick={() => handleToggleServer(server.id, !server.enabled)}
                    className={`px-3 py-1 rounded text-sm ${
                      server.enabled
                        ? 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                        : 'bg-green-100 hover:bg-green-200 text-green-800'
                    }`}
                  >
                    {server.enabled ? 'Disable' : 'Enable'}
                  </button>
                  
                  <button
                    onClick={() => handleViewServer(server.id)}
                    className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm"
                  >
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
    </Layout>
  );
}