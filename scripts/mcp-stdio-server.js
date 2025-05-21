#!/usr/bin/env node

/**
 * Example MCP stdio server implementation.
 * 
 * This script demonstrates how to create a simple MCP-compatible stdio server
 * that can be used with the stdio process manager.
 * 
 * Usage:
 *   node mcp-stdio-server.js [--port 3001] [--debug]
 * 
 * This server accepts JSON commands on stdin and returns JSON responses on stdout.
 * It supports the following commands:
 * - getCapabilities: returns the server capabilities
 * - readResource: reads a resource
 * - callTool: calls a tool
 */

// Read command line arguments
const args = process.argv.slice(2);
const debug = args.includes('--debug');
const portIndex = args.indexOf('--port');
const port = portIndex >= 0 ? parseInt(args[portIndex + 1]) : 3001;

// Set up basic capabilities
const capabilities = {
  name: 'Example MCP Stdio Server',
  version: '1.0.0',
  instructions: 'This is an example MCP server that works over stdio.',
  resources: [
    {
      name: 'Status',
      description: 'Server status information',
      uriTemplate: 'resource://status'
    },
    {
      name: 'Users',
      description: 'List of users',
      uriTemplate: 'resource://users'
    }
  ],
  tools: [
    {
      name: 'echo',
      description: 'Echo the input back to the output',
      parameters: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: 'Text to echo'
          }
        },
        required: ['text']
      }
    },
    {
      name: 'execute_command',
      description: 'Execute a command',
      parameters: {
        type: 'object',
        properties: {
          command: {
            type: 'string',
            description: 'Command to execute'
          },
          args: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Command arguments'
          }
        },
        required: ['command']
      }
    }
  ]
};

// Example resource data
const resources = {
  'resource://status': {
    status: 'running',
    uptime: Math.floor(process.uptime()),
    pid: process.pid,
    startTime: new Date().toISOString(),
    memoryUsage: process.memoryUsage()
  },
  'resource://users': [
    { id: 1, name: 'User 1', email: 'user1@example.com' },
    { id: 2, name: 'User 2', email: 'user2@example.com' },
    { id: 3, name: 'User 3', email: 'user3@example.com' }
  ]
};

// Set up tools
const tools = {
  echo: (params) => {
    return {
      result: params.text,
      timestamp: new Date().toISOString()
    };
  },
  execute_command: (params) => {
    const command = params.command;
    const args = params.args || [];
    
    // SECURITY: In a real implementation, you would need to validate
    // the command and arguments to prevent arbitrary command execution
    
    // For this example, we'll just return a simulated success
    return {
      commandExecuted: command,
      args: args,
      exitCode: 0,
      output: `Executed command: ${command} ${args.join(' ')}`,
      timestamp: new Date().toISOString()
    };
  }
};

// Process incoming requests
process.stdin.setEncoding('utf8');
let dataBuffer = '';

process.stdin.on('data', (data) => {
  const dataStr = data.toString();
  if (debug) console.error(`[DEBUG] Received data: ${dataStr}`);
  dataBuffer += dataStr;
  
  // Process lines when we get a newline
  const lines = dataBuffer.split('\n');
  
  // Keep the last line if it doesn't end with a newline
  dataBuffer = lines.pop() || '';
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    try {
      if (debug) console.error(`[DEBUG] Processing line: ${line}`);
      const request = JSON.parse(line);
      processRequest(request);
    } catch (parseError) {
      if (debug) {
        console.error(`[ERROR] Failed to parse request: ${parseError.message}`);
        console.error(`[ERROR] Raw input: ${line}`);
      }
      // Send error response if we can extract an ID from the malformed input
      const idMatch = line.match(/"id"\s*:\s*"([^"]+)"/);
      if (idMatch && idMatch[1]) {
        sendResponse({
          requestId: idMatch[1],
          status: 'error',
          error: `Invalid JSON: ${parseError.message}`
        });
      }
    }
  }
});

// Handle end of input
process.stdin.on('end', () => {
  if (debug) console.error('[INFO] stdin stream ended');
  // Process any remaining data
  if (dataBuffer.trim()) {
    try {
      const request = JSON.parse(dataBuffer);
      processRequest(request);
    } catch (parseError) {
      if (debug) {
        console.error(`[ERROR] Failed to parse final request: ${parseError.message}`);
        console.error(`[ERROR] Raw input: ${dataBuffer}`);
      }
    }
  }
  process.exit(0);
});

// Process request based on type
function processRequest(request) {
  const { id, type, resource, tool, parameters } = request;
  
  if (!id) {
    throw new Error('Request ID is required');
  }
  
  if (!type) {
    throw new Error('Request type is required');
  }
  
  let result;
  
  switch (type) {
    case 'getCapabilities':
      result = capabilities;
      break;
      
    case 'readResource':
      if (!resource) {
        throw new Error('Resource URI is required');
      }
      
      if (!resources[resource]) {
        throw new Error(`Resource not found: ${resource}`);
      }
      
      result = resources[resource];
      break;
      
    case 'callTool':
      if (!tool) {
        throw new Error('Tool name is required');
      }
      
      if (!tools[tool]) {
        throw new Error(`Tool not found: ${tool}`);
      }
      
      result = tools[tool](parameters || {});
      break;
      
    default:
      throw new Error(`Unknown request type: ${type}`);
  }
  
  // Send response
  sendResponse({
    requestId: id,
    status: 'ok',
    result
  });
}

// Send response to stdout
function sendResponse(response) {
  if (debug) {
    console.error(`[DEBUG] Sending response: ${JSON.stringify(response)}`);
  }
  
  try {
    // Write the response to stdout as a single line
    const responseJson = JSON.stringify(response);
    process.stdout.write(responseJson + '\n');
    // Ensure the output is flushed
    process.stdout.flush && process.stdout.flush();
  } catch (error) {
    console.error(`[ERROR] Failed to send response: ${error.message}`);
  }
}

// Handle process signals
process.on('SIGINT', () => {
  if (debug) {
    console.error('[INFO] Received SIGINT - shutting down');
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  if (debug) {
    console.error('[INFO] Received SIGTERM - shutting down');
  }
  process.exit(0);
});

// Log startup
console.error(`[INFO] MCP stdio server started (PID: ${process.pid})`);
console.error(`[INFO] Server ID: ${process.env.MCP_SERVER_ID || 'not set'}`);
console.error(`[INFO] Debug mode: ${debug ? 'enabled' : 'disabled'}`);

// Update the status resource every 10 seconds
setInterval(() => {
  resources['resource://status'] = {
    status: 'running',
    uptime: Math.floor(process.uptime()),
    pid: process.pid,
    startTime: new Date().toISOString(),
    memoryUsage: process.memoryUsage()
  };
}, 10000);
