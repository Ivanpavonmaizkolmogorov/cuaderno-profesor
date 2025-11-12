import * as state from './state.js';
import { setUIProperty } from './state.js'; // Importación nombrada
import * as dataManager from './services/dataManager.js';
import { parseStudentNames } from './services/nameParser.js';
import { calculateModuleGrades } from './services/calculations.js';
import { generateStudentReport } from './services/pdfGenerator.js';
import { prepareModuleForProgressTracking, deleteTemarioPoint, deleteTemarioUnit } from './utils.js';
import { renderImportTemarioModal } from './progressView.js';
import { renderApp } from './main.js';
import { renderImportGradesModal } from './ui/pages.js';
import { mergeTemario } from './services/dataImporter.js'; // Import the new mergeTemario function
import { exportToExcel } from './services/excelGenerator.js'; // <-- AÑADE ESTA LÍNEA

export async function handleConnect() {
    const fileName = await state.connectToFile();
    if (fileName) {
        alert(`Conectado a ${fileName}. Los cambios se guardarán automáticamente.`);
        renderApp();
    }
}

export function handleDisconnect() {
    state.disconnectFile();
    alert("Desconectado del archivo. Los cambios ya no se guardarán.");
    renderApp();
}

export function handleDisconnectDrive() {
    state.disconnectDrive();
    alert("Desconectado de Google Drive.");
    renderApp();
}

export async function handleSaveAs() {
    const fileName = await state.saveAsAndConnect();
    if (fileName) {
        alert(`Archivo "${fileName}" creado y conectado. Los cambios se guardarán automáticamente aquí.`);
        renderApp();
    }
}

export function handleDownloadModuleTemplate() {
  const template = {
    "modulo": "Nombre del Módulo",
    "id": "ID_UNICO_MODULO",
    "resultados_de_aprendizaje": [
      {
        "ra_id": "RA1",
        "ra_descripcion": "Descripción del Resultado de Aprendizaje 1.",
        "criterios_de_evaluacion": [
          { 
            "ce_id": "RA1-a", 
            "ce_descripcion": "Descripción del Criterio de Evaluación 'a' del RA1.", 
            "peso": 50,
            "ud_ref": "Referencia a la Unidad Didáctica (opcional)",
            "dual": false
          },
          { 
            "ce_id": "RA1-b", 
            "ce_descripcion": "Descripción del Criterio de Evaluación 'b' del RA1.", 
            "peso": 50,
            "ud_ref": "UD2",
            "dual": true
          }
        ]
      },
      {
        "ra_id": "RA2",
        "ra_descripcion": "Descripción del Resultado de Aprendizaje 2.",
        "criterios_de_evaluacion": [
          { 
            "ce_id": "RA2-a", 
            "ce_descripcion": "Descripción del Criterio de Evaluación 'a' del RA2.", 
            "peso": 100,
            "ud_ref": "UD3",
            "dual": false
          }
        ]
      }
    ]
  };
  const content = JSON.stringify(template, null, 2);
  dataManager.downloadTextAsFile(content, 'plantilla_modulo.json', 'application/json');
}

export function handleDownloadStudentTemplate() {
  const content = `# FORMATO RECOMENDADO: Apellidos, Nombre
# Cada línea debe contener los apellidos, una coma, y luego el nombre.
Pérez Padillo, Marta
Jiménez Castro, María de la Sierra`;
  dataManager.downloadTextAsFile(content, 'plantilla_alumnos.txt', 'text/plain');
}

export function handleExportSingleModuleReport(studentId, moduleId) {
  console.log("===== INICIANDO EXPORTACIÓN DE VISTA ACTUAL A PDF =====");
  console.log(`Recibido studentId: ${studentId}`);
  console.log(`Recibido moduleId: ${moduleId}`);

  const db = state.getDB();
  const student = db.students.find(s => s.id === studentId);
  const module = db.modules.find(m => m.id === moduleId);

  if (!student || !module) {
    alert("Error: No se pudo encontrar el alumno/a o el módulo para exportar.");
    return;
  }

  // Forzamos el cálculo de las notas finales para este alumno y módulo en el momento de la exportación.
  // Esto asegura que los datos son siempre correctos e independientes del estado de la UI.
  const finalGrades = calculateModuleGrades(
    module, 
    [student], 
    db.grades, 
    db.actividades, 
    null, // trimestre final
    db.aptitudes
  )[studentId] || { moduleGrade: 0, raTotals: {}, ceFinalGrades: {} };

  const moduleDataForPdf = [{
    module,
    ...finalGrades
  }];

  // Pasamos también las actividades y las notas en bruto para el desglose
  generateStudentReport(student, moduleDataForPdf, db.actividades, db.grades);
}

