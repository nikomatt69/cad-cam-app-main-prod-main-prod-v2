#!/bin/bash
# Script per integrare l'editor GCode nel ToolpathGenerator

echo "=== Integrazione dell'editor GCode nel ToolpathGenerator ==="
echo "Questo script applicherà le modifiche necessarie per integrare"
echo "l'editor GCode avanzato nel generatore di toolpath."
echo ""

# Verifica che i file esistano
if [ ! -f "src/components/cam/ToolpathGenerator.tsx" ]; then
  echo "Errore: Il file ToolpathGenerator.tsx non è stato trovato."
  echo "Assicurati di eseguire questo script dalla directory principale del progetto."
  exit 1
fi

echo "1. Creazione dei file di supporto..."

# Verifica se i file sono già stati creati
files_to_check=(
  "src/contexts/GCodeEditorContext.tsx"
  "src/components/cam/ToolpathEditorIntegration.tsx"
  "src/components/cam/integrateEditorInToolpathGenerator.tsx"
)

for file in "${files_to_check[@]}"; do
  if [ ! -f "$file" ]; then
    echo "Errore: Il file $file non esiste."
    echo "Assicurati di creare tutti i file necessari prima di eseguire questo script."
    exit 1
  fi
done

echo "Tutti i file necessari sono presenti."

echo "2. Modifica del file ToolpathGenerator.tsx..."

# Verifica se le modifiche sono già state applicate
if grep -q "integrateEditorInToolpathGenerator" "src/components/cam/ToolpathGenerator.tsx"; then
  echo "Le modifiche sembrano essere già state applicate al file ToolpathGenerator.tsx."
  echo "Vuoi forzare l'applicazione delle modifiche? (s/n)"
  read -r force_apply
  if [ "$force_apply" != "s" ]; then
    echo "Operazione annullata."
    exit 0
  fi
fi

# Backup del file originale
cp src/components/cam/ToolpathGenerator.tsx src/components/cam/ToolpathGenerator.tsx.bak
echo "Backup creato: src/components/cam/ToolpathGenerator.tsx.bak"

# Applica le modifiche seguendo le istruzioni nel patch
# Aggiungi l'importazione per useCAMStore (se non è già presente)
if ! grep -q "import { useCAMStore }" "src/components/cam/ToolpathGenerator.tsx"; then
  sed -i '' '1s/^/import { useCAMStore } from '\''@\/src\/store\/camStore'\'';\n/' "src/components/cam/ToolpathGenerator.tsx"
fi

# Aggiungi l'importazione per l'integrazione dell'editor
sed -i '' '1s/^/import { integrateEditorInToolpathGenerator } from '\''\.\/integrateEditorInToolpathGenerator'\'';\n/' "src/components/cam/ToolpathGenerator.tsx"

# Aggiungi l'accesso a setGcode dal camStore
sed -i '' '/const { elements, selectedElement } = useElementsStore();/a\
  const setStoreGcode = useCAMStore(state => state.setGcode);' "src/components/cam/ToolpathGenerator.tsx"

# Aggiungi lo stato showEditor
sed -i '' '/const \[currentGCode, setCurrentGCode\] = useState<string>('\'');/a\
  const [showEditor, setShowEditor] = useState<boolean>(true); // Attiva l'\''editor di default' "src/components/cam/ToolpathGenerator.tsx"

# Aggiungi il salvataggio nel camStore e l'attivazione dell'editor
sed -i '' '/onGCodeGenerated(gcode);/a\
    setStoreGcode(gcode);\
    setShowEditor(true);' "src/components/cam/ToolpathGenerator.tsx"

# Aggiungi il rendering dell'editor alla fine del componente
sed -i '' '/<\/div>/i\
      {integrateEditorInToolpathGenerator({\
        showEditor,\
        setShowEditor,\
        fileName: "toolpath.gcode"\
      })}' "src/components/cam/ToolpathGenerator.tsx"

echo "Modifiche applicate con successo!"
echo ""
echo "3. Verifica l'integrazione avviando l'applicazione:"
echo "   npm run dev"
echo ""
echo "L'editor GCode sarà ora visualizzato automaticamente quando"
echo "genererai un toolpath con il bottone 'Generate G-Code'."
echo ""
echo "=== Integrazione completata ==="
