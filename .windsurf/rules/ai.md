---
trigger: manual
---

# Your rule content

- You can @ files here
- You can use markdown but dont have to

utilizza l mcp server filesystem  installato in claude desktop 'secure-filesystem-server' per accedere a /Users/nikoemme/cad-cam-app-main-prod-main-2/ che e la cartella del progetto corrente , non google drive! per analizzare il progetto visto  che hai accesso alla cartella e mostrami un piano di azione professionale strutturato e pronto per la produzione mostrandomi lo schema aggiornato   **Action Plan for AI CAD System Enhancement** This plan structures the implementation of the suggested improvements into manageable phases: **Fase 1: Miglioramenti Immediati (Target: 1-2 settimane)** 1. **Ottimizzazione Prompt Claude 3.7:** * Refine existing CAD_SYSTEM_PROMPT in src/lib/ai/openaiService.ts to leverage Claude 3.7's capabilities (detailed instructions, technical reasoning). * Adjust temperature settings (e.g., 0.1-0.3) for technical design tasks in the API call configuration. * Create specialized prompt templates for different domains if applicable (e.g., mechanical, architectural). 1. ****Validazione Geometrica Base:**** * Implement a basic GeometricValidator class (as suggested in section 3). * Integrate initial validation checks (e.g., minimum dimensions, aspect ratios) within the parsing/post-processing logic (parseTextToCADResponse or similar). 1. ****Miglioramento Parsing/Correzione:****



Action Plan for AI CAD System Enhancement
This plan structures the implementation of the suggested improvements into manageable phases:
Fase 1: Miglioramenti Immediati (Target: 1-2 settimane)
Ottimizzazione Prompt Claude 3.7:
Refine existing CAD_SYSTEM_PROMPT in src/lib/ai/openaiService.ts to leverage Claude 3.7's capabilities (detailed instructions, technical reasoning).
Adjust temperature settings (e.g., 0.1-0.3) for technical design tasks in the API call configuration.
Create specialized prompt templates for different domains if applicable (e.g., mechanical, architectural).
Validazione Geometrica Base:
Implement a basic GeometricValidator class (as suggested in section 3).
Integrate initial validation checks (e.g., minimum dimensions, aspect ratios) within the parsing/post-processing logic (parseTextToCADResponse or similar).
Miglioramento Parsing/Correzione:
Enhance the response parsing logic (e.g., in parseTextToCADResponse) to be more robust against malformed JSON.
Implement basic JSON repair mechanisms if parsing fails.
Add value normalization (units, scale) post-parsing.
Fase 2: Miglioramenti a Medio Termine (Target: 2-4 settimane)
Pipeline di Generazione Progressiva:
Refactor the core generation logic (potentially within UnifiedAIService or a new service) to follow a multi-stage approach (Conceptual -> Dimensional Refinement -> Detailing -> Validation).
Define separate service methods or functions for each stage.
Potenziamento MCP (Model Context Protocol):
Implement session management within your MCP service to maintain design context across requests.
Add functionality for semantic analysis of previous prompts to maintain coherence (requires integrating a similarity measure).
Develop component caching within the MCP session to store and retrieve similar sub-components.
Feedback Strutturato e Analisi:
Enhance AIFeedbackCollector (or create a new system) to capture specific feedback categories (accuracy, manufacturability, etc.).
Implement logic to store this structured feedback.
Develop initial analysis functions to process feedback and identify common issues.
Fase 3: Miglioramenti Avanzati (Target: 1-2 mesi)
Generatori Specifici per Dominio:
Implement a factory pattern (DomainSpecificCADGenerator) to select appropriate generation logic based on the detected domain.
Develop specialized generator classes (e.g., MechanicalCADGenerator, ArchitecturalCADGenerator) incorporating domain-specific knowledge and standards.
Input Multimodale:
Modify AIMessage and related processing to handle image inputs (image_url).
Update the OpenAIService (sendMessage, formatMessagesForApi) to correctly format and send multimodal requests to the AI model.
Develop logic (processMultimodalInput, processMultimodalResponse) to handle image-based prompts and integrate visual information into the CAD generation process.
Dashboard di Monitoraggio Avanzato:
Create a dedicated monitoring component (AIPerformanceMonitor).
Define and track detailed quality metrics (precision, manufacturability, etc.).
Implement backend storage for these metrics (MetricsDatabase).
Develop a frontend dashboard to visualize performance trends and potentially enable A/B testing setup.
Implement logic (PerformanceAnalyzer) to automatically suggest improvements based on collected data.
This phased approach allows for incremental improvements and testing at each stage. Remember to adapt this plan based on your specific priorities and resources.