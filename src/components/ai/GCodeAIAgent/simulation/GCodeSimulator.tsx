import React, { useRef, useEffect, useState } from 'react';

interface GCodeSimulatorProps {
  gcode: string;
  isSimulating: boolean;
  onSimulationEnd?: () => void;
}

const GCodeSimulator: React.FC<GCodeSimulatorProps> = ({
  gcode,
  isSimulating,
  onSimulationEnd
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [progress, setProgress] = useState(0);
  const [currentLine, setCurrentLine] = useState(0);
  const [totalLines, setTotalLines] = useState(0);
  const [simSpeed, setSimSpeed] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0, z: 0 });
  const [bounds, setBounds] = useState({
    minX: 0, minY: 0, maxX: 100, maxY: 100,
    width: 100, height: 100
  });
  
  // Parser GCode semplificato
  useEffect(() => {
    if (!gcode) return;
    
    const lines = gcode.split('\n').filter(line => {
      // Rimuovi commenti e linee vuote
      const cleanLine = line.split(';')[0].trim();
      return cleanLine.length > 0;
    });
    
    setTotalLines(lines.length);
    
    // Analisi dei limiti del percorso
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    
    lines.forEach(line => {
      const cleanLine = line.split(';')[0].trim();
      
      // Estrai coordinate X e Y
      const xMatch = cleanLine.match(/X(-?\d*\.?\d+)/i);
      const yMatch = cleanLine.match(/Y(-?\d*\.?\d+)/i);
      
      if (xMatch) {
        const x = parseFloat(xMatch[1]);
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
      }
      
      if (yMatch) {
        const y = parseFloat(yMatch[1]);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    });
    
    // Aggiungi un margine
    const margin = 10;
    minX = minX === Infinity ? 0 : minX - margin;
    minY = minY === Infinity ? 0 : minY - margin;
    maxX = maxX === -Infinity ? 100 : maxX + margin;
    maxY = maxY === -Infinity ? 100 : maxY + margin;
    
    const width = maxX - minX;
    const height = maxY - minY;
    
    setBounds({
      minX,
      minY,
      maxX,
      maxY,
      width,
      height
    });
    
  }, [gcode]);
  
  // Gestione della simulazione
  useEffect(() => {
    if (!canvasRef.current || !gcode || !isSimulating) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Pulisci il canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Imposta lo stile del canvas
    ctx.fillStyle = '#1E1E1E';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Disegna la griglia
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 0.5;
    
    const gridSize = 10;
    const scaleX = canvas.width / bounds.width;
    const scaleY = canvas.height / bounds.height;
    
    // Griglia orizzontale
    for (let y = 0; y <= bounds.height; y += gridSize) {
      const canvasY = (y - bounds.minY) * scaleY;
      ctx.beginPath();
      ctx.moveTo(0, canvasY);
      ctx.lineTo(canvas.width, canvasY);
      ctx.stroke();
    }
    
    // Griglia verticale
    for (let x = 0; x <= bounds.width; x += gridSize) {
      const canvasX = (x - bounds.minX) * scaleX;
      ctx.beginPath();
      ctx.moveTo(canvasX, 0);
      ctx.lineTo(canvasX, canvas.height);
      ctx.stroke();
    }
    
    // Disegna gli assi
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 1;
    
    // Asse X
    const originY = (0 - bounds.minY) * scaleY;
    if (originY >= 0 && originY <= canvas.height) {
      ctx.beginPath();
      ctx.moveTo(0, originY);
      ctx.lineTo(canvas.width, originY);
      ctx.stroke();
    }
    
    // Asse Y
    const originX = (0 - bounds.minX) * scaleX;
    if (originX >= 0 && originX <= canvas.width) {
      ctx.beginPath();
      ctx.moveTo(originX, 0);
      ctx.lineTo(originX, canvas.height);
      ctx.stroke();
    }
    
    // Variabili per la simulazione
    let currentX = 0;
    let currentY = 0;
    let currentZ = 0;
    let lineIndex = 0;
    let lastCommandTime = Date.now();
    
    // Processa le linee di GCode
    const lines = gcode.split('\n');
    
    // Funzione per mappare le coordinate dal GCode al canvas
    const mapToCanvas = (x: number, y: number) => ({
      x: (x - bounds.minX) * scaleX,
      y: (y - bounds.minY) * scaleY
    });
    
    // Disegna il percorso in base al progresso
    const drawPathToCurrentProgress = () => {
      // Resetta la posizione
      currentX = 0;
      currentY = 0;
      currentZ = 0;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#1E1E1E';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Ridisegna la griglia
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 0.5;
      
      // Griglia orizzontale
      for (let y = 0; y <= bounds.height; y += gridSize) {
        const canvasY = (y - bounds.minY) * scaleY;
        ctx.beginPath();
        ctx.moveTo(0, canvasY);
        ctx.lineTo(canvas.width, canvasY);
        ctx.stroke();
      }
      
      // Griglia verticale
      for (let x = 0; x <= bounds.width; x += gridSize) {
        const canvasX = (x - bounds.minX) * scaleX;
        ctx.beginPath();
        ctx.moveTo(canvasX, 0);
        ctx.lineTo(canvasX, canvas.height);
        ctx.stroke();
      }
      
      // Disegna gli assi
      ctx.strokeStyle = '#444444';
      ctx.lineWidth = 1;
      
      // Asse X
      if (originY >= 0 && originY <= canvas.height) {
        ctx.beginPath();
        ctx.moveTo(0, originY);
        ctx.lineTo(canvas.width, originY);
        ctx.stroke();
      }
      
      // Asse Y
      if (originX >= 0 && originX <= canvas.width) {
        ctx.beginPath();
        ctx.moveTo(originX, 0);
        ctx.lineTo(originX, canvas.height);
        ctx.stroke();
      }
      
      // Disegna il percorso completato
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      const maxLineIndex = Math.floor(lines.length * progress / 100);
      let hasStartedPath = false;
      
      for (let i = 0; i <= maxLineIndex && i < lines.length; i++) {
        const line = lines[i].split(';')[0].trim(); // Rimuovi commenti
        
        if (line.length === 0) continue;
        
        // Estrai il comando G
        const gMatch = line.match(/G0*(\d+)/i);
        const command = gMatch ? parseInt(gMatch[1]) : null;
        
        // Estrai le coordinate
        const xMatch = line.match(/X(-?\d*\.?\d+)/i);
        const yMatch = line.match(/Y(-?\d*\.?\d+)/i);
        const zMatch = line.match(/Z(-?\d*\.?\d+)/i);
        
        // Aggiorna le coordinate se presenti
        const newX = xMatch ? parseFloat(xMatch[1]) : currentX;
        const newY = yMatch ? parseFloat(yMatch[1]) : currentY;
        const newZ = zMatch ? parseFloat(zMatch[1]) : currentZ;
        
        // Disegna il movimento se è un comando G0 o G1
        if (command === 0 || command === 1) {
          const start = mapToCanvas(currentX, currentY);
          const end = mapToCanvas(newX, newY);
          
          // Imposta il colore in base al tipo di movimento e alla Z
          if (command === 0) {
            // Movimento rapido - linea tratteggiata
            ctx.strokeStyle = '#4FC1FF';
            ctx.setLineDash([5, 3]);
          } else {
            // Movimento di taglio - linea continua
            if (newZ <= 0) {
              // Sotto la superficie - movimento di taglio
              ctx.strokeStyle = '#FF5252';
            } else {
              // Sopra la superficie - movimento di posizionamento
              ctx.strokeStyle = '#4EC9B0';
            }
            ctx.setLineDash([]);
          }
          
          // Disegna la linea
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          ctx.stroke();
          
          hasStartedPath = true;
        }
        
        // Aggiorna le coordinate correnti
        currentX = newX;
        currentY = newY;
        currentZ = newZ;
      }
      
      // Disegna il punto della posizione corrente
      const currentPos = mapToCanvas(currentX, currentY);
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(currentPos.x, currentPos.y, 4, 0, Math.PI * 2);
      ctx.fill();
      
      // Aggiorna lo stato
      setPosition({ x: currentX, y: currentY, z: currentZ });
      setCurrentLine(maxLineIndex);
    };
    
    // Esegui l'animazione
    let animationId: number;
    let lastTimestamp = 0;
    
    const animate = (timestamp: number) => {
      if (!lastTimestamp) lastTimestamp = timestamp;
      
      // Calcola il tempo trascorso
      const elapsed = timestamp - lastTimestamp;
      lastTimestamp = timestamp;
      
      // Aggiorna il progresso in base alla velocità
      if (progress < 100) {
        setProgress(prev => {
          const newProgress = prev + (elapsed / 1000) * simSpeed;
          return Math.min(newProgress, 100);
        });
        
        // Disegna il percorso
        drawPathToCurrentProgress();
        
        // Continua l'animazione
        animationId = requestAnimationFrame(animate);
      } else {
        // Simulazione completata
        if (onSimulationEnd) {
          onSimulationEnd();
        }
      }
    };
    
    // Avvia l'animazione solo se stiamo simulando
    if (isSimulating) {
      animationId = requestAnimationFrame(animate);
    } else {
      // Se non stiamo simulando, disegna comunque il percorso completo
      setProgress(100);
      drawPathToCurrentProgress();
    }
    
    // Pulizia
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [gcode, isSimulating, bounds, progress, simSpeed, onSimulationEnd]);
  
  // Gestisci il reset della simulazione
  useEffect(() => {
    if (!isSimulating) {
      setProgress(0);
      setCurrentLine(0);
      setPosition({ x: 0, y: 0, z: 0 });
    }
  }, [isSimulating]);
  
  return (
    <div className="flex flex-col h-full bg-gray-900">
      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          width={500}
          height={300}
          className="w-full h-full"
        />
      </div>
      
      <div className="p-2 bg-gray-800 border-t border-gray-700">
        <div className="flex justify-between items-center mb-1">
          <div className="text-xs text-gray-400">
            Linea: {currentLine}/{totalLines}
          </div>
          
          <div className="text-xs text-gray-400">
            Velocità: 
            <select 
              value={simSpeed} 
              onChange={(e) => setSimSpeed(Number(e.target.value))}
              className="ml-1 px-1 rounded text-xs bg-gray-700 text-gray-300"
            >
              <option value={0.5}>0.5x</option>
              <option value={1}>1x</option>
              <option value={2}>2x</option>
              <option value={5}>5x</option>
              <option value={10}>10x</option>
            </select>
          </div>
        </div>
        
        <div className="w-full bg-gray-700 rounded-full h-1.5">
          <div 
            className="bg-blue-600 h-1.5 rounded-full" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <div className="flex justify-between items-center mt-2">
          <div className="text-xs text-gray-400">
            Posizione: X:{position.x.toFixed(2)} Y:{position.y.toFixed(2)} Z:{position.z.toFixed(2)}
          </div>
          
          <div className="text-xs text-gray-400">
            Progresso: {progress.toFixed(0)}%
          </div>
        </div>
      </div>
    </div>
  );
};

export default GCodeSimulator;