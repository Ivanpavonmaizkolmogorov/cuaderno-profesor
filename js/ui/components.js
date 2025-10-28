import { ICONS } from './constants.js';
import { isConnected, getConnectedFileName } from '../state.js';

// Renderiza la cabecera
export function renderHeader(page, db) {
  const navClass = (targetPage) =>
    `flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
      page === targetPage
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
          <span>Alumnos (${db.students.length})</span>
        </button>
        <button data-page="configuracion" class="${navClass('configuracion')}">
          ${ICONS.Settings}
          <span>Config.</span>
        </button>
      </nav>
    </div>
  `;
}

export function renderRaAccordion(ra, studentGrades, calculatedRaGrade, studentId) {
    const contentId = `ra-content-${ra.ra_id}`;
    
    return `
    <div class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button class="ra-accordion-toggle w-full flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors" data-content-id="${contentId}">
        <div class="text-left">
          <h4 class="font-semibold text-gray-900 dark:text-white">${ra.ra_id}</h4>
          <p class="text-sm text-gray-600 dark:text-gray-400">${ra.ra_descripcion}</p>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-lg font-bold text-blue-700 dark:text-blue-300">
             ${(typeof calculatedRaGrade === 'number') ? calculatedRaGrade.toFixed(2) : '0.00'}
          </span>
          <span class="chevron-icon transform transition-transform">${ICONS.ChevronRight}</span>
        </div>
      </button>
      <div id="${contentId}" class="accordion-content hidden p-4 bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
        ${ra.criterios_de_evaluacion.map(ce => {
            const grade = studentGrades[ce.ce_id];
            return `
            <div key="${ce.ce_id}" class="grid grid-cols-1 md:grid-cols-4 gap-4 py-4 items-center">
              <div class="md:col-span-3">
                <span class="font-bold text-gray-900 dark:text-white">${ce.ce_id}</span>
                <span class="text-sm text-gray-600 dark:text-gray-400"> (Peso: ${ce.peso}%)</span>
                <p class="text-sm text-gray-700 dark:text-gray-300 mt-1">${ce.ce_descripcion}</p>
                <p class="text-sm text-blue-600 dark:text-blue-400 mt-1 italic">${ce.ud_ref || 'Sin referencia UD'}</p>
              </div>
              <div class="md:col-span-1">
                <input type="number" min="0" max="10" step="0.1" value="${grade != null ? grade : ''}" data-student-id="${studentId}" data-ce-id="${ce.ce_id}" class="grade-input w-full p-2 text-center border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-blue-500" aria-label="Nota ${ce.ce_id}" />
              </div>
            </div>
            `
        }).join('')}
      </div>
    </div>
  `;
}