export function handleExportFullStudentReport(studentId) {
  const db = state.getDB();
  const student = db.students.find(s => s.id === studentId);
  if (!student) {
    alert("Error: Alumno/a no encontrado.");
    return;
  }

  // 1. Forzar el cálculo de notas para TODOS los módulos en los que el alumno está inscrito.
  // Esto asegura que los datos son siempre correctos e independientes del estado de la UI.
  const allCalculatedGrades = state.getCalculatedGrades();
  const enrolledModules = db.modules.filter(m => m.studentIds?.includes(studentId));

  enrolledModules.forEach(module => {
    if (!allCalculatedGrades[module.id]) {
      allCalculatedGrades[module.id] = {};
    }
    // Calculamos solo la nota final (trimestre = null) para el informe.
    allCalculatedGrades[module.id].Final = calculateModuleGrades(module, [student], db.grades, db.actividades, null);
  });

  // 2. Construir el array de datos para el PDF usando las notas recién calculadas.
  const modulesDataForPdf = enrolledModules.map(module => {
    const studentCalculations = allCalculatedGrades[module.id]?.Final?.[studentId] || { moduleGrade: 0, raTotals: {}, ceFinalGrades: {} };
    return { module, ...studentCalculations };
  });

  generateStudentReport(student, modulesDataForPdf, db.actividades, db.grades);
}

export function handleSetPage(newPage) {
  state.setPage(newPage);
  renderApp();
}

export function handleSelectModule(moduleId) {
    state.setSelectedModuleId(moduleId);
    state.setModuleView('tabla'); 
    state.setSelectedStudentIdForView(null);
    renderApp();
}

export function handleSelectActividad(actividadId) {
  state.setSelectedActividadId(actividadId);
  handleSetPage('actividadDetail');
}

export function handleFilterStudentsByModule(moduleId) {
  state.setStudentPageModuleFilter(moduleId);
  renderApp();
}

export function handleSetModuleView(newView) {
    state.setModuleView(newView);
    const db = state.getDB();
    const selectedModule = db.modules.find(m => m.id === state.getUI().selectedModuleId);
    const students = (selectedModule?.studentIds || [])
        .map(id => db.students.find(s => s.id === id))
        .filter(Boolean);
    // Si cambiamos a la vista 'alumno' y no hay un alumno/a seleccionado, o el seleccionado ya no existe en la lista,
    // seleccionamos el primero de la lista actual.
    const currentSelectedId = state.getUI().selectedStudentIdForView;
    const isCurrentStudentInList = students.some(s => s.id === currentSelectedId);
    if (newView === 'alumno' && (!currentSelectedId || !isCurrentStudentInList) && students.length > 0) {
        state.setSelectedStudentIdForView(students[0].id);
    }
    renderApp(); // <-- RESTAURADO: Es necesario para que la UI reaccione al cambio de estado.
}

export function handleNavigateStudent(direction) {
    const db = state.getDB();
    const selectedModule = db.modules.find(m => m.id === state.getUI().selectedModuleId);
    const moduleStudents = (selectedModule?.studentIds || [])
        .map(id => db.students.find(s => s.id === id))
        .filter(Boolean);
    if (!moduleStudents || moduleStudents.length === 0) return;
    
    const currentIndex = moduleStudents.findIndex(s => s.id === state.getUI().selectedStudentIdForView);
    if (currentIndex === -1) {
        state.setSelectedStudentIdForView(students[0].id);
        renderApp();
        return;
    }

    let nextIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
    
    if (nextIndex >= 0 && nextIndex < moduleStudents.length) {
        state.setSelectedStudentIdForView(moduleStudents[nextIndex].id);
        renderApp();
    }
}

export function handleSortStudents(moduleId, direction = 'asc') {
  const db = state.getDB();
  const module = db.modules.find(m => m.id === moduleId);
  if (!module || !module.studentIds) return;

  // Creamos un mapa de ID a nombre para poder ordenar
  const studentNameMap = new Map(db.students.map(s => [s.id, s.name]));

  const sortByName = (idA, idB) => {
    const nameA = studentNameMap.get(idA) || '';
    const nameB = studentNameMap.get(idB) || '';
    
    const getNameParts = (fullName) => {
      if (fullName.includes(',')) {
        const parts = fullName.split(',');
        return { lastName: parts[0].trim(), firstName: parts[1].trim() };
      } else {
        const words = fullName.split(' ');
        const firstName = words.pop();
        const lastName = words.join(' ');
        return { lastName: lastName || firstName, firstName: lastName ? firstName : '' };
      }
    };

    const partsA = getNameParts(nameA);
    const partsB = getNameParts(nameB);

    const lastNameCompare = partsA.lastName.localeCompare(partsB.lastName, 'es', { sensitivity: 'base' });
    if (lastNameCompare !== 0) {
      return lastNameCompare;
    }
    return partsA.firstName.localeCompare(partsB.firstName, 'es', { sensitivity: 'base' });
  };

  module.studentIds.sort(sortByName);

  if (direction === 'desc') {
    module.studentIds.reverse();
  }

  state.setDB(db);
  state.saveDB();
  renderApp();
}

export function handleReorderStudents(moduleId, orderedStudentIds) {
  const db = state.getDB();
  const module = db.modules.find(m => m.id === moduleId);
  if (!module) return;

  module.studentIds = orderedStudentIds;
  state.setDB(db);
  state.saveDB();
  renderApp(); // Volvemos a renderizar para confirmar el orden
}

