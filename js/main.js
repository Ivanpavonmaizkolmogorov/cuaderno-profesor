import * as state from './state.js';
import * as handlers from './handlers.js';
import { renderHeader } from './ui/components.js';
import { ICONS } from './ui/constants.js';
import { renderStudentFormatModal } from './ui/pages.js';
import { renderWeightDistributionView, sortStudentsForTableView } from './ui/pages.js'; // Importar la nueva función
import * as pages from './ui/pages.js';
import { calculateModuleGrades, updateImpactPanel } from './services/calculations.js';
import { prepareModuleForProgressTracking } from './utils.js';
import { renderProgressView } from './progressView.js';

// Función principal que dibuja la UI
export function renderApp() {
  // Renderizar el botón de Google Drive
  renderDriveButton();

  const { db, ui } = { db: state.getDB(), ui: state.getUI() };

  // Recalcular notas para el módulo seleccionado (T1, T2, T3 y Final)
  if (ui.page === 'modulos' && ui.selectedModuleId) {
    const selectedModule = db.modules.find(m => m.id === ui.selectedModuleId);

    if (selectedModule) {
      let moduleStudents = (selectedModule.studentIds || [])
        .map(studentId => db.students.find(s => s.id === studentId))
        .filter(Boolean);
      
      moduleStudents = sortStudentsForTableView(moduleStudents, ui.tableViewSort, state.getCalculatedGrades()[selectedModule.id]);

      const allCalculatedGrades = state.getCalculatedGrades();
      if (!allCalculatedGrades[selectedModule.id]) {
        allCalculatedGrades[selectedModule.id] = {};
      }

      allCalculatedGrades[selectedModule.id].T1 = calculateModuleGrades(selectedModule, moduleStudents, db.grades, db.actividades, '1', db.aptitudes);
      allCalculatedGrades[selectedModule.id].T2 = calculateModuleGrades(selectedModule, moduleStudents, db.grades, db.actividades, '2', db.aptitudes);
      allCalculatedGrades[selectedModule.id].T3 = calculateModuleGrades(selectedModule, moduleStudents, db.grades, db.actividades, '3', db.aptitudes);
      allCalculatedGrades[selectedModule.id].Final = calculateModuleGrades(selectedModule, moduleStudents, db.grades, db.actividades, null, db.aptitudes); // null para la final

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
      // Limpiamos el contenedor principal. Ahora no necesitamos gestionar la visibilidad.
      contentContainer.innerHTML = '';

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
        case 'distribucion': // Nueva vista
          contentContainer.innerHTML = renderWeightDistributionView(selectedModule);
          state.setUIProperty('expandedRaId', null); // Clear after rendering
          break;
        default:
          contentContainer.innerHTML = `<p class="text-center text-red-500 p-10">Error: Página no reconocida.</p>`;
      }
  }
  
  // 3. (Re)Añadir event listeners
  attachEventListeners();

  // --- INICIO: CORRECCIÓN DEFINITIVA DEL RENDERIZADO DEL ÍNDICE ---
  // Este bloque se asegura de que la vista del índice se renderice en el momento correcto.
  // El problema anterior era que este código se ejecutaba ANTES de que `renderModulosPage`
  // creara el contenedor necesario, causando que `progressContainer` fuera null.
  // Ahora, al estar dentro de `renderApp` y después de la creación de la página, garantizamos el orden.
  if (ui.page === 'modulos' && ui.moduleView === 'indice') {
    const selectedModule = db.modules.find(m => m.id === ui.selectedModuleId);
    const progressContainer = document.getElementById('progress-view-container');

    if (selectedModule && progressContainer) {
      console.log(`[LOG] Contenedor '#progress-view-container' encontrado. Renderizando vista 'indice' para el módulo: ${selectedModule.modulo}`);
      prepareModuleForProgressTracking(selectedModule);
      renderProgressView(progressContainer, selectedModule, db.actividades, state.saveDB);
    }
  }
  // --- FIN DE LA CORRECCIÓN ---

  // 4. Lógica para mostrar el modal de formato de estudiantes si hay datos para él
  const studentFormatData = ui.studentNameSuggestions;
  if (studentFormatData) {
    // 4. Lógica para mostrar el modal de formato de estudiantes si hay datos para él
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

/**
 * Muestra el modal para importar el temario.
 * @param {string} moduleId - El ID del módulo actual.
 */
function showImportTemarioModal(moduleId) {
  const modalContainer = document.getElementById('modal-container');
  // La función `renderImportTemarioModal` no existe, pero `showImportTemarioModal` en `progressView.js` sí.
  // La renombramos en el origen y la exportamos.
  modalContainer.innerHTML = pages.renderImportTemarioModal(moduleId);
}

function renderDriveButton() {
  const driveState = state.getDriveState();
  const container = document.getElementById('drive-connection-container');
  if (!container) return;

  if (driveState.isConnected) {
    container.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
          <img src="https://www.google.com/images/branding/product/1x/drive_2020q4_48dp.png" alt="Google Drive" class="w-5 h-5">
          ${driveState.fileName}
        </span>
        <button id="disconnect-drive-btn" class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg text-sm" title="Desconectar de Google Drive">
          ${ICONS.Unplug}
        </button>
      </div>
    `;
    document.getElementById('disconnect-drive-btn')?.addEventListener('click', handlers.handleDisconnectDrive);
  } else {
    container.innerHTML = `
      <button id="load-from-drive-btn" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded inline-flex items-center">
        <img src="https://www.google.com/images/branding/product/1x/drive_2020q4_48dp.png" alt="Google Drive" class="w-5 h-5 mr-2">
        <span class="btn-text">Conectar con Drive</span>
      </button>
    `;
    // ANTES: initGoogleDriveButton('load-from-drive-btn', handleDriveConnection);
    // AHORA: Usamos la API de Electron expuesta en preload.js
    document.getElementById('load-from-drive-btn')?.addEventListener('click', async () => {
      console.log('Iniciando login de Google a través de Electron...');
      // Llama a la función del proceso principal de Electron
      const result = await window.electronAPI.startGoogleLogin();

      if (result.success) {
        console.log('Login exitoso, token obtenido:', result.token);
        // El objeto 'result.token' contiene el 'access_token'.
        // ¡AHORA USAMOS EL TOKEN DE VERDAD!
        // 1. Guardamos el token para futuras peticiones.
        state.setDriveConnection(null, 'Conectando...', result.token.access_token);
        // 2. Mostramos el selector de archivos de Google Drive.
        showDriveFilePicker(result.token.access_token);

      } else {
        console.error('Error en el login de Google:', result.error);
        alert(`Error al conectar con Google: ${result.error}`);
      }
    });
  }
}

/**
 * Usa el access token para obtener una lista de archivos JSON de Google Drive
 * y los muestra en un modal para que el usuario elija uno.
 * @param {string} accessToken El token de acceso de Google.
 */
async function showDriveFilePicker(accessToken) {
  const modalContainer = document.getElementById('modal-container');
  modalContainer.innerHTML = `<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-11/12 md:w-1/2"><h3 class="text-lg font-bold mb-4">Selecciona un archivo JSON</h3><div id="drive-file-list" class="text-center">Cargando archivos... ${ICONS.Spinner}</div><div class="mt-4 text-right"><button id="cancel-drive-picker" class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">Cancelar</button></div></div></div>`;

  document.getElementById('cancel-drive-picker').addEventListener('click', () => {
    modalContainer.innerHTML = '';
    handlers.handleDisconnectDrive(); // Desconectamos si el usuario cancela
  });

  try {
    // Hacemos la petición a la API de Google Drive para listar archivos JSON
    const response = await fetch("https://www.googleapis.com/drive/v3/files?q=mimeType='application/json'", {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Error de red: ${response.statusText}`);
    }

    const data = await response.json();
    const fileListContainer = document.getElementById('drive-file-list');

    if (data.files && data.files.length > 0) {
      fileListContainer.innerHTML = '<ul class="list-none p-0 m-0 max-h-64 overflow-y-auto"></ul>';
      const ul = fileListContainer.querySelector('ul');
      data.files.forEach(file => {
        const li = document.createElement('li');
        li.className = 'p-2 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer';
        li.textContent = file.name;
        li.dataset.fileId = file.id;
        li.dataset.fileName = file.name;
        ul.appendChild(li);
      });

      // Añadimos el listener para cuando el usuario hace clic en un archivo
      ul.addEventListener('click', async (e) => {
        if (e.target.tagName === 'LI') {
          const { fileId, fileName } = e.target.dataset;
          fileListContainer.innerHTML = `Descargando "${fileName}"... ${ICONS.Spinner}`;

          // Hacemos la petición para descargar el contenido del archivo
          const fileResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          });

          if (!fileResponse.ok) {
            throw new Error(`Error al descargar el archivo: ${fileResponse.statusText}`);
          }

          const fileContent = await fileResponse.json();
          modalContainer.innerHTML = ''; // Cerramos el modal
          handleDriveConnection({ content: fileContent, fileId, fileName, accessToken });
        }
      });

    } else {
      fileListContainer.innerHTML = '<p>No se encontraron archivos JSON en tu Google Drive.</p>';
    }

  } catch (error) {
    console.error('Error al obtener archivos de Drive:', error);
    document.getElementById('drive-file-list').innerHTML = `<p class="text-red-500">Error al cargar los archivos: ${error.message}</p>`;
  }
}

