/**
 * Módulo para renderizar y gestionar la vista de "Progreso del Temario".
 */
import { prepareModuleForProgressTracking } from './utils.js';

// Mapa de estados a iconos para la UI.
const statusConfig = {
  'visto': { icon: '✅', text: 'Visto', description: 'Tema impartido y completado.' },
  'no-visto': { icon: '🔲', text: 'No Visto', description: 'Tema aún no abordado en clase (estado por defecto).' },
  'pendiente': { icon: '❗', text: 'Pendiente', description: 'Tema iniciado pero no completado, o que requiere un repaso.' },
  'omitido': { icon: '❌', text: 'Omitido', description: 'Decidido activamente no impartir este punto del temario.' }
};

/**
 * Renderiza la vista completa del progreso del temario en un contenedor.
 * @param {HTMLElement} container - El elemento del DOM donde se renderizará la vista.
 * @param {object} moduleData - El objeto completo de datos del módulo.
 * @param {function} onDataChange - Callback que se ejecuta para guardar los datos tras un cambio.
 */
export function renderProgressView(container, moduleData, onDataChange) {
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

  // 1. Crear un mapa para buscar rápidamente qué actividades evalúan cada CE.
  const ceToActivityMap = new Map();
  const moduleActivities = moduleData.actividades || []; // Usar las actividades del módulo si existen
  if (moduleActivities) {
    moduleActivities.forEach(activity => {
      activity.ceIds.forEach(ceId => {
        if (!ceToActivityMap.has(ceId)) ceToActivityMap.set(ceId, []);
        ceToActivityMap.get(ceId).push(activity.name);
      });
    });
  }

  container.innerHTML = `
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-2xl font-bold">Índice de Contenidos</h2>
      <div class="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400"
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

  moduleData.temario.forEach(unit => {
    const unitElement = document.createElement('div');
    unitElement.className = 'unit-section bg-white dark:bg-gray-800 p-4 rounded-lg shadow';
    unitElement.innerHTML = `<h3 class="text-lg font-semibold mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">${unit.unidad}</h3>`;

    const pointsList = document.createElement('ul');
    pointsList.className = 'points-list space-y-2';

    unit.puntos.forEach(point => {
      const pointStatus = moduleData.progresoTemario[point.idPunto] || 'no-visto';
      const { icon } = statusConfig[pointStatus];

      // 2. Buscar las actividades asociadas a este punto del temario
      const associatedActivities = (point.ce_ids || [])
        .flatMap(ceId => ceToActivityMap.get(ceId) || [])
        .filter((value, index, self) => self.indexOf(value) === index); // Eliminar duplicados

      let evaluationBadge = '';
      if (associatedActivities.length > 0) {
        const activityList = associatedActivities.join(', ');
        evaluationBadge = `<span class="ml-2 text-xs font-semibold text-yellow-800 bg-yellow-100 dark:text-yellow-100 dark:bg-yellow-800 px-2 py-0.5 rounded-full" title="Evaluado en: ${activityList}">Evaluado</span>`;
      }

      const pointItem = document.createElement('li');
      pointItem.className = 'point-item flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors';
      pointItem.dataset.pointId = point.idPunto; // ID para identificar el punto
      pointItem.innerHTML = `
        <span class="point-status-icon mr-3">${icon}</span>
        <span class="point-text flex-grow">${point.texto}</span>
        ${evaluationBadge}
      `;
      
      // Añadimos el listener para cambiar el estado al hacer clic
      pointItem.addEventListener('click', () => {
        // Pasamos el árbol jerárquico a la función de cambio de estado
        handleStatusChange(point.idPunto, moduleData, onDataChange, pointTree);
        renderProgressView(container, moduleData, onDataChange);
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
    case 'no-visto':
      nextStatus = 'visto';
      break;
    case 'visto':
      nextStatus = 'pendiente';
      break;
    case 'pendiente':
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
        "1.1. Primer punto",
        "1.2. Segundo punto"
      ]
    },
    {
      "unidad": "UD 2: Otra Unidad",
      "puntos": [
        "2.1. Subapartado A",
        "2.2. Subapartado B"
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
      renderProgressView(container, moduleData, onDataChange); // Re-renderizamos la vista
    } catch (error) {
      alert('Error en el formato JSON. Por favor, revisa el texto introducido.');
      console.error("Error al parsear JSON del temario:", error);
    }
  });
}