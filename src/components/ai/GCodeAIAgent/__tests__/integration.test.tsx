// src/components/ai/GCodeAIAgent/__tests__/integration.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GCodeAIAgent from '../GCodeAIAgent';
import useGCodeAI from '@/src/hooks/useGCodeAI';

// Mock the hook
jest.mock('@/src/hooks/useGCodeAI', () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe('GCodeAIAgent Integration Tests', () => {
  const mockHook = {
    chatMessages: [],
    isGenerating: false,
    isOptimizing: false,
    isAnalyzing: false,
    isSendingMessage: false,
    addUserMessage: jest.fn(),
    sendChatMessage: jest.fn(),
    clearChatHistory: jest.fn(),
    generateGCode: jest.fn(),
    optimizeGCode: jest.fn(),
    analyzeGCode: jest.fn(),
    explainGCode: jest.fn(),
    lastAnalysisResult: null,
    lastOptimizationResult: null,
  };

  beforeEach(() => {
    (useGCodeAI as jest.Mock).mockReturnValue(mockHook);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should render in collapsed state when isExpanded=false', () => {
    render(<GCodeAIAgent gcode="" isExpanded={false} />);
    
    expect(screen.getByTitle('Expand AI Assistant')).toBeInTheDocument();
  });

  test('should render in expanded state by default', () => {
    render(<GCodeAIAgent gcode="" />);
    
    expect(screen.getByText('G-Code AI Assistant')).toBeInTheDocument();
    expect(screen.getByTitle('Collapse')).toBeInTheDocument();
  });

  test('should toggle between expanded and collapsed states', () => {
    render(<GCodeAIAgent gcode="" />);
    
    // Initially expanded
    expect(screen.getByText('G-Code AI Assistant')).toBeInTheDocument();
    
    // Collapse
    fireEvent.click(screen.getByTitle('Collapse'));
    expect(screen.getByTitle('Expand AI Assistant')).toBeInTheDocument();
    
    // Expand again
    fireEvent.click(screen.getByTitle('Expand AI Assistant'));
    expect(screen.getByText('G-Code AI Assistant')).toBeInTheDocument();
  });

  test('should switch between tabs', () => {
    render(<GCodeAIAgent gcode="G01 X10 Y10" />);
    
    // Initially in chat mode
    expect(screen.getByText('Ask me about G-code programming')).toBeInTheDocument();
    
    // Switch to Analyze
    fireEvent.click(screen.getByText('Analyze'));
    expect(screen.queryByText('Ask me about G-code programming')).not.toBeInTheDocument();
    
    // Switch to Optimize
    fireEvent.click(screen.getByText('Optimize'));
    
    // Switch to Generate
    fireEvent.click(screen.getByText('Generate'));
    
    // Back to Chat
    fireEvent.click(screen.getByText('Chat'));
    expect(screen.getByText('Ask me about G-code programming')).toBeInTheDocument();
  });

  test('should show command menu when typing /', () => {
    render(<GCodeAIAgent gcode="" />);
    
    const textarea = screen.getByPlaceholderText('Ask about G-code programming...');
    fireEvent.keyDown(textarea, { key: '/' });
    
    // Command menu should appear
    expect(screen.getByText('Search commands...')).toBeInTheDocument();
  });

  test('should send a message when pressing Enter', async () => {
    mockHook.sendChatMessage.mockResolvedValue('Response from AI');
    
    render(<GCodeAIAgent gcode="" />);
    
    const textarea = screen.getByPlaceholderText('Ask about G-code programming...');
    fireEvent.change(textarea, { target: { value: 'Test message' } });
    fireEvent.keyDown(textarea, { key: 'Enter' });
    
    await waitFor(() => {
      expect(mockHook.sendChatMessage).toHaveBeenCalledWith({
        content: 'Test message',
        attachments: []
      });
    });
  });

  test('should execute command when entering a valid command', async () => {
    render(<GCodeAIAgent gcode="" />);
    
    const textarea = screen.getByPlaceholderText('Ask about G-code programming...');
    fireEvent.change(textarea, { target: { value: '/help' } });
    fireEvent.keyDown(textarea, { key: 'Enter' });
    
    await waitFor(() => {
      expect(mockHook.addUserMessage).toHaveBeenCalledWith('/help');
    });
  });
});
