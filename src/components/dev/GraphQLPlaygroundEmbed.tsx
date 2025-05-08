// components/GraphQLPlayground/index.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GraphiQL } from 'graphiql';
import { createGraphiQLFetcher } from '@graphiql/toolkit';
import type { Fetcher } from '@graphiql/toolkit';
import 'graphiql/graphiql.css';
import { ShareIcon, ChevronDownIcon, CodeIcon } from 'lucide-react';
import { useRouter } from 'next/router';
import { examples } from './examples';
import ThemeSelector from './ThemeSelector';
import QueryHistoryDrawer from './QueryHistoryDrawer';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import toast from 'react-hot-toast';
import { format } from 'prettier/standalone';

interface GraphQLPlaygroundProps {
  endpoint: string;
  defaultQuery?: string;
  defaultVariables?: string;
  defaultHeaders?: string;
  dark?: boolean;
}

const GraphQLPlayground: React.FC<GraphQLPlaygroundProps> = ({
  endpoint,
  defaultQuery = '',
  defaultVariables = '{}',
  defaultHeaders = '',
  dark = false,
}) => {
  const router = useRouter();
  const [fetcher, setFetcher] = useState<Fetcher | null>(null);
  const [query, setQuery] = useState(defaultQuery);
  const [variables, setVariables] = useState(defaultVariables);
  const [headers, setHeaders] = useState(defaultHeaders);
  const [theme, setTheme] = useState(dark ? 'dark' : 'light');
  const [headerError, setHeaderError] = useState<string | null>(null);
  const [queryHistory, setQueryHistory] = useLocalStorage<Array<{ query: string; variables: string; timestamp: number }>>(
    'graphql-playground-history',
    []
  );
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => {
    if (!router.isReady || !endpoint) {
      console.log('GraphQLPlaygroundEmbed useEffect: Router not ready or endpoint missing, skipping fetcher creation.');
      return;
    }

    console.log('GraphQLPlaygroundEmbed useEffect: Router ready, proceeding with fetcher creation.');

    let parsedHeaders: Record<string, string> = {};
    let fetcherInstance: Fetcher | null = null;
    try {
      if (headers.trim() === '') {
        parsedHeaders = {};
      } else {
        parsedHeaders = JSON.parse(headers);
      }
      setHeaderError(null);
    } catch (e) {
      console.error('Invalid headers JSON:', e);
      setHeaderError('Invalid JSON format for headers.');
    }

    try {
        fetcherInstance = createGraphiQLFetcher({
        url: endpoint,
        headers: parsedHeaders,
      });
      console.log('Fetcher created successfully:', fetcherInstance);
    } catch(fetcherError) {
        console.error('Error creating GraphiQL Fetcher:', fetcherError);
        fetcherInstance = null;
    }
    
    setFetcher(fetcherInstance);

    const { query: urlQuery, variables: urlVariables } = router.query;
    if (typeof urlQuery === 'string' && urlQuery) {
      try {
        setQuery(decodeURIComponent(urlQuery));
      } catch (e) {
        console.error('Error parsing URL query:', e);
      }
    }
    if (typeof urlVariables === 'string' && urlVariables) {
      try {
        setVariables(decodeURIComponent(urlVariables));
      } catch (e) {
        console.error('Error parsing URL variables:', e);
      }
    }
  }, [endpoint, headers, router.isReady, router.query]);

  console.log('Rendering GraphQLPlaygroundEmbed, fetcher is:', fetcher);

  const handleRunQuery = () => {
    const newHistoryItem = {
      query,
      variables,
      timestamp: Date.now(),
    };
    setQueryHistory([newHistoryItem, ...queryHistory.slice(0, 19)]);

    toast.success('Query saved to history');
  };

  const copyShareURL = () => {
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?query=${encodeURIComponent(query)}&variables=${encodeURIComponent(variables)}`;
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        toast.success('Share URL copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy share URL:', err);
        toast.error('Failed to copy URL.');
      });
  };

  const loadExample = (index: number) => {
    const example = examples[index];
    setQuery(example.query);
    setVariables(example.variables || '{}');
    toast.success(`Loaded example: ${example.name}`);
  };

  const prettifyQuery = useCallback(async () => {
    try {
      const formatted = await format(query, {
        parser: 'graphql',
        plugins: [],
      });
      setQuery(formatted);
    } catch (error) {
      console.error("Failed to format GraphQL query:", error);
      toast.error("Couldn't format query. Check syntax.");
    }
  }, [query]);

  const prettifyVariables = useCallback(async () => {
    try {
      const formatted = await format(variables || '{}', {
        parser: 'babel',
        plugins: [],
      });
      setVariables(formatted);
    } catch (error) {
      console.error("Failed to format variables:", error);
      toast.error("Couldn't format variables. Check JSON syntax.");
    }
  }, [variables]);

  return (
    <div className={`graphql-playground ${theme} border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg flex flex-col h-[700px]`}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mr-4">Playground</h3>
          <button
            onClick={handleRunQuery}
            title="Save Query to History (Execute with GraphiQL's Run button or Ctrl+Enter)"
            className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-sm"
          >
            Save History
          </button>
          <button
            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
            className="px-3 py-1 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
          >
            History
          </button>
          <Menu as="div" className="relative inline-block text-left">
            <div>
              <Menu.Button className="inline-flex justify-center w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-3 py-1 bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-800 focus:ring-indigo-500">
                Examples
                <ChevronDownIcon className="-mr-1 ml-2 h-5 w-5" aria-hidden="true" />
              </Menu.Button>
            </div>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute left-0 z-10 mt-2 w-56 origin-top-left rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none max-h-60 overflow-y-auto">
                <div className="py-1">
                  {examples.map((example, index) => (
                    <Menu.Item key={example.name}>
                      {({ active }) => (
                        <button
                          onClick={() => loadExample(index)}
                          className={`${
                            active ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                          } group flex w-full items-center rounded-md px-3 py-2 text-sm text-left`}
                        >
                          {example.name}
                        </button>
                      )}
                    </Menu.Item>
                  ))}
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
        <div className="flex items-center space-x-2">
          <ThemeSelector currentTheme={theme} onChangeTheme={setTheme} />
          <button
            onClick={copyShareURL}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="Share Query"
          >
            <ShareIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {fetcher ? (
          <GraphiQL
            fetcher={fetcher}
            query={query}
            onEditQuery={setQuery}
            variables={variables}
            onEditVariables={setVariables}
            headers={headers}
            onEditHeaders={setHeaders}
            defaultEditorToolsVisibility={true}
            introspectionQueryName="IntrospectionQuery"
            shouldPersistHeaders={true}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            Loading Playground...
            {/* <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div> */}
          </div>
        )}
      </div>

      {headerError && (
        <div className="px-4 py-1 bg-red-100 border-t border-red-200 text-red-700 text-sm flex-shrink-0">
          <strong>Header Error:</strong> {headerError}
        </div>
      )}

      <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex-shrink-0 flex items-center space-x-2">
         <button
            onClick={prettifyQuery}
            className="px-3 py-1 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
            title="Format Query (Requires Prettier)"
          >
           <CodeIcon className="w-4 h-4 mr-1 inline-block" /> Prettify Query
          </button>
          <button
            onClick={prettifyVariables}
            className="px-3 py-1 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
            title="Format Variables (Requires Prettier)"
          >
           <CodeIcon className="w-4 h-4 mr-1 inline-block" /> Prettify Variables
          </button>
      </div>

      <QueryHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={queryHistory}
        onSelectQuery={(item) => {
          setQuery(item.query);
          setVariables(item.variables);
          setIsHistoryOpen(false);
        }}
        onClearHistory={() => setQueryHistory([])}
      />
    </div>
  );
};

export default GraphQLPlayground;