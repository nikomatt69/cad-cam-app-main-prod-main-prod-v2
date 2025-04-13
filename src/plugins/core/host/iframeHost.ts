// src/plugins/core/host/iframe-host.ts
import { PluginManifest, PluginPermission } from '../registry/pluginManifest';
import { PluginHostBase } from './pluginHost';
import { PluginState } from '../registry';
import { SandboxOptions, PluginSandbox } from './sandbox';
import { IPluginConnection } from './pluginBridge';
import path from 'path';

/**
 * Connection implementation for iFrames using PostMessage
 */
class IFrameConnection implements IPluginConnection {
  constructor(private iframe: HTMLIFrameElement, private targetOrigin: string) {}

  send(message: any, transferables?: Transferable[]): void {
    // Ensure that the iframe is fully loaded before sending messages
    if (this.iframe.contentWindow) {
      this.iframe.contentWindow.postMessage(message, this.targetOrigin, transferables || []);
    } else {
      console.warn('Cannot send message: iframe contentWindow is not available');
    }
  }

  onMessage(handler: (message: any) => void): void {
    const messageListener = (event: MessageEvent) => {
      // Validate the message origin
      if (event.origin !== this.targetOrigin && this.targetOrigin !== '*') {
        console.warn(`Ignored message from unauthorized origin: ${event.origin}`);
        return;
      }

      // Ensure the message is from our iframe
      if (event.source !== this.iframe.contentWindow) {
        return;
      }

      handler(event.data);
    };

    window.addEventListener('message', messageListener);
    
    // Store the listener for cleanup
    (this as any)._messageListener = messageListener;
  }

  close(): void {
    // Remove the message listener
    if ((this as any)._messageListener) {
      window.removeEventListener('message', (this as any)._messageListener);
      delete (this as any)._messageListener;
    }
    
    // Remove the iframe from the DOM
    if (this.iframe.parentNode) {
      this.iframe.parentNode.removeChild(this.iframe);
    }
  }
}

/**
 * Plugin host implementation using iFrames for isolation
 * This implementation is suitable for plugins with UI requirements
 */
export class IFramePluginHost extends PluginHostBase {
  private iframe: HTMLIFrameElement | null = null;
  private sandbox: PluginSandbox;
  private container: HTMLElement | null = null;
  private allowedOrigin: string;
  
  constructor(
    manifest: PluginManifest,
    sandboxOptions: SandboxOptions
  ) {
    super(manifest, sandboxOptions);
    this.sandbox = new PluginSandbox(manifest, sandboxOptions);
    
    // Determine the allowed origin for postMessage security
    this.allowedOrigin = this.determineAllowedOrigin();
  }

  /**
   * Load the plugin in an iFrame
   */
  public async load(): Promise<void> {
    if (this.state !== PluginState.INSTALLED) {
      throw new Error(`Cannot load plugin ${this.manifest.id} in state ${this.state}`);
    }

    try {
      // Create an iframe element
      this.iframe = document.createElement('iframe');
      
      // Set sandbox attributes for security
      this.iframe.setAttribute('sandbox', this.sandbox.getSandboxAttributes());
      
      // Set other attributes
      this.iframe.style.border = 'none';
      this.iframe.style.width = '100%';
      this.iframe.style.height = '100%';
      this.iframe.title = `Plugin: ${this.manifest.name}`;
      this.iframe.allow = this.getAllowAttribute();
      
      // Generate a unique name for the iframe for targeting
      const frameName = `plugin-${this.manifest.id}-${Date.now()}`;
      this.iframe.name = frameName;
      
      // Find or create the container for the iframe
      this.container = this.findOrCreateContainer();
      
      // Create the iframe content with the bootstrap code
      const iframeContent = this.createIFrameContent();
      
      // Load the iframe with the content
      this.iframe.srcdoc = iframeContent;
      
      // Append the iframe to the container
      this.container.appendChild(this.iframe);
      
      // Set up the connection for the bridge
      const connection = new IFrameConnection(this.iframe, this.allowedOrigin);
      this.bridge.setConnection(connection);
      
      // Wait for the iframe to load and initialize
      await new Promise<void>((resolve, reject) => {
        // Handle initialization message
        const messageHandler = (event: MessageEvent) => {
          if (!event.data || event.data.type !== 'plugin-init-result') return;
          
          window.removeEventListener('message', messageHandler);
          
          if (event.data.success) {
            resolve();
          } else {
            reject(new Error(event.data.error || 'Failed to initialize plugin'));
          }
        };
        
        window.addEventListener('message', messageHandler);
        
        // Handle load errors
        const errorHandler = () => {
          window.removeEventListener('message', messageHandler);
          this.iframe?.removeEventListener('error', errorHandler);
          reject(new Error('Failed to load plugin iframe'));
        };

        this.iframe?.addEventListener('error', errorHandler);

        // Set a timeout for initialization
        setTimeout(() => {
          window.removeEventListener('message', messageHandler);
          this.iframe?.removeEventListener('error', errorHandler);
          reject(new Error('Plugin initialization timed out'));
        }, 10000);
      });
      
      // Update state to loaded
      this.state = PluginState.LOADED;
      console.log(`Plugin ${this.manifest.id} loaded successfully in iframe`);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.handleError(err, 'load');
      this.cleanupIFrame();
      throw err;
    }
  }

