import * as state from './state.js';
import * as handlers from './handlers.js';
import { renderHeader } from './ui/components.js';
import { renderConfiguracionPage, renderAlumnosPage, renderModulosPage } from './ui/pages.js';
import { calculateModuleGrades } from './services/calculations.js';

// Función principal que dibuja la UI
export function renderApp() {
  const { db, ui } = { db: state.getDB(), ui: state.getUI() };

  // Recalcular notas si estamos en la página de módulos con un módulo seleccionado
  if (ui.page === 'modulos' && ui.selectedModuleId) {
    const selectedModule = db.modules.find(m => m.id === ui.selectedModuleId);
    if (selectedModule) {
      // Ahora calculamos las notas solo para los alumnos de ESE módulo
      const moduleStudents = (selectedModule.studentIds || [])
        .map(studentId => db.students.find(s => s.id === studentId))
        .filter(Boolean);
      const newCalculatedGrades = calculateModuleGrades(selectedModule, moduleStudents, db.grades);
      state.setCalculatedGrades(newCalculatedGrades);
    }
  }

  // 1. Renderizar Header
  const headerContainer = document.getElementById('header-container');
  if (headerContainer) {
      headerContainer.innerHTML = renderHeader(ui.page, db);
  }
  
  // 2. Renderizar contenido de la página
  const contentContainer = document.getElementById('content-container');
  if (contentContainer) {
      switch (ui.page) {
        case 'configuracion':
          contentContainer.innerHTML = renderConfiguracionPage();
          break;
        case 'alumnos':
          contentContainer.innerHTML = renderAlumnosPage();
          break;
        case 'modulos':
          contentContainer.innerHTML = renderModulosPage();
          break;
        default:
          contentContainer.innerHTML = `<p class="text-center text-red-500 p-10">Error: Página no reconocida.</p>`;
      }
  }
  
  // 3. (Re)Añadir event listeners
  attachEventListeners();
}

// Función para añadir todos los event listeners
function attachEventListeners() {
  const { ui } = { ui: state.getUI() };

  document.getElementById('header-container').addEventListener('click', (e) => {
    const button = e.target.closest('button[data-page]');
    if (button) {
      e.preventDefault();
      handlers.handleSetPage(button.dataset.page);
    }
  });

  document.getElementById('connect-btn')?.addEventListener('click', handlers.handleConnect);
  document.getElementById('disconnect-btn')?.addEventListener('click', handlers.handleDisconnect);
  
  if (ui.page === 'configuracion') {
    document.getElementById('import-module-btn')?.addEventListener('click', () => handlers.handleImportModule(document.getElementById('module-textarea').value));
    document.getElementById('save-as-btn')?.addEventListener('click', handlers.handleSaveAs);
    document.getElementById('export-data-btn')?.addEventListener('click', handlers.handleExportData);
    document.getElementById('import-data-btn')?.addEventListener('click', () => {
      const text = document.getElementById('import-db-textarea').value;
      if (!text.trim()) {
        alert("El campo para importar la base de datos está vacío.");
        return;
      }
      if (window.confirm("¿Seguro que quieres importar? Esto sobreescribirá todos los datos actuales.")) {
        handlers.handleImportData(text);
        document.getElementById('import-db-textarea').value = '';
      }
    });
    document.getElementById('clear-data-btn')?.addEventListener('click', handlers.handleClearData);
  }
  
  if (ui.page === 'alumnos') {
    document.querySelectorAll('.export-student-pdf-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        const studentId = e.currentTarget.dataset.studentId;
        handlers.handleExportStudentPdf(studentId);
      });
    });
  }

  if (ui.page === 'modulos') {
    document.getElementById('module-select')?.addEventListener('change', (e) => handlers.handleSelectModule(e.target.value || null));
    document.getElementById('view-tabla-btn')?.addEventListener('click', () => handlers.handleSetModuleView('tabla'));
    document.getElementById('view-alumno-btn')?.addEventListener('click', () => handlers.handleSetModuleView('alumno'));
    document.getElementById('import-students-to-module-btn')?.addEventListener('click', (e) => {
      const text = document.getElementById('student-textarea').value;
      handlers.handleImportStudentsToModule(text, e.target.dataset.moduleId);
    });

    document.querySelectorAll('.remove-student-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        const { studentId, moduleId } = e.currentTarget.dataset;
        handlers.handleRemoveStudentFromModule(moduleId, studentId);
      });
    });

    if (ui.moduleView === 'alumno') {
        document.getElementById('prev-student-btn')?.addEventListener('click', () => handlers.handleNavigateStudent('prev'));
        document.getElementById('next-student-btn')?.addEventListener('click', () => handlers.handleNavigateStudent('next'));
        document.getElementById('comment-textarea')?.addEventListener('input', (e) => handlers.handleCommentChange(e.target.dataset.moduleId, e.target.dataset.studentId, e.target.value)); 
        document.querySelectorAll('.ra-accordion-toggle').forEach(button => {
            button.addEventListener('click', () => {
                const content = document.getElementById(button.dataset.contentId);
                content?.classList.toggle('hidden');
                button.querySelector('.chevron-icon')?.classList.toggle('rotate-90');
            });
        });
    }
    
    document.getElementById('content-container').addEventListener('change', (e) => {
        if (e.target.classList.contains('grade-input')) {
            handlers.handleGradeChange(e.target.dataset.studentId, e.target.dataset.ceId, e.target.value);
        }
    });
  }
}

function init() {
  // La carga inicial ahora es manual. El usuario debe conectar un archivo.
  // Por defecto, empezamos en la página de configuración.
  state.setPage('configuracion');
  renderApp();
}

document.addEventListener('DOMContentLoaded', init);