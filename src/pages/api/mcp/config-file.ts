// src/pages/api/mcp/config-file.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/src/lib/prisma';
import { MCPServerConfig } from '@/src/lib/mcp/client';

type ConfigFileFormat = {
  mcpServers: MCPServerConfig[];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verifica l'autenticazione (da implementare in base al tuo sistema)
  // ...
  
  try {
    switch (req.method) {
      case 'GET':
        // Leggi le configurazioni dal database
        const servers = await prisma.mCPServerConfig.findMany();
        
        const configData: ConfigFileFormat = {
          mcpServers: servers.map(server => ({
            id: server.id,
            name: server.name,
            type: server.type as 'sse',
            url: server.url,
            enabled: server.enabled,
          }))
        };
        
        return res.status(200).json(configData);
        
      case 'POST':
        // Salva le configurazioni nel database
        const configFile: ConfigFileFormat = req.body;
        
        if (!configFile || !Array.isArray(configFile.mcpServers)) {
          return res.status(400).json({ error: 'Formato di configurazione non valido' });
        }
        
        // Transazione per aggiornare le configurazioni
        await prisma.$transaction(async (tx) => {
          // Elimina tutte le configurazioni esistenti
          await tx.mCPServerConfig.deleteMany({});
          
          // Inserisci le nuove configurazioni
          for (const server of configFile.mcpServers) {
            // Verifica i campi richiesti
            if (!server.id || !server.name || !server.type || server.type !== 'sse') {
              throw new Error('Campo richiesto mancante in una configurazione server');
            }
            
            await tx.mCPServerConfig.create({
              data: {
                id: server.id,
                name: server.name,
                type: server.type,
                url: server.url,
                enabled: server.enabled ?? false,
              }
            });
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