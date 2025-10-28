import * as state from './state.js';
import * as handlers from './handlers.js';
import { renderHeader } from './ui/components.js';
import * as pages from './ui/pages.js';
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
      const newCalculatedGrades = calculateModuleGrades(selectedModule, moduleStudents, db.grades, db.actividades);
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
          contentContainer.innerHTML = pages.renderConfiguracionPage();
          break;
        case 'alumnos':
          contentContainer.innerHTML = pages.renderAlumnosPage();
          break;
        case 'modulos':
          contentContainer.innerHTML = pages.renderModulosPage();
          break;
        case 'actividadDetail':
          contentContainer.innerHTML = pages.renderActividadDetailPage();
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

  // Delegación de eventos para botones de navegación dentro del contenido
  document.getElementById('content-container')?.addEventListener('click', (e) => {
    const pageNavBtn = e.target.closest('button[data-page]');
    if (pageNavBtn) {
      e.preventDefault();
      handlers.handleSetPage(pageNavBtn.dataset.page);
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


    // Listener para el historial de comentarios
    document.querySelectorAll('.view-history-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        const studentId = e.currentTarget.dataset.studentId;
        const student = state.getDB().students.find(s => s.id === studentId);
        if (student) {
          const modal = document.getElementById('comment-history-modal');
          const modalContent = document.getElementById('comment-history-modal-content');
          modalContent.innerHTML = pages.renderStudentCommentHistoryModal(student);
          modal.classList.remove('hidden');
          modal.classList.add('flex');
          // Añadir listener para cerrar el modal
          document.getElementById('close-modal-btn').addEventListener('click', () => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
          });
        }
      });
    });


    // Listener para los acordeones de Módulo por Alumno
    document.querySelectorAll('.student-module-toggle').forEach(button => {
      button.addEventListener('click', () => {
        const contentId = button.dataset.contentId;
        const contentDiv = document.getElementById(contentId);
        const studentId = button.dataset.studentId;
        const moduleId = button.dataset.moduleId;
        
        const isOpen = !contentDiv.classList.contains('hidden');

        if (isOpen) {
          contentDiv.innerHTML = ''; // Limpiar contenido al cerrar
          contentDiv.classList.add('hidden');
          button.querySelector('.chevron-icon')?.classList.remove('rotate-90');
        } else {
          // Cargar y mostrar el contenido
          const db = state.getDB();
          const student = db.students.find(s => s.id === studentId);
          const module = db.modules.find(m => m.id === moduleId);
          if (student && module) {
            contentDiv.innerHTML = pages.renderStudentModuleDetail(student, module);
            contentDiv.classList.remove('hidden');
            button.querySelector('.chevron-icon')?.classList.add('rotate-90');
            // Re-adjuntar listeners para los elementos recién creados
            attachEventListeners();
          }
        }
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

    // Formulario para crear actividad
    const actividadForm = document.getElementById('actividad-form');
    if (actividadForm) {
      actividadForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const moduleId = e.currentTarget.dataset.moduleId;
        handlers.handleCreateActividad(moduleId, e.currentTarget);
      });
    }

    // Panel de calificación de actividades
    document.querySelectorAll('.open-actividad-panel-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        handlers.handleSelectActividad(e.currentTarget.dataset.actividadId);
      });
    });

    // Modal para cálculo de notas trimestrales
    const openModalBtn = document.getElementById('open-trimester-modal-btn');
    const modalContainer = document.createElement('div');
    modalContainer.id = 'trimester-modal-container';
    document.body.appendChild(modalContainer);

    openModalBtn?.addEventListener('click', () => {
      const selectedModule = state.getDB().modules.find(m => m.id === state.getUI().selectedModuleId);
      const moduleStudents = (selectedModule.studentIds || []).map(id => state.getDB().students.find(s => s.id === id)).filter(Boolean);
      modalContainer.innerHTML = `<div id="trimester-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-11/12 md:w-1/2 p-6">${pages.renderTrimesterModalContent(selectedModule, moduleStudents)}</div></div>`;
      
      document.getElementById('close-trimester-modal-btn').addEventListener('click', () => {
        modalContainer.innerHTML = '';
      });

      document.getElementById('save-trimester-grades-btn').addEventListener('click', () => {
        const trimesterKey = document.getElementById('trimester-select').value;
        const gradesToSave = {};
        document.querySelectorAll('#trimester-modal tbody tr').forEach(row => {
          gradesToSave[row.dataset.studentId] = parseFloat(row.dataset.grade);
        });
        handlers.handleSaveTrimesterGrades(selectedModule.id, trimesterKey, gradesToSave);
        modalContainer.innerHTML = ''; // Cierra el modal al guardar
      });
    });

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
    }

    // Listener para el formulario de comentarios

    const commentForm = document.getElementById('comment-form');
    if (commentForm) {
      commentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const { studentId, moduleId } = e.currentTarget.dataset;
        handlers.handleAddComment(moduleId, studentId, e.currentTarget.elements);
      });

      // Lógica para mostrar/ocultar el select de CEs
      const typeSelect = commentForm.querySelector('.comment-type-select');
      const ceSelect = commentForm.querySelector('.comment-ce-select');
      typeSelect.addEventListener('change', (e) => {
        ceSelect.classList.toggle('hidden', e.target.value !== 'ce');
      });
    }

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

  }

  if (ui.page === 'actividadDetail') {
    // Listeners para la página de detalle de actividad
    document.querySelector('.update-actividad-form')?.addEventListener('submit', (ev) => {
      ev.preventDefault();
      handlers.handleUpdateActividad(ev.currentTarget.dataset.actividadId, ev.currentTarget);
    });

    document.querySelector('.delete-actividad-btn')?.addEventListener('click', (ev) => {
      handlers.handleDeleteActividad(ev.currentTarget.dataset.actividadId);
    });

    document.querySelectorAll('.add-attempt-form').forEach(form => {
      form.addEventListener('submit', (ev) => {
        ev.preventDefault();
        handlers.handleAddActividadGradeAttempt(ev.currentTarget.dataset.studentId, ev.currentTarget.dataset.actividadId, ev.currentTarget);
      });
    });

    document.querySelectorAll('.delete-attempt-btn').forEach(btn => {
      btn.addEventListener('click', (ev) => {
        const { studentId, actividadId, attemptId } = ev.currentTarget.dataset;
        handlers.handleDeleteActividadGradeAttempt(studentId, actividadId, attemptId);
      });
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