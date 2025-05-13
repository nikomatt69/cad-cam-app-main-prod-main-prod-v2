import React, { useRef, useEffect, useState } from 'react';
import { parseGCode, GCodeCommand } from './gcodeParser';

interface GCode3DViewerProps {
  gcode: string;
  isAnimating: boolean;
  onAnimationEnd?: () => void;
}

// Tipo per i punti 3D
type Point3D = {
  x: number;
  y: number;
  z: number;
};

// Tipo per i segmenti di linea
type LineSegment = {
  start: Point3D;
  end: Point3D;
  type: 'rapid' | 'linear' | 'arc';
  isCutting: boolean;
};

const GCode3DViewer: React.FC<GCode3DViewerProps> = ({ 
  gcode, 
  isAnimating, 
  onAnimationEnd 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState({ x: 0.5, y: 0.5 });
  const [zoom, setZoom] = useState(1.0);
  const [paths, setPaths] = useState<LineSegment[]>([]);
  const [bounds, setBounds] = useState({
    minX: 0, maxX: 100,
    minY: 0, maxY: 100,
    minZ: 0, maxZ: 10,
  });
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Analizza il GCode quando cambia
  useEffect(() => {
    if (!gcode) return;
    
    try {
      // Analizza il GCode
      const commands = parseGCode(gcode);
      
      // Converti i comandi in segmenti di linea
      const segments: LineSegment[] = [];
      let currentPosition: Point3D = { x: 0, y: 0, z: 0 };
      let minX = Infinity, maxX = -Infinity;
      let minY = Infinity, maxY = -Infinity;
      let minZ = Infinity, maxZ = -Infinity;
      
      commands.forEach(cmd => {
        if (cmd.type === 'G0' || cmd.type === 'G1' || cmd.type === 'G2' || cmd.type === 'G3') {
          // Crea una copia della posizione corrente
          const startPosition = { ...currentPosition };
          
          // Aggiorna la posizione in base ai parametri del comando
          if (cmd.params.X !== undefined) currentPosition.x = cmd.params.X;
          if (cmd.params.Y !== undefined) currentPosition.y = cmd.params.Y;
          if (cmd.params.Z !== undefined) currentPosition.z = cmd.params.Z;
          
          // Aggiorna i limiti
          minX = Math.min(minX, currentPosition.x);
          maxX = Math.max(maxX, currentPosition.x);
          minY = Math.min(minY, currentPosition.y);
          maxY = Math.max(maxY, currentPosition.y);
          minZ = Math.min(minZ, currentPosition.z);
          maxZ = Math.max(maxZ, currentPosition.z);
          
          // Determina il tipo di movimento
          const moveType = cmd.type === 'G0' ? 'rapid' : cmd.type === 'G1' ? 'linear' : 'arc';
          const isCutting = moveType !== 'rapid' && currentPosition.z <= 0;
          
          // Aggiungi il segmento
          segments.push({
            start: startPosition,
            end: { ...currentPosition },
            type: moveType,
            isCutting
          });
        }
      });
      
      // Se non ci sono segmenti, usa valori predefiniti
      if (segments.length === 0) {
        minX = 0; maxX = 100;
        minY = 0; maxY = 100;
        minZ = 0; maxZ = 10;
      }
      
      // Imposta i limiti con un margine
      const margin = 10;
      setBounds({
        minX: minX - margin,
        maxX: maxX + margin,
        minY: minY - margin,
        maxY: maxY + margin,
        minZ: minZ - margin,
        maxZ: maxZ + margin,
      });
      
      setPaths(segments);
      
    } catch (error) {
      console.error('Errore nell\'analisi del GCode:', error);
    }
  }, [gcode]);
  
  // Renderizza la vista 3D
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Pulisci il canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Imposta lo sfondo
    ctx.fillStyle = '#1E1E1E';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Calcola il centro e il fattore di scala
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    const width = bounds.maxX - bounds.minX;
    const height = bounds.maxY - bounds.minY;
    const depth = bounds.maxZ - bounds.minZ;
    
    const baseScale = Math.min(
      canvas.width / width,
      canvas.height / height
    ) * 0.8;
    
    const scale = baseScale * zoom;
    
    // Funzione per proiettare un punto 3D su un canvas 2D
    const project = (point: Point3D): [number, number] => {
      // Applica rotazione
      const cosY = Math.cos(rotation.y * Math.PI);
      const sinY = Math.sin(rotation.y * Math.PI);
      const cosX = Math.cos(rotation.x * Math.PI);
      const sinX = Math.sin(rotation.x * Math.PI);
      
      const rotatedX = point.x * cosY - point.z * sinY;
      const rotatedZ = point.x * sinY + point.z * cosY;
      const rotatedY = point.y * cosX + rotatedZ * sinX;
      
      // Normalizza le coordinate
      const normalizedX = (rotatedX - bounds.minX) / width - 0.5;
      const normalizedY = (rotatedY - bounds.minY) / height - 0.5;
      
      // Proietta sul canvas
      const projectedX = centerX + normalizedX * scale * canvas.width;
      const projectedY = centerY - normalizedY * scale * canvas.height;
      
      return [projectedX, projectedY];
    };
    
    // Disegna gli assi
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 1;
    
    // Asse X (rosso)
    ctx.beginPath();
    const [x1, y1] = project({ x: bounds.minX, y: 0, z: 0 });
    const [x2, y2] = project({ x: bounds.maxX, y: 0, z: 0 });
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = '#E74C3C';
    ctx.stroke();
    
    // Asse Y (verde)
    ctx.beginPath();
    const [x3, y3] = project({ x: 0, y: bounds.minY, z: 0 });
    const [x4, y4] = project({ x: 0, y: bounds.maxY, z: 0 });
    ctx.moveTo(x3, y3);
    ctx.lineTo(x4, y4);
    ctx.strokeStyle = '#2ECC71';
    ctx.stroke();
    
    // Asse Z (blu)
    ctx.beginPath();
    const [x5, y5] = project({ x: 0, y: 0, z: bounds.minZ });
    const [x6, y6] = project({ x: 0, y: 0, z: bounds.maxZ });
    ctx.moveTo(x5, y5);
    ctx.lineTo(x6, y6);
    ctx.strokeStyle = '#3498DB';
    ctx.stroke();
    
    // Disegna il piano di lavoro
    ctx.beginPath();
    const corners = [
      { x: bounds.minX, y: bounds.minY, z: 0 },
      { x: bounds.maxX, y: bounds.minY, z: 0 },
      { x: bounds.maxX, y: bounds.maxY, z: 0 },
      { x: bounds.minX, y: bounds.maxY, z: 0 }
    ];
    
    const [px1, py1] = project(corners[0]);
    ctx.moveTo(px1, py1);
    
    for (let i = 1; i < corners.length; i++) {
      const [px, py] = project(corners[i]);
      ctx.lineTo(px, py);
    }
    
    ctx.closePath();
    ctx.fillStyle = 'rgba(70, 70, 70, 0.2)';
    ctx.fill();
    ctx.strokeStyle = '#555555';
    ctx.stroke();
    
    // Disegna i percorsi in base al progresso
    const pathsToRender = isAnimating 
      ? Math.ceil(paths.length * progress / 100)
      : paths.length;
    
    for (let i = 0; i < pathsToRender; i++) {
      const path = paths[i];
      
      ctx.beginPath();
      const [startX, startY] = project(path.start);
      const [endX, endY] = project(path.end);
      
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      
      if (path.type === 'rapid') {
        // Movimento rapido - linea tratteggiata blu
        ctx.strokeStyle = '#4FC1FF';
        ctx.setLineDash([5, 3]);
        ctx.lineWidth = 1;
      } else {
        ctx.setLineDash([]);
        if (path.isCutting) {
          // Movimento di taglio - linea rossa
          ctx.strokeStyle = '#FF5252';
          ctx.lineWidth = 2;
        } else {
          // Movimento di approccio - linea verde
          ctx.strokeStyle = '#4EC9B0';
          ctx.lineWidth = 1.5;
        }
      }
      
      ctx.stroke();
    }
    
    // Disegna l'utensile nella posizione corrente (se ci sono paths)
    if (paths.length > 0 && pathsToRender > 0) {
      const currentPosition = paths[Math.min(pathsToRender - 1, paths.length - 1)].end;
      const [toolX, toolY] = project(currentPosition);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(toolX, toolY, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    
  }, [canvasRef, paths, bounds, rotation, zoom, progress, isAnimating]);
  
  // Animazione
  useEffect(() => {
    if (!isAnimating) {
      setProgress(0);
      return;
    }
    
    let animationId: number;
    let lastTimestamp = 0;
    const duration = 5000; // 5 secondi per l'animazione completa
    
    const animate = (timestamp: number) => {
      if (!lastTimestamp) lastTimestamp = timestamp;
      
      const elapsed = timestamp - lastTimestamp;
      const progressIncrement = (elapsed / duration) * 100;
      
      setProgress(prev => {
        const newProgress = Math.min(100, prev + progressIncrement);
        
        if (newProgress >= 100) {
          // Animazione completata
          if (onAnimationEnd) {
            onAnimationEnd();
          }
          return 100;
        }
        
        animationId = requestAnimationFrame(animate);
        return newProgress;
      });
      
      lastTimestamp = timestamp;
    };
    
    animationId = requestAnimationFrame(animate);
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isAnimating, onAnimationEnd]);
  
  // Handler per il mouse
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = (e.clientX - dragStart.x) / 200;
    const deltaY = (e.clientY - dragStart.y) / 200;
    
    setRotation(prev => ({
      x: Math.max(0, Math.min(1, prev.x - deltaY)),
      y: (prev.y + deltaX) % 2
    }));
    
    setDragStart({ x: e.clientX, y: e.clientY });
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  const handleWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.max(0.5, Math.min(3, prev + delta)));
  };
  
  return (
    <div className="relative h-full bg-gray-900">
      <canvas
        ref={canvasRef}
        width={500}
        height={400}
        className="w-full h-full"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />
      
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-xs">
        <div className="text-gray-400">
          {isAnimating ? (
            <span>Simulating: {progress.toFixed(0)}%</span>
          ) : (
            <span>3D View - Drag to rotate, scroll to zoom</span>
          )}
        </div>
        
        <div className="text-gray-400">
          {paths.length > 0 && (
            <span>Segments: {paths.length}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default GCode3DViewer;