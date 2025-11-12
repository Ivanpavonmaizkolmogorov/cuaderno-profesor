import { generateUUID } from '../utils.js';

/**
 * Función genérica para fusionar nuevos elementos en un array de elementos existente.
 * Los elementos se emparejan por una 'idKey' especificada. Los elementos nuevos se añaden,
 * los elementos existentes se actualizan.
 * Si un elemento en 'newItems' tiene un ID que existe en 'existingItems', el elemento existente
 * se actualiza con las propiedades del nuevo elemento. Si un elemento en 'newItems' no tiene un ID,
 * o su ID no existe en 'existingItems', se trata como un elemento nuevo y se genera un ID si es necesario.
 *
 * @param {Array<object>} existingItems - El array actual de elementos en la base de datos.
 * @param {Array<object>} newItems - El array de elementos a importar/fusionar.
 * @param {string} idKey - El nombre de la propiedad utilizada como identificador único (ej. 'id', 'idPunto').
 * @param {function} [preProcessItem] - Función opcional para preprocesar cada 'newItem' antes de la fusión (ej. generar IDs para sub-elementos).
 * @returns {Array<object>} El array de elementos fusionado.
 */
export function mergeItems(existingItems, newItems, idKey, preProcessItem = (item) => item) {
  const mergedMap = new Map(existingItems.map(item => [item[idKey], item]));

  newItems.forEach(newItem => {
    const processedItem = preProcessItem(newItem); // Preprocesar para asegurar que los sub-IDs se generen si es necesario

    if (processedItem[idKey] && mergedMap.has(processedItem[idKey])) {
      // El elemento existe, actualizarlo fusionando propiedades
      mergedMap.set(processedItem[idKey], { ...mergedMap.get(processedItem[idKey]), ...processedItem });
    } else {
      // Nuevo elemento, generar ID si falta y añadir
      if (!processedItem[idKey]) {
        processedItem[idKey] = `${idKey.substring(0, 1)}-${generateUUID()}`; // Generar ID basado en el prefijo de idKey
      }
      mergedMap.set(processedItem[idKey], processedItem);
    }
  });

  return Array.from(mergedMap.values());
}

/**
 * Función específica para fusionar datos del temario.
 * Maneja unidades y puntos anidados, generando IDs si faltan.
 * Al fusionar, si una unidad existe, sus propiedades se actualizan. Su array de puntos
 * también se fusiona utilizando la misma lógica.
 * @param {Array<object>} existingTemario - El array de temario actual.
 * @param {Array<object>} newTemario - El array de temario a importar/fusionar.
 * @returns {Array<object>} El array de temario fusionado.
 */
export function mergeTemario(existingTemario, newTemario) {
  // Ayudante para asegurar que los puntos tienen IDs
  const preProcessPoint = (point) => {
    if (typeof point === 'string') {
      point = { texto: point };
    }
    if (!point.idPunto) point.idPunto = `p-${generateUUID()}`;
    return point;
  };

  // Ayudante para asegurar que las unidades tienen IDs y sus puntos están preprocesados
  const preProcessUnit = (unit) => {
    if (!unit.idUnidad) unit.idUnidad = `u-${generateUUID()}`;
    if (unit.puntos && Array.isArray(unit.puntos)) {
      unit.puntos = unit.puntos.map(preProcessPoint);
    } else {
      unit.puntos = [];
    }
    return unit;
  };

  // Fusionar unidades (nivel superior)
  const mergedUnits = mergeItems(existingTemario, newTemario, 'idUnidad', preProcessUnit);

  // --- INICIO DE LA CORRECCIÓN ---
  // La lógica anterior no fusionaba correctamente los puntos de unidades existentes.
  // Esta nueva lógica asegura que si una unidad ya existe, sus puntos se fusionan
  // en lugar de ser reemplazados.
  const finalTemario = mergedUnits.map(unit => {
    // Buscamos la unidad original y la nueva correspondiente
    const existingUnit = existingTemario.find(u => u.idUnidad === unit.idUnidad);
    const newUnitData = newTemario.find(u => u.idUnidad === unit.idUnidad);
    
    // Si la unidad existía y se le han proporcionado nuevos datos, fusionamos sus puntos.
    if (existingUnit && newUnitData) {
      unit.puntos = mergeItems(existingUnit.puntos || [], newUnitData.puntos || [], 'idPunto', preProcessPoint);
    }
    return unit;
  });
  // --- FIN DE LA CORRECCIÓN ---

  return finalTemario;
}