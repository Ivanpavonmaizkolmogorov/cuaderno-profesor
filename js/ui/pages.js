import { ICONS } from './constants.js';
import { renderRaAccordion } from './components.js';
import { calculateModuleGrades } from '../services/calculations.js';
import { renderProgressView } from '../progressView.js';
import { getDB, getUI, getCalculatedGrades } from '../state.js';

/**
 * Ordena una lista de alumnos según el criterio y la dirección especificados.
 * @param {Array<object>} students - La lista de alumnos a ordenar.
 * @param {object} sortConfig - El objeto de configuración de ordenación { key, direction }.
 * @param {object} moduleCalculatedGrades - Las notas calculadas para el módulo actual.
 * @returns {Array<object>} La lista de alumnos ordenada.
 */
export function sortStudentsForTableView(students, sortConfig, moduleCalculatedGrades) {
  console.log(`[LOG][sortStudentsForTableView] -> Ordenando ${students.length} alumnos por:`, sortConfig);
  const { key, direction } = sortConfig;
  const sortedStudents = [...students]; // Crear una copia para no mutar el original

  sortedStudents.sort((a, b) => {
    let valA, valB;

    if (key === 'name') {
      valA = a.name.toLowerCase();
      valB = b.name.toLowerCase();
    } else if (key.startsWith('t')) { // t1, t2, t3
      const trimesterKey = key.toUpperCase();
      valA = moduleCalculatedGrades?.[trimesterKey]?.[a.id]?.moduleGrade ?? -1;
      valB = moduleCalculatedGrades?.[trimesterKey]?.[b.id]?.moduleGrade ?? -1;
    } else if (key === 'final') {
      valA = moduleCalculatedGrades?.Final?.[a.id]?.moduleGrade ?? -1;
      valB = moduleCalculatedGrades?.Final?.[b.id]?.moduleGrade ?? -1;
    } else {
      return 0; // No se ordena si la clave no es reconocida
    }

    const comparison = valA < valB ? -1 : (valA > valB ? 1 : 0);
    return direction === 'asc' ? comparison : -comparison;
  });
  return sortedStudents;
}

// Renderiza la página de Configuración
export function renderConfiguracionPage() {
  const studentText = ``;

  const moduleText = `{
  "modulo": "Operaciones Auxiliares de Gestión de Tesorería",
  "id": "OAGT_0448",
  "resultados_de_aprendizaje": [
    {
      "ra_id": "RA1",
      "ra_descripcion": "Aplica métodos de control de tesorería.",
      "criterios_de_evaluacion": [
        { "ce_id": "RA1-a", "ce_descripcion": "Describe función y métodos de control.", "peso": 10, "ud_ref": "UD 10: 1. La gestión de la tesorería" },
        { "ce_id": "RA1-b", "ce_descripcion": "Diferencia flujos de entrada y salida.", "peso": 10, "ud_ref": "UD 10: 2. Los flujos de tesorería" },
        { "ce_id": "RA1-c", "ce_descripcion": "Cumplimenta libros y registros.", "peso": 10, "ud_ref": "UD 10: 4.1. Libro registro de caja" },
        { "ce_id": "RA1-d", "ce_descripcion": "Ejecuta arqueo y cuadre de caja.", "peso": 10, "ud_ref": "UD 10: 4. El control de la tesorería" },
        { "ce_id": "RA1-e", "ce_descripcion": "Coteja extractos bancarios.", "peso": 10, "ud_ref": "UD 10: 4.2. Libro registro de cuentas bancarias" },
        { "ce_id": "RA1-f", "ce_descripcion": "Describe utilidades de calendario de vencimientos.", "peso": 10, "ud_ref": "UD 10: 3.1. El presupuesto de tesorería" },
        { "ce_id": "RA1-g", "ce_descripcion": "Relaciona tesorería con otros deptos.", "peso": 10, "ud_ref": "UD 10: 1.1. El área de tesorería" },
        { "ce_id": "RA1-h", "ce_descripcion": "Utiliza medios telemáticos.", "peso": 10, "ud_ref": "UD 10: 5. Aplicaciones Informáticas" },
        { "ce_id": "RA1-i", "ce_descripcion": "Aplica principios de responsabilidad y confidencialidad.", "peso": 10, "ud_ref": "UD 10" }
      ]
    },
    {
      "ra_id": "RA2",
      "ra_descripcion": "Realiza trámites de instrumentos financieros.",
      "criterios_de_evaluacion": [
        { "ce_id": "RA2-a", "ce_descripcion": "Clasifica organizaciones del Sistema Financiero.", "peso": 12.5, "ud_ref": "UD 1: 1. El sistema financiero" },
        { "ce_id": "RA2-b", "ce_descripcion": "Precisa instituciones bancarias y no bancarias.", "peso": 12.5, "ud_ref": "UD 1: 2. Agentes del sector bancario" },
        { "ce_id": "RA2-c", "ce_descripcion": "Diferencia mercados del sistema financiero.", "peso": 12.5, "ud_ref": "UD 1: 1.4. Mercados financieros" },
        { "ce_id": "RA2-d", "ce_descripcion": "Relaciona funciones de intermediarios.", "peso": 12.5, "ud_ref": "UD 1: 1.2. Intermediarios financieros" },
        { "ce_id": "RA2-e", "ce_descripcion": "Diferencia instrumentos bancarios y no bancarios.", "peso": 10, "ud_ref": "UD 2, UD 3" },
        { "ce_id": "RA2-f", "ce_descripcion": "Clasifica tipos de seguros.", "peso": 10, "ud_ref": "UD 3: 4. Los productos de seguro" },
        { "ce_id": "RA2-g", "ce_descripcion": "Identifica servicios básicos de intermediarios.", "peso": 10, "ud_ref": "UD 2: 4. Los servicios bancarios" },
        { "ce_id": "RA2-h", "ce_descripcion": "Calcula rentabilidad y coste financiero.", "peso": 10, "ud_ref": "UD 3: 1. Los valores mobiliarios" }
      ]
    },
    {
      "ra_id": "RA3",
      "ra_descripcion": "Efectúa cálculos financieros básicos.",
      "criterios_de_evaluacion": [
        { "ce_id": "RA3-a", "ce_descripcion": "Diferencia capitalización simple y actualización simple.", "peso": 5.00, "ud_ref": "UD 4 y UD 6" },
        { "ce_id": "RA3-b", "ce_descripcion": "Calcula interés simple y compuesto.", "peso": 5.00, "ud_ref": "UD 4 y UD 7" },
        { "ce_id": "RA3-c", "ce_descripcion": "Calcula descuento simple.", "peso": 5.00, "ud_ref": "UD 6: 1. El descuento comercial" },
        { "ce_id": "RA3-d", "ce_descripcion": "Describe implicaciones de tiempo y tipo de interés.", "peso": 10.00, "ud_ref": "UD 8: (General)" },
        { "ce_id": "RA3-e", "ce_descripcion": "Diferencia tanto nominal e interés efectivo (TAE).", "peso": 2.00, "ud_ref": "UD 9: 5. La TAE" },
        { "ce_id": "RA3-f", "ce_descripcion": "Diferencia tipos de comisiones.", "peso": 1.67, "ud_ref": "UD 2: 1. Las operaciones bancarias y las comisiones" },
        { "ce_id": "RA3-g", "ce_descripcion": "Identifica servicios básicos (duplicado RA2-g).", "peso": 1.67, "ud_ref": "UD 2: 4. Los servicios bancarios" }
      ]
    },
    {
      "ra_id": "RA4",
      "ra_descripcion": "Efectúa operaciones bancarias básicas.",
      "criterios_de_evaluacion": [
        { "ce_id": "RA4-a", "ce_descripcion": "Liquida cuenta bancaria y de crédito.", "peso": 10.00, "ud_ref": "UD 5: (General)" },
        { "ce_id": "RA4-b", "ce_descripcion": "Calcula líquido de negociación de efectos.", "peso": 5.00, "ud_ref": "UD 6: 2.2. Cálculo del valor líquido" },
        { "ce_id": "RA4-c", "ce_descripcion": "Diferencia variables en préstamos.", "peso": 2.00, "ud_ref": "UD 9: 1. Amortización de préstamos" },
        { "ce_id": "RA4-d", "ce_descripcion": "Relaciona conceptos de cuota del préstamo.", "peso": 2.00, "ud_ref": "UD 9: 2. Sistemas de amortización" },
        { "ce_id": "RA4-e", "ce_descripcion": "Describe sistemas de amortización.", "peso": 2.00, "ud_ref": "UD 9: 2. Sistemas de amortización" },
        { "ce_id": "RA4-f", "ce_descripcion": "Calcula cuadro de amortización.", "peso": 2.00, "ud_ref": "UD 9: 2.1. Cuadro de amortización" },
        { "ce_id": "RA4-g", "ce_descripcion": "Relaciona operaciones con capitalización.", "peso": 3.33, "ud_ref": "UD 7: (General)" },
        { "ce_id": "RA4-h", "ce_descripcion": "Compara productos (coste/rentabilidad).", "peso": 3.33, "ud_ref": "UD 7 y UD 9" },
        { "ce_id": "RA4-i", "ce_descripcion": "Utiliza herramientas informáticas bancarias.", "peso": 3.33, "ud_ref": "UD 7: (General)" }
      ]
    }
  ]
}`;

  return `
    <div class="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Importar Nuevo Módulo -->
      <div class="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Importar *Nuevo* Módulo (JSON)</h2>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">Pega el JSON del módulo (incluyendo \`ud_ref\`).</p>
        <textarea id="module-textarea" class="w-full h-48 p-3 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 font-mono text-xs">${moduleText}</textarea>
        <button id="download-module-template-btn" class="mt-2 w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm">
          Descargar Plantilla de Módulo
        </button>
        <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label for="import-module-file-input" class="w-full text-center cursor-pointer bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors">
                ${ICONS.UploadCloud} Importar Archivo
            </label>
            <input type="file" id="import-module-file-input" class="hidden" accept=".json">
            <button id="import-module-btn" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors">
                Importar desde Texto
            </button>
        </div>
      </div>

      <!-- Guardar / Exportar -->
      <div class="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Guardar y Exportar</h2>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">Crea un nuevo archivo JSON, guarda el estado actual y conéctate a él para futuros cambios automáticos.</p>
        <button id="save-as-btn" class="w-full text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors bg-green-600 hover:bg-green-700">
          ${ICONS.Database} Guardar Como y Conectar...
        </button>
        <hr class="my-4 border-gray-300 dark:border-gray-700">
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">Descarga una copia de seguridad (backup) del estado actual sin conectarte.</p>
        <button id="export-data-btn" class="w-full text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors bg-blue-600 hover:bg-blue-700 mt-2">
          ${ICONS.DownloadCloud} Exportar Backup (Descarga)
        </button>
        <hr class="my-4 border-gray-300 dark:border-gray-700">
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">Descarga un informe detallado con cálculos y fórmulas en formato Excel.</p>
        <button id="export-excel-btn" class="w-full text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors bg-green-700 hover:bg-green-800 mt-2">
          ${ICONS.Table} Exportar a Excel (con Fórmulas)
        </button>
      </div>

      <!-- Zona de Peligro -->
      <div class="lg:col-span-2 bg-red-50 dark:bg-gray-800 border border-red-300 dark:border-red-700 shadow-lg rounded-lg p-6">
        <h2 class="text-xl font-semibold text-red-800 dark:text-red-200 mb-4">Zona de Peligro</h2>
        <p class="text-sm text-red-700 dark:text-red-300 mb-3">Esta acción borrará permanentemente todos los módulos, alumnos, notas y comentarios guardados en el navegador.</p>
        <button id="clear-data-btn" class="mt-4 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors">
          ${ICONS.Trash2} Borrar Todos los Datos
        </button>
      </div>
    </div>
  `;
}

/**
 * Renderiza el contenido del modal para editar las etiquetas de diversidad de un alumno.
 * @param {string} studentId - El ID del alumno.
 * @param {string} studentName - El nombre del alumno.
 * @param {Array<string>} currentTags - Las etiquetas actuales del alumno.
 * @returns {string} El HTML del contenido del modal.
 */
export function renderDiversityTagsModal(studentId, studentName, currentTags) {
  return `
    <div id="diversity-tags-modal" class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg">
        <div class="p-6 border-b dark:border-gray-700">
          <h3 class="text-xl font-bold">Atención a la Diversidad</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">Editando etiquetas para: <span class="font-semibold">${studentName}</span></p>
        </div>
        <div class="p-6">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Etiquetas Actuales</label>
          <div id="diversity-tags-container" class="flex flex-wrap gap-2 p-2 border rounded-md bg-gray-50 dark:bg-gray-900 min-h-[40px]">
            ${currentTags.map(tag => `
              <span 
                class="diversity-tag-pill flex items-center gap-2 bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-100 text-sm font-medium px-2.5 py-0.5 rounded-full"
                onmouseover="console.log('Mouse ENCIMA de la etiqueta: ${tag}')"
                onmouseout="console.log('Mouse FUERA de la etiqueta: ${tag}')"
              >
                <span class="tag-text">${tag}</span>
                <button 
                  type="button" 
                  class="delete-tag-btn text-xl font-bold leading-none text-purple-600 dark:text-purple-200 hover:text-purple-900 dark:hover:text-purple-50" 
                  title="Eliminar etiqueta">&times;</button>
              </span>
            `).join('')}
          </div>
          <div class="mt-4">
            <label for="add-diversity-tag-input" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Añadir nueva etiqueta</label>
            <div class="flex gap-2">
              <input type="text" id="add-diversity-tag-input" class="flex-grow p-2 border rounded-md dark:bg-gray-900 dark:border-gray-600" placeholder="Escribe una etiqueta y pulsa Enter...">
              <button type="button" id="add-diversity-tag-btn" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg">Añadir</button>
            </div>
          </div>
        </div>
        <div class="p-6 border-t dark:border-gray-700 flex justify-end gap-4">
          <button id="cancel-diversity-tags-btn" class="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg">Cancelar</button>
          <button id="save-diversity-tags-btn" data-student-id="${studentId}" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Guardar Cambios</button>
        </div>
      </div>
    </div>
  `;
}


