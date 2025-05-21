import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, 
  X, 
  Maximize2, 
  Minimize2, 
  ChevronDown, 
  ChevronUp, 
  Send,
  Zap,
  Code,
  Search,
  RefreshCw,
  CornerUpRight,
  Cpu,
  Settings,
  Trash2,
  Info,
  HelpCircle,
  Image,
  FileText,
  AtSign,
  Command,
  Sliders,
  Wind,
  Edit,
  ChevronLeft,
  ChevronRight
} from 'react-feather';
import useGCodeAI, { GCodeMessage, GCodeAnalysisResult, GCodeOptimizationResult, GCodeCompletion } from '@/src/hooks/useGCodeAI';
import ChatMessage from './ChatMessage';
import AnalysisPanel from './AnalysisPanel';
import OptimizationPanel from './OptimizationPanel';
import GenerationPanel from './GenerationPanel';
import { useGCodeEditor } from '@/src/contexts/GCodeEditorContext';

// Import our new components
import {
  CommandMenu,
  ReferenceMenu,
  QuickEditDialog,
  ModeTab,
  ModeTabProps,
  GCodeAutocomplete,
} from './components';

interface GCodeAIAgentProps {
  gcode: string;
  onUpdateGCode?: (newGCode: string) => void;
  onClose?: () => void;
  isExpanded?: boolean;
  defaultMode?: 'chat' | 'analyze' | 'optimize' | 'generate';
  fileName?: string;
  selectedCode?: string;
  onInsertSnippet?: (snippet: string) => void;
}

export type AIAgentMode = 'chat' | 'analyze' | 'optimize' | 'generate';

