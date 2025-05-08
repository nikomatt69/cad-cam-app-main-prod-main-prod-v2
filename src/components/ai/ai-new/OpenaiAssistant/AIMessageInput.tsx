// src/components/ai/AIMessageInput.tsx
import { Brain, Hammer, LightbulbIcon, Ruler } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, AlertCircle, Box, List, Zap, X, Image as ImageIcon, Loader, Type, Edit3, Trash, ExternalLink, Plus, Tool, BookOpen } from 'react-feather';
import toast from 'react-hot-toast';

// Define and export tool types for clarity
export type ToolName = 'generateCADElement' | 'chainOfThoughtAnalysis' | 'suggestOptimizations' | 'textToCAD' | 'updateCADElement' | 'removeCADElement' | 'exportCADProjectAsZip' | 'thinkAloudMode' | 'autoQuoteCADElements' | 'analyzeManufacturability' | 'generate2DTechnicalDrawings' | 'simulatePhysicalProperties';

// Structure to hold selected file data (text or image)
export interface SelectedFileData {
  name: string;
  type: 'text' | 'image';
  content: string; // Text content or Base64 data URL
  fileType: string; // Original MIME type
}

interface AIMessageInputProps {
  // Update signature to pass structured file data
  onSendMessage: (message: string, files?: SelectedFileData[], activeTool?: ToolName | null) => void; 
  isProcessing: boolean;
  placeholder?: string;
  maxFiles?: number;
  maxFileSizeMB?: number;
  // Combine accepted types
  acceptedTextTypes?: string[];
  acceptedImageTypes?: string[];
}

