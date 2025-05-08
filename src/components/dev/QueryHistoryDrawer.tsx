// components/GraphQLPlayground/QueryHistoryDrawer.tsx
import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XIcon, TrashIcon } from 'lucide-react';

interface QueryHistoryItem {
  query: string;
  variables: string;
  timestamp: number;
}

interface QueryHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: QueryHistoryItem[];
  onSelectQuery: (item: QueryHistoryItem) => void;
  onClearHistory: () => void;
}

const QueryHistoryDrawer: React.FC<QueryHistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onSelectQuery,
  onClearHistory,
}) => {
  return (
    <Transition show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="fixed inset-0 z-50 overflow-hidden" onClose={onClose}>
        <div className="absolute inset-0 overflow-hidden">
          <Transition.Child
            as={React.Fragment}
            enter="ease-in-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in-out duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
            <Transition.Child
              as={React.Fragment}
              enter="transform transition ease-in-out duration-300"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transform transition ease-in-out duration-300"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <div className="relative w-96">
                <div className="h-full flex flex-col bg-white dark:bg-gray-900 shadow-xl overflow-y-auto">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <Dialog.Title className="text-lg font-medium text-gray-900 dark:text-white">
                      Query History
                    </Dialog.Title>
                    <div className="flex items-center">
                      <button
                        type="button"
                        className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 mr-2"
                        onClick={onClearHistory}
                      >
                        <TrashIcon className="h-5 w-5" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                        onClick={onClose}
                      >
                        <XIcon className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {history.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                        No query history yet
                      </div>
                    ) : (
                      history.map((item, index) => (
                        <div
                          key={index}
                          className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                          onClick={() => onSelectQuery(item)}
                        >
                          <div className="text-sm text-gray-900 dark:text-gray-100 font-medium truncate">
                            {item.query.trim().split('\n')[0].replace(/^(query|mutation)\s+/, '')}
                          </div>
                          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {new Date(item.timestamp).toLocaleString()}
                          </div>
                          <div className="mt-1 text-xs text-gray-600 dark:text-gray-400 max-h-20 overflow-hidden">
                            <pre className="whitespace-pre-wrap">{item.query.slice(0, 150)}{item.query.length > 150 ? '...' : ''}</pre>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default QueryHistoryDrawer;