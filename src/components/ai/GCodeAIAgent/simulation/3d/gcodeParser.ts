/**
 * Parser per codice GCode
 */

export type GCodeCommandType = 
  | 'G0' | 'G1' | 'G2' | 'G3' | 'G4' // Comandi di movimento
  | 'G20' | 'G21' // Impostazioni unità
  | 'G28' | 'G90' | 'G91' // Impostazioni coordinate
  | 'M0' | 'M1' | 'M2' | 'M3' | 'M4' | 'M5' | 'M30' // Comandi di controllo
  | 'OTHER'; // Altri comandi

export interface GCodeCommand {
  type: GCodeCommandType;
  line: string;
  lineNumber: number;
  params: Record<string, number>;
  comment?: string;
}

/**
 * Analizza una stringa di GCode e restituisce un array di comandi
 */
export function parseGCode(gcodeText: string): GCodeCommand[] {
  const lines = gcodeText.split('\n');
  const commands: GCodeCommand[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Salta le linee vuote e i commenti
    if (line === '' || line.startsWith(';')) continue;
    
    // Estrai il comando e gli eventuali commenti
    const [commandPart, ...commentParts] = line.split(';');
    const comment = commentParts.join(';').trim();
    
    // Rimuovi eventuali spazi iniziali e finali
    const commandTrimmed = commandPart.trim();
    
    // Se la linea è vuota dopo la rimozione dei commenti, salta
    if (commandTrimmed === '') continue;
    
    // Estrai il tipo di comando
    const commandTypeMatch = commandTrimmed.match(/^([GM]\d+)/i);
    if (!commandTypeMatch) continue;
    
    const commandType = commandTypeMatch[1].toUpperCase();
    
    // Determina il tipo corretto
    let type: GCodeCommandType = 'OTHER';
    
    if (['G0', 'G00'].includes(commandType)) type = 'G0';
    else if (['G1', 'G01'].includes(commandType)) type = 'G1';
    else if (['G2', 'G02'].includes(commandType)) type = 'G2';
    else if (['G3', 'G03'].includes(commandType)) type = 'G3';
    else if (['G4', 'G04'].includes(commandType)) type = 'G4';
    else if (['G20'].includes(commandType)) type = 'G20';
    else if (['G21'].includes(commandType)) type = 'G21';
    else if (['G28'].includes(commandType)) type = 'G28';
    else if (['G90'].includes(commandType)) type = 'G90';
    else if (['G91'].includes(commandType)) type = 'G91';
    else if (['M0', 'M00'].includes(commandType)) type = 'M0';
    else if (['M1', 'M01'].includes(commandType)) type = 'M1';
    else if (['M2', 'M02'].includes(commandType)) type = 'M2';
    else if (['M3', 'M03'].includes(commandType)) type = 'M3';
    else if (['M4', 'M04'].includes(commandType)) type = 'M4';
    else if (['M5', 'M05'].includes(commandType)) type = 'M5';
    else if (['M30'].includes(commandType)) type = 'M30';
    
    // Estrai i parametri
    const params: Record<string, number> = {};
    const paramMatches = commandTrimmed.matchAll(/([A-Z])(-?\d*\.?\d+)/ig);
    
    for (const match of Array.from(paramMatches)) {
      const paramName = match[1].toUpperCase();
      const paramValue = parseFloat(match[2]);
      params[paramName] = paramValue;
    }
    
    commands.push({
      type,
      line: commandTrimmed,
      lineNumber: i + 1,
      params,
      comment: comment || undefined
    });
  }
  
  // Post-processing: trasforma le coordinate da relative ad assolute se necessario
  let isAbsolute = true; // Default a coordinate assolute
  let currentX = 0, currentY = 0, currentZ = 0;
  
  commands.forEach(cmd => {
    // Aggiorna la modalità
    if (cmd.type === 'G90') {
      isAbsolute = true;
      return;
    } else if (cmd.type === 'G91') {
      isAbsolute = false;
      return;
    }
    
    // Se è un comando di movimento, aggiorna la posizione corrente
    if (['G0', 'G1', 'G2', 'G3'].includes(cmd.type)) {
      if (isAbsolute) {
        // In modalità assoluta, aggiorniamo direttamente
        if (cmd.params.X !== undefined) currentX = cmd.params.X;
        if (cmd.params.Y !== undefined) currentY = cmd.params.Y;
        if (cmd.params.Z !== undefined) currentZ = cmd.params.Z;
      } else {
        // In modalità relativa, calcoliamo la posizione assoluta
        if (cmd.params.X !== undefined) {
          currentX += cmd.params.X;
          cmd.params.X = currentX;
        }
        if (cmd.params.Y !== undefined) {
          currentY += cmd.params.Y;
          cmd.params.Y = currentY;
        }
        if (cmd.params.Z !== undefined) {
          currentZ += cmd.params.Z;
          cmd.params.Z = currentZ;
        }
      }
    }
  });
  
  return commands;
}

/**
 * Estrae i limiti (dimensioni) da un GCode
 */
export function extractGCodeBounds(gcodeText: string) {
  const commands = parseGCode(gcodeText);
  
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;
  
  let currentX = 0, currentY = 0, currentZ = 0;
  
  commands.forEach(cmd => {
    if (['G0', 'G1', 'G2', 'G3'].includes(cmd.type)) {
      // Aggiorna posizione se specificata
      if (cmd.params.X !== undefined) currentX = cmd.params.X;
      if (cmd.params.Y !== undefined) currentY = cmd.params.Y;
      if (cmd.params.Z !== undefined) currentZ = cmd.params.Z;
      
      // Aggiorna limiti
      minX = Math.min(minX, currentX);
      maxX = Math.max(maxX, currentX);
      minY = Math.min(minY, currentY);
      maxY = Math.max(maxY, currentY);
      minZ = Math.min(minZ, currentZ);
      maxZ = Math.max(maxZ, currentZ);
    }
  });
  
  // Se non ci sono movimenti validi, usa valori predefiniti
  if (minX === Infinity) {
    minX = 0;
    maxX = 100;
    minY = 0;
    maxY = 100;
    minZ = 0;
    maxZ = 10;
  }
  
  return {
    minX, maxX,
    minY, maxY,
    minZ, maxZ,
    width: maxX - minX,
    height: maxY - minY,
    depth: maxZ - minZ
  };
}