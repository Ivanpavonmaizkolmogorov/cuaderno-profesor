import { generateUUID } from "../utils.js";

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
export function mergeItems(
  existingItems,
  newItems,
  idKey,
  preProcessItem = (item) => item
) {
  const mergedMap = new Map(existingItems.map((item) => [item[idKey], item]));

  newItems.forEach((newItem) => {
    const processedItem = preProcessItem(newItem); // Preprocesar para asegurar que los sub-IDs se generen si es necesario

    if (processedItem[idKey] && mergedMap.has(processedItem[idKey])) {
      // El elemento existe, actualizarlo fusionando propiedades
      mergedMap.set(processedItem[idKey], {
        ...mergedMap.get(processedItem[idKey]),
        ...processedItem,
      });
    } else {
      // Nuevo elemento, generar ID si falta y añadir
      if (!processedItem[idKey]) {
        processedItem[idKey] = `${idKey.substring(0, 1)}-${generateUUID()}`; // Generar ID con prefijo
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
  // Objeto para llevar la cuenta de las acciones realizadas durante la fusión.
  const stats = {
    unitsAdded: 0,
    unitsMerged: 0,
    pointsAdded: 0,
    pointsUpdated: 0,
  };

  const finalTemario = [...existingTemario];
  const existingUnitsMap = new Map(existingTemario.map(u => [u.unidad.trim().toLowerCase(), u]));

  newTemario.forEach(newUnit => {
    const unitTitleKey = newUnit.unidad.trim().toLowerCase();
    let existingUnit = existingUnitsMap.get(unitTitleKey);

    // Si la unidad no existe por título, la añadimos como nueva.
    if (!existingUnit) {
      stats.unitsAdded++;
      // Aseguramos que la nueva unidad y sus puntos tengan IDs.
      if (!newUnit.idUnidad) newUnit.idUnidad = `u-${generateUUID()}`;
      (newUnit.puntos || []).forEach(p => {
        if (typeof p === 'string') p = { texto: p };
        if (!p.idPunto) p.idPunto = `p-${generateUUID()}`;
      });
      finalTemario.push(newUnit);
      existingUnitsMap.set(unitTitleKey, newUnit); // La añadimos al mapa para futuras referencias
    } else {
      stats.unitsMerged++;
      // La unidad ya existe. Fusionamos sus puntos.
      const existingPointsMap = new Map((existingUnit.puntos || []).map(p => [p.texto.trim().toLowerCase(), p]));

      (newUnit.puntos || []).forEach(newPointData => {
        let newPoint = newPointData;
        if (typeof newPoint === 'string') {
          newPoint = { texto: newPoint };
        }
        const pointTextKey = newPoint.texto.trim().toLowerCase();
        const existingPoint = existingPointsMap.get(pointTextKey);

        if (existingPoint) {
          // El punto existe, actualizamos sus propiedades (como ce_ids)
          // pero mantenemos el ID original.
          stats.pointsUpdated++;
          existingPoint.ce_ids = newPoint.ce_ids || existingPoint.ce_ids || [];
        } else {
          stats.pointsAdded++;
          // El punto es nuevo para esta unidad, lo añadimos.
          if (!newPoint.idPunto) {
            newPoint.idPunto = `p-${generateUUID()}`;
          }
          if (!existingUnit.puntos) {
            existingUnit.puntos = [];
          }
          existingUnit.puntos.push(newPoint);
          // Lo añadimos al mapa para evitar duplicados si viene repetido en el mismo JSON
          existingPointsMap.set(pointTextKey, newPoint);
        }
      });

      // Actualizamos otras propiedades de la unidad si es necesario
      existingUnit.unidad = newUnit.unidad; // Permite corregir mayúsculas/minúsculas
    }
  });

  return { mergedTemario: finalTemario, stats };
}