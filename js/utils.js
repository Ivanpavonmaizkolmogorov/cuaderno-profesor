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
 * @param {object} moduleData - El objeto completo de datos del módulo.
 * @returns {object} El objeto del módulo modificado.
 */
export function prepareModuleForProgressTracking(moduleData) {
  // Si no existe 'temario' pero sí 'resultados_de_aprendizaje', lo construimos desde ud_ref.
  if (!moduleData.temario && moduleData.resultados_de_aprendizaje) {
    console.log("Construyendo 'temario' desde 'ud_ref' en los Criterios de Evaluación.");
    const udMap = new Map(); // Mapa para agrupar puntos por nombre de unidad

    moduleData.resultados_de_aprendizaje.forEach(ra => {
      ra.criterios_de_evaluacion.forEach(ce => {
        if (!ce.ud_ref) return;

        // Manejar múltiples referencias en un solo string, ej: "UD 2, UD 3"
        const udRefs = ce.ud_ref.split(',').map(ref => ref.trim());

        udRefs.forEach(ref => {
          // Separar la UD del punto del temario. Ej: "UD 10: 1. La gestión"
          const parts = ref.split(/:(.*)/s); // Divide en el primer ':'
          const unitName = parts[0].trim();
          const pointText = parts[1] ? parts[1].trim() : ce.ce_descripcion; // <-- ¡LA CLAVE ESTÁ AQUÍ!

          // Usamos el texto del punto como clave para agrupar CEs que apunten al mismo punto
          const pointKey = pointText;

          if (!udMap.has(unitName)) {
            udMap.set(unitName, new Map());
          }
          if (!udMap.get(unitName).has(pointKey)) {
            udMap.get(unitName).set(pointKey, { texto: pointText, ce_ids: [] });
          }
          // Añadimos el ce_id al punto correspondiente
          udMap.get(unitName).get(pointKey).ce_ids.push(ce.ce_id);
        });
      });
    });

    // Convertir el mapa a la estructura final de 'temario'
    moduleData.temario = Array.from(udMap.entries()).map(([unitName, pointsMap]) => ({
      idUnidad: `u-${generateUUID()}`, // Generamos ID nuevo ya que se basa en texto
      unidad: unitName,
      puntos: Array.from(pointsMap.values()).map(pointData => ({
        idPunto: `p-${generateUUID()}`, // Generamos ID nuevo
        texto: pointData.texto,
        ce_ids: pointData.ce_ids // Guardamos los CE IDs asociados
      }))
    })).sort((a, b) => a.unidad.localeCompare(b.unidad, undefined, { numeric: true })); // Ordenar UDs
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
        point = unit.puntos[index] = { texto: point };
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

  return moduleData;
}