const GCodeAIAgent: React.FC<GCodeAIAgentProps> = ({
  gcode,
  onUpdateGCode,
  onClose,
  isExpanded = true,
  defaultMode = 'chat',
  fileName = 'untitled.gcode',
  selectedCode = '',
  onInsertSnippet
}) => {
  // Accesso al context
  const editorContext = useGCodeEditor();
  
  // Core states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeMode, setActiveMode] = useState<AIAgentMode>(defaultMode);
  const [inputValue, setInputValue] = useState<string>('');
  const [expanded, setExpanded] = useState<boolean>(isExpanded);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [imageAttachments, setImageAttachments] = useState<{file: File, preview: string}[]>([]);

  // UI interaction states
  const [showCommandMenu, setShowCommandMenu] = useState<boolean>(false);
  const [showReferenceMenu, setShowReferenceMenu] = useState<boolean>(false);
  const [showQuickEdit, setShowQuickEdit] = useState<boolean>(false);
  const [quickEditSelection, setQuickEditSelection] = useState<string>('');
  const [chatMode, setChatMode] = useState<'normal' | 'gather' | 'agent'>('normal');
  
  // Autocomplete state
  const [showAutocomplete, setShowAutocomplete] = useState<boolean>(false);
  const [autocompletePosition, setAutocompletePosition] = useState<{ top: number; left: number } | null>(null);
  const [completionSuggestions, setCompletionSuggestions] = useState<GCodeCompletion[]>([]);
  const [isLoadingCompletions, setIsLoadingCompletions] = useState<boolean>(false);
  const [recentCommands, setRecentCommands] = useState<string[]>([]);
  const [autocompleteDebounceTimeout, setAutocompleteDebounceTimeout] = useState<NodeJS.Timeout | null>(null);

  // Refs for DOM manipulation
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Use the GCode AI hook
  const {
    chatMessages,
    isGenerating,
    isOptimizing,
    isAnalyzing,
    isSendingMessage,
    addUserMessage,
    sendChatMessage,
    clearChatHistory,
    generateGCode,
    optimizeGCode,
    analyzeGCode,
    explainGCode,
    getGCodeCompletions,
    lastAnalysisResult,
    lastOptimizationResult
  } = useGCodeAI();

  // Useeffect per sincronizzare con il context
  useEffect(() => {
    // Se esiste il context dell'editor, aggiorna il selectedCode
    if (editorContext && editorContext.selectedText !== undefined) {
      setQuickEditSelection(editorContext.selectedText);
      
      // Se c'è una selezione e il context vuole mostrare quickEdit, mostra il dialog
      if (editorContext.showQuickEdit && editorContext.selectedText) {
        setShowQuickEdit(true);
      }
    }
  }, [editorContext?.selectedText, editorContext?.showQuickEdit]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Set loading state based on AI operations
  useEffect(() => {
    setIsLoading(isGenerating || isOptimizing || isAnalyzing || isSendingMessage || uploadingImage);
  }, [isGenerating, isOptimizing, isAnalyzing, isSendingMessage, uploadingImage]);

  // Auto-resize textarea for input
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [inputValue]);

  // Calculate autocomplete position
  useEffect(() => {
    const calculatePosition = () => {
      if (inputRef.current && activeMode === 'generate' && inputValue.trim().length >= 2) {
        // Get cursor position
        const cursorPosition = inputRef.current.selectionStart;
        
        // Get text until cursor
        const textUntilCursor = inputValue.substring(0, cursorPosition);
        
        // Check if we should trigger autocomplete
        const shouldShowAutocomplete = 
          // If text has G or M commands
          /[GM]\d+/.test(textUntilCursor) ||
          // Or if in the middle of a parameter
          /[XYZ]\-?\d*\.?\d*$/.test(textUntilCursor);
        
        if (shouldShowAutocomplete) {
          // Position depends on cursor location in textarea
          const textHeight = parseInt(getComputedStyle(inputRef.current).lineHeight);
          const lines = textUntilCursor.split('\n');
          const lineIndex = lines.length - 1;
          
          // Calculate position
          const rect = inputRef.current.getBoundingClientRect();
          const scrollTop = inputRef.current.scrollTop;
          
          setShowAutocomplete(true);
          setAutocompletePosition({
            top: -textHeight * (lineIndex + 2) - 10,
            left: 10
          });
          
          // Get autocompletions
          fetchAutocompletions(textUntilCursor);
        } else {
          setShowAutocomplete(false);
        }
      } else {
        setShowAutocomplete(false);
      }
    };
    
    // If we're in generate mode, calculate position
    if (activeMode === 'generate') {
      calculatePosition();
    } else {
      setShowAutocomplete(false);
    }
  }, [inputValue, activeMode]);

  // Fetch autocompletions with debounce
  const fetchAutocompletions = (context: string) => {
    // Clear previous timeout
    if (autocompleteDebounceTimeout) {
      clearTimeout(autocompleteDebounceTimeout);
    }
    
    // Set new timeout
    const timeout = setTimeout(async () => {
      if (context.trim().length < 2) return;
      
      setIsLoadingCompletions(true);
      try {
        const suggestions = await getGCodeCompletions(context, {
          limit: 5,
          cursorPosition: inputRef.current?.selectionStart || 0,
          recentCommands,
          mode: chatMode
        });
        
        setCompletionSuggestions(suggestions);
      } catch (error) {
        console.error('Error fetching completions:', error);
        setCompletionSuggestions([]);
      } finally {
        setIsLoadingCompletions(false);
      }
    }, 300); // Debounce time
    
    setAutocompleteDebounceTimeout(timeout);
  };

  // Handle autocomplete selection
  const handleSelectCompletion = (completion: string) => {
    if (inputRef.current) {
      const cursorPosition = inputRef.current.selectionStart || 0;
      
      // Find word to replace
      const textBeforeCursor = inputValue.substring(0, cursorPosition);
      const textAfterCursor = inputValue.substring(cursorPosition);
      
      // Search for last word/token before cursor
      const tokenMatch = textBeforeCursor.match(/([GM]\d+|[XYZ][-]?\d*\.?\d*)$/);
      
      if (tokenMatch) {
        const tokenStart = tokenMatch.index || 0;
        const newText = textBeforeCursor.substring(0, tokenStart) + completion + textAfterCursor;
        setInputValue(newText);
        
        // Add to recent commands if it's a G or M code command
        if (/^[GM]\d+/.test(completion)) {
          setRecentCommands(prev => {
            const newRecent = [completion, ...prev.filter(cmd => cmd !== completion)].slice(0, 10);
            return newRecent;
          });
        }
      } else {
        // Just insert at cursor
        setInputValue(textBeforeCursor + completion + textAfterCursor);
      }
      
      setShowAutocomplete(false);
    }
  };

  // Handle sending a message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if ((!inputValue.trim() && imageAttachments.length === 0) || isLoading) return;
    
    // Check for command
    if (inputValue.startsWith('/')) {
      const commandResult = handleCommand(inputValue);
      if (commandResult) {
        setInputValue('');
        return;
      }
    }

    // Process the message based on the active mode
    if (activeMode === 'chat') {
      // Prepare message with any image attachments
      let messageContent = inputValue;
      
      // Process and add the message with images by passing a single object argument
      await sendChatMessage({
        content: messageContent,
        attachments: imageAttachments.map(img => img.file)
      });
      
      // Clear input and attachments
      setInputValue('');
      setImageAttachments([]);
    } else if (activeMode === 'generate') {
      const generatedCode = await generateGCode(inputValue);
      if (generatedCode && onUpdateGCode) {
        onUpdateGCode(generatedCode);
      }
      setInputValue('');
    }
  };

  // Handle keyboard commands in input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // If autocomplete is showing, let it handle keyboard events
    if (showAutocomplete) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === 'Tab' || e.key === 'Escape') {
        // These keys are handled by the autocomplete component
        return;
      }
    }
    
    // Enter without shift sends message
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      e.preventDefault();
      handleSendMessage();
    }
    
    // Tab or / opens command menu
    if (e.key === 'Tab' && showCommandMenu) {
      e.preventDefault();
      // Focus first command
    }
    
    // / at beginning of line opens command menu
    if (e.key === '/' && inputValue === '') {
      setShowCommandMenu(true);
      setShowReferenceMenu(false);
    }
    
    // @ opens the reference menu
    if (e.key === '@') {
      setShowReferenceMenu(true);
      setShowCommandMenu(false);
    }
    
    // Escape closes menus
    if (e.key === 'Escape') {
      setShowCommandMenu(false);
      setShowReferenceMenu(false);
      setShowQuickEdit(false);
      setShowAutocomplete(false);
    }
  };

  // Handle input changes to update autocompletions
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    
    // Clear menus
    setShowCommandMenu(false);
    setShowReferenceMenu(false);
    
    // If it's a generate mode, we will trigger autocompletion in useEffect
    if (activeMode === 'generate' && e.target.value.trim().length >= 2) {
      // Autocomplete will be triggered in useEffect
    }
  };

  // Handle command execution (/help, /normal, /agent, etc.)
  const handleCommand = (command: string): boolean => {
    const cmd = command.trim().toLowerCase();
    
    if (cmd === '/help') {
      // Add system message with help info
      addUserMessage('/help');
      const helpMessage: GCodeMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `**Available Commands:**
- \`/normal\` - Activate normal chat mode
- \`/gather\` - Activate Gather mode (AI will ask more questions)
- \`/agent\` - Activate Agent mode (AI can perform actions)
- \`/optimize\` - Optimize selected G-code
- \`/analyze\` - Analyze G-code for issues
- \`/explain\` - Explain what selected G-code does
- \`/generate\` - Generate G-code from description
- \`/clear\` - Clear chat history`,
        timestamp: new Date()
      };
      
      // Add to messages (need to use the hook's internal method)
      addSystemMessage(helpMessage);
      return true;
    }
    
    if (cmd === '/normal') {
      setChatMode('normal');
      addSystemMessage({
        id: Date.now().toString(),
        role: 'system',
        content: 'Normal mode activated. How can I help you with your G-code?',
        timestamp: new Date()
      });
      return true;
    }
    
    if (cmd === '/gather') {
      setChatMode('gather');
      addSystemMessage({
        id: Date.now().toString(),
        role: 'system',
        content: 'Gather mode activated. I\'ll ask more questions to understand your needs better.',
        timestamp: new Date()
      });
      return true;
    }
    
    if (cmd === '/agent') {
      setChatMode('agent');
      addSystemMessage({
        id: Date.now().toString(),
        role: 'system',
        content: 'Agent mode activated. I can now perform actions on your G-code such as analyzing, optimizing, and explaining.',
        timestamp: new Date()
      });
      return true;
    }
    
    if (cmd === '/optimize') {
      if (editorContext?.selectedText || selectedCode || gcode) {
        setActiveMode('optimize');
        return true;
      }
    }
    
    if (cmd === '/analyze') {
      if (gcode) {
        setActiveMode('analyze');
        return true;
      }
    }
    
    if (cmd === '/generate') {
      setActiveMode('generate');
      return true;
    }

    if (cmd === '/explain') {
      if (editorContext?.selectedText || selectedCode || gcode) {
        handleExplainCode();
        return true;
      }
    }
    
    if (cmd === '/clear') {
      clearChatHistory();
      return true;
    }
    
    return false;
  };

  // Hack - this would normally be part of the hook, but we're adding it here for demo
  const addSystemMessage = (message: GCodeMessage) => {
    // In a real implementation, this would be in the useGCodeAI hook
    // For now, we'll just manually add it to the chatMessages state
    // @ts-ignore - we're directly manipulating the hook's internal state, which is not ideal
    chatMessages.push(message);
  };

  // Handle analyzing the current code
  const handleAnalyzeCode = async () => {
    // Usa prima il codice selezionato dal context, poi dalla prop, poi tutto il gcode
    const codeToAnalyze = editorContext?.selectedText || selectedCode || gcode;
    
    if (!codeToAnalyze.trim() || isLoading) return;
    setActiveMode('analyze');
    await analyzeGCode(codeToAnalyze);
  };

  // Handle optimizing the current code
  const handleOptimizeCode = async (type: 'speed' | 'quality' | 'balanced' = 'balanced') => {
    // Usa prima il codice selezionato dal context, poi dalla prop, poi tutto il gcode
    const codeToOptimize = editorContext?.selectedText || selectedCode || gcode;
    
    if (!codeToOptimize.trim() || isLoading) return;
    setActiveMode('optimize');
    const result = await optimizeGCode(codeToOptimize, { optimizationType: type });
    if (result && onUpdateGCode) {
      // Se stiamo ottimizzando una selezione, sostituisci solo quella parte
      if (editorContext?.selectedText && editorContext.replaceSelection) {
        editorContext.replaceSelection(result.code);
      } else {
        onUpdateGCode(result.code);
      }
    }
  };

  // Handle explaining code
  const handleExplainCode = async () => {
    // Usa prima il codice selezionato dal context, poi dalla prop, poi tutto il gcode
    const codeToExplain = editorContext?.selectedText || selectedCode || gcode;
    
    if (!codeToExplain.trim() || isLoading) return;
    
    await explainGCode(codeToExplain);
  };

  // Handle applying the generated code
  const handleApplyGenerated = (generatedCode: string) => {
    if (!generatedCode.trim()) return;
    
    // Se c'è il context e c'è una selezione, sostituisci solo la selezione
    if (editorContext?.selectedText && editorContext.replaceSelection) {
      editorContext.replaceSelection(generatedCode);
    } 
    // Altrimenti usa il callback standard
    else if (onUpdateGCode) {
      onUpdateGCode(generatedCode);
    }
  };

  // Handle file upload for images
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      const imageFiles = newFiles.filter(file => file.type.startsWith('image/'));
      
      // Create previews for images
      const newImageAttachments = imageFiles.map(file => {
        const preview = URL.createObjectURL(file);
        return { file, preview };
      });
      
      setImageAttachments(prev => [...prev, ...newImageAttachments]);
    }
  };

  // Handle removing an image attachment
  const handleRemoveAttachment = (index: number) => {
    setImageAttachments(prev => {
      const newAttachments = [...prev];
      // Release the object URL to avoid memory leaks
      URL.revokeObjectURL(newAttachments[index].preview);
      newAttachments.splice(index, 1);
      return newAttachments;
    });
  };

  // Handle selecting a command from the command menu
  const handleSelectCommand = (command: string) => {
    setInputValue(command);
    setShowCommandMenu(false);
    
    // Execute command immediately if it doesn't need parameters
    if (command === '/help' || command === '/normal' || command === '/gather' || command === '/agent' || command === '/clear') {
      setTimeout(() => handleCommand(command), 100);
    }
  };

  // Handle inserting a reference
  const handleInsertReference = (refType: 'selectedCode' | 'currentFile' | 'editSelection') => {
    if (refType === 'selectedCode') {
      // Prima cerca nel context, poi nella prop
      const code = editorContext?.selectedText || selectedCode;
      if (code) {
        setInputValue(prev => `${prev}\`\`\`gcode\n${code}\n\`\`\``);
      }
    } else if (refType === 'currentFile') {
      setInputValue(prev => `${prev} @file`);
    } else if (refType === 'editSelection') {
      // Prima cerca nel context, poi nella prop
      const code = editorContext?.selectedText || selectedCode;
      if (code) {
        setQuickEditSelection(code);
        setShowQuickEdit(true);
        
        // Se esiste il context, imposta anche lì lo stato di quickEdit
        if (editorContext?.setShowQuickEdit) {
          editorContext.setShowQuickEdit(true);
        }
      }
    }
    setShowReferenceMenu(false);
  };

  // Handle quick edit prompt submission
  const handleQuickEditSubmit = async (instruction: string, selection: string) => {
    if (!selection || !instruction) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/gcode-quick-edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instruction,
          code: selection,
          context: gcode
        })
      });
      
      if (!response.ok) {
        throw new Error('Error modifying code');
      }
      
      const data = await response.json();
      
      if (data.modifiedCode) {
        // Se c'è il context, usa replaceSelection
        if (editorContext?.replaceSelection) {
          editorContext.replaceSelection(data.modifiedCode);
        } 
        // Altrimenti sostituisci nel gcode principale
        else if (onUpdateGCode) {
          const newCode = gcode.replace(selection, data.modifiedCode);
          onUpdateGCode(newCode);
        }
        
        // Add a system message about the edit
        addSystemMessage({
          id: Date.now().toString(),
          role: 'system',
          content: `✓ Quick Edit Applied: \"${instruction}\"`,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Error with quick edit:', error);
      addSystemMessage({
        id: Date.now().toString(),
        role: 'system',
        content: `❌ Quick Edit Failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      });
    } finally {
      setIsLoading(false);
      setShowQuickEdit(false);
      
      // Aggiorna anche lo stato nel context
      if (editorContext?.setShowQuickEdit) {
        editorContext.setShowQuickEdit(false);
      }
    }
  };

  // Handle quick edit opening
  const handleOpenQuickEdit = () => {
    // Cerca prima il codice selezionato nel context, poi nella prop
    const code = editorContext?.selectedText || selectedCode;
    if (code) {
      setQuickEditSelection(code);
      setShowQuickEdit(true);
      
      // Aggiorna anche lo stato nel context
      if (editorContext?.setShowQuickEdit) {
        editorContext.setShowQuickEdit(true);
      }
    }
  };

  // Render different panels based on the active mode
  const renderActivePanel = () => {
    switch (activeMode) {
      case 'analyze':
        return (
          <AnalysisPanel 
            gcode={editorContext?.selectedText || selectedCode || gcode} 
            onAnalyze={handleAnalyzeCode} 
            analysisResult={lastAnalysisResult}
            isAnalyzing={isAnalyzing}
          />
        );
      case 'optimize':
        return (
          <OptimizationPanel 
            gcode={editorContext?.selectedText || selectedCode || gcode} 
            onOptimize={handleOptimizeCode} 
            optimizationResult={lastOptimizationResult}
            isOptimizing={isOptimizing}
            onApplyOptimized={(code) => {
              // Se c'è il context e c'è una selezione, sostituisci solo la selezione
              if (editorContext?.selectedText && editorContext.replaceSelection) {
                editorContext.replaceSelection(code);
              } else if (onUpdateGCode) {
                onUpdateGCode(code);
              }
            }}
          />
        );
      case 'generate':
        return (
          <GenerationPanel 
            onGenerate={(prompt) => {
              setInputValue(prompt);
              handleSendMessage();
            }}
            isGenerating={isGenerating}
            onApplyGenerated={handleApplyGenerated}
            lastGeneratedCode={chatMessages.length > 0 ? extractCodeFromMessage(chatMessages[chatMessages.length - 1]) : ''}
          />
        );
      case 'chat':
      default:
        return (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <MessageCircle size={40} className="mb-2" />
                <p className="text-center">Ask me about G-code programming, CNC operations, or toolpaths</p>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2 w-full max-w-md">
                  <SuggestionButton 
                    onClick={() => {
                      setInputValue('Explain the difference between G0 and G1 commands');
                      setTimeout(handleSendMessage, 100);
                    }}
                  >
                    Explain G0 vs G1
                  </SuggestionButton>
                  <SuggestionButton 
                    onClick={() => {
                      setInputValue('How do I program a circular arc in G-code?');
                      setTimeout(handleSendMessage, 100);
                    }}
                  >
                    Programming arcs
                  </SuggestionButton>
                  <SuggestionButton 
                    onClick={() => {
                      setInputValue('What are typical feeds and speeds for aluminum?');
                      setTimeout(handleSendMessage, 100);
                    }}
                  >
                    Feeds for aluminum
                  </SuggestionButton>
                  <SuggestionButton 
                    onClick={() => {
                      setInputValue('How can I optimize my toolpaths for better surface finish?');
                      setTimeout(handleSendMessage, 100);
                    }}
                  >
                    Improve surface finish
                  </SuggestionButton>
                </div>
              </div>
            ) : (
              <>
                {chatMessages.map((message, index) => (
                  <ChatMessage 
                    key={message.id} 
                    message={message} 
                    onApplyCode={handleApplyGenerated}
                    onCopyCode={(code) => navigator.clipboard.writeText(code)}
                  />
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        );
    }
  };

  // Extract code from message
  const extractCodeFromMessage = (message: GCodeMessage): string => {
    const codeMatch = message.content.match(/```(?:gcode)?\n([\s\S]*?)\n```/);
    return codeMatch ? codeMatch[1] : '';
  };

  return (
    <div 
      className={`flex flex-col h-full bg-gray-100 dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden transition-all duration-300 ease-in-out ${
        expanded ? 'w-96' : 'w-12 rounded-lg rounded-l-3xl '
      }`}
    >
      {expanded ? (
        <>
          {/* Header */}

          <div className="flex items-center justify-between p-3 border-b bg-gradient-to-b from-blue-400 to-blue-700 text-white rounded-t-3xl dark:from-gray-700 dark:to-gray-800 dark:border-gray-600">
              <div className="flex rounded-t-3xl h-12 items-center">
                <img src="/icon.png" className="mr-2 w-6 h-6" />
                <div>
                  <h3 className="font-medium">G-Code AI Assistant</h3> 
                </div>
            
          
               
            </div>
            <div className="flex space-x-1">
              <button 
                onClick={() => setExpanded(false)}
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                title="Collapse"
              >
                <ChevronRight size={18} />
              </button>
              {onClose && (
                <button 
                  onClick={onClose}
                  className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                  title="Close"
                >
                  <X size={18} />
                </button>
              )}
            </div>
            </div>
          
          {/* AI Action Toolbar */}
          
          
          {/* Mode Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <ModeTab 
              mode="chat" 
              activeMode={activeMode} 
              onClick={() => setActiveMode('chat')}
              icon={<MessageCircle size={16} />}
              label="Chat"
            />
            <ModeTab 
              mode="analyze" 
              activeMode={activeMode} 
              onClick={() => setActiveMode('analyze')}
              icon={<Search size={16} />}
              label="Analyze"
            />
            <ModeTab 
              mode="optimize" 
              activeMode={activeMode} 
              onClick={() => setActiveMode('optimize')}
              icon={<Zap size={16} />}
              label="Optimize"
            />
            <ModeTab 
              mode="generate" 
              activeMode={activeMode} 
              onClick={() => setActiveMode('generate')}
              icon={<Code size={16} />}
                label="Generate"
            />
          </div>
          
          {/* Content Area */}
          <div className="flex-1 overflow-hidden flex flex-col relative">
            {renderActivePanel()}
            
            {/* Quick Edit Dialog */}
            {showQuickEdit && (
              <QuickEditDialog
                selection={quickEditSelection}
                onSubmit={handleQuickEditSubmit}
                onClose={() => {
                  setShowQuickEdit(false);
                  // Aggiorna anche lo stato nel context
                  if (editorContext?.setShowQuickEdit) {
                    editorContext.setShowQuickEdit(false);
                  }
                }}
                isProcessing={isLoading}
              />
            )}
          </div>
          
          {/* Image Attachments Preview */}
          {imageAttachments.length > 0 && (
            <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap gap-2">
                {imageAttachments.map((img, idx) => (
                  <div 
                    key={idx} 
                    className="relative group w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden"
                  >
                    <img 
                      src={img.preview} 
                      alt={`Attachment ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => handleRemoveAttachment(idx)}
                      className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-bl opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Input Area */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 relative">
            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    activeMode === 'chat' 
                      ? "Ask about G-code programming..." 
                      : activeMode === 'generate'
                        ? "Describe what to generate..." 
                        : "Enter your message here..."
                  }
                  className="w-full p-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none min-h-[40px] max-h-[120px]"
                  disabled={isLoading}
                  rows={1}
                />
                
                {/* Command Menu */}
                {showCommandMenu && (
                  <CommandMenu
                    onSelectCommand={handleSelectCommand}
                    onClose={() => setShowCommandMenu(false)}
                  />
                )}
                
                {/* Reference Menu */}
                {showReferenceMenu && (
                  <ReferenceMenu
                    onSelectReference={handleInsertReference}
                    hasSelectedCode={!!(editorContext?.selectedText || selectedCode)}
                    onClose={() => setShowReferenceMenu(false)}
                  />
                )}
                
                {/* Autocomplete Menu */}
                {showAutocomplete && (
                  <GCodeAutocomplete
                    input={inputValue}
                    position={autocompletePosition}
                    suggestions={completionSuggestions}
                    isLoading={isLoadingCompletions}
                    onSelect={handleSelectCompletion}
                    onClose={() => setShowAutocomplete(false)}
                    contextMode={chatMode}
                  />
                )}
              </div>
              
              <div className="flex items-end space-x-2">
                {/* Image Upload Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-2 rounded-lg ${
                    isLoading
                      ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'
                  }`}
                  title="Attach image"
                  disabled={isLoading}
                >
                  <Image size={20} />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                  multiple
                  disabled={isLoading}
                />
                
                {/* Send Button */}
                <button
                  type="submit"
                  disabled={isLoading || (!inputValue.trim() && imageAttachments.length === 0)}
                  className={`p-2 rounded-lg ${
                    isLoading || (!inputValue.trim() && imageAttachments.length === 0)
                      ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                  title="Send message"
                >
                  {isLoading ? <RefreshCw size={20} className="animate-spin" /> : <Send size={20} />}
                </button>
              </div>
            </div>
            
            {/* Command Bar */}
            <div className="mt-2 flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <div className="flex space-x-2">
                <span>
                  <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Enter</kbd> send
                </span>
                <span>
                  <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Shift+Enter</kbd> new line
                </span>
                <span>
                  <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">/</kbd> commands
                </span>
                <span>
                  <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">@</kbd> references
                </span>
              </div>
              
              <div className="flex items-center">
                {chatMode !== 'normal' && (
                  <span className={`flex items-center ${
                    chatMode === 'gather' ? 'text-purple-500' : 'text-green-500'
                  }`}>
                    {chatMode === 'gather' ? <Search size={12} className="mr-1" /> : <Wind size={12} className="mr-1" />}
                    {chatMode} mode
                  </span>
                )}
              </div>
            </div>
            
            {/* Status Bar */}
            <div className="mt-2 flex justify-between text-xs text-gray-500 dark:text-gray-400 border-t pt-2 border-gray-200 dark:border-gray-700">
              <div>
                {activeMode === 'chat' && (
                  <button
                    onClick={clearChatHistory}
                    className="flex items-center hover:text-gray-700 dark:hover:text-gray-300"
                    title="Clear chat history"
                  >
                    <Trash2 size={12} className="mr-1" />
                    Clear history
                  </button>
                )}
              </div>
              
              <div>
                {isLoading && (
                  <span className="flex items-center">
                    <RefreshCw size={12} className="animate-spin mr-1" />
                    Processing...
                  </span>
                )}
              </div>
              
              {(editorContext?.selectedText || selectedCode) && (
                <button
                  onClick={handleOpenQuickEdit}
                  className="flex items-center text-blue-500 hover:text-blue-600 z-60"
                  title="Quick edit selected code"
                >
                  <Edit size={12} className="mr-1" />
                  Quick Edit
                </button>
              )}
            </div>
          </form>
        </>
      ) : (
        // Collapsed view
        <div className="h-full flex flex-col items-center py-4 space-y-4 z-60">
          <button 
            onClick={() => setExpanded(true)}
            className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800"
            title="Expand AI Assistant"
          >
            <ChevronLeft size={16} className="text-blue-600 dark:text-blue-300" />
          </button>
          <Cpu size={16} className="text-gray-500 dark:text-gray-400" />
          <MessageCircle size={16} className="text-gray-500 dark:text-gray-400" />
          <Search size={16} className="text-gray-500 dark:text-gray-400" />
          <Zap size={16} className="text-gray-500 dark:text-gray-400" />
          <Code size={16} className="text-gray-500 dark:text-gray-400" />
        </div>
      )}
    </div>
  );
};

interface SuggestionButtonProps {
  children: React.ReactNode;
  onClick: () => void;
}

const SuggestionButton: React.FC<SuggestionButtonProps> = ({ children, onClick }) => {
  return (
    <button
      className="p-2 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md text-left"
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default GCodeAIAgent;