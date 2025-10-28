// --- LÓGICA DE IMPORTACIÓN Y EXPORTACIÓN DE DATOS ---

export function importStudents(text) {
  const lines = text.split('\n').filter(line => line.trim() !== '');
  if (lines.length === 0) {
    throw new Error("No se encontraron alumnos en el texto.");
  }

  const sortByName = (a, b) => {
    const partsA = a.name.split(' ');
    const partsB = b.name.split(' ');
    const lastNameA = partsA.length > 1 ? partsA.slice(0, -1).join(' ') : partsA[0];
    const firstNameA = partsA.length > 1 ? partsA[partsA.length - 1] : '';
    const lastNameB = partsB.length > 1 ? partsB.slice(0, -1).join(' ') : partsB[0];
    const firstNameB = partsB.length > 1 ? partsB[partsB.length - 1] : '';

    const lastNameCompare = lastNameA.localeCompare(lastNameB, 'es', { sensitivity: 'base' });
    if (lastNameCompare !== 0) return lastNameCompare;
    return firstNameA.localeCompare(firstNameB, 'es', { sensitivity: 'base' });
  };

  const newStudents = lines.map(line => ({
    id: crypto.randomUUID(),
    name: line.trim()
  })).sort(sortByName);

  return newStudents;
}

export function importModule(text, currentModules) {
  const newModule = JSON.parse(text);
  if (!newModule.id || !newModule.modulo || !newModule.resultados_de_aprendizaje) {
    throw new Error("El JSON no tiene la estructura de módulo esperada (id, modulo, resultados_de_aprendizaje).");
  }

  if (currentModules.find(m => m.id === newModule.id)) {
    throw new Error(`Ya existe un módulo con el ID "${newModule.id}". No se puede importar duplicado.`);
  }

  return newModule;
}

export function exportData(db) {
  try {
    const json = JSON.stringify(db, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    a.download = `cuaderno_profesor_backup_${timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error exporting data:", error);
    throw new Error(`Error al exportar datos: ${error.message}`);
  }
}

export function importData(jsonText) {
  if (!jsonText) throw new Error("El campo de importación está vacío.");
  const newDb = JSON.parse(jsonText);
  if (
    typeof newDb === 'object' && newDb !== null &&
    Array.isArray(newDb.modules) &&
    Array.isArray(newDb.students) &&
    typeof newDb.grades === 'object' && newDb.grades !== null &&
    typeof newDb.comments === 'object' && newDb.comments !== null
  ) {
    return newDb;
  } else {
    throw new Error("El JSON no tiene la estructura de base de datos esperada (modules, students, grades, comments).");
  }
}