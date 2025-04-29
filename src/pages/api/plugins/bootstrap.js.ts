import type { NextApiRequest, NextApiResponse } from 'next';
// import { getRegistryInstance } from '@/src/server/pluginRegistryInstance'; // REMOVED
import { PluginManifest } from '@/src/plugins/core/registry/pluginManifest';
import { PluginRegistry } from '@/src/plugins/core/registry'; // Import type
import { withRegistry, ApiHandlerWithRegistry } from '@/src/server/middleware/withRegistry'; // Import HOF

// ========================================================================
// !! CRITICAL: IMPLEMENT THIS FUNCTION !!
// ========================================================================
// This function MUST fetch the manifest data for the given plugin ID
// from your persistent storage (e.g., database using Prisma, file system, etc.)
async function getPluginManifestById(id: string, registry: PluginRegistry): Promise<PluginManifest | null> {
  console.log(`[API/Bootstrap] Attempting to get manifest for plugin ID: ${id}`);
  const storage = registry.getStorage(); // Get the storage instance from the registry

  if (!storage) {
      console.error('[API/Bootstrap] Plugin storage is not available via registry.');
      return null; 
  }

  try {
      // Get all plugins and find the one matching the ID
      const allPlugins = await storage.getPlugins();
      const pluginEntry = allPlugins.find(p => p.id === id);

      if (pluginEntry) {
        console.log(`[API/Bootstrap] Found plugin entry for ID: ${id}`);
        return pluginEntry.manifest;
      } else {
        console.log(`[API/Bootstrap] No plugin found with ID: ${id}`);
        return null;
      }
  } catch (error) {
      console.error(`[API/Bootstrap] Error fetching manifest for plugin ${id}:`, error);
      // Let the main handler decide how to respond on error
      return null; 
  }
}
// ========================================================================