export function handleSortAllStudents(direction = 'asc') {
  const db = state.getDB();
  if (!db.students) return;

  const sortByName = (a, b) => {
    const getNameParts = (fullName) => {
      if (fullName.includes(',')) {
        const parts = fullName.split(',');
        return { lastName: parts[0].trim(), firstName: parts[1].trim() };
      } else {
        const words = fullName.split(' ');
        const firstName = words.pop();
        const lastName = words.join(' ');
        return { lastName: lastName || firstName, firstName: lastName ? firstName : '' };
      }
    };

    const partsA = getNameParts(a.name);
    const partsB = getNameParts(b.name);

    const lastNameCompare = partsA.lastName.localeCompare(partsB.lastName, 'es', { sensitivity: 'base' });
    if (lastNameCompare !== 0) {
      return lastNameCompare;
    }
    return partsA.firstName.localeCompare(partsB.firstName, 'es', { sensitivity: 'base' });
  };

  db.students.sort(sortByName);

  if (direction === 'desc') {
    db.students.reverse();
  }

  state.setDB(db);
  state.saveDB();
  renderApp();
}

export function handleReorderAllStudents(orderedStudentIds) {
  const db = state.getDB();
  const studentMap = new Map(db.students.map(s => [s.id, s]));
  db.students = orderedStudentIds.map(id => studentMap.get(id)).filter(Boolean);
  state.setDB(db);
  state.saveDB();
  renderApp();
}

export function handleToggleCeDual(moduleId, ceId) {
  const db = state.getDB();
  const module = db.modules.find(m => m.id === moduleId);
  if (!module) return;

  let ceFound = false;
  for (const ra of module.resultados_de_aprendizaje) {
    const ce = ra.criterios_de_evaluacion.find(c => c.ce_id === ceId);
    if (ce) {
      ce.dual = !ce.dual; // Cambia el estado
      ceFound = true;
      break;
    }
  }

  if (ceFound) {
    state.setDB(db);
    state.saveDB();
    renderApp();
  }
}

export function showImportTemarioModal() {
  const modalContainer = document.getElementById('modal-container');
  if (!modalContainer) return;

  // Obtenemos el módulo seleccionado directamente del estado
  const { selectedModuleId } = state.getUI();
  if (!selectedModuleId) return;

  modalContainer.innerHTML = renderImportTemarioModal(selectedModuleId);

  const closeModal = () => {
    modalContainer.innerHTML = '';
  };

  document.getElementById('cancel-import-temario')?.addEventListener('click', closeModal);

  document.getElementById('confirm-import-temario')?.addEventListener('click', () => {
    try {
      const jsonText = document.getElementById('temario-json-textarea').value;
      const importMode = document.querySelector('input[name="importMode"]:checked').value;

      handleImportTemario(selectedModuleId, jsonText, importMode);
      closeModal();
      // renderApp() será llamado por el manejador, lo que re-renderizará progressView
    } catch (error) {
      alert('Error en el formato JSON. Por favor, revisa el texto introducido.');
      console.error("Error al parsear JSON del temario:", error);
    }
  });
}

export function handleImportStudentsToModule(text, moduleId) {
  try {
    if (!moduleId) {
      throw new Error("No se ha seleccionado un módulo para asociar los alumnos/as.");
    }

    const newStudents = dataManager.importStudents(text);
    const db = state.getDB();

    // Añadir nuevos alumnos/as a la lista maestra si no existen
    const existingStudentNames = new Set(db.students.map(s => s.name.toLowerCase()));
    const trulyNewStudents = newStudents.filter(s => !existingStudentNames.has(s.name.toLowerCase()));
    db.students.push(...trulyNewStudents);
    db.students.sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));

    // Asociar los IDs de los alumnos/as importados al módulo
    const module = db.modules.find(m => m.id === moduleId);
    const importedStudentNames = new Set(newStudents.map(s => s.name.toLowerCase()));
    const studentIdsToAssociate = db.students
      .filter(s => importedStudentNames.has(s.name.toLowerCase()))
      .map(s => s.id);
    
    // Unir los alumnos existentes con los nuevos, eliminando duplicados
    const existingStudentIds = module.studentIds || [];
    module.studentIds = Array.from(new Set([...existingStudentIds, ...studentIdsToAssociate])); 

    state.setDB(db);

    // Advertir al usuario si se importaron nombres sin coma
    const studentsWithoutComma = newStudents.filter(s => !s.name.includes(','));
    if (studentsWithoutComma.length > 0) {
        alert(`¡Atención! Se han importado alumnos sin usar el formato "Apellidos, Nombre".\n\nPara un ordenamiento alfabético preciso por apellido, se recomienda usar el formato "Apellidos, Nombre" (ej: "Pérez Padillo, Marta").\n\nSi ya has usado este formato, ignora este mensaje.`);
    }

    state.saveDB();
    alert(`Lista de alumnos/as actualizada para el módulo "${module.modulo}".`);
    renderApp();
  } catch (error) {
    alert(error.message);
  }
}

export function handleProcessStudentNames(text, moduleId) {
  const suggestions = parseStudentNames(text);
  if (suggestions.length === 0) {
    alert("No se encontraron nombres en el texto para procesar.");
    return;
  }
  // Guardamos las sugerencias en el estado para que el modal las pueda leer
  setUIProperty('studentNameSuggestions', { suggestions, moduleId });
  renderApp(); // Volver a renderizar para que main.js muestre el modal
}

