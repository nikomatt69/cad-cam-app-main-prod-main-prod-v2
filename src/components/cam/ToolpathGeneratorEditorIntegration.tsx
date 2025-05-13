// Aggiunge l'integrazione con l'editor GCode
import ToolpathEditorIntegration from 'src/components/cam/ToolpathEditorIntegration';

// All'interno del componente ToolpathGenerator, dopo la variabile di stato "currentGCode"
const [showEditor, setShowEditor] = useState<boolean>(true); // Attiva l'editor di default

// Modifica la funzione generateGCode per visualizzare l'editor
const generateGCode = () => {
  setIsGenerating(true);
  setError(null);
  setSuccess(null);
  
  try {
    let gcode = '';
    
    // Select the appropriate G-code generator based on machine type
    switch (settings.machineType) {
      case 'mill':
        gcode = generateMillGCode();
        break;
      case 'lathe':
        gcode = generateLatheGCode();
        break;
      case '3dprinter':
        // --- Integrate new 3D printer logic ---
        if (selectedElement) {
          // 1. Gather all necessary 3D print settings
          const printerSettings = {
            layerHeight: settings.layerHeight || 0.2,
            printSpeed: settings.printSpeed || 60,
            travelSpeed: 150, // Example default, maybe add to settings state?
            printTemperature: settings.printTemperature || 200,
            bedTemperature: settings.bedTemperature || 60,
            extrusionWidth: settings.extrusionWidth || settings.nozzleDiameter || 0.4,
            filamentDiameter: settings.filamentDiameter || 1.75,
            retractionDistance: 2, // Example default, maybe add to settings state?
            retractionSpeed: 60,   // Example default, maybe add to settings state?
            infillDensity: infillDensity, // From use3DPrinterSettings hook
            infillPattern: infillPattern, // From use3DPrinterSettings hook
            shellCount: shellCount,       // From use3DPrinterSettings hook
            supportType: supportType,     // From use3DPrinterSettings hook
            supportOverhangAngle: 45, // Example default, maybe add to settings state?
            supportDensity: 20,       // Example default, maybe add to settings state?
            raftLayers: 0,            // Example default, maybe add to settings state?
            brimWidth: 0,             // Example default, maybe add to settings state?
            material: settings.material, // Include material if needed by generators
            nozzleDiameter: settings.nozzleDiameter || 0.4,
            // Add any other relevant settings from ToolpathSettings if needed
          };

          // 2. Check element type and call the appropriate generator
          if (selectedElement.type === 'composite' || selectedElement.type === 'component' || selectedElement.type === 'group') {
             gcode = generateCompositeElement3D(selectedElement, printerSettings);
          } else {
             gcode = generate3DPrinterGCodeForElement(selectedElement, printerSettings);
          }
        } else {
          toast.error('Please select a CAD element for 3D printing.');
          gcode = '; Error: No element selected for 3D printing\n';
          setIsGenerating(false);
          return; // Exit early
        }
        // --- End integration ---
        break;
      default:
        setError('Unsupported machine type');
        gcode = '; Error: Unsupported machine type\n';
    }
    
    // Ottimizzazioni avanzate (solo se abilitate nelle impostazioni avanzate)
    if (settings.optimizePath) {
      gcode = optimizeToolpath(gcode);
    }
    
    if (settings.useArcFitting) {
      gcode = convertLinesToArcs(gcode, settings.tolerance);
    }

    // Impostare il G-code corrente per l'analisi dei cicli fissi
    setCurrentGCode(gcode);
  
    // Analizzare il G-code per individuare cicli fissi
    const lines = gcode.split('\n');
    const cycles = lines
      .filter(line => isFixedCycle(line))
      .map(line => ({
        gcode: line,
        // Altre proprietà recuperate dal parser...
      }));
    
    setDetectedCycles(cycles);
    
    // Show success message
    setSuccess('G-code generated successfully!');
    
    // Reset success message after a timeout
    successTimerRef.current = setTimeout(() => {
      setSuccess(null);
    }, 5000);
    
    // Attiva automaticamente l'editor
    setShowEditor(true);
    
    // Pass generated G-code back to parent
    onGCodeGenerated(gcode);
  } catch (err) {
    setError('Error generating G-code. Check your settings.');
    console.error('G-code generation error:', err);
  } finally {
    setIsGenerating(false); 
  } 
};

// Aggiungi nella sezione di rendering, prima della chiusura di </div> principale dell'interfaccia
{showEditor && currentGCode && (
  <div className="g-code-editor-container mt-4">
    <div className="flex justify-between items-center mb-2">
      <h3 className="text-lg font-semibold">G-Code Editor</h3>
      <button
        onClick={() => setShowEditor(!showEditor)}
        className="px-2 py-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded text-sm"
      >
        {showEditor ? 'Hide Editor' : 'Show Editor'}
      </button>
    </div>
    <ToolpathEditorIntegration
      initialGCode={currentGCode}
      onGCodeUpdated={(newGCode) => {
        setCurrentGCode(newGCode);
        onGCodeGenerated(newGCode);
      }}
      fileName={fileName || 'toolpath.gcode'}
    />
  </div>
)}