// Define the main handler using the specific type
const bootstrapHandler: ApiHandlerWithRegistry = async (req, res, registry) => {
  const { id } = req.query;

  if (typeof id !== 'string') {
     // Send specific error, 500 will be handled by wrapper if needed
    return res.status(400).send('/* Missing or invalid plugin ID */');
  }

  // Use the helper function with the injected registry
  const manifest = await getPluginManifestById(id, registry);
  
  if (!manifest) {
    console.error(`[API/Bootstrap] Manifest not found for ID: ${id}`);
    return res.status(404).send(`/* Plugin manifest not found for ID: ${id} */`);
  }

  if (!manifest.main || typeof manifest.main !== 'string') {
     console.error(`[API/Bootstrap] Plugin ${id} manifest is missing a valid 'main' entry point.`);
     // Treat as server error, let wrapper handle 500 potentially
     return res.status(500).send(`/* Plugin ${id} has no valid main entry point in manifest. */`);
  }

  // --- The rest of the script generation logic remains the same --- 
  const manifestJson = JSON.stringify(manifest);
  const pluginCodeUrl = `/api/plugins/serve?id=${encodeURIComponent(id)}&file=${encodeURIComponent(manifest.main)}`;

  // Build the bootstrap script using simple string concatenation
  let script = '';
  script += '// --- Plugin Bootstrap Script (Served from API for ' + id + ') ---\n';
  script += '(async function() {\n';
  script += '  console.log(\'[Plugin Bootstrap (\' + id + \')] Starting...\');\n';
  script += '  const pluginManifest = ' + manifestJson + ';\n'; // Embed manifest
  script += '  const pluginRoot = document.getElementById(\'plugin-root\');\n';
  script += '  const pendingPromises = new Map();\n';
  script += '  let pluginExports = null;\n';
  script += '  let pluginApi = null;\n\n';

  // reportError function
  script += '  const reportError = (stage, error) => {\n';
  script += '    const errorMsg = error?.message || String(error);\n';
  script += '    console.error(\"`[Plugin Bootstrap (\' + id + \')] Error during ${stage}:`\", errorMsg, error?.stack);\n'; // Use backticks carefully
  script += '    pluginRoot.innerHTML = \`<div class=\"plugin-error-state\">Failed (${stage})</div>\`; \n';
  script += '    window.parent.postMessage({ type: \'plugin-init-result\', success: false, pluginId: pluginManifest.id, error: \`${stage}: ${errorMsg}\` }, \'*\');\n'; // Use backticks carefully
  script += '  };\n\n';

  // Helper Functions (Concatenated)
  script += '  function generateMessageId() { return \'msg_\' + Date.now() + \'_\' + Math.random().toString(36).substr(2, 9); }\n';
  script += '  function callHostMethod(method, params, transferables) { return new Promise((resolve, reject) => { const msgId = generateMessageId(); pendingPromises.set(msgId, { resolve, reject }); window.parent.postMessage({ id: msgId, pluginId: pluginManifest.id, type: \'request\', method, params }, \'*\', transferables || []); }); }\n';
  script += '  function onHostEvent(eventName, handler) { pluginExports = pluginExports || {}; pluginExports._eventHandlers = pluginExports._eventHandlers || {}; const [ns, name] = eventName.split(\'.\'); pluginExports._eventHandlers[ns] = pluginExports._eventHandlers[ns] || {}; pluginExports._eventHandlers[ns][name] = pluginExports._eventHandlers[ns][name] || []; const hs = pluginExports._eventHandlers[ns][name]; hs.push(handler); return () => { const i = hs.indexOf(handler); if (i !== -1) hs.splice(i, 1); }; }\n';
  script += '  async function handleRequest(message) { const { id, method, params } = message; try { if (method.startsWith(\'_lifecycle.\')) { const lm = method.split(\'.\')[1]; let r; if (lm === \'deactivate\' && typeof pluginExports?.deactivate === \'function\') r = await pluginExports.deactivate(); else throw new Error(\'Unsupported lifecycle: \' + lm); window.parent.postMessage({ id, pluginId: pluginManifest.id, type: \'response\', result:r }, \'*\'); return; } const [ns, mn] = method.split(\'.\'); if (!ns || !mn) throw new Error(\'Invalid method: \' + method); const h = pluginExports && (pluginExports[ns]?.[mn] ?? pluginExports[mn]); if (typeof h !== \'function\') throw new Error(\'Method not found: \' + method); const r = await h(params); window.parent.postMessage({ id, pluginId: pluginManifest.id, type: \'response\', result:r }, \'*\'); } catch (e) { window.parent.postMessage({ id, pluginId: pluginManifest.id, type: \'response\', error: { code: e?.code || -32000, message: e?.message || \'Unknown error\', data: e?.data } }, \'*\'); } }\n';
  script += '  function handleResponse(message) { const { id, result, error } = message; const p = pendingPromises.get(id); if (!p) return; pendingPromises.delete(id); if (error) { const e = new Error(error.message); /*e.code = error.code; e.data = error.data;*/ p.reject(e); } else { p.resolve(result); } }\n';
  script += '  function handleEvent(message) { const { method, params } = message; if (!method) return; const [ns, en] = method.split(\'.\'); const eh = pluginExports?._eventHandlers?.[ns]?.[en]; if (Array.isArray(eh)) { eh.forEach(h => { try { h(params); } catch (e) { console.error(\'Evt handler err (\'+method+\'):\', e); } }); } }\n';
  script += '  function createPluginApi(pluginId) { const api = {}; const um = { resizeToContent: () => callHostMethod(\'ui.resizeFrame\', { height: document.documentElement.scrollHeight }), getTheme: () => callHostMethod(\'ui.getTheme\', {}), onThemeChanged: (h) => onHostEvent(\'ui.themeChanged\', h) }; const nss = [\'model\', \'ui\', \'file\', \'network\', \'storage\']; nss.forEach(ns => { api[ns] = new Proxy({}, { get(t, p) { if (typeof p !== \'string\') return; if (ns === \'ui\' && p in um) return um[p]; if (p.startsWith(\'on\') && p.length > 2) { const en = p[2].toLowerCase() + p.slice(3); return (h) => onHostEvent(ns + \'.\' + en, h); } return (...a) => callHostMethod(ns + \'.\' + p, a[0]||{}, a[1]||[]); } }); }); return api; }\n\n';

  // Main Execution Logic
  script += '  try {\n';
  script += '    pluginApi = createPluginApi(pluginManifest.id);\n';
  script += '    console.log(`[Plugin Bootstrap (${id})] API created. Importing module from ${pluginCodeUrl}...`);\n'; // Corrected backticks
  script += '    try {\n';
  script += '      const pluginModule = await import(\' + JSON.stringify(pluginCodeUrl) + \');\n'; // Use JSON.stringify for safety
  script += '      pluginExports = pluginModule.default || pluginModule;\n';
  script += '      console.log(`[Plugin Bootstrap (${id})] Module imported.`);\n'; // Corrected backticks
  script += '    } catch (importError) {\n';
  script += '      reportError(\'import\', importError);\n';
  script += '      return; \n';
  script += '    }\n\n';

  // ---- REMOVED init() CALL ----

  // ---- REMOVED render() CALL ----

  // ---- ADDED activate() CALL ----
  script += '    if (typeof pluginExports?.activate === \'function\') {\n';
  script += '      console.log(`[Plugin Bootstrap (${id})] Calling activate...`);\n'; // Corrected backticks
  script += '      try {\n';
  script += '         const context = { pluginId: pluginManifest.id, pluginApi: pluginApi, pluginRoot: pluginRoot };\n'; // Create context object
  script += '         // Note: activate might return an object of exported methods for the host\n';
  script += '         const hostCallableApi = await pluginExports.activate(context);\n';
  script += '         // If activate returns something, merge it into pluginExports for host calls\n';
  script += '         if(hostCallableApi && typeof hostCallableApi === \'object\') {\n';
  script += '            Object.assign(pluginExports, hostCallableApi);\n';
  script += '         }\n';
  script += '         console.log(`[Plugin Bootstrap (${id})] Activate done.`);\n'; // Corrected backticks
  script += '      } catch (activateError) {\n';
  script += '         reportError(\'activate\', activateError);\n';
  script += '         return;\n';
  script += '      }\n';
  script += '    } else {\n';
  script += '        console.log(`[Plugin Bootstrap (${id})] No activate() function found (required).`);\n'; // Corrected backticks
  script += '        reportError(\'activation\', new Error(\'Plugin does not export an activate function.\'));\n';
  script += '        return; // Stop if no activate function\n';
  script += '    }\n\n';

  script += '    console.log(`[Plugin Bootstrap (${id})] Success.`);\n'; // Corrected backticks
  script += '    window.parent.postMessage({ type: \'plugin-init-result\', success: true, pluginId: pluginManifest.id }, \'*\');\n\n';
  script += '  } catch (bootstrapError) {\n';
  script += '    reportError(\'bootstrap\', bootstrapError);\n';
  script += '  }\n\n';

  // Message Listener
  script += '  window.addEventListener(\'message\', (event) => {\n';
  script += '    const message = event.data;\n';
  script += '    if (!message || typeof message !== \'object\' || !message.type) return;\n';
  script += '    if (message.type === \'request\') handleRequest(message);\n';
  script += '    else if (message.type === \'response\') handleResponse(message);\n';
  script += '    else if (message.type === \'event\') handleEvent(message);\n';
  script += '  });\n\n';
  script += '})();\n';
  script += '// --- End Plugin Bootstrap Script --- \n';

  // Send the script as response
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'private, no-store'); // Do not cache bootstrap
  res.status(200).send(script); // Send the concatenated script string
};

// Export the wrapped handler
export default withRegistry(bootstrapHandler);
