// src/graphql/resolvers.ts
import { PrismaClient } from '@prisma/client';
import { GraphQLScalarType, Kind } from 'graphql';

// Internal fetch function to make requests to our own API
async function fetchFromAPI(path: string, options: RequestInit = {}) {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://localhost:3000';
  const url = `${baseUrl}/api${path}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API request failed: ${error}`);
  }
  
  return response.json();
}

// Date scalar type
const dateScalar = new GraphQLScalarType({
  name: 'Date',
  description: 'Date custom scalar type',
  serialize(value) {
    return value instanceof Date ? value.toISOString() : null;
  },
  parseValue(value: unknown) {
    if (typeof value === 'string' || typeof value === 'number' || value instanceof Date) {
      try {
        const date = new Date(value);
        return isNaN(date.getTime()) ? null : date;
      } catch (e) {
        return null;
      }
    }
    return null;
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value);
    }
    return null;
  },
});

// JSON scalar type
const jsonScalar = new GraphQLScalarType({
  name: 'JSON',
  description: 'JSON custom scalar type',
  serialize(value) {
    return value;
  },
  parseValue(value) {
    return value;
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return JSON.parse(ast.value);
    }
    if (ast.kind === Kind.OBJECT) {
      throw new Error('Not implemented yet');
    }
    return null;
  },
});

// Setup Prisma client
const prisma = new PrismaClient();

