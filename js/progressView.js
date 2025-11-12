/**
 * Módulo para renderizar y gestionar la vista de "Progreso del Temario".
 */
import { prepareModuleForProgressTracking } from './utils.js';

// Mapa de estados a iconos para la UI.
const statusConfig = {
  'visto': { icon: '✅', text: 'Visto', description: 'Tema impartido y completado.' },
  'no-visto': { icon: '🔲', text: 'No Visto', description: 'Tema aún no abordado en clase (estado por defecto).' },
  'pendiente': { icon: '❗', text: 'Pendiente', description: 'Tema iniciado pero no completado, o que requiere un repaso.' },
  'omitido': { icon: '❌', text: 'Omitido', description: 'Decidido activamente no impartir este punto del temario.' },
  'en-empresa': { icon: '🏢', text: 'En Empresa', description: 'Contenido de FP Dual que se imparte/evalúa en la empresa.' }
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
        <button id="delete-temario-btn" class="hidden bg-red-500 hover:bg-red-700 text-white text-xs font-bold py-1 px-2 rounded" title="Eliminar el índice de contenidos actual">
          Eliminar Índice
        </button>
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
    listContainer.innerHTML = `
      <div class="text-center py-10 px-6 bg-white dark:bg-gray-800 rounded-lg shadow">
        <p class="text-gray-500 dark:text-gray-400 mb-4">No hay temario definido para este módulo.</p>
        <button id="import-temario-btn" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
          Importar Índice
        </button>
      </div>
    `;
    container.appendChild(listContainer);

    document.getElementById('import-temario-btn').addEventListener('click', () => {
      showImportTemarioModal(container, moduleData, onDataChange);
    });

    return;
  }

  // Si hay temario, mostramos el botón de eliminar
  const deleteBtn = document.getElementById('delete-temario-btn');
  if (deleteBtn) {
    deleteBtn.classList.remove('hidden');
    deleteBtn.addEventListener('click', () => {
      if (confirm('¿Estás seguro de que quieres eliminar todo el índice de contenidos de este módulo? Esta acción no se puede deshacer.')) {
        moduleData.temario = [];
        moduleData.progresoTemario = {};
        onDataChange(); // Esto llamará a state.saveDB()
        renderProgressView(container, moduleData, onDataChange);
      }
    });
  }

  moduleData.temario.forEach(unit => {
    const unitElement = document.createElement('div');
    unitElement.className = 'unit-section bg-white dark:bg-gray-800 p-4 rounded-lg shadow';
    unitElement.innerHTML = `<h3 class="text-lg font-semibold mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">${unit.unidad}</h3>`;

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

      const isDual = associatedCeIds.some(ceId => ceDataMap.get(ceId)?.dual === true);
      const evaluatedInActivities = associatedCeIds
        .flatMap(ceId => ceToActivityMap.get(ceId) || []);
      
      // Lógica de inteligencia:
      if (pointStatus === 'no-visto') {
        if (isDual) {
          pointStatus = 'en-empresa'; // Si es dual, su estado por defecto es "En Empresa"
        }
        if (evaluatedInActivities.length > 0) {
          pointStatus = 'visto'; // Si está evaluado, se marca como "Visto"
        }
        // Actualizamos el estado en la base de datos para mantener la consistencia
        moduleData.progresoTemario[point.idPunto] = pointStatus;
      }
      
      if (evaluatedInActivities.length > 0) {
        const uniqueActivities = [...new Set(evaluatedInActivities)];
        evaluationBadge = `<span class="ml-2 text-xs font-semibold text-yellow-800 bg-yellow-100 dark:text-yellow-100 dark:bg-yellow-800 px-2 py-0.5 rounded-full" title="Evaluado en: ${uniqueActivities.join(', ')}">Evaluado</span>`;
      }
      // --- FIN: LÓGICA DE ESTADO INTELIGENTE ---

      const { icon } = statusConfig[pointStatus];
      const pointItem = document.createElement('li');
      pointItem.className = 'point-item flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors';
      pointItem.dataset.pointId = point.idPunto; // ID para identificar el punto
      pointItem.style.cssText = indentationStyle; // Aplicamos la sangría calculada
      pointItem.innerHTML = `
        <span class="point-status-icon mr-3">${icon}</span>
        <span class="point-text flex-grow">${point.texto}</span>
        ${evaluationBadge}
      `;
      
      // Añadimos el listener para cambiar el estado al hacer clic
      pointItem.addEventListener('click', () => {
        // Pasamos el árbol jerárquico a la función de cambio de estado
        handleStatusChange(point.idPunto, moduleData, onDataChange, pointTree);
        renderProgressView(container, moduleData, allActivities, onDataChange);
      });

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
    console.log(`Estado de ${pointId} cambiado a ${nextStatus}. Guardando datos...`);
    onDataChange();
  }
}

/**
 * Muestra un modal para importar el temario desde un JSON.
 * @param {HTMLElement} container - El contenedor principal para re-renderizar.
 * @param {object} moduleData - El objeto de datos del módulo.
 * @param {function} onDataChange - Callback para guardar los datos.
 */
function showImportTemarioModal(container, moduleData, onDataChange) {
  const modalContainer = document.createElement('div');
  modalContainer.id = 'import-temario-modal';
  modalContainer.className = 'fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4';

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

  modalContainer.innerHTML = `
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
      <div class="p-6 border-b dark:border-gray-700">
        <h3 class="text-xl font-bold">Importar Índice de Contenidos</h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">Pega el JSON del temario con la estructura de Unidades y Puntos.</p>
      </div>
      <div class="p-6 overflow-y-auto">
        <textarea id="temario-json-textarea" class="w-full h-64 p-3 font-mono text-xs border rounded-md dark:bg-gray-900">${templateJSON}</textarea>
      </div>
      <div class="p-6 border-t dark:border-gray-700 flex justify-end gap-4">
        <button id="cancel-import-temario" class="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg">Cancelar</button>
        <button id="confirm-import-temario" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Guardar Índice</button>
      </div>
    </div>
  `;

  document.body.appendChild(modalContainer);

  const closeModal = () => document.body.removeChild(modalContainer);

  document.getElementById('cancel-import-temario').addEventListener('click', closeModal);
  document.getElementById('confirm-import-temario').addEventListener('click', () => {
    try {
      const newTemario = JSON.parse(document.getElementById('temario-json-textarea').value);
      moduleData.temario = newTemario; // Actualizamos el temario en el objeto del módulo
      prepareModuleForProgressTracking(moduleData); // Preparamos la nueva estructura
      onDataChange(); // Guardamos los cambios
      closeModal();
      renderProgressView(container, moduleData, allActivities, onDataChange); // Re-renderizamos la vista
    } catch (error) {
      alert('Error en el formato JSON. Por favor, revisa el texto introducido.');
      console.error("Error al parsear JSON del temario:", error);
    }
  });
}