export function handleRemoveStudentFromModule(moduleId, studentId) {
  const db = state.getDB();
  const module = db.modules.find(m => m.id === moduleId);
  const student = db.students.find(s => s.id === studentId);

  if (!module || !student) {
    alert("Error: No se pudo encontrar el módulo o el alumno/a.");
    return;
  }

  if (window.confirm(`¿Estás seguro de que quieres eliminar a "${student.name}" del módulo "${module.modulo}"? Sus notas en este módulo también se borrarán.`)) {
    // Eliminar al alumno/a de la lista del módulo
    module.studentIds = module.studentIds.filter(id => id !== studentId);

    // Opcional pero recomendado: Limpiar sus notas para ese módulo
    if (db.grades[studentId]) {
      // Esto es simplificado. Si un CE pudiera estar en varios módulos, necesitaríamos una lógica más compleja.
      // Por ahora, asumimos que al quitarlo, podemos limpiar sus notas.
      // Una mejor aproximación sería borrar solo las notas de las actividades de este módulo.
      // Por simplicidad, por ahora no borramos las notas para evitar perder datos si se re-añade.
    }

    state.setDB(db);
    state.saveDB();
    alert(`"${student.name}" ha sido eliminado del módulo.`);
    renderApp();
  }
}

export function handleDeleteStudent(studentId) {
  const db = state.getDB();
  const student = db.students.find(s => s.id === studentId);

  if (!student) {
    alert("Error: No se pudo encontrar al alumno/a para eliminar.");
    return;
  }

  if (window.confirm(`¿Estás seguro de que quieres eliminar a "${student.name}" PERMANENTEMENTE del sistema?\n\n¡ATENCIÓN! Esta acción es irreversible y borrará:\n- El registro del alumno/a.\n- TODAS sus calificaciones en TODOS los módulos.\n- TODOS sus comentarios.\n- Su matrícula en todos los módulos.`)) {
    // 1. Eliminar al alumno/a de la lista principal de alumnos
    db.students = db.students.filter(s => s.id !== studentId);

    // 2. Eliminar todas las calificaciones del alumno/a
    delete db.grades[studentId];

    // 3. Eliminar todos los comentarios del alumno/a
    Object.keys(db.comments).forEach(moduleId => {
      if (db.comments[moduleId] && db.comments[moduleId][studentId]) {
        delete db.comments[moduleId][studentId];
      }
    });

    // 4. Eliminar al alumno/a de las listas `studentIds` de todos los módulos
    db.modules.forEach(module => {
      if (module.studentIds) {
        module.studentIds = module.studentIds.filter(id => id !== studentId);
      }
    });

    state.setDB(db);
    state.saveDB();
    alert(`El alumno/a "${student.name}" ha sido eliminado del sistema.`);
    renderApp();
  }
}

export function handleBulkDeleteStudents(studentIds) {
  const db = state.getDB();
  if (!studentIds || studentIds.length === 0) {
    alert("No hay alumnos/as seleccionados para eliminar.");
    return;
  }

  const studentsToDelete = db.students.filter(s => studentIds.includes(s.id));
  const studentNames = studentsToDelete.map(s => s.name).join('\n - ');

  if (window.confirm(`¿Estás seguro de que quieres eliminar a los siguientes ${studentsToDelete.length} alumnos/as PERMANENTEMENTE del sistema?\n\n - ${studentNames}\n\n¡ATENCIÓN! Esta acción es irreversible y borrará TODOS sus datos (calificaciones, comentarios, etc.).`)) {
    const studentIdSet = new Set(studentIds);

    // 1. Filtrar la lista principal de alumnos
    db.students = db.students.filter(s => !studentIdSet.has(s.id));

    // 2. Eliminar todas las calificaciones de los alumnos borrados
    studentIds.forEach(studentId => {
      delete db.grades[studentId];
    });

    // 3. Eliminar todos los comentarios de los alumnos borrados
    Object.keys(db.comments).forEach(moduleId => {
      if (db.comments[moduleId]) {
        studentIds.forEach(studentId => {
          delete db.comments[moduleId][studentId];
        });
      }
    });

    // 4. Eliminar a los alumnos de las listas `studentIds` de todos los módulos
    db.modules.forEach(module => {
      if (module.studentIds) {
        module.studentIds = module.studentIds.filter(id => !studentIdSet.has(id));
      }
    });

    state.setDB(db);
    state.saveDB();
    alert(`${studentsToDelete.length} alumno(s)/alumna(s) han sido eliminados del sistema.`);
    renderApp();
  }
}

export function handleImportModule(text) {
  try {
    let data = JSON.parse(text);
    const db = state.getDB();
    let modulesToImport = [];

    // Detectar si es un archivo de backup completo con un array de "modules"
    if (Array.isArray(data.modules)) {
      modulesToImport = data.modules;
    } else if (data.module && typeof data.module === 'object') {
      // Si es un objeto anidado bajo la clave "module"
      modulesToImport.push(data.module);
    } else {
      // Asumir que es un único objeto de módulo
      modulesToImport.push(data);
    }

    let importedCount = 0;
    modulesToImport.forEach(moduleData => {
      const newModule = dataManager.importModule(JSON.stringify(moduleData), db.modules);
      db.modules.push(newModule);
      importedCount++;
    });

    if (importedCount > 0) {
      state.setDB(db);
      state.saveDB();
      alert(`${importedCount} módulo(s) importado(s) con éxito.`);
      handleSelectModule(modulesToImport[modulesToImport.length - 1].id); // Seleccionar el último importado
    } else {
      throw new Error("No se encontraron módulos válidos para importar en el JSON proporcionado.");
    }
  } catch (error) {
    console.error("Error importing module:", error);
    alert(`Error al importar el módulo: ${error.message}`);
  }
}