// Renderiza la página de Alumnos/as
export function renderAlumnosPage() {
  const { db, ui } = { db: getDB(), ui: getUI() };
  let studentListHtml = '';

  // Filtrar alumnos si hay un filtro de módulo activo
  let studentsToDisplay = db.students;
  if (ui.studentPageModuleFilter && ui.studentPageModuleFilter !== 'all') {
    const module = db.modules.find(m => m.id === ui.studentPageModuleFilter);
    if (module && module.studentIds) {
      const studentIdsInModule = new Set(module.studentIds);
      studentsToDisplay = db.students.filter(s => studentIdsInModule.has(s.id));
    }
  }

  if (studentsToDisplay && studentsToDisplay.length > 0) {
    // El orden de los alumnos se mantiene según el array `studentsToDisplay`
    studentListHtml = `
      <div id="all-students-container" class="space-y-6">
        ${studentsToDisplay.map(student => {
          // Encontrar todos los módulos para este alumno
          const enrolledModules = db.modules
            .filter(m => m.studentIds?.includes(student.id))
            .map(module => { 
              // Usamos las notas ya calculadas y almacenadas en el estado
              const calculatedGrades = getCalculatedGrades();
              const finalGrade = calculatedGrades[module.id]?.Final?.[student.id]?.moduleGrade || 0;
              return { name: module.modulo, grade: finalGrade };
            });

          // --- INICIO: LÓGICA DE ETIQUETAS DE DIVERSIDAD ---
          const diversityTags = student.diversityTags || [];
          const tagsHtml = diversityTags.map(tag => `
            <span class="ml-2 text-xs font-semibold text-purple-800 bg-purple-100 dark:text-purple-100 dark:bg-purple-800 px-2 py-0.5 rounded-full">${tag}</span>
          `).join('');
          // --- FIN: LÓGICA DE ETIQUETAS DE DIVERSIDAD ---

          return `
            <div key="${student.id}" draggable="true" data-student-id="${student.id}" class="student-draggable bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 border-l-4 border-blue-500 transition-opacity">
              <div class="flex justify-between items-center mb-4">
                <div class="flex items-center gap-4">
                    <input type="checkbox" class="student-select-checkbox h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" data-student-id="${student.id}">
                    <div class="flex items-center gap-2">
                      <span class="drag-handle cursor-move text-gray-400" title="Arrastrar para reordenar">${ICONS.GripVertical}</span>
                      <h3 class="text-xl font-bold text-gray-900 dark:text-white">${student.name}</h3>
                      ${tagsHtml}
                    </div>
                </div>
                <div class="flex gap-2">
                    <button class="view-history-btn flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-500 hover:bg-gray-600 text-white rounded-lg" data-student-id="${student.id}">
                      ${ICONS.MessageSquare} Historial
                    </button>
                    <button class="export-full-student-report-btn flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg" data-student-id="${student.id}" title="Exportar informe completo de todos los módulos">
                      ${ICONS.DownloadCloud} Informe Completo
                    </button>
                    <button data-student-id="${student.id}" data-student-name="${student.name}" class="edit-diversity-tags-btn flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg" title="Editar atención a la diversidad">
                      ${ICONS.Tag} Diversidad
                    </button>
                    <button class="delete-student-btn flex items-center gap-2 px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg" data-student-id="${student.id}" title="Eliminar alumno/a del sistema">
                      ${ICONS.Trash2} Eliminar
                    </button>
                </div>
              </div>
              ${enrolledModules.length > 0 ? `
                <h4 class="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Módulos Matriculados:</h4>
                <ul class="space-y-2">
                  ${enrolledModules.map(m => `
                    <li class="flex justify-between items-center text-gray-800 dark:text-gray-300">
                      <span>${m.name}</span>
                      <span class="font-bold text-lg ${m.grade >= 5 ? 'text-green-500' : 'text-red-500'}">${m.grade.toFixed(2)}</span>
                    </li>
                  `).join('')}
                </ul>
              ` : `<p class="text-gray-500 dark:text-gray-400">Este alumno/a no está matriculado en ningún módulo.</p>`}
            </div>
          `;
        }).join('')}
      </div>
    `;
  } else {
    studentListHtml = `
      <p class="text-center text-gray-500 dark:text-gray-400 my-10">
          ${ui.studentPageModuleFilter !== 'all' ? 'No hay alumnos/as en el módulo seleccionado.' : 'No hay alumnos/as registrados en el sistema.'}
      </p>
    `;
  }
  
  return `
    <div class="container mx-auto px-6 py-8">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h2 class="text-3xl font-bold">Panel General de Alumnos/as (${studentsToDisplay.length})</h2>
            <div class="flex items-center gap-4">
                <div class="flex gap-2">
                  <button id="sort-all-asc-btn" class="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white" title="Ordenar A-Z">${ICONS.ArrowDownAZ}</button>
                  <button id="sort-all-desc-btn" class="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white" title="Ordenar Z-A">${ICONS.ArrowUpAZ}</button>
                </div>
                <div class="h-8 border-l border-gray-300 dark:border-gray-600"></div>
                <button id="bulk-delete-students-btn" class="flex items-center gap-2 px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:bg-red-400 disabled:cursor-not-allowed" disabled>
                  ${ICONS.Trash2} Eliminar Seleccionados (<span id="selected-students-count">0</span>)
                </button>
            </div>
        </div>

        <!-- Filtro por Módulo -->
        <div class="mb-8 max-w-md">
          <label for="student-module-filter" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Filtrar por Módulo:</label>
          <select id="student-module-filter" class="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500">
            <option value="all" ${ui.studentPageModuleFilter === 'all' ? 'selected' : ''}>-- Ver todos los alumnos/as --</option>
            ${db.modules.map(m => `
              <option value="${m.id}" ${m.id === ui.studentPageModuleFilter ? 'selected' : ''}>${m.modulo}</option>
            `).join('')}
          </select>
        </div>

        <!-- Checkbox para seleccionar todos -->
        <div class="mb-4">
          <label class="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <input type="checkbox" id="select-all-students-checkbox" class="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500">
            <span>Seleccionar Todos los Alumnos/as Visibles</span>
          </label>
        </div>

      ${studentListHtml}
      
      <!-- Modal para el historial de comentarios -->
      <div id="comment-history-modal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50">
        <div id="comment-history-modal-content" class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-11/12 md:w-3/4 lg:w-1/2 max-h-[80vh] overflow-y-auto p-6">
          <!-- Contenido se inyectará aquí -->
        </div>
      </div>
    </div>
  `;
}

