// src/lib/graphql/client.ts
import { ApolloClient, InMemoryCache, createHttpLink, ApolloLink } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { setContext } from '@apollo/client/link/context';
import { getSession } from 'next-auth/react';

// Create an http link for GraphQL requests
const httpLink = createHttpLink({
  uri: '/api/graphql',
});

// Error handling link
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      );
    });
  }
  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
  }
});

// Authentication link
const authLink = setContext(async (_, { headers }) => {
  // Get the authentication token from NextAuth.js session
  const session = await getSession();
  
  // Return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      authorization: session ? `Bearer ${session.user.id}` : '',
    },
  };
});

// Create Apollo Client instance
export const client = new ApolloClient({
  link: ApolloLink.from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          projects: {
            // Use a custom merge function for paginated project lists
            keyArgs: ['search', 'organizationId'],
            merge(existing = { edges: [] }, incoming) {
              if (!incoming) return existing;
              
              return {
                ...incoming,
                edges: [...existing.edges, ...incoming.edges],
              };
            },
          },
          drawings: {
            // Use a custom merge function for paginated drawing lists
            keyArgs: ['projectId', 'search'],
            merge(existing = { edges: [] }, incoming) {
              if (!incoming) return existing;
              
              return {
                ...incoming,
                edges: [...existing.edges, ...incoming.edges],
              };
            },
          },
          components: {
            // Use a custom merge function for paginated component lists
            keyArgs: ['projectId', 'search', 'type'],
            merge(existing = { edges: [] }, incoming) {
              if (!incoming) return existing;
              
              return {
                ...incoming,
                edges: [...existing.edges, ...incoming.edges],
              };
            },
          },
          toolpaths: {
            // Use a custom merge function for paginated toolpath lists
            keyArgs: ['projectId', 'drawingId', 'search', 'type', 'operationType'],
            merge(existing = { edges: [] }, incoming) {
              if (!incoming) return existing;
              
              return {
                ...incoming,
                edges: [...existing.edges, ...incoming.edges],
              };
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});

// Export type definitions

