// components/GraphQLPlayground/examples.ts
export const examples = [
    {
      name: "My Profile",
      query: `query Me {
    me {
      id
      name
      email
      organizations {
        id
        organization {
          id
          name
        }
        role
      }
    }
  }`,
      variables: ``
    },
    {
      name: "My Organizations",
      query: `query MyOrganizations {
    myOrganizations {
      id
      name
      description
      users {
        id
        user {
          id
          name
          email
        }
        role
      }
    }
  }`,
      variables: ``
    },
    {
      name: "Create Project",
      query: `mutation CreateProject($input: CreateProjectInput!) {
    createProject(input: $input) {
      id
      name
      description
      isPublic
      owner {
        id
        name
      }
      organization {
        id
        name
      }
    }
  }`,
      variables: `{
    "input": {
      "name": "My New Project",
      "description": "Project description",
      "organizationId": "org-id-here",
      "isPublic": false
    }
  }`
    },
    {
      name: "Project Details",
      query: `query ProjectDetails($id: ID!) {
    project(id: $id) {
      id
      name
      description
      isPublic
      owner {
        id
        name
      }
      drawings {
        id
        name
      }
      components {
        id
        name
        type
      }
    }
  }`,
      variables: `{
    "id": "project-id-here"
  }`
    },
    {
      name: "Create Component",
      query: `mutation CreateComponent($input: CreateComponentInput!) {
    createComponent(input: $input) {
      id
      name
      description
      type
      project {
        id
        name
      }
    }
  }`,
      variables: `{
    "input": {
      "name": "New Component",
      "description": "Component description",
      "type": "custom",
      "projectId": "project-id-here",
      "data": {},
      "isPublic": false
    }
  }`
    },
    {
      name: "Materials Library",
      query: `query Materials($take: Int) {
    materials(take: $take) {
      id
      name
      properties
      isPublic
    }
    publicMaterials(take: $take) {
      id
      name
      properties
    }
  }`,
      variables: `{
    "take": 10
  }`
    },
    {
      name: "Get Tools",
      query: `query Tools($organizationId: ID, $take: Int) {
    tools(organizationId: $organizationId, take: $take) {
      id
      name
      type
      diameter
      material
      isPublic
    }
  }`,
      variables: `{
    "organizationId": null,
    "take": 10
  }`
    }
  ];