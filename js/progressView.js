/**
 * Módulo para renderizar y gestionar la vista de "Progreso del Temario".
 */
import * as handlers from './handlers.js';
import { renderApp } from './main.js';
import { prepareModuleForProgressTracking } from './utils.js';

// Mapa de estados a iconos para la UI.
const statusConfig = {
  'visto': { icon: '✅', text: 'Visto', description: 'Tema impartido y completado.' },
  'no-visto': { icon: '🔲', text: 'No Visto', description: 'Tema aún no abordado en clase (estado por defecto).' },
  'pendiente': { icon: '❗', text: 'Pendiente', description: 'Tema iniciado pero no completado, o que requiere un repaso.' },
  'omitido': { icon: '❌', text: 'Omitido', description: 'Decidido activamente no impartir este punto del temario.' },
  'en-empresa': { icon: '🏢', text: 'En Empresa', description: 'Contenido de FP Dual que se imparte/evalúa en la empresa.' },
};

/**
 * Renderiza la vista completa del progreso del temario en un contenedor.
 * @param {HTMLElement} container - El elemento del DOM donde se renderizará la vista.
 * @param {object} moduleData - El objeto completo de datos del módulo.
 * @param {Array<object>} allActivities - La lista completa de actividades de la base de datos.
 * @param {function} onDataChange - Callback que se ejecuta para guardar los datos tras un cambio.
 */
