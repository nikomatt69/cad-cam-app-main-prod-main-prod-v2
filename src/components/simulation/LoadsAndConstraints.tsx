import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { Vector3, Mesh as ThreeMesh, ArrowHelper, SphereGeometry, MeshBasicMaterial, PerspectiveCamera } from 'three';
import { StressAnalysisParams } from '../../lib/simulation/StressAnalysis';
import { ThermalAnalysisParams, ThermalSource} from '../../lib/simulation/ThermalAnalysis';

interface LoadsAndConstraintsProps {
  meshId: string;
  mesh?: ThreeMesh; // Original model mesh
  simulationType: 'stress' | 'thermal' | 'coupled';
  simulationParams: StressAnalysisParams | ThermalAnalysisParams;
}

// Arrow visualization for forces
const ForceArrow = ({ position, direction, magnitude, label }: { 
  position: Vector3, 
  direction: Vector3, 
  magnitude: number,
  label: string
}) => {
  const arrowRef = useRef<ArrowHelper>(null);
  const length = Math.min(Math.max(magnitude / 100, 0.2), 2); // Scale arrow length based on magnitude
  
  useEffect(() => {
    if (arrowRef.current) {
      arrowRef.current.position.copy(position);
    }
  }, [position]);
  
  useFrame(() => {
    if (arrowRef.current) {
      // Make arrows slowly rotate to be more visible
      arrowRef.current.rotation.y += 0.005;
    }
  });
  
  return (
    <>
      <arrowHelper
        ref={arrowRef}
        args={[
          direction.clone().normalize(),
          position,
          length,
          0xff0000, // Red color for forces
          length * 0.3, // Head length
          length * 0.2 // Head width
        ]}
      />
      <Html position={position.clone().add(direction.clone().normalize().multiplyScalar(length + 0.1))}>
        <div className="bg-red-100 px-2 py-1 rounded text-xs text-red-800 font-medium whitespace-nowrap">
          {label}
        </div>
      </Html>
    </>
  );
};

// Constraint visualization
const FixedPoint = ({ position, fullyFixed, label }: { 
  position: Vector3, 
  fullyFixed: boolean,
  label: string
}) => {
  const sphereRef = useRef<ThreeMesh>(null);
  
  useEffect(() => {
    if (sphereRef.current) {
      sphereRef.current.position.copy(position);
    }
  }, [position]);
  
  return (
    <>
      <mesh ref={sphereRef}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color={fullyFixed ? "#1E88E5" : "#42A5F5"} transparent opacity={0.7} />
      </mesh>
      <Html position={position.clone().add(new Vector3(0, 0.15, 0))}>
        <div className="bg-blue-100 px-2 py-1 rounded text-xs text-blue-800 font-medium whitespace-nowrap">
          {label}
        </div>
      </Html>
    </>
  );
};

// Heat source visualization
const HeatSource = ({ position, radius, temperature, label }: { 
  position: Vector3, 
  radius: number,
  temperature: number,
  label: string
}) => {
  const sphereRef = useRef<ThreeMesh>(null);
  const tempCelsius = temperature - 273.15;
  
  // Calculate color based on temperature (red for hot, blue for cold)
  const getTemperatureColor = () => {
    const t = Math.min(Math.max((tempCelsius - 0) / 150, 0), 1); // Map 0-150°C to 0-1
    
    if (t < 0.5) {
      // Blue to yellow gradient for cooler temps
      const r = Math.floor(t * 2 * 255);
      const g = Math.floor(t * 2 * 255);
      const b = Math.floor(255 * (1 - t * 2));
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      // Yellow to red gradient for hotter temps
      const r = 255;
      const g = Math.floor(255 * (1 - (t - 0.5) * 2));
      const b = 0;
      return `rgb(${r}, ${g}, ${b})`;
    }
  };
  
  const color = getTemperatureColor();
  
  useEffect(() => {
    if (sphereRef.current) {
      sphereRef.current.position.copy(position);
      sphereRef.current.scale.setScalar(radius * 10); // Scale sphere based on radius
    }
  }, [position, radius]);
  
  return (
    <>
      <mesh ref={sphereRef}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.7} />
      </mesh>
      <Html position={position.clone().add(new Vector3(0, radius + 0.15, 0))}>
        <div className="bg-yellow-100 px-2 py-1 rounded text-xs text-yellow-800 font-medium whitespace-nowrap">
          {label} ({tempCelsius.toFixed(1)}°C)
        </div>
      </Html>
    </>
  );
};

// Thermal boundary visualization
const ThermalBoundary = ({ position, radius, temperature, label }: { 
  position: Vector3, 
  radius: number,
  temperature: number,
  label: string
}) => {
  const sphereRef = useRef<ThreeMesh>(null);
  const tempCelsius = temperature - 273.15;
  
  useEffect(() => {
    if (sphereRef.current) {
      sphereRef.current.position.copy(position);
      sphereRef.current.scale.setScalar(radius * 10);
    }
  }, [position, radius]);
  
  return (
    <>
      <mesh ref={sphereRef}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color="#9C27B0" transparent opacity={0.5} wireframe />
      </mesh>
      <Html position={position.clone().add(new Vector3(0, radius + 0.15, 0))}>
        <div className="bg-purple-100 px-2 py-1 rounded text-xs text-purple-800 font-medium whitespace-nowrap">
          {label} ({tempCelsius.toFixed(1)}°C)
        </div>
      </Html>
    </>
  );
};