export function renderStudentCommentHistoryModal(student) {
  const db = getDB();
  const studentCommentsByModule = Object.entries(db.comments)
    .map(([moduleId, students]) => {
      const module = db.modules.find(m => m.id === moduleId);
      const comments = students[student.id];
      return { module, comments };
    })
    .filter(item => item.module && item.comments && item.comments.length > 0);

  if (studentCommentsByModule.length === 0) {
    return `
      <h3 class="text-2xl font-bold mb-4">Historial de ${student.name}</h3>
      <p>Este alumno/a no tiene comentarios.</p>
      <button id="close-modal-btn" class="mt-6 bg-red-500 text-white py-2 px-4 rounded">Cerrar</button>
    `;
  }

  return `
    <div class="flex justify-between items-start">
        <h3 class="text-2xl font-bold mb-4">Historial de ${student.name}</h3>
        <button id="close-modal-btn" class="text-gray-500 hover:text-gray-800 dark:hover:text-white">&times;</button>
    </div>
    <div class="space-y-6">
      ${studentCommentsByModule.map(({ module, comments }) => `
        <div>
          <h4 class="text-lg font-semibold text-blue-600 dark:text-blue-400 border-b border-gray-300 dark:border-gray-600 pb-1 mb-2">${module.modulo}</h4>
          <ul class="space-y-3">
            ${comments.map(comment => `
              <li class="bg-gray-100 dark:bg-gray-700 p-3 rounded-md text-sm">
                <div class="flex justify-between items-center mb-1">
                  <span class="font-semibold">${comment.type === 'ce' ? `CE: ${comment.ce_id}` : 'Comportamiento'}</span>
                  <span class="text-xs text-gray-500">${new Date(comment.date).toLocaleDateString()}</span>
                </div>
                <p>${comment.text}</p>
              </li>
            `).join('')}
          </ul>
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * Renderiza la vista de detalle de un módulo para un alumno/a específico.
 * Se usa para inyectar en el acordeón de la página de Alumnos/as.
 */
export function renderStudentModuleDetail(student, module) {
  const db = getDB();
  const studentGrades = db.grades[student.id] || {};
  const calculated = calculateModuleGrades(module, [student], db.grades, db.actividades);
  const finalGrades = calculated[student.id] || { raTotals: {}, moduleGrade: 0 };

  return `
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6" data-student-id="${student.id}" data-module-id="${module.id}">
      <!-- Columna 1: Criterios de Evaluación -->
      <div class="lg:col-span-2">
        <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Desglose de Calificaciones</h4>
        <div class="space-y-3">
          ${module.resultados_de_aprendizaje.map(ra => 
              renderRaAccordion(
                  ra, 
                  studentGrades, 
                  (finalGrades.raTotals && typeof finalGrades.raTotals[ra.ra_id] === 'number') ? finalGrades.raTotals[ra.ra_id] : 0,
                  student.id, // studentId
                  true // Forzar solo lectura en esta vista
              )
          ).join('')}
        </div>
      </div>
      <!-- Columna 2: Comentarios -->
      <div class="lg:col-span-1">
        ${renderCommentForm(student, module)}
      </div>
    </div>
  `;
}

// Renderiza la página de Módulos (y su detalle)
export function renderModulosPage() {
  const { modules, students } = getDB();
  const { selectedModuleId } = getUI();
  const selectedModule = modules.find(m => m.id === selectedModuleId);  
  
  let moduleSelectHtml = '';
  if (modules && modules.length > 0) {
    moduleSelectHtml = `
      <div class="mb-6">
        <label for="module-select" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Selecciona un módulo para calificar:</label>
        <div class="flex items-center gap-2">
            <select id="module-select" class="flex-grow w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500">
              <option value="">-- Selecciona un módulo --</option>
              ${modules.map(m => `
                <option key="${m.id}" value="${m.id}" ${m.id === selectedModuleId ? 'selected' : ''}>${m.modulo}</option>
              `).join('')}
            </select>
            ${selectedModule ? `
              <button id="delete-module-btn" data-module-id="${selectedModule.id}" class="p-3 bg-red-600 hover:bg-red-700 text-white rounded-lg" title="Eliminar módulo seleccionado">
                ${ICONS.Trash2}
              </button>
            ` : ''}
        </div>
      </div>
      <hr class="my-6 border-gray-200 dark:border-gray-700" />
      ${selectedModule ? `
        <div class="text-center">
        </div>
      ` : ''}
    `;
  } else {
    moduleSelectHtml = `
      <p class="text-center text-gray-500 dark:text-gray-400 my-10">
          No hay módulos cargados. Ve a Configuración para importar uno.
      </p>
    `;
  }
  
  let moduleDetailHtml = '';
  if (selectedModule) {
    const moduleStudents = (selectedModule.studentIds || [])
      .map(studentId => students.find(s => s.id === studentId))
      .filter(Boolean); // Filtra por si algún studentId es inválido

    moduleDetailHtml = renderModuloDetalle(selectedModule, moduleStudents);

  } else if (modules.length > 0) {
    moduleDetailHtml = `
      <div class="text-center text-gray-500 dark:text-gray-400">
        <p class="text-lg">Por favor, selecciona un módulo de la lista para empezar a calificar.</p>
      </div>
    `;
  }

  return `
    <div class="container mx-auto px-6 py-8">
      <h2 class="text-3xl font-bold mb-6">Módulos (${modules.length})</h2>
      ${moduleSelectHtml}
      ${moduleDetailHtml}
    </div>
  `;
}

// --- Sub-renderers para Módulos ---

function renderGestionAlumnos(module, moduleStudents) {
  const studentText = `David Palomeque Aguilera
Adrián Manchado Moreno
Marta Pérez Padillo`;

  // Los alumnos/as ya vienen ordenados según module.studentIds, solo los mostramos.
  const studentListHtml = moduleStudents.length > 0
    ? `<ul id="student-list-container" class="space-y-2">
        ${moduleStudents.map(student => `
          <li key="${student.id}" draggable="true" data-student-id="${student.id}" class="student-draggable flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-2 rounded-md transition-opacity">
            <div class="flex items-center gap-2">
              <span class="drag-handle cursor-move text-gray-400" title="Arrastrar para reordenar">${ICONS.GripVertical}</span>
              <span>${student.name}</span>
            </div>
            <div>
              <button class="remove-student-btn text-red-500 hover:text-red-700 p-1" data-student-id="${student.id}" data-module-id="${module.id}" title="Eliminar alumno de este módulo">
                ${ICONS.Trash2}
              </button>
            </div>
          </li>
        `).join('')}
      </ul>`
    : `<p class="text-center text-gray-500 dark:text-gray-400">Este módulo aún no tiene alumnos/as.</p>`;

  return `
    <div class="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 mt-6">
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Gestionar Alumnos/as del Módulo (${moduleStudents.length})</h3>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div class="flex justify-between items-center mb-2">
            <h4 class="font-semibold">Alumnos/as Actuales</h4>
            <div class="flex gap-2">
              <button id="sort-asc-btn" data-module-id="${module.id}" class="p-1 text-gray-500 hover:text-gray-900 dark:hover:text-white" title="Ordenar A-Z">${ICONS.ArrowDownAZ}</button>
              <button id="sort-desc-btn" data-module-id="${module.id}" class="p-1 text-gray-500 hover:text-gray-900 dark:hover:text-white" title="Ordenar Z-A">${ICONS.ArrowUpAZ}</button>
            </div>
          </div>
          <div class="max-h-60 overflow-y-auto pr-2">
            ${studentListHtml}
          </div>
        </div>
        <div>
          <h4 class="font-semibold mb-2">Añadir Nuevos Alumnos/as</h4>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">Pega un listado para añadir o actualizar.</p>
          <textarea id="student-textarea" class="w-full h-32 p-3 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 font-mono text-sm">${studentText}</textarea>
          <div class="mt-2 flex flex-col gap-2">
            <button id="process-students-btn" data-module-id="${module.id}" class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm">
              ${ICONS.Users} Formatear Nombres y Añadir...
            </button>
            <button id="import-students-to-module-btn" data-module-id="${module.id}" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors">
              Añadir / Actualizar (Formato Correcto)
            </button>
            <button id="download-student-template-btn" class="mt-2 w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm">
              Descargar Plantilla "Apellidos, Nombre"
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal para formatear nombres de alumnos -->
    <div id="student-format-modal-container"></div>
  `;
}

export function renderStudentFormatModal(nameSuggestions, moduleId) {
  if (!nameSuggestions || nameSuggestions.length === 0) {
    return '';
  }

  return `
    <div id="student-format-modal" class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div class="p-6 border-b dark:border-gray-700">
          <h3 class="text-xl font-bold">Revisar y Formatear Nombres</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Hemos intentado convertir los nombres al formato <code class="bg-gray-200 dark:bg-gray-700 px-1 rounded">Apellidos, Nombre</code>. 
            Por favor, revisa y corrige las sugerencias antes de importar.
          </p>
        </div>
        <div class="p-6 overflow-y-auto">
          <form id="format-student-form">
            <div class="space-y-4">
              ${nameSuggestions.map(item => `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  <div>
                    <label class="block text-xs text-gray-500 dark:text-gray-400">Nombre Original</label>
                    <p class="p-2 bg-gray-100 dark:bg-gray-900 rounded-md text-sm">${item.original}</p>
                  </div>
                  <div>
                    <label class="block text-xs text-gray-500 dark:text-gray-400">Arrastra las palabras para corregir el formato:</label>
                    <div id="${item.id}" class="name-editor-container flex items-center gap-2 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 min-h-[44px]">
                      ${(() => {
                        const [lastNamesStr = '', firstNamesStr = ''] = item.suggested.split(',').map(s => s.trim());
                        const lastNameParts = lastNamesStr.split(' ').filter(Boolean);
                        const firstNameParts = firstNamesStr.split(' ').filter(Boolean);

                        const renderPills = (words) => words.map(word => 
                          `<span draggable="true" class="name-pill cursor-move bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-sm font-medium px-2.5 py-0.5 rounded-full" data-word="${word}">${word}</span>`
                        ).join('');

                        return `
                          <div class="name-drop-zone flex-1 flex flex-wrap gap-1 p-1 min-h-[30px] bg-gray-100 dark:bg-gray-800 rounded" data-part="lastNames">
                            ${renderPills(lastNameParts)}
                          </div>
                          <span class="text-gray-400 font-bold">,</span>
                          <div class="name-drop-zone flex-1 flex flex-wrap gap-1 p-1 min-h-[30px] bg-gray-100 dark:bg-gray-800 rounded" data-part="firstNames">
                            ${renderPills(firstNameParts)}
                          </div>
                        `;
                      })()}
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </form>
        </div>
        <div class="p-6 border-t dark:border-gray-700 flex justify-end gap-4">
          <button id="cancel-student-format-btn" type="button" class="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg">
            Cancelar
          </button>
          <button id="confirm-student-format-btn" type="button" data-module-id="${moduleId}" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
            Confirmar y Añadir Alumnos/as
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Renderiza el panel para gestionar los tipos de actividad y sus pesos por defecto.
 * @param {object} module - El objeto del módulo.
 * @returns {string} El HTML del panel de gestión.
 */
function renderActivityTypesManagement(module) {
  console.log('[LOG][renderActivityTypesManagement] Renderizando panel de gestión de tipos de actividad.');
  const activityTypes = module.activityTypes || [
    { nombre: 'Examen', peso: 3 },
    { nombre: 'Práctica', peso: 2 },
    { nombre: 'Ejercicios', peso: 1 },
  ];

  // Si el módulo no tiene `activityTypes` definidos, los añadimos para la primera visualización.
  if (!module.activityTypes) {
    module.activityTypes = [...activityTypes];
  }

  const renderRow = (type, index) => `
    <tr class="activity-type-row" data-index="${index}">
      <td class="p-2"><input type="text" value="${type.nombre}" class="activity-type-name w-full p-1 border rounded dark:bg-gray-900"></td>
      <td class="p-2"><input type="number" value="${type.peso}" step="0.1" min="0" class="activity-type-peso w-full p-1 border rounded dark:bg-gray-900"></td>
      <td class="p-2 text-center"><button type="button" class="delete-activity-type-btn text-red-500 hover:text-red-700">&times;</button></td>
    </tr>
  `;

  return `
    <div class="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 mt-6">
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Tipos de Actividad y Pesos por Defecto</h3>
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Define categorías para autocompletar el peso al crear una actividad. Los cambios se guardan al pulsar "Guardar Tipos".</p>
      <div id="activity-types-container">
        <table class="w-full">
          <thead>
            <tr>
              <th class="text-left font-medium p-2">Nombre del Tipo</th>
              <th class="text-left font-medium p-2">Peso Sugerido</th>
              <th class="w-12"></th>
            </tr>
          </thead>
          <tbody id="activity-types-tbody">
            ${activityTypes.map(renderRow).join('')}
          </tbody>
        </table>
      </div>
      <div class="mt-4 flex gap-4">
        <button type="button" id="add-activity-type-btn" class="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg text-sm">Añadir Tipo</button>
        <button type="button" id="save-activity-types-btn" data-module-id="${module.id}" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-sm">Guardar Tipos</button>
      </div>
    </div>
  `;
}

function renderModuloDetalle(module, moduleStudents) {
  const gestionAlumnosHtml = renderGestionAlumnos(module, moduleStudents);
  const gestionActividadesHtml = renderActividadesManagement(module);
  const gestionTiposActividadHtml = renderActivityTypesManagement(module); // NUEVA SECCIÓN
  const gestionAptitudHtml = renderAptitudConfig(module);
  const { db } = { db: getDB() };
  const uiState = getUI();
  let moduleView = uiState.moduleView || 'tabla'; // Asegurarse de que siempre haya una vista
  console.log(`[LOG][renderModuloDetalle] Renderizando detalle del módulo '${module.modulo}' con vista: ${moduleView}`);

  // Lógica de seguridad: si estamos en vista 'alumno' pero no hay alumnos o ninguno está seleccionado,
  // forzamos el cambio a la vista 'tabla' para evitar errores.
  const studentExists = moduleStudents.some(s => s.id === uiState.selectedStudentIdForView);
  if (moduleView === 'alumno' && (moduleStudents.length === 0 || !uiState.selectedStudentIdForView || !studentExists)) {
    moduleView = 'tabla';
    // Opcional: podrías llamar a un handler para actualizar el estado global aquí, pero para la UI es suficiente.
    console.warn(`[WARN] Forzando cambio a vista 'tabla' porque no hay alumno seleccionado o no existe en el módulo.`);
  }

  const classTabla = `flex items-center gap-2 w-full justify-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        moduleView === 'tabla'
          ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-white shadow'
          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
      }`;
  const classAlumno = `flex items-center gap-2 w-full justify-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        moduleView === 'alumno'
          ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-white shadow'
          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
      }`;
  const classIndice = `flex items-center gap-2 w-full justify-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        moduleView === 'indice'
          ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-white shadow'
          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'}`;
  const classDistribucion = `flex items-center gap-2 w-full justify-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${moduleView === 'distribucion' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-white shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'}`;
      
  let contentHtml = '';
  if (moduleView === 'indice') {
      console.log('[LOG][renderModuloDetalle] La vista es "indice", preparando contenedor #progress-view-container.');
      contentHtml = `<div id="progress-view-container" class="p-4 md:p-6"></div>`; // Contenedor para la vista de progreso
    } else if (moduleView === 'distribucion') {
      console.log('[LOG][renderModuloDetalle] La vista es "distribucion", llamando a renderWeightDistributionView.');
      contentHtml = renderWeightDistributionView(module); // ¡Esta es la corrección!
  } else if (moduleStudents.length > 0) {
    // La vista por defecto (y única para calificar) es ahora la de alumno.
    contentHtml = renderAlumnoView(module, moduleStudents);
  } else {
    // Si no hay alumnos, mostramos el mensaje correspondiente.
    contentHtml = `<p class="text-center text-gray-500 dark:text-gray-400 my-10">Añade alumnos/as en la sección de gestión para empezar a calificar.</p>`;
  }
  
  return `
    <div>
      ${gestionAlumnosHtml}
      ${gestionTiposActividadHtml}
      ${gestionActividadesHtml}
      ${gestionAptitudHtml}
      <hr class="my-8 border-gray-300 dark:border-gray-700">
      <!-- Selector de Vista -->
      <div class="mb-6 flex justify-center gap-2 p-2 bg-gray-200 dark:bg-gray-800 rounded-lg">
        <button id="view-alumno-btn" class="${classAlumno}" ${moduleStudents.length === 0 ? 'disabled' : ''}>
          ${ICONS.User} Vista Alumnos/as
        </button>
        <button id="view-progress-btn" class="${classIndice}">
          ${ICONS.ClipboardList} Índice Contenidos
        </button>
        <button id="view-distribution-btn" class="${classDistribucion}">
          ${ICONS.PieChart} Distribución de Pesos
        </button>
      </div>

      <!-- Contenido de la vista -->
      <div id="module-detail-content">
        ${contentHtml}
      </div>
    </div>
    <div id="ce-list-modal-container"></div>
  `;
}

/**
 * Renderiza la vista de distribución de pesos de actividades por CE y RA.
 * @param {object} module - El objeto del módulo seleccionado.
 * @returns {string} El HTML de la vista de distribución de pesos.
 */
export function renderWeightDistributionView(module) {
  console.log('[LOG][renderWeightDistributionView] -> Obteniendo estado de la UI...');
  const ui = getUI(); // Obtenemos el objeto UI completo
  console.log('[LOG][renderWeightDistributionView] -> Objeto UI obtenido:', ui);
  console.log('[LOG][renderWeightDistributionView] -> Iniciando renderizado de la vista de distribución de pesos.');
  console.log('[LOG][renderWeightDistributionView] -> Módulo recibido:', module);
  const { db } = { db: getDB() };
  const moduleActivities = db.actividades.filter(a => a.moduleId === module.id);
  console.log('[LOG][renderWeightDistributionView] -> Actividades del módulo encontradas:', moduleActivities.length);

  // Calcular el peso total de todas las actividades del módulo
  const totalModuleActivityWeight = moduleActivities.reduce((sum, act) => sum + (act.peso || 1), 0);
  console.log('[LOG][renderWeightDistributionView] -> Peso total de actividades en el módulo:', totalModuleActivityWeight);

  // Calcular el peso acumulado por cada CE
  const ceAccumulatedWeights = {}; // { 'CE_ID': total_weight }
  module.resultados_de_aprendizaje.forEach(ra => {
    ra.criterios_de_evaluacion.forEach(ce => {
      const activitiesForCe = moduleActivities.filter(act => act.ceIds.includes(ce.ce_id));
      ceAccumulatedWeights[ce.ce_id] = activitiesForCe.reduce((sum, act) => sum + (act.peso || 1), 0);
    });
    console.log('[LOG][renderWeightDistributionView] -> Pesos acumulados por CE:', ceAccumulatedWeights);
  });

  // Calcular el peso acumulado por cada RA
  const raAccumulatedWeights = {}; // { 'RA_ID': total_weight } (corregido)
  module.resultados_de_aprendizaje.forEach(ra => {
    const ceIdsInThisRa = ra.criterios_de_evaluacion.map(ce => ce.ce_id);
    const uniqueActivitiesForThisRa = new Set(); // Para almacenar IDs de actividades únicas

    moduleActivities.forEach(act => {
      // Comprobar si esta actividad evalúa algún CE dentro del RA actual
      const evaluatesCeInThisRa = act.ceIds.some(actCeId => ceIdsInThisRa.includes(actCeId));
      if (evaluatesCeInThisRa) {
        uniqueActivitiesForThisRa.add(act.id);
      }
    });

    let raTotalWeight = 0;
    uniqueActivitiesForThisRa.forEach(actId => {
      const activity = moduleActivities.find(a => a.id === actId);
      if (activity) {
        raTotalWeight += (activity.peso || 1);
      }
    });
    raAccumulatedWeights[ra.ra_id] = raTotalWeight;
    console.log(`[LOG][renderWeightDistributionView] -> Pesos acumulados por RA '${ra.ra_id}' (corregido):`, raTotalWeight);
  });

  return `
    <div class="p-4 md:p-6 bg-white dark:bg-gray-800 shadow-lg rounded-lg">
      <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Distribución de Pesos del Módulo: ${module.modulo}</h3>
      
      <div class="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p class="text-lg font-semibold text-blue-800 dark:text-blue-200">Peso Total de Actividades en el Módulo: 
          <span class="font-bold text-2xl">${totalModuleActivityWeight.toFixed(1)}</span>
        </p>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Este es la suma de los pesos de todas las actividades evaluables del módulo.
        </p>
      </div>

      <div class="space-y-6">
        ${module.resultados_de_aprendizaje.map(ra => {
          const currentRaWeight = raAccumulatedWeights[ra.ra_id] || 0;
          const raPercentage = totalModuleActivityWeight > 0 ? (currentRaWeight / totalModuleActivityWeight * 100) : 0;
          console.log(`[LOG][renderWeightDistributionView]   - Checking expandedRaId for RA '${ra.ra_id}'. Current ui?.expandedRaId: ${ui?.expandedRaId}`);
          const isExpanded = ui?.expandedRaId === ra.ra_id; // Usamos encadenamiento opcional para evitar el TypeError
          console.log(`[LOG][renderWeightDistributionView]   - RA '${ra.ra_id}': Peso=${currentRaWeight.toFixed(1)}, Porcentaje=${raPercentage.toFixed(1)}%`);
          const raContentId = `ra-distribution-content-${ra.ra_id}`;

          return `
            <!-- RA: ${ra.ra_id} -->
            <div class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <button class="ra-accordion-toggle w-full flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors" data-content-id="${raContentId}">
                <div class="text-left">
                  <h4 class="font-semibold text-gray-900 dark:text-white">${ra.ra_id} - ${ra.ra_descripcion}</h4>
                </div>
                <div class="flex items-center gap-4">
                  <span class="text-lg font-bold text-blue-700 dark:text-blue-300">
                    ${currentRaWeight.toFixed(1)} <span class="text-sm font-normal">(${raPercentage.toFixed(1)}%)</span>
                  </span>
                  <span class="chevron-icon transform transition-transform">${ICONS.ChevronRight}</span>
                </div>
              </button>
              <div id="${raContentId}" class="accordion-content ${isExpanded ? '' : 'hidden'} p-4 bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                <h5 class="font-semibold text-gray-700 dark:text-gray-300 mb-3">Criterios de Evaluación:</h5>
                <div class="space-y-2">
                  ${ra.criterios_de_evaluacion.map(ce => {
                    const currentCeWeight = ceAccumulatedWeights[ce.ce_id] || 0;
                    const cePercentageOfRa = currentRaWeight > 0 ? (currentCeWeight / currentRaWeight * 100) : 0;
                    const activitiesForCe = moduleActivities.filter(act => act.ceIds.includes(ce.ce_id));
                    const activitiesListHtml = activitiesForCe.length > 0 ? `
                      <div class="mt-2 text-xs text-gray-600 dark:text-gray-400">
                        <span class="font-semibold">Actividades que evalúan este CE:</span>
                        <ul class="list-disc list-inside ml-2">
                          ${activitiesForCe.map(act => {
                            const activityWeight = act.peso || 1;
                            const percentageOfCe = currentCeWeight > 0 ? (activityWeight / currentCeWeight * 100) : 0;
                            return `<li>${act.name} (Peso: ${activityWeight}, <span class="font-bold">${percentageOfCe.toFixed(1)}%</span>)</li>`;
                          }).join('')}
                        </ul>
                      </div>
                    ` : `<p class="mt-2 text-xs text-gray-500 dark:text-gray-400">Ninguna actividad evalúa este CE.</p>`;
                    console.log(`[LOG][renderWeightDistributionView]     - CE '${ce.ce_id}': Peso=${currentCeWeight.toFixed(1)}, Porcentaje del RA=${cePercentageOfRa.toFixed(1)}%`);
                    return `
                      <div class="flex justify-between items-center p-2 rounded-md bg-gray-100 dark:bg-gray-900/50">
                        <div><p class="text-sm text-gray-800 dark:text-gray-200">${ce.ce_id} - ${ce.ce_descripcion}</p>${activitiesListHtml}</div>
                        <span class="font-medium text-gray-900 dark:text-gray-100">
                          ${currentCeWeight.toFixed(1)} <span class="text-xs text-gray-600 dark:text-gray-400">(${cePercentageOfRa.toFixed(1)}% del RA)</span>
                        </span>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function renderAptitudConfig(module) {
  const basePositiva = module.aptitudBasePositiva ?? 1.1;
  const baseNegativa = module.aptitudBaseNegativa ?? 1.1;

  return `
    <div class="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 mt-6">
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Configuración e Importación de Aptitud</h3>
      <form id="aptitud-config-form" data-module-id="${module.id}" class="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
        <div>
          <label for="basePositiva" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Base para Positivos</label>
          <input type="number" id="basePositiva" name="basePositiva" value="${basePositiva}" step="0.01" min="1" class="mt-1 w-full p-2 border rounded-md dark:bg-gray-900">
        </div>
        <div>
          <label for="baseNegativa" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Base para Negativos</label>
          <input type="number" id="baseNegativa" name="baseNegativa" value="${baseNegativa}" step="0.01" min="1" class="mt-1 w-full p-2 border rounded-md dark:bg-gray-900">
        </div>
      </form>
      <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button type="submit" form="aptitud-config-form" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Guardar Configuración</button>
        <button id="open-import-aptitudes-modal-btn" data-module-id="${module.id}" class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg">Importar Pos./Neg. (JSON)</button>
      </div>
      <!-- Zona de Peligro para Borrado Masivo -->
      <div class="mt-6 border-t border-red-300 dark:border-red-700 pt-4">
        <h4 class="text-md font-semibold text-red-700 dark:text-red-300 mb-2">Zona de Peligro</h4>
        <p class="text-xs text-red-600 dark:text-red-400 mb-3">Estas acciones son irreversibles y afectarán a todos los alumnos del módulo.</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button class="bulk-delete-module-aptitudes-btn w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-3 rounded-lg text-sm" data-module-id="${module.id}" data-type="positives">
            Limpiar Positivos del Módulo
          </button>
          <button class="bulk-delete-module-aptitudes-btn w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 rounded-lg text-sm" data-module-id="${module.id}" data-type="negatives">
            Limpiar Negativos del Módulo
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Renderiza el panel de feedback dinámico sobre el impacto de una actividad.
 * @returns {string} El HTML del contenedor del panel.
 */
function renderImpactPanel() {
  console.log('[LOG][renderImpactPanel] -> Renderizando contenedor DIV para el panel de impacto.');
  return `<div id="impact-feedback-panel" class="mt-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 hidden"></div>`;
}

/**
 * Renderiza el modal para importar positivos/negativos desde un JSON.
 * @param {string} moduleId - El ID del módulo al que se importarán los datos.
 * @returns {string} El HTML del modal.
 */
export function renderImportAptitudesModal(moduleId) {
  const templateJSON = JSON.stringify([
    {
      "studentName": "Apellidos Completos, Nombre",
      "trimester": 1,
      "type": "positive",
      "reason": "Participación destacada en Tema 3",
      "baseValue": 1.1,
      "effectiveDate": "2025-10-25"
    },
    {
      "studentName": "Otro Alumno, Nombre",
      "trimester": 1,
      "type": "negative",
      "reason": "Falta de entrega Actividad 2",
      "baseValue": 1.2,
      "effectiveDate": "2025-11-12"
    }
  ], null, 2);

  return `
    <div id="import-aptitudes-modal" class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div class="p-6 border-b dark:border-gray-700">
          <h3 class="text-xl font-bold">Importar Positivos y Negativos (JSON)</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Pega un array de objetos JSON con los datos de aptitud. El nombre del alumno debe coincidir exactamente.
          </p>
        </div>
        <div class="p-6 overflow-y-auto">
          <textarea id="aptitudes-json-textarea" class="w-full h-64 p-3 font-mono text-xs border rounded-md dark:bg-gray-900">${templateJSON}</textarea>
        </div>
        <div class="p-6 border-t dark:border-gray-700 flex justify-end gap-4">
          <button id="cancel-import-aptitudes" class="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg">Cancelar</button>
          <button id="confirm-import-aptitudes" data-module-id="${moduleId}" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Importar Datos</button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Envuelve la lógica de renderizado de la vista de progreso para ser llamada desde `renderModuloDetalle`.
 * @param {object} module - El objeto del módulo seleccionado.
 * @returns {string} El HTML del contenedor que será llenado por `renderProgressView`.
 */
function renderCuadernoCalificaciones(module, moduleStudents) {
  const { db, ui } = { db: getDB(), ui: getUI() };
  const { grades, actividades } = db;
  const calculatedGrades = getCalculatedGrades();
  const ras = module.resultados_de_aprendizaje;
  const moduleActividades = actividades.filter(a => a.moduleId === module.id);
  const sortConfig = ui.tableViewSort;

  // --- INICIO: CÁLCULO DE PESOS POR TRIMESTRE ---
  const trimesterTotalWeights = { '1': 0, '2': 0, '3': 0 };
  moduleActividades.forEach(act => {
    // Asegurarnos de que solo contamos actividades de trimestres válidos
    if (trimesterTotalWeights[act.trimestre] !== undefined) {
      trimesterTotalWeights[act.trimestre] += (act.peso || 1);
    }
  });
  // --- FIN: CÁLCULO DE PESOS POR TRIMESTRE ---

  const renderSortIcon = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'asc' ? '▲' : '▼';
    }
    return '';
  };

  const headerHtml = `
    <thead class="bg-gray-50 dark:bg-gray-800 sticky-header">

      <tr>
        <th scope="col" data-sort-key="name" class="sortable-header sticky left-0 z-10 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider bg-gray-50 dark:bg-gray-800 cursor-pointer">
          Alumno/a ${renderSortIcon('name')}
        </th>
        <!-- INICIO: CORRECCIÓN - Columnas de notas trimestrales y final -->
        <th scope="col" data-sort-key="t1" class="sortable-header px-3 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider bg-gray-100 dark:bg-gray-700 cursor-pointer">
          T1 ${renderSortIcon('t1')}
        </th>
        <th scope="col" data-sort-key="t2" class="sortable-header px-3 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider bg-gray-100 dark:bg-gray-700 cursor-pointer">
          T2 ${renderSortIcon('t2')}
        </th>
        <th scope="col" data-sort-key="t3" class="sortable-header px-3 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider bg-gray-100 dark:bg-gray-700 cursor-pointer">
          T3 ${renderSortIcon('t3')}
        </th>
        <th scope="col" data-sort-key="final" class="sortable-header px-3 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider bg-gray-100 dark:bg-gray-700 cursor-pointer">
          Final ${renderSortIcon('final')}
        </th>
        <!-- FIN: CORRECCIÓN -->
        <!-- Columnas de Actividades Evaluables -->
        ${moduleActividades.map(act => {
          const totalWeightForTrimester = trimesterTotalWeights[act.trimestre] || 0;
          const activityWeight = act.peso || 1;
          const percentage = totalWeightForTrimester > 0 ? (activityWeight / totalWeightForTrimester) * 100 : 0;

          return `
            <th key="${act.id}" scope="col" class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              <button class="open-actividad-panel-btn w-full h-full" data-actividad-id="${act.id}" title="Gestionar y calificar actividad: ${act.name}\nCEs: ${act.ceIds.join(', ')}">
                <span class="block">${act.name}</span>
                <span class="block font-normal normal-case">(T${act.trimestre})</span>
                <span class="block font-normal normal-case text-gray-400">(${percentage.toFixed(1)}%)</span>
              </button>
            </th>
          `;
        }).join('')}
        ${ras.map(ra => `
          <th key="${ra.ra_id}" scope="col" class="px-2 py-3 text-center text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider bg-blue-50 dark:bg-blue-900" title="${ra.ra_descripcion}">
            <button class="open-ce-list-modal-btn p-2 rounded-md hover:bg-blue-100 dark:hover:bg-blue-800 w-full h-full" data-ra-id="${ra.ra_id}" data-module-id="${module.id}">
              ${ra.ra_id}
            </button>
          </th>
        `).join('')}
        <th scope="col" class="px-6 py-3 text-center text-xs font-bold text-green-700 dark:text-green-300 uppercase tracking-wider bg-green-50 dark:bg-green-900">
          Final
        </th>
      </tr>
    </thead>
  `;
  
  const bodyHtml = `
    <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
      ${moduleStudents.map(student => {
        const studentGrades = grades[student.id] || {};
        const studentAllCalcs = calculatedGrades[module.id] || {};
        
        const t1Grade = studentAllCalcs.T1?.[student.id]?.moduleGrade;
        const t2Grade = studentAllCalcs.T2?.[student.id]?.moduleGrade;
        const t3Grade = studentAllCalcs.T3?.[student.id]?.moduleGrade;
        const t1Breakdown = studentAllCalcs.T1?.[student.id]?.breakdown;
        const t2Breakdown = studentAllCalcs.T2?.[student.id]?.breakdown;
        const t3Breakdown = studentAllCalcs.T3?.[student.id]?.breakdown;
        const finalCalcs = studentAllCalcs.Final?.[student.id] || { raTotals: {}, moduleGrade: 0, breakdown: {} };
        
        const isSelectedInAlumnoView = ui.moduleView === 'alumno' && ui.selectedStudentIdForView === student.id;

        return `
          <tr key="${student.id}" data-student-id="${student.id}" class="hover:bg-gray-50 dark:hover:bg-gray-800 ${isSelectedInAlumnoView ? 'bg-blue-100 dark:bg-blue-900/50' : ''} ${ui.moduleView === 'alumno' ? 'cursor-pointer' : ''}">
            <td class="sticky left-0 z-10 px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800">
              ${student.name}
            </td>
            <!-- INICIO: CORRECCIÓN - Celdas de notas trimestrales con colores según aptitud -->
            ${[
              { grade: t1Grade, breakdown: t1Breakdown },
              { grade: t2Grade, breakdown: t2Breakdown },
              { grade: t3Grade, breakdown: t3Breakdown }
            ].map(data => {
              let bgColor = 'bg-gray-100 dark:bg-gray-700';
              let title = '';
              if (data.breakdown) {
                title = `Base: ${data.breakdown.baseGrade.toFixed(2)}\nAjuste: ${data.breakdown.totalAdjustment.toFixed(2)}`;
                if (data.breakdown.positiveAdjustment > data.breakdown.negativeAdjustment) {
                  bgColor = 'bg-green-100 dark:bg-green-900/50';
                } else if (data.breakdown.negativeAdjustment > data.breakdown.positiveAdjustment) {
                  bgColor = 'bg-red-100 dark:bg-red-900/50';
                }
              }
              return `<td class="px-3 py-4 text-center text-sm font-semibold ${bgColor}" title="${title}">${data.grade?.toFixed(2) || '-'}</td>`;
            }).join('')}
            
            <!-- Celda para la nota final -->
            <td 
              class="px-3 py-4 text-center text-sm font-semibold bg-gray-100 dark:bg-gray-700" 
              title="${finalCalcs.breakdown ? `Base: ${finalCalcs.breakdown.baseGrade.toFixed(2)}\nAjuste Total: ${finalCalcs.breakdown.totalAdjustment.toFixed(2)}` : ''}"
            >
              ${finalCalcs.moduleGrade?.toFixed(2) || '-'}
            </td>
            <!-- FIN: CORRECCIÓN -->

            ${moduleActividades.map(act => {
              const attempts = studentGrades[act.id] || [];
              const finalGrade = attempts.length > 0 ? Math.max(...attempts.map(a => a.grade)) : null;
              return `
                <td key="${act.id}" class="px-2 py-4 whitespace-nowrap text-sm">
                  <div class="w-20 mx-auto p-2 text-center font-semibold ${finalGrade === null ? 'text-gray-400' : (finalGrade >= 5 ? 'text-green-600' : 'text-red-600')}">
                    ${finalGrade !== null ? finalGrade.toFixed(2) : '-'}
                  </div>
                </td>
              `
            }).join('')}
            
            ${ras.map(ra => {
              const raGrade = (finalCalcs.raTotals && finalCalcs.raTotals[ra.ra_id] != null) ? finalCalcs.raTotals[ra.ra_id].toFixed(2) : '0.00';
              return `
                <td key="${ra.ra_id}" class="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-blue-800 dark:text-blue-200 bg-blue-50 dark:bg-blue-900">
                  ${raGrade}
                </td>
              `
            }).join('')}
            
            <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-green-800 dark:text-green-200 bg-green-50 dark:bg-green-900">
              ${finalCalcs.moduleGrade != null ? finalCalcs.moduleGrade.toFixed(2) : '0.00'}
            </td>
          </tr>
        `
      }).join('')}
    </tbody>
  `;

  return `
    <div class="overflow-x-auto shadow-md rounded-lg" style="max-height: 70vh;">
      <table class="calificaciones-table min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        ${headerHtml}
        ${bodyHtml}
      </table>
    </div>
  `;
}

export function renderCeListModal(module, raId) {
  const ra = module.resultados_de_aprendizaje.find(r => r.ra_id === raId);
  if (!ra) return '';

  // --- INICIO: LÓGICA PARA OBTENER ACTIVIDADES POR CE ---
  const { db } = { db: getDB() };
  const moduleActivities = db.actividades.filter(a => a.moduleId === module.id);

  // Calcular pesos acumulados para los CEs de este RA
  const ceAccumulatedWeights = {};
  ra.criterios_de_evaluacion.forEach(ce => {
    const activitiesForCe = moduleActivities.filter(act => act.ceIds.includes(ce.ce_id));
    ceAccumulatedWeights[ce.ce_id] = activitiesForCe.reduce((sum, act) => sum + (act.peso || 1), 0);
  });
  // --- FIN: LÓGICA PARA OBTENER ACTIVIDADES POR CE ---


  return `
    <div id="ce-list-modal" class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div class="p-6 border-b dark:border-gray-700 flex justify-between items-start">
          <div>
            <h3 class="text-xl font-bold">Criterios de Evaluación de ${ra.ra_id}</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">${ra.ra_descripcion}</p>
          </div>
          <button id="close-ce-list-modal-btn" class="text-gray-500 hover:text-gray-800 dark:hover:text-white">&times;</button>
        </div>
        <div class="p-6 overflow-y-auto">
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Haz clic en el icono del maletín (💼) para marcar un CE como evaluado en empresa (Dual). El cambio se guarda automáticamente.
          </p>
          <div class="space-y-3">
            ${ra.criterios_de_evaluacion.map(ce => {
              const currentCeWeight = ceAccumulatedWeights[ce.ce_id] || 0;
              const activitiesForCe = moduleActivities.filter(act => act.ceIds.includes(ce.ce_id));
              const activitiesListHtml = activitiesForCe.length > 0 ? `
                <div class="mt-2 text-xs text-gray-600 dark:text-gray-400">
                  <ul class="list-disc list-inside ml-2">
                    ${activitiesForCe.map(act => {
                      const activityWeight = act.peso || 1;
                      const percentageOfCe = currentCeWeight > 0 ? (activityWeight / currentCeWeight * 100) : 0;
                      return `<li>${act.name} (Peso: ${activityWeight}, <span class="font-bold">${percentageOfCe.toFixed(1)}%</span>)</li>`;
                    }).join('')}
                  </ul>
                </div>
              ` : ``;

              return `
              <div class="p-3 rounded-md ${ce.dual ? 'bg-blue-50 dark:bg-blue-900/50' : 'bg-gray-50 dark:bg-gray-900/20'}">
                <div class="flex items-start gap-4">
                  <button 
                    class="toggle-dual-btn p-2 rounded-md ${ce.dual ? 'bg-blue-100 dark:bg-blue-900 text-blue-600' : 'bg-gray-200 dark:bg-gray-600 text-gray-500'} hover:bg-blue-200 dark:hover:bg-blue-800" 
                    data-ce-id="${ce.ce_id}" 
                    title="Marcar/Desmarcar como evaluado en empresa (Dual)"
                  >
                    ${ICONS.Briefcase}
                  </button>
                  <div class="flex-grow">
                    <p class="font-bold text-gray-900 dark:text-white">${ce.ce_id}</p>
                    <p class="text-sm text-gray-700 dark:text-gray-300">${ce.ce_descripcion}</p>
                    ${activitiesListHtml}
                  </div>
                </div>
              </div>
            `}).join('')}
          </div>
        </div>
        <div class="p-4 border-t dark:border-gray-700 text-right">
          <button id="close-ce-list-modal-btn-footer" class="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Renderiza un modal con el desglose detallado de un Resultado de Aprendizaje (RA).
 * @param {object} module - El objeto del módulo.
 * @param {string} raId - El ID del RA a detallar.
 * @returns {string} El HTML del modal.
 */
export function renderRaDetailModal(module, raId) {
  const { db } = { db: getDB() };
  const ra = module.resultados_de_aprendizaje.find(r => r.ra_id === raId);
  if (!ra) return '';

  const moduleActivities = db.actividades.filter(a => a.moduleId === module.id);

  // Calcular pesos acumulados para los CEs de este RA
  const ceAccumulatedWeights = {};
  ra.criterios_de_evaluacion.forEach(ce => {
    const activitiesForCe = moduleActivities.filter(act => act.ceIds.includes(ce.ce_id));
    ceAccumulatedWeights[ce.ce_id] = activitiesForCe.reduce((sum, act) => sum + (act.peso || 1), 0);
  });

  return `
    <div id="ra-detail-modal" class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div class="p-6 border-b dark:border-gray-700">
          <h3 class="text-xl font-bold">Desglose de ${ra.ra_id}</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">${ra.ra_descripcion}</p>
        </div>
        <div class="p-6 overflow-y-auto">
          <div class="space-y-4">
            ${ra.criterios_de_evaluacion.map(ce => {
              const currentCeWeight = ceAccumulatedWeights[ce.ce_id] || 0;
              const activitiesForCe = moduleActivities.filter(act => act.ceIds.includes(ce.ce_id));
              const activitiesListHtml = activitiesForCe.length > 0 ? `
                <div class="mt-2 text-xs text-gray-600 dark:text-gray-400">
                  <span class="font-semibold">Actividades que evalúan este CE:</span>
                  <ul class="list-disc list-inside ml-2">
                    ${activitiesForCe.map(act => {
                      const activityWeight = act.peso || 1;
                      const percentageOfCe = currentCeWeight > 0 ? (activityWeight / currentCeWeight * 100) : 0;
                      return `<li>${act.name} (Peso: ${activityWeight}, <span class="font-bold">${percentageOfCe.toFixed(1)}%</span>)</li>`;
                    }).join('')}
                  </ul>
                </div>
              ` : `<p class="mt-2 text-xs text-gray-500 dark:text-gray-400">Ninguna actividad evalúa este CE.</p>`;

              return `
                <div class="p-3 rounded-md bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
                  <div class="flex justify-between items-start">
                    <div>
                      <p class="font-semibold text-gray-800 dark:text-gray-200">${ce.ce_id}</p>
                      <p class="text-sm text-gray-600 dark:text-gray-400">${ce.ce_descripcion}</p>
                    </div>
                    <span class="font-bold text-lg text-blue-600 dark:text-blue-400">${currentCeWeight.toFixed(1)}</span>
                  </div>
                  ${activitiesListHtml}
                </div>
              `;
            }).join('')}
          </div>
        </div>
        <div class="p-4 border-t dark:border-gray-700 text-right">
          <button id="close-ra-detail-modal-btn" class="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Renderiza un resumen compacto de la distribución de pesos por RA.
 * @param {object} module - El objeto del módulo.
 * @returns {string} El HTML del resumen.
 */
function renderRaWeightSummary(module) {
  const { db } = { db: getDB() };
  const moduleActivities = db.actividades.filter(a => a.moduleId === module.id);

  const totalModuleActivityWeight = moduleActivities.reduce((sum, act) => sum + (act.peso || 1), 0);

  const raData = module.resultados_de_aprendizaje.map(ra => {
    const ceIdsInThisRa = ra.criterios_de_evaluacion.map(ce => ce.ce_id);
    const uniqueActivitiesForThisRa = new Set();

    moduleActivities.forEach(act => {
      if (act.ceIds.some(actCeId => ceIdsInThisRa.includes(actCeId))) {
        uniqueActivitiesForThisRa.add(act.id);
      }
    });

    let raTotalWeight = 0;
    uniqueActivitiesForThisRa.forEach(actId => {
      const activity = moduleActivities.find(a => a.id === actId);
      if (activity) {
        raTotalWeight += (activity.peso || 1);
      }
    });

    const percentage = totalModuleActivityWeight > 0 ? (raTotalWeight / totalModuleActivityWeight * 100) : 0;

    return {
      id: ra.ra_id,
      weight: raTotalWeight,
      percentage: percentage
    };
  });

  return `
    <div class="mb-6 p-4 border rounded-lg bg-gray-50 dark:bg-gray-900/50">
      <h4 class="font-semibold mb-3 text-gray-800 dark:text-gray-200">Resumen de Pesos por RA</h4>
      <div class="space-y-3">
        ${raData.map(ra => `
          <button class="open-ra-detail-modal-btn w-full text-left p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" data-module-id="${module.id}" data-ra-id="${ra.id}">
            <div class="flex justify-between items-center text-sm mb-1">
              <span class="font-bold text-gray-700 dark:text-gray-300">${ra.id}</span>
              <span class="text-gray-600 dark:text-gray-400">${ra.weight.toFixed(1)} / ${totalModuleActivityWeight.toFixed(1)} (${ra.percentage.toFixed(1)}%)</span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div class="bg-blue-600 h-2.5 rounded-full" style="width: ${ra.percentage.toFixed(2)}%"></div>
            </div>
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

export function renderActividadesManagement(module) {
  const { db } = { db: getDB() };
  const { actividades } = db;
  const activityTypes = module.activityTypes || [
    { nombre: 'Examen', peso: 3 },
    { nombre: 'Práctica', peso: 2 },
    { nombre: 'Ejercicios', peso: 1 },
  ];
  const moduleActividades = actividades.filter(a => a.moduleId === module.id);

  // --- INICIO: CÁLCULO DE PESOS POR TRIMESTRE ---
  const { ui } = { ui: getUI() };
  const trimesterTotalWeights = { '1': 0, '2': 0, '3': 0 };
  db.actividades.filter(a => a.moduleId === module.id).forEach(act => { // Usamos todas, no las filtradas
    // Asegurarnos de que solo contamos actividades de trimestres válidos
    if (trimesterTotalWeights[act.trimestre] !== undefined) {
      trimesterTotalWeights[act.trimestre] += (act.peso || 1);
    }
  });
  // --- FIN: CÁLCULO DE PESOS POR TRIMESTRE ---

  // --- INICIO: LÓGICA DE BÚSQUEDA ---
  const searchTerm = ui.activitySearchTerm || '';
  const filteredModuleActividades = moduleActividades.filter(act => 
    act.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  // --- FIN: LÓGICA DE BÚSQUEDA ---

  // 1. Crear un Set con todos los CE IDs que ya están en uso en alguna actividad de este módulo.
  const usedCeIds = new Set(
    moduleActividades.flatMap(act => act.ceIds)
  );

  // 2. Agrupar CEs por UD y contar en cuántas UDs aparece cada CE.
  const allModuleCes = module.resultados_de_aprendizaje.flatMap(ra => ra.criterios_de_evaluacion);
  const ceUdInfo = {}; // Para almacenar las UDs de cada CE. e.g., { "RA1-a": ["UD 10"] }
  const cesByUd = {};   // Para agrupar los CEs por UD

  allModuleCes.forEach(ce => {
    const udRef = ce.ud_ref || '';
    const mainUds = udRef.match(/UD ?\d+/g) || [];

    // Almacenar la lista de UDs para este CE
    ceUdInfo[ce.ce_id] = mainUds;

    mainUds.forEach(ud => {
      if (!cesByUd[ud]) cesByUd[ud] = [];
      cesByUd[ud].push(ce);
    });
  });

  // 3. Garantizar que todos los CEs se muestren, incluso si no tienen UD.
  const fallbackKey = 'Sin Unidad Didáctica';
  if (!cesByUd[fallbackKey]) {
    cesByUd[fallbackKey] = [];
  }
  
  const groupedCeIds = new Set(Object.values(cesByUd).flatMap(ceList => ceList.map(ce => ce.ce_id)));
  allModuleCes.forEach(ce => {
    if (!groupedCeIds.has(ce.ce_id)) {
      // Si un CE no fue asignado a ninguna UD (porque su ud_ref no coincide con el patrón), lo añadimos al grupo "Sin UD".
      if (!cesByUd[fallbackKey].some(c => c.ce_id === ce.ce_id)) {
        cesByUd[fallbackKey].push(ce);
      }
    }
  });

  const sortedUds = Object.keys(cesByUd).sort();

  // 4. Calcular el peso total para cada UD.
  const udTotalWeights = {};
  sortedUds.forEach(ud => udTotalWeights[ud] = cesByUd[ud].reduce((sum, ce) => sum + (ce.peso || 0), 0));

  return `
    <div class="my-6 bg-white dark:bg-gray-800 shadow-lg rounded-lg">
      <div class="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 class="font-semibold text-lg flex items-center gap-2">
          ${ICONS.ClipboardList} Gestionar Actividades Evaluables (${moduleActividades.length})
        </h3>
      </div>
      <div class="p-6 grid grid-cols-1 gap-8">
          <!-- Lista de Actividades -->
          <div>
            ${renderRaWeightSummary(module)}
            <div class="flex justify-between items-center mb-3">
              <h4 class="font-semibold">Actividades Creadas (${filteredModuleActividades.length})</h4>
            </div>
            <input type="text" id="activity-search-input" value="${searchTerm}" class="w-full p-2 mb-3 border rounded-md dark:bg-gray-900" placeholder="Buscar actividad...">
            <div id="activity-list-container" class="space-y-2 max-h-60 overflow-y-auto">
              ${filteredModuleActividades.length > 0 ? filteredModuleActividades.map(act => {
                const totalWeightForTrimester = trimesterTotalWeights[act.trimestre] || 0;
                const activityWeight = act.peso || 1;
                const percentage = totalWeightForTrimester > 0 ? (activityWeight / totalWeightForTrimester) * 100 : 0;
                return `
                <div draggable="true" data-actividad-id="${act.id}" class="activity-draggable flex items-center gap-2 bg-gray-100 dark:bg-gray-700 p-2 rounded-md group">
                  <span class="drag-handle cursor-move text-gray-400" title="Arrastrar para reordenar">${ICONS.GripVertical}</span>
                  <button class="open-actividad-panel-btn flex-grow text-left" data-actividad-id="${act.id}">
                    <div class="flex justify-between items-start">
                      <div>
                        <p class="font-bold">${act.name}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">CEs: ${act.ceIds.join(', ')}</p>
                      </div>
                      <span class="text-sm font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        T${act.trimestre} (${percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </button>
                  <button 
                    class="delete-activity-from-list-btn text-red-500 hover:text-red-700 p-1 opacity-0 group-hover:opacity-100 transition-opacity" 
                    data-actividad-id="${act.id}" 
                    title="Eliminar actividad">
                      ${ICONS.Trash2}
                  </button>
                </div>
              `}).join('') : `<p class="text-sm text-gray-500 text-center">${searchTerm ? 'No se encontraron actividades.' : 'No hay actividades creadas.'}</p>`}
            </div>
          </div>
          <!-- Formulario para Nueva Actividad -->
          <div>
            <h4 class="font-semibold mb-3">Crear Nueva Actividad</h4>
            <form id="actividad-form" data-module-id="${module.id}" class="space-y-3">
              <div>
                <label for="act-name" class="text-sm font-medium">Nombre</label>
                <input type="text" id="act-name" name="name" placeholder="Ej: Examen T1" required class="w-full p-2 mt-1 border rounded-md dark:bg-gray-900" name="name">
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="text-sm font-medium">Tipo</label>
                    <div id="act-type-btn-group" class="flex flex-wrap gap-2 mt-1">
                        <label class="flex-1">
                            <input type="radio" name="type" value="" class="hidden peer" checked>
                            <div class="cursor-pointer text-center text-sm p-2 rounded-md border peer-checked:bg-blue-600 peer-checked:text-white peer-checked:border-blue-600 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600">Pers.</div>
                        </label>
                        ${activityTypes.map(t => `
                            <label class="flex-1">
                                <input type="radio" name="type" value="${t.peso}" class="hidden peer">
                                <div class="cursor-pointer text-center text-sm p-2 rounded-md border peer-checked:bg-blue-600 peer-checked:text-white peer-checked:border-blue-600 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600">${t.nombre}</div>
                            </label>
                        `).join('')}
                    </div>
                </div>
                <div>
                    <label class="text-sm font-medium">Trimestre</label>
                    <div class="flex gap-2 mt-1">
                        ${['1', '2', '3'].map(trim => `
                            <label class="flex-1">
                                <input type="radio" name="trimestre" value="${trim}" required class="hidden peer" ${trim === '1' ? 'checked' : ''}>
                                <div class="cursor-pointer text-center text-sm p-2 rounded-md border peer-checked:bg-blue-600 peer-checked:text-white peer-checked:border-blue-600 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600">${trim}º</div>
                            </label>
                        `).join('')}
                    </div>
                </div>
              </div>
              <div>
                <label for="act-peso" class="text-sm font-medium">Peso (se autocompleta al elegir un tipo)</label>
                <input type="number" id="act-peso" name="peso" value="1" step="0.1" min="0" required class="w-full p-2 mt-1 border rounded-md dark:bg-gray-900" name="peso">
              </div>
              <p class="text-sm mb-2">Criterios de Evaluación a los que se asocia:</p>
              <div class="max-h-60 overflow-y-auto border rounded-md p-2 space-y-1" id="ce-checkbox-container">
                ${sortedUds.map(ud => `
                  <div class="py-1">
                    ${ud !== 'Sin Unidad Didáctica' ? `
                      <label class="flex items-center gap-2 text-sm font-bold">
                        <input type="checkbox" class="ud-master-checkbox" data-ud-ref="${ud}">
                        <span>${ud} <span class="font-normal text-gray-500 dark:text-gray-400">(Peso Total: ${udTotalWeights[ud].toFixed(2)}%)</span></span>
                      </label>
                    ` : `
                      <h5 class="text-sm font-bold text-gray-500 dark:text-gray-400">${ud}</h5>
                    `}
                    <div class="pl-6 mt-1 space-y-1">
                      ${cesByUd[ud].map(ce => `
                        <label class="flex items-center gap-2 text-sm">
                          <input type="checkbox" name="ceIds" value="${ce.ce_id}" class="ce-checkbox-for-ud-${ud.replace(/ /g, '-')}">
                          <span class="${usedCeIds.has(ce.ce_id) ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} flex items-center gap-1">
                            ${ce.ce_id} (${ce.peso}%) - ${ce.ce_descripcion}
                            ${ceUdInfo[ce.ce_id]?.length > 1 ? `
                              <span class="text-xs font-semibold text-blue-500" title="Este CE pertenece a: ${ceUdInfo[ce.ce_id].join(', ')}">(${ceUdInfo[ce.ce_id].join(', ')})</span>
                            ` : ''}
                          </span>
                        </label>
                      `).join('')}
                    </div>
                  </div>
                `).join('')}
              </div>
              ${renderImpactPanel()}
              <button type="submit" class="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
                Crear Actividad
              </button>
            </form>
          </div>
      </div>
    </div>
  `;
}

export function renderActividadDetailPage() {
  const { db, ui } = { db: getDB(), ui: getUI() };
  const actividad = db.actividades.find(a => a.id === ui.selectedActividadId);
  const module = db.modules.find(m => m.id === actividad?.moduleId);

  console.log(`[LOG][renderActividadDetailPage] Renderizando detalle para actividad ID: ${ui.selectedActividadId}`);
  if (!actividad || !module) {
    return `<div class="p-6"><p>Error: No se pudo encontrar la actividad o el módulo asociado. <button data-page="modulos" class="text-blue-500 underline">Volver a Módulos</button></p></div>`;
  }

  const moduleStudents = (module.studentIds || []).map(id => db.students.find(s => s.id === id)).filter(Boolean);
  const allCes = module.resultados_de_aprendizaje.flatMap(ra => ra.criterios_de_evaluacion);
  const { grades } = db;

  return `
    <div class="container mx-auto px-6 py-8">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h2 class="text-3xl font-bold">Gestionar Actividad: ${actividad.name}</h2>
          <p class="text-lg text-gray-500 dark:text-gray-400">${module.modulo}</p>
        </div>
        <button data-page="modulos" class="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg">Volver a Módulos</button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Columna de Edición de Actividad -->
        <div class="lg:col-span-1 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 h-fit">
          <h3 class="text-xl font-semibold mb-4">Editar Actividad</h3>
          <form class="update-actividad-form space-y-3" data-actividad-id="${actividad.id}">
              <div>
                <label class="text-sm font-medium">Nombre</label>
                <input type="text" name="name" value="${actividad.name}" required class="w-full p-2 mt-1 border rounded-md dark:bg-gray-900" placeholder="Nombre de la actividad">
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="text-sm font-medium">Peso</label>
                  <input type="number" name="peso" value="${actividad.peso || 1}" step="0.1" min="0" required class="w-full p-2 mt-1 border rounded-md dark:bg-gray-900">
                </div>
                <div>
                  <label class="text-sm font-medium">Trimestre</label>
                  <select name="trimestre" required class="w-full p-2 mt-1 border rounded-md dark:bg-gray-900">
                    <option value="1" ${actividad.trimestre === '1' ? 'selected' : ''}>1º</option>
                    <option value="2" ${actividad.trimestre === '2' ? 'selected' : ''}>2º</option>
                    <option value="3" ${actividad.trimestre === '3' ? 'selected' : ''}>3º</option>
                  </select>
                </div>
              </div>
              <p class="text-sm font-medium">Criterios de Evaluación asociados:</p>
              <div class="max-h-48 overflow-y-auto border rounded-md p-2 space-y-1 bg-white dark:bg-gray-800" id="ce-checkbox-container">
                ${module.resultados_de_aprendizaje.map(ra => `
                  <div class="py-1">
                    <label class="flex items-center gap-2 text-sm font-bold">
                      <input type="checkbox" class="ra-master-checkbox" data-ra-id="${ra.ra_id}">
                      <span>${ra.ra_id}</span>
                    </label>
                    <div class="pl-6 mt-1 space-y-1">
                      ${ra.criterios_de_evaluacion.map(ce => `
                        <label class="flex items-center gap-2 text-sm">
                          <input type="checkbox" name="ceIds" value="${ce.ce_id}" class="ce-checkbox-for-${ra.ra_id}" ${actividad.ceIds.includes(ce.ce_id) ? 'checked' : ''}>
                          <span class="flex items-center gap-1">
                            ${ce.dual ? `<span class="text-blue-500" title="Evaluado en empresa (Dual)">${ICONS.Briefcase}</span>` : ''}
                            ${ce.ce_id} - ${ce.ce_descripcion.substring(0, 40)}...
                          </span>
                        </label>
                      `).join('')}
                    </div>
                  </div>`).join('')}
              </div>
              ${renderImpactPanel()}
              <div class="flex gap-2 pt-2">
                <button type="submit" class="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg">Guardar</button>
                <button type="button" id="open-import-grades-modal-btn" data-actividad-id="${actividad.id}" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Importar Notas</button>
                <button type="button" class="delete-actividad-btn bg-red-600 hover:bg-red-700 text-white font-bold p-2 rounded-lg" data-actividad-id="${actividad.id}" title="Eliminar Actividad">
                  ${ICONS.Trash2}
                </button>
              </div>
            </form>
            ${renderClipboardPanel(actividad, module)}
        </div>

        <!-- Columna de Calificaciones -->
        <div class="lg:col-span-2 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
          <h3 class="text-xl font-semibold mb-4">Calificaciones de Alumnos/as</h3>
          <div class="overflow-x-auto">
            <table class="min-w-full">
              <thead class="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th class="px-4 py-3 text-left text-sm font-medium">Alumno/a</th>
                  <th class="px-4 py-3 text-center text-sm font-medium">Nota Final</th>
                  <th class="px-4 py-3 text-left text-sm font-medium">Historial</th>
                  <th class="px-4 py-3 text-left text-sm font-medium">Nueva Calificación</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-600">
                ${moduleStudents.map(student => {
                  const attempts = grades[student.id]?.[actividad.id] || [];
                  const finalGrade = attempts.length > 0 ? Math.max(...attempts.map(a => a.grade)) : null;

                  return `
                    <tr class="align-top">
                      <td class="px-4 py-4 font-semibold">${student.name}</td>
                      <td class="px-4 py-4 text-center font-bold text-xl ${finalGrade === null ? '' : (finalGrade >= 5 ? 'text-green-500' : 'text-red-500')}">
                        ${finalGrade !== null ? finalGrade.toFixed(2) : '-'}
                      </td>
                      <td class="px-4 py-4">
                        <div class="space-y-2 max-h-32 overflow-y-auto">
                          ${attempts.length > 0 ? attempts.map(att => `
                            <div class="text-xs bg-gray-100 dark:bg-gray-900/50 p-2 rounded">
                              <div class="flex justify-between">
                                <span>${att.type}: <span class="font-bold">${att.grade.toFixed(2)}</span></span>
                                <button class="delete-attempt-btn text-red-400 hover:text-red-600" data-student-id="${student.id}" data-actividad-id="${actividad.id}" data-attempt-id="${att.id}">&times;</button>
                              </div>
                              <p class="text-gray-500 italic">"${att.observation || 'Sin observación'}"</p>
                              <p class="text-right text-gray-400">${new Date(att.date).toLocaleDateString()}</p>
                            </div>
                          `).join('') : '<p class="text-xs text-gray-500">Sin calificaciones</p>'}
                        </div>
                      </td>
                      <td class="px-4 py-4">
                        <form class="add-attempt-form space-y-2" data-student-id="${student.id}" data-actividad-id="${actividad.id}">
                          <input type="number" name="grade" step="0.01" min="0" max="10" placeholder="Nota" required class="w-full p-1 border rounded dark:bg-gray-900 text-sm">
                          <select name="type" class="w-full p-1 border rounded dark:bg-gray-900 text-sm">
                            <option value="Ordinaria">Ordinaria</option>
                            <option value="Recuperación">Recuperación</option>
                            <option value="Mejora de nota">Mejora de nota</option>
                          </select>
                          <input type="text" name="observation" placeholder="Observación (opcional)" class="w-full p-1 border rounded dark:bg-gray-900 text-sm">
                          <button type="submit" class="w-full text-xs bg-blue-500 hover:bg-blue-600 text-white py-1.5 px-2 rounded">Añadir</button>
                        </form>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
          <!-- INICIO: CORRECCIÓN - Botón "Volver a Módulos" duplicado en la parte inferior -->
          <div class="mt-6 flex justify-end">
            <button data-page="modulos" class="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg">Volver a Módulos</button>
          </div>
          <!-- FIN: CORRECCIÓN -->
        </div>
      </div>
    </div>
  `;
}

function renderClipboardPanel(actividad, module) {
  // 1. Obtener los CEs completos de la actividad
  const ceIds = new Set(actividad.ceIds);
  const allModuleCes = module.resultados_de_aprendizaje.flatMap(ra => 
    ra.criterios_de_evaluacion.map(ce => ({ ...ce, ra_id: ra.ra_id, ra_descripcion: ra.ra_descripcion }))
  );
  const actividadCes = allModuleCes.filter(ce => ceIds.has(ce.ce_id));

  // 2. Agrupar CEs por RA
  const rasMap = new Map();
  actividadCes.forEach(ce => {
    if (!rasMap.has(ce.ra_id)) {
      rasMap.set(ce.ra_id, {
        ra_id: ce.ra_id,
        ra_descripcion: ce.ra_descripcion,
        ces: []
      });
    }
    rasMap.get(ce.ra_id).ces.push(ce);
  });

  // 3. Generar el texto para copiar
  let textToCopy = `Actividad: ${actividad.name} (T${actividad.trimestre})\n`;
  textToCopy += `Módulo: ${module.modulo}\n\n`;
  textToCopy += "========================================\n\n";

  rasMap.forEach(ra => {
    textToCopy += `RA: ${ra.ra_id} - ${ra.ra_descripcion}\n`;
    ra.ces.forEach(ce => {
      textToCopy += `  - CE: ${ce.ce_id} - ${ce.ce_descripcion}\n`;
    });
    textToCopy += "\n";
  });

  // 4. Generar el HTML
  return `
    <div class="mt-6 border-t pt-6 border-gray-200 dark:border-gray-700">
      <h3 class="text-xl font-semibold mb-4 flex items-center gap-2">
        ${ICONS.ClipboardList} Información para Portapapeles
      </h3>
      <div class="bg-gray-100 dark:bg-gray-900 p-3 rounded-md text-sm max-h-60 overflow-y-auto">
        <pre class="whitespace-pre-wrap font-sans">${textToCopy}</pre>
      </div>
      <button 
        id="copy-details-btn" 
        class="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all"
        data-copy-text="${encodeURIComponent(textToCopy)}"
      >
        <span class="btn-icon">${ICONS.ClipboardList}</span>
        <span class="btn-text">Copiar al Portapapeles</span>
      </button>
    </div>
  `;
}

/**
 * Renderiza el modal para importar calificaciones para una actividad específica.
 * @param {string} actividadId - El ID de la actividad.
 * @param {string} actividadName - El nombre de la actividad.
 * @returns {string} El HTML del modal.
 */
export function renderImportGradesModal(actividadId, actividadName) {
  const templateJSON = JSON.stringify([
    {
      "studentName": "Apellidos Completos, Nombre",
      "grade": 8.5
    },
    {
      "studentName": "Otro Alumno, Nombre",
      "grade": 4.2,
      "type": "Recuperación",
      "observation": "Nota de la recuperación."
    },
    {
      "studentName": "Tercer Alumno, Nombre",
      "grade": 9.0,
      "type": "Mejora de nota"
    }
  ], null, 2);

  return `
    <div id="import-grades-modal" class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div class="p-6 border-b dark:border-gray-700">
          <h3 class="text-xl font-bold">Importar Calificaciones</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Importando para la actividad: <span class="font-semibold">${actividadName}</span>
          </p>
        </div>
        <div class="p-6 overflow-y-auto">
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Pega un array de objetos JSON con los nombres de los alumnos y sus notas. El nombre debe coincidir con el formato "Apellidos, Nombre".
          </p>
          <textarea id="grades-json-textarea" class="w-full h-64 p-3 font-mono text-xs border rounded-md dark:bg-gray-900">${templateJSON}</textarea>
        </div>
        <div class="p-6 border-t dark:border-gray-700 flex justify-end gap-4">
          <button id="cancel-import-grades" class="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg">Cancelar</button>
          <button id="confirm-import-grades" data-actividad-id="${actividadId}" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Importar Calificaciones</button>
        </div>
      </div>
    </div>
  `;
}





function renderAlumnoView(module, moduleStudents) {
  const { db, ui } = { db: getDB(), ui: getUI() };
  const { selectedStudentIdForView } = getUI();
  const calculatedGrades = getCalculatedGrades();
  const sortedStudents = sortStudentsForTableView(moduleStudents, ui.tableViewSort, calculatedGrades[module.id]);

  if (!moduleStudents || moduleStudents.length === 0) {
       return `<p class="text-center text-gray-500 dark:text-gray-400 mt-10">No hay alumnos/as para mostrar en esta vista.</p>`;
  }
  
  const currentStudent = moduleStudents.find(s => s.id === selectedStudentIdForView);
  // Usamos la lista ordenada para la navegación
  const studentIndex = sortedStudents.findIndex(s => s.id === selectedStudentIdForView);
  const prevStudent = studentIndex > 0 ? sortedStudents[studentIndex - 1] : null;
  const nextStudent = studentIndex < sortedStudents.length - 1 ? sortedStudents[studentIndex + 1] : null;
  
  if (!currentStudent || studentIndex === -1) {
       console.error("Error: Could not find student with ID:", selectedStudentIdForView);
       return `<p class="text-center text-red-500 dark:text-red-400 mt-10">Error: Alumno/a no encontrado.</p>`;
  }
  
  const isFirstStudent = studentIndex === 0;
  const isLastStudent = studentIndex === sortedStudents.length - 1;

  const finalGrades = (calculatedGrades[module.id]?.Final?.[currentStudent.id]) || { raTotals: {}, moduleGrade: 0, ceFinalGrades: {} };
  const finalModuleGrade = (typeof finalGrades.moduleGrade === 'number') ? finalGrades.moduleGrade.toFixed(2) : '0.00';
  const baseFinalModuleGrade = (typeof finalGrades.baseModuleGrade === 'number') ? finalGrades.baseModuleGrade.toFixed(2) : '0.00';

  const t1Grades = calculatedGrades[module.id]?.T1?.[currentStudent.id];
  const t2Grades = calculatedGrades[module.id]?.T2?.[currentStudent.id];
  const t3Grades = calculatedGrades[module.id]?.T3?.[currentStudent.id];
  const studentGrades = db.grades[currentStudent.id] || {};

  // --- INICIO: Lógica para el estado de los paneles plegables ---
  const openPanels = new Set(ui.openPanels || []);
  const isCommentsOpen = openPanels.has('comments-panel');
  const isAptitudOpen = openPanels.has('aptitud-panel');
  // --- FIN: Lógica para el estado de los paneles plegables ---


  return ` 
    <div class="p-4">
      <!-- Navegación y Nombre del Alumno -->
      <div class="flex items-center justify-between mb-2">
        <button id="prev-student-btn" ${!prevStudent ? 'disabled' : ''} class="p-2 rounded-full transition-colors ${!prevStudent ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}" aria-label="Alumno/a anterior" title="Alumno/a anterior">
            ${ICONS.ArrowLeftCircle}
        </button>
        
        <!-- INICIO: Selector de Alumno Desplegable -->
        <div class="relative flex-grow mx-4">
          <button id="student-selector-toggle" class="w-full text-center text-2xl font-bold text-gray-900 dark:text-white p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center gap-2">
            ${currentStudent.name}
            <span class="text-gray-500">${ICONS.ChevronRight}</span>
          </button>
          <div id="student-selector-dropdown" class="hidden absolute top-full mt-2 w-full bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg z-20">
            <div class="p-2">
              <input type="text" id="student-search-input" placeholder="Buscar alumno/a..." class="w-full p-2 border rounded-md dark:bg-gray-900">
            </div>
            <ul id="student-selector-list" class="max-h-60 overflow-y-auto">
              ${moduleStudents.map(s => `
                <li class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ${s.id === selectedStudentIdForView ? 'bg-blue-100 dark:bg-blue-800' : ''}" data-student-id="${s.id}">
                  ${s.name}
                </li>
              `).join('')}
            </ul>
          </div>
        </div>
        <!-- FIN: Selector de Alumno Desplegable -->

        <button id="next-student-btn" ${!nextStudent ? 'disabled' : ''} class="p-2 rounded-full transition-colors ${!nextStudent ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}" aria-label="Alumno/a siguiente" title="Alumno/a siguiente">
            ${ICONS.ArrowRightCircle}
        </button>
      </div>

      <p class="text-lg text-gray-600 dark:text-gray-400 mb-6 text-center">${module.modulo}</p>

      <div class="space-y-6">
        <!-- Paneles Plegables para Comentarios y Aptitud -->
        <div id="comments-panel" class="collapsible-panel bg-white dark:bg-gray-800 shadow-lg rounded-lg">
          <button class="collapsible-toggle w-full flex justify-between items-center p-4 font-bold text-lg" data-panel-id="comments-panel">
            <span class="flex items-center gap-2">${ICONS.FileText} Comentarios y Anotaciones</span>
            <span class="chevron-icon transform transition-transform ${isCommentsOpen ? 'rotate-90' : ''}">${ICONS.ChevronRight}</span>
          </button>
          <div class="collapsible-content ${isCommentsOpen ? '' : 'hidden'} p-6 border-t border-gray-200 dark:border-gray-700">
            ${renderCommentForm(currentStudent, module)}
          </div>
        </div>

        <div id="aptitud-panel" class="collapsible-panel bg-white dark:bg-gray-800 shadow-lg rounded-lg">
          <button class="collapsible-toggle w-full flex justify-between items-center p-4 font-bold text-lg" data-panel-id="aptitud-panel">
            <span class="flex items-center gap-2">${ICONS.User} Actitud y Participación (Positivos/Negativos)</span>
            <span class="chevron-icon transform transition-transform ${isAptitudOpen ? 'rotate-90' : ''}">${ICONS.ChevronRight}</span>
          </button>
          <div class="collapsible-content ${isAptitudOpen ? '' : 'hidden'} p-6 border-t border-gray-200 dark:border-gray-700">
            ${renderAptitudPanel(currentStudent, module)}
          </div>
        </div>

        <!-- Columna 2: Tabla de Calificaciones Completa -->
        <div class="lg:col-span-3 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
          <div class="mb-4">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Tabla General de Calificaciones</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">Alumno/a seleccionado para calificar: <span class="font-bold text-blue-600 dark:text-blue-400">${currentStudent.name}</span></p>
            <p class="text-xs text-gray-500 dark:text-gray-500 mt-1">Haz clic en otra fila para cambiar de alumno/a.</p>
          </div>
          ${renderCuadernoCalificaciones(module, sortedStudents)}
        </div>
      </div>
    </div>
  `;
}

function renderAptitudPanel(student, module) {
  const { aptitudes } = getDB();
  const studentAptitudes = aptitudes?.[module.id]?.[student.id] || {};
  const basePositiva = module.aptitudBasePositiva ?? 1.1;
  const baseNegativa = module.aptitudBaseNegativa ?? 1.1;

  const renderTrimesterAptitud = (trimester) => {
    const trimesterKey = `T${trimester}`;
    const data = studentAptitudes[trimesterKey] || { positives: [], negatives: [] };
    const numPositives = data.positives.length;
    const numNegatives = data.negatives.length;

    let ajustePositivo = 0;
    if (numPositives > 0) ajustePositivo = Math.pow(basePositiva, numPositives) - 1;
    let ajusteNegativo = 0;
    if (numNegatives > 0) ajusteNegativo = Math.pow(baseNegativa, numNegatives) - 1;

    return `
      <div class="bg-gray-100 dark:bg-gray-900/50 p-4 rounded-lg">
        <h4 class="font-bold text-lg mb-3">Trimestre ${trimester}</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Positivos -->
          <div>
            <div class="flex justify-between items-center mb-2">
              <h5 class="font-semibold text-green-600">Positivos (${numPositives})</h5>
              <button class="add-aptitud-btn bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-1 px-2 rounded" data-module-id="${module.id}" data-student-id="${student.id}" data-trimester="${trimester}" data-type="positives">+</button>
            </div>
            <p class="text-xs italic mb-2">Ajuste: +${ajustePositivo.toFixed(3)}</p>
            <div class="space-y-1 text-xs max-h-24 overflow-y-auto">
              ${data.positives.map(p => `
                <div class="flex justify-between items-center bg-white dark:bg-gray-800 p-1 rounded group">
                  <span class="truncate" title="${p.reason}">
                    ${p.reason} ${p.baseValue ? `<span class="text-blue-500 font-semibold">(Base: ${p.baseValue})</span>` : ''}
                  </span>
                  <button class="edit-aptitud-btn text-blue-500 opacity-0 group-hover:opacity-100" data-module-id="${module.id}" data-student-id="${student.id}" data-trimester="${trimester}" data-type="positives" data-id="${p.id}">✏️</button>
                  <button class="delete-aptitud-btn text-red-500" data-module-id="${module.id}" data-student-id="${student.id}" data-trimester="${trimester}" data-type="positives" data-id="${p.id}">&times;</button>
                </div>
              `).join('') || '<p class="text-gray-500">Sin positivos.</p>'}
            </div>
          </div>
          <!-- Negativos -->
          <div>
            <div class="flex justify-between items-center mb-2">
              <h5 class="font-semibold text-red-600">Negativos (${numNegatives})</h5>
              <button class="add-aptitud-btn bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-1 px-2 rounded" data-module-id="${module.id}" data-student-id="${student.id}" data-trimester="${trimester}" data-type="negatives">+</button>
            </div>
            <p class="text-xs italic mb-2">Ajuste: -${ajusteNegativo.toFixed(3)}</p>
            <div class="space-y-1 text-xs max-h-24 overflow-y-auto">
              ${data.negatives.map(n => `
                <div class="flex justify-between items-center bg-white dark:bg-gray-800 p-1 rounded group">
                  <span class="truncate" title="${n.reason}">
                    ${n.reason} ${n.baseValue ? `<span class="text-red-500 font-semibold">(Base: ${n.baseValue})</span>` : ''}
                  </span>
                  <button class="edit-aptitud-btn text-blue-500 opacity-0 group-hover:opacity-100" data-module-id="${module.id}" data-student-id="${student.id}" data-trimester="${trimester}" data-type="negatives" data-id="${n.id}">✏️</button>
                  <button class="delete-aptitud-btn text-red-500" data-module-id="${module.id}" data-student-id="${student.id}" data-trimester="${trimester}" data-type="negatives" data-id="${n.id}">&times;</button>
                </div>
              `).join('') || '<p class="text-gray-500">Sin negativos.</p>'}
            </div>
          </div>
        </div>
      </div>
    `;
  };

  return `
    <div class="mb-4">
      <div class="flex justify-between items-center">
        <div>
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">${ICONS.User} Aptitud Trimestral</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">Mostrando datos para: <span class="font-bold text-blue-600 dark:text-blue-400">${student.name}</span></p>
        </div>
        <div class="flex gap-2">
          <button class="bulk-delete-student-aptitudes-btn p-2 bg-amber-100 dark:bg-amber-900/50 text-amber-600 hover:bg-amber-200 dark:hover:bg-amber-800 rounded-full" data-module-id="${module.id}" data-student-id="${student.id}" data-type="positives" title="Limpiar todos los positivos del alumno">
            ${ICONS.Trash2}
          </button>
          <button class="bulk-delete-student-aptitudes-btn p-2 bg-red-100 dark:bg-red-900/50 text-red-600 hover:bg-red-200 dark:hover:bg-red-800 rounded-full" data-module-id="${module.id}" data-student-id="${student.id}" data-type="negatives" title="Limpiar todos los negativos del alumno">
            ${ICONS.Trash2}
          </button>
        </div>
      </div>
    </div>
    <div class="space-y-4">
      ${renderTrimesterAptitud(1)}
      ${renderTrimesterAptitud(2)}
      ${renderTrimesterAptitud(3)}
    </div>
  `;
}

/**
 * Renderiza el constructor de motivos interactivo.
 * @param {string} initialReason - El motivo inicial para precargar en el editor.
 * @returns {string} El HTML del constructor de motivos.
 */
function renderReasonBuilder(initialReason = '', suggestions = []) {
  console.log(`[LOG][renderReasonBuilder] Renderizando con ${suggestions.length} sugerencias.`);

  const renderSuggestionButton = (suggestion) => `
    <button 
      type="button" 
      class="reason-suggestion-btn group flex-shrink-0 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-sm pl-3 pr-2 py-1 rounded-full flex items-center gap-2" 
      data-reason="${suggestion.text}" 
      data-base-value="${suggestion.baseValue}"
      title="Valor: ${suggestion.baseValue}"
    >
      <span class="pointer-events-none">${suggestion.isFavorite ? '⭐' : ''} ${suggestion.text}</span>
      <span class="delete-suggestion-btn opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-800 dark:hover:text-red-300" data-reason-id="${suggestion.id}" data-module-id="${suggestion.moduleId}" data-type="${suggestion.type}" title="Eliminar esta sugerencia">
        &times;
      </span>
    </button>
  `;

  return `
    <div>
      <label for="aptitud-reason-display" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Motivo / Comentario</label>
      <input type="text" id="aptitud-reason-display" name="reason" value="${initialReason}" class="mt-1 w-full p-2 border rounded-md dark:bg-gray-900" placeholder="Construye el motivo con los botones o escribe directamente...">
      
      ${suggestions.length > 0 ? `
        <div class="mt-3">
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Sugerencias:</p>
          <div class="flex flex-wrap gap-2">
            ${suggestions.map(renderSuggestionButton).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

export function renderAptitudEntryModal(module, student, trimester, type, entryId = null) {
  const { db } = { db: getDB() };
  const isEdit = entryId !== null;
  const title = `${isEdit ? 'Editar' : 'Añadir'} ${type === 'positives' ? 'Positivo' : 'Negativo'}`;

  let existingEntry = null;
  let initialReason = '';
  let baseValueForInput;
  let effectiveDate = new Date().toISOString().split('T')[0];

  // --- INICIO: Lógica para obtener sugerencias ---
  const catalog = module.aptitudeReasons?.[type] || [];
  const favorites = catalog.filter(r => r.isFavorite);
  const nonFavorites = catalog.filter(r => !r.isFavorite);
  // Añadimos el ID del módulo y el tipo a cada sugerencia para que el handler de borrado sepa qué hacer
  const suggestions = [...favorites, ...nonFavorites].map(s => ({
    ...s,
    moduleId: module.id,
    type: type
  }));
  console.log(`[LOG][renderAptitudEntryModal] Obtenidas ${suggestions.length} sugerencias del catálogo para el tipo "${type}".`);
  // --- FIN: Lógica para obtener sugerencias ---

  if (isEdit) {
    const trimesterKey = `T${trimester}`;
    existingEntry = db.aptitudes?.[module.id]?.[student.id]?.[trimesterKey]?.[type]?.find(e => e.id === entryId);
    if (existingEntry) {
      effectiveDate = new Date(existingEntry.effectiveDate).toISOString().split('T')[0];
      initialReason = existingEntry.reason;
      baseValueForInput = existingEntry.baseValue;
    }
  }
  if (baseValueForInput === undefined) {
    baseValueForInput = type === 'positives' ? (module.aptitudBasePositiva ?? 1.1) : (module.aptitudBaseNegativa ?? 1.1);
  }

  return `
    <div id="aptitud-entry-modal" class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg">
        <form id="aptitud-entry-form" data-module-id="${module.id}" data-student-id="${student.id}" data-trimester="${trimester}" data-type="${type}" data-entry-id="${entryId || ''}">
          <div class="p-6 border-b dark:border-gray-700">
            <h3 class="text-xl font-bold">${title}</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">Para: ${student.name}</p>
          </div>
          <div class="p-6 space-y-4">
            ${renderReasonBuilder(initialReason, suggestions)}
            <div>
              <label for="aptitud-base-value" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Valor Base para esta Entrada</label>
              <input type="number" id="aptitud-base-value" name="baseValue" value="${baseValueForInput}" step="0.01" min="1" required class="mt-1 w-full p-2 border rounded-md dark:bg-gray-900">
            </div>
            <div>
              <label for="aptitud-date" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha de Efecto</label>
              <input type="date" id="aptitud-date" name="effectiveDate" value="${effectiveDate}" required class="mt-1 w-full p-2 border rounded-md dark:bg-gray-900">
            </div>
          </div>
          <div class="p-6 border-t dark:border-gray-700 flex justify-end gap-4">
            <button type="button" id="cancel-aptitud-entry" class="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg">Cancelar</button>
            <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">${isEdit ? 'Guardar Cambios' : 'Añadir'}</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

function renderCommentForm(student, module) {
  const db = getDB();
  const studentComments = (db.comments[module.id] && db.comments[module.id][student.id]) || [];
  const allCes = module.resultados_de_aprendizaje.flatMap(ra => ra.criterios_de_evaluacion);

  return `
    <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
      ${ICONS.FileText} Comentarios
    </h3>
    <form id="comment-form" data-student-id="${student.id}" data-module-id="${module.id}">
      <textarea name="text" class="w-full h-24 p-3 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-blue-500" placeholder="Escribe un nuevo comentario..."></textarea>
      <div class="flex gap-2 mt-2">
        <select name="type" class="comment-type-select flex-grow p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800">
          <option value="comportamiento">Comportamiento</option>
          <option value="ce">Asociar a CE</option>
        </select>
        <select name="ce" class="comment-ce-select hidden flex-grow p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800">
          ${allCes.map(ce => `<option value="${ce.ce_id}">${ce.ce_id}</option>`).join('')}
        </select>
      </div>
      <button type="submit" class="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2">
        ${ICONS.PlusCircle} Añadir Comentario
      </button>
    </form>
    <hr class="my-6 border-gray-300 dark:border-gray-700">
    <h4 class="text-lg font-semibold mb-3">Comentarios Guardados</h4>
    <div class="space-y-3 max-h-60 overflow-y-auto pr-2">
      ${studentComments.length > 0 ? studentComments.map(comment => `
        <div class="bg-gray-100 dark:bg-gray-900/50 p-3 rounded-md">
          <div class="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span class="font-semibold">${comment.type === 'ce' ? `CE: ${comment.ce_id}` : 'Comportamiento'}</span>
            <span>${new Date(comment.date).toLocaleDateString()}</span>
          </div>
          <p class="text-sm">${comment.text}</p>
          <div class="text-right mt-1">
            <button class="delete-comment-btn text-red-500 hover:text-red-700 text-xs" data-comment-id="${comment.id}" data-student-id="${student.id}" data-module-id="${module.id}">Eliminar</button>
          </div>
        </div>
      `).join('') : '<p class="text-sm text-gray-500">No hay comentarios para este alumno/a en este módulo.</p>'}
    </div>
  `;
}