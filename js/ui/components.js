import { ICONS } from './constants.js';
import { isConnected, getConnectedFileName, getUI } from '../state.js';

// Renderiza la cabecera
export function renderHeader(page, db) {
  const navClass = (targetPage) =>
    `flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${page === targetPage
      ? 'bg-blue-600 text-white'
      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
    }`;

  const connected = isConnected();
  const fileName = getConnectedFileName();

  const connectButtonHtml = connected
    ? `
        <div class="flex items-center gap-2 px-3 py-2 text-sm text-white bg-green-600 rounded-lg">
            <span>✔️ Conectado a: ${fileName}</span>
            <button id="disconnect-btn" class="ml-2 text-green-200 hover:text-white" title="Desconectar">&times;</button>
        </div>
      `
    : `<button id="connect-btn" class="flex items-center gap-2 px-3 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg">Conectar a JSON</button>`;

  return `
    <div class="container mx-auto px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
      <h1 class="text-2xl font-bold text-center sm:text-left">Cuaderno del Profesor</h1>
      <nav class="flex flex-wrap justify-center gap-2 sm:gap-4">
        ${connectButtonHtml}
        <button data-page="modulos" class="${navClass('modulos')}">
          ${ICONS.BookOpen}
          <span>Módulos (${db.modules.length})</span>
        </button>
        <button data-page="alumnos" class="${navClass('alumnos')}">
          ${ICONS.Users}
          <span>Alumnos/as (${db.students.length})</span>
        </button>
        <button data-page="configuracion" class="${navClass('configuracion')}">
          ${ICONS.Settings}
          <span>Config.</span>
        </button>
        <button data-page="crypto" class="${navClass('crypto')}">
          ${ICONS.FileText}
          <span>Generador Tareas</span>
        </button>
      </nav>
    </div>
  `;
}

/**
 * Renderiza la barra de búsqueda flotante.
 * @param {object} searchState - El estado actual de la búsqueda.
 * @returns {string} El HTML de la barra de búsqueda.
 */
export function renderSearchBar(searchState) {
  if (!searchState.isActive) {
    return ''; // No renderizar nada si no está activa
  }

  const { query, results, currentIndex } = searchState;
  const total = results.length;
  const current = currentIndex + 1;

  return `
    <div id="search-bar" class="fixed top-4 right-4 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-2 flex items-center gap-2 z-50 border border-gray-300 dark:border-gray-600">
      <input 
        type="text" 
        id="search-input" 
        placeholder="Buscar en la página..." 
        value="${query}"
        class="p-1 border-none rounded-md bg-gray-100 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 w-48 text-sm"
      >
      <span class="text-sm text-gray-500 dark:text-gray-400 w-16 text-center">
        ${total > 0 ? `${current} de ${total}` : (query.length > 1 ? '0 de 0' : '')}
      </span>
      <button id="search-prev-btn" class="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50" ${total === 0 ? 'disabled' : ''} title="Anterior (Shift+Enter)">
        ${ICONS.ChevronUp || '▲'}
      </button>
      <button id="search-next-btn" class="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50" ${total === 0 ? 'disabled' : ''} title="Siguiente (Enter)">
        ${ICONS.ChevronDown || '▼'}
      </button>
      <button id="search-close-btn" class="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700" title="Cerrar (Esc)">
        &times;
      </button>
    </div>
  `;
}