// Main scene component
const Scene = ({ mesh, simulationType, simulationParams }: { 
  mesh?: ThreeMesh,
  simulationType: 'stress' | 'thermal' | 'coupled',
  simulationParams: StressAnalysisParams | ThermalAnalysisParams
}) => {
  const { camera } = useThree();
  
  useEffect(() => {
    // Position camera to see whole model
    if (mesh && camera instanceof PerspectiveCamera) {
      // Get bounding box of mesh to position camera properly
      mesh.geometry.computeBoundingBox();
      const box = mesh.geometry.boundingBox;
      if (box) {
        const center = new Vector3();
        box.getCenter(center);
        const size = new Vector3();
        box.getSize(size);
        
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        let distance = maxDim / (2 * Math.tan(fov / 2));
        
        // Set some minimum distance
        distance = Math.max(distance, 2);
        
        const direction = new Vector3(1, 1, 1).normalize();
        camera.position.copy(center.clone().add(direction.multiplyScalar(distance)));
        camera.lookAt(center);
        camera.updateProjectionMatrix();
      }
    } else if (mesh) {
      // Optional: Handle OrthographicCamera case or log a warning if needed
      console.warn("Camera is not a PerspectiveCamera, cannot adjust FOV-based distance.");
      // Fallback positioning logic for OrthographicCamera could go here
      mesh.geometry.computeBoundingBox();
      const box = mesh.geometry.boundingBox;
      if (box) {
        const center = new Vector3();
        box.getCenter(center);
        const size = new Vector3();
        box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        // Simplified distance calculation for ortho camera might be needed
        let distance = maxDim * 1.5; // Example fallback
        distance = Math.max(distance, 2);
        const direction = new Vector3(1, 1, 1).normalize();
        camera.position.copy(center.clone().add(direction.multiplyScalar(distance)));
        camera.lookAt(center);
        camera.updateProjectionMatrix();
      }
    }
  }, [mesh, camera]);
  
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      
      {/* Original mesh */}
      {mesh && (
        <mesh geometry={mesh.geometry} position={[0, 0, 0]}>
          <meshStandardMaterial color="#EEEEEE" transparent opacity={0.7} />
        </mesh>
      )}
      
      {/* Forces and constraints for stress analysis */}
      {(simulationType === 'stress' || simulationType === 'coupled') && (
        <>
          {(simulationParams as StressAnalysisParams).forces.map((force, index) => (
            <ForceArrow
              key={`force-${index}`}
              position={force.position}
              direction={force.direction}
              magnitude={force.magnitude}
              label={`${force.magnitude.toFixed(0)} N`}
            />
          ))}
          
          {(simulationParams as StressAnalysisParams).fixedPoints.map((point, index) => (
            <FixedPoint
              key={`fixed-${index}`}
              position={point.position}
              fullyFixed={point.fullyFixed}
              label={point.fullyFixed ? "Fixed" : "Partial"}
            />
          ))}
        </>
      )}
      
      {/* Heat sources and thermal boundaries for thermal analysis */}
      {(simulationType === 'thermal' || simulationType === 'coupled') && (
        <>
          {(simulationParams as ThermalAnalysisParams).heatSources.map((source, index) => (
            <HeatSource
              key={`heat-${index}`}
              position={source.position}
              radius={source.radius}
              temperature={source.temperature}
              label={`Heat Source ${index + 1}`}
            />
          ))}
          
          {(simulationParams as ThermalAnalysisParams).boundaries.map((boundary, index) => (
            <ThermalBoundary
              key={`boundary-${index}`}
              position={boundary.position}
              radius={boundary.radius}
              temperature={boundary.temperature}
              label={`Boundary ${index + 1}`}
            />
          ))}
        </>
      )}
      
      <OrbitControls />
    </>
  );
};

const LoadsAndConstraints: React.FC<LoadsAndConstraintsProps> = ({ 
  meshId, 
  mesh, 
  simulationType, 
  simulationParams 
}) => {
  const [legends, setLegends] = useState<Array<{color: string, label: string}>>([]);
  
  useEffect(() => {
    const newLegends = [];
    
    if (simulationType === 'stress' || simulationType === 'coupled') {
      newLegends.push({ color: '#ff0000', label: 'Force' });
      newLegends.push({ color: '#1E88E5', label: 'Fixed Constraint' });
    }
    
    if (simulationType === 'thermal' || simulationType === 'coupled') {
      newLegends.push({ color: '#ff5722', label: 'Heat Source' });
      newLegends.push({ color: '#9C27B0', label: 'Thermal Boundary' });
    }
    
    setLegends(newLegends);
  }, [simulationType]);
  
  return (
    <div className="w-full h-full relative">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <Scene 
          mesh={mesh} 
          simulationType={simulationType} 
          simulationParams={simulationParams}
        />
      </Canvas>
      
      {/* Legend */}
      <div className="absolute top-4 right-4 bg-white bg-opacity-90 p-2 rounded shadow-md">
        <div className="text-sm font-medium mb-1">Legend</div>
        <div className="space-y-1">
          {legends.map((item, index) => (
            <div key={index} className="flex items-center">
              <div 
                className="w-4 h-4 mr-2" 
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoadsAndConstraints; 