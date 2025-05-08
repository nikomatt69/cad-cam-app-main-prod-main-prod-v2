// src/components/examples/PrismaDBViewer.tsx
import { useState } from 'react';
import { useMCPResource } from '@/src/hooks/useMCPResource';
import { useMCPTool } from '@/src/hooks/useMCPTool';
import MCPServerSelector from '@/src/components/MCPServerSelector';

export default function PrismaDBViewer() {
  const [serverId, setServerId] = useState('');
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  
  // Get users resource
  const { data: users, isLoading: usersLoading, error: usersError } = 
    useMCPResource(serverId, selectedModel === 'users' ? 'resource://users' : null);
  
  // Get projects resource
  const { data: projects, isLoading: projectsLoading, error: projectsError } = 
    useMCPResource(serverId, selectedModel === 'projects' ? 'resource://projects' : null);
  
  // Get user by ID
  const { data: userDetail, isLoading: userDetailLoading, error: userDetailError } = 
    useMCPResource(serverId, (selectedModel === 'users' && selectedItemId) 
      ? `resource://users/${selectedItemId}` 
      : null);
  
  // Get project by ID
  const { data: projectDetail, isLoading: projectDetailLoading, error: projectDetailError } = 
    useMCPResource(serverId, (selectedModel === 'projects' && selectedItemId) 
      ? `resource://projects/${selectedItemId}` 
      : null);
  
  // Tool for creating a user
  const { 
    execute: createUser, 
    isLoading: createUserLoading,
    error: createUserError 
  } = useMCPTool(serverId, 'create_user');
  
  // Tool for creating a project
  const { 
    execute: createProject, 
    isLoading: createProjectLoading,
    error: createProjectError 
  } = useMCPTool(serverId, 'create_project');
  
  const handleSelectModel = (model: string) => {
    setSelectedModel(model);
    setSelectedItemId(null);
  };
  
  const handleSelectItem = (id: string) => {
    setSelectedItemId(id);
  };
  
  const isLoading = usersLoading || projectsLoading || userDetailLoading || projectDetailLoading;
  const error = usersError || projectsError || userDetailError || projectDetailError;
  
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-gray-700 mb-1">Select Prisma MCP Server</label>
        <MCPServerSelector value={serverId} onChange={setServerId} />
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      {serverId && (
        <div>
          <div className="flex space-x-4 mb-4">
            <button
              onClick={() => handleSelectModel('users')}
              className={`px-4 py-2 rounded ${
                selectedModel === 'users' ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
            >
              Users
            </button>
            <button
              onClick={() => handleSelectModel('projects')}
              className={`px-4 py-2 rounded ${
                selectedModel === 'projects' ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
            >
              Projects
            </button>
          </div>
          
          {selectedModel && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded p-4">
                <h3 className="text-lg font-semibold mb-2">
                  {selectedModel === 'users' ? 'Users' : 'Projects'} List
                </h3>
                
                {isLoading ? (
                  <div>Loading...</div>
                ) : selectedModel === 'users' && users ? (
                  <ul className="divide-y">
                    {users.map((user: any) => (
                      <li 
                        key={user.id} 
                        className={`py-2 cursor-pointer ${selectedItemId === user.id ? 'font-bold' : ''}`}
                        onClick={() => handleSelectItem(user.id)}
                      >
                        {user.name || user.email || 'Unnamed User'}
                      </li>
                    ))}
                  </ul>
                ) : selectedModel === 'projects' && projects ? (
                  <ul className="divide-y">
                    {projects.map((project: any) => (
                      <li 
                        key={project.id} 
                        className={`py-2 cursor-pointer ${selectedItemId === project.id ? 'font-bold' : ''}`}
                        onClick={() => handleSelectItem(project.id)}
                      >
                        {project.name || 'Unnamed Project'}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div>No data available</div>
                )}
              </div>
              
              <div className="border rounded p-4">
                <h3 className="text-lg font-semibold mb-2">
                  {selectedModel === 'users' ? 'User' : 'Project'} Details
                </h3>
                
                {isLoading ? (
                  <div>Loading...</div>
                ) : selectedItemId && (
                  <div>
                    {selectedModel === 'users' && userDetail ? (
                      <>
                        <div className="mb-2">
                          <span className="font-semibold">ID:</span> {userDetail.id}
                        </div>
                        <div className="mb-2">
                          <span className="font-semibold">Name:</span> {userDetail.name || 'N/A'}
                        </div>
                        <div className="mb-2">
                          <span className="font-semibold">Email:</span> {userDetail.email || 'N/A'}
                        </div>
                        <div className="mb-2">
                          <span className="font-semibold">Created:</span>{' '}
                          {new Date(userDetail.createdAt).toLocaleString()}
                        </div>
                      </>
                    ) : selectedModel === 'projects' && projectDetail ? (
                      <>
                        <div className="mb-2">
                          <span className="font-semibold">ID:</span> {projectDetail.id}
                        </div>
                        <div className="mb-2">
                          <span className="font-semibold">Name:</span> {projectDetail.name || 'N/A'}
                        </div>
                        <div className="mb-2">
                          <span className="font-semibold">Description:</span>{' '}
                          {projectDetail.description || 'N/A'}
                        </div>
                        <div className="mb-2">
                          <span className="font-semibold">Owner ID:</span> {projectDetail.ownerId}
                        </div>
                        <div className="mb-2">
                          <span className="font-semibold">Created:</span>{' '}
                          {new Date(projectDetail.createdAt).toLocaleString()}
                        </div>
                      </>
                    ) : (
                      <div>No details available</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}