export function renderProgressView(container, moduleData, allActivities, onDataChange) {
  // --- COMIENZO DE LA CORRECCIÓN ---
  // Comprobación de seguridad: si no se pasan datos del módulo, mostramos un error y salimos.
  if (!moduleData) {
    container.innerHTML = `<div class="p-4 text-center text-red-500">Error: No se pudo cargar la vista de progreso porque no se proporcionaron los datos del módulo.</div>`;
    console.error("Se intentó renderizar la vista de progreso sin datos del módulo (moduleData es undefined).");
    return;
  }

  // --- INICIO: CORRECCIÓN DEFINITIVA DE LISTENERS ---
  // Movemos la adición de listeners al principio de la función.
  // Esto garantiza que los botones principales como "Importar" siempre funcionen,
  // incluso si el módulo aún no tiene un temario definido y la función sale prematuramente.
  
  // --- INICIO: CORRECCIÓN DE MÚLTIPLES LISTENERS ---
  // Evitamos añadir el listener si ya existe uno en el contenedor.
  if (container.dataset.listenerAttached === 'true') return;
  container.dataset.listenerAttached = 'true';
  // --- FIN: CORRECCIÓN DE MÚLTIPLES LISTENERS ---
console.log('[LOG] Añadiendo listener de clics para el contenedor de la vista de progreso.');
  container.addEventListener('click', (e) => {
    console.log('[LOG] Clic detectado en la vista de progreso. Elemento clickeado:', e.target);

    const importBtn = e.target.closest('#import-temario-btn');
    if (importBtn) {
      e.preventDefault();
      console.log('[LOG] Botón "Importar Temario" presionado. Llamando a showImportTemarioModal...');
      handlers.showImportTemarioModal();
    }

    const deleteTemarioBtn = e.target.closest('#delete-temario-btn');
    if (deleteTemarioBtn) {
      e.preventDefault();
      console.log('[LOG] Botón "Eliminar Temario" presionado. Llamando a handleDeleteTemario...');
      handlers.handleDeleteTemario(moduleData.id);
    }

    const deleteUnitBtn = e.target.closest('.delete-unit-btn');
    if (deleteUnitBtn) {
      e.preventDefault();
      e.stopPropagation();
      const { moduleId, unitId } = deleteUnitBtn.dataset;
      console.log(`[LOG] Botón "Eliminar Unidad" presionado. ModuleID: ${moduleId}, UnitID: ${unitId}`);
      handlers.handleDeleteTemarioUnit(moduleId, unitId);
    }

    // --- INICIO: LÓGICA DE CLIC CENTRALIZADA ---
    const pointItem = e.target.closest('.point-item');
    if (pointItem) {
      const pointId = pointItem.dataset.pointId;

      if (e.target.closest('.delete-point-btn')) {
        // Clic en el botón de borrar punto
        const { unitId } = e.target.closest('.delete-point-btn').dataset;
        handlers.handleDeleteTemarioPoint(moduleData.id, unitId, pointId);
      } else if (e.target.closest('.remove-evaluated-override-btn')) {
        // Clic en la 'x' para anular 'Evaluado'
        e.stopPropagation(); // ¡CRÍTICO! Evita que se dispare el cambio de estado normal.
        handlers.handleOverrideTemarioEvaluado(moduleData.id, pointId);
      } else {
        // Clic en cualquier otra parte del item (icono, texto) para cambiar estado
        handleStatusChange(pointId, moduleData, onDataChange, pointTree);
      }
    }
    // --- FIN: LÓGICA DE CLIC CENTRALIZADA ---
  });
  // --- FIN: CORRECCIÓN DEFINITIVA DE LISTENERS ---

  // --- FIN DE LA CORRECCIÓN ---
  // --- INICIO: Lógica para construir el árbol jerárquico ---
  const pointTree = new Map(); // Mapa para almacenar la jerarquía: idPunto -> { point, children: [idPunto] }

  moduleData.temario?.forEach(unit => {
    // Primero, poblamos el mapa con todos los puntos
    unit.puntos.forEach(point => {
      pointTree.set(point.idPunto, { point, children: [] });
    });

    // Segundo, establecemos las relaciones padre-hijo
    unit.puntos.forEach(potentialParent => {
      const parentNumber = potentialParent.texto.match(/^([\d\.]+)/)?.[0];
      if (!parentNumber) return;

      unit.puntos.forEach(potentialChild => {
        if (potentialParent.idPunto === potentialChild.idPunto) return;
        const childNumber = potentialChild.texto.match(/^([\d\.]+)/)?.[0];
        if (childNumber && childNumber.startsWith(parentNumber) && childNumber.length > parentNumber.length) {
          pointTree.get(potentialParent.idPunto)?.children.push(potentialChild.idPunto);
        }
      });
    });
  });
  // --- FIN: Lógica del árbol ---
  
  // 1. Crear mapas para búsquedas rápidas y eficientes
  const ceToActivityMap = new Map();
  const ceDataMap = new Map();

  // Mapa para datos de Criterios de Evaluación (ej: para saber si es 'dual')
  moduleData.resultados_de_aprendizaje?.forEach(ra => {
    ra.criterios_de_evaluacion.forEach(ce => {
      ceDataMap.set(ce.ce_id, ce);
    });
  });

  // Mapa para saber qué actividades evalúan cada Criterio
  // Filtramos para obtener solo las actividades de este módulo
  const moduleActivities = allActivities.filter(act => act.moduleId === moduleData.id);
  moduleActivities.forEach(activity => {
      activity.ceIds.forEach(ceId => {
        if (!ceToActivityMap.has(ceId)) ceToActivityMap.set(ceId, []);
        ceToActivityMap.get(ceId).push(activity.name);
      });
    });
  
  
  container.innerHTML = `
    <div class="flex justify-between items-start mb-4">
      <div class="flex items-center gap-4">
        <h2 class="text-2xl font-bold">Índice de Contenidos</h2>
        <!-- Contenedor para los botones de acción del índice -->
        <div id="temario-actions-container" class="flex items-center gap-2">
          <button id="import-temario-btn" class="bg-blue-500 hover:bg-blue-700 text-white text-xs font-bold py-1 px-2 rounded" title="Importar y fusionar o reemplazar el índice">
            Importar
          </button>
          <button id="delete-temario-btn" class="${!moduleData.temario || moduleData.temario.length === 0 ? 'hidden' : ''} bg-red-500 hover:bg-red-700 text-white text-xs font-bold py-1 px-2 rounded" title="Eliminar el índice de contenidos actual">
            Eliminar
          </button>
        </div>
      </div>
      <div class="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
        <div class="tooltip">
          <span class="cursor-help">${statusConfig['visto'].icon} ${statusConfig['visto'].text}</span>
          <span class="tooltip-text">${statusConfig['visto'].description}</span>
        </div>
        <div class="tooltip">
          <span class="cursor-help">${statusConfig['pendiente'].icon} ${statusConfig['pendiente'].text}</span>
          <span class="tooltip-text">${statusConfig['pendiente'].description}</span>
        </div>
        <div class="tooltip">
          <span class="cursor-help">${statusConfig['omitido'].icon} ${statusConfig['omitido'].text}</span>
          <span class="tooltip-text">${statusConfig['omitido'].description}</span>
        </div>
        <div class="tooltip">
          <span class="cursor-help">${statusConfig['en-empresa'].icon} ${statusConfig['en-empresa'].text}</span>
          <span class="tooltip-text">${statusConfig['en-empresa'].description}</span>
        </div>
        <div class="tooltip">
          <span class="cursor-help">${statusConfig['no-visto'].icon} ${statusConfig['no-visto'].text}</span>
          <span class="tooltip-text">${statusConfig['no-visto'].description}</span>
        </div>
      </div>
    </div>
  `;
  
  const listContainer = document.createElement('div');
  listContainer.className = 'progress-view-container space-y-6';

  if (!moduleData.temario || moduleData.temario.length === 0) {
    listContainer.innerHTML = /*html*/`
      <div class="text-center py-10 px-6 bg-white dark:bg-gray-800 rounded-lg shadow">
        <p class="text-gray-500 dark:text-gray-400">No hay temario definido para este módulo. Usa el botón "Importar" de arriba para empezar.</p>
      </div>
    `;
    container.appendChild(listContainer);
    return;
  }

  moduleData.temario.forEach(unit => {
    const unitElement = document.createElement('div');
    unitElement.className = 'unit-section bg-white dark:bg-gray-800 p-4 rounded-lg shadow';
    unitElement.innerHTML = `
      <div class="flex justify-between items-center mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">
        <h3 class="text-lg font-semibold">${unit.unidad}</h3>
        <button class="delete-unit-btn text-red-500 hover:text-red-700 text-sm font-medium" data-module-id="${moduleData.id}" data-unit-id="${unit.idUnidad}" title="Eliminar esta unidad y todos sus puntos">
          Eliminar Unidad
        </button>
      </div>
    `;

    const pointsList = document.createElement('ul');
    pointsList.className = 'points-list space-y-2';

    unit.puntos.forEach(point => {
      // --- INICIO: LÓGICA DE INDENTACIÓN MEJORADA ---
      // Extraemos el prefijo numérico (ej: "1.1" o "2.3.4.") del texto, sin requerir un espacio después.
      const numberPrefix = point.texto.match(/^[\d\.]+/)?.[0] || '';
      // Contamos los segmentos numéricos para determinar el nivel de anidación.
      // "1" o "1." -> 1 segmento -> nivel 0
      // "1.1" o "1.1." -> 2 segmentos -> nivel 1
      // "1.1.1" o "1.1.1." -> 3 segmentos -> nivel 2
      const segments = numberPrefix.split('.').filter(Boolean); // Filtramos para eliminar strings vacíos si termina en punto.
      const level = Math.max(0, segments.length - 1);
      // Calculamos la sangría a aplicar. Usamos 1.5rem por cada nivel de profundidad.
      const indentationStyle = level > 0 ? `padding-left: ${level * 1.5}rem;` : '';
      // --- FIN: LÓGICA DE INDENTACIÓN ---

      // --- INICIO: LÓGICA DE ESTADO INTELIGENTE ---
      const associatedCeIds = point.ce_ids || [];
      let evaluationBadge = '';
      let pointStatus = moduleData.progresoTemario[point.idPunto] || 'no-visto';
      
      const evaluatedInActivities = associatedCeIds
        .flatMap(ceId => ceToActivityMap.get(ceId) || []);
      
      // Comprobamos si el usuario ha anulado manualmente la etiqueta "Evaluado"
      const isOverridden = moduleData.temarioOverrides?.[point.idPunto]?.isEvaluated === false;

      if (evaluatedInActivities.length > 0 && !isOverridden) {
        const uniqueActivities = [...new Set(evaluatedInActivities)];
        evaluationBadge = `
          <span class="flex items-center gap-1 ml-2 text-xs font-semibold text-yellow-800 bg-yellow-100 dark:text-yellow-100 dark:bg-yellow-800 px-2 py-0.5 rounded-full" title="Evaluado en: ${uniqueActivities.join(', ')}">
            Evaluado
            <button class="remove-evaluated-override-btn text-yellow-600 hover:text-yellow-900 dark:text-yellow-300 dark:hover:text-white" data-module-id="${moduleData.id}" data-point-id="${point.idPunto}" title="Marcar como 'No Visto' y ocultar esta etiqueta.">
              &times;
            </button>
          </span>`;

        // --- INICIO DE LA CORRECCIÓN ---
        // Si el punto está evaluado y su estado es 'no-visto', lo actualizamos a 'visto'.
        if (pointStatus === 'no-visto' && !isOverridden) {
          pointStatus = 'visto'; // Actualizamos el estado solo para la visualización inmediata.
          // No guardamos este cambio, ya que es una conveniencia visual. El guardado real
          // lo hace el usuario al hacer clic en el icono de estado.
        }
        // --- FIN DE LA CORRECCIÓN ---
      }
      // --- FIN: LÓGICA DE ESTADO INTELIGENTE ---

      const { icon } = statusConfig[pointStatus];
      const pointItem = document.createElement('li');
      pointItem.className = 'point-item group flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors';
      pointItem.dataset.pointId = point.idPunto; // ID para identificar el punto
      pointItem.style.cssText = indentationStyle; // Aplicamos la sangría calculada
      pointItem.innerHTML = `
        <span class="point-status-icon mr-3 cursor-pointer">${icon}</span>
        <span class="point-text flex-grow cursor-pointer">${point.texto}</span>
        ${evaluationBadge}
        <button class="delete-point-btn text-red-400 hover:text-red-600 ml-2 text-lg leading-none opacity-0 group-hover:opacity-100 transition-opacity" data-unit-id="${unit.idUnidad}" data-point-id="${point.idPunto}" title="Eliminar este punto">
          &times;
        </button>
      `;
      
      pointsList.appendChild(pointItem);
    });

    unitElement.appendChild(pointsList);
    listContainer.appendChild(unitElement);
  });

  container.appendChild(listContainer);

}

