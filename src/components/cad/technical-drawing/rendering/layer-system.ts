// src/components/cad/technical-drawing/rendering/layer-system.ts
// Sistema di gestione dei livelli per il disegno tecnico
// Layer management system for technical drawing

import { DrawingLayer, AnyEntity } from '../../../../types/TechnicalDrawingTypes';

/**
 * Ordina i layer in base alla loro priorità di visualizzazione
 * Sorts layers based on their display priority
 */
export function sortLayersByOrder(layers: DrawingLayer[]): DrawingLayer[] {
  return [...layers].sort((a, b) => (a.order || 0) - (b.order || 0));
}

/**
 * Raggruppa le entità per layer
 * Groups entities by layer
 * 
 * @param entities - Lista di entità da raggruppare / List of entities to group
 * @param layers - Map di layer disponibili / Map of available layers
 * @returns Map di entità raggruppate per ID del layer / Map of entities grouped by layer ID
 */
export function groupEntitiesByLayer(
  entities: AnyEntity[],
  layers: Record<string, DrawingLayer>
): Map<string, AnyEntity[]> {
  const layerMap = new Map<string, AnyEntity[]>();
  
  // Inizializza la mappa con array vuoti per ogni layer
  // Initialize map with empty arrays for each layer
  Object.keys(layers).forEach(layerId => {
    layerMap.set(layerId, []);
  });
  
  // Raggruppa le entità nei rispettivi layer
  // Group entities into their respective layers
  entities.forEach(entity => {
    if (!entity.layer) return;
    
    const layerEntities = layerMap.get(entity.layer) || [];
    layerEntities.push(entity);
    layerMap.set(entity.layer, layerEntities);
  });
  
  return layerMap;
}

/**
 * Filtra le entità in base alla visibilità dei layer
 * Filters entities based on layer visibility
 * 
 * @param entities - Lista di tutte le entità / List of all entities
 * @param layers - Map di layer disponibili / Map of available layers
 * @returns Lista filtrata di entità visibili / Filtered list of visible entities
 */
export function filterVisibleEntities(
  entities: AnyEntity[],
  layers: Record<string, DrawingLayer>
): AnyEntity[] {
  // Trova i layer visibili / Find visible layers
  const visibleLayerIds = Object.values(layers)
    .filter(layer => layer.visible)
    .map(layer => layer.id);
  
  // Filtra le entità in base all'appartenenza ai layer visibili
  // Filter entities based on membership to visible layers
  return entities.filter(entity => 
    entity.visible && 
    entity.layer && 
    visibleLayerIds.includes(entity.layer)
  );
}

/**
 * Trova un layer disponibile per il tipo di entità specificato
 * Finds an available layer for the specified entity type
 * 
 * @param entityType - Tipo di entità / Entity type
 * @param layers - Map di layer disponibili / Map of available layers
 * @returns ID del layer predefinito per il tipo di entità / Default layer ID for the entity type
 */
export function findLayerForEntityType(
  entityType: string,
  layers: Record<string, DrawingLayer>
): string {
  // Mappa di tipi di entità e i loro layer preferiti (esempi)
  // Map of entity types and their preferred layers (examples)
  const preferredLayers: Record<string, string[]> = {
    'line': ['geometry', 'visible', 'default'],
    'circle': ['geometry', 'visible', 'default'],
    'rectangle': ['geometry', 'visible', 'default'],
    'polyline': ['geometry', 'visible', 'default'],
    'text': ['annotation', 'text', 'notes', 'default'],
    'dimension': ['dimensions', 'annotation', 'default']
  };
  
  // Layer preferiti per questo tipo
  const preferred = preferredLayers[entityType] || ['default'];
  
  // Cerca tra i layer preferiti e restituisci il primo disponibile
  // Search among preferred layers and return the first available one
  for (const layerName of preferred) {
    const foundLayer = Object.values(layers).find(l => 
      l.name.toLowerCase() === layerName.toLowerCase() && l.visible
    );
    
    if (foundLayer) {
      return foundLayer.id;
    }
  }
  
  // Se non viene trovato alcun layer preferito, restituisci il primo layer visibile
  // If no preferred layer is found, return the first visible layer
  const visibleLayer = Object.values(layers).find(l => l.visible);
  
  // Restituisci il layer visibile o il primo layer come fallback
  // Return the visible layer or the first layer as a fallback
  return visibleLayer 
    ? visibleLayer.id 
    : (Object.values(layers)[0]?.id || 'default');
}

/**
 * Aggiorna lo stile di un'entità in base al suo layer
 * Updates an entity's style based on its layer
 * 
 * @param entity - Entità da aggiornare / Entity to update
 * @param layers - Map di layer disponibili / Map of available layers
 * @returns Entità con stile aggiornato / Entity with updated style
 */
export function applyLayerStyleToEntity<T extends AnyEntity>(
  entity: T,
  layers: Record<string, DrawingLayer>
): T {
  if (!entity.layer || !layers[entity.layer]) return entity;
  
  const layer = layers[entity.layer];
  
  // Crea una copia dell'entità per non modificare l'originale
  // Create a copy of the entity to avoid modifying the original
  const updatedEntity = { ...entity };
  
  // Aggiorna lo stile solo se lo stile "usa il colore del layer"
  // Update style only if the style "uses layer color"
  if (updatedEntity.style.strokeColor === 'bylayer') {
    updatedEntity.style = {
      ...updatedEntity.style,
      strokeColor: layer.color
    };
  }
  
  // Aggiorna anche il colore di riempimento se necessario
  // Also update fill color if necessary
  if (updatedEntity.style.fillColor === 'bylayer') {
    updatedEntity.style = {
      ...updatedEntity.style,
      fillColor: layer.color,
      // Applica un'opacità predefinita se non specificata
      // Apply a default opacity if not specified
      fillOpacity: updatedEntity.style.fillOpacity !== undefined 
        ? updatedEntity.style.fillOpacity 
        : 0.3
    };
  }
  
  return updatedEntity;
}