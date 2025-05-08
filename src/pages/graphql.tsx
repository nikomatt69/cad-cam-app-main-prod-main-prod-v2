// pages/api-docs.tsx
import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../components/layout/Layout';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import GraphQLPlaygroundEmbed from '../components/dev/GraphQLPlaygroundEmbed';
import GraphQLPlayground from '../components/dev/GraphQLPlaygroundEmbed';

export default function ApiDocumentation() {
  const [activeTab, setActiveTab] = useState('overview');


   
  return (
    <Layout>
    <div className="min-h-screen rounded-xl dark:bg-gray-800 bg-gray-50">
      <Head>
        <title>CAD/CAM API Documentation</title>
        <meta name="description" content="GraphQL API Documentation for CAD/CAM platform" />
      </Head>

      <header className="rounded-xl  shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">CAD/CAM Platform API</h1>
          <p className="mt-2 text-gray-600">
            Complete GraphQL API documentation and interactive playground
          </p>
        </div>
      </header>

      <div className="flex flex-col mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full md:w-64 flex-shrink-0">
            <div className="bg-white shadow rounded-lg p-4 sticky top-8">
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`w-full text-left px-3 py-2 rounded-md ${
                    activeTab === 'overview' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('authentication')}
                  className={`w-full text-left px-3 py-2 rounded-md ${
                    activeTab === 'authentication' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Authentication
                </button>
                <button
                  onClick={() => setActiveTab('examples')}
                  className={`w-full text-left px-3 py-2 rounded-md ${
                    activeTab === 'examples' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Query Examples
                </button>
                <button
                  onClick={() => setActiveTab('schema')}
                  className={`w-full text-left px-3 py-2 rounded-md ${
                    activeTab === 'schema' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Schema Reference
                </button>
                <button
                  onClick={() => setActiveTab('playground')}
                  className={`w-full text-left px-3 py-2 rounded-md ${
                    activeTab === 'playground' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Interactive Playground
                </button>
                <button
                  onClick={() => setActiveTab('sdks')}
                  className={`w-full text-left px-3 py-2 rounded-md ${
                    activeTab === 'sdks' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  SDKs & Libraries
                </button>
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-col truncate text-xs shadow rounded-lg p-6">
            {activeTab === 'overview' && (
              <div>
                <h2 className="text-2xl font-bold  mb-4">API Overview</h2>
                <p className="mb-4">
                  Our CAD/CAM platform provides a comprehensive GraphQL API that allows you to:
                </p>
                <ul className="list-disc pl-6 mb-6 space-y-2">
                  <li>Manage organizations, projects, and user permissions</li>
                  <li>Create and modify drawings, components, and toolpaths</li>
                  <li>Work with materials, tools, and machine configurations</li>
                  <li>Access a library of reusable components and templates</li>
                  <li>Integrate with chat and notification systems</li>
                </ul>
                <p className="mb-4">
                  The API endpoint is available at:
                </p>
                <div className=" p-3 rounded-md mb-6">
                  <code>https://cadcamfun.xyz/api/graphql</code>
                </div>
                <p className="mb-4">
                  You can explore the API using the interactive playground and browse through the
                  complete documentation on this page.
                </p>
                <div className="mt-8">
                  <h3 className="text-xl font-semibold  mb-2">Getting Started</h3>
                  <ol className="list-decimal pl-6 space-y-2">
                    <li>
                      Create an account on our platform and generate your API credentials in the account settings
                    </li>
                    <li>
                      Check out the Authentication section to learn how to authenticate your requests
                    </li>
                    <li>
                      Browse the Query Examples to see common operations
                    </li>
                    <li>
                      Try out the API in the Interactive Playground
                    </li>
                  </ol>
                </div>
              </div>
            )}

            {activeTab === 'authentication' && (
              <div>
                <h2 className="text-2xl font-bold tex mb-4">Authentication</h2>
                <p className="mb-4">
                  Our API uses JWT (JSON Web Tokens) for authentication. You&apos;ll need to include
                  an authorization header with your requests.
                </p>
                <h3 className="text-xl font-semibold  mt-6 mb-2">Authentication Header</h3>
                <div className=" p-3 rounded-md mb-4">
                  <code>Authorization: Bearer YOUR_JWT_TOKEN</code>
                </div>
                <h3 className="text-xl font-semibold  mt-6 mb-2">Getting a Token</h3>
                <p className="mb-4">
                  To get an access token, you can use the following mutation:
                </p>
                <div className=" p-3 rounded-md mb-4 overflow-x-auto">
                  <pre>{`mutation Login($email: String!, $password: String!) {
  login(email: $email, password: $password) {
    token
    expiresAt
    user {
      id
      name
      email
    }
  }
}`}</pre>
                </div>
                <h3 className="text-xl font-semibold  mt-6 mb-2">Token Expiration</h3>
                <p className="mb-4">
                  Tokens are valid for 24 hours. After expiration, you&apos;ll need to get a new token.
                </p>
                <h3 className="text-xl font-semibold  mt-6 mb-2">API Keys</h3>
                <p className="mb-4">
                  For server-to-server integration, you can also use API keys. These are long-lived
                  credentials that can be generated in your account settings.
                </p>
                <div className="0 p-3 rounded-md mb-4">
                  <code>Authorization: ApiKey YOUR_API_KEY</code>
                </div>
              </div>
            )}

            {activeTab === 'examples' && (
              <div>
                <h2 className="text-2xl font-bold  mb-4">Query Examples</h2>
                <p className="mb-4">
                  Here are some common query examples to help you get started with our API.
                  You can copy these examples and use them in the interactive playground or
                  your own code.
                </p>
                
                <h3 className="text-xl font-semibold  mt-6 mb-2">Get Current User</h3>
                <div className=" p-3 rounded-md mb-4 overflow-x-auto">
                  <pre>{`query Me {
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
    projects {
      id
      name
    }
  }
}`}</pre>
                </div>
                
                <h3 className="text-xl font-semibold  mt-6 mb-2">List Projects</h3>
                <div className="   p-3 rounded-md mb-4 overflow-x-auto">
                  <pre>{`query Projects($organizationId: ID, $take: Int) {
  projects(organizationId: $organizationId, take: $take) {
    id
    name
    description
    isPublic
    createdAt
    owner {
      id
      name
    }
  }
}`}</pre>
                </div>
                
                <h3 className="text-xl font-semibold  mt-6 mb-2">Create a Project</h3>
                <div className="   p-3 rounded-md mb-4 overflow-x-auto">
                  <pre>{`mutation CreateProject($input: CreateProjectInput!) {
  createProject(input: $input) {
    id
    name
    description
    isPublic
    organizationId
  }
}

# Variables:
# {
#   "input": {
#     "name": "My New Project",
#     "description": "Project description",
#     "organizationId": "org-id-here",
#     "isPublic": false
#   }
# }`}</pre>
                </div>
                
                <div className="mt-6">
                  <Link href="/api/graphql-playground" className="text-indigo-600 hover:text-indigo-800">
                    View more examples in the interactive playground →
                  </Link>
                </div>
              </div>
            )}

            {activeTab === 'schema' && (
              <div>
                <h2 className="text-2xl font-bold  mb-4">Schema Reference</h2>
                <p className="mb-4">
                  Our GraphQL schema defines the complete set of possible data types, queries,
                  mutations, and subscriptions that you can use with our API.
                </p>
                
                <h3 className="text-xl font-semibold  mt-6 mb-2">Core Types</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      </tr>
                    </thead>
                    <tbody className=" divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">User</td>
                        <td className="px-6 py-4 text-sm text-gray-400">A user account in the platform</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Organization</td>
                        <td className="px-6 py-4 text-sm text-gray-400">An organization that can contain projects and users</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Project</td>
                        <td className="px-6 py-4 text-sm text-gray-400">A project containing drawings, components, and toolpaths</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Drawing</td>
                        <td className="px-6 py-4 text-sm text-gray-400">A CAD drawing with geometric data</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Component</td>
                        <td className="px-6 py-4 text-sm text-gray-400">A reusable component or part</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Material</td>
                        <td className="px-6 py-4 text-sm text-gray-400">A material with physical properties</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Tool</td>
                        <td className="px-6 py-4 text-sm text-gray-400">A manufacturing tool like an endmill or drill bit</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Toolpath</td>
                        <td className="px-6 py-4 text-sm text-gray-400">A manufacturing toolpath with g-code</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                <h3 className="text-xl font-semibold  mt-8 mb-2">Full Schema Documentation</h3>
                <p className="mb-4">
                  For the complete schema documentation, you can use the interactive playground&apos;s
                  schema explorer or view the schema definition file directly.
                </p>
                <div className="flex space-x-4 mt-4">
                  <Link 
                    href="/api/graphql-playground" 
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                  >
                    Interactive Schema Explorer
                  </Link>
                  <Link 
                    href="/lib/graphql/schema.graphql" 
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Raw Schema Definition
                  </Link>
                </div>
              </div>
            )}

            {activeTab === 'playground' && (
              <div>
                <h2 className="text-2xl font-bold  mb-4">Interactive Playground</h2>
                <p className="mb-4">
                  Our GraphQL Playground allows you to explore the API, build queries, and test them directly
                  in your browser.
                </p>
                <div className="mt-4 mb-6">
               
                <GraphQLPlayground endpoint="/api/graphql" />
                </div>
                <p className="text-gray-600">
                  The playground includes example queries to help you get started and provides
                  automatic schema documentation and autocompletion.
                </p>
                <h3 className="text-xl font-semibold  mt-8 mb-2">Playground Features</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Interactive query editor with syntax highlighting</li>
                  <li>Schema documentation browser</li>
                  <li>Autocompletion based on the schema</li>
                  <li>Query history</li>
                  <li>Example queries for common operations</li>
                  <li>Variables and headers support</li>
                </ul>
              </div>
            )}

            {activeTab === 'sdks' && (
              <div>
                <h2 className="text-2xl font-bold  mb-4">SDKs & Libraries</h2>
                <p className="mb-4">
                  We provide official client libraries and code generation tools to help you
                  integrate with our API.
                </p>
                
                <h3 className="text-xl font-semibold  mt-6 mb-2">Official Libraries</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h4 className="text-lg font-medium text-gray-900">TypeScript/JavaScript SDK</h4>
                   
                    <div className="mt-4">
                      <a href="https://github.com/CADCAMFUN/cadcamfun-plugins-sdk" className="text-indigo-600 hover:text-indigo-800">
                        View on GitHub →
                      </a>
                    </div>
                  </div>
                 
                </div>
                
                <h3 className="text-xl font-semibold  mt-6 mb-2">Code Generation</h3>
                <p className="mb-4">
                  We recommend using GraphQL code generators to create type-safe clients for our API.
                </p>
                <div className=" p-4 rounded-md mb-6">
                  <h4 className="text-md font-medium text-gray-900 mb-2">GraphQL Code Generator</h4>
                  <p className="text-gray-600 mb-2">
                    Generate TypeScript types and React hooks from our schema:
                  </p>
                  <div className="bg-gray-800 text-white p-3 rounded-md overflow-x-auto">
                    <pre className="text-sm">npm install -D @graphql-codegen/cli @graphql-codegen/typescript @graphql-codegen/typescript-operations @graphql-codegen/typescript-react-apollo</pre>
                  </div>
                  <p className="text-gray-600 mt-3 mb-2">
                    Configuration (codegen.ts):
                  </p>
                  <div className="bg-gray-800 text-white p-3 rounded-md overflow-x-auto">
                    <pre className="text-sm">{`import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'https://your-domain.com/api/graphql',
  documents: ['./src/**/*.tsx', './src/**/*.ts'],
  generates: {
    './src/generated/': {
      preset: 'client',
      plugins: [],
      presetConfig: {
        gqlTagName: 'gql',
      }
    },
    './src/generated/types.ts': {
      plugins: ['typescript', 'typescript-operations', 'typescript-react-apollo'],
      config: {
        withHooks: true,
      },
    },
  },
};

export default config;`}</pre>
                  </div>
                </div>
                
                
              </div>
            )}
          </div>
        </div>
      </div>

     
    </div>
    </Layout>
  );
}