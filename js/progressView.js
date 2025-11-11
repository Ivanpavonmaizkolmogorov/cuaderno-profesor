/**
 * Módulo para renderizar y gestionar la vista de "Progreso del Temario".
 */

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
    listContainer.innerHTML = '<p class="text-gray-500">No hay temario definido para este módulo.</p>';
    container.appendChild(listContainer);
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
        handleStatusChange(point.idPunto, moduleData, onDataChange);
        // Re-renderizamos para reflejar el cambio al instante
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
 */
function handleStatusChange(pointId, moduleData, onDataChange) {
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

  moduleData.progresoTemario[pointId] = nextStatus;

  // Ejecutamos el callback de guardado que nos pasaron.
  if (onDataChange) {
    console.log(`Estado de ${pointId} cambiado a ${nextStatus}. Guardando datos...`);
    onDataChange();
  }
}