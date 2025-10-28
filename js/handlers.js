import * as state from './state.js';
import * as dataManager from './services/dataManager.js';
import { calculateModuleGrades } from './services/calculations.js';
import { generateStudentReport } from './services/pdfGenerator.js';
import { renderApp } from './main.js';

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
  const calculatedData = calculateModuleGrades(module, [student], db.grades, db.actividades, null);
  const finalGrades = calculatedData[studentId] || { moduleGrade: 0, raTotals: {}, ceFinalGrades: {} };

  const moduleDataForPdf = [{
    module,
    ...finalGrades
  }];

  // Pasamos también las actividades y las notas en bruto para el desglose
  generateStudentReport(student, moduleDataForPdf, db.actividades, db.grades);
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
    renderApp();
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

export function handleImportModule(text) {
  try {
    const db = state.getDB();
    const newModule = dataManager.importModule(text, db.modules);
    db.modules.push(newModule);
    state.setDB(db);
    state.saveDB();
    alert(`Módulo "${newModule.modulo}" importado. Ahora puedes asociarle alumnos/as.`);
    handleSelectModule(newModule.id); // Cambiamos esto para que seleccione el módulo directamente
  } catch (error) {
    console.error("Error importing module:", error);
    alert(`Error al importar el módulo: ${error.message}`);
  }
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