export function handleDeleteModule(moduleId) {
  const db = state.getDB();
  const moduleToDelete = db.modules.find(m => m.id === moduleId);

  if (!moduleToDelete) {
    alert("Error: No se pudo encontrar el módulo a eliminar.");
    return;
  }

  if (window.confirm(`¿Estás seguro de que quieres eliminar el módulo "${moduleToDelete.modulo}"?\n\n¡ATENCIÓN! Esta acción es irreversible y borrará también TODAS las actividades, calificaciones y comentarios asociados a este módulo.`)) {
    // 1. Encontrar las actividades del módulo a eliminar
    const actividadesToDeleteIds = new Set(db.actividades.filter(a => a.moduleId === moduleId).map(a => a.id));

    // 2. Eliminar las actividades del módulo
    db.actividades = db.actividades.filter(a => a.moduleId !== moduleId);

    // 3. Eliminar las calificaciones asociadas a esas actividades
    Object.keys(db.grades).forEach(studentId => {
      Object.keys(db.grades[studentId]).forEach(actividadId => {
        if (actividadesToDeleteIds.has(actividadId)) {
          delete db.grades[studentId][actividadId];
        }
      });
    });

    // 4. Eliminar los comentarios del módulo
    delete db.comments[moduleId];

    // 5. Finalmente, eliminar el módulo
    db.modules = db.modules.filter(m => m.id !== moduleId);

    state.setDB(db);
    state.saveDB();
    alert(`Módulo "${moduleToDelete.modulo}" y todos sus datos asociados han sido eliminados.`);
    handleSelectModule(null); // Deseleccionar y volver a la vista principal de módulos
  }
}

export function handleImportTemario(moduleId, jsonText, mode) {
  console.log(`[LOG] Iniciando handleImportTemario. Módulo: ${moduleId}, Modo: ${mode}`);

  try {
    const newTemarioData = JSON.parse(jsonText);
    if (!Array.isArray(newTemarioData)) {
      throw new Error("El JSON debe ser un array de unidades.");
    }

    const db = state.getDB();
    const module = db.modules.find(m => m.id === moduleId);
    if (!module) {
      throw new Error("Módulo no encontrado.");
    }

    if (mode === 'replace') {
      // Modo Reemplazar: borra lo antiguo y pone lo nuevo.
      module.temario = newTemarioData;
      module.progresoTemario = {}; // Reiniciar el progreso
      alert("Índice reemplazado con éxito.");
    } else {
      // Modo Fusionar (por defecto): usa nuestra nueva función.
      const existingTemario = module.temario || [];
      const { mergedTemario, stats } = mergeTemario(existingTemario, newTemarioData);
      module.temario = mergedTemario;

      // Construir un mensaje de feedback detallado para el usuario.
      let feedbackMessage = "Índice fusionado con éxito.\n\nResumen de la operación:\n";
      if (stats.unitsMerged > 0) {
        feedbackMessage += `- Se han fusionado y actualizado ${stats.unitsMerged} unidad(es) existentes.\n`;
      }
      if (stats.unitsAdded > 0) {
        feedbackMessage += `- Se han añadido ${stats.unitsAdded} unidad(es) nuevas.\n`;
      }
      if (stats.pointsAdded > 0 || stats.pointsUpdated > 0) {
        feedbackMessage += `- Dentro de las unidades, se han añadido ${stats.pointsAdded} puntos nuevos y se han actualizado ${stats.pointsUpdated}.\n`;
      }
      alert(feedbackMessage);
    }

    console.log('[LOG] handleImportTemario: Iniciando preparación y actualización de estados...');
    // Preparamos los IDs y el progreso para el nuevo temario.
    prepareModuleForProgressTracking(module);

    // --- INICIO DE LA CORRECCIÓN ---
    // Lógica para marcar automáticamente como "visto" los puntos evaluados.
    // Se ejecuta una sola vez después de la importación para evitar bucles.
    const ceToActivityMap = new Map();
    db.actividades
      .filter(act => act.moduleId === moduleId)
      .forEach(activity => {
        activity.ceIds.forEach(ceId => {
          if (!ceToActivityMap.has(ceId)) ceToActivityMap.set(ceId, []);
          ceToActivityMap.get(ceId).push(activity.name);
        });
      });

    module.temario.forEach(unit => {
      unit.puntos.forEach(point => {
        if (!module.progresoTemario[point.idPunto]) module.progresoTemario[point.idPunto] = 'no-visto';
        const isEvaluated = (point.ce_ids || []).some(ceId => ceToActivityMap.has(ceId));
        if (isEvaluated && module.progresoTemario[point.idPunto] === 'no-visto') {
          module.progresoTemario[point.idPunto] = 'visto';
        }
      });
    });
    // --- FIN DE LA CORRECCIÓN ---

    state.setDB(db);
    console.log('[LOG] handleImportTemario: DB actualizada con nuevos estados. Guardando...');
    state.saveDB();
    renderApp();

  } catch (error) {
    console.error("Error al importar el temario:", error);
    alert(`Error al importar el índice: ${error.message}`);
  }
}

/**
 * Muestra el modal para importar calificaciones para una actividad.
 * @param {string} actividadId - El ID de la actividad.
 */