/**
 * Gestiona el cambio de estado de un punto del temario.
 * El orden del ciclo es: no-visto -> visto -> pendiente -> omitido -> no-visto
 * @param {string} pointId - El ID del punto que se está actualizando.
 * @param {object} moduleData - El objeto de datos del módulo.
 * @param {function} onDataChange - Callback para guardar los datos.
 * @param {Map} pointTree - El mapa que representa la jerarquía del temario.
 */
function handleStatusChange(pointId, moduleData, onDataChange, pointTree) {
  const currentStatus = moduleData.progresoTemario[pointId] || 'no-visto';
  let nextStatus;

  switch (currentStatus) {
    case 'no-visto': // El ciclo ahora empieza en visto
      nextStatus = 'visto';
      break;
    case 'visto':
      nextStatus = 'pendiente';
      break;
    case 'pendiente':
      nextStatus = 'en-empresa'; // Añadimos el nuevo estado al ciclo
      break;
    case 'en-empresa':
      nextStatus = 'omitido';
      break;
    case 'omitido':
      nextStatus = 'no-visto';
      break;
    default:
      nextStatus = 'no-visto';
  }

  // Función recursiva para actualizar el estado de un punto y todos sus descendientes
  const updateStatusRecursively = (currentPointId, status) => {
    moduleData.progresoTemario[currentPointId] = status;
    const node = pointTree.get(currentPointId);
    if (node && node.children.length > 0) {
      node.children.forEach(childId => {
        updateStatusRecursively(childId, status);
      });
    }
  };

  updateStatusRecursively(pointId, nextStatus);

  // Ejecutamos el callback de guardado que nos pasaron.
  if (onDataChange) {
    onDataChange();
  }
  renderApp(); // Llamamos a renderApp para un refresco global y consistente.
}