const DEFAULT_MAX_FILES = 5;
const DEFAULT_MAX_SIZE_MB = 5; // Increased default max size for images
const DEFAULT_ACCEPTED_TEXT_TYPES = ['.txt', '.md', '.json', '.js', '.ts', 'text/plain', 'text/markdown', 'application/json', 'text/javascript', 'application/typescript'];
const DEFAULT_ACCEPTED_IMAGE_TYPES = ['.png', '.jpg', '.jpeg', '.webp', '.gif', 'image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const TYPING_TIMEOUT_MS = 1500; // 1.5 seconds delay for showing typing indicator

// Define tool descriptions
const toolDescriptions: Record<ToolName, string> = {
  textToCAD: 'Force direct text-to-CAD conversion. Use for specific geometry creation from text.',
  generateCADElement: 'Generate a new CAD element based on your description.',
  updateCADElement: 'Modify existing CAD element(s) based on your instructions.',
  removeCADElement: 'Delete specified CAD element(s) from the design.',
  chainOfThoughtAnalysis: 'Show the AI step-by-step reasoning process for the query.',
  suggestOptimizations: 'Get suggestions to optimize the current CAD design or workflow.',
  exportCADProjectAsZip: 'Export the entire current CAD project as a ZIP file.',
  autoQuoteCADElements: 'Automatically generate a price quote for designed CAD elements.',
  analyzeManufacturability: 'Analyze the design for potential manufacturing issues or complexities.',
  generate2DTechnicalDrawings: 'Create 2D technical drawings (e.g., blueprints) from the 3D model.',
  simulatePhysicalProperties: 'Simulate physical properties (e.g., stress, heat) on the model.',
  thinkAloudMode: 'Toggle AI thinking process visibility.'
};

export const AIMessageInput: React.FC<AIMessageInputProps> = ({
  onSendMessage,
  isProcessing,
  placeholder = 'Send a message...',
  maxFiles = DEFAULT_MAX_FILES,
  maxFileSizeMB = DEFAULT_MAX_SIZE_MB,
  acceptedTextTypes = DEFAULT_ACCEPTED_TEXT_TYPES,
  acceptedImageTypes = DEFAULT_ACCEPTED_IMAGE_TYPES
}) => {
  const [inputMessage, setInputMessage] = useState('');
  // Store structured file data
  const [selectedFilesData, setSelectedFilesData] = useState<SelectedFileData[]>([]); 
  const [fileError, setFileError] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<ToolName | null>(null);
  const [isTyping, setIsTyping] = useState(false); // State for user typing
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Ref for timeout
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Combine accepted types explicitly avoiding Set spread for compatibility
  const combinedTypes = acceptedTextTypes.concat(acceptedImageTypes);
  const uniqueTypes = combinedTypes.filter((value, index, self) => self.indexOf(value) === index);
  const allAcceptedTypesString = uniqueTypes.join(',');

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(event.target.value);
    
    // Handle auto-resize
    event.target.style.height = 'auto';
    event.target.style.height = `${event.target.scrollHeight}px`;

    // Handle typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setIsTyping(true);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, TYPING_TIMEOUT_MS);
  };
  
  const handleSendClick = () => {
    if (activeTool || inputMessage.trim() || selectedFilesData.length > 0) {
      onSendMessage(inputMessage.trim(), selectedFilesData, activeTool);
      setInputMessage('');
      setSelectedFilesData([]);
      setActiveTool(null);
      // Reset typing state immediately on send
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      setIsTyping(false);
      
      const textarea = document.getElementById('ai-message-textarea');
      if (textarea) textarea.style.height = 'auto';
    }
  };
  
  const handleToolButtonClick = (toolName: ToolName) => {
    setActiveTool(currentTool => currentTool === toolName ? null : toolName);
  };
  
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendClick();
    }
  };
  
  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    if (!event.target.files) return;

    const newFiles = Array.from(event.target.files);
    let currentFileCount = selectedFilesData.length;
    let errors: string[] = [];
    let promises: Promise<SelectedFileData>[] = [];

    if (currentFileCount + newFiles.length > maxFiles) {
      errors.push(`Cannot select more than ${maxFiles} files.`);
    } else {
      newFiles.forEach(file => {
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
        const isText = acceptedTextTypes.includes(file.type) || acceptedTextTypes.includes(fileExtension);
        const isImage = acceptedImageTypes.includes(file.type) || acceptedImageTypes.includes(fileExtension);

        if (!isText && !isImage) {
          errors.push(`File type not allowed: ${file.name}`);
          return;
        }
        if (file.size > maxFileSizeMB * 1024 * 1024) {
          errors.push(`File too large: ${file.name} (max ${maxFileSizeMB}MB)`);
          return;
        }
        if (selectedFilesData.some(existing => existing.name === file.name)) {
          // Silently ignore duplicates already selected
          return; 
        }

        // Create promise to read file content
        promises.push(new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              name: file.name,
              type: isImage ? 'image' : 'text',
              content: reader.result as string, // Base64 for images, text for text
              fileType: file.type
            });
          };
          reader.onerror = (error) => reject(`Error reading ${file.name}: ${error}`);

          if (isImage) {
            reader.readAsDataURL(file); // Read image as Base64 data URL
          } else {
            reader.readAsText(file); // Read text as plain text
          }
        }));
      });
    }

    Promise.all(promises).then(results => {
      setSelectedFilesData(prev => [...prev, ...results]);
    }).catch(readError => {
      errors.push(readError);
    }).finally(() => {
      if (errors.length > 0) {
        const errorMsg = errors.join(' ');
        setFileError(errorMsg);
        toast.error(errorMsg, { duration: 4000 });
      }
    });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  const removeFile = (fileName: string) => {
    setSelectedFilesData(prevData => prevData.filter(file => file.name !== fileName));
  };
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);
  
  return (
    <div className="p-3 border-t bg-gradient-to-br from-gray-50 to-gray-200 rounded-b-3xl  dark:bg-gradient-to-br dark:from-gray-700 dark:to-gray-800 dark:border-gray-600">
      {/* User typing indicator */}
      
      {fileError && (
        <div className="mb-2 text-xs text-red-600 flex items-center">
          <AlertCircle size={14} className="mr-1" /> {fileError}
        </div>
      )}
      {selectedFilesData.length > 0 && (
        <div className="mb-2 text-xs flex flex-wrap gap-1">
          <span className="font-medium self-center">Files:</span>
          {selectedFilesData.map(fileData => (
            <span 
              key={fileData.name} 
              title={fileData.name}
              className="inline-flex max-w-[150px] items-center bg-gray-200 dark:bg-gray-600 rounded px-1.5 py-0.5"
            >
              {fileData.type === 'image' && <ImageIcon size={12} className="mr-1 flex-shrink-0" />} 
              <span className="truncate flex-shrink min-w-0">{fileData.name}</span>
              <button 
                onClick={() => removeFile(fileData.name)} 
                className="ml-1 text-gray-500 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 flex-shrink-0"
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      )}
      
      <div className="flex space-x-1 mb-2  flex-wrap">
        <div className="relative group">
          <button
            onClick={() => handleToolButtonClick('textToCAD')}
            disabled={isProcessing}
            className={`p-1.5 rounded border text-xs ${activeTool === 'textToCAD' 
              ? 'bg-purple-100 border-purple-400 text-purple-700' 
              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'}`}
          >
            <Type size={14} />
          </button>
          <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-700 text-white text-xs rounded py-1 px-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 max-w-xs text-center">
            {toolDescriptions.textToCAD}
          </span>
        </div>
        <div className="relative group">
          <button
            onClick={() => handleToolButtonClick('generateCADElement')}
            disabled={isProcessing}
            className={`p-1.5 rounded border text-xs ${activeTool === 'generateCADElement' 
              ? 'bg-blue-100 border-blue-400 text-blue-700' 
              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'}`}
          >
            <Plus size={14} />
          </button>
          <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-700 text-white text-xs rounded py-1 px-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 max-w-xs text-center">
            {toolDescriptions.generateCADElement}
          </span>
        </div>
        <div className="relative group">
          <button
            onClick={() => handleToolButtonClick('updateCADElement')}
            disabled={isProcessing}
            className={`p-1.5 rounded border text-xs ${activeTool === 'updateCADElement' 
              ? 'bg-yellow-100 border-yellow-400 text-yellow-700' 
              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'}`}
          >
            <Edit3 size={14} />
          </button>
          <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-700 text-white text-xs rounded py-1 px-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 max-w-xs text-center">
            {toolDescriptions.updateCADElement}
          </span>
        </div>
        <div className="relative group">
          <button
            onClick={() => handleToolButtonClick('removeCADElement')}
            disabled={isProcessing}
            className={`p-1.5 rounded border text-xs ${activeTool === 'removeCADElement' 
              ? 'bg-red-100 border-red-400 text-red-700' 
              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'}`}
          >
            <Trash size={14} />
          </button>
          <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-700 text-white text-xs rounded py-1 px-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 max-w-xs text-center">
            {toolDescriptions.removeCADElement}
          </span>
        </div>
        <div className="relative group">
          <button
            onClick={() => handleToolButtonClick('chainOfThoughtAnalysis')}
            disabled={isProcessing}
            className={`p-1.5 rounded border text-xs ${activeTool === 'chainOfThoughtAnalysis' 
              ? 'bg-pink-100 border-pink-400 text-pink-700' 
              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'}`}
          >
            <Brain size={14} />
          </button>
          <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-700 text-white text-xs rounded py-1 px-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 max-w-xs text-center">
            {toolDescriptions.chainOfThoughtAnalysis}
          </span>
        </div>
        <div className="relative group">
          <button
            onClick={() => handleToolButtonClick('suggestOptimizations')}
            disabled={isProcessing}
            className={`p-1.5 rounded border text-xs ${activeTool === 'suggestOptimizations' 
              ? 'bg-orange-100 border-orange-400 text-orange-700' 
              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'}`}
          >
            <List size={14} />
          </button>
          <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-700 text-white text-xs rounded py-1 px-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 max-w-xs text-center">
            {toolDescriptions.suggestOptimizations}
          </span>
        </div>
        <div className="relative group">
          <button
            onClick={() => handleToolButtonClick('exportCADProjectAsZip')}
            disabled={isProcessing}
            className={`p-1.5 rounded border text-xs ${activeTool === 'exportCADProjectAsZip' 
              ? 'bg-fuchsia-100 border-fuchsia-400 text-fuchsia-700' 
              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'}`}
          >
            <ExternalLink size={14} />
          </button>
          <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-700 text-white text-xs rounded py-1 px-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 max-w-xs text-center">
            {toolDescriptions.exportCADProjectAsZip}
          </span>
        </div>
        <div className="relative group">
          <button
            onClick={() => handleToolButtonClick('autoQuoteCADElements')}
            disabled={isProcessing}
            className={`p-1.5 rounded border text-xs ${activeTool === 'autoQuoteCADElements' 
              ? 'bg-green-100 border-green-400 text-green-700' 
              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'}`}
          >
            <Ruler size={14} />
          </button>
          <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-700 text-white text-xs rounded py-1 px-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 max-w-xs text-center">
            {toolDescriptions.autoQuoteCADElements}
          </span>
        </div>
        <div className="relative group">
          <button
            onClick={() => handleToolButtonClick('analyzeManufacturability')}
            disabled={isProcessing}
            className={`p-1.5 rounded border text-xs ${activeTool === 'analyzeManufacturability' 
              ? 'bg-emerald-100 border-emerald-400 text-emerald-700' 
              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'}`}
          >
            <Tool size={14} />
          </button>
          <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-700 text-white text-xs rounded py-1 px-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 max-w-xs text-center">
            {toolDescriptions.analyzeManufacturability}
          </span>
        </div>
        <div className="relative group">
          <button
            onClick={() => handleToolButtonClick('generate2DTechnicalDrawings')}
            disabled={isProcessing}
            className={`p-1.5 rounded border text-xs ${activeTool === 'generate2DTechnicalDrawings' 
              ? 'bg-cyan-100 border-cyan-400 text-cyan-700' 
              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'}`}
          >
            <BookOpen size={14} />
          </button>
          <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-700 text-white text-xs rounded py-1 px-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 max-w-xs text-center">
            {toolDescriptions.generate2DTechnicalDrawings}
          </span>
        </div>
        <div className="relative group">
          <button
            onClick={() => handleToolButtonClick('simulatePhysicalProperties')}
            disabled={isProcessing}
            className={`p-1.5 rounded border text-xs ${activeTool === 'simulatePhysicalProperties' 
              ? 'bg-amber-100 border-amber-400 text-amber-700' 
              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'}`}
          >
            <Hammer size={14} />
          </button>
          <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-700 text-white text-xs rounded py-1 px-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 max-w-xs text-center">
            {toolDescriptions.simulatePhysicalProperties}
          </span>
        </div>
      </div>
      
      <div className="flex rounded-b-3xl items-end space-x-2">
        <button
          onClick={handleAttachClick}
          className="p-2 text-gray-500 hover:text-blue-600 disabled:opacity-50 self-end mb-1"
          disabled={isProcessing || selectedFilesData.length >= maxFiles}
          title={`Attach files (${selectedFilesData.length}/${maxFiles})`}
        >
          <Paperclip size={18} />
          <input
            type="file"
            multiple
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept={allAcceptedTypesString}
            disabled={selectedFilesData.length >= maxFiles}
          />
        </button>
        <textarea
          id="ai-message-textarea"
          value={inputMessage}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={activeTool ? `Input for ${activeTool}...` : placeholder}
          className="flex-1 border border-gray-300 rounded-md p-2 text-sm resize-none overflow-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
          rows={2}
          style={{ maxHeight: '80px' }}
          disabled={isProcessing}
        />
        <button
          onClick={handleSendClick}
          className={`p-2 rounded-md text-white ${ 
            isProcessing || (!activeTool && !inputMessage.trim() && selectedFilesData.length === 0)
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700' 
          } transition-colors self-end mb-1`}
          disabled={isProcessing || (!activeTool && !inputMessage.trim() && selectedFilesData.length === 0)}
          title="Send message"
        >
          {isProcessing ? (
            <Loader size={18} className="animate-spin" />
          ) : (
            <Send size={18} />
          )}
        </button>
      </div>
    </div>
  );
};