// Variable para asegurar que el listener de la vista de progreso se añade una sola vez.
let progressContainerListenerAttached = false;

// Función para añadir todos los event listeners
function attachEventListeners() {
  const { ui, db } = { ui: state.getUI(), db: state.getDB() };

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


  // --- INICIO: LISTENER GLOBAL EN BODY PARA DELEGACIÓN DE EVENTOS ---
  // Escuchamos en `body` para capturar clics en elementos dinámicos como modales.
  document.body.addEventListener('click', (e) => {
    // Botones de navegación de página
    const pageNavBtn = e.target.closest('button[data-page]');
    if (pageNavBtn) {
      e.preventDefault();
      handlers.handleSetPage(pageNavBtn.dataset.page);
    }

    // Botones de sugerencia de motivos en el modal de aptitud
    const suggestionButton = e.target.closest('.reason-suggestion-btn');
    if (suggestionButton) {
      const reason = suggestionButton.dataset.reason;
      const baseValue = suggestionButton.dataset.baseValue;
      const reasonInput = document.getElementById('aptitud-reason-display');
      const baseValueInput = document.getElementById('aptitud-base-value');

      if (reasonInput) reasonInput.value = reason;
      if (baseValueInput) baseValueInput.value = baseValue;

      console.log(`[LOG][DELEGATION] Sugerencia de motivo aplicada: "${reason}", Valor: ${baseValue}`);
      reasonInput.focus();
    }

    // Botón 'x' para eliminar una sugerencia de motivo
    const deleteSuggestionBtn = e.target.closest('.delete-suggestion-btn');
    if (deleteSuggestionBtn) {
      e.stopPropagation(); // Evita que el clic se propague al botón de sugerencia principal
      const { reasonId, moduleId, type } = deleteSuggestionBtn.dataset;
      console.log(`[LOG][DELEGATION] Clic en eliminar sugerencia. ID: ${reasonId}, Módulo: ${moduleId}, Tipo: ${type}`);
      handlers.handleDeleteAptitudeReason(moduleId, reasonId, type);
    }
  });
  // --- FIN: LISTENER GLOBAL EN BODY ---

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

    // Listener para el botón de editar etiquetas de diversidad
    document.querySelectorAll('.edit-diversity-tags-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        console.log('[LOG] Botón "Diversidad" clickeado.');
        const studentId = e.currentTarget.dataset.studentId;
        const studentName = e.currentTarget.dataset.studentName;
        const student = state.getDB().students.find(s => s.id === studentId);
        const currentTags = student?.diversityTags || [];
        console.log(`[LOG] - Student ID: ${studentId}, Nombre: ${studentName}`);

        const modalContainer = document.getElementById('modal-container'); // Usamos un contenedor genérico
        console.log('[LOG] Buscando #modal-container...', modalContainer ? '¡Encontrado!' : '¡NO ENCONTRADO!');
        if (modalContainer) {
            console.log('[LOG] Renderizando modal de diversidad...');
            modalContainer.innerHTML = pages.renderDiversityTagsModal(studentId, studentName, currentTags);

            // --- INICIO DE LA CORRECCIÓN ---
            // Los listeners deben añadirse DESPUÉS de que el HTML del modal exista.
            const modalElement = document.getElementById('diversity-tags-modal');
            if (!modalElement) return;

            const saveBtn = modalElement.querySelector('#save-diversity-tags-btn');
            const cancelBtn = modalElement.querySelector('#cancel-diversity-tags-btn');
            const addTagBtn = modalElement.querySelector('#add-diversity-tag-btn');
            const addTagInput = modalElement.querySelector('#add-diversity-tag-input');
            const tagsContainer = modalElement.querySelector('#diversity-tags-container');

            const closeModal = () => modalContainer.innerHTML = '';

            const addTag = () => {
                const tagText = addTagInput.value.trim();
                if (tagText) {
                    const newTagPill = document.createElement('span');
                    newTagPill.className = 'diversity-tag-pill flex items-center gap-2 bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-100 text-sm font-medium px-2.5 py-0.5 rounded-full';
                    newTagPill.innerHTML = `
                        <span class="tag-text">${tagText}</span>
                        <button type="button" class="delete-tag-btn text-purple-600 dark:text-purple-200 hover:text-purple-800 dark:hover:text-purple-50" title="Eliminar etiqueta">&times;</button>
                    `;
                    tagsContainer.appendChild(newTagPill);
                    addTagInput.value = '';
                }
                addTagInput.focus();
            };

            addTagBtn.addEventListener('click', addTag);
            addTagInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                }
            });

            tagsContainer.addEventListener('click', (e) => {
                if (e.target.classList.contains('delete-tag-btn')) {
                    e.target.closest('.diversity-tag-pill').remove();
                }
            });

            saveBtn.addEventListener('click', () => {
                const finalTags = Array.from(tagsContainer.querySelectorAll('.tag-text')).map(span => span.textContent);
                handlers.handleSaveDiversityTags(studentId, finalTags.join(', '));
                closeModal();
            });

            cancelBtn.addEventListener('click', closeModal);
            // --- FIN DE LA CORRECCIÓN ---
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

    // Lógica de seguridad: si la vista es 'alumno' pero no hay alumno seleccionado, forzar 'tabla'
    const selectedModule = db.modules.find(m => m.id === ui.selectedModuleId);
    if (ui.moduleView === 'alumno' && (!ui.selectedStudentIdForView || !selectedModule?.studentIds?.includes(ui.selectedStudentIdForView))) {
      console.log("Forzando cambio a vista 'tabla' por seguridad.");
      handlers.handleSetModuleView('tabla');
    }
    
    // Listeners para el selector de vistas del módulo
    document.getElementById('view-tabla-btn')?.addEventListener('click', () => {
      handlers.handleSetModuleView('tabla');
    });
    document.getElementById('view-alumno-btn')?.addEventListener('click', () => {
      handlers.handleSetModuleView('alumno');
    });
    // Listener para la nueva vista de Índice de Contenidos
    document.getElementById('view-progress-btn')?.addEventListener('click', () => {
        handlers.handleSetModuleView('indice');
    });
    document.getElementById('view-distribution-btn')?.addEventListener('click', () => {
      handlers.handleSetModuleView('distribucion');
    });

    // Listener para los botones de "Ver detalles de RA" en el resumen de pesos
    document.querySelectorAll('.view-ra-details-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        handlers.handleViewRaDetails(e.currentTarget.dataset.raId);
      });
    });

    // Listener para clics en las cabeceras de la tabla de calificaciones para ordenar
    document.querySelector('.calificaciones-table thead')?.addEventListener('click', (e) => {
      const header = e.target.closest('th[data-sort-key]');
      if (header) {
        handlers.handleSortTableView(header.dataset.sortKey);
      }
    });

    // Listener para clics en las filas de la tabla en la vista de alumno
    document.querySelector('.calificaciones-table tbody')?.addEventListener('click', (e) => {
      const row = e.target.closest('tr[data-student-id]');
      if (row && ui.moduleView === 'alumno') {
        state.setSelectedStudentIdForView(row.dataset.studentId);
        renderApp();
      }
    });

    // Listener para los botones de resumen de RA que abren el modal de detalle
    document.querySelectorAll('.open-ra-detail-modal-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        const { moduleId, raId } = e.currentTarget.dataset;
        const module = db.modules.find(m => m.id === moduleId);
        if (module) {
          const modalContainer = document.getElementById('modal-container');
          modalContainer.innerHTML = pages.renderRaDetailModal(module, raId);
          modalContainer.querySelector('#close-ra-detail-modal-btn')?.addEventListener('click', () => {
            modalContainer.innerHTML = '';
          });
        }
      });
    });

    document.getElementById('process-students-btn')?.addEventListener('click', (e) => {
      const text = document.getElementById('student-textarea').value;
      handlers.handleProcessStudentNames(text, e.currentTarget.dataset.moduleId);
    });
    // Listener para el nuevo botón de eliminar módulo
    document.getElementById('delete-module-btn')?.addEventListener('click', (e) => {
      const moduleId = e.currentTarget.dataset.moduleId;
      handlers.handleDeleteModule(moduleId);
    });

    // Listener para el botón de importación directa (el original)
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

    // --- INICIO: FUNCIÓN AUXILIAR PARA ACTUALIZAR BOTONES DE TIPO DE ACTIVIDAD ---
    const updateActivityTypeButtons = () => {
      const buttonGroup = document.getElementById('act-type-btn-group');
      const typeRows = document.querySelectorAll('#activity-types-tbody .activity-type-row');
      if (!buttonGroup || !typeRows) return;

      const types = Array.from(typeRows).map(row => ({
        nombre: row.querySelector('.activity-type-name').value,
        peso: row.querySelector('.activity-type-peso').value
      }));

      // Reconstruir los botones
      buttonGroup.innerHTML = `
        <label class="flex-1">
            <input type="radio" name="type" value="" class="hidden peer" checked>
            <div class="cursor-pointer text-center text-sm p-2 rounded-md border peer-checked:bg-blue-600 peer-checked:text-white peer-checked:border-blue-600 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600">Pers.</div>
        </label>
        ${types.map(t => `
            <label class="flex-1">
                <input type="radio" name="type" value="${t.peso}" class="hidden peer">
                <div class="cursor-pointer text-center text-sm p-2 rounded-md border peer-checked:bg-blue-600 peer-checked:text-white peer-checked:border-blue-600 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600">${t.nombre}</div>
            </label>
        `).join('')}
      `;
    };
    // --- FIN: FUNCIÓN AUXILIAR ---

    // --- INICIO: CORRECCIÓN LISTENERS DE GESTIÓN DE TIPOS DE ACTIVIDAD ---
    const activityTypesContainer = document.getElementById('activity-types-container');
    if (activityTypesContainer) {
      activityTypesContainer.addEventListener('click', (e) => {
        // Listener para eliminar una fila de tipo de actividad
        if (e.target.classList.contains('delete-activity-type-btn')) {
          e.target.closest('.activity-type-row').remove();
          updateActivityTypeButtons(); // Actualizar botones al eliminar
        }
      });
    }

    document.getElementById('add-activity-type-btn')?.addEventListener('click', () => {
      const tbody = document.getElementById('activity-types-tbody');
      if (tbody) {
        const newIndex = tbody.children.length;
        const newRow = document.createElement('tr');
        newRow.className = 'activity-type-row';
        newRow.dataset.index = newIndex;
        newRow.innerHTML = `
          <td class="p-2"><input type="text" value="" placeholder="Nuevo Tipo" class="activity-type-name w-full p-1 border rounded dark:bg-gray-900"></td>
          <td class="p-2"><input type="number" value="1" step="0.1" min="0" class="activity-type-peso w-full p-1 border rounded dark:bg-gray-900"></td>
          <td class="p-2 text-center"><button type="button" class="delete-activity-type-btn text-red-500 hover:text-red-700">&times;</button></td>
        `;
        tbody.appendChild(newRow);
        updateActivityTypeButtons(); // Actualizar botones al añadir
      }
    });

    document.getElementById('save-activity-types-btn')?.addEventListener('click', (e) => {
      const moduleId = e.currentTarget.dataset.moduleId;
      const rows = document.querySelectorAll('#activity-types-tbody .activity-type-row');
      const activityTypes = Array.from(rows).map(row => ({
        nombre: row.querySelector('.activity-type-name').value,
        peso: row.querySelector('.activity-type-peso').value
      }));
      handlers.handleSaveActivityTypes(moduleId, activityTypes);
    });
    // --- FIN: CORRECCIÓN LISTENERS DE GESTIÓN DE TIPOS DE ACTIVIDAD ---

    // --- INICIO: CORRECCIÓN AUTOCOMPLETADO DE PESO (BOTONES) ---
    document.getElementById('act-type-btn-group')?.addEventListener('change', (e) => {
        if (e.target.name === 'type' && e.target.value) {
            document.getElementById('act-peso').value = e.target.value;
        }
    });

    // --- INICIO: CORRECCIÓN AUTOCOMPLETADO DE PESO DE ACTIVIDAD ---
    // Listener para el autocompletado del peso de la actividad
    const actTypeSelect = document.getElementById('act-type');
    const actPesoInput = document.getElementById('act-peso');

    if (actTypeSelect && actPesoInput) {
      actTypeSelect.addEventListener('change', (e) => {
        const selectedWeight = e.target.value;
        if (selectedWeight) {
          actPesoInput.value = selectedWeight;
        }
      });
    }
    // --- FIN: CORRECCIÓN AUTOCOMPLETADO DE PESO DE ACTIVIDAD ---

    // --- INICIO: FEEDBACK DE IMPACTO DE ACTIVIDAD ---
    console.log('[LOG][attachEventListeners] Configurando listeners para feedback de impacto en CREAR actividad...');
    const ceCheckboxContainer = document.getElementById('ce-checkbox-container');
    const actPesoInputForImpact = document.getElementById('act-peso');
    const moduleIdForImpact = actividadForm?.dataset.moduleId;

    const updateFeedback = () => {
      console.log('[LOG][updateFeedback] -> Evento detectado (input/change) en formulario de CREAR actividad.');
      if (ceCheckboxContainer && actPesoInputForImpact && moduleIdForImpact) {
        const selectedCeIds = Array.from(ceCheckboxContainer.querySelectorAll('input[name="ceIds"]:checked')).map(cb => cb.value);
        const weight = parseFloat(actPesoInputForImpact.value) || 0;
        console.log(`[LOG][updateFeedback] -> Llamando a updateImpactPanel con: ModuleId=${moduleIdForImpact}, CEs=${selectedCeIds.join(',')}, Peso=${weight}`);
        updateImpactPanel(moduleIdForImpact, selectedCeIds, weight);
      } else {
        console.warn('[WARN][updateFeedback] -> No se pudo actualizar el feedback. Faltan elementos: ceCheckboxContainer, actPesoInputForImpact o moduleIdForImpact.');
      }
    };

    ceCheckboxContainer?.addEventListener('change', updateFeedback);
    actPesoInputForImpact?.addEventListener('input', updateFeedback);
    // --- FIN: FEEDBACK DE IMPACTO DE ACTIVIDAD ---

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

    // --- INICIO: CORRECCIÓN DRAG & DROP Y BORRADO DE ACTIVIDADES ---
    // Lógica de Drag and Drop para reordenar actividades
    const activityListContainer = document.getElementById('activity-list-container');
    if (activityListContainer) {
      let draggedItem = null;

      activityListContainer.addEventListener('dragstart', (e) => {
        if (e.target.classList.contains('activity-draggable')) {
          draggedItem = e.target;
          setTimeout(() => {
            draggedItem.style.opacity = '0.5';
          }, 0);
        }
      });

      activityListContainer.addEventListener('dragend', () => {
        if (draggedItem) {
          draggedItem.style.opacity = '1';
          draggedItem = null;
        }
      });

      activityListContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        const afterElement = getDragAfterElement(activityListContainer, e.clientY, 'activity-draggable');
        if (draggedItem) {
          if (afterElement == null) {
            activityListContainer.appendChild(draggedItem);
          } else {
            activityListContainer.insertBefore(draggedItem, afterElement);
          }
        }
      });

      activityListContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        if (draggedItem) {
          const newOrderedIds = [...activityListContainer.querySelectorAll('.activity-draggable')].map(div => div.dataset.actividadId);
          handlers.handleReorderActivities(newOrderedIds);
        }
      });
    }

    // Listener para el botón de eliminar actividad desde la lista
    document.querySelectorAll('.delete-activity-from-list-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        handlers.handleDeleteActivityFromList(e.currentTarget.dataset.actividadId);
      });
    });
    // --- FIN: CORRECCIÓN DRAG & DROP Y BORRADO DE ACTIVIDADES ---

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

        // --- INICIO: Lógica del Selector de Alumno ---
        const toggleBtn = document.getElementById('student-selector-toggle');
        const dropdown = document.getElementById('student-selector-dropdown');
        const searchInput = document.getElementById('student-search-input');
        const studentList = document.getElementById('student-selector-list');

        toggleBtn?.addEventListener('click', () => {
          dropdown.classList.toggle('hidden');
          if (!dropdown.classList.contains('hidden')) {
            searchInput.focus();
          }
        });

        searchInput?.addEventListener('input', (e) => {
          const filter = e.target.value.toLowerCase();
          studentList.querySelectorAll('li').forEach(li => {
            const name = li.textContent.toLowerCase();
            li.style.display = name.includes(filter) ? '' : 'none';
          });
        });

        studentList?.addEventListener('click', (e) => {
          if (e.target.tagName === 'LI') {
            const studentId = e.target.dataset.studentId;
            state.setSelectedStudentIdForView(studentId);
            dropdown.classList.add('hidden');
            renderApp();
          }
        });
        // --- FIN: Lógica del Selector de Alumno ---

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

    // Listener para el formulario de configuración de aptitud
    const aptitudConfigForm = document.getElementById('aptitud-config-form');
    if (aptitudConfigForm) {
      aptitudConfigForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handlers.handleUpdateAptitudConfig(e.currentTarget.dataset.moduleId, e.currentTarget);
      });
    }

    // Listener para el nuevo botón de importar aptitudes
    const importAptitudesBtn = document.getElementById('open-import-aptitudes-modal-btn');
    if (importAptitudesBtn) {
      importAptitudesBtn.addEventListener('click', (e) => {
        handlers.showImportAptitudesModal(e.currentTarget.dataset.moduleId);
      });
    }

    // Listeners para añadir/eliminar positivos/negativos
    document.querySelectorAll('.add-aptitud-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const { moduleId, studentId, trimester, type } = e.currentTarget.dataset;
        handlers.showAptitudEntryModal(moduleId, studentId, trimester, type);
      });
    });

    // Listeners para eliminar entradas de aptitud
    document.querySelectorAll('.delete-aptitud-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const { moduleId, studentId, trimester, type, id } = e.currentTarget.dataset;
        handlers.handleDeleteAptitud(moduleId, studentId, trimester, type, id);
      });
    });

    // Listeners para editar entradas de aptitud
    document.querySelectorAll('.edit-aptitud-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const { moduleId, studentId, trimester, type, id } = e.currentTarget.dataset;
        handlers.showAptitudEntryModal(moduleId, studentId, trimester, type, id);
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

    // Listener para el nuevo botón de importar notas (movido aquí para que se aplique correctamente)
    document.getElementById('open-import-grades-modal-btn')?.addEventListener('click', (ev) => {
      const actividadId = ev.currentTarget.dataset.actividadId;
      handlers.showImportGradesModal(actividadId);
    });

    // --- INICIO: FEEDBACK DE IMPACTO EN PÁGINA DE EDICIÓN ---
    console.log('[LOG][attachEventListeners] Configurando listeners para feedback de impacto en EDITAR actividad...');
    const updateForm = document.querySelector('.update-actividad-form');
    if (updateForm) {
      const ceCheckboxContainer = updateForm.querySelector('#ce-checkbox-container');
      const pesoInput = updateForm.querySelector('input[name="peso"]');
      const actividadId = updateForm.dataset.actividadId;
      const actividad = db.actividades.find(a => a.id === actividadId);
      console.log(`[LOG] Elementos para feedback de EDICIÓN encontrados: Formulario: ${!!updateForm}, Checkboxes: ${!!ceCheckboxContainer}, Input Peso: ${!!pesoInput}, Actividad: ${!!actividad}`);

      const updateEditFeedback = () => {
        console.log('[LOG][updateEditFeedback] -> Evento detectado (input/change) en formulario de EDICIÓN de actividad.');
        if (ceCheckboxContainer && pesoInput && actividad) {
          const selectedCeIds = Array.from(ceCheckboxContainer.querySelectorAll('input[name="ceIds"]:checked')).map(cb => cb.value);
          const weight = parseFloat(pesoInput.value) || 0;
          console.log(`[LOG][updateEditFeedback] -> Llamando a updateImpactPanel con: ModuleId=${actividad.moduleId}, CEs=${selectedCeIds.join(',')}, Peso=${weight}`);
          updateImpactPanel(actividad.moduleId, selectedCeIds, weight, actividad.id);
        } else {
          console.warn('[WARN][updateEditFeedback] -> No se pudo actualizar el feedback. Faltan elementos: ceCheckboxContainer, pesoInput o actividad.');
        }
      };
      ceCheckboxContainer?.addEventListener('change', updateEditFeedback);
      pesoInput?.addEventListener('input', updateEditFeedback);
    }
    // --- FIN: FEEDBACK DE IMPACTO EN PÁGINA DE EDICIÓN ---
  }
}