/**
 * Muestra un modal para importar el temario desde un JSON.
 * @param {string} moduleId - El ID del módulo al que se importará el temario.
 * @returns {string} El HTML del modal.
 */
export function renderImportTemarioModal(moduleId) {
  const modalContainerId = 'import-temario-modal-container';

  const templateJSON = JSON.stringify([
    {
      "unidad": "UD 1: Título de la Unidad",
      "puntos": [
        {
          "texto": "1.1. Primer punto",
          "ce_ids": ["RA1-a", "RA1-b"]
        },
        {
          "texto": "1.2. Segundo punto",
          "ce_ids": ["RA1-c"]
        }
      ]
    },
    {
      "unidad": "UD 2: Otra Unidad",
      "puntos": [
        {
          "texto": "2.1. Subapartado A (sin criterios asociados)",
          "ce_ids": []
        }
      ]
    }
  ], null, 2);

  const modalHTML = /*html*/`
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
      <div class="p-6 border-b dark:border-gray-700">
        <h3 class="text-xl font-bold">Importar Índice de Contenidos</h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">Pega el JSON del temario con la estructura de Unidades y Puntos.</p>
      </div>
      <div class="p-6 overflow-y-auto">
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Modo de Importación</label>
          <div class="flex gap-4">
            <label class="flex items-center gap-2"><input type="radio" name="importMode" value="merge" checked class="form-radio"> Fusionar (Añadir y actualizar)</label>
            <label class="flex items-center gap-2"><input type="radio" name="importMode" value="replace" class="form-radio"> Reemplazar (Borrar y sustituir)</label>
          </div>
        </div>
        <textarea id="temario-json-textarea" class="w-full h-64 p-3 font-mono text-xs border rounded-md dark:bg-gray-900">${templateJSON}</textarea>
      </div>
      <div class="p-6 border-t dark:border-gray-700 flex justify-end gap-4">
        <button id="cancel-import-temario" class="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg">Cancelar</button>
        <button id="confirm-import-temario" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Importar Índice</button>
      </div>
    </div>
  `;

  // Envolvemos el HTML en el contenedor del modal
  return `
    <div id="${modalContainerId}" class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      ${modalHTML}
    </div>
  `;
}