export function renderRaAccordion(ra, studentGrades, calculatedRaGrade, studentId, isReadOnly = false, allActividades = [], allStudentGrades = {}) {
  const contentId = `ra-content-${ra.ra_id}`;
  const ui = getUI();
  const isExpanded = ui?.expandedRaId === ra.ra_id;

  return `
    <div class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button class="ra-accordion-toggle w-full flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors" data-content-id="${contentId}" data-ra-id="${ra.ra_id}">
        <div class="text-left">
          <h4 class="font-semibold text-gray-900 dark:text-white">${ra.ra_id}</h4>
          <p class="text-sm text-gray-600 dark:text-gray-400">${ra.ra_descripcion}</p>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-lg font-bold text-blue-700 dark:text-blue-300">
             ${(typeof calculatedRaGrade === 'number') ? calculatedRaGrade.toFixed(2) : '0.00'}
          </span>
          <span class="chevron-icon transform transition-transform ${isExpanded ? 'rotate-90' : ''}">${ICONS.ChevronRight}</span>
        </div>
      </button>
      <div id="${contentId}" class="accordion-content ${isExpanded ? '' : 'hidden'} p-4 bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
        ${ra.criterios_de_evaluacion.map(ce => {
    // En la vista de alumno/a, la nota del CE es la final calculada, no la de una actividad específica.
    // Buscamos la nota final del CE en el objeto de notas del estudiante.
    // Esto es una simplificación. La nota final del CE se calcula a partir de las actividades.
    // Para la vista de solo lectura, mostraremos la nota final de la actividad que lo evalúa.
    const actividadesQueEvaluanEsteCE = allActividades.filter(act => act.ceIds.includes(ce.ce_id));
    const notasDeActividades = actividadesQueEvaluanEsteCE.map(act => {
      const attempts = allStudentGrades[act.id] || [];
      if (attempts.length === 0) return null;
      const maxGrade = Math.max(...attempts.map(a => a.grade));
      return {
        name: act.name,
        grade: maxGrade,
        trimestre: act.trimestre
      };
    }).filter(n => n !== null);


    const grade = studentGrades[ce.ce_id]; // Esto es una simplificación, la nota final del CE viene de las actividades
    return `
            <div key="${ce.ce_id}" class="grid grid-cols-1 md:grid-cols-4 gap-4 py-4 items-center">
              <div class="md:col-span-3 flex flex-col gap-2">
                <div class="flex items-center gap-2">
                  <button class="toggle-dual-btn p-1 rounded-md ${ce.dual ? 'bg-blue-100 dark:bg-blue-900 text-blue-600' : 'bg-gray-200 dark:bg-gray-600 text-gray-500'} hover:bg-blue-200 dark:hover:bg-blue-800" data-ce-id="${ce.ce_id}" title="Marcar/Desmarcar como evaluado en empresa (Dual)">
                    ${ICONS.Briefcase}
                  </button>
                  <span class="font-bold text-gray-900 dark:text-white">${ce.ce_id}</span>
                </div>
                <span class="text-sm text-gray-600 dark:text-gray-400"> (Peso: ${ce.peso}%)</span>
                <p class="text-sm text-gray-700 dark:text-gray-300 mt-1">${ce.ce_descripcion}</p>
                <p class="text-sm text-blue-600 dark:text-blue-400 mt-1 italic">${ce.ud_ref || 'Sin referencia UD'}</p>
                ${isReadOnly && notasDeActividades.length > 0 ? `
                  <div class="mt-2 text-xs border-t border-gray-200 dark:border-gray-600 pt-2">
                    <span class="font-semibold">Actividades evaluables:</span>
                    <ul class="list-disc list-inside pl-2">
                      ${notasDeActividades.map(n => `<li>${n.name} (T${n.trimestre}): <span class="font-bold">${n.grade.toFixed(2)}</span></li>`).join('')}
                    </ul>
                    ${notasDeActividades.length > 1 ? `<div class="mt-1 italic text-gray-500 dark:text-gray-400">Nota CE: (${notasDeActividades.map(n => n.grade.toFixed(2)).join(' + ')}) / ${notasDeActividades.length} = ${grade.toFixed(2)}</div>` : ''}
                    <div class="mt-1 italic text-gray-500 dark:text-gray-400">
                      Aportación: (${grade.toFixed(2)} × ${ce.peso}%) / 100 = 
                      <span class="font-bold">${((grade * ce.peso) / 100).toFixed(3)}</span>
                    </div>
                  </div>
                ` : ''}
              </div>
              <div class="md:col-span-1">
                ${isReadOnly ? `
                  <div class="w-full p-2 text-center font-bold text-lg ${grade == null ? 'text-gray-400' : (grade >= 5 ? 'text-green-500' : 'text-red-500')}">
                    ${grade != null ? grade.toFixed(2) : '-'}
                  </div>
                ` : `
                  <input type="number" min="0" max="10" step="0.1" value="${grade != null ? grade : ''}" data-student-id="${studentId}" data-ce-id="${ce.ce_id}" 
                    class="grade-input w-full p-2 text-center border border-gray-300 dark:border-gray-700 rounded-md text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 ${ce.dual ? 'bg-blue-100 dark:bg-blue-900/50' : 'bg-white dark:bg-gray-800'}" 
                    aria-label="Nota ${ce.ce_id}" />
                `}
              </div>
            </div>
            `
  }).join('')}
      </div>
    </div>
  `;
}