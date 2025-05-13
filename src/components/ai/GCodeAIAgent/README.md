# GCode AI Agent

The GCode AI Agent is an intelligent assistant that helps with GCode programming, CNC operations, and toolpath optimization. It provides a chat interface along with specialized tools for analyzing, optimizing, and generating GCode.

## Features

### 1. Improved Tab Interface
- Chat: For general GCode questions
- Analyze: Examines GCode for issues and potential improvements
- Optimize: Enhances GCode for speed, quality, or balanced performance
- Generate: Creates new GCode from text descriptions

### 2. Command Slash Menu
- Access common commands with `/command`
- Includes help, mode switching, and clear history options
- Visual menu with descriptions and icons

### 3. Reference Menu
- Insert selected code or references to current file
- Access with `@` key in the input field
- Simplifies documenting and explaining code

### 4. Quick Edit
- Edit selected code sections directly
- Apply AI-powered modifications with natural language instructions
- Smart context-aware editing suggestions

### 5. Image Upload Support
- Attach images to messages
- View full-size images by clicking
- Remove attachments with one click

### 6. Intelligent Autocompletion
- Context-aware code suggestions
- Learns from your most used commands
- Different suggestion modes based on chat mode (normal, gather, agent)

## Usage

### Installation
The GCode AI Agent is integrated into the main application and doesn't require separate installation.

### Basic Usage
1. Expand the agent using the sidebar icon
2. Select the appropriate mode tab
3. Type your message or question
4. Use special commands with `/` for quick actions

### Commands
- `/help` - Show available commands
- `/normal` - Activate normal chat mode
- `/gather` - Activate Gather mode (AI will ask more questions)
- `/agent` - Activate Agent mode (AI can perform actions)
- `/optimize` - Optimize selected G-code
- `/analyze` - Analyze G-code for issues
- `/explain` - Explain what selected G-code does
- `/generate` - Generate G-code from description
- `/clear` - Clear chat history

### Special Keys
- `/` - Open command menu
- `@` - Open reference menu
- `Enter` - Send message
- `Shift+Enter` - New line

## Components

### Main Components
- `GCodeAIAgent`: The main container component
- `ChatMessage`: Displays user and AI messages
- `AnalysisPanel`: Shows analysis results
- `OptimizationPanel`: Shows optimization options and results
- `GenerationPanel`: Interface for generating new GCode

### UI Components
- `CommandMenu`: Slash command menu
- `ReferenceMenu`: Reference insertion menu
- `QuickEditDialog`: Dialog for editing selected code
- `GCodeAutocomplete`: Autocompletion suggestions for GCode
- `ModeTab`: Tab navigation component

## Development

### Hooks
The component uses the `useGCodeAI` hook, which provides:
- Chat message management
- Code generation
- Code optimization
- Code analysis
- Autocompletion suggestions

### State Management
The component manages several state categories:
- Core states: loading, mode, input, expansion
- UI interaction states: menus, dialog visibility
- Autocomplete state: suggestions, position
- Image attachment states

### Adding New Features
To add new features:
1. Update the appropriate component
2. Add necessary state management
3. Implement UI components
4. Add event handlers
5. Update the README

## License
This code is proprietary and part of the main application.