export const resolvers = {
  // Custom scalars
  Date: dateScalar,
  JSON: jsonScalar,
  
  // Type resolvers
  User: {
    organizations: async (parent: any) => {
      return fetchFromAPI(`/user/organizations`);
    },
    projects: async (parent: any) => {
      return fetchFromAPI(`/user/projects`);
    },
    components: async (parent: any) => {
      return fetchFromAPI(`/user/components`);
    },
    toolpaths: async (parent: any) => {
      return fetchFromAPI(`/user/toolpaths`);
    },
  },
  
  Organization: {
    members: async (parent: { id: any; }) => {
      const response = await fetchFromAPI(`/organizations/${parent.id}/members`);
      return response.map((member: any) => ({
        id: member.user.id,
        name: member.user.name,
        email: member.user.email,
        image: member.user.image,
        role: member.role,
        joinedAt: member.joinedAt
      }));
    },
    projects: async (parent: { id: any; }) => {
      return fetchFromAPI(`/organizations/${parent.id}/projects`);
    },
  },
  
  Project: {
    owner: async (parent: { ownerId: any; }) => {
      if (!parent.ownerId) return null;
      return fetchFromAPI(`/user/${parent.ownerId}`);
    },
    organization: async (parent: { organizationId: any; }) => {
      if (!parent.organizationId) return null;
      return fetchFromAPI(`/organizations/${parent.organizationId}`);
    },
    drawings: async (parent: { id: any; }) => {
      return fetchFromAPI(`/projects/${parent.id}/drawings`);
    },
    components: async (parent: { id: any; }) => {
      return fetchFromAPI(`/projects/${parent.id}/components`);
    },
    toolpaths: async (parent: { _count: any; id: any; }) => {
      if (!parent._count) {
        const project = await fetchFromAPI(`/projects/${parent.id}`);
        return project._count || { drawings: 0, components: 0 };
      }
      return parent._count;
    },
    drawingCount: async (parent: { _count: { drawings: any; }; id: any; }) => {
      if (parent._count) {
        return parent._count.drawings;
      }
      const project = await fetchFromAPI(`/projects/${parent.id}`);
      return project._count ? project._count.drawings : 0;
    },
    componentCount: async (parent: { _count: { components: any; }; id: any; }) => {
      if (parent._count) {
        return parent._count.components;
      }
      const project = await fetchFromAPI(`/projects/${parent.id}`);
      return project._count ? project._count.components : 0;
    },
  },
  
  Drawing: {
    project: async (parent: { projectId: any; }) => {
      return fetchFromAPI(`/projects/${parent.projectId}`);
    },
    toolpaths: async (parent: { id: any; }) => {
      return fetchFromAPI(`/drawings/${parent.id}/toolpaths`);
    },
  },
  
  Component: {
    project: async (parent: { projectId: any; }) => {
      return fetchFromAPI(`/projects/${parent.projectId}`);
    },
    versions: async (parent: { id: any; }) => {
      return fetchFromAPI(`/components/${parent.id}/versions`);
    },
    comments: async (parent: { id: any; }) => {
      return fetchFromAPI(`/components/${parent.id}/comments`);
    },
  },
  
  ComponentVersion: {
    component: async (parent: { componentId: any; }) => {
      return fetchFromAPI(`/components/${parent.componentId}`);
    },
    user: async (parent: { userId: any; }) => {
      return fetchFromAPI(`/user/${parent.userId}`);
    },
  },
  
  ComponentComment: {
    component: async (parent: { componentId: any; }) => {
      return fetchFromAPI(`/components/${parent.componentId}`);
    },
    user: async (parent: { userId: any; }) => {
      return fetchFromAPI(`/user/${parent.userId}`);
    },
  },
  
  Toolpath: {
    drawing: async (parent: { drawingId: any; }) => {
      if (!parent.drawingId) return null;
      return fetchFromAPI(`/drawings/${parent.drawingId}`);
    },
    project: async (parent: { projectId: any; }) => {
      return fetchFromAPI(`/projects/${parent.projectId}`);
    },
    user: async (parent: { createdBy: any; }) => {
      return fetchFromAPI(`/user/${parent.createdBy}`);
    },
    material: async (parent: { materialId: any; }) => {
      if (!parent.materialId) return null;
      return fetchFromAPI(`/materials/${parent.materialId}`);
    },
    machineConfig: async (parent: { machineConfigId: any; }) => {
      if (!parent.machineConfigId) return null;
      return fetchFromAPI(`/machine-configs/${parent.machineConfigId}`);
    },
    tool: async (parent: { toolId: any; }) => {
      if (!parent.toolId) return null;
      return fetchFromAPI(`/tools/${parent.toolId}`);
    },
    versions: async (parent: { id: any; }) => {
      return fetchFromAPI(`/toolpaths/${parent.id}/versions`);
    },
    comments: async (parent: { id: any; }) => {
      return fetchFromAPI(`/toolpaths/${parent.id}/comments`);
    },
  },
  
  ToolpathVersion: {
    toolpath: async (parent: { toolpathId: any; }) => {
      return fetchFromAPI(`/toolpaths/${parent.toolpathId}`);
    },
    user: async (parent: { userId: any; }) => {
      return fetchFromAPI(`/user/${parent.userId}`);
    },
  },
  
  ToolpathComment: {
    toolpath: async (parent: { toolpathId: any; }) => {
      return fetchFromAPI(`/toolpaths/${parent.toolpathId}`);
    },
    user: async (parent: { userId: any; }) => {
      return fetchFromAPI(`/user/${parent.userId}`);
    },
  },
  
  Material: {
    owner: async (parent: { ownerId: any; }) => {
      if (!parent.ownerId) return null;
      return fetchFromAPI(`/user/${parent.ownerId}`);
    },
    organization: async (parent: { organizationId: any; }) => {
      if (!parent.organizationId) return null;
      return fetchFromAPI(`/organizations/${parent.organizationId}`);
    },
  },
  
  Tool: {
    owner: async (parent: { ownerId: any; }) => {
      if (!parent.ownerId) return null;
      return fetchFromAPI(`/user/${parent.ownerId}`);
    },
    organization: async (parent: { organizationId: any; }) => {
      if (!parent.organizationId) return null;
      return fetchFromAPI(`/organizations/${parent.organizationId}`);
    },
  },
  
  MachineConfig: {
    owner: async (parent: { ownerId: any; }) => {
      if (!parent.ownerId) return null;
      return fetchFromAPI(`/user/${parent.ownerId}`);
    },
    organization: async (parent: { organizationId: any; }) => {
      if (!parent.organizationId) return null;
      return fetchFromAPI(`/organizations/${parent.organizationId}`);
    },
  },
  
  // Query resolvers
  Query: {
    me: async (_: any, __: any, context: any) => {
      return fetchFromAPI(`/user/profile`);
    },
    user: async (_: any, { id }: any) => {
      return fetchFromAPI(`/user/${id}`);
    },
    userProjects: async () => {
      return fetchFromAPI(`/user/projects`);
    },
    userComponents: async () => {
      return fetchFromAPI(`/user/components`);
    },
    userToolpaths: async () => {
      return fetchFromAPI(`/user/toolpaths`);
    },
    userOrganizations: async () => {
      return fetchFromAPI(`/user/organizations`);
    },
    
    project: async (_: any, { id }: any) => {
      return fetchFromAPI(`/projects/${id}`);
    },
    projects: async (_: any, { first, after, search, organizationId }: any) => {
      let url = '/projects';
      const queryParams = [];
      
      if (first) queryParams.push(`limit=${first}`);
      if (after) queryParams.push(`cursor=${after}`);
      if (search) queryParams.push(`search=${encodeURIComponent(search)}`);
      if (organizationId) queryParams.push(`organizationId=${organizationId}`);
      
      if (queryParams.length > 0) {
        url += `?${queryParams.join('&')}`;
      }
      
      const data = await fetchFromAPI(url);
      
      // Transform to connection pattern
      return {
        edges: data.map((project: any) => ({
          node: project,
          cursor: project.id,
        })),
        pageInfo: {
          hasNextPage: data.length === first,
          hasPreviousPage: !!after,
          startCursor: data.length > 0 ? data[0].id : null,
          endCursor: data.length > 0 ? data[data.length - 1].id : null,
        },
        totalCount: data.length,
      };
    },
    
    organization: async (_: any, { id }: any) => {
      return fetchFromAPI(`/organizations/${id}`);
    },
    organizations: async () => {
      return fetchFromAPI(`/organizations`);
    },
    organizationMembers: async (_: any, { organizationId }: any) => {
      const response = await fetchFromAPI(`/organizations/${organizationId}/members`);
      return response.map((member: any) => ({
        id: member.user.id,
        name: member.user.name,
        email: member.user.email,
        image: member.user.image,
        role: member.role,
        joinedAt: member.joinedAt
      }));
    },
    organizationProjects: async (_: any, { organizationId }: any) => {
      return fetchFromAPI(`/organizations/${organizationId}/projects`);
    },
    
    drawing: async (_: any, { id }: any) => {
      return fetchFromAPI(`/drawings/${id}`);
    },
    drawings: async (_: any, { projectId, first, after, search }: any) => {
      let url = `/projects/${projectId}/drawings`;
      const queryParams = [];
      
      if (first) queryParams.push(`limit=${first}`);
      if (after) queryParams.push(`cursor=${after}`);
      if (search) queryParams.push(`search=${encodeURIComponent(search)}`);
      
      if (queryParams.length > 0) {
        url += `?${queryParams.join('&')}`;
      }
      
      const data = await fetchFromAPI(url);
      
      // Transform to connection pattern
      return {
        edges: data.map((drawing: any) => ({
          node: drawing,
          cursor: drawing.id,
        })),
        pageInfo: {
          hasNextPage: data.length === first,
          hasPreviousPage: !!after,
          startCursor: data.length > 0 ? data[0].id : null,
          endCursor: data.length > 0 ? data[data.length - 1].id : null,
        },
        totalCount: data.length,
      };
    },
    
    component: async (_: any, { id }: any) => {
      return fetchFromAPI(`/components/${id}`);
    },
    components: async (_: any, { projectId, first, after, search, type }: any) => {
      let url = `/projects/${projectId}/components`;
      const queryParams = [];
      
      if (first) queryParams.push(`limit=${first}`);
      if (after) queryParams.push(`cursor=${after}`);
      if (search) queryParams.push(`search=${encodeURIComponent(search)}`);
      if (type) queryParams.push(`type=${encodeURIComponent(type)}`);
      
      if (queryParams.length > 0) {
        url += `?${queryParams.join('&')}`;
      }
      
      const data = await fetchFromAPI(url);
      
      // Transform to connection pattern
      return {
        edges: data.map((component: any) => ({
          node: component,
          cursor: component.id,
        })),
        pageInfo: {
          hasNextPage: data.length === first,
          hasPreviousPage: !!after,
          startCursor: data.length > 0 ? data[0].id : null,
          endCursor: data.length > 0 ? data[data.length - 1].id : null,
        },
        totalCount: data.length,
      };
    },
    componentVersions: async (_: any, { componentId }: any) => {
      return fetchFromAPI(`/components/${componentId}/versions`);
    },
    componentComments: async (_: any, { componentId }: any) => {
      return fetchFromAPI(`/components/${componentId}/comments`);
    },
    
    toolpath: async (_: any, { id }: any) => {
      return fetchFromAPI(`/toolpaths/${id}`);
    },
    toolpaths: async (_: any, { projectId, drawingId, first, after, search, type, operationType }: any) => {
      let url = drawingId 
        ? `/drawings/${drawingId}/toolpaths` 
        : projectId 
          ? `/projects/${projectId}/toolpaths` 
          : `/toolpaths`;
          
      const queryParams = [];
      
      if (first) queryParams.push(`limit=${first}`);
      if (after) queryParams.push(`cursor=${after}`);
      if (search) queryParams.push(`search=${encodeURIComponent(search)}`);
      if (type) queryParams.push(`type=${encodeURIComponent(type)}`);
      if (operationType) queryParams.push(`operationType=${encodeURIComponent(operationType)}`);
      
      if (queryParams.length > 0) {
        url += `?${queryParams.join('&')}`;
      }
      
      const data = await fetchFromAPI(url);
      
      // Transform to connection pattern
      return {
        edges: data.map((toolpath: any) => ({
          node: toolpath,
          cursor: toolpath.id,
        })),
        pageInfo: {
          hasNextPage: data.length === first,
          hasPreviousPage: !!after,
          startCursor: data.length > 0 ? data[0].id : null,
          endCursor: data.length > 0 ? data[data.length - 1].id : null,
        },
        totalCount: data.length,
      };
    },
    toolpathVersions: async (_: any, { toolpathId }: any) => {
      return fetchFromAPI(`/toolpaths/${toolpathId}/versions`);
    },
    toolpathComments: async (_: any, { toolpathId }: any) => {
      return fetchFromAPI(`/toolpaths/${toolpathId}/comments`);
    },
    
    material: async (_: any, { id }: any) => {
      return fetchFromAPI(`/materials/${id}`);
    },
    materials: async (_: any, { search, first, after }: any) => {
      let url = `/materials`;
      const queryParams = [];
      
      if (first) queryParams.push(`limit=${first}`);
      if (after) queryParams.push(`cursor=${after}`);
      if (search) queryParams.push(`search=${encodeURIComponent(search)}`);
      
      if (queryParams.length > 0) {
        url += `?${queryParams.join('&')}`;
      }
      
      return fetchFromAPI(url);
    },
    
    tool: async (_: any, { id }: any) => {
      return fetchFromAPI(`/tools/${id}`);
    },
    tools: async (_: any, { search, type, material, first, after }: any) => {
      let url = `/tools`;
      const queryParams = [];
      
      if (first) queryParams.push(`limit=${first}`);
      if (after) queryParams.push(`cursor=${after}`);
      if (search) queryParams.push(`search=${encodeURIComponent(search)}`);
      if (type) queryParams.push(`type=${encodeURIComponent(type)}`);
      if (material) queryParams.push(`material=${encodeURIComponent(material)}`);
      
      if (queryParams.length > 0) {
        url += `?${queryParams.join('&')}`;
      }
      
      return fetchFromAPI(url);
    },
    
    machineConfig: async (_: any, { id }: any) => {
      return fetchFromAPI(`/machine-configs/${id}`);
    },
    machineConfigs: async (_: any, { search, type, first, after }: any) => {
      let url = `/machine-configs`;
      const queryParams = [];
      
      if (first) queryParams.push(`limit=${first}`);
      if (after) queryParams.push(`cursor=${after}`);
      if (search) queryParams.push(`search=${encodeURIComponent(search)}`);
      if (type) queryParams.push(`type=${encodeURIComponent(type)}`);
      
      if (queryParams.length > 0) {
        url += `?${queryParams.join('&')}`;
      }
      
      return fetchFromAPI(url);
    },
    
    currentSubscription: async () => {
      return fetchFromAPI(`/subscriptions`);
    },
  },
  
  // Mutation resolvers
  Mutation: {
    // Project mutations
    createProject: async (_: any, { input }: any) => {
      return fetchFromAPI(`/projects`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },
    updateProject: async (_: any, { id, input }: any) => {
      return fetchFromAPI(`/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      });
    },
    deleteProject: async (_: any, { id }: any) => {
      await fetchFromAPI(`/projects/${id}`, {
        method: 'DELETE',
      });
      return true;
    },
    
    // Drawing mutations
    createDrawing: async (_: any, { input }: any) => {
      return fetchFromAPI(`/projects/${input.projectId}/drawings`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },
    updateDrawing: async (_: any, { id, input }: any) => {
      return fetchFromAPI(`/drawings/${id}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      });
    },
    deleteDrawing: async (_: any, { id }: any) => {
      await fetchFromAPI(`/drawings/${id}`, {
        method: 'DELETE',
      });
      return true;
    },
    
    // Component mutations
    createComponent: async (_: any, { input }: any) => {
      return fetchFromAPI(`/projects/${input.projectId}/components`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },
    updateComponent: async (_: any, { id, input }: any) => {
      return fetchFromAPI(`/components/${id}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      });
    },
    deleteComponent: async (_: any, { id }: any) => {
      await fetchFromAPI(`/components/${id}`, {
        method: 'DELETE',
      });
      return true;
    },
    addComponentVersion: async (_: any, { componentId, data, changeMessage }: any) => {
      return fetchFromAPI(`/components/${componentId}/versions`, {
        method: 'POST',
        body: JSON.stringify({ data, changeMessage }),
      });
    },
    addComponentComment: async (_: any, { componentId, content }: any) => {
      return fetchFromAPI(`/components/${componentId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
    },
    updateComponentComment: async (_: any, { id, content }: any) => {
      const parts = id.split('-');
      if (parts.length !== 2) throw new Error('Invalid comment ID format');
      
      const componentId = parts[0];
      const commentId = parts[1];
      
      return fetchFromAPI(`/components/${componentId}/comments/${commentId}`, {
        method: 'PUT',
        body: JSON.stringify({ content }),
      });
    },
    deleteComponentComment: async (_: any, { id }: any) => {
      const parts = id.split('-');
      if (parts.length !== 2) throw new Error('Invalid comment ID format');
      
      const componentId = parts[0];
      const commentId = parts[1];
      
      await fetchFromAPI(`/components/${componentId}/comments/${commentId}`, {
        method: 'DELETE',
      });
      return true;
    },
    
    // Toolpath mutations
    createToolpath: async (_: any, { input }: any) => {
      if (input.drawingId) {
        return fetchFromAPI(`/drawings/${input.drawingId}/toolpaths`, {
          method: 'POST',
          body: JSON.stringify(input),
        });
      } else {
        return fetchFromAPI(`/toolpaths`, {
          method: 'POST',
          body: JSON.stringify(input),
        });
      }
    },
    updateToolpath: async (_: any, { id, input }: any) => {
      return fetchFromAPI(`/toolpaths/${id}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      });
    },
    deleteToolpath: async (_: any, { id }: any) => {
      await fetchFromAPI(`/toolpaths/${id}`, {
        method: 'DELETE',
      });
      return true;
    },
    addToolpathVersion: async (_: any, { toolpathId, data, gcode, changeMessage }: any) => {
      return fetchFromAPI(`/toolpaths/${toolpathId}/versions`, {
        method: 'POST',
        body: JSON.stringify({ data, gcode, changeMessage }),
      });
    },
    restoreToolpathVersion: async (_: any, { toolpathId, versionId }: any) => {
      return fetchFromAPI(`/toolpaths/${toolpathId}/versions/restore`, {
        method: 'POST',
        body: JSON.stringify({ id: toolpathId, versionId }),
      });
    },
    addToolpathComment: async (_: any, { toolpathId, content }: any) => {
      return fetchFromAPI(`/toolpaths/${toolpathId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
    },
    updateToolpathComment: async (_: any, { id, content }: any) => {
      const parts = id.split('-');
      if (parts.length !== 2) throw new Error('Invalid comment ID format');
      
      const toolpathId = parts[0];
      const commentId = parts[1];
      
      return fetchFromAPI(`/toolpaths/${toolpathId}/comments/${commentId}`, {
        method: 'PUT',
        body: JSON.stringify({ content }),
      });
    },
    deleteToolpathComment: async (_: any, { id }: any) => {
      const parts = id.split('-');
      if (parts.length !== 2) throw new Error('Invalid comment ID format');
      
      const toolpathId = parts[0];
      const commentId = parts[1];
      
      await fetchFromAPI(`/toolpaths/${toolpathId}/comments/${commentId}`, {
        method: 'DELETE',
      });
      return true;
    },
    
    // Organization mutations
    createOrganization: async (_: any, { name, description }: any) => {
      return fetchFromAPI(`/organizations`, {
        method: 'POST',
        body: JSON.stringify({ name, description }),
      });
    },
    updateOrganization: async (_: any, { id, name, description }: any) => {
      return fetchFromAPI(`/organizations/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name, description }),
      });
    },
    deleteOrganization: async (_: any, { id }: any) => {
      await fetchFromAPI(`/organizations/${id}`, {
        method: 'DELETE',
      });
      return true;
    },
    inviteToOrganization: async (_: any, { organizationId, email, role }: any) => {
      await fetchFromAPI(`/organizations/${organizationId}/invite`, {
        method: 'POST',
        body: JSON.stringify({ email, role }),
      });
      return true;
    },
    updateOrganizationMember: async (_: any, { organizationId, memberId, role }: any) => {
      await fetchFromAPI(`/organizations/${organizationId}/members`, {
        method: 'PUT',
        body: JSON.stringify({ memberId, role }),
      });
      return true;
    },
    removeOrganizationMember: async (_: any, { organizationId, memberId }: any) => {
      await fetchFromAPI(`/organizations/${organizationId}/members`, {
        method: 'DELETE',
        body: JSON.stringify({ memberId }),
      });
      return true;
    },
    
    // Material mutations
    createMaterial: async (_: any, { input }: any) => {
      return fetchFromAPI(`/materials`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },
    updateMaterial: async (_: any, { id, input }: any) => {
      return fetchFromAPI(`/materials/${id}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      });
    },
    deleteMaterial: async (_: any, { id }: any) => {
      await fetchFromAPI(`/materials/${id}`, {
        method: 'DELETE',
      });
      return true;
    },
    
    // Tool mutations
    createTool: async (_: any, { input }: any) => {
      return fetchFromAPI(`/tools`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },
    updateTool: async (_: any, { id, input }: any) => {
      return fetchFromAPI(`/tools/${id}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      });
    },
    deleteTool: async (_: any, { id }: any) => {
      await fetchFromAPI(`/tools/${id}`, {
        method: 'DELETE',
      });
      return true;
    },
    
    // MachineConfig mutations
    createMachineConfig: async (_: any, { input }: any) => {
      return fetchFromAPI(`/machine-configs`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },
    updateMachineConfig: async (_: any, { id, input }: any) => {
      return fetchFromAPI(`/machine-configs/${id}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      });
    },
    deleteMachineConfig: async (_: any, { id }: any) => {
      await fetchFromAPI(`/machine-configs/${id}`, {
        method: 'DELETE',
      });
      return true;
    },
    cloneMachineConfig: async (_: any, { id, name }: any) => {
      return fetchFromAPI(`/machine-configs/${id}/clone`, {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
    },
    
    // User/Profile mutations
    updateProfile: async (_: any, { name, email }: any) => {
      return fetchFromAPI(`/user/profile`, {
        method: 'PUT',
        body: JSON.stringify({ name, email }),
      });
    },
    updatePassword: async (_: any, { currentPassword, newPassword }: any) => {
      await fetchFromAPI(`/user/password`, {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      return true;
    },
    deleteAccount: async () => {
      await fetchFromAPI(`/user/delete-account`, {
        method: 'DELETE',
      });
      return true;
    },
    
    // Subscription mutations
    createCheckoutSession: async (_: any, { priceId, successUrl, cancelUrl }: any) => {
      const response = await fetchFromAPI(`/subscriptions`, {
        method: 'POST',
        body: JSON.stringify({ priceId, successUrl, cancelUrl }),
      });
      return response.url;
    },
    cancelSubscription: async () => {
      await fetchFromAPI(`/subscriptions`, {
        method: 'DELETE',
      });
      return true;
    },
  },
};