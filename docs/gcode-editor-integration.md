# Integrazione dell'Editor GCode nel ToolpathGenerator

Questa documentazione spiega come integrare l'editor GCode avanzato nel generatore di toolpath dell'applicazione. L'editor fornisce un'interfaccia avanzata per modificare il G-code generato, con funzionalità come:

- Evidenziazione della sintassi
- Quick Edit con AI
- Autocompletamento
- Integrazione con l'assistente AI

## Integrazione con camStore

Questa implementazione utilizza il `camStore` come fonte principale per il G-code. In particolare:

1. Il ToolpathGenerator salva il G-code generato nel camStore usando `setGcode`
2. L'editor legge e scrive direttamente nel camStore usando gli stessi metodi
3. Il resto dell'applicazione accede al G-code dallo stesso store

Questo garantisce che tutte le parti dell'applicazione (editor, visualizzatore, post-processor) utilizzino sempre la stessa versione del G-code.

## Opzione 1: Integrazione automatica

Il modo più semplice per integrare l'editor è utilizzare lo script di installazione:

```bash
# Rendere lo script eseguibile
chmod +x scripts/integrate-gcode-editor.sh

# Eseguire lo script
./scripts/integrate-gcode-editor.sh
```

## Opzione 2: Integrazione manuale

Se preferisci integrare manualmente l'editor o se lo script automatico non funziona, segui questi passaggi:

### Passo 1: Verifica che tutti i file necessari siano presenti

I seguenti file devono essere stati creati:
- `/src/contexts/GCodeEditorContext.tsx`
- `/src/components/ai/GCodeAIAgent.tsx` (componente principale)
- `/src/components/cam/ToolpathEditorIntegration.tsx`
- `/src/components/cam/integrateEditorInToolpathGenerator.tsx`

### Passo 2: Modifica il file ToolpathGenerator.tsx

Apri il file `/src/components/cam/ToolpathGenerator.tsx` e apporta le seguenti modifiche:

1. **Importa useCAMStore e l'integratore**:
```tsx
import { useCAMStore } from '@/src/store/camStore';
import { integrateEditorInToolpathGenerator } from './integrateEditorInToolpathGenerator';
```

2. **Accedi a setGcode dal camStore**:
```tsx
const setStoreGcode = useCAMStore(state => state.setGcode);
```

3. **Aggiungi lo stato per controllare la visibilità dell'editor**:
```tsx
const [showEditor, setShowEditor] = useState<boolean>(true);
```

4. **Nella funzione generateGCode, salva il G-code nel camStore**:
```tsx
// Dopo aver generato il G-code
setStoreGcode(gcode);
setShowEditor(true);
```

5. **Aggiungi il rendering dell'editor alla fine del componente**:
```tsx
{integrateEditorInToolpathGenerator({
  showEditor,
  setShowEditor,
  fileName: "toolpath.gcode"
})}
```

### Passo 3: Verifica l'integrazione

1. Avvia l'applicazione:
```bash
npm run dev
```

2. Naviga alla pagina del generatore di toolpath
3. Genera un G-code con il bottone "Generate G-Code"
4. L'editor GCode dovrebbe apparire automaticamente sotto il pannello principale
5. Verifica che le modifiche al G-code nell'editor si riflettano correttamente nel visualizzatore e nel post-processor

## Personalizzazione

### Cambiare l'altezza dell'editor

Per modificare l'altezza dell'editor, modifica il file `/src/components/cam/integrateEditorInToolpathGenerator.tsx`:

```tsx
// Cambia questa riga
<div className="h-[600px] w-full border border-gray-300 rounded-md overflow-hidden">

// Ad esempio, per un'altezza di 800px:
<div className="h-[800px] w-full border border-gray-300 rounded-md overflow-hidden">
```

### Disattivare l'editor di default

Se preferisci che l'editor non sia attivato automaticamente:

1. Modifica lo stato iniziale in ToolpathGenerator.tsx:
```tsx
const [showEditor, setShowEditor] = useState<boolean>(false);
```

2. Aggiungi un pulsante per attivare l'editor quando necessario:
```tsx
<button 
  onClick={() => setShowEditor(true)}
  className="ml-2 px-3 py-1 bg-blue-600 text-white rounded"
>
  Show Editor
</button>
```

## Risoluzione dei problemi

Se incontri problemi con l'integrazione, prova a:

1. **Verificare le importazioni**: Assicurati che tutti i percorsi di importazione siano corretti
2. **Controllare la console**: Cerca eventuali errori nella console del browser
3. **Ripristinare il backup**: Se hai eseguito lo script, puoi ripristinare il file originale:
```bash
cp src/components/cam/ToolpathGenerator.tsx.bak src/components/cam/ToolpathGenerator.tsx
```

4. **Verifica camStore**: Controlla che il G-code sia correttamente salvato nel camStore prima di essere visualizzato nell'editor

## Funzionalità dell'editor

Una volta integrato, l'editor offre diverse funzionalità:

- **Evidenziazione della sintassi**: I comandi G-code sono evidenziati automaticamente
- **Quick Edit**: Seleziona il testo e usa "Quick Edit" per modificare rapidamente il codice con l'aiuto dell'AI
- **Autocompletamento**: Quando digiti comandi G-code, vengono suggeriti i completamenti
- **Assistente AI**: Chiedi all'assistente AI di spiegare, ottimizzare o generare G-code

L'editor è integrato con il camStore, quindi qualsiasi modifica apportata al G-code sarà immediatamente disponibile in tutte le parti dell'applicazione che utilizzano lo stesso store.
