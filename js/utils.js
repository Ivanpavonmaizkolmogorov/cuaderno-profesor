// --- FUNCIONES DE UTILIDAD ---

/**
 * Genera un Identificador Único Universal (UUID) v4.
 * @returns {string} Un string representando el UUID.
 */
export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Procesa una cadena de texto con nombres de alumnos y sugiere el formato "Apellidos, Nombre".
 * @param {string} text - El texto con un nombre por línea.
 * @returns {Array&lt;{id: string, original: string, suggested: string}&gt;} Un array de objetos con sugerencias.
 */
export function formatStudentNames(text) {
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
  
  return lines.map(line => {
    const words = line.split(/\s+/).filter(Boolean);
    let suggested = line; // Por defecto, es la línea original

    if (words.length > 1) {
      // Heurística simple: la primera palabra es el nombre, el resto apellidos.
      const firstName = words[0];
      const lastNames = words.slice(1).join(' ');
      suggested = `${lastNames}, ${firstName}`;
    }

    return {
      id: generateUUID(),
      original: line,
      suggested: suggested
    };
  });
}

/**
 * Prepara la estructura de datos de un módulo para el seguimiento de progreso del temario.
 * Añade IDs únicos a las unidades y puntos del temario si no existen.
 * Inicializa y sincroniza el objeto `progresoTemario`.
 * Esta función muta el objeto del módulo directamente.
 * @param {object} moduleData - El objeto completo de datos del módulo.
 */
export function prepareModuleForProgressTracking(moduleData) {
  // Si no hay temario, simplemente nos aseguramos de que la propiedad exista como un array vacío.
  // NO lo auto-generamos. Esto permitirá que la UI muestre el botón de importar.
  if (!moduleData.temario) {
    moduleData.temario = [];
  }

  if (!moduleData.progresoTemario) {
    moduleData.progresoTemario = {};
  }

  moduleData.temario.forEach(unit => {
    if (!unit.idUnidad) {
      unit.idUnidad = `u-${generateUUID()}`;
    }

    unit.puntos.forEach((point, index) => {
      // Si el punto es un string, lo convertimos a objeto
      if (typeof point === 'string') {
        // --- CORRECCIÓN ---
        // Modificamos el array original en lugar de reasignar una copia.
        unit.puntos[index] = { texto: point };
      }
      if (!point.idPunto) {
        point.idPunto = `p-${generateUUID()}`;
      }
      // Sincronizamos el estado de progreso, si no existe lo inicializamos
      if (moduleData.progresoTemario[point.idPunto] === undefined) {
        moduleData.progresoTemario[point.idPunto] = 'no-visto';
      }
    });
  });

}

/**
 * Elimina una unidad del temario de un módulo.
 * @param {object} db - El objeto de la base de datos.
 * @param {string} moduleId - El ID del módulo.
 * @param {string} unitId - El ID de la unidad a eliminar.
 */
export function deleteTemarioUnit(db, moduleId, unitId) {
  const module = db.modules.find(m => m.id === moduleId);
  if (module && module.temario) {
    module.temario = module.temario.filter(unit => unit.idUnidad !== unitId);
  }
}

/**
 * Elimina un punto específico de una unidad del temario.
 * @param {object} db - El objeto de la base de datos.
 * @param {string} moduleId - El ID del módulo.
 * @param {string} unitId - El ID de la unidad que contiene el punto.
 * @param {string} pointId - El ID del punto a eliminar.
 */
export function deleteTemarioPoint(db, moduleId, unitId, pointId) {
  const module = db.modules.find(m => m.id === moduleId);
  const unit = module?.temario?.find(u => u.idUnidad === unitId);
  if (unit && unit.puntos) {
    unit.puntos = unit.puntos.filter(point => point.idPunto !== pointId);
  }
}