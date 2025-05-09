// src/pages/api/mcp/config-file.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/src/lib/prisma';
import { MCPServerConfig, MCPSseConfig, MCPStdioServerConfig } from '@/src/lib/mcp/client';
import { requireAuth } from '@/src/lib/api/auth'; // Make sure requireAuth is imported

type ConfigFileFormat = {
  mcpServers: (MCPServerConfig & { type: 'sse' | 'stdio' })[];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const userId = await requireAuth(req, res);
    if (!userId) return;
  
  try {
    switch (req.method) {
      case 'GET':
        // Leggi le configurazioni dal database
        const servers = await prisma.mCPServerConfig.findMany();
        
        const configData: ConfigFileFormat = {
          mcpServers: servers.map(server => {
            if (server.type === 'sse') {
              return {
                id: server.id,
                name: server.name,
                type: 'sse',
                url: server.url as string,
                enabled: server.enabled,
              } as MCPSseConfig;
            } else if (server.type === 'stdio') {
              return {
                id: server.id,
                name: server.name,
                type: 'stdio',
                command: server.command as string,
                args: (server.args as string[] | undefined) || [],
                workingDirectory: server.workingDirectory as string | undefined,
                enabled: server.enabled,
              } as MCPStdioServerConfig;
            }
            throw new Error(`Invalid server type in GET: ${server.type}`);
          })
        };
        
        return res.status(200).json(configData);
        
      case 'POST':
        const configFile: ConfigFileFormat = req.body;
        
        if (!configFile || !Array.isArray(configFile.mcpServers)) {
          return res.status(400).json({ error: 'Formato di configurazione non valido' });
        }
        
        await prisma.$transaction(async (tx) => {
          await tx.mCPServerConfig.deleteMany({});
          
          for (const server of configFile.mcpServers) {
            const currentServer = server as (MCPSseConfig | MCPStdioServerConfig) & { type: 'sse' | 'stdio' };

            if (!currentServer.id || !currentServer.name || !currentServer.type) {
              throw new Error('ID server, nome e tipo sono obbligatori.');
            }

            const commonData = {
              id: currentServer.id,
              name: currentServer.name,
              type: currentServer.type,
              enabled: currentServer.enabled ?? false,
              userId: userId, 
            };

            let dataToCreate;

            if (currentServer.type === 'sse') {
              const sseServer = currentServer as MCPSseConfig;
              if (typeof sseServer.url !== 'string' || !sseServer.url.trim()) {
                throw new Error('URL è obbligatorio per i server SSE e deve essere una stringa non vuota.');
              }
              dataToCreate = {
                ...commonData,
                url: sseServer.url,
              };
            } else if (currentServer.type === 'stdio') {
              const stdioServer = currentServer as MCPStdioServerConfig;
              if (typeof stdioServer.command !== 'string' || !stdioServer.command.trim()) {
                throw new Error('Comando è obbligatorio per i server STDIO e deve essere una stringa non vuota.');
              }
              const args = Array.isArray(stdioServer.args) ? stdioServer.args : [];
              dataToCreate = {
                ...commonData,
                command: stdioServer.command,
                args: args,
                workingDirectory: stdioServer.workingDirectory || null,
              };
            } else {
              // This path should ideally not be reached if server types are validated upstream
              // or if currentServer.type is strictly 'sse' | 'stdio'.
              // To satisfy linter that might see currentServer.type as 'never' here:
              console.error('Invalid server type encountered in POST:', currentServer);
              throw new Error('Tipo di server non valido o non gestito rilevato.');
            }
            await tx.mCPServerConfig.create({ data: dataToCreate });
          }
        });
        
        return res.status(200).json({ success: true });
        
      default:
        return res.status(405).json({ error: 'Metodo non consentito' });
    }
  } catch (error: any) {
    console.error('Errore nella gestione del file di configurazione MCP:', error);
    return res.status(500).json({ error: error.message || 'Errore interno del server' });
  }
}