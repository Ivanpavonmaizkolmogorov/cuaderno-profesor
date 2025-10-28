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

export function handleExportStudentPdf(studentId) {
  const db = state.getDB();
  const student = db.students.find(s => s.id === studentId);
  if (!student) {
    alert("Error: Alumno no encontrado.");
    return;
  }

  // Encontrar todos los módulos donde el alumno está inscrito
  const enrolledModules = db.modules
    .filter(m => m.studentIds?.includes(studentId))
    .map(module => {
      const calculated = calculateModuleGrades(module, [student], db.grades);
      const studentGrades = calculated[studentId] || { moduleGrade: 0, raTotals: {} };
      return { module, finalGrade: studentGrades.moduleGrade, raTotals: studentGrades.raTotals };
    });

  generateStudentReport(student, enrolledModules, db.grades);
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

export function handleSetModuleView(newView) {
    state.setModuleView(newView);
    const db = state.getDB();
    const selectedModule = db.modules.find(m => m.id === state.getUI().selectedModuleId);
    const students = (selectedModule?.studentIds || [])
        .map(id => db.students.find(s => s.id === id))
        .filter(Boolean);
    if (newView === 'alumno' && !state.getUI().selectedStudentIdForView && students.length > 0) {
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

export function handleImportStudentsToModule(text, moduleId) {
  try {
    if (!moduleId) {
      throw new Error("No se ha seleccionado un módulo para asociar los alumnos.");
    }

    const newStudents = dataManager.importStudents(text);
    const db = state.getDB();

    // Añadir nuevos alumnos a la lista maestra si no existen
    const existingStudentNames = new Set(db.students.map(s => s.name.toLowerCase()));
    const trulyNewStudents = newStudents.filter(s => !existingStudentNames.has(s.name.toLowerCase()));
    db.students.push(...trulyNewStudents);
    db.students.sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));

    // Asociar los IDs de los alumnos importados al módulo
    const module = db.modules.find(m => m.id === moduleId);
    const importedStudentNames = new Set(newStudents.map(s => s.name.toLowerCase()));
    const studentIdsToAssociate = db.students
      .filter(s => importedStudentNames.has(s.name.toLowerCase()))
      .map(s => s.id);
    
    // Unir los alumnos existentes con los nuevos, eliminando duplicados
    const existingStudentIds = module.studentIds || [];
    module.studentIds = Array.from(new Set([...existingStudentIds, ...studentIdsToAssociate])); 

    state.setDB(db);
    state.saveDB();
    alert(`Lista de alumnos actualizada para el módulo "${module.modulo}".`);
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
    alert("Error: No se pudo encontrar el módulo o el alumno.");
    return;
  }

  if (window.confirm(`¿Estás seguro de que quieres eliminar a "${student.name}" del módulo "${module.modulo}"? Sus notas en este módulo también se borrarán.`)) {
    // Eliminar al alumno de la lista del módulo
    module.studentIds = module.studentIds.filter(id => id !== studentId);

    // Opcional pero recomendado: Limpiar sus notas para ese módulo
    if (db.grades[studentId]) {
      // Esto es simplificado. Si un CE pudiera estar en varios módulos, necesitaríamos una lógica más compleja.
      // Por ahora, asumimos que al quitarlo, podemos limpiar sus notas.
      // Una mejor aproximación sería borrar solo las notas de los CEs de este módulo.
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
    alert(`Módulo "${newModule.modulo}" importado. Ahora puedes asociarle alumnos.`);
    handleSelectModule(newModule.id); // Cambiamos esto para que seleccione el módulo directamente
  } catch (error) {
    console.error("Error importing module:", error);
    alert(`Error al importar el módulo: ${error.message}`);
  }
}

export function handleClearData() {
  if (window.confirm("¿Estás seguro de que quieres borrar TODOS los datos? Esta acción no se puede deshacer.")) {
    state.setDB({ modules: [], students: [], grades: {}, comments: {} });
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

export function handleImportData(jsonText) {
  try {
    const newDb = dataManager.importData(jsonText);
    state.setDB(newDb);
    state.saveDB();
    state.setSelectedModuleId(null);
    alert("Base de datos importada correctamente.");
    handleSetPage('modulos');
  } catch (error) {
    console.error("Error al importar datos:", error);
    alert(`Error al importar datos: ${error.message}. Asegúrate de pegar un JSON válido.`);
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

export function handleCommentChange(moduleId, studentId, text) {
  const db = state.getDB();
  if (!db.comments[moduleId]) {
    db.comments[moduleId] = {};
  }
  
  if (db.comments[moduleId][studentId] !== text) {
      db.comments[moduleId][studentId] = text;
      state.setDB(db);
      state.saveDB();
  }
}