export function showImportGradesModal(actividadId) {
  const modalContainer = document.getElementById('modal-container');
  const actividad = state.getDB().actividades.find(a => a.id === actividadId);
  if (!modalContainer || !actividad) return;

  modalContainer.innerHTML = renderImportGradesModal(actividadId, actividad.name);

  const closeModal = () => modalContainer.innerHTML = '';

  document.getElementById('cancel-import-grades')?.addEventListener('click', closeModal);
  document.getElementById('confirm-import-grades')?.addEventListener('click', (e) => {
    const jsonText = document.getElementById('grades-json-textarea').value;
    handleImportGrades(e.currentTarget.dataset.actividadId, jsonText);
    closeModal();
  });
}

/**
 * Procesa e importa un JSON con calificaciones para una actividad.
 * @param {string} actividadId - El ID de la actividad a la que se importan las notas.
 * @param {string} jsonText - El string JSON con los datos de las notas.
 */
export function handleImportGrades(actividadId, jsonText) {
  // Opciones válidas para el tipo de calificación, obtenidas del formulario de la UI.
  const VALID_GRADE_TYPES = ['Ordinaria', 'Recuperación', 'Mejora de nota'];

  try {
    const gradesToImport = JSON.parse(jsonText);
    if (!Array.isArray(gradesToImport)) {
      throw new Error("El JSON debe ser un array de objetos de calificación.");
    }

    const db = state.getDB();
    const actividad = db.actividades.find(a => a.id === actividadId);
    if (!actividad) throw new Error("Actividad no encontrada.");

    const studentsMap = new Map(db.students.map(s => [s.name.trim().toLowerCase(), s.id]));
    let importedCount = 0;
    const notFoundNames = [];

    gradesToImport.forEach(item => {
      const studentNameKey = item.studentName?.trim().toLowerCase();
      const studentId = studentsMap.get(studentNameKey);

      if (studentId && typeof item.grade === 'number') {
        let gradeType = 'Ordinaria'; // Valor por defecto.
        let observation = item.observation || 'Calificación importada desde JSON.';

        if (item.type) {
          if (VALID_GRADE_TYPES.includes(item.type)) {
            gradeType = item.type;
          } else {
            observation = `[Tipo inválido: '${item.type}'] ${observation}`;
          }
        }

        const newAttempt = {
          id: crypto.randomUUID(),
          grade: Math.max(0, Math.min(10, item.grade)),
          type: gradeType,
          observation: observation,
          date: new Date().toISOString(),
        };

        if (!db.grades[studentId]) db.grades[studentId] = {};
        if (!db.grades[studentId][actividadId]) db.grades[studentId][actividadId] = [];
        db.grades[studentId][actividadId].push(newAttempt);
        importedCount++;
      } else if (studentNameKey) {
        notFoundNames.push(item.studentName);
      }
    });

    state.setDB(db);
    state.saveDB();
    renderApp();

    alert(`Importación completada.\n\n- Calificaciones importadas: ${importedCount}\n- Alumnos no encontrados: ${notFoundNames.length}${notFoundNames.length > 0 ? `\n  (${notFoundNames.join(', ')})` : ''}`);
  } catch (error) {
    alert(`Error al importar calificaciones: ${error.message}`);
  }
}

export function handleDeleteTemario(moduleId) {
  if (window.confirm("¿Estás seguro de que quieres eliminar TODO el índice de contenidos de este módulo? Esta acción no se puede deshacer.")) {
    const db = state.getDB();
    const module = db.modules.find(m => m.id === moduleId);
    if (module) {
      module.temario = [];
      module.progresoTemario = {};
      state.setDB(db);
      state.saveDB();
      renderApp();
      alert("El índice de contenidos ha sido eliminado.");
    }
  }
}

export function handleDeleteTemarioUnit(moduleId, unitId) {
  console.log(`[handleDeleteTemarioUnit] ==> INICIO de borrado de UNIDAD. ModuleID: ${moduleId}, UnitID: ${unitId}`);

  // 1. Pedir confirmación UNA SOLA VEZ.
  console.log('[handleDeleteTemarioUnit] Mostrando diálogo de confirmación AHORA...');
  if (!window.confirm("¿Estás seguro de que quieres eliminar esta unidad y todos sus puntos? Esta acción no se puede deshacer.")) {
    console.log('[handleDeleteTemarioUnit] El usuario CANCELÓ el borrado.');
    return; // Si el usuario cancela, no hacemos nada.
  }
  console.log('[handleDeleteTemarioUnit] El usuario CONFIRMÓ el borrado.');

  const db = state.getDB();
  const module = db.modules.find(m => m.id === moduleId);

  if (module && module.temario) {
    console.log(`[handleDeleteTemarioUnit] Unidad encontrada. Procediendo a filtrar el temario para eliminar la unidad.`);
    // 2. Eliminar la unidad del temario.
    module.temario = module.temario.filter(unit => unit.idUnidad !== unitId);
    // 3. Guardar los cambios y volver a renderizar la aplicación.
    state.setDB(db);
    state.saveDB();
    console.log('[handleDeleteTemarioUnit] DB guardada y renderApp() llamado. Fin del proceso de borrado de unidad.');
    renderApp();
  } else {
    console.error('[handleDeleteTemarioUnit] No se encontró el módulo o el temario para la unidad a borrar.');
  }
}

