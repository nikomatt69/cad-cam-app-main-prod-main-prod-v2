---
trigger: always_on
description: 
globs: 
---
# Your rule content

- You can @ files here
- You can use markdown but dont have to

Piano d'Azione: Miglioramento CAD 2D Technical Drawing System
Fase 1: Rifattorizzazione e Modularizzazione (1-2 settimane)
Separazione delle Responsabilità
Creazione di Moduli Funzionali:
DrawingEngine.tsx - Logica di rendering principale
ToolsManager.ts - Gestione degli strumenti di disegno
EntityManager.ts - Manipolazione delle entità
SnapManager.ts - Sistema di snap avanzato
CommandSystem.ts - Sistema di comandi da tastiera
Utilities Specializzate
Geometria e Matematica:
geometry/transformations.ts - Funzioni per rotazione, scaling, mirroring
geometry/calculations.ts - Calcoli geometrici (intersezioni, tangenti)
geometry/conversions.ts - Conversioni tra sistemi di coordinate
Rendering Ottimizzato:
rendering/entity-renderers.ts - Funzioni di rendering per tipi specifici
rendering/layer-system.ts - Sistema di rendering a livelli
rendering/viewport-manager.ts - Gestione multipla dei viewport
Fase 2: Implementazione Funzionalità AutoCAD (2-3 settimane)
Strumenti di Disegno Avanzati
Geometrie Complesse:
Spline e curve NURBS
Ellissi e archi ellittici
Poligoni regolari parametrici
Hatch patterns personalizzabili
Strumenti di Modifica:
Fillet e chamfer tra linee
Offset di percorsi complessi
Estensione e taglio intelligente
Boolean operations tra poligoni
Sistema di Annotazione Completo
Quotature Avanzate:
Quotatura a catena e baseline
Quotatura radiale, diametrale e angolare migliorata
Tolleranze geometriche (GD&T)
Quote associative che si aggiornano con le entità
Fase 3: Miglioramento UX/UI (2 settimane)
Interfaccia Utente Professionale
Dock Panels Configurabili:
ui/panels/LayersPanel.tsx
ui/panels/PropertiesPanel.tsx
ui/panels/ToolsPanel.tsx
Sistema di docking simile ad AutoCAD
Sistemi di Input Migliorati:
ui/inputs/CoordinateInput.tsx - Input di coordinate cartesiane e polari
ui/inputs/ParametricInput.tsx - Campi di input dinamici per parametri
Command Line Interface
Sistema di Comandi Avanzato:
Parser di comandi con autocompletamento
Cronologia comandi e comandi recenti
Alias e scorciatoie personalizzabili
Fase 4: Ottimizzazione Performance (1-2 settimane)
Rendering e Memoria
Strategie di Rendering Efficiente:
Implementazione di culling e clipping
Layer frazionamento per grandi disegni
Precalcolo di geometrie statiche
Virtual DOM per Entità:
Sistema di differenze per aggiornamenti minimi del canvas
Caching di entità e calcoli geometrici
Web workers per calcoli pesanti
Fase 5: Interoperabilità e Formati File (1-2 settimane)
Supporto Formati Standard
Import/Export:
DXF/DWG parser e writer
SVG import/export migliorato
PDF export con layers