function getDragAfterElement(container, y, draggableSelector = '.student-draggable') {
  const draggableElements = [...container.querySelectorAll(`.${draggableSelector}:not(.dragging)`)];

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

export function handleDriveConnection({ content, fileId, fileName, accessToken }) {
  // 1. Validar que el JSON tiene la estructura esperada.
  if (content && content.modules && content.students) {
    // 2. Guardar los datos y el estado de la conexión.
    // --- INICIO: CORRECCIÓN DE ERROR DE APTITUD ---
    // Asegurarse de que la propiedad 'aptitudes' exista, incluso en archivos antiguos.
    if (!content.aptitudes) {
      content.aptitudes = {};
    }
    // --- FIN: CORRECCIÓN DE ERROR DE APTITUD ---
    state.setDB(content);
    state.setDriveConnection(fileId, fileName, accessToken);
    // 3. Renderizar la aplicación para mostrar los nuevos datos y el botón actualizado.
    renderApp();
    alert(`¡Conectado a "${fileName}" desde Google Drive!`);
  } else {
    alert('Error: El archivo JSON seleccionado no tiene el formato correcto.');
  }
}

function init() {
  // La carga inicial ahora es manual. El usuario debe conectar un archivo.
  // Por defecto, empezamos en la página de configuración.
  state.setPage('configuracion');

  // Activa el botón de Google Drive y le dice qué hacer cuando se carga un JSON.
  // Usaremos la función handleConnect existente para procesar los datos.
  renderApp();
}

document.addEventListener('DOMContentLoaded', init);
