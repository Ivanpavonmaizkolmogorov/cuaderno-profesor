import { ICONS } from './constants.js';
import { renderRaAccordion } from './components.js';
import { getDB, getUI, getCalculatedGrades } from '../state.js';

// Renderiza la página de Configuración
export function renderConfiguracionPage() {
  const studentText = `David Palomeque Aguilera
Adrián Manchado Moreno
Marta Pérez Padillo
María Ávila González
Mª de la Sierra Jiménez Castro
Manuel Baena Bueno
Abel Morales Barranco
Rosa Pavón Aguilera
Judith Fernández Porras`;

  const moduleText = `{
  "modulo": "Operaciones Auxiliares de Gestión de Tesorería",
  "id": "OAGT_0448",
  "resultados_de_aprendizaje": [
    {
      "ra_id": "RA1",
      "ra_descripcion": "Aplica métodos de control de tesorería.",
      "criterios_de_evaluacion": [
        { "ce_id": "RA1-a", "ce_descripcion": "Describe función y métodos de control.", "peso": 1.11, "ud_ref": "UD 10: 1. La gestión de la tesorería" },
        { "ce_id": "RA1-b", "ce_descripcion": "Diferencia flujos de entrada y salida.", "peso": 1.11, "ud_ref": "UD 10: 2. Los flujos de tesorería" },
        { "ce_id": "RA1-c", "ce_descripcion": "Cumplimenta libros y registros.", "peso": 1.11, "ud_ref": "UD 10: 4.1. Libro registro de caja" },
        { "ce_id": "RA1-d", "ce_descripcion": "Ejecuta arqueo y cuadre de caja.", "peso": 1.11, "ud_ref": "UD 10: 4. El control de la tesorería" },
        { "ce_id": "RA1-e", "ce_descripcion": "Coteja extractos bancarios.", "peso": 1.11, "ud_ref": "UD 10: 4.2. Libro registro de cuentas bancarias" },
        { "ce_id": "RA1-f", "ce_descripcion": "Describe utilidades de calendario de vencimientos.", "peso": 1.11, "ud_ref": "UD 10: 3.1. El presupuesto de tesorería" },
        { "ce_id": "RA1-g", "ce_descripcion": "Relaciona tesorería con otros deptos.", "peso": 1.11, "ud_ref": "UD 10: 1.1. El área de tesorería" },
        { "ce_id": "RA1-h", "ce_descripcion": "Utiliza medios telemáticos.", "peso": 1.11, "ud_ref": "UD 10: 5. Aplicaciones Informáticas" },
        { "ce_id": "RA1-i", "ce_descripcion": "Aplica principios de responsabilidad y confidencialidad.", "peso": 1.11, "ud_ref": "UD 10: (General)" }
      ]
    },
    {
      "ra_id": "RA2",
      "ra_descripcion": "Realiza trámites de instrumentos financieros.",
      "criterios_de_evaluacion": [
        { "ce_id": "RA2-a", "ce_descripcion": "Clasifica organizaciones del Sistema Financiero.", "peso": 2.50, "ud_ref": "UD 1: 1. El sistema financiero" },
        { "ce_id": "RA2-b", "ce_descripcion": "Precisa instituciones bancarias y no bancarias.", "peso": 2.50, "ud_ref": "UD 1: 2. Agentes del sector bancario" },
        { "ce_id": "RA2-c", "ce_descripcion": "Diferencia mercados del sistema financiero.", "peso": 2.50, "ud_ref": "UD 1: 1.4. Mercados financieros" },
        { "ce_id": "RA2-d", "ce_descripcion": "Relaciona funciones de intermediarios.", "peso": 2.50, "ud_ref": "UD 1: 1.2. Intermediarios financieros" },
        { "ce_id": "RA2-e", "ce_descripcion": "Diferencia instrumentos bancarios y no bancarios.", "peso": 5.00, "ud_ref": "UD 2 y UD 3" },
        { "ce_id": "RA2-f", "ce_descripcion": "Clasifica tipos de seguros.", "peso": 3.33, "ud_ref": "UD 3: 4. Los productos de seguro" },
        { "ce_id": "RA2-g", "ce_descripcion": "Identifica servicios básicos de intermediarios.", "peso": 3.33, "ud_ref": "UD 2: 4. Los servicios bancarios" },
        { "ce_id": "RA2-h", "ce_descripcion": "Calcula rentabilidad y coste financiero.", "peso": 3.33, "ud_ref": "UD 3: 1. Los valores mobiliarios" },
        { "ce_id": "RA2-i", "ce_descripcion": "Opera medios telemáticos de banca on-line.", "peso": 1.67, "ud_ref": "UD 2: 4.4. La banca Electrónica" },
        { "ce_id": "RA2-j", "ce_descripcion": "Cumplimenta documentos de contratación.", "peso": 1.67, "ud_ref": "UD 2: 2.1. Contrato de cuenta" }
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
        <button id="import-module-btn" class="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors">
          ${ICONS.UploadCloud} Importar Módulo
        </button>
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
        <button id="export-data-btn" class="w-full text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors bg-blue-600 hover:bg-blue-700">
          ${ICONS.DownloadCloud} Exportar Backup (Descarga)
        </button>
      </div>

      <!-- Importar Base de Datos -->
      <div class="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Importar Base de Datos</h2>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">Pega el contenido de un JSON exportado para restaurar todos los datos (sobrescribe todo).</p>
        <textarea id="import-db-textarea" class="w-full h-24 p-3 border rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 font-mono text-xs border-gray-300 dark:border-gray-700" placeholder="Pega aquí tu JSON de la base de datos..."></textarea>
        <button id="import-data-btn" class="mt-4 w-full text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors bg-orange-600 hover:bg-orange-700">
          ${ICONS.Database} Importar Datos
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

// Renderiza la página de Alumnos
export function renderAlumnosPage() {
  const { students } = getDB(); // Ahora muestra todos los alumnos del sistema
  let studentListHtml = '';
  if (students && students.length > 0) {
    studentListHtml = `
      <ul class="divide-y divide-gray-200 dark:divide-gray-700">
        ${students.map(student => `
          <li key="${student.id}" class="py-3 px-4 flex justify-between items-center">
            <span class="text-lg">${student.name}</span>
          </li>
        `).join('')}
      </ul>
    `;
  } else {
    studentListHtml = `
      <p class="text-center text-gray-500 dark:text-gray-400 mt-10">
          No hay alumnos registrados en el sistema.
      </p>
    `;
  }
  
  return `
    <div class="container mx-auto px-6 py-8">
      <h2 class="text-3xl font-bold mb-6">Listado General de Alumnos (${students.length})</h2>
      <div class="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
        ${studentListHtml}
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
          <select id="module-select" class="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500">
            <option value="">-- Selecciona un módulo --</option>
            ${modules.map(m => `
              <option key="${m.id}" value="${m.id}" ${m.id === selectedModuleId ? 'selected' : ''}>${m.modulo}</option>
            `).join('')}
          </select>
      </div>
      <hr class="my-6 border-gray-200 dark:border-gray-700" />
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

function renderModuloDetalle(module, moduleStudents) {
  if (!module.studentIds || module.studentIds.length === 0) {
    const studentText = `David Palomeque Aguilera
Adrián Manchado Moreno
Marta Pérez Padillo`;
    return `
      <div class="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 mt-6">
        <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Asociar Alumnos al Módulo</h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">Este módulo no tiene alumnos. Pega un listado de alumnos (un nombre por línea) para asociarlos.</p>
        <textarea id="student-textarea" class="w-full h-48 p-3 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 font-mono text-sm">${studentText}</textarea>
        <button id="import-students-to-module-btn" data-module-id="${module.id}" class="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors">
          ${ICONS.Users} Asociar Alumnos
        </button>
      </div>
    `;
  }

  const { moduleView } = getUI();
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
      
  let contentHtml = '';
  if (moduleView === 'tabla') {
      contentHtml = renderCuadernoCalificaciones(module, moduleStudents);
  } else {
      contentHtml = renderAlumnoView(module, moduleStudents);
  }
  
  return `
    <div>
      <!-- Selector de Vista -->
      <div class="mb-6 flex justify-center gap-2 p-2 bg-gray-200 dark:bg-gray-800 rounded-lg">
        <button id="view-tabla-btn" class="${classTabla}">
          ${ICONS.Table} Vista Tabla
        </button>
        <button id="view-alumno-btn" class="${classAlumno}">
          ${ICONS.User} Vista Alumnos
        </button>
      </div>

      <!-- Contenido de la vista -->
      ${contentHtml}
    </div>
  `;
}

function renderCuadernoCalificaciones(module, moduleStudents) {
  const { grades } = getDB();
  const calculatedGrades = getCalculatedGrades();
  const ras = module.resultados_de_aprendizaje;
  const allCes = ras.flatMap(ra =>
    ra.criterios_de_evaluacion.map(ce => ({ ...ce, raId: ra.ra_id }))
  );

  const headerHtml = `
    <thead class="bg-gray-50 dark:bg-gray-800 sticky-header">
      <tr>
        <th scope="col" class="sticky left-0 z-10 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider bg-gray-50 dark:bg-gray-800">
          Alumno
        </th>
        ${allCes.map(ce => `
          <th key="${ce.ce_id}" scope="col" class="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider" title="${ce.raId} - ${ce.ce_descripcion} (Peso: ${ce.peso}%)">
            ${ce.ce_id}
          </th>
        `).join('')}
        ${ras.map(ra => `
          <th key="${ra.ra_id}" scope="col" class="px-6 py-3 text-center text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider bg-blue-50 dark:bg-blue-900" title="${ra.ra_descripcion}">
            ${ra.ra_id}
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
        const calcs = calculatedGrades[student.id] || { raTotals: {}, moduleGrade: 0 };
        
        return `
          <tr key="${student.id}" class="hover:bg-gray-50 dark:hover:bg-gray-800">
            <td class="sticky left-0 z-10 px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800">
              ${student.name}
            </td>
            
            ${allCes.map(ce => {
              const grade = studentGrades[ce.ce_id];
              return `
                <td key="${ce.ce_id}" class="px-6 py-4 whitespace-nowrap text-sm">
                  <input type="number" min="0" max="10" step="0.1" value="${grade != null ? grade : ''}" data-student-id="${student.id}" data-ce-id="${ce.ce_id}" class="grade-input w-20 p-2 text-center border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-blue-500" aria-label="Nota ${student.name} ${ce.ce_id}" />
                </td>
              `
            }).join('')}
            
            ${ras.map(ra => {
              const raGrade = (calcs.raTotals && calcs.raTotals[ra.ra_id] != null) ? calcs.raTotals[ra.ra_id].toFixed(2) : '0.00';
              return `
                <td key="${ra.ra_id}" class="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-blue-800 dark:text-blue-200 bg-blue-50 dark:bg-blue-900">
                  ${raGrade}
                </td>
              `
            }).join('')}
            
            <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-green-800 dark:text-green-200 bg-green-50 dark:bg-green-900">
              ${calcs.moduleGrade != null ? calcs.moduleGrade.toFixed(2) : '0.00'}
            </td>
          </tr>
        `
      }).join('')}
    </tbody>
  `;

  return `
    <div class="overflow-x-auto shadow-md rounded-lg" style="max-height: 70vh;">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        ${headerHtml}
        ${bodyHtml}
      </table>
    </div>
  `;
}

function renderAlumnoView(module, moduleStudents) {
  const { grades, comments } = getDB();
  const { selectedStudentIdForView } = getUI();
  const calculatedGrades = getCalculatedGrades();

  if (!moduleStudents || moduleStudents.length === 0) {
       return `<p class="text-center text-gray-500 dark:text-gray-400 mt-10">No hay alumnos para mostrar en esta vista.</p>`;
  }
  
  const currentStudent = moduleStudents.find(s => s.id === selectedStudentIdForView);
  const studentIndex = moduleStudents.findIndex(s => s.id === selectedStudentIdForView);
  
  if (!currentStudent || studentIndex === -1) {
       console.error("Error: Could not find student with ID:", selectedStudentIdForView);
       return `<p class="text-center text-red-500 dark:text-red-400 mt-10">Error: Alumno no encontrado.</p>`;
  }
  
  const isFirstStudent = studentIndex === 0;
  const isLastStudent = studentIndex === moduleStudents.length - 1;
  
  const finalGrades = calculatedGrades[currentStudent.id] || { raTotals: {}, moduleGrade: 0 };
  const finalModuleGrade = (typeof finalGrades.moduleGrade === 'number') ? finalGrades.moduleGrade.toFixed(2) : '0.00';
  const studentGrades = grades[currentStudent.id] || {};
  const studentComment = (comments[module.id] && comments[module.id][currentStudent.id]) ? comments[module.id][currentStudent.id] : '';

  return `
    <div class="p-4">
      <!-- Navegación y Nombre del Alumno -->
      <div class="flex items-center justify-between mb-2">
        <button id="prev-student-btn" ${isFirstStudent ? 'disabled' : ''} class="p-2 rounded-full transition-colors ${isFirstStudent ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}" aria-label="Alumno anterior" title="Alumno anterior">
            ${ICONS.ArrowLeftCircle}
        </button>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white text-center flex-grow mx-4">${currentStudent.name}</h2>
        <button id="next-student-btn" ${isLastStudent ? 'disabled' : ''} class="p-2 rounded-full transition-colors ${isLastStudent ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}" aria-label="Alumno siguiente" title="Alumno siguiente">
            ${ICONS.ArrowRightCircle}
        </button>
      </div>

      <p class="text-lg text-gray-600 dark:text-gray-400 mb-6 text-center">${module.modulo}</p>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Columna 1: Calificaciones Finales -->
        <div class="lg:col-span-1 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Calificaciones Finales</h3>
          <div class="space-y-4">
            <div class="flex justify-between items-center p-4 bg-green-50 dark:bg-green-900 rounded-lg">
              <span class="text-lg font-bold text-green-800 dark:text-green-200">Nota Final</span>
              <span class="text-2xl font-bold text-green-700 dark:text-green-100">${finalModuleGrade}</span>
            </div>
            ${module.resultados_de_aprendizaje.map(ra => {
                 const raGrade = (finalGrades.raTotals && typeof finalGrades.raTotals[ra.ra_id] === 'number')
                                 ? finalGrades.raTotals[ra.ra_id].toFixed(2)
                                 : '0.00';
                 return `
                    <div key="${ra.ra_id}" class="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
                      <span class="font-semibold text-blue-800 dark:text-blue-200" title="${ra.ra_descripcion}">${ra.ra_id}</span>
                      <span class="text-lg font-bold text-blue-700 dark:text-blue-100">${raGrade}</span>
                    </div>
                 `;
             }).join('')}
          </div>
        </div>

        <!-- Columna 2: Comentarios -->
        <div class="lg:col-span-2 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            ${ICONS.FileText} Comentarios
          </h3>
          <textarea id="comment-textarea" data-student-id="${currentStudent.id}" data-module-id="${module.id}" class="w-full h-48 p-3 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-blue-500" placeholder="Escribe aquí observaciones, anotaciones sobre la recuperación, etc.">${studentComment}</textarea>
        </div>

        <!-- Fila 2: Criterios de Evaluación (Acordeón) -->
        <div class="lg:col-span-3 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Criterios de Evaluación</h3>
          <div class="space-y-3 mt-4">
             ${module.resultados_de_aprendizaje.map(ra => 
                renderRaAccordion(
                    ra, 
                    studentGrades, 
                    (finalGrades.raTotals && typeof finalGrades.raTotals[ra.ra_id] === 'number') ? finalGrades.raTotals[ra.ra_id] : 0,
                    currentStudent.id
                )
             ).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}