  /**
   * Unload the plugin and remove the iframe
   */
  public async unload(): Promise<void> {
    if (this.state === PluginState.INSTALLED) {
      return;
    }

    try {
      // Deactivate first if active
      if (this.state === PluginState.ACTIVATED) {
        await this.deactivate();
      }

      // Clean up the bridge
      this.bridge.dispose();
      
      // Remove the iframe
      this.cleanupIFrame();

      this.state = PluginState.INSTALLED;
      console.log(`Plugin ${this.manifest.id} unloaded successfully`);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.handleError(err, 'unload');
      this.cleanupIFrame();
      throw err;
    }
  }
  
  /**
   * Show the plugin UI
   */
  public show(): void {
    if (this.iframe && this.container) {
      this.iframe.style.display = 'block';
      this.container.style.display = 'block';
    }
  }
  
  /**
   * Hide the plugin UI
   */
  public hide(): void {
    if (this.iframe && this.container) {
      this.iframe.style.display = 'none';
      this.container.style.display = 'none';
    }
  }

  /**
   * Clean up the iframe
   */
  private cleanupIFrame(): void {
    if (this.iframe) {
      if (this.iframe.parentNode) {
        this.iframe.parentNode.removeChild(this.iframe);
      }
      this.iframe = null;
    }
  }

  /**
   * Find or create the container for the plugin iframe
   */
  private findOrCreateContainer(): HTMLElement {
    // Try to find an existing container
    let container = document.getElementById(`plugin-container-${this.manifest.id}`);
    
    // Create one if it doesn't exist
    if (!container) {
      container = document.createElement('div');
      container.id = `plugin-container-${this.manifest.id}`;
      container.className = 'plugin-container';
      container.style.display = 'none'; // Initially hidden
      
      // Find the plugin container root element
      const pluginRoot = document.getElementById('plugin-container-root');
      if (!pluginRoot) {
        // Create the root container if it doesn't exist
        const root = document.createElement('div');
        root.id = 'plugin-container-root';
        root.style.position = 'absolute';
        root.style.zIndex = '1000';
        document.body.appendChild(root);
        root.appendChild(container);
      } else {
        pluginRoot.appendChild(container);
      }
    }
    
    // Set styles specific to this plugin's container
    container.style.overflow = 'hidden';
    container.style.height = '100%';
    container.style.width = '100%';
    
    return container;
  }

  /**
   * Determine the allowed origin for postMessage security
   */
  private determineAllowedOrigin(): string {
    // In a production environment, this would be restricted to the plugin's domain
    // For development, we use a more permissive setting
    if (process.env.NODE_ENV === 'development') {
      return '*'; // Allow any origin during development
    }
    
    // In production, use the plugin's origin
    const pluginUrl = new URL(this.getPluginUrl());
    return `${pluginUrl.protocol}//${pluginUrl.host}`;
  }
  
  /**
   * Get the URL to load the plugin code from via the serving API
   */
  private getPluginUrl(): string {
    // L'endpoint API per servire i file è /api/plugins/serve
    // Ha bisogno dell'ID del plugin e del percorso relativo del file (manifest.main)
    
    if (!this.manifest.main || typeof this.manifest.main !== 'string') {
       throw new Error(`Plugin ${this.manifest.id} manifest does not specify a valid 'main' entry point.`);
    }
    
    const relativeMainPath = path.normalize(this.manifest.main).replace(/^(\.\.(\/|\\|\$))+/, '');
     if (relativeMainPath.includes('..')) {
       throw new Error(`Invalid 'main' path in manifest for plugin ${this.manifest.id}: ${this.manifest.main}`);
    }

    const apiUrl = `/api/plugins/serve?id=${encodeURIComponent(this.manifest.id)}&file=${encodeURIComponent(relativeMainPath)}`;
    
    console.log(`[IFrameHost] Generated plugin code URL for ${this.manifest.id}: ${apiUrl}`);
    return apiUrl;
  }
  
  /**
   * Generate the 'allow' attribute for the iframe
   */
  private getAllowAttribute(): string {
    const permissions = [];
    
    // Add permissions based on the plugin's manifest using enum members
    if (this.manifest.permissions?.includes(PluginPermission.UI_FULLSCREEN)) {
      permissions.push('fullscreen');
    }
    
    if (this.manifest.permissions?.includes(PluginPermission.DEVICE_CAMERA)) {
      permissions.push('camera');
    }
    
    if (this.manifest.permissions?.includes(PluginPermission.DEVICE_MICROPHONE)) {
      permissions.push('microphone');
    }
    
    return permissions.join('; ');
  }

  /**
   * Create minimal iframe HTML content that loads the bootstrap script from an API endpoint.
   */
  private createIFrameContent(): string {
    // Get the plugin ID for the script URL
    const pluginId = encodeURIComponent(this.manifest.id);
    const cspPolicy = this.sandbox.getCSP(); // Still use CSP defined by sandbox

    // Simple HTML structure loading the external bootstrap script
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="${cspPolicy}">
  <title>Plugin Loader: ${this.manifest.name}</title>
  <style>
    body { margin: 0; padding: 0; font-family: sans-serif; overflow: hidden; }
    #plugin-root { width: 100%; height: 100%; overflow: auto; }
    .plugin-loading { display: flex; align-items: center; justify-content: center; height: 100vh; width: 100%; }
    .plugin-error-state { color: red; padding: 10px; text-align: center; }
  </style>
</head>
<body>
  <div id="plugin-root">
    <div class="plugin-loading">Loading plugin bootstrap...</div>
  </div>
  
  <script src="/api/plugins/bootstrap.js?id=${pluginId}" async defer></script>
</body>
</html>
    `;
  }
}