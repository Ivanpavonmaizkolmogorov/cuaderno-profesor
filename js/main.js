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
    document.getElementById('import-module-file-input')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target.result;
        handlers.handleImportModule(text);
      };
      reader.readAsText(file);
      e.target.value = ''; // Reset para poder seleccionar el mismo archivo de nuevo
    });

    document.getElementById('download-module-template-btn')?.addEventListener('click', handlers.handleDownloadModuleTemplate);
    document.getElementById('save-as-btn')?.addEventListener('click', handlers.handleSaveAs);
    document.getElementById('export-data-btn')?.addEventListener('click', handlers.handleExportData);
    document.getElementById('clear-data-btn')?.addEventListener('click', handlers.handleClearData);
  }
  
  if (ui.page === 'alumnos') {
    document.getElementById('sort-all-asc-btn')?.addEventListener('click', () => handlers.handleSortAllStudents('asc'));
    document.getElementById('sort-all-desc-btn')?.addEventListener('click', () => handlers.handleSortAllStudents('desc'));

    document.querySelectorAll('.export-student-pdf-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        const studentId = e.currentTarget.dataset.studentId;
        handlers.handleExportStudentPdf(studentId);
      });
    });

    // Lógica de Drag and Drop para la lista general de alumnos
    const allStudentsContainer = document.getElementById('all-students-container');
    if (allStudentsContainer) {
      let draggedItem = null;

      allStudentsContainer.addEventListener('dragstart', (e) => {
        if (e.target.classList.contains('student-draggable')) {
          draggedItem = e.target;
          setTimeout(() => {
            draggedItem.style.opacity = '0.5';
          }, 0);
        }
      });

      allStudentsContainer.addEventListener('dragend', () => {
        if (draggedItem) {
          draggedItem.style.opacity = '1';
          draggedItem = null;
        }
      });

      allStudentsContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        const afterElement = getDragAfterElement(allStudentsContainer, e.clientY);
        if (draggedItem) {
          if (afterElement == null) {
            allStudentsContainer.appendChild(draggedItem);
          } else {
            allStudentsContainer.insertBefore(draggedItem, afterElement);
          }
        }
      });

      allStudentsContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        if (draggedItem) {
          const newOrderedIds = [...allStudentsContainer.querySelectorAll('.student-draggable')].map(div => div.dataset.studentId);
          handlers.handleReorderAllStudents(newOrderedIds);
        }
      });
    }
  }

  if (ui.page === 'modulos') {
    document.getElementById('module-select')?.addEventListener('change', (e) => handlers.handleSelectModule(e.target.value || null));
    document.getElementById('view-tabla-btn')?.addEventListener('click', () => handlers.handleSetModuleView('tabla'));
    document.getElementById('view-alumno-btn')?.addEventListener('click', () => handlers.handleSetModuleView('alumno'));
    document.getElementById('import-students-to-module-btn')?.addEventListener('click', (e) => {
      const text = document.getElementById('student-textarea').value;
      handlers.handleImportStudentsToModule(text, e.target.dataset.moduleId);
    });
    document.getElementById('download-student-template-btn')?.addEventListener('click', handlers.handleDownloadStudentTemplate);
    document.getElementById('sort-asc-btn')?.addEventListener('click', (e) => handlers.handleSortStudents(e.currentTarget.dataset.moduleId, 'asc'));
    document.getElementById('sort-desc-btn')?.addEventListener('click', (e) => handlers.handleSortStudents(e.currentTarget.dataset.moduleId, 'desc'));

    // Lógica de Drag and Drop para reordenar alumnos
    const studentListContainer = document.getElementById('student-list-container');
    if (studentListContainer) {
      let draggedItem = null;

      studentListContainer.addEventListener('dragstart', (e) => {
        draggedItem = e.target;
        // Añadimos un estilo para que se vea semitransparente mientras se arrastra
        setTimeout(() => {
          draggedItem.style.opacity = '0.5';
        }, 0);
      });

      studentListContainer.addEventListener('dragend', (e) => {
        // Restauramos la opacidad
        setTimeout(() => {
          if (draggedItem) draggedItem.style.opacity = '1';
          draggedItem = null;
        }, 0);
      });

      studentListContainer.addEventListener('dragover', (e) => {
        e.preventDefault(); // Necesario para permitir el drop
        const afterElement = getDragAfterElement(studentListContainer, e.clientY);
        const currentElement = document.querySelector('.dragging');
        if (afterElement == null) {
          studentListContainer.appendChild(draggedItem);
        } else {
          studentListContainer.insertBefore(draggedItem, afterElement);
        }
      });

      studentListContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        if (!draggedItem) return;
        draggedItem.style.opacity = '1';
        const newOrderedIds = [...studentListContainer.querySelectorAll('.student-draggable')].map(li => li.dataset.studentId);
        const moduleId = document.getElementById('sort-asc-btn').dataset.moduleId;
        handlers.handleReorderStudents(moduleId, newOrderedIds);
      });
    }

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
    }

    // Este listener ahora funciona tanto para la vista tabla como para la vista alumno si fuera necesario.
    document.querySelectorAll('.ra-accordion-toggle').forEach(button => {
        button.addEventListener('click', () => {
            const content = document.getElementById(button.dataset.contentId);
            content?.classList.toggle('hidden');
            button.querySelector('.chevron-icon')?.classList.toggle('rotate-90');
        });
    });
    
    // Listener para los checkboxes de Dual
    document.querySelectorAll('.toggle-dual-btn').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const moduleId = ui.selectedModuleId; // El módulo activo
            const ceId = e.currentTarget.dataset.ceId;
            handlers.handleToggleCeDual(moduleId, ceId);
        });
    });

    document.getElementById('content-container').addEventListener('change', (e) => {
        if (e.target.classList.contains('grade-input')) {
            handlers.handleGradeChange(e.target.dataset.studentId, e.target.dataset.ceId, e.target.value);
        }
    });
  }
}

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.student-draggable:not(.dragging)')];

  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function init() {
  // La carga inicial ahora es manual. El usuario debe conectar un archivo.
  // Por defecto, empezamos en la página de configuración.
  state.setPage('configuracion');
  renderApp();
}

document.addEventListener('DOMContentLoaded', init);