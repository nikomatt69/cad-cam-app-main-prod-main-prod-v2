// Server details page

// src/pages/mcp/servers/[id].tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { MCPApiClient } from '../../../lib/mcp/api-client';
import Link from 'next/link';
import Layout from '@/src/components/layout/Layout';
import { useSession } from 'next-auth/react'; 
import Loading from '@/src/components/ui/Loading';
export default function MCPServerDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  
  const [server, setServer] = useState<any>(null);
  const [serverInfo, setServerInfo] = useState<any>(null);
  const [selectedTab, setSelectedTab] = useState<'resources' | 'tools'>('resources');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { status } = useSession();
  useEffect(() => {
    const fetchServerDetails = async () => {
      if (!id || Array.isArray(id)) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Get server configuration
        const serverConfig = await MCPApiClient.getServer(id);
        setServer(serverConfig);
        
        // If server is enabled, get server info
        if (serverConfig.enabled) {
          try {
            const info = await MCPApiClient.getServerInfo(id);
            setServerInfo(info);
          } catch (err: any) {
            console.error('Failed to fetch server info:', err);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load server details');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchServerDetails();
    }
  }, [id]);
  
  const handleToggleStatus = async () => {
    if (!server) return;
    
    try {
      const updated = await MCPApiClient.updateServer(server.id, {
        enabled: !server.enabled,
      });
      
      setServer(updated);
      
      // If enabling, try to fetch server info
      if (updated.enabled) {
        try {
          const info = await MCPApiClient.getServerInfo(updated.id);
          setServerInfo(info);
        } catch (err: any) {
          console.error('Failed to fetch server info:', err);
        }
      } else {
        // If disabling, clear server info
        setServerInfo(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update server status');
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center p-8"><Loading/></div>
      </div>
    );
  }



  
  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }
  
  if (!server) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error || 'Server not found'}
        </div>
        <div className="mt-4">
          <Link href="/mcp/directory">
            <button className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded">
              Back to Directory
            </button>
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <Layout>
    <div className="container mx-auto p-4">
      <div className="mb-4">
        <Link href="/mcp/directory">
          <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-1 px-3 rounded text-sm">
            ← Back to Directory
          </button>
        </Link>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-2xl font-bold">{server.name}</h1>
            <span className={`px-3 py-1 rounded-full text-sm ${
              server.enabled
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {server.enabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          
          <div className="flex items-center mb-4">
            <span className="mr-2 text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
              {server.type === 'sse' ? 'Server-Sent Events (SSE)' : 'Standard I/O (stdio)'}
            </span>
            
            {server.type === 'sse' ? (
              <div className="text-gray-600">{server.url}</div>
            ) : (
              <div className="text-gray-600 font-mono text-sm">{(server as any).command}</div>
            )}
          </div>
          
          {server.type === 'stdio' && (
            <div className="mb-4 p-3 bg-gray-50 rounded border text-sm">
              {(server as any).args && (server as any).args.length > 0 && (
                <div className="mb-2">
                  <span className="font-medium">Arguments:</span>{' '}
                  <span className="font-mono">
                    {Array.isArray((server as any).args) 
                      ? (server as any).args.join(' ') 
                      : JSON.stringify((server as any).args)}
                  </span>
                </div>
              )}
              
              {(server as any).workingDirectory && (
                <div>
                  <span className="font-medium">Working Directory:</span>{' '}
                  <span className="font-mono">{(server as any).workingDirectory}</span>
                </div>
              )}
            </div>
          )}
          
          <div className="flex space-x-2">
            <button
              onClick={handleToggleStatus}
              className={`py-2 px-4 rounded text-white ${
                server.enabled
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              {server.enabled ? 'Disable Server' : 'Enable Server'}
            </button>
            
            <Link href={`/settings/mcp/edit/${server.id}`}>
              <button className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded">
                Edit Configuration
              </button>
            </Link>
          </div>
        </div>
        
        {serverInfo && (
          <div className="p-6">
            <div className="mb-4">
              <div className="text-gray-600 mb-1">Server Information</div>
              <div>
                <span className="font-medium">{serverInfo.name}</span>
                {serverInfo.version && (
                  <span className="text-sm text-gray-500 ml-1">v{serverInfo.version}</span>
                )}
              </div>
              {serverInfo.instructions && (
                <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-3 rounded">
                  {serverInfo.instructions}
                </div>
              )}
            </div>
            
            <div className="border-t pt-4">
              <div className="flex border-b mb-4">
                <button
                  className={`py-2 px-4 ${
                    selectedTab === 'resources'
                      ? 'border-b-2 border-blue-500 font-medium'
                      : 'text-gray-500'
                  }`}
                  onClick={() => setSelectedTab('resources')}
                >
                  Resources ({serverInfo.resources?.length || 0})
                </button>
                <button
                  className={`py-2 px-4 ${
                    selectedTab === 'tools'
                      ? 'border-b-2 border-blue-500 font-medium'
                      : 'text-gray-500'
                  }`}
                  onClick={() => setSelectedTab('tools')}
                >
                  Tools ({serverInfo.tools?.length || 0})
                </button>
              </div>
              
              {selectedTab === 'resources' ? (
                <div>
                  {serverInfo.resources?.length > 0 ? (
                    <div className="grid gap-4">
                      {serverInfo.resources.map((resource: any, index: number) => (
                        <div key={index} className="border rounded p-3 hover:bg-gray-50">
                          <div className="font-medium">{resource.name}</div>
                          <div className="text-sm text-gray-600 mt-1">{resource.uriTemplate}</div>
                          {resource.description && (
                            <div className="text-sm mt-2">{resource.description}</div>
                          )}
                          
                          {resource.arguments?.length > 0 && (
                            <div className="mt-2">
                              <div className="text-xs text-gray-500 mb-1">Arguments:</div>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                {resource.arguments.map((arg: any, argIndex: number) => (
                                  <div key={argIndex} className="flex">
                                    <span className="font-mono text-xs bg-gray-100 px-1 rounded">
                                      {arg.name}
                                    </span>
                                    {arg.required && (
                                      <span className="text-red-500 ml-1">*</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-center p-4">
                      No resources available
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  {serverInfo.tools?.length > 0 ? (
                    <div className="grid gap-4">
                      {serverInfo.tools.map((tool: any, index: number) => (
                        <div key={index} className="border rounded p-3 hover:bg-gray-50">
                          <div className="font-medium">{tool.name}</div>
                          {tool.description && (
                            <div className="text-sm text-gray-600 mt-1">{tool.description}</div>
                          )}
                          
                          {tool.parameters && (
                            <div className="mt-2">
                              <div className="text-xs text-gray-500 mb-1">Parameters:</div>
                              <div className="text-sm">
                                {Object.entries(tool.parameters.properties || {}).map(
                                  ([key, value]: [string, any], paramIndex: number) => (
                                    <div key={paramIndex} className="flex items-center mb-1">
                                      <span className="font-mono text-xs bg-gray-100 px-1 rounded">
                                        {key}
                                      </span>
                                      {tool.parameters.required?.includes(key) && (
                                        <span className="text-red-500 ml-1">*</span>
                                      )}
                                      {value.description && (
                                        <span className="text-xs text-gray-500 ml-2 truncate">
                                          {value.description}
                                        </span>
                                      )}
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-center p-4">
                      No tools available
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        
        {!serverInfo && server.enabled && (
          <div className="p-6 text-center text-gray-500">
            Server information not available. The server might be offline or inaccessible.
          </div>
        )}
        
        {!server.enabled && (
          <div className="p-6 text-center text-gray-500">
            This server is currently disabled. Enable it to view server information.
          </div>
        )}
      </div>
    </div>
    </Layout>
  );
}