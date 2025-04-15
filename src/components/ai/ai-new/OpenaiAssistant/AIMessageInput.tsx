// src/components/ai/AIMessageInput.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, AlertCircle, Box, List, Zap, X, Image as ImageIcon, Loader, Type } from 'react-feather';
import toast from 'react-hot-toast';

// Define and export tool types for clarity
export type ToolName = 'generateCADElement' | 'chainOfThoughtAnalysis' | 'suggestOptimizations' | 'textToCAD';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Combine accepted types explicitly avoiding Set spread for compatibility
  const combinedTypes = acceptedTextTypes.concat(acceptedImageTypes);
  const uniqueTypes = combinedTypes.filter((value, index, self) => self.indexOf(value) === index);
  const allAcceptedTypesString = uniqueTypes.join(',');

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(event.target.value);
    event.target.style.height = 'auto';
    event.target.style.height = `${event.target.scrollHeight}px`;
  };
  
  const handleSendClick = () => {
    if (activeTool || inputMessage.trim() || selectedFilesData.length > 0) {
      onSendMessage(inputMessage.trim(), selectedFilesData, activeTool);
      setInputMessage('');
      setSelectedFilesData([]);
      setActiveTool(null);
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
  
  return (
    <div className="p-3 border-t rounded-b-xl bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
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
      
      <div className="flex space-x-1 mb-2">
        <button
          onClick={() => handleToolButtonClick('textToCAD')}
          title="Force Text-to-CAD"
          disabled={isProcessing}
          className={`p-1.5 rounded border text-xs ${activeTool === 'textToCAD' 
            ? 'bg-purple-100 border-purple-400 text-purple-700' 
            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-100'}`}
        >
          <Type size={14} />
        </button>
        <button
          onClick={() => handleToolButtonClick('generateCADElement')}
          title="Force Generate Element"
          disabled={isProcessing}
          className={`p-1.5 rounded border text-xs ${activeTool === 'generateCADElement' 
            ? 'bg-blue-100 border-blue-400 text-blue-700' 
            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-100'}`}
        >
          <Box size={14} />
        </button>
        <button
          onClick={() => handleToolButtonClick('chainOfThoughtAnalysis')}
          title="Force Chain-of-Thought Analysis"
          disabled={isProcessing}
          className={`p-1.5 rounded border text-xs ${activeTool === 'chainOfThoughtAnalysis' 
            ? 'bg-blue-100 border-blue-400 text-blue-700' 
            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-100'}`}
        >
          <List size={14} />
        </button>
        <button
          onClick={() => handleToolButtonClick('suggestOptimizations')}
          title="Force Suggest Optimizations"
          disabled={isProcessing}
          className={`p-1.5 rounded border text-xs ${activeTool === 'suggestOptimizations' 
            ? 'bg-blue-100 border-blue-400 text-blue-700' 
            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-100'}`}
        >
          <Zap size={14} />
        </button>
      </div>
      
      <div className="flex rounded-lg items-end space-x-2">
        <button
          onClick={handleAttachClick}
          className="p-2 text-gray-500 hover:text-blue-600 disabled:opacity-50 self-end mb-1"
          disabled={isProcessing}
          title="Attach files"
        >
          <Paperclip size={18} />
        </button>
        <input
          type="file"
          multiple
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept={allAcceptedTypesString}
        />
        <textarea
          id="ai-message-textarea"
          value={inputMessage}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 border border-gray-300 rounded-md p-2 text-sm resize-none overflow-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
          rows={1}
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