export function handleDeleteTemarioPoint(moduleId, unitId, pointId) {
  console.log(`[handleDeleteTemarioPoint] ==> INICIO de borrado de PUNTO. ModuleID: ${moduleId}, UnitID: ${unitId}, PointID: ${pointId}`);
  const db = state.getDB();
  deleteTemarioPoint(db, moduleId, unitId, pointId);
  state.setDB(db);
  state.saveDB();
  console.log('[handleDeleteTemarioPoint] DB guardada y renderApp() llamado. Fin del proceso de borrado de punto.');
  renderApp();
}

export function handleClearData() {
  if (window.confirm("¿Estás seguro de que quieres borrar TODOS los datos? Esta acción no se puede deshacer.")) {
    state.setDB({ modules: [], students: [], grades: {}, comments: {}, actividades: [], trimesterGrades: {} });
    state.saveDB();
    state.setSelectedModuleId(null);
    alert("Todos los datos han sido borrados.");
    handleSetPage('configuracion');
  }
}

export function handleExportData() {
  try {
    dataManager.exportData(state.getDB());
    alert("Base de datos exportada correctamente.");
  } catch (error) {
    alert(error.message);
  }
}

export function handleGradeChange(studentId, ceId, value) {
    let numericValue = parseFloat(value);
    
    if (value === '' || isNaN(numericValue)) {
        numericValue = null;
    } else {
        numericValue = Math.max(0, Math.min(10, parseFloat(numericValue.toFixed(2))));
    }

    const db = state.getDB();
    if (!db.grades[studentId]) {
        db.grades[studentId] = {};
    }
    
    if (db.grades[studentId][ceId] !== numericValue) {
        if (numericValue === null) {
            delete db.grades[studentId][ceId];
        } else {
            db.grades[studentId][ceId] = numericValue;
        }
        state.setDB(db);
        state.saveDB();
        
        const selectedModule = db.modules.find(m => m.id === state.getUI().selectedModuleId);
        if (selectedModule) {
            const moduleStudents = (selectedModule.studentIds || [])
                .map(studentId => db.students.find(s => s.id === studentId))
                .filter(Boolean);
            const newCalculatedGrades = calculateModuleGrades(selectedModule, moduleStudents, db.grades);
            state.setCalculatedGrades(newCalculatedGrades);
        }
        renderApp();
    }
}

export function handleAddComment(moduleId, studentId, form) {
  const db = state.getDB();
  const text = form.text.value.trim();
  const type = form.type.value;
  const ceId = form.ce.value;

  if (!text) {
    alert("El comentario no puede estar vacío.");
    return;
  }

  if (!db.comments[moduleId]) {
    db.comments[moduleId] = {};
  }
  if (!db.comments[moduleId][studentId]) {
    db.comments[moduleId][studentId] = [];
  }
  
  const newComment = {
    id: crypto.randomUUID(),
    text,
    type,
    ce_id: type === 'ce' ? ceId : null,
    date: new Date().toISOString(),
  };

  db.comments[moduleId][studentId].unshift(newComment); // Añadir al principio
  state.setDB(db);
  state.saveDB();
  renderApp();
}

export function handleDeleteComment(moduleId, studentId, commentId) {
  const db = state.getDB();
  if (db.comments[moduleId] && db.comments[moduleId][studentId]) {
    db.comments[moduleId][studentId] = db.comments[moduleId][studentId].filter(c => c.id !== commentId);
    state.setDB(db);
    state.saveDB();
    renderApp();
  }
}

export function handleCreateActividad(moduleId, form) {
  const name = form.name.value.trim();
  const trimestre = form.trimestre.value;
  const ceIds = Array.from(form.querySelectorAll('input[name="ceIds"]:checked')).map(cb => cb.value);

  if (!name || !trimestre || ceIds.length === 0) {
    alert("Por favor, completa todos los campos: nombre, trimestre y al menos un CE.");
    return;
  }

  const newActividad = {
    id: crypto.randomUUID(),
    moduleId,
    name,
    trimestre,
    ceIds,
  };

  const db = state.getDB();
  db.actividades.push(newActividad);
  state.setDB(db);
  state.saveDB();
  renderApp();
}

export function handleUpdateActividad(actividadId, form) {
  const name = form.name.value.trim();
  const trimestre = form.trimestre.value;
  const ceIds = Array.from(form.querySelectorAll('input[name="ceIds"]:checked')).map(cb => cb.value);

  if (!name || !trimestre || ceIds.length === 0) {
    alert("Por favor, completa todos los campos: nombre, trimestre y al menos un CE.");
    return;
  }

  const db = state.getDB();
  const actividad = db.actividades.find(a => a.id === actividadId);
  if (!actividad) return;

  actividad.name = name;
  actividad.trimestre = trimestre;
  actividad.ceIds = ceIds;

  state.setDB(db);
  state.saveDB();
  alert("Actividad actualizada con éxito.");
  // No es necesario navegar, nos quedamos en la misma página para ver los cambios
  renderApp();
}

export function handleDeleteActividad(actividadId) {
  if (!window.confirm("¿Seguro que quieres eliminar esta actividad? Todas las calificaciones asociadas a ella también se borrarán.")) {
    return;
  }
  const db = state.getDB();
  db.actividades = db.actividades.filter(a => a.id !== actividadId);
  // Borrar las notas de esta actividad para todos los alumnos
  Object.keys(db.grades).forEach(studentId => {
    if (db.grades[studentId][actividadId]) {
      delete db.grades[studentId][actividadId];
    }
  });
  state.setDB(db);
  state.saveDB();
  alert("Actividad eliminada. Volviendo a la página de módulos.");
  handleSetPage('modulos');
}

export function handleAddActividadGradeAttempt(studentId, actividadId, form, fromPanel = false) {
  const db = state.getDB();
  const grade = parseFloat(form.grade.value);
  const type = form.type.value;
  const observation = form.observation.value.trim();

  if (isNaN(grade) || grade < 0 || grade > 10) {
    alert("La nota debe ser un número entre 0 y 10.");
    return;
  }

  if (!db.grades[studentId]) {
    db.grades[studentId] = {};
  }
  if (!db.grades[studentId][actividadId]) {
    db.grades[studentId][actividadId] = [];
  }

  const newAttempt = {
    id: crypto.randomUUID(),
    grade,
    type,
    observation,
    date: new Date().toISOString(),
  };

  db.grades[studentId][actividadId].push(newAttempt);
  state.setDB(db);
  state.saveDB();
  // Simplemente volvemos a renderizar la página actual para ver la nueva nota
  renderApp();
}

export function handleDeleteActividadGradeAttempt(studentId, actividadId, attemptId, fromPanel = false) {
  if (!window.confirm("¿Seguro que quieres eliminar esta calificación?")) return;
  const db = state.getDB();
  const attempts = db.grades[studentId]?.[actividadId] || [];
  db.grades[studentId][actividadId] = attempts.filter(att => att.id !== attemptId);
  state.setDB(db);
  state.saveDB();
  // Volvemos a renderizar la página para que la nota desaparezca
  renderApp();
}

// al final de js/handlers.js

// en js/handlers.js

export function handleExportExcel() {
  console.log("--- handleExportExcel INICIADO ---"); // Chivato 3
  
  try {
    const db = state.getDB();
    console.log("Base de datos obtenida:", db); // Chivato 4

    if (db.modules.length === 0 || db.students.length === 0) {
      console.warn("Datos insuficientes para exportar. Módulos:", db.modules.length, "Alumnos:", db.students.length);
      alert("No hay suficientes datos (módulos y alumnos) para generar el Excel.");
      return;
    }

    console.log("Datos suficientes. Llamando a exportToExcel..."); // Chivato 5
    exportToExcel(db); // Esta es la función del otro archivo
  
  } catch (error) {
    console.error("Error CATASTRÓFICO al generar el Excel:", error); // Chivato 6
    alert(`Se produjo un error al generar el Excel: ${error.message}`);
  }
}

/**
 * Guarda las etiquetas de atención a la diversidad para un alumno.
 * @param {string} studentId - El ID del alumno a modificar.
 * @param {string} tagsString - Un string con las etiquetas separadas por comas.
 */
export function handleSaveDiversityTags(studentId, tagsString) {
  const db = state.getDB();
  const student = db.students.find(s => s.id === studentId);

  if (student) {
    // Convertimos el string a un array de etiquetas, limpiando espacios y eliminando las vacías.
    const tags = tagsString.split(',')
      .map(tag => tag.trim())
      .filter(Boolean);

    student.diversityTags = tags;
    state.saveDB();
    renderApp();
  }
}

export function handleUpdateAptitudConfig(moduleId, form) {
  const basePositiva = parseFloat(form.basePositiva.value);
  const baseNegativa = parseFloat(form.baseNegativa.value);

  if (isNaN(basePositiva) || isNaN(baseNegativa) || basePositiva < 1 || baseNegativa < 1) {
    alert("Las bases para el cálculo de aptitud deben ser números mayores o iguales a 1.");
    return;
  }

  const db = state.getDB();
  const module = db.modules.find(m => m.id === moduleId);
  if (module) {
    module.aptitudBasePositiva = basePositiva;
    module.aptitudBaseNegativa = baseNegativa;
    state.setDB(db);
    state.saveDB();
    alert("Configuración de aptitud guardada.");
    renderApp();
  }
}

export function handleAddAptitud(moduleId, studentId, trimester, type) {
  const db = state.getDB();
  const trimesterKey = `T${trimester}`;

  if (!db.aptitudes[moduleId]) db.aptitudes[moduleId] = {};
  if (!db.aptitudes[moduleId][studentId]) db.aptitudes[moduleId][studentId] = {};
  if (!db.aptitudes[moduleId][studentId][trimesterKey]) db.aptitudes[moduleId][studentId][trimesterKey] = { positives: [], negatives: [] };

  const newEntry = {
    id: crypto.randomUUID(),
    dateAdded: new Date().toISOString(),
    effectiveDate: new Date().toISOString(),
    reason: `Añadido el ${new Date().toLocaleDateString()}`
  };

  db.aptitudes[moduleId][studentId][trimesterKey][type].push(newEntry);
  state.setDB(db);
  state.saveDB();
  renderApp();
}

export function handleDeleteAptitud(moduleId, studentId, trimester, type, entryId) {
  const db = state.getDB();
  const trimesterKey = `T${trimester}`;
  const entries = db.aptitudes[moduleId]?.[studentId]?.[trimesterKey]?.[type] || [];
  db.aptitudes[moduleId][studentId][trimesterKey][type] = entries.filter(e => e.id !== entryId);
  state.setDB(db);
  state.saveDB();
  renderApp();
}