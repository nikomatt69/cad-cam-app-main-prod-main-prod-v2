"use strict";
// src/config/electron.ts
// Configuration values for the Electron app
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    appName: 'CAD/CAM Fun',
    // Whether to launch with dev tools open
    openDevTools: process.env.NODE_ENV === 'development',
    // Default window size
    defaultWidth: 1280,
    defaultHeight: 800,
    // Minimum window size
    minWidth: 1024,
    minHeight: 768,
    // Server configuration
    developmentServerPort: 3000,
    // Auto updates
    autoUpdateEnabled: true,
    // App update URLs
    updateUrl: 'https://github.com/your-organization/cad-cam-fun/releases',
    // MCP server configuration
    mcpConfig: {
        autoStartServers: true,
    }
};
