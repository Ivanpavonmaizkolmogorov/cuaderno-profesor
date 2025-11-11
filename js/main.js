import * as state from './state.js';
import * as handlers from './handlers.js';
import { renderHeader } from './ui/components.js';
import { renderStudentFormatModal } from './ui/pages.js';
import * as pages from './ui/pages.js';
import { calculateModuleGrades } from './services/calculations.js';
import { initGoogleDriveButton } from './googleDriveLoader.js';

// Función principal que dibuja la UI
export function renderApp() {
  const { db, ui } = { db: state.getDB(), ui: state.getUI() };

  // Recalcular notas para el módulo seleccionado (T1, T2, T3 y Final)
  if (ui.page === 'modulos' && ui.selectedModuleId) {
    const selectedModule = db.modules.find(m => m.id === ui.selectedModuleId);
    if (selectedModule) {
      const moduleStudents = (selectedModule.studentIds || [])
        .map(studentId => db.students.find(s => s.id === studentId))
        .filter(Boolean);

      const allCalculatedGrades = state.getCalculatedGrades();
      if (!allCalculatedGrades[selectedModule.id]) {
        allCalculatedGrades[selectedModule.id] = {};
      }

      allCalculatedGrades[selectedModule.id].T1 = calculateModuleGrades(selectedModule, moduleStudents, db.grades, db.actividades, '1');
      allCalculatedGrades[selectedModule.id].T2 = calculateModuleGrades(selectedModule, moduleStudents, db.grades, db.actividades, '2');
      allCalculatedGrades[selectedModule.id].T3 = calculateModuleGrades(selectedModule, moduleStudents, db.grades, db.actividades, '3');
      allCalculatedGrades[selectedModule.id].Final = calculateModuleGrades(selectedModule, moduleStudents, db.grades, db.actividades, null); // null para la final

      state.setCalculatedGrades(allCalculatedGrades);
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

  // 4. Lógica para mostrar el modal de formato de estudiantes si hay datos para él
  const studentFormatData = ui.studentNameSuggestions;
  if (studentFormatData) {
    const modalContainer = document.getElementById('student-format-modal-container');
    if (modalContainer) {
      modalContainer.innerHTML = renderStudentFormatModal(studentFormatData.suggestions, studentFormatData.moduleId);

      // Añadir listeners para los botones del modal
      document.getElementById('confirm-student-format-btn')?.addEventListener('click', () => {
        // Recolectar los nombres desde los editores interactivos
        const finalNames = Array.from(document.querySelectorAll('.name-editor-container')).map(container => {
          const lastNamesZone = container.querySelector('[data-part="lastNames"]');
          const firstNamesZone = container.querySelector('[data-part="firstNames"]');
          
          const lastNames = Array.from(lastNamesZone.querySelectorAll('.name-pill')).map(pill => pill.dataset.word).join(' ');
          const firstNames = Array.from(firstNamesZone.querySelectorAll('.name-pill')).map(pill => pill.dataset.word).join(' ');

          if (!lastNames && !firstNames) {
            return '';
          }
          return `${lastNames}, ${firstNames}`;
        }).filter(Boolean).join('\n');

        modalContainer.innerHTML = ''; // Cerrar modal
        state.setUIProperty('studentNameSuggestions', null); // Limpiar estado
        handlers.handleImportStudentsToModule(finalNames, studentFormatData.moduleId);
      });

      document.getElementById('cancel-student-format-btn')?.addEventListener('click', () => {
        modalContainer.innerHTML = ''; // Cerrar modal
        state.setUIProperty('studentNameSuggestions', null); // Limpiar estado
      });

      // Lógica de Drag & Drop para los editores de nombres
      let draggedPill = null;

      document.querySelectorAll('.name-pill').forEach(pill => {
        pill.addEventListener('dragstart', (e) => {
          draggedPill = e.target;
          setTimeout(() => e.target.classList.add('opacity-50'), 0);
        });

        pill.addEventListener('dragend', (e) => {
          e.target.classList.remove('opacity-50');
          draggedPill = null;
        });
      });

      document.querySelectorAll('.name-drop-zone').forEach(zone => {
        zone.addEventListener('dragover', (e) => {
          e.preventDefault(); // Permite el drop
          zone.classList.add('bg-green-100', 'dark:bg-green-900');
        });

        zone.addEventListener('dragleave', (e) => {
          zone.classList.remove('bg-green-100', 'dark:bg-green-900');
        });

        zone.addEventListener('drop', (e) => {
          e.preventDefault();
          zone.classList.remove('bg-green-100', 'dark:bg-green-900');
          if (draggedPill) {
            // Inserta la píldora en la nueva zona
            zone.appendChild(draggedPill);
          }
        });
      });

    }
  }
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

    // Listener para los checkboxes maestros de RA en los formularios de actividad
    // Se delega al contenedor de contenido para que funcione en cualquier página
    if (e.target.classList.contains('ra-master-checkbox')) {
      const raId = e.target.dataset.raId;
      const isChecked = e.target.checked;
      
      // Buscar el contenedor padre más cercano para limitar el querySelector
      const form = e.target.closest('form');
      if (form) {
        form.querySelectorAll(`.ce-checkbox-for-${raId}`).forEach(checkbox => {
          checkbox.checked = isChecked;
        });
      }
    }

    // Listener para los checkboxes maestros de UD en el formulario de actividad
    if (e.target.classList.contains('ud-master-checkbox')) {
      const udRef = e.target.dataset.udRef;
      const isChecked = e.target.checked;
      
      const form = e.target.closest('form');
      if (form) {
        form.querySelectorAll(`.ce-checkbox-for-ud-${udRef.replace(/ /g, '-')}`).forEach(checkbox => {
          checkbox.checked = isChecked;
        });
      }
    }
  });


  document.getElementById('connect-btn')?.addEventListener('click', handlers.handleConnect);
  document.getElementById('disconnect-btn')?.addEventListener('click', handlers.handleDisconnect);
  
  // EN main.js -> function attachEventListeners()

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
          e.target.value = ''; // Reset
      });

      document.getElementById('download-module-template-btn')?.addEventListener('click', handlers.handleDownloadModuleTemplate);
      document.getElementById('save-as-btn')?.addEventListener('click', handlers.handleSaveAs);
      document.getElementById('export-data-btn')?.addEventListener('click', handlers.handleExportData);
      document.getElementById('clear-data-btn')?.addEventListener('click', handlers.handleClearData);

      // --- AQUÍ ESTÁ EL CÓDIGO CORREGIDO Y EN SU SITIO ---
      const excelButton = document.getElementById('export-excel-btn');
      
      // Chivato 1: Comprobar que el botón existe al cargar la página
      console.log("Buscando botón de Excel:", excelButton); 

      excelButton?.addEventListener('click', () => {
          // Chivato 2: Comprobar que el clic funciona
          console.log("¡Clic en botón Excel detectado!"); 
          handlers.handleExportExcel();
      });
      // --- FIN DEL CÓDIGO CORREGIDO ---
  }
  
  if (ui.page === 'alumnos') {
    document.getElementById('sort-all-asc-btn')?.addEventListener('click', () => handlers.handleSortAllStudents('asc'));
    document.getElementById('sort-all-desc-btn')?.addEventListener('click', () => handlers.handleSortAllStudents('desc'));
    document.getElementById('student-module-filter')?.addEventListener('change', (e) => handlers.handleFilterStudentsByModule(e.target.value));

    // Listener para el nuevo botón de exportación completa
    document.querySelectorAll('.export-full-student-report-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        const studentId = e.currentTarget.dataset.studentId;
        handlers.handleExportFullStudentReport(studentId);
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

    // Listeners para la selección masiva de alumnos
    const selectAllCheckbox = document.getElementById('select-all-students-checkbox');
    const studentCheckboxes = document.querySelectorAll('.student-select-checkbox');
    const bulkDeleteBtn = document.getElementById('bulk-delete-students-btn');
    const selectedCountSpan = document.getElementById('selected-students-count');

    const updateBulkDeleteButtonState = () => {
      const selectedCheckboxes = document.querySelectorAll('.student-select-checkbox:checked');
      const count = selectedCheckboxes.length;
      if (bulkDeleteBtn) {
        bulkDeleteBtn.disabled = count === 0;
        selectedCountSpan.textContent = count;
      }
    };

    selectAllCheckbox?.addEventListener('change', (e) => {
      studentCheckboxes.forEach(checkbox => {
        checkbox.checked = e.target.checked;
      });
      updateBulkDeleteButtonState();
    });

    studentCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', updateBulkDeleteButtonState);
    });

    bulkDeleteBtn?.addEventListener('click', () => {
      const selectedIds = Array.from(document.querySelectorAll('.student-select-checkbox:checked')).map(cb => cb.dataset.studentId);
      handlers.handleBulkDeleteStudents(selectedIds);
    });

    // Listener para el botón de eliminar alumno/a
    document.querySelectorAll('.delete-student-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        const studentId = e.currentTarget.dataset.studentId;
        handlers.handleDeleteStudent(studentId);
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
    
    // Listener para el botón de importación directa (el original)
    document.getElementById('import-students-to-module-btn')?.addEventListener('click', (e) => {
      const text = document.getElementById('student-textarea').value;
      handlers.handleImportStudentsToModule(text, e.target.dataset.moduleId);
    });
    // Listener para el nuevo botón que abre el modal de formato
    document.getElementById('process-students-btn')?.addEventListener('click', (e) => {
      const text = document.getElementById('student-textarea').value;
      handlers.handleProcessStudentNames(text, e.currentTarget.dataset.moduleId);
    });
    // Listener para el nuevo botón de eliminar módulo
    document.getElementById('delete-module-btn')?.addEventListener('click', (e) => {
      const moduleId = e.currentTarget.dataset.moduleId;
      handlers.handleDeleteModule(moduleId);
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

    // Listener para abrir el modal de CEs desde la vista tabla
    document.querySelectorAll('.open-ce-list-modal-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        const { raId, moduleId } = e.currentTarget.dataset;
        const module = state.getDB().modules.find(m => m.id === moduleId);
        if (module) {
          const modalContainer = document.getElementById('ce-list-modal-container');
          modalContainer.innerHTML = pages.renderCeListModal(module, raId);

          const closeModal = () => modalContainer.innerHTML = '';
          
          modalContainer.querySelector('#close-ce-list-modal-btn').addEventListener('click', closeModal);
          modalContainer.querySelector('#close-ce-list-modal-btn-footer').addEventListener('click', closeModal);

          // Re-adjuntar listeners para los botones de dual dentro del modal
          modalContainer.querySelectorAll('.toggle-dual-btn').forEach(btn => {
            btn.addEventListener('click', (ev) => {
              handlers.handleToggleCeDual(moduleId, ev.currentTarget.dataset.ceId);
            });
          });
        }
      });
    });

    if (ui.moduleView === 'alumno') {
        document.getElementById('prev-student-btn')?.addEventListener('click', () => handlers.handleNavigateStudent('prev'));
        document.getElementById('next-student-btn')?.addEventListener('click', () => handlers.handleNavigateStudent('next'));

        const exportBtn = document.getElementById('export-current-view-pdf-btn');
        console.log("Buscando botón de exportación en vista de alumno:", exportBtn); // LOG
        exportBtn?.addEventListener('click', (e) => {
          const { studentId, moduleId } = e.currentTarget.dataset;
          console.log("Botón de exportación clickeado. studentId:", studentId, "moduleId:", moduleId); // LOG
          handlers.handleExportSingleModuleReport(studentId, moduleId);
        });

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
    document.querySelectorAll('.toggle-dual-btn').forEach(button => { // Ahora es un botón
        button.addEventListener('click', (e) => {
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

    // Listener para el botón de copiar detalles de actividad
    const copyBtn = document.getElementById('copy-details-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', (ev) => {
        const button = ev.currentTarget;
        const textToCopy = decodeURIComponent(button.dataset.copyText);
        
        navigator.clipboard.writeText(textToCopy).then(() => {
          const originalText = button.querySelector('.btn-text').textContent;
          const originalIcon = button.querySelector('.btn-icon').innerHTML;
          
          button.querySelector('.btn-text').textContent = '¡Copiado!';
          button.querySelector('.btn-icon').innerHTML = '✔️';
          button.classList.replace('bg-indigo-600', 'bg-green-600');

          setTimeout(() => {
            button.querySelector('.btn-text').textContent = originalText;
            button.querySelector('.btn-icon').innerHTML = originalIcon;
            button.classList.replace('bg-green-600', 'bg-indigo-600');
          }, 2000);
        }).catch(err => {
          console.error('Error al copiar al portapapeles:', err);
          alert('No se pudo copiar al portapapeles.');
        });
      });
    }
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

  // Activa el botón de Google Drive y le dice qué hacer cuando se carga un JSON.
  // Usaremos la función handleConnect existente para procesar los datos.
  initGoogleDriveButton('load-from-drive-btn', (jsonData) => {
    // 1. Validar que el JSON tiene la estructura esperada.
    if (jsonData && jsonData.modules && jsonData.students) {
      // 2. Guardar los datos en el estado de la aplicación.
      state.setDB(jsonData); // CORRECCIÓN: La función correcta es setDB, no loadDB.
      // 3. Renderizar la aplicación para mostrar los nuevos datos.
      renderApp();
      alert('¡Datos cargados correctamente desde Google Drive!');
    } else {
      alert('Error: El archivo JSON seleccionado no tiene el formato correcto.');
    }
  });

  renderApp();
}

document.addEventListener('